# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vocabularify is an Electron desktop app (macOS/Windows/Linux) that displays a new vocabulary word + translation every few seconds in an always-on-top window or in the macOS menu bar, so users learn passively while doing other things. There is no test suite.

## Commands

Requires Node 22 (LTS) and Yarn. Electron 42 / electron-builder 26.

- `yarn install` — install dependencies
- `yarn start` — run in development (`NODE_ENV=development electronmon .`; electronmon watches files and auto-restarts the main process / reloads renderers on save)
- `yarn build` — package with electron-builder for the current platform (DMG/ZIP on mac, AppImage on Linux). Runs under `sudo`.
- `yarn build:win` — package NSIS installer for Windows (x64 + ia32)

## Architecture

This is a classic Electron main/renderer split with **`nodeIntegration: true` and `contextIsolation: false`** in all windows — renderer code calls `require('electron')` and Node APIs directly. There is no preload/bridge layer.

- **[index.js](index.js)** — the main process and the heart of the app. Owns all application state as module-level globals (`currentLanguage`, `currentFromLanguage`, `currentLevel`, `currentMode`, `currentIndex`, `isSoundMode`, interval). It builds the Tray context menu (the entire UI is the tray menu — there are no in-window controls), runs the `setInterval` phrase-cycling loop, loads vocabulary JSON, and sends phrases to the renderer over IPC.
- **[renderer.js](renderer.js)** / **[index.html](index.html)** — the display window. Receives `display-phrase`, `set-background`, `toggle-sound-mode`, `set-languages`, `clear-timeouts` over `ipcRenderer.on`, renders the phrase + progress bar, and handles text-to-speech via the browser `SpeechSynthesisUtterance` API.
- **[dictionary-import.js](dictionary-import.js)** — main-process handlers (`handleImportDictionary`, `handleDeleteDictionary`) for custom dictionaries, invoked over IPC from [import.html](import.html). Writes/reads JSON files in the user-data `custom_dictionaries` dir.
- **[about.js](about.js)** / **[about.html](about.html)** — standalone About window.

### Key cross-cutting concepts

- **Modes** (`MODES` enum in index.js): `Window` (always-on-top floating window), `Menu Bar` (phrase shown as the tray title, macOS only), `Checkup` (window shows source word first, then reveals the translation after 3s), `Sound` (TTS). Mode/Menu-Bar switching is gated to `process.platform === 'darwin'`.
- **State persistence**: `saveState()`/`loadState()` serialize the global state to `config.json` in `app.getPath('userData')` on quit and restore it on launch.
- **The tray menu is defined twice** — once in `createTray()` and again, near-identically, in `updateTrayMenu()` (used to rebuild after dictionary add/delete). When changing menu items, update **both** copies.
- **Phrase format**: vocabulary entries are `{ "word_1", "word_2" }` objects; `loadPhrases` joins them into `"word_1 - word_2"` strings. `word_1` is the *target* language, `word_2` is the *from* language (note: this is the reverse of what the menu label `FROM -> TO` implies). The ` - ` separator is what renderer.js splits on for Checkup/sound.

### Language / dictionary data

- Built-in dictionaries live in **[languages/](languages/)** as `languages/<targetLang>/<fromLang>/<level>.json` (levels `a1`–`c1`, lowercase filenames). Available pairs are hard-coded in `createLanguageSubmenu()` in index.js.
- `getLanguageFilePath()` resolves built-ins from `__dirname` in dev but from `process.resourcesPath` in production (packaged builds bundle `languages/` via the `extraResources` config in package.json). When adding a language pair, update both the `languages/` files and the `languages`/`fromLanguages` maps in `createLanguageSubmenu`.
- **Custom dictionaries** are imported from plain `.txt` files (`word - translation` per line) and stored as `<lang>_<fromLang>_<name>.json` in `<userData>/custom_dictionaries`. They appear in the level submenu as `custom:<name>`, and `getLanguageFilePath` special-cases the `custom:` prefix.

### utils/ (offline data tooling)

Standalone Python scripts (not part of the app runtime) used to prepare vocabulary data: [parser.py](utils/parser.py) (txt → JSON), [format.py](utils/format.py) (pretty-print JSON one-entry-per-line), [sort.py](utils/sort.py) (locale-aware sort/dedupe), [duplicates.py](utils/duplicates.py). Raw source data (`vocabulary.txt`, `backup.txt`) also lives here.
