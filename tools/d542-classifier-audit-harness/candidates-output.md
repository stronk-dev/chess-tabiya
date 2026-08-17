# Candidate-detector output

Corpus: 50 packs, 754 spine transitions.

Denominators: 717 played moves, 19636 legal alternatives.

| candidate detector | played rate | alt rate | LIFT |
|---|---|---|---|
| `rook_reached_seventh` | 0.98% | 0.255% | 3.83x |
| `pawn_island_gained` | 2.93% | 1.375% | 2.13x |
| `absolute_pin_created` | 2.37% | 1.854% | 1.28x |
| `central_space_gained` | 9.07% | 8.286% | 1.09x |
| `fork_created` | 1.67% | 2.332% | 0.72x |
| `castling_right_lost` | 3.07% | 4.721% | 0.65x |
| `hanging_piece_created` | 4.04% | 15.716% | 0.26x |
| `bad_bishop_created` | 0.00% | 0.081% | 0.00x |

Static prevalence over 643 distinct positions:
- `hanging_piece`: 27/643 = 4.20%
- `absolute_pin`: 36/643 = 5.60%
- `rook_on_seventh`: 52/643 = 8.09%
- `bad_bishop`: 379/643 = 58.94%
- `more_than_two_pawn_islands`: 30/643 = 4.67%

