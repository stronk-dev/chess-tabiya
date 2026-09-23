# D3262 — horizon-two raw-Maia frontier projection

**2026-09-23 · one child layer, not the completed Maia-mass arm.**
`d3262-maia-child-prefix.json`, SHA-256
`d3a6775c58cb17f200b3f9a8af05f69bd6b025e90b86f1fb94c31256dfce8ab6`,
joins the checked child capture to the frozen 185 named target/candidate questions. At each of
196 selected candidate-child positions, it takes the smallest ranked returned prefix whose
**raw model** mass reaches 0.80 or 0.90, subject to the preregistered eight-move cap. Run
`make semantic-search-maia-child-prefix`; four negative/positive tests check the denominator,
mass accounting, minimal prefix, named legal reply, source-off and missing-mass abstentions,
and refuse a claim that this is configured sampling probability. `[V]` The checked projection
and `tools/d3262-search-calibration/maia-child-prefix.test.mjs`.

| Raw-model threshold | Reached / 196 | Cap exhausted / 196 | Named reply in prefix / 185 | Returned, outside prefix / 185 | Unreturned, individual mass unknown / 185 | No named reply / 185 |
|---|---:|---:|---:|---:|---:|---:|
| 0.80 | 191 | 5 | 55 | 52 | 32 | 46 |
| 0.90 | 168 | 28 | 65 | 42 | 32 | 46 |

Among the 32 declared source pawn-denial controls, the named minor-arrival reply is in the
prefix once, in the returned tail five times, and outside the returned window 26 times at
**both** thresholds. Its omission does not mean Maia assigns it zero probability. These are
selected natural-alternative comparisons, not an estimate of player populations or a verdict
that one move is better. `[V]` The checked projection.

This is a real per-node provider reading, replacing a root-only proxy for horizon two. It
does **not** run the horizon-four traversal, re-query Maia after each subsequent node, apply
configured temperature/top-p sampling, preserve semantic target identity through a reply, or
establish a proof-class result. The five-arm reach/cost comparison and the choice of any
production search profile remain open under [[D3262]]. `[V]` `d3262-preregistration.md`.
