# Pilot: does grammar-topic coverage work for A1 German?

Scope: the 73 sentences in `languages/_course/a1.sentences.json`, judged against the 23 topics in `languages/_grammar/de.json` (level `a1`). Judged strictly: a topic is credited only when the sentence's German text actually satisfies the topic's `test` field, not when it's merely plausible or thematically related.

Bottom line up front: **11 of 23 topics have 5 or fewer sentences, and 5 of 23 have zero.** Three of the five zero topics (Perfekt with haben, Perfekt with sein, past-participle formation) are a pure sentence-writing gap — every word needed already exists in the 188-word taught list, nobody just wrote the sentence. One (separable-prefix verbs) needs a new word, but the wider 1202-word bank already has candidates. One (genitive with proper names) needs a word category the course has never taught at all — a personal name — and the current bank has no personal names, only two place names (Berlin, Aachen).

---

## 1. Coverage table

| Topic id | Name | Count | Sentence ids |
|---|---|---|---|
| de.a1.present-sein-haben | Present of sein/haben | 47 | 006,007,008,009,010,011,016,020,022,023,024,025,026,028,030,031,032,033,034,035,036,038,039,041,042,043,044,045,047,048,050,051,052,053,054,055,056,057,059,061,063,064,066,067,070,071,072 |
| de.a1.articles-gender | Articles by gender | 38 | 015,016,017,022,023,025,026,027,029,030,032,033,034,035,036,037,038,039,040,041,044,045,047,048,050,053,056,057,058,059,060,061,062,063,064,066,067,069 |
| de.a1.coordinating-connectors | und/oder/aber/denn | 28 | 007,008,011,014,016,022,023,024,028,036,037,038,040,041,042,048,050,051,052,054,055,057,059,060,061,063,066,068 |
| de.a1.questions-w-and-yes-no | W- and yes/no questions | 14 | 001,006,009,018,019,020,023,026,039,043,046,065,070,072 |
| de.a1.modal-verbs-present | Modal + infinitive | 11 | 018,019,023,029,038,046,050,062,065,068,069 |
| de.a1.verb-bracket-satzklammer | Verbal bracket | 11 | (same 11 as above — see note) |
| de.a1.noun-plural | Plural formation | 7 | 031,045,046,047,048,049,050 |
| de.a1.dative-case | Dative for indirect object | 8 | 001,002,003,004,018,039,058,065 |
| de.a1.prepositions-fixed-case | für/ohne/um, mit/von/bei/nach/aus/zu | 6 | 012,013,017,031,037,038 |
| de.a1.word-order-verb-second | V2 with inversion | 6 | 002,003,004,010,040,041 |
| de.a1.nominative-accusative | den/einen for direct object | 5 | 015,025,033,060,069 |
| de.a1.negation-nicht-kein | nicht/kein | 5 | 004,019,062,068,072 |
| de.a1.possessive-determiners | mein/dein/etc. | 5 | 024,035,037,070,071 |
| de.a1.personal-pronouns-case | Pronoun case | 9 | 001,002,003,004,018,019,039,058,065 |
| de.a1.imperative | du/ihr/Sie imperative | 3 | 027,036,058 |
| de.a1.present-strong-verbs-vowel-change | Strong-verb vowel change | 1 | 017 |
| de.a1.two-way-prepositions-an-in | an/in, acc. vs dat. | 1 | 037 |
| de.a1.present-weak-verbs | Weak-verb present | 6 | 037,040,046,048,060,072 |
| de.a1.separable-prefix-verbs | Separable prefix | **0** | — |
| de.a1.perfekt-haben | Perfekt with haben | **0** | — |
| de.a1.perfekt-sein | Perfekt with sein | **0** | — |
| de.a1.past-participle-formation | Participle formation | **0** | — |
| de.a1.genitive-proper-names | Genitive -s on names | **0** | — |

