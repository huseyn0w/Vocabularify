/**
 * Assemble the restored French dictionary from the nine agent slices, and
 * reconcile the keys they could not coordinate on.
 *
 * The slices ran concurrently, so none could see the others' output. Each was
 * told to keep its own keys unique and leave cross-slice duplicates to this
 * pass. Two rows claiming one English key is therefore expected here, not a
 * failure.
 *
 * Neither claimant wins on a tiebreak. Which French word deserves the plain
 * English key is a judgement - `les gens` is the everyday "people" while `le
 * peuple` is a nation, and `gentil` is plain "nice" where `sympa` is
 * colloquial - so every claimant goes to fr-needs-rekey.json together and a
 * pass that can read French decides. Picking by file order would hand the key
 * to the rarer word about half the time.
 *
 * A restored French row lands in one of two places:
 *
 *   fill  - the bank already has this English concept with an empty `fr`,
 *           usually a row the German restore just added. The French word
 *           completes it, and one row then serves both languages.
 *   new   - no such concept, so the row joins the bank carrying only en and fr.
 *
 *   node utils/collect_french.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ARGS = process.argv.slice(2);
const UNKNOWN = ARGS.filter((a) => a !== "--dry-run");
if (UNKNOWN.length > 0) {
  console.error(`unknown argument: ${UNKNOWN.join(" ")}`);
  console.error("usage: node utils/collect_french.js [--dry-run]");
  process.exit(2);
}
const DRY_RUN = ARGS.includes("--dry-run");

const DIR = path.join(__dirname, "..", ".git", "sdd", "restore");
const BANK = path.join(__dirname, "..", "languages", "_bank");
const LEVELS = ["a1", "a2", "b1", "b2", "c1"];

const SLICES = [
  ...[1, 2, 3, 4, 5, 6].map((n) => `fr-norm-${n}.out.json`),
  ...[1, 2].map((n) => `fr-amb-${n}.out.json`),
  "fr-keys.out.json"
];

const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();
const read = (name) => {
  const file = path.join(DIR, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};

const rows = [];
const missing = [];
for (const name of SLICES) {
  const slice = read(name);
  if (!slice) {
    missing.push(name);
    continue;
  }
  for (const row of slice) {
    rows.push({ ...row, slice: name });
  }
}

// The bank, indexed both ways: by concept key to find a row to complete, and
// by French word so a word already present is not added under a second key.
const bankByEn = new Map();
const bankFr = new Set();
for (const level of LEVELS) {
  const file = path.join(BANK, `${level}.json`);
  if (!fs.existsSync(file)) continue;
  for (const row of JSON.parse(fs.readFileSync(file, "utf8"))) {
    bankByEn.set(norm(row.en), { level, row });
    if (row.fr) bankFr.add(norm(row.fr));
  }
}

const fills = [];
const fresh = [];
const dropped = { ruledOut: [], noKey: [], frenchInBank: [], keyTaken: [], occupied: [] };
const claimed = new Map();
const contested = new Set();

const byLevel = [...rows].sort(
  (a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)
);

for (const row of byLevel) {
  const fr = String(row.fr || "").trim();
  const en = String(row.en || "").trim();
  if (row.drop) {
    dropped.ruledOut.push(row);
    continue;
  }
  if (!fr || !en) {
    dropped.noKey.push(row);
    continue;
  }
  if (bankFr.has(norm(fr))) {
    dropped.frenchInBank.push(row);
    continue;
  }
  const key = norm(en);
  if (claimed.has(key)) {
    // Both words are real and only one can hold the key. Which one deserves it
    // is a judgement - `les gens` is the everyday "people" and `le peuple` is
    // a nation - so neither is taken on a tiebreak here. Both go to the rekey
    // list and a pass that can read French decides.
    dropped.keyTaken.push({ row, first: claimed.get(key) });
    contested.add(key);
    continue;
  }
  const hit = bankByEn.get(key);
  if (hit && String(hit.row.fr || "").trim() !== "") {
    // The bank holds this concept with a different French word already.
    dropped.occupied.push({ row, existing: hit.row.fr });
    continue;
  }
  claimed.set(key, row);
  bankFr.add(norm(fr));
  if (hit) fills.push({ ...row, fr, en, level: hit.level });
  else fresh.push({ ...row, fr, en });
}

const report = (label, list, sample) => {
  console.log(`  ${label}: ${list.length}`);
  for (const entry of list.slice(0, sample)) {
    const r = entry.row || entry;
    const extra = entry.first
      ? ` (taken by "${entry.first.fr}" in ${entry.first.slice})`
      : entry.existing
        ? ` (bank already has "${entry.existing}")`
        : "";
    console.log(`      ${r.level} ${r.fr} = ${r.en || "(no key)"}${extra}`);
  }
  if (list.length > sample) console.log(`      ... and ${list.length - sample} more`);
};

console.log(`slices read: ${SLICES.length - missing.length} of ${SLICES.length}`);
if (missing.length > 0) console.log(`MISSING: ${missing.join(", ")}`);
console.log(`rows in: ${rows.length}`);
console.log("dropped:");
report("ruled out by its slice", dropped.ruledOut, 6);
report("no french or no key", dropped.noKey, 6);
report("french word already in the bank", dropped.frenchInBank, 6);
report("key claimed by another slice", dropped.keyTaken, 10);
report("bank concept already has a french word", dropped.occupied, 10);
console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}completes an existing bank row: ${fills.length}`);
console.log(`${DRY_RUN ? "[DRY RUN] " : ""}new bank rows: ${fresh.length}`);

const counts = {};
for (const r of [...fills, ...fresh]) counts[r.level] = (counts[r.level] || 0) + 1;
console.log("by level:", LEVELS.map((l) => `${l} ${counts[l] || 0}`).join(", "));

// A contested key was provisionally given to whichever row reached it first.
// Pull that row back out: the rekey pass has to see every claimant together,
// or it decides which word keeps the key without seeing its rival.
const contestedRows = [];
const keepFill = fills.filter((r) => !contested.has(norm(r.en)));
const keepFresh = fresh.filter((r) => !contested.has(norm(r.en)));
for (const r of [...fills, ...fresh]) {
  if (contested.has(norm(r.en))) contestedRows.push(r);
}
if (contested.size > 0) {
  console.log(
    `\ncontested keys pulled back for rekeying: ${contested.size} keys, ` +
      `${contestedRows.length + dropped.keyTaken.length} rows`
  );
}

if (!DRY_RUN) {
  fs.writeFileSync(
    path.join(DIR, "fr.collected.json"),
    JSON.stringify({ fills: keepFill, fresh: keepFresh }, null, 2) + "\n"
  );
  const lost = [
    ...contestedRows.map((row) => ({ row, first: null })),
    ...dropped.keyTaken,
    ...dropped.occupied
  ].map((e) => ({
    ...e.row,
    reason: e.existing ? `bank has ${e.existing}` : "two french words want this key"
  }));
  fs.writeFileSync(path.join(DIR, "fr-needs-rekey.json"), JSON.stringify(lost, null, 2) + "\n");
  console.log("\nwrote fr.collected.json and fr-needs-rekey.json");
}
