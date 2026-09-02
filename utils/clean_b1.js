/**
 * Repairs the B1 word list before the German B1 course is authored.
 *
 * B1 arrived from a different source than A1 and A2. It has none of their
 * inflected-duplicate problem - no finite German forms, no finite Russian
 * glosses - and two problems they did not have:
 *
 *   1. 939 of its 1870 English keys open with a capital, and so do the
 *      Russian glosses on the same rows. The card would read "Trash can /
 *      Мусорное ведро" mid-sentence.
 *   2. ~150 verbs are keyed bare (`Vote`, `Submit`, `paste`) where the
 *      convention everywhere else is `to X`. The German is a proper
 *      infinitive on all of them, so only the key is wrong.
 *
 * Rekeying a verb is where it gets dangerous: `Get | besorgen` wants to
 * become `to get`, which A1 already owns with `kriegen`. dedupeBank keeps
 * the FIRST level a concept id appears at, so a careless rekey does not
 * collide loudly - it silently deletes the B1 word from every pair file.
 * Every target key below was checked against all five levels, and the
 * script refuses to write if any collision survives.
 *
 * The verdicts are explicit lists, as in clean_inflected.js. The 184
 * infinitive-keyed candidates were read by hand: 17 of them are adjectives
 * or adverbs that only look like verbs (`selten`, `zufrieden`, `inzwischen`).
 *
 *   node utils/clean_b1.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
const LANGS = ["en", "de", "fr", "es", "it", "tr", "ru"];
const BANK = path.join(__dirname, "..", "languages", "_bank");

// Keys that must keep their capital: acronyms and proper nouns.
const KEEP_CAPITALISED = new Set([
  "FRG", "GDR", "DZ", "EU", "EZ", "HP", "SUV", "DVD", "NATO", "PC",
  "Federal Republic", "Russian Germans", "World Cup",
]);

// Rows to remove outright. Each one duplicates a word the learner already
// has, under a key that hides the duplication.
const DROP = [
  // The same German verb as an earlier level, differing only by the
  // reflexive pronoun or a prefix that carries no new meaning.
  "Complain",    // beschweren = b1 "to complain | sich beschweren"
  "Hurry",       // sich beeilen = a2 "to hurry | beeilen"
  "Get dressed", // sich anziehen = a1 "to get dressed | (sich) anziehen"
  "Choose",      // sich aussuchen = a2 "to pick out | aussuchen"
  "Send back",   // zurückschicken = b1 "to send back | zurücksenden"
  // künden is not a word for cancelling a contract - kündigen is, and A2
  // already teaches it as `cancel`.
  "Terminate",
  // Not German words the learner can be shown on a card. `haupt` and
  // `sonder` are prefixes that never stand alone, `ugs.` is a dictionary
  // abbreviation, `lerner` and `bio` are lower-case fragments, `los` is a
  // particle glossed as a verb, and `las` is the Präteritum of lesen,
  // which A1 already teaches.
  "main", "bonus", "Colloquial", "Learner", "Bio", "go", "read (past tense)",
];

// Verbs whose key was bare. The value is the key the row takes.
// A plain "to X" wherever X was free; a distinguishing English word or a
// parenthetical wherever an earlier level already owns "to X" with a
// different German verb.
const REKEY = {
  // --- no collision, the key is just the infinitive form -------------
  "subscribe": "to subscribe", "Graduate": "to graduate",
  "Pay attention": "to pay attention", "Try on": "to try on",
  "Look at": "to look at", "Buckle up": "to buckle up",
  "Perform": "to perform", "Come up": "to come up",
  "Dissolve": "to dissolve", "Divide": "to divide",
  "Deal with": "to deal with", "Be enough": "to be enough",
  "Align": "to align", "Exclude": "to exclude", "Exhibit": "to exhibit",
  "Attach": "to attach", "Inspire": "to inspire",
  "Authenticate": "to authenticate", "Enclose": "to enclose",
  "Bite": "to bite", "Employ": "to employ", "Certify": "to certify",
  "Limit": "to limit", "Punish": "to punish", "Care for": "to care for",
  "Flash": "to flash", "Bloom": "to bloom", "Bleed": "to bleed",
  "Drill": "to drill", "Brake": "to brake", "Portray": "to portray",
  "Break in": "to break in", "Check in": "to check in",
  "paste": "to paste", "Submit": "to submit", "Lock up": "to lock up",
  "Meet halfway": "to meet halfway", "Dismiss": "to dismiss",
  "Disappoint": "to disappoint", "Nourish": "to nourish",
  "Escalate": "to escalate", "Dye": "to dye", "Grab": "to grab",
  "Laze around": "to laze around", "Flow": "to flow",
  "Freeze": "to freeze", "Found": "to found", "Come from": "to come from",
  "Honk": "to honk", "Err": "to err", "Fight": "to fight",
  "Tilt": "to tilt", "climb": "to climb", "Crash": "to crash",
  "Criticize": "to criticize", "Cuddle": "to cuddle", "Land": "to land",
  "Steer": "to steer", "Praise": "to praise", "Ventilate": "to ventilate",
  "Think along": "to think along",
  "Experience together": "to experience together",
  "Squeak": "to squeak", "Shave": "to shave",
  "Throw down": "to throw down", "Slide": "to slide",
  "Shake": "to shake", "Swing": "to swing",
  "Make an effort": "to make an effort", "Get angry": "to get angry",
  "Be located": "to be located", "Try hard": "to try hard",
  "Burn oneself": "to burn oneself", "Secure": "to secure",
  "Sort": "to sort", "Specialize": "to specialize", "Strike": "to strike",
  "Refuel": "to refuel", "Run over": "to run over",
  "Turn around": "to turn around", "Fall over": "to fall over",
  "Handle": "to handle", "Interrupt": "to interrupt",
  "Make an appointment": "to make an appointment",
  "Displace": "to displace", "Unite": "to unite", "Enlarge": "to enlarge",
  "Prevent": "to prevent", "Extend": "to extend", "Suspect": "to suspect",
  "Publish": "to publish", "Pollute": "to pollute", "Insure": "to insure",
  "Violate": "to violate", "Condemn": "to condemn",
  "Clean up": "to clean up", "Revoke": "to revoke",
  "Feel good": "to feel good", "Wonder": "to wonder", "Zap": "to zap",
  "Conjure": "to conjure", "Smash": "to smash",
  "Collaborate": "to collaborate", "Collide": "to collide",
  "Touch": "to take hold of",

  // --- the word is a verb but the bare key read as a noun ------------
  "Makeup": "to put on makeup",         // schminken
  "shutdown": "to power down",          // herunterfahren, a2 owns abschalten
  "Worthwhile": "to be worth it",       // (sich) lohnen
  "Use informal you": "to use the informal you", // duzen
  "Exit the parking": "to exit a parking space", // ausparken

  // --- "to X" is taken by a DIFFERENT German verb at another level ---
  "Wash": "to wash up",              // abwaschen vs a2 waschen
  "Show": "to display",              // anzeigen vs a2 zeigen
  "Try out": "to test out",          // ausprobieren vs a1 probieren
  "Meet": "to encounter",            // begegnen vs a2 treffen
  "Observe": "to watch closely",     // beobachten vs b1 zusehen
  "Occupy": "to occupy (a place)",   // besetzen vs a2 einnehmen
  "Get": "to get hold of",           // besorgen vs a1 kriegen
  "Introduce": "to introduce (a system)", // einführen vs a1 vorstellen
  "Insert": "to put in",             // einlegen vs a2 stecken
  "Inquire": "to make inquiries",    // erkundigen vs a1 nachfragen
  "Create": "to draw up",            // erstellen vs b1 schaffen
  "Raise": "to raise a child",       // erziehen vs b1 anheben
  "Ensure": "to warrant",            // gewährleisten vs b1 garantieren
  "Act": "to take action",           // handeln vs a1 tun
  "Achieve": "to carry out",         // leisten vs b1 erreichen
  "Lead": "to direct",               // leiten vs b1 führen
  "Check": "to check on",            // nachsehen vs a2 nachschauen
  "Operate": "to operate on",        // operieren vs a2 betreiben
  "Realize": "to become aware",      // realisieren vs b1 begreifen
  "Thank": "to express thanks",      // sich bedanken vs a1 danken
  "Win": "to be victorious",         // siegen vs a2 gewinnen
  "Drop": "to drip",                 // tropfen
  "Consider": "to ponder",           // überlegen vs a2 bedenken
  "Arrest": "to place under arrest", // verhaften vs a2 festnehmen
  "Utilize": "to make use of",       // verwerten vs b1 gebrauchen
  "Continue": "to carry on",         // weitergehen vs b1 fortsetzen
  "Hand over": "to hand off",        // übergeben
  "Allow": "to permit",              // zulassen vs a2 erlauben
  "Greet": "to greet someone",       // begrüßen
  "Treat": "to treat (a person)",    // behandeln
  "Accompany": "to escort",          // begleiten
  "Pursue": "to chase",              // verfolgen
  "Commit": "to pledge",             // verpflichten
  "Destroy": "to demolish",          // zerstören
  "Lower": "to bring down",          // senken
  "Discover": "to uncover",          // entdecken
  "Count": "to count up",            // zählen
  "Hate": "to detest",               // hassen
  "Predict": "to forecast",          // vorhersagen
  "Facilitate": "to ease",           // erleichtern

  // --- rows already keyed "to X" where the key names the wrong verb --
  "to decorate": "to paint a wall",  // anstreichen is painting, not decorating
  "to reunite": "to meet again",     // wiedersehen is seeing someone again
  "Decorate": "to decorate",         // dekorieren, freed by the line above
  "Reunite": "to reunify",           // wiedervereinigen
  "Appoint": "to appoint",           // berufen, the Russian is repaired below

  // --- two rows the A1/A2 courses already teach under this key -------
  "right": "right (entitlement)",    // das Recht vs a2 rechts, the direction
  "job": "position (job)",           // die Stelle vs a2 der Beruf
};

// Cell repairs, keyed by the row's ORIGINAL English key.
const REPAIR = {
  "especially": { de: "besonders" },        // "besonders gesehen" is not a word
  "Enjoyment": { de: "das Vergnügen" },     // it is a noun on this row
  "Appoint": { ru: "назначать" },           // berufen is not «называть»
  "Show": { ru: "отображать" },             // anzeigen displays, «сообщать» is nachricht territory
  "special": { de: "speziell" },            // besonders is the adverb on the row below it
  "denim": { de: "die Jeans" },             // the noun, with its article and capital
};

// A French-only placeholder row and a German row for the same concept, both
// already at B1. Filling the placeholder and dropping the German row merges
// them without moving the concept to another level.
const MERGE = {
  "to hire": "Hire", "to resign": "Resign", "to vote": "Vote",
  "to have fun": "Have fun", "to recycle": "Recycle",
  "to analyze": "Analyze", "to feed": "Feed",
};

const EXPECTED_EXACT_DUPES = 48;

function read(level) {
  return JSON.parse(fs.readFileSync(path.join(BANK, `${level}.json`), "utf8"));
}
function lower(s) {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

const banks = {};
for (const level of LEVELS) banks[level] = read(level);
const rows = banks.b1;
const byKey = new Map(rows.map((r) => [r.en, r]));

const problems = [];
for (const key of [...DROP, ...Object.keys(REKEY), ...Object.keys(REPAIR), ...Object.values(MERGE)]) {
  if (!byKey.has(key)) problems.push(`no B1 row keyed "${key}"`);
}
for (const key of Object.keys(MERGE)) {
  const row = byKey.get(key);
  if (!row) problems.push(`no B1 placeholder keyed "${key}"`);
  else if (row.de || row.ru) problems.push(`"${key}" is not a placeholder - it already has de/ru`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(2);
}

// Rows the earlier levels already teach with the same German word.
const earlier = new Map();
for (const level of ["a1", "a2"]) {
  for (const r of banks[level]) {
    if (r.de && !earlier.has(r.en)) earlier.set(r.en, { level, de: r.de });
  }
}
const exactDupes = rows.filter((r) => {
  const prior = earlier.get(r.en);
  return r.de && r.ru && prior && prior.de === r.de;
});
if (exactDupes.length !== EXPECTED_EXACT_DUPES) {
  console.error(
    `expected ${EXPECTED_EXACT_DUPES} rows duplicating A1/A2 exactly, found ${exactDupes.length}. ` +
    `The bank changed - read the list before raising the number.`
  );
  process.exit(2);
}
const dropKeys = new Set([...DROP, ...Object.values(MERGE), ...exactDupes.map((r) => r.en)]);

const out = [];
const counts = { dropped: 0, merged: 0, rekeyed: 0, repaired: 0, lowercased: 0 };
for (const row of rows) {
  const original = row.en;
  if (dropKeys.has(original) && !Object.keys(REKEY).includes(original)) {
    counts.dropped += 1;
    continue;
  }
  const next = { ...row };
  if (REPAIR[original]) {
    Object.assign(next, REPAIR[original]);
    counts.repaired += 1;
  }
  if (MERGE[original]) {
    const source = byKey.get(MERGE[original]);
    for (const lang of LANGS) {
      if (!next[lang] && source[lang]) next[lang] = source[lang];
    }
    counts.merged += 1;
  }
  if (REKEY[original]) {
    next.en = REKEY[original];
    counts.rekeyed += 1;
  } else if (next.en[0] && next.en[0] !== next.en[0].toLowerCase() && !KEEP_CAPITALISED.has(next.en)) {
    next.en = lower(next.en);
    next.ru = lower(next.ru);
    counts.lowercased += 1;
  }
  out.push(next);
}

// Nothing may collide with a concept an earlier level owns, or the row
// disappears from every pair file without a word of warning.
const seen = new Map();
for (const level of LEVELS) {
  const source = level === "b1" ? out : banks[level];
  for (const r of source) {
    const id = r.en.toLowerCase();
    if (seen.has(id) && level === "b1") {
      problems.push(`"${r.en}" (${r.de || "no German"}) is shadowed by ${seen.get(id)}`);
    } else if (!seen.has(id)) {
      seen.set(id, level);
    }
  }
}
const dupWithinB1 = new Set();
const b1Seen = new Set();
for (const r of out) {
  const id = r.en.toLowerCase();
  if (b1Seen.has(id)) dupWithinB1.add(r.en);
  b1Seen.add(id);
}
for (const key of dupWithinB1) problems.push(`"${key}" appears twice inside B1`);

console.log(
  `b1: ${rows.length} rows -> ${out.length}\n` +
  `  dropped   ${counts.dropped}\n` +
  `  merged    ${counts.merged}\n` +
  `  rekeyed   ${counts.rekeyed}\n` +
  `  repaired  ${counts.repaired}\n` +
  `  lowercased ${counts.lowercased}`
);
const usable = out.filter((r) => r.de && r.ru).length;
console.log(`  usable (German and Russian both filled): ${usable}`);

if (problems.length) {
  console.error(`\n${problems.length} collisions, nothing written:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
if (DRY_RUN) {
  console.log("\ndry run, nothing written");
} else {
  fs.writeFileSync(path.join(BANK, "b1.json"), `${JSON.stringify(out, null, 2)}\n`);
  console.log("\nwrote languages/_bank/b1.json");
}
