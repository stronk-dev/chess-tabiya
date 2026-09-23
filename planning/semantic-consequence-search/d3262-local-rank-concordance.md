# D3262 — local relation direction versus root engine rank

**2026-09-23 · diagnostic, not causal attribution or a move grade.** The checked
`d3262-local-rank-concordance.json` has SHA-256
`c45c0d1a58e5ee1572eff99f968f8e7a748edaf61779427d4b7c278aee3b3a3f`.
`make semantic-search-local-rank-concordance` joins the 123 exact same-target local
contrasts to the complete Stockfish 19 root MultiPV ranks at depth 8, depth 12 and 100 ms.
It never adds or compares raw centipawn, mate, WDL or DTZ values. All 17 target groups with
no selected natural alternative remain explicitly unpaired. `[V]` The artifact, source
capture and `tools/d3262-search-calibration/local-rank-concordance.test.mjs`.

The orientation is checked, not assumed: in all 32 material target declarations, the
named attacker belongs to the side *opposite* the root mover; in all 32 destination
declarations, the controlling pawn belongs to the root mover. For a directional local
contrast, `rank_aligned` means the side that would benefit **if this one local relation
were decisive** has the lower root MultiPV rank. It does not mean Stockfish chose that
move *because* of the relation. The 33 same-relation material pairs and one destination
pair with an absent minor have no directional test. `[V]` The checked artifact and target
definitions.

| Budget | Material aligned / directional | Destination aligned / directional | Directional pairs with bounded score |
|---|---:|---:|---:|
| depth 8 | 25 / 35 | 8 / 54 | 0 |
| depth 12 | 22 / 35 | 3 / 54 | 0 |
| 100 ms | 25 / 35 | 8 / 54 | 9 |

At depth 12, **64 of 89** directional local contrasts run contrary to the root engine
rank under that single-relation hypothesis; 51 of those are destination/pawn-denial
contrasts. Example: for root `d1023:3e77bf53f9edd017`, `d4d5` allows the declared pawn
to punish `...Nc6`, while `f3d2` leaves that arrival locally safe; Stockfish's depth-12
root ranks are 13 and 1 respectively. This does **not** establish why Stockfish prefers
`f3d2`, nor that the pawn push is a blunder. It demonstrates that the true local
punishment fact cannot honestly be presented as the engine's reason on that evidence.
`[V]` This artifact and `d3262-local-relation-contrast.md`.

The 100-ms arm retains nine directional pairs containing a bounded raw score rather than
silently treating them as exact numeric comparisons; its rank-order reading is shown
separately and cannot repair the depth-12 disagreement. The fixed predecessor-selected
population is not a representative sample of all chess moves, and these paired rows share
roots/targets, so percentages are not independent player-level rates. The next proof task
is to connect an exact contrast to the engine-preference delta through continuation and
counterfactual alternatives, or abstain. [[D3283]] records that delivery rule; [[D3262]]
remains open. `[V]` The checked artifacts and preregistration.
