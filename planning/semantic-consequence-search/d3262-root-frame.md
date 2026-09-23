# D3262 — shared selected-candidate root frame

**2026-09-23 · deterministic input to the five-arm traversal, not an arm result.**
`d3262-root-frame.json` has SHA-256
`2c98378b77badd7a25074299300480abc77fb3f96eaf9ea0c613f40fb719bf6c`.
`make semantic-search-root-frame` regenerates the frame from the two frozen provider captures and
checks exact bytes; four tests cover the full source union, castling identity/raw-byte retention,
honest unknown Maia mass and refusal of an invented legal candidate. No provider request occurs.
`[V]`

Each root starts from its complete Stockfish-checked legal set. The selected set is the union of
every D1023 source candidate (or special control), rank-one Stockfish move at depth 8, depth 12
and 100 ms, and rank-one **raw-mass** Maia move. Duplicate legal identities coalesce, but each
origin remains named. Across 66 roots and 2,013 legal moves this yields **196 selected
root-candidates**: two roots have one, 23 have two, 22 have three, 13 have four, and six have five.
This is selection for measurement, not endorsement or grading. `[V]`

Fifty-nine roots have at least one legal move outside Maia's returned list. Twenty-one selected
candidates have no returned Maia mass and are stored as `null`, never as zero. The frame retains
raw Maia UCI alongside normalized legal move identity for castling, and keeps raw Stockfish scores
separate by budget. `maiaUnreturnedRawMassBound` is only aggregate residual mass from the listed
raw softmax, not a per-move probability and not the temperature/top-p bot sampling distribution
([[D3276]]). `[V]`

The next experiment must start every arm from these same root/candidate identities. Exact reply,
provider-line, engine beam, Maia-mass and semantic-target frontiers are not measured by this frame;
no production budget or claim of causal explanation is selected. [[D3262]] remains open.
