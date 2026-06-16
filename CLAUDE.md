# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vocabularify is an Electron desktop app (macOS/Windows/Linux) that displays a new vocabulary word + translation every few seconds in an always-on-top window or in the macOS menu-bar tray, so users learn passively while doing other things.

## Commands

Requires Node 22 (LTS) and Yarn. Electron 42 / electron-builder 26.

- `yarn install` — install dependencies
- `yarn start` — run in development (`NODE_ENV=development electronmon .`; electronmon watches files and auto-restarts the main process / reloads renderers on save)
- `yarn test` — run the Vitest unit suite once; `yarn test:watch` for watch mode
- `yarn build` — package with electron-builder for the current platform (DMG/ZIP on mac, AppImage on Linux)
- `yarn build:win` — package NSIS installer for Windows (x64 + ia32)

## Architecture

Electron app with a **hardened security model**: every window runs with `contextIsolation: true` and `nodeIntegration: false`. Renderers have no Node access and reach the main process only through the minimal API a per-window **preload** script exposes via `contextBridge` (`window.vocab.*`). All IPC channel names live in one place (`src/shared/constants.js`).

The code is organised in three layers:

### `src/shared/` — framework-free, unit-tested logic (no Electron imports)
- **constants.js** — `MODES`, languages/levels/speeds, window dims, `PHRASE_SEPARATOR`, `CUSTOM_LEVEL_PREFIX`, and the `IPC` channel-name map (single source of truth for main + preload).
- **languagePaths.js** — `getLanguageFilePath`, custom-dictionary file name build/parse, locale lookup.
- **dictionary.js** — `parseDictionaryText` (splits each line on the first `" - "`, so hyphenated words survive; skips malformed lines).
- **phrases.js** — `toPhrases`, `splitPhrase`, and `next/prev/clampIndex` cycling helpers.
- **state.js** — `normalizeState` validates and defaults the persisted config.

Each of these has a co-located `*.test.js` (Vitest). Keep this layer Electron-free so it stays testable.

### `src/main/` — main-process modules (composed by [index.js](index.js))
- **config.js** — userData paths; `getDictionariesBasePath()` uses `app.isPackaged` (not `NODE_ENV`) to pick the project root in dev vs `resourcesPath` when packaged.
- **store.js** — load/save state via `normalizeState`.
- **dictionaries.js** — import/delete/list custom dictionaries.
- **phraseEngine.js** — owns the phrase list, current index and auto-advance timer; surface-agnostic via an injected `onRender(phrase, index, total)`.
- **windows.js** — main/import/settings/about window factories (`securePreferences()` wires the preload + isolation flags).
- **tray.js** — a **single** tray-menu template builder used for both creation and every refresh (do not reintroduce a second copy).
- **ipc.js** — registers the whitelisted `ipcMain` handlers.

[index.js](index.js) is the thin composition root: it holds the `state` object, creates the engine/tray/windows, wires tray actions and IPC callbacks, and owns app lifecycle. `renderPhrase` routes the current phrase to the tray title (Menu Bar mode) or the window (otherwise).

### `src/preload/` and `src/renderer/`
- **preload/{main,import,settings,about}.js** — expose `window.vocab` per window.
- **renderer/main.js** — main display window logic (phrase rendering, fade animation, TTS via `SpeechSynthesisUtterance`, progress bar, theme). Auto-advance **pauses while the window is hovered** (`setPaused` → engine stop/restart) and the keyboard hint only shows on hover. The target font scales with the window via CSS `clamp(.., vw, ..)`.
- **renderer/settings.js** — the unified Settings window logic.
- HTML lives at the project root (`index.html`, `import.html`, `about.html`, `speed.html`); `import.html`/`about.html` keep small inline scripts.

### Key cross-cutting concepts
- **Modes** (`MODES`): `Window`, `Menu Bar` (tray title, macOS only), `Checkup` (shows the source word, reveals the translation after 3s), `Sound` (TTS). Mode switching is gated to `process.platform === 'darwin'`.
- **Phrase format**: vocabulary entries are `{ "word_1", "word_2" }`; joined into `"word_1 - word_2"`. `word_1` is the **source** (from-language) word, `word_2` is the **target** (the language being learned) — the renderer shows `word_1` muted and `word_2` emphasised.
- **State persistence**: saved to `config.json` in `app.getPath('userData')` on quit, restored (and validated) on launch.

### Language / dictionary data
- Built-in dictionaries: `languages/<targetLang>/<fromLang>/<level>.json` (levels `a1`–`c1`, lowercase). The app supports **7 languages** (en, de, fr, es, it, tr, ru) in a full any-from-any matrix (42 pairs). Which pairs exist is discovered at runtime by scanning the `languages/` directory (`config.listAvailablePairs`) — no hard-coded language map. Packaged builds bundle `languages/` via `extraResources`.
- **Generated from a multilingual bank**: the pair files are *generated*, not hand-edited. `languages/_bank/<level>.json` holds concept rows `{ en, de, fr, es, it, tr, ru }` (one concept, all 7 translations; target nouns carry their article/gender, verbs are infinitives). `node utils/generate_pairs.js` projects the bank into all 42 pairs × 5 levels (a concept is kept at its lowest level; each target word appears once per pair). To change vocabulary, edit the bank and regenerate — do not hand-edit the pair files. `languages/_audit/` holds the audit + bank-build reports (ignored as a language by the `_` prefix).
- **Custom dictionaries**: imported from plain `.txt` (`word - translation` per line, chosen via a native file dialog), stored as `<target>_<from>_<name>.json` in `<userData>/custom_dictionaries`, surfaced in the tray Level submenu as `custom:<name>`.
- **Settings UI**: the tray is minimal (Settings… / About / Quit). All configuration — language pair (flag cards, driven by `listAvailablePairs`), level (+ custom dicts), background, mode, sound, speed, dictionary import — lives in one Settings window (`settings.html` + `src/renderer/settings.js`), talking to main via the `get-settings` / `set-*` IPC channels.

### utils/ (offline data tooling)
- `clean_dictionaries.js` — phase-1 cleanup (dedup, junk, column-orientation fix).
- `generate_pairs.js` — generate all pair files from `languages/_bank/`.
- Legacy Python scripts ([parser.py](utils/parser.py), [format.py](utils/format.py), [sort.py](utils/sort.py), [duplicates.py](utils/duplicates.py)) from the original single-pair data prep.
