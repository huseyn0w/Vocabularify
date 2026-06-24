import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  getLanguageFilePath,
  customDictFileName,
  parseCustomDictName,
  getLocale,
  isSafePathSegment
} from './languagePaths';

describe('getLanguageFilePath', () => {
  const base = { basePath: '/app', customDictsPath: '/user/custom' };

  it('resolves a built-in dictionary and lowercases the level', () => {
    const result = getLanguageFilePath({ ...base, language: 'de', fromLanguage: 'en', level: 'A1' });
    expect(result).toBe(path.join('/app', 'languages', 'de', 'en', 'a1.json'));
  });

  it('resolves a custom dictionary into the custom dir', () => {
    const result = getLanguageFilePath({ ...base, language: 'de', fromLanguage: 'en', level: 'custom:my_words' });
    expect(result).toBe(path.join('/user/custom', 'de_en_my_words.json'));
  });

  it('throws when the level would traverse outside the base dir', () => {
    expect(() =>
      getLanguageFilePath({ ...base, language: 'de', fromLanguage: 'en', level: '../../../../etc/passwd' })
    ).toThrow(/Unsafe path segment/);
  });

  it('throws when a custom dictionary name would traverse outside the custom dir', () => {
    expect(() =>
      getLanguageFilePath({ ...base, language: 'de', fromLanguage: 'en', level: 'custom:../../evil' })
    ).toThrow(/Unsafe path segment/);
  });

  it('throws when the language code contains a path separator', () => {
    expect(() =>
      getLanguageFilePath({ ...base, language: '../de', fromLanguage: 'en', level: 'a1' })
    ).toThrow(/Unsafe path segment/);
  });
});

describe('isSafePathSegment', () => {
  it('accepts plain segments (codes, level names, underscore names)', () => {
    for (const ok of ['de', 'en', 'a1', 'my_travel_words', 'C1']) {
      expect(isSafePathSegment(ok)).toBe(true);
    }
  });

  it('rejects separators, parent refs, empty, and NUL', () => {
    for (const bad of ['', '.', '..', 'a/b', 'a\\b', '../x', 'x\0y']) {
      expect(isSafePathSegment(bad)).toBe(false);
    }
  });
});

describe('custom dictionary names', () => {
  it('builds and round-trips a file name', () => {
    expect(customDictFileName('de', 'en', 'travel')).toBe('de_en_travel.json');
  });

  it('parses a base name, preserving underscores in the dictionary name', () => {
    expect(parseCustomDictName('de_en_my_travel_words')).toEqual({
      language: 'de',
      fromLanguage: 'en',
      name: 'my_travel_words'
    });
  });

  it('returns null for an unparseable base name', () => {
    expect(parseCustomDictName('incomplete')).toBeNull();
  });
});

describe('getLocale', () => {
  it('maps known languages', () => {
    expect(getLocale('de')).toBe('de-DE');
  });

  it('falls back to en-US for unknown languages', () => {
    expect(getLocale('xx')).toBe('en-US');
  });
});
