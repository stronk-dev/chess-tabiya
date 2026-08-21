# D730 legal-exchange output

`legal-exchange@1` is legal recapture-only minimax under P1/N3/B3/R5/Q9. Lift is discrimination, not truth or move quality.

## authored pack spines

Rows 717; alternatives 19619; elapsed 769.9 ms (0.0379 ms per evaluated edge).

| probe | played n/rate | alternatives n/rate | lift (paired position bootstrap 95%) |
|---|---:|---:|---:|
| `meaningful_fork` | 10 / 1.395% | 159 / 0.810% | 1.72x (0.72–2.94) |
| `geometry_fork` | 12 / 1.674% | 458 / 2.334% | 0.72x (0.35–1.14) |
| `moved_piece_en_prise` | 60 / 8.368% | 4502 / 22.947% | 0.36x (0.28–0.45) |

First geometry/exchange disagreements: `anti-italian-center-attack-black/p9-d4:d2d4:exchange-only`, `anti-italian-center-attack-black/p16-d5:d7d5:exchange-only`, `carlsbad-minority-attack/ne4-trade:f6e4:geometry-only`, `carlsbad-minority-attack/bxe7-trade:g5e7:geometry-only`, `closed-centre-chain-black-base-strike/nfxd4-take:f5d4:geometry-only`.

## sealed imported CC0 sample

Rows 577; alternatives 18842; elapsed 792.5 ms (0.0408 ms per evaluated edge).

| probe | played n/rate | alternatives n/rate | lift (paired position bootstrap 95%) |
|---|---:|---:|---:|
| `meaningful_fork` | 29 / 5.026% | 484 / 2.569% | 1.96x (1.32–2.71) |
| `geometry_fork` | 27 / 4.679% | 883 / 4.686% | 1.00x (0.65–1.40) |
| `moved_piece_en_prise` | 93 / 16.118% | 5290 / 28.076% | 0.57x (0.47–0.69) |

First geometry/exchange disagreements: `https://lichess.org/FLpiXGM1#40:b5d3:geometry-only`, `https://lichess.org/CmcgG2om#32:c6d4:geometry-only`, `https://lichess.org/CTpsOdRL#40:e4d4:geometry-only`, `https://lichess.org/CTpsOdRL#48:e8d7:geometry-only`, `https://lichess.org/MNHJ5B9Z#16:c6d4:geometry-only`.

