# Phase 2 — Level re-banding: English-from-Russian (`languages/en/ru/`)

Date: 2026-06-15
Pair: `to=en`, `from=ru` → `word_1` = Russian (source), `word_2` = English (target).
CEFR level = difficulty of the **English** target word. English targets take no articles, so this phase is **level moves only** (no article task).

Scope: conservatively move only clearly-misclassified entries (off by ~a full band) to the correct level file. Entries removed from the source file and appended to the target file; `word_1`/`word_2` text unchanged. No duplicates created at any target. Coined/non-standard C1 words (binarity, fractality, etc.) left untouched — that is a later phase.

Sources consulted for uncertain calls: Oxford 3000/5000 by CEFR level and the English Vocabulary Profile (C1/C2) framework. Final calls follow the prior audit's high-confidence table plus expert judgment.

## Moves (15)

### a2 → b2 (B2+ finance terms in A2)
- `assets` (активы): a2 -> b2
- `liabilities` (пассивы): a2 -> b2
- `capital` (капитал): a2 -> b2

### a1 → a2 (A1 tail too hard — A2 concrete nouns)
- `submarine` (подводная лодка): a1 -> a2
- `cathedral` (собор): a1 -> a2

### a1 → b1 (A1 tail too hard — B1 nouns)
- `boulevard` (бульвар): a1 -> b1
- `lighthouse` (маяк): a1 -> b1

### b1 → b2 (B2+ abstract -tion/-ity/-ship nouns overloading B1)
- `entrepreneurship` (предпринимательство): b1 -> b2
- `sustainability` (устойчивость): b1 -> b2
- `methodology` (методология): b1 -> b2
- `standardization` (стандартизация): b1 -> b2
- `craftsmanship` (мастерство): b1 -> b2

### b2 → c1 (C1 items mis-filed in B2)
- `efficacy` (эффективность): b2 -> c1
- `ramification` (последствие): b2 -> c1
- `susceptibility` (восприимчивость): b2 -> c1

## Per-level counts (before → after)

| Level | Before | After |
|-------|-------:|------:|
| a1 | 211 | 207 |
| a2 | 225 | 224 |
| b1 | 107 | 104 |
| b2 | 87 | 92 |
| c1 | 123 | 126 |

## Verification (Node)

- All five files parse as valid JSON.
- Within-file exact duplicates: 0 (baseline) → 0 (after).
- Cross-level duplicates by English target (`word_2`): 17 (baseline) → 17 (after) — **unchanged**. These 17 are pre-existing same-English/different-Russian (and a few legacy) collisions out of scope for this phase; no new ones introduced.
- New duplicates introduced by these moves: **0**.
- On-disk format preserved: array form, one entry per line, 4-space indent, `{"word_1": "...", "word_2": "..."}` with spaces after colons, non-escaped Cyrillic, trailing newline.

Notes:
- `устойчивость` appears as both `sustainability` (moved to b2) and `resilience` (remains in b1); these are distinct English targets, so no conflict.
- No target file already contained any of the 15 moved English words; the script aborts if a target collision or missing source row is detected.
