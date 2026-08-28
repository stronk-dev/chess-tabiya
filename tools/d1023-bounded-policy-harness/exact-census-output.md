# D1023 exact named-target census

A target is one pre-candidate `threat@1` positive material capture with exact attacker/target identity. `removed` means that same attacker cannot make a positive legal exchange capture of the tracked target immediately after the candidate. It is not a plan, prophylaxis, force or move grade.

| population | decisions with target / all | target identities | played removed / preserved / identity-lost | alternatives removed / preserved / identity-lost | removed rate played / alternatives / lift |
|---|---:|---:|---:|---:|---:|
| authored pack spines | 116/754 | 147 | 120 / 27 / 0 | 969 / 3901 / 0 | 81.63% / 19.90% / 4.10x |

authored pack spines played causes (preserved / attacker captured / target moved / capture illegal / exchange neutralized / identity lost): 27 / 47 / 36 / 3 / 34 / 0.
authored pack spines alternative causes: 3901 / 73 / 429 / 81 / 386 / 0.
authored pack spines played-removal examples: anti-caro-advance-early-c5/nf3-dev:c6e5->g1f3:exchange_neutralized, anti-caro-advance-early-c5/b4-clamp:f8c5->b2b4:exchange_neutralized, anti-caro-advance-early-c5/be3-shield:f8c5->c1e3:exchange_neutralized, anti-caro-advance-early-c5/cxd4-free:d4c5->c5d4:attacker_captured, anti-italian-center-attack-black/p10-exd4:d4c5->e5d4:attacker_captured, anti-italian-center-attack-black/p10-exd4:d4e5->e5d4:attacker_captured, anti-italian-center-attack-black/p12-bb4:d4c5->c5b4:target_moved, anti-italian-center-attack-black/p17-exd5:d5c4->e4d5:attacker_captured, anti-italian-center-attack-black/p17-exd5:d5e4->e4d5:attacker_captured, anti-italian-center-attack-black/p18-nxd5:d5c6->f6d5:attacker_captured, anti-kid-classical-white/p14-nc6:d4e5->b8c6:exchange_neutralized, anti-kid-classical-white/p16-ne7:d5c6->c6e7:target_moved.
authored pack spines identity-loss examples: none.
authored pack spines played bounded (evaluated / removed-now / reintroduced / survives-every-defence / budget-exhausted): 147 / 120 / 69 / 2 / 0.
authored pack spines alternative bounded: 4870 / 969 / 865 / 9 / 0.
authored pack spines visited positions played p50/p90/p99/max: 1 / 1470 / 1826 / 1913; alternatives: 1 / 1244 / 1694 / 2029.
authored pack spines played reintroduction examples: anti-caro-advance-early-c5/nf3-dev:c6e5->g1f3,a7a5,f3d2,c6e5; anti-caro-advance-early-c5/b4-clamp:f8c5->b2b4,a7a5,b4a5,f8c5; anti-caro-advance-early-c5/be3-shield:f8c5->c1e3,a7a5,e3c1,f8c5; anti-italian-center-attack-black/p12-bb4:d4c5->c5b4,b1c3,b4c5,d4c5; anti-kid-classical-white/p14-nc6:d4e5->b8c6,a1b1,c6a5,d4e5; anti-kid-classical-white/p16-ne7:d5c6->c6e7,a1b1,e7c6,d5c6; anti-london-black/p10-e6:d4c5->e7e6,a1b1,c6e7,d4c5; anti-scandinavian-white/p6-qa5:c3d5->d5a5,a1b1,a5a2,c3a2; anti-scandinavian-white/p12-bh5:h3g4->g4h5,a1b1,h5g4,h3g4; anti-scandinavian-white/p14-bg6:g4h5->h5g6,a1b1,g6f5,g4f5; anti-scandinavian-white/p6-qd8:c3d5->d5d8,a1b1,d8d5,c3d5; anti-sicilian-najdorf-english-attack/p9-nc3:f6e4->b1c3,a7a5,c3a4,f6e4.
authored pack spines played survives-every-defence examples: iqp-black-tarrasch-defence/be6-develop:c3d5->c8e6,d1b3,a7a5,c3d5; iqp-black-tarrasch-defence/be6-develop:g2d5->c8e6,d1b3,a7a5,g2d5.
authored pack spines execution timing (call p95/max/count; cold position; warm position p95/max/count; max target×candidate pairs): 12.40 ms / 753.88 ms / 5017; 88.19 ms; 367.10 ms / 1305.12 ms / 116; 111.

