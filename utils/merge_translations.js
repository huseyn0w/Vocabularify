/*
 * Merges per-language sentence columns into languages/_course/<level>.sentences.json.
 *
 * Six translators work in parallel, each writing one language to its own file so
 * they never collide on the shared bank. This folds their columns back in, in
 * one pass.
 *
 * Each input is a JSON object mapping sentence id to a token array:
 *   { "a1_001": [{"t":"Hallo","c":"hello"}, "!", ...], ... }
 *
 *   node utils/merge_translations.js <level> <dir>
 *   node utils/merge_translations.js a1 .git/sdd/tr
 *
 * It reads <dir>/<lang>.json for each of the six non-English languages, skipping
 * any that are absent, and reports exactly what it merged and what it could not.
 * Exit 1 if any column it did find is unusable.
 */
const fs = require("fs");
const path = require("path");

const LANGS = ["de", "fr", "es", "it", "tr", "ru"];
const level = process.argv[2];
const dir = process.argv[3];

if (!level || !dir) {
  console.error("usage: node utils/merge_translations.js <level> <dir>");
  process.exit(2);
}

const target = path.join(__dirname, "..", "languages", "_course", `${level}.sentences.json`);
if (!fs.existsSync(target)) {
  console.error(`${target} does not exist`);
  process.exit(2);
}

const sentences = JSON.parse(fs.readFileSync(target, "utf-8"));
const byId = new Map(sentences.map((s) => [s.id, s]));
let problems = 0;

for (const lang of LANGS) {
  const file = path.join(dir, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.log(`${lang}: no column at ${file}, skipped`);
    continue;
  }

  let column;
  try {
    column = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (error) {
    console.error(`${lang}: could not parse ${file}: ${error.message}`);
    problems++;
    continue;
  }

  const unknown = [];
  let merged = 0;
  for (const [id, tokens] of Object.entries(column)) {
    const sentence = byId.get(id);
    if (!sentence) {
      unknown.push(id);
      continue;
    }
    if (!Array.isArray(tokens)) {
      console.error(`${lang}: ${id} is not a token array`);
      problems++;
      continue;
    }
    sentence.text[lang] = tokens;
    merged++;
  }

  const missing = sentences.filter((s) => !(s.id in column)).map((s) => s.id);
  console.log(`${lang}: merged ${merged}/${sentences.length}`);
  if (missing.length > 0) {
    console.log(`  missing: ${missing.join(", ")}`);
    problems++;
  }
  if (unknown.length > 0) {
    console.log(`  unknown ids in the column: ${unknown.join(", ")}`);
    problems++;
  }
}

fs.writeFileSync(target, `${JSON.stringify(sentences, null, 2)}\n`);
console.log(`\nwrote ${path.relative(path.join(__dirname, ".."), target)}`);
console.log(problems > 0 ? `problems: ${problems}` : "no problems");
process.exit(problems > 0 ? 1 : 0);
