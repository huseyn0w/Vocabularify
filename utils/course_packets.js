/*
 * Cuts a target language's course into packets for the agents that write the
 * sentences.
 *
 * A sentence may only use words the learner has already met, so each packet
 * has to carry the whole pool available at the point its first lesson starts,
 * not just the words that lesson introduces. That pool is what makes the
 * packets large and what makes them self-contained: an agent never has to
 * open the bank or the course to know what it is allowed to say.
 *
 *   node utils/course_packets.js de a1 --size 8
 *
 * Reads languages/_bank/<level>.json and languages/_course/<target>/<level>.json,
 * which carries both the lessons and the grammar schedule. Writes one markdown
 * packet per slice into .git/sdd/<target>-course/packets/.
 */
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];

const ARGS = process.argv.slice(2);
const positional = ARGS.filter((a) => !a.startsWith("--"));
const sizeFlag = ARGS.indexOf("--size");
const SLICE = sizeFlag === -1 ? 8 : Number(ARGS[sizeFlag + 1]);
// Lessons whose sentences already exist do not need a packet, but they are
// still walked below: the pool a later lesson may draw on is everything
// taught before it, whether or not that lesson is being written now.
const fromFlag = ARGS.indexOf("--from");
const FROM = fromFlag === -1 ? 0 : Number(ARGS[fromFlag + 1]);
const [TARGET, LEVEL] = positional;

if (!LANGS.includes(TARGET) || !LEVELS.includes(LEVEL) || !Number.isInteger(SLICE) || SLICE < 1) {
  console.error("usage: node utils/course_packets.js <target> <level> [--size N] [--from LESSON]");
  process.exit(2);
}

const SDD = path.join(REPO, ".git", "sdd", `${TARGET}-course`);
const OUT = path.join(SDD, "packets");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const conceptId = (s) => String(s ?? "").trim().toLowerCase();

const course = readJson(path.join(REPO, "languages", "_course", TARGET, `${LEVEL}.json`));
const schedule = course.grammarSchedule ?? [];
const grammar = readJson(path.join(REPO, "languages", "_grammar", `${TARGET}.json`));

// The bank is keyed by the English concept, and a concept lives at the lowest
// level it appears in, so every earlier level is part of this level's pool.
const forms = new Map();
for (const level of LEVELS) {
  for (const row of readJson(path.join(REPO, "languages", "_bank", `${level}.json`))) {
    const id = conceptId(row.en);
    if (id && !forms.has(id)) forms.set(id, row);
  }
  if (level === LEVEL) break;
}

const priorLevels = LEVELS.slice(0, LEVELS.indexOf(LEVEL));
const priorConcepts = [];
for (const level of priorLevels) {
  for (const row of readJson(path.join(REPO, "languages", "_bank", `${level}.json`))) {
    const id = conceptId(row.en);
    if (id) priorConcepts.push(id);
  }
}

const topicById = new Map();
for (const level of LEVELS) {
  for (const topic of grammar.levels[level] ?? []) topicById.set(topic.id, { ...topic, level });
  if (level === LEVEL) break;
}

function wordLine(id) {
  const row = forms.get(id);
  if (!row) return `- \`${id}\` | MISSING FROM BANK`;
  return `- \`${id}\` | ${row[TARGET]} | ${row.ru}`;
}

fs.mkdirSync(OUT, { recursive: true });
const toWrite = course.lessons.filter((lesson) => lesson.id >= FROM);
const slices = [];
for (let i = 0; i < toWrite.length; i += SLICE) {
  slices.push(toWrite.slice(i, i + SLICE));
}

// Walk the whole course once so each slice knows the pool as it stood when
// its first lesson began. Recomputing this per slice would be the same work
// done N times and would drift if a lesson were ever counted twice.
const poolBefore = new Map();
{
  const pool = [...priorConcepts];
  for (const lesson of course.lessons) {
    poolBefore.set(lesson.id, [...pool]);
    pool.push(...lesson.new);
  }
}

let written = 0;
for (const [index, lessons] of slices.entries()) {
  const first = lessons[0];
  const last = lessons[lessons.length - 1];
  const pool = poolBefore.get(first.id);
  const available = schedule
    .filter((s) => s.fromLesson <= last.id)
    .map((s) => topicById.get(s.id))
    .filter(Boolean);

  let md = `# ${TARGET} ${LEVEL}: sentences for lessons ${first.id}-${last.id}\n\n`;
  md += `Packet ${index + 1} of ${slices.length}.\n\n`;

  md += `## Your lessons\n\n`;
  for (const lesson of lessons) {
    md += `### Lesson ${lesson.id}${lesson.theme ? ` - ${lesson.theme}` : ""}\n\n`;
    md += `New words, all of which your sentences must render:\n\n`;
    for (const id of lesson.new) md += `${wordLine(id)}\n`;
    md += `\n`;
  }

  md += `## Vocabulary already taught before lesson ${first.id}\n\n`;
  md += `${pool.length} words. A sentence in lesson N may use these plus every\n`;
  md += `word introduced in lessons up to and including N.\n\n`;
  for (const id of pool) md += `${wordLine(id)}\n`;
  md += `\n`;

  md += `## Grammar available by lesson ${last.id}\n\n`;
  for (const topic of available) {
    md += `### \`${topic.id}\`${topic.level !== LEVEL ? ` (${topic.level})` : ""} ${topic.name}\n\n`;
    md += `${topic.note}\n\nExample: ${topic.example}\n\nTest: ${topic.test}\n\n`;
  }

  const file = path.join(OUT, `${LEVEL}-${String(first.id).padStart(3, "0")}-${String(last.id).padStart(3, "0")}.md`);
  fs.writeFileSync(file, md);
  written++;
  console.log(`${path.relative(REPO, file)}  lessons ${first.id}-${last.id}, pool ${pool.length}, topics ${available.length}`);
}
console.log(`\n${written} packets`);
