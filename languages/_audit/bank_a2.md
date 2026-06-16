# CEFR A2 Vocabulary Bank — Audit

## Output
- File: `languages/_bank/a2.json`
- Format: JSON array, one concept row per line; each row has all 7 languages (en, de, fr, es, it, tr, ru).
- **Concept count: 246**
- No `\u` escapes (literal Unicode), all 7 keys non-empty per row, English values unique, fully disjoint from `a1.json`.

## Methodology
A2 = elementary, one step beyond A1. A1 basics (core pronouns, numbers 0–10, days/months, base colours, immediate family, basic food, the most frequent verbs like to be/to have/to go, base adjectives) are already covered in `a1.json`, so this layer deliberately selects **different, genuinely A2-level concepts**: a wider verb set (communication, mind, movement, transactions), connectors and time/frequency adverbs, and topical noun sets for travel, work/jobs, health/body, weather/seasons, shopping/food, home, leisure, and nature.

### Themes covered
- **Verbs (~75):** to decide, to explain, to invite, to remember, to forget, to bring, to send, to receive, to answer, to ask, to call, to meet, to wait, to begin, to finish, to change, to try, to pay, to cook, to wash, to travel, to fly, to drive, to choose, to order, to book, to rent, to repair, to enjoy, to prefer, to allow, to promise, to teach, etc.
- **Connectors / function words:** so, then, if, that, although, while, before, after, during, until, between, against, about.
- **Time & frequency adverbs:** early, late, often, sometimes, usually, again, already, still, soon, together, alone, maybe, really, almost, enough, too much.
- **Weather & seasons:** weather, rain, snow, wind, cloud, sky, storm, temperature, season, spring, summer, autumn, winter.
- **Travel & directions:** trip, holiday, ticket, passport, luggage, airport, station, train, plane, bus, hotel, map, left, right, straight, near, far, corner, bridge, square.
- **Work / jobs:** job, office, company, meeting, boss, colleague, doctor, teacher, student, nurse, waiter, salary.
- **Health & body:** health, illness, pain, fever, medicine, pharmacy, hospital, tooth, arm, leg, back, stomach, heart.
- **Feelings & adjectives:** sad, angry, tired, afraid, surprised, nervous, bored, proud, worried, hungry, thirsty, sick, healthy, strong, weak, clean, dirty, full, empty, heavy, light, dark, bright, quiet, loud, dangerous, important, true, free, busy, ready, wrong.
- **Home, shopping, food, leisure, nature:** kitchen, bathroom, floor, wall, garden, key, clothes, shoe, shirt, jacket, size, price, market, vegetable, fruit, cheese, sugar, rice, soup, lunch, dinner, restaurant, menu, bill, music, film, game, party, gift, letter, newspaper, question, answer, problem, idea, story, language, country, world, sea, mountain, river, tree, flower, animal, bird, place, way, number.

## Conventions applied
- Nouns carry citation article: de der/die/das; fr le/la/l'/les; es el/la/los/las; it il/lo/la/l'/i/gli/le. en/tr/ru bare.
- Verbs as infinitive in every language (en "to ...").
- Adjectives/adverbs/function words bare.

## Verification (Node)
- `JSON.parse` succeeds.
- 246 rows, each with exactly 7 non-empty keys.
- English values unique; zero overlap with `a1.json`.
- No `\u` escapes; file ends with `]` + trailing newline.

## Sources
- Goethe-Zertifikat A2 Wortliste (official, ~1300 lexical units): https://www.goethe.de/pro/relaunch/prf/en/Goethe-Zertifikat_A2_Wortliste.pdf
- Oxford 3000 by CEFR level: https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf
- ESL-Lounge A2 CEFR Vocabulary Word List: https://www.esl-lounge.com/student/reference/a2-cefr-vocabulary-word-list.php
- ESL-Lounge A2 English Verbs (Communication, Mind & Actions): https://www.esl-lounge.com/student/reference/a2-cefr-vocabulary-word-list-verbs.php
- LanGeek English A2 Vocabulary (Elementary): https://langeek.co/en/vocab/category/6/a2-level

## Sample rows (en | de | fr | es | it | tr | ru)
- to decide | entscheiden | décider | decidir | decidere | karar vermek | решать
- to explain | erklären | expliquer | explicar | spiegare | açıklamak | объяснять
- to invite | einladen | inviter | invitar | invitare | davet etmek | приглашать
- to remember | sich erinnern | se souvenir | recordar | ricordare | hatırlamak | помнить
- because → (A1) / so | also | donc | así que | quindi | bu yüzden | поэтому
- weather | das Wetter | le temps | el tiempo | il tempo | hava | погода
- airport | der Flughafen | l'aéroport | el aeropuerto | l'aeroporto | havalimanı | аэропорт
- passport | der Reisepass | le passeport | el pasaporte | il passaporto | pasaport | паспорт
- doctor | der Arzt | le médecin | el médico | il medico | doktor | врач
- health | die Gesundheit | la santé | la salud | la salute | sağlık | здоровье
- medicine | das Medikament | le médicament | el medicamento | il medicinale | ilaç | лекарство
- tired | müde | fatigué | cansado | stanco | yorgun | усталый
- angry | wütend | fâché | enfadado | arrabbiato | kızgın | сердитый
- left | links | gauche | izquierda | sinistra | sol | налево
- right | rechts | droite | derecha | destra | sağ | направо
- restaurant | das Restaurant | le restaurant | el restaurante | il ristorante | restoran | ресторан
- to pay | bezahlen | payer | pagar | pagare | ödemek | платить
- ticket | die Fahrkarte | le billet | el billete | il biglietto | bilet | билет
- summer | der Sommer | l'été | el verano | l'estate | yaz | лето
- to travel | reisen | voyager | viajar | viaggiare | seyahat etmek | путешествовать
