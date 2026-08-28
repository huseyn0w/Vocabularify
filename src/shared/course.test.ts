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