Note on the verb-bracket row: every verbal-bracket instance in this sentence set comes from a modal + infinitive (kann...sehen, will...kaufen, etc.). No sentence has a separable-prefix verb, so the bracket topic's other legal source (finite verb ... detached prefix) never fires. The two topics are effectively redundant here — they always co-occur, and no sentence exercises them independently.

3 sentences hit **no** A1 topic at all: a1_005 ("Ja, bitte. Danke und tschüss!"), a1_021 ("Fleisch oder Fisch?"), a1_073 (a bare number countdown). All three are single-word/fragment exchanges with no finite verb.

---

## 2. Full per-sentence tagging

Format: id — German text — topics hit (short reasoning where the call isn't obvious).

- **a1_001** Hallo! Wie geht es dir? — T9 (Wie+geht), T15/T22 (dir, dative object of the idiomatic geht-construction)
- **a1_002** Mir geht es gut, danke. — T4 (Mir fronted, geht 2nd, es follows), T15/T22 (mir)
- **a1_003** Ja, mir geht es sehr gut, danke! — T4, T15/T22
- **a1_004** Nein, mir geht es nicht gut. — T4, T8 (nicht + adjective gut), T15/T22
- **a1_005** Ja, bitte. Danke und tschüss! — none (no finite verb; "und" joins two interjections, not clauses)
- **a1_006** Wo bist du? Ich bin hier. — T1, T9
- **a1_007** Er ist hier und sie ist dort. — T1, T21
- **a1_008** Wir sind hier, und sie sind dort. — T1, T21
- **a1_009** Entschuldigung! Wer bist du? — T1, T9
- **a1_010** Jetzt habe ich Zeit. Und du? — T1, T4 (Jetzt fronted, habe 2nd, ich follows — textbook example)
- **a1_011** Er ist hier, und wir sind auch hier. — T1, T21
- **a1_012** Kaffee mit Milch, bitte! — T16 (mit, fixed dative)
- **a1_013** Ich will Tee ohne Milch. — T16 (ohne, fixed accusative). Not T11: "will" has no dependent infinitive here.
- **a1_014** Du trinkst Tee, und ich trinke Wasser. — T21 only. trinken is a strong verb with no present-tense vowel change, so it hits neither T2 nor T3 — see §4.
- **a1_015** Ich esse Brot und einen Apfel. — T5, T7 (einen Apfel, masc. acc. direct object)
- **a1_016** Das Frühstück ist gut, aber ich will mehr Brot. — T1, T5, T21
- **a1_017** Er isst ein Ei mit Salz. — T3 (isst, e→i), T5, T16 (mit)
- **a1_018** Kannst du mir bitte helfen? — T9 (verb-first question), T11/T12 (kannst...helfen), T15/T22 (mir, dative object of helfen)
- **a1_019** Entschuldigung, ich kann dich nicht verstehen. Kannst du bitte langsam sprechen? — T8 (nicht+verstehen), T9, T11/T12 (both clauses), T22 (dich, accusative)
- **a1_020** Warum bist du hier? Ich bin hier, weil ich lernen will. — T1, T9. The weil-clause ("weil ich lernen will") is genuinely verb-final, correct German — but that's A2 grammar (de.a2.subordinate-clauses-weil-dass), not on the A1 list, so it scores nothing here. See §4.
- **a1_021** Fleisch oder Fisch? — none (no verb; oder joins two nouns)
- **a1_022** Das Wasser ist kalt, aber der Tee ist sehr heiß. — T1, T5, T21
- **a1_023** Ich habe Geld, und ich will Brot kaufen. Wo ist das Geschäft? — T1, T5, T9, T11/T12 (will...kaufen), T21
- **a1_069** Ich will den Fisch kaufen. Wie viel Geld? — T5, T7 (den Fisch), T11/T12. "Wie viel Geld?" has no verb, so it doesn't add a T9 hit.
- **a1_024** Dies ist mein Haus, und es ist sehr groß. — T1, T10 (mein), T21
- **a1_025** Das Zimmer hat einen Tisch, einen Stuhl und ein Bett. — T1, T5, T7 (einen Tisch, einen Stuhl)
- **a1_026** Entschuldigung, wo ist die Tür? Das Fenster ist dort. — T1, T5, T9
- **a1_027** Öffne das Fenster und schließe die Tür, bitte! — T5, T14 (two du-imperatives). Not T21: imperative clauses have no subject, so they don't demonstrate "verb-second word order" — they're verb-first by construction.
- **a1_028** Dieses Buch ist neu, und das Buch ist alt. — T1, T21. The second "das" here is tagged as the concept "that" (a this/that contrast with "Dieses"), not the definite article "the" — so despite looking like one, it isn't an instance of T5. Demonstrative determiners aren't covered by any A1 topic at all.
- **a1_029** Ich kann ein kleines, schönes Haus sehen. — T5, T11/T12 (kann...sehen)
- **a1_030** Die Familie ist groß: eine Mutter, ein Vater, ein Sohn und eine Tochter. — T1, T5
- **a1_031** Alle Kinder sind hier mit den Eltern. — T1, T16 (mit den Eltern, dative plural, clearly marked by "den"). Not T5 or T6: plural articles don't distinguish gender, and "Alle Kinder" has no number or plural article attached to trigger the plural test (see §4).
- **a1_032** Die Mutter ist hier, aber der Vater nicht. — T1 only. The second clause elides its verb ("der Vater [ist] nicht [hier]"), so nicht doesn't visibly precede a verb/adjective/adverb (T8 fails) and the clause has no verb to show verb-second order (T21 fails). A genuine, common construction the test wording doesn't anticipate.
- **a1_033** Ich habe einen Bruder und eine Schwester. — T1, T5, T7 (einen Bruder)
- **a1_034** Der Mann und die Frau sind Freunde. — T1, T5. "Freunde" is a real plural but has no number or article, so T6 doesn't fire.
- **a1_035** Ich weiß, wo du wohnst. Der Mann ist mein Freund. — T1, T5, T10 (mein). "wo du wohnst" is an embedded question with the verb pushed to clause end (verb-final) — again A2-style syntax with no A1 slot; it also fails T9 because the verb doesn't immediately follow "wo" (the subject "du" intervenes).
- **a1_070** Hallo! Wie ist dein Name? — T1, T9, T10 (dein)
- **a1_036** Komm her, bitte! Diese Straße ist groß, und die Schule ist hier. — T1, T5, T14 (Komm), T21
- **a1_037** Ich wohne in der Stadt, und ich komme zu deinem Haus. — T2 (wohne, weak verb), T5, T10 (deinem, dative possessive ending), T16 (zu, fixed dative), T17 (in der Stadt, static location = dative — the only two-way-preposition example in the whole set), T21
- **a1_038** Wir haben ein neues Auto, und wir können schnell zur Schule gehen. — T1, T5, T11/T12 (können...gehen), T16 (zur = zu+der, fixed dative), T21
- **a1_039** Der Morgen ist schön! Wie geht es dir heute? — T1, T5, T9, T15/T22 (dir)
- **a1_040** Heute arbeite ich den ganzen Tag, und ich schlafe die ganze Nacht. — T2 (arbeite), T4 (Heute fronted, arbeite 2nd, ich follows), T5 (den/die correctly gendered), T21. Not T7: "den ganzen Tag" is an accusative of duration, not a direct object — the test specifically says direct object, and arbeiten/schlafen are intransitive here. See §4 for this gap.
- **a1_041** Gestern war der Abend schwierig, aber morgen ist ein neuer Tag. — T1 (via "ist" only), T4, T5, T21. "war" is Präteritum of sein — real past tense, and Präteritum of sein isn't an A1 topic at all (it's de.a2.simple-past-haben-sein-modals). An A1-vocabulary sentence is quietly using A2 tense morphology. See §4.
- **a1_042** Heute ist Montag, und morgen ist Dienstag. — T1, T21. Not T4: "Heute ist Montag" has no clear subject following the verb distinct from the predicate noun, so inversion isn't demonstrably shown.
- **a1_043** Ist heute Mittwoch, Donnerstag oder Freitag? — T1, T9 (verb-first question)
- **a1_044** Samstag und Sonntag sind gut: Ich schlafe den ganzen Tag. — T1, T5 (den ganzen Tag, masc. acc. correctly gendered)
- **a1_045** Ich habe zwei Brüder und eine Schwester. — T1, T5 (eine, tagged as the concept "one" but functioning exactly like the feminine indefinite article here), T6 (zwei Brüder)
- **a1_046** Wann kannst du kommen? Ich arbeite heute fünf Stunden. — T2 (arbeite), T6 (fünf Stunden), T9, T11/T12 (kannst...kommen)
- **a1_047** Das Haus hat vier Zimmer, fünf Fenster und sechs Türen. — T1, T5, T6 (vier Zimmer, fünf Fenster, sechs Türen — Zimmer/Fenster are invariant plurals, credited loosely since the numeral removes any ambiguity; see §4)
- **a1_048** Die Woche hat sieben Tage, und ich arbeite fünf Tage. — T1, T2 (arbeite), T5, T6 (sieben/fünf Tage), T21
- **a1_049** Ich will zehn Äpfel, neun Eier und acht Fische. — T6 (zehn Äpfel, neun Eier, acht Fische)
- **a1_050** Das Kind ist zehn Jahre alt, und es will immer lernen. — T1, T5, T6 (zehn Jahre), T11/T12 (will...lernen), T21
- **a1_051** Januar und Februar sind kalte Monate, aber Juni ist heiß. — T1, T21. "kalte Monate" is a real plural but has no numeral or article, so T6 doesn't fire.
- **a1_052** März und April sind kalt, aber Mai ist schön. — T1, T21
- **a1_053** Das Wasser ist hier nie kalt, weil die Sonne immer heiß ist. — T1, T5. Another correct verb-final weil-clause with no A1 slot (see a1_020). "nie" isn't covered by T8 (only nicht/kein are).
- **a1_054** Juli und August sind heiße Monate, und ich bin sehr glücklich. — T1, T21
- **a1_055** September, Oktober und November sind kalt, aber Dezember ist schön. — T1, T21
- **a1_056** Der Dezember ist ein glücklicher Monat: Die Familie ist hier. — T1, T5
- **a1_057** Das Auto ist rot, und das Haus ist weiß. — T1, T5, T21
- **a1_058** Gib mir das schwarze Telefon, bitte! — T5, T14 (Gib, irregular imperative), T15/T22 (mir, dative indirect object — a clean ditransitive example)
- **a1_059** Die Tür ist grün, das Fenster ist blau, und der Stuhl ist gelb. — T1, T5, T21
- **a1_060** Ich liebe den Hund, und das Kind liebt die Katze. — T2 (liebe/liebt), T5, T7 (den Hund), T21
- **a1_061** Der Hund ist braun, und die Katze ist grau. — T1, T5, T21
- **a1_062** Ich kann das orange Buch oder das rosa Telefon nicht finden. — T5, T8 (nicht+finden), T11/T12 (kann...finden)
- **a1_063** Die Straße ist lang, aber der Tag ist kurz. — T1, T5, T21
- **a1_064** Das Kind hat große Augen, kleine Hände und kleine Füße. — T1, T5. Three genuine plurals (Augen, Hände, Füße), none with a numeral or article, so none trigger T6 — the biggest single instance of the recurring plural-undercounting issue (see §4).
- **a1_065** Ich kann nicht alle Bücher nehmen. Was kann ich machen? Kannst du mir helfen? — T9, T11/T12 (three modal+infinitive instances), T15/T22 (mir). Not T8: "nicht alle Bücher" negates a quantified noun phrase, not a verb/adjective/adverb, so it falls outside the test's literal wording (see §4). Not T6: "alle Bücher" has no numeral/article.
- **a1_071** Mein Kopf, meine Hände und meine Füße sind kalt. — T1, T10 (Mein/meine, three times). Same plural gap as a1_064.
- **a1_066** Die Arbeit ist schwierig, aber das Geld ist gut. — T1, T21
- **a1_067** Der Kaffee ist schlecht und teuer. Der Tee ist gut und günstig. — T1 only. "und" here joins adjective pairs, not clauses.
- **a1_068** Ich kann lesen und schreiben, aber ich kann nicht schnell sprechen. — T8 (nicht+schnell, adverb), T11/T12 (kann...sprechen), T21 (aber joins the two kann-clauses)
- **a1_072** Was sagst du? Ich weiß nicht! Es ist nicht einfach. — T1, T2 (sagst), T8 (nicht+einfach only), T9. "Ich weiß nicht" does **not** count for T8 under a literal reading — nicht follows the verb here rather than preceding it, and the test's wording ("nicht before a verb, adjective, or adverb") doesn't describe this extremely common end-position clausal negation. See §4 — this is probably the clearest case of the test wording itself being wrong, not the sentence.
- **a1_073** Zehn, neun, acht, sieben, drei, zwei, eins, null! — none (numerals only, no noun to pluralize, no verb)

