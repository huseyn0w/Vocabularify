# Audit: English-from-Russian dictionaries (`languages/en/ru/`)

Date: 2026-06-15
Pair: `to=en`, `from=ru` → `word_1` = Russian (source), `word_2` = English (target being learned).
CEFR level = difficulty of the **English** target word.

Files audited: `a1.json` (236), `a2.json` (250), `b1.json` (138), `b2.json` (162), `c1.json` (145). Total 931 entries.

**REPORT ONLY — no JSON file was modified.**

---

## 0. Data-shape / orientation check

Verified programmatically (Cyrillic vs Latin detection on each field):

| Level | Entries | word_1 Cyrillic | word_2 Latin | Swapped rows |
|-------|--------:|----------------:|-------------:|-------------:|
| a1 | 236 | 236 | 236 | 0 |
| a2 | 250 | 250 | 250 | 0 |
| b1 | 138 | 138 | 138 | 0 |
| b2 | 162 | 162 | 162 | 0 |
| c1 | 145 | 145 | 145 | 0 |

**Orientation is correct.** Every `word_1` is Russian, every `word_2` is English. No swapped rows. The `<to>/<from>` convention is honored.

---

## 1. Duplicates

Method: Node script. English target (`word_2`, normalized lowercase/trim) is the dedup key, since the level is defined by the English word.

### 1a. Within-file duplicates

| Level | Dup groups | Removable rows (exact) |
|-------|-----------:|-----------------------:|
| a1 | 22 | 25 |
| a2 | 3 | 3 |
| b1 | 3 | 3 |
| b2 | 20 | 20 |
| c1 | 8 | 8 |
| **Total** | **56** | **59** |

**EXACT duplicates** (identical `word_1` AND `word_2` inside the same file) — these are pure noise and should be collapsed to one row:

- **a1** is the worst offender. `корабль = ship` and `книга = book` and `игра = game` each appear **3×**; another 19 pairs appear 2× (`велосипед = bicycle`, `улица = street`, `парк = park`, `река = river`, `море = sea`, `озеро = lake`, `гора = mountain`, `лес = forest`, `сад = garden`, `спорт = sport`, `музыка = music`, `кино = cinema`, `фильм = film`, `театр = theater`, `газета = newspaper`, `журнал = magazine`, `радио = radio`, `компьютер = computer`, `лодка = boat`). The file has a clearly duplicated block — the second half of a1 (the travel/nature/boats section) re-introduces words already present in the first half.
- **b2**: 20 exact pairs (`оценка = assessment`, `обязательство = commitment`, `соответствие = compliance`, `эффективность = efficacy`, `исключение = exclusion`, `функциональность = functionality`, `гипотеза = hypothesis`, `анализ = analysis`, `методология = methodology`, `консультация = consultation`, `рекомендация = recommendation`, `обоснование = justification`, `передача = transmission`, `имплементация = implementation`, `реализация = realization`, `стандартизация = standardization`, `оптимизация = optimization`, `чувствительность = sensitivity`, `устойчивость = resilience`, `способность = ability`). Same pattern: b2 contains a near-verbatim repeated abstract-noun block.
- **a2**: `программа = program`, `технология = technology`, `наука = science`.
- **b1**: `вдохновение = inspiration`, `эффективность = efficiency`, `искусство = art`.
- **c1**: `эфемерность = ephemerality`, `идентичность = identity`, `интуиция = intuition`, `лингвистика = linguistics`, `метафора = metaphor`, `мораль = morality`, `диссонанс = dissonance`, `корреляция = correlation`.

**SAME ENGLISH / DIFFERENT RUSSIAN within a file** (two rows teach the same English word with different Russian glosses — these are not exact dups; one should be chosen, or merged, but they will both surface as the "same card"):

- a1: `television` ← телевидение / телевизор
- a2: `report` ← доклад / отчет; `bill` ← афиша / счет; `editor` ← редактор / монтажер
- b1: `creativity` ← творчество / креативность
- b2: `awareness` ← осознание / информированность; `report` ← репортаж / доклад
- c1: `correlation` ← соотношение / корреляция

### 1b. Cross-level duplicates (English key)

- **PURE cross-level duplicates** (same English word, identical Russian gloss, appearing in 2+ levels): **102 English words.**
- **DIFFERENT-value cross-level** (same English word, different Russian gloss across levels): **14 words.**

Combos (how the pure+diff overlaps distribute):

