/**
 * Fills Turkish into bank rows that have German but no Turkish.
 *
 *   node utils/fill_turkish.js <a1|a2|b1|b2|c1> [--dry-run]
 *
 * Turkish is the third source language after Russian and English, and the
 * first one the bank could not supply: of the 5535 concepts the German
 * course uses, only 946 had a Turkish word. English needed none of this -
 * the concept id IS the English - so this step has no precedent in the
 * earlier passes.
 *
 * Reads utils/tr_fill_<level>.json, keyed by concept id. It refuses to
 * write if a fill names a row that does not exist, or one that already has
 * Turkish: overwriting a translation somebody else wrote is not a fill.
 *
 * Two concepts sharing a Turkish word is reported and tolerated. Turkish is
 * a source language here, so a shared word makes two cards ask the same
 * question with different German answers - awkward, not wrong, and the same
 * position Russian has held since A1.
 */
const fs = require("fs");
const path = require("path");

const LEVEL = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
if (!/^(a1|a2|b1|b2|c1)$/.test(LEVEL || "")) {
  console.error("usage: node utils/fill_turkish.js <a1|a2|b1|b2|c1> [--dry-run]");
  process.exit(2);
}
const REPO = path.join(__dirname, "..");
const { conceptId } = require(path.join(REPO, "out", "shared", "course.js"));
const BANK = path.join(REPO, "languages", "_bank", `${LEVEL}.json`);
const rows = JSON.parse(fs.readFileSync(BANK, "utf8"));
const fill = JSON.parse(fs.readFileSync(path.join(__dirname, `tr_fill_${LEVEL}.json`), "utf8"));

const byId = new Map(rows.map((r) => [conceptId(r.en), r]));
const problems = [];
let filled = 0;
for (const [id, tr] of Object.entries(fill)) {
  const row = byId.get(conceptId(id));
  if (!row) { problems.push(`no ${LEVEL} row keyed "${id}"`); continue; }
  if (row.tr && row.tr.trim()) { problems.push(`"${id}" already has Turkish (${row.tr})`); continue; }
  row.tr = tr;
  filled += 1;
}
const missing = rows.filter((r) => r.de && r.de.trim() && !(r.tr && r.tr.trim()));
console.log(`${LEVEL}: filled ${filled}, still without Turkish ${missing.length}`);

const owner = new Map();
const shared = [];
for (const r of rows) {
  if (!r.tr) continue;
  if (owner.has(r.tr)) shared.push(`tr ${JSON.stringify(r.tr)}: "${r.en}" and "${owner.get(r.tr)}"`);
  else owner.set(r.tr, r.en);
}
if (shared.length) console.log(`${shared.length} concepts share a Turkish word, tolerated`);

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
