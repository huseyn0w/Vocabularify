/*
 * Turns the deduped bank into the concept lists `validateCourse` expects,
 * shared between validate_course.js's shared-course and per-target-course
 * loops. Pulled into its own pure, side-effect-free module (no file reads, no
 * process.exit) so this filtering can be unit-tested directly, unlike the CLI
 * script itself.
 */
"use strict";

// A bank row with no word in `target` cannot be taught by that target's
// course at all - the multilingual bank restore left rows with an empty
// target-language column (263 of A1's 1477 rows have no "de" translation,
// carried over from a French dictionary restore, with no German word to
// teach). For the shared course every row is still a concept - a row missing
// a language is exactly what the existing "missing or empty text" checks
// are for. For a per-target course, a row missing the target language is not
// a concept that course forgot to teach: it is not a concept that language
// has, and it must never be demanded of a lesson. `target` undefined (the
// shared course) skips the filter entirely.
function hasTargetWord(row, target) {
  return !target || (typeof row[target] === "string" && row[target].trim().length > 0);
}

// levelConcepts: this level's bank rows (as concept ids), filtered to
// `hasTargetWord` when `target` is given. priorConcepts: the same, unioned
// over every level before `level` in `levels`' order. `banked` is
// level -> bank rows (already deduped by dedupeBank); `conceptId` is
// course.js's own id function, passed in rather than re-implemented here.
function levelConceptsFor(banked, levels, level, conceptId, target) {
  const priorConcepts = [];
  for (const earlier of levels) {
    if (earlier === level) break;
    priorConcepts.push(
      ...(banked[earlier] || [])
        .filter((row) => hasTargetWord(row, target))
        .map((row) => conceptId(row.en)),
    );
  }
  const levelConcepts = (banked[level] || [])
    .filter((row) => hasTargetWord(row, target))
    .map((row) => conceptId(row.en));
  return { levelConcepts, priorConcepts };
}

module.exports = { hasTargetWord, levelConceptsFor };
