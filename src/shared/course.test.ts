import { describe, it, expect } from 'vitest';
import { conceptId, dedupeBank, validateCourse } from './course';
import type { CourseFile, SentenceEntry } from './course';

const LANGS = ['en', 'de', 'ru'] as const;

// A minimal but valid course: one lesson of five concepts and two sentences
// that between them use every concept and render every one of them in all
// three languages. The second sentence is past tense so Russian renders the
// copula, which it drops in the present.
function fixture() {
  const course: CourseFile = {
    level: 'a1',
    lessons: [{ id: 1, new: ['hello', 'i', 'to be', 'good', 'day'], sentences: ['a1_001', 'a1_002'] }]
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
    },
    {
      id: 'a1_002',
      uses: ['day', 'to be', 'good'],
      text: {
        en: ['The', { t: 'day', c: 'day' }, { t: 'was', c: 'to be' }, { t: 'good', c: 'good' }, '.'],
        de: ['Der', { t: 'Tag', c: 'day' }, { t: 'war', c: 'to be' }, { t: 'gut', c: 'good' }, '.'],
        ru: [{ t: 'День', c: 'day' }, { t: 'был', c: 'to be' }, { t: 'хороший', c: 'good' }, '.']
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

// The same course with all seven language columns present, for the checks
// that can only be judged against the whole union.
function sevenLanguages() {
  const f = fixture();
  const all = ['en', 'de', 'fr', 'es', 'it', 'tr', 'ru'] as const;
  for (const sentence of f.sentences) {
    for (const lang of all) {
      if (!sentence.text[lang]) {
        sentence.text[lang] = sentence.text.de;
      }
    }
  }
  return { ...f, languages: all };
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

  it('catches a sentence that opens on a lower-case glue token', () => {
    const f = fixture();
    // 'у' is Russian glue, so nothing capitalises it and the sentence renders
    // as "у меня ...". This is what shipped before the check existed.
    f.sentences[0].text.ru = ['у', { t: 'меня', c: 'i' }, '.'];
    const out = validateCourse(f).join('\n');
    expect(out).toContain('starts lower case');
  });

  it('does not flag a sentence that opens on a character with no case', () => {
    const f = fixture();
    f.sentences[0].text.ru = ['«', { t: 'Я', c: 'i' }, '»', '.'];
    const out = validateCourse(f).join('\n');
    expect(out).not.toContain('starts lower case');
  });

  it('collapses many uncoursed bank concepts into one counted error', () => {
    const f = fixture();
    const extra = ['water', 'bread', 'milk', 'salt', 'sugar', 'rice', 'tea', 'oil'];
    f.levelConcepts = [...f.levelConcepts, ...extra];
    const out = validateCourse(f).join('\n');
    expect(out).toContain('8 concepts are in the bank but in no lesson');
    expect(out).toContain('and 2 more');
    // The whole point is that it does not print one line per concept.
    expect(out).not.toContain('"rice" is in the bank but in no lesson');
  });

  it('accepts a bank concept the course lists as untaught', () => {
    const f = fixture();
    f.levelConcepts = [...f.levelConcepts, 'water', 'bread'];
    f.course.untaught = ['water', 'bread'];
    const out = validateCourse(f).join('\n');
    expect(out).not.toContain('in the bank but in no lesson');
  });

  it('still reports a bank concept the untaught list forgot', () => {
    const f = fixture();
    f.levelConcepts = [...f.levelConcepts, 'water', 'bread'];
    f.course.untaught = ['water'];
    const out = validateCourse(f).join('\n');
    expect(out).toContain('"bread" is in the bank but in no lesson');
  });

  it('rejects an untaught entry that a lesson actually teaches', () => {
    const f = fixture();
    const taught = f.course.lessons[0].new[0];
    f.course.untaught = [taught];
    const out = validateCourse(f).join('\n');
    expect(out).toContain(`"${taught}" is listed as untaught but lesson`);
  });

  it('rejects an untaught entry that is not in the level bank', () => {
    const f = fixture();
    f.course.untaught = ['zzz-not-a-concept'];
    const out = validateCourse(f).join('\n');
    expect(out).toContain('"zzz-not-a-concept" is listed as untaught but is not in this level\'s bank');
  });

  it('does not demand sentence coverage for a concept no lesson teaches', () => {
    const f = fixture();
    f.levelConcepts = [...f.levelConcepts, 'water'];
    const out = validateCourse(f).join('\n');
    expect(out).not.toContain('"water" is taught but used by no sentence');
    expect(out).not.toContain('"water" is taught but never renders as a word');
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

  // `uses` is the union across all seven languages, so this check only holds
  // when all seven are linted; a single-column authoring pass must not see it.
  it('reports a concept in uses that appears in no language', () => {
    const f = sevenLanguages();
    f.sentences[0].uses.push('day');
    expect(validateCourse(f).join('\n')).toContain('"day" is in uses but appears in no language');
  });

  it('stays quiet about the union when only some languages are linted', () => {
    const f = fixture();
    f.sentences[0].uses.push('day');
    expect(validateCourse(f).join('\n')).not.toContain('appears in no language');
  });

  it('reports a missing language', () => {
    const f = fixture();
    delete (f.sentences[0].text as Record<string, unknown>).ru;
    expect(validateCourse(f).join('\n')).toContain('missing or empty text for "ru"');
  });

  it('reports a sentence in the bank that no lesson references', () => {
    const f = fixture();
    f.sentences.push({ ...f.sentences[0], id: 'a1_003' });
    expect(validateCourse(f).join('\n')).toContain('"a1_003" is in the bank but no lesson uses it');
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

  // --- Finding 1: malformed input must be reported, never thrown ---

  it('reports a lesson with no "new" array instead of throwing', () => {
    const f = fixture();
    const lesson = f.course.lessons[0] as unknown as Record<string, unknown>;
    delete lesson.new;
    expect(validateCourse(f).join('\n')).toContain('lesson 1: "new" is missing or not an array');
  });

  it('reports a lesson with no "sentences" array instead of throwing', () => {
    const f = fixture();
    const lesson = f.course.lessons[0] as unknown as Record<string, unknown>;
    delete lesson.sentences;
    expect(validateCourse(f).join('\n')).toContain(
      'lesson 1: "sentences" is missing or not an array'
    );
  });

  it('reports a sentence with no "uses" array instead of throwing', () => {
    const f = fixture();
    const sentence = f.sentences[0] as unknown as Record<string, unknown>;
    delete sentence.uses;
    expect(validateCourse(f).join('\n')).toContain('a1_001: "uses" is missing or not an array');
  });

  it('reports a course with no "lessons" array instead of throwing', () => {
    const f = fixture();
    (f.course as unknown as Record<string, unknown>).lessons = undefined;
    expect(validateCourse(f)).toEqual(['course: "lessons" is missing or not an array']);
  });

  it('reports a sentence bank that is not an array instead of throwing', () => {
    const f = fixture();
    (f as unknown as Record<string, unknown>).sentences = undefined;
    expect(validateCourse(f)).toEqual(['course: the sentence bank is not an array']);
  });

  it('reports text[lang] present but empty, not just text[lang] absent', () => {
    const f = fixture();
    f.sentences[0].text.ru = [];
    expect(validateCourse(f).join('\n')).toContain('missing or empty text for "ru"');
  });

  // --- Finding 2: rules that were reachable but untested ---

  it('reports a lesson that introduces a concept absent from the level bank', () => {
    const f = fixture();
    f.course.lessons[0].new.push('space');
    expect(validateCourse(f).join('\n')).toContain('"space" is not in this level\'s bank');
  });

  it('reports a sentence id referenced by two lessons', () => {
    const f = fixture();
    f.course.lessons.push({ id: 2, new: ['day'], sentences: ['a1_001'] });
    expect(validateCourse(f).join('\n')).toContain('already used by lesson');
  });

  it('reports a lesson referencing a sentence id absent from the bank', () => {
    const f = fixture();
    f.course.lessons[0].sentences.push('a1_999');
    expect(validateCourse(f).join('\n')).toContain('is not in the sentence bank');
  });

  it('reports an empty string token', () => {
    const f = fixture();
    f.sentences[0].text.de.push('   ');
    expect(validateCourse(f).join('\n')).toContain('empty string token');
  });

  it('reports a token with no surface form', () => {
    const f = fixture();
    f.sentences[0].text.de.push({ t: '', c: 'day' });
    expect(validateCourse(f).join('\n')).toContain('a token has no surface form');
  });

  it('reports a joined sentence with a double space', () => {
    const f = fixture();
    // A glue token that itself carries a leading space slips past the
    // "loose glue" check (isGlue compares the trimmed form) and past the
    // stray-whitespace check (which only runs on concept tokens that have a
    // `.t`, not on plain glue strings). Placed after another token, the
    // computed inter-token space combines with the glue token's own leading
    // space, so only the join-level check catches it.
    f.sentences[0].text.de.splice(1, 0, ' der');
    expect(validateCourse(f).join('\n')).toContain('double space');
  });

  it('reports a joined sentence with a leading or trailing space', () => {
    const f = fixture();
    // Same bypass as above, but as the very first token: no space is
    // computed in front of it (there is no previous token yet), so its own
    // leading space becomes the joined string's leading space.
    f.sentences[0].text.de.unshift(' der');
    expect(validateCourse(f).join('\n')).toContain('leading or trailing space');
  });

  it('reports a non-last lesson smaller than the minimum size', () => {
    const f = fixture();
    f.course.lessons[0].new = ['hello', 'i', 'to be', 'good'];
    f.course.lessons.push({ id: 2, new: ['day'], sentences: [] });
    expect(validateCourse(f).join('\n')).toContain('4 concepts, expected 5-10');
  });

  // --- Fix round 2: guard every malformed shape the lint can meet ---

  it('reports a non-object element in "lessons" instead of throwing', () => {
    const f = fixture();
    (f.course.lessons as unknown[]).unshift(null);
    expect(validateCourse(f).join('\n')).toContain('course: a lesson is not an object');
  });

  it('reports a token missing "t" entirely instead of throwing', () => {
    const f = fixture();
    (f.sentences[0].text.de as unknown[]).push({ c: 'day' });
    expect(validateCourse(f).join('\n')).toContain('a token has no surface form');
  });

  it('reports a null token instead of throwing', () => {
    const f = fixture();
    (f.sentences[0].text.de as unknown[]).push(null);
    expect(validateCourse(f).join('\n')).toContain('a token has no surface form');
  });

  it('reports "lessons" present but not an array', () => {
    const f = fixture();
    (f.course as unknown as Record<string, unknown>).lessons = 'oops';
    expect(validateCourse(f)).toEqual(['course: "lessons" is missing or not an array']);
  });

  it('reports the sentence bank present but not an array', () => {
    const f = fixture();
    (f as unknown as Record<string, unknown>).sentences = {};
    expect(validateCourse(f)).toEqual(['course: the sentence bank is not an array']);
  });

  it('reports "new" present but not an array', () => {
    const f = fixture();
    (f.course.lessons[0] as unknown as Record<string, unknown>).new = 'oops';
    expect(validateCourse(f).join('\n')).toContain('lesson 1: "new" is missing or not an array');
  });

  it('reports a sentence bank entry missing "id"', () => {
    const f = fixture();
    const entry = f.sentences[0] as unknown as Record<string, unknown>;
    delete entry.id;
    expect(validateCourse(f).join('\n')).toContain('course: a sentence bank entry is missing "id"');
  });

  // --- Fix round 3: pin the remaining unguarded shapes ---

  it('reports a non-object element in the sentence bank instead of throwing', () => {
    const f = fixture();
    (f.sentences as unknown[]).unshift(null);
    expect(validateCourse(f).join('\n')).toContain('course: a sentence bank entry is missing "id"');
  });

  it('reports "sentences" present but not an array in a lesson', () => {
    const f = fixture();
    (f.course.lessons[0] as unknown as Record<string, unknown>).sentences = 'oops';
    expect(validateCourse(f).join('\n')).toContain('lesson 1: "sentences" is missing or not an array');
  });

  it('reports "uses" present but not an array in a sentence', () => {
    const f = fixture();
    const sentence = f.sentences[0] as unknown as Record<string, unknown>;
    sentence.uses = 'oops';
    expect(validateCourse(f).join('\n')).toContain('a1_001: "uses" is missing or not an array');
  });
});

describe('validateCourse coverage', () => {
  it('reports a concept no sentence uses', () => {
    const f = fixture();
    f.course.lessons[0].new.push('night');
    f.levelConcepts.push('night');
    expect(validateCourse(f).join('\n')).toContain('"night" is taught but used by no sentence');
  });

  it('reports a concept that is in uses but renders in only some languages', () => {
    const f = fixture();
    f.sentences[1].text.de = f.sentences[1].text.de.filter(
      t => typeof t === 'string' || t.c !== 'day'
    );
    const out = validateCourse(f).join('\n');
    expect(out).toContain('[de]: "day" is taught but never renders as a word');
    expect(out).not.toContain('[en]: "day"');
  });

  it('exempts a concept the language has no free word for', () => {
    const f = fixture();
    // Turkish builds ability as a suffix, so `can` never renders as a token.
    const tr = ['en', 'de', 'tr'] as const;
    const g = { ...f, languages: tr };
    g.course.lessons[0].new = ['hello', 'i', 'to be', 'good', 'can'];
    g.levelConcepts = ['hello', 'i', 'to be', 'good', 'can'];
    g.sentences[0].uses = ['hello', 'i', 'to be', 'good', 'can'];
    g.sentences[1].uses = ['to be', 'good'];
    g.sentences[0].text.tr = [{ t: 'Merhaba', c: 'hello' }, ',', { t: 'ben', c: 'i' }, { t: 'iyiyim', c: 'to be' }, '.'];
    g.sentences[1].text.tr = [{ t: 'Gün', c: 'good' }, { t: 'iyiydi', c: 'to be' }, '.'];
    g.sentences[0].text.en = [{ t: 'I', c: 'i' }, { t: 'can', c: 'can' }, { t: 'be', c: 'to be' }, { t: 'good', c: 'good' }, ',', { t: 'hello', c: 'hello' }, '.'];
    g.sentences[0].text.de = [{ t: 'Ich', c: 'i' }, { t: 'kann', c: 'can' }, { t: 'gut', c: 'good' }, { t: 'sein', c: 'to be' }, ',', { t: 'hallo', c: 'hello' }, '.'];
    g.sentences[1].text.en = ['The', { t: 'good', c: 'good' }, { t: 'was', c: 'to be' }, 'there', '.'];
    g.sentences[1].text.de = ['Das', { t: 'Gute', c: 'good' }, { t: 'war', c: 'to be' }, 'da', '.'];
    // `hello` is NOT exempt and Turkish stops rendering it, so the check has
    // to stay loud about that one while staying quiet about `can`.
    g.sentences[0].text.tr = [{ t: 'ben', c: 'i' }, { t: 'iyiyim', c: 'to be' }, '.'];
    const out = validateCourse(g).join('\n');
    expect(out).toContain('[tr]: "hello" is taught but never renders as a word');
    expect(out).not.toContain('"can" is taught but never renders');
  });

  it('reports an exemption that has gone stale', () => {
    const f = fixture();
    const es = ['es'] as const;
    const g = { ...f, languages: es };
    g.course.lessons[0].new = ['it', 'i', 'to be', 'good', 'day'];
    g.levelConcepts = ['it', 'i', 'to be', 'good', 'day'];
    g.sentences[0].uses = ['it', 'i', 'to be', 'good'];
    g.sentences[1].uses = ['day', 'to be', 'good'];
    // `it` is exempt for Spanish, so rendering it means the exemption is wrong.
    g.sentences[0].text.es = [{ t: 'Ello', c: 'it' }, { t: 'es', c: 'to be' }, { t: 'bueno', c: 'good' }, ',', { t: 'yo', c: 'i' }, '.'];
    g.sentences[1].text.es = ['El', { t: 'día', c: 'day' }, { t: 'era', c: 'to be' }, { t: 'bueno', c: 'good' }, '.'];
    expect(validateCourse(g).join('\n')).toContain(
      '[es]: "it" is listed in NO_FREE_WORD but does render - drop the exemption'
    );
  });
});

describe('validateCourse gloss override', () => {
  it('accepts an override that names a second lemma', () => {
    const f = fixture();
    f.sentences[0].text.de[3] = { t: 'bin', c: 'to be', g: 'sein' };
    expect(validateCourse(f)).toEqual([]);
  });

  it('rejects an empty override', () => {
    const f = fixture();
    f.sentences[0].text.de[3] = { t: 'bin', c: 'to be', g: '  ' };
    expect(validateCourse(f).join('\n')).toContain('has an empty gloss override');
  });
});

// A per-target course: `target` is the language code being learned, and a
// source language's translation may be absent (it arrives later). Built from
// the same two-sentence, five-concept level as `fixture()`, but "de" is the
// target and "ru" is the only source, and "ru" is missing from the second
// sentence on purpose - that is the case the new rules exist for.
function targetFixture() {
  return {
    course: {
      level: 'a1',
      lessons: [{ id: 1, new: ['hello', 'i', 'to be', 'good', 'day'], sentences: ['de_a1_001', 'de_a1_002'] }]
    } as CourseFile,
    sentences: [
      {
        id: 'de_a1_001',
        uses: ['hello', 'i', 'to be', 'good'],
        text: {
          de: [{ t: 'Hallo', c: 'hello' }, ',', { t: 'ich', c: 'i' }, { t: 'bin', c: 'to be' }, { t: 'gut', c: 'good' }, '.'],
          ru: [{ t: 'Привет', c: 'hello' }, ',', { t: 'я', c: 'i' }, { t: 'хорошо', c: 'good' }, '.']
        }
      },
      {
        id: 'de_a1_002',
        uses: ['day', 'to be', 'good'],
        text: {
          // "ru" deliberately absent: this target's Russian source has not
          // been authored for this sentence yet.
          de: ['Der', { t: 'Tag', c: 'day' }, { t: 'war', c: 'to be' }, { t: 'gut', c: 'good' }, '.']
        }
      }
    ] as SentenceEntry[],
    levelConcepts: ['hello', 'i', 'to be', 'good', 'day'],
    priorConcepts: [] as string[],
    languages: ['de', 'ru'],
    target: 'de'
  };
}

describe('validateCourse with a per-target course', () => {
  it('accepts a well-formed per-target course, source translation missing and all', () => {
    expect(validateCourse(targetFixture())).toEqual([]);
  });

  it('requires text[target], non-empty', () => {
    const f = targetFixture();
    delete (f.sentences[0].text as Record<string, unknown>).de;
    expect(validateCourse(f).join('\n')).toContain('missing or empty text for "de"');
  });

  it('does not demand a source language be present at all', () => {
    const f = targetFixture();
    const out = validateCourse(f).join('\n');
    expect(out).not.toContain('missing or empty text for "ru"');
  });

  it('still checks a source language exactly as before when it is present', () => {
    const f = targetFixture();
    f.sentences[0].text.ru.splice(2, 0, 'сильно');
    expect(validateCourse(f).join('\n')).toContain('"сильно" is loose glue');
  });

  it('demands render coverage only in the target language, not a source language', () => {
    const f = targetFixture();
    // "i" never renders in Russian, but it does in German (the target).
    f.sentences[0].text.ru = (f.sentences[0].text.ru as SentenceToken[]).filter(
      (t) => typeof t === 'string' || t.c !== 'i'
    );
    const out = validateCourse(f).join('\n');
    expect(out).not.toContain('[ru]');
  });

  it('still reports a concept taught but used by no sentence, target set', () => {
    const f = targetFixture();
    f.course.lessons[0].new.push('water');
    f.levelConcepts.push('water');
    expect(validateCourse(f).join('\n')).toContain('"water" is taught but used by no sentence');
  });

  it('does not flag a stale NO_FREE_WORD exemption in a source language', () => {
    const f = targetFixture();
    const g = { ...f, languages: ['de', 'tr'] };
    g.course.lessons[0].new.push('can');
    g.levelConcepts.push('can');
    g.sentences[0].uses.push('can');
    // Turkish is exempt from rendering "can" (it is a suffix there), so
    // rendering it anyway is normally a stale-exemption error - but not when
    // "tr" is only a source column of a per-target course.
    (g.sentences[0].text as Record<string, SentenceToken[]>).tr = [
      { t: 'Yapabilirsin', c: 'can' }
    ];
    (g.sentences[0].text.de as SentenceToken[]).push({ t: 'kannst', c: 'can' });
    const out = validateCourse(g).join('\n');
    expect(out).not.toContain('[tr]');
  });

  it('runs the uses-union check over the languages present in the sentence', () => {
    const f = targetFixture();
    // Both "de" and "ru" are present on this sentence, and both are linted.
    f.sentences[0].uses.push('day');
    expect(validateCourse(f).join('\n')).toContain('"day" is in uses but appears in no language');
  });

  it('skips the uses-union check when a present language is not being linted', () => {
    const f = targetFixture();
    const g = { ...f, languages: ['de'] };
    // "ru" is present on this sentence but not in the linted set, so the
    // union cannot be judged and must stay quiet.
    g.sentences[0].uses.push('day');
    expect(validateCourse(g).join('\n')).not.toContain('appears in no language');
  });
});

describe('validateCourse grammar tags', () => {
  it('reports a sentence with no grammar tags', () => {
    const f = fixture();
    const input = { ...f, grammar: { levelTopicIds: ['g1'], priorTopicIds: [] } };
    expect(validateCourse(input).join('\n')).toContain('0 grammar tag(s), expected 1-3');
  });

  it('reports a sentence with more than 3 grammar tags', () => {
    const f = fixture();
    f.sentences[0].grammar = ['g1', 'g2', 'g3', 'g4'];
    f.sentences[1].grammar = ['g1'];
    const input = { ...f, grammar: { levelTopicIds: ['g1', 'g2', 'g3', 'g4'], priorTopicIds: [] } };
    expect(validateCourse(input).join('\n')).toContain('4 grammar tag(s), expected 1-3');
  });

  it('reports a duplicate grammar tag', () => {
    const f = fixture();
    f.sentences[0].grammar = ['g1', 'g1'];
    f.sentences[1].grammar = ['g1'];
    const input = { ...f, grammar: { levelTopicIds: ['g1'], priorTopicIds: [] } };
    expect(validateCourse(input).join('\n')).toContain('grammar tag "g1" is duplicated');
  });

  it('reports a grammar tag that names no known topic', () => {
    const f = fixture();
    f.sentences[0].grammar = ['bogus'];
    f.sentences[1].grammar = ['g1'];
    const input = { ...f, grammar: { levelTopicIds: ['g1'], priorTopicIds: [] } };
    expect(validateCourse(input).join('\n')).toContain('grammar tag "bogus" is not a known topic');
  });

  it('accepts a grammar tag from an earlier level', () => {
    const f = fixture();
    f.sentences[0].grammar = ['p1'];
    f.sentences[1].grammar = ['g1'];
    const input = { ...f, grammar: { levelTopicIds: ['g1'], priorTopicIds: ['p1'] } };
    expect(validateCourse(input).join('\n')).not.toContain('is not a known topic');
  });
});

describe('validateCourse grammar topic coverage', () => {
  it('reports a topic tagged by too few sentences and too few lessons', () => {
    const f = fixture();
    f.sentences[0].grammar = ['g1'];
    f.sentences[1].grammar = ['g1'];
    const input = { ...f, grammar: { levelTopicIds: ['g1'], priorTopicIds: [] } };
    expect(validateCourse(input).join('\n')).toContain(
      '"g1" tagged by 2 sentence(s) in 1 lesson(s)'
    );
  });

  it('reports a topic tagged by enough sentences but too few lessons', () => {
    const f = fixture();
    f.sentences.push({ ...f.sentences[0], id: 'a1_003' });
    f.course.lessons[0].sentences.push('a1_003');
    f.sentences[0].grammar = ['g1'];
    f.sentences[1].grammar = ['g1'];
    f.sentences[2].grammar = ['g1'];
    const input = { ...f, grammar: { levelTopicIds: ['g1'], priorTopicIds: [] } };
    expect(validateCourse(input).join('\n')).toContain(
      '"g1" tagged by 3 sentence(s) in 1 lesson(s)'
    );
  });

  it('collapses many under-covered grammar topics into one counted error', () => {
    const f = fixture();
    // Neither sentence tags any of these eight topics, so all eight are
    // under-covered at 0 sentences in 0 lessons.
    f.sentences[0].grammar = ['zzz'];
    f.sentences[1].grammar = ['zzz'];
    const topics = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'];
    const input = { ...f, grammar: { levelTopicIds: topics, priorTopicIds: [] } };
    const out = validateCourse(input).join('\n');
    expect(out).toContain('8 grammar topics are under-covered');
    expect(out).toContain('and 2 more');
    // The whole point is that it does not print one line per topic.
    expect(out).not.toContain('"g7" tagged by');
  });
});
