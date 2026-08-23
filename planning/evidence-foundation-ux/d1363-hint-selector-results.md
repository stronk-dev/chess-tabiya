# D1363 hint-selector results

Input: `sha256:53051e9671e801ecb71c209a052b54da53d97873b07d0c85298b8d70043d4162`; runtime: `sha256:9b9831400163b62a159377b8a9e1921509bfd665e9aa5b27687dc7f74839159c`.

| arm | raw reach | root-side reach | root-edge reach | raw opponent selections | raw ≠ root-side | p95 selector time |
|---|---:|---:|---:|---:|---:|---:|
| depth12 | 39/64 (60.9%) | 30/64 (46.9%) | 21/64 (32.8%) | 16 | 16 | 1529.1 ms |
| movetime100_a | 33/64 (51.6%) | 22/64 (34.4%) | 21/64 (32.8%) | 12 | 12 | 1375.7 ms |

## Candidate incidence

| family | candidates |
|---|---:|
| mate_in_one | 0 |
| forced_mate | 0 |
| double_attack | 8 |
| fork_survives_reply | 1 |
| discovered_executed | 8 |
| loose_piece | 130 |
| promotion_pressure | 3 |

Candidate perspective: root 72; opponent 78; unclassified 0.

## Phase split

| arm / phase | candidates | raw reach | raw opponent selections |
|---|---:|---:|---:|
| depth12:opening | 36 | 15/24 | 9 |
| depth12:middlegame | 23 | 9/16 | 1 |
| depth12:cross_phase | 29 | 15/24 | 6 |
| movetime100_a:opening | 17 | 13/24 | 9 |
| movetime100_a:middlegame | 22 | 8/16 | 0 |
| movetime100_a:cross_phase | 23 | 12/24 | 3 |

Perspective gate: **FAIL**. A failure returns the selector to the author; it is not a chess-quality verdict.

Latency-headroom gate: **FAIL**. This is selector-only latency and does not satisfy the required end-to-end cold/warm/provider-off receipt.

The four readings are diagnostic. Root-side or ply-1 occurrence still does not establish causality, recommendation, or usefulness.
