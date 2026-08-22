# D872 Review engine/mate agreement output

Engine: Stockfish 18; shipped StockfishEvidenceExecutor; 100 ms; Threads 1, Hash 16, MultiPV 1.
Population: 24 deterministic rows from each already-proved exact mate-in-2/3/4 source arm, evaluated after the fixed candidate first move.

| exact source horizon | rows | engine returned typed mate | winner-sign agreement | remaining mate distance median / p90 | latency ms median / p90 |
|---:|---:|---:|---:|---:|---:|
| 2 | 24 | 24/24 | 24/24 | 1 / 1 | 7.2 / 7.4 |
| 3 | 24 | 24/24 | 24/24 | 2 / 2 | 9.0 / 12.4 |
| 4 | 24 | 24/24 | 24/24 | 3 / 3 | 30.8 / 43.3 |

Interpretation: exact legal-tree proof remains the authority for the bounded mating-net event. A typed engine mate score is a separately grounded measured reading that Review may join when present; a centipawn result at this budget is engine absence, not refutation of the proof.
