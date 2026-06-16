# Vocabularify Bank — CEFR A1 layer

Date: 2026-06-16. File: `languages/_bank/a1.json`.

Multilingual concept bank: each row is ONE concept translated into all 7 languages
(en, de, fr, es, it, tr, ru), to be projected into arbitrary language pairs.

## Conventions applied
- Nouns carry citation article where the language uses one: de (der/die/das), fr (le/la/l'/les),
  es (el/la), it (il/lo/la/l'). en/tr/ru bare.
- Verbs as infinitive in every language (en uses "to ...").
- Adjectives/adverbs/function words bare, dictionary citation form.
- Output is literal Unicode (no \u escapes), one row per line.

## Count
180 concepts (target range 130–180). All rows have all 7 keys, non-empty; English values unique.

## Coverage
Function words & connectors (and/or/but/with/not/yes/no/because/very/also...), question words,
pronouns (I/you/he/she/we/they), numbers 0–10, days of the week, all 12 months, time words
(day/night/week/month/year/hour/morning/evening), 10 colours, family (mother/father/brother...),
basic body parts, food & drink (water/bread/milk/coffee/tea/apple/egg/meat/fish...), house &
objects (house/room/door/window/table/chair/bed/book/car/phone/money), places (city/street/
school/shop/work), nature/animals (sun/dog/cat), ~30 high-frequency verbs (to be/have/go/come/
eat/drink/want/can/speak/see/know/do/say/read/write/give/buy/live/work/sleep...), ~18 basic
adjectives (big/small/good/bad/new/old/hot/cold/happy/beautiful/easy/difficult...), greetings &
politeness (hello/goodbye/please/thank you/sorry).

## Sources used (A1 scoping)
- Goethe-Zertifikat A1 (Start Deutsch 1) official Wortliste — German A1 word/subject areas.
  https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf
- The Oxford 3000 by CEFR level (A1 band) — Oxford Learner's Dictionaries.
  https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf
- General CEFR A1 syllabi / common beginner topic clusters (numbers, days, months, colours,
  family, food, house, body, greetings, core verbs).

Translation accuracy was the priority: genders/articles checked per language
(e.g. de das Wasser, fr l'eau (f), es el agua, it l'acqua; ru gender-correct adjectives such as
красный/синий/жёлтый/чёрный/белый). Turkish given bare (no definite article); the modal "can" and
the privative "without" use the natural Turkish suffix forms (-ebilmek, -siz) as dictionary-style
citations.

## ~20 sample rows for review
en | de | fr | es | it | tr | ru

and | und | et | y | e | ve | и
not | nicht | ne... pas | no | non | değil | не
I | ich | je | yo | io | ben | я
three | drei | trois | tres | tre | üç | три
Monday | der Montag | le lundi | el lunes | il lunedì | pazartesi | понедельник
August | der August | août | agosto | agosto | ağustos | август
year | das Jahr | l'année | el año | l'anno | yıl | год
red | rot | rouge | rojo | rosso | kırmızı | красный
white | weiß | blanc | blanco | bianco | beyaz | белый
mother | die Mutter | la mère | la madre | la madre | anne | мать
woman | die Frau | la femme | la mujer | la donna | kadın | женщина
water | das Wasser | l'eau | el agua | l'acqua | su | вода
bread | das Brot | le pain | el pan | il pane | ekmek | хлеб
house | das Haus | la maison | la casa | la casa | ev | дом
money | das Geld | l'argent | el dinero | il denaro | para | деньги
to be | sein | être | ser | essere | olmak | быть
to eat | essen | manger | comer | mangiare | yemek | есть
can | können | pouvoir | poder | potere | -ebilmek | мочь
beautiful | schön | beau | hermoso | bello | güzel | красивый
thank you | danke | merci | gracias | grazie | teşekkür ederim | спасибо
