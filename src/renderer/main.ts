// NOTE: this script is loaded as a classic <script> in the browser context, so
// it must compile to a plain script with no module wrapper (no require/exports).
// We therefore avoid a top-level `import` (even `import type`, which would still
// flag the file as a module under this CommonJS tsconfig) and reach the shared
// types through inline `import("...")` type references, which are fully erased
// and keep the output a classic script. The body is wrapped in an IIFE so its
// declarations stay file-local (classic scripts share global scope otherwise).
type MainVocabApi = import('../shared/types').MainVocabApi;
type DisplayPhrasePayload = import('../shared/types').DisplayPhrasePayload;
type Item = import('../shared/types').DisplayPhrasePayload['item'];
type LaidOutToken = import('../shared/items').LaidOutToken;

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
  const sentenceTargetEl = document.getElementById('sentence-target') as HTMLElement;
  const sentenceSourceEl = document.getElementById('sentence-source') as HTMLElement;
  const glossEl = document.getElementById('gloss') as HTMLElement;

  let isSoundMode = false;
  let isAssembleMode = false;
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

  function displayWord(item: Extract<Item, { kind: 'word' }>, mode: string) {
    sourceEl.textContent = item.source;
    targetEl.textContent = item.target;

    if (mode === 'Checkup') {
      hideTarget();
      speak(item.source, fromLocale);
      revealTimeoutId = setTimeout(() => {
        revealTarget();
        speak(item.target, toLocale);
      }, 3000);
      return;
    }

    revealTarget();
    speak(item.source, fromLocale);
    revealTimeoutId = setTimeout(() => speak(item.target, toLocale), 2000);
  }

  type Gloss = { t: string; s: string };

  function hideGloss() {
    glossEl.classList.remove('visible');
  }

  // Sits above the token, clamped to the window. The card is only 460x240, so
  // a gloss near the top edge flips below the token instead of being cut off.
  function showGloss(anchor: HTMLElement, gloss: Gloss) {
    glossEl.textContent = '';
    const citation = document.createElement('span');
    citation.textContent = gloss.t;
    const translation = document.createElement('span');
    translation.className = 'gloss-source';
    translation.textContent = ` · ${gloss.s}`;
    glossEl.append(citation, translation);
    glossEl.classList.add('visible');

    const token = anchor.getBoundingClientRect();
    const box = glossEl.getBoundingClientRect();
    const left = Math.min(
      Math.max(4, token.left + token.width / 2 - box.width / 2),
      window.innerWidth - box.width - 4
    );
    const above = token.top - box.height - 6;
    glossEl.style.left = `${left}px`;
    glossEl.style.top = `${above < 4 ? token.bottom + 6 : above}px`;
  }

  // Rebuilding the children drops the old listeners with the old nodes, so
  // there is nothing to clean up between sentences.
  function renderTokens(layout: LaidOutToken[], gloss: Record<string, Gloss>) {
    sentenceTargetEl.textContent = '';
    for (const token of layout) {
      if (token.space) {
        sentenceTargetEl.append(' ');
      }
      const entry = token.concept ? gloss[token.concept] : undefined;
      if (!entry) {
        sentenceTargetEl.append(token.text);
        continue;
      }
      const span = document.createElement('span');
      span.className = 'tok';
      span.textContent = token.text;
      span.addEventListener('mouseenter', () => showGloss(span, entry));
      span.addEventListener('mouseleave', hideGloss);
      sentenceTargetEl.append(span);
    }
  }

  function joinLayout(layout: LaidOutToken[]): string {
    return layout.map(token => (token.space ? ` ${token.text}` : token.text)).join('');
  }

  const chipsEl = document.getElementById('chips') as HTMLElement;

  // Fisher-Yates. A fresh order every time the card appears, so a repeat of
  // the same sentence is not muscle memory.
  function shuffled<T>(values: T[]): T[] {
    const out = values.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function startAssemble(layout: LaidOutToken[], onSolved: () => void) {
    const answerable = layout.filter(token => token.concept !== null);
    let placed = 0;

    // Everything up to the next answerable token, so punctuation and articles
    // appear as soon as the word before them is in place.
    function visibleThrough(count: number): LaidOutToken[] {
      const out: LaidOutToken[] = [];
      let seen = 0;
      for (const token of layout) {
        if (token.concept !== null) {
          if (seen >= count) break;
          seen++;
        }
        out.push(token);
      }
      return out;
    }

    function paint() {
      sentenceTargetEl.textContent = joinLayout(visibleThrough(placed));
    }

    chipsEl.textContent = '';
    for (const token of shuffled(answerable)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = token.text;
      chip.addEventListener('click', () => {
        // Match on the surface form, not on identity: when two chips read the
        // same, either one is a fair answer.
        if (token.text !== answerable[placed].text) {
          chip.classList.remove('wrong');
          void chip.offsetWidth;
          chip.classList.add('wrong');
          return;
        }
        chip.classList.add('used');
        placed++;
        paint();
        if (placed === answerable.length) {
          onSolved();
        }
      });
      chipsEl.append(chip);
    }
    paint();
  }

  function displaySentence(
    item: Extract<Item, { kind: 'sentence' }>,
    layout: LaidOutToken[],
    mode: string
  ) {
    sentenceSourceEl.textContent = item.source;
    const text = joinLayout(layout);
    const canAssemble =
      isAssembleMode && mode !== 'Menu Bar' && layout.some(token => token.concept !== null);

    phraseContainer.classList.toggle('assemble', canAssemble);

    if (canAssemble) {
      // Auto-advance must not carry the learner past an unsolved exercise.
      vocab.setHold(true);
      sentenceTargetEl.classList.remove('hidden');
      startAssemble(layout, () => {
        vocab.setHold(false);
        renderTokens(layout, item.gloss);
        speak(text, toLocale);
      });
      return;
    }

    renderTokens(layout, item.gloss);

    if (mode === 'Checkup') {
      sentenceTargetEl.classList.add('hidden');
      revealTimeoutId = setTimeout(() => {
        sentenceTargetEl.classList.remove('hidden');
        speak(text, toLocale);
      }, 3000);
      return;
    }

    sentenceTargetEl.classList.remove('hidden');
    speak(text, toLocale);
  }

  function displayPhrase({ item, layout, mode, index, total }: DisplayPhrasePayload) {
    clearRevealTimeout();
    hideGloss();
    vocab.setHold(false);
    chipsEl.textContent = '';
    phraseContainer.classList.remove('assemble');
    updateProgressBar(index, total);
    replayEnterAnimation();
    phraseContainer.classList.toggle('sentence', item.kind === 'sentence');

    if (item.kind === 'sentence') {
      displaySentence(item, layout, mode);
    } else {
      displayWord(item, mode);
    }
  }

  vocab.onSetLanguages(({ fromLocale: from, toLocale: to }) => {
    fromLocale = from;
    toLocale = to;
  });

  vocab.onToggleSound(enabled => {
    isSoundMode = enabled;
  });

  vocab.onSetAssemble(enabled => {
    isAssembleMode = enabled;
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
