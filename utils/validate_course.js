/*
 * Lints languages/_course/ against languages/_bank/, and lints every
 * per-target course under languages/_course/<target>/ against the shared
 * bank plus that target's grammar syllabus in languages/_grammar/<target>.json.
 *
 * Requires a compiled build, because the validation rules and the sentence
 * join rule live in src/shared and must not be duplicated here:
 *
 *   yarn compile && node utils/validate_course.js
 *   node utils/validate_course.js a1 a2            # only these levels
 *   node utils/validate_course.js --languages en   # only this language column
 *   node utils/validate_course.js --target de      # only the "de" per-target course
 *
 * Without --target, both the shared course and every per-target course
 * (any languages/_course/<code>/ directory named after one of the seven
 * language codes) are linted.
 *
 * The --languages flag exists for the authoring pass: the course and the
 * English sentences are written first, and have to lint clean before the
 * other six columns are translated. For a per-target course it narrows which
 * SOURCE columns are checked; the target column is always checked, since a
 * per-target sentence's target text is required, never optional.
 *
 * Coverage is part of the validation, not a side report: every concept the
 * level teaches has to appear in some sentence's `uses` AND render as a word
 * in every linted language (in a per-target course, in the target language
 * only - a source column is allowed to be untranslated so far). The only
 * exemptions are in NO_FREE_WORD, for concepts a language has no standalone
 * word for at all.
 *
 * A per-target course also requires each sentence to carry 1-3 grammar
 * topic tags naming ids from languages/_grammar/<target>.json, and every
 * topic taught at the level to be tagged by at least 3 sentences across at
 * least 3 different lessons. This is a lint, not a grammar detector: the tag
 * is the author's claim, checked against the topic's `test` field by a human
 * reviewer.
 *
 * Exit codes: 2 if any setup problem occurred (missing build, an unrecognised
 * argument, a bank/course/sentence/grammar file that will not parse, a course
 * file with no matching sentence file, or - for a per-target course - a
 * missing or unparsable grammar file); else 1 if any validation error
 * occurred; else 0.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const ROOT = path.join(REPO_ROOT, "languages");
const BANK = path.join(ROOT, "_bank");
const COURSE = path.join(ROOT, "_course");
const GRAMMAR = path.join(ROOT, "_grammar");
const COMPILED = path.join(REPO_ROOT, "out", "shared", "course.js");

const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];

if (!fs.existsSync(COMPILED)) {
  console.error("out/shared/course.js is missing. Run `yarn compile` first.");
  process.exit(2);
}
const { validateCourse, dedupeBank, conceptId, NO_FREE_WORD } = require(COMPILED);


function readJson(file) {
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(file, "utf-8")) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const rowsByLevel = {};
for (const level of LEVELS) {
  const file = path.join(BANK, `${level}.json`);
  if (!fs.existsSync(file)) {
    rowsByLevel[level] = [];
    continue;
  }
  const result = readJson(file);
  if (!result.ok) {
    console.error(`${path.relative(REPO_ROOT, file)}: could not parse JSON: ${result.error}`);
    process.exit(2);
  }
  rowsByLevel[level] = result.value;
}
const banked = dedupeBank(LEVELS, rowsByLevel);

const argv = process.argv.slice(2);
const langFlag = argv.indexOf("--languages");
const langValueIndex = langFlag === -1 ? -1 : langFlag + 1;
const targetFlag = argv.indexOf("--target");
const targetValueIndex = targetFlag === -1 ? -1 : targetFlag + 1;

const flagIndices = new Set([langFlag, langValueIndex, targetFlag, targetValueIndex]);
const unknown = argv.filter((arg, index) => {
  if (flagIndices.has(index)) {
    return false;
  }
  return !LEVELS.includes(arg);
});
if (unknown.length > 0) {
  console.error(
    `unrecognised argument(s): ${unknown.join(", ")}. Valid levels: ${LEVELS.join(", ")}; ` +
      "use --languages <codes> for the language column, --target <code> for one per-target course.",
  );
  process.exit(2);
}

const languages =
  langFlag === -1
    ? LANGS
    : (argv[langValueIndex] || "").split(",").filter((code) => LANGS.includes(code));
if (languages.length === 0) {
  console.error(`--languages needs a comma-separated subset of: ${LANGS.join(",")}`);
  process.exit(2);
}

let onlyTarget = null;
if (targetFlag !== -1) {
  onlyTarget = argv[targetValueIndex];
  if (!LANGS.includes(onlyTarget)) {
    console.error(`--target needs one of: ${LANGS.join(", ")}`);
    process.exit(2);
  }
}

const requestedLevels = argv.filter(
  (arg, index) => !flagIndices.has(index) && LEVELS.includes(arg),
);
const levelsToCheck = requestedLevels.length > 0 ? requestedLevels : LEVELS;

let totalErrors = 0;
let checked = 0;
let setupProblems = 0;

// A concept can satisfy the coverage check while never actually appearing as
// itself: a token tagged with the concept but carrying a `g` override is
// openly saying it is a different word. Turkish teaches `yıl` for "year" and
// only ever shows `yaşında`, because an age cannot be said any other way.
//
// This is reported, never an error, because only a person can tell the two
// cases apart. Turkish `year` is a real gap and wants its own sentence.
// Spanish `to love` renders only as `querer` because a native reviewer ruled
// `amar` wrong for a pet, and Russian `to have` only as `есть` because
// `иметь` is textbook register - forcing either into a sentence would be
// worse than not showing it.
//
// In a per-target course this only makes sense for the target language - a
// source column not rendering a concept plainly is a translation gap, not
// something worth softening into a note.
function conceptsOnlyShownAsAnotherWord(levelConcepts, sentences, languages, noFreeWord) {
  const out = [];
  for (const lang of languages) {
    const plain = new Set();
    const overridden = new Set();
    for (const entry of Array.isArray(sentences) ? sentences : []) {
      const tokens = entry && entry.text ? entry.text[lang] : undefined;
      for (const token of Array.isArray(tokens) ? tokens : []) {
        if (token && typeof token === "object" && typeof token.c === "string") {
          (typeof token.g === "string" && token.g ? overridden : plain).add(conceptId(token.c));
        }
      }
    }
    const exempt = new Set((noFreeWord && noFreeWord[lang]) || []);
    for (const concept of levelConcepts) {
      if (!plain.has(concept) && overridden.has(concept) && !exempt.has(concept)) {
        out.push(`[${lang}]: "${concept}" only ever appears as another word`);
      }
    }
  }
  return out;
}

// Every source language's translation progress for a per-target course, so a
// half-translated target is visible rather than silently tolerated. Not an
// error: German sentences are authored with Russian first, and the other
// five arrive later.
function reportSourceCompleteness(label, target, sourceLanguages, sentences) {
  const list = Array.isArray(sentences) ? sentences : [];
  const total = list.length;
  for (const lang of sourceLanguages) {
    if (lang === target) continue;
    const translated = list.filter(
      (s) => s && s.text && Array.isArray(s.text[lang]) && s.text[lang].length > 0,
    ).length;
    console.log(`${label}: [${lang}] ${translated}/${total} sentences translated`);
  }
}

// Lints one level of one course (the shared course, or one target's). Prints
// its own output and returns whether it was actually checked and whether a
// setup problem (as opposed to a validation error) occurred, so the caller
// can fold the counts into the run-wide totals and exit code.
function lintLevel({ label, courseFile, sentenceFile, levelConcepts, priorConcepts, languages, target, grammar }) {
  const courseFileRel = path.relative(REPO_ROOT, courseFile);
  const sentenceFileRel = path.relative(REPO_ROOT, sentenceFile);

  if (!fs.existsSync(courseFile)) {
    console.log(`${label}: no course file, skipped`);
    return { checked: false, setupProblem: false, errorCount: 0 };
  }
  if (!fs.existsSync(sentenceFile)) {
    console.error(`${label}: ${courseFileRel} exists but ${sentenceFileRel} does not`);
    return { checked: false, setupProblem: true, errorCount: 0 };
  }

  const courseResult = readJson(courseFile);
  if (!courseResult.ok) {
    console.error(`${label}: could not parse ${courseFileRel}: ${courseResult.error}`);
    return { checked: false, setupProblem: true, errorCount: 0 };
  }
  const sentenceResult = readJson(sentenceFile);
  if (!sentenceResult.ok) {
    console.error(`${label}: could not parse ${sentenceFileRel}: ${sentenceResult.error}`);
    return { checked: false, setupProblem: true, errorCount: 0 };
  }

  const errors = validateCourse({
    course: courseResult.value,
    sentences: sentenceResult.value,
    levelConcepts,
    priorConcepts,
    languages,
    target,
    grammar,
  });

  // The render-coverage half of the lint only judges the target language
  // once `target` is set (see src/shared/course.ts); the softened note
  // mirrors that so it does not talk about a source column at all.
  const softened = conceptsOnlyShownAsAnotherWord(
    levelConcepts,
    sentenceResult.value,
    target ? [target] : languages,
    NO_FREE_WORD,
  );
  for (const note of softened) {
    console.log(`${label}: ${note} (not an error)`);
  }

  if (target) {
    reportSourceCompleteness(label, target, languages, sentenceResult.value);
  }

  if (errors.length === 0) {
    console.log(`${label}: clean`);
  } else {
    console.error(`\n${label}: ${errors.length} error(s)`);
    for (const error of errors) {
      console.error(`  ${error}`);
    }
  }

  return { checked: true, setupProblem: false, errorCount: errors.length };
}

function levelConceptsFor(level) {
  const priorConcepts = [];
  for (const earlier of LEVELS) {
    if (earlier === level) break;
    priorConcepts.push(...banked[earlier].map((row) => conceptId(row.en)));
  }
  const levelConcepts = banked[level].map((row) => conceptId(row.en));
  return { levelConcepts, priorConcepts };
}

function fold(result) {
  if (result.checked) checked++;
  if (result.setupProblem) setupProblems++;
  totalErrors += result.errorCount;
}

// --- The shared course, byte-for-byte as before -----------------------------

if (!onlyTarget) {
  for (const level of LEVELS) {
    if (!levelsToCheck.includes(level)) continue;
    const { levelConcepts, priorConcepts } = levelConceptsFor(level);
    fold(
      lintLevel({
        label: level,
        courseFile: path.join(COURSE, `${level}.json`),
        sentenceFile: path.join(COURSE, `${level}.sentences.json`),
        levelConcepts,
        priorConcepts,
        languages,
      }),
    );
  }
}

// --- Per-target courses -------------------------------------------------

// Any directory under languages/_course/ named after one of the seven
// language codes is a per-target course. Only "de" is expected to exist for
// now; the others are discovered the same way once they do.
const targetDirs = fs.existsSync(COURSE)
  ? fs
      .readdirSync(COURSE, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && LANGS.includes(entry.name))
      .map((entry) => entry.name)
      .sort()
  : [];

const targetsToCheck = onlyTarget
  ? targetDirs.includes(onlyTarget)
    ? [onlyTarget]
    : []
  : targetDirs;

if (onlyTarget && targetsToCheck.length === 0) {
  console.error(`--target ${onlyTarget}: no course directory at ${path.relative(REPO_ROOT, path.join(COURSE, onlyTarget))}`);
  setupProblems++;
}

for (const target of targetsToCheck) {
  const grammarFile = path.join(GRAMMAR, `${target}.json`);
  const grammarFileRel = path.relative(REPO_ROOT, grammarFile);
  if (!fs.existsSync(grammarFile)) {
    console.error(`${target}: ${grammarFileRel} does not exist`);
    setupProblems++;
    continue;
  }
  const grammarResult = readJson(grammarFile);
  if (!grammarResult.ok) {
    console.error(`${target}: could not parse ${grammarFileRel}: ${grammarResult.error}`);
    setupProblems++;
    continue;
  }
  const grammarLevels = grammarResult.value && grammarResult.value.levels;
  if (!grammarLevels || typeof grammarLevels !== "object") {
    console.error(`${target}: ${grammarFileRel} is missing "levels"`);
    setupProblems++;
    continue;
  }

  const targetDir = path.join(COURSE, target);
  // The --languages flag narrows which source columns are checked for this
  // target; the target column itself is always checked regardless of it.
  const targetLanguages = languages.includes(target) ? languages : [target, ...languages];

  for (const level of LEVELS) {
    if (!levelsToCheck.includes(level)) continue;
    const { levelConcepts, priorConcepts } = levelConceptsFor(level);

    const levelTopicIds = Array.isArray(grammarLevels[level])
      ? grammarLevels[level].map((t) => t && t.id).filter((id) => typeof id === "string")
      : [];
    const priorTopicIds = [];
    for (const earlier of LEVELS) {
      if (earlier === level) break;
      if (Array.isArray(grammarLevels[earlier])) {
        priorTopicIds.push(
          ...grammarLevels[earlier].map((t) => t && t.id).filter((id) => typeof id === "string"),
        );
      }
    }

    fold(
      lintLevel({
        label: `${target}/${level}`,
        courseFile: path.join(targetDir, `${level}.json`),
        sentenceFile: path.join(targetDir, `${level}.sentences.json`),
        levelConcepts,
        priorConcepts,
        languages: targetLanguages,
        target,
        grammar: { levelTopicIds, priorTopicIds },
      }),
    );
  }
}

console.log(`\nlevels checked: ${checked}, errors: ${totalErrors}, setup problems: ${setupProblems}`);
process.exit(setupProblems > 0 ? 2 : totalErrors > 0 ? 1 : 0);
