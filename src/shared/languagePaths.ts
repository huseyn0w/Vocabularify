import path from 'path';
import { CUSTOM_LEVEL_PREFIX, LANGUAGE_LOCALES, DEFAULT_LOCALE } from './constants';

// A path segment is safe only when it cannot escape its directory: non-empty,
// no separators, no parent/current refs, no NUL. Renderer- and config-supplied
// language/level/dictionary-name values flow into `path.join`, which normalises
// `..`, so these must be validated before they touch the filesystem.
export function isSafePathSegment(segment: string): boolean {
  return (
    typeof segment === 'string' &&
    segment.length > 0 &&
    !segment.includes('/') &&
    !segment.includes('\\') &&
    !segment.includes('\0') &&
    segment !== '.' &&
    segment !== '..'
  );
}

function assertSafeSegments(segments: string[]): void {
  for (const segment of segments) {
    if (!isSafePathSegment(segment)) {
      throw new Error(`Unsafe path segment: ${JSON.stringify(segment)}`);
    }
  }
}

// Resolves the JSON file for a (target, source, level) selection.
// Built-in dictionaries live under `${basePath}/languages/...`; custom ones
// under `customDictsPath`. Kept pure (no fs access) so it is unit-testable.
// Throws if any selection segment could traverse outside its base directory.
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
    assertSafeSegments([language, fromLanguage, name]);
    return path.join(customDictsPath, customDictFileName(language, fromLanguage, name));
  }
  assertSafeSegments([language, fromLanguage, level.toLowerCase()]);
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
