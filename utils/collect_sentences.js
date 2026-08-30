/*
 * Folds the sentence files written by the authoring agents into a target
 * language's course.
 *
 *   node utils/collect_sentences.js de a1 [--dry-run]
 *
 * Reads every .json in .git/sdd/<target>-course/sentences/, appends the
 * sentences to languages/_course/<target>/<level>.sentences.json, and files
 * each one under the lesson its id names. A sentence id is
 * <level>_L<lesson>_<n>, so the lesson is read from the id rather than
 * trusted from a separate field that could disagree with it.
 *
 * Refuses to overwrite: a sentence whose id is already in the course is
 * reported and skipped, so a rerun cannot silently replace reviewed work.
 * Run utils/validate_course.js afterwards - this script checks structure and
 * identity, never whether a sentence is any good.
 */
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");
const positional = ARGS.filter((a) => !a.startsWith("--"));
const unknown = ARGS.filter((a) => a.startsWith("--") && a !== "--dry-run");
if (unknown.length > 0) {
  console.error(`unknown argument: ${unknown.join(" ")}`);
  process.exit(2);
}
const [TARGET, LEVEL] = positional;
if (!LANGS.includes(TARGET) || !LEVELS.includes(LEVEL)) {
  console.error("usage: node utils/collect_sentences.js <target> <level> [--dry-run]");
  process.exit(2);
}

// A1's sentences were written into sentences/ before a second level existed.
// Every level after it gets its own sentences-<level>/ directory, so a rerun
// cannot see another level's files and reject every one of them as a bad id.
const SDD = path.join(REPO, ".git", "sdd", `${TARGET}-course`);
const LEVEL_DIR = path.join(SDD, `sentences-${LEVEL}`);
const IN = fs.existsSync(LEVEL_DIR) ? LEVEL_DIR : path.join(SDD, "sentences");
const COURSE_FILE = path.join(REPO, "languages", "_course", TARGET, `${LEVEL}.json`);
const SENT_FILE = path.join(REPO, "languages", "_course", TARGET, `${LEVEL}.sentences.json`);

const course = JSON.parse(fs.readFileSync(COURSE_FILE, "utf8"));
const sentences = JSON.parse(fs.readFileSync(SENT_FILE, "utf8"));

const lessonById = new Map(course.lessons.map((l) => [l.id, l]));
const known = new Set(sentences.map((s) => s.id));
const idPattern = new RegExp(`^${LEVEL}_L(\\d{3})_(\\d+)$`);

const files = fs.existsSync(IN)
  ? fs.readdirSync(IN).filter((f) => f.endsWith(".json")).sort()
  : [];
if (files.length === 0) {
  console.error(`no sentence files in ${path.relative(REPO, IN)}`);
  process.exit(2);
}

const added = [];
const problems = [];
for (const file of files) {
  let batch;
  try {
    batch = JSON.parse(fs.readFileSync(path.join(IN, file), "utf8"));
  } catch (err) {
    problems.push(`${file}: will not parse: ${err.message}`);
    continue;
  }
  if (!Array.isArray(batch)) {
    problems.push(`${file}: is not an array`);
    continue;
  }
  let taken = 0;
  for (const entry of batch) {
    const id = entry && typeof entry === "object" ? entry.id : undefined;
    if (typeof id !== "string") {
      problems.push(`${file}: an entry has no id`);
      continue;
    }
    const match = idPattern.exec(id);
    if (!match) {
      problems.push(`${file}: "${id}" is not ${LEVEL}_L<lesson>_<n>`);
      continue;
    }
    const lesson = lessonById.get(Number(match[1]));
    if (!lesson) {
      problems.push(`${file}: "${id}" names lesson ${Number(match[1])}, which does not exist`);
      continue;
    }
    if (known.has(id)) {
      problems.push(`${file}: "${id}" is already in the course, left alone`);
      continue;
    }
    known.add(id);
    sentences.push(entry);
    lesson.sentences.push(id);
    added.push(id);
    taken++;
  }
  console.log(`${file}: ${taken} of ${batch.length}`);
}

// A lesson's sentences are shown in id order, which is the order the author
// wrote them in; the id's trailing number is what carries that order.
for (const lesson of course.lessons) lesson.sentences.sort();

console.log(`\nadded ${added.length}, problems ${problems.length}`);
for (const line of problems.slice(0, 20)) console.log(`  ${line}`);
if (problems.length > 20) console.log(`  ... and ${problems.length - 20} more`);

const empty = course.lessons.filter((l) => l.sentences.length === 0).map((l) => l.id);
if (empty.length > 0) {
  console.log(`\n${empty.length} lessons still have no sentences: ${empty.slice(0, 20).join(", ")}${empty.length > 20 ? " ..." : ""}`);
}

if (DRY_RUN) {
  console.log("\ndry run, nothing written");
} else {
  fs.writeFileSync(COURSE_FILE, `${JSON.stringify(course, null, 2)}\n`);
  fs.writeFileSync(SENT_FILE, `${JSON.stringify(sentences, null, 2)}\n`);
  console.log("\ncourse written");
}
