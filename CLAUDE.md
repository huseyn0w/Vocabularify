# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vocabularify is an Electron desktop app (macOS/Windows/Linux) that displays a new vocabulary word + translation every few seconds in an always-on-top window or in the macOS menu-bar tray, so users learn passively while doing other things.

## Commands

Requires Node 22 (LTS) and Yarn. Electron 42 / electron-builder 26 / TypeScript 5 (strict).

- `yarn install` - install dependencies
- `yarn start` - run in development: compiles once, then runs `tsc -w` and `electronmon .` together (via `concurrently`). `tsc` recompiles `src/**/*.ts` → `out/` on save; electronmon restarts the main process / reloads renderers when `out/` changes.
- `yarn compile` - one-off `tsc` build to `out/`; `yarn typecheck` - `tsc --noEmit` (type-check only)
- `yarn test` - run the Vitest unit suite once; `yarn test:watch` for watch mode
- `yarn build` - `tsc` then package with electron-builder for the current platform (DMG/ZIP on mac, AppImage on Linux)
- `yarn build:win` - `tsc` then package NSIS installer for Windows (x64 + ia32)

A shell with no GUI session can't drive the window: `screencapture` and `osascript` GUI scripting both need a permission grant that isn't there. `webContents.capturePage()` needs no such permission - it snapshots the renderer's own surface - so the card can still be screenshotted headlessly from a small script run through Electron. `ELECTRON_RUN_AS_NODE` has to be unset first, or the Electron binary starts as plain Node and never opens a window.

### TypeScript / build layout

The app is written in **TypeScript** (`src/**/*.ts`, `strict: true`) and compiled by **plain `tsc`** (CommonJS, ES2022) into **`out/`** - that is what Electron runs (`"main": "out/index.js"`, and the HTML `<script>` tags load `out/renderer/*.js`). `out/` is git-ignored and is the compiled app; **`dist/`** is reserved for electron-builder installers (also git-ignored). The renderer scripts are emitted as **classic scripts** (each wrapped in an IIFE, type-only imports erased) because they are loaded via plain `<script src>` in the browser context - never add a runtime `import`/`require` to a `src/renderer/*.ts` file or it will break at load. Run `tsc` after editing before launching, or use `yarn start` which watches.

`tsconfig.json` sets `incremental: true` with `tsBuildInfoFile: ".tsbuildinfo"`, deliberately kept outside `out/` so it's neither packaged nor watched. That file, not `out/`, is what `tsc` trusts to decide whether anything changed - so `rm -rf out` alone leaves `.tsbuildinfo` believing `out/` is current, and the next `yarn compile` emits nothing. Every step after that then runs against a missing or stale build. Always clean both together: `rm -rf out .tsbuildinfo`.

## Architecture

Electron app with a **hardened security model**: every window runs with `contextIsolation: true` and `nodeIntegration: false`. Renderers have no Node access and reach the main process only through the minimal API a per-window **preload** script exposes via `contextBridge` (`window.vocab.*`). All IPC channel names live in one place (`src/shared/constants.ts`).

The code is organised in three layers:

### `src/shared/` - framework-free, unit-tested logic (no Electron imports)

- **types.ts** - the cross-boundary type contract: domain types (`AppState`, `VocabEntry`, `Mode`, `Background`, …), the per-window `window.vocab` API interfaces (`MainVocabApi`, `SettingsVocabApi`, `ImportVocabApi`, `AboutVocabApi`), the `SettingsSnapshot`, and the main-process collaborator types (`PhraseEngine`, `TrayController`, `IpcHandlers`). Keep it Electron-free (renderers `import type` from it). `window.vocab` is globally typed `unknown`; each renderer narrows it once.
- **constants.ts** - `MODES`, languages/levels/speeds, window dims, `PHRASE_SEPARATOR`, `CUSTOM_LEVEL_PREFIX`, and the `IPC` channel-name map (single source of truth for main + preload).
- **languagePaths.ts** - `getLanguageFilePath`, custom-dictionary file name build/parse, locale lookup.
- **dictionary.ts** - `parseDictionaryText` (splits each line on the first `" - "`, so hyphenated words survive; skips malformed lines).
- **phrases.ts** - `next/prev/clampIndex` cycling helpers, used by the engine to move through the `Item` list.
- **items.ts** - the display item model: `SentenceToken`, `LaidOutToken`, `Item`, `LessonSpec`/`LessonsFile`/`SentenceSpec`/`SentenceGloss`, `layoutTokens`, `joinTokens`, `buildItems`.
- **course.ts** - the authoring-time model for `languages/_course/`: `conceptId`, `dedupeBank`, the `GLUE` whitelist, and `validateCourse`. Not loaded at runtime, only by `utils/validate_course.js` (and `utils/generate_pairs.js`, for `dedupeBank`/`conceptId`). `validateCourse` never throws - a malformed shape (not an array, a non-object lesson, a `null` element) is reported as an error string and the rest of the checks run on a normalized-in-place copy, so one bad file always ends in a diagnosable error list, not a stack trace.
- **state.ts** - `normalizeState` validates and defaults the persisted config, including the `progress` map (see below).

