import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  getLanguageFilePath,
  customDictFileName,
  parseCustomDictName,
  getLocale
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
