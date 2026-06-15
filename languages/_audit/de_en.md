# Vocabularify Audit — German from English (`languages/de/en/`)

**Date:** 2026-06-15
**Scope:** `a1.json` (1437), `a2.json` (2167), `b1.json` (2770), `b2.json` (722), `c1.json` (876) — 7972 entries total.
**Data shape:** `{ "word_1": English (source), "word_2": German (target being learned) }`. The CEFR level describes the difficulty of the German word (`word_2`).
**This is a report-only audit. No JSON dictionary file was modified.**

Duplicate detection was done with a Node script (not by eye) over normalized keys (trim + lowercase). Level-fit was assessed by curated CEFR/high-frequency wordlists plus random sampling and judgment (full hand-verification of ~8000 words is not feasible).

---

## 1. Duplicates

### 1.1 Within-file duplicates

There are **no EXACT within-file duplicates** in any file (no `word_1` + `word_2` pair repeats inside a single file). Good.

However, there are many entries with the **same `word_1` but a DIFFERENT `word_2`** inside one file. These are mostly legitimate (second senses / synonyms / homonyms), so they are flagged, not condemned. Counts of such groups:

| File | same-`word_1` / different-`word_2` groups |
|------|--------------------------------------------|
| a1 | 129 |
| a2 | 201 |
| b1 | 374 |
| b2 | 0 |
| c1 | 0 |

Most of these are fine (e.g. `table` → `der Tisch` / `die Tabelle`, `person` → `die Person` / `der Mensch`). But a sizeable subset are **near-duplicate noise** that should be consolidated, because the two German values are trivial variants of each other rather than distinct senses:

- Article-only / casing variants: `toilet` → `Toilette` / `die Toilette` / `WC`; `lesson` → `der Unterricht` / `Unterricht`; `west` → `der Westen` / `Westen`; `vacation` → `Urlaub` / `der Urlaub` (a1).
- Gendered-pair duplication: `partner` → `die Partnerin` / `der Partner` / `der Partner/die Partnerin`; `salesperson` → `Verkäufer/in` / `der Verkäufer`; `Translator` → `der Übersetzer` / `die Übersetzerin`; `Citizen` → `der Bürger` / `der/die Bürger/in` (a1/b1).
- Abbreviation variants: `about` → `circa` / `circa/ca.` / `über` (a1).

**Recommendation:** keep one canonical form per sense; merge the casing/article/abbreviation variants. Genuine second senses (Tisch vs Tabelle) should stay.

### 1.2 Cross-level duplicates (same `word_1` in more than one level file)

**1512 English words appear in more than one level file.** Split by whether the German translation is identical:

- **928 are "pure" cross-level duplicates** — the German word (`word_2`) is *identical* across every level it appears in. These are true duplicates: the same German word is being taught at 2–4 different levels.
  - **264 of these appear in 3+ levels.**
  - Removing them down to a single level would delete **~1193 redundant entries**.
- **584 cross-level words have a *different* German value per level** — these are partly legitimate (different sense per level) and partly noise (article/synonym variants like `orange` → `orange`/`die Orange`, `great` → `klasse`/`super`/`toll`). Review case-by-case; do not bulk-delete.

Distribution of the level combinations (most significant):

| Combo | Count |
|-------|------:|
| a2 + b1 | 451 |
| a1 + a2 + b1 | 395 |
| b2 + c1 | 183 |
| a1 + a2 | 154 |
| a1 + b1 | 134 |
| b1 + b2 | 77 |
| b1 + c1 | 26 |
| b1 + b2 + c1 | 22 |
| a2 + b1 + b2 | 20 |
| a2 + b2 | 17 |
| (other combos) | ~13 |

**Structural finding:** the overlap is heaviest in the lower levels. **1364 of B1's 2770 entries (49%) reuse an English word already present in A1 or A2**, and many carry the identical German word. B1 is effectively half-filled with A1/A2 vocabulary. Similarly, **211 of C1's 876 entries reuse a B2 word.**

**Recommended rule for pure cross-dups:** keep the word in the **lowest** level where the German word is appropriate, and remove it from all higher files. Representative examples (German shown, action recommended):

| English | German | Keep | Remove from |
|---------|--------|------|-------------|
| pharmacy | die Apotheke | a1 | a2, b1 |
| hand | die Hand | a1 | a2, b1 |
| milk | die Milch | a1 | a2, b1 |
| chocolate | die Schokolade | a1 | a2, b1 |
| dress | das Kleid | a1 | a2, b1 |
| early | früh | a1 | a2, b1 |
| unemployed | arbeitslos | a1 | a2, b1 |
| celebrate | feiern | a2 | b1, c1 |
| contract | der Vertrag | a2 | b1, c1 |
| reject | ablehnen | a2 | b1, b2 |
| sufficient | ausreichend | a2 | b1, b2, c1 |
| concentrate | konzentrieren | a2 | b1, b2 |
| promote | fördern | b1 | b2, c1 |
| predict | vorhersagen | b1 | b2, c1 |
| collaborate | zusammenarbeiten | b1 | b2, c1 |