| Levels | Count |
|--------|------:|
| b1+b2 | 43 |
| a2+b1 | 24 |
| a1+a2 | 20 |
| b2+c1 | 11 |
| a2+b1+b2 | 5 |
| b1+b2+c1 | 5 |
| a1+a2+b1 | 2 |
| a2+b2 | 2 |
| b1+c1 | 2 |
| a1+b1 | 1 |
| a1+b1+b2 | 1 |

**Recommendation for PURE dups: keep the lowest valid level, remove the higher-level copies.** Removable estimate from pure cross-level dups: **~102 rows.**

Pure examples (→ keep level):
- `school` (школа) a1,a2 → keep a1
- `water` (вода) a1,a2 → keep a1
- `book` (книга) a1,a2 → keep a1
- `museum` (музей) a1,a2,b1 → keep a1
- `gallery` (галерея) a1,a2,b1 → keep a1
- `church` (церковь) a1,a2 → keep a1
- `music` (музыка) a1,b1 → keep a1
- `service` (услуга) a2,b2 → keep a2
- `notification` (уведомление) a2,b2 → keep a2

The **b1+b2 overlap (43 words)** is the single biggest structural problem: b1 and b2 share a large abstract-noun core (`analysis`, `methodology`, `statistics`, `evaluation`, `review`, `resilience`, `sensitivity`, `flexibility`, `adaptation`, `ability`, `potential`, `optimism`, `pessimism`, `motivation`, `imagination`, `intuition`, `intellect`, `wisdom`, `insight`, `understanding`, `creativity`, `craftsmanship`, `originality`, `architecture`, `orchestra`, `instrument`, `drum`, `flute`, `novelist`, `camera`, `lens`, `snapshot`, `report`, `video clip`, `cinema`, etc.). These two levels are barely differentiated.

**DIFFERENT-value cross-level cases needing manual reconciliation** (the Russian gloss disagrees between levels — pick the correct one before deduping):
- `cinema`: a1 кино / b1 кинотеатр / b2 кинотеатр (кино vs кинотеатр)
- `report`: a2 доклад/отчет, b1 репортаж, b2 репортаж/доклад
- `investment`: a2 инвестиции / b1 инвестиция
- `education`: a2 учеба / b1 образованность (these are genuinely different meanings)
- `advertisement`: a2 объявление / b1 реклама
- `editor`: a2 редактор/монтажер / b1 редактор
- `awareness`: b1 информированность / b2 осознание+информированность
- `perception`: b1 восприятие / c1 перцепция
- `sensation`: b1 ощущение / b2 ощущение / c1 сенсация (ощущение vs сенсация = different words)
- `realization`: b1 осознание / b2 реализация (different meanings)
- `creativity`: b1 творчество/креативность / b2 творчество
- `workshop`: b1 мастерская / b2 практикум
- `coordination`: b2 согласование / c1 координация
- `disposition`: b2 распоряжение / c1 диспозиция

### 1c. Duplicate totals

- Within-file exact removable: **59 rows.**
- Cross-level pure removable (keep lowest): **~102 rows.**
- Combined removable estimate: **~150–160 rows** (some within-file dups overlap with cross-level counts; the true unique removable is on the order of 150). That is roughly **16% of the 931-row corpus.**

---

## 2. Level-fit (English target vs CEFR)

### Methodology (honest)

I judged each English target against general CEFR/English-frequency intuition (CEFR-J / Oxford 3000-5000 / Cambridge English Vocabulary Profile as mental reference), not a formal lookup table. CEFR vocabulary banding is inherently fuzzy and I do not have a programmatic frequency list loaded here, so the calls below are **expert-estimate, not authoritative**. I focus on clear, defensible misclassifications (off by a full band or more) rather than borderline single-band quibbles. Note: many entries are Latinate cognates that are trivial for a Russian speaker (e.g. `corporation`, `technology`) but are still rated by their English difficulty as the task specifies.

### Per-level impression

