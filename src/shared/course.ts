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

/** The course is authored in seven languages. Checks that judge a sentence
 *  across the whole union of them only hold when all seven are present. */
export const ALL_LANGUAGES = 7;

export const MIN_LESSON_SIZE = 5;
export const MAX_LESSON_SIZE = 10;

// Words allowed to appear in a sentence without being a taught concept.
// Articles and their preposition fusions were the original members, but the
// real test any entry has to pass is narrower than "is an article": the word
// is grammatically obligatory, carries no meaning of its own apart from that
// grammatical role, and there is nothing a learner could be taught about it -
// no concept card would ever be written for it. Everything else -
// prepositions, adverbs, particles that DO carry meaning - has to be taught
// first. Widening this list is a deliberate act: each entry is a word the
// learner will see without ever having been shown it.
export const GLUE: Readonly<Record<string, readonly string[]>> = {
  en: ['a', 'an', 'the'],
  de: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem',
       'einer', 'eines', 'im', 'am', 'zum', 'zur', 'ins', 'vom', 'beim'],
  // 'ne' / "n'" - the first half of French bipartite negation ("ne ... pas").
  // 'pas' carries the meaning and is backed by the taught "not" concept; 'ne'
  // is obligatory in written French and means nothing on its own. Dropping it
  // is spoken register, wrong for a phrasebook someone reads.
  fr: ['le', 'la', 'les', "l'", 'un', 'une', 'des', 'du', 'de', "d'", 'au', 'aux',
       'ne', "n'"],
  // 'a' here is ONLY the Spanish personal "a" before a human direct object
  // ("Conozco a ese hombre") - obligatory and meaningless there. Spanish also
  // has a directional "a" with real meaning ("voy a Madrid"), backed by the
  // taught "to" concept; that "a" must stay a token, never glue.
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'del', 'a'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'un', 'uno', 'una', "un'",
       'al', 'del', 'nel', 'alla', 'della', 'nella'],
  // 'mı' / 'mi' / 'mu' / 'mü' / 'mısın' / 'misin' / 'musun' / 'müsün' - the
  // yes/no question particle (vowel-harmonised, with or without the 2nd
  // person singular ending). Turkish cannot ask a yes/no question without it,
  // and there is nothing to teach: it is the Turkish spelling of the English
  // inversion/do-support a learner already gets for free.
  tr: ['bir', 'mı', 'mi', 'mu', 'mü', 'mısın', 'misin', 'musun', 'müsün'],
  // 'у' - the Russian possessive construction has no verb of its own. In "У
  // меня есть брат" the verb is "есть" (a form of the taught "to be") and 'у'
  // is purely structural.
  ru: ['у']
};

// Concepts a language genuinely cannot render as a free word, so the coverage
// check must not demand one. The test is narrow and structural: the language
// has no standalone word for the concept at all. Turkish builds ability, the
// locative and the dative as suffixes, so `can`, `in` and `to` are never
// separate words; Spanish and Italian have no ordinary subject pronoun for
// inanimate `it`.
//
// This is NOT an escape hatch for "the sentence happened not to use it".
// Turkish `with` and `or` DO have free words (`ile`, `veya`); if they never
// render, that is a gap in the sentences, and the fix is a sentence, not an
// entry here. Every entry names a property of the language.
//
// The check also fails when a listed concept DOES render, so a stale
// exemption cannot sit here unnoticed.
export const NO_FREE_WORD: Readonly<Record<string, readonly string[]>> = {
  en: [],
  de: [],
  fr: [],
  // Spanish and Italian drop the subject pronoun, and the inanimate subject
  // `it` has no ordinary word at all: `ello` and `esso` are literary.
  es: ['it'],
  it: ['it'],
  tr: ['can', 'in', 'to', 'without'],
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
  // instead of at every site that would otherwise crash on it. A lesson
  // element that is not an object cannot be read at all, not even `.id` for
  // the messages below, so guard it the same way the sentence bank loop
  // above guards a non-object entry: report it once and drop it.
  const lessons: CourseLesson[] = [];
  for (const lesson of course.lessons) {
    if (!lesson || typeof lesson !== 'object') {
      errors.push('course: a lesson is not an object');
      continue;
    }
    if (!Array.isArray(lesson.new)) {
      errors.push(`lesson ${lesson.id}: "new" is missing or not an array`);
    }
    if (!Array.isArray(lesson.sentences)) {
      errors.push(`lesson ${lesson.id}: "sentences" is missing or not an array`);
    }
    lessons.push({
      ...lesson,
      new: Array.isArray(lesson.new) ? lesson.new : [],
      sentences: Array.isArray(lesson.sentences) ? lesson.sentences : []
    });
  }

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

  errors.push(...checkCoverage(levelConcepts, bank, languages));

  return errors;
}