| sealed imported fixed-ply sample | 183/579 | 255 | 188 / 67 / 0 | 2309 / 6618 / 0 | 73.73% / 25.87% / 2.85x |

sealed imported fixed-ply sample played causes (preserved / attacker captured / target moved / capture illegal / exchange neutralized / identity lost): 67 / 46 / 70 / 36 / 36 / 0.
sealed imported fixed-ply sample alternative causes: 6618 / 109 / 870 / 798 / 532 / 0.
sealed imported fixed-ply sample played-removal examples: https://lichess.org/pOwXJnoO#24:g4f5->f5e3:target_moved, https://lichess.org/82AjXY9N#24:c6d8->b7c6:attacker_captured, https://lichess.org/GeGxAAq6#24:e5d6->d6e5:attacker_captured, https://lichess.org/fd37KgOs#32:g3d6->e8d7:exchange_neutralized, https://lichess.org/50gVKdhE#8:d4c5->e5d4:attacker_captured, https://lichess.org/50gVKdhE#8:d4e5->e5d4:attacker_captured, https://lichess.org/50gVKdhE#32:d5c6->c6e5:target_moved, https://lichess.org/50gVKdhE#48:e1e7->e7g5:target_moved, https://lichess.org/ty2aVHes#24:a1d1->d1h5:target_moved, https://lichess.org/ty2aVHes#24:c3d1->d1h5:target_moved, https://lichess.org/ty2aVHes#24:e1d1->d1h5:target_moved, https://lichess.org/FLpiXGM1#16:g4h5->h5g6:target_moved.
sealed imported fixed-ply sample identity-loss examples: none.
sealed imported fixed-ply sample played bounded (evaluated / removed-now / reintroduced / survives-every-defence / budget-exhausted): 255 / 188 / 130 / 0 / 0.
sealed imported fixed-ply sample alternative bounded: 8927 / 2309 / 1958 / 29 / 0.
sealed imported fixed-ply sample visited positions played p50/p90/p99/max: 59 / 1577 / 2140 / 2185; alternatives: 1 / 1405 / 1979 / 2527.
sealed imported fixed-ply sample played reintroduction examples: https://lichess.org/pOwXJnoO#24:g4f5->f5e3,a1b1,e3f5,g4f5; https://lichess.org/fd37KgOs#32:g3d6->e8d7,a1b1,d7d8,g3d6; https://lichess.org/50gVKdhE#32:d5c6->c6e5,a1b1,e5c6,d5c6; https://lichess.org/50gVKdhE#48:e1e7->e7g5,a1b1,g5c1,e1c1; https://lichess.org/ty2aVHes#24:a1d1->d1h5,a1b1,h5d1,b1d1; https://lichess.org/ty2aVHes#24:c3d1->d1h5,a1b1,h5d1,c3d1; https://lichess.org/ty2aVHes#24:e1d1->d1h5,a1b1,h5d1,e1d1; https://lichess.org/FLpiXGM1#16:g4h5->h5g6,a1b1,g6f5,g4f5; https://lichess.org/FLpiXGM1#32:g3f5->f5b5,a1b1,b5f5,g3f5; https://lichess.org/TMsn9me9#32:d5a8->a8b8,a1b1,b8a8,d5a8; https://lichess.org/TMsn9me9#40:e6d7->d7b6,a1b1,b6d7,e6d7; https://lichess.org/CmcgG2om#24:b3b7->d5b6,a1a2,b6a4,b3b7.
sealed imported fixed-ply sample played survives-every-defence examples: none.
sealed imported fixed-ply sample execution timing (call p95/max/count; cold position; warm position p95/max/count; max target×candidate pairs): 10.26 ms / 158.68 ms / 9182; 133.36 ms; 343.68 ms / 993.43 ms / 183; 333.

## Pawn-created minor-destination targets

A destination target is the same named bishop/knight and empty square: legal and locally non-losing before a pawn move, still legal but locally losing specifically to the moved pawn after it. Bounded return asks whether that same minor-to-square move becomes locally non-losing again after one opponent preparation and one defender reply.

