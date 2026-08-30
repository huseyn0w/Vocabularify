/**
 * Removes inflected duplicates from one level of the bank and repairs verb keys.
 *
 * A level assembled from a frequency list ends up with rows like
 * `answers | antwortet | отвечает` beside `to answer | antworten`. The German
 * is a finite form, not a dictionary word, and the concept is already taught,
 * so the row makes the learner meet the same verb twice - once in a form no
 * dictionary lists.
 *
 * The decisions are listed explicitly rather than detected. Every heuristic
 * tried here misfired: matching a shared four-letter prefix pairs `besorgt`
 * (worried, an adjective) with `besonders`, and no prefix rule at all catches
 * the strong verbs it needs to, `isst` against `essen`. 176 candidates were
 * read by hand instead. Adding a level means reading its candidates the same
 * way - print them with the English-side matcher, then write the verdicts here.
 *
 *   node utils/clean_inflected.js <level> [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");
const LEVEL = ARGS.find((a) => !a.startsWith("--"));
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];

if (!LEVELS.includes(LEVEL)) {
  console.error("usage: node utils/clean_inflected.js <a1|a2|b1|b2|c1> [--dry-run]");
  process.exit(2);
}

const DECISIONS = {
  a2: {
    // The German is a finite form of a verb the bank already carries as an
    // infinitive, either on the row the English key points at or on another
    // row (kennt -> kennen, schenkt -> schenken, überweist -> überweisen).
    drop: [
      "answers", "works", "toured", "ordered", "visited", "requests", "stays",
      "needs", "brings", "spelled", "books", "lasts", "thinks", "discusses",
      "prints", "presses", "recommends", "ends", "apologized", "remembers",
      "explains", "allowed", "tells", "celebrates", "finds", "flies",
      "photographs", "asks", "departs", "falls", "starts", "feels", "goes",
      "belongs", "mixed", "wins", "spends", "believes", "congratulates",
      "grills", "marries", "helps", "hopes", "coughs", "holds", "hangs",
      "hears", "stops", "listens", "eats", "buys", "cooks", "comes", "arrives",
      "costs", "laughs", "learns", "loves", "reads", "invites", "lets",
      "registers", "rents", "takes", "participates", "organized", "parks",
      "fits", "plans", "cleans", "smokes", "calculates", "rains", "repairs",
      "smells", "rests", "advises", "says", "sleeps", "tastes", "writes",
      "swims", "sees", "sings", "sits", "plays", "speaks", "stands",
      "introduces", "searches", "dances", "meets", "drinks", "wears", "hurts",
      "undertakes", "signs", "earns", "forgets", "compares", "sells", "loses",
      "misses", "understands", "hikes", "waits", "cries", "repeats", "becomes",
      "chooses", "washes", "moves", "practices",
      // The English key points at one verb while the German is a finite form
      // of a different one - which the bank also already carries.
      "offered", "prepared", "applies", "chats", "likes", "knows", "cancels",
      "runs", "paints", "happens", "checks", "gives", "sends", "exchanges",
      "enters", "does", "arranged", "agrees", "transfers",
    ],
    // A real word the bank carries nowhere else, keyed as if it were a verb
    // form. Which English word carries the distinction is a judgement, so the
    // replacement is named rather than derived.
    rekey: {
      used: "second-hand",          // gebraucht is an adjective, not a form of benutzen
      checked: "chequered",         // kariert is a pattern, not a form of nachschauen
      // "needed" stays: nötig is a real adjective and the only free English
      // key for it would be worse than the one it has. "necessary" is taken by
      // notwendig at B1.
      saves: "to save (a file)",    // speichern, distinct from sparen
      // "delayed" stays: verspätet is a finite form, but the bank has no
      // infinitive for it and "to be late" is an empty placeholder carrying
      // French. Listed in a2-bank-issues.md instead.
      "Eat animals": "to eat (of animals)", // fressen
    },
    // Capitalised keys in front of a German infinitive. The bank keys verbs
    // "to X"; a proper noun (IBAN, Pilates) or a nationality (Greek, Olympic)
    // keeps its capital, so only these are touched.
    verbKeys: [
      "Charge", "Write down", "Sleep in", "Cheat", "Come to mind", "Adhere to",
      "Fall asleep", "Correspond", "Emerge", "Frighten", "Pour", "Ride",
      "Shoot", "Be silent", "Stink", "Betray", "Read aloud", "Pass by",
    ],
  },
};

const decisions = DECISIONS[LEVEL];
if (!decisions) {
  console.error(`no verdicts recorded for ${LEVEL} - read its candidates first (see the header)`);
  process.exit(2);
}

const REPO = path.join(__dirname, "..");
const BANK = path.join(REPO, "languages", "_bank");
const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();

const bank = {};
for (const level of LEVELS) {
  bank[level] = JSON.parse(fs.readFileSync(path.join(BANK, `${level}.json`), "utf8"));
}
const takenKeys = new Set();
for (const level of LEVELS) for (const row of bank[level]) takenKeys.add(norm(row.en));

const dropSet = new Set(decisions.drop.map(norm));
const seen = new Set();
const dropped = [];
const rekeyed = [];
const verbsFixed = [];
const problems = [];

for (const row of bank[LEVEL]) {
  const key = norm(row.en);

  if (dropSet.has(key)) {
    seen.add(key);
    dropped.push(row);
    continue;
  }

  const rekeyTo = decisions.rekey[row.en] ?? decisions.rekey[key];
  if (rekeyTo) {
    if (takenKeys.has(norm(rekeyTo))) {
      problems.push(`rekey "${row.en}" -> "${rekeyTo}": that key is already in the bank, left alone`);
    } else {
      takenKeys.delete(key);
      takenKeys.add(norm(rekeyTo));
      rekeyed.push(`${row.en} -> ${rekeyTo}   (${row.de})`);
      row.en = rekeyTo;
    }
    continue;
  }

  if (decisions.verbKeys.includes(row.en)) {
    const fixed = "to " + row.en[0].toLowerCase() + row.en.slice(1);
    if (takenKeys.has(norm(fixed))) {
      problems.push(`verb key "${row.en}" -> "${fixed}": that key is already in the bank, left alone`);
    } else {
      takenKeys.delete(key);
      takenKeys.add(norm(fixed));
      verbsFixed.push(`${row.en} -> ${fixed}   (${row.de})`);
      row.en = fixed;
    }
  }
}

for (const key of dropSet) {
  if (!seen.has(key)) problems.push(`drop list names "${key}", which is not a ${LEVEL} key`);
}

const before = bank[LEVEL].length;
const dropRows = new Set(dropped);
bank[LEVEL] = bank[LEVEL].filter((r) => !dropRows.has(r));

// What the dropped rows carried elsewhere, so the cost is stated, not assumed.
const carried = {};
for (const lang of LANGS) {
  carried[lang] = dropped.filter((d) => String(d[lang] || "").trim() !== "").length;
}

console.log(`${LEVEL}: ${before} rows -> ${bank[LEVEL].length}`);
console.log(`  dropped as inflected duplicates: ${dropped.length}`);
console.log(`  rekeyed: ${rekeyed.length}`);
console.log(`  verb keys fixed: ${verbsFixed.length}`);

console.log("\nlanguages the dropped rows carried:");
for (const lang of LANGS) console.log(`  ${lang}: ${carried[lang]}`);

if (rekeyed.length) { console.log("\nrekeyed:"); rekeyed.forEach((l) => console.log("  " + l)); }
if (verbsFixed.length) { console.log("\nverb keys fixed:"); verbsFixed.forEach((l) => console.log("  " + l)); }
if (problems.length) { console.log("\nproblems:"); problems.forEach((l) => console.log("  " + l)); }

if (DRY_RUN) {
  console.log("\ndry run, nothing written");
} else {
  fs.writeFileSync(path.join(BANK, `${LEVEL}.json`), `${JSON.stringify(bank[LEVEL], null, 2)}\n`);
  console.log("\nbank written");
}
