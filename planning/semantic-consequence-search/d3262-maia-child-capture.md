# D3262 — Maia child-position source capture

**2026-09-23 · per-node source receipt, not a completed search arm.**
`d3262-maia-child-capture.json`, SHA-256
`ebc4f712be54958ae382d8e4ebf4d69c8a3f56c767da146c1ff9ea9111def178`,
captures `/select-move` at every selected candidate's resulting position. The frame is the
frozen 66-root / 196-candidate exact-reply graph, not a new or favorable sample. Run
`make semantic-search-maia-child-check` to replay the complete 6,310 legal-reply denominator
and check every provider move, rank, mass, FEN, model identity and graph digest. Three negative
tests reject crossed positions, invented legal moves or mass, substituted sources and a
source-off row that fabricates provider data. `[V]` The checked artifact and
`tools/d3262-search-calibration/maia-child-capture-check.mjs`.

The request used `human_common`, Maia band 1400, temperature 0.8, top-p 0.92 and the declared
FEN-derived seed. All 196 positions returned from `maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe`;
none were source-off. Their legal reply population is 6,310; Maia returned 3,749 ranked moves
and omitted 2,561 from its per-position window. All returned moves have finite mass. Twenty-four
castling outputs use Maia's king-to-rook UCI form; the checker joins each to a legal move but
retains the raw provider string. Local request p50/p95/max was 236.49/484.61/581.42 ms. The
temporary probe account was deleted after capture. `[V]` The checked source receipt.

**Authority limit:** as at the root, the returned `mass` is the model's raw legal-move
softmax, not the configured temperature/top-p sampling distribution. The residual aggregate
mass is not a probability for any one omitted reply. The source can support a raw-model
frontier at this first child layer, but it cannot yet establish a configured-bot reply
probability, a depth-four traversal, or an all-defences explanation. [[D3276]] and [[D3262]]
remain open. `[V]` `d3262-maia-capture.md` and the checked child receipt.
