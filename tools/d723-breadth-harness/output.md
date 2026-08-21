# D723 middlegame-breadth output

Played-vs-legal-alternative lift measures discrimination only. It does not establish correctness, usefulness, intent, or move quality.

## authored pack spines

Rows: 754.

| probe | played n/rate | alternatives n/rate | lift |
|---|---:|---:|---:|
| `locked_pawn_pair_gained` | 32 / 4.463% | 225 / 1.147% | 3.89x |
| `pawn_harasses_minor` | 26 / 3.626% | 196 / 0.999% | 3.63x |
| `enemy_defense_edge_lost` | 78 / 10.879% | 802 / 4.088% | 2.66x |
| `king_zone_pressure_gained` | 109 / 15.202% | 1915 / 9.761% | 1.56x |
| `minor_pseudo_mobility_reduced` | 74 / 10.321% | 1340 / 6.830% | 1.51x |
| `heavy_piece_open_file_gained` | 19 / 2.650% | 353 / 1.799% | 1.47x |
| `minor_safe_mobility_reduced` | 174 / 24.268% | 4157 / 21.189% | 1.15x |
| `king_shelter_pawn_reduced` | 54 / 7.531% | 1313 / 6.692% | 1.13x |
| `pawn_contact_gained` | 27 / 3.766% | 719 / 3.665% | 1.03x |
| `same_color_slider_alignment_gained` | 164 / 22.873% | 5471 / 27.886% | 0.82x |
| `relative_line_constraint_gained` | 40 / 5.579% | 1476 / 7.523% | 0.74x |

## sealed imported CC0 sample

Rows: 579.

| probe | played n/rate | alternatives n/rate | lift |
|---|---:|---:|---:|
| `enemy_defense_edge_lost` | 136 / 23.570% | 1321 / 7.011% | 3.36x |
| `pawn_harasses_minor` | 32 / 5.546% | 329 / 1.746% | 3.18x |
| `locked_pawn_pair_gained` | 20 / 3.466% | 314 / 1.666% | 2.08x |
| `minor_pseudo_mobility_reduced` | 96 / 16.638% | 1560 / 8.279% | 2.01x |
| `king_zone_pressure_gained` | 89 / 15.425% | 1896 / 10.063% | 1.53x |
| `minor_safe_mobility_reduced` | 199 / 34.489% | 4419 / 23.453% | 1.47x |
| `relative_line_constraint_gained` | 78 / 13.518% | 1914 / 10.158% | 1.33x |
| `heavy_piece_open_file_gained` | 26 / 4.506% | 682 / 3.620% | 1.24x |
| `pawn_contact_gained` | 30 / 5.199% | 826 / 4.384% | 1.19x |
| `same_color_slider_alignment_gained` | 194 / 33.622% | 6378 / 33.850% | 0.99x |
| `king_shelter_pawn_reduced` | 33 / 5.719% | 1505 / 7.987% | 0.72x |

## Consecutive-edge sequence census

| population | consecutive pairs | pawn harassment | attacked minor immediately relocates | same line constraint preserved | line not preserved |
|---|---:|---:|---:|---:|---:|
| authored branch edges | 692 | 25 | 19 | 3 | 16 |

authored branch edges preserved examples: `anti-scandinavian-white/p11-h3 → g4h5`, `nimzo-doubled-c-pawns/h6-question → g5h4`, `scandinavian-mainline-black/p11-h3 → g4h5`.

| sealed imported games | 6883 | 276 | 180 | 6 | 174 |

sealed imported games preserved examples: `https://lichess.org/fd37KgOs#16 → g5h4`, `https://lichess.org/FLpiXGM1#13 → g4h5`, `https://lichess.org/RpFyUtKu#11 → g4h5`, `https://lichess.org/xRD5eE2h#40 → c4d5`, `https://lichess.org/Y8jZ2TIJ#20 → g5h4`.


