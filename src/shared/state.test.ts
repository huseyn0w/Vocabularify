import { describe, it, expect } from 'vitest';
import { normalizeState, DEFAULT_STATE, clampInterval, MIN_INTERVAL_MS, MAX_INTERVAL_MS, progressKey } from './state';

describe('normalizeState', () => {
  it('returns the defaults for empty / non-object input', () => {
    expect(normalizeState(undefined)).toEqual(DEFAULT_STATE);
    expect(normalizeState(null)).toEqual(DEFAULT_STATE);
    expect(normalizeState('nope')).toEqual(DEFAULT_STATE);
  });

  it('passes through a fully valid state', () => {
    const valid = {
      currentIndex: 4,
      currentLanguage: 'en',
      currentFromLanguage: 'ru',
      currentLevel: 'B2',
      currentMode: 'Menu Bar',
      isSoundMode: true,
      currentBackground: 'dark',
      intervalMs: 10000
    };
    // currentIndex is non-zero and valid has no progress field of its own, so
    // the pre-lessons migration seed (see 'normalizeState progress' below)
    // legitimately adds one entry here.
    expect(normalizeState(valid)).toEqual({ ...valid, progress: { 'en:ru:B2': 4 } });
  });

  it('falls back per-field on invalid values', () => {
    const result = normalizeState({
      currentIndex: -3,
      currentMode: 'Bogus',
      currentBackground: 'rainbow',
      intervalMs: 0, // below the minimum
      isSoundMode: 'yes'
    });
    expect(result.currentIndex).toBe(DEFAULT_STATE.currentIndex);
    expect(result.currentMode).toBe(DEFAULT_STATE.currentMode);
    expect(result.currentBackground).toBe(DEFAULT_STATE.currentBackground);
    expect(result.intervalMs).toBe(DEFAULT_STATE.intervalMs);
    expect(result.isSoundMode).toBe(DEFAULT_STATE.isSoundMode);
  });

  it('preserves a custom (non-preset) interval within bounds', () => {
    expect(normalizeState({ intervalMs: 7000 }).intervalMs).toBe(7000);
  });

  it('rejects an out-of-range interval', () => {
    expect(normalizeState({ intervalMs: MAX_INTERVAL_MS + 1 }).intervalMs).toBe(DEFAULT_STATE.intervalMs);
  });

  it('preserves a custom level string', () => {
    expect(normalizeState({ currentLevel: 'custom:travel' }).currentLevel).toBe('custom:travel');
  });
});

describe('clampInterval', () => {
  it('clamps below the minimum up to the minimum', () => {
    expect(clampInterval(10)).toBe(MIN_INTERVAL_MS);
  });

  it('clamps above the maximum down to the maximum', () => {
    expect(clampInterval(10_000_000)).toBe(MAX_INTERVAL_MS);
  });

  it('rounds and passes through an in-range value', () => {
    expect(clampInterval(7000.4)).toBe(7000);
  });

  it('falls back to the default for non-numbers', () => {
    expect(clampInterval(NaN)).toBe(DEFAULT_STATE.intervalMs);
    expect(clampInterval('5000')).toBe(DEFAULT_STATE.intervalMs);
  });
});

describe('progressKey', () => {
  it('keys on the pair and level together', () => {
    expect(progressKey('de', 'ru', 'A1')).toBe('de:ru:A1');
  });
});

describe('normalizeState progress', () => {
  it('defaults to an empty map', () => {
    expect(normalizeState({}).progress).toEqual({});
  });

  it('keeps valid entries', () => {
    expect(normalizeState({ progress: { 'de:ru:A1': 12 } }).progress).toEqual({ 'de:ru:A1': 12 });
  });

  it('drops entries that are not non-negative integers', () => {
    const state = normalizeState({
      progress: { good: 3, negative: -1, fractional: 1.5, text: 'x', nothing: null }
    });
    expect(state.progress).toEqual({ good: 3 });
  });

  it('ignores a progress value that is not an object', () => {
    expect(normalizeState({ progress: 'nope' }).progress).toEqual({});
  });

  it('seeds progress from a pre-lessons currentIndex so an upgrade keeps its place', () => {
    const state = normalizeState({
      currentIndex: 42,
      currentLanguage: 'de',
      currentFromLanguage: 'ru',
      currentLevel: 'B1'
    });
    expect(state.progress).toEqual({ 'de:ru:B1': 42 });
  });

  it('does not seed when progress already has entries', () => {
    const state = normalizeState({
      currentIndex: 42,
      currentLanguage: 'de',
      currentFromLanguage: 'ru',
      currentLevel: 'B1',
      progress: { 'fr:en:A1': 7 }
    });
    expect(state.progress).toEqual({ 'fr:en:A1': 7 });
  });

  it('does not seed from a zero index', () => {
    expect(normalizeState({ currentIndex: 0 }).progress).toEqual({});
  });

  it('is round-trip stable, so saveState cannot drop the field', () => {
    const once = normalizeState({ progress: { 'de:ru:A1': 5 } });
    expect(normalizeState(once)).toEqual(once);
  });

  it('rejects an array as the whole progress value', () => {
    expect(normalizeState({ progress: [1, 2, 3] }).progress).toEqual({});
  });

  it('rejects Infinity as a progress entry value', () => {
    const state = normalizeState({
      progress: { 'de:ru:A1': Infinity }
    });
    expect(state.progress).toEqual({});
  });

  it('rejects an empty-string key in progress', () => {
    const state = normalizeState({
      progress: { '': 5, 'de:ru:A1': 10 }
    });
    expect(state.progress).toEqual({ 'de:ru:A1': 10 });
  });

  it('safely degrades a Map passed as progress', () => {
    expect(normalizeState({ progress: new Map([['de:ru:A1', 5]]) }).progress).toEqual({});
  });
});