Each logic module has a co-located `*.test.ts` (Vitest, imports the source extensionless). Keep this layer Electron-free so it stays testable.

### `src/main/` - main-process modules (composed by [src/index.ts](src/index.ts))

- **config.ts** - userData paths; `getDictionariesBasePath()` uses `app.isPackaged` (not `NODE_ENV`) to pick the project root in dev vs `resourcesPath` when packaged.
- **store.ts** - load/save state via `normalizeState`.
- **dictionaries.ts** - import/delete/list custom dictionaries.
- **phraseEngine.ts** - owns the `Item` list, current index and auto-advance timer; surface-agnostic via an injected `onRender(item, index, total)`. `canAutoAdvance` is a required predicate, not optional - it's re-consulted every time the timer would arm, which is what lets an unsolved assemble exercise or a hovered window suspend advancing without a second code path. `hasLoaded()` tells a caller "loaded, sitting at item 0" apart from "never loaded", which `getIndex()` alone can't (both read `0`). It reads a dictionary's sibling `<level>.lessons.json` itself and checks each entry to the depth `buildItems` actually reads (`count` a non-negative integer, `sentences` an array of well-formed specs) - a malformed lessons file is dropped, falling back to the flat word list, rather than throwing out of `load()`.
- **windows.ts** - main/import/settings/about window factories (`securePreferences()` wires the preload + isolation flags).
- **tray.ts** - a **single** tray-menu template builder used for both creation and every refresh (do not reintroduce a second copy).
- **ipc.ts** - registers the whitelisted `ipcMain` handlers.

[src/index.ts](src/index.ts) is the thin composition root: it holds the `state` object, creates the engine/tray/windows, wires tray actions and IPC callbacks, and owns app lifecycle. `renderPhrase` routes the current item to the tray title (Menu Bar mode, joined with `PHRASE_SEPARATOR` for a word or `joinTokens` for a sentence) or the window (otherwise, as the raw item plus its laid-out tokens).

### `src/preload/` and `src/renderer/`

- **preload/{main,import,settings,about}.ts** - expose `window.vocab` per window; each types its exposed object with the matching `*VocabApi` interface from `shared/types.ts`.
- **renderer/main.ts** - main display window logic (phrase rendering, fade animation, TTS via `SpeechSynthesisUtterance`, progress bar, theme). Auto-advance **pauses while the window is hovered** (`setPaused` → engine stop/restart) and the keyboard hint only shows on hover. The target font scales with the window via CSS `clamp(.., vw, ..)`.
- **renderer/settings.ts** - the unified Settings window logic.
- HTML lives at the project root (`index.html`, `import.html`, `about.html`, `speed.html`); `import.html`/`about.html` keep small inline scripts.

### Key cross-cutting concepts

- **Modes** (`MODES`): `Window`, `Menu Bar` (tray title, macOS only), `Checkup` (shows the source word, reveals the translation after 3s), `Sound` (TTS). Mode switching is gated to `process.platform === 'darwin'`. Assembling a sentence is not a mode: `isAssembleMode` is a Settings → Playback toggle next to Sound, orthogonal to the mode chips, and it's ignored in Menu Bar mode - a sentence just gets read out as tray-title text there instead of built word by word.
- **Item format**: the engine cycles `Item`s ([src/shared/items.ts](src/shared/items.ts)), either `{ kind: 'word', source, target }` or `{ kind: 'sentence', id, source, target, gloss }`. `source` is the known language, `target` the language being learned. A word's `target` is a plain string; a sentence's `target` is a token list - an object token (`{ t, c }`) is a word backed by a learned concept, a bare string is glue (punctuation, or a whitelisted function word). `layoutTokens` resolves the spacing once, in the main process, because `src/renderer/*` compiles to a classic script and cannot import it; the renderer draws the `LaidOutToken`s it's handed. A sentence stays on screen for `SENTENCE_DWELL_MULTIPLIER` times the interval. Vocabulary entries on disk are still `{ "word_1", "word_2" }`; `buildItems` turns them into word `Item`s and interleaves any lessons file's sentences. `PHRASE_SEPARATOR` (`" - "`) survives from the old phrase format for the two places that still need a joined string: parsing an imported `.txt` line and building the Menu Bar tray title for a word item - `toPhrases`, `splitPhrase` and the `Phrase` type are gone.
- **State persistence**: saved to `config.json` in `app.getPath('userData')` on quit, restored (and validated) on launch. Position is per dictionary: `progress` ([src/shared/state.ts](src/shared/state.ts)) maps `progressKey(to, from, level)` to an index, so switching pairs or levels doesn't clobber where you were in another one. A config written before lessons existed has a bare `currentIndex` and no `progress`; `normalizeState` seeds one entry from it under the current pair/level so an upgrading user isn't sent back to word one.

