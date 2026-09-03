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
  /** Topic ids from the target's grammar syllabus this sentence
   *  demonstrates. Required (1-3 ids) only in a per-target course - the tag
   *  is the author's claim, checked against the topic's `test` field by a
   *  human reviewer, never detected from the tokens. */
  grammar?: string[];
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
  /** Set only for a per-target course: the target language's code. Turns on
   *  the target-specific completeness and coverage rules below - a source
   *  language becomes optional, and render coverage is judged only in this
   *  language. */
  target?: string;
  /** Set only for a per-target course: the grammar topics available at this
   *  level. Turns on the per-sentence tag rules and per-topic coverage rules
   *  below. */
  grammar?: {
    /** Topics this level teaches. */
    levelTopicIds: string[];
    /** Topics every earlier level taught. */
    priorTopicIds: string[];
  };
}

/** The course is authored in seven languages. Checks that judge a sentence
 *  across the whole union of them only hold when all seven are present. */
export const ALL_LANGUAGES = 7;

export const MIN_LESSON_SIZE = 5;
export const MAX_LESSON_SIZE = 10;

// A per-target sentence claims 1 to 3 grammar topics. One tag was tried and
// proved too loose to say anything; more than 3 stops being a tag and starts
// being a syllabus.
export const MIN_TAGS_PER_SENTENCE = 1;
export const MAX_TAGS_PER_SENTENCE = 3;

// A topic is "covered" only once several sentences carry it in several
// lessons. One sentence per topic was tried and proved too weak - a topic
// got credited five times by sentences that all showed the same half of it.
export const MIN_SENTENCES_PER_TOPIC = 3;
export const MIN_LESSONS_PER_TOPIC = 3;

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
  // 'do' / 'does' / 'did' are English's dummy auxiliary: obligatory in a
  // negation or a question and carrying no meaning of their own, so no
  // concept backs them. The same holds for the infinitive marker 'to' - the
  // concept id already reads "to help" - and for 'of', which stands in for
  // the German genitive and the bank has no usable row for.
  // "'s" is the possessive marker, which stands where German puts a
  // genitive ending and carries no concept of its own.
  en: ['a', 'an', 'the', 'do', 'does', 'did', 'to', 'of', "'s"],
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
  const { course, sentences, levelConcepts, priorConcepts, languages, target, grammar } = input;
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
  // Restoring the old dictionary put thousands of words into a level whose
  // course covers a few hundred, so naming each one drowns every other error.
  // This stays an error - a level's course is meant to teach the level - but
  // it reports as one line with a count and a sample.
  const notInALesson = levelConcepts.filter((concept) => !introducedIn.has(concept));
  if (notInALesson.length === 1) {
    errors.push(`"${notInALesson[0]}" is in the bank but in no lesson`);
  } else if (notInALesson.length > 1) {
    const shown = notInALesson.slice(0, 6).map((c) => `"${c}"`).join(', ');
    const rest = notInALesson.length > 6 ? `, and ${notInALesson.length - 6} more` : '';
    errors.push(`${notInALesson.length} concepts are in the bank but in no lesson: ${shown}${rest}`);
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
        errors.push(...checkSentence(sentence, lesson.id, known, introduced, languages, target, grammar));
      }
    }
  }

  // The concepts a lesson introduces, not every row the bank holds at this
  // level. A word in no lesson is not taught, and the check above already
  // named it; running it through coverage too would report it a second time
  // under a message that says "taught".
  errors.push(...checkCoverage([...introducedIn.keys()], bank, languages, target));

  // Grammar topic coverage draws on which lesson each sentence landed in,
  // which `usedBy` above already worked out while checking that every
  // sentence is used exactly once.
  if (grammar) {
    errors.push(...checkGrammarCoverage(grammar.levelTopicIds, bank, usedBy));
  }

  return errors;
}

/** Every concept the course teaches has to be put to work: named in some
 *  sentence's `uses`, and actually rendered as a word in every language that
 *  has a word for it. A card the course never uses again is the thing this
 *  rebuild exists to remove.
 *
 *  When `target` is set (a per-target course), the "named in `uses`" half
 *  still holds for the whole course, but the "renders as a word" half is
 *  judged only in the target language - a source column may not be
 *  translated yet, and that is not a coverage gap. */
