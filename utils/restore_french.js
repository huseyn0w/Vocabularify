/**
 * Writes the restored French words into the bank.
 *
 * Unlike the German restore, this one does two different things:
 *
 *   fill  fills the empty `fr` cell of a row that already exists. Those rows
 *         came from the German restore and carry en, de and ru, so adding the
 *         French makes one row serve four languages instead of three. Nothing
 *         else on the row is touched.
 *   new   appends a row carrying only en and fr.
 *
 * A fill is refused if the cell is not actually empty, so a rerun cannot
 * overwrite a French word somebody reviewed. Reads .git/sdd/restore/
 * fr.collected.json, written by collect_french.js.
 *
 *   node utils/restore_french.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ARGS = process.argv.slice(2);
const UNKNOWN = ARGS.filter((a) => a !== "--dry-run");
if (UNKNOWN.length > 0) {
  console.error(`unknown argument: ${UNKNOWN.join(" ")}`);
  console.error("usage: node utils/restore_french.js [--dry-run]");
  process.exit(2);
}
const DRY_RUN = ARGS.includes("--dry-run");

const REPO = path.join(__dirname, "..");
const BANK = path.join(REPO, "languages", "_bank");
const IN = path.join(REPO, ".git", "sdd", "restore", "fr.collected.json");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];

if (!fs.existsSync(IN)) {
  console.error("fr.collected.json is missing. Run `node utils/collect_french.js` first.");
  process.exit(2);
}
const { fills = [], fresh = [] } = JSON.parse(fs.readFileSync(IN, "utf8"));

const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();

const bank = {};
const rowByEn = new Map();
const takenFr = new Set();
for (const level of LEVELS) {
  bank[level] = JSON.parse(fs.readFileSync(path.join(BANK, `${level}.json`), "utf8"));
  for (const row of bank[level]) {
    rowByEn.set(norm(row.en), row);
    if (row.fr) takenFr.add(norm(row.fr));
  }
}

const filled = { a1: 0, a2: 0, b1: 0, b2: 0, c1: 0 };
const added = { a1: 0, a2: 0, b1: 0, b2: 0, c1: 0 };
const refused = [];

for (const entry of fills) {
  const row = rowByEn.get(norm(entry.en));
  if (!row) {
    refused.push(`no bank row for "${entry.en}" (${entry.fr})`);
    continue;
  }
  if (String(row.fr || "").trim() !== "") {
    refused.push(`"${entry.en}" already has french "${row.fr}", not overwritten by "${entry.fr}"`);
    continue;
  }
  if (takenFr.has(norm(entry.fr))) {
    refused.push(`french "${entry.fr}" is already somewhere in the bank`);
    continue;
  }
  row.fr = entry.fr.trim();
  takenFr.add(norm(row.fr));
  const level = LEVELS.includes(entry.level) ? entry.level : "a1";
  filled[level]++;
}

for (const entry of fresh) {
  const key = norm(entry.en);
  if (rowByEn.has(key)) {
    refused.push(`"${entry.en}" is already a bank concept, "${entry.fr}" not added`);
    continue;
  }
  if (takenFr.has(norm(entry.fr))) {
    refused.push(`french "${entry.fr}" is already somewhere in the bank`);
    continue;
  }
  if (!LEVELS.includes(entry.level)) {
    refused.push(`unknown level "${entry.level}" for "${entry.fr}"`);
    continue;
  }
  const row = {};
  for (const lang of LANGS) row[lang] = "";
  row.en = entry.en.trim();
  row.fr = entry.fr.trim();
  bank[entry.level].push(row);
  rowByEn.set(key, row);
  takenFr.add(norm(row.fr));
  added[entry.level]++;
}

for (const level of LEVELS) {
  console.log(`${level}: ${bank[level].length} rows (+${added[level]} new, ${filled[level]} filled)`);
}
console.log(`refused: ${refused.length}`);
for (const line of refused.slice(0, 10)) console.log(`  ${line}`);
if (refused.length > 10) console.log(`  ... and ${refused.length - 10} more`);

let complete = 0;
for (const level of LEVELS) {
  for (const row of bank[level]) {
    if (LANGS.every((l) => String(row[l] || "").trim() !== "")) complete++;
  }
}
console.log(`\nrows complete in all seven languages: ${complete}`);

if (DRY_RUN) {
  console.log("\ndry run, nothing written");
} else {
  for (const level of LEVELS) {
    fs.writeFileSync(
      path.join(BANK, `${level}.json`),
      `${JSON.stringify(bank[level], null, 2)}\n`
    );
  }
  console.log("\nbank written");
}
