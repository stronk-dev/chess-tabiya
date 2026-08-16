# D355 raw output — reading cost of the shipped assistance surface

Reading rate: **238 wpm** (Brysbaert 2019 meta-analysis, adult silent reading, non-fiction English).
Corpus: 47 packs, 721 spine transitions, 609 distinct positions.

## 1. Per-item reading cost by distance to the answer

| distance | items | median words | mean words | p95 words | median seconds @238wpm |
|---|---|---|---|---|---|
| `kind` | 1116 | 6 | 14.8 | 15 | 1.5 s |
| `fact` | 41239 | 9 | 12.3 | 31 | 2.3 s |
| `ranking` | 149 | 63 | 104.1 | 230 | 15.9 s |
| `move` | 768 | 1 | 1.3 | 6 | 0.3 s |

## 2. Per-item cost by rendered family (the unweighted view)

| family | distance | items | median words | median seconds |
|---|---|---|---|---|
| `compare-strip` | `fact` | 17 | 9 | 2.3 s |
| `corpus-page` | `ranking` | 43 | 230 | 58.0 s |
| `endgame-reading` | `kind` | 396 | 8 | 2.0 s |
| `guided-shape-block` | `kind` | 25 | 48 | 12.1 s |
| `human-split` | `ranking` | 105 | 63 | 15.9 s |
| `move:bestline-6ply` | `move` | 47 | 6 | 1.5 s |
| `move:bestmove` | `move` | 721 | 1 | 0.3 s |
| `phase-reading` | `kind` | 609 | 6 | 1.5 s |
| `pivotal:human_divergence` | `ranking` | 1 | 12 | 3.0 s |
| `shape-panel` | `kind` | 25 | 298 | 75.1 s |
| `structural:backward_pawn` | `fact` | 133 | 6 | 1.5 s |
| `structural:bishop_on_shade` | `fact` | 1322 | 9 | 2.3 s |
| `structural:direct_attack_count` | `fact` | 4597 | 14 | 3.5 s |
| `structural:doubled_pawn` | `fact` | 96 | 9 | 2.3 s |
| `structural:half_open_file` | `fact` | 576 | 12 | 3.0 s |
| `structural:isolated_pawn` | `fact` | 174 | 13 | 3.3 s |
| `structural:king_opposition` | `fact` | 58 | 14 | 3.5 s |
| `structural:king_zone` | `fact` | 941 | 17 | 4.3 s |
| `structural:line_blockers` | `fact` | 10556 | 7 | 1.8 s |
| `structural:named_structure` | `kind` | 61 | 7 | 1.8 s |
| `structural:open_file` | `fact` | 1742 | 8 | 2.0 s |
| `structural:outpost` | `fact` | 10 | 23 | 5.8 s |
| `structural:passed_pawn` | `fact` | 115 | 16 | 4.0 s |
| `structural:pawn_safe_square` | `fact` | 4871 | 31 | 7.8 s |
| `structural:piece_count` | `fact` | 7308 | 4 | 1.0 s |
| `structural:piece_distance` | `fact` | 609 | 10 | 2.5 s |
| `structural:piece_reach_count` | `fact` | 4871 | 18 | 4.5 s |
| `transition:attacked_squares_changed` | `fact` | 350 | 13 | 3.3 s |
| `transition:defended_duties_changed` | `fact` | 109 | 16 | 4.0 s |
| `transition:defended_squares_changed` | `fact` | 282 | 13 | 3.3 s |
| `transition:escape_squares_changed` | `fact` | 1409 | 14 | 3.5 s |
| `transition:move_irreversibility` | `fact` | 419 | 13 | 3.3 s |
| `transition:slider_lines_changed` | `fact` | 674 | 13 | 3.3 s |

## 3. Does reading cost track distance to the answer?

Spearman rho(distance rank, words), all 43272 rendered items: **-0.046**
Spearman rho(distance rank, median words), 33 rendered families: **-0.026**
Same, excluding `move` (refused product-wide today), items: **0.125**
Same, excluding `move`, families: **0.217**

Variance in log(words) explained by DISTANCE CLASS (eta-squared, 4 classes): **0.201**
Same, excluding `move` (3 classes): **0.038**
Variance in log(words) explained by RENDERED FAMILY (33 families): **0.984**

Within-class spread of family medians (words):
- `kind`: 6 (`phase-reading`) … 298 (`shape-panel`) — a 50× range
- `fact`: 4 (`structural:piece_count`) … 31 (`structural:pawn_safe_square`) — a 8× range
- `ranking`: 12 (`pivotal:human_divergence`) … 230 (`corpus-page`) — a 19× range
- `move`: 1 (`move:bestmove`) … 6 (`move:bestline-6ply`) — a 6× range

## 4. Per-node aggregate volume (the all-on state)

Structural observations per position: min 18 / median 78 / mean 62.46 / p95 96 / max 103
Structural reading WORDS per position: min 110 / median 978 / mean 760.9 / p95 1273 / max 1354
Structural reading SECONDS per position @238wpm: median **247 s** / p95 321 s / max 341 s
Observation-count deciles (d1…d9): 27 · 31 · 33 · 37 · 78 · 85 · 87 · 88 · 92
Word-count deciles (d1…d9): 204 · 256 · 281 · 330 · 978 · 1142 · 1164 · 1197 · 1223
- declared phase `cross_phase` (122 positions): median 985 words = 248 s
- declared phase `endgame` (233 positions): median 256 words = 65 s
- declared phase `middlegame` (109 positions): median 1199 words = 302 s
- declared phase `opening` (145 positions): median 1188 words = 299 s
Transition reading WORDS per ply: median 54 / mean 59.0 / p95 113 / max 182 (median **14 s**)
Irreversibility subkinds actually emitted over 721 transitions: pawn_break 52, castled 20, last_of_role 21 (the type also declares `clock_zeroed`, the HALFMOVE counter — never emitted).
Endgame reading WORDS per position where present (256 positions): median 8 / max 39
Guided shape block WORDS: median 48 / max 65 (median 12.1 s)
Full shape panel WORDS: median 298 / max 671 (median 75 s)
Corpus page moves listed (43 real cached responses): median 12 / min 4 / max 12
Corpus page WORDS: median 230 / min 110 / max 230 (median **58 s**)
Human split WORDS (recorded candidate-count distribution): median 63 / min 6 / max 63 (median **16 s**)

## 5. Encounter horizon and the 10+0 arithmetic

Pack-shaped documents (declare id + phase + opponentPolicy): **89**
Declaring `authoredBoundary.plyHorizon`: **47** — min 2 / median 10 / mean 12.5 / p95 32 / max 40

| clock allocation | seconds per learner move | words readable @238wpm | fact items readable | ranking items readable |
|---|---|---|---|---|
| uniform 10+0, 40-move reference game | 15.0 s | 60 | 6.6 | 0.94 |
| whole 600 s given to a median-horizon encounter (10 ply = 5 learner moves) | 120.0 s | 476 | 52.9 | 7.56 |
| whole 600 s given to a max-horizon encounter (40 ply = 20 learner moves) | 30.0 s | 119 | 13.2 | 1.89 |
| 3+0 blitz, 40-move reference game | 4.5 s | 18 | 2.0 | 0.28 |
| 15+0 rapid, 40-move reference game | 22.5 s | 89 | 9.9 | 1.42 |

Break-even loadout at the uniform 10+0 budget (15 s/move → 60 words):
- all-`fact` loadout: **6.6** items
- all-`ranking` loadout: **0.94** items
- the all-on rung-0 state costs **16.4×** the whole per-move budget at median.

