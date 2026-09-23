# D3286 — Maia path-history source correction

**2026-09-23 · measured source correction, not a five-arm search verdict.** The
prior `d3262-maia-direct-logits.json` scored each of 196 candidate-child FENs
with `historyUci: []`. The pinned Maia3 adapter's `--use-uci-history` mode feeds
tokenized prior positions to the model, while the live selector sends `position
fen <startFen> moves <historyUci>`. The earlier source was an honest
empty-history diagnostic but not the distribution for a child reached by its
root move. `[V]` Pinned Maia3 `maia3/uci.py` `cmd_position`, `_reset_history`,
`score_moves`; `apps/server/src/opponent-selector.ts` `positionCommand`;
`d3262-maia-direct-logits.json`.

`make semantic-search-maia-history-replay-capture` ran the same pinned
Maia3-5M checkpoint, CPU, band 1400, temperature 0.8 and top-p 0.92 through
the exact root FEN plus one candidate move for each child. Before every path
query, the capture reproduced the stored empty-history full-legal raw logits
and configured support to within `0.000001`; a model/checkpoint/source drift
therefore cannot masquerade as a history effect. The replayed output is
`d3262-maia-history-replay.json`, SHA-256
`81b3d761395be080585af93127245e2116b12b175fac915c9892e1fce361adf4`.
`make semantic-search-maia-history-replay-check` independently joins every
row to the complete legal graph and refuses crossed path, FEN, source, move
population, mass and reported variation. `[V]` Checked capture and negative
fixtures.

The effect is material on this fixed population: raw distribution differs by
more than `0.000001` on **195/196** positions; the capped 0.80/0.90
configured reply prefixes change on **91/196** and **100/196**; the raw top
move changes on **32/196**. Maximum full-legal raw total variation is
`0.3744394679506513`; maximum configured top-p total variation is `1.0`.
These are paired policy outputs, not human move rates or defence quality.

`d3262-maia-history-impact.json` (SHA-256
`370133fa6c09d3f1823cb038fb079724b2317875efb2c2d4bde7402806941747`)
recomputes the same named-reply join under the corrected source. The 0.80
prefix moves from 415 to 421 paths (53 added, 47 dropped); the 0.90 prefix
moves from 510 to 518 (66 added, 58 dropped). Named positive configured
replies change from 52/185 to 54/185. The pawn-denial control remains **one
supported arrival of 32**, and it is the same `f3g5` path; that numerical
conclusion survives, but the rest of the frontier is not interchangeable.
`make semantic-search-maia-history-impact-check` rebuilds these joins from
sealed inputs and tests crossed/missing sources. `[V]` Checked impact artifact
and fixtures.

The old 2,186-path/2,185-FEN horizon-four frame remains frozen as the
empty-history experiment. A separately labelled counterfactual replaces only
its Maia-selected first replies: `d3262-maia-history-frame-delta.json`,
SHA-256 `67456d55962aa98f7539151094db00a7ee902df4ae901ca8ebd7e56b98abe7fe`.
It yields **2,189 paths over 2,188 FENs**, with 19 newly selected paths and
16 dropped; all 19 new FENs are absent from the completed Stockfish capture.
The changed frame is **not** the preregistered five-arm result and no provider
score is imputed to those missing positions. `make
semantic-search-maia-history-frame-delta-check` recomputes the delta and
fails crossed legal paths, old arm tags and FEN jobs. `[V]` Checked frame
delta and negative fixtures.

The queried history starts at each frozen root FEN. Earlier real-game history
is unavailable and was not invented. The separate path-history profile was
subsequently preregistered, and the 19 missing Stockfish positions plus all
2,189 deeper Maia paths are now checked in
`d3262-path-history-provider-capture.md`. The proof, abstention and cost
comparison still remains. D3262 criterion 23 and Discharge D1 remain open.
