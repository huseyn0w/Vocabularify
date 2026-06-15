import { describe, it, expect } from 'vitest';
import { normalizeState, DEFAULT_STATE } from './state.js';

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
      intervalMs: 1234,
      isSoundMode: 'yes'
    });
    expect(result.currentIndex).toBe(DEFAULT_STATE.currentIndex);
    expect(result.currentMode).toBe(DEFAULT_STATE.currentMode);
    expect(result.currentBackground).toBe(DEFAULT_STATE.currentBackground);
    expect(result.intervalMs).toBe(DEFAULT_STATE.intervalMs);
    expect(result.isSoundMode).toBe(DEFAULT_STATE.isSoundMode);
  });

  it('preserves a custom level string', () => {
    expect(normalizeState({ currentLevel: 'custom:travel' }).currentLevel).toBe('custom:travel');
  });
});
