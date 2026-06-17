// Cross-boundary type contracts shared by the main process, the preload
// scripts and the renderers. Like the rest of `src/shared`, this file must
// stay framework-free (no Electron imports) so it remains unit-testable and
// safe to `import type` from a browser-context renderer.

// --- Domain primitives ------------------------------------------------------

/** A stored vocabulary entry. `word_1` is the source (known) word, `word_2`
 *  the target (the word being learned). */
export interface VocabEntry {
  word_1: string;
  word_2: string;
}

/** A displayable "word - translation" string (see PHRASE_SEPARATOR). */
export type Phrase = string;

export type Background = 'light' | 'dark';

/** Display modes. Mirrors the values of the `MODES` constant. */
export type Mode = 'Menu Bar' | 'Window' | 'Sound' | 'Checkup';

/** Display name + flag emoji for a language code. */
export interface LanguageMeta {
  name: string;
  flag: string;
}

/** A keyboard event forwarded from the main display window. */
export interface KeyEvent {
  shiftKey: boolean;
  key: string;
}

/** Target/source language selection (the language being learned / known). */
export interface LanguagePair {
  to: string;
  from: string;
}

// --- Persisted application state --------------------------------------------

export interface AppState {
  currentIndex: number;
  currentLanguage: string;
  currentFromLanguage: string;
  currentLevel: string;
  currentMode: Mode;
  isSoundMode: boolean;
  currentBackground: Background;
  intervalMs: number;
}

// --- Dictionary import ------------------------------------------------------

export interface ImportPayload {
  filePath: string;
  dictionaryName: string;
  language: string;
  fromLanguage: string;
}

/** Result of an import/delete operation; a discriminated union on `success`. */
export type DictionaryResult =
  | { success: true; dictionaryName: string }
  | { success: false; error: string };

// --- Settings window snapshot ----------------------------------------------

/** The full configuration snapshot the Settings window renders from. */
export interface SettingsSnapshot {
  languages: {
    meta: Record<string, LanguageMeta>;
    pairs: Record<string, string[]>;
  };
  levels: readonly string[];
  customLevels: string[];
  speeds: readonly number[];
  isMac: boolean;
  modes: Mode[];
  current: {
    to: string;
    from: string;
    level: string;
    background: Background;
    mode: Mode;
    sound: boolean;
    intervalMs: number;
  };
}

// --- Per-window `window.vocab` APIs ------------------------------------------
// Each preload script exposes exactly one of these; the matching renderer
// narrows `window.vocab` to it. Keeping both sides on the same interface is
// what makes the IPC boundary type-safe.

/** Payload pushed to the main display window for each phrase. */
export interface DisplayPhrasePayload {
  phrase: Phrase;
  mode: Mode;
  index: number;
  total: number;
}

export interface MainVocabApi {
  /** The persisted theme, exposed synchronously so the renderer can apply it
   *  before first paint (avoids a light/dark flash on launch). */
  initialBackground: Background;
  onDisplayPhrase(callback: (payload: DisplayPhrasePayload) => void): void;
  onSetBackground(callback: (background: Background) => void): void;
  onToggleSound(callback: (enabled: boolean) => void): void;
  onSetLanguages(callback: (locales: { fromLocale: string; toLocale: string }) => void): void;
  onClearTimeouts(callback: () => void): void;
  sendKeyPress(keyEvent: KeyEvent): void;
  setPaused(paused: boolean): void;
}

export interface SettingsVocabApi {
  getSettings(): Promise<SettingsSnapshot>;
  setLanguagePair(to: string, from: string): Promise<void>;
  setLevel(level: string): Promise<void>;
  setBackground(background: Background): Promise<void>;
  setMode(mode: Mode): Promise<void>;
  setSound(enabled: boolean): Promise<void>;
  setSpeed(ms: number): Promise<void>;
  openImport(): Promise<void>;
}

export interface ImportVocabApi {
  chooseFile(): Promise<string | null>;
  importDictionary(payload: ImportPayload): Promise<DictionaryResult>;
}

export interface AboutVocabApi {
  openExternal(url: string): void;
}

// Every renderer reaches the main process through `window.vocab`. Each window
// gets a different shape, so the global is typed as `unknown` here and each
// renderer narrows it once (e.g. `const vocab = window.vocab as MainVocabApi`).
declare global {
  interface Window {
    vocab: unknown;
  }
}

// --- Main-process composition contracts -------------------------------------
// Structural types for the surface-agnostic collaborators wired together by
// the composition root (src/index.ts).

/** Owns the phrase list, current index and auto-advance timer. */
export interface PhraseEngine {
  load(filePath: string, startIndex?: number): void;
  next(): void;
  previous(): void;
  setIntervalMs(ms: number): void;
  restartTimer(): void;
  stop(): void;
  render(): void;
  getIndex(): number;
  getCurrentPhrase(): Phrase | undefined;
}

export interface PhraseEngineOptions {
  intervalMs: number;
  onRender: (phrase: Phrase, index: number, total: number) => void;
}

export interface TrayActions {
  openSettings: () => void;
  openAbout: () => void;
  quit: () => void;
}

export interface TrayController {
  create(): void;
  refresh(): void;
  setTitle(title: string): void;
}

/** Callbacks the composition root provides to the IPC layer. */
export interface IpcHandlers {
  importDictionary: (payload: ImportPayload) => DictionaryResult;
  chooseDictionaryFile: () => Promise<string | null>;
  openExternal: (url: string) => void;
  openImport: () => void;
  onKeyPress: (keyEvent: KeyEvent) => void;
  onSetPaused: (paused: boolean) => void;
  getSettings: () => SettingsSnapshot;
  setLanguagePair: (pair: LanguagePair) => void;
  setLevel: (level: string) => void;
  setBackground: (background: Background) => void;
  setMode: (mode: Mode) => void;
  setSound: (enabled: boolean) => void;
  setSpeed: (ms: number) => void;
}
