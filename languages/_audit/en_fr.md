# Audit — English-from-French (`languages/en/fr/`)

**Date:** 2026-06-15 · **Mode:** REPORT-ONLY (no JSON modified)
**Pair convention:** directory `<to>/<from>` = `en/fr` → source = French, target (being learned) = English. So `word_1` *should* be French and `word_2` should be English. CEFR level rates the difficulty of the **English** target.

**Files (raw row counts):** a1=980, a2=480, b1=105, b2=125, c1=109 — **total 1799 rows.**

---

## 0. CRITICAL: column orientation is inconsistent (SWAPPED in 4 of 5 files)

Detected via an accent heuristic (French diacritics `àâäéèêëîïôöùûüÿçœæ` should cluster on the French side).

| File | accents in word_1 | accents in word_2 | French side | Verdict |
|------|------:|------:|---|---|
| a1 | 157 | 0 | word_1 | **Correct** (FR=word_1, EN=word_2) |
| a2 | 1 | 105 | word_2 | **SWAPPED** (word_1=EN, word_2=FR) |
| b1 | 0 | 35 | word_2 | **SWAPPED** |
| b2 | 0 | 67 | word_2 | **SWAPPED** |
| c1 | 0 | 42 | word_2 | **SWAPPED** |

Spot-check confirms it: a1 = `{"word_1":"y","word_2":"there"}` (FR→EN, correct); a2 = `{"word_1":"apple","word_2":"pomme"}` (EN→FR, swapped). Only **a1** follows the documented convention. **a2/b1/b2/c1 have the columns reversed** and should be flipped so `word_1`=French, `word_2`=English. All analysis below normalizes each file to EN-target / FR-source before comparing, so the counts are orientation-independent.

---

## 1. DUPLICATES

Methodology: each file normalized to (EN target, FR source); keys compared case-insensitively, trimmed. "Pure" cross-level dup = same English target **and** same French gloss. "Same-key/diff-value" = same English target, different French gloss (a real conflict, not a free deletion).

### 1a. Within-file duplicates

| File | Exact-dup rows (same EN+FR) | Same-EN / different-FR rows |
|------|------:|------:|
| a1 | 0 | 41 |
| a2 | **136** | 5 |
| b1 | 17 | 0 |
| b2 | **65** | 0 |
| c1 | 0 | 0 |

**Within-file removable (exact dup rows): 0 + 136 + 17 + 65 + 0 = 218 rows.**

Capped examples:
- **a2 exact:** `apple/pomme ×2`, `book/livre ×2`, `food/nourriture ×3`, `water/eau ×4`, `friend/ami ×2` — a2 is heavily padded with repeats.
- **b2 exact:** `variable/variable ×4`, `coefficient/coefficient ×3`, `regression/régression ×3`, `concept/concept ×2`, `framework/cadre ×2`.
- **b1 exact:** `investment ×2`, `profit ×2`, `loss ×2`, `revenue ×2`, `expense ×2`.
- **a1 same-EN/diff-FR (legit polysemy/conflicts, NOT free deletes):** `there → [y, là]`, `here → [voilà, ici]`, `work → [travailler, le travail]`, `you(object) → [toi, te]`, `finish → [terminer, finir]`.
- **a2 same-EN/diff-FR:** `pepper → [poivron, poivre×4]` (poivron=bell pepper vs poivre=spice — genuine ambiguity, and poivre itself is repeated), `store → [magasin, boutique]`.

### 1b. Cross-level duplicates (English target shared across ≥2 levels, after within-file dedup)

- **PURE identical (same EN + same FR): 21 distinct words → 21 removable rows** (drop from the higher level, keep the lowest valid level).
- **Same EN / different FR: 54 distinct words** — conflicts to reconcile, not blind deletes.

**Level-combo distribution:**

| Combo | Count |
|------|------:|
| a1+a2 | 48 |
| a1+b1 | 9 |
| b2+c1 | 7 |
| a2+b1 | 4 |
| b1+b2 | 4 |
| a1+a2+b1 | 3 |

Pure-dup examples with recommended lowest-valid keep:
- `sad`, `to take`, `to leave`, `new`, `strong`, `beautiful`, `to arrive` → **keep a1** (drop a2)
- `colleague`, `employee`, `cost`, `customer` → **keep a2** (drop b1)
- `analysis` → **keep b1** (drop b2)

