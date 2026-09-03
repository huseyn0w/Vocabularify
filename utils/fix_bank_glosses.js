/**
 * Six rows the B1 course review found wrong and left alone at the time.
 * Each one prints a card whose two halves do not mean the same thing, so
 * the learner is taught a false pair rather than merely an awkward one.
 *
 *   node utils/fix_bank_glosses.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");
const BANK = path.join(__dirname, "..", "languages", "_bank");

const FIXES = {
  b1: {
    // "остановка" is a bus stop. The German particle halt means "simply".
    "simply": { ru: "просто" },
    // "дом" is the house itself, not the direction heim points in.
    "homeward": { ru: "домой" },
    // German "fix" is not a verb; the row means a settled, unchanging value.
    "fix": { en: "fixed (set)", ru: "фиксированный" },
    // "пристройка" is an annex. Anbau here is growing a crop.
    "cultivation": { ru: "выращивание" },
    // "der Miss" is not a German word, and no near miss is meant either.
    "miss": { de: "der Fehlschlag" },
    // "die Union" names the EU or a party bloc, never a labour union.
    "union": { ru: "объединение" },
  },
};

let changed = 0;
const problems = [];
for (const [level, fixes] of Object.entries(FIXES)) {
  const file = path.join(BANK, `${level}.json`);
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [key, patch] of Object.entries(fixes)) {
    const row = rows.find((r) => r.en === key);
    if (!row) {
      problems.push(`${level}: no row keyed "${key}"`);
      continue;
    }
    console.log(`${level} ${key}: ${JSON.stringify(patch)} (was ${JSON.stringify({ de: row.de, ru: row.ru })})`);
    Object.assign(row, patch);
    changed += 1;
  }
  if (!DRY_RUN && !problems.length) {
    fs.writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`);
  }
}
if (problems.length) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(DRY_RUN ? `\n${changed} rows, dry run` : `\nfixed ${changed} rows`);
