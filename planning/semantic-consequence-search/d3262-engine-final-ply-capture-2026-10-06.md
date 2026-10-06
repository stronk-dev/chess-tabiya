# D3262 / D3478 — complete original final-ply engine source

2026-10-06. Disposable provider research under RFC-0000's exploration gate.
This supersedes only the in-flight engine state in
`d3262-final-ply-capture-2026-10-06.md`; that earlier Maia/source-repair receipt
and its historical measurements remain valid.

## Complete population, unchanged source

The original batch finished **16,813 / 16,813 positions**, retaining all **673**
immutable intervals. Its initial checked interval was reused; 672 subsequent
intervals were captured without restarting, replacing the frame, changing budgets
or counting a prefix as complete. The frozen frame digest remains
`3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07`.

All **35,389** requested budget queries retain **1,150,992 repeated legal-move
observations** and **278,160 coherent ranked entries**. The **9,837** unfinished
deeper tables are recorded as trailing partials; their individual ranks do not
replace the previous complete single-depth table. Source: the actual full merge,
`d3262-stockfish-third-ply-capture.json.gz` and the checks below.

Stockfish 19 executable SHA-256 remains
`dc2f18c34ae962dff591b66147d220ec06e61d756b93d8a4f5e04fd8e55c251f`.
Queries use one thread, 16 MiB hash, standard castling and per-query fresh
game/cleared hash, with only each job's frozen budgets and coherent top-eight
legal-move MultiPV. Raw cp/mate/bound values remain provider observations.

Portable gzip SHA-256:
`409cc2bb906dccae58a1231ae2381fa0e057701a8cd7282f76a8c713a9e3d55d`.
Logical SHA-256:
`d4cf355c96baa6df0a069ad77ea4006669187963a84df828b65426b9faf24290`.
Storage is 9,571,274 compressed / 65,979,869 logical bytes. Compression does not
alter rows, budgets, timings or original interval digests.

## Verification

- `make semantic-search-stockfish-final-ply-merge semantic-search-stockfish-final-ply-check`
  passes the full population, literal frame/source/legal denominators, coherent
  ranks, legal PVs and query timings.
- `make semantic-search-stockfish-final-ply-independent` passes independent
  python-chess 1.11.2 replay of all 16,813 positions / 35,389 queries / 278,160
  entries and **2,388,305 PV moves**, plus every original interval's literal
  bytes/hash/rows. All 673 interval comparisons pass.
- Eight actual source corruptions refuse: lost position, crossed source, lost
  budget, lost legal move, changed depth, illegal PV, forged timing and illegal
  bestmove. Five independent source unit controls pass.
- `make semantic-search-final-ply-source-test` passes all 16 retained source
  controls, including the complete Maia source and original-budget/merge/history
  boundaries. No source/test tier or timeout is weakened.

## Scope and next joins

D3478 closes **source capture/join only**. The complete 1,401-history Maia source
and its independent pinned-model re-inference landed earlier in the superseded
checkpoint; this engine source completes the other frozen queue. Engine numeric
scores were not independently re-inferred. Capture ran on a concurrent host,
so its individual timings are not controlled cold/warm/offline or end-to-end
interactive cost measurements.

The provider contract distinguishes no legal moves from automatic game outcomes.
Some captured legal-move tables belong to insufficient-material outcomes; a search
compiler must absorb those positions rather than manufacture continuation. D3485
owns the actual fourth-ply join and D3486 the same named target observations.
Recursive semantic traversal, common proof/refutation/contrast/cost, criterion 23,
Discharge D1, production search authorization and full 1.0 remain open. No official
pack, RFC, capability or milestone is promoted by a source capture.
