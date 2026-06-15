# Audit: German-from-Russian dictionaries (`languages/de/ru/`)

Date: 2026-06-15. Scope: report-only. No dictionary JSON was modified.

Files audited (entry counts):

| File | Entries | Unique German targets |
|------|--------:|----------------------:|
| a1.json | 1438 | 1430 |
| a2.json | 2466 | 2330 |
| b1.json | 2787 | 2757 |
| b2.json | 365 | 365 |
| c1.json | 758 | 388 |

## 0. Orientation check (PASSED)

Directory convention `<to>/<from>` = `de/ru`, so `word_1` should be Russian (source) and `word_2` German (target being learned). Verified programmatically by counting Cyrillic characters per field:

- `word_1`: 100% Cyrillic in a1/a2/b2/c1; 2782/2787 in b1.
- `word_2`: 0% Cyrillic in every file.

Orientation is correct and consistent across all five files. The 5 non-Cyrillic `word_1` values in b1 are not swaps but Latin abbreviations/letters that have no Cyrillic form: `HP / das HP`, `SUV / das SUV`, `C / C`, `D / D`, `DVD / die DVD`. The bare `C` and `D` entries (`{"word_1":"C","word_2":"C"}`, `{"word_1":"D","word_2":"D"}`) are junk/placeholder rows worth removing, but not a swap.

CEFR level (file name) describes the difficulty of the German target word_2.

---

## 1. Duplicates

Method: Node script over the parsed JSON (not eyeballed). 

**Key choice for "same word":** the German target `word_2` is the primary key, because the level files exist to teach German words and the learner experiences duplication as "I have already seen this German card." Russian `word_1` is used as a secondary discriminator to separate true exact duplicates from legitimate second senses (same German word, different Russian gloss). For cross-level, the German target is normalized (leading article der/die/das stripped, parentheticals removed, lowercased) so that `der Tag` and `Tag` collapse.

### 1a. Within-file duplicates

Key = raw-lowercased `word_2`. Exact duplicate = same `word_1` AND same `word_2` repeated. Sense split = same `word_2` with ≥2 distinct `word_1` (likely real second meanings — noted, not condemned).

| File | Exact-duplicate removable entries | Distinct German keys with multiple Russian senses |
|------|----------------------------------:|--------------------------------------------------:|
| a1 | 1 | 7 |
| a2 | 114 | 22 |
| b1 | 26 | 4 |
| b2 | 0 | 0 |
| c1 | **360** | 10 |
| **Total** | **501** | 43 |

**c1 is severely affected.** It has 758 entries but only 388 unique German targets — roughly half are literal repetitions. Verified examples (identical `word_1` + `word_2`):
- `klar` (ясный) ×20
- `hell` (светлый) ×19
- `die Energie` (энергия) ×13
- `die Ästhetik` (эстетика) ×13
- `die Sprache` (язык) ×8
- `das Element` (элемент) ×7, `die Effizienz` (эффективность) ×7, `offensichtlich` (явный) ×7

a2 exact-dup examples: `abfahren`, `abgeben`, `ablesen`, `abschließen`, `anbieten`, `anfangen`, `ankommen` (each ×2). a1's only exact dup: `Sie` (она) ×2.

**Sense splits (keep — real second meanings), examples:**
- a1: `der Dank` [спасибо / благодарность], `der Gruß` [приветствие / привет], `der Hals` [шея / горло], `ihr/ihre` [ваш / её/их]
- a2: `abheben` [взлететь / снимать], `beraten` [советовать / консультировать], `bestehen` [существовать / сдавать], `einsteigen` [садиться / входить]
- b1: `fließend` [свободный / бегло], `der Schaden` [вред / ущерб], `der Schalter` [переключатель / выключатель], `der Service` [услуга / обслуживание]
- c1: `die Verwaltung` [администрация / управление], `die Beziehung` [взаимоотношение / отношение], `umfassend` [всесторонний / исчерпывающий], `die Schwierigkeit` [затруднение / трудность]

Recommendation: delete the 501 exact duplicates outright. For the 43 sense-split keys, keep both rows but consider merging the Russian glosses into one card (e.g. `der Hals` → "шея, горло") to avoid the learner seeing the same German word twice.

### 1b. Cross-level duplicates

Normalized German target as key. A word counts as cross-level if it appears in >1 file.

- **Total German targets appearing in more than one level: 1534**
  - **PURE duplicates (the levels share the same Russian sense): 1205** → **1646 removable higher-level entries** (keep the lowest level, remove from each higher one)
  - **Different-value (no shared Russian gloss — different sense per level, keep): 329**

