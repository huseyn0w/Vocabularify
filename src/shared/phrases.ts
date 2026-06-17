import { PHRASE_SEPARATOR } from './constants';
import type { Phrase, VocabEntry } from './types';

// Turns stored vocabulary entries into displayable "word - translation" strings.
export function toPhrases(vocabulary: VocabEntry[]): Phrase[] {
  return vocabulary.map(entry => `${entry.word_1}${PHRASE_SEPARATOR}${entry.word_2}`);
}

// Splits a phrase back into [word, translation]. If the separator is absent
// the whole phrase is returned as a single-element array.
export function splitPhrase(phrase: string): string[] {
  const sepIndex = phrase.indexOf(PHRASE_SEPARATOR);
  if (sepIndex === -1) {
    return [phrase];
  }
  return [
    phrase.slice(0, sepIndex),
    phrase.slice(sepIndex + PHRASE_SEPARATOR.length)
  ];
}

// Index arithmetic for cycling through phrases; all wrap around and are
// safe for an empty list (return 0).
export function nextIndex(index: number, length: number): number {
  return length > 0 ? (index + 1) % length : 0;
}

export function prevIndex(index: number, length: number): number {
  return length > 0 ? (index - 1 + length) % length : 0;
}

// Keeps a restored index within the bounds of the current phrase list.
export function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
}
