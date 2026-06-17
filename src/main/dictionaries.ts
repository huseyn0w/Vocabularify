import path from 'path';
import fs from 'fs';
import { CUSTOM_DICTS_PATH } from './config';
import { parseDictionaryText } from '../shared/dictionary';
import { customDictFileName, parseCustomDictName } from '../shared/languagePaths';
import type { ImportPayload, DictionaryResult } from '../shared/types';

// Imports a plain-text dictionary file into a stored JSON custom dictionary.
export function importDictionary({ filePath, dictionaryName, language, fromLanguage }: ImportPayload): DictionaryResult {
  try {
    const vocabulary = parseDictionaryText(fs.readFileSync(filePath, 'utf-8'));
    if (vocabulary.length === 0) {
      return { success: false, error: 'No valid "word - translation" lines found in file.' };
    }
    const fileName = customDictFileName(language, fromLanguage, dictionaryName);
    fs.writeFileSync(path.join(CUSTOM_DICTS_PATH, fileName), JSON.stringify(vocabulary, null, 2));
    return { success: true, dictionaryName: path.basename(fileName, '.json') };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Deletes a custom dictionary by its base name ("<target>_<source>_<name>").
export function deleteDictionary(baseName: string): DictionaryResult {
  try {
    const dictPath = path.join(CUSTOM_DICTS_PATH, `${baseName}.json`);
    if (!fs.existsSync(dictPath)) {
      return { success: false, error: 'Dictionary not found' };
    }
    fs.unlinkSync(dictPath);
    return { success: true, dictionaryName: baseName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// All custom dictionary base names (no extension).
export function listCustomDictionaries(): string[] {
  return fs
    .readdirSync(CUSTOM_DICTS_PATH)
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));
}

// Custom dictionary names available for a given (target, source) pair.
export function listCustomDictionaryNamesFor(language: string, fromLanguage: string): string[] {
  return listCustomDictionaries()
    .map(parseCustomDictName)
    .filter(parsed => parsed && parsed.language === language && parsed.fromLanguage === fromLanguage)
    .map(parsed => parsed!.name);
}
