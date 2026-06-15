# Vocabularify Phase 2 — English-from-German level moves (`languages/en/de/`)

Date: 2026-06-15. Scope: **a1.json and a2.json only.** b1/b2/c1 left untouched (confirmed
column-swapped mirrors of the de/en deck per the audit; to be re-authored from an English-target
CEFR/frequency source, not edited here).

Pair convention: `word_1` = German source, `word_2` = English target. English targets carry no
articles, so reclassification is a pure level move (the entry is relocated unchanged). CEFR is judged
on the difficulty of the English target word.

## Decision basis

The audit's clearest a2 misclassifications (`hue`, `clarity`, `editorial`, `white balance`,
`science fiction`) all point **upward to B1/B2**, which is outside the a1↔a2 scope, so they were left
in place. a1 was assessed as well-levelled and received no demotions.

The one clear, defensible a1↔a2 issue is a block of pure A1-core nature/season/basic words stranded in
a2's nature and photography/display sections. Selection was made conservatively:

- Word must be unambiguous Oxford 3000 **A1** core, AND
- the independently-curated de/en deck (English in `word_1`) also classifies it **A1**, AND
- the move is clean: a single a2 entry for that English target and no existing a1 entry with the same
  English target (no new duplicate).

Words the de/en deck placed at A2 or that had multiple/duplicate a2 entries were deliberately **kept**
in a2 for conservatism: `star`, `sky`, `forest`, `river`, `mountain`, `ocean`, `cloud`, `storm`,
`dance`, `sing`, `listen`, `play`, `sound`.

## Moves — a2 → a1 (17 entries)

| German source | English target |
|---|---|
| die Sonne | sun |
| der Mond | moon |
| der Baum | tree |
| die Blume | flower |
| der Regen | rain |
| der Schnee | snow |
| der Wind | wind |
| das Wetter | weather |
| der Sommer | summer |
| der Winter | winter |
| der Frühling | spring |
| der Herbst | autumn |
| die Jahreszeit | season |
| der See | lake |
| das Licht | light |
| die Farbe | color |
| der Urlaub | holiday |

Moves a1 → a2: none.

## Counts

| File | Before | After |
|---|--:|--:|
| a1 | 262 | 279 |
| a2 | 286 | 269 |

## Verification (Node)

- a1.json and a2.json both parse as valid JSON.
- On-disk format preserved exactly: array, one entry per line, 4-space indent,
  `{"word_1": "...", "word_2": "..."}`, space after colons, literal (non-escaped) Unicode,
  trailing newline.
- **New duplicates introduced by this change: 0** (within-file and cross-level).
- Pre-existing duplicates (present before this change, left as-is — same English target / different
  German source, documented in the audit; out of scope for a level-move task):
  - a1 within-file: `sink` (das Spülbecken / das Waschbecken)
  - a2 within-file: `ticket`, `cloud`, `cut`, `sound`, `play`, `screen`, `focus`
  - a1↔a2 cross-level: `television`, `watch`
  None of these involve the 17 moved entries.
