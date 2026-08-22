# D872 Review engine operand output

Engine: Stockfish 18; shipped StockfishEvidenceExecutor; Threads 1, Hash 16, MultiPV 1; resetSearchState true.
Population: 24 fixed imported transitions, 4 each at plies 8/16/24/32/40/48; both endpoints evaluated at movetime 50/100/200 ms.

| budget | transitions | cp→cp | any mate score | pair elapsed ms median / p90 | absolute cp swing median / p90 |
|---:|---:|---:|---:|---:|---:|
| 50 ms | 24 | 22 | 2 | 111.6 / 113.4 | 22 / 61 |
| 100 ms | 24 | 22 | 2 | 211.6 / 212.3 | 17 / 69 |
| 200 ms | 24 | 22 | 2 | 411.6 / 412.9 | 18 / 71 |

## Cross-budget stability

| comparison | shared cp transitions | delta sign agreement | |swing difference| median / p90 cp | top-8 moment Jaccard |
|---|---:|---:|---:|---:|
| 50→100 ms | 22 | 15/22 (68.2%) | 8 / 39 | 0.455 |
| 100→200 ms | 22 | 18/22 (81.8%) | 9 / 22 | 0.778 |
| 50→200 ms | 22 | 14/22 (63.6%) | 14 / 40 | 0.600 |

Interpretation: these are stability/cost measurements of signed recorded evaluation differences. No threshold, inaccuracy/blunder word, significance claim, best-move recommendation or Review-selection policy is inferred. Mate scores remain typed separately from centipawns.