### Language / dictionary data

- Built-in dictionaries: `languages/<targetLang>/<fromLang>/<level>.json` (levels `a1`–`c1`, lowercase). The app supports **7 languages** (en, de, fr, es, it, tr, ru) in a full any-from-any matrix (42 pairs). Which pairs exist is discovered at runtime by scanning the `languages/` directory (`config.listAvailablePairs`) - no hard-coded language map. Packaged builds bundle `languages/` via `extraResources`.
- **Generated from a multilingual bank**: the pair files are _generated_, not hand-edited. `languages/_bank/<level>.json` holds concept rows `{ en, de, fr, es, it, tr, ru }` (one concept, all 7 translations; target nouns carry their article/gender, verbs are infinitives). `node utils/generate_pairs.js` projects the bank into all 42 pairs × 5 levels (a concept is kept at its lowest level; each target word appears once per pair). To change vocabulary, edit the bank and regenerate - do not hand-edit the pair files. `languages/_audit/` holds the audit + bank-build reports (ignored as a language by the `_` prefix).
- **Lessons and sentences**: `languages/_course/<level>.json` orders that level's concepts into lessons of 5-10 (the last lesson may run short), and `<level>.sentences.json` holds the sentences shown after each one, tokenised in all 7 languages. A concept id is the English column trimmed and lowercased - the same key the bank dedupes on ([src/shared/course.ts](src/shared/course.ts)). `node utils/validate_course.js` lints a course against the bank before anything is generated; `node utils/generate_pairs.js` writes `languages/<to>/<from>/<level>.lessons.json` alongside the word file. Both need a compiled build (`yarn compile`) because they `require()` the compiled `out/shared/course.js` and `out/shared/items.js` rather than duplicate the join and validation rules. Lesson word counts are tallied per pair, not globally: a concept is dropped from a pair when its target word collides with one already emitted (the bank has both `she -> sie` and `they -> sie`), and that dedupe happens in the same pass that counts words per lesson, so the two can't drift apart. A level with no course file, and every custom dictionary, falls back to the flat word list unchanged.
- **Custom dictionaries**: imported from plain `.txt` (`word - translation` per line, chosen via a native file dialog), stored as `<target>_<from>_<name>.json` in `<userData>/custom_dictionaries`, surfaced in the tray Level submenu as `custom:<name>`.
- **Settings UI**: the tray is minimal (Settings… / About / Quit). All configuration - language pair (flag cards, driven by `listAvailablePairs`), level (+ custom dicts), background, mode, sound, speed, dictionary import - lives in one Settings window (`settings.html` + `src/renderer/settings.ts`), talking to main via the `get-settings` / `set-*` IPC channels.

### utils/ (offline data tooling)

- `clean_dictionaries.js` - phase-1 cleanup (dedup, junk, column-orientation fix).
- `validate_course.js` - lints `languages/_course/` against the bank: every level concept introduced exactly once and in-bank, lesson sizes in range, every sentence used exactly once and only drawing on concepts already taught, no loose (unwhitelisted) glue words. Needs `yarn compile` first (it `require()`s `out/shared/course.js`). Takes level names to check only those (`node utils/validate_course.js a1 a2`) and `--languages en,de` to check only those columns - the authoring pass writes the course and English sentences first and has to lint clean there before the other six columns are translated. Exit code is 2 for a setup problem (missing build, bad argument, a file that won't parse, a course with no matching sentence file), else 1 if any validation error was found, else 0. Run it before `generate_pairs.js`.
- `generate_pairs.js` - generates all pair files from `languages/_bank/`, and, for any level with a `languages/_course/<level>.json`, that pair's `<level>.lessons.json` alongside it (removing a stale one if the course was deleted). Needs `yarn compile` first (it `require()`s `out/shared/course.js` and `out/shared/items.js`). Trusts its input - run `validate_course.js` first - but still reports anything it has to skip.
- Legacy Python scripts ([parser.py](utils/parser.py), [format.py](utils/format.py), [sort.py](utils/sort.py), [duplicates.py](utils/duplicates.py)) from the original single-pair data prep.
