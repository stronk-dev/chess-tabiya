# D872 semantic-tactics population

Population: 250,587 complete records from the bounded official Lichess puzzle-export prefix; 1 truncated tail rejected.

Themes are automatically generated and vote-refined disagreement labels, not ground truth. Solution plies exclude the export's initial opponent setup move.

| theme | records | population | solution plies min / median / p90 | phase opening / middle / end | co-tagged with another listed semantic family |
|---|---:|---:|---:|---:|---:|
| `capturingDefender` | 1,642 | 0.7% | 3 / 3 / 5 | 155 / 1168 / 319 | 474 (28.9%) |
| `deflection` | 10,915 | 4.4% | 3 / 5 / 7 | 254 / 4344 / 6317 | 2,739 (25.1%) |
| `attraction` | 9,088 | 3.6% | 3 / 5 / 7 | 261 / 5121 / 3706 | 2,159 (23.8%) |
| `interference` | 928 | 0.4% | 3 / 5 / 7 | 45 / 525 / 358 | 274 (29.5%) |
| `clearance` | 3,352 | 1.3% | 3 / 5 / 7 | 143 / 2076 / 1133 | 829 (24.7%) |
| `intermezzo` | 2,891 | 1.2% | 1 / 3 / 5 | 254 / 1826 / 811 | 441 (15.3%) |
| `overloading` | 0 | 0.0% | n/a | 0 / 0 / 0 | 0 (n/a) |
| `discoveredAttack` | 12,668 | 5.1% | 1 / 3 / 5 | 790 / 7894 / 3984 | 1,796 (14.2%) |
| `trappedPiece` | 2,827 | 1.1% | 3 / 3 / 5 | 345 / 1820 / 662 | 265 (9.4%) |
| `backRankMate` | 8,502 | 3.4% | 1 / 3 / 5 | 40 / 2555 / 5907 | 410 (4.8%) |
| `quietMove` | 10,381 | 4.1% | 3 / 5 / 9 | 86 / 2118 / 8177 | 1,628 (15.7%) |
| `promotion` | 5,867 | 2.3% | 1 / 5 / 9 | 10 / 414 / 5443 | 1,775 (30.3%) |

## Largest pair overlaps

| pair | records |
|---|---:|
| attraction + deflection | 1,014 |
| promotion + quietMove | 773 |
| deflection + discoveredAttack | 682 |
| attraction + discoveredAttack | 488 |
| deflection + promotion | 477 |
| attraction + promotion | 304 |
| clearance + quietMove | 294 |
| backRankMate + deflection | 252 |
| deflection + quietMove | 195 |
| discoveredAttack + quietMove | 184 |
| capturingDefender + discoveredAttack | 153 |
| attraction + clearance | 147 |
| discoveredAttack + promotion | 133 |
| quietMove + trappedPiece | 128 |
| attraction + capturingDefender | 128 |
| clearance + discoveredAttack | 127 |
| capturingDefender + intermezzo | 117 |
| clearance + deflection | 115 |
| deflection + interference | 114 |
| backRankMate + promotion | 103 |

## Reproducible examples

- `capturingDefender`: 00Bp0, 00EbJ, 00SyL, 00n8z, 01Tr9.
- `deflection`: 001h8, 002Mm, 003IM, 004LZ, 004Op.
- `attraction`: 001w5, 003cs, 003mh, 004RF, 004zh.
- `interference`: 000h0, 002LF, 004Ud, 00Yuf, 00zDb.
- `clearance`: 004sg, 005HG, 00A8H, 00Aae, 00AhO.
- `intermezzo`: 004zh, 009XT, 00Aok, 00DII, 00Htd.
- `overloading`: none.
- `discoveredAttack`: 001XA, 002KJ, 003cs, 003wQ, 004RF.
- `trappedPiece`: 008nF, 009FP, 00AhO, 00BM8, 00DdW.
- `backRankMate`: 001Wz, 0030b, 003Tx, 0042j, 00465.
- `quietMove`: 001Oo, 001aK, 002mG, 00347, 004b0.
- `promotion`: 001w5, 004LZ, 004b0, 004zh, 005jR.

Interpretation: reach and co-occurrence price validation and fixture needs. They do not establish detector precision, causality, force, value or intent.
