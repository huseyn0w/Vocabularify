const { MODES, DEFAULT_INTERVAL_MS, SPEED_INTERVALS } = require('./constants');

// The persisted application state and its defaults. Defaults are applied
// whenever a field is missing or invalid, so a partial/corrupt config file
// can never put the app into an unusable state.
const DEFAULT_STATE = Object.freeze({
  currentIndex: 0,
  currentLanguage: 'de',
  currentFromLanguage: 'en',
  currentLevel: 'A1',
  currentMode: MODES.WINDOW,
  isSoundMode: false,
  currentBackground: 'light',
  intervalMs: DEFAULT_INTERVAL_MS
});

const VALID_MODES = new Set(Object.values(MODES));
const VALID_BACKGROUNDS = new Set(['light', 'dark']);

// Merges a raw (untrusted) config object onto the defaults, validating each
// field. Always returns a complete, well-formed state object.
function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    currentIndex: isNonNegativeInt(source.currentIndex)
      ? source.currentIndex
      : DEFAULT_STATE.currentIndex,
    currentLanguage: isNonEmptyString(source.currentLanguage)
      ? source.currentLanguage
      : DEFAULT_STATE.currentLanguage,
    currentFromLanguage: isNonEmptyString(source.currentFromLanguage)
      ? source.currentFromLanguage
      : DEFAULT_STATE.currentFromLanguage,
    currentLevel: isNonEmptyString(source.currentLevel)
      ? source.currentLevel
      : DEFAULT_STATE.currentLevel,
    currentMode: VALID_MODES.has(source.currentMode)
      ? source.currentMode
      : DEFAULT_STATE.currentMode,
    isSoundMode: typeof source.isSoundMode === 'boolean'
      ? source.isSoundMode
      : DEFAULT_STATE.isSoundMode,
    currentBackground: VALID_BACKGROUNDS.has(source.currentBackground)
      ? source.currentBackground
      : DEFAULT_STATE.currentBackground,
    intervalMs: SPEED_INTERVALS.includes(source.intervalMs)
      ? source.intervalMs
      : DEFAULT_STATE.intervalMs
  };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function isNonNegativeInt(value) {
  return Number.isInteger(value) && value >= 0;
}

module.exports = {
  DEFAULT_STATE,
  normalizeState
};
