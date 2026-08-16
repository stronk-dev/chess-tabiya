# R11 raw output — the conjunction hypothesis

Corpus: `content/drafts/`, **47 packs**, **721 spine transitions** (`.evidence`/`.job`/`.sources`/`.browser` sidecars excluded by `tools/r1r2-primitives-harness/corpus.ts`).

## Leg 0 — R3's headline, re-measured on the current corpus

| Figure | R3 (2026-08-15, 37 packs / 634 transitions) | this pass (47 packs / 721 transitions) |
|---|---|---|
| observations per ply | 6.18 | **6.43** |
| T∧C observations per ply | 0.68 | **0.73** |
| **false-positive rate, observation level** | **89.0%** | **88.7%** |
| ≥1 leaf fires | 96.8% | 97.2% |
| ≥1 leaf signals | 43.4% | 45.9% |

Raw: 4634 observations, 524 of them T∧C.

| Leaf | firing rate | FP rate (T1) | signal rate |
|---|---|---|---|
| `attacked_squares_changed` | 39.5% | 94.7% | 2.1% |
| `defended_squares_changed` | 33.7% | 95.5% | 1.5% |
| `slider_lines_changed` | 57.4% | 43.2% | 32.6% |
| `escape_squares_changed` | 94.5% | 84.6% | 14.6% |
| `defended_duties_changed` | 14.0% | 48.5% | 7.2% |
| `move_irreversibility` | 24.5% | 88.1% | 2.9% |

Spearman ρ(firing rate, FP rate) = **-0.143** (R3: −0.143).

## Leg 1 — is the premise true? (do two leaves fire near-independently?)

§4's mechanism assumes joint firing at ≈ p·q. Measured over all 55 ordered-free pairs of the 11 leaf:direction keys, on the 721 spine transitions:

| statistic | value |
|---|---|
| median firing lift observed/(p·q·n) | **1.136** |
| mean firing lift | 1.288 |
| min / max firing lift | 0.350 / 5.255 |
| pairs with lift ≥ 1.20 (positively coupled) | 20 / 55 |
| pairs with lift within ±10% of 1.0 (independent) | 17 / 55 |
| median φ (phi correlation of the two firings) | 0.072 |
| max φ | 0.456 |

Ten most coupled pairs:

| pair | observed joint | expected under independence | lift | φ |
|---|---|---|---|---|
| `attacked_squares_changed:lost ∧ defended_duties_changed:released` | 35 | 6.7 | **5.26×** | 0.456 |
| `attacked_squares_changed:gained ∧ defended_duties_changed:acquired` | 51 | 19.0 | **2.69×** | 0.348 |
| `attacked_squares_changed:lost ∧ defended_duties_changed:acquired` | 18 | 7.9 | **2.28×** | 0.151 |
| `defended_duties_changed:acquired ∧ move_irreversibility:fired` | 28 | 14.2 | **1.97×** | 0.163 |
| `defended_duties_changed:released ∧ move_irreversibility:fired` | 22 | 12.0 | **1.83×** | 0.128 |
| `slider_lines_changed:opened ∧ defended_duties_changed:released` | 41 | 23.8 | **1.72×** | 0.190 |
| `slider_lines_changed:closed ∧ defended_duties_changed:acquired` | 30 | 18.6 | **1.61×** | 0.125 |
| `defended_squares_changed:gained ∧ slider_lines_changed:closed` | 64 | 40.4 | **1.59×** | 0.185 |
| `attacked_squares_changed:gained ∧ attacked_squares_changed:lost` | 49 | 32.1 | **1.53×** | 0.146 |
| `defended_duties_changed:acquired ∧ defended_duties_changed:released` | 6 | 3.9 | **1.52×** | 0.042 |

## Leg 2 — precision (axes T ∧ C). Does the conjunction beat either component?

