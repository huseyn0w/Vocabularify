import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createPhraseEngine } from './phraseEngine';
import { SENTENCE_DWELL_MULTIPLIER } from '../shared/constants';
import type { Item } from '../shared/items';

const WORDS = [
  { word_1: 'привет', word_2: 'Hallo' },
  { word_1: 'я', word_2: 'ich' },
  { word_1: 'быть', word_2: 'sein' },
  { word_1: 'хорошо', word_2: 'gut' }
];

const LESSONS = {
  lessons: [
    {
      count: 2,
      sentences: [
        { id: 'a1_001', target: [{ t: 'Hallo', c: 'hello' }], source: 'Привет', gloss: {} }
      ]
    },
    { count: 2, sentences: [] }
  ]
};

let dir: string;
let dictPath: string;
let lessonsPath: string;
let rendered: Array<{ item: Item; index: number; total: number }>;

function makeEngine(intervalMs = 1000, canAutoAdvance: () => boolean = () => true) {
  rendered = [];
  return createPhraseEngine({
    intervalMs,
    onRender: (item, index, total) => rendered.push({ item, index, total }),
    canAutoAdvance
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-engine-'));
  dictPath = path.join(dir, 'a1.json');
  lessonsPath = path.join(dir, 'a1.lessons.json');
  fs.writeFileSync(dictPath, JSON.stringify(WORDS));
});

afterEach(() => {
  vi.useRealTimers();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('createPhraseEngine', () => {
  it('shows a flat word list when there is no lessons file', () => {
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0]).toEqual({
      item: { kind: 'word', source: 'привет', target: 'Hallo' },
      index: 0,
      total: 4
    });
    engine.stop();
  });

  it('interleaves sentences when a lessons file sits beside the dictionary', () => {
    fs.writeFileSync(lessonsPath, JSON.stringify(LESSONS));
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(5);
    engine.next();
    engine.next();
    expect(rendered[2].item.kind).toBe('sentence');
    engine.stop();
  });

  it('holds a sentence for SENTENCE_DWELL_MULTIPLIER times the interval', () => {
    fs.writeFileSync(lessonsPath, JSON.stringify(LESSONS));
    const engine = makeEngine(1000);
    engine.load(dictPath);

    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);
    expect(rendered[rendered.length - 1].item.kind).toBe('sentence');

    // One plain interval is not enough to move past a sentence.
    vi.advanceTimersByTime(1000);
    expect(rendered[rendered.length - 1].item.kind).toBe('sentence');

    vi.advanceTimersByTime(1000 * SENTENCE_DWELL_MULTIPLIER - 1000);
    expect(rendered[rendered.length - 1].item.kind).toBe('word');
    engine.stop();
  });

  it('falls back to the flat list when the lessons file is malformed', () => {
    fs.writeFileSync(lessonsPath, '{ not json');
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(4);
    engine.stop();
  });

  it('falls back when the lessons file has no lessons array', () => {
    fs.writeFileSync(lessonsPath, JSON.stringify({ nope: true }));
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(4);
    engine.stop();
  });

  it('clamps a restored index past the end of the list', () => {
    const engine = makeEngine();
    engine.load(dictPath, 99);
    expect(engine.getIndex()).toBe(3);
    engine.stop();
  });

  it('stops cleanly, leaving no timer to fire', () => {
    const engine = makeEngine();
    engine.load(dictPath);
    const before = rendered.length;
    engine.stop();
    vi.advanceTimersByTime(60000);
    expect(rendered.length).toBe(before);
  });

  it('throws out of load() when the dictionary file is missing', () => {
    const engine = makeEngine();
    expect(() => engine.load(path.join(dir, 'does-not-exist.json'))).toThrow();
  });

  it('throws out of load() when the dictionary file is not valid JSON', () => {
    fs.writeFileSync(dictPath, '{ not json');
    const engine = makeEngine();
    expect(() => engine.load(dictPath)).toThrow();
  });

  it('falls back to the flat list when a lesson element is not an object', () => {
    fs.writeFileSync(lessonsPath, JSON.stringify({ lessons: ['x'] }));
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(4);
    engine.stop();
  });

  it('falls back to the flat list when a lesson element is missing count', () => {
    fs.writeFileSync(lessonsPath, JSON.stringify({ lessons: [{ sentences: [] }] }));
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(4);
    engine.stop();
  });

  it('falls back to the flat list when a lesson element is missing sentences', () => {
    fs.writeFileSync(lessonsPath, JSON.stringify({ lessons: [{ count: 2 }] }));
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(4);
    engine.stop();
  });

  it('falls back to the flat list when a sentence element is null', () => {
    fs.writeFileSync(
      lessonsPath,
      JSON.stringify({ lessons: [{ count: 2, sentences: [null] }] })
    );
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(4);
    engine.stop();
  });

  it('falls back to the flat list when a sentence element is missing id', () => {
    fs.writeFileSync(
      lessonsPath,
      JSON.stringify({
        lessons: [
          {
            count: 2,
            sentences: [{ target: [{ t: 'Hallo', c: 'hello' }], source: 'Привет', gloss: {} }]
          }
        ]
      })
    );
    const engine = makeEngine();
    engine.load(dictPath);
    expect(rendered[0].total).toBe(4);
    engine.stop();
  });

  it('honours a stop() called from inside the first onRender that load() triggers', () => {
    const rendered3: Array<{ item: Item; index: number; total: number }> = [];
    const engine = createPhraseEngine({
      intervalMs: 1000,
      onRender: (item, index, total) => {
        rendered3.push({ item, index, total });
        if (index === 0) {
          engine.stop();
        }
      },
      canAutoAdvance: () => true
    });
    // load() renders index 0 synchronously; onRender stops it right there.
    engine.load(dictPath);
    expect(rendered3.length).toBe(1);

    // Well past several further dwells: if the stop were undone by the
    // unconditional restartTimer() that used to follow load()'s render,
    // more items would have rendered by now.
    vi.advanceTimersByTime(1000 * 10);
    expect(rendered3.length).toBe(1);

    // The hover-pause resume path: an explicit restartTimer() after a
    // stop() must still arm the timer.
    engine.restartTimer();
    vi.advanceTimersByTime(1000);
    expect(rendered3.length).toBe(2);
    expect(rendered3[1].index).toBe(1);
    engine.stop();
  });

  it('honours a stop() called from inside onRender', () => {
    const rendered2: Array<{ item: Item; index: number; total: number }> = [];
    const engine = createPhraseEngine({
      intervalMs: 1000,
      onRender: (item, index, total) => {
        rendered2.push({ item, index, total });
        if (index === 1) {
          engine.stop();
        }
      },
      canAutoAdvance: () => true
    });
    engine.load(dictPath);
    // The first auto-advance takes index 0 -> 1, whose onRender calls stop().
    vi.advanceTimersByTime(1000);
    expect(rendered2.length).toBe(2);
    // Well past several further dwells: if the stop were undone, more items
    // would have rendered by now.
    vi.advanceTimersByTime(1000 * 10);
    expect(rendered2.length).toBe(2);
  });

  it('previous() moves back one item, wrapping at the start', () => {
    const engine = makeEngine();
    engine.load(dictPath);
    engine.previous();
    expect(engine.getIndex()).toBe(3);
    engine.stop();
  });

  it('setIntervalMs() changes the dwell used by the next auto-advance', () => {
    const engine = makeEngine(1000);
    engine.load(dictPath);
    engine.setIntervalMs(5000);
    vi.advanceTimersByTime(1000);
    expect(engine.getIndex()).toBe(0);
    vi.advanceTimersByTime(4000);
    expect(engine.getIndex()).toBe(1);
    engine.stop();
  });

  describe('the canAutoAdvance predicate', () => {
    it('does not arm the timer on load() when the predicate is false', () => {
      const engine = makeEngine(1000, () => false);
      engine.load(dictPath);
      const before = rendered.length;
      vi.advanceTimersByTime(60000);
      expect(rendered.length).toBe(before);
      engine.stop();
    });

    it('does not arm the timer on setIntervalMs() when the predicate is false', () => {
      let allowed = true;
      const engine = makeEngine(1000, () => allowed);
      engine.load(dictPath);
      allowed = false;
      engine.setIntervalMs(500);
      const before = rendered.length;
      vi.advanceTimersByTime(60000);
      expect(rendered.length).toBe(before);
      engine.stop();
    });

    it('does not arm the timer on an explicit restartTimer() call when the predicate is false', () => {
      let allowed = true;
      const engine = makeEngine(1000, () => allowed);
      engine.load(dictPath);
      allowed = false;
      engine.restartTimer();
      const before = rendered.length;
      vi.advanceTimersByTime(60000);
      expect(rendered.length).toBe(before);
      engine.stop();
    });

    it('does not re-arm from the timeout callback once the predicate has flipped false', () => {
      let allowed = true;
      const engine = makeEngine(1000, () => allowed);
      engine.load(dictPath);
      // The first timer was armed while `allowed` was still true. Flip it
      // false before that timer fires: the callback's own re-arm attempt
      // (inside restartTimer(), after next()) must see the new value.
      allowed = false;
      vi.advanceTimersByTime(1000);
      expect(engine.getIndex()).toBe(1);
      const afterOneTick = rendered.length;
      vi.advanceTimersByTime(60000);
      expect(rendered.length).toBe(afterOneTick);
      engine.stop();
    });

    it('resumes when the predicate flips from false to true and restartTimer() is called', () => {
      let allowed = false;
      const engine = makeEngine(1000, () => allowed);
      engine.load(dictPath);
      const before = rendered.length;
      vi.advanceTimersByTime(5000);
      expect(rendered.length).toBe(before);
      allowed = true;
      engine.restartTimer();
      vi.advanceTimersByTime(1000);
      expect(rendered.length).toBe(before + 1);
      engine.stop();
    });

    it('is consulted at arm time, not captured once at construction', () => {
      let allowed = true;
      const engine = makeEngine(1000, () => allowed);
      engine.load(dictPath);
      // Flip after construction/load, before anything re-evaluates: a
      // predicate captured only once at construction would still see `true`.
      allowed = false;
      engine.restartTimer();
      const before = rendered.length;
      vi.advanceTimersByTime(60000);
      expect(rendered.length).toBe(before);
      // Flip back: a fresh call must see the new value too.
      allowed = true;
      engine.restartTimer();
      vi.advanceTimersByTime(1000);
      expect(rendered.length).toBe(before + 1);
      engine.stop();
    });
  });

  describe('hasLoaded()', () => {
    it('reports no meaningful index before the first load(), and a real one after', () => {
      const engine = makeEngine();
      expect(engine.hasLoaded()).toBe(false);
      engine.load(dictPath, 2);
      expect(engine.hasLoaded()).toBe(true);
      expect(engine.getIndex()).toBe(2);
      engine.stop();
    });
  });
});
