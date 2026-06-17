// NOTE: this script is loaded as a classic <script> in the browser context, so
// it must compile to a plain script with no module wrapper (no require/exports).
// We therefore avoid a top-level `import` (even `import type`, which would still
// flag the file as a module under this CommonJS tsconfig) and reach the shared
// types through inline `import("...")` type references, which are fully erased
// and keep the output a classic script. The body is wrapped in an IIFE so its
// declarations stay file-local (classic scripts share global scope otherwise).
type MainVocabApi = import('../shared/types').MainVocabApi;
type DisplayPhrasePayload = import('../shared/types').DisplayPhrasePayload;

(() => {
  const vocab = window.vocab as MainVocabApi;

  // Apply the persisted theme synchronously, before the first paint, so the
  // window never flashes the wrong theme on launch.
  document.body.classList.toggle('dark', vocab.initialBackground === 'dark');

  const phraseContainer = document.getElementById('phrase-container') as HTMLElement;
  const sourceEl = document.getElementById('source') as HTMLElement;
  const targetEl = document.getElementById('target') as HTMLElement;
  const progressBarInner = document.getElementById('progress-bar-inner') as HTMLElement;
  const progressLabel = document.getElementById('progress-label') as HTMLElement;

  const PHRASE_SEPARATOR = ' - ';

  let isSoundMode = false;
  let fromLocale = 'de-DE';
  let toLocale = 'en-US';
  let revealTimeoutId: ReturnType<typeof setTimeout> | null = null;

  function clearRevealTimeout() {
    if (revealTimeoutId) {
      clearTimeout(revealTimeoutId);
      revealTimeoutId = null;
    }
  }

  function speak(text: string, locale: string) {
    if (isSoundMode && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      speechSynthesis.speak(utterance);
    }
  }

  // Splits "word - translation" on the first separator; the source word is
  // what the learner already knows, the target is the word being learned.
  function splitPhrase(phrase: string): [string, string] {
    const sepIndex = phrase.indexOf(PHRASE_SEPARATOR);
    if (sepIndex === -1) {
      return [phrase, ''];
    }
    return [phrase.slice(0, sepIndex), phrase.slice(sepIndex + PHRASE_SEPARATOR.length)];
  }

  function updateProgressBar(index: number, total: number) {
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

  function displayPhrase({ phrase, mode, index, total }: DisplayPhrasePayload) {
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

  vocab.onSetLanguages(({ fromLocale: from, toLocale: to }) => {
    fromLocale = from;
    toLocale = to;
  });

  vocab.onToggleSound(enabled => {
    isSoundMode = enabled;
  });

  vocab.onSetBackground(background => {
    document.body.classList.toggle('dark', background === 'dark');
  });

  vocab.onClearTimeouts(clearRevealTimeout);
  vocab.onDisplayPhrase(displayPhrase);

  document.addEventListener('keydown', event => {
    vocab.sendKeyPress({ shiftKey: event.shiftKey, key: event.key });
  });

  // Pause auto-advance while the pointer is over the window so the user can
  // read the current word; resume on leave.
  document.documentElement.addEventListener('mouseenter', () => vocab.setPaused(true));
  document.documentElement.addEventListener('mouseleave', () => vocab.setPaused(false));
})();
