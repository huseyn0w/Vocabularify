# Phase 3 — French-from-English (`languages/fr/en/`) re-authoring

Date: 2026-06-16. Scope: **re-author `b1.json`, `b2.json`, `c1.json` from scratch**; assess `a2.json` top-up; leave `a1.json` untouched.

Data shape: `{word_1, word_2}` — `word_1` = English source, `word_2` = French target being learned. CEFR level = difficulty of the **French** word (`word_2`).

---

## What changed

| File | Before | After | Action |
|------|-------:|------:|--------|
| a1   | 990 | 990 | untouched (left as-is per brief) |
| a2   | 303 | 303 | **no top-up needed** — already above the ~300 target with 0 within-file dups |
| b1   | 105 (mis-sourced en/fr copy) | **147** | fully replaced |
| b2   | 125 (mis-sourced en/fr copy) | **144** | fully replaced |
| c1   | 109 (mis-sourced en/fr copy) | **146** | fully replaced |

Note on a2: the phase-2 changelog recorded a2 at 228, but the live `a2.json` already contains **303** genuine A2 French entries (food/household/shopping/travel/weather/feelings themes), 0 within-file duplicates. As 303 ≥ the ~300 target, no entries were added. a2 was read only to feed the dedup set.

`b1/b2/c1` were confirmed by the audit (`fr_en.md` §1) to be byte-for-byte copies of the English-target `en/fr` dataset (wrong direction). They have been discarded entirely and rebuilt as genuine French-frequency, level-graded lists for English speakers.

---

## Authoring approach

- French common nouns in `word_2` carry the definite article (le/la/l'/les); verbs given in the infinitive; adjectives, adverbs and connectors included for breadth (especially the argumentation connectors that define B1→C1 progression).
- English `word_1` glosses pick the sense matching the French word; multi-sense French targets get a disambiguating gloss (e.g. `to record / to save → enregistrer`).
- Cognate-transparent items were deliberately avoided in favour of items with real learning value in the French direction.
- **Dedup:** every candidate French target was normalised (article stripped) and checked against the union of a1 + a2 stems, then reserved globally so no French target repeats across b1/b2/c1. 57 b1 candidates, 5 b2, and 1 c1 collided with a1/a2 and were dropped; b1 was then topped up with fresh B1-level verbs.

### Level rationale
- **B1** — concrete intermediate life: work/study routines, feelings, society/health basics, high-frequency everyday verbs, and core logical connectors (cependant, pourtant→avoided as a1, malgré, grâce à, au lieu de).
- **B2** — argumentation and abstraction: opinion verbs (soutenir, contester, réfuter, nuancer), abstract process nouns (l'augmentation, la mise en œuvre, l'enjeu), discourse connectors (néanmoins, par conséquent, dans la mesure où, bien que), and evaluative adjectives (pertinent, indéniable, préoccupant).
- **C1** — sophisticated/literary register: idioms (prendre le taureau par les cornes, jeter de la poudre aux yeux, battre en brèche, faire fi de, peser le pour et le contre), nuanced verbs (s'attarder, tergiverser, dédaigner, s'estomper), fine-grained abstract nouns (le discernement, la perspicacité, l'écueil, l'aubaine), and precise adjectives/adverbs (laconique, cinglant, indéfectible, à contrecœur).

---

## Sources (grounding)

- Lawless French — B1 vocabulary lessons by level: https://www.lawlessfrench.com/faq/lessons-by-level/b1-vocabulary/
- KWiziq French — vocabulary & grammar lists by theme / CEFR level: https://french.kwiziq.com/learn/theme
- FrenchLearner — vocabulary lists by theme and CEFR level: https://www.frenchlearner.com/french-vocabulary/
- Talkpal — French words to know for B1: https://talkpal.ai/vocabulary/french-words-to-know-for-b1-level/
- frenchclass.in — DELF B2 syllabus (speaking, grammar, vocabulary): https://www.frenchclass.in/blog/delf-b2-syllabus/
- Intuitive French — DELF B2 vocabulary (opinion verbs, abstract noun structures, connectors): https://intuitivefrench.com/delf-b2-how-to-improve-your-vocabulary-and-score-higher/
- prep2go — B2 French / DELF grammar & connectors guide: https://www.prep2go.study/blog/b2-french-grammar-guide-delf-exam
- Talkpal — DALF C1 guide: https://talkpal.ai/master-the-dalf-c1-your-ultimate-guide-to-success/
- My Polyglot Life — DALF C1 idioms: https://mypolyglotlife.com/docs/how-to-learn-dalf-c1-vocabulary-idioms/
- IIFLS — French C1 syllabus: https://iifls.com/french-c1-syllabus/

---

## Verification (Node)

| Check | a1 | a2 | b1 | b2 | c1 |
|-------|---:|---:|---:|---:|---:|
| JSON parses | OK | OK | OK | OK | OK |
| Count | 990 | 303 | 147 | 144 | 146 |
| Within-file `word_2` dups | 0* | 0 | 0 | 0 | 0 |
| Format (`    {"word_1": "...", "word_2": "..."}`) | — | — | pass | pass | pass |
| Trailing newline | — | — | yes | yes | yes |
| Literal accents (no \u) | — | — | yes | yes | yes |

- Cross-level duplicate French targets (`word_2`, article-stripped) **involving b1/b2/c1: 0**.
- \*a1 reports a single false-positive only under an article-stripping normaliser that collapses pre-existing `l'un` and `un` to the same stem; these are distinct, legitimate a1 entries and a1 was left untouched per the brief.

---

## Samples (~15 per level)

### B1
- to manage / to cope → se débrouiller
- to point out → souligner
- behaviour → le comportement
- in spite of → malgré
- interview (job) → l'entretien
- to deal with / to handle → gérer
- to complain → se plaindre
- to realize → se rendre compte
- unemployment → le chômage
- to recycle → recycler
- consequence → la conséquence
- however → cependant
- instead of → au lieu de
- to download → télécharger
- to postpone → reporter

### B2
- to claim / to assert → prétendre
- to refute → réfuter
- to qualify / to nuance → nuancer
- stake / what is at stake → l'enjeu
- implementation → la mise en œuvre
- to take into account → prendre en compte
- insofar as → dans la mesure où
- consequently → par conséquent
- in other words → autrement dit
- bias / prejudice → le préjugé
- leeway / room to maneuver → la marge de manœuvre
- undeniable → indéniable
- worrying / alarming → préoccupant
- to give rise to / to cause → engendrer
- to assess / to evaluate → évaluer

### C1
- cunning / shrewd → rusé
- to dwell on → s'attarder sur
- far-fetched → tiré par les cheveux
- to weigh the pros and cons → peser le pour et le contre
- to take the bull by the horns → prendre le taureau par les cornes
- to circumvent / to get around → contourner
- to dither / to waver → tergiverser
- composure / poise → le sang-froid
- acumen / sharpness → la perspicacité
- pitfall / trap → l'écueil
- windfall / godsend → l'aubaine
- scathing / cutting → cinglant
- terse / concise → laconique
- reluctantly / grudgingly → à contrecœur
- against all odds → contre toute attente
