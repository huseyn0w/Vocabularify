// The display item model. Framework-free and unit-tested, like the rest of
// `src/shared`: the renderer, the main process and the offline data tooling
// all agree on these shapes.

/** One piece of a sentence. An object is a word backed by a learned concept:
 *  `t` is the surface form exactly as it appears (capitalisation included, so
 *  a sentence-initial token differs from its bank entry by case) and `c` is
 *  the concept id. A bare string is glue - punctuation, or an obligatory
 *  function word such as an article.
 *
 *  `g` overrides the citation form shown on hover, for the case where one
 *  concept is carried by two different verbs in one language: the bank holds
 *  a single `to be`, but Spanish splits it into `ser` and `estar` and Italian
 *  into `essere` and `stare`. Without the override, hovering `estoy` claims
 *  its dictionary form is `ser`, which is simply false - and it is false on
 *  38% of the Spanish `to be` tokens in A1. The override names the lemma this
 *  token actually inflects from; the translation still comes from the
 *  concept, because the concept is what the learner was taught. */
export type SentenceToken = string | { t: string; c: string; g?: string };

// A sentence has no separate plain-text field: joining its tokens IS the
// sentence. So the join rule has exactly one implementation, here. The
// renderer imports it; `utils/*.js` require the compiled `out/shared/items.js`.
const NO_SPACE_BEFORE = /^[,.!?;:)\]}»…]/;
const NO_SPACE_AFTER = /[([{«'']$/;

/** A token with its spacing already decided. The main process sends these to
 *  the renderer, which draws one element per token and prepends a space when
 *  `space` is set - so the join rule never needs a second implementation in a
 *  file that cannot import this one. */
export interface LaidOutToken {
  text: string;
  /** The concept id when this token is a learned word, null for glue. */
  concept: string | null;
  /** The token's own citation form, when it differs from the concept's.
   *  Null whenever the concept's own citation is the honest answer. */
  lemma: string | null;
  /** Whether a space goes in front of this token. */
  space: boolean;
}

export function layoutTokens(tokens: SentenceToken[]): LaidOutToken[] {
  const out: LaidOutToken[] = [];
  let previous = '';
  for (const token of tokens) {
    const text = typeof token === 'string' ? token : token?.t;
    if (typeof text !== 'string' || !text) {
      continue;
    }
    const space =
      previous !== '' && !NO_SPACE_BEFORE.test(text) && !NO_SPACE_AFTER.test(previous);
    const lemma = typeof token === 'string' || typeof token.g !== 'string' ? null : token.g;
    out.push({
      text,
      concept: typeof token === 'string' ? null : token.c,
      lemma,
      space
    });
    previous = text;
  }
  return out;
}

export function joinTokens(tokens: SentenceToken[]): string {
  return layoutTokens(tokens)
    .map(token => (token.space ? ` ${token.text}` : token.text))
    .join('');
}

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
