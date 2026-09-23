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

## Post-capture source-closure receipt — 2026-09-23

The 267 Stockfish supplement positions are now captured with the pinned
Stockfish 19 binary and coherent top-eight rank tables at depth 8, depth 12
and 100 ms. The independent check reconstructs 24,123 legal-move instances,
6,360 ranked entries and 226 explicitly labelled trailing partial iterations;
its capture SHA-256 is
`7d163bcf173380b01706dbb4c333ad3ad9bca9076d24bc9799c25ea1cd030ea9`.
The 250 path-keyed Maia3-5M queries are also captured after replaying the
existing control distribution in the pinned local container. The checker
reconstructs 7,566 legal moves and 946 configured-support entries, with zero
terminal paths; capture SHA-256
`2de17dd0471e914c2d894fcd1fdaf579c53ec09cf23a3c9bf5911299f5ce3fa6`.
These are model-policy masses, **not** human frequencies.

The checked union SHA-256
`31e8f9ba654ffcb306d22d8b7455500049c931c66aea58ee7a2e9cb0da9a55da`
binds all 1,966 selected paths to both providers: Stockfish 1,699 paths
from the prior FEN capture and 267 from the supplement; Maia 1,716 paths
from prior exact histories and 250 from the supplement. The one same-FEN
pair remains two distinct Maia path identities. Negative fixtures refuse
missing or crossed source rows, legal-denominator loss, mixed engine depth
and forged policy mass. `make semantic-search-coherent-deeper-union-check`
replays the full chain. Source coverage is now complete for the *selected*
frontier, but the target-preserving arm, counterfactual proof/abstention and
end-to-end product cost still have not been measured. [[D3262]] and [[D3289]]
remain open.
