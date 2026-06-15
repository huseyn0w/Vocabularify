// Shared, framework-free constants used by both the main process and tests.
// Nothing here may require Electron, so it stays unit-testable in plain Node.

const MODES = Object.freeze({
  MENU_BAR: 'Menu Bar',
  WINDOW: 'Window',
  SOUND: 'Sound',
  CHECKUP: 'Checkup'
});

// Built-in CEFR levels shipped under languages/<to>/<from>/<level>.json
const LEVELS = Object.freeze(['A1', 'A2', 'B1', 'B2', 'C1']);

// Target languages and, for each, the source languages we ship dictionaries for.
const LANGUAGES = Object.freeze(['en', 'de', 'fr']);
const FROM_LANGUAGES = Object.freeze({
  en: ['ru', 'de', 'fr'],
  de: ['ru', 'en'],
  fr: ['en']
});

// BCP-47 locales used for speech synthesis.
const LANGUAGE_LOCALES = Object.freeze({
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  ru: 'ru-RU'
});
const DEFAULT_LOCALE = 'en-US';

// Word-change speeds offered in the tray menu (milliseconds).
const SPEED_INTERVALS = Object.freeze([5000, 10000, 15000, 20000]);
const DEFAULT_INTERVAL_MS = 5000;

// Fixed size for the floating card window (no per-phrase resizing, which
// previously made the window jump every few seconds).
const WINDOW_WIDTH = 460;
const WINDOW_HEIGHT = 240;

// Separator between a word and its translation, in both stored phrases and
// the plain-text import format ("word - translation").
const PHRASE_SEPARATOR = ' - ';

// Levels chosen from a custom dictionary are encoded as "custom:<name>".
const CUSTOM_LEVEL_PREFIX = 'custom:';

// IPC channel names, centralised so main and renderers cannot drift apart.
const IPC = Object.freeze({
  DISPLAY_PHRASE: 'display-phrase',
  SET_BACKGROUND: 'set-background',
  TOGGLE_SOUND_MODE: 'toggle-sound-mode',
  SET_LANGUAGES: 'set-languages',
  CLEAR_TIMEOUTS: 'clear-timeouts',
  KEY_PRESS: 'key-press',
  IMPORT_DICTIONARY: 'import-dictionary',
  CHOOSE_DICTIONARY_FILE: 'choose-dictionary-file',
  OPEN_EXTERNAL: 'open-external'
});

module.exports = {
  MODES,
  LEVELS,
  LANGUAGES,
  FROM_LANGUAGES,
  LANGUAGE_LOCALES,
  DEFAULT_LOCALE,
  SPEED_INTERVALS,
  DEFAULT_INTERVAL_MS,
  PHRASE_SEPARATOR,
  CUSTOM_LEVEL_PREFIX,
  WINDOW_WIDTH,
  WINDOW_HEIGHT,
  IPC
};
