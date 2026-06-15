# Vocabularify Phase 2 — German from English (`languages/de/en/`)

**Date:** 2026-06-15
**Scope:** `a1.json`, `a2.json`, `b1.json`, `b2.json`, `c1.json`.
**This phase MODIFIED the JSON dictionary files.** Changes applied via Node scripts (researched gender map + move list, then applied), not by hand.

Baseline (original, from git HEAD): 0 within-file exact duplicates, 0 cross-level exact duplicates.

---

## Task A — German article normalization

Every single-token, capitalized common noun in `word_2` that lacked a definite article had the correct `der`/`die`/`das` (or `die` for plurals) prepended. Gender was determined from German knowledge; a few ambiguous ones were web-verified (Wiktionary/Duden/DWDS).

**Not touched (correctly):** verbs/adjectives/adverbs (lowercase), entries already carrying an article, multi-word phrases, slash/comma multi-sense entries, hyphenated prefix forms (`Umwelt-`, `Bundes-`, `Rest-`), and non-common-noun capitalized tokens (`Ihnen` pronoun, `Westdeutschland` proper noun, `Weihnachten` festival, `Tennis` sport, `Wiederhören`/`Wiedersehen` greeting interjections).

### Articles added per level

| Level | Articles added |
|-------|---------------:|
| a1 | 31 |
| a2 | 7 |
| b1 | 0 |
| b2 | 275 |
| c1 | 0 |
| **Total** | **313** |

(b1 and c1 had no single-token capitalized nouns missing an article.)

### Web-verified genders (ambiguous; confirmed via search)

- **das Verdienst** (b2) — `merit` sense is neuter (`der Verdienst` = earnings/wage, `das Verdienst` = merit). Verified via Duden/korrekturen.de/Wiktionary.
- **das Gewahrsam** (b2) — `das` is the standard/preferred article (also attested masculine). Verified via DWDS/der-artikel.de.
- **Regime** — verified as `das Regime` (DWDS/verbformen). The b2 entry `{regime, Regime}` was ultimately dropped as a redundant duplicate (see below), since `{regime, das Regime}` already existed in c1.

### Duplicate-safe handling (178 redundant entries removed)

The original data contained many "article-only variant" pairs that were distinct only because one copy already had an article and another did not (often split across levels). Prepending the article would have created exact duplicates, which is forbidden. In every such case the **redundant un-articled copy was removed** and the already-articled canonical form (same English `word_1`) was kept. No vocabulary item was lost — only the article-less duplicate.

Redundant un-articled entries removed: **a1: 44, a2: 1, b2: 133 → 178 total.**

Examples: `toilet/Toilette` (→ kept `die Toilette`), `table/Tisch` (→ `der Tisch`), b2 `conscience/Gewissen` (kept `das Gewissen` already in b1), b2 `regime/Regime` (kept `das Regime` in c1), b2 `burden/Last` (kept `die Last` in c1).

---

## Task B — Level moves (misclassified entries)

Conservative moves only; each verified to create no within-file or cross-level exact duplicate in the target. Moved entries were removed from the source file and appended at the end of the target file.

| Word (German) | English | From | To |
|---------------|---------|------|----|
| falsch | spurious | c1 | a2 |
| stehlen | pilfer | c1 | b1 |
| knapp | scant | c1 | b2 |
| verwitwet | widowed | a1 | a2 |

**Total moves: 4.**

Audit-named candidates that were NOT moved (to avoid creating duplicates or because the move was borderline):
- `intensiv` (c1 → b1): `intensiv` already in b1 — skipped.
- `machbar` (c1 → b2): `machbar` already in b2 — skipped.
- `reichlich` (c1 → b2): `reichlich` already in b2 (and a2) — skipped.
- `hageln` (a1 → b1): `hageln` already in b1 — skipped.
- `toxisch`, `fleißig`, `ewig`: borderline / already at a defensible level — skipped.

---

## Verification (Node)

- All five files parse as JSON: **yes**.
- Within-file exact duplicates (`word_1`+`word_2`, normalized): **0**.
- Cross-level exact duplicates across the five files: **0**.
- On-disk format preserved: array, one entry per line, 4-space indent, `"key": value` spacing, ends with `]` + trailing newline, no escaped Unicode.

### Per-level counts (before → after)

| Level | Before | After |
|-------|-------:|------:|
| a1 | 1437 | 1392 |
| a2 | 1658 | 1659 |
| b1 | 1817 | 1818 |
| b2 | 678 | 546 |
| c1 | 720 | 717 |
| **Total** | **6310** | **6132** |

Net change: -178 (the redundant un-articled duplicates removed in Task A). Article additions modified entries in place (no count change); the 4 moves are count-neutral overall.
