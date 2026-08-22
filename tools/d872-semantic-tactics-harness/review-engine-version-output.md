# D916 C4 engine-version stability output

Engines: Stockfish 17.1 and Stockfish 18; official release binaries; shipped StockfishEvidenceExecutor; 100 ms; Threads 1, Hash 16, MultiPV 1.
Population: 24 fixed imported transitions, 4 each at plies 8/16/24/32/40/48; both endpoints evaluated for typed eval and White-normalized WDL.

| operand | eligible rows/points | sign or type agreement | difference median / p90 | top-8 moment Jaccard |
|---|---:|---:|---:|---:|
| cp→cp delta | 22 | 17/22 (77.3%) | 10 / 28 cp | 0.600 |
| White-normalized WDL delta | 23 | 20/23 (87.0%) | 0.9 / 4.1 pp | 0.600 |
| cp/mate point type | 48 | 48/48 (100.0%) | 3 points involve mate in either release | n/a |

Interpretation: version is part of every engine operand. Agreement may justify a default budget/version, but it never creates a timeless grade or a cross-source scalar. Mate remains a distinct type; WDL is normalized to one declared subject before any delta.
