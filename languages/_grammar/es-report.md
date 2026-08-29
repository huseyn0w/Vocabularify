# Spanish grammar inventory — sourcing and decisions

## Source reached

Primary source, reached and used directly (fetched the live HTML, not summarized from
memory):

- Instituto Cervantes, *Plan curricular del Instituto Cervantes*, Gramática, Inventario
  A1-A2:
  https://cvc.cervantes.es/ENSENANZA/biblioteca_ele/plan_curricular/niveles/02_gramatica_inventario_a1-a2.htm
- Same work, Inventario B1-B2:
  https://cvc.cervantes.es/ENSENANZA/biblioteca_ele/plan_curricular/niveles/02_gramatica_inventario_b1-b2.htm
- Same work, Inventario C1-C2 (only the C1 column was used; C2 is out of scope for this
  file):
  https://cvc.cervantes.es/ENSENANZA/biblioteca_ele/plan_curricular/niveles/02_gramatica_inventario_c1-c2.htm
- Index confirming the inventory list (Gramática, Pronunciación y prosodia, Ortografía,
  Funciones, Tácticas y estrategias pragmáticas, Géneros discursivos, Nociones
  generales, Nociones específicas):
  https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/indice.htm

Each of the three level pages presents its content as two-column tables (e.g. "A1 | A2"
or "B1 | B2") under each numbered grammar heading. I fetched the raw HTML and parsed it
rather than relying on a summarized fetch, because a first-pass summarized read
collapsed the two columns and lost exactly the level distinctions this file depends on.
Where a subsection's HTML anchor id carried a level suffix (e.g. `id="p922b2"` for
"9.2.2. Pretérito imperfecto" of the subjunctive), I used that id as ground truth for
which level introduces that item, rather than trusting position alone. That check
changed several placements from what I would have guessed from memory — see "Surprises"
below.

## How the A1-A2 / B1-B2 / C1-C2 split was done

The brief's rule: each topic belongs to the level that first teaches it; if a source
bands two levels together, split by whichever column (first or second) the content
appears in, and treat an extension at the later level as its own topic rather than a
duplicate. The PCIC tables already separate content by column per level, so in almost
every case the split was mechanical: content in the "A1" column of a table went to
`a1`, content only in the "A2" column went to `a2`, etc. I did not have to guess a
split for any topic — the source itself marks A1-only, A2-only, or A1-then-A2-extended
for every item I used. The one recurring judgment call was deciding how finely to slice
a PCIC subsection into named topics for this file (see next section), not which level a
given piece of content belongs to.

C1-C2 is a single inventory page in the source; I only extracted the C1 column, per the
brief's level list (a1, a2, b1, b2, c1). I did not build a c2 array.

## Where I split PCIC's own bundling into more topics, and why

PCIC's grammar inventory is organized by grammatical category (sustantivo, adjetivo,
artículo, pronombre, verbo, sintagma, oración simple/compuesta), not by "thing a learner
practices." Several of the entries in `es.json` therefore combine or split PCIC's raw
list items to make each one independently testable in one sentence, per the brief's
requirement. Notably:

- **ser vs. estar** is not one PCIC line item; it recurs across several sections at
  every level (12.1 "El núcleo", plus the article/pronoun sections that reference it).
  I built a deliberate ladder instead of one big topic: `a1.ser-identity` /
  `a1.estar-location` (bare copula, no adjective), `a2.ser-estar-extended` (possession,
  price, cause "por" / dates, weather "a"), `a2.ser-estar-exclusive-adjectives`
  (adjectives that only ever take one copula), `b2.ser-estar-adjective-meaning-change`
  (the same adjective, different meaning by copula — listo/rico/verde/aburrido/etc.,
  which PCIC places at B2, not B1), and `c1.ser-estar-episodic-evaluative` (ser for
  character vs. estar/ha sido for a one-off occasion with evaluative adjectives like
  amable). This was the calibration point the brief flagged, since this project teaches
  "to be" as a single concept card with a gloss override — I made each `test` field name
  the specific copula, the specific licensing context (identity/origin/profession/time
  for ser; location/state for estar), and, where relevant, the specific verb form
  (soy/eres/es... vs. estoy/estás/está...), so a reviewer can check a sentence against
  one topic at a time without ambiguity about which of the two it's supposed to hit.
