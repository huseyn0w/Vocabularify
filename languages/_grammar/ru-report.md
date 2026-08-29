# Russian grammar-by-level report

## Sources reached

All five levels are grounded in the actual Russian government standard documents (Государственный образовательный стандарт по русскому языку как иностранному), not general knowledge. I fetched and read each one in full:

- Элементарный (A1): `kpfu.ru/portal/docs/F_1236094414/Gosudarstvennyj.standart.elementarnui.uroven.pdf` — read in full.
- Базовый (A2): `test.irlc.msu.ru/wp-content/uploads/2024/08/A2_standart.pdf` — read in full.
- Первый сертификационный (B1, "Первый уровень. Общее владение"): `kpfu.ru/portal/docs/F_189607702/Gosudarstvennyj.standart.Uroven.1.pdf` — read in full.
- Второй сертификационный (B2, "Второй уровень. Общее владение"): `test.irlc.msu.ru/wp-content/uploads/2024/08/B2_standart.pdf` — read in full.
- Третий сертификационный (C1, "Третий уровень. Общее владение"): a copy of `test.tsu.ru/sites/default/files/files/exams/C1_standart.pdf` — read, **but with a gap**: see "What I could not reach" below.

All five are the actual "Часть I. Требования к уровню..." sections — the same official minimum-requirements documents used to certify ТРКИ. `WebFetch` could not decode any of them (it kept receiving raw PDF binary), so I downloaded each PDF and read it directly with the file-reading tool, which does handle PDF text extraction. This means every case function, every verb-form list, and every example sentence in `ru.json` is lifted or built directly from these documents' own wording and examples, not reconstructed from memory.

## Level mapping

Used exactly as specified in the brief and confirmed by each document's own ALTE-equivalence table:

- элементарный уровень → A1
- базовый уровень (ТБУ) → A2
- первый сертификационный уровень (ТРКИ-1) → B1
- второй сертификационный уровень (ТРКИ-2) → B2
- третий сертификационный уровень (ТРКИ-3) → C1

The documents themselves state that базовый "includes" элементарный (базовый уровень (включающий элементарный уровень)) — I treated элементарный as the free-standing A1 file and базовый as A2, per the brief's explicit mapping, rather than merging them.

## What I could not reach

The C1 (Третий уровень) PDF I could fetch did not extract cleanly past the noun/case section. Section 2.2.1 (word formation) and 2.2.2 (noun cases) came through in full and are used. Sections 2.2.3–2.2.8 (adjective, pronoun, verb, numeral, adverb, function-word morphology) did not extract — the reader returned the syntax section (2.3.x) immediately after the noun-case list, skipping those pages entirely (likely an image-only or malformed page range in that particular copy). I did not fill this gap from memory. As a result, C1 has no dedicated verb-morphology entries beyond what already carries over from B2 (aspect-across-moods, subjunctive, full participles/gerunds) — the C1 file's actual new content is case-government breadth, word order (inversion), and two items that did extract cleanly from 2.2.1 (prefixed reflexive verbs, substantivized adjectives). If someone later gets a cleaner copy of the C1 standard, sections 2.2.3–2.2.8 should be checked for anything new that got missed.

## Why phonetics/intonation are entirely absent

Every level's document opens its language-competence section with "2.1. Фонетика. Графика" — the alphabet, sound–letter correspondence, and the ИК-1 through ИК-7 intonation-contour system. I left all of it out on purpose. The brief's testability rule ("a reviewer can tell whether a sentence hit it by looking at the sentence") can't be satisfied by stress placement or intonation contour, because Vocabularify's sentences are written text — stress isn't marked in ordinary Russian orthography and intonation isn't recoverable from a written sentence at all. This is a case where the standard's own scope is broader than what a written-sentence-authoring brief can use, so I trimmed to what a sentence can actually carry.

## The two things the brief asked me to get right

