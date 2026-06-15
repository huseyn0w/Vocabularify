import { describe, it, expect } from 'vitest';
import { normalizeState, DEFAULT_STATE, clampInterval, MIN_INTERVAL_MS, MAX_INTERVAL_MS } from './state.js';

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
    expect(normalizeState(valid)).toEqual(valid);
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
