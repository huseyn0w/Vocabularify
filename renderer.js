const { ipcRenderer } = require('electron');
const phraseContainer = document.getElementById('phrase-container');
const progressBarInner = document.getElementById('progress-bar-inner');
const progressLabel = document.getElementById('progress-label');
let isSoundMode = false;
let languageTo = 'en-US';
let languageFrom = 'de-DE';
let timeoutId;

function showError(message, error) {
  const dialog = require('electron').remote.dialog;
  dialog.showErrorBox(message, error ? error.stack || error.toString() : 'Unknown error');
}

function speakText(text, lang) {
  if (isSoundMode) {
    const strippedText = stripOrderNumber(text);
    const utterance = new SpeechSynthesisUtterance(strippedText);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  }
}

function getLangFromPhrase() {
  return [languageFrom, languageTo];
}

function stripOrderNumber(phrase) {
  const match = phrase.match(/^\d+\.\s*(.*)$/);
  return match ? match[1] : phrase;
}

function clearPreviousTimeout() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function updateProgressBar(currentIndex, totalPhrases) {
  const progressPercentage = (currentIndex / totalPhrases) * 100;
  progressBarInner.style.width = `${progressPercentage}%`;
  progressLabel.textContent = `${currentIndex + 1} / ${totalPhrases}`;
}

ipcRenderer.on('display-phrase', (event, phrase, mode, currentIndex, totalPhrases) => {
  clearPreviousTimeout();
  const langs = getLangFromPhrase();
  updateProgressBar(currentIndex, totalPhrases);
  if (mode === 'Checkup') {
    const parts = phrase.split(' - ');
    if (parts.length === 2) {
      phraseContainer.textContent = parts[0];
      speakText(parts[0], langs[0]);
      timeoutId = setTimeout(() => {
        phraseContainer.textContent = phrase;
        speakText(parts[1], langs[1]);
      }, 3000);
    } else {
      phraseContainer.textContent = phrase;
      speakText(phrase, languageTo);
    }
  } else {
    phraseContainer.textContent = phrase;
    const strippedPhrase = stripOrderNumber(phrase);
    const parts = strippedPhrase.split(' - ');
    if (parts.length === 2) {
      speakText(parts[0], langs[0]);
      timeoutId = setTimeout(() => speakText(parts[1], langs[1]), 2000);
    } else {
      speakText(strippedPhrase, languageTo);
    }
  }
});

ipcRenderer.on('set-background', (event, background) => {
  if (background === 'dark') {
    document.body.style.backgroundColor = 'black';
    document.body.style.color = 'white';
  } else {
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'black';
  }
});

ipcRenderer.on('toggle-sound-mode', (event, enabled) => {
  isSoundMode = enabled;
});

ipcRenderer.on('set-languages', (event, fromLang, toLang) => {
  languageFrom = fromLang;
  languageTo = toLang;
});

ipcRenderer.on('clear-timeouts', () => {
  clearPreviousTimeout();
});

document.addEventListener('keydown', (event) => {
  ipcRenderer.send('key-press', { shiftKey: event.shiftKey, key: event.key });
});
