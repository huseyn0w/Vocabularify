/**
 * Fills one language column into bank rows that have German but no word
 * in that language.
 *
 *   node utils/fill_language.js <en|fr|es|it|tr|ru> <a1|a2|b1|b2|c1> [--dry-run]
 *
 * The Turkish pass did this with utils/fill_turkish.js, one script for one
 * language. Spanish needs the same step, and so will French and Italian, so
 * the language is an argument now. fill_turkish.js stays as it was; it is
 * what the Turkish commits ran.
 *
 * Reads utils/<lang>_fill_<level>.json, keyed by concept id. It refuses to
 * write if a fill names a row that does not exist, or one that already has
 * a word in that language: overwriting a translation somebody else wrote is
 * not a fill.
 *
 * Two concepts sharing a word is reported and tolerated. A source language
 * with a shared word makes two cards ask the same question with different
 * German answers - awkward, not wrong, and the position Russian has held
 * since A1.
 */
const fs = require("fs");
const path = require("path");

const [LANG, LEVEL] = process.argv.slice(2);
const DRY_RUN = process.argv.includes("--dry-run");
if (!/^(en|fr|es|it|tr|ru)$/.test(LANG || "") || !/^(a1|a2|b1|b2|c1)$/.test(LEVEL || "")) {
  console.error("usage: node utils/fill_language.js <en|fr|es|it|tr|ru> <a1|a2|b1|b2|c1> [--dry-run]");
  process.exit(2);
}
const REPO = path.join(__dirname, "..");
const { conceptId } = require(path.join(REPO, "out", "shared", "course.js"));
const BANK = path.join(REPO, "languages", "_bank", `${LEVEL}.json`);
const rows = JSON.parse(fs.readFileSync(BANK, "utf8"));
const fill = JSON.parse(fs.readFileSync(path.join(__dirname, `${LANG}_fill_${LEVEL}.json`), "utf8"));

const byId = new Map(rows.map((r) => [conceptId(r.en), r]));
const problems = [];
let filled = 0;
for (const [id, word] of Object.entries(fill)) {
  const row = byId.get(conceptId(id));
  if (!row) { problems.push(`no ${LEVEL} row keyed "${id}"`); continue; }
  if (row[LANG] && String(row[LANG]).trim()) { problems.push(`"${id}" already has ${LANG} (${row[LANG]})`); continue; }
  row[LANG] = word;
  filled += 1;
}
const missing = rows.filter((r) => r.de && r.de.trim() && !(r[LANG] && String(r[LANG]).trim()));
console.log(`${LEVEL}: filled ${filled}, still without ${LANG} ${missing.length}`);

const owner = new Map();
const shared = [];
for (const r of rows) {
  if (!r[LANG]) continue;
  if (owner.has(r[LANG])) shared.push(`${LANG} ${JSON.stringify(r[LANG])}: "${r.en}" and "${owner.get(r[LANG])}"`);
  else owner.set(r[LANG], r.en);
}
if (shared.length) console.log(`${shared.length} concepts share a ${LANG} word, tolerated`);

if (problems.length) {
  console.error(`\n${problems.length} problems, nothing written:`);
  for (const p of problems.slice(0, 30)) console.error(`  ${p}`);
  process.exit(1);
}
if (DRY_RUN) console.log("dry run, nothing written");
else {
  fs.writeFileSync(BANK, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`wrote languages/_bank/${LEVEL}.json`);
}
