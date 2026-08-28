import fs from 'fs';
import { buildItems } from '../shared/items';
import { nextIndex, prevIndex, clampIndex } from '../shared/phrases';
import { SENTENCE_DWELL_MULTIPLIER } from '../shared/constants';
import type { Item, LessonSpec, SentenceSpec } from '../shared/items';
import type { PhraseEngine, PhraseEngineOptions } from '../shared/types';

// `buildItems` copies `target` and `gloss` straight through without
// inspecting them, so this only needs to check to the depth `buildItems`
// actually reads: that `target` is an array and `gloss` is a non-null,
// non-array object. `id` and `source` are read as plain values, so those get
// a type check. A `null` element (valid JSON) would otherwise reach
// `sentence.id` in `buildItems` and throw `TypeError: Cannot read properties
// of null`, out of `load()`.
function isValidSentenceSpec(value: unknown): value is SentenceSpec {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    Array.isArray(candidate.target) &&
    typeof candidate.source === 'string' &&
    typeof candidate.gloss === 'object' &&
    candidate.gloss !== null &&
    !Array.isArray(candidate.gloss)
  );
}

// `buildItems` trusts its `lessons` argument completely (it is a pure
// function over already-validated input), so this is the only place that may
// look at what a lessons file actually contains. A lesson missing `count` or
// `sentences` would otherwise reach `Math.min(lesson.count, ...)` as `NaN`
// and a `for...of` over `undefined`, throwing out of `load()`. An array is
// typeof 'object' and not null, so it would otherwise slip past by
// happening not to carry a `count` property; reject it explicitly instead.
function isValidLessonSpec(value: unknown): value is LessonSpec {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.count === 'number' &&
    Number.isInteger(candidate.count) &&
    candidate.count >= 0 &&
    Array.isArray(candidate.sentences) &&
    candidate.sentences.every(isValidSentenceSpec)
  );
}

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
    if (!Array.isArray(parsed?.lessons) || !parsed.lessons.every(isValidLessonSpec)) {
      return undefined;
    }
    return parsed.lessons as LessonSpec[];
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
  // Explicit intent, not timer-handle identity: both `render()` call sites -
  // the timeout callback's `next()`, and `load()` below - run `onRender`
  // synchronously, and a consumer may call `stop()` from there. `timer`
  // alone can't tell that apart from "never started" - by the time either
  // caller checks it, the handle has already fired or hasn't been set yet.
  let running = false;

  // Loads a dictionary and (re)starts cycling. `startIndex` lets a restored
  // position survive across dictionary switches; it is clamped to the new
  // list length. Throws on read/parse errors of the dictionary itself so the
  // caller can surface them.
  function load(filePath: string, startIndex = 0): void {
    const vocabulary = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    items = buildItems(vocabulary, readLessons(filePath));
    index = clampIndex(startIndex, items.length);
    // Tentatively mark ourselves running before the synchronous render, the
    // same way `restartTimer()` marks itself running before its own eventual
    // render: it is what lets a `stop()` called from inside `onRender` here
    // be observed below, instead of being clobbered by an unconditional
    // `restartTimer()`.
    running = items.length > 0;
    render();
    if (running) {
      restartTimer();
    }
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
      running = true;
      timer = setTimeout(() => {
        next();
        // `next()` -> `render()` -> `onRender` may have called `stop()`
        // synchronously; that clears `running`. Re-arming unconditionally
        // here would undo a stop requested from inside the render callback.
        if (running) {
          restartTimer();
        }
      }, currentDwell());
    }
  }

  function stop(): void {
    running = false;
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
