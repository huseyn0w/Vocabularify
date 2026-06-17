import fs from 'fs';
import { toPhrases, nextIndex, prevIndex, clampIndex } from '../shared/phrases';
import type { Phrase, PhraseEngine, PhraseEngineOptions } from '../shared/types';

// Owns the loaded phrase list, the current position, and the auto-advance
// timer. It is surface-agnostic: it calls `onRender(phrase, index, total)`
// and lets the caller decide where the phrase is shown (window or tray).
export function createPhraseEngine({ intervalMs, onRender }: PhraseEngineOptions): PhraseEngine {
  let phrases: Phrase[] = [];
  let index = 0;
  let interval = intervalMs;
  let timer: ReturnType<typeof setInterval> | null = null;

  // Loads vocabulary from a JSON file and (re)starts cycling. `startIndex`
  // lets a restored position survive across dictionary switches; it is
  // clamped to the new list length. Throws on read/parse errors so the
  // caller can surface them.
  function load(filePath: string, startIndex = 0): void {
    const vocabulary = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    phrases = toPhrases(vocabulary);
    index = clampIndex(startIndex, phrases.length);
    render();
    restartTimer();
  }

  function render(): void {
    if (phrases.length > 0) {
      onRender(phrases[index], index, phrases.length);
    }
  }

  function next(): void {
    index = nextIndex(index, phrases.length);
    render();
  }

  function previous(): void {
    index = prevIndex(index, phrases.length);
    render();
  }

  function setIntervalMs(ms: number): void {
    interval = ms;
    restartTimer();
  }

  function restartTimer(): void {
    stop();
    if (phrases.length > 0) {
      timer = setInterval(next, interval);
    }
  }

  function stop(): void {
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
