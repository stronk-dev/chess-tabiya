# D794 output

Reply breadth is an exact legal count. Lift is discrimination, not force, value, quality or deeper inevitability.

## authored pack spines

Decisions: 717; alternatives: 19619; elapsed: 5301.2 ms.

Played reply breadth mean/p10/median/p90: 27.08 / 3 / 31 / 42.
Alternative reply breadth mean/p10/median/p90: 31.21 / 6 / 34 / 43.

| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired bootstrap 95%) |
|---|---:|---:|---:|
| `mate_delivered` | 6 / 717 / 0.837% | 4 / 19619 / 0.020% | 41.04x (10.65–69.04) |
| `positive_capture_threat_survives_every_reply` | 1 / 675 / 0.148% | 3 / 19156 / 0.016% | 9.46x (0.00–28.78) |
| `opponent_has_exactly_one_legal_reply` | 37 / 717 / 5.160% | 342 / 19619 / 1.743% | 2.96x (2.18–4.04) |
| `move_gave_check` | 42 / 717 / 5.858% | 463 / 19619 / 2.360% | 2.48x (1.77–3.30) |
| `noncheck_opponent_has_exactly_one_legal_reply` | 27 / 717 / 3.766% | 298 / 19619 / 1.519% | 2.48x (1.63–3.77) |
| `moved_piece_meaningful_double_attack` | 10 / 717 / 1.395% | 159 / 19619 / 0.810% | 1.72x (0.72–2.93) |
| `positive_capture_threat_present` | 126 / 675 / 18.667% | 3925 / 19156 / 20.490% | 0.91x (0.77–1.09) |
| `moved_piece_double_attack_survives_every_reply` | 0 / 717 / 0.000% | 2 / 19619 / 0.010% | 0.00x (0.00–0.00) |

Played positive examples:
- `positive_capture_threat_present`: anti-caro-advance-early-c5/nc6-active:b8c6, anti-caro-advance-early-c5/e6-late:e7e6, anti-caro-advance-early-c5/e6-bid:e7e6, anti-caro-advance-early-c5/nf3-decline:g1f3, anti-caro-advance-early-c5/c3-prop:c2c3, anti-caro-advance-c5-race/be3-hold:c1e3
- `moved_piece_meaningful_double_attack`: anti-italian-center-attack-black/p9-d4:d2d4, anti-italian-center-attack-black/p16-d5:d7d5, french-advance-chain-white/nxe3-trade:f5e3, italian-center-attack-white/p9-d4:d2d4, italian-center-attack-white/p16-d5:d7d5, london-wedge-black-counterplay/dxe5-recapture:d4e5
- `move_gave_check`: anti-italian-center-attack-black/p12-bb4:c5b4, anti-italian-center-attack-black/p14-bxd2:b4d2, conversion-up-a-piece/w1-rxd8:d1d8, italian-center-attack-white/p12-bb4:c5b4, italian-center-attack-white/p14-bxd2:b4d2, lucena-bridge-convert/w-rd1:c1d1
- `positive_capture_threat_survives_every_reply`: iqp-black-tarrasch-defence/qb3-pressure:d1b3
- `opponent_has_exactly_one_legal_reply`: mate-bishop-knight/p09-kc6:d5c6, mate-bishop-knight/p13-ne7:g6e7, mate-bishop-knight/p15-kd6:c6d6, mate-bishop-knight/p19-bh2:g3h2, mate-bishop-knight/p21-bc7:h2c7, mate-bishop-knight/p25-nd6:f5d6
- `noncheck_opponent_has_exactly_one_legal_reply`: mate-bishop-knight/p09-kc6:d5c6, mate-bishop-knight/p15-kd6:c6d6, mate-bishop-knight/p19-bh2:g3h2, mate-bishop-knight/p21-bc7:h2c7, mate-bishop-knight/p27-kf6:e6f6, mate-bishop-knight/p31-bd8:c7d8
- `mate_delivered`: mate-bishop-knight/p39-bf6:e7f6, mate-k-q-technique/w-qe8-mate:e7e8, mate-k-r-technique/w-ra8-mate:a7a8, mate-two-bishops/w-bd4-mate:c5d4, philidor-passive-rook-convert/w-rh8-mate:h7h8, trajectory-mate-bishop-knight/p39-bf6:e7f6

## sealed imported fixed-ply sample

Decisions: 577; alternatives: 18842; elapsed: 7532.5 ms.

Played reply breadth mean/p10/median/p90: 34.45 / 25 / 36 / 46.
Alternative reply breadth mean/p10/median/p90: 36.23 / 27 / 37 / 47.

| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired bootstrap 95%) |
|---|---:|---:|---:|
| `mate_delivered` | 1 / 577 / 0.173% | 1 / 18842 / 0.005% | 32.66x (0.00–98.71) |
| `moved_piece_double_attack_survives_every_reply` | 2 / 577 / 0.347% | 11 / 18842 / 0.058% | 5.94x (0.00–19.86) |
| `move_gave_check` | 32 / 577 / 5.546% | 402 / 18842 / 2.134% | 2.60x (1.77–3.55) |
| `opponent_has_exactly_one_legal_reply` | 3 / 577 / 0.520% | 38 / 18842 / 0.202% | 2.58x (0.00–6.30) |
| `moved_piece_meaningful_double_attack` | 29 / 577 / 5.026% | 484 / 18842 / 2.569% | 1.96x (1.32–2.69) |
| `positive_capture_threat_present` | 208 / 545 / 38.165% | 6761 / 18440 / 36.665% | 1.04x (0.93–1.16) |
| `positive_capture_threat_survives_every_reply` | 0 / 545 / 0.000% | 12 / 18440 / 0.065% | 0.00x (0.00–0.00) |
| `noncheck_opponent_has_exactly_one_legal_reply` | 0 / 577 / 0.000% | 0 / 18842 / 0.000% | n/a |

Played positive examples:
- `positive_capture_threat_present`: https://lichess.org/ZoaIX0pA#32:d6d5, https://lichess.org/ZoaIX0pA#48:d4f3, https://lichess.org/pOwXJnoO#16:e7f5, https://lichess.org/pOwXJnoO#24:f5e3, https://lichess.org/82AjXY9N#24:b7c6, https://lichess.org/82AjXY9N#40:d5d4
- `move_gave_check`: https://lichess.org/fd37KgOs#8:g7c3, https://lichess.org/a0Xo4b5J#48:d2d1, https://lichess.org/MNHJ5B9Z#8:d8e7, https://lichess.org/MNHJ5B9Z#24:c5d6, https://lichess.org/pQZ75avT#40:e8e1, https://lichess.org/v1cKtIwO#24:e5f3
- `moved_piece_meaningful_double_attack`: https://lichess.org/MNHJ5B9Z#40:e8e5, https://lichess.org/zkGYvtAc#40:e7g5, https://lichess.org/RpFyUtKu#48:c6e4, https://lichess.org/8wEHH2r7#16:d5d4, https://lichess.org/8wEHH2r7#48:d3b1, https://lichess.org/eXMS7FXg#40:c4a3
- `opponent_has_exactly_one_legal_reply`: https://lichess.org/pQZ75avT#40:e8e1, https://lichess.org/gnZKEbgl#16:d8d1, https://lichess.org/0QcVliUS#40:h3f3
- `mate_delivered`: https://lichess.org/RbdZDMbi#40:e3g1
- `moved_piece_double_attack_survives_every_reply`: https://lichess.org/n3KqFmBK#24:d4f2, https://lichess.org/fYU9fLxA#16:d8f6

