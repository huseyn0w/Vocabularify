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
 * After each level is checked it also reports the concepts that are taught as
 * a card but appear in no sentence. That is not an error - some concepts have
 * no natural A1 frame - so it is printed on stdout and never reaches the exit
 * code; it is there so the author sees the gap.
 *
 * Exit codes: 2 if any setup problem occurred (missing build, an unrecognised
 * argument, a bank/course/sentence file that will not parse, or a course file
 * with no matching sentence file); else 1 if any validation error occurred;
 * else 0.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const ROOT = path.join(REPO_ROOT, "languages");
const BANK = path.join(ROOT, "_bank");
const COURSE = path.join(ROOT, "_course");
const COMPILED = path.join(REPO_ROOT, "out", "shared", "course.js");

const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];

if (!fs.existsSync(COMPILED)) {
  console.error("out/shared/course.js is missing. Run `yarn compile` first.");
  process.exit(2);
}
const { validateCourse, dedupeBank, conceptId } = require(COMPILED);

// Concepts taught by the course but used by no sentence. Reported, never
// counted as an error: a concept like `zero` has no natural A1 sentence, and
// forcing one would be worse than leaving it as a card. `uses` is the union
// across all languages, so this is language-independent and does not care
// which columns were linted.
function conceptsInNoSentence(levelConcepts, sentences) {
  const used = new Set();
  for (const entry of Array.isArray(sentences) ? sentences : []) {
    const uses = entry && typeof entry === "object" ? entry.uses : undefined;
    for (const concept of Array.isArray(uses) ? uses : []) {
      used.add(concept);
    }
  }
  return levelConcepts.filter((concept) => !used.has(concept));
}

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

const unknown = argv.filter((arg, index) => {
  if (index === langFlag || index === langValueIndex) {
    return false;
  }
  return !LEVELS.includes(arg);
});
if (unknown.length > 0) {
  console.error(
    `unrecognised argument(s): ${unknown.join(", ")}. Valid levels: ${LEVELS.join(", ")}; use --languages <codes> for the language column.`,
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
const requested = argv.filter((arg, index) => index !== langFlag && index !== langValueIndex && LEVELS.includes(arg));
const targets = requested.length > 0 ? requested : LEVELS;

let totalErrors = 0;
let checked = 0;
let setupProblems = 0;

for (const level of LEVELS) {
  const courseFile = path.join(COURSE, `${level}.json`);
  const sentenceFile = path.join(COURSE, `${level}.sentences.json`);
  const courseFileRel = path.relative(REPO_ROOT, courseFile);
  const sentenceFileRel = path.relative(REPO_ROOT, sentenceFile);

  if (!targets.includes(level)) {
    continue;
  }
  if (!fs.existsSync(courseFile)) {
    console.log(`${level}: no course file, skipped`);
    continue;
  }
  if (!fs.existsSync(sentenceFile)) {
    console.error(`${level}: ${courseFileRel} exists but ${sentenceFileRel} does not`);
    setupProblems++;
    continue;
  }

  const courseResult = readJson(courseFile);
  if (!courseResult.ok) {
    console.error(`${level}: could not parse ${courseFileRel}: ${courseResult.error}`);
    setupProblems++;
    continue;
  }
  const sentenceResult = readJson(sentenceFile);
  if (!sentenceResult.ok) {
    console.error(`${level}: could not parse ${sentenceFileRel}: ${sentenceResult.error}`);
    setupProblems++;
    continue;
  }

  const priorConcepts = [];
  for (const earlier of LEVELS) {
    if (earlier === level) break;
    priorConcepts.push(...banked[earlier].map((row) => conceptId(row.en)));
  }

  const levelConcepts = banked[level].map((row) => conceptId(row.en));
  const errors = validateCourse({
    course: courseResult.value,
    sentences: sentenceResult.value,
    levelConcepts,
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

  const unused = conceptsInNoSentence(levelConcepts, sentenceResult.value);
  if (unused.length > 0) {
    console.log(
      `${level}: ${unused.length} concept(s) taught but in no sentence (not an error): ${unused.join(", ")}`,
    );
  }
}

console.log(`\nlevels checked: ${checked}, errors: ${totalErrors}, setup problems: ${setupProblems}`);
process.exit(setupProblems > 0 ? 2 : totalErrors > 0 ? 1 : 0);
