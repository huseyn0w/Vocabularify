/*
 * Folds the old hand-built de/ru dictionary back into the multilingual bank.
 *
 * The June 2026 rewrite replaced 5534 curated de/ru words with a 1049-concept
 * bank translated into seven languages. The words were never wrong, only
 * absent from the new structure. This puts them back as bank rows carrying
 * only the languages we actually have - `en`, `de`, `ru` - leaving the other
 * four empty. `generate_pairs.js` already skips a row for any pair whose two
 * languages are not both present, so the de/ru and ru/de pairs grow and the
 * other forty stay byte-identical until somebody translates the rest.
 *
 *   node utils/restore_bank.js --dry-run
 *   node utils/restore_bank.js
 *
 * Input, produced by the restore pass and living outside languages/:
 *   .git/sdd/restore/de-ru.collected.json
 *
 * That file is written by collect_restore.js, which folds the agent passes
 * onto the raw dump and drops what it cannot key. The checks below are kept
 * as a second gate rather than trusted away: this script writes the bank, so
 * it verifies its own input rather than assuming the collector was run.
 *
 * A word already in the bank is left alone: the bank's version has seven
 * languages and a reviewed course behind it, and the old file's version has
 * neither. Level comes from the old file, which is where the words were
 * levelled by hand.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const BANK = path.join(REPO_ROOT, "languages", "_bank");
const RESTORE = path.join(REPO_ROOT, ".git", "sdd", "restore");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];
const DRY_RUN = process.argv.includes("--dry-run");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function conceptId(word) {
  return String(word ?? "").trim().toLowerCase();
}

// The bank as it stands, and every English key already spoken for.
const bank = {};
const takenEn = new Set();
const takenDe = new Set();
for (const level of LEVELS) {
  bank[level] = readJson(path.join(BANK, `${level}.json`));
  for (const row of bank[level]) {
    takenEn.add(conceptId(row.en));
    if (row.de) takenDe.add(conceptId(row.de));
  }
}

const COLLECTED = path.join(RESTORE, "de-ru.collected.json");
if (!fs.existsSync(COLLECTED)) {
  console.error("de-ru.collected.json is missing. Run `node utils/collect_restore.js` first.");
  process.exit(2);
}
const incoming = readJson(COLLECTED);
const added = { a1: 0, a2: 0, b1: 0, b2: 0, c1: 0 };
const skipped = [];

for (const entry of incoming) {
  const en = conceptId(entry.en);
  const de = conceptId(entry.de);
  if (!en) {
    skipped.push(`no English: ${entry.de}`);
    continue;
  }
  if (takenDe.has(de)) {
    skipped.push(`German already in the bank: ${entry.de}`);
    continue;
  }
  if (takenEn.has(en)) {
    skipped.push(`English key already taken: "${en}" (${entry.de})`);
    continue;
  }
  if (!LEVELS.includes(entry.level)) {
    skipped.push(`unknown level "${entry.level}": ${entry.de}`);
    continue;
  }
  takenEn.add(en);
  takenDe.add(de);
  const row = {};
  for (const lang of LANGS) row[lang] = "";
  row.en = entry.en.trim();
  row.de = entry.de.trim();
  row.ru = entry.ru.trim();
  bank[entry.level].push(row);
  added[entry.level]++;
}

for (const level of LEVELS) {
  console.log(`${level}: ${bank[level].length} rows (+${added[level]})`);
}
console.log(`skipped: ${skipped.length}`);
const reasons = {};
for (const line of skipped) {
  const key = line.split(":")[0];
  reasons[key] = (reasons[key] ?? 0) + 1;
}
for (const [reason, count] of Object.entries(reasons)) {
  console.log(`  ${reason}: ${count}`);
}

if (DRY_RUN) {
  console.log("\ndry run, nothing written");
} else {
  for (const level of LEVELS) {
    fs.writeFileSync(
      path.join(BANK, `${level}.json`),
      `${JSON.stringify(bank[level], null, 2)}\n`,
    );
  }
  fs.writeFileSync(path.join(RESTORE, "skipped.txt"), `${skipped.join("\n")}\n`);
  console.log("\nbank written; skip list in .git/sdd/restore/skipped.txt");
}
