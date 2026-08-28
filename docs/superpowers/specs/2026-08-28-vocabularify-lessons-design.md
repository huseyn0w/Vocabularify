# Lessons and sentences

Design spec. 2026-08-28.

## Problem

Words are shown in file order. The order has no rationale. No word is ever used
for anything. A learner sees 180 A1 cards and never once assembles them into a
phrase.

## Idea

Words arrive in lessons of 5 to 10. After each lesson, 2 or 3 sentences are
shown. Every sentence is built only from concepts already covered: the current
lesson plus every earlier one. The pool grows, so sentences get richer as the
course goes on.

A word is learned in isolation, then seen at work.

Scope: the desktop app. The mobile app is untouched in this pass, but the data
format is designed so mobile can adopt it later without a redesign.

## Constraints inherited from the product

`PRODUCT.md` states the purpose as ambient exposure, not drilling, and lists
gamified language apps as an anti-reference. The marketing page promises "no
lessons, no streaks, no studying".

The passive presentation does not break that promise. A sentence arrives on its
own, like any other card, with nothing to press.

The assemble exercise is active, so it ships opt-in and off by default. That is
the same shape as Checkup, which the marketing page already describes as "a
light, optional self-test".

No points, no streaks, no confetti.

## Levels are independent

Concepts are already partitioned across levels by the bank. The course reorders
only within a level. So the set of concepts known on entry to B1 is fully
determined: everything in A1 and A2, whatever their internal order.

Each level can therefore be authored independently. The input is "everything
already known" plus "your level's concepts". The `uses` subset-of-known check is
local to a level.

## Word forms

Bank entries are citation forms. German `sein`, `der Ingenieur`. A sentence
needs `bin` and `Ingenieur`. The strings do not match.

Matching by string works only for English. For the other six languages it would
either produce broken sentences or almost none at all.

So a sentence links to concepts, not to strings. Each token carries both its
surface form and its concept id. The UI underlines concept-backed tokens; on
hover it shows the bank card the token came from (`bin` -> `sein` / `быть`).

Side benefit: the learner sees grammar in action rather than a table of it.

## Data

The concept id is the English string from the bank, trimmed and lowercased.
That is already the de facto key: `utils/generate_pairs.js` dedupes on
`norm(row.en)`. So the bank row `{"en": "I", ...}` has the id `"i"`.

### `languages/_course/<level>.json`

The course order, in lessons.

```json
{
  "level": "a1",
  "lessons": [
    { "id": 1,
      "new": ["hello", "i", "to be", "good", "day"],
      "sentences": ["a1_001", "a1_002"] },
    { "id": 2,
      "new": ["you", "how", "and", "thank you", "yes", "no"],
      "sentences": ["a1_003", "a1_004"] }
  ]
}
```

Every concept of the level appears in exactly one lesson. A lesson introduces 5
to 10 new concepts.

### `languages/_course/<level>.sentences.json`

The sentence bank. One sentence, all 7 languages, tokenised.

```json
{
  "id": "a1_001",
  "uses": ["hello", "i", "to be", "good"],
  "text": {
    "de": [{"t":"Hallo","c":"hello"}, ",", {"t":"ich","c":"i"},
           {"t":"bin","c":"to be"}, {"t":"gut","c":"good"}, "."],
    "ru": [{"t":"Привет","c":"hello"}, ",", {"t":"я","c":"i"},
           {"t":"хорошо","c":"good"}, "."]
  }
}
```

A token object is a word backed by a concept: `t` is the surface form exactly as
it appears in the sentence, capitalisation included, so a sentence-initial token
differs from its bank entry by case. `c` is the concept id. A bare string is
glue: punctuation and obligatory function words such as articles and
prepositions. Glue is restricted to a per-language whitelist.

There is no separate plain-text field. Joining the tokens is the sentence.
The join rule is one space between tokens, and no space before `, . ! ? ; :` or
after an opening bracket or an apostrophe elision such as French `l'`.

The rule has one implementation, in `src/shared/items.ts`. Three places need
it: the lint, the generator, and the renderer drawing one element per token.

