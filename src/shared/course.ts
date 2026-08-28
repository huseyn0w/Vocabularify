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

  // Nothing below is checkable without these two being arrays, so report and
  // stop rather than let a missing/malformed shape crash every pass below.
  if (!Array.isArray(course.lessons)) {
    return ['course: "lessons" is missing or not an array'];
  }
  if (!Array.isArray(sentences)) {
    return ['course: the sentence bank is not an array'];
  }

  // A bank entry that is not an object, or has no id, cannot be matched
  // against anything a lesson references. Report it once and drop it from
  // every pass below instead of crashing on `sentence.id`.
  const bank: SentenceEntry[] = [];
  for (const entry of sentences) {
    const id = entry && typeof entry === 'object' ? (entry as SentenceEntry).id : undefined;
    if (typeof id !== 'string' || id.length === 0) {
      errors.push('course: a sentence bank entry is missing "id"');
      continue;
    }
    bank.push(entry);
  }

  const levelSet = new Set(levelConcepts);

  // Normalize each lesson's array fields once so every pass below can trust
  // `.new` and `.sentences` are arrays; report a malformed field once here
  // instead of at every site that would otherwise crash on it.
  const lessons = course.lessons.map(lesson => {
    if (!Array.isArray(lesson.new)) {
      errors.push(`lesson ${lesson.id}: "new" is missing or not an array`);
    }
    if (!Array.isArray(lesson.sentences)) {
      errors.push(`lesson ${lesson.id}: "sentences" is missing or not an array`);
    }
    return {
      ...lesson,
      new: Array.isArray(lesson.new) ? lesson.new : [],
      sentences: Array.isArray(lesson.sentences) ? lesson.sentences : []
    };
  });

  // Every concept of the level is introduced exactly once, and nothing foreign
  // is introduced.
  const introducedIn = new Map<string, number>();
  for (const lesson of lessons) {
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
  lessons.forEach((lesson, i) => {
    const size = lesson.new.length;
    const isLast = i === lessons.length - 1;
    const tooSmall = isLast ? size < 1 : size < MIN_LESSON_SIZE;
    if (tooSmall || size > MAX_LESSON_SIZE) {
      errors.push(
        `lesson ${lesson.id}: ${size} concepts, expected ${MIN_LESSON_SIZE}-${MAX_LESSON_SIZE}` +
          (isLast ? ' (the last lesson may be smaller)' : '')
      );
    }
  });

  // Sentence references resolve, and every sentence is used exactly once.
  const byId = new Map(bank.map(s => [s.id, s]));
  const usedBy = new Map<string, number>();
  for (const lesson of lessons) {
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
  for (const sentence of bank) {
    if (!usedBy.has(sentence.id)) {
      errors.push(`sentence "${sentence.id}" is in the bank but no lesson uses it`);
    }
  }

  // Walk the course in order so each sentence is checked against the pool of
  // concepts the learner actually has at that point.
  const known = new Set(priorConcepts);
  for (const lesson of lessons) {
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
  if (!Array.isArray(sentence.uses)) {
    errors.push(`${sentence.id}: "uses" is missing or not an array`);
  }
  const usesList = Array.isArray(sentence.uses) ? sentence.uses : [];
  const uses = new Set(usesList);

  for (const concept of usesList) {
    if (!known.has(concept)) {
      errors.push(`${sentence.id}: uses "${concept}", not taught by the end of lesson ${lessonId}`);
    }
  }
  if (!usesList.some(concept => introduced.has(concept))) {
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
  for (const concept of usesList) {
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
