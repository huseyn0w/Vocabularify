# Vocabularify Audit — English-from-German (`languages/en/de/`)

Audit date: 2026-06-15. **REPORT-ONLY — no JSON files were modified.**

Pair convention: `<to>/<from>` = `en/de`, so the learner's native language is German and the
**target language being learned is English**. Each entry is `{word_1, word_2}`.

## 0. Data shape & orientation — VERIFIED

| Level | Entries |
|-------|--------:|
| a1    | 263 |
| a2    | 350 |
| b1    | 2748 |
| b2    | 722 |
| c1    | 876 |

Sampled all files. **Orientation is CORRECT:** `word_1` = German source, `word_2` = English target.
Examples: `{"word_1":"hallo","word_2":"hello"}`, `{"word_1":"aufgeben","word_2":"abandon"}`.
No swap detected. The CEFR level is judged against the difficulty of the **English** target (`word_2`).

## 1. COPIED-DATA FLAG — CONFIRMED for b1 / b2 / c1

The brief flagged that b1/b2/c1 sizes (2748/722/876) are suspiciously close to the de/en pair
(2770/722/876). Investigation result: **the en/de b1, b2, and c1 files are NOT independently
curated for the German-speaking English learner — they are column-swapped mirrors of the de/en
(English-speaker-learning-German) data.**

Evidence — overlap of the English-word set between `en/de` (`word_2`) and `de/en` (`word_1`):

| Level | en/de English words | de/en English words | Overlap | en/de-only |
|-------|--------------------:|--------------------:|--------:|-----------:|
| a1    | 261 | 1279 | 173 | 88  |
| a2    | 291 | 1936 | 114 | 177 |
| b1    | 2256 | 2288 | **2254** | 2 |
| b2    | 722 | 722 | **722 (100%)** | 0 |
| c1    | 876 | 876 | **876 (100%)** | 0 |

- **b2 and c1: 100% of English targets are identical** to the de/en deck — these are pure mirrors.
- **b1: 2254 of 2256** English targets are shared — effectively a mirror plus a handful of strays.
- a1/a2 are genuinely independent decks (low overlap, much smaller), curated for the en target.

**Consequence:** b1/b2/c1 were dimensioned and word-selected for *teaching German to English speakers*,
then reversed. That word list is **not** frequency-/difficulty-tuned for *teaching English to Germans*.
This is the root cause of the level-fit problems in section 2 (especially b1's flood of A1 words and
the b2↔c1 churn). **Recommendation: rebuild b1/b2/c1 from an English-target frequency/CEFR source
rather than mirroring the German deck.** (Files are byte-distinct from de/en — md5s differ — because
the columns are swapped; the *content* is the same vocabulary.)

## 2. DUPLICATES

Methodology: Node script over normalized strings (`trim().toLowerCase()`). Keyed cross-level analysis
on the **English target** (`word_2`). "PURE" = same English target **and** same single German source
across levels; "different-value" = same English target with differing German source(s).

### 2a. Within-file

| Level | Exact dup groups | Removable extras | Same Eng-target / different Ger-source groups |
|-------|-----------------:|-----------------:|----------------------------------------------:|
| a1 | 1 | 1 | 1 |
| a2 | 51 | 52 | 7 |
| b1 | 7 | 7 | 377 |
| b2 | 0 | 0 | 0 |
| c1 | 0 | 0 | 0 |
| **Total** | **59** | **60** | **385** |

- **a2 is badly affected**: 52 exact duplicate rows (entire entry repeated), e.g.
  `das abenteuer / adventure`, `der film / movie`, `das konzert / concert`, `die eintrittskarte / ticket`,
  `der sitzplatz / seat`, `die bühne / stage`. Plus same-target/different-source pairs like
  `"cloud" <- {die wolke, die cloud}`, `"screen" <- {die leinwand, der bildschirm}`.
- **b1**: 7 exact rows (`schaden/damage`, `paar/pair`, `original/original`, `heim/home`, `halt/stop`,
  `fließend/fluent`, `fett/fat`) and **377** same-English-target/different-German-source groups — e.g.
  `"agree" <- {zustimmen, vereinbaren, übereinstimmen, einverstanden}`,
  `"return" <- {zurücksenden, zurückkehren, die rückkehr, rücksendung, retoure}`. These are partly
  legitimate synonyms but inflate the deck and produce repeated English prompts for the learner.
