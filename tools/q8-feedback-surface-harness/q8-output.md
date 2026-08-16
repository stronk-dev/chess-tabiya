# Q8 raw output — the shipped derived-feedback surface

Corpus: 50 packs, 754 spine transitions.
Phase: opening 236, middlegame 138, endgame 259, cross_phase 121.

## 1. Structural reading — observations per position (643 distinct positions)

min 18 / median 80 / mean 63.96 / p95 96 / max 103

| kind | observations | per position | positions where present |
|---|---|---|---|
| `line_blockers` | 11556 | 17.97 | 93.9% |
| `piece_count` | 7716 | 12.00 | 100.0% |
| `pawn_safe_square` | 5330 | 8.29 | 94.9% |
| `piece_reach_count` | 5330 | 8.29 | 94.9% |
| `direct_attack_count` | 5070 | 7.88 | 80.6% |
| `open_file` | 1758 | 2.73 | 57.9% |
| `bishop_on_shade` | 1449 | 2.25 | 71.1% |
| `king_zone` | 1009 | 1.57 | 86.8% |
| `piece_distance` | 643 | 1.00 | 100.0% |
| `half_open_file` | 604 | 0.94 | 58.9% |
| `isolated_pawn` | 174 | 0.27 | 25.0% |
| `backward_pawn` | 137 | 0.21 | 17.6% |
| `passed_pawn` | 119 | 0.19 | 16.2% |
| `doubled_pawn` | 101 | 0.16 | 13.2% |
| `named_structure` | 61 | 0.09 | 9.5% |
| `king_opposition` | 58 | 0.09 | 9.0% |
| `outpost` | 10 | 0.02 | 1.6% |

## 2. Compare-strip structure entries ("a recorded structural observation changed")

Generator: compare-strips.ts:32 — every observation present at a node and absent at its predecessor.
Transitions with >=1 entry: 753/754 = 99.9%.
Entries per ply: total 6659, mean 8.83, median 9, p95 18, max 24.

| gained kind | transitions where gained |
|---|---|
| `piece_reach_count` | 593 (78.6%) |
| `pawn_safe_square` | 573 (76.0%) |
| `line_blockers` | 542 (71.9%) |
| `direct_attack_count` | 425 (56.4%) |
| `piece_distance` | 188 (24.9%) |
| `bishop_on_shade` | 123 (16.3%) |
| `king_zone` | 104 (13.8%) |
| `piece_count` | 102 (13.5%) |
| `king_opposition` | 73 (9.7%) |
| `half_open_file` | 34 (4.5%) |
| `doubled_pawn` | 22 (2.9%) |
| `backward_pawn` | 21 (2.8%) |
| `passed_pawn` | 14 (1.9%) |
| `isolated_pawn` | 13 (1.7%) |
| `open_file` | 13 (1.7%) |
| `named_structure` | 4 (0.5%) |
| `outpost` | 2 (0.3%) |

### Axis D — is the change a property of the move or of the position?

Parents where the played move gained >=1 observation and >=1 quiet alternative exists: 716.
Quiet alternatives evaluated: 18470.
Quiet alternatives that also gain >=1 observation: 18395 = 99.6% (pooled).
Mean within-position share of quiet alternatives that also gain >=1: 99.4%.
Mean within-position share of quiet alternatives that gain >=1 of the SAME kind: 92.0%.

## 3. Pushed timeline markers (unasked, no learner request)

### irreversibility (pivotal.ts:53, rendered pivotal.ts:73-75)
Fires on 101/754 = 13.4% of spine transitions.
- `pawn_break`: 60 (8.0%)
- `last_of_role`: 21 (2.8%)
- `castled`: 20 (2.7%)

### phase_change (pivotal.ts:49)
Definite→definite transitions that change band: 1/754 = 0.1%.
Transitions touching the `unclear` band (marker cannot fire): 135 = 17.9%.

### option_collapse (pivotal.ts:60)
Legal-move count over corpus positions: min 0 / median 31 / p95 44 / max 53.
Positions at or below the collapse floor (<=3): 65/643 = 10.1%.

## 4. Endgame reading (the named-technique surface, 05 §5b)
Positions with a non-null endgame reading: 256/643 = 39.8%.
- (untyped): 147
- Pawn ending: 33
- Rook and pawn versus rook: 31
- Rook ending: 31
- Minor-piece ending: 14
Positions where >=1 named technique is emitted: 31 = 4.8%.
Sample rendering (3rk3/pp3ppp/4p3/8/8/2N1P3/PP3PPP/3RK3 w - - 0 1):
  > Endgame; the material is outside Tabiya's material-census convention.
Sample rendering (1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1):
  > Rook and pawn versus rook under Tabiya's material-census convention.
  > Named technique: Lucena (Standard endgame-literature name; Tabiya's material-census convention.) No technique entry is available yet.
  > Named technique: Philidor (Standard endgame-literature name; Tabiya's material-census convention.) No technique entry is available yet.

## 5. Sibling-branch discrimination in the compare reading
Authored fork pairs (same parent, two different children): 62.
Jaccard overlap of the two full structural readings: median 64.4%, mean 64.8%, min 51.7%, max 80.2%.
Observations differing between the pair: median 38, mean 36.6, max 57.

