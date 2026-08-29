# Turkish grammar by level — sources and decisions

123 topics: A1 36, A2 23, B1 26, B2 21, C1 17.

## Sources I reached

**Türkiye Maarif Vakfı, *Türkçenin Yabancı Dil Olarak Öğretimi Programı*** — read in full
(280 pages, PDF from `kutuphane.turkiyemaarif.org`). Section 7, "Seviyelere Göre Dil Yapıları
Listesi" (pp. 79-81), is the one explicit A1-C1 grammar inventory I could find from an official
body. It lists 45 items at A1, 27 at A2, 10 at B1, 9 at B2, 5 at C1. This is the backbone of
the file.

**Erdil, M. & Açık, F. (2021), IJLET 9(4), 130-158** — read in full. The paper reprints, level
by level in Tables 1-7, the grammar syllabus of five sources side by side: the Maarif programme,
**Yunus Emre Enstitüsü Yedi İklim Türkçe**, **Yeni Hitit** (Ankara Üniversitesi TÖMER), Gazi
Üniversitesi *Yabancılar İçin Türkçe Dil Bilgisi*, and *İstanbul Yabancılar İçin Türkçe*. Every
placement decision below is a vote across those five columns.

**MEB Hayat Boyu Öğrenme, *Yabancı Diller Türkçe A1 Seviyesi Kurs Programı* (2017)** — read in
full (21 pages). It turned out to be theme-and-can-do based and says outright that "öğretmenler
benzer işlevi olan dil bilgisel yapılardan istediklerini kullanmakta serbesttirler" — teachers
pick their own structures. I used it only as a check on which forms actually surface in A1
material (its A1 examples already use the aorist: *saat kaçta kalkarsın*, *genellikle kitap
okurum*).

## Sources I could not reach

**Yunus Emre Enstitüsü's own programme document and the Yedi İklim coursebooks.** yee.org.tr
serves HTML, not the PDFs, for every `.../yayin/<level>_ders_kitabi.pdf` path, and YEE has not
published its *Türkçe Öğretim Programı* as a downloadable syllabus. I have the Yedi İklim
grammar list **only** through Erdil & Açık's tables — accurate as a list of topics per level,
but it does not give me the unit order inside a level.

**Ankara TÖMER's curriculum.** Same situation: no public syllabus document. Yeni Hitit is the
TÖMER set and its per-level grammar list reached me through the same tables.

**The Turkish CEFR adaptation (*Diller İçin Avrupa Ortak Başvuru Metni*).** This is a
translation of the CEFR, and the CEFR is a scale of can-do descriptors, not a grammar
inventory. There is no list of structures in it to follow. It contributes nothing concrete to
this file, and any claim that "the Turkish CEFR says -mIş is A2" would be made up. The Maarif
programme is the document that maps CEFR levels onto Turkish structures.

## How much the sources disagree

Far more than for the western European languages. The count of grammar topics per level, from
Erdil & Açık's Table 7:

| level | Maarif | Yedi İklim | Yeni Hitit | Gazi | İstanbul |
|-------|--------|------------|------------|------|----------|
| A1    | 45     | 21         | 26         | 15   | 17       |
| A2    | 27     | 17         | 24         | 20   | 18       |
| B1    | 10     | 9          | 41         | 36   | 18       |
| B2    | 9      | 19         | 18         | 86   | 18       |
| C1    | 5      | none       | 18         | 66   | 18       |

Yedi İklim stops teaching grammar after B2 entirely. Gazi front-loads almost nothing at A1 and
then dumps 86 topics at B2. Yeni Hitit teaches the whole subordination system at B1 that Maarif
spreads over B1 and B2. There is no single Turkish syllabus in the sense that Profile Deutsch or
the Plan curricular are single syllabi.

**My placement rule:** a topic goes to the earliest level at which at least two of the five
sources teach it, provided one of those two is Maarif, Yedi İklim or Yeni Hitit (the three the
brief names). Where that produced an obviously odd result I overrode it and said so below.

## Topics I am confident about

These sit at the same level in four or five of the five sources, so I would defend them without
hedging:

- All of A1's phonology and case morphology: vowel harmony, both consonant mutations, `-lAr`,
  the locative `-DA`, dative `-A`, ablative `-DAn`, accusative `-I`, the possessive suffixes,
  the genitive + `-(s)I` construction, `var`/`yok`, `değil`, the `mI` particle, `-Iyor`, `-DI`.
- The witnessed/reported past split. `-DI` is A1 everywhere; `-mIş` is A2 in Maarif, Yedi İklim,
  Yeni Hitit and İstanbul alike. This is the cleanest agreement in the whole dataset.
- `-(y)An` at A2, `-DIk`/`-AcAk` participles and `-DIğInI` nominalisation at B1.
- Passive, causative, reflexive and reciprocal voice at B1.
- The compound tenses (`-mIştI`, `-Iyordu`, `-AcAkmIş`) at B1.
- Reported speech across question and command types, `-mAktA`, `cAsInA` and the contrast
  connectors at B2.

## Topics resting on one source, or on general practice

- **`tr.a1.sov-word-order`** — no source lists "verb-final order" as a grammar topic; Maarif's
  closest item is "hâl ekleri-fiil ilişkisi". I added it because it is the first structural fact
  a Turkish course teaches and because a sentence-writing tool needs it stated. Mine, not a
  source's.
- **`tr.a1.numbers-singular-noun`** — the "no plural after a numeral" rule is implicit in every
  source's "Sayılar" entry but spelled out in none. Standard teaching practice.