- b2/c1: clean within-file (consistent with being freshly mirrored sets).

### 2b. Cross-level (keyed on English target)

| Metric | Count |
|--------|------:|
| PURE cross-level dup English targets (same target, same German source across levels) | **268** |
| → removable from higher levels (keep lowest valid level) | **277** |
| DIFFERENT-value cross-level (same target, different German source) | **350** |

**Level-combo distribution** (how the duplicated English targets straddle levels):

| Combo | Count |
|-------|------:|
| b2+c1 | 187 |
| a1+b1 | 139 |
| a2+b1 | 112 |
| b1+b2 | 94 |
| b1+c1 | 32 |
| b1+b2+c1 | 24 |
| a1+a2 | 7 |
| a1+a2+b1 | 7 |
| a2+b1+b2 | 7 |
| a2+b2 | 6 |
| a1+c1 | 1 |
| a1+b1+b2 | 1 |
| a2+b1+c1 | 1 |

- **b2+c1 = 187** overlapping English targets is large and confirms the mirror problem: the b2 and c1
  decks share a lot of vocabulary that should be split cleanly by difficulty.
- **a1+b1 = 139** and **a2+b1 = 112**: b1 re-lists hundreds of A1/A2-easy words.

**PURE examples** (recommend keeping the lowest level, removing from higher):
`hello [a1,b1] keep a1`, `please [a1,b1] keep a1`, `water [a1,b1] keep a1`, `school [a1,b1] keep a1`,
`today/yesterday [a1,b1] keep a1`, `old/young/new/good [a1,b1] keep a1`.

**DIFFERENT-value examples** (same English target, German source differs — usually only by article,
so de-facto duplicates): `house [a1,b1] {das haus, haus}`, `car [a1,b1] {das auto, der wagen, auto}`,
`bread [a1,b1] {das brot, brot}`, `friend [a1,b1] {der freund, freund}`,
`hospital [a1,b1] {das krankenhaus, krankenhaus}`, `money [a1,b1] {das geld, geld}`.
Note many of these collapse to true duplicates once the German article is normalized away.

### 2c. Totals

- Within-file exact removable rows: **60**
- Cross-level PURE removable-from-higher: **277**
- **Conservative removable estimate (within-exact + cross-pure-higher): ~337 entries.**
- If article-only "different-value" cross-dups are also collapsed, removable count climbs into the
  500–600 range (most of the 350 different-value cases are article variants of the same word).

## 3. LEVEL-FIT

Methodology (stated honestly): not a calibrated CEFR classifier. I sampled 40 English targets per
level (seeded random) plus full-file membership tests against a hand-built list of A1-basic words and
of multi-word/tech entries. Judgments below are a knowledgeable-reviewer impression, not an
authoritative CEFR mapping.

### Per-level impression

- **a1 (263) — GOOD.** Sample is genuinely A1: `cat, milk, child, woman, train, young, happy, fish,
  man, white, fork, tea, new, phone, mirror, goodbye`. A few slightly specific nouns (`detergent`,
  `bandage`, `herb`) lean A2 but are defensible survival vocabulary. Only 5 multi-word entries. Fine.
- **a2 (350) — MOSTLY OK but TECH/MEDIA-SKEWED + duplicate-heavy.** ~28 entries are streaming/UI/office
  jargon that is advanced or domain-specific for A2: `login, logout, server, website, spreadsheet,
  application, system, signal, connection, mode, file, chat, album, speaker, fast forward,
  white balance, hue, clarity, sharp, editorial, science fiction`. Several of these (`hue`, `clarity`,
  `editorial`, `white balance`) are arguably B1–B2 and out of place. Combined with the 52 exact dups,
  a2 needs cleanup.
- **b1 (2748) — OVERSIZED and POLLUTED with A1 words.** This deck is ~4–8× the size of a real B1
  vocabulary tier and contains 27+ purely A1-basic English words: `hello, yes, no, good, bad, big,
  book, bread, car, come, day, drink, eat, food, friend, home, house, milk, money, new, old, school,
  stop, tea, time, water, work, young`. The genuinely B1-appropriate core (e.g. `responsible, referee,
  reception, specialist, criminal, transport, marital status, literature`) is buried. The size and
  pollution both stem from the mirror problem (section 1).
