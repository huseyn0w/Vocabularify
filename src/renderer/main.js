const phraseContainer = document.getElementById('phrase-container');
const sourceEl = document.getElementById('source');
const targetEl = document.getElementById('target');
const hintEl = document.getElementById('hint');
const progressBarInner = document.getElementById('progress-bar-inner');
const progressLabel = document.getElementById('progress-label');

const PHRASE_SEPARATOR = ' - ';
const HINT_FADE_DELAY_MS = 6000;

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

// Splits "word - translation" on the first separator; the source word is
// what the learner already knows, the target is the word being learned.
function splitPhrase(phrase) {
  const sepIndex = phrase.indexOf(PHRASE_SEPARATOR);
  if (sepIndex === -1) {
    return [phrase, ''];
  }
  return [phrase.slice(0, sepIndex), phrase.slice(sepIndex + PHRASE_SEPARATOR.length)];
}

function updateProgressBar(index, total) {
  const percentage = total > 0 ? (index / total) * 100 : 0;
  progressBarInner.style.width = `${percentage}%`;
  progressLabel.textContent = `${index + 1} / ${total}`;
}

// Restarts the entrance animation by forcing a reflow before re-adding it.
function replayEnterAnimation() {
  phraseContainer.style.animation = 'none';
  void phraseContainer.offsetWidth;
  phraseContainer.style.animation = '';
}

function displayPhrase({ phrase, mode, index, total }) {
  clearRevealTimeout();
  updateProgressBar(index, total);
  replayEnterAnimation();

  const [source, target] = splitPhrase(phrase);
  sourceEl.textContent = source;
  targetEl.textContent = target;

  if (mode === 'Checkup' && target) {
    // Hide the answer, then reveal it after a short delay.
    targetEl.classList.add('hidden');
    speak(source, fromLocale);
    revealTimeoutId = setTimeout(() => {
      targetEl.classList.remove('hidden');
      speak(target, toLocale);
    }, 3000);
    return;
  }

  targetEl.classList.remove('hidden');
  if (target) {
    speak(source, fromLocale);
    revealTimeoutId = setTimeout(() => speak(target, toLocale), 2000);
  } else {
    speak(source, toLocale);
  }
}

function scheduleHintFade() {
  hintEl.classList.remove('faded');
  setTimeout(() => hintEl.classList.add('faded'), HINT_FADE_DELAY_MS);
}

window.vocab.onSetLanguages(({ fromLocale: from, toLocale: to }) => {
  fromLocale = from;
  toLocale = to;
});

window.vocab.onToggleSound(enabled => {
  isSoundMode = enabled;
});

window.vocab.onSetBackground(background => {
  document.body.classList.toggle('dark', background === 'dark');
});

window.vocab.onClearTimeouts(clearRevealTimeout);
window.vocab.onDisplayPhrase(displayPhrase);

document.addEventListener('keydown', event => {
  window.vocab.sendKeyPress({ shiftKey: event.shiftKey, key: event.key });
});

scheduleHintFade();
