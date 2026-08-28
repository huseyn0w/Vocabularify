import fs from 'fs';
import { buildItems } from '../shared/items';
import { nextIndex, prevIndex, clampIndex } from '../shared/phrases';
import { SENTENCE_DWELL_MULTIPLIER } from '../shared/constants';
import type { Item, LessonSpec } from '../shared/items';
import type { PhraseEngine, PhraseEngineOptions } from '../shared/types';

// Reads the lessons file sitting next to a dictionary, when there is one. A
// level with no course, and every imported custom dictionary, has none - those
// fall back to the flat word list the app has always shown. A malformed file
// degrades the same way instead of taking the window down.
function readLessons(dictionaryPath: string): LessonSpec[] | undefined {
  const lessonsPath = dictionaryPath.replace(/\.json$/, '.lessons.json');
  if (!fs.existsSync(lessonsPath)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
    return Array.isArray(parsed?.lessons) ? (parsed.lessons as LessonSpec[]) : undefined;
  } catch {
    return undefined;
  }
}

// Owns the loaded item list, the current position, and the auto-advance
// timer. It is surface-agnostic: it calls `onRender(item, index, total)`
// and lets the caller decide where the item is shown (window or tray).
export function createPhraseEngine({ intervalMs, onRender }: PhraseEngineOptions): PhraseEngine {
  let items: Item[] = [];
  let index = 0;
  let interval = intervalMs;
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Loads a dictionary and (re)starts cycling. `startIndex` lets a restored
  // position survive across dictionary switches; it is clamped to the new
  // list length. Throws on read/parse errors of the dictionary itself so the
  // caller can surface them.
  function load(filePath: string, startIndex = 0): void {
    const vocabulary = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    items = buildItems(vocabulary, readLessons(filePath));
    index = clampIndex(startIndex, items.length);
    render();
    restartTimer();
  }

  function render(): void {
    if (items.length > 0) {
      onRender(items[index], index, items.length);
    }
  }

  function next(): void {
    index = nextIndex(index, items.length);
    render();
  }

  function previous(): void {
    index = prevIndex(index, items.length);
    render();
  }

  function setIntervalMs(ms: number): void {
    interval = ms;
    restartTimer();
  }

  // How long the item on screen stays there. Because it depends on the item,
  // a fixed setInterval will not do: each tick schedules the next one.
  function currentDwell(): number {
    return items[index]?.kind === 'sentence' ? interval * SENTENCE_DWELL_MULTIPLIER : interval;
  }

  function restartTimer(): void {
    stop();
    if (items.length > 0) {
      timer = setTimeout(() => {
        next();
        restartTimer();
      }, currentDwell());
    }
  }

  function stop(): void {
    if (timer) {
      clearTimeout(timer);
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
    getCurrentItem: () => items[index]
  };
}
