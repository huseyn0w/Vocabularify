import { describe, it, expect } from 'vitest';
import { joinTokens, layoutTokens, buildItems } from './items';
import type { LessonSpec, SentenceToken } from './items';
import type { VocabEntry } from './types';

describe('layoutTokens', () => {
  it('marks which tokens take a leading space and carries the concept id', () => {
    expect(
      layoutTokens([{ t: 'ich', c: 'i' }, { t: 'bin', c: 'to be' }, '.'])
    ).toEqual([
      { text: 'ich', concept: 'i', space: false },
      { text: 'bin', concept: 'to be', space: true },
      { text: '.', concept: null, space: false }
    ]);
  });

  it('marks glue with a null concept', () => {
    expect(layoutTokens(['der', { t: 'Mann', c: 'man' }])).toEqual([
      { text: 'der', concept: null, space: false },
      { text: 'Mann', concept: 'man', space: true }
    ]);
  });

  it('drops empty tokens instead of emitting an empty span', () => {
    expect(layoutTokens([{ t: 'a', c: 'x' }, '', { t: 'b', c: 'y' }])).toHaveLength(2);
  });

  it('skips a null token instead of throwing', () => {
    expect(
      layoutTokens([{ t: 'a', c: 'x' }, null as unknown as SentenceToken, { t: 'b', c: 'y' }])
    ).toEqual([
      { text: 'a', concept: 'x', space: false },
      { text: 'b', concept: 'y', space: true }
    ]);
  });

  it('skips a token object with no "t" instead of throwing', () => {
    expect(
      layoutTokens([
        { t: 'a', c: 'x' },
        { c: 'z' } as unknown as SentenceToken,
        { t: 'b', c: 'y' }
      ])
    ).toEqual([
      { text: 'a', concept: 'x', space: false },
      { text: 'b', concept: 'y', space: true }
    ]);
  });

  it('skips a non-string, non-object token instead of throwing', () => {
    expect(
      layoutTokens([{ t: 'a', c: 'x' }, 42 as unknown as SentenceToken, { t: 'b', c: 'y' }])
    ).toEqual([
      { text: 'a', concept: 'x', space: false },
      { text: 'b', concept: 'y', space: true }
    ]);
  });
});

describe('joinTokens', () => {
  it('separates words with a single space', () => {
    expect(joinTokens([{ t: 'ich', c: 'I' }, { t: 'bin', c: 'to be' }])).toBe('ich bin');
  });

  it('puts no space before closing punctuation', () => {
    expect(
      joinTokens([
        { t: 'Hallo', c: 'hello' }, ',',
        { t: 'ich', c: 'I' }, { t: 'bin', c: 'to be' }, { t: 'gut', c: 'good' }, '.'
      ])
    ).toBe('Hallo, ich bin gut.');
  });

  it('puts no space after an apostrophe elision', () => {
    expect(joinTokens(["l'", { t: 'économie', c: 'economy' }, '.'])).toBe("l'économie.");
  });

  it('puts no space after an opening bracket', () => {
    expect(joinTokens(['(', { t: 'ja', c: 'yes' }, ')'])).toBe('(ja)');
  });

  it('skips empty tokens rather than emitting a double space', () => {
    expect(joinTokens([{ t: 'a', c: 'x' }, '', { t: 'b', c: 'y' }])).toBe('a b');
  });

  it('returns an empty string for an empty list', () => {
    expect(joinTokens([])).toBe('');
  });

  it('skips a null token instead of throwing', () => {
    expect(
      joinTokens([{ t: 'a', c: 'x' }, null as unknown as SentenceToken, { t: 'b', c: 'y' }])
    ).toBe('a b');
  });

  it('skips a token object with no "t" instead of throwing', () => {
    expect(
      joinTokens([
        { t: 'a', c: 'x' },
        { c: 'z' } as unknown as SentenceToken,
        { t: 'b', c: 'y' }
      ])
    ).toBe('a b');
  });

  it('skips a non-string, non-object token instead of throwing', () => {
    expect(
      joinTokens([{ t: 'a', c: 'x' }, 42 as unknown as SentenceToken, { t: 'b', c: 'y' }])
    ).toBe('a b');
  });
});

const words: VocabEntry[] = [
  { word_1: 'привет', word_2: 'Hallo' },
  { word_1: 'я', word_2: 'ich' },
  { word_1: 'быть', word_2: 'sein' },
  { word_1: 'хорошо', word_2: 'gut' }
];

const lessons: LessonSpec[] = [
  { count: 2, sentences: [{ id: 's1', target: [{ t: 'Hallo', c: 'hello' }], source: 'Привет', gloss: {} }] },
  { count: 2, sentences: [{ id: 's2', target: [{ t: 'ich', c: 'I' }], source: 'я', gloss: {} }] }
];

describe('buildItems', () => {
  it('returns a flat word list when there are no lessons', () => {
    const items = buildItems(words);
    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({ kind: 'word', source: 'привет', target: 'Hallo' });
    expect(items.every(i => i.kind === 'word')).toBe(true);
  });

  it('interleaves each lesson\'s sentences after its words', () => {
    expect(buildItems(words, lessons).map(i => i.kind)).toEqual([
      'word', 'word', 'sentence', 'word', 'word', 'sentence'
    ]);
  });

  it('carries the sentence payload through', () => {
    const item = buildItems(words, lessons)[2];
    expect(item).toEqual({
      kind: 'sentence', id: 's1', source: 'Привет',
      target: [{ t: 'Hallo', c: 'hello' }], gloss: {}
    });
  });

  it('appends words the lessons do not cover, so a stale file hides nothing', () => {
    const short: LessonSpec[] = [{ count: 1, sentences: [] }];
    expect(buildItems(words, short).map(i => i.kind)).toEqual(['word', 'word', 'word', 'word']);
  });

  it('clamps a lesson that claims more words than remain', () => {
    const greedy: LessonSpec[] = [{ count: 99, sentences: [] }, { count: 5, sentences: [] }];
    const items = buildItems(words, greedy);
    expect(items).toHaveLength(4);
    expect(items.every(i => i !== undefined)).toBe(true);
  });

  it('handles an empty vocabulary', () => {
    expect(buildItems([], lessons).map(i => i.kind)).toEqual(['sentence', 'sentence']);
  });
});
