# Phase 2 — French-from-English (`languages/fr/en/`) normalization

Date: 2026-06-15. Scope: **a1.json and a2.json ONLY**.

`b1.json`, `b2.json`, `c1.json` were intentionally **left untouched** — the audit (`fr_en.md` §1) confirmed they are byte-for-byte copies of the English-target (`en/fr`) dataset and are slated for full re-authoring in a later phase.

---

## Task A — Normalize French articles in `word_2`

Definite articles (le / la / l' before vowel or mute h / les) added to common nouns that lacked one. Verbs (infinitives), adjectives, adverbs, pronouns, numbers, interjections, and multi-word non-noun phrases were left bare, as were entries already carrying an article (un/une/le/la/l'/les).

### a1.json
- 9 noun entries normalized:
  - Split / malformed forms collapsed to the definite-article form: `eau / l'eau` → `l'eau`; `état / l'état` → `l'état`; `Attention / l'attention` → `l'attention`; `Un gouvernement` → `le gouvernement`.
  - Bare nouns articled: `enfer` → `l'enfer`; `or` (gold) → `l'or`; `anniversaire` → `l'anniversaire`; `contrôle` → `le contrôle`; `copain` → `le copain`.
- Pre-existing un/une/le/la/l' articles (397 entries) left as authored.
- Genuinely ambiguous bare tokens left untouched (e.g. `rire`, `dieu`, `idiot`, `nouvelle` — verb/adjective/proper-noun overlap), per the conservative rule.
- Count unchanged: **990** (no entries added or removed in a1).

### a2.json
- **197 articles added** to nouns (a2 previously had 0 articles).
- Web-verified genders worth noting:
  - `poêle` (frying pan) → **la poêle** (masculine `le poêle` = a heater/stove; the cooking utensil is feminine). Source: Larousse.
  - `primeur` (greengrocer) → **le primeur** (common usage for the shop/seller; Larousse lists the noun as feminine when meaning early produce — masculine retained for the profession/shop sense).
- `internet` left bare (commonly used article-free / proper-noun-like).
- `l'` applied before vowel/mute-h nouns: `l'hôpital, l'employé, l'oignon, l'entrée, l'argent liquide, l'huile, l'œuf, l'ordinateur, l'infirmier, l'addition, l'ingrédient, l'après-shampoing, l'email, l'évier, l'orange, l'assiette, l'éponge, l'écharpe, l'étudiant, l'aéroport, l'auberge, l'enregistrement, l'eau, l'année, l'amour, l'arbre, l'avion, l'ami`.
- Plurals articled with `les`: `les frites, les nouilles, les sous-vêtements, les sandales, les gants, les pâtes, les bottes, les vêtements, les boucles d'oreilles, les bijoux, les chaussures, les chaussettes, les bagages, les courses`.

## De-duplication (consequence of articling)

Adding articles made many a2 nouns identical to existing a1 entries. Per the audit recommendation (keep the lowest valid CEFR level), the redundant a2 copy was removed.

- **101 a2 entries removed as cross-level duplicates** (bare French target already present in a1). This includes 13 non-noun entries (verbs/adjectives) that were already exact lexical duplicates of a1 (`couper, boire, payer, marcher, courir, rester, acheter, sentir, voler, attraper, vendre, manger, laver, conduire, monter` — verbs; `cher, heureux, grand, vieux, petit` — adjectives) and ~88 nouns (`pain, téléphone, hôpital, mère, garçon, dîner, service, cousin, café, professeur, carte, glace, fille, école, client, clé, chambre, message, rue, prix, départ, livre, temps, lettre, famille, musique, argent, robe, voiture, pays, thé, train, ami, bière, avion, marché, mois, père, soir, hôtel, arbre, film, table, porte, cuisine, docteur, jour, femme, chef, billet, ville, oncle, chat, taxi, nuit, maison, poisson, fenêtre, journal, bar, bébé, amour, enfant, travail, homme, bateau, frère, matin, semaine, année, sac, eau, verre, tante, boîte, chien` and the bedroom/water/store sense variants).
- **5 a2 entries removed as within-file collapses** — same French word listed twice under different English glosses, which would have become identical articled entries: `magasin` (shop/store), `pantalon` (trousers/pants), `serviette` (napkin/towel), `biscuit` (biscuit/cookie), `boutique` (boutique/store). One copy of each retained.

a2 count: **334 → 228**.

---

## Task B — Misclassification moves between a1 and a2

**0 moves.** The audit (§3) noted the clearest misclassifications are the whole-file b1/b2/c1 issues (out of scope here) and b1-level everyday words that live in the skipped files. After the cross-level de-duplication above realigned every shared word to its lowest level (a1), the remaining a2 set is a thematically coherent A2 vocabulary (food, household, shopping, travel). No remaining a1↔a2 entry was clearly mis-leveled enough to justify a move without either creating a duplicate or being speculative, so none were made (conservative per brief).

---

## Verification (Node)

| Check | a1 | a2 |
|-------|----|----|
| JSON parses | OK | OK |
| Count | 990 | 228 |
| Within-file exact dups | 0 | 0 |
| Within-file `word_2` dups | 0 | 0 |
| Trailing newline | yes | yes |
| Line format (`    {"word_1": "...", "word_2": "..."}`) | all rows pass | all rows pass |

Cross-level identical `word_2` between a1 and a2: **0**.

Accents stored non-escaped (e.g. `hôpital`, `l'œuf`, `café`); 4-space indent, one entry per line, spaces after colons preserved.

### Before / after counts
- a1: 990 → 990 (9 nouns articled/normalized; no add/remove)
- a2: 334 → 228 (197 articles added; 106 entries removed: 101 cross-level dups + 5 within-file collapses)
- b1 / b2 / c1: untouched (105 / 125 / 109) — reserved for re-authoring.