(264 pure cross-dups span 3+ levels; the table is capped — full list is reproducible from the cross-level pass.)

### 1.3 Duplicate totals (headline)

- Within-file EXACT duplicates: **0**.
- Within-file same-`word_1`/different-`word_2` groups: **704** (129+201+374), mostly legitimate but with mergeable variant noise.
- Cross-level words in >1 file: **1512**; of these **928 are pure duplicates** (identical German), implying **~1193 removable redundant entries**.

---

## 2. Level-fit

### Methodology
- Curated high-frequency / core-CEFR lemma sets (A1/A2 core nouns, verbs, adjectives) checked against the higher-level files to catch trivial words sitting too high.
- Curated advanced-register lemma sets (B2/C1 connectors, nominalizations, formal verbs) checked against A1/A2 to catch hard words sitting too low.
- Random sampling (25 entries/level) for a qualitative read.
- Caveat: this is sampling + heuristics, not exhaustive verification.

### Clearest misclassifications

**Trivial words sitting too high (most egregious; these belong in A1/A2):**

In **B1** there are at least **61 core A1/A2 lemmas** (of which 58 are also already in A1/A2 — i.e. cross-level dups, see §1.2 — and 3 are unique to B1):

| German | English | Current | Suggested |
|--------|---------|---------|-----------|
| die Hand | hand | b1 | a1 |
| der Kopf | head | b1 | a1 |
| die Nase | nose | b1 | a1 |
| das Bein | leg | b1 | a1 |
| die Mutter | mother | b1 | a1 |
| der Bruder | brother | b1 | a1 |
| die Schule | school | b1 | a1 |
| essen | eat | b1 | a1 |
| schreiben | write | b1 | a1 |
| das Haus | house | b1 | a1 |
| gut / schlecht | good / bad | b1 | a1 |
| heute / gestern | today / yesterday | b1 | a1 |
| die Milch | milk | b1 | a1 |
| der Kaffee / der Tee | coffee / tea | b1 | a1/a2 |
| das Herz | heart | b1 | a2 |
| richtig | correct | b1 | a2 |
| wenig | few/little | b1 | a2 |

In **C1**, a handful of clearly sub-C1 words:

| German | English | Current | Suggested |
|--------|---------|---------|-----------|
| falsch | false/spurious | c1 | a2 |
| stehlen | to steal | c1 | b1 |
| fleißig | diligent | c1 | a2/b1 |
| ewig | eternal | c1 | b1 |
| intensiv | intense | c1 | b1 |
| toxisch | toxic | c1 | b2 |
| knapp | scarce/scant | c1 | b1/b2 |
| reichlich | plentiful | c1 | b2 |
| machbar | feasible | c1 | b2 |

**Hard words sitting too low (A1):** A1 is themed on the official Goethe/telc/integration A1 syllabus, so most "long" entries (e.g. `der Anrufbeantworter`, `die Gesundheitskarte`, `der Informationsschalter`) are defensible because they are taught explicitly at A1 in that syllabus. A few are genuinely above A1 level and should move up:

| German | English | Current | Suggested |
|--------|---------|---------|-----------|
| verwitwet | widowed | a1 | a2/b1 |
| die Krankmeldung | sick note | a1 | a2 |
| die Sprechstundenhilfe | receptionist | a1 | a2/b1 |
| hageln | to hail (weather) | a1 | b1 |
| der Verein | association | a1 | a2 |
| die Notfallsprechstunde | emergency appointment | a1 | a2 |
| die Praxisgemeinschaft | group practice | a1 | b1 |
| der Schienenersatzverkehr | rail replacement service | a1 | b1 |

### Overall impression per level

