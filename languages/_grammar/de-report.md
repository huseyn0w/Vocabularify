# German grammar-by-level report

77 topics total: a1 23, a2 11, b1 18, b2 13, c1 12.

## Sources reached, and how they were used

**Start Deutsch 1 (A1) and Start Deutsch 2 (A2) — Goethe-Institut Prüfungsziele/Testbeschreibung.**
Both PDFs were fetched and read in full (110 and 102 pages). Each has a chapter called
"Inventare" with a subsection "Grammatik" that lists the exam's grammar scope by category
(Verb, Nomen, Artikelwörter/Pronomen, Adjektiv, Präposition, Satz/Syntax, Wortbildung), each
item illustrated with a short example sentence. The A2 document reprints the same table and
marks every entry added on top of A1 with an asterisk. That asterisk is the single most useful
fact in this research: it is the Goethe-Institut's own statement of what is new at A2 versus A1,
and it is what the a1/a2 split in `de.json` is built on directly. Two concrete findings from it
that shaped the file: the two-way preposition system starts at A1 with only `an` and `in`, and
the full set (`auf, hinter, neben, über, unter, vor, zwischen`) is an A2 addition; and attributive
adjective endings after an article do not appear at all in A1 (only predicative/adverbial use
does) and are new at A2.

**Deutsch-Test für Zuwanderer (DTZ), Prüfungshandbuch — Goethe-Institut/BAMF.**
Read in full (109 pages). DTZ spans A2-B1 and its "Strukturen" chapter uses the same
category scheme as the Start Deutsch documents but extends it, with footnote 1 marking every
entry that applies only at B1. That is the direct source for the b1 list: Genitiv and
n-Deklination, Futur I, Plusquamperfekt, Passiv in Präteritum/Perfekt and with a modal verb,
Konjunktiv II's fuller paradigm, Relativsätze, Infinitivsatz mit zu, Doppelkonjunktionen, an
extended set of subordinators, adjective endings with no article, and verb valence with fixed
prepositions. A few B1 items in `de.json` are not literally in the DTZ table but are standard,
well-attested extensions of what is there (the wenn/als/wann three-way split; Zustandspassiv as
the counterpart to the Vorgangspassiv the DTZ list does name).

**Goethe-Zertifikat B2 Handbuch and Goethe-Zertifikat C1 Handbuch.**
Both fetched and checked. Neither has an itemized grammar inventory. The B2 handbook's own
text says explicitly that "grammatisches Wissen" is one of four knowledge types scored under
Ausdrucksfähigkeit/Korrektheit, not a list of forms to cover — confirming, from the horse's
mouth, that the Goethe-Institut and Profile Deutsch's design deliberately stops publishing an
itemized grammar inventory once a level assumes the learner has essentially finished acquiring
new forms and shifts to functional and stylistic command of them. This matches what a general
web search on Profile Deutsch's own framing turned up independently before the handbooks were
read.

**Profile Deutsch (Glaboniat, Müller, Rusch, Schmitz, Wertenschlag; Langenscheidt) itself.**
Not reached directly. It exists as a bound book plus CD-ROM, not as a freely downloadable PDF;
searches turned up bibliographic listings, library catalog entries, and short paraphrases of its
structure, but no full text of its grammar tables. All three Goethe/DTZ handbooks above cite it
as their comparison source, so its A1-A2 content is reached at one remove through Start
Deutsch/DTZ. Its B1-B2 content is not reached directly at all.

**What follows from that gap.** The b2 and c1 lists in `de.json` are the weakest-sourced part of
this file. They rest on: (a) the DTZ/Start Deutsch b1 items, extrapolated forward using
ordinary German-as-a-foreign-language teaching sequence (e.g. Konjunktiv I for reported speech,
extended participial attributes, and the shift from Vorgangspassiv-only to a full set of passive
alternatives are near-universal placements at B2-C1 across German coursebooks and teacher
references); (b) one secondary, non-authoritative cross-check, "Themen und Grammatik
B2-Deutschkurs" (Deutscher Volkshochschul-Verband, 2019), a job-oriented B2 coursebook's
per-lesson grammar list, used only to sanity-check that items like Nominalisierung,
Funktionsverbgefüge, Konzessivsätze and Wechselpräpositionen review sit at B2 in an actual
in-use German curriculum; and (c) short paraphrases of Profile Deutsch's B2/C1 content that
turned up in web search results (attributing Konjunktiv I indirect speech, Nominalstil,
Funktionsverbgefüge, Rektion and Partizipialkonstruktionen to B2-C1), which could not be
verified against Profile Deutsch's own text. None of this is an official, itemized inventory the
way A1/A2/B1 have one. Topics I am specifically less certain about the level placement of:

