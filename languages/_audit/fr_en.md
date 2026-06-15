# Audit — French-from-English (`languages/fr/en/`)

Date: 2026-06-15. REPORT-ONLY — no JSON files were modified.

Files audited: `a1.json` (990), `a2.json` (341), `b1.json` (105), `b2.json` (125), `c1.json` (109).

Data shape: JSON array of `{word_1, word_2}`. Directory convention `<to>/<from>` → `to=fr`, `from=en`, so `word_1` should be the English **source** and `word_2` the French **target** being learned. CEFR level reflects the difficulty of the **French** word.

---

## 0. Orientation verdict (word_1 = English, word_2 = French)

**Correct, not swapped.** Every sampled entry has `word_1` = English, `word_2` = French (`{"word_1":"silence","word_2":"le silence"}`, `{"word_1":"to apply","word_2":"postuler"}`). Orientation is consistent across all five files.

---

## 1. COPIED-DATA FLAG (critical) — b1 / b2 / c1 are the en/fr files

**VERDICT: CONFIRMED. `b1.json`, `b2.json`, and `c1.json` in `fr/en/` are byte-for-byte identical to the corresponding files in `languages/en/fr/`.**

```
a1: fr/en vs en/fr -> differ (986 lines)   ← genuinely distinct
a2: fr/en vs en/fr -> differ (313 lines)   ← genuinely distinct
b1: fr/en vs en/fr -> IDENTICAL
b2: fr/en vs en/fr -> IDENTICAL
c1: fr/en vs en/fr -> IDENTICAL
```

The matching sizes (105 / 125 / 109) that flagged this in the brief are explained: the upper three files were **mis-copied from the English-target (`en/fr`) dataset** rather than authored for the French-target direction.

Why this matters for the `fr/en` (learn-French) direction:
- These files are *thematically* English-curriculum sets (b1 = a "job application / business-finance" theme, b2 = a "statistics/research-methodology" theme, c1 = an alphabetical academic-noun list), not a general French-frequency progression.
- They are riddled with **transparent cognates** where the French target is spelled (nearly) identically to the English source, giving near-zero learning value in the French direction: c1 has 29/109 such pairs (`abstraction`, `acquisition`, `annotation`, `collaboration`, `compilation`, `consensus`…), b1 13/105 (`promotion`, `manager`, `information`, `marketing`), b2 18/125 (`variable`, `concept`, `distribution`, `mode`).
- The `en/fr` source files themselves contain **internal duplication** (see §2) that got carried over verbatim.

**Recommendation:** treat b1/b2/c1 as placeholders. Re-author them as real French-frequency B1/B2/C1 word lists for English speakers (see §4). At minimum, dedupe the copied content.

---

## 2. DUPLICATES

Methodology: a Node script (run via Bash) loaded all five files. Within-file dups computed two ways — **EXACT** (`word_1`+`word_2` identical row) and **same-key/different-value** (same English `word_1`, different French `word_2`). Cross-level dups computed on the **French target** (`word_2`): **PURE** = same French + same English across levels; **DIFF-VALUE** = same French, different English gloss.

### 2a. Within-file

| Level | Entries | EXACT dup rows | Same EN / diff FR | Same FR / diff EN |
|-------|--------:|---------------:|------------------:|------------------:|
| A1 | 990 | 0 | 41 | 0 |
| A2 | 341 | 0 | 2 | 9 |
| B1 | 105 | **17** | 0 | 1 |
| B2 | 125 | **65** | 0 | 1 |
| C1 | 109 | 0 | 0 | 0 |
| **Total** | | **82** | **43** | **11** |

