/**
 * Repairs the B2 word list before the German B2 course is authored.
 *
 * B2 has neither of B1's problems - three capitalised keys, all acronyms,
 * and not one verb keyed without `to`. It has two of its own:
 *
 *   1. 133 of its 619 rows carry an English key and nothing else. No
 *      German, no Russian. They are invisible to the German course, and
 *      they are good B2 vocabulary: `to perceive`, `inequality`,
 *      `uncertainty`, `probability`, `to shed light on`. Filling them is
 *      the difference between a 444-word level and a 567-word one.
 *   2. 42 rows repeat a concept A2 or B1 already owns. 36 of those repeat
 *      it word for word in both languages; they are dead weight, because
 *      dedupeBank keeps the first level a concept id appears at and drops
 *      the rest without saying so. The other 6 carry a genuinely different
 *      German word - `dennoch` beside B1's `trotzdem`, `steigern` beside
 *      `erhöhen` - and are worth teaching under a key of their own.
 *
 * The fills were checked against every German and Russian string in all
 * five levels. Where a fill wanted a word an earlier level already owns,
 * one of two things is true: the concepts are the same and the B2 row is
 * left unfilled (`to predict` is B1's `to forecast`, both `vorhersagen`),
 * or they differ and the fill takes a distinct word (`abundant` is `üppig`,
 * not A2's `reichlich`). The script refuses to write while any collision
 * survives.
 *
 *   node utils/clean_b2.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const BANK = path.join(__dirname, "..", "languages", "_bank");

// Concepts A2 or B1 already teach with the same word in both languages.
// Keeping them would change nothing a learner sees; dedupeBank drops them
// anyway, so the row is pure noise in the file.
const DROP = new Set([
  "however", "therefore", "although", "despite", "instead", "meanwhile",
  "to assume", "to achieve", "to convince", "to consider", "to suggest",
  "to depend", "to participate", "to refuse", "to admit", "purpose",
  "advantage", "disadvantage", "solution", "responsibility", "opportunity",
  "development", "research", "knowledge", "skill", "experience", "attitude",
  "society", "government", "economy", "environment", "industry", "community",
  "contract", "colleague", "employer",
  // A synonym of `mistrust`, which this level also carries.
  "distrust",
  // Same German word as a concept an earlier level teaches. The pair is
  // only a spelling or register difference in English; in German there is
  // one word, so keeping both would print the same card twice.
  "moreover",       // außerdem, which B1 teaches as `in addition`
  "furthermore",    // darüber hinaus, B1 `moreover`
  "nonetheless",    // trotzdem, B1 `nevertheless`
  "to enhance",     // verbessern, B1 `to improve`
  "to affect",      // beeinflussen, B1 `to influence`
  "to obtain",      // erhalten, A2 `to receive`
  "outcome",        // das Ergebnis, B1 `result`
  "behaviour",      // das Verhalten, B1 `behavior`
  "particularly",   // besonders, B1 `especially`
  // Adverb beside its own adjective. German has one word for both.
  "explicitly",     // ausdrücklich, beside `explicit`
  "deliberately",   // absichtlich, beside `deliberate`
]);

// Same concept as an earlier level, different German word. The key has to
// name the sense, or the row vanishes into the older one.
const REKEY = {
  "nevertheless": "even so",          // dennoch, beside B1 trotzdem
  "otherwise": "or else",             // andernfalls, beside B1 sonst
  "to reduce": "to lessen",           // verringern, beside B1 reduzieren
  "to increase": "to step up",        // steigern, beside B1 erhöhen
  "employee": "employee (legal)",     // der Arbeitnehmer, beside B1 der Angestellte
};

// Rows whose own German belongs to another concept. Unlike the pairs in
// DROP these are separate ideas, so they keep their row and take a word of
// their own.
const REPAIR = {
  "policy": { de: "die Richtlinie", ru: "директива" },  // not B1 `politics`
};

// German and Russian for rows that had an English key and nothing else.
const FILL = require("./b2_fill.json");

const banks = Object.fromEntries(
  LEVELS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(BANK, `${l}.json`), "utf8"))]),
);
const rows = banks.b2;
const problems = [];
const counts = { dropped: 0, rekeyed: 0, repaired: 0, filled: 0 };

const out = [];
for (const row of rows) {
  if (DROP.has(row.en)) {
    counts.dropped += 1;
    continue;
  }
  const next = { ...row };
  if (REKEY[row.en]) {
    next.en = REKEY[row.en];
    counts.rekeyed += 1;
  }
  const repair = REPAIR[row.en];
  if (repair) {
    Object.assign(next, repair);
    counts.repaired += 1;
  }
  const fill = FILL[row.en];
  if (fill) {
    if (next.de || next.ru) problems.push(`"${row.en}" already had German or Russian, fill would overwrite it`);
    [next.de, next.ru] = fill;
    counts.filled += 1;
  }
  out.push(next);
}

for (const key of Object.keys(FILL)) {
  if (!rows.some((r) => r.en === key)) problems.push(`fill names "${key}", which is not a B2 row`);
}
for (const key of DROP) {
  if (!rows.some((r) => r.en === key)) problems.push(`drop names "${key}", which is not a B2 row`);
}
for (const key of Object.keys(REKEY)) {
  if (!rows.some((r) => r.en === key)) problems.push(`rekey names "${key}", which is not a B2 row`);
}
for (const key of Object.keys(REPAIR)) {
  if (!rows.some((r) => r.en === key)) problems.push(`repair names "${key}", which is not a B2 row`);
}

// A concept id an earlier level owns is silently deleted, not reported, so
// this has to be checked here rather than left to the course lint.
const seenId = new Map();
for (const level of LEVELS) {
  const source = level === "b2" ? out : banks[level];
  for (const r of source) {
    const id = r.en.toLowerCase();
    if (seenId.has(id) && level === "b2") {
      problems.push(`"${r.en}" (${r.de || "no German"}) is shadowed by ${seenId.get(id)}`);
    } else if (!seenId.has(id)) {
      seenId.set(id, level);
    }
  }
}

// Two concepts sharing a German word make one of them unanswerable: the
// card shows the word, and either English key is a correct reading of it.
// Only a clash at or below B2 blocks this script. C1 duplicates B2 heavily
// - `hypothesis`, `framework`, `plausible` are in both files verbatim - and
// that is C1's problem to settle when C1 is written. A shared Russian gloss
// is reported and tolerated, as it was at B1: the German still differs, so
// the two cards ask for different answers.
const RANK = { a1: 0, a2: 1, b1: 2, b2: 3, c1: 4 };
const warnings = [];
const owner = { de: new Map(), ru: new Map() };
for (const level of LEVELS) {
  const source = level === "b2" ? out : banks[level];
  for (const r of source) {
    for (const lang of ["de", "ru"]) {
      const word = r[lang];
      if (!word) continue;
      if (owner[lang].has(word)) {
        const [prevLevel, prevKey] = owner[lang].get(word);
        if (level !== "b2" && prevLevel !== "b2") continue;
        const line = `${lang} ${JSON.stringify(word)}: "${r.en}" (${level}) and "${prevKey}" (${prevLevel})`;
        const blocking = lang === "de" && RANK[level] <= RANK.b2 && RANK[prevLevel] <= RANK.b2;
        (blocking ? problems : warnings).push(line);
      } else {
        owner[lang].set(word, [level, r.en]);
      }
    }
  }
}

const usable = out.filter((r) => r.de && r.ru).length;
console.log(
  `b2: ${rows.length} rows -> ${out.length}\n` +
  `  dropped  ${counts.dropped}\n` +
  `  rekeyed  ${counts.rekeyed}\n` +
  `  repaired ${counts.repaired}\n` +
  `  filled   ${counts.filled}\n` +
  `  usable (German and Russian both filled): ${usable}`,
);

if (warnings.length) {
  console.log(`\n${warnings.length} tolerated clashes (a shared Russian gloss, or a C1 row to settle when C1 is written):`);
  for (const w of warnings) console.log(`  ${w}`);
}
if (problems.length) {
  console.error(`\n${problems.length} problems, nothing written:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
if (DRY_RUN) {
  console.log("\ndry run, nothing written");
} else {
  fs.writeFileSync(path.join(BANK, "b2.json"), `${JSON.stringify(out, null, 2)}\n`);
  console.log("\nwrote languages/_bank/b2.json");
}
