# D3262 — pawn harassment with retained bishop pressure

**2026-09-23 · scoped line/identity control, not a strategic verdict.**
`d3262-bishop-pressure-control.json`, SHA-256
`09b6e8ea4e225c01b857f5ddef9ac249d65a9203c66f2dd41a07d7a5016a4a64`, evaluates the
predeclared `1.d4 d5 2.Nf3 Nf6 3.e3 Bg4 4.h3 Bh5` line against the exact reply graph.
`make semantic-search-bishop-pressure` validates every source, regenerates the artifact and runs
four tests that refuse crossed replies and false piece identities. `[V]`

After `h3`, the white pawn on h3 attacks the black bishop on g4. Black has **31 legal replies**;
`...Bh5` is one, not a forced answer. After that selected retreat, the bishop is no longer attacked
by the h3 pawn. The same bishop on h5 still attacks the white knight on f3. The white queen is on
d1, behind the f3 screen on the bishop's diagonal; the bishop does **not** yet directly attack
the queen. All six legal moves of that knight—`Nd2`, `Ne5`, `Ng1`, `Ng5`, `Nh2`, `Nh4` from f3—
would clear f3 and expose a geometric bishop attack on d1. This is a conditional, piece-identity
and legal-move fact, not a move grade, forced variation, positive exchange or claim that moving
the knight is necessarily bad. `[V]` The exact bytes and code are in
`tools/d3262-search-calibration/bishop-pressure-control.mjs`; independent python-chess in the
pinned Maia container reproduced the six legal knight moves and all six queen-exposure checks.

This establishes the minimum relation a future hint might render, for example that the bishop
retreat preserves pressure on the knight with the queen behind it. Whether that relation explains
an engine preference against an alternative requires the five-arm contrastive experiment and
value/causality checks. The control does not promote this geometry into a universal “pin” label
or a claim that Black should play `...Bh5`. [[D3262]] remains open.
