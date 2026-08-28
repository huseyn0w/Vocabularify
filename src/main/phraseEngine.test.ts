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
});