- **b2 (722) — GOOD fit, clean.** Sample is convincingly B2: `sanction, invasion, provision, principle,
  convey, superficial, counterpart, obsolete, sensitivity, bias, magnitude, philosophy, acknowledge,
  reputation, infrastructure, compensation, corruption, deliberate, protocol`. No too-easy words found.
- **c1 (876) — GOOD fit, clean.** Strongly C1: `connoisseur, redundant, palatable, pseudonym, innate,
  tantamount, transient, perennial, conspicuous, usurp, clandestine, staid, onerous, perfunctory,
  tacit, vanquish, affluent`. No too-easy words. (`deliberate` and `realize` are borderline B2 but fine.)

### Clearest misclassifications

| English word | Current level | Suggested |
|--------------|---------------|-----------|
| hello, yes, no, water, day, school, food, friend, house, car | b1 | a1 |
| good, bad, big, old, young, new, eat, drink, come | b1 | a1 |
| money, work, time, home, book, milk, bread, tea | b1 | a1 |
| stop | b1 | a1/a2 |
| hue, clarity, editorial | a2 | b2 |
| white balance | a2 | b1/b2 (domain term) |
| science fiction | a2 | b1 |

**Severity: MEDIUM–HIGH**, driven almost entirely by b1 (hundreds of A1/A2 words mislevelled into B1)
and secondarily by a2's tech skew + duplication. b2 and c1 are well-levelled in isolation.

### Data-quality issues flagged

1. b1/b2/c1 are reversed copies of the de/en deck, not English-target-curated (section 1).
2. a2 has 52 exact duplicate rows.
3. Hundreds of cross-level duplicates, many article-only German variants of the same English word.
4. German source inconsistency: some entries carry the article (`das haus`), others don't (`haus`) for
   the same noun — should be normalized.
5. b1 is far larger than a coherent single CEFR tier should be.

## 4. ADDITIONS (knowledge-based; WebSearch not required)

High-frequency English words that appear to be missing at each level (German / English).
(a1/a2 checked against their own lists; b1/b2/c1 suggestions account for the mirror skew.)

### a1 — everyday survival words missing
- viel / much, many
- wenig / little, few
- hier / here
- dort / there
- warum / why
- wer / who
- offen / open
- geschlossen / closed
- links / left
- rechts / right
- müde / tired
- krank / sick
- die Familie / family
- die Mutter / mother
- der Vater / father

### a2 — common everyday B-prep words missing
- entscheiden / decide
- vergleichen / compare
- erklären / explain
- empfehlen / recommend
- vermeiden / avoid
- die Erfahrung / experience
- die Umgebung / environment, surroundings
- die Gesundheit / health
- der Termin / appointment
- die Versicherung / insurance
- die Rechnung / bill, invoice
- der Vertrag / contract
- pünktlich / on time, punctual
- billig / cheap
- teuer / expensive

### b1 — useful B1 abstractions missing (after removing the A1 pollution)
- die Möglichkeit / opportunity, possibility
- die Verantwortung / responsibility
- die Entscheidung / decision
- die Erfahrung / experience
- der Vorteil / advantage
- der Nachteil / disadvantage
- behaupten / claim
- zugeben / admit
- sich verhalten / behave
- die Gewohnheit / habit

### b2 — common B2 academic/discourse words missing
- die Annahme / assumption
- die Folge / consequence
- nachhaltig / sustainable
- die Voraussetzung / prerequisite
- der Ansatz / approach
- die Auswirkung / impact
- berücksichtigen / take into account
- die Wahrnehmung / perception
- der Aufwand / effort, expenditure
- maßgeblich / decisive, significant

### c1 — high-register C1 words missing
- die Nuance / nuance
- die Zweideutigkeit / ambiguity
- voreingenommen / biased
- die Verschärfung / aggravation
- die Annäherung / convergence, rapprochement
- unerschütterlich / unwavering
- die Schirmherrschaft / patronage
- der Vorbehalt / reservation, caveat
- die Tragweite / scope, ramification
- beschwichtigen / appease, placate

---
*Generated by audit. No dictionary JSON was modified.*
