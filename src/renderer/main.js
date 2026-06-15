const phraseContainer = document.getElementById('phrase-container');
const progressBarInner = document.getElementById('progress-bar-inner');
const progressLabel = document.getElementById('progress-label');

const PHRASE_SEPARATOR = ' - ';

let isSoundMode = false;
let fromLocale = 'de-DE';
let toLocale = 'en-US';
let revealTimeoutId = null;

function clearRevealTimeout() {
  if (revealTimeoutId) {
    clearTimeout(revealTimeoutId);
    revealTimeoutId = null;
  }
}

function speak(text, locale) {
  if (isSoundMode && text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    speechSynthesis.speak(utterance);
  }
}

// Splits "word - translation" on the first separator; returns the whole
// string as a single part when no separator is present.
function splitPhrase(phrase) {
  const sepIndex = phrase.indexOf(PHRASE_SEPARATOR);
  if (sepIndex === -1) {
    return [phrase];
  }
  return [phrase.slice(0, sepIndex), phrase.slice(sepIndex + PHRASE_SEPARATOR.length)];
}

function updateProgressBar(index, total) {
  const percentage = total > 0 ? (index / total) * 100 : 0;
  progressBarInner.style.width = `${percentage}%`;
  progressLabel.textContent = `${index + 1} / ${total}`;
}

function displayPhrase({ phrase, mode, index, total }) {
  clearRevealTimeout();
  updateProgressBar(index, total);
  const [word, translation] = splitPhrase(phrase);

  if (mode === 'Checkup' && translation !== undefined) {
    // Show the prompt, then reveal the translation after a short delay.
    phraseContainer.textContent = word;
    speak(word, fromLocale);
    revealTimeoutId = setTimeout(() => {
      phraseContainer.textContent = phrase;
      speak(translation, toLocale);
    }, 3000);
    return;
  }

  phraseContainer.textContent = phrase;
  if (translation !== undefined) {
    speak(word, fromLocale);
    revealTimeoutId = setTimeout(() => speak(translation, toLocale), 2000);
  } else {
    speak(phrase, toLocale);
  }
}

window.vocab.onSetLanguages(({ fromLocale: from, toLocale: to }) => {
  fromLocale = from;
  toLocale = to;
});

window.vocab.onToggleSound(enabled => {
  isSoundMode = enabled;
});

window.vocab.onSetBackground(background => {
  const dark = background === 'dark';
  document.body.style.backgroundColor = dark ? 'black' : 'white';
  document.body.style.color = dark ? 'white' : 'black';
});

window.vocab.onClearTimeouts(clearRevealTimeout);
window.vocab.onDisplayPhrase(displayPhrase);

document.addEventListener('keydown', event => {
  window.vocab.sendKeyPress({ shiftKey: event.shiftKey, key: event.key });
});
