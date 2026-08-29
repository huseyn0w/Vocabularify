# Italian grammar inventory - sourcing report

## What I used

The primary source named in the brief, *Profilo della lingua italiana* (Spinelli &
Parizzi), turns out to exist as a free online tool at
`https://www.unistrapg.it/profilo_lingua_italiana/site/`, not just the print book.
Each grammar category has one page per level, named predictably
(`gram_verbi_a1.html`, `gram_pronomi_b2.html`, and so on), so I could pull the
actual inventory entries rather than work from a summary.

Pages I fetched directly and read in full:

- `gram_verbi_a1.html`, `gram_verbi_a2.html`, `gram_verbi_b1.html`, `gram_verbi_b2.html`
- `gram_nome_a1.html`, `gram_nome_b1.html`
- `gram_pronomi_a1.html`, `gram_pronomi_a2.html`, `gram_pronomi_b1.html`, `gram_pronomi_b2.html`
- `gram_aggettivi_a1.html`, `gram_aggettivi_b1.html`
- `gram_avverbi_a1.html`, `gram_avverbi_a2.html`
- `gram_costruz_a1.html`, `gram_costruz_a2.html`, `gram_costruz_b2.html`
- `gram_frasesemplice_b1.html`
- `gram_frasecomplessa_b1.html`, `gram_frasecomplessa_b2.html`

`gram_costruz_b1.html` returned essentially nothing beyond "vedi livelli A1 e A2" -
word-order phenomena appear to have no new B1 content and resume at B2 with left
dislocation and cleft sentences, which is why B1 has no dedicated word-order topic.

Pages I could only reach through a search engine's result snippet (Google/Bing-style
summary), not a full page fetch, because the fetch tool kept returning template
chrome instead of body text on a second pass: `gram_articoli_a1/a2/b1.html`,
`gram_nome_a2.html`, and `gram_preposizioni_a1/a2/b1/b2.html`. I used what those
snippets gave (enough to place articulated prepositions at A1, and article-with-
geographic-names at A2/B1), but I'm less confident I have the *complete* content of
those pages, only what the snippet quoted. If you need the exhaustive article and
preposition inventories, those four preposition pages and three article pages are
the ones worth re-fetching directly.

I could not use the Ministero dell'Interno / CVCL "Sillabo di riferimento per i
livelli di competenza in italiano L2" PDFs (A1/A2/B1, at interno.gov.it) - I
downloaded the A2 one but my fetch tool could not extract text from the compressed
PDF stream. I did not pursue re-extracting it (e.g. with a local PDF-to-text step)
since Profilo already gave me directly-sourced, more granular content for the same
levels. I also tried `parliamoitaliano.altervista.org`'s "sillabo grammaticale"
pages (A1/A2, B1/B2, C1/C2) as a secondary cross-check; the fetch tool got stuck in
a redirect loop on all three and I never got real content from them, so nothing in
this file is actually sourced from that site despite it looking like a good match
in search results.

CILS (Università per Stranieri di Siena), CELI (Università per Stranieri di
Perugia), and PLIDA (Società Dante Alighieri) don't publish a level-by-level
grammar checklist the way Profilo does. What I found from them was consistent
description-of-competence language ("grammatical competence is assessed mainly
through production") rather than itemized structures - useful for confirming that
A1-B2 is where the enumerable grammar lives, and that C1 is explicitly treated as
consolidation (see below), but not usable as a per-topic source in its own right.

## C1 is thinner, and I'm saying so rather than padding it

Profilo della lingua italiana stops at B2. That's not an oversight on my part -
it's the actual scope of the book and the tool. For C1 I found direct statements
from PLIDA's syllabus commentary that "a livello C1 tutte le strutture della
lingua italiana sono considerate acquisite" (at C1, all structures of Italian are
considered already acquired) - i.e. the certifying bodies deliberately don't grade
C1 by new morphosyntax, they grade it by register control, textual organization,
and production quality.

Given that, I did not force a 15-30-topic C1 list to match A1's size. The 10 C1
entries in `it.json` are structures that are genuinely new or newly systematic at
this level even though no single graded syllabus lists them: absolute participial
and gerund clauses, `andare` + participle for obligation, subjunctive in
`chiunque`/`qualunque`/`per quanto` clauses, the reflexive causative (`farsi` +
infinitive), full indirect-speech tense correlation, nominalization, the informal-
register hypothetical (indicative for indicative), argumentative-text connectives,
and consistent formal register. I cross-checked each of these against ordinary
Italian reference-grammar pages (bab.la, impariamoitaliano.com) and a university
Italian-course chapter on *correlazione dei tempi* (University of Iowa's
"D'accordo" pressbook) rather than a single authoritative C1 syllabus, because none
of my three named sources publishes one. Treat the C1 list as lower-confidence than
A1-B2 for that reason - it's a reasonable compilation, not a transcription of a
graded reference.

