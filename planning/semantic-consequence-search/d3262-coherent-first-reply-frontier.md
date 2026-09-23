# D3262 corrected first-reply frontier and deeper capture gap

**Measured 2026-09-23; provider reach, not a semantic explanation or move grade.**
The corrected 193-candidate graph contains 6,176 exact legal opponent replies.
The coherent Stockfish top-eight tables at three budgets and path-replayed
Maia3-5M configured mass select a union of 1,966 distinct reply paths; 1,965
different FENs. The checked frontier SHA-256 is
`1cb357c145d5b8c8ba15cd8b6bd752afb0e70d7b7e3758a0da4ebee022ff7438`.
It retains 1,938 paths from the 190 old candidates and 28 paths from the
three new candidates.

The engine widths are derived from each coherent ranked top-eight table,
not from a truncated all-legal table. At each budget, top two select 385
paths, top four 765, and top eight 1,516. Maia's configured cumulative-mass
prefix selects 414 at 0.80 and 508 at 0.90. These are overlapping
selections, not disjoint totals or estimates of human frequencies. The
old 190 candidates use the existing `root_candidate_path_per_row` Maia
history replay; the new three use the same configured path policy. The
empty-history direct-logits diagnostic is **not** substituted.

The old deeper capture does not cover the corrected frontier. A checked
path/position supplement frame, SHA-256
`6b8a06583ee16b7dff8bf06470eb82fa3244a79b75b9062b99097d8750eb5052`,
joins each selected path to the prior provider captures and produces exactly
250 missing Maia path-history jobs and 267 missing Stockfish FEN jobs.
1,716 selected paths have prior Maia evidence. Stockfish may share a source
across transpositions; Maia may not, because ordered path history changes its
policy even at the same FEN. `make semantic-search-coherent-first-reply-check`
and `make semantic-search-coherent-deeper-supplement-check` bind source
digests and refuse crossed history, absent source paths, illegal selections,
duplicate provider identities and graph mismatches.

The supplement is a capture queue, not captured evidence. The target-preserving
semantic arm has not been re-run on this corrected frame. No five-arm proof,
abstention, explanatory discrimination or cold/warm/offline cost verdict
follows from these reach counts. [[D3262]] and [[D3289]] remain open.
