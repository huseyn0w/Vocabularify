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