**Level-combo distribution (all 1534 multi-level words):**

| Combo | Count |
|-------|------:|
| a1+a2+b1 | 500 |
| a2+b1 | 449 |
| a1+a2 | 238 |
| a1+b1 | 150 |
| b1+c1 | 65 |
| a2+b1+c1 | 27 |
| b1+b2 | 25 |
| a2+b2 | 20 |
| a1+a2+b1+c1 | 13 |
| a2+b1+b2 | 11 |
| a1+a2+c1 | 6 |
| a1+b2 | 6 |
| a2+c1 | 6 |
| a1+a2+b1+b2 | 4 |
| a1+b1+c1 | 4 |
| a1+b1+b2 | 4 |
| b1+b2+c1 | 2 |
| b2+c1 | 2 |
| a1+c1 | 1 |
| a1+b2+c1 | 1 |

The dominant pattern is leakage up the A1→A2→B1 chain (a1+a2+b1, a2+b1, a1+a2 together = 1187 words).

**PURE duplicate examples (recommend keep lowest, remove higher):** `anmelden` [a1,a2,b1], `duschen` [a1,a2,b1], `freuen` [a1,a2,b1], `treffen` [a1,a2,b1], `waschen` [a1,a2,b1], `vorstellen` [a1,a2,b1], `die Achtung` [a1,a2,b1], `die Adresse` [a1,a2,b1], `die Ampel` [a1,a2,b1], `das Angebot` [a1,b1], `die Anrede` [a1,b1], `die Anmeldung` [a1,a2,b1]. (15 of 1205 shown; total **1205** pure.)

**Different-value examples (keep — distinct sense per level):** `ausziehen` [раздеваться / снимать], `die Ahnung` [предчувствие / понятие], `die Aufgabe` [задание / задача], `die Ausbildung` [обучение / образование], `die Auskunft` [справка / информация], `der Bescheid` [уведомление / извещение], `die Bohne` [боб / фасоль], `das Fieber` [жар / лихорадка], `die Firma` [фирма / компания], `das Formular` [формуляр / бланк]. (15 of 329 shown; total **329**.)

**Removal recommendation:** for the 1205 pure cross-level duplicates, keep the entry in the lowest level where the German word fits and delete it from each higher file — ≈**1646 removable entries**. Combined with the 501 within-file exact duplicates, the total removable-entry estimate is **≈2147** (some overlap in c1, so treat as an upper-end estimate; conservatively ~2000+).

---

## 2. Level-fit assessment

**Methodology (stated honestly):** not exhaustive. I combined (a) my knowledge of the Goethe-Institut / DTZ A1–A2 and Goethe B1 word lists and general German frequency rankings, with (b) programmatic sampling — even-stride samples of ~25 words per file plus targeted lookups of high-frequency basic words to see which levels they sit in. Conclusions about individual words are high-confidence; the per-level "impression" is a sample-based judgment, not a full CEFR scoring of all 7800 entries.

### Per-level impression

- **a1** — Good fit overall. Content is genuinely beginner (numbers, body parts, rooms, basic verbs). Minor noise: proper nouns/meta (`Berlin`, `Aachen`, `Übung`, `Übungsbuch`) and `die Papiere` are textbook artifacts rather than core A1 vocabulary.
- **a2** — Mostly appropriate (separable verbs, everyday nouns). Some entries are anglicisms or oddly specific (`das Food`, `das Kleinmöbel`, `das Sportergebnis`). A handful are arguably A1 (already-known basics that also live in a1).
- **b1** — Reasonable spread. Contains some junk rows (`C`, `D`) and very compound/textbook-specific items (`die Detektivgeschichte`, `das Hendel`). Generally level-plausible.
- **b2** — The cleanest file: no duplicates, all entries carry articles, and content is genuinely upper-intermediate (workplace/bureaucratic German: `der Antrag`, `die Mittlere Reife`, `der Ablauf der Kündigungsfrist`, `die Kirchensteuer`, `der/die Schwerbehinderte`). Well-curated.
- **c1** — **Worst fit and worst quality.** Half the file is literal duplicates (388 unique of 758), and the unique set is heavily contaminated with sub-C1 words. `klar`, `hell`, `gut`, `die Sprache`, `die Energie`, `glauben`, `fühlen` are A1–A2 vocabulary, not C1. Genuine C1 items do exist (`die Abstraktion`, `empirisch`, `existentiell`, `die Zuständigkeit`, `skeptisch`), but they are diluted.

### Clearest misclassifications (word → current level → suggested level)