- **A1 — mostly correct, but bloated and slightly over-reaching at the tail.** The core (pronouns, prepositions, numbers, food, house, transport) is textbook A1. Problems: the travel/boats tail pushes A1 vocabulary that is really A2+: `submarine`, `lighthouse`, `harbor`, `pier`, `cathedral`, `boulevard`, `monument`, `fishing rod`, `motorboat`, `rowboat`, `steamer`, `motor ship`, `sailing boat`, `yacht`, `current` (sea current), `blazer`. `darkness` and `current` are abstract for A1. Overall A1 is too long (236) and the back half is the source of most duplicates.
- **A2 — generally fine but leaks into B1/B2 on the business/abstract end.** Solid A2: office, plan, email, internet, weather, jeans, coffee, discount. Too hard for A2: `liabilities`, `assets`, `capital`, `corporation`, `enterprise`, `negotiation`, `proofreader`, `sculptor`, `composer`, `documentary`, `cameraman`, `sound engineer`, `eyeshadow`, `foundation` (makeup), `conditioner`. `liabilities`/`assets`/`capital` are B2–C1 finance terms sitting in A2.
- **B1 — the abstract-noun load is too heavy; many items are B2/C1.** True B1 are scarce here; the file is dominated by `-tion`/`-ity` Latinate abstractions that are B2+: `entrepreneurship`, `sustainability`, `profitability`, `legislation`, `standardization`, `rationalization`, `simplification`, `methodology`, `expressiveness`, `resilience`, `optimization`, `modification`, `transformation`, `forecasting`, `craftsmanship`, `originality`. B1 should be everyday-but-broader vocabulary; instead it reads like a B2 academic list.
- **B2 — internally consistent in register but overlaps massively with B1, and a chunk is C1.** Genuinely C1-level items mis-filed in B2: `attestation`, `accreditation`, `attribution`, `susceptibility`, `redundancy`, `efficacy`, `ramification`, `disposition`, `congruence`-style abstractions. Plus the 20 exact within-file dups and 43-word B1 overlap noted above. B2's distinctiveness from B1 is weak.
- **C1 — broadly appropriate, occasionally too obscure even for C1, and contaminated by non-English coinages.** Good C1: `pragmatism`, `epistemology`, `dialectic`, `phenomenology`, `eclecticism`, `existentialism`, `hegemony`-class words. But several are **transliterations of Russian academic jargon rather than standard English words**: `binarity`, `cyclicity`, `coercivity`, `cumulativity`, `fractality`, `exponentiality`, `endemism`, `scientificity`, `corpuscle` (physics-only), `convection` (physics-only), `atavism`, `archaism`. These are either non-words or so domain-specific they fail as vocabulary cards. This is a **data-quality flag**, not merely a level-fit issue.

### Clearest misclassifications (high confidence)

| Word | Current level | Should be ~ |
|------|--------------|-------------|
| liabilities | a2 | b2/c1 |
| assets | a2 | b2 |
| capital (finance) | a2 | b2 |
| submarine | a1 | a2/b1 |
| cathedral | a1 | a2 |
| boulevard | a1 | b1 |
| lighthouse | a1 | b1 |
| entrepreneurship | b1 | b2/c1 |
| sustainability | b1 | b2 |
| methodology | b1 | b2/c1 |
| standardization | b1 | b2 |
| craftsmanship | b1 | b2 |
| efficacy | b2 | c1 |
| ramification | b2 | c1 |
| susceptibility | b2 | c1 |

### Data-quality flags

1. **Non-standard / coined English in C1** (`binarity`, `cyclicity`, `coercivity`, `cumulativity`, `fractality`, `exponentiality`, `scientificity`, `endemism`) — likely machine-transliterated from Russian; these are not teachable English vocabulary and should be replaced.
2. **Heavy within-file exact duplication in a1 and b2** (see §1a) — points to a copy-paste / generation-block error.
3. **Same-English-different-Russian rows** (`cinema` кино vs кинотеатр, `sensation` ощущение vs сенсация, `realization` осознание vs реализация) — gloss disagreements that will confuse learners and break dedup.
4. **B1/B2 are not meaningfully distinct** — 43 shared words; the abstract register is identical.
5. **A1 over-length (236) with a difficulty cliff in its second half** — the tail belongs in A2/B1.

---

## 3. Additions (high-frequency English words missing)

Coverage note: the corpus over-indexes on **concrete nouns (A1/A2)** and **abstract Latinate nouns (B1–C1)**, and is critically **short on verbs, adjectives, and adverbs at every level**. There are almost no common verbs anywhere. This is the biggest gap. b1 (138), b2 (162), c1 (145) are also numerically underpopulated relative to a1/a2 — they need backfill, but with the *right* parts of speech rather than more abstract nouns.

