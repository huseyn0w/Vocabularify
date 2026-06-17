import path from 'path';
import { CUSTOM_LEVEL_PREFIX, LANGUAGE_LOCALES, DEFAULT_LOCALE } from './constants';

// Resolves the JSON file for a (target, source, level) selection.
// Built-in dictionaries live under `${basePath}/languages/...`; custom ones
// under `customDictsPath`. Kept pure (no fs access) so it is unit-testable.
export function getLanguageFilePath(opts: {
  basePath: string;
  customDictsPath: string;
  language: string;
  fromLanguage: string;
  level: string;
}): string {
  const { basePath, customDictsPath, language, fromLanguage, level } = opts;
  if (level.startsWith(CUSTOM_LEVEL_PREFIX)) {
    const name = level.slice(CUSTOM_LEVEL_PREFIX.length);
    return path.join(customDictsPath, customDictFileName(language, fromLanguage, name));
  }
  return path.join(basePath, 'languages', language, fromLanguage, `${level.toLowerCase()}.json`);
}

// Custom dictionaries are stored as "<target>_<source>_<name>.json".
export function customDictFileName(language: string, fromLanguage: string, name: string): string {
  return `${language}_${fromLanguage}_${name}.json`;
}

// Parses a custom dictionary base name (no extension) back into its parts.
// The target and source are the first two underscore-separated tokens; the
// remainder is the (possibly underscore-containing) dictionary name.
export function parseCustomDictName(
  baseName: string
): { language: string; fromLanguage: string; name: string } | null {
  const parts = baseName.split('_');
  if (parts.length < 3) {
    return null;
  }
  const [language, fromLanguage, ...rest] = parts;
  return { language, fromLanguage, name: rest.join('_') };
}

export function getLocale(lang: string): string {
  return LANGUAGE_LOCALES[lang] || DEFAULT_LOCALE;
}
