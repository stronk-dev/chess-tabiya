# D3262 — exact local relation contrast on the selected target frame

**2026-09-23 · disposable comparison projection, not a move grade or a full search arm.**
The checked `d3262-local-relation-contrast.json` has SHA-256
`c3f34bf31ab8219e5bd5307481ee07405e837c5bf9a2ae828604a28e21814e03`.
`make semantic-search-local-contrast` joins the frozen target/candidate frame to the exact
material and destination witness readings. It compares a predecessor-observed candidate
with a newly selected legal alternative under the **same root and named target**. A
predecessor-observed candidate is not necessarily the move played in a game. The projection
does not choose a best move, infer the player's intent or claim a global cause. `[V]` The
artifact and `tools/d3262-search-calibration/local-relation-contrast.test.mjs`.

The 64 registered target groups yield 123 source/alternative pairs across 47 groups.
Seventeen groups have no newly selected alternative and remain explicitly unpaired; the
tool does not divide by 64 while silently evaluating only 47. `[V]` The checked artifact.

| Target family | Source-only local relation | Alternative-only | Same local relation | Not comparable |
|---|---:|---:|---:|---:|
| Material positive named capture | 23 | 12 | 33 | 0 |
| Destination named-pawn punishment | 54 | 0 | 0 | 1 |

For material, the local relation is whether the exact named attacker has a legal
positive-exchange capture of the named target immediately after the candidate. The twelve
reverse-direction pairs matter: a newly selected alternative can expose a positive capture
where the predecessor candidate does not. The 33 same-relation pairs do **not** establish
that the two candidates are strategically equivalent. For destination, 54 pairs contrast
declared-pawn punishment of a named minor arrival with a locally safe arrival. In the
remaining pair the alternative has already removed the minor; that is not “safe arrival”
and is typed `not_comparable_minor_absent`. `[V]` The checked artifact and its independent
material/destination source receipts.

This is a usable *local contrast operand* for a future why-card: “under candidate A the
registered capture is available, under B it is not” may be rendered with exact witness
paths and perspective after the semantic proof layer admits it. It does not yet establish
that A is recommended by Stockfish, that the relation caused the engine preference, or
that all replies preserve the contrast. The 17 no-alternative groups ([[D3282]]) and the
event-conditioned continuation/proof gap ([[D3262]]) remain explicit. `[V]`
`d3262-preregistration.md`.
