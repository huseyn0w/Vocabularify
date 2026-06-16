/*
 * Generates every language-pair dictionary from the multilingual word bank.
 *
 * Bank: languages/_bank/<level>.json — each an array of concept rows like
 *   { "en": "to go", "de": "gehen", "fr": "aller", "es": "ir",
 *     "it": "andare", "tr": "gitmek", "ru": "идти" }
 * The level is the file the row lives in. A concept (identified by its English
 * value) is kept only at the LOWEST level it appears in.
 *
 * Output: languages/<to>/<from>/<level>.json for every ordered pair of
 * languages (to != from), with { word_1: <source word>, word_2: <target word> }.
 *
 * Run: node utils/generate_pairs.js   (DRY_RUN=1 to preview counts only)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'languages');
const BANK = path.join(ROOT, '_bank');
const LANGS = ['en', 'de', 'fr', 'es', 'it', 'tr', 'ru'];
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'];
const DRY_RUN = process.env.DRY_RUN === '1';

const norm = s => String(s == null ? '' : s).trim().toLowerCase();

function serialise(entries) {
  const lines = entries.map(e => `    {"word_1": ${JSON.stringify(e.word_1)}, "word_2": ${JSON.stringify(e.word_2)}}`);
  return `[\n${lines.join(',\n')}\n]\n`;
}

// Load bank, dedup each concept to the lowest level by its English value.
const seenConcept = new Set();
const byLevel = {};
let bankTotal = 0;
for (const level of LEVELS) {
  const file = path.join(BANK, `${level}.json`);
  byLevel[level] = [];
  if (!fs.existsSync(file)) continue;
  const rows = JSON.parse(fs.readFileSync(file, 'utf-8'));
  for (const row of rows) {
    const key = norm(row.en);
    if (!key || seenConcept.has(key)) continue;
    seenConcept.add(key);
    byLevel[level].push(row);
    bankTotal++;
  }
}
console.log(`Bank concepts (deduped): ${bankTotal}`);

let filesWritten = 0;
const summary = [];
for (const to of LANGS) {
  for (const from of LANGS) {
    if (to === from) continue;
    let pairTotal = 0;
    // Target word must be unique across the whole pair: if two concepts
    // collapse to the same target word, keep it only at the lowest level.
    const seenW2 = new Set();
    for (const level of LEVELS) {
      const out = [];
      for (const row of byLevel[level]) {
        const w2 = row[to];
        const w1 = row[from];
        if (!w1 || !w2) continue;
        const k = norm(w2);
        if (seenW2.has(k)) continue;
        seenW2.add(k);
        out.push({ word_1: w1, word_2: w2 });
      }
      pairTotal += out.length;
      if (!DRY_RUN) {
        const dir = path.join(ROOT, to, from);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${level}.json`), serialise(out));
        filesWritten++;
      }
    }
    summary.push(`${to}/${from}: ${pairTotal}`);
  }
}

console.log(summary.join('\n'));
console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}pairs: ${summary.length}, files ${DRY_RUN ? 'to write' : 'written'}: ${DRY_RUN ? summary.length * LEVELS.length : filesWritten}`);
