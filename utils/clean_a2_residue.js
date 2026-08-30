/*
 * The last pass over the A2 bank before the A2 course is written.
 *
 *   node utils/clean_a2_residue.js [--dry-run]
 *
 * clean_inflected.js and fix_finite_forms.js caught the bulk defect: the same
 * verb entered twice, once as an infinitive and once as a finite form. What
 * they left behind is what no rule could group - eleven finite forms whose
 * infinitive sits under a different spelling (`sieht fern` against
 * `fernsehen`, `lernt kennen` against `kennenlernen`), seven reflexive verbs
 * entered a second time without the `sich`, and three rows that are not words
 * at all (`die Hol`, `assage`, `der Lieblings`).
 *
 * Every id below was checked by hand against the row it duplicates. The
 * course cannot ship with them: a concept must render as a word in a German
 * sentence, and `assage` has no sentence.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "languages", "_bank", "a2.json");
const DRY_RUN = process.argv.includes("--dry-run");

// id -> the row it duplicates, or why it is not a word.
const DROP = {
  "has taken": "a1 to take | nehmen",
  "has ridden": "a2 to ride | reiten",
  rides: "a2 to ride | reiten",
  surfs: "a2 surf | surfen",
  telephones: "a1 to phone | telefonieren",
  "looks at": "a2 to view | ansehen",
  "watches tv": "a1 to watch tv | fernsehen",
  "to watch over": "a2 watch out | aufpassen",
  "gets to know": "a1 to get to know | kennenlernen",
  "is supposed to": "a1 should | sollen",
  "rents out": "a1 to rent out | vermieten",
  remember: "a2 to remember | sich erinnern",
  rest: "a2 to rest | sich ausruhen",
  apply: "a2 to apply for a job | bewerben (sich)",
  "to take care of": "a1 to take care | sich kümmern",
  "to take off": "a1 to fly off | abfliegen",
  "online status": "a1 online | online",
  "lake (alternative)": "die See is the sea, not a lake; a1 already teaches der See",
  fetch: "die Hol is not a word, and the russian gloss says peaked cap",
  assage: "truncated row: english and german identical, glossed message",
  favorite: "der Lieblings is a compound prefix, not a headword",
};

// id -> the columns to correct, with what the row actually means.
const FIX = {
  dish: { ru: "блюдо" }, // was суд, the court reading of das Gericht
  withdraw: { ru: "снимать со счёта" }, // was взлететь, the aircraft reading
  "to chat": { ru: "беседовать" }, // swapped with to entertain
  "to entertain": { ru: "развлекать" },
  cattle: { ru: "скот" }, // was говядина, which a1 already teaches as Rindfleisch
  educator: { de: "die Pädagogin" },
  "temporary position": { de: "die Zeitstelle" },
  pass: { ru: "сдавать экзамен" },
  tango: { de: "der Tango" },
  "there is": { de: "es gibt" },
};

// bestehen glossed существовать is the exist reading, not the exam reading the
// bare key claims. `to exist` cannot be the new key: a1 carries a french-only
// placeholder row under that id with no german, and the dedupe keeps the a1
// row, which would drop bestehen from the course entirely. The exam reading is
// the one an A2 learner needs, so the row is rekeyed and reglossed to it.
const REKEY = { pass: "to pass an exam" };

const id = (s) => String(s ?? "").trim().toLowerCase();
const rows = JSON.parse(fs.readFileSync(FILE, "utf8"));

const dropped = [];
const fixed = [];
const rekeyed = [];
const kept = [];

for (const row of rows) {
  const key = id(row.en);
  if (key in DROP) {
    dropped.push(`${key} | ${row.de} -> ${DROP[key]}`);
    continue;
  }
  if (key in FIX) {
    for (const [col, value] of Object.entries(FIX[key])) {
      fixed.push(`${key} | ${col}: ${row[col]} -> ${value}`);
      row[col] = value;
    }
  }
  if (key in REKEY) {
    rekeyed.push(`${key} -> ${REKEY[key]} | ${row.de}`);
    row.en = REKEY[key];
  }
  kept.push(row);
}

const missing = [
  ...Object.keys(DROP).filter((k) => !dropped.some((d) => d.startsWith(`${k} |`))),
  ...Object.keys(FIX).filter((k) => !fixed.some((f) => f.startsWith(`${k} |`))),
  ...Object.keys(REKEY).filter((k) => !rekeyed.some((r) => r.startsWith(`${k} ->`))),
];

for (const line of dropped) console.log(`drop   ${line}`);
for (const line of fixed) console.log(`fix    ${line}`);
for (const line of rekeyed) console.log(`rekey  ${line}`);
if (missing.length > 0) console.log(`NOT FOUND IN BANK: ${missing.join(", ")}`);

console.log(`\n${rows.length} rows -> ${kept.length} (${dropped.length} dropped)`);

if (DRY_RUN) {
  console.log("dry run, nothing written");
} else {
  fs.writeFileSync(FILE, `${JSON.stringify(kept, null, 2)}\n`);
  console.log(`wrote ${path.relative(path.join(__dirname, ".."), FILE)}`);
}
process.exit(missing.length > 0 ? 1 : 0);