Same-EN/different-FR examples (reconcile, do not auto-delete): `car (a1 une voiture / a2 voiture)`, `work (a1 travailler / a2 travail)`, `bathroom (a1 les toilettes / a2 salle de bain)`, `ring (a1 sonner / a2 bague)`, `room (a1 une salle / a2 chambre)`, `service (a1 le service / a2 service / b1 service)`. Many of these are just the **article/casing difference** introduced by a1's "le/la/un/une" prefixes vs a2's bare nouns — a normalization issue more than a content conflict.

### Removable totals

| Category | Removable rows |
|------|------:|
| Within-file exact dups | 218 |
| Cross-level PURE dups | 21 |
| **Total safely removable (no meaning lost)** | **~239** |

That is roughly **13% of the 1799 rows** removable with zero loss of distinct content. The 54 cross-level diff-value + 46 within-file diff-value words need human reconciliation (mostly article/normalization cleanup) and are excluded from the removable count.

---

## 2. LEVEL-FIT (English target vs CEFR level)

**Methodology (honest):** judged by general English frequency bands and the conventional CEFR expectation that the *target* word matches the learner's level. This is a frequency/usage judgment, not a corpus-calibrated score — treat severities as informed estimates, not measurements. The audit is also constrained by the swapped columns (handled) and by a1 mixing prefixed and bare forms.

### Per-level impression

- **a1 (939 unique EN):** Mostly appropriate true-beginner vocabulary (there, here, water, dog, eat, big). **But** the file is polluted with grammar fragments and gloss artifacts that are not single learnable words: `you(formal)`, `your(pl formal)`, `that/who`, `which(n)`, `its/his/her(m)`, `theft/flight`, `to find/think`, `s/he/themselves`, `1 eye`, `a guy3`, `a kid 2`. Severity: **MEDIUM** — content level is fine, but data hygiene is poor.
- **a2 (339 unique EN):** Largely fine A1–A2 concrete nouns (food, clothes, kitchen, travel verbs). A handful skew B1+: `fishmonger`, `greengrocer`, `conditioner`, `vinegar`, `department store`. Severity: **LOW-MEDIUM** (a few items too rare/specific for A2). The bigger a2 problem is duplication, not mis-leveling.
- **b1 (88 unique EN):** Coherent business/work-life theme. Several items are genuinely A2/B1 borderline and arguably belong lower: `company`, `service`, `customer`, `client`, `bank`, `cost`, `price`, `team`, `meeting`. Severity: **MEDIUM** (set is narrow + several too easy for B1).
- **b2 (60 unique EN):** Tightly scoped to research/statistics methodology (hypothesis, regression, coefficient, qualitative). Internally consistent and genuinely B2/C1-flavored, but **monothematic** — not a general B2 vocabulary set. Severity for *level* = LOW; severity for *coverage* = HIGH.
- **c1 (109 unique EN):** Strong, genuinely advanced/academic register (epistemology, dichotomy, propensity, heterogeneous, utilitarian). Best-fit file of the five. `recontextualize` is borderline non-standard. Severity: **LOW**.

### Clearest misclassifications

| Word | In | Should be ~ | Why |
|------|----|----|----|
| `company`, `service`, `customer`, `client`, `bank`, `price`, `cost` | b1 | A2 | High-frequency everyday business words |
| `fishmonger`, `greengrocer` | a2 | B1+ | Low-frequency, region-specific |
| `conditioner`, `vinegar` | a2 | B1 | Beyond A2 core |
| grammar fragments (`you(formal)`, `which(n)`, `s/he/themselves`) | a1 | n/a | Not single dictionary words — should be removed/reworked |

### Data-quality flags
1. **Column orientation reversed in a2/b1/b2/c1** (section 0) — the single most important fix.
2. **a1 article inconsistency:** a1 prefixes nouns (`une voiture`, `le train`, `un thé`) while a2 uses bare forms (`voiture`, `train`, `thé`) — this manufactures most of the 54 "diff-value" cross-level conflicts. Standardize one convention.
3. **a1 gloss/disambiguation artifacts:** `1 eye`, `a guy3`, `a kid 2`, `theft/flight`, `to find/think`, slash-separated multi-glosses.
4. **Massive intra-file padding** in a2 (136 dup rows) and b2 (65 dup rows).
5. **b2/c1 same-spelling cognates** like `variable/variable`, `correlation/corrélation` are correct but inflate the "identical" appearance — not errors.

---

## 3. ADDITIONS (high-frequency English missing per level)

