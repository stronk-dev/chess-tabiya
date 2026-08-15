# R1 raw output — 593 spine transitions, 35 packs

## Cost (median of 25 passes over the whole corpus, microseconds per ply)

| Primitive | µs/ply |
|---|---|
| FEN parse ×2 (shared substrate) | 5.48 |
| attackMap ×2 (shared substrate) | 5.08 |
| P1 attacks created/removed | 2.81 |
| P2 defences created/removed | 4.52 |
| P3 lines opened/closed | 4.48 |
| P4 control delta (64 squares × 2 colours) | 0.13 |
| P5 escape squares removed | 1.63 |
| P6 defended-duty count delta (overload) | 2.61 |
| P7a tempo — gives check | 0.12 |
| P7b tempo — reply count (legality search, 1 ply) | 1.72 |
| P8a irreversibility — halfmove-clock zeroing (FEN field) | 0.17 |
| P8b irreversibility — pivotal.ts classification | 0.18 |
| P9 vacationReading (shipped, dead) | 5.1 |
| P10 structuralDelta (shipped, dead) | 1709.56 |
| P10b structuralReading ×2 (structuralDelta's own inputs) | 949.04 |
| P11 routing — distance-to-square-set for the mover | 0.2 |
| pawnSafety — one shipped call (re-parses the FEN) | 2.98 |
| BUNDLE: P1..P8b + P11 in one pass from two FEN strings | 27.58 |
| BUNDLE on dense positions (>=24 pieces, n=293) | 31.44 |
| BUNDLE on sparse positions (<=8 pieces, n=229) | 6.76 |
| structuralDelta on sparse positions (n=229) | 596.36 |

## Firing census (share of the 593 transitions where the primitive reports anything)

- P1 attacks created or removed: 300 (50.6%); mean attacks created per ply 0.75
- P2 defences created or removed: 444 (74.9%)
- P3 lines opened or closed: 312 (52.6%)
- P4 control delta: mean 9.7 of 64 squares change control per ply
- P5 escape squares removed from an enemy piece: 363 (61.2%)
- P6 a piece acquires a second defensive duty: 40 (6.7%)
- P7a move gives check: 42 (7.1%)
- P8a halfmove clock zeroed: 82 (13.8%)
- P8b pivotal irreversibility fires: 78 (13.2%)
- P9 vacationReading reports an unblock: 289 (48.7%)
- P10 structuralDelta reports a gained/lost observation: 553 (93.3%)
