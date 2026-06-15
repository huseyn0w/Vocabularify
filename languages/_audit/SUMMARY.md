# Dictionary Audit — Summary (all pairs)

Date: 2026-06-15. Report-only audit; no dictionary JSON was modified.
Per-pair detail: [de_en](de_en.md) · [de_ru](de_ru.md) · [en_de](en_de.md) · [en_fr](en_fr.md) · [en_ru](en_ru.md) · [fr_en](fr_en.md)

Convention: directory is `<to>/<from>`; `word_1` = source word, `word_2` = target word (the language being learned). CEFR level describes the **target** word's difficulty.

## Critical structural problems (mis-sourced / swapped data)

These are bigger than duplicates — whole files are the wrong data:

- **en/de — b1/b2/c1 are column-swapped mirrors of de/en.** English-word overlap with de/en: b2 100% (722/722), c1 100% (876/876), b1 ~2254/2256. They were built to teach *German to English speakers*, then reversed — so they are not English-target CEFR lists. a1/a2 are genuinely independent.
- **fr/en — b1/b2/c1 are byte-for-byte copies of en/fr.** They are the English-target files mis-placed into the French-target direction (b1=jobs/finance, b2=statistics, c1=alphabetical academic nouns), cognate-heavy, not French-frequency lists. a1/a2 are distinct.
- **en/fr — columns swapped in a2/b1/b2/c1** (word_1=EN/word_2=FR instead of FR/EN); only a1 follows the convention.

➡ The upper levels of en/de, fr/en need **re-authoring** from real target-language frequency/CEFR lists, not deduping. en/fr needs a **column-swap fix** first.

## Duplicates (removable with zero content loss)

| Pair | within-file exact | cross-level "pure" | est. removable rows |
|------|------:|------:|------:|
| de/en | 0 | 928 words | ~1193 |
| de/ru | 501 (c1 alone 360) | 1205 words | ~2000+ |
| en/de | 60 | 268 words | ~337 (≈500–600 if article-variants merged) |
| en/fr | 218 (a2:136, b2:65) | 21 words | ~239 |
| en/ru | 59 | 102 words | ~150 |
| fr/en | 82 (b2:65) | 23 words | ~105 |

## Level-fit (worst offenders)

- **de/en** — B1 is ~49% A1/A2 vocabulary (`Hand`, `Kopf`, `Mutter`, `essen`…); a few sub-C1 words in C1 (`falsch`, `stehlen`, `fleißig`).
- **de/ru** — C1 is the worst: ~50% literal duplication, contaminated with A1/A2 words (`klar`, `gut`, `die Sprache`).
- **en/de** — B1 polluted with 27+ A1-basic words (`hello`, `water`, `day`, `school`) — a side-effect of the mirrored data.
- **en/fr** — B1 has A2-level everyday words (`company/service/customer/bank/price`); B2 is 100% statistics-themed (monothematic).
- **en/ru** — abstract `-tion`/`-ity` nouns overloading B1; C1 contains **coined non-standard English** (`binarity`, `cyclicity`, `coercivity`, `fractality`) that should be replaced.
- **fr/en** — HIGH, driven by the copied b1/b2/c1.

## Data-quality flags

- **de/en** — B2: 411/722 nouns missing `der/die/das` article.
- **de/ru** — junk rows `{"C","C"}`, `{"D","D"}` in b1; proper nouns/meta (`Berlin`, `Übungsbuch`) in a1; truncated `Lieblings`; 8 a2 "Ü"-nouns missing articles (umlaut import bug).
- **en/fr / fr/en** — article inconsistency: present on most a1 nouns, absent in a2–c1.
- **en/ru** — corpus is overwhelmingly nouns; verbs/adjectives/adverbs missing at every level (even A1 lacks `to be`, `to have`, `good`, `who`, `where`).

## Additions

Each per-pair report lists high-frequency missing words per level (with both languages). Common themes: A1 function words / numbers / weekdays / colours; B2–C1 connectors and abstract verbs; for en/ru, verbs & adjectives across all levels.

## Suggested fix phases

1. **Safe & scriptable (no content loss):** remove exact within-file duplicates, remove pure cross-level duplicates (keep lowest valid level), delete junk rows (`{"C","C"}`…), fix the en/fr column swap.
2. **Judgment, lower risk:** move clearly misclassified words to the suggested level; normalise missing articles (de/en B2, de/ru a2, fr nouns).
3. **Content authoring (largest):** re-author en/de and fr/en upper levels (b1/b2/c1) from proper target-language CEFR lists; backfill underpopulated levels; add the suggested high-frequency words; replace coined en/ru C1 words.
