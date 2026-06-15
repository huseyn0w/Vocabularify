const path = require('path');
const fs = require('fs');
const { CUSTOM_DICTS_PATH } = require('./config');
const { parseDictionaryText } = require('../shared/dictionary');
const { customDictFileName, parseCustomDictName } = require('../shared/languagePaths');

// Imports a plain-text dictionary file into a stored JSON custom dictionary.
function importDictionary({ filePath, dictionaryName, language, fromLanguage }) {
  try {
    const vocabulary = parseDictionaryText(fs.readFileSync(filePath, 'utf-8'));
    if (vocabulary.length === 0) {
      return { success: false, error: 'No valid "word - translation" lines found in file.' };
    }
    const fileName = customDictFileName(language, fromLanguage, dictionaryName);
    fs.writeFileSync(path.join(CUSTOM_DICTS_PATH, fileName), JSON.stringify(vocabulary, null, 2));
    return { success: true, dictionaryName: path.basename(fileName, '.json') };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Deletes a custom dictionary by its base name ("<target>_<source>_<name>").
function deleteDictionary(baseName) {
  try {
    const dictPath = path.join(CUSTOM_DICTS_PATH, `${baseName}.json`);
    if (!fs.existsSync(dictPath)) {
      return { success: false, error: 'Dictionary not found' };
    }
    fs.unlinkSync(dictPath);
    return { success: true, dictionaryName: baseName };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// All custom dictionary base names (no extension).
function listCustomDictionaries() {
  return fs
    .readdirSync(CUSTOM_DICTS_PATH)
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));
}

// Custom dictionary names available for a given (target, source) pair.
function listCustomDictionaryNamesFor(language, fromLanguage) {
  return listCustomDictionaries()
    .map(parseCustomDictName)
    .filter(parsed => parsed && parsed.language === language && parsed.fromLanguage === fromLanguage)
    .map(parsed => parsed.name);
}

module.exports = {
  importDictionary,
  deleteDictionary,
  listCustomDictionaries,
  listCustomDictionaryNamesFor
};