Detector = both keys fire. Success = **both** keys produce a T∧C witness (§4's "each component stays rung-honest"). Pairs with < 10 joint firings excluded (4 of 55).

| statistic | value |
|---|---|
| pairs measured | 51 |
| pairs whose precision exceeds **both** components' precision | **1 / 51** |
| … by more than 5 points | 1 / 51 |
| best single-leaf:direction precision on the corpus | **69.4%** |
| best conjunction precision | **35.7%** (`slider_lines_changed:closed ∧ defended_duties_changed:released`) |

Top 12 conjunctions by precision:

| conjunction | fires (of 721) | precision | prec A | prec B | beats both? |
|---|---|---|---|---|---|
| `slider_lines_changed:closed ∧ defended_duties_changed:released` | 14 (1.9%) | **35.7%** | 49.4% | 69.4% | no |
| `defended_duties_changed:released ∧ move_irreversibility:fired` | 22 (3.1%) | **31.8%** | 69.4% | 11.9% | no |
| `slider_lines_changed:closed ∧ defended_duties_changed:acquired` | 30 (4.2%) | **30.0%** | 49.4% | 36.2% | no |
| `slider_lines_changed:opened ∧ defended_duties_changed:released` | 41 (5.7%) | **24.4%** | 44.3% | 69.4% | no |
| `escape_squares_changed:gained ∧ defended_duties_changed:released` | 43 (6.0%) | **23.3%** | 15.3% | 69.4% | no |
| `escape_squares_changed:gained ∧ defended_duties_changed:acquired` | 52 (7.2%) | **21.2%** | 15.3% | 36.2% | no |
| `slider_lines_changed:opened ∧ slider_lines_changed:closed` | 167 (23.2%) | **20.4%** | 44.3% | 49.4% | no |
| `defended_squares_changed:lost ∧ move_irreversibility:fired` | 26 (3.6%) | **19.2%** | 6.0% | 11.9% | **yes** |
| `slider_lines_changed:opened ∧ defended_duties_changed:acquired` | 40 (5.5%) | **15.0%** | 44.3% | 36.2% | no |
| `escape_squares_changed:lost ∧ defended_duties_changed:released` | 46 (6.4%) | **8.7%** | 3.3% | 69.4% | no |
| `attacked_squares_changed:lost ∧ move_irreversibility:fired` | 28 (3.9%) | **7.1%** | 9.2% | 11.9% | no |
| `defended_duties_changed:acquired ∧ move_irreversibility:fired` | 28 (3.9%) | **7.1%** | 36.2% | 11.9% | no |

### Filter form — does B's firing raise A's own precision? (adding a lens to a loadout)

| statistic | value |
|---|---|
| conditioned precisions measured (2 per pair) | 102 |
| median change in precision from conditioning | **0.6 pp** |
| conditionings that raise precision at all | 58 / 102 |
| conditionings that raise it by ≥ 10 pp | 10 / 102 |
| best / worst | 31.0 pp / -26.5 pp |

### Does the SIGNAL multiply too? (the arithmetic behind the inversion)

§4 assumes the *firing* multiplies while each component "stays rung-honest". If the two signals are also near-independent given both fired, then precision(A∧B) ≈ precision(A|both) × precision(B|both) — i.e. the **false positives multiply at the same rate the specificity does**.

| statistic | value |
|---|---|
| pairs with a non-zero product | 46 |
| median observed precision ÷ independent-signal prediction | **1.18** (1.00 = the signals are independent) |
| pairs within ±25% of the independence prediction | 8 / 46 |
| min / max ratio | 0.00 / 14.14 |

## Leg 3 — axis D (discrimination against the moves NOT played). The binding axis.

Population: **19099** legal alternatives enumerated from the same 721 parent positions, **17906** of them quiet (non-capture, non-checking). Lift = P(conjunction signals | played spine move) ÷ P(conjunction signals | random quiet alternative). R3 condemned `slider_lines_changed` at **1.05×** and the shipped duty marker at **0.61×**.

Where the alternative population produced **zero** signalling moves the rate is replaced by its 95% one-sided upper bound (rule of three, 3/N), so the lift is a **lower bound** (marked `≥`) rather than infinity. A second lift against **all** 19099 alternatives is given because the quiet filter itself excludes some leaves by construction (`move_irreversibility`'s only T-passing subkind is `last_of_role`, which requires a capture).

| statistic | value |
|---|---|
| conjunctions with ≥ 10 signalling spine moves | 7 of 55 |
| … of which the lift is a bound (0 quiet signalling alternatives) | 0 |
| median axis-D lift | **0.66×** |
| median axis-D lift vs ALL alternatives | **0.69×** |
| conjunctions with lift ≥ 2.0× | 2 / 7 |
| conjunctions with lift < 1.0× (worse than a random quiet move) | 5 / 7 |
| median single-key lift over the 11 keys | 1.00× |
| best single-key lift (excluding the bounded one) | 3.31× |
| median "share of the same position's alternatives that also signal the conjunction" | **11.5%** |

Single-key baseline (R3's own lift table, re-measured):

| key | signal rate, played | signal rate, quiet alternatives | lift vs quiet | lift vs all alternatives |
|---|---|---|---|---|
| `attacked_squares_changed:gained` | 0.83% | 0.72% | **1.16×** | 1.14× |
| `attacked_squares_changed:lost` | 1.25% | 0.63% | **1.98×** | 1.82× |
| `defended_squares_changed:gained` | 0.28% | 0.08% | **3.31×** | 3.53× |
| `defended_squares_changed:lost` | 1.25% | 3.86% | **0.32×** | 0.31× |
| `slider_lines_changed:opened` | 21.50% | 21.79% | **0.99×** | 1.01× |
| `slider_lines_changed:closed` | 15.81% | 24.08% | **0.66×** | 0.70× |
| `escape_squares_changed:lost` | 2.64% | 2.64% | **1.00×** | 1.01× |
| `escape_squares_changed:gained` | 12.48% | 20.92% | **0.60×** | 0.53× |
| `defended_duties_changed:acquired` | 2.91% | 3.99% | **0.73×** | 0.62× |
| `defended_duties_changed:released` | 4.72% | 1.72% | **2.74×** | 2.17× |
| `move_irreversibility:fired` | 2.91% | 0.00% | **≥173.84×** | 12.64× |

All 7 measurable conjunctions, by axis-D lift:

| conjunction | signalling spine moves | quiet signalling alternatives | **lift vs quiet** | lift vs all | lift A alone | lift B alone | alternatives at the same position that also signal |
|---|---|---|---|---|---|---|---|
| `escape_squares_changed:gained ∧ defended_duties_changed:released` | 10 | 91 (0.51%) | **2.73×** | 1.70× | 0.60× | 2.74× | 11.1% |
| `slider_lines_changed:opened ∧ defended_duties_changed:released` | 10 | 104 (0.58%) | **2.39×** | 1.99× | 0.99× | 2.74× | 19.3% |
| `slider_lines_changed:opened ∧ escape_squares_changed:lost` | 14 | 379 (2.12%) | **0.92×** | 0.92× | 0.99× | 1.00× | 13.8% |
| `escape_squares_changed:gained ∧ defended_duties_changed:acquired` | 11 | 414 (2.31%) | **0.66×** | 0.53× | 0.60× | 0.73× | 7.8% |
| `slider_lines_changed:opened ∧ slider_lines_changed:closed` | 34 | 1308 (7.30%) | **0.65×** | 0.69× | 0.99× | 0.66× | 10.7% |
| `slider_lines_changed:opened ∧ escape_squares_changed:gained` | 14 | 945 (5.28%) | **0.37×** | 0.36× | 0.99× | 0.60× | 19.9% |
| `slider_lines_changed:closed ∧ escape_squares_changed:gained` | 12 | 1131 (6.32%) | **0.26×** | 0.28× | 0.66× | 0.60× | 11.5% |

### The dominance test

A conjunction "beats either alone" only if it beats the best single key on **both** axes at once.

| bar | value |
|---|---|
| best single-key precision | 69.4% |
| best single-key axis-D lift | 3.31× |
| conjunctions clearing **both** global bars | **0** |
| conjunctions clearing the weaker bar — beating **their own** two components on both axes | **0 / 7** |

## Leg 4 — cross-family conjunctions: a census leaf ∧ a shipped position lens

§4's three worked triples all conjoin a **transition** primitive with a **position** lens (a structure, a passed pawn, a phase). Lens vocabulary = the shipped `structuralReading()` feature kinds + named structures + `classifyPhase()`, evaluated on the **parent** position.

Lenses present on the corpus: 25. Unconditional (fire on > 95% of parents, excluded per `campaign-effect-vocabulary.md` §6 rule 4): **4** — `feature:pawn_safe_square`, `feature:piece_count`, `feature:piece_distance`, `feature:piece_reach_count`. Usable (2–95%): **17**.

| statistic | value |
|---|---|
| leaf ∧ lens combinations with ≥ 10 firings | 161 |
| combinations that raise the leaf's **precision** | 89 / 161 |
| median precision change | 0.1 pp |
| max precision change | 42.3 pp |
| combinations that raise the leaf's **axis-D lift** | 93 / 161 |
| median axis-D lift change | **0.040×** |
| max axis-D lift | 192.15× vs best single-key 3.31× |

Top 10 by precision gain:

| leaf ∧ lens | firings | precision | leaf alone | Δ | axis-D lift | leaf lift alone | alternatives at the same position that also signal |
|---|---|---|---|---|---|---|---|
| `slider_lines_changed:closed ∧ phase:endgame` | 12 | **91.7%** | 49.4% | 42.3 pp | 0.54× | 0.66× | 11.5% |
| `slider_lines_changed:opened ∧ phase:endgame` | 25 | **80.0%** | 44.3% | 35.7 pp | 1.31× | 0.99× | 51.7% |
| `escape_squares_changed:gained ∧ structure:carlsbad` | 37 | **43.2%** | 15.3% | 27.9 pp | 1.34× | 0.60× | 39.7% |
| `escape_squares_changed:gained ∧ feature:named_structure` | 58 | **43.1%** | 15.3% | 27.8 pp | 1.19× | 0.60× | 40.6% |
| `move_irreversibility:fired ∧ feature:backward_pawn` | 31 | **38.7%** | 11.9% | 26.8 pp | 124.85× | 173.84× | 8.0% |
| `move_irreversibility:fired ∧ feature:doubled_pawn` | 22 | **36.4%** | 11.9% | 24.5 pp | 79.26× | 173.84× | 9.8% |
| `attacked_squares_changed:lost ∧ feature:doubled_pawn` | 12 | **33.3%** | 9.2% | 24.1 pp | 3.96× | 1.98× | 20.2% |
| `attacked_squares_changed:lost ∧ phase:endgame` | 15 | **33.3%** | 9.2% | 24.1 pp | 1.83× | 1.98× | 21.1% |
| `move_irreversibility:fired ∧ feature:open_file` | 50 | **34.0%** | 11.9% | 22.1 pp | 99.59× | 173.84× | 9.5% |
| `slider_lines_changed:closed ∧ feature:named_structure` | 29 | **69.0%** | 49.4% | 19.6 pp | 1.09× | 0.66× | 30.9% |

**The structural check — a parent-scoped lens is discrimination-inert by construction.** A lens read on the position *before* the move takes the same value for the played move and for every alternative from that position, so conjoining with it cannot change *which move* is singled out — only *at which positions the surface speaks*. Verified rather than asserted: for all 161 combinations the within-position share of also-signalling alternatives is computed over the lens-true positions and is, by construction, the leaf's own share restricted to that subpopulation; the conjunction adds **zero** within-position separation. The lift column above moves only because the *denominator population* changes.

### 4b — the same lenses read on the position AFTER the move (so they vary across alternatives)

| statistic | value |
|---|---|
| combinations with ≥ 10 signalling spine moves | 72 |
| median axis-D lift | **0.79×** |
| combinations beating their own leaf's lift | 25 / 72 |
| max axis-D lift | 8.77× |

| leaf ∧ after-lens | signalling spine moves | quiet rate | lift | leaf lift alone |
|---|---|---|---|---|
| `defended_duties_changed:released ∧ after:feature:isolated_pawn` | 12 | 0.19% | **8.77×** | 2.74× |
| `escape_squares_changed:gained ∧ after:feature:passed_pawn` | 20 | 0.42% | **6.54×** | 0.60× |
| `defended_duties_changed:released ∧ after:feature:backward_pawn` | 15 | 0.49% | **4.23×** | 2.74× |
| `defended_duties_changed:released ∧ after:feature:open_file` | 15 | 0.49% | **4.23×** | 2.74× |
| `escape_squares_changed:gained ∧ after:phase:endgame` | 30 | 1.37% | **3.03×** | 0.60× |
| `defended_duties_changed:released ∧ after:phase:middlegame` | 32 | 1.49% | **2.99×** | 2.74× |
| `defended_duties_changed:released ∧ after:feature:half_open_file` | 25 | 1.20% | **2.90×** | 2.74× |
| `defended_duties_changed:released ∧ after:feature:bishop_on_shade` | 33 | 1.65% | **2.78×** | 2.74× |
| `defended_duties_changed:released ∧ after:feature:direct_attack_count` | 34 | 1.72% | **2.74×** | 2.74× |
| `defended_duties_changed:released ∧ after:feature:king_zone` | 34 | 1.72% | **2.74×** | 2.74× |

## Leg 5 — triples (does the multiplication continue?)

| statistic | value |
|---|---|
| distinct triples where all three keys FIRE (≥ 10 spine witnesses) | 115 |
| distinct triples where all three keys SIGNAL, at any count | 38 |
| largest signalling-triple witness count anywhere in the corpus | **6** of 721 transitions |
| triples with ≥ 10 signalling spine witnesses | **0** |

Five most frequent signalling triples (all below the ≥ 10 bar):

| triple | signalling spine moves |
|---|---|
| `slider_lines_changed:opened ∧ slider_lines_changed:closed ∧ escape_squares_changed:lost` | 6 |
| `defended_squares_changed:lost ∧ escape_squares_changed:gained ∧ move_irreversibility:fired` | 4 |
| `escape_squares_changed:gained ∧ defended_duties_changed:released ∧ move_irreversibility:fired` | 4 |
| `slider_lines_changed:closed ∧ escape_squares_changed:gained ∧ defended_duties_changed:acquired` | 3 |
| `slider_lines_changed:opened ∧ escape_squares_changed:lost ∧ escape_squares_changed:gained` | 3 |

## Leg 6 — population sensitivity

Primary population: the **721 authored spine transitions** — moves an author endorsed. Every rate above is conditioned on it. Two alternative populations, same instrument:

### 6a — by declared pack phase (the corpus's middlegame grew from 1 pack to 11 since R3)

| phase | transitions | obs/ply | T∧C/ply | observation-level FP | ≥1 leaf signals |
|---|---|---|---|---|---|
| opening | 236 | 8.74 | 0.75 | **91.4%** | 52.1% |
| middlegame | 105 | 8.39 | 1.17 | **86.0%** | 65.7% |
| endgame | 259 | 2.60 | 0.28 | **89.3%** | 22.8% |
| cross_phase | 121 | 8.40 | 1.26 | **85.0%** | 66.1% |

### 6b — the conjunction verdict re-run on the middlegame alone

| figure | middlegame only (n = 105) | whole corpus (n = 721) |
|---|---|---|
| best single-key precision | 80.0% | 69.4% |
| best conjunction precision | 46.2% (`escape_squares_changed:gained ∧ defended_duties_changed:released`) | 35.7% |
| pairs measurable (≥ 10 joint firings) | 37 | 51 |

### 6c — what a different population would have done

Re-running Leg 2 with the **17906 quiet legal alternatives** as the population instead of the 721 authored spine moves:

| figure | spine population | quiet-alternative population |
|---|---|---|
| pairs measured | 51 | 55 |
| pairs whose precision beats both components | 1 (2.0%) | 0 (0.0%) |