- **A1** — Reasonable fit. Closely tracks the official A1 integration-course syllabus (everyday, bureaucratic, family, time, health themes). A small number of items are too advanced (table above). Main issue is that ~290 of its words are duplicated up into A2/B1.
- **A2** — Reasonable fit and the right register overall. Heavy overlap with B1 (451 shared English words) is the dominant problem, not the difficulty.
- **B1** — **The weakest file for level-fit.** Roughly half its entries (1364/2770) reuse A1/A2 words, and dozens are outright A1 core vocabulary (`Hand`, `Kopf`, `Mutter`, `essen`, `Haus`). B1 should be substantially pruned of A1/A2 carry-over so it actually represents B1-distinct vocabulary.
- **B2** — Difficulty fits well (`überwältigend`, `Hypothese`, `Entschädigung`, `Behörde`, `offenlegen`). **Data-quality issue:** 411 of 722 noun entries are missing their definite article (`Medikament`, `Behörde`, `Hypothese` instead of `das Medikament`, `die Behörde`, `die Hypothese`) — inconsistent with the other files and should be normalized.
- **C1** — Mostly good and genuinely advanced (`maßgeblich`, `Umbruch`, `Ungleichheit`, `lobenswert`, `parsimonious`→`geizig`). A small set of sub-C1 words (table above) should drop a level, and 211 entries duplicate B2.

---

## 3. Suggested additions (high-frequency gaps per level)

High-frequency German words that are useful at each level and appear to be missing or only present as a higher-level duplicate. English + German given.

### A1 (essentials)
- yes — `ja`
- no — `nein`
- and — `und`
- but — `aber`
- with — `mit`
- without — `ohne`
- to want — `wollen` / `möchten`
- to have — `haben`
- to be — `sein`
- to be able to (can) — `können`
- to drink — `trinken`
- water — `das Wasser`
- bread — `das Brot`
- thank you — `danke`
- please / you're welcome — `bitte`
- today / tomorrow — `heute` / `morgen` (ensure single canonical A1 home)
- where — `wo`
- when — `wann`
- how much — `wie viel`

### A2
- to allow / may — `dürfen`
- to have to / must — `müssen`
- to know (a fact) — `wissen`
- to know (be acquainted) — `kennen`
- because — `weil`
- although — `obwohl`
- therefore — `deshalb` / `deswegen`
- to recommend — `empfehlen`
- to invite — `einladen`
- experience — `die Erfahrung`
- environment — `die Umwelt`
- health — `die Gesundheit`
- to decide — `entscheiden`
- to suggest — `vorschlagen`
- relationship — `die Beziehung`

### B1
- to develop — `entwickeln`
- development — `die Entwicklung`
- society — `die Gesellschaft`
- to influence — `beeinflussen`
- experience (lived) — `das Erlebnis`
- to express — `ausdrücken`
- opinion / view — `die Ansicht`
- to convince — `überzeugen`
- responsibility — `die Verantwortung`
- to demand / require — `verlangen`
- nevertheless — `trotzdem`
- in addition — `außerdem`
- to assume — `annehmen`
- circumstance — `der Umstand`
- to behave — `sich verhalten`

### B2
- sustainable / sustainability — `nachhaltig` / `die Nachhaltigkeit`
- however — `jedoch` / `hingegen`
- consequently — `folglich`
- to enable — `ermöglichen`
- to ensure / guarantee — `gewährleisten`
- significant — `erheblich` / `bedeutend`
- to affect / impair — `beeinträchtigen`
- assumption / premise — `die Annahme`
- to question — `infrage stellen`
- prerequisite — `die Voraussetzung`
- distribution — `die Verteilung`
- to overcome — `überwinden`
- approach — `der Ansatz`
- consequence — `die Folge` / `die Auswirkung`

### C1
- nevertheless / yet — `gleichwohl`
- respectively / or — `beziehungsweise`
- indispensable — `unabdingbar`
- inevitable / necessarily — `zwangsläufig`
- ambivalent — `ambivalent`
- controversial — `kontrovers` / `umstritten`
- to reflect / mirror — `widerspiegeln`
- to neglect — `vernachlässigen`
- presumed / supposedly — `vermeintlich`
- coherent — `kohärent` / `schlüssig`
- to differentiate — `differenzieren`
- gradually / successively — `sukzessive` / `allmählich`
- discrepancy — `die Diskrepanz`
- in view of — `angesichts`
- with regard to — `hinsichtlich`

---

## 4. Priority recommendations

1. **De-duplicate cross-level first** — remove the ~928 pure cross-level duplicates (keep lowest valid level), eliminating ~1193 redundant entries. Biggest single quality win.
2. **Prune B1** of A1/A2 core vocabulary (Hand, Kopf, Mutter, essen, etc.) — it is the weakest file for level-fit.
3. **Normalize B2 noun articles** (411 entries missing `der/die/das`).
4. **Move the misclassified words** listed in §2 to their correct levels (notably `falsch`, `stehlen`, `fleißig` out of C1; `verwitwet`, `hageln` out of A1).
5. **Consolidate within-file variant noise** (article/casing/abbreviation variants of the same German word).
6. **Backfill the high-frequency gaps** in §3, especially A1 function words and B2/C1 connectors.
