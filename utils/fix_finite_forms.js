/**
 * Replaces finite verb forms with their dictionary forms in one bank level.
 *
 * A frequency list yields rows like `gets up | steht auf | встает`, where both
 * the German and the Russian are conjugated. The learner is shown the bank
 * form as the headword and as the gloss under a sentence token, so a finite
 * form there is simply wrong on both sides.
 *
 * The finite -> dictionary mapping is data, not a rule: German strong verbs
 * change their stem vowel and Russian aspect pairs are not derivable, so both
 * sides are written out in .git/sdd/de-course/<level>-finite-forms.json.
 *
 * Where the infinitive already exists on another row, the row is a duplicate
 * and goes instead of being rewritten.
 *
 *   node utils/fix_finite_forms.js <level> [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");
const LEVEL = ARGS.find((a) => !a.startsWith("--"));
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];

if (!LEVELS.includes(LEVEL)) {
  console.error("usage: node utils/fix_finite_forms.js <a1|a2|b1|b2|c1> [--dry-run]");
  process.exit(2);
}

const REPO = path.join(__dirname, "..");
const BANK = path.join(REPO, "languages", "_bank");
const MAP = path.join(REPO, ".git", "sdd", "de-course", `${LEVEL}-finite-forms.json`);

if (!fs.existsSync(MAP)) {
  console.error(`no mapping at ${MAP}`);
  process.exit(2);
}
const mapping = JSON.parse(fs.readFileSync(MAP, "utf8"));

const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();
const bare = (s) => norm(s).replace(/^sich\s+/, "").replace(/\s*\(sich\)$/, "").trim();

const bank = {};
for (const level of LEVELS) {
  bank[level] = JSON.parse(fs.readFileSync(path.join(BANK, `${level}.json`), "utf8"));
}

/** Every German word the bank holds, and the row holding it. */
const germanRows = new Map();
for (const level of LEVELS) {
  for (const row of bank[level]) {
    const de = bare(row.de);
    if (!de) continue;
    if (!germanRows.has(de)) germanRows.set(de, []);
    germanRows.get(de).push({ row, level });
  }
}

const fixed = [];
const dropped = [];
const missing = new Set(Object.keys(mapping));

for (const row of bank[LEVEL]) {
  const entry = mapping[String(row.de).trim()];
  if (!entry) continue;
  missing.delete(String(row.de).trim());
  const [de, ru] = entry;

  const holders = (germanRows.get(bare(de)) || []).filter((h) => h.row !== row);
  if (holders.length > 0) {
    dropped.push(`${row.en} | ${row.de} -> ${de} is already "${holders[0].row.en}" (${holders[0].level})`);
    row.__drop = true;
    continue;
  }
  fixed.push(`${row.en}: ${row.de} -> ${de}   /   ${row.ru} -> ${ru}`);
  row.de = de;
  row.ru = ru;
}

const before = bank[LEVEL].length;
bank[LEVEL] = bank[LEVEL].filter((r) => !r.__drop);

console.log(`${LEVEL}: ${before} rows -> ${bank[LEVEL].length}`);
console.log(`  rewritten to dictionary forms: ${fixed.length}`);
console.log(`  dropped, the infinitive was already in the bank: ${dropped.length}\n`);

console.log("dropped:");
dropped.forEach((l) => console.log("  " + l));
console.log("\nrewritten (first 20):");
fixed.slice(0, 20).forEach((l) => console.log("  " + l));
if (fixed.length > 20) console.log(`  ... and ${fixed.length - 20} more`);
if (missing.size) {
  console.log("\nmapping names a german form the level does not have:");
  [...missing].forEach((k) => console.log("  " + k));
}

if (DRY_RUN) {
  console.log("\ndry run, nothing written");
} else {
  fs.writeFileSync(path.join(BANK, `${LEVEL}.json`), `${JSON.stringify(bank[LEVEL], null, 2)}\n`);
  console.log("\nbank written");
}