function checkCoverage(
  taughtConcepts: readonly string[],
  bank: readonly SentenceEntry[],
  languages: readonly string[],
  target?: string
): string[] {
  const errors: string[] = [];
  const inUses = new Set<string>();
  const rendered = new Map<string, Set<string>>();
  // Track every checked language plus the target, even if the target was
  // somehow left out of `languages`, so its render set is never missing.
  const trackedLanguages = target && !languages.includes(target) ? [...languages, target] : languages;
  for (const lang of trackedLanguages) {
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
    for (const lang of trackedLanguages) {
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

  for (const concept of taughtConcepts) {
    if (!inUses.has(concept)) {
      errors.push(`"${concept}" is taught but used by no sentence`);
    }
  }

  // A per-target course only demands this half in the target language: a
  // source column not rendering a concept yet is a translation gap, not a
  // coverage failure.
  const renderLanguages = target ? [target] : languages;
  for (const lang of renderLanguages) {
    const seen = rendered.get(lang) ?? new Set<string>();
    const exempt = new Set(NO_FREE_WORD[lang] ?? []);
    for (const concept of taughtConcepts) {
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

/** Every grammar topic taught this level has to actually be demonstrated:
 *  tagged on at least `MIN_SENTENCES_PER_TOPIC` sentences, sitting in at
 *  least `MIN_LESSONS_PER_TOPIC` different lessons. One sentence tagging a
 *  topic five times in one lesson can show only one half of it; several
 *  lessons is what forces different sentences, and different examples. Only
 *  a sentence a lesson actually uses counts - an unused bank entry is
 *  already reported elsewhere, and counting it here would let an orphaned
 *  sentence launder a topic's coverage. */
function checkGrammarCoverage(
  levelTopicIds: readonly string[],
  bank: readonly SentenceEntry[],
  usedBy: ReadonlyMap<string, number>
): string[] {
  const sentencesByTopic = new Map<string, Set<string>>();
  const lessonsByTopic = new Map<string, Set<number>>();

  for (const sentence of bank) {
    const lessonId = usedBy.get(sentence.id);
    if (lessonId === undefined) {
      continue;
    }
    const tags = Array.isArray(sentence.grammar) ? sentence.grammar : [];
    for (const tag of tags) {
      if (typeof tag !== 'string') {
        continue;
      }
      if (!sentencesByTopic.has(tag)) {
        sentencesByTopic.set(tag, new Set());
        lessonsByTopic.set(tag, new Set());
      }
      sentencesByTopic.get(tag)?.add(sentence.id);
      lessonsByTopic.get(tag)?.add(lessonId);
    }
  }

  const underCovered: { id: string; sentenceCount: number; lessonCount: number }[] = [];
  for (const id of levelTopicIds) {
    const sentenceCount = sentencesByTopic.get(id)?.size ?? 0;
    const lessonCount = lessonsByTopic.get(id)?.size ?? 0;
    if (sentenceCount < MIN_SENTENCES_PER_TOPIC || lessonCount < MIN_LESSONS_PER_TOPIC) {
      underCovered.push({ id, sentenceCount, lessonCount });
    }
  }

  const describe = (t: { id: string; sentenceCount: number; lessonCount: number }) =>
    `"${t.id}" tagged by ${t.sentenceCount} sentence(s) in ${t.lessonCount} lesson(s)`;

  const errors: string[] = [];
  if (underCovered.length === 1) {
    errors.push(
      `${describe(underCovered[0])}, expected at least ${MIN_SENTENCES_PER_TOPIC} sentences in ${MIN_LESSONS_PER_TOPIC} lessons`
    );
  } else if (underCovered.length > 1) {
    const shown = underCovered.slice(0, 6).map(describe).join('; ');
    const rest = underCovered.length > 6 ? `, and ${underCovered.length - 6} more` : '';
    errors.push(
      `${underCovered.length} grammar topics are under-covered, expected at least ` +
        `${MIN_SENTENCES_PER_TOPIC} sentences in ${MIN_LESSONS_PER_TOPIC} lessons: ${shown}${rest}`
    );
  }
  return errors;
}

function checkSentence(
  sentence: SentenceEntry,
  lessonId: number,
  known: ReadonlySet<string>,
  introduced: ReadonlySet<string>,
  languages: readonly string[],
  target?: string,
  grammar?: { levelTopicIds: string[]; priorTopicIds: string[] }
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

  // A per-target course requires 1 to 3 grammar tags, each naming a real
  // topic. Which topic is true is the author's claim, checked by a human
  // against the topic's `test` field - never inferred from the tokens here.
  if (grammar) {
    const tags = Array.isArray(sentence.grammar) ? sentence.grammar : [];
    if (tags.length < MIN_TAGS_PER_SENTENCE || tags.length > MAX_TAGS_PER_SENTENCE) {
      errors.push(
        `${sentence.id}: ${tags.length} grammar tag(s), expected ${MIN_TAGS_PER_SENTENCE}-${MAX_TAGS_PER_SENTENCE}`
      );
    }
    const allowedTopics = new Set([...grammar.levelTopicIds, ...grammar.priorTopicIds]);
    const seenTags = new Set<string>();
    for (const tag of tags) {
      if (typeof tag !== 'string') {
        continue;
      }
      if (seenTags.has(tag)) {
        errors.push(`${sentence.id}: grammar tag "${tag}" is duplicated`);
        continue;
      }
      seenTags.add(tag);
      // A tag naming a topic from a later level cannot be told apart from a
      // typo here, so both report as unknown.
      if (!allowedTopics.has(tag)) {
        errors.push(`${sentence.id}: grammar tag "${tag}" is not a known topic`);
      }
    }
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
      // In a per-target course a source language may not be translated yet;
      // only the target is required to be there.
      if (!target || lang === target) {
        errors.push(`${sentence.id}: missing or empty text for "${lang}"`);
      }
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
        }
        // No check that `g` differs from `t`: an override is legitimate when
        // the token IS the citation form of a second lemma. Spanish `bien`
        // and Turkish `bütün` are exactly that - uninflected words standing
        // in for a concept whose bank citation is a different word.
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
    // A sentence that opens on a glue token opens in lower case, because glue
    // is written as a bare string and nothing capitalises it. Russian "У меня"
    // came out "у меня" for exactly this reason. Only flag a first character
    // that HAS a case and is in the lower one, so a numeral, a quotation mark
    // or a script without case never trips it.
    const first = text.trim()[0] ?? '';
    if (first.toLowerCase() !== first.toUpperCase() && first === first.toLowerCase()) {
      errors.push(`${sentence.id} [${lang}]: starts lower case, "${text.slice(0, 24)}"`);
    }
  }

  // A concept listed in `uses` but never rendered means `uses` is overstated,
  // which would make the unlock check pass for a sentence that does not need
  // the concept at all.
  //
  // In the shared course `uses` is the union across all seven languages, so
  // this can only be judged when all seven are being linted. During a
  // single-column authoring pass it would demand one language carry the
  // whole union, which no language does: running it against Turkish alone
  // reported 114 errors, every one of them a concept another column renders.
  //
  // In a per-target course `uses` is the union over whichever languages this
  // sentence actually has - a source column can be absent. So the check runs
  // instead whenever every language this sentence's `text` actually has is
  // one being linted; the domain to search is then those present languages,
  // not the full `languages` list (which may include other sentences'
  // untranslated sources).
  let shouldCheckUnion = languages.length >= ALL_LANGUAGES;
  let unionDomain: readonly string[] = languages;
  if (target) {
    const presentLangs = Object.keys(GLUE).filter(lang => {
      const tokens = sentence.text?.[lang];
      return Array.isArray(tokens) && tokens.length > 0;
    });
    shouldCheckUnion = presentLangs.length > 0 && presentLangs.every(lang => languages.includes(lang));
    unionDomain = presentLangs;
  }
  if (shouldCheckUnion) {
    for (const concept of usesList) {
      const appears = unionDomain.some(lang =>
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
