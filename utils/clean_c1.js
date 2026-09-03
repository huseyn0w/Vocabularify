/**
 * Repairs the C1 word list before the German C1 course is authored.
 *
 * C1's problem is B2's, twice over: 269 of its 672 rows carry an English
 * key and nothing else, which is 40% of the level. They are the words the
 * level exists for - `to intervene`, `conjecture`, `propensity`,
 * `unwavering`, `to thwart` - so filling them is the difference between a
 * 384-word level and a 640-word one. `utils/c1_fill.json` supplies German
 * and Russian for all 269.
 *
 * The second problem is that C1 was written without looking at B2. Nineteen
 * rows repeat a concept an earlier level already owns, and thirty-two more
 * reach for a German word another concept already has. Some of those pairs
 * are the same idea twice (`hypothesis`, `framework`, `plausible`, `vague`
 * sit in both files verbatim) and are dropped; the rest are separate ideas
 * that were simply given the wrong word, and take one of their own.
 *
 *   node utils/clean_c1.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const BANK = path.join(__dirname, "..", "languages", "_bank");

// The same concept an earlier level already teaches, with the same German.
// dedupeBank drops these silently; keeping them only hides the fact.
const DROP = new Set([
  // key and German both repeat an earlier level
  "to encompass", "to acknowledge", "implication", "hypothesis", "framework",
  "inevitable", "plausible", "feasible", "vague", "thereby", "consequently",
  "presumably", "whereas", "arguably",
  // a different key for a word an earlier level already owns, and the same idea
  "to discern",        // erkennen, B1 `to recognize`
  "to differentiate",  // unterscheiden, B2 `to distinguish`
  "to renounce",       // verzichten, B2 `to forgo`
  "notwithstanding",   // ungeachtet, B2 `regardless`
  "nevertheless",      // dennoch, which B2 teaches as `even so`
  "moreover",          // außerdem, B1 `in addition`
  "consequence",       // die Konsequenz beside B2's die Konsequenzen
  "explicitly",        // ausdrücklich, B2 `explicit`
  "implicitly",        // implizit, B2 `implicit`
  // C1 says the same thing twice, in two entries of its own
  "aspiration",        // das Bestreben, beside `endeavour`
  "fleeting",          // would be vergänglich, which `transient` already is
]);

// Same concept as an earlier level, different German word worth teaching.
const REKEY = {
  "regardless": "notwithstanding",  // ungeachtet dessen, beside B2 ungeachtet
  "to anticipate": "to pre-empt",   // vorwegnehmen, beside B2 vorhersehen
};

// Separate ideas that reached for a German word another concept owns.
const REPAIR = {
  "to endorse": { de: "gutheißen" },          // not C1's own befürworten
  "to foster": { de: "begünstigen" },         // not B2 fördern
  "to designate": { de: "benennen" },         // not B2 bestimmen
  "to safeguard": { de: "absichern" },        // not B1 schützen
  "constraint": { de: "der Zwang" },          // not B2 die Einschränkung
  "magnitude": { de: "die Größenordnung" },   // not B2 das Ausmaß
  "outcome": { de: "das Resultat" },          // not B1 das Ergebnis
  "to uphold": { de: "wahren" },              // not B2 aufrechterhalten
  "to compensate": { de: "entschädigen" },    // not B2 kompensieren
};

const FILL = require("./c1_fill.json");

const banks = Object.fromEntries(
  LEVELS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(BANK, `${l}.json`), "utf8"))]),
);
const rows = banks.c1;
const problems = [];
const counts = { dropped: 0, rekeyed: 0, repaired: 0, filled: 0 };

const out = [];
for (const row of rows) {
  if (DROP.has(row.en)) { counts.dropped += 1; continue; }
  const next = { ...row };
  if (REKEY[row.en]) { next.en = REKEY[row.en]; counts.rekeyed += 1; }
  if (REPAIR[row.en]) { Object.assign(next, REPAIR[row.en]); counts.repaired += 1; }
  const fill = FILL[row.en];
  if (fill) {
    if (next.de || next.ru) problems.push(`"${row.en}" already had German or Russian, fill would overwrite it`);
    [next.de, next.ru] = fill;
    counts.filled += 1;
  }
  out.push(next);
}
for (const [name, keys] of [["fill", Object.keys(FILL)], ["drop", [...DROP]], ["rekey", Object.keys(REKEY)], ["repair", Object.keys(REPAIR)]]) {
  for (const key of keys) {
    if (!rows.some((r) => r.en === key)) problems.push(`${name} names "${key}", which is not a C1 row`);
  }
}

// A concept id an earlier level owns is deleted, not reported.
const seenId = new Map();
for (const level of LEVELS) {
  const source = level === "c1" ? out : banks[level];
  for (const r of source) {
    const id = r.en.toLowerCase();
    if (seenId.has(id) && level === "c1") problems.push(`"${r.en}" (${r.de || "no German"}) is shadowed by ${seenId.get(id)}`);
    else if (!seenId.has(id)) seenId.set(id, level);
  }
}

// Two concepts sharing a German word make one of them unanswerable. C1 is
// the last level, so every clash here is a real one: nothing is left to
// defer it to. A shared Russian gloss is reported and tolerated - the
// German still differs, so the two cards ask for different answers.
const warnings = [];
const owner = { de: new Map(), ru: new Map() };
for (const level of LEVELS) {
  const source = level === "c1" ? out : banks[level];
  for (const r of source) {
    for (const lang of ["de", "ru"]) {
      const word = r[lang];
      if (!word) continue;
      if (owner[lang].has(word)) {
        const [prevLevel, prevKey] = owner[lang].get(word);
        if (level !== "c1" && prevLevel !== "c1") continue;
        const line = `${lang} ${JSON.stringify(word)}: "${r.en}" (${level}) and "${prevKey}" (${prevLevel})`;
        (lang === "de" ? problems : warnings).push(line);
      } else {
        owner[lang].set(word, [level, r.en]);
      }
    }
  }
}

const usable = out.filter((r) => r.de && r.ru).length;
console.log(
  `c1: ${rows.length} rows -> ${out.length}\n` +
  `  dropped  ${counts.dropped}\n  rekeyed  ${counts.rekeyed}\n` +
  `  repaired ${counts.repaired}\n  filled   ${counts.filled}\n` +
  `  usable (German and Russian both filled): ${usable}`,
);
if (warnings.length) console.log(`\n${warnings.length} shared Russian glosses, tolerated`);
if (problems.length) {
  console.error(`\n${problems.length} problems, nothing written:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
if (DRY_RUN) console.log("\ndry run, nothing written");
else {
  fs.writeFileSync(path.join(BANK, "c1.json"), `${JSON.stringify(out, null, 2)}\n`);
  console.log("\nwrote languages/_bank/c1.json");
}
