import { describe, it, expect } from 'vitest';
import { nextIndex, prevIndex, clampIndex } from './phrases';

describe('index arithmetic', () => {
  it('nextIndex wraps around', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
  });

  it('prevIndex wraps around', () => {
    expect(prevIndex(0, 3)).toBe(2);
    expect(prevIndex(2, 3)).toBe(1);
  });

  it('next/prev are safe for an empty list', () => {
    expect(nextIndex(0, 0)).toBe(0);
    expect(prevIndex(0, 0)).toBe(0);
  });

  it('clampIndex keeps the index within bounds', () => {
    expect(clampIndex(5, 3)).toBe(2);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(1, 3)).toBe(1);
    expect(clampIndex(5, 0)).toBe(0);
  });
});
