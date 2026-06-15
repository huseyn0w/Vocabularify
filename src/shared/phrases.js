const { PHRASE_SEPARATOR } = require('./constants');

// Turns stored vocabulary entries into displayable "word - translation" strings.
function toPhrases(vocabulary) {
  return vocabulary.map(entry => `${entry.word_1}${PHRASE_SEPARATOR}${entry.word_2}`);
}

// Splits a phrase back into [word, translation]. If the separator is absent
// the whole phrase is returned as a single-element array.
function splitPhrase(phrase) {
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
function nextIndex(index, length) {
  return length > 0 ? (index + 1) % length : 0;
}

function prevIndex(index, length) {
  return length > 0 ? (index - 1 + length) % length : 0;
}

// Keeps a restored index within the bounds of the current phrase list.
function clampIndex(index, length) {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
}

module.exports = {
  toPhrases,
  splitPhrase,
  nextIndex,
  prevIndex,
  clampIndex
};