| German | Russian | Current | Suggested |
|--------|---------|---------|-----------|
| klar | ясный | c1 | a2 |
| gut | хороший | c1 | a1 |
| hell | светлый | c1 | a2 |
| die Sprache | язык | c1 | a1/a2 |
| glauben | верить | c1 | a2 |
| fühlen | чувствовать | c1 | a2 |
| die Energie | энергия | c1 | b1 |
| das Food | еда | a2 | remove (anglicism; use `das Essen`) |

(`gut`, `klar`, `Sprache`, `Energie` also already appear in the correct lower levels — see cross-level §1b — so the c1 copies are both misclassified and duplicated.)

### Data-quality flags

- **Nouns missing articles (a2):** at least 8 single-token capitalized nouns lack `der/die/das`. Confirmed: `Übelkeit` (→ die), `Überfall` (→ der), `Überraschung` (→ die), `Überschrift` (→ die), `Übersiedlung` (→ die), `Überwachungskamera` (→ die), `Überweisung` (→ die), `Überweisungsformular` (→ das). All begin with "Ü" — looks like an encoding/import edge case that skipped article assignment for umlaut-initial nouns. a1/b1/b2/c1 are otherwise clean on articles.
- **a1:** proper nouns and meta-entries mixed into vocabulary (`Berlin`, `Aachen`, `Übung`, `Übungsbuch`).
- **b1:** placeholder/junk rows `{"word_1":"C","word_2":"C"}` and `{"word_1":"D","word_2":"D"}` should be removed.
- **c1:** massive literal duplication (see §1a) — the single biggest data-quality issue in the pair.
- **a1 `Lieblings` / b1 `Lieblings`:** a bare prefix, not a standalone word — likely truncated (`Lieblings-...`).

---

## 3. Suggested additions (high-frequency German words missing at each level)

Based on Goethe/DTZ core lists and frequency; format Russian — German. These were spot-checked as absent (or only present at a wrong level) but should be confirmed before insertion.

### A1
- здравствуйте — guten Tag
- пожалуйста — bitte
- да / нет — ja / nein
- большой / маленький — groß / klein (groß/klein exist; ensure both `der Vater`/`die Mutter` family present)
- отец — der Vater
- мать — die Mutter
- ребёнок — das Kind
- сегодня / завтра / вчера — heute / morgen / gestern
- хлеб — das Brot
- молоко — die Milch

### A2
- здоровье — die Gesundheit
- окружающая среда — die Umwelt
- путешествие — die Reise
- опыт — die Erfahrung
- приглашать — einladen
- объяснять — erklären
- решать — entscheiden
- погода — das Wetter (verify presence)
- будущее — die Zukunft
- свободное время — die Freizeit

### B1
- развитие — die Entwicklung
- общество — die Gesellschaft
- мнение — die Meinung
- возможность — die Möglichkeit
- причина — der Grund
- влиять — beeinflussen
- сравнивать — vergleichen
- решение — die Lösung
- преимущество / недостаток — der Vorteil / der Nachteil
- опыт работы — die Berufserfahrung

### B2
- устойчивый / устойчивость — nachhaltig / die Nachhaltigkeit
- требование — die Anforderung
- ответственность — die Verantwortung
- последствие — die Folge
- предполагать — voraussetzen
- сложный — anspruchsvoll
- эффективность — die Effizienz
- срок — die Frist
- переговоры — die Verhandlung
- собеседование — das Vorstellungsgespräch

### C1
- предпосылка — die Voraussetzung
- последовательный — konsequent
- неоднозначный — ambivalent
- обоснование — die Begründung
- учитывать — berücksichtigen
- выдающийся — herausragend
- противоречие — der Widerspruch
- всеобъемлющий — umfassend (already present — verify)
- основополагающий — grundlegend
- неизбежный — unausweichlich

Counts of suggested additions: A1 ≈10, A2 ≈10, B1 ≈10, B2 ≈10, C1 ≈10.

---

## Summary of recommendations

1. Remove **501** within-file exact duplicates (360 in c1 alone).
2. Remove **≈1646** higher-level copies of the **1205** pure cross-level duplicates (keep lowest fitting level).
3. Fix **8** a2 nouns missing articles (all "Ü"-initial); remove junk rows (`C`, `D` in b1; proper nouns/`Übung` in a1; truncated `Lieblings`).
4. Reassign clearly misclassified words, concentrated in c1 (`klar`, `gut`, `hell`, `Sprache`, `glauben`, `fühlen` → A1/A2).
5. Add the ~50 high-frequency words above. b2 is the best-curated file and needs the least work; c1 needs the most.
