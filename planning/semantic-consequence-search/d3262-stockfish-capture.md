# D3262 — complete-root Stockfish source capture

**2026-09-23 · provider source receipt, not five-arm calibration.** The checked artifact is
`d3262-stockfish-capture.json`, SHA-256
`bc751f859173b9b3cf294e615f41ceeeb036e8661d0f335d763ebb0592fdf910`.
Run `make semantic-search-stockfish-check` to recompute the summary, legal move denominator,
stored-PV legality and input join without starting Stockfish; four mutation controls refuse a
changed root, silent legal omission, disconnected PV and erased score-bound flag. The original command was
`make semantic-search-stockfish-capture` on the frozen 66-root manifest.

Stockfish 19, executable SHA-256
`dc2f18c34ae962dff591b66147d220ec06e61d756b93d8a4f5e04fd8e55c251f`, one thread,
16 MiB hash, on macOS 27.0 / arm64 / Apple M3 Max / 36 GB with Node 24.21.0. Complete legal-root MultiPV supplied 2,013 move entries at each of depth 8,
depth 12 and 100 ms. All stored PVs replay legally and all 66 roots match manifest digest
`244c750c432e0a73f37b32fcbfcc8158a6b511d980fcf9b0267d95f8506dff86`. No legal move
was silently omitted. `[V]`

| Budget | Legal / retained | Bounded raw scores | p50 / p95 / max root query |
|---|---:|---:|---:|
| depth 8 | 2,013 / 2,013 | 0 | 95.16 / 212.74 / 284.29 ms |
| depth 12 | 2,013 / 2,013 | 0 | 1,464.17 / 2,802.21 / 4,320.27 ms |
| 100 ms | 2,013 / 2,013 | 53 | 102.44 / 103.99 / 108.67 ms |

The 53 100-ms bounded scores are retained as `score.bound`, not silently treated as exact ranks.
The raw UCI score perspective remains uninterpreted until a separately verified value adapter
normalizes it. The depth-12 p95 exceeds 1,500 ms *if completion is required before an available
state*, before semantic traversal, transport or rendering. It does **not** refute an asynchronous
pending-state default: the hint RFC allows a prompt honest pending state. That end-to-end pending
latency, later render latency and learner wait cost remain unmeasured. The 100-ms query is only a
source-time observation; it has not passed an end-to-end or semantic-correctness gate. `[V]`

The Maia root-source capture has now landed in `d3262-maia-capture.md`; its child-node mass
frontier, exact reply and both pruned frontiers are still absent. No D3262 search
profile, causal claim or production default is selected. [[D3262]] and the semantic search RFC's
criterion 23/Discharge D1 remain open. The next provider arm must retain per-node Maia
`{moveUci, mass}` on the traversal nodes, distinguish raw model mass from configured sampling,
and account for unreturned moves; the old D1023 aggregate cannot substitute. `[V]`
