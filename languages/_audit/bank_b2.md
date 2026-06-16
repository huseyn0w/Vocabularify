# CEFR B2 Vocabulary Bank — Audit

## Overview
Upper-intermediate (B2) layer of the multilingual vocabulary bank. Translations across 7 languages: en, de, fr, es, it, tr, ru. All entries are genuine B2-level concepts (academic/discourse vocabulary, argumentation verbs, abstract/process nouns, formal connectors, evaluative adjectives, media/work/society register) and are disjoint from a1.json.

## Count
- **206 rows**, each with 7 non-empty keys.
- English values unique; zero overlap with a1.json.
- Verified via Node: parses cleanly, no missing keys, no duplicates, no `\u` escapes, file ends with `]` + trailing newline.

## Themes covered
- **Formal connectors / discourse markers:** however, nevertheless, consequently, furthermore, whereas, thus, hence, nonetheless, accordingly, thereby, ultimately, arguably, notably.
- **Argumentation / academic verbs:** to acknowledge, to assess, to imply, to encompass, to argue, to demonstrate, to indicate, to interpret, to justify, to contradict, to clarify, to conclude, to distinguish.
- **Abstract / process nouns:** assumption, consequence, prerequisite, distribution, hypothesis, criterion, implication, phenomenon, framework, scope, extent, proportion, procedure.
- **Evaluative / academic adjectives:** significant, explicit, tentative, comprehensive, crucial, substantial, ambiguous, plausible, objective, subjective, feasible, inevitable, controversial.
- **Media / work / society register:** society, government, policy, economy, media, audience, survey, budget, investment, contract, deadline, employer, employee.

## Sources (research-grounded)
- Oxford 3000 / Oxford 5000 by CEFR level — Oxford Learner's Dictionaries: https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000 and https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000_by_CEFR_level.pdf
- OPAL (Oxford Phrasal Academic Lexicon) — academic discourse vocabulary reference.
- English Vocabulary Profile (EVP), English Profile (Cambridge): https://englishprofile.org/?menu=english-vocabulary-profile
- Goethe-Zertifikat B2 Wortliste (Goethe-Institut): https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_B2.pdf
- ESL-lounge B2 CEFR Vocabulary Word List: https://www.esl-lounge.com/student/reference/b2-cefr-vocabulary-word-list.php

## Conventions applied
- Nouns carry citation article: de der/die/das; fr le/la/l'/les; es el/la/los/las; it il/lo/la/l'/i/gli/le. en/tr/ru bare.
- Verbs infinitive in all languages (en "to ...").
- Adjectives / adverbs / connectors bare.
- Same concept across all 7 languages; gender/article double-checked for es/it and case/aspect for ru/tr.

## Sample rows (~20) — en | de | fr | es | it | tr | ru
- however | jedoch | cependant | sin embargo | tuttavia | ancak | однако
- nevertheless | dennoch | néanmoins | no obstante | ciononostante | yine de | тем не менее
- consequently | folglich | par conséquent | en consecuencia | di conseguenza | sonuç olarak | следовательно
- whereas | wohingegen | tandis que | mientras que | mentre | oysa | тогда как
- to acknowledge | anerkennen | reconnaître | reconocer | riconoscere | kabul etmek | признавать
- to assess | bewerten | évaluer | evaluar | valutare | değerlendirmek | оценивать
- to imply | andeuten | impliquer | implicar | implicare | ima etmek | подразумевать
- to encompass | umfassen | englober | abarcar | comprendere | kapsamak | охватывать
- to distinguish | unterscheiden | distinguer | distinguir | distinguere | ayırt etmek | различать
- assumption | die Annahme | la supposition | la suposición | il presupposto | varsayım | предположение
- consequence | die Folge | la conséquence | la consecuencia | la conseguenza | sonuç | последствие
- prerequisite | die Voraussetzung | la condition préalable | el requisito previo | il prerequisito | ön koşul | предпосылка
- distribution | die Verteilung | la distribution | la distribución | la distribuzione | dağılım | распределение
- hypothesis | die Hypothese | l'hypothèse | la hipótesis | l'ipotesi | hipotez | гипотеза
- phenomenon | das Phänomen | le phénomène | el fenómeno | il fenomeno | olgu | явление
- significant | bedeutend | significatif | significativo | significativo | önemli | значительный
- comprehensive | umfassend | complet | exhaustivo | esauriente | kapsamlı | всесторонний
- tentative | vorläufig | provisoire | provisional | provvisorio | geçici | предварительный
- ambiguous | mehrdeutig | ambigu | ambiguo | ambiguo | muğlak | двусмысленный
- ultimately | letztlich | finalement | en última instancia | in definitiva | nihayetinde | в конечном счёте