- `de.b2.support-verb-constructions` vs `de.c1.extended-support-verb-constructions` — the split
  between "learn the construction type at B2" and "wield a wide, register-appropriate set at C1"
  is my own judgment call, modeled on how Profile Deutsch treats other B2→C1 pairs (same
  mechanism, active/broad use added at C1), not something I read stated this way anywhere.
- `de.b2.temporal-connectors-extended` (sobald, solange, indem) — placed at B2 by ordinary
  coursebook sequencing; I did not find a source that fixes this one at B2 rather than late B1.
- `de.c1.marked-word-order-emphasis` and `de.c1.pronominal-adverbs-cohesion` — these describe
  real, well-documented German phenomena, but "C1" here reflects when a learner is expected to
  produce them productively and by choice for register effect, which is inherently softer than a
  form appearing for the first time; a different reasonable curriculum could place the underlying
  mechanism (verb-second still holds; da(r)-compounds exist) earlier and only the deliberate
  stylistic use at C1.
- `de.b1.zustandspassiv` — the DTZ list does not name Zustandspassiv as such; it names
  Vorgangspassiv (werden + participle) as a B1 extension. Sein + participle as a state-passive is
  added here at B1 because it is the natural pair to the werden-passive DTZ does place there, and
  because delaying it to B2 would leave the werden/sein passive contrast — one of the language-
  specific splits the brief calls out by name — unstated at any level.

## Disagreements between sources

No outright factual disagreement turned up between Start Deutsch, DTZ and the B2/C1 handbooks;
they visibly build on each other (DTZ explicitly says its structure list is checked against
"die Grammatiklisten aus Start Deutsch, Zertifikat Deutsch und Profile Deutsch"). The one
tension is scope, not content: A1/A2/B1 have an official numbered list to point to, and B2/C1 do
not, by the Goethe-Institut and Profile Deutsch's own design once CEFR shifts from itemized
grammar to can-do competencies. I resolved that by building b2/c1 from consensus rather than
inventing a false precision, and flagging exactly which items rest on that weaker footing above.

## Choices worth flagging even where I am fairly confident

- Perfekt is introduced at A1 (with a fixed, curriculum-listed verb set, split into a
  `haben`-auxiliary topic and a `sein`-auxiliary topic per the brief's instruction to name that
  split explicitly) and its extension to "all verbs" at A2 is **not** given its own A2 topic:
  the pattern itself does not change, only vocabulary coverage does, so a sentence in Perfekt
  with any A2-taught verb already exercises the A1 topic. I judged this not to be a "separate
  topic naming the extension" in the sense the brief means (which is about tenses/rules that
  genuinely add new grammar, e.g. Perfekt in Präteritum-form at B1 is not this — rather,
  Präteritum itself as a competing past tense is the new thing, listed at A2).
- Two of the brief's named German-specific splits are each represented by two topics rather than
  one, because the language genuinely teaches them in two steps: two-way prepositions
  (`an`/`in` at A1, the rest at A2) and adjective endings (definite/indefinite at A2, no-article
  at B1). Separable vs. inseparable prefix verbs, the haben/sein Perfekt auxiliary, V2-vs-verb-
  final order, Konjunktiv II, and Passiv are each present, named explicitly, and not folded into
  a general topic, per the brief.
- Inseparable-prefix verbs (be-, ge-, ver-, er-, ent-, zer-, emp-, miss-) are deliberately not
  given their own topic. They behave exactly like an ordinary weak or strong verb once you know
  the prefix never separates and never takes ge- in the participle — that second fact is already
  covered by `de.a1.past-participle-formation`'s note on where ge- goes, and I could not find a
  sentence-level test for "this verb has an inseparable prefix" that is not simply "this verb
  behaves as expected," which the brief's own bar ("a topic nobody can test is not usable here")
  argues against including as a separate line.