- **Present subjunctive** is one PCIC subsection (9.2.1) but lists five or six
  functionally distinct triggers in its "valores/significado" list. I split these into
  separate B1 topics (`subjunctive-desiderative` for querer que/ojalá,
  `subjunctive-doubt` for quizá/tal vez/no creer que, `subjunctive-valoration` for
  impersonal value judgments, `imperative-negative`, `subjunctive-temporal-future` for
  cuando/antes de que future reference, `subjunctive-purpose-para-que`, and
  `relative-clause-subjunctive-unknown`) plus one `subjunctive-present-form` topic for
  the paradigm itself. A sentence that hits "quiero que vengas" and one that hits "no
  creo que venga" exercise different triggers even though both are "present
  subjunctive," and a reviewer checking for one trigger shouldn't have to accept the
  other as a match.
- **Object pronouns**: direct object pronouns, indirect object pronouns, the
  le-to-se substitution, and leísmo are four separate topics
  (`a2.direct-object-pronouns`, `a2.indirect-object-pronouns-le-se`,
  `b1.clitic-combination-oi-od`, `b2.leismo-persona`), matching the brief's explicit
  instruction to name these individually rather than folding them into one "pronouns"
  topic.
- **Por vs. para** is not a standalone PCIC section at all — PCIC distributes causal
  "por" and final "para" across the "ser+adjective" and "oraciones causales/finales"
  subsections at different levels (para + infinitive appears at A1, causal por and
  purpose-para with ser appear at A2). I built one explicit `a2.por-vs-para` topic
  combining that material, per the brief's instruction to name a language-specific split
  explicitly even where the source scatters it. I placed it at A2, the first level
  where both prepositions have appeared with the functions being contrasted (cause vs.
  goal); A1 only has para (purpose).

## Surprises versus a typical textbook A1 (verified against the source, not assumed)

Using the HTML anchor ids as ground truth (see above) turned up several placements that
differ from how most commercial course books sequence Spanish, which I want to flag
since they may look like errors on a first read but are what PCIC actually says:

- **Imperative, pretérito indefinido, pretérito imperfecto, pretérito perfecto
  compuesto, and the progressive (estar + gerundio) are all A2, not A1**, in PCIC.
  A1 verb morphology is limited to the present indicative (regular + ser/estar/tener/
  ir/hacer) plus the infinitive and the participle as an adjective (estoy cansado). I
  confirmed this by checking that the A1-column anchor ids for these subsections (e.g.
  `p93` imperativo, `p912`/`p913`/`p916` for imperfecto/indefinido/perfecto) simply do
  not exist in the A1-A2 page — only the A2-suffixed ids do.
- **Comparatives (más/menos/tan...que) and absolute superlative -ísimo are not A1.**
  A1 has only the intensifier `muy`; comparatives move to A2, and -ísimo appears only
  at B1.
- **The imperfect subjunctive, and the perfect/pluperfect subjunctive, are B2-only in
  PCIC**, not B1, even though the present subjunctive starts at B1. Many course books
  introduce imperfect subjunctive earlier for conditionals; PCIC's own table structure
  (confirmed by anchor id `p922b2` etc.) places it at B2.
- **Leísmo de persona is B2**, and the further leísmo de cosa / laísmo / loísmo entries
  are C1/C2 and explicitly marked in the source with an asterisk as nonstandard
  (`*la dije que viniera`). I kept `c1.dequeismo-recognition` and
  `c1.laismo-loismo-recognition` as *recognition* topics whose `test` field requires the
  sentence to follow the standard (le for indirect objects, de only where the verb
  requires it) — I did not write them as production targets for the nonstandard forms
  themselves, since that would mean asking sentence-writers to deliberately generate
  ungrammatical Spanish.

## Where the source disagreed with itself, or left something ambiguous