Files under `src/renderer/` compile to classic scripts and cannot import
anything, so the rule is split rather than copied. `layoutTokens` resolves
spacing into data - each token gains a `space` flag and its concept id -
and `joinTokens` is the string form built on top. The main process lays a
sentence out before sending it, and the renderer only concatenates.

`utils/*.js` require the compiled `out/shared/*.js`, so `yarn compile` runs
before them. That coupling is deliberate: two copies of this rule would drift,
and a drifted copy produces sentences that lint clean and render wrong.

The Russian rendering shows the normal case: the present-tense copula does not
exist, so `to be` simply has no token. `uses` is the union across all 7
languages. Every language must fit inside `uses` plus the glue whitelist.

### `utils/validate_course.js`

Validates the course. It doubles as the feedback loop for the authoring agents,
who run it until it is clean. The rules themselves live in `src/shared/course.ts`
so they are unit-testable; this is a thin CLI over the compiled build.

`--languages en` restricts it to one column, for the pass where the course and
the English sentences exist and the other six have not been translated yet.

Checks:

- every concept of the level appears in exactly one lesson;
- `uses` is a subset of the concepts unlocked by the end of that sentence's
  lesson, counting all earlier levels;
- `uses` contains at least one concept introduced by that sentence's own lesson.
  A sentence hung off lesson 7 that only recycles lesson 1 does not reinforce
  lesson 7;
- every token is either backed by a concept in `uses` or present in the glue
  whitelist for that language;
- the sentence exists in all 7 languages;
- joining the tokens yields connected text: no double spaces, no space before a
  comma or full stop;
- no empty surface forms, no duplicate sentence ids;
- every sentence id referenced by a lesson exists, and every sentence in the
  bank is referenced by exactly one lesson.

### Projection

The per-pair lessons file is written by `utils/generate_pairs.js`, in the same
pass that writes the word file.

It has to be. That script drops a concept from a pair when its target word
collides with one already emitted: the bank holds both `she -> sie` and
`they -> sie`, so for any `de/*` pair one of them never reaches the word file.
Lesson word counts are therefore per pair, and tallying them anywhere other
than inside that dedupe would let the lesson boundaries drift.

A sentence may use a concept that was dropped for its pair. That needs no
handling: the concept was dropped precisely because its target word is identical
to one already shown as a card.

Output, per pair: `languages/<to>/<from>/<level>.lessons.json`

```json
{ "lessons": [
    { "count": 5,
      "sentences": [
        { "id": "a1_001",
          "target": [{"t":"Hallo","c":"hello"}, ",", "..."],
          "source": "Привет, я хорошо." } ] } ] }
```

`count` is the number of words in that lesson, for this pair. Running sums give
the lesson boundaries inside the word file. `target` holds the tokens of the
language being learned. `source` is a plain string; the known-language side
needs no tokens.

Each sentence also carries a `gloss`: the citation form and translation of every
concept it uses, so the renderer can show what `bin` came from without loading
the bank.

### `utils/generate_pairs.js`

If `_course/<level>.json` exists, the pair file is written in course order.
Otherwise behaviour is unchanged.

The format of `languages/<to>/<from>/<level>.json` does not change. `word_1` is
the known language, `word_2` the language being learned, as
`languages/en/ru/a1.json` shows: `{"word_1":"и","word_2":"and"}`. The mobile
app's `app/utils/types.ts` documents the opposite; that comment is wrong and
does not affect the data.

## Desktop code

### `src/shared/items.ts` (new) and `types.ts`

Today `Phrase = string` and `toPhrases` joins with `" - "`. The display needs an
item model.

```ts
export type SentenceToken = string | { t: string; c: string };

export type Item =
  | { kind: 'word'; source: string; target: string }
  | { kind: 'sentence'; id: string; source: string; target: SentenceToken[] };
```

`buildItems(vocabulary, lessons?)`. Without `lessons`, a flat list of word items
in file order, matching today's behaviour. With `lessons`, the lesson's words,
then its sentences, then the next lesson.

`nextIndex`, `prevIndex` and `clampIndex` are unchanged. `splitPhrase` and
`PHRASE_SEPARATOR` stay for the menu bar and dictionary import.

### `src/main/phraseEngine.ts`

