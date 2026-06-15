const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { parseDictionaryText } = require('./src/shared/dictionary');
const { customDictFileName } = require('./src/shared/languagePaths');

const CUSTOM_DICTS_PATH = path.join(app.getPath('userData'), 'custom_dictionaries');

async function handleImportDictionary(event, filePath, dictionaryName, language, fromLanguage) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const vocabulary = parseDictionaryText(content);
    if (vocabulary.length === 0) {
      return { success: false, error: 'No valid "word - translation" lines found in file.' };
    }
    const fileName = customDictFileName(language, fromLanguage, dictionaryName);
    fs.writeFileSync(path.join(CUSTOM_DICTS_PATH, fileName), JSON.stringify(vocabulary, null, 2));
    return { success: true, dictionaryName: `${language}_${fromLanguage}_${dictionaryName}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleDeleteDictionary(event, dictionaryName) {
  try {
    const dictPath = path.join(CUSTOM_DICTS_PATH, `${dictionaryName}.json`);
    if (fs.existsSync(dictPath)) {
      fs.unlinkSync(dictPath);
      return { success: true, dictionaryName };
    } else {
      return { success: false, error: 'Dictionary not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  handleImportDictionary,
  handleDeleteDictionary
};
