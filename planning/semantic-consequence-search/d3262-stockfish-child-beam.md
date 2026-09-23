# D3262 — horizon-two engine-ordered beam reach

**2026-09-23 · first child layer, not the completed engine-beam arm.**
`d3262-stockfish-child-beam.json`, SHA-256
`c868e7130645002c7e92c563a4e308721c2fafaf19ba7e9633dc083884732c73`,
projects the checked child-source ranks into the preregistered widths 2, 4 and 8, separately
at depth 8, depth 12 and 100 ms. It retains all 196 candidate children and all 185 named
target/candidate questions at every setting. `make semantic-search-stockfish-child-beam`
checks the source, comparison frame and exact named replies; three tests refuse a crossed
reply or false score authority and keep an unreturned legal move as unknown rather than
assigning it an outside-beam rank. `[V]` The checked projection and
`tools/d3262-search-calibration/stockfish-child-beam.test.mjs`.

| Source budget | Width 2 named reply / 185 | Width 4 / 185 | Width 8 / 185 |
|---|---:|---:|---:|
| depth 8 | 28 | 39 | 58 |
| depth 12 | 34 | 43 | 60 |
| 100 ms | 30 | 43 | 64 |

Each setting has 46 comparisons with **no** named positive reply, so the eligible denominator
is 139, not 185. All named replies are present in the complete Stockfish child capture; those
outside a beam are retained source moves, not absent legal moves. These are rank-in-frontier
counts, not explanations, engine recommendations or outcome grades. `[V]` The checked projection.

The 32 declared source pawn-denial controls give a sharper negative control: their named minor
arrival is outside **every** width-8 beam at all three budgets. The same arrival was inside
the raw-Maia cap-eight prefix in one case, in its returned tail in five, and individually
unobserved in 26. This contrasts provider selection rather than proving that the minor arrival
is a good defence; it motivates the separately preregistered semantic-target-preserving arm.
`[V]` This projection and `d3262-maia-child-prefix.md`.

No engine beam has yet traversed the subsequent learner ply or horizon four, retained the
named target relation across that traversal, measured transpositions/memory, or issued a
proof-class result. The full five-arm comparison and production profile remain open under
[[D3262]]. `[V]` `d3262-preregistration.md`.