/** Every concept the level teaches has to be put to work: named in some
 *  sentence's `uses`, and actually rendered as a word in every language that
 *  has a word for it. A card the course never uses again is the thing this
 *  rebuild exists to remove. */
function checkCoverage(
  levelConcepts: readonly string[],
  bank: readonly SentenceEntry[],
  languages: readonly string[]
): string[] {
  const errors: string[] = [];
  const inUses = new Set<string>();
  const rendered = new Map<string, Set<string>>();
  for (const lang of languages) {
    rendered.set(lang, new Set());
  }

  for (const sentence of bank) {
    if (!sentence || typeof sentence !== 'object') {
      continue;
    }
    for (const concept of Array.isArray(sentence.uses) ? sentence.uses : []) {
      if (typeof concept === 'string') {
        inUses.add(conceptId(concept));
      }
    }
    const text = sentence.text && typeof sentence.text === 'object' ? sentence.text : {};
    for (const lang of languages) {
      const seen = rendered.get(lang);
      const tokens = (text as Record<string, unknown>)[lang];
      if (!seen || !Array.isArray(tokens)) {
        continue;
      }
      for (const token of tokens) {
        if (token && typeof token === 'object' && typeof (token as { c?: unknown }).c === 'string') {
          seen.add(conceptId((token as { c: string }).c));
        }
      }
    }
  }

  for (const concept of levelConcepts) {
    if (!inUses.has(concept)) {
      errors.push(`"${concept}" is taught but used by no sentence`);
    }
  }

  for (const lang of languages) {
    const seen = rendered.get(lang) ?? new Set<string>();
    const exempt = new Set(NO_FREE_WORD[lang] ?? []);
    for (const concept of levelConcepts) {
      if (seen.has(concept) || exempt.has(concept)) {
        continue;
      }
      errors.push(`[${lang}]: "${concept}" is taught but never renders as a word`);
    }
    for (const concept of exempt) {
      if (seen.has(concept)) {
        errors.push(
          `[${lang}]: "${concept}" is listed in NO_FREE_WORD but does render - drop the exemption`
        );
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

  // Tokens with no readable surface form (null, or an object with no string
  // `t`) are reported below and then kept out of `safeTokens` - joining or
  // reading `.c` off one of those would crash, so both the join checks and
  // the "appears in no language" check after this loop read the filtered
  // list instead of the raw one.
  const safeTokensByLang = new Map<string, SentenceToken[]>();

  for (const lang of languages) {
    const tokens = sentence.text?.[lang];
    if (!Array.isArray(tokens) || tokens.length === 0) {
      errors.push(`${sentence.id}: missing or empty text for "${lang}"`);
      continue;
    }
    const safeTokens: SentenceToken[] = [];
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
        safeTokens.push(token);
        continue;
      }
      if (!token || typeof token.t !== 'string' || token.t.length === 0) {
        errors.push(`${sentence.id} [${lang}]: a token has no surface form`);
        continue;
      }
      safeTokens.push(token);
      if (token.t !== token.t.trim() || /\s\s/.test(token.t)) {
        errors.push(`${sentence.id} [${lang}]: token "${token.t}" has stray whitespace`);
      }
      if (!uses.has(token.c)) {
        errors.push(
          `${sentence.id} [${lang}]: token "${token.t}" claims "${token.c}", which is not in uses`
        );
      }
      // The lemma override exists for one concept carried by two verbs. It
      // must name a real second lemma, not repeat the surface form and not
      // restate what the bank already says.
      if (token.g !== undefined) {
        if (typeof token.g !== 'string' || token.g.trim().length === 0) {
          errors.push(`${sentence.id} [${lang}]: token "${token.t}" has an empty gloss override`);
        } else if (token.g !== token.g.trim() || /\s\s/.test(token.g)) {
          errors.push(
            `${sentence.id} [${lang}]: gloss override "${token.g}" has stray whitespace`
          );
        } else if (token.g === token.t) {
          errors.push(
            `${sentence.id} [${lang}]: token "${token.t}" overrides its gloss with itself`
          );
        }
      }
    }
    safeTokensByLang.set(lang, safeTokens);
    const text = joinTokens(safeTokens);
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
  //
  // `uses` is the union across all seven languages, so this can only be judged
  // when all seven are being linted. During a single-column authoring pass it
  // would demand one language carry the whole union, which no language does:
  // running it against Turkish alone reported 114 errors, every one of them a
  // concept another column renders.
  if (languages.length >= ALL_LANGUAGES) {
    for (const concept of usesList) {
      const appears = languages.some(lang =>
        (safeTokensByLang.get(lang) ?? []).some(
          token => typeof token !== 'string' && token.c === concept
        )
      );
      if (!appears) {
        errors.push(`${sentence.id}: "${concept}" is in uses but appears in no language`);
      }
    }
  }

  return errors;
}
