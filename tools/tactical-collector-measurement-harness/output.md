# Tactical collector measurement

Production collectors; complete legal alternatives per source position; deterministic paired 2,000-resample bootstrap.
Capture is intentionally a frequency/class census and has no lift claim. Zeros are retained.

## authored pack spine

Decisions: 717; legal alternatives: 19639; elapsed: 34903.0 ms.

### Played moves versus legal alternatives

| probe | played | alternatives | lift (paired bootstrap 95%) |
|---|---:|---:|---:|
| `back_rank_susceptible` | 70/717 (9.763%) | 1492/19639 (7.597%) | 1.29x (1.08–1.53) |
| `castling_right_lost` | 22/717 (3.068%) | 927/19639 (4.720%) | 0.65x (0.41–0.91) |
| `check` | 42/717 (5.858%) | 463/19639 (2.358%) | 2.48x (1.75–3.32) |
| `developed` | 123/717 (17.155%) | 2259/19639 (11.503%) | 1.49x (1.28–1.72) |
| `discovered_executed` | 5/717 (0.697%) | 109/19639 (0.555%) | 1.26x (0.26–2.72) |
| `double_attack` | 10/717 (1.395%) | 159/19639 (0.810%) | 1.72x (0.75–2.96) |
| `fork_survives_reply` | 0/717 (0.000%) | 2/19639 (0.010%) | 0.00x (0.00–0.00) |
| `loose_piece_gained` | 40/693 (5.772%) | 5132/19563 (26.233%) | 0.22x (0.16–0.29) |
| `loose_piece_resolved` | 80/693 (11.544%) | 676/19563 (3.456%) | 3.34x (2.86–3.91) |
| `mate_in_one` | 2/717 (0.279%) | 85/19639 (0.433%) | 0.64x (0.00–2.81) |
| `moved_piece_en_prise` | 38/693 (5.483%) | 4270/19563 (21.827%) | 0.25x (0.18–0.33) |
| `pawn_islands_gained` | 21/717 (2.929%) | 270/19639 (1.375%) | 2.13x (1.33–3.11) |
| `promotion_available_next` | 12/717 (1.674%) | 38/19639 (0.193%) | 8.65x (4.70–17.25) |
| `promotion_unstoppable` | 1/717 (0.139%) | 9/19639 (0.046%) | 3.04x (0.00–55.29) |
| `rook_on_seventh` | 48/717 (6.695%) | 652/19639 (3.320%) | 2.02x (1.61–2.54) |
| `space_increased` | 77/717 (10.739%) | 2479/19639 (12.623%) | 0.85x (0.67–1.03) |
| `threat_present` | 133/717 (18.550%) | 4008/19639 (20.408%) | 0.91x (0.76–1.07) |

### State/readout census on played positions

| reading | present |
|---|---:|
| `absolute_pin` | 45/754 (5.968%) |
| `back_rank_susceptible` | 77/754 (10.212%) |
| `castling_right_held` | 294/754 (38.992%) |
| `castling_right_held_but_illegal` | 292/754 (38.727%) |
| `connected_pawn_pair` | 534/754 (70.822%) |
| `discovered_latency` | 155/754 (20.557%) |
| `loose_piece` | 82/754 (10.875%) |
| `mate_in_one` | 6/754 (0.796%) |
| `pawn_connectivity_over_two_islands` | 30/754 (3.979%) |
| `pawn_support_chain` | 436/754 (57.825%) |
| `promotion_available_next` | 13/754 (1.724%) |
| `promotion_pressure` | 51/754 (6.764%) |
| `promotion_unstoppable` | 1/754 (0.133%) |
| `relative_pin` | 196/754 (25.995%) |
| `rook_on_seventh` | 49/754 (6.499%) |
| `skewer` | 92/754 (12.202%) |
| `space_nonzero` | 593/754 (78.647%) |
| `threat_present` | 136/754 (18.037%) |
| `trapped_piece` | 0/754 (0.000%) |
| `undeveloped_minor` | 417/754 (55.305%) |
| `xray_attack` | 489/754 (64.854%) |
| `xray_defense` | 483/754 (64.058%) |

### Capture and adjacent trade census (no capture lift)