- **`tr.a1.pronominal-n`** — Maarif alone names it (A1 #21, "zamir n'si"). Kept at A1 because
  without it every A1 sentence with `onun evinde` is wrong.
- **`tr.c1.sentence-focus`, `tr.c1.inverted-sentence`, `tr.c1.voice-agreement`** — these come
  from Maarif's very thin C1 list ("cümlenin ögeleri, cümlede vurgu"; "devrik"; "anlatım
  bozuklukları") plus Gazi's much longer treatment of the same material. Turning "anlatım
  bozuklukları" into something testable in a *correct* sentence forced me to restate it
  positively as voice and agreement consistency across coordinated clauses.
- **`tr.b2.participle-AsI`** — genuinely in both Maarif B2 and Yedi İklim B2, but it is close to
  fossilised in modern Turkish (`görülesi`, `öpülesi`, `kahrolası`). I kept it because two
  sources list it, and flagged its rarity in the note. If sentence writers struggle to build a
  natural one, drop it rather than invent a form.
- **`tr.c1.experiential-mIslIk`** — Yeni Hitit C1 only. Colloquial but real.

## Placements I am unsure about

**The aorist `-Ir` (put at A2).** Maarif has it at A1 (#25) and the MEB A1 course programme uses
it in A1 examples. Yedi İklim, Yeni Hitit, İstanbul and Gazi all teach it at A2. I went with the
four sets over the programme. The consequence for this project: **A1 Turkish sentences have to
describe habits with `-Iyor`**, which is what beginner Turkish does anyway. If you would rather
have A1 sentences say *her sabah çay içerim*, move `tr.a2.aorist-Ir` up a level — you have
Maarif behind you.

**The future `-(y)AcAk` (put at A1).** Maarif A1 and Yedi İklim A1 (its last A1 item) against
Yeni Hitit A2, İstanbul A2, Gazi A2. Two-against-three, and I let the two named primaries win. It
is the single most contestable placement in the file. If A1 feels overloaded, this is the first
thing to move.

**The ability suffix `-(y)Abil` (put at A2).** Maarif has it at A1 as "-(y)Abil (izin) + geniş
zaman", i.e. only in *may I*. Everyone else teaches it at A2. A2 it is, but an A1 sentence
containing *gelebilir miyim* would not be wrong.

**The optative `-(y)AlIm` (put at A2).** Maarif A1, Yeni Hitit A1, İstanbul A2, Gazi B1. A
genuine three-way split; A2 is the middle.

**The conditional `-sA` (put at B1).** Maarif alone puts "Dilek-Şart kipi" at A2. Yedi İklim,
Yeni Hitit and İstanbul all teach it at B1, so it went to B1 along with the compound conditional.

**The clitic `dA` (put at A1).** Yeni Hitit A1 and Maarif A2. I chose A1 because the project's
own A1 bank already contains the word `de`, and because the whole point of the topic is the
contrast with the locative suffix `-DA`, which is A1.

**The B1/B2 converb boundary is soft.** Maarif puts `-DIğI takdirde` and `-DIğI sürece` at B2
while İstanbul puts them at C1 and Yeni Hitit at B2. I followed Maarif. Nobody would be shocked
to see any of the `-DIğI …` phrases one level either way.

## Things I did not force into a European shape

Turkish A1 is much larger than A1 in the other languages here (36 topics against the brief's
suggested 15-30, and against Maarif's own 45), and B1 is smaller. That is real, not padding:
Turkish front-loads morphology. A learner cannot produce a single well-formed A1 sentence
without vowel harmony, consonant mutation, at least one case suffix and a personal ending, so
all of that has to be A1. What European A1 spends on articles, gender agreement and auxiliary
choice, Turkish spends on suffix shape.

Correspondingly, there is no topic for articles, gender, or "to be" — Turkish has none of them.
`tr.a1.copula-present` names the absence explicitly so a sentence writer does not go looking for
a verb that is not there.

Relative and subordinate clauses are not one topic. They are seven: `-(y)An` (A2), `-DIk` and
`-(y)AcAk` participles, `-DIğInI` and `-mAsInI` nominalisations, `-DIğI için` and `-DIğI zaman`
(all B1), plus the converb series `-ArAk`/`-Ip`/`-mAdAn` (A2) and `-IncA`/`-ken`/`-DIkçA`/
`-Ir …-mAz` (B1). Splitting them this way is what the Turkish sources do, and it is also what
lets a reviewer test one thing at a time.

## Note on the `test` fields

The project stores one orthographic word as one token glossed by its lexical stem, so a suffix
is invisible to any word-level check. Every `test` here therefore names the suffix in the shape
it takes on the surface — "a word ending in `-dıkça/-dikçe/-dukça/-dükçe` (or `-tıkça` after a
voiceless stem)", not "a proportional converb". A reviewer can run their eye along the surface
form and answer yes or no.

Two consequences worth knowing:

- The `mI` topic is the one case where the grammar *is* visible to a word-level check: `mi`,
  `mı`, `mu`, `mü` are separate tokens. If they are ever glossed to a stem, that gloss should be
  the question particle, not a word.
- The morphophonology topics (`vowel-harmony-*`, `consonant-*`) can only be tested by comparing
  two words in the same sentence. Their tests are written that way on purpose, and a
  single-word sentence cannot exercise them.

## On verifying rather than remembering

The brief warned that an earlier Turkish pass invented words. Every example sentence in `tr.json`
was built from stems already present in this project's own `languages/_bank/*.json` Turkish
column wherever possible, and each was checked suffix by suffix for harmony, buffer consonants
(`-(y)-`, `-(s)-`, the pronominal `n`), consonant softening (`kitap → kitabı`, `git- →
gideceğim`) and assimilation (`market → markette`). Where a form is irregular or
register-marked — `görülesi`, `binmişliğim`, `masmavi` — the note says so rather than presenting
it as ordinary.
