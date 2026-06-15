const phraseContainer = document.getElementById('phrase-container');
const sourceEl = document.getElementById('source');
const targetEl = document.getElementById('target');
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

// Hides the answer instantly (no fade), so a new Checkup word never flashes
// its translation before hiding it.
function hideTarget() {
  targetEl.style.transition = 'none';
  targetEl.classList.add('hidden');
  void targetEl.offsetWidth; // commit the hidden state before any paint
}

// Reveals the answer with the normal fade-in transition.
function revealTarget() {
  targetEl.style.transition = '';
  targetEl.classList.remove('hidden');
}

function displayPhrase({ phrase, mode, index, total }) {
  clearRevealTimeout();
  updateProgressBar(index, total);
  replayEnterAnimation();

  const [source, target] = splitPhrase(phrase);
  sourceEl.textContent = source;
  targetEl.textContent = target;

  if (mode === 'Checkup' && target) {
    hideTarget();
    speak(source, fromLocale);
    revealTimeoutId = setTimeout(() => {
      revealTarget();
      speak(target, toLocale);
    }, 3000);
    return;
  }

  revealTarget();
  if (target) {
    speak(source, fromLocale);
    revealTimeoutId = setTimeout(() => speak(target, toLocale), 2000);
  } else {
    speak(source, toLocale);
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
  document.body.classList.toggle('dark', background === 'dark');
});

window.vocab.onClearTimeouts(clearRevealTimeout);
window.vocab.onDisplayPhrase(displayPhrase);

document.addEventListener('keydown', event => {
  window.vocab.sendKeyPress({ shiftKey: event.shiftKey, key: event.key });
});

// Pause auto-advance while the pointer is over the window so the user can
// read the current word; resume on leave.
document.documentElement.addEventListener('mouseenter', () => window.vocab.setPaused(true));
document.documentElement.addEventListener('mouseleave', () => window.vocab.setPaused(false));