### A1 — missing high-frequency basics (esp. verbs, adjectives, question words)
- to be — быть; to have — иметь; to go — идти/ходить; to want — хотеть; to do/make — делать; to say — говорить/сказать; to know — знать; to see — видеть; to eat — есть; to drink — пить; to give — давать; to come — приходить; to read — читать; to write — писать; to live — жить
- good — хороший; bad — плохой; big — большой; small — маленький; new — новый; old — старый; happy — счастливый; here — здесь; there — там; now — сейчас; today — сегодня; tomorrow — завтра; yesterday — вчера
- who — кто; what — что; where — где; when — когда; why — почему; how — как; how much/many — сколько
- mother — мама; father — папа; child — ребёнок; man — мужчина; woman — женщина; name — имя; money — деньги; week — неделя; month — месяц; year — год

### A2 — missing common verbs/adjectives and everyday concepts
- to think — думать; to feel — чувствовать; to need — нуждаться; to begin — начинать; to finish — заканчивать; to help — помогать; to ask — спрашивать; to answer — отвечать; to use — использовать; to find — находить; to learn — учить; to understand — понимать; to remember — помнить; to forget — забывать; to buy — покупать; to sell — продавать
- important — важный; difficult — трудный; easy — лёгкий; expensive — дорогой; cheap — дешёвый; beautiful — красивый; possible — возможный; ready — готовый; free — свободный; busy — занятый
- weather — погода (present, ok); season — время года; health — здоровье (currently English-only noun present); job — работа; problem — проблема; question — вопрос; answer — ответ; reason — причина

### B1 — needs everyday/intermediate words, not more abstract nouns
- to manage — управлять; to suggest — предлагать; to decide — решать; to improve — улучшать; to develop — развивать; to provide — предоставлять; to require — требовать; to allow — разрешать; to avoid — избегать; to achieve — достигать; to compare — сравнивать; to describe — описывать; to explain — объяснять
- reliable — надёжный; available — доступный; responsible — ответственный; confident — уверенный; serious — серьёзный; common — общий/распространённый; similar — похожий; particular — особый
- environment — окружающая среда; relationship — отношения; opportunity — возможность; advantage — преимущество; disadvantage — недостаток; experience — опыт; behavior — поведение (present); skill — навык; goal — цель; deadline — срок

### B2 — needs abstract verbs/adjectives and discourse vocabulary (corpus is all nouns)
- to assess — оценивать; to implement — внедрять; to acknowledge — признавать; to emphasize — подчёркивать; to enhance — усиливать; to determine — определять; to estimate — оценивать; to indicate — указывать; to maintain — поддерживать; to demonstrate — демонстрировать
- significant — значительный; appropriate — подходящий; relevant — уместный; substantial — существенный; comprehensive — всесторонний; consistent — последовательный; inevitable — неизбежный; controversial — спорный; reluctant — неохотный; thorough — тщательный
- furthermore — более того; nevertheless — тем не менее; regardless — независимо; whereas — тогда как; therefore — следовательно

### C1 — needs nuanced verbs/adjectives/idiomatic register (replace the coined nouns)
- to advocate — отстаивать; to undermine — подрывать; to scrutinize — тщательно изучать; to mitigate — смягчать; to reconcile — примирять; to discern — различать; to constitute — составлять; to entail — влечь за собой; to perpetuate — увековечивать; to alleviate — облегчать
- meticulous — дотошный; ambivalent — двойственный; nuanced — тонкий; pervasive — всепроникающий; profound — глубокий; arbitrary — произвольный; coherent — связный; plausible — правдоподобный; intricate — замысловатый; redundant — избыточный
- discrepancy — расхождение; consensus — консенсус; paradox — парадокс; nuance — нюанс; threshold — порог; trajectory — траектория; precedent — прецедент; rhetoric — риторика
- **Replace non-words**: `binarity`, `cyclicity`, `coercivity`, `cumulativity`, `fractality`, `exponentiality`, `scientificity` with the standard items above.

---

## Summary of recommendations

1. Collapse 59 within-file exact dups (a1 and b2 are worst).
2. Remove ~102 pure cross-level dups, keeping the lowest valid level.
3. Reconcile 14 same-English/different-Russian gloss conflicts before deduping.
4. Re-band the clear misclassifications (finance terms out of a2; abstract `-tion`/`-ity` nouns out of b1; `efficacy`/`ramification`/`susceptibility` to c1; trim a1's hard tail).
5. Replace ~7 coined/non-standard C1 "words".
6. Backfill every level with verbs, adjectives, and adverbs — the corpus is overwhelmingly nouns and is missing the most basic high-frequency function/content words (`to be`, `to have`, `good`, `who`, `where`, etc.).
