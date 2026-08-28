import { describe, it, expect } from 'vitest';
import { joinTokens, layoutTokens } from './items';

describe('layoutTokens', () => {
  it('marks which tokens take a leading space and carries the concept id', () => {
    expect(
      layoutTokens([{ t: 'ich', c: 'i' }, { t: 'bin', c: 'to be' }, '.'])
    ).toEqual([
      { text: 'ich', concept: 'i', space: false },
      { text: 'bin', concept: 'to be', space: true },
      { text: '.', concept: null, space: false }
    ]);
  });

  it('marks glue with a null concept', () => {
    expect(layoutTokens(['der', { t: 'Mann', c: 'man' }])).toEqual([
      { text: 'der', concept: null, space: false },
      { text: 'Mann', concept: 'man', space: true }
    ]);
  });

  it('drops empty tokens instead of emitting an empty span', () => {
    expect(layoutTokens([{ t: 'a', c: 'x' }, '', { t: 'b', c: 'y' }])).toHaveLength(2);
  });
});

describe('joinTokens', () => {
  it('separates words with a single space', () => {
    expect(joinTokens([{ t: 'ich', c: 'I' }, { t: 'bin', c: 'to be' }])).toBe('ich bin');
  });

  it('puts no space before closing punctuation', () => {
    expect(
      joinTokens([
        { t: 'Hallo', c: 'hello' }, ',',
        { t: 'ich', c: 'I' }, { t: 'bin', c: 'to be' }, { t: 'gut', c: 'good' }, '.'
      ])
    ).toBe('Hallo, ich bin gut.');
  });

  it('puts no space after an apostrophe elision', () => {
    expect(joinTokens(["l'", { t: 'économie', c: 'economy' }, '.'])).toBe("l'économie.");
  });

  it('puts no space after an opening bracket', () => {
    expect(joinTokens(['(', { t: 'ja', c: 'yes' }, ')'])).toBe('(ja)');
  });

  it('skips empty tokens rather than emitting a double space', () => {
    expect(joinTokens([{ t: 'a', c: 'x' }, '', { t: 'b', c: 'y' }])).toBe('a b');
  });

  it('returns an empty string for an empty list', () => {
    expect(joinTokens([])).toBe('');
  });
});