## Decisions and judgment calls

**Essere/stare as one topic.** Per your instruction, `it.a1.essere-stare` is a
single entry covering both verbs (Profilo doesn't separate them either - stare only
gets its own line at A2, for `stare + gerundio`). The `test` field is written as a
decision procedure: identify which conjugation paradigm the actual verb form
belongs to (sono/sei/è... vs sto/stai/sta...), then check whether the sentence's
meaning matches that verb's normal domain (identity/description/fixed location for
essere; health/temporary state/current location of a person for stare). A reviewer
with the sentence in hand should be able to answer "essere or stare, and is it used
correctly" without needing to consult anything else.

**Imperfetto vs. passato prossimo got its own topic (`it.a2.imperfetto-vs-
passato-prossimo`)** even though Profilo lists the two tenses as separate grammar
lines rather than as an explicit contrast. Every mainstream A2 textbook (Nuovo
Espresso, Nuovo Progetto Italiano, etc.) teaches the contrast as its own lesson
once both tenses exist, because it's the single hardest point in Italian past
narration for learners, and it's exactly the kind of thing this file exists to let
a reviewer test for. I'm flagging it as a pedagogical-synthesis topic rather than a
literal transcription of a Profilo page.

**Passato remoto's register note.** `it.b2.passato-remoto`'s `note` field states
plainly that it survives in ordinary speech mainly in the South and in oral
storytelling, that the North (and most spoken Italian generally) substitutes
passato prossimo even for distant events, and that it remains the norm in written
narrative and historical text. This matches what Profilo's own B2 verbi page says
("attenzione a distanza temporale e variazioni regionali/stilistiche") - I expanded
it from a one-line caveat into an explicit note because the brief specifically
asked for this to be called out.

**Participle agreement split into two separate topics**, per the brief's list of
things to name explicitly: `it.a2.passato-prossimo` covers agreement with an
essere-subject (part of learning the tense itself), and `it.b1.participle-
agreement-clitic` covers the separate, harder phenomenon of agreement with a
*preceding direct-object clitic* even when the auxiliary is avere (`Li ho
comprati`). Profilo's own B1 pronomi page treats this as a pronoun-chapter topic,
which is where I placed it, rather than folding it into the A2 tense topic.

**Ne and ci** are three separate topics, not one, because they enter the
curriculum at different points doing different jobs: `it.a2.ci-locative`
(locative, A2), `it.b1.ci-idiomatico` (pronominal-verb and idiomatic ci, B1), and
`it.b1.ne-partitivo` (partitive/idiomatic ne, B1 - Profilo doesn't introduce ne
before B1 at all).

**Articulated prepositions are an A1 topic** (`it.a1.prepositions-simple-
articulated`) - the Profilo preposizioni_a1 page (reached via search snippet, see
above) explicitly lists "preposizioni semplici e articolate" together from the
start, for provenance/destination/company. I did not find a page that introduces
bare simple prepositions first and articulated ones later; they're taught as one
system from day one.

## Things I'm not fully sure about the level placement of

- The exact boundary of what `gram_aggettivi_a2.html` and `gram_aggettivi_b2.html`
  contain - I fetched A1 and B1 directly but not A2/B2, so anything specific to
  those two pages (if it differs from what I inferred by extension) isn't
  reflected here.
- `gram_avverbi_b1.html` and `gram_avverbi_b2.html` - not fetched at all; B1/B2
  adverb-specific content (if Profilo treats adverbs as their own category that
  high, rather than folding them into general vocabulary) is not represented.
- Whether Profilo has a standalone "congiunzioni" category separate from
  `gram_frasecomplessa` - I never found one; all coordinating/subordinating
  conjunction content I used came from the frase-semplice/frase-complessa pages,
  which seem to be where Profilo actually houses this rather than a dedicated
  conjunctions page.
- `it.a1.avere-expressions` (avere for age/fame/sete/etc.) - Profilo's grammar
  inventory groups avere under general verb conjugation, not as its own line; the
  idiomatic uses may sit in Profilo's separate *notions* inventory (nozioni)
  rather than its *grammar* inventory. I included it anyway because it's a
  real, testable, and universally-A1 pattern, but flagging that its home in
  Profilo's own categorization may be "notions," not "grammar."

## Counts

a1: 21, a2: 22, b1: 27, b2: 25, c1: 10 - within the brief's expected range for
A1-B2, and deliberately smaller for C1 for the reasons above.
