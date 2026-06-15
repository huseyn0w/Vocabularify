# Phase 3 — C1 coinage cleanup + word-class backfill: English-from-Russian (`languages/en/ru/`)

Date: 2026-06-16
Pair: `to=en`, `from=ru` → `word_1` = Russian (source), `word_2` = English (target being learned).
CEFR level = difficulty of the **English** target word (`word_2`).

## Task A — Coined / non-standard C1 words

The audit (`en_ru.md` §1.4 / §2 data-quality flags) listed coined transliterations in `c1.json`
(`binarity`, `cyclicity`, `coercivity`, `cumulativity`, `fractality`, `exponentiality`,
`scientificity`, `endemism`). A full programmatic scan of the current `c1.json` (and all five files)
shows **none of these remain on disk** — they were already removed in the phase-2 commit
(`Dictionaries (phase 2): articles + level reassignment`).

Every remaining `word_2` in `c1.json` was checked and is a genuine, dictionary-attested English word.
Suspicious-looking borderline entries were verified via web search and confirmed standard:
- `hybridity` — real (OED, Merriam-Webster; postcolonial-theory / biology term).
- `sagacity` — real (Merriam-Webster, Cambridge).
- `interrelation` — real (Vocabulary.com, Collins; `interrelationship` is the more common variant but `interrelation` is valid).
- `cognizance`, `actualization` — real (OED, Merriam-Webster).
- Other niche-but-real entries left in place: `corpuscle`, `convection`, `atavism`, `archaism`,
  `immanence`, `covariance`, `apologetics`, `codex`, `communique`.

**C1 replacements: 0** — there were no coined / non-standard words left to replace.

## Task B — Word-class backfill (verbs / adjectives / adverbs / function words)

Added genuinely level-appropriate English words (Oxford 3000 for A1–B2, Oxford 5000 for C1),
weighted toward verbs, adjectives, adverbs, and function words. All additions checked against the
full corpus — **zero duplicates** introduced (the add script aborts on any collision by `word_2`).

Note: one initially planned B2 verb, `to constitute`, collided with an existing C1 entry and was
swapped for `to comprise`.

### A1 — 36 added
Verbs: to do, to play, to open, to close, to like, to love, to work, to look, to listen, to walk,
to run, to sleep, to speak, to take, to call.
Adjectives: hot, tall, young, nice, fast, slow, clean, dirty, long, short.
Adverbs: very, well, too, again, always, never, sometimes.
Function words: or, because, my, your.

### A2 — 35 added
Verbs: to try, to show, to bring, to keep, to lose, to win, to pay, to meet, to stay, to travel, to cook.
Adjectives: tidy, sad, angry, tired, hungry, strong, weak, safe, dangerous, full, empty, correct, wrong.
Adverbs: usually, often, rarely, early, late, together, maybe.
Function/nouns: between, opposite, forecast, neighbor.

### B1 — 34 added
Verbs: to agree, to refuse, to suppose, to mention, to convince, to deliver, to arrange, to include,
to connect, to replace, to increase, to reduce, to protect.
Adjectives: accessible, effective, useful, harmful, necessary, ordinary, modern, traditional, active, private, public.
Adverbs: probably, especially, finally, generally, immediately, fortunately.
Function words: although, however, despite, according to.

### B2 — 30 added
Verbs: to attribute, to comprehend, to comprise, to refrain, to facilitate, to allege, to ascribe,
to disseminate, to ascertain, to aggravate, to accumulate.
Adjectives: ambiguous, vulnerable, extensive, notable, in-depth, credible, complex, robust, rigorous, mutual, preliminary.
Adverbs: accordingly, notably, substantially, undoubtedly, explicitly, implicitly, thereby, consequently.

### C1 — 31 added
Verbs: to proclaim, to exacerbate, to appease, to reproach, to refute, to abound, to nuance,
to relegate, to curb, to acquiesce.
Adjectives: tenacious, fleeting, elusive, cumbersome, latent, prudent, steadfast, verbose, scathing,
resourceful, contentious, speculative.
Adverbs: admittedly, retrospectively, ostensibly, inevitably, correspondingly.
Nouns (advanced register): perseverance, acumen, abundance, contingency.

## Per-level counts (before → after)

| Level | Before | After | Added |
|-------|-------:|------:|------:|
| a1 | 250 | 286 | +36 |
| a2 | 255 | 290 | +35 |
| b1 | 131 | 165 | +34 |
| b2 | 117 | 147 | +30 |
| c1 | 143 | 174 | +31 |
| **Total** | **896** | **1062** | **+166** |

## Verification (Node)

- All five files parse as valid JSON.
- Within-file exact duplicates by `word_2`: **0**.
- Cross-level duplicates by `word_2`: **0**.
- Remaining coined words from Task A (`binarity`, `cyclicity`, …): **0**.
- Format preserved: array form, one entry per line, 4-space indent,
  `{"word_1": "...", "word_2": "..."}` with spaces after colons, literal Cyrillic (no `\u`), trailing newline.
