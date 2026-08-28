import { MODES, DEFAULT_INTERVAL_MS } from "./constants";
import type { AppState, Mode, Background } from "./types";

// Bounds for a (possibly custom) word-change interval: 1s to 10 minutes.
export const MIN_INTERVAL_MS = 1000;
export const MAX_INTERVAL_MS = 600000;

// The persisted application state and its defaults. Defaults are applied
// whenever a field is missing or invalid, so a partial/corrupt config file
// can never put the app into an unusable state.
const DEFAULT_STATE: AppState = Object.freeze({
  currentIndex: 0,
  progress: {},
  currentLanguage: "de",
  currentFromLanguage: "en",
  currentLevel: "A1",
  currentMode: MODES.WINDOW,
  isSoundMode: false,
  isAssembleMode: false,
  // Obsidian (dark) is the signature premium look - ship it out of the box.
  currentBackground: "dark",
  intervalMs: DEFAULT_INTERVAL_MS,
});

export { DEFAULT_STATE };

const VALID_MODES: ReadonlySet<string> = new Set(Object.values(MODES));
const VALID_BACKGROUNDS: ReadonlySet<string> = new Set(["light", "dark"]);

// Merges a raw (untrusted) config object onto the defaults, validating each
// field. Always returns a complete, well-formed state object.
export function normalizeState(raw: unknown): AppState {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const state: AppState = {
    currentIndex: isNonNegativeInt(source.currentIndex)
      ? source.currentIndex
      : DEFAULT_STATE.currentIndex,
    progress: normalizeProgress(source.progress),
    currentLanguage: isNonEmptyString(source.currentLanguage)
      ? source.currentLanguage
      : DEFAULT_STATE.currentLanguage,
    currentFromLanguage: isNonEmptyString(source.currentFromLanguage)
      ? source.currentFromLanguage
      : DEFAULT_STATE.currentFromLanguage,
    currentLevel: isNonEmptyString(source.currentLevel)
      ? source.currentLevel
      : DEFAULT_STATE.currentLevel,
    currentMode:
      typeof source.currentMode === "string" &&
      VALID_MODES.has(source.currentMode)
        ? (source.currentMode as Mode)
        : DEFAULT_STATE.currentMode,
    isSoundMode:
      typeof source.isSoundMode === "boolean"
        ? source.isSoundMode
        : DEFAULT_STATE.isSoundMode,
    isAssembleMode:
      typeof source.isAssembleMode === "boolean"
        ? source.isAssembleMode
        : DEFAULT_STATE.isAssembleMode,
    currentBackground:
      typeof source.currentBackground === "string" &&
      VALID_BACKGROUNDS.has(source.currentBackground)
        ? (source.currentBackground as Background)
        : DEFAULT_STATE.currentBackground,
    intervalMs: isValidInterval(source.intervalMs)
      ? source.intervalMs
      : DEFAULT_STATE.intervalMs,
  };

  // A config written before lessons existed has a bare currentIndex and no
  // progress map. Seed the one entry it describes so an upgrading user keeps
  // their place instead of being sent back to the first word.
  if (Object.keys(state.progress).length === 0 && state.currentIndex > 0) {
    state.progress[
      progressKey(state.currentLanguage, state.currentFromLanguage, state.currentLevel)
    ] = state.currentIndex;
  }

  return state;
}

// Accepts any whole-millisecond interval within bounds, so custom speeds
// (not just the tray presets) persist correctly.
function isValidInterval(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= MIN_INTERVAL_MS &&
    (value as number) <= MAX_INTERVAL_MS
  );
}

// Clamps an arbitrary interval (e.g. from the custom-speed input) into the
// supported range; non-numbers fall back to the default.
export function clampInterval(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_INTERVAL_MS;
  }
  return Math.min(
    Math.max(Math.round(value), MIN_INTERVAL_MS),
    MAX_INTERVAL_MS,
  );
}

/** Progress is stored per dictionary, because a position only means anything
 *  next to the pair and level it was reached in. */
export function progressKey(to: string, from: string, level: string): string {
  return `${to}:${from}:${level}`;
}

function normalizeProgress(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key.length > 0 && isNonNegativeInt(value)) {
      out[key] = value;
    }
  }
  return out;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNonNegativeInt(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}
