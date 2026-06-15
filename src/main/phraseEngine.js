const fs = require('fs');
const { toPhrases, nextIndex, prevIndex, clampIndex } = require('../shared/phrases');

// Owns the loaded phrase list, the current position, and the auto-advance
// timer. It is surface-agnostic: it calls `onRender(phrase, index, total)`
// and lets the caller decide where the phrase is shown (window or tray).
function createPhraseEngine({ intervalMs, onRender }) {
  let phrases = [];
  let index = 0;
  let interval = intervalMs;
  let timer = null;

  // Loads vocabulary from a JSON file and (re)starts cycling. `startIndex`
  // lets a restored position survive across dictionary switches; it is
  // clamped to the new list length. Throws on read/parse errors so the
  // caller can surface them.
  function load(filePath, startIndex = 0) {
    const vocabulary = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    phrases = toPhrases(vocabulary);
    index = clampIndex(startIndex, phrases.length);
    render();
    restartTimer();
  }

  function render() {
    if (phrases.length > 0) {
      onRender(phrases[index], index, phrases.length);
    }
  }

  function next() {
    index = nextIndex(index, phrases.length);
    render();
  }

  function previous() {
    index = prevIndex(index, phrases.length);
    render();
  }

  function setIntervalMs(ms) {
    interval = ms;
    restartTimer();
  }

  function restartTimer() {
    stop();
    if (phrases.length > 0) {
      timer = setInterval(next, interval);
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    load,
    next,
    previous,
    setIntervalMs,
    restartTimer,
    stop,
    render,
    getIndex: () => index,
    getCurrentPhrase: () => phrases[index]
  };
}

module.exports = { createPhraseEngine };
