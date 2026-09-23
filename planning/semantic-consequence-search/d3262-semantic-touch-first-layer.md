# D3262 — source-blind operand-touch census, first opponent reply

**2026-09-23 · disposable research instrument, not a production collector.** The checked
`d3262-semantic-touch-first-layer.json` has SHA-256
`29c4ccf0be94a7c31f2374e9f651ab48af1ea83e10153114ca825db93fa779ac`.
`make semantic-search-semantic-touch` typechecks the selector, independently replays its
frozen inputs and refuses a crossed reply FEN or false root operand. `[V]` The artifact and
`tools/d3262-search-calibration/semantic-touch-first-layer.test.mjs`.

The selector reads only the 185 declared target/candidate comparisons and the complete
legal-reply graph. It tracks the two named pieces through the candidate move, then checks
whether each legal reply changes either piece's square, the named destination square or
the interior of the material line. The 139 previously measured positive reply names are
**not inputs**. Twelve comparisons have an operand already absent; among the other 173,
two have no touching reply. It scans 6,020 legal comparison edges and marks 1,265 touches.
When the 139 independent named positives are joined afterward, all 139 touch, including
the 32 source pawn-denial minor arrivals. `[V]` The checked artifact, exact-reply graph,
material and destination witness artifacts.

This is an intentionally permissive **scheduling predicate**. It does not say which touch
changes the target relation in the requested direction, whether a move is good, whether a
line is causal, or whether all defences have been covered. Its high recall may be bought by
too many irrelevant touches; the separately measured reserve experiment tests that cost.
`[V]` `d3262-semantic-reserve-first-layer.md`.
