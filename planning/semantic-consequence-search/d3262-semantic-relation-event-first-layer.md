# D3262 — typed relation events at the first opponent reply

**2026-09-23 · disposable research instrument, not production search.** The checked
`d3262-semantic-relation-event-first-layer.json` has SHA-256
`f7c769d96953edb1c2768d1c5b49bf39e3d158dc8b7c48731e655e21d97a281d`.
`make semantic-search-relation-event` typechecks and replays the selector against the 185
frozen target/candidate comparisons and exact legal reply graph. The selector receives
neither source witness names, exchange evaluations nor provider scores. `[V]` The artifact
and `tools/d3262-search-calibration/semantic-relation-event-first-layer.test.mjs`.

For a material target, an event is the tracked named attacker legally capturing the
tracked named target. For a destination target, it is the tracked named minor legally
arriving on the declared square. Piece identities are transported through the candidate
move; capture, castling and promotion are accounted for, and every reply FEN is replayed.
This gives 153 event-available comparisons, 20 with no legal event and 12 with a required
operand absent. Exactly 153 event replies occur in the current frame, versus 1,265 broad
operand touches. All 139 independently named positive replies are among the events,
including all 32 pawn-denial minor arrivals. A touched but non-event reply is excluded by
a negative fixture. `[V]` The checked artifact and the prior broad-touch receipt.

The apparent perfect recall has a strict scope: the held-out positive labels were themselves
defined as a positive named capture or a named arrival. The selector independently enumerates
those *events* from the target definition; it has not discovered that the candidate move is
good, or that the arrival is the opponent's best defence. Fourteen of the 67 material capture
events are exchange-neutralized, not positive exchanges. The evaluator must still inspect
them and a deeper continuation may refute even a locally positive event. No generic plan,
prophylaxis or all-defences claim follows. `[V]` This artifact and
`d3262-material-immediate.md`.
