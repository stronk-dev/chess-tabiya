# D1329 projection/cost result

Verdict: **projection_gate_fail**. 169/180 positions completed the shipped candidate-evidence adapter; 5347/5664 sampled legal candidates therefore received its complete registered projection closure. No model was fitted and no identity, move, score or evidence payload is retained.

- Stockfish: Stockfish 18; depth 2; Threads 1; Hash 16; full legal root.
- Candidate-weighted projection success: 94.403% (gate ≥99%). A whole-position failure counts every legal candidate at that position as failed.
- Engine time across every sampled position: 1462.717699 ms; evidence projection time across completed positions: 101473.947713 ms.
- Generic flattened plane over completed positions: 2370 names, 3376630 non-zero scalars, 249314807 encoded bytes.
- Failure classes: mate_score_unrepresentable=11 positions/317 candidates.

| decisions | linear engine h | linear projection h | generic GiB | cap-16 GiB |
|---:|---:|---:|---:|---:|
| 10,000 | 0.022573 | 1.667882 | 13.739202 | 10.272763 |
| 100,000 | 0.225728 | 16.678821 | 137.392017 | 102.727634 |
| 1,000,000 | 2.25728 | 166.788211 | 1373.920165 | 1027.276343 |

The 8/16/32 compact columns are cardinality budgets, not selected features or a production schema. Linear estimates do not claim parallel scaling or training cost. Engine cost is normalized over all sampled positions; projection and storage cost are normalized over completed positions.
