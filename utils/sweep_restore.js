/**
 * Flag restored rows whose English key looks wrong, so a reviewer reads a few
 * hundred rows instead of four thousand.
 *
 * The agents that keyed these words reported their own low-confidence calls,
 * but the defects that matter are the ones nobody flagged. Memory of the two
 * sentence-review rounds says the same thing: a mechanical sweep finds what no
 * individual reviewer sees. These rules are that sweep.
 *
 *   node utils/sweep_restore.js
 *
 * Reads .git/sdd/restore/de-ru.collected.json, writes review-queue.json and
 * prints a count per rule.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", ".git", "sdd", "restore");
const IN = path.join(DIR, "de-ru.collected.json");
if (!fs.existsSync(IN)) {
  console.error("de-ru.collected.json is missing. Run collect_restore.js first.");
  process.exit(2);
}
const rows = JSON.parse(fs.readFileSync(IN, "utf8"));

// A German entry that is not a citation form. The bank teaches one word per
// row, and a conjugated or declined form on a card teaches a form as a word.
const INFLECTED = /^(las|kann|welcher|erst|letzt|vorn|neblig|gern\(e\)|nächste)$/i;

// Words the old dictionary picked up from English and never translated. They
// render as a German card that is not German.
const DENGLISH = /^(der|die|das)\s+(Air|Online|Make|Open|Schul|Sales|Doku|DZ|EZ|PIN)$/;

const RULES = [
  {
    name: "english key carries a parenthetical",
    why: "allowed only where English genuinely lacks the distinction; each one is a judgement call worth re-reading",
    test: (r) => /\(/.test(r.en)
  },
  {
    name: "german is an inflected form, not a citation form",
    why: "a card teaching `las` teaches a tense, not a word",
    test: (r) => INFLECTED.test(r.de.trim())
  },
  {
    name: "german is untranslated English",
    why: "an artefact of the old dictionary, not a German word",
    test: (r) => DENGLISH.test(r.de.trim())
  },
  {
    name: "english key is one generic word",
    why: "a key like `piece` or `form` does not identify which German word it teaches",
    test: (r) =>
      /^(piece|form|thing|part|way|matter|item|point|case|state|set|kind|type|place|group|line|side|order|term|sort)$/i.test(
        r.en.trim()
      )
  },
  {
    name: "english key repeats the german",
    why: "the pass ran out of English and fell back to the source word",
    test: (r) => r.en.trim().toLowerCase() === r.de.trim().toLowerCase().replace(/^(der|die|das)\s+/, "")
  },
  {
    name: "verb keyed without `to`",
    why: "the bank writes verbs as bare infinitives, so a mismatch here is a part-of-speech error",
    test: (r) => /(en|ern|eln)$/.test(r.de.trim()) && /^[a-z]/.test(r.de.trim()) && !/^to /.test(r.en.trim()) && !/^(sich )/.test(r.de.trim())
  },
  {
    name: "english key is longer than a flashcard",
    why: "a definition on a card is not a word",
    test: (r) => r.en.trim().split(/\s+/).length >= 4
  },
  {
    name: "russian gloss is missing",
    why: "the de/ru pair cannot show this row at all",
    test: (r) => !String(r.ru || "").trim()
  }
];

const flagged = new Map();
for (const rule of RULES) {
  let n = 0;
  for (const row of rows) {
    let hit = false;
    try {
      hit = rule.test(row);
    } catch (err) {
      hit = false;
    }
    if (!hit) continue;
    n++;
    const k = `${row.de} ${row.level}`;
    if (!flagged.has(k)) flagged.set(k, { ...row, rules: [] });
    flagged.get(k).rules.push(rule.name);
  }
  console.log(`${String(n).padStart(4)}  ${rule.name}`);
}

const queue = [...flagged.values()];
console.log(`\n${rows.length} rows, ${queue.length} flagged for review`);
fs.writeFileSync(path.join(DIR, "review-queue.json"), JSON.stringify(queue, null, 2) + "\n");
console.log("wrote .git/sdd/restore/review-queue.json");