---

## 3. The zero-count topics: can the current word list even express them?

Judged against the 188 concepts actually taught in `languages/_course/a1.json` (not the full 1202-row bank).

**de.a1.separable-prefix-verbs — impossible with the 188 taught words, fixable from the wider bank.**
None of the 188 taught verb concepts (gehen, kommen, geben, öffnen, schließen, sehen, finden, nehmen, machen, lesen, schreiben, sagen, sprechen, helfen, verstehen, lernen, kaufen, trinken, essen, wollen, haben, sein, arbeiten, wohnen, wissen, schlafen, lieben) translate to a separable-prefix verb in German. There is no way to construct this topic without adding a new verb. The wider 1202-row bank already has good candidates that fit the existing word set semantically: `aufstehen` (to get up), `einkaufen` (to shop), `fernsehen` (to watch TV), `anfangen` (to start), `anmachen`/`ausmachen` (to turn on/off), `anziehen` (to put on), `abholen` (to pick up). Any one of these, taught and then used in a main clause, would satisfy the topic. Cost: one new word.

**de.a1.perfekt-haben, de.a1.perfekt-sein, de.a1.past-participle-formation — not a vocabulary gap at all.**
This is the most important finding of the three. The 188-word list already contains everything needed: "to have" (habe) and "to be" (bin/ist) are taught, and so are verbs whose participles are common A1 material — lernen→gelernt, kaufen→gekauft, essen→gegessen, trinken→getrunken, arbeiten→gearbeitet for Perfekt-with-haben; gehen→gegangen, kommen→gekommen for Perfekt-with-sein. "Ich habe Deutsch gelernt" or "Ich bin nach Hause gekommen" (Hause isn't taught, but "Ich bin gekommen" is) are fully constructible today. These three topics are at zero because nobody wrote a Perfekt sentence, not because the course lacks the words for one. Fixing this costs 3 sentences and 0 new vocabulary.

**de.a1.genitive-proper-names — impossible with the 188 taught words, and the wider bank barely helps.**
The topic's test requires "a proper name with an -s ending." The 188-word list contains zero proper names — every taught word is a common noun, verb, adjective, or function word. Checking the wider 1202-row bank for proper nouns turns up exactly two: `Berlin` and `Aachen` (both city names; no personal names anywhere in the bank). So even reaching into the full bank, the only way to build this topic is a place-name genitive like "Berlins Straßen sind lang" (Straße and lang are already taught) rather than the person-name pattern the topic's own example uses ("Karls Auto ist neu"). That's workable, but it means either: (a) accept a place-name genitive as satisfying the topic, which is a looser reading than the topic's own illustrative example, or (b) add an actual personal name to the course — a vocabulary category (proper names of people) the course has never taught at any level, as far as this bank shows. This is the one topic where "just add a sentence" doesn't cover it — it needs a new kind of word, not just a new arrangement of existing ones.

---

## 4. Answer: how many new sentences, and what's impossible?

Counting only what's needed to get every topic to at least 1 sentence (not to a healthy count):

- **3 sentences, 0 new words**: Perfekt-haben, Perfekt-sein, past-participle-formation. All buildable today from the 188-word list (e.g., "Ich habe Brot gekauft.", "Ich bin gekommen.", pick any weak/strong verb already taught for the participle-formation example itself — it can piggyback on one of the two Perfekt sentences).
- **1 sentence, 1 new word**: separable-prefix verbs, once one candidate (aufstehen, einkaufen, fernsehen, anfangen, anmachen, anziehen, or abholen) is promoted from the 1202-row bank into the taught 188.
- **1 sentence, 1 new word of a kind the course has never used**: genitive-proper-names. The bank supplies "Berlin" or "Aachen" as a workaround, but that only satisfies the topic under a looser reading than its own example (a place, not a person). If the linter is going to insist on a person's name specifically, this topic is genuinely impossible without inventing a new vocabulary category from scratch — the course would need to introduce and teach at least one personal name, something nothing in the current 1202-row bank supports.

So: **5 sentences minimum to reach full 23/23 coverage**, of which 4 are free rewrites of existing capability and 1 (genitive-proper-names) is the real finding — not because it's linguistically hard, but because the course's word bank has no vocabulary category for personal names at all, at any of the four levels checked (a1 bank browsed; not exhaustively checked for a2/b1/b2, but sources should be checked before assuming higher levels fix this for free).

Beyond "at least 1," the coverage picture in §1 shows a second problem the pilot should flag even though it's not "impossible": eleven topics sit at 5 or fewer sentences, several of them (present-strong-verbs-vowel-change: 1, two-way-prepositions-an-in: 1, imperative: 3) thin enough that a single sentence being cut or reworded during editing would silently zero them out again. A coverage linter that only checks ">=1" will pass a course that is one edit away from failing.

---

## 5. Test-field problems found by actually applying them

The task asked specifically what turned out unusable — these `test` fields were written before ever being checked against real sentences, and several show it.

1. **de.a1.negation-nicht-kein's wording doesn't cover the single most common A1 negation pattern.** The test says "nicht before a verb, adjective, or adverb." But the ordinary way to negate a simple main-clause verb with no other complement — "Ich weiß nicht" (I don't know) — puts nicht *after* the verb, at the very end of the clause. That's correct, idiomatic German, arguably the first negation pattern most A1 learners produce, and the test's literal wording excludes it. I did not credit a1_072's "Ich weiß nicht" for this topic as a result. Either the wording needs "after" added for clause-final negation, or the topic needs a linter-side rule that treats this differently from the "nicht before an adjective/adverb" case, which is a different structure.

2. **de.a1.noun-plural's trigger condition ("used with a number greater than one or with a plural article") systematically excludes the most common way plurals actually appear: a bare plural noun with an adjective and no article at all.** Sentences like a1_064 ("große Augen, kleine Hände, kleine Füße") and a1_071 ("meine Hände und meine Füße") contain unambiguous, correctly-formed plurals that the test can't credit because there's no numeral and no article — German simply doesn't require one here. Of roughly a dozen genuine plural nouns across the 73 sentences, only 7 sentences' worth actually trigger the test as written; the rest (a1_034, a1_051, a1_054, a1_064, a1_071, and the "Alle Kinder" in a1_031) are real plurals the test can't see. This test field needs a third trigger: "or with an adjective/possessive and no article, where the noun's own plural form is the only marker" — otherwise it will always undercount.

3. **de.a1.articles-gender is so broad it's barely diagnostic.** Any correctly-gendered der/die/das/ein/eine in the whole corpus counts, and that's nearly every sentence with a common noun (38 of 73) — because German almost never produces a wrong-gender article by construction. This isn't wrong, but it means a coverage tool built on this test will always report this topic as "well covered" regardless of whether the sentence set is actually testing gender knowledge in any demonstrable way. Worth deciding up front whether this topic should even be scored per-sentence, or treated as a background property of the whole course.

4. **de.a1.nominative-accusative's test says "for a direct object" but real A1 sentences also produce accusative case for duration/time expressions** (den ganzen Tag, die ganze Nacht — a1_040, a1_044), which are genuinely accusative but not direct objects of a transitive verb. The test correctly excludes these per its own wording, but that means a real, common German accusative pattern (accusative of time) has no A1 topic at all to be credited against — it's invisible to this whole grammar list, not just under-tested.

5. **The A1 sentence set already contains A2 syntax that no A1 topic can catch, because the grammar list is scoped by level and the sentences aren't.** Three sentences (a1_020, a1_035, a1_053) have grammatically correct subordinate clauses with the verb pushed to clause-final position (weil, and an embedded wo-question) — that's de.a2.subordinate-clauses-weil-dass territory, not on the A1 list at all. One sentence (a1_041) uses "war," the Präteritum of sein, which is de.a2.simple-past-haben-sein-modals, not de.a1.present-sein-haben. None of this is a test-field bug exactly — it's a sign that the sentence bank and the grammar-topic list were built independently and don't fully agree on what "A1" means. A grammar linter built only from the A1 topic list will wave these sentences through without ever registering that they're using A2 morphology, which could mask real problems if it's later relied on as an A1/A2 boundary check.

6. **Ambiguity between demonstrative "das/that" and definite article "das/the," and between numeral "eine/one" and indefinite article "eine/a," is real and already present in the data** (a1_028, a1_045). Both cases turned out gradable by hand from the token's `c` field, but a naive surface-string grammar checker (matching "das" or "eine" as strings) would get de.a1.articles-gender wrong in both directions — crediting a demonstrative as an article, or (depending on implementation) failing to credit a numeral that's functioning as one. Any automated version of this linter needs to use the `c` concept tag, not the surface `t` string, to disambiguate.

7. **Bare/glue tokens (articles, some case-inflected forms like "zur") sit outside the taught-word system entirely** — they appear as plain strings in `text.de`, never as `{t,c}` objects, and therefore never count against the "only words already taught" rule. This matters directly for §4's cost estimates: adding a genitive-proper-name sentence needs one new *taught* word (the name itself), but the articles, case endings, and punctuation around it are free regardless of course level. Worth stating explicitly in any spec for the new linter, since it changes what "cost" means when scoping new sentences.

8. **A topic can clear the ">=1 sentence" bar and still only demonstrate a fraction of its own paradigm.** Two examples worth naming since they don't show up in a simple count: negation (de.a1.negation-nicht-kein) is credited 5 times, but every single instance is nicht — kein never appears anywhere in the 73 sentences, so half the topic (the noun-phrase-negation half its own name promises) is untested. Personal pronoun case (de.a1.personal-pronouns-case) is credited 9 times, but only three oblique forms ever occur across the whole set — mir, dir, and dich, used once each in the accusative case. mich, er/ihn, wir/uns, ihr/euch, and sie/ihnen never appear at all, so the "case changes by role" idea is demonstrated for 2 pronouns out of 6-7, never contrastively (the topic's own example sentence, "Ich sehe ihn, und er sieht mich," uses two forms that don't exist anywhere in the course). Similarly, of the nine prepositions listed under de.a1.prepositions-fixed-case, only mit, ohne, and zu ever appear — für, um, von, bei, nach, and aus are all at zero even though the topic as a whole isn't. A coverage tool that stops at "topic present: yes/no" will miss all of this.
