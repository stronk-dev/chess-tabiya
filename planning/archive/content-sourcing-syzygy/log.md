# Syzygy sourcing — log

Append-only.

## 2026-08-12 — Codex implementation

- The position census counts placement-field piece letters and is checked against chessops
  over 200 legal positions. The actual 4v3 same-side rook root derives 11 pieces and emits
  `out_of_range`; its HTTP query seam is asserted untouched.
- In-range positions copy the committed Lichess tablebase response fields verbatim,
  preserving null DTZ/DTM values. `sourcing-check` rejects tablebase evidence above seven
  pieces and rejects an engine substitute where exact evidence exists.
- The authoring profile is depth 22, Threads 1, Hash 16, MultiPV 1, timeout 120 seconds.
  The shipped executor accepts an optional timeout without changing its existing 5-second
  default. MultiPV above one fails before search because the current last-info parser cannot
  safely distinguish PV ranks.
- B6b emits spine-less outcome candidates with explicit opponents and learner-ply-aligned
  checkpoints. In-range roots carry the exact D8 graduation blocker; no
  `perfect_tablebase` capability was invented.
- No engine-derived prose, perfect-tablebase opponent, endgame objective grading, source
  position mining, or authored claim was built. D11's terminal disclosure path was already
  delivered and exercised by the repository browser fixture before this RFC began.

## 2026-08-12 — Independent approval and lifecycle closeout

- Claude independently verified the range boundary, abstention, engine-evidence typing,
  terminal disclosure dependency, and both repository gates. B6b is approved and archived.