- **B2 is essentially the whole list duplicated.** It has only 60 unique rows; duplication begins at index 28 (`variable|variable` first seen at index 6) and the back portion repeats the front nearly entirely. 65 of 125 rows are removable EXACT duplicates. (Copied verbatim from `en/fr/b2.json`.)
- **B1**: 17 EXACT dup rows (88 unique of 105); the back third repeats the front (`investment|investissement` at index 88 first seen at 69). Also carried over from `en/fr/b1.json`.
- **A1 same-EN/diff-FR (41)** are mostly legitimate synonym pairs sharing one English gloss, not errors, but they bloat the deck and create ambiguous prompts: `stop → cesser / arrêter`, `close → fermer / près` (note: *près* = "near", a mis-gloss, not "close"), `here → voilà / ici`, `interest → un intérêt / intéresser`.
- **A2 same-FR/diff-EN (9)** are genuine collisions worth reviewing: `magasin (shop/store)`, `café (café/coffee)`, `pantalon (trousers/pants)`, `serviette (napkin/towel)`, `temps (weather/time)`, `chef (boss/chef)`, `chambre (room/bedroom)`.

### 2b. Cross-level (by French target)

| Type | Count | Combos | Examples |
|------|------:|--------|----------|
| PURE identical | 23 | a1+a2: 7, a2+b1: 6, b1+b2: 3, b2+c1: 7 | `sad=triste [a1,a2]`, `to take=prendre [a1,a2]`, `price=prix [a2,b1]`, `analysis=analyse [b1,b2]` |
| DIFF-VALUE | 24 | a1+a2: 21, a2+b1: 1, b1+b2: 1, b2+c1: 1 | `marcher [walk/to walk]`, `manger [eat/to eat]`, `heureux [happy(m)/happy]`, `grand [large/big]` |

- The 21 A1↔A2 DIFF-VALUE pairs are the **same French word** appearing in both A1 and A2 with only a cosmetic English-gloss difference (usually the `to ` prefix or a `(m)` tag): `marcher`, `manger`, `voler`, `laver`, `acheter`, `attraper`, `rester`, `petit`, `grand`, `vieux`, `heureux`… These are effectively duplicates and the A2 copy should be dropped.

### 2c. Removable estimate

- **Cross-level PURE** (keep lowest valid level, remove higher copies): **23 removable** — by level: a2: 7, b1: 6, b2: 3, c1: 7.
- **Within-file EXACT**: **82 removable** (B2 65, B1 17). These are pure noise.
- **A1↔A2 cosmetic DIFF-VALUE**: ~21 additional candidates (remove the A2 copy).
- **Conservative removable total: ~105** (82 within-file EXACT + 23 cross-level PURE), rising to **~126** if the A1↔A2 cosmetic dups are also collapsed.

Recommendation for PURE cross-level dups: keep the **lowest** CEFR level (the easier/more-frequent context) and remove the higher-level repeat.

---

## 3. LEVEL-FIT

**Methodology (honest):** there is no automated CEFR oracle for single words. Assessment is by linguist judgment against (a) French frequency-band intuition, (b) the standard A1/A2/B1 reference vocabulary used in DELF/DALF prep, and (c) structural signals (cognate transparency, thematic clustering, presence of articles). Treat severities as expert estimates, not measured scores.

**Overall severity: HIGH** — driven almost entirely by the copied b1/b2/c1 files (§1), plus systemic article inconsistency.

### Per-level impression

- **A1 (990):** Mostly appropriate high-frequency vocabulary, but the file is over-stuffed and mixes registers. Clear *too-easy-for-A1-but-fine* items dominate. A handful of mis-glosses exist (`close → près` should be "near"). The 990-count is large but plausible for A1 core. **Severity: LOW-MEDIUM.**
- **A2 (341):** Reasonable A2 themes (food, household, shopping). Sharpest drop-off in size from A1. **Severity: LOW**, aside from the synonym collisions in §2a.
- **B1 (105):** NOT a French-B1 frequency list — it is a single thematic block (job hunting → business finance) copied from en/fr. Many items are A2-level frequency in French (`emploi`, `salaire`, `client`, `prix`, `banque`) or transparent cognates (`promotion`, `manager`, `marketing`). **Severity: HIGH (mislabeled/mis-sourced).**
- **B2 (125):** A statistics/research-methodology glossary, half of it duplicated. Domain-specialist vocabulary, not general B2 (`coefficient`, `régression`, `médiane`, `inférentiel`). Almost no learning value for a general French learner; cognate-heavy. **Severity: HIGH.**
- **C1 (109):** An alphabetical list of Latinate academic nouns, 29 of which are spelled essentially identically in English and French. These look "advanced" but are trivially guessable for an English speaker, so they fail the *difficulty-of-the-French-word* criterion. **Severity: HIGH.**

