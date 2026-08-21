# R7 same-mainline policy comparison

Disposable research output over retained authored Stockfish sidecars; no engine run and no product authority.

## Recorded-evaluation reach over eligible mainlines

| Phase | Packs | Any consecutive eval pair | Full mainline eval coverage |
|---|---:|---:|---:|
| cross_phase | 2 | 0 | 0 |
| endgame | 14 | 0 | 0 |
| middlegame | 13 | 0 | 0 |
| opening | 20 | 20 | 20 |

## Stratified two-per-phase comparison

| Pack | Phase | Plies | Current Story top-8 | Engine-only | Mixed exact | Mixed families |
|---|---|---:|---:|---:|---:|---|
| anti-caro-advance-early-c5 | opening | 7 | 1 | 1 (ply 4) | 2 | backward_pawn, doubled_pawn |
| anti-caro-advance-c5-race | opening | 6 | 1 | 1 (ply 5) | 0 | abstain |
| berlin-queenless-press | middlegame | 7 | 0 | abstain | 0 | abstain |
| carlsbad-minority-attack | middlegame | 11 | 3 | abstain | 2 | backward_pawn, half_open_file |
| conversion-up-a-piece | endgame | 7 | 3 | abstain | 2 | last_of_role |
| lucena-bridge-convert | endgame | 13 | 1 | abstain | 1 | king_opposition |
| trajectory-caro-advance-chain-bishops | cross_phase | 52 | 8 | abstain | 13 | castled, doubled_pawn, half_open_file, king_opposition, last_of_role |
| trajectory-qgd-exchange-minority | cross_phase | 60 | 8 | abstain | 16 | backward_pawn, castled, doubled_pawn, half_open_file, isolated_pawn, last_of_role |

Mixed exact is a research candidate: eligibility precedes selection, cap one, no avoidance/valence, every retained moment opens retry/branch.
