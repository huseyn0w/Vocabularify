const { PHRASE_SEPARATOR } = require('./constants');

// Parses the plain-text import format into vocabulary entries.
// Each non-empty line is "word - translation"; we split on the FIRST
// separator so hyphenated words (e.g. "well-being") survive. Malformed
// lines (no separator, or an empty side) are skipped.
function parseDictionaryText(content) {
  return content
    .split('\n')
    .map(parseDictionaryLine)
    .filter(Boolean);
}

function parseDictionaryLine(line) {
  const sepIndex = line.indexOf(PHRASE_SEPARATOR);
  if (sepIndex === -1) {
    return null;
  }
  const word_1 = line.slice(0, sepIndex).trim();
  const word_2 = line.slice(sepIndex + PHRASE_SEPARATOR.length).trim();
  return word_1 && word_2 ? { word_1, word_2 } : null;
}

module.exports = {
  parseDictionaryText,
  parseDictionaryLine
};
