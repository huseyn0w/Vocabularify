# French grammar topics — sourcing report

## What I reached, what I could not

The brief's named primary source is the *Référentiels pour le français* (Beacco,
Porquier, Lepage, Riba; CIEP/Didier) — one volume per level, A1 through B2 (no
separate C1/C2 volume exists; C1/C2 in the referential family covers other
languages, not French). I could not read these volumes' own grammar chapters.
Web search reached only bibliographic and structural metadata: publisher
listings (Didier FLE, Amazon.fr, Decitre), a library record (WorldCat), and a
ResearchGate abstract confirming the B1 volume's chapter structure (discursive
genres, functions, general notions, **grammar**, specific notions, phonetics,
graphics, cultural competence, learning strategies). An academia.edu excerpt
specifically titled "Grammaire du Niveau A1 pour le français" looked like it
would give the actual inventory, but the fetch returned HTTP 403 — academia.edu
blocks non-browser access to full documents. So for the itemized "what's
actually in Chapitre V" content, I did not reach the primary source directly.

For DELF/DALF, I found no France Éducation International document that lists
grammar points level by level. Their public specifications describe
communicative can-do competencies (what a candidate can do with the language
in each of the four skills), not a grammar inventory — grammar there is
implicit in the tasks, not spelled out.

What I did reach and use as a cross-check: the archive pages of
[ressourcesfle.fr](https://www.ressourcesfle.fr), a French-teaching resource
site, which tag individual grammar lessons by CECRL level (A1, A2, B1, B2
category pages). This is not one of the brief's named sources, but it gave
concrete, independently level-tagged grammar points I could compare my
placements against — e.g. it lists "le passé composé" under A1 and "imparfait
ou passé composé" under A2, which is what led me to split that topic the way I
did below.

Past that, I relied on general knowledge of how CECRL-aligned French course
sequencing works in practice — Alter Ego, Édito and similar series are built
explicitly to follow the Référentiels, and the order in which they introduce
grammar is stable across sources. Where I could not verify a specific level
placement against a live source, I say so below rather than presenting it as
settled.

## Sizing

A1: 23 topics, A2: 20, B1: 17, B2: 12, C1: 6 — 78 total. This tapers down by
level, which matches how the Référentiels themselves are described (a large,
enumerable inventory at A1–A2 that shrinks as content becomes more about
register and nuance than new structures at B2–C1), but I could not confirm the
taper against the actual published counts, only against general FLE teaching
experience.

## Decisions I made without being able to verify them against a primary source

- **Passé composé split across two levels.** A1 gets passé composé with avoir
  and regular participles; A2 gets passé composé with être (movement verbs,
  all pronominal verbs) plus the participle agreement that comes with it.
  ressourcesfle.fr's own level tags support this split, but I have not seen it
  confirmed in the Référentiel A1/A2 volumes themselves.
- **Pronominal verbs split across three levels**, which is the split I'm least
  sure about: present tense at A1 (s'appeler, se lever — needed from day one
  for basic self-introduction), the être-auxiliary and general agreement rule
  at A2, and the specific direct-vs-indirect-object nuance for participle
  agreement (se laver vs se parler) pushed to B1. An A1/A2 textbook might teach
  the whole passé composé agreement rule at A2 without the B1-level nuance
  about se parler-type verbs; I put the nuance at B1 because it presupposes
  the COD/COI distinction, which itself is an A2 topic, so a learner needs a
  full cycle of A2 grammar before the exception is teachable in a testable
  way.
- **Conditionnel split three ways**: polite present at A2, hypothetical
  present (si + imparfait) at B1, hypothetical past (si + plus-que-parfait) at
  B2. This is standard sequencing but I could not verify the A2/B1 boundary
  point against the Référentiel A2 volume directly.
- **Passé simple split at the B2/C1 boundary**: recognition of third-person
  forms only at B2, full-paradigm reading and occasional production at C1.
  This reflects how B2 and C1 readers are usually described (B2 reads
  narrative prose; C1 is expected to write in a wider range of registers) but
  is my inference, not a sourced claim.
- **Subjonctif split three ways**: the core trigger set at B1, the superlative/
  restrictive-clause trigger at B2, and the literary imparfait/plus-que-parfait
  forms at C1. The B1/B2 split follows the "extension gets its own topic" rule
  in the brief; I'm confident in the B1 placement (well attested, including on
  ressourcesfle.fr) and less confident in exactly which extra triggers belong
  at B2 versus C1, since I could not check this against the Référentiel B2
  volume's own list of triggers.
- **C1 topics** (subject-verb inversion in soutenu register, dislocation,
  subjonctif-vs-indicatif as a stance marker, register-marked connectors) are
  the ones I'm least confident are exactly what the Niveau C1/C2 referential
  names — I could not reach that volume even in bibliographic form during this
  session, so this level leans hardest on general knowledge of advanced French
  register phenomena rather than a checked source.

## Nothing the sources actively disagreed about

I didn't find two sources giving conflicting level placements for the same
topic — the disagreements I hit were about depth (an FLE resource site tags a
topic at a level, or general knowledge does, with no way to check the
Référentiel's own account level-by-level), not contradictions between two
sources that both spoke to the same claim.

## Typography note (not a grammar topic, per the brief)

French example sentences in `fr.json` put a narrow no-break space (U+202F)
before `?`, `!`, `:`, and `;`, matching the convention already used elsewhere
in this project's French text. 10 of the 78 examples contain one of those
punctuation marks and carry it.
