# D3262 — one-slot operand-touch reserve against engine rank

**2026-09-23 · first child layer only, not the preregistered semantic arm result.** The
checked `d3262-semantic-reserve-first-layer.json` has SHA-256
`828b6b648c725a74949a5d89bad34dbab25446ad9556cb2a1a9f6d2c61988d0c`.
For every named comparison, Stockfish budget and width 2/4/8, the selector reserves the
highest-ranked legal reply whose changed squares touch a declared operand, then fills the
remaining slots by engine rank. It reads the source-blind touch census and provider ranks;
the named positive reply is joined **after** selection for evaluation. Mutating a legal
named positive changes the evaluation but not the selected frontier. An all-touched
synthetic control reduces exactly to the engine baseline. `[V]` The artifact and
`tools/d3262-search-calibration/semantic-reserve-first-layer.test.mjs`.

| Stockfish budget | Width | Baseline named reach / 139 eligible | Reserved reach / 139 | Gained | Lost | Reserved outside baseline |
|---|---:|---:|---:|---:|---:|---:|
| depth 8 | 2 | 28 | 43 | 15 | 0 | 81 |
| depth 8 | 4 | 39 | 48 | 9 | 0 | 48 |
| depth 8 | 8 | 58 | 64 | 6 | 0 | 26 |
| depth 12 | 2 | 34 | 48 | 14 | 0 | 81 |
| depth 12 | 4 | 43 | 52 | 9 | 0 | 50 |
| depth 12 | 8 | 60 | 66 | 6 | 0 | 26 |
| 100 ms | 2 | 30 | 49 | 19 | 0 | 82 |
| 100 ms | 4 | 43 | 55 | 12 | 0 | 53 |
| 100 ms | 8 | 64 | 70 | 6 | 0 | 27 |

The denominator stays 185 comparison questions, with 46 lacking any named positive reply;
139 are eligible for this reach reading. No observed named reply was lost in this selected
frame. That is **not** a no-regression guarantee for other target families or content.
`[V]` The checked artifact.

The hard control is negative. The named minor arrival in all 32 source pawn-denial cases is
outside every baseline width-eight engine beam. The one-slot touch reserve recovers **one**
at depth 8 and **zero** at depth 12 and 100 ms, at every tested width. The positive reply
does touch the declared operand in all 32, so this is a selection failure, not a missing
operand or provider rank. Touch is too broad to discriminate *which* branch changes the
relation in the relevant way. Reserving just the highest-ranked touch does not solve the
structural-why problem. `[V]` This artifact and `d3262-semantic-touch-first-layer.md`.

This profile has not searched the next learner move or horizon four, measured runtime/memory
against the interactive envelope, proven any target relation, or tested other semantic
families. It cannot be promoted to the production search policy from these counts. The next
research step is a source-blind relation-change selector with typed target predicates and
negative controls; that must still evaluate named witnesses only *after* selection. [[D3281]]
tracks the finding and [[D3262]] remains open. `[V]` `d3262-preregistration.md`.
