# Lessons and Sentences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the vocabulary into lessons of 5-10 words and, after each lesson, show 2-3 sentences built only from concepts already covered.

**Architecture:** A new `_course/` layer in the language data describes lesson order and a tokenised sentence bank across all 7 languages. `utils/generate_pairs.js` projects it into per-pair `<level>.lessons.json` files alongside the existing word files. `phraseEngine` reads both and produces one interleaved list of items; the index cursor, timer and progress bar work exactly as before. A sentence card renders tokens that link back to their bank entry. An opt-in assemble exercise reuses the same card.

**Tech Stack:** Electron 42, TypeScript 5 strict, plain `tsc` to `out/`, Vitest, Node 22, Yarn.

Spec: `docs/superpowers/specs/2026-08-28-vocabularify-lessons-design.md`

## Global Constraints

- Node 22 (LTS), Yarn. Electron 42, electron-builder 26, TypeScript 5 with `strict: true`.
- `src/shared/` must stay Electron-free. It is unit-tested with Vitest and imported by renderers via `import type`.
- Files under `src/renderer/` compile to **classic scripts**. Never add a top-level `import` or `require` to one, not even `import type` - it flags the file as a module and breaks it at load. Use inline `import("../shared/types").Foo` type references, wrapped in an IIFE. See the header comment of `src/renderer/main.ts`.
- Every new persisted field on `AppState` MUST be handled in `normalizeState` (`src/shared/state.ts`). `saveState` re-normalises before writing, so an unhandled field is silently dropped on save.
- All IPC channel names live in `src/shared/constants.ts` under `IPC`. Never inline a channel string.
- Every window runs `contextIsolation: true`, `nodeIntegration: false`. Renderers reach main only through the `window.vocab` API their preload exposes.
- Pair files `languages/<to>/<from>/<level>.json` are **generated**. Never hand-edit them. Edit `languages/_bank/` or `languages/_course/` and regenerate.
- In pair files `word_1` is the **known** language and `word_2` the language being **learned**. Verify with `languages/en/ru/a1.json`, which starts `{"word_1": "и", "word_2": "and"}`. The mobile app's `app/utils/types.ts` documents the opposite; that comment is wrong.
- `utils/*.js` that need shared logic require the **compiled** `out/shared/*.js`. Run `yarn compile` before running them.
- No points, streaks, badges or confetti. `PRODUCT.md` lists gamified language apps as an anti-reference.
- Design tokens are OKLCH custom properties defined in each HTML file's `<style>` block. Reuse `--ink`, `--muted`, `--accent`, `--hairline`, `--bg-elev`, `--ease-out`. Never hardcode a colour.
- Every animation needs a `@media (prefers-reduced-motion: reduce)` fallback, matching the existing block in `index.html`.
- Commits: no `Co-Authored-By` trailer, no Claude attribution.

## File Structure

**Created**

| Path | Responsibility |
|---|---|
| `src/shared/items.ts` | The display item model. `SentenceToken`, `LaidOutToken`, `Item`, `LessonSpec`, `layoutTokens`, `joinTokens`, `buildItems`. Pure. |
| `src/shared/items.test.ts` | Unit tests for the above. |
| `src/shared/course.ts` | Authoring-time model. Course/sentence-bank types, the per-language glue whitelist, `validateCourse`. Pure. Not loaded by the app at runtime, only by the lint CLI. |
| `src/shared/course.test.ts` | Unit tests for `validateCourse`. |
| `utils/validate_course.js` | Thin CLI over `out/shared/course.js`. What content agents run to check their work. |
| `languages/_course/<level>.json` | Lesson order for a level. |
| `languages/_course/<level>.sentences.json` | Sentence bank for a level, all 7 languages. |
| `languages/<to>/<from>/<level>.lessons.json` | Generated. Per-pair lesson sizes, sentences and glosses. |

**Modified**

| Path | Change |
|---|---|
| `src/shared/types.ts` | `AppState.progress`, `DisplayPhrasePayload` carries an `Item`, `MainVocabApi.onSetHold`. |
| `src/shared/state.ts` | `progressKey`, `progress` in `DEFAULT_STATE` and `normalizeState`, one-time migration from `currentIndex`. |
| `src/shared/constants.ts` | `SENTENCE_DWELL_MULTIPLIER`, `IPC.SET_HOLD`, `IPC.SET_ASSEMBLE`. |
| `src/main/phraseEngine.ts` | Holds `Item[]`, reads the sibling lessons file, per-item dwell. |
| `src/index.ts` | `renderPhrase` takes an `Item`, keyed progress, hold flag. |
| `src/preload/main.ts` | New payload shape, `sendHold`. |
| `src/renderer/main.ts` | Sentence card, token tooltips, assemble exercise. |
| `src/renderer/settings.ts`, `settings.html`, `src/preload/settings.ts` | Assemble toggle in the Playback panel. |
| `index.html` | Sentence card markup and styles. |
| `utils/generate_pairs.js` | Course ordering, writes `<level>.lessons.json`. |
| `languages/_bank/a1.json` | Concepts the A1 course needs and the bank lacks. |
| `CLAUDE.md` | Document `_course/`, the lessons file and the item model. |

## Why the lessons file is written by `generate_pairs.js`

`generate_pairs.js` drops a concept from a pair when its **target** word collides with one already emitted (the `seenW2` set, line 64). The bank has `she -> sie` and `they -> sie`, so for any `de/*` pair one of those concepts never reaches the word file.

That means a lesson's word count is **per pair**, not global. It has to be computed in the same pass as the dedupe or the two will drift and lesson boundaries will land in the wrong place. So one script writes both files.

A sentence may use a concept that was dropped for this pair. That is fine and needs no handling: the concept was dropped precisely because its target word is identical to one the learner has already seen as a card.

---

### Task 1: `layoutTokens` and `joinTokens`

Turning a token list into text is the one rule three places apply: the lint, the data generator, and the renderer drawing one span per token. Two copies would drift, and a drifted copy produces sentences that pass the lint and render wrong.

The renderer cannot import shared modules - files under `src/renderer/` compile to classic scripts. So the rule is split. `layoutTokens` resolves spacing into data, `joinTokens` is the string form built on top of it, and the main process hands the renderer an already laid-out list. The renderer never applies the rule, it only concatenates.

**Files:**
- Create: `src/shared/items.ts`
- Test: `src/shared/items.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type SentenceToken = string | { t: string; c: string }`, `interface LaidOutToken`, `layoutTokens(tokens: SentenceToken[]): LaidOutToken[]`, `joinTokens(tokens: SentenceToken[]): string`.

- [ ] **Step 1: Write the failing test**

Create `src/shared/items.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { joinTokens, layoutTokens } from './items';

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
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `yarn test src/shared/items.test.ts`
Expected: FAIL, `Failed to resolve import "./items"`.

- [ ] **Step 3: Write the implementation**

Create `src/shared/items.ts`:

```ts
// The display item model. Framework-free and unit-tested, like the rest of
// `src/shared`: the renderer, the main process and the offline data tooling
// all agree on these shapes.

/** One piece of a sentence. An object is a word backed by a learned concept:
 *  `t` is the surface form exactly as it appears (capitalisation included, so
 *  a sentence-initial token differs from its bank entry by case) and `c` is
 *  the concept id. A bare string is glue - punctuation, or an obligatory
 *  function word such as an article. */
export type SentenceToken = string | { t: string; c: string };

