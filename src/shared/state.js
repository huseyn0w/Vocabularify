const { MODES, DEFAULT_INTERVAL_MS } = require('./constants');

// Bounds for a (possibly custom) word-change interval: 1s to 10 minutes.
const MIN_INTERVAL_MS = 1000;
const MAX_INTERVAL_MS = 600000;

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
    intervalMs: isValidInterval(source.intervalMs)
      ? source.intervalMs
      : DEFAULT_STATE.intervalMs
  };
}

// Accepts any whole-millisecond interval within bounds, so custom speeds
// (not just the tray presets) persist correctly.
function isValidInterval(value) {
  return Number.isInteger(value) && value >= MIN_INTERVAL_MS && value <= MAX_INTERVAL_MS;
}

// Clamps an arbitrary interval (e.g. from the custom-speed input) into the
// supported range; non-numbers fall back to the default.
function clampInterval(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_INTERVAL_MS;
  }
  return Math.min(Math.max(Math.round(value), MIN_INTERVAL_MS), MAX_INTERVAL_MS);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function isNonNegativeInt(value) {
  return Number.isInteger(value) && value >= 0;
}

module.exports = {
  DEFAULT_STATE,
  MIN_INTERVAL_MS,
  MAX_INTERVAL_MS,
  normalizeState,
  clampInterval
};
