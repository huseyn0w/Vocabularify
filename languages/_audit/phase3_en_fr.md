# Phase 3 changelog — English-from-French (`languages/en/fr/`)

**Date:** 2026-06-16 · **Scope:** REBUILT b1/b2/c1 (broad CEFR lists) + TOPPED UP a2. a1 left untouched.

**Pair convention:** `en/fr` → source = French (`word_1`, with article on nouns / infinitive on verbs), target being learned = English (`word_2`). CEFR level = difficulty of the English target.

## Counts

| File | Before | After |
|------|-------:|------:|
| a1 | 987 | 987 (unchanged) |
| a2 | 311 | 333 (+22) |
| b1 | 82 (jobs/finance only) | 152 (broad B1) |
| b2 | 58 (statistics only) | 123 (broad B2) |
| c1 | 102 (alphabetical academic nouns) | 102 (broad C1, fully re-authored) |

b1/b2/c1 were **replaced**, not edited: the old monothematic, cognate-heavy lists were discarded and rebuilt across verbs, nouns, adjectives, adverbs and connectors.

## Sources (grounding for CEFR banding)

- **Oxford 3000 / Oxford 5000 by CEFR level** — the canonical A1–C1 banded core, used to confirm B1 (Oxford 3000 B1 band), B2 (Oxford 3000 B2 + Oxford 5000), and C1 (Oxford 5000 C1 band). https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000 and the official by-CEFR PDFs (The_Oxford_3000_by_CEFR_level.pdf, The_Oxford_5000_by_CEFR_level.pdf).
- **Cambridge English Vocabulary Profile (EVP)** / **B1 Preliminary vocabulary list** — cross-check of B1 everyday + abstract vocabulary. https://englishprofile.org (English Vocabulary Profile) and https://www.cambridgeenglish.org/images/506887-b1-preliminary-vocabulary-list.pdf
- **esl-lounge CEFR word lists** (B1/C1) — secondary cross-reference. https://www.esl-lounge.com/student/reference/b1-cefr-vocabulary-word-list.php , https://www.esl-lounge.com/student/reference/c1-cefr-vocabulary-word-list.php

## Method

- Authored each list to span parts of speech (verbs, nouns, adjectives, adverbs, connectors) rather than a single theme.
- French translations written by hand, sense-matched to the English target; nouns carry le/la/l'/les, verbs in the infinitive.
- Deduped programmatically: every English target (`word_2`) appears once across all five files. Words colliding with a1/a2 (e.g. *to travel, society, government, reason, dangerous, possible, finally, approach, benefit, risk*) were dropped and replaced with fresh non-colliding level-appropriate words.
- Trivial cognates avoided as padding; chosen words are genuine CEFR-band items.

## Verify (Node)

- All 5 files parse: OK.
- Within-file dups in **new/edited files** (a2, b1, b2, c1): **0** introduced. (Pre-existing legacy a1 within-file dups and the a2 `pepper`/`store` pair are out of scope and untouched.)
- New b1/b2/c1 collisions with a1/a2 or with each other: **0**.
- New a2-addition collisions: **0**.
- Final counts: a1=987, a2=333, b1=152, b2=123, c1=102.

## Samples

### a2 (topped up, +22)
weekend (le week-end), holiday (les vacances), journey (le voyage), appointment (le rendez-vous), health (la santé), sport (le sport), hobby (le passe-temps), activity (l'activité), beach (la plage), mountain (la montagne), forest (la forêt), river (la rivière), lake (le lac), sky (le ciel), rain (la pluie).

### b1 (broad B1, 152)
to improve (améliorer), to develop (développer), to borrow (emprunter), to lend (prêter), to manage (gérer), behaviour (le comportement), education (l'éducation), environment (l'environnement), community (la communauté), responsible (responsable), confident (confiant), narrow (étroit), wide (large), recently (récemment), unfortunately (malheureusement), however (cependant), although (bien que), unless (à moins que).

### b2 (broad B2, 123)
to negotiate (négocier), to mitigate (atténuer), to overcome (surmonter), to implement (mettre en œuvre), argument (l'argument), consequence (la conséquence), uncertainty (l'incertitude), globalization (la mondialisation), inequality (l'inégalité), trade-off (le compromis), considerable (considérable), ambiguous (ambigu), inevitable (inévitable), apparently (apparemment), nevertheless (néanmoins), whereas (alors que), despite (malgré).

### c1 (broad C1, 102)
to alleviate (soulager), to bolster (étayer), to discern (discerner), to undermine (saper), to scrutinize (scruter), idiosyncrasy (l'idiosyncrasie), juxtaposition (la juxtaposition), propensity (la propension), paradox (le paradoxe), disparity (la disparité), intrinsic (intrinsèque), tenuous (ténu), arduous (ardu), spurious (fallacieux), inherently (intrinsèquement), ostensibly (ostensiblement), albeit (quoique), thereby (de ce fait).
