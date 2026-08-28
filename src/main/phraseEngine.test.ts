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

function makeEngine(intervalMs = 1000) {
  rendered = [];
  return createPhraseEngine({
    intervalMs,
    onRender: (item, index, total) => rendered.push({ item, index, total })
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

  it('honours a stop() called from inside onRender', () => {
    const rendered2: Array<{ item: Item; index: number; total: number }> = [];
    const engine = createPhraseEngine({
      intervalMs: 1000,
      onRender: (item, index, total) => {
        rendered2.push({ item, index, total });
        if (index === 1) {
          engine.stop();
        }
      }
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
});
