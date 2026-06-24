# Vocabularify 🎓

**Learn a language by doing nothing.**

Vocabularify is a desktop app (macOS / Windows / Linux) that surfaces a new word and its
translation every few seconds — in an always‑on‑top card or in the macOS menu bar — so your
vocabulary grows passively while you work, watch, or browse. No drills, no scheduled study time.

[▶︎ Video demo](https://www.loom.com/share/614d6203f5bb442fa0a5bc9b44aa1f78?sid=1a00ac4c-07f7-47b4-8c7e-08e03ef6dab4)

## Features

- **Effortless, ambient learning** — a new word appears every few seconds; just glance at it.
- **Premium, calm UI** — a cinematic dark theme (Obsidian) by default, with a refined light theme,
  shared across every window.
- **7 languages, any‑from‑any** — English, German, French, Spanish, Italian, Turkish, Russian, in a
  full 42‑pair matrix, levels A1–C1.
- **Display modes** — floating **Window**, macOS **Menu Bar** (the word lives in the tray title),
  **Checkup** (shows the source word and reveals the translation after a few seconds), and
  **Sound** (text‑to‑speech pronunciation).
- **Custom dictionaries** — import your own `word - translation` lists from a `.txt` file.
- **Adjustable speed** — pick how often the word changes (presets or a custom interval).
- **Hover to pause** — auto‑advance pauses while your pointer is over the card; `Shift + ← / →` to
  step manually.

> **Note:** the built‑in word lists are AI‑generated and may be refined over time.

> **On the go?** A companion mobile app, [VocabularifyMobile](https://github.com/huseyn0w/VocabularifyMobile) (Expo / React Native), ships the same 7 languages and full 42‑pair × A1–C1 matrix.

## How it works

1. Open the app and pick, in **Settings**, the language you want to learn and the one to translate
   from, plus a level.
2. Position the floating card over whatever you're doing (YouTube, your editor, a browser).
3. A new word + translation fades in every few seconds. Turn on **Sound** to hear each one, or
   **Checkup** mode to test yourself before the answer is revealed.

All configuration — language pair, level, theme, mode, sound, speed and dictionary import — lives in
the single **Settings** window (open it from the tray / menu‑bar icon → *Settings…*).

## Install (users)

Grab the latest installer for your platform from the
[**Releases**](https://github.com/huseyn0w/Vocabularify/releases) page:

- **macOS** — `.dmg` (Apple Silicon & Intel)
- **Windows** — `.exe` (NSIS installer)
- **Linux** — `.AppImage`

> macOS builds are not yet notarized — on first launch you may need to right‑click the app →
> *Open* to get past Gatekeeper.

## Importing custom dictionaries 📂

1. Create a plain‑text file (`.txt`) with one entry per line:
   ```
   word1 - translation1
   word2 - translation2
   ```
   The first `" - "` separates the word from its translation (hyphenated words survive); blank or
   malformed lines are skipped.
2. Open **Settings → Dictionaries → Import dictionary…**, choose the file, give it a name, and pick
   the language pair it belongs to.
3. The dictionary appears as a level (`Custom: <name>`) under **Settings → Level** for that pair.

## Development 🛠️

Vocabularify is an **Electron + TypeScript** app. The `src/` TypeScript is compiled by `tsc` into
`out/`, which is what Electron runs. The framework‑free logic in `src/shared/` is unit‑tested with
Vitest.

### Prerequisites

- **Node 22 (LTS)** and **Yarn**

  ```bash
  nvm install 22 && nvm use 22
  ```

### Setup & commands

```bash
git clone https://github.com/huseyn0w/Vocabularify.git
cd Vocabularify
yarn install

yarn start        # dev: tsc --watch + electronmon (auto‑recompile & reload)
yarn test         # run the Vitest unit suite (yarn test:watch for watch mode)
yarn typecheck    # type‑check only (tsc --noEmit)
yarn compile      # one‑off build of src/ → out/
yarn build        # package for the current platform (macOS .dmg/.zip, Linux .AppImage)
yarn build:win    # package the Windows NSIS installer (x64 + ia32)
```

### Project layout

- `src/shared/` — framework‑free, unit‑tested logic + the shared type/IPC contract (no Electron).
- `src/main/` — main‑process modules; `src/index.ts` is the composition root.
- `src/preload/` + `src/renderer/` — the per‑window preload bridges and renderer UI.
- `languages/` — built‑in dictionaries, **generated** from a multilingual bank. Edit
  `languages/_bank/<level>.json` and run `node utils/generate_pairs.js` to regenerate all 42 pairs —
  don't hand‑edit the pair files.

See [CLAUDE.md](CLAUDE.md) for a fuller architecture tour.

## Donations ❤️

If Vocabularify helps you, you can support its development:

[![Donate with PayPal](paypal_donate.png)](https://www.paypal.com/donate/?hosted_button_id=MMANJ7TC2SJMN)

Thank you! 💖

## License

ISC © Elman Huseynov
