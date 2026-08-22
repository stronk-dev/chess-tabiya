# D783 output

Lift measures discrimination only. Safe means locally non-losing under legal-exchange@1, not engine-safe, active, trapped, dominated or good.

## authored pack spines

Decisions: 717; alternatives: 19619.

| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired position bootstrap 95%) |
|---|---:|---:|---:|
| `moved_piece_safe_mobility_increased` | 151 / 335 / 45.075% | 4644 / 12333 / 37.655% | 1.20x (1.07–1.34) |
| `opponent_piece_safe_mobility_decreased` | 231 / 693 / 33.333% | 5719 / 19543 / 29.264% | 1.14x (1.03–1.26) |
| `opponent_piece_lost_all_safe_moves` | 18 / 693 / 2.597% | 454 / 19543 / 2.323% | 1.12x (0.64–1.63) |
| `opponent_minor_safe_mobility_decreased` | 150 / 693 / 21.645% | 4081 / 19543 / 20.882% | 1.04x (0.90–1.19) |
| `opponent_piece_safe_mobility_decreased_without_capture` | 172 / 697 / 24.677% | 5214 / 19549 / 26.671% | 0.93x (0.82–1.05) |
| `opponent_piece_legal_mobility_decreased` | 53 / 693 / 7.648% | 2097 / 19543 / 10.730% | 0.71x (0.53–0.91) |

## sealed imported fixed-ply sample

Decisions: 577; alternatives: 18842.

| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired position bootstrap 95%) |
|---|---:|---:|---:|
| `opponent_piece_lost_all_safe_moves` | 47 / 562 / 8.363% | 610 / 18792 / 3.246% | 2.58x (1.91–3.36) |
| `opponent_piece_safe_mobility_decreased` | 267 / 562 / 47.509% | 6636 / 18792 / 35.313% | 1.35x (1.23–1.46) |
| `moved_piece_safe_mobility_increased` | 172 / 350 / 49.143% | 4735 / 12399 / 38.189% | 1.29x (1.15–1.42) |
| `opponent_minor_safe_mobility_decreased` | 175 / 562 / 31.139% | 4621 / 18792 / 24.590% | 1.27x (1.12–1.42) |
| `opponent_piece_safe_mobility_decreased_without_capture` | 189 / 566 / 33.392% | 5991 / 18795 / 31.875% | 1.05x (0.93–1.17) |
| `opponent_piece_legal_mobility_decreased` | 90 / 562 / 16.014% | 2912 / 18792 / 15.496% | 1.03x (0.84–1.23) |

