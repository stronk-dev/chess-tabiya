# Classifier audit — raw output

Corpus: 50 packs, 754 spine transitions.
Phase: opening 236, middlegame 138, endgame 259, cross_phase 121.

## 1. Structural reading volume (643 distinct positions)

observations/position: min 18 / median 80 / mean 63.94 / p95 96 / max 102

| kind | observations | per position | positions where present |
|---|---|---|---|
| `pawn_safe_square` | 5330 | 8.29 | 94.87% |
| `outpost` | 0 | 0.00 | 0.00% |
| `backward_pawn` | 137 | 0.21 | 17.57% |
| `isolated_pawn` | 174 | 0.27 | 25.04% |
| `doubled_pawn` | 101 | 0.16 | 13.22% |
| `passed_pawn` | 119 | 0.19 | 16.17% |
| `open_file` | 1758 | 2.73 | 57.85% |
| `half_open_file` | 604 | 0.94 | 58.94% |
| `line_blockers` | 11556 | 17.97 | 93.93% |
| `direct_attack_count` | 5070 | 7.88 | 80.56% |
| `piece_reach_count` | 5330 | 8.29 | 94.87% |
| `named_structure` | 61 | 0.09 | 9.49% |
| `bishop_on_shade` | 1449 | 2.25 | 71.07% |
| `pawn_count` | 0 | 0.00 | 0.00% |
| `king_opposition` | 58 | 0.09 | 9.02% |
| `piece_count` | 7716 | 12.00 | 100.00% |
| `king_zone` | 1009 | 1.57 | 86.78% |
| `piece_distance` | 643 | 1.00 | 100.00% |

Per declared phase (median observations/position):
- cross_phase: median 79 (n=121)
- endgame: median 31 (n=259)
- middlegame: median 89 (n=138)
- opening: median 87 (n=236)

## 2. Compare-strip structure entries (compare-strips.ts:47)

Transitions with >=1 entry: 753/754 = 99.87%.
Entries per ply: total 6657, mean 8.83, median 9, p95 18, max 24.
Axis D parents: 716. Quiet alternatives evaluated: 18470.
Quiet alternatives that also gain >=1 observation: 18395 = 99.59% (pooled).
Mean within-position share of quiet alternatives that also gain >=1: 99.45%.
Mean within-position share that gain >=1 of the SAME kind: 91.95%.
AGGREGATE LIFT (any-entry, played vs quiet alternative): 1.0027x.

## 3. PER-KIND discrimination — structural observation gained by the move

Denominators: 717 played moves, 19636 legal alternatives (all, not only quiet).

| kind | played fires | played rate | alt fires | alt rate | LIFT |
|---|---|---|---|---|---|
| `pawn_count` | 0 | 0.00% | 0 | 0.000% | n/a |
| `named_structure` | 4 | 0.56% | 11 | 0.056% | 9.96x |
| `doubled_pawn` | 22 | 3.07% | 82 | 0.418% | 7.35x |
| `passed_pawn` | 14 | 1.95% | 75 | 0.382% | 5.11x |
| `open_file` | 13 | 1.81% | 90 | 0.458% | 3.96x |
| `piece_count` | 102 | 14.23% | 724 | 3.687% | 3.86x |
| `isolated_pawn` | 13 | 1.81% | 102 | 0.519% | 3.49x |
| `king_opposition` | 65 | 9.07% | 602 | 3.066% | 2.96x |
| `king_zone` | 67 | 9.34% | 746 | 3.799% | 2.46x |
| `piece_distance` | 151 | 21.06% | 1780 | 9.065% | 2.32x |
| `half_open_file` | 34 | 4.74% | 457 | 2.327% | 2.04x |
| `backward_pawn` | 21 | 2.93% | 426 | 2.169% | 1.35x |
| `line_blockers` | 541 | 75.45% | 16276 | 82.889% | 0.91x |
| `piece_reach_count` | 592 | 82.57% | 18132 | 92.341% | 0.89x |
| `pawn_safe_square` | 573 | 79.92% | 17767 | 90.482% | 0.88x |
| `bishop_on_shade` | 123 | 17.15% | 3863 | 19.673% | 0.87x |
| `direct_attack_count` | 422 | 58.86% | 13342 | 67.947% | 0.87x |
| `outpost` | 0 | 0.00% | 11 | 0.056% | n/a |

## 4. PER-KIND discrimination — transition census (transition.ts:344)

Denominators: 717 played moves, 19636 alternatives.

| leaf:direction | played rate | alt rate | LIFT |
|---|---|---|---|
| `move_irreversibility:last_of_role` | 2.93% | 0.122% | 23.96x |
| `move_irreversibility:castled` | 3.07% | 0.316% | 9.72x |
| `move_irreversibility:pawn_break` | 8.37% | 4.044% | 2.07x |
| `defended_duties_changed:released` | 7.95% | 4.242% | 1.87x |
| `move_irreversibility:clock_zeroed` | 35.29% | 29.028% | 1.22x |
| `defended_squares_changed:gained` | 18.27% | 16.118% | 1.13x |
| `escape_squares_changed:lost` | 81.03% | 75.733% | 1.07x |
| `attacked_squares_changed:lost` | 15.34% | 14.631% | 1.05x |
| `attacked_squares_changed:gained` | 35.15% | 33.546% | 1.05x |
| `slider_lines_changed:opened` | 52.44% | 54.252% | 0.97x |
| `escape_squares_changed:gained` | 82.15% | 86.632% | 0.95x |
| `defended_duties_changed:acquired` | 9.21% | 10.995% | 0.84x |
| `defended_squares_changed:lost` | 22.18% | 27.704% | 0.80x |
| `slider_lines_changed:closed` | 33.75% | 51.589% | 0.65x |

Transition-kind coverage check: 6 declared kinds, 6 observed on this corpus.

## 5. Ranked-surface counterfactual — strip restricted to the top-k kinds by lift

| k | kinds kept | transitions firing | entries/ply | quiet-alt firing | LIFT |
|---|---|---|---|---|---|
| 1 | named_structure | 0.53% | 0.01 | 0.01% | 49.02x |
| 2 | named_structure, doubled_pawn | 3.18% | 0.03 | 0.01% | 294.11x |
| 3 | named_structure, doubled_pawn, passed_pawn | 5.04% | 0.05 | 0.18% | 27.39x |
| 5 | named_structure, doubled_pawn, passed_pawn, open_file, piece_count | 15.38% | 0.21 | 0.18% | 83.62x |
| 8 | named_structure, doubled_pawn, passed_pawn, open_file, piece_count, isolated_pawn, king_opposition, king_zone | 36.47% | 0.48 | 6.89% | 5.29x |

## 6. Pivotal markers
irreversibility fires on 103/754 = 13.66%.
- `pawn_break`: 60 (7.96%)
- `castled`: 22 (2.92%)
- `last_of_role`: 21 (2.79%)
Phase bands over 643 positions: endgame 256 (39.81%), middlegame 198 (30.79%), opening 103 (16.02%), unclear 86 (13.37%).
phase_change candidate transitions: 1/754 = 0.13%.
option_collapse floor (<=3 legal): 65/643 = 10.11%.

## 7. Named-structure catalogue reach
Positions matching >=1 of the 4 catalogue structures: 61/643 = 9.49%.
- carlsbad: 34 (5.29%)
- iqp-white: 10 (1.56%)
- maroczy-bind: 10 (1.56%)
- iqp-black: 7 (1.09%)