**Split what the language splits.** I gave dedicated, level-specific entries to:
- Verbal aspect (несовершенный/совершенный): introduced as a plain lexical pair at A1, extended across imperative/negation/subjunctive nuance at B2. This is the single hardest thing about Russian for an English speaker and the standards are explicit that it's used across every mood by B2.
- All six cases, individually, and *by function within each level* rather than "case system" as one blob — e.g. genitive has five separate entries spread A1→C1 (basic possession/absence at A1, extended absence+location at A2, object/comparison at B1, verbal-object/cause at B2, material/origin/experiencer/place at C1), because the standard itself introduces genitive's functions in exactly that order across the five documents.
- Verbs of motion: идти/ходить and ехать/ездить as bare pairs at A1, по-/при- prefixes at A1, three more base pairs (лететь/летать, нести/носить, везти/возить) plus у-/вы-/в- prefixes at A2, the remaining directional prefixes (пере-/про-/о-/за-/до-/от-) at B1, and the same prefixes reused as plain lexical (non-motion) verb-formation at B2.
- Absence of a present-tense copula: a dedicated A1 entry (`ru.a1.zero-copula-present`), since this is one of the first things that trips up learners from copula-obligatory languages.
- Short vs. long adjective forms: short forms start as a closed, memorized set of four (рад, занят, должен, болен) at A1, and only become a productive comparative/superlative system at B1.
- Participles and gerunds (причастие/деепричастие): the standards introduce these as a *concept*, with only the short passive participle in active use, at B1 (ТРКИ-1) — this matches what I found independently via web search before reading the full documents. Full long participle phrases and full gerund phrases (with their own dependents) are a distinct B2 (ТРКИ-2) extension, so I split concept-vs-phrase across the two levels rather than writing one "participles" entry.
- Animacy in the accusative: masculine singular animate nouns copying the genitive at A1 (since вижу друга-type sentences are basic-vocabulary material), extended to plural nouns of every gender at A2. The standards don't call this out as its own numbered topic (it's folded silently into "падежная система"), so this placement is my own inference from when the relevant vocabulary/case combinations would first be needed — flagged as the one topic I'm least certain of the exact level for.

**Not importing another language's syllabus.** I did not bring in a Germanic-language A1 list and relabel it. A1 alone ended up with 31 topics — well above what German or English A1 would carry — because the noun case system, verb-of-motion split, and zero-copula are all A1 material in the actual standard; trimming to "look like a normal A1" would have meant leaving out things the standard puts at that level. Per the brief's own calibration note, I followed the standard rather than trimming to match a expected size.

## Sizes

A1: 31 · A2: 14 · B1: 18 · B2: 15 · C1: 11 — total 89.

A1 is deliberately the largest because nearly the entire case system, the aspect distinction, and the motion-verb split are front-loaded there by the standard itself. A2's count is smaller than the brief's rough guidance because most of what A2 adds is genuinely marginal extension of A1 case functions rather than new categories (confirmed against the A2 document, which repeats A1's case tables almost verbatim with only a few new bullet points per case). C1 came out smaller than B1/B2 because — as far as the sections I could read show — the third level mostly widens case-government and prepositional vocabulary and adds stylistic/register control, rather than introducing brand-new grammatical categories; this matches the standard's own framing of C1 as "высокий уровень коммуникативной компетенции во всех сферах общения" (broad command) rather than new mechanics.

## Things I was unsure about

- **Animacy-in-accusative placement** (noted above) — my own inference, not a numbered item in any standard.
- **`ru.b2.style-nominal-predicate`** — I kept this to one entry even though the B2 standard names three separate register phenomena (nominal predicate in scientific text, verb-noun collocations in journalistic text, formulaic structure of official documents) under its 2.3.8 heading, because a single written sentence can't reliably distinguish "this is scientific register" from "this is journalistic register" the way a reviewer could check a case ending — they're closely related manifestations of the same "prefer a light-verb + noun phrase over a plain verb" habit, so I folded them into one testable entry rather than three thin, hard-to-distinguish ones.
- **Syntactic-transformation topics** — both B2 and C1 documents list a "Трансформация синтаксических единиц" section (converting active↔passive, participle-clause↔relative-clause, etc.). I left this out entirely: it's a property of a *pair* of sentences (can one be rewritten as the other?), not a property a reviewer can check by looking at a single sentence, so it fails the brief's testability requirement outright.