### Clearest misclassifications
- Whole-file: `b1`, `b2`, `c1` mislabeled by being copied from the English-target dataset (§1).
- `près` glossed as "close" (should be "near") — A1.
- B1 items that belong in A1/A2 by French frequency: `prix`, `client`, `banque`, `salaire`, `emploi`.
- C1 cognate "freebies" that are not C1-hard in this direction: `abstraction`, `annotation`, `collaboration`, `consensus`.

### Data-quality flags
- **Article inconsistency (systemic):** A1 has articles on 397/990 French nouns (`le silence`, `un thé`); **A2, B1, B2, C1 have articles on 0** of their entries. For a learner, knowing the gender (le/la, un/une) is essential and should be uniform. Either add articles everywhere or remove them everywhere — current state is inconsistent.
- **Cognate padding:** 17 (A1) + 32 (A2) + 13 (B1) + 18 (B2) + 29 (C1) entries where the French target equals the English source string. Tolerable in small numbers; excessive in C1/A2.
- **Synonym ambiguity:** 41 A1 entries share an English gloss across two French words (ambiguous prompt direction).
- **Steep size cliff:** 990 → 341 → 105/125/109. The upper levels are under-populated (and what exists is mis-sourced).

---

## 4. ADDITIONS (high-frequency French missing per level)

Format: English → French (with article where it's a noun). Upper levels especially need backfill since b1/b2/c1 must be re-authored from scratch as real French-frequency lists.

### A1 (fill genuine gaps in core)
- already → déjà
- enough → assez
- to need → avoir besoin de
- to be able to → pouvoir
- must / to have to → devoir
- week → la semaine
- month → le mois
- tomorrow → demain
- yesterday → hier
- expensive / cheap → cher / bon marché

### A2
- to remember → se souvenir
- to forget → oublier
- weather → le temps (disambiguate from "time")
- neighbourhood → le quartier
- to rent → louer
- ticket → le billet
- traffic → la circulation
- on time / late → à l'heure / en retard
- mistake → l'erreur (f)
- to advise → conseiller

### B1 (re-author as general French B1, not a finance theme)
- to manage / to cope → se débrouiller
- meanwhile → pendant ce temps
- to be worth → valoir la peine
- to give up → abandonner / renoncer
- moreover → de plus / en outre
- worried → inquiet
- to point out → souligner
- behaviour → le comportement
- in spite of → malgré
- to take advantage of → profiter de

### B2 (replace the duplicated stats glossary with general B2)
- to claim → prétendre / affirmer
- nevertheless → néanmoins
- to undertake → entreprendre
- thorough → approfondi
- to overcome → surmonter
- mindset → l'état d'esprit (m)
- to highlight → mettre en évidence
- on the other hand → en revanche
- regardless → quel que soit / peu importe
- to assume → supposer

### C1 (replace the cognate-noun list with genuinely advanced, non-transparent items)
- cunning / shrewd → rusé / astucieux
- to dwell on → s'attarder sur
- blunt / outspoken → sans détour / franc
- stubborn → têtu / obstiné
- to thrive → prospérer / s'épanouir
- far-fetched → tiré par les cheveux
- to belittle → rabaisser
- restraint → la retenue
- groundbreaking → révolutionnaire / novateur
- to backfire → se retourner contre

### Underpopulated levels needing backfill
B1 (105), B2 (125 → only 60 unique), C1 (109) all need full re-authoring with French-frequency-graded, non-cognate, article-bearing nouns. A2 (341) could roughly double toward A1's scale.

---

## Summary of recommendations
1. **Re-author b1/b2/c1** for the French-target direction; they are currently the en/fr files.
2. **Dedupe**: remove ~82 within-file EXACT dups (mostly B2/B1) and ~23 cross-level PURE dups (keep lowest level); review the 21 A1↔A2 cosmetic dups.
3. **Standardise articles** on all French nouns across every level.
4. **Fix mis-glosses** (e.g., `près` ≠ "close") and resolve A1/A2 synonym ambiguity.
