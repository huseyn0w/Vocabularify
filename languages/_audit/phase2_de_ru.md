# Phase 2: German-from-Russian dictionaries (`languages/de/ru/`) — applied changes

Date: 2026-06-15. Scope: dictionary JSON **modified**. Operated on current (already de-duplicated) contents, not the original audit counts.

`word_1` = Russian (source), `word_2` = German (target). CEFR level = difficulty of the German word.

## Per-level entry counts (before → after)

| File | Before | After | Delta |
|------|-------:|------:|------:|
| a1.json | 1437 | 1437 | 0 |
| a2.json | 1685 | 1685 | 0 |
| b1.json | 1785 | 1782 | -3 |
| b2.json | 326 | 326 | 0 |
| c1.json | 307 | 304 | -3 |

(Article fixes do not change counts; the deltas come from removing redundant duplicate copies, see below.)

---

## Task A — German articles normalized in `word_2`

Prepended the correct definite article to single-token capitalized common nouns that lacked one. Gender determined from German knowledge; the two A1/A2 high-frequency examples (`glauben`/`hell` levels and these nouns) were cross-checked against the Goethe-Institut Wortlisten.

### a1 (2 nouns)
- `Übung` → **die Übung**
- `Übungsbuch` → **das Übungsbuch**

### a2 (8 nouns — all "Ü"-initial, the umlaut-import edge case the audit flagged)
- `Übelkeit` → **die Übelkeit**
- `Überfall` → **der Überfall**
- `Überraschung` → **die Überraschung**
- `Überschrift` → **die Überschrift**
- `Übersiedlung` → **die Übersiedlung**
- `Überwachungskamera` → **die Überwachungskamera**
- `Überweisung` → **die Überweisung**
- `Überweisungsformular` → **das Überweisungsformular**

**Total articles added: 10** (a1: 2, a2: 8).

**Web-verified:** Goethe-Institut Wortliste lookups confirmed `glauben` and `hell` (Task B) as A1/A2 vocabulary; the noun genders above are standard-German high-confidence (Duden) and were not individually web-queried.

### Deliberately NOT articleized
- `Berlin`, `Aachen` — proper nouns.
- `Sie`, `Ihnen`, `Ihr/Ihre` — pronouns.
- `Lieblings` (b1) — truncated prefix, not a standalone noun.
- All-caps abbreviations and already-articled / multi-word entries left untouched.

### Collision handling (cross-level)
Adding articles in a1/a2 made three entries exactly match already-articled entries in **b1** (same `word_1` + `word_2`). Per the "remove the redundant un-articled copy / keep lowest level" rule, the redundant **b1** copies were removed (a1/a2 is the correct lowest level):
- `упражнение / die Übung` — removed from b1 (kept in a1)
- `сюрприз / die Überraschung` — removed from b1 (kept in a2)
- `заголовок / die Überschrift` — removed from b1 (kept in a2)

---

## Task B — Misclassified entries corrected

Conservative pass. The clearest sub-C1 contaminants still present in c1 after de-dup were the basic A1/A2 verbs/adjectives `glauben`, `hell`, `planen`. Each already exists at its correct level (a1) with an equivalent Russian gloss, so appending to the target would have created a forbidden cross-level duplicate. Per the rules, the misclassified c1 copy was **removed** (the correct lower-level entry is retained).

| German | c1 Russian gloss | Action | Correct level (retained) |
|--------|------------------|--------|--------------------------|
| glauben | полагать | removed from c1 | a1 (верить / glauben) |
| hell | яркий | removed from c1 | a1 (светлый / hell) |
| planen | запланировать | removed from c1 | a1 (планировать / planen) |

`glauben` and `hell` confirmed A1/A2 via Goethe-Institut Wortliste. The audit's other named easy words (`klar`, `gut`, `die Sprache`, `die Energie`, `fühlen`) were already absent from c1 after de-duplication — no action needed.

No entries were appended to any target level (all targets already held the correct entry), so no new duplicates were created.

---

## Verification (Node script)

- All five files parse as valid JSON.
- On-disk format preserved exactly: `[` line, one entry per line at 4-space indent as `    {"word_1": "...", "word_2": "..."}`, trailing comma on all but the last entry, `]` close, trailing newline, non-escaped Unicode/Cyrillic.
- **Within-file exact duplicates: 0**
- **Cross-level exact duplicates: 0**
- `word_1` values unchanged.
