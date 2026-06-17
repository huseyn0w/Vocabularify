import { PHRASE_SEPARATOR } from './constants';
import type { VocabEntry } from './types';

// Parses the plain-text import format into vocabulary entries.
// Each non-empty line is "word - translation"; we split on the FIRST
// separator so hyphenated words (e.g. "well-being") survive. Malformed
// lines (no separator, or an empty side) are skipped.
export function parseDictionaryText(content: string): VocabEntry[] {
  return content
    .split('\n')
    .map(parseDictionaryLine)
    .filter((entry): entry is VocabEntry => entry !== null);
}

export function parseDictionaryLine(line: string): VocabEntry | null {
  const sepIndex = line.indexOf(PHRASE_SEPARATOR);
  if (sepIndex === -1) {
    return null;
  }
  const word_1 = line.slice(0, sepIndex).trim();
  const word_2 = line.slice(sepIndex + PHRASE_SEPARATOR.length).trim();
  return word_1 && word_2 ? { word_1, word_2 } : null;
}
