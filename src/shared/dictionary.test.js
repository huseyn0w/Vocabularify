import { describe, it, expect } from 'vitest';
import { parseDictionaryText, parseDictionaryLine } from './dictionary.js';

describe('parseDictionaryLine', () => {
  it('splits a well-formed line and trims both sides', () => {
    expect(parseDictionaryLine('  hello  -  hallo ')).toEqual({ word_1: 'hello', word_2: 'hallo' });
  });

  it('splits only on the first separator so hyphenated words survive', () => {
    expect(parseDictionaryLine('well-being - Wohlbefinden')).toEqual({
      word_1: 'well-being',
      word_2: 'Wohlbefinden'
    });
  });

  it('keeps a translation that itself contains " - "', () => {
    expect(parseDictionaryLine('foo - bar - baz')).toEqual({ word_1: 'foo', word_2: 'bar - baz' });
  });

  it('returns null when there is no separator', () => {
    expect(parseDictionaryLine('justoneword')).toBeNull();
  });

  it('returns null when either side is empty', () => {
    expect(parseDictionaryLine(' - translation')).toBeNull();
    expect(parseDictionaryLine('word - ')).toBeNull();
  });
});

describe('parseDictionaryText', () => {
  it('parses multiple lines and skips blank/malformed ones', () => {
    const text = 'one - eins\n\nbroken line\ntwo - zwei\n';
    expect(parseDictionaryText(text)).toEqual([
      { word_1: 'one', word_2: 'eins' },
      { word_1: 'two', word_2: 'zwei' }
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseDictionaryText('')).toEqual([]);
  });
});
