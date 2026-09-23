# D3262 — typed event reservation against Stockfish reply rank

**2026-09-23 · first child layer only.** The checked
`d3262-semantic-relation-event-reserve.json` has SHA-256
`613fcfcf13011de23e6782e0aaecca1aef6a433333e7d6266b82f2b2e63d0e6f`.
For each named target/candidate comparison, budget and width, one slot goes to the
highest-ranked exact typed relation event; the remaining slots follow engine rank. The
selector consumes only event geometry and Stockfish ranks. The 139 positive named replies
are joined after selection; mutating one changes evaluation but leaves the frontier
unchanged. `[V]` The artifact and
`tools/d3262-search-calibration/semantic-relation-event-reserve.test.mjs`.

| Stockfish budget | Width | Engine-only reach / 139 eligible | Event-reserved reach / 139 | Events outside engine-only width |
|---|---:|---:|---:|---:|
| depth 8 | 2 | 28 | 139 | 121 |
| depth 8 | 4 | 39 | 139 | 110 |
| depth 8 | 8 | 58 | 139 | 90 |
| depth 12 | 2 | 34 | 139 | 115 |
| depth 12 | 4 | 43 | 139 | 106 |
| depth 12 | 8 | 60 | 139 | 88 |
| 100 ms | 2 | 30 | 139 | 119 |
| 100 ms | 4 | 43 | 139 | 106 |
| 100 ms | 8 | 64 | 139 | 84 |

All 32 source pawn-denial minor arrivals enter the event-reserved frontier at every setting,
against zero in the engine-only width-eight beam and at most one in the earlier broad-touch
reserve. Yet the same selector also reserves 14 material capture events whose local exchange
is *not* positive. Its 139/139 reach is thus an **event-enumeration result conditioned on a
registered target**, not 139 justified recommendations or explanations. It says the named
branch is available to search, not that its continuation establishes a causal difference.
`[V]` This artifact, `d3262-semantic-reserve-first-layer.md`, and the material evaluator.

The full semantic arm still needs event-conditioned continuation, proof/refutation and
contrast against natural alternatives, with terminations, transposition reuse, source-off
behavior and end-to-end cost. No production budget or hint language is licensed by this
first-layer scheduling receipt. [[D3262]] and [[D3281]] remain open. `[V]`
`d3262-preregistration.md`.
