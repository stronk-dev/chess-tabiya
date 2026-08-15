# Q8 raw output — the shipped derived-feedback surface

Corpus: 37 packs, 634 spine transitions.
Phase: opening 236, middlegame 18, endgame 259, cross_phase 121.

## 1. Structural reading — observations per position (515 distinct positions)

min 18 / median 58 / mean 57.90 / p95 92 / max 97

| kind | observations | per position | positions where present |
|---|---|---|---|
| `line_blockers` | 8063 | 15.66 | 92.4% |
| `piece_count` | 6180 | 12.00 | 100.0% |
| `pawn_safe_square` | 3695 | 7.17 | 93.6% |
| `piece_reach_count` | 3695 | 7.17 | 93.6% |
| `direct_attack_count` | 3272 | 6.35 | 75.7% |
| `open_file` | 1684 | 3.27 | 58.4% |
| `bishop_on_shade` | 987 | 1.92 | 63.9% |
| `king_zone` | 753 | 1.46 | 83.5% |
| `piece_distance` | 515 | 1.00 | 100.0% |
| `half_open_file` | 455 | 0.88 | 55.7% |
| `isolated_pawn` | 137 | 0.27 | 24.7% |
| `passed_pawn` | 115 | 0.22 | 19.4% |
| `backward_pawn` | 105 | 0.20 | 16.5% |
| `doubled_pawn` | 65 | 0.13 | 9.5% |
| `king_opposition` | 58 | 0.11 | 11.3% |
| `named_structure` | 36 | 0.07 | 7.0% |
| `outpost` | 2 | 0.00 | 0.4% |

## 2. Compare-strip structure entries ("a recorded structural observation changed")

Generator: compare-strips.ts:32 — every observation present at a node and absent at its predecessor.
Transitions with >=1 entry: 633/634 = 99.8%.
Entries per ply: total 5266, mean 8.31, median 8, p95 16, max 24.

| gained kind | transitions where gained |
|---|---|
| `piece_reach_count` | 478 (75.4%) |
| `pawn_safe_square` | 455 (71.8%) |
| `line_blockers` | 436 (68.8%) |
| `direct_attack_count` | 329 (51.9%) |
| `piece_distance` | 184 (29.0%) |
| `king_zone` | 100 (15.8%) |
| `bishop_on_shade` | 89 (14.0%) |
| `king_opposition` | 73 (11.5%) |
| `piece_count` | 70 (11.0%) |
| `half_open_file` | 25 (3.9%) |
| `doubled_pawn` | 16 (2.5%) |
| `backward_pawn` | 16 (2.5%) |
| `passed_pawn` | 13 (2.1%) |
| `isolated_pawn` | 12 (1.9%) |
| `open_file` | 11 (1.7%) |
| `named_structure` | 4 (0.6%) |
| `outpost` | 1 (0.2%) |

### Axis D — is the change a property of the move or of the position?

Parents where the played move gained >=1 observation and >=1 quiet alternative exists: 596.
Quiet alternatives evaluated: 14463.
Quiet alternatives that also gain >=1 observation: 14388 = 99.5% (pooled).
Mean within-position share of quiet alternatives that also gain >=1: 99.3%.
Mean within-position share of quiet alternatives that gain >=1 of the SAME kind: 90.4%.

## 3. Pushed timeline markers (unasked, no learner request)

### irreversibility (pivotal.ts:53, rendered pivotal.ts:73-75)
Fires on 85/634 = 13.4% of spine transitions.
- `pawn_break`: 48 (7.6%)
- `castled`: 20 (3.2%)
- `last_of_role`: 17 (2.7%)

### phase_change (pivotal.ts:49)
Definite→definite transitions that change band: 1/634 = 0.2%.
Transitions touching the `unclear` band (marker cannot fire): 110 = 17.4%.

### option_collapse (pivotal.ts:60)
Legal-move count over corpus positions: min 0 / median 28 / p95 43 / max 50.
Positions at or below the collapse floor (<=3): 65/515 = 12.6%.

## 4. Endgame reading (the named-technique surface, 05 §5b)
Positions with a non-null endgame reading: 256/515 = 49.7%.
- (untyped): 147
- Pawn ending: 33
- Rook and pawn versus rook: 31
- Rook ending: 31
- Minor-piece ending: 14
Positions where >=1 named technique is emitted: 31 = 6.0%.
Sample rendering (3rk3/pp3ppp/4p3/8/8/2N1P3/PP3PPP/3RK3 w - - 0 1):
  > Endgame; the material is outside Tabiya's material-census convention.
Sample rendering (1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1):
  > Rook and pawn versus rook under Tabiya's material-census convention.
  > Named technique: Lucena (Standard endgame-literature name; Tabiya's material-census convention.) No technique entry is available yet.
  > Named technique: Philidor (Standard endgame-literature name; Tabiya's material-census convention.) No technique entry is available yet.

## 5. Sibling-branch discrimination in the compare reading
Authored fork pairs (same parent, two different children): 44.
Jaccard overlap of the two full structural readings: median 65.7%, mean 65.4%, min 51.8%, max 80.2%.
Observations differing between the pair: median 36, mean 35.1, max 55.