`load()` reads the word file, then looks for a sibling `<level>.lessons.json`.
If present it builds items with lessons; if not, a flat list. Nothing else
changes: same index, same timer, same `onRender`.

A sentence dwells longer than a word. `SENTENCE_DWELL_MULTIPLIER = 2` in
`constants.ts`. The timer restarts using the current item's kind.

### IPC and renderer

`IPC.DISPLAY_PHRASE` currently carries a string; it now carries an `Item`. That
touches `src/index.ts` (`renderPhrase`), `src/preload/main.ts` and
`src/renderer/main.ts`.

The word card does not change.

The sentence card shows the target language large and the translation muted
below it. Concept-backed tokens carry a thin underline; hovering one reveals its
citation form and translation. Same entrance animation as a word card.

Menu bar mode renders a sentence as a single line with no translation. Long
sentences will be truncated by the system. Acceptable at A1; recorded as a risk.

### Assemble mode

A toggle in the Settings Playback panel, next to Sound, off by default.

It sits with Sound rather than with the Mode chips because, like Sound, it
layers on top of whatever mode is active. Checkup is a Mode chip because Checkup
and Window are alternatives; assemble and Window are not. Menu Bar mode has no
interaction surface, so assemble is ignored there.

On a sentence card the concept-backed tokens are shuffled and shown as chips.
Glue is already in place. Tapping in order builds the sentence. A wrong chip
shakes. On completion the card becomes an ordinary sentence card and
auto-advance resumes.

Auto-advance is suspended while an unsolved card is on screen. Timing past an
unsolved exercise makes no sense.

### State

`currentIndex` now indexes items rather than words. The list length has changed,
so a restored value must be clamped.

Progress now means something, so it should stop being destroyed on a pair
switch. New field on `AppState`:

```ts
progress: Record<string, number>  // "de:ru:a1" -> item index
```

It must be added to `normalizeState` in `src/shared/state.ts`, or `saveState`
will silently drop it on write.

State is currently only written on quit (`app.on("will-quit")`), so a crash
loses it. Add a write on lesson boundary.

## Content

Volume: 1049 concepts, roughly 140 lessons, 2 to 3 sentences each, so about 285
sentences across 7 languages, near 2000 renderings.

A1 is authored first, in one pipeline, and proofread by hand. That validates the
prompts, the lint rules and the format. A2 through C1 follow as four parallel
pipelines once A1 is approved.

`languages/_audit/SUMMARY.md` records coined non-words and swapped columns from
the original bank generation, where the task was simpler. Human proofreading is
not optional here.

Turkish is authored on a stronger model than the other five: it is
agglutinative and the least represented of the seven.

Two reviewers per language, with different jobs rather than two of the same:

- reviewer A, native speaker: naturalness, word order, case, conjugation,
  register;
- reviewer B, teacher: level fit, the "only learned words" rule, and whether
  each glue-whitelist entry is justified.

Either rejection rewrites the sentence. Mechanical checks (tokens matching the
text, concept coverage) are the lint's job, not a reviewer's.

The A1 bank is missing possessives (`my`, `your`) and demonstratives (`this`).
Those get added to `languages/_bank/a1.json` and the pairs regenerated.

## Out of scope

- Spaced repetition. Progress stays a position in a course, not a per-word
  memory model.
- Mobile. Data stays compatible; the app is not changed.
- A2 through C1 content until A1 is approved.
- Custom dictionaries get no sentences. They fall back to the flat word flow,
  which is the same code path as a level with no course file.

## Verification

1. `node utils/generate_course.js --dry-run` is clean on all five levels.
2. `node utils/generate_pairs.js` writes 210 files in course order.
3. `yarn test` covers `buildItems`, lesson boundaries, index clamping and the
   `progress` migration.
4. `yarn typecheck`.
5. `yarn start`, de/ru, A1. Step through lesson 1 with Shift and arrows. The
   sentence appears after the fifth word and contains no unseen word.
6. Hovering `bin` shows `sein` / `быть`.
7. With assemble on, the timer holds until the sentence is solved.
8. An imported custom dictionary behaves as before, with no sentences.
9. Switching de/ru -> fr/en -> back preserves the A1 de/ru position.
10. Read five sentences per level in Russian and English.