- The distinction between "B1 block" and "B2 block" is visually a two-column table on
  the live page, which collapses into a flat, unlabeled text stream once fetched as
  plain text — a same-page subsection can have both columns filled (alternating
  A1-then-A2 content back to back) or only one column filled (with the whole PCIC
  subsection appearing once). Position alone is unreliable for telling those two cases
  apart. I resolved every case I used by checking the HTML anchor id suffix
  (`...a1`/`...a2`/`...b1`/`...b2`/`...c1`/`...c2`) rather than by counting blocks, and
  where a subsection had no per-level anchor id at all (mostly true for the noun/
  article/quantifier sections, which are laid out as bigger combined tables rather than
  one table per numbered subsection), I read the surrounding "Valores/significado" and
  "Distribución sintáctica" groupings directly against the literal "A1"/"A2" or
  "B1"/"B2" header text that precedes each column in the flattened text.
- PCIC has no standalone "preposiciones" inventory (confirmed against the index page);
  por and para are distributed under causal/final clause sections and under the
  ser/estar "sintagma verbal" section. I treated this as "the source doesn't name it as
  one topic" and built the explicit `por-vs-para` topic myself from the distributed
  material, as instructed for language-specific splits the brief calls out by name.

## Topics I deliberately left out

To keep the list to genuinely testable grammar rather than padding it with every PCIC
bullet, I did not create standalone topics for:

- Dialectal/regional variant forms that PCIC lists as bracketed notes throughout every
  level (voseo verb forms, Latin American lexical/gender variants, "ustedes" replacing
  "vosotros," regional periphrasis preferences). These are sociolinguistic variation
  notes in the source, not a separate grammatical structure to target, and the app
  otherwise teaches a single register.
- Narrow morphological footnotes with no independent test value: irregular plural
  endings for loanwords (currículums vs. currícula), invariable-gender noun classes
  (el/la guía), adverbs that cannot take -mente. These are lexical/morphological facts
  about specific words rather than a construction a sentence can be built around.
- Pragmatic/discourse-nuance uses of a tense that PCIC lists at C1-C2 for irony,
  surprise, or narrative distancing (e.g. imperfecto de censura, futuro de sorpresa,
  presente histórico). These are stylistic effects layered on tenses already covered as
  grammar topics at earlier levels, not new grammatical structures, and would be very
  hard for a reviewer to verify from a single sentence out of context.
- Most of C1-C2's noun/adjective/quantifier micro-variation (compound color adjectives'
  further morphology, additional gentilicios, further partitive numeral types). C1 in
  this file focuses on the items with clear independent testability: mood selection,
  tener/llevar + participle, cuyo, the passive-agent restriction, and the two
  recognition topics for nonstandard pronoun usage.

## Topic counts

a1: 24, a2: 26, b1: 30, b2: 28, c1: 18 — total 126.

These land inside or close to the brief's "somewhere around 15-30 for A1 and rather
more for B1-B2" guidance; B1 came out larger than B2 mainly because the subjunctive
triggers (a genuinely large, independently-testable set) land at B1 in PCIC, with B2
adding the imperfect/perfect/pluperfect subjunctive forms and a correspondingly large
set of ser/estar, passive, and pronoun refinements. C1 is intentionally smaller: much of
what PCIC adds at C1-C2 is pragmatic nuance rather than new testable structure (see
"deliberately left out," above).

## Topics I was least certain about the level for

- `es.a2.por-vs-para` — placed at A2 because that's where both prepositions'
  contrasting functions (cause vs. goal) are both present in the source, but PCIC itself
  never names this contrast as one topic, so the level assignment is my own synthesis
  rather than a direct source placement.
- `es.b1.demonstrative-anaphoric-discourse` — PCIC lists this under "Los demostrativos"
  with a B1/B2 table that has almost no header text distinguishing the two beyond the
  bracketed cross-references; I placed it at B1 based on the column position but did not
  find an anchor id to confirm it independently.
- `es.c1.adjective-relational-vs-qualifying` and a couple of the other C1 items drawn
  from the adjective section (2.1.1/2.1.2) — this section's C1/C2 columns are thin and
  some of the id-confirmed C1 entries are narrow lexical lists (gentilicios poco
  frecuentes); I judged which underlying phenomenon was worth keeping as a named topic
  versus folding into the note of a related one, and a different reviewer might draw
  that line slightly differently.
