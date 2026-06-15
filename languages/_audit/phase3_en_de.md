# Vocabularify Phase 3 — Re-authoring `languages/en/de/` b1/b2/c1

Date: 2026-06-16. Pair `en/de` teaches **English to German speakers**.
Entry shape `{word_1, word_2}` where `word_1` = German source, `word_2` = English target.
CEFR level = difficulty of the **English** target (`word_2`).

## What changed

`b1.json`, `b2.json`, `c1.json` were **rebuilt from scratch**. The previous files were
column-swapped mirrors of the `de/en` German-target deck (see `_audit/en_de.md`): b2/c1 were
100% mirrors and b1 was a mirror + strays, so they were not frequency-/difficulty-tuned for the
English-learning German speaker. They are now proper English-target vocabulary lists graded by
the difficulty of the English word.

`a1.json` and `a2.json` were **left unchanged** (they are genuinely English-target-curated).

## Sources used (level grounding)

- Oxford 3000 & Oxford 5000 by CEFR level (Oxford Learner's Dictionaries) — A1–B2 core (3000) and
  the B2–C1 advanced extension (5000). https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000
- Cambridge English Vocabulary Profile (EVP) — meaning-level CEFR mapping. https://englishprofile.org/?menu=english-vocabulary-profile
- esl-lounge CEFR word lists B1 / B2 / C1. https://www.esl-lounge.com/student/reference/b1-cefr-vocabulary-word-list.php
- British Council LearnEnglish B1–B2 / B2–C1 vocabulary.

Level assignment principle: B1 = intermediate everyday abstractions and high-frequency verbs/adjectives;
B2 = upper-intermediate academic/discourse vocabulary (Oxford 5000 B2 band); C1 = advanced/low-frequency,
register-marked words (Oxford 5000 C1 band).

## Counts per level (this pair)

| Level | Entries |
|-------|--------:|
| a1 (unchanged) | 279 |
| a2 (unchanged) | 269 |
| **b1 (new)** | **197** |
| **b2 (new)** | **169** |
| **c1 (new)** | **140** |

All three new levels exceed the 120 minimum; spread covers verbs, nouns, adjectives, adverbs and
connectors at each level.

## Verification (Node)

- All five files parse as JSON.
- 0 within-file duplicates in b1/b2/c1; 0 repeated German source within each new file.
- 0 cross-level duplicates by English target (`word_2`) introduced by the new files — checked
  against each other and against a1/a2. (Pre-existing a1/a2 internal duplicates were left untouched
  per scope.)
- German written with literal Unicode (ä ö ü ß), no `\u` escapes; exact line format with 4-space
  indent and a space after each colon; files end with `]` + trailing newline.
- Nouns carry the correct article (der/die/das); verbs are infinitives; sense matched to the English target.

## Sample entries (15 per level)

### b1
```
    {"word_1": "zugeben", "word_2": "admit"},
    {"word_1": "beraten", "word_2": "advise"},
    {"word_1": "sich bewerben", "word_2": "apply"},
    {"word_1": "sich verhalten", "word_2": "behave"},
    {"word_1": "behaupten", "word_2": "claim"},
    {"word_1": "die Möglichkeit", "word_2": "opportunity"},
    {"word_1": "die Verantwortung", "word_2": "responsibility"},
    {"word_1": "der Vorteil", "word_2": "advantage"},
    {"word_1": "die Erfahrung", "word_2": "experience"},
    {"word_1": "die Herausforderung", "word_2": "challenge"},
    {"word_1": "verantwortlich", "word_2": "responsible"},
    {"word_1": "erfolgreich", "word_2": "successful"},
    {"word_1": "jedoch", "word_2": "however"},
    {"word_1": "deshalb", "word_2": "therefore"},
    {"word_1": "obwohl", "word_2": "although"},
```

### b2
```
    {"word_1": "anerkennen", "word_2": "acknowledge"},
    {"word_1": "erwerben", "word_2": "acquire"},
    {"word_1": "vermitteln", "word_2": "convey"},
    {"word_1": "berücksichtigen", "word_2": "consider"},
    {"word_1": "die Annahme", "word_2": "assumption"},
    {"word_1": "die Folge", "word_2": "consequence"},
    {"word_1": "die Auswirkung", "word_2": "impact"},
    {"word_1": "die Voreingenommenheit", "word_2": "bias"},
    {"word_1": "die Infrastruktur", "word_2": "infrastructure"},
    {"word_1": "mehrdeutig", "word_2": "ambiguous"},
    {"word_1": "absichtlich", "word_2": "deliberate"},
    {"word_1": "nachhaltig", "word_2": "sustainable"},
    {"word_1": "überholt", "word_2": "obsolete"},
    {"word_1": "folglich", "word_2": "consequently"},
    {"word_1": "darüber hinaus", "word_2": "moreover"},
```

### c1
```
    {"word_1": "abschaffen", "word_2": "abolish"},
    {"word_1": "beschwichtigen", "word_2": "appease"},
    {"word_1": "sich anmaßen", "word_2": "usurp"},
    {"word_1": "verschlimmern", "word_2": "exacerbate"},
    {"word_1": "aushöhlen", "word_2": "undermine"},
    {"word_1": "die Nuance", "word_2": "nuance"},
    {"word_1": "die Zweideutigkeit", "word_2": "ambiguity"},
    {"word_1": "der Vorbehalt", "word_2": "caveat"},
    {"word_1": "der Kenner", "word_2": "connoisseur"},
    {"word_1": "heimlich", "word_2": "clandestine"},
    {"word_1": "auffällig", "word_2": "conspicuous"},
    {"word_1": "gleichbedeutend", "word_2": "tantamount"},
    {"word_1": "stillschweigend", "word_2": "tacit"},
    {"word_1": "allgegenwärtig", "word_2": "ubiquitous"},
    {"word_1": "unbestreitbar", "word_2": "arguably"},
```