| population | played candidates / abstained / targets | alternative candidates / abstained / targets | target return played / alternatives | survives every defence played / alternatives |
|---|---:|---:|---:|---:|
| authored pack spines | 754 / 0 / 75 | 19619 / 0 / 1875 | 75/75 / 1827/1875 | 0/75 / 0/1875 |

authored pack spines destination return cause played (controlling pawn moved/captured / other): 72 / 3; alternatives: 1807 / 20.
authored pack spines destination visited positions played p50/p90/p99/max: 1300 / 1652 / 1867 / 1867; alternatives: 1301 / 1684 / 1891 / 2034.
authored pack spines destination reintroduction examples: anti-caro-advance-early-c5/c3-brace:c2c3:c6>b4->c2c3,a7a5,c3c4,c6b4; anti-caro-advance-early-c5/b4-clamp:b2b4:c6>a5->b2b4,a7a6,b4b5,c6a5; anti-caro-advance-early-c5/cxd4-free:c5d4:b1>c3->c5d4,a2a3,d4d3,b1c3; anti-caro-advance-early-c5/cxd4-free:c5d4:c1>e3->c5d4,a2a3,d4d3,c1e3; anti-dutch-leningrad-white/p12-d6:d7d6:f3>e5->d7d6,a2a3,d6d5,f3e5; anti-dutch-leningrad-white/p14-c6:c7c6:c3>b5->c7c6,a1b1,c6c5,c3b5; anti-dutch-leningrad-white/p14-c6:c7c6:c3>d5->c7c6,a1b1,c6c5,c3d5; anti-dutch-leningrad-white/d5-clamp:d4d5:c8>e6->d4d5,a7a5,d5c6,c8e6; anti-french-advance-white/b4-gain:b2b4:c6>a5->b2b4,a7a6,b4b5,c6a5; anti-french-advance-white/c4-clamp:c5c4:f1>d3->c5c4,b2b3,c4b3,f1d3; anti-italian-center-attack-black/p7-c3:c2c3:c5>b4->c2c3,c6d4,c3d4,c5b4; anti-italian-center-attack-black/p7-c3:c2c3:c5>d4->c2c3,c6b4,c3b4,c5d4.
authored pack spines destination survives-every-defence examples: none.

| sealed imported fixed-ply sample | 579 / 4 / 52 | 18842 / 4 / 1749 | 50/52 / 1707/1749 | 0/52 / 0/1749 |

sealed imported fixed-ply sample destination return cause played (controlling pawn moved/captured / other): 49 / 1; alternatives: 1681 / 26.
sealed imported fixed-ply sample destination visited positions played p50/p90/p99/max: 1177 / 1493 / 2053 / 2053; alternatives: 1246 / 1693 / 2121 / 2265.
sealed imported fixed-ply sample destination reintroduction examples: https://lichess.org/82AjXY9N#24:b7c6:c3>b5->b7c6,a1b1,c6c5,c3b5; https://lichess.org/fd37KgOs#40:b5b4:e2>c3->b5b4,a1a2,b4b3,e2c3; https://lichess.org/50gVKdhE#8:e5d4:c1>e3->e5d4,a2a3,d4c3,c1e3; https://lichess.org/ty2aVHes#8:d7d6:f3>e5->d7d6,a1b1,d6d5,f3e5; https://lichess.org/FLpiXGM1#8:c7c6:c3>b5->c7c6,a1b1,c6c5,c3b5; https://lichess.org/FLpiXGM1#8:c7c6:f1>b5->c7c6,a1b1,c6c5,f1b5; https://lichess.org/FLpiXGM1#24:f6g5:d2>f4->f6g5,a1b1,g5g4,d2f4; https://lichess.org/FLpiXGM1#24:f6g5:f3>h4->f6g5,a1b1,g5g4,f3h4; https://lichess.org/TSqMPWqg#8:b7b5:d3>c4->b7b5,a2a3,b5b4,d3c4; https://lichess.org/hU10ITVj#16:b7b5:c2>a4->b7b5,a2a3,b5b4,c2a4; https://lichess.org/hU10ITVj#24:d5c4:c2>d3->d5c4,a1a2,c4b3,c2d3; https://lichess.org/Xs8B1Gj8#8:h7h6:f4>g5->h7h6,a2a3,h6h5,f4g5.
sealed imported fixed-ply sample destination survives-every-defence examples: none.
