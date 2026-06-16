# CEFR B1 Vocabulary Bank — Audit

## Overview
- File: `languages/_bank/b1.json`
- Level: CEFR B1 (intermediate)
- Languages: en, de, fr, es, it, tr, ru (7)
- Row count: **245**
- Format: JSON array, one row per line; nouns carry citation articles for de/fr/es/it; verbs in the infinitive in all languages; adjectives/adverbs/connectors bare.

## Selection methodology
Concepts were chosen to reflect standard B1 wordlists: opinions and abstract everyday concepts, society, environment, work/career, emotions, describing experiences, intermediate verbs, connectors, and abstractions. All entries are disjoint from `a1.json` and avoid repeating lower-level concepts. Verified unique English headwords and non-empty translations across all 7 languages.

## Sources
- Goethe-Zertifikat B1 Wortliste (official Goethe-Institut B1 vocabulary list, ~2,400 lexical units): https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_B1_Wortliste.pdf
- Oxford 3000 / 5000 by CEFR level (B1 tier — 700 words graded at B1): https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000_by_CEFR_level.pdf
- About the Oxford 3000 and 5000 word lists: https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000
- English Vocabulary Profile (EVP), B1 band (Cambridge) — used as a cross-reference for level assignment.

## Thematic coverage
- Society & abstractions: society, government, politics, economy, development, responsibility, relationship, freedom, peace, war, power, population, community
- Environment: environment, nature, climate, pollution, energy, forest, river, sea, mountain
- Work & career: company, career, profession, colleague, employer, salary, project, skill, success, market, customer, contract
- Emotions & experience: feeling, emotion, fear, hope, joy, anger, sadness, pride, trust, patience, memory, dream
- Health & person: health, illness, medicine, treatment, behavior, habit, character, attitude
- Intermediate verbs: to develop, to influence, to express, to convince, to assume, to behave, to achieve, to avoid, to compete, to support, to protect, to recognize, etc.
- Adjectives: important, necessary, possible, useful, dangerous, responsible, honest, confident, satisfied, disappointed, complicated, etc.
- Connectors/adverbs: however, nevertheless, although, in addition, therefore, moreover, otherwise, meanwhile, despite, in order to, etc.

## Sample entries (en | de | fr | es | it | tr | ru)
- society | die Gesellschaft | la société | la sociedad | la società | toplum | общество
- development | die Entwicklung | le développement | el desarrollo | lo sviluppo | gelişme | развитие
- responsibility | die Verantwortung | la responsabilité | la responsabilidad | la responsabilità | sorumluluk | ответственность
- environment | die Umwelt | l'environnement | el medio ambiente | l'ambiente | çevre | окружающая среда
- career | die Karriere | la carrière | la carrera | la carriera | kariyer | карьера
- to develop | entwickeln | développer | desarrollar | sviluppare | geliştirmek | развивать
- to influence | beeinflussen | influencer | influir | influenzare | etkilemek | влиять
- to express | ausdrücken | exprimer | expresar | esprimere | ifade etmek | выражать
- to convince | überzeugen | convaincre | convencer | convincere | ikna etmek | убеждать
- to assume | annehmen | supposer | suponer | supporre | varsaymak | предполагать
- to behave | sich verhalten | se comporter | comportarse | comportarsi | davranmak | вести себя
- to achieve | erreichen | atteindre | lograr | raggiungere | başarmak | достигать
- responsible | verantwortlich | responsable | responsable | responsabile | sorumlu | ответственный
- confident | selbstbewusst | confiant | seguro de sí mismo | sicuro di sé | kendine güvenen | уверенный
- however | jedoch | cependant | sin embargo | tuttavia | ancak | однако
- nevertheless | trotzdem | néanmoins | no obstante | ciononostante | yine de | тем не менее
- although | obwohl | bien que | aunque | sebbene | rağmen | хотя
- in addition | außerdem | de plus | además | inoltre | ayrıca | кроме того
- therefore | deshalb | donc | por lo tanto | quindi | bu yüzden | поэтому
- in order to | um zu | afin de | para que | al fine di | için | для того чтобы

## Verification (Node)
- JSON parses successfully.
- All 245 rows contain exactly 7 keys, all non-empty.
- English headwords unique (0 duplicates).
- English headwords disjoint from `a1.json` (0 overlaps).
- No `\u` escape sequences (literal Unicode only).
