const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const CUSTOM_DICTS_PATH = path.join(app.getPath('userData'), 'custom_dictionaries');

async function handleImportDictionary(event, filePath, dictionaryName, language, fromLanguage) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const vocabulary = lines
      .map(line => {
        // Split only on the first " - " so words containing hyphens
        // (e.g. "well-being - Wohlbefinden") are preserved.
        const sepIndex = line.indexOf(' - ');
        if (sepIndex === -1) {
          return null;
        }
        const word_1 = line.slice(0, sepIndex).trim();
        const word_2 = line.slice(sepIndex + 3).trim();
        return word_1 && word_2 ? { word_1, word_2 } : null;
      })
      .filter(Boolean);
    if (vocabulary.length === 0) {
      return { success: false, error: 'No valid "word - translation" lines found in file.' };
    }
    const dictPath = path.join(CUSTOM_DICTS_PATH, `${language}_${fromLanguage}_${dictionaryName}.json`);
    fs.writeFileSync(dictPath, JSON.stringify(vocabulary, null, 2));
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
