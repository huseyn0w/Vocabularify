# English grammar-by-level report

## Sources reached

**English Grammar Profile (EGP)**, Cambridge/English Profile. This is the primary source and the
one the brief asks me to prefer when it disagrees with textbook convention. The live tool at
englishprofile.org/english-grammar-profile requires an account to search; I could not reach it
directly. I instead pulled the underlying dataset (`egpo.xlsx`, "English Grammar Profile Online",
1239 rows) from a community-maintained mirror of the official spreadsheet
(github.com/ninja33/EGP, `asset/egpo.xlsx`). Each row is one corpus-derived criterial feature with
a CEFR level (A1-C2), a SuperCategory/SubCategory, a guideword, a can-do statement, and 2-3 real
learner-corpus example sentences with pass/fail metadata. I read all 1239 rows (1126 of them
A1-C1, the range this file covers) and used the can-do statements and real examples, not just the
guidewords, to decide what each entry actually teaches — several guidewords are misleading on
their own (see below).

**English Vocabulary Profile (EVP)**: used qualitatively for which quantifier and uncountable-noun
vocabulary is plausible at each level (e.g. that "loads of", "plenty of" read as B1 rather than A2
register). I did not pull the EVP dataset itself; the countable/uncountable and quantifier
progression is grounded in the EGP's own NOUNS/uncountable and DETERMINERS/quantity entries, which
give level tags and real examples for the quantifier vocabulary directly.

**CEFR (Council of Europe)**: used only as a sanity check on level *names* and general scope
(A1 = breakthrough, B1 = threshold, etc.), not as a source of specific grammar content — the CEFR
itself does not enumerate grammar points; that is exactly the gap English Profile was built to
fill.

I could not reach: the interactive EGP search tool itself (login-gated), and the English
Vocabulary Profile online tool (also gated). Everything in `en.json` is grounded in the raw EGP
spreadsheet data, cross-checked against real corpus example sentences pulled from that same file.

## Method

