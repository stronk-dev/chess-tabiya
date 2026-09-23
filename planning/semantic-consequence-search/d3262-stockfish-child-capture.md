# D3262 — Stockfish candidate-child source capture

**2026-09-23 · first child layer, not an engine-beam result.**
`d3262-stockfish-child-capture.json`, SHA-256
`fa78c3dbadc650332a225f754de339a0d58ac3f614a522e509d7347ce3966ff1`,
captures complete legal-move MultiPV at all 196 selected candidate-child positions from the
frozen exact-reply graph. `make semantic-search-stockfish-child-check` joins each position and
its independent chessops legal set to the graph, replays every stored PV, checks every score,
rank, bound flag, missing-move set, engine binary and input digest. Four mutation tests reject
crossed positions, silent legal omissions, missing budgets, invented scores/PVs/best moves,
substituted executables and graphs. `[V]` The checked artifact and
`tools/d3262-search-calibration/stockfish-child-capture-check.mjs`.

This used the same Stockfish 19 executable SHA-256
`dc2f18c34ae962dff591b66147d220ec06e61d756b93d8a4f5e04fd8e55c251f` as the root
receipt: one thread, 16 MiB hash, fresh game and cleared hash per query. The result covers all
6,310 legal opponent replies at each of depth 8, depth 12 and 100 ms; none was omitted.
Raw scores retain the UCI side-to-move perspective and bounds, without learner-grade or
value normalization. `[V]` The checked child and root receipts.

| Budget | Legal / retained | Bounded raw scores | p50 / p95 / max child query |
|---|---:|---:|---:|
| depth 8 | 6,310 / 6,310 | 0 | 111.17 / 242.70 / 301.01 ms |
| depth 12 | 6,310 / 6,310 | 0 | 1,313.75 / 2,817.93 / 4,426.59 ms |
| 100 ms | 6,310 / 6,310 | 148 | 102.31 / 105.90 / 109.98 ms |

These are sequential local source times, **not** end-to-end hint latency or a cost of a
complete width-8/horizon-4 traversal. A child score is an ordering observation for that
position, not evidence that a target survives a reply or that a move is good. The next
projection measures bounded beam reach; deeper per-node engine queries, proof receipts,
transposition reuse and the production profile decision remain open under [[D3262]]. `[V]`
`d3262-preregistration.md`.