Capture events: 101/754; local-exchange classes positive/equal/negative: 52/48/1.
Adjacent two-edge windows: 622; immediate same-square capture-recaptures: 34.

## sealed imported fixed-ply sample

Decisions: 577; legal alternatives: 18842; elapsed: 41829.9 ms.

### Played moves versus legal alternatives

| probe | played | alternatives | lift (paired bootstrap 95%) |
|---|---:|---:|---:|
| `back_rank_susceptible` | 78/577 (13.518%) | 2765/18842 (14.675%) | 0.92x (0.81–1.03) |
| `castling_right_lost` | 32/577 (5.546%) | 1094/18842 (5.806%) | 0.96x (0.66–1.25) |
| `check` | 32/577 (5.546%) | 402/18842 (2.134%) | 2.60x (1.75–3.59) |
| `developed` | 100/577 (17.331%) | 1566/18842 (8.311%) | 2.09x (1.76–2.43) |
| `discovered_executed` | 9/577 (1.560%) | 162/18842 (0.860%) | 1.81x (0.81–3.14) |
| `double_attack` | 29/577 (5.026%) | 484/18842 (2.569%) | 1.96x (1.30–2.71) |
| `fork_survives_reply` | 2/577 (0.347%) | 12/18842 (0.064%) | 5.44x (0.00–18.40) |
| `loose_piece_gained` | 78/562 (13.879%) | 5737/18792 (30.529%) | 0.45x (0.36–0.56) |
| `loose_piece_resolved` | 127/562 (22.598%) | 1189/18792 (6.327%) | 3.57x (3.11–4.10) |
| `mate_in_one` | 3/577 (0.520%) | 173/18842 (0.918%) | 0.57x (0.00–1.42) |
| `moved_piece_en_prise` | 71/562 (12.633%) | 4815/18792 (25.623%) | 0.49x (0.39–0.59) |
| `pawn_islands_gained` | 38/577 (6.586%) | 288/18842 (1.529%) | 4.31x (3.05–5.78) |
| `promotion_available_next` | 1/577 (0.173%) | 2/18842 (0.011%) | 16.33x (0.00–33.10) |
| `promotion_unstoppable` | 0/577 (0.000%) | 1/18842 (0.005%) | 0.00x (0.00–0.00) |
| `rook_on_seventh` | 8/577 (1.386%) | 330/18842 (1.751%) | 0.79x (0.47–1.12) |
| `space_increased` | 60/577 (10.399%) | 2556/18842 (13.565%) | 0.77x (0.58–0.95) |
| `threat_present` | 212/577 (36.742%) | 6779/18842 (35.978%) | 1.02x (0.91–1.14) |

### State/readout census on played positions

| reading | present |
|---|---:|
| `absolute_pin` | 97/579 (16.753%) |
| `back_rank_susceptible` | 79/579 (13.644%) |
| `castling_right_held` | 286/579 (49.396%) |
| `castling_right_held_but_illegal` | 274/579 (47.323%) |
| `connected_pawn_pair` | 579/579 (100.000%) |
| `discovered_latency` | 280/579 (48.359%) |
| `loose_piece` | 144/579 (24.870%) |
| `mate_in_one` | 3/579 (0.518%) |
| `pawn_connectivity_over_two_islands` | 138/579 (23.834%) |
| `pawn_support_chain` | 546/579 (94.301%) |
| `promotion_available_next` | 1/579 (0.173%) |
| `promotion_pressure` | 49/579 (8.463%) |
| `promotion_unstoppable` | 0/579 (0.000%) |
| `relative_pin` | 254/579 (43.869%) |
| `rook_on_seventh` | 8/579 (1.382%) |
| `skewer` | 126/579 (21.762%) |
| `space_nonzero` | 546/579 (94.301%) |
| `threat_present` | 212/579 (36.615%) |
| `trapped_piece` | 5/579 (0.864%) |
| `undeveloped_minor` | 406/579 (70.121%) |
| `xray_attack` | 576/579 (99.482%) |
| `xray_defense` | 569/579 (98.273%) |

### Capture and adjacent trade census (no capture lift)

Capture events: 158/579; local-exchange classes positive/equal/negative: 87/64/7.
Adjacent two-edge windows: 6775; immediate same-square capture-recaptures: 591.

