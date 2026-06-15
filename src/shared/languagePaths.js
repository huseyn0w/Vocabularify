const path = require('path');
const { CUSTOM_LEVEL_PREFIX, LANGUAGE_LOCALES, DEFAULT_LOCALE } = require('./constants');

// Resolves the JSON file for a (target, source, level) selection.
// Built-in dictionaries live under `${basePath}/languages/...`; custom ones
// under `customDictsPath`. Kept pure (no fs access) so it is unit-testable.
function getLanguageFilePath({ basePath, customDictsPath, language, fromLanguage, level }) {
  if (level.startsWith(CUSTOM_LEVEL_PREFIX)) {
    const name = level.slice(CUSTOM_LEVEL_PREFIX.length);
    return path.join(customDictsPath, customDictFileName(language, fromLanguage, name));
  }
  return path.join(basePath, 'languages', language, fromLanguage, `${level.toLowerCase()}.json`);
}

// Custom dictionaries are stored as "<target>_<source>_<name>.json".
function customDictFileName(language, fromLanguage, name) {
  return `${language}_${fromLanguage}_${name}.json`;
}

// Parses a custom dictionary base name (no extension) back into its parts.
// The target and source are the first two underscore-separated tokens; the
// remainder is the (possibly underscore-containing) dictionary name.
function parseCustomDictName(baseName) {
  const parts = baseName.split('_');
  if (parts.length < 3) {
    return null;
  }
  const [language, fromLanguage, ...rest] = parts;
  return { language, fromLanguage, name: rest.join('_') };
}

function getLocale(lang) {
  return LANGUAGE_LOCALES[lang] || DEFAULT_LOCALE;
}

module.exports = {
  getLanguageFilePath,
  customDictFileName,
  parseCustomDictName,
  getLocale
};