// A sentence has no separate plain-text field: joining its tokens IS the
// sentence. So the join rule has exactly one implementation, here. The
// renderer imports it; `utils/*.js` require the compiled `out/shared/items.js`.
const NO_SPACE_BEFORE = /^[,.!?;:)\]}»…]/;
const NO_SPACE_AFTER = /[([{«'’]$/;

/** A token with its spacing already decided. The main process sends these to
 *  the renderer, which draws one element per token and prepends a space when
 *  `space` is set - so the join rule never needs a second implementation in a
 *  file that cannot import this one. */
export interface LaidOutToken {
  text: string;
  /** The concept id when this token is a learned word, null for glue. */
  concept: string | null;
  /** Whether a space goes in front of this token. */
  space: boolean;
}

export function layoutTokens(tokens: SentenceToken[]): LaidOutToken[] {
  const out: LaidOutToken[] = [];
  let previous = '';
  for (const token of tokens) {
    const text = typeof token === 'string' ? token : token.t;
    if (!text) {
      continue;
    }
    const space =
      previous !== '' && !NO_SPACE_BEFORE.test(text) && !NO_SPACE_AFTER.test(previous);
    out.push({ text, concept: typeof token === 'string' ? null : token.c, space });
    previous = text;
  }
  return out;
}

export function joinTokens(tokens: SentenceToken[]): string {
  return layoutTokens(tokens)
    .map(token => (token.space ? ` ${token.text}` : token.text))
    .join('');
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `yarn test src/shared/items.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/shared/items.ts src/shared/items.test.ts
git commit -m "feat(shared): layoutTokens and joinTokens, one sentence join rule"
```

---

### Task 2: `buildItems`

**Files:**
- Modify: `src/shared/items.ts`
- Test: `src/shared/items.test.ts`

**Interfaces:**
- Consumes: `SentenceToken` from Task 1, `VocabEntry` from `src/shared/types.ts`.
- Produces: `SentenceGloss`, `SentenceSpec`, `LessonSpec`, `LessonsFile`, `Item`, `buildItems(vocabulary: VocabEntry[], lessons?: LessonSpec[]): Item[]`.

- [ ] **Step 1: Write the failing test**

Append to `src/shared/items.test.ts`:

```ts
import { buildItems } from './items';
import type { LessonSpec } from './items';
import type { VocabEntry } from './types';

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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `yarn test src/shared/items.test.ts`
Expected: FAIL, `buildItems is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/shared/items.ts`:

```ts
import type { VocabEntry } from './types';

/** The citation form of a concept plus its translation, so the renderer can
 *  show what a conjugated or declined token came from without loading the
 *  bank: `bin` -> `sein` / `быть`. */
export interface SentenceGloss {
  /** Citation form in the language being learned. */
  t: string;
  /** Its translation in the known language. */
  s: string;
}

export interface SentenceSpec {
  id: string;
  /** Tokens in the language being learned. */
  target: SentenceToken[];
  /** The whole sentence in the known language, already joined. */
  source: string;
  /** Keyed by concept id; only the concepts this sentence uses. */
  gloss: Record<string, SentenceGloss>;
}

export interface LessonSpec {
  /** How many words of the word file belong to this lesson. Per pair: a
   *  concept can be dropped when its target word collides with an earlier
   *  one, so this is not simply the number of concepts in the lesson. */
  count: number;
  sentences: SentenceSpec[];
}

export interface LessonsFile {
  lessons: LessonSpec[];
}

export type Item =
  | { kind: 'word'; source: string; target: string }
  | {
      kind: 'sentence';
      id: string;
      source: string;
      target: SentenceToken[];
      gloss: Record<string, SentenceGloss>;
    };

// Produces the list the engine cycles through. Without `lessons` this is the
// flat word list the app has always shown, so a level with no course file and
// an imported custom dictionary both keep working unchanged.
export function buildItems(vocabulary: VocabEntry[], lessons?: LessonSpec[]): Item[] {
  const words: Item[] = vocabulary.map(entry => ({
    kind: 'word',
    source: entry.word_1,
    target: entry.word_2
  }));

  if (!lessons || lessons.length === 0) {
    return words;
  }

  const items: Item[] = [];
  let cursor = 0;
  for (const lesson of lessons) {
    const take = Math.max(0, Math.min(lesson.count, words.length - cursor));
    items.push(...words.slice(cursor, cursor + take));
    cursor += take;
    for (const sentence of lesson.sentences) {
      items.push({
        kind: 'sentence',
        id: sentence.id,
        source: sentence.source,
        target: sentence.target,
        gloss: sentence.gloss
      });
    }
  }

  // A lessons file that covers fewer words than the dictionary must never
  // hide the rest, so the remainder is appended.
  if (cursor < words.length) {
    items.push(...words.slice(cursor));
  }
  return items;
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `yarn test src/shared/items.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
yarn typecheck
git add src/shared/items.ts src/shared/items.test.ts
git commit -m "feat(shared): buildItems interleaves lesson words and sentences"
```

---

### Task 3: `validateCourse`

The lint is the feedback loop the content agents run against their own output, so its messages have to name the file, the sentence and the fix. It is also the only thing standing between a plausible-looking sentence and a shipped one.

**Concept ids are lowercase.** The id is `conceptId(row.en)` = the English column trimmed and lowercased, which is exactly the key `generate_pairs.js` has always deduped on. So the bank row `{"en": "I", ...}` has the id `"i"`, and `{"en": "to be", ...}` has `"to be"`. Course and sentence files use those lowercase ids everywhere.

**Files:**
- Create: `src/shared/course.ts`
- Test: `src/shared/course.test.ts`

**Interfaces:**
- Consumes: `SentenceToken`, `joinTokens` from `src/shared/items.ts`.
- Produces: `BankRow`, `CourseLesson`, `CourseFile`, `SentenceEntry`, `GLUE`, `MIN_LESSON_SIZE`, `MAX_LESSON_SIZE`, `conceptId(word: string): string`, `dedupeBank(levels, rowsByLevel): Record<string, BankRow[]>`, `validateCourse(input: ValidateInput): string[]`.

- [ ] **Step 1: Write the failing test**

Create `src/shared/course.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { conceptId, dedupeBank, validateCourse } from './course';
import type { CourseFile, SentenceEntry } from './course';

const LANGS = ['en', 'de', 'ru'] as const;

// A minimal but valid course: one lesson of five concepts and one sentence
// that uses four of them, including one introduced by that very lesson.
function fixture() {
  const course: CourseFile = {
    level: 'a1',
    lessons: [{ id: 1, new: ['hello', 'i', 'to be', 'good', 'day'], sentences: ['a1_001'] }]
  };
  const sentences: SentenceEntry[] = [
    {
      id: 'a1_001',
      uses: ['hello', 'i', 'to be', 'good'],
      text: {
        en: [{ t: 'Hello', c: 'hello' }, ',', { t: 'I', c: 'i' }, { t: 'am', c: 'to be' }, { t: 'good', c: 'good' }, '.'],
        de: [{ t: 'Hallo', c: 'hello' }, ',', { t: 'ich', c: 'i' }, { t: 'bin', c: 'to be' }, { t: 'gut', c: 'good' }, '.'],
        ru: [{ t: 'Привет', c: 'hello' }, ',', { t: 'я', c: 'i' }, { t: 'хорошо', c: 'good' }, '.']
      }
    }
  ];
  return {
    course,
    sentences,
    levelConcepts: ['hello', 'i', 'to be', 'good', 'day'],
    priorConcepts: [] as string[],
    languages: LANGS
  };
}

describe('conceptId', () => {
  it('trims and lowercases, matching the generate_pairs dedupe key', () => {
    expect(conceptId(' I ')).toBe('i');
    expect(conceptId('To Be')).toBe('to be');
  });
});

describe('dedupeBank', () => {
  it('keeps a concept at the lowest level it appears in', () => {
    const out = dedupeBank(['a1', 'a2'], {
      a1: [{ en: 'and', de: 'und' }],
      a2: [{ en: 'and', de: 'und' }, { en: 'or', de: 'oder' }]
    });
    expect(out.a1.map(r => r.en)).toEqual(['and']);
    expect(out.a2.map(r => r.en)).toEqual(['or']);
  });
});

describe('validateCourse', () => {
  it('accepts a well-formed course', () => {
    expect(validateCourse(fixture())).toEqual([]);
  });

  it('reports a bank concept that no lesson introduces', () => {
    const f = fixture();
    f.levelConcepts = [...f.levelConcepts, 'water'];
    expect(validateCourse(f).join('\n')).toContain('"water" is in the bank but in no lesson');
  });

  it('reports a concept introduced twice', () => {
    const f = fixture();
    f.course.lessons.push({ id: 2, new: ['hello'], sentences: [] });
    expect(validateCourse(f).join('\n')).toContain('already introduced in lesson 1');
  });

  it('reports a sentence that uses a concept taught later', () => {
    const f = fixture();
    f.course.lessons[0].new = ['hello', 'i', 'good', 'day', 'water'];
    f.levelConcepts = ['hello', 'i', 'good', 'day', 'water', 'to be'];
    f.course.lessons.push({ id: 2, new: ['to be'], sentences: [] });
    expect(validateCourse(f).join('\n')).toContain('not taught by the end of lesson 1');
  });

  it('reports a sentence that reinforces nothing from its own lesson', () => {
    const f = fixture();
    f.priorConcepts = ['hello', 'i', 'to be', 'good'];
    f.course.lessons[0].new = ['day', 'water', 'house', 'friend', 'city'];
    f.levelConcepts = ['day', 'water', 'house', 'friend', 'city'];
    expect(validateCourse(f).join('\n')).toContain('reinforces nothing');
  });

  it('reports a loose glue word that is not whitelisted', () => {
    const f = fixture();
    f.sentences[0].text.de.splice(2, 0, 'sehr');
    expect(validateCourse(f).join('\n')).toContain('"sehr" is loose glue');
  });

  it('accepts an article as glue', () => {
    const f = fixture();
    f.sentences[0].text.de.splice(2, 0, 'der');
    expect(validateCourse(f)).toEqual([]);
  });

  it('accepts punctuation as glue', () => {
    const f = fixture();
    f.sentences[0].text.de.push('!');
    expect(validateCourse(f)).toEqual([]);
  });

  it('reports a token claiming a concept absent from uses', () => {
    const f = fixture();
    f.sentences[0].text.de[4] = { t: 'bin', c: 'day' };
    expect(validateCourse(f).join('\n')).toContain('which is not in uses');
  });

  it('reports a concept in uses that appears in no language', () => {
    const f = fixture();
    f.sentences[0].uses.push('day');
    expect(validateCourse(f).join('\n')).toContain('"day" is in uses but appears in no language');
  });

  it('reports a missing language', () => {
    const f = fixture();
    delete (f.sentences[0].text as Record<string, unknown>).ru;
    expect(validateCourse(f).join('\n')).toContain('missing or empty text for "ru"');
  });

  it('reports a sentence in the bank that no lesson references', () => {
    const f = fixture();
    f.sentences.push({ ...f.sentences[0], id: 'a1_002' });
    expect(validateCourse(f).join('\n')).toContain('"a1_002" is in the bank but no lesson uses it');
  });

  it('reports a lesson that is too large', () => {
    const f = fixture();
    f.course.lessons[0].new = Array.from({ length: 11 }, (_, i) => `c${i}`);
    f.levelConcepts = f.course.lessons[0].new;
    expect(validateCourse(f).join('\n')).toContain('11 concepts, expected 5-10');
  });

  it('reports a token with stray whitespace', () => {
    const f = fixture();
    f.sentences[0].text.de[2] = { t: ' ich', c: 'i' };
    expect(validateCourse(f).join('\n')).toContain('stray whitespace');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `yarn test src/shared/course.test.ts`
Expected: FAIL, `Failed to resolve import "./course"`.

- [ ] **Step 3: Write the implementation**

Create `src/shared/course.ts`:

```ts
// Authoring-time model for languages/_course/. Nothing here is loaded by the
// running app: the app reads the generated per-pair lessons files. This module
// exists so the lint and the generator agree on one definition of a valid
// course, and so both are unit-testable in plain Node.
import { joinTokens } from './items';
import type { SentenceToken } from './items';

/** One concept in every language: { en, de, fr, es, it, tr, ru }. */
export interface BankRow {
  readonly [lang: string]: string;
}

export interface CourseLesson {
  id: number;
  /** Concept ids introduced by this lesson, in the order they are shown. */
  new: string[];
  /** Sentence ids shown after this lesson's words. */
  sentences: string[];
}

export interface CourseFile {
  level: string;
  lessons: CourseLesson[];
}

export interface SentenceEntry {
  id: string;
  /** Every concept the sentence leans on, unioned across all languages. */
  uses: string[];
  /** Tokens per language code. */
  text: Record<string, SentenceToken[]>;
}

export interface ValidateInput {
  course: CourseFile;
  sentences: SentenceEntry[];
  /** Concept ids belonging to this level, after the lowest-level dedupe. */
  levelConcepts: string[];
  /** Concept ids from every earlier level. Known before this level starts. */
  priorConcepts: string[];
  languages: readonly string[];
}

export const MIN_LESSON_SIZE = 5;
export const MAX_LESSON_SIZE = 10;

// Words allowed to appear in a sentence without being a taught concept.
// Articles and their preposition fusions only, because a learner meets those
// through the citation form of every noun. Everything else - prepositions,
// adverbs, particles - has to be taught first. Widening this list is a
// deliberate act: each entry is a word the learner will see without ever
// having been shown it.
export const GLUE: Readonly<Record<string, readonly string[]>> = {
  en: ['a', 'an', 'the'],
  de: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem',
       'einer', 'eines', 'im', 'am', 'zum', 'zur', 'ins', 'vom', 'beim'],
  fr: ['le', 'la', 'les', "l'", 'un', 'une', 'des', 'du', 'de', "d'", 'au', 'aux'],
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'del'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'un', 'uno', 'una', "un'",
       'al', 'del', 'nel', 'alla', 'della', 'nella'],
  tr: ['bir'],
  ru: []
};

const PUNCTUATION_ONLY = /^[\p{P}\p{S}]+$/u;

/** The concept id: the English column, trimmed and lowercased. This is the
 *  key `generate_pairs.js` has always deduped on, so reusing it means no
 *  second identity scheme to keep in sync. */
export function conceptId(word: string): string {
  return String(word ?? '').trim().toLowerCase();
}

/** Keeps each concept at the lowest level it appears in. */
export function dedupeBank(
  levels: readonly string[],
  rowsByLevel: Record<string, BankRow[]>
): Record<string, BankRow[]> {
  const seen = new Set<string>();
  const out: Record<string, BankRow[]> = {};
  for (const level of levels) {
    out[level] = [];
    for (const row of rowsByLevel[level] ?? []) {
      const id = conceptId(row.en);
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      out[level].push(row);
    }
  }
  return out;
}

function isGlue(token: string, lang: string): boolean {
  const trimmed = token.trim();
  if (PUNCTUATION_ONLY.test(trimmed)) {
    return true;
  }
  return (GLUE[lang] ?? []).includes(trimmed.toLowerCase());
}

export function validateCourse(input: ValidateInput): string[] {
  const { course, sentences, levelConcepts, priorConcepts, languages } = input;
  const errors: string[] = [];
  const levelSet = new Set(levelConcepts);

  // Every concept of the level is introduced exactly once, and nothing foreign
  // is introduced.
  const introducedIn = new Map<string, number>();
  for (const lesson of course.lessons) {
    for (const concept of lesson.new) {
      const first = introducedIn.get(concept);
      if (first !== undefined) {
        errors.push(`lesson ${lesson.id}: "${concept}" already introduced in lesson ${first}`);
        continue;
      }
      introducedIn.set(concept, lesson.id);
      if (!levelSet.has(concept)) {
        errors.push(`lesson ${lesson.id}: "${concept}" is not in this level's bank`);
      }
    }
  }
  for (const concept of levelConcepts) {
    if (!introducedIn.has(concept)) {
      errors.push(`"${concept}" is in the bank but in no lesson`);
    }
  }

  // Lesson size. The last lesson may be short because the level ran out.
  course.lessons.forEach((lesson, i) => {
    const size = lesson.new.length;
    const isLast = i === course.lessons.length - 1;
    const tooSmall = isLast ? size < 1 : size < MIN_LESSON_SIZE;
    if (tooSmall || size > MAX_LESSON_SIZE) {
      errors.push(
        `lesson ${lesson.id}: ${size} concepts, expected ${MIN_LESSON_SIZE}-${MAX_LESSON_SIZE}` +
          (isLast ? ' (the last lesson may be smaller)' : '')
      );
    }
  });

  // Sentence references resolve, and every sentence is used exactly once.
  const byId = new Map(sentences.map(s => [s.id, s]));
  const usedBy = new Map<string, number>();
  for (const lesson of course.lessons) {
    for (const id of lesson.sentences) {
      const first = usedBy.get(id);
      if (first !== undefined) {
        errors.push(`lesson ${lesson.id}: sentence "${id}" already used by lesson ${first}`);
        continue;
      }
      usedBy.set(id, lesson.id);
      if (!byId.has(id)) {
        errors.push(`lesson ${lesson.id}: sentence "${id}" is not in the sentence bank`);
      }
    }
  }
  for (const sentence of sentences) {
    if (!usedBy.has(sentence.id)) {
      errors.push(`sentence "${sentence.id}" is in the bank but no lesson uses it`);
    }
  }

  // Walk the course in order so each sentence is checked against the pool of
  // concepts the learner actually has at that point.
  const known = new Set(priorConcepts);
  for (const lesson of course.lessons) {
    for (const concept of lesson.new) {
      known.add(concept);
    }
    const introduced = new Set(lesson.new);
    for (const id of lesson.sentences) {
      const sentence = byId.get(id);
      if (sentence) {
        errors.push(...checkSentence(sentence, lesson.id, known, introduced, languages));
      }
    }
  }

  return errors;
}

function checkSentence(
  sentence: SentenceEntry,
  lessonId: number,
  known: ReadonlySet<string>,
  introduced: ReadonlySet<string>,
  languages: readonly string[]
): string[] {
  const errors: string[] = [];
  const uses = new Set(sentence.uses);

  for (const concept of sentence.uses) {
    if (!known.has(concept)) {
      errors.push(`${sentence.id}: uses "${concept}", not taught by the end of lesson ${lessonId}`);
    }
  }
  if (!sentence.uses.some(concept => introduced.has(concept))) {
    errors.push(
      `${sentence.id}: uses nothing from lesson ${lessonId}, so it reinforces nothing`
    );
  }

  for (const lang of languages) {
    const tokens = sentence.text?.[lang];
    if (!Array.isArray(tokens) || tokens.length === 0) {
      errors.push(`${sentence.id}: missing or empty text for "${lang}"`);
      continue;
    }
    for (const token of tokens) {
      if (typeof token === 'string') {
        if (token.trim().length === 0) {
          errors.push(`${sentence.id} [${lang}]: empty string token`);
        } else if (!isGlue(token, lang)) {
          errors.push(
            `${sentence.id} [${lang}]: "${token}" is loose glue - back it with a concept, ` +
              'or add it to GLUE deliberately'
          );
        }
        continue;
      }
      if (!token || typeof token.t !== 'string' || token.t.length === 0) {
        errors.push(`${sentence.id} [${lang}]: a token has no surface form`);
        continue;
      }
      if (token.t !== token.t.trim() || /\s\s/.test(token.t)) {
        errors.push(`${sentence.id} [${lang}]: token "${token.t}" has stray whitespace`);
      }
      if (!uses.has(token.c)) {
        errors.push(
          `${sentence.id} [${lang}]: token "${token.t}" claims "${token.c}", which is not in uses`
        );
      }
    }
    const text = joinTokens(tokens);
    if (text.includes('  ')) {
      errors.push(`${sentence.id} [${lang}]: joins to "${text}" with a double space`);
    }
    if (text !== text.trim()) {
      errors.push(`${sentence.id} [${lang}]: joins to text with a leading or trailing space`);
    }
  }

  // A concept listed in `uses` but never rendered means `uses` is overstated,
  // which would make the unlock check pass for a sentence that does not need
  // the concept at all.
  for (const concept of sentence.uses) {
    const appears = languages.some(lang =>
      (sentence.text?.[lang] ?? []).some(
        token => typeof token !== 'string' && token.c === concept
      )
    );
    if (!appears) {
      errors.push(`${sentence.id}: "${concept}" is in uses but appears in no language`);
    }
  }

  return errors;
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `yarn test src/shared/course.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
yarn typecheck
git add src/shared/course.ts src/shared/course.test.ts
git commit -m "feat(shared): validateCourse, the course and sentence-bank lint"
```

---

### Task 4: `utils/validate_course.js`

The CLI content agents run. It must exit non-zero on any error, and its output must be readable without opening the source files.

**Files:**
- Create: `utils/validate_course.js`

**Interfaces:**
- Consumes: `validateCourse`, `dedupeBank`, `conceptId` from the compiled `out/shared/course.js`.
- Produces: a CLI. `node utils/validate_course.js [level ...]`. Exit 0 clean, 1 on validation errors, 2 on a setup problem.

- [ ] **Step 1: Write the script**

Create `utils/validate_course.js`:

```js
/*
 * Lints languages/_course/ against languages/_bank/.
 *
 * Requires a compiled build, because the validation rules and the sentence
 * join rule live in src/shared and must not be duplicated here:
 *
 *   yarn compile && node utils/validate_course.js
 *   node utils/validate_course.js a1 a2            # only these levels
 *   node utils/validate_course.js --languages en   # only this language column
 *
 * The --languages flag exists for the authoring pass: the course and the
 * English sentences are written first, and have to lint clean before the
 * other six columns are translated.
 *
 * Exit codes: 0 clean, 1 validation errors, 2 setup problem.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "languages");
const BANK = path.join(ROOT, "_bank");
const COURSE = path.join(ROOT, "_course");
const COMPILED = path.join(__dirname, "..", "out", "shared", "course.js");

const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];

if (!fs.existsSync(COMPILED)) {
  console.error("out/shared/course.js is missing. Run `yarn compile` first.");
  process.exit(2);
}
const { validateCourse, dedupeBank, conceptId } = require(COMPILED);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

const rowsByLevel = {};
for (const level of LEVELS) {
  const file = path.join(BANK, `${level}.json`);
  rowsByLevel[level] = fs.existsSync(file) ? readJson(file) : [];
}
const banked = dedupeBank(LEVELS, rowsByLevel);

const argv = process.argv.slice(2);
const langFlag = argv.indexOf("--languages");
const languages =
  langFlag === -1
    ? LANGS
    : (argv[langFlag + 1] || "").split(",").filter((code) => LANGS.includes(code));
if (languages.length === 0) {
  console.error(`--languages needs a comma-separated subset of: ${LANGS.join(",")}`);
  process.exit(2);
}
const requested = argv.filter((arg) => LEVELS.includes(arg));
const targets = requested.length > 0 ? requested : LEVELS;

let totalErrors = 0;
let checked = 0;

for (const level of LEVELS) {
  const courseFile = path.join(COURSE, `${level}.json`);
  const sentenceFile = path.join(COURSE, `${level}.sentences.json`);

  if (!targets.includes(level)) {
    continue;
  }
  if (!fs.existsSync(courseFile)) {
    console.log(`${level}: no course file, skipped`);
    continue;
  }
  if (!fs.existsSync(sentenceFile)) {
    console.error(`${level}: ${courseFile} exists but ${sentenceFile} does not`);
    totalErrors++;
    continue;
  }

  const priorConcepts = [];
  for (const earlier of LEVELS) {
    if (earlier === level) break;
    priorConcepts.push(...banked[earlier].map((row) => conceptId(row.en)));
  }

  const errors = validateCourse({
    course: readJson(courseFile),
    sentences: readJson(sentenceFile),
    levelConcepts: banked[level].map((row) => conceptId(row.en)),
    priorConcepts,
    languages,
  });

  checked++;
  if (errors.length === 0) {
    console.log(`${level}: clean`);
  } else {
    console.error(`\n${level}: ${errors.length} error(s)`);
    for (const error of errors) {
      console.error(`  ${error}`);
    }
    totalErrors += errors.length;
  }
}

console.log(`\nlevels checked: ${checked}, errors: ${totalErrors}`);
process.exit(totalErrors > 0 ? 1 : 0);
```

- [ ] **Step 2: Verify it reports a missing build**

```bash
rm -rf out && node utils/validate_course.js; echo "exit=$?"
```
Expected: `out/shared/course.js is missing. Run \`yarn compile\` first.` and `exit=2`.

- [ ] **Step 3: Verify it runs clean with no course files yet**

```bash
yarn compile && node utils/validate_course.js; echo "exit=$?"
```
Expected: five `no course file, skipped` lines, `levels checked: 0, errors: 0`, `exit=0`.

- [ ] **Step 4: Verify it catches a real error**

```bash
mkdir -p languages/_course
printf '{"level":"a1","lessons":[{"id":1,"new":["hello"],"sentences":[]}]}' > languages/_course/a1.json
printf '[]' > languages/_course/a1.sentences.json
node utils/validate_course.js a1; echo "exit=$?"
rm languages/_course/a1.json languages/_course/a1.sentences.json
```
Expected: 179 `is in the bank but in no lesson` lines and `exit=1`. There is no
lesson-size error: a one-concept lesson is legal when it is the last one, and
here it is the only one.

- [ ] **Step 5: Verify the language subset flag**

```bash
mkdir -p languages/_course
printf '{"level":"a1","lessons":[{"id":1,"new":["and"],"sentences":["x"]}]}' > languages/_course/a1.json
printf '[{"id":"x","uses":["and"],"text":{"en":[{"t":"and","c":"and"}]}}]' > languages/_course/a1.sentences.json
node utils/validate_course.js --languages en a1 2>&1 | grep -c 'missing or empty text'
node utils/validate_course.js a1 2>&1 | grep -c 'missing or empty text'
rm -rf languages/_course
```
Expected: `0` then `6` - with the flag only the English column is checked, without it all seven are.

- [ ] **Step 6: Commit**

```bash
git add utils/validate_course.js
git commit -m "feat(utils): validate_course CLI over the shared lint"
```

---

### Task 5: Course ordering and lessons files in `generate_pairs.js`

One script, one pass, because lesson sizes depend on the per-pair `seenW2` dedupe. See "Why the lessons file is written by `generate_pairs.js`" above.

The inline bank dedupe (current lines 37-53) is replaced by `dedupeBank` so the lint and the generator cannot disagree about which concepts exist at which level.

**Files:**
- Modify: `utils/generate_pairs.js` (whole file rewritten)

**Interfaces:**
- Consumes: `dedupeBank`, `conceptId` from `out/shared/course.js`; `joinTokens` from `out/shared/items.js`.
- Produces: `languages/<to>/<from>/<level>.json` in course order when a course exists, plus `languages/<to>/<from>/<level>.lessons.json` matching the `LessonsFile` shape from Task 2.

- [ ] **Step 1: Replace the file**

Write `utils/generate_pairs.js`:

```js
/*
 * Generates every language-pair dictionary from the multilingual word bank,
 * and the per-pair lessons file when the level has a course.
 *
 * Bank: languages/_bank/<level>.json - concept rows like
 *   { "en": "to go", "de": "gehen", "fr": "aller", "es": "ir",
 *     "it": "andare", "tr": "gitmek", "ru": "идти" }
 * A concept (its English value, lowercased) is kept at the LOWEST level it
 * appears in.
 *
 * Course (optional): languages/_course/<level>.json orders the level's
 * concepts into lessons, and <level>.sentences.json holds the sentences.
 * Run `node utils/validate_course.js` before this - the generator trusts its
 * input and only reports what it had to skip.
 *
 * Output per ordered pair (to != from) and level:
 *   languages/<to>/<from>/<level>.json        { word_1: known, word_2: learned }
 *   languages/<to>/<from>/<level>.lessons.json  when the level has a course
 *
 * Lesson word counts are per pair, not global: a concept is dropped from a
 * pair when its target word collides with one already emitted (the bank has
 * both `she -> sie` and `they -> sie`), so the counts have to be tallied in
 * the same pass as that dedupe or the lesson boundaries drift.
 *
 * Requires a compiled build:
 *   yarn compile && node utils/generate_pairs.js   (DRY_RUN=1 to preview)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "languages");
const BANK = path.join(ROOT, "_bank");
const COURSE_DIR = path.join(ROOT, "_course");
const OUT = path.join(__dirname, "..", "out", "shared");

const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const DRY_RUN = process.env.DRY_RUN === "1";

for (const file of ["course.js", "items.js"]) {
  if (!fs.existsSync(path.join(OUT, file))) {
    console.error(`out/shared/${file} is missing. Run \`yarn compile\` first.`);
    process.exit(2);
  }
}
const { dedupeBank, conceptId } = require(path.join(OUT, "course.js"));
const { joinTokens } = require(path.join(OUT, "items.js"));

const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function serialisePairs(entries) {
  const lines = entries.map(
    (e) =>
      `    {"word_1": ${JSON.stringify(e.word_1)}, "word_2": ${JSON.stringify(e.word_2)}}`,
  );
  return `[\n${lines.join(",\n")}\n]\n`;
}

// --- Bank -------------------------------------------------------------------

const rowsByLevel = {};
for (const level of LEVELS) {
  const file = path.join(BANK, `${level}.json`);
  rowsByLevel[level] = fs.existsSync(file) ? readJson(file) : [];
}
const banked = dedupeBank(LEVELS, rowsByLevel);

// concept id -> its bank row, for glosses.
const rowOfConcept = new Map();
for (const level of LEVELS) {
  for (const row of banked[level]) {
    rowOfConcept.set(conceptId(row.en), row);
  }
}
const bankTotal = rowOfConcept.size;
console.log(`Bank concepts (deduped): ${bankTotal}`);

// --- Courses ----------------------------------------------------------------

// level -> { lessons, sentenceById, lessonOfConcept, orderedRows } or null
const courses = {};
const skipped = [];
for (const level of LEVELS) {
  const courseFile = path.join(COURSE_DIR, `${level}.json`);
  const sentenceFile = path.join(COURSE_DIR, `${level}.sentences.json`);
  if (!fs.existsSync(courseFile)) {
    courses[level] = null;
    continue;
  }
  const course = readJson(courseFile);
  const sentences = fs.existsSync(sentenceFile) ? readJson(sentenceFile) : [];
  const sentenceById = new Map(sentences.map((s) => [s.id, s]));

  const lessonOfConcept = new Map();
  course.lessons.forEach((lesson, index) => {
    for (const concept of lesson.new) {
      lessonOfConcept.set(concept, index);
    }
  });

  // Reorder the level's rows to follow the course. Concepts the course does
  // not mention keep their bank order and land at the end, so nothing is lost.
  const byConcept = new Map(banked[level].map((row) => [conceptId(row.en), row]));
  const orderedRows = [];
  for (const lesson of course.lessons) {
    for (const concept of lesson.new) {
      const row = byConcept.get(concept);
      if (row) {
        orderedRows.push(row);
        byConcept.delete(concept);
      } else {
        skipped.push(`${level} lesson ${lesson.id}: no bank row for "${concept}"`);
      }
    }
  }
  for (const row of banked[level]) {
    if (byConcept.has(conceptId(row.en))) {
      orderedRows.push(row);
      skipped.push(`${level}: "${conceptId(row.en)}" is in no lesson, appended at the end`);
    }
  }

  courses[level] = { course, sentenceById, lessonOfConcept, orderedRows };
  console.log(`${level}: course with ${course.lessons.length} lessons, ${sentences.length} sentences`);
}

function glossFor(sentence, to, from) {
  const gloss = {};
  for (const concept of sentence.uses) {
    const row = rowOfConcept.get(concept);
    if (row && row[to] && row[from]) {
      gloss[concept] = { t: row[to], s: row[from] };
    }
  }
  return gloss;
}

// --- Pairs ------------------------------------------------------------------

let pairFiles = 0;
let lessonFiles = 0;
const summary = [];

for (const to of LANGS) {
  for (const from of LANGS) {
    if (to === from) continue;
    const dir = path.join(ROOT, to, from);
    let pairTotal = 0;
    // A target word appears once per pair: if two concepts collapse to the
    // same target word, only the lowest-level one survives.
    const seenW2 = new Set();

    for (const level of LEVELS) {
      const loaded = courses[level];
      const rows = loaded ? loaded.orderedRows : banked[level];
      const counts = loaded ? new Array(loaded.course.lessons.length).fill(0) : null;
      const out = [];

      for (const row of rows) {
        const w1 = row[from];
        const w2 = row[to];
        if (!w1 || !w2) continue;
        const key = norm(w2);
        if (seenW2.has(key)) continue;
        seenW2.add(key);
        out.push({ word_1: w1, word_2: w2 });
        if (counts) {
          const index = loaded.lessonOfConcept.get(conceptId(row.en));
          if (index !== undefined) counts[index]++;
        }
      }
      pairTotal += out.length;

      if (DRY_RUN) continue;

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${level}.json`), serialisePairs(out));
      pairFiles++;

      const lessonsPath = path.join(dir, `${level}.lessons.json`);
      if (!loaded) {
        // A course was removed: drop the stale artefact rather than leaving
        // the engine to read lesson boundaries that no longer apply.
        if (fs.existsSync(lessonsPath)) fs.unlinkSync(lessonsPath);
        continue;
      }

      const lessons = loaded.course.lessons.map((lesson, index) => ({
        count: counts[index],
        sentences: lesson.sentences
          .map((id) => loaded.sentenceById.get(id))
          .filter(Boolean)
          .map((sentence) => ({
            id: sentence.id,
            target: sentence.text[to],
            source: joinTokens(sentence.text[from]),
            gloss: glossFor(sentence, to, from),
          })),
      }));
      fs.writeFileSync(lessonsPath, `${JSON.stringify({ lessons }, null, 2)}\n`);
      lessonFiles++;
    }
    summary.push(`${to}/${from}: ${pairTotal}`);
  }
}

console.log(summary.join("\n"));
if (skipped.length > 0) {
  console.log(`\nskipped (${skipped.length}):`);
  for (const line of [...new Set(skipped)]) console.log(`  ${line}`);
}
console.log(
  `\n${DRY_RUN ? "[DRY RUN] " : ""}pairs: ${summary.length}, ` +
    `word files: ${pairFiles}, lessons files: ${lessonFiles}`,
);
```

- [ ] **Step 2: Verify it is byte-identical with no course files**

The refactor must not change existing output. With no `_course/` directory present:

```bash
yarn compile
git stash list > /dev/null
cp -R languages/en/ru /tmp/vocab-before-en-ru
node utils/generate_pairs.js > /tmp/vocab-gen.log
diff -r /tmp/vocab-before-en-ru languages/en/ru && echo "IDENTICAL"
git status --short languages | head
```
Expected: `IDENTICAL`, and `git status --short languages` reports no modified files.

- [ ] **Step 3: Verify the missing-build guard**

```bash
rm -rf out && node utils/generate_pairs.js; echo "exit=$?"
yarn compile
```
Expected: `out/shared/course.js is missing. Run \`yarn compile\` first.` and `exit=2`.

- [ ] **Step 4: Verify a course reorders and produces lessons files**

```bash
mkdir -p languages/_course
cat > languages/_course/a1.json <<'EOF'
{"level":"a1","lessons":[
  {"id":1,"new":["hello","i","to be","good","day"],"sentences":["a1_001"]}
]}
EOF
cat > languages/_course/a1.sentences.json <<'EOF'
[{"id":"a1_001","uses":["hello","i","to be","good"],
  "text":{
    "en":[{"t":"Hello","c":"hello"},",",{"t":"I","c":"i"},{"t":"am","c":"to be"},{"t":"good","c":"good"},"."],
    "de":[{"t":"Hallo","c":"hello"},",",{"t":"ich","c":"i"},{"t":"bin","c":"to be"},{"t":"gut","c":"good"},"."],
    "fr":[{"t":"Bonjour","c":"hello"},",",{"t":"je","c":"i"},{"t":"vais","c":"to be"},{"t":"bien","c":"good"},"."],
    "es":[{"t":"Hola","c":"hello"},",",{"t":"estoy","c":"to be"},{"t":"bien","c":"good"},"."],
    "it":[{"t":"Ciao","c":"hello"},",",{"t":"sto","c":"to be"},{"t":"bene","c":"good"},"."],
    "tr":[{"t":"Merhaba","c":"hello"},",",{"t":"ben","c":"i"},{"t":"iyiyim","c":"good"},"."],
    "ru":[{"t":"Привет","c":"hello"},",",{"t":"я","c":"i"},{"t":"хорошо","c":"good"},"."]}}]
EOF
node utils/generate_pairs.js | tail -20
head -6 languages/de/ru/a1.json
cat languages/de/ru/a1.lessons.json | head -30
```
Expected: `a1: course with 1 lessons, 1 sentences`; a long `skipped` list, one line per A1 concept not in the lesson; `languages/de/ru/a1.json` now starts with the five lesson concepts in course order (`привет / Hallo`, `я / ich`, ...); `languages/de/ru/a1.lessons.json` contains `"count": 5`, a `target` array of German tokens, `"source": "Привет, я хорошо."`, and a `gloss` entry `"to be": { "t": "sein", "s": "быть" }`.

Note the `hello` gloss will only be present if `hello` exists in the bank with both columns filled. If a gloss key is missing, that concept has an empty column in the bank; the renderer simply shows no tooltip for it.

- [ ] **Step 5: Verify a removed course drops the stale lessons file**

```bash
rm languages/_course/a1.json languages/_course/a1.sentences.json
node utils/generate_pairs.js > /dev/null
test ! -f languages/de/ru/a1.lessons.json && echo "STALE FILE REMOVED"
git checkout -- languages && rmdir languages/_course 2>/dev/null
git status --short languages
```
Expected: `STALE FILE REMOVED`, then a clean `git status`.

- [ ] **Step 6: Commit**

```bash
git add utils/generate_pairs.js
git commit -m "feat(utils): course ordering and per-pair lessons files"
```

---

### Task 6: Keyed progress

`currentIndex` is a position in whichever file was open last. Switching pair or level resets it to 0 (`switchLanguage`, `src/index.ts:110`), so today progress is disposable. Once that position means "which lesson you are on", losing it on every language switch stops being acceptable.

**Files:**
- Modify: `src/shared/types.ts`, `src/shared/state.ts`
- Test: `src/shared/state.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `AppState.progress: Record<string, number>`, `progressKey(to: string, from: string, level: string): string`.

- [ ] **Step 1: Write the failing test**

`src/shared/state.test.ts` already imports `normalizeState` and `DEFAULT_STATE`
on line 2. Add `progressKey` to that existing import - do not add a second
`import ... from './state'`, which is a duplicate-identifier error:

```ts
import { normalizeState, DEFAULT_STATE, clampInterval, MIN_INTERVAL_MS, MAX_INTERVAL_MS, progressKey } from './state';
```

Then append these blocks to the end of the file:

```ts
describe('progressKey', () => {
  it('keys on the pair and level together', () => {
    expect(progressKey('de', 'ru', 'A1')).toBe('de:ru:A1');
  });
});

describe('normalizeState progress', () => {
  it('defaults to an empty map', () => {
    expect(normalizeState({}).progress).toEqual({});
  });

  it('keeps valid entries', () => {
    expect(normalizeState({ progress: { 'de:ru:A1': 12 } }).progress).toEqual({ 'de:ru:A1': 12 });
  });

  it('drops entries that are not non-negative integers', () => {
    const state = normalizeState({
      progress: { good: 3, negative: -1, fractional: 1.5, text: 'x', nothing: null }
    });
    expect(state.progress).toEqual({ good: 3 });
  });

  it('ignores a progress value that is not an object', () => {
    expect(normalizeState({ progress: 'nope' }).progress).toEqual({});
  });

  it('seeds progress from a pre-lessons currentIndex so an upgrade keeps its place', () => {
    const state = normalizeState({
      currentIndex: 42,
      currentLanguage: 'de',
      currentFromLanguage: 'ru',
      currentLevel: 'B1'
    });
    expect(state.progress).toEqual({ 'de:ru:B1': 42 });
  });

  it('does not seed when progress already has entries', () => {
    const state = normalizeState({
      currentIndex: 42,
      currentLanguage: 'de',
      currentFromLanguage: 'ru',
      currentLevel: 'B1',
      progress: { 'fr:en:A1': 7 }
    });
    expect(state.progress).toEqual({ 'fr:en:A1': 7 });
  });

  it('does not seed from a zero index', () => {
    expect(normalizeState({ currentIndex: 0 }).progress).toEqual({});
  });

  it('is round-trip stable, so saveState cannot drop the field', () => {
    const once = normalizeState({ progress: { 'de:ru:A1': 5 } });
    expect(normalizeState(once)).toEqual(once);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `yarn test src/shared/state.test.ts`
Expected: FAIL, `progressKey is not a function`.

- [ ] **Step 3: Add the field to `AppState`**

In `src/shared/types.ts`, inside `interface AppState`, after `currentIndex`:

```ts
export interface AppState {
  currentIndex: number;
  /** Item index per "to:from:level", so switching a language pair or level
   *  no longer discards where the learner was. `currentIndex` stays as the
   *  position in the currently open dictionary. */
  progress: Record<string, number>;
  currentLanguage: string;
  // ... the rest is unchanged
}
```

- [ ] **Step 4: Implement in `src/shared/state.ts`**

Add `progress: {}` to `DEFAULT_STATE`, immediately after `currentIndex: 0`. Note `DEFAULT_STATE` is `Object.freeze`d, so `normalizeState` must never hand out that object: always build a fresh `{}`.

Add these exports:

```ts
/** Progress is stored per dictionary, because a position only means anything
 *  next to the pair and level it was reached in. */
export function progressKey(to: string, from: string, level: string): string {
  return `${to}:${from}:${level}`;
}

function normalizeProgress(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key.length > 0 && isNonNegativeInt(value)) {
      out[key] = value;
    }
  }
  return out;
}
```

In `normalizeState`, add `progress` to the returned object and seed it at the end:

```ts
export function normalizeState(raw: unknown): AppState {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const state: AppState = {
    currentIndex: /* unchanged */,
    progress: normalizeProgress(source.progress),
    // ... every other field unchanged
  };

  // A config written before lessons existed has a bare currentIndex and no
  // progress map. Seed the one entry it describes so an upgrading user keeps
  // their place instead of being sent back to the first word.
  if (Object.keys(state.progress).length === 0 && state.currentIndex > 0) {
    state.progress[
      progressKey(state.currentLanguage, state.currentFromLanguage, state.currentLevel)
    ] = state.currentIndex;
  }

  return state;
}
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `yarn test`
Expected: PASS, the whole suite. Existing `state.test.ts` cases still pass because every other field is untouched.

- [ ] **Step 6: Typecheck and commit**

```bash
yarn typecheck
git add src/shared/types.ts src/shared/state.ts src/shared/state.test.ts
git commit -m "feat(state): keep reading position per language pair and level"
```

---

### Task 7: The engine cycles items, not strings

`phraseEngine` keeps its whole shape: a list, an index, a timer, an injected `onRender`. Only the element type changes, plus one thing `setInterval` cannot express - a sentence has to stay on screen longer than a word.

**Files:**
- Modify: `src/main/phraseEngine.ts`, `src/shared/types.ts`, `src/shared/constants.ts`
- Test: `src/main/phraseEngine.test.ts` (new)

**Interfaces:**
- Consumes: `buildItems`, `Item`, `LessonSpec` from Task 2; `nextIndex`/`prevIndex`/`clampIndex` from `src/shared/phrases.ts` (unchanged).
- Produces: `PhraseEngineOptions.onRender: (item: Item, index: number, total: number) => void`, `PhraseEngine.getCurrentItem(): Item | undefined`, `SENTENCE_DWELL_MULTIPLIER`.

`src/shared/types.ts` will now `import type { Item } from './items'`, while `items.ts` already does `import type { VocabEntry } from './types'`. Both are type-only, so they are erased at compile time and there is no runtime cycle.

- [ ] **Step 1: Write the failing test**

Create `src/main/phraseEngine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `yarn test src/main/phraseEngine.test.ts`
Expected: FAIL, `SENTENCE_DWELL_MULTIPLIER` is not exported.

- [ ] **Step 3: Add the constant**

In `src/shared/constants.ts`, next to `SPEED_INTERVALS` and `DEFAULT_INTERVAL_MS`:

```ts
// A sentence takes longer to read than a word, so it stays on screen for this
// many times the configured interval.
export const SENTENCE_DWELL_MULTIPLIER = 2;
```

And add two channels to the `IPC` map, after `SET_PAUSED`:

```ts
  SET_HOLD: "set-hold",
```

and after `SET_SPEED`:

```ts
  SET_ASSEMBLE: "set-assemble",
```

- [ ] **Step 4: Update the engine types**

In `src/shared/types.ts`, add at the top with the other imports:

```ts
import type { Item } from './items';
```

Replace `PhraseEngine.getCurrentPhrase` and `PhraseEngineOptions.onRender`:

```ts
export interface PhraseEngine {
  load(filePath: string, startIndex?: number): void;
  next(): void;
  previous(): void;
  setIntervalMs(ms: number): void;
  restartTimer(): void;
  stop(): void;
  render(): void;
  getIndex(): number;
  getCurrentItem(): Item | undefined;
}

export interface PhraseEngineOptions {
  intervalMs: number;
  onRender: (item: Item, index: number, total: number) => void;
}
```

`Phrase` and `splitPhrase` stay: the plain-text dictionary import format and the
menu-bar title still use them.

- [ ] **Step 5: Rewrite the engine**

Replace `src/main/phraseEngine.ts`:

```ts
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
```

- [ ] **Step 6: Run the tests**

Run: `yarn test src/main/phraseEngine.test.ts`
Expected: PASS, 7 tests.

`yarn typecheck` will still fail here, because `src/index.ts` and
`src/preload/main.ts` are on the old payload shape. Task 8 closes that.

- [ ] **Step 7: Commit**

```bash
git add src/main/phraseEngine.ts src/main/phraseEngine.test.ts src/shared/types.ts src/shared/constants.ts
git commit -m "feat(engine): cycle items, with a longer dwell for sentences"
```

---

### Task 8: Wire the item through IPC

After this task the app runs again and shows sentences, unstyled. Task 9 turns them into a designed card.

The assemble flag is deliberately **not** in this payload. It follows the pattern sound already uses: a boolean pushed to the renderer when it changes, held in renderer-local state. Task 10 adds it.

**Files:**
- Modify: `src/shared/types.ts`, `src/main/ipc.ts`, `src/preload/main.ts`, `src/index.ts`, `src/renderer/main.ts`

**Interfaces:**
- Consumes: `Item`, `LaidOutToken`, `layoutTokens`, `joinTokens` from Tasks 1-2; `progressKey` from Task 6; `SENTENCE_DWELL_MULTIPLIER`, `IPC.SET_HOLD` from Task 7.
- Produces: `DisplayPhrasePayload { item, layout, mode, index, total }`, `MainVocabApi.setHold(hold: boolean): void`, `IpcHandlers.onSetHold`.

- [ ] **Step 1: Update the payload and API types**

In `src/shared/types.ts`, extend the items import and replace `DisplayPhrasePayload`:

```ts
import type { Item, LaidOutToken } from './items';
```

```ts
/** Payload pushed to the main display window for each item. */
export interface DisplayPhrasePayload {
  item: Item;
  /** Sentence tokens with spacing already resolved. Empty for a word. The
   *  renderer compiles to a classic script and cannot import the join rule,
   *  so the main process applies it and sends the result. */
  layout: LaidOutToken[];
  mode: Mode;
  index: number;
  total: number;
}
```

Add to `MainVocabApi`, after `setPaused`:

```ts
  /** Holds auto-advance while an unsolved exercise is on screen. Separate
   *  from `setPaused`, which is hover: either one alone keeps the timer off. */
  setHold(hold: boolean): void;
```

Add to `IpcHandlers`, after `onSetPaused`:

```ts
  onSetHold: (hold: boolean) => void;
```

- [ ] **Step 2: Register the channel**

In `src/main/ipc.ts`, add `onSetHold` to the destructured handlers and register it beside `SET_PAUSED`:

```ts
  ipcMain.on(IPC.SET_HOLD, (_event, hold: boolean) => onSetHold(hold));
```

- [ ] **Step 3: Update the preload**

In `src/preload/main.ts`, replace `onDisplayPhrase` and add `setHold`:

```ts
  onDisplayPhrase: callback =>
    ipcRenderer.on(IPC.DISPLAY_PHRASE, (_event, payload: DisplayPhrasePayload) =>
      callback(payload)
    ),
```

```ts
  setPaused: paused => ipcRenderer.send(IPC.SET_PAUSED, paused),
  setHold: hold => ipcRenderer.send(IPC.SET_HOLD, hold)
```

Add `DisplayPhrasePayload` to the existing `import type` line.

- [ ] **Step 4: Update the composition root**

In `src/index.ts`:

Add one new import:

```ts
import { joinTokens, layoutTokens } from "./shared/items";
import type { Item } from "./shared/items";
```

and extend two existing ones rather than duplicating them - line 18 is already
`import { clampInterval } from "./shared/state";` and lines 3-10 already import
from `./shared/constants`:

```ts
import { clampInterval, progressKey } from "./shared/state";
```

Add `PHRASE_SEPARATOR` to the `./shared/constants` import list.

Replace `renderPhrase` (currently lines 67-78):

```ts
// --- Item rendering ---------------------------------------------------------

function currentProgressKey(): string {
  return progressKey(state.currentLanguage, state.currentFromLanguage, state.currentLevel);
}

// Routes the current item to whichever surface the active mode uses: the tray
// title in Menu Bar mode, the window otherwise.
function renderPhrase(item: Item, index: number, total: number) {
  state.currentIndex = index;
  state.progress[currentProgressKey()] = index;

  if (state.currentMode === MODES.MENU_BAR) {
    // The tray title is a plain string, so a sentence goes in joined and
    // without its translation. The OS truncates a long one.
    tray.setTitle(
      item.kind === "word"
        ? `${item.source}${PHRASE_SEPARATOR}${item.target}`
        : joinTokens(item.target),
    );
  } else {
    sendToWindow(IPC.DISPLAY_PHRASE, {
      item,
      layout: item.kind === "sentence" ? layoutTokens(item.target) : [],
      mode: state.currentMode,
      index,
      total,
    });
  }

  // A sentence is a lesson boundary. State is otherwise written only on quit,
  // so a crash part-way through a course would throw the position away.
  if (item.kind === "sentence") {
    saveState(state);
  }
}
```

Replace `switchLanguage` (currently lines 106-113):

```ts
function switchLanguage(language: string, fromLanguage: string, level: string) {
  // Remember where we were before the key changes under us.
  state.progress[currentProgressKey()] = engine.getIndex();
  state.currentLanguage = language;
  state.currentFromLanguage = fromLanguage;
  state.currentLevel = level;
  loadCurrentDictionary(state.progress[currentProgressKey()] ?? 0);
  sendToWindow(IPC.SET_LANGUAGES, getLocale(fromLanguage), getLocale(language));
  tray.refresh();
}
```

Replace the hover-pause block (currently lines 200-209) with a two-source version:

```ts
// Auto-advance is off while the pointer is over the window, and while an
// unsolved assemble card is on screen. Either alone keeps it off.
function updateTimer() {
  if (isHoverPaused || isExerciseHold) {
    engine.stop();
  } else {
    engine.restartTimer();
  }
}

function setHoverPaused(paused: boolean) {
  isHoverPaused = paused;
  updateTimer();
}

function setExerciseHold(hold: boolean) {
  isExerciseHold = hold;
  updateTimer();
}
```

Declare the new flag beside `isHoverPaused` (line 45):

```ts
let isHoverPaused = false;
let isExerciseHold = false;
```

In `handleKeyPress`, replace the trailing block:

```ts
  // Don't resume auto-advance if the pointer is still hovering, or an
  // unsolved exercise is waiting.
  updateTimer();
```

In `createWiredMainWindow`'s `onReady`, replace the `loadCurrentDictionary` call:

```ts
      loadCurrentDictionary(state.progress[currentProgressKey()] ?? state.currentIndex);
```

In the `registerIpcHandlers` call, add beside `onSetPaused`:

```ts
    onSetHold: setExerciseHold,
```

- [ ] **Step 5: Update the renderer for the new payload**

In `src/renderer/main.ts`, add the type alias at the top beside the others:

```ts
type Item = import('../shared/types').DisplayPhrasePayload['item'];
type LaidOutToken = import('../shared/items').LaidOutToken;
```

Replace `displayPhrase` (currently lines 83-109). `splitPhrase` and
`PHRASE_SEPARATOR` become unused - delete them:

```ts
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

  // Unstyled for now: Task 9 gives the sentence its own card.
  function displaySentence(layout: LaidOutToken[], source: string) {
    sourceEl.textContent = source;
    targetEl.textContent = layout
      .map(token => (token.space ? ` ${token.text}` : token.text))
      .join('');
    revealTarget();
    speak(targetEl.textContent, toLocale);
  }

  function displayPhrase({ item, layout, mode, index, total }: DisplayPhrasePayload) {
    clearRevealTimeout();
    updateProgressBar(index, total);
    replayEnterAnimation();

    if (item.kind === 'sentence') {
      displaySentence(layout, item.source);
    } else {
      displayWord(item, mode);
    }
  }
```

- [ ] **Step 6: Remove what the change killed**

Nothing calls `toPhrases` once the engine builds items, and nothing calls
`splitPhrase` once the renderer stops splitting strings. Both were dead the
moment Task 7 landed. Delete them from `src/shared/phrases.ts`, leaving only
`nextIndex`, `prevIndex` and `clampIndex`; delete their two `describe` blocks
and the now-unused imports from `src/shared/phrases.test.ts`; delete the
`Phrase` type from `src/shared/types.ts`.

`PHRASE_SEPARATOR` stays. `src/shared/dictionary.ts` parses the plain-text
import format with it, and `renderPhrase` builds the menu-bar title with it.

- [ ] **Step 7: Typecheck and run the suite**

```bash
yarn typecheck && yarn test
```
Expected: both clean.

- [ ] **Step 8: Run the app on a level with no course**

```bash
yarn start
```
Expected: words cycle exactly as before, at the configured interval. Hover pauses. `Shift + arrow` steps. Nothing about the display has changed yet, because no `_course/` files exist.

Quit, reopen, and confirm it resumes where it stopped. Then switch pair in Settings, switch back, and confirm the position for the first pair is restored rather than reset to the first word.

- [ ] **Step 9: Commit**

```bash
git add src/shared src/main/ipc.ts src/preload/main.ts src/index.ts src/renderer/main.ts
git commit -m "feat(ipc): send items to the window and key progress by dictionary"
```

---

### Task 9: The sentence card

Word and sentence share the container, the entrance animation and the progress bar. Only the type scale changes, plus one new affordance: a token the learner has met as a card carries a thin underline, and hovering it names the card it came from.

Hovering the window already pauses auto-advance, so the sentence stays put while a gloss is being read. Nothing new is needed for that.

Sizes are `px` clamps to match the existing `#source` and `#target` rules. Colours come from the existing OKLCH tokens; one new token is added for the underline because no existing one reads correctly at that weight.

**Files:**
- Modify: `index.html`, `src/renderer/main.ts`

**Interfaces:**
- Consumes: `DisplayPhrasePayload` and `LaidOutToken` from Task 8; `Item`'s `gloss: Record<string, { t: string; s: string }>` from Task 2.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Add the underline token to both themes**

In `index.html`, in the `:root` block after `--target-glow: transparent;`:

```css
        --tok-line: oklch(0.55 0.10 70 / 0.38);
```

In the `body.dark` block after `--target-glow: ...;`:

```css
        --tok-line: oklch(0.80 0.085 82 / 0.32);
```

- [ ] **Step 2: Add the markup**

Replace the `#phrase-container` element in the body:

```html
    <div id="phrase-container">
      <span id="source"></span>
      <span id="target"></span>
      <p id="sentence-target"></p>
      <p id="sentence-source"></p>
    </div>
    <div id="gloss"></div>
```

Both pairs stay in the DOM. The container swaps which pair is displayed, so the
entrance animation is identical for a word and a sentence.

- [ ] **Step 3: Add the styles**

In `index.html`, after the `#target.hidden` rule:

```css
      /* Sentence card. Same container, same focus-pull; a smaller type scale
         because a sentence is read rather than glanced at. */
      #sentence-target,
      #sentence-source { display: none; margin: 0; }
      #phrase-container.sentence #source,
      #phrase-container.sentence #target { display: none; }
      #phrase-container.sentence #sentence-target,
      #phrase-container.sentence #sentence-source { display: block; }

      #sentence-target {
        font-size: clamp(15px, 4.4vw, 30px);
        font-weight: 600;
        letter-spacing: -0.01em;
        line-height: 1.4;
        text-wrap: balance;
        color: var(--ink);
        text-shadow: 0 0 28px var(--target-glow);
        transition: opacity 0.32s var(--ease-out), filter 0.32s var(--ease-out);
      }
      #sentence-target.hidden {
        opacity: 0;
        filter: blur(7px);
      }

      #sentence-source {
        font-size: clamp(11px, 2.4vw, 15px);
        font-weight: 500;
        line-height: 1.35;
        color: var(--muted);
      }

      /* A word the learner has already met as a card. The underline is the
         only affordance; hovering it names the card it came from. */
      .tok {
        border-bottom: 1px solid var(--tok-line);
        cursor: default;
      }

      #gloss {
        position: fixed;
        z-index: 10;
        padding: 5px 8px;
        border: 1px solid var(--hairline);
        border-radius: 7px;
        background: var(--bg-elev);
        color: var(--ink);
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.16s var(--ease-out);
      }
      #gloss.visible {
        opacity: 1;
        visibility: visible;
      }
      #gloss .gloss-source { color: var(--muted); }
```

In the `@media (prefers-reduced-motion: reduce)` block, extend the existing rules:

```css
        #target, #sentence-target, #gloss, #progress-bar-inner, body { transition: opacity 0.2s ease, color 0.2s ease, background 0.2s ease; }
        #target.hidden, #sentence-target.hidden { filter: none; transform: none; }
```

- [ ] **Step 4: Render the card**

In `src/renderer/main.ts`, add to the element lookups near line 18:

```ts
  const sentenceTargetEl = document.getElementById('sentence-target') as HTMLElement;
  const sentenceSourceEl = document.getElementById('sentence-source') as HTMLElement;
  const glossEl = document.getElementById('gloss') as HTMLElement;
```

Add the gloss helpers:

```ts
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
```

Replace the stub `displaySentence` from Task 8:

```ts
  function displaySentence(
    item: Extract<Item, { kind: 'sentence' }>,
    layout: LaidOutToken[],
    mode: string
  ) {
    renderTokens(layout, item.gloss);
    sentenceSourceEl.textContent = item.source;
    const text = joinLayout(layout);

    // Checkup hides the answer, which for a sentence is the sentence itself:
    // the translation below stays as the prompt.
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
```

And in `displayPhrase`, toggle the container class and dismiss any open gloss:

```ts
  function displayPhrase({ item, layout, mode, index, total }: DisplayPhrasePayload) {
    clearRevealTimeout();
    hideGloss();
    updateProgressBar(index, total);
    replayEnterAnimation();
    phraseContainer.classList.toggle('sentence', item.kind === 'sentence');

    if (item.kind === 'sentence') {
      displaySentence(item, layout, mode);
    } else {
      displayWord(item, mode);
    }
  }
```

- [ ] **Step 5: Build a course fixture and look at it**

```bash
mkdir -p languages/_course
cat > languages/_course/a1.json <<'EOF'
{"level":"a1","lessons":[
  {"id":1,"new":["hello","i","to be","good","day"],"sentences":["a1_001"]}
]}
EOF
cat > languages/_course/a1.sentences.json <<'EOF'
[{"id":"a1_001","uses":["hello","i","to be","good"],
  "text":{
    "en":[{"t":"Hello","c":"hello"},",",{"t":"I","c":"i"},{"t":"am","c":"to be"},{"t":"good","c":"good"},"."],
    "de":[{"t":"Hallo","c":"hello"},",",{"t":"ich","c":"i"},{"t":"bin","c":"to be"},{"t":"gut","c":"good"},"."],
    "fr":[{"t":"Bonjour","c":"hello"},",",{"t":"je","c":"i"},{"t":"vais","c":"to be"},{"t":"bien","c":"good"},"."],
    "es":[{"t":"Hola","c":"hello"},",",{"t":"estoy","c":"to be"},{"t":"bien","c":"good"},"."],
    "it":[{"t":"Ciao","c":"hello"},",",{"t":"sto","c":"to be"},{"t":"bene","c":"good"},"."],
    "tr":[{"t":"Merhaba","c":"hello"},",",{"t":"ben","c":"i"},{"t":"iyiyim","c":"good"},"."],
    "ru":[{"t":"Привет","c":"hello"},",",{"t":"я","c":"i"},{"t":"хорошо","c":"good"},"."]}}]
EOF
yarn compile && node utils/generate_pairs.js > /dev/null && yarn start
```

Expected, with the pair set to German from Russian and level A1:
- five word cards, then the sentence `Hallo, ich bin gut.` with `Привет, я хорошо.` muted beneath it;
- `Hallo`, `ich`, `bin` and `gut` carry a thin underline; the comma and full stop do not;
- hovering `bin` shows `sein · быть`;
- the sentence stays on screen twice as long as a word;
- switch to Checkup: the sentence hides and resolves out of blur after 3 s, with the translation visible the whole time;
- toggle the light theme: the underline and the gloss both stay legible.

- [ ] **Step 6: Reset the fixture**

```bash
rm -rf languages/_course
node utils/generate_pairs.js > /dev/null
git status --short languages
```
Expected: no modified files under `languages/`.

- [ ] **Step 7: Commit**

```bash
git add index.html src/renderer/main.ts
git commit -m "feat(ui): sentence card with tokens glossed back to their card"
```

---

### Task 10: Assemble mode

Off by default. It layers on top of whatever mode is active, exactly as Sound does, so it is a boolean in the Playback panel rather than a Mode chip. Checkup is a Mode chip because Checkup and Window are alternatives; assemble and Window are not.

Menu Bar mode has no interaction surface, so assemble is ignored there and sentences render passively.

**Files:**
- Modify: `src/shared/types.ts`, `src/shared/state.ts`, `src/shared/state.test.ts`, `src/main/ipc.ts`, `src/index.ts`, `src/preload/main.ts`, `src/renderer/main.ts`, `src/renderer/settings.ts`, `settings.html`, `index.html`

**Interfaces:**
- Consumes: `IPC.SET_ASSEMBLE` from Task 7, `MainVocabApi.setHold` from Task 8, `renderTokens` and `joinLayout` from Task 9.
- Produces: `AppState.isAssembleMode`, `SettingsSnapshot.current.assemble`, `IpcHandlers.setAssemble`, `MainVocabApi.onSetAssemble`.

- [ ] **Step 1: Write the failing state test**

Append to `src/shared/state.test.ts`:

```ts
describe('normalizeState isAssembleMode', () => {
  it('defaults to off', () => {
    expect(normalizeState({}).isAssembleMode).toBe(false);
  });

  it('keeps a boolean', () => {
    expect(normalizeState({ isAssembleMode: true }).isAssembleMode).toBe(true);
  });

  it('rejects a non-boolean', () => {
    expect(normalizeState({ isAssembleMode: 'yes' }).isAssembleMode).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `yarn test src/shared/state.test.ts`
Expected: FAIL, `expected undefined to be false`.

- [ ] **Step 3: Add the field**

In `src/shared/types.ts`, in `AppState` after `isSoundMode`:

```ts
  /** The opt-in assemble exercise. Layers on top of the current mode, like
   *  sound, rather than replacing it. */
  isAssembleMode: boolean;
```

In `SettingsSnapshot.current`, after `sound: boolean;`:

```ts
    assemble: boolean;
```

In `MainVocabApi`, after `onToggleSound`:

```ts
  onSetAssemble(callback: (enabled: boolean) => void): void;
```

In `IpcHandlers`, after `setSound`:

```ts
  setAssemble: (enabled: boolean) => void;
```

In `src/shared/state.ts`, add `isAssembleMode: false` to `DEFAULT_STATE` after `isSoundMode: false`, and to `normalizeState`:

```ts
    isAssembleMode:
      typeof source.isAssembleMode === "boolean"
        ? source.isAssembleMode
        : DEFAULT_STATE.isAssembleMode,
```

- [ ] **Step 4: Run the tests**

Run: `yarn test src/shared/state.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire main and preload**

`src/main/ipc.ts` - destructure `setAssemble` and register:

```ts
  ipcMain.handle(IPC.SET_ASSEMBLE, (_event, enabled: boolean) => setAssemble(enabled));
```

`src/index.ts` - add the action, include it in the snapshot, and pass it in:

```ts
function toggleAssemble(enabled: boolean) {
  state.isAssembleMode = enabled;
  sendToWindow(IPC.SET_ASSEMBLE, enabled);
  // Leaving assemble mid-exercise must not strand the timer.
  if (!enabled) {
    setExerciseHold(false);
  }
  engine.render();
}
```

In `getSettings()`, add `assemble: state.isAssembleMode,` to `current`.
In `registerIpcHandlers`, add `setAssemble: toggleAssemble,`.
In `createWiredMainWindow`'s `onReady`, before `loadCurrentDictionary`:

```ts
      win.webContents.send(IPC.SET_ASSEMBLE, state.isAssembleMode);
```

`src/preload/main.ts` - add to the api object:

```ts
  onSetAssemble: callback =>
    ipcRenderer.on(IPC.SET_ASSEMBLE, (_event, enabled) => callback(enabled)),
```

- [ ] **Step 6: Add the chips markup and styles**

In `index.html`, inside `#phrase-container` after `#sentence-source`:

```html
      <div id="chips"></div>
```

Styles, after the `#sentence-source` rule:

```css
      #chips { display: none; }
      #phrase-container.assemble #chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
        margin-top: 4px;
      }
      /* While assembling, the answer is what the learner is building, so the
         translation stays and the sentence line shows only what is placed. */
      #phrase-container.assemble #sentence-target { min-height: 1.4em; }

      .chip {
        padding: 4px 9px;
        border: 1px solid var(--hairline);
        border-radius: 8px;
        background: var(--bg-elev);
        color: var(--ink);
        font-size: clamp(11px, 2.4vw, 15px);
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.18s var(--ease-out), border-color 0.18s var(--ease-out);
      }
      .chip:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .chip.used {
        opacity: 0.3;
        pointer-events: none;
      }
      .chip.wrong { animation: chip-shake 0.3s var(--ease-out); }

      @keyframes chip-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }
```

In the reduced-motion block, replace the shake with a colour change:

```css
        .chip.wrong { animation: none; border-color: var(--accent); }
```

- [ ] **Step 7: Implement the exercise in the renderer**

In `src/renderer/main.ts`, add renderer-local state beside `isSoundMode`:

```ts
  let isAssembleMode = false;
```

and the subscription beside the others:

```ts
  vocab.onSetAssemble(enabled => {
    isAssembleMode = enabled;
  });
```

Add the exercise. It is driven by one cursor into the concept-backed tokens;
glue is placed for free as soon as the token before it is filled.

```ts
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
```

Rewrite `displaySentence` to branch:

```ts
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
```

In `displayPhrase`, release the hold whenever the card changes, so stepping away from an unsolved exercise with `Shift + arrow` cannot leave the timer stopped:

```ts
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
```

- [ ] **Step 8: Add the Settings row**

In `settings.html`, in the `data-panel="playback"` section, after the Sound
block and before the Changing speed block:

```html
          <div class="block"><div class="block-label">Sentences</div>
            <div class="toggle" id="assemble-toggle"><span class="switch"></span><span>Build each sentence from its words</span></div>
          </div>
```

Also widen the panel's description, which currently says only pronunciation and
speed:

```html
          <p class="desc">Pronunciation, sentence practice, and how fast words change.</p>
```

In `src/shared/types.ts`, add to `SettingsVocabApi` after `setSound`:

```ts
  setAssemble(enabled: boolean): Promise<void>;
```

In `src/preload/settings.ts`, add to the api object after `setSound`:

```ts
  setAssemble: enabled => ipcRenderer.invoke(IPC.SET_ASSEMBLE, enabled),
```

In `src/renderer/settings.ts`, add to the `els` object beside `soundToggle`
(line 23):

```ts
  assembleToggle: document.getElementById('assemble-toggle') as HTMLElement,
```

Add the renderer beside `renderSound` (line 134):

```ts
function renderAssemble() {
  els.assembleToggle.classList.toggle('on', s.current.assemble);
}
```

Call it from `renderAll`, directly after `renderSound();`:

```ts
  renderAssemble();
```

And add the listener beside the sound one (line 174):

```ts
els.assembleToggle.addEventListener('click', async () => {
  const next = !s.current.assemble;
  await vocab.setAssemble(next);
  s.current.assemble = next;
  renderAssemble();
});
```

- [ ] **Step 9: Typecheck, test, and try it**

```bash
yarn typecheck && yarn test
```
Expected: both clean.

Rebuild the Task 9 fixture, then `yarn start` and turn on **Assemble sentences**:
- the sentence line is empty, the translation is visible, four chips sit below in a scrambled order;
- clicking the wrong chip shakes it and places nothing;
- clicking the right one dims it and extends the line, bringing the comma and full stop along at the right moments;
- the card does not advance until the sentence is complete;
- on completion the tokens gain their underlines and the gloss works;
- `Shift + →` away from a half-finished exercise, and auto-advance resumes;
- switch to Menu Bar mode: the tray shows the sentence and nothing waits for input.

- [ ] **Step 10: Commit**

```bash
git add src/shared src/main src/preload src/renderer index.html settings.html
git commit -m "feat(ui): opt-in assemble exercise on the sentence card"
```

---

### Task 11: Document it

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the data section**

In the "Language / dictionary data" section, after the "Generated from a multilingual bank" bullet, add:

```markdown
- **Lessons and sentences**: `languages/_course/<level>.json` orders that level's
  concepts into lessons of 5-10, and `<level>.sentences.json` holds the
  sentences shown after each one, tokenised in all 7 languages. A concept id is
  the English column trimmed and lowercased - the same key the bank dedupes on.
  `node utils/validate_course.js` lints them; `node utils/generate_pairs.js`
  writes `languages/<to>/<from>/<level>.lessons.json` alongside the word file.
  Both need a compiled build (`yarn compile`) because they share the join and
  validation rules with the app. Lesson word counts are per pair, since a
  concept is dropped from a pair when its target word collides with an earlier
  one. A level with no course file, and every custom dictionary, falls back to
  the flat word list.
```

- [ ] **Step 2: Update the architecture section**

Replace the "Phrase format" bullet under "Key cross-cutting concepts":

```markdown
- **Item format**: the engine cycles `Item`s (`src/shared/items.ts`), either
  `{ kind: 'word', source, target }` or `{ kind: 'sentence', id, source, target, gloss }`.
  `source` is the known language, `target` the language being learned. A
  sentence's `target` is a token list: an object token is a word backed by a
  learned concept, a bare string is glue. `layoutTokens` resolves the spacing
  once, in the main process, because `src/renderer/*` compiles to a classic
  script and cannot import it. A sentence stays on screen for
  `SENTENCE_DWELL_MULTIPLIER` times the interval.
```

Add to the `src/shared/` list:

```markdown
- **items.ts** - the display item model: `SentenceToken`, `LaidOutToken`, `Item`, `layoutTokens`, `joinTokens`, `buildItems`.
- **course.ts** - authoring-time model for `languages/_course/`: the glue whitelist and `validateCourse`. Not loaded at runtime, only by `utils/validate_course.js`.
```

Update the `state.ts` line to mention `progressKey` and the per-dictionary `progress` map.

Add to the `utils/` list:

```markdown
- `validate_course.js` - lints `languages/_course/` against the bank. Run it before `generate_pairs.js`.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: courses, lessons files and the item model"
```

---

## Phase B: A1 content

The code is done and the lint runs. Now the content. A1 goes first and alone, because it is where the prompts, the glue whitelist and the lesson rhythm get settled. Only after it is proofread does the fan-out start.

Every content task ends with the lint clean. The lint is not a formality: it is the only mechanical guard against a sentence that reads plausibly and uses a word the learner has never seen.

### Task 12: A1 course order and English sentences

Ordering and writing are one job. You cannot order concepts without knowing what sentences you want them to close, and you cannot write a sentence without knowing what has been taught. So one agent produces both.

**Model:** opus. This is the hardest reasoning in the project - a 180-concept ordering under a closure constraint - and its output is the worked example every later level copies.

**Files:**
- Create: `languages/_course/a1.json`, `languages/_course/a1.sentences.json` (English column only)
- Output for Task 13: a list of concepts the course needs and the bank lacks

**Inputs to hand the agent:**
- `docs/superpowers/specs/2026-08-28-vocabularify-lessons-design.md`
- `src/shared/course.ts` (the rules, in code)
- The A1 concept list: `node -e "console.log(require('./languages/_bank/a1.json').map(r=>r.en.trim().toLowerCase()).join('\n'))"`
- `languages/_audit/bank_a1.md` for the conventions the bank was built on

**The brief:**

Order all 180 A1 concepts into roughly 23 lessons of 5-10, and write 2-3 sentences per lesson. Rules, all enforced by `node utils/validate_course.js --languages en a1`:

- every concept appears in exactly one lesson;
- a sentence may only use concepts taught by the end of its own lesson;
- a sentence must use at least one concept from its own lesson;
- `uses` lists every concept the sentence leans on, and every concept in `uses` must appear as a token;
- a bare string token is glue: punctuation, or an article from `GLUE.en` (`a`, `an`, `the`). Nothing else. If a sentence needs a word that is not glue and not taught, the sentence is wrong, not the rule;
- `t` is the surface form as it appears, capitalisation included. `c` is the lowercase concept id.

Judgement the lint cannot make:

- The first lessons decide whether this feels like a course or a word list. Lesson 1 must close a real sentence. Front-load a pronoun, a copula, a greeting and one concrete noun.
- Group by what sentences need, not by theme. A lesson of five colours closes nothing.
- Sentences should be things a person would say. `The society is good.` is grammatical and worthless.
- Reuse older concepts deliberately. By lesson 10 a sentence has 60 concepts to draw on; a sentence that only uses the current lesson wastes that.
- The bank stores verbs as infinitives and nouns with their article. Sentences inflect. That is expected and is what the gloss exists for.

Deliverable: both files, plus a short list of concepts the course wanted and the bank does not have.

**Acceptance:**

```bash
yarn compile && node utils/validate_course.js --languages en a1
```
Expected: `a1: clean`, `levels checked: 1, errors: 0`.

Then read lessons 1 through 5 aloud. If the first sentence is not something a person would say on their first day with the language, the ordering is wrong and no amount of lint passing fixes it.

---

### Task 13: Bank additions

**Model:** sonnet. Filling seven columns for a handful of concepts, following the conventions already visible in the file.

**Files:**
- Modify: `languages/_bank/a1.json`

- [ ] **Step 1: Add the concepts Task 12 asked for**

Follow the file's conventions exactly, which `languages/_audit/bank_a1.md` records: nouns carry their citation article where the language uses one (`de` der/die/das, `fr` le/la/l', `es` el/la, `it` il/lo/la/l'), verbs are infinitives in every language, English verbs are prefixed `to `.

Add rows at the end of the array. Order inside the bank file does not matter - the course decides presentation order.

- [ ] **Step 2: Regenerate and check the count moved**

```bash
node -e "console.log(require('./languages/_bank/a1.json').length)"
yarn compile && node utils/generate_pairs.js | head -3
node utils/validate_course.js --languages en a1
```
Expected: the new count, `Bank concepts (deduped): 1049 + N`, and `a1: clean`. If the lint now reports `is in the bank but in no lesson`, a concept was added that Task 12's course does not place - add it to a lesson or drop it.

- [ ] **Step 3: Commit**

```bash
git add languages/_bank/a1.json languages
git commit -m "feat(data): A1 concepts the course needs"
```

---

### Task 14: A1 translations

Six agents, one per language, all working from the same finished English column. They run in parallel: nothing they produce is an input to each other.

**Model:** sonnet for `de`, `fr`, `es`, `it`, `ru`. **opus for `tr`** - Turkish is agglutinative and the least represented of the seven, and `languages/_audit/SUMMARY.md` records coined non-words appearing on the original bank generation, where the task was simpler than this.

**Files:**
- Modify: `languages/_course/a1.sentences.json`, one language column each

Each agent writes only its own key inside each sentence's `text` object. Have them emit their column as a separate JSON file (`/tmp/a1-<lang>.json`, a map of sentence id to token array) and merge afterwards, so six agents never write the same file.

**The brief, per language:**

For every sentence in `languages/_course/a1.sentences.json`, write the `<lang>` token list.

- The sentence must be natural. A learner reading it should not be able to tell it was translated.
- It must fit inside `uses`. Every content word maps to a concept already in the list. If your language needs a word that is not in `uses` and not glue, say so instead of inventing one - the English sentence gets rewritten.
- It may use fewer concepts than English. Russian has no present-tense copula, so `to be` simply has no token. That is correct.
- Glue is punctuation plus your language's entry in `GLUE` (`src/shared/course.ts`). Nothing else.
- `t` is the surface form as it appears, capitalisation included. `c` is the concept id, lowercase, from `uses`.
- Look up each concept's bank form (`languages/_bank/a1.json`) before choosing an inflection, so the gloss the learner sees actually explains the token.

**Acceptance, after merging all six:**

```bash
yarn compile && node utils/validate_course.js a1
```
Expected: `a1: clean`, `levels checked: 1, errors: 0`.

```bash
node utils/generate_pairs.js | head -5
node -e "
const l = require('./languages/de/ru/a1.lessons.json');
console.log(JSON.stringify(l.lessons.slice(0,3), null, 1));
"
```
Expected: the first three lessons with sensible counts and readable German with a Russian translation.

---

### Task 15: A1 review

Two reviewers per language, twelve agents in parallel. Different jobs, not two of the same: two identical reviewers make the same mistakes and agreement between them means nothing.

**Model:** sonnet for all twelve.

**Reviewer A, native speaker.** Read every sentence in your language. Flag: unnatural word order, wrong case or agreement, wrong verb form, a register a learner would not use, anything a native speaker would not say. Ignore the concept rules entirely - that is the other reviewer's job. For each flag give the sentence id, what is wrong, and a corrected token list.

**Reviewer B, teacher.** For every sentence in your language check: does it fit A1, is every content word actually taught by that point, and is every bare string token genuinely unavoidable glue rather than a word that should have been taught. Flag any glue entry you think is being leaned on to dodge the rule. Ignore naturalness - that is the other reviewer's job.

Neither reviewer checks token-to-text matching or concept coverage. The lint does that, for free, and it does it better.

**Model:** haiku for the collation step. Merge twelve reports into one list of `{ sentence id, language, what to change }`, deduplicating where both reviewers hit the same sentence.

**The fix loop:**

Either rejection rewrites the sentence in that language. A rejection of the English sentence rewrites it in all seven, because the others were translated from it.

```bash
yarn compile && node utils/validate_course.js a1
```
must be clean after every round. Repeat until a round produces no rejections.

Record the round count and what each round caught in `.vocabularify-sync/PROGRESS.md`. If round 3 still finds real errors in a language, that language's prompt is wrong, not the sentences.

---

### Task 16: Proofread gate

**Owner: the user, not an agent.**

Read all of A1 in Russian and English, and spot-check the other five.

Nothing in Phase C starts until this passes. The whole point of doing A1 alone is that a bad recipe caught here costs one level, and caught later costs five.

```bash
node -e "
const s = require('./languages/_course/a1.sentences.json');
const j = t => t.map(x => typeof x === 'string' ? x : x.t).join(' ').replace(/ ([,.!?;:])/g, '\$1');
for (const x of s) console.log(x.id.padEnd(8), j(x.text.en).padEnd(46), j(x.text.ru));
"
```

Then run the app and go through the first five lessons for real.

- [ ] **Commit once approved**

```bash
git add languages
git commit -m "feat(data): A1 course, 23 lessons and their sentences"
```

---

## Phase C: A2 through C1

Four level pipelines, each repeating Tasks 12, 14 and 15 with its own level. Two waves of two, because the translation step alone is six agents per level and the review step is twelve.

**Wave 1:** A2 (246 concepts, ~31 lessons), B1 (245, ~31 lessons).
**Wave 2:** B2 (206, ~26 lessons), C1 (172, ~22 lessons).

**Model for the ordering step drops to sonnet.** A1 is now a finished worked example and the lint is proven. Turkish stays on opus. Reviewers stay on sonnet.

Levels are independent. Concepts are already partitioned by the bank, and the course only reorders within a level, so the set known on entry to B1 is every A1 and A2 concept regardless of their internal order. `utils/validate_course.js` computes `priorConcepts` that way already. Each level agent gets:

- its own level's concept list;
- the full list of every earlier level's concepts, as "already known";
- `languages/_course/a1.json` and `a1.sentences.json` as the worked example;
- the same brief as Task 12, with the level's own register.

One thing changes with level. At A1 a sentence draws on 180 concepts at most; at C1 it draws on 1049. Sentences should get longer and less trivial as the level rises. A C1 sentence that reads like an A1 sentence is a failure even though it lints clean.

**Per wave:**

```bash
yarn compile && node utils/validate_course.js
node utils/generate_pairs.js
yarn test && yarn typecheck
```
Expected: every finished level `clean`, 210 word files and 210 lessons files per finished level, suite green.

**After both waves:**

```bash
node utils/validate_course.js
node -e "
const fs=require('fs');
for (const l of ['a1','a2','b1','b2','c1']) {
  const c=require('./languages/_course/'+l+'.json');
  const s=require('./languages/_course/'+l+'.sentences.json');
  console.log(l, c.lessons.length+' lessons', s.length+' sentences');
}
"
```
Expected: five clean levels, roughly 140 lessons and 285 sentences in total.

---

## Verification

Run the whole thing before calling it done.

1. `yarn compile && node utils/validate_course.js` - all five levels clean.
2. `node utils/generate_pairs.js` - 210 word files and 210 lessons files, no `skipped` lines.
3. `yarn test` - suite green, including `items`, `course`, `state` and `phraseEngine`.
4. `yarn typecheck` - clean.
5. `yarn start`, German from Russian, A1. Step through lesson 1 with `Shift + →`. The sentence appears after the last word of the lesson and contains no word that has not been shown.
6. Hover `bin`. It shows `sein · быть`.
7. Turn on **Assemble sentences**. The card waits for the sentence to be completed. `Shift + →` away from a half-finished one and auto-advance resumes.
8. Switch to Menu Bar. Sentences appear in the tray title and nothing waits for input.
9. Switch to Checkup. The sentence hides and resolves after 3 s, translation visible throughout.
10. Import a custom `.txt` dictionary. It behaves exactly as before, with no sentences.
11. Switch German/Russian to French/English and back. The German/Russian position is where it was, not reset to the first word.
12. Quit mid-lesson, reopen. Same position.
13. Delete `config.json` from userData, launch. Fresh state, first word, no crash.
14. Take an old `config.json` with a `currentIndex` and no `progress`, launch, and confirm the position is kept rather than reset.
15. `yarn build` packages, and the packaged app finds `languages/` through `extraResources`, lessons files included.

Step 15 has a trap worth checking explicitly: `package.json` bundles `languages/` via `extraResources`. Confirm the new `*.lessons.json` files are inside the packaged app, not filtered out by a glob.