The raw EGP has 1239 micro-entries (109 at A1, 297 at A2, 342 at B1, 248 at B2, 130 at C1, 113 at
C2 — I excluded C2). Many of these are FORM/USE splits of the same teachable idea (e.g. "can:
affirmative", "can: negative", "can: question", "can: use — ability", "can: use — offers" are five
separate EGP rows for what a course teaches as one topic: *can*). Dumping all 1239 rows would not
be usable by a sentence-writer, so I consolidated related rows into 157 curriculum-grade topics
(26/35/41/33/22 across A1-C1), using the **lowest** level at which a genuinely new, separately
testable pattern appears as that topic's level, and adding a distinct topic at a later level only
when the extension is itself independently testable (a new form, a new use, or a construction the
earlier topic's test would not catch). This is the "present perfect at A2 plus a separate,
extended present perfect at B1" pattern the brief describes, applied throughout — for example
*can* (A1: ability/possibility/offers/requests) → *can* for permission (A2) → *can* for permission
and general possibility folded into *could* at B1 is not how I did it; instead each modal verb by
function is its own lineage: *could* (A2: past ability, polite requests/suggestions) → *could* for
permission and general possibility (B1) → *could have* for past speculation, regret, polite
criticism (C1, via *might have/could have*).

Every example sentence in `en.json` is one I wrote myself (short, clean, unambiguous), not lifted
verbatim from the noisy real-learner corpus examples (which include spelling slips, unrelated
clauses, and metadata). I used the corpus examples to confirm the pattern and its level, then wrote
a clean example of my own.

## Where the corpus disagreed with textbook convention

The brief specifically asked me to prefer EGP over convention and flag where they split. Four
clear cases:

1. **Imperatives are A2, not A1.** Nearly every beginner coursebook teaches bare imperatives
   ("Sit down", "Open your book") in the first unit. EGP's corpus data places the *criterial*
   (i.e. first reliably-produced-in-writing) use of affirmative/negative imperatives and
   `let's`-suggestions at A2 (EGP #186-191), not A1. My best explanation: EGP is built from the
   Cambridge Learner Corpus, which is *written* exam scripts, and imperatives are far more
   central to spoken classroom instruction-giving than to what an absolute beginner produces
   unprompted in writing. I followed the corpus and placed `en.a2.imperatives` at A2.

2. **Do-support questions ("Do you like...?", "Are you...?") are A2, not A1.** EGP's
   QUESTIONS/yes-no subcategory tags "Do you like it?" (lexical-verb do-support) and "Are you
   ok?" (main-verb be) both as A2. This one has an internal wrinkle: EGP's *separate*
   CLAUSES/interrogatives subcategory tags the identical example ("Are you ok?") as A1. Same
   sentence, two different levels, from two different analysis passes in the same spreadsheet. I
   resolved this by keeping "be" yes/no questions at A1 (folded into `en.a1.be-present`, the
   earlier tag, and the more foundational pattern — a beginner course cannot avoid "Are you...?"),
   and placing general do-support questions and full wh-question formation at A2
   (`en.a2.yn-questions-do-support`, `en.a2.wh-questions`), where the corpus is unanimous. This
   means A1 in `en.json` teaches only yes/no questions with *be*, not "What's your name?" or "Do
   you like...?" as productive patterns — those are treated here as A2, even though many A1
   coursebooks drill them as memorized survival chunks.

3. **Present perfect starts at A2, not B1.** A web search on this task (before I found the EGP
   spreadsheet directly) turned up the claim that present perfect is "criterial for B1". The raw
   EGP data disagrees: affirmative/negative/question forms plus the experience-use and `for`/`yet`
   both land at A2 (EGP #816-822), with the fuller set of uses (`since`, `already`, unfinished
   time, superlative modification, negative questions) appearing at B1 (#823-833). I followed the
   corpus and split it as `en.a2.present-perfect-simple` (experience/for/yet) plus
   `en.b1.present-perfect-extended` (since/already/unfinished/superlative) — an A2 topic and a
   separate B1 extension, per the brief's instruction, rather than one B1 topic.

4. **Passive voice, relative clauses, reported speech, and conditionals (zero/real) all start at
   A2, not B1.** Textbook sequencing usually saves all four for B1. EGP tags the first affirmative
   passive (present/past simple), the first defining relative clause (who/which/that, including
   contact clauses), the first reported statement (pronoun shift only, no tense backshift), and
   the zero/real conditional all at A2, with real, unremarkable corpus examples in each case (e.g.
   "English is spoken here", "The man who lives next door is a doctor", "If you need help, call
   me"). I followed the corpus for all four and pushed the *fuller* versions of each (wider tense
   range for passive, non-defining relative clauses, full tense-shift reported speech, first/
   second/third conditional) to B1, where EGP's own data supports that split cleanly.

5. **"Indirect questions" split into two genuinely different topics at two different levels.** A
   web search (before I had the EGP file) called indirect questions "criterial for B1" with the
   example "Can you tell me...?". The EGP spreadsheet itself only tags one specific
   indirect-question pattern directly: `Do you know how/where/why/what...?`, at A2 (EGP #871),
   confirmed by real examples ("Do you know how to get to my house?"). The B1-feeling construction
   — a genuine embedded wh-question with statement word order after a reporting verb ("She asked
   what time it was") — exists in EGP not as a QUESTIONS entry but under REPORTED SPEECH at B1
   (#1146-1147). I kept these as two separate topics at their two separate levels
   (`en.a2.indirect-questions-do-you-know`, `en.b1.reported-questions-commands`), since they are
   different constructions that happen to both get called "indirect questions" informally.

## Topics I was unsure about

- **Future continuous at A2** (`en.b2` — no, `en.a2.future-continuous-affirmative`): this
  surprised me enough that I checked the real corpus examples twice ("I'll be waiting for you";
  "We will be starting at 12 o'clock this afternoon", both tagged A2, both natural, unremarkable
  sentences). I kept it at A2 on the strength of those examples, but this is the one placement in
  the file I'd flag as worth a second opinion — it is earlier than any coursebook I know of
  introduces this tense, and it's plausible these are two isolated corpus hits rather than a
  reliably-produced pattern.
- **Countable/uncountable and quantifier vocabulary boundaries** (which specific quantifier goes
  at A2 vs B1 vs B2, e.g. "a few" vs "several" vs "a little bit of") are grounded in EGP's own
  DETERMINERS/quantity level tags, which I trust for the *grammar* (the determiner + noun-type
  agreement), but the EVP would be the more authoritative source for whether an individual
  quantifier *word* is itself A2 or B1 vocabulary. I did not cross-check every quantifier word
  against EVP directly.
- **C1 topic count (22) is smaller than B1/B2** (41/33) — this matches the raw EGP's own drop-off
  (130 C1 rows vs 342 at B1), and my read is that C1 is genuinely less about *new* grammar and more
  about widening the range and register of grammar already taught (formal inversion, nominalisation,
  hedging modals) — so I did not pad C1 to look more even with B1/B2.
- A handful of EGP micro-entries I deliberately did not promote to their own topic because they
  are not independently testable from a sentence alone (e.g. many "with adverbs" or "ellipsis"
  guidewords, which describe optional additions to a pattern already covered by that pattern's main
  topic, not a separate learnable rule). I treated these as covered by the parent topic rather than
  as gaps.

## Output

`en.json`: 157 topics — 26 (A1), 35 (A2), 41 (B1), 33 (B2), 22 (C1) — each with `id`, `name`,
`note`, `example`, and a `test` written so a reviewer can check a candidate sentence against it
without needing to consult this report.
