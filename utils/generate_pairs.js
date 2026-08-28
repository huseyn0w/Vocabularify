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

// level -> { course: { lessons }, sentenceById, lessonOfConcept, orderedRows } or null
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
  if (!course || typeof course !== "object" || !Array.isArray(course.lessons)) {
    skipped.push(`${level}: course "lessons" is missing or not an array, level skipped`);
    courses[level] = null;
    continue;
  }

  const rawSentences = fs.existsSync(sentenceFile) ? readJson(sentenceFile) : [];
  if (!Array.isArray(rawSentences)) {
    skipped.push(`${level}: sentence bank is not an array, treated as empty`);
  }

  // A bank entry with no string "id" can never be matched against anything a
  // lesson references. Report it once and drop it here instead of letting it
  // reach the Map keyed by that id.
  const sentences = [];
  (Array.isArray(rawSentences) ? rawSentences : []).forEach((entry, index) => {
    const id = entry && typeof entry === "object" ? entry.id : undefined;
    if (typeof id !== "string" || id.length === 0) {
      skipped.push(`${level}: sentence bank entry ${index} is missing "id"`);
      return;
    }
    sentences.push(entry);
  });
  const sentenceById = new Map(sentences.map((s) => [s.id, s]));

  // Normalize each lesson once so every pass below can trust ".id", ".new"
  // and ".sentences"; report a malformed field here instead of at every site
  // that would otherwise crash on it. A lesson that is not an object cannot
  // be read at all, not even ".id" for the messages below, so it is reported
  // and dropped outright.
  const lessons = [];
  course.lessons.forEach((lesson, index) => {
    if (!lesson || typeof lesson !== "object") {
      skipped.push(`${level}: lesson ${index} is not an object`);
      return;
    }
    const id = lesson.id !== undefined ? lesson.id : `#${index}`;
    if (lesson.id === undefined) {
      skipped.push(`${level} lesson ${id}: "id" is missing, using its index`);
    }
    if (!Array.isArray(lesson.new)) {
      skipped.push(`${level} lesson ${id}: "new" is missing or not an array`);
    }
    if (!Array.isArray(lesson.sentences)) {
      skipped.push(`${level} lesson ${id}: "sentences" is missing or not an array`);
    }
    lessons.push({
      id,
      new: Array.isArray(lesson.new) ? lesson.new : [],
      sentences: Array.isArray(lesson.sentences) ? lesson.sentences : [],
    });
  });

  const lessonOfConcept = new Map();
  lessons.forEach((lesson, index) => {
    for (const concept of lesson.new) {
      lessonOfConcept.set(concept, index);
    }
  });

  // Reorder the level's rows to follow the course. Concepts the course does
  // not mention keep their bank order and land at the end, so nothing is lost.
  const byConcept = new Map(banked[level].map((row) => [conceptId(row.en), row]));
  const orderedRows = [];
  for (const lesson of lessons) {
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

  courses[level] = { course: { lessons }, sentenceById, lessonOfConcept, orderedRows };
  console.log(`${level}: course with ${lessons.length} lessons, ${sentences.length} sentences`);
}

function glossFor(sentence, to, from, level, lessonId) {
  const gloss = {};
  if (!Array.isArray(sentence.uses)) {
    skipped.push(`${level} lesson ${lessonId}: sentence "${sentence.id}" is missing "uses"`);
    return gloss;
  }
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
    // same target word, only the lowest-level one survives. This set is
    // shared across all five levels, so within a level it is the first
    // concept *visited* that wins, not the first in bank order - and course
    // ordering decides visit order. Reordering or adding to a course can
    // therefore change which of two colliding concepts survives (the bank
    // has both `she -> sie` and `they -> sie`), not just the order words
    // appear in the word list. That is intended, not a regression.
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

      const lessons = [];
      for (const [index, lesson] of loaded.course.lessons.entries()) {
        const sentenceItems = [];
        for (const id of lesson.sentences) {
          const sentence = loaded.sentenceById.get(id);
          if (!sentence) {
            skipped.push(`${level} lesson ${lesson.id}: sentence "${id}" is not in the bank`);
            continue;
          }
          if (!sentence.text || typeof sentence.text !== "object") {
            skipped.push(`${level} lesson ${lesson.id}: sentence "${sentence.id}" is missing "text"`);
            continue;
          }
          const targetTokens = sentence.text[to];
          const sourceTokens = sentence.text[from];
          let ok = true;
          if (!Array.isArray(targetTokens)) {
            skipped.push(
              `${level} lesson ${lesson.id}: sentence "${sentence.id}" is missing its "${to}" column (target)`,
            );
            ok = false;
          }
          if (!Array.isArray(sourceTokens)) {
            skipped.push(
              `${level} lesson ${lesson.id}: sentence "${sentence.id}" is missing its "${from}" column (source)`,
            );
            ok = false;
          }
          if (!ok) continue;
          sentenceItems.push({
            id: sentence.id,
            target: targetTokens,
            source: joinTokens(sourceTokens),
            gloss: glossFor(sentence, to, from, level, lesson.id),
          });
        }
        lessons.push({ count: counts[index], sentences: sentenceItems });
      }
      fs.writeFileSync(lessonsPath, `${JSON.stringify({ lessons }, null, 2)}\n`);
      lessonFiles++;
    }
    summary.push(`${to}/${from}: ${pairTotal}`);
  }
}

console.log(summary.join("\n"));
if (skipped.length > 0) {
  const skippedLines = [...new Set(skipped)];
  console.log(`\nskipped (${skippedLines.length}):`);
  for (const line of skippedLines) console.log(`  ${line}`);
}
console.log(
  `\n${DRY_RUN ? "[DRY RUN] " : ""}pairs: ${summary.length}, ` +
    `word files: ${pairFiles}, lessons files: ${lessonFiles}`,
);