> **Underpopulated upper levels:** a1/a2 carry 939+339 unique words while **b1=88, b2=60, c1=109** unique. After removing dups the effective b1/b2 sizes are even smaller. b1 and b2 each need **substantial backfill (roughly 2–4×)** to be usable; b2 in particular is monothematic (stats only) and needs general B2 vocabulary across multiple domains.

Missing high-frequency words (French source → English target):

### a1 (gaps in true-core vocab)
- `bonjour → hello` (present), but missing: `oui/non` basics aside — add `merci beaucoup → thank you very much`, `s'il vous plaît → please`, `pardon → sorry/excuse me`, `bien sûr → of course`, `aujourd'hui → today` (present), `demain → tomorrow` (present). Genuinely missing core: `lundi → Monday`, `mardi → Tuesday` … weekdays, `janvier → January` … months, `rouge/bleu/vert → red/blue/green` (only some colors present), `un/deux/trois… → numbers beyond the few present`, `manger → to eat` (present) but `boire → to drink` (present). **Priority: weekdays, months, full color set, numbers 1–20.**

### a2
- `le temps libre → free time`, `le week-end → weekend`, `les vacances → holiday/vacation`, `la météo → weather` (`weather` present at a1/a2), `le travail → job`, `le rendez-vous → appointment`, `la santé → health`, `le sport → sport`, `l'équipe → team`, `le voyage → journey`, `la gare → station` (present), add `la banque → bank`, `la poste → post office`, `le médicament → medicine`, `l'argent liquide → cash` (present as `cash`).

### b1 (needs broad backfill — currently business-only)
Add everyday-life and emotion/abstract B1 vocab beyond the work theme:
- `l'environnement → environment`, `le changement climatique → climate change`, `la santé → health`, `la société → society`, `l'éducation → education`, `le gouvernement → government`, `la décision → decision`, `l'expérience → experience`, `le comportement → behaviour`, `la relation → relationship`, `le conseil → advice`, `l'opinion → opinion`, `la solution → solution`, `le problème → problem` (present at a1 as `a problem`), `l'avenir → future`, `la culture → culture`, `la tradition → tradition`, `le voyage → trip`, `l'aventure → adventure`, `améliorer → to improve`, `développer → to develop`, `réaliser → to achieve`, `comparer → to compare`, `expliquer → to explain`.

### b2 (most underpopulated relative to scope — needs new domains)
Currently 100% research/stats. Add general academic + abstract B2:
- `l'argument → argument`, `la conséquence → consequence`, `l'impact → impact`, `la perspective → perspective`, `la tendance → trend`, `l'enjeu → issue/stake`, `la contrainte → constraint`, `la priorité → priority`, `l'efficacité → efficiency`, `la durabilité → sustainability`, `l'incertitude → uncertainty`, `la controverse → controversy`, `l'éthique → ethics`, `la perception → perception`, `l'attitude → attitude`, `négocier → to negotiate`, `convaincre → to persuade`, `souligner → to emphasize`, `mettre en œuvre → to implement`, `surmonter → to overcome`, `atténuer → to mitigate`, `mondialisation → globalization`, `inégalité → inequality`, `infrastructure → infrastructure`.

### c1 (best populated; light top-ups)
- `le discernement → discernment`, `la prééminence → preeminence`, `circonscrire → to circumscribe`, `l'idiosyncrasie → idiosyncrasy`, `juxtaposition → juxtaposition`, `l'inférence → inference` (present), `la dichotomie → dichotomy` (present), `ubiquité → ubiquity`, `dérision → derision`, `cohésion → cohesion`, `latent → latent`, `inéluctable → inexorable`.

---

## Summary

- **Orientation:** a1 correct; **a2/b1/b2/c1 columns are swapped** (EN/FR reversed) and must be flipped.
- **Duplicates:** within-file exact = **218 rows** (a2:136, b2:65, b1:17); cross-level **pure** = **21 rows**. **~239 rows safely removable (~13%)**; another ~100 same-EN/diff-FR words need reconciliation (mostly a1 article-prefix normalization).
- **Level-fit:** c1 strong, b2 well-leveled but monothematic, a1 content fine but dirty, **b1 has the clearest mis-leveling** (everyday words like company/customer/price sitting at B1).
- **Additions / underpopulation:** b1 (88) and b2 (60) are badly underpopulated and thematically narrow — both need **2–4× backfill** across new domains; a1 missing core sets (weekdays, months, numbers, full colors).
