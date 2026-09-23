# D3262 — shared next-layer provider frame

**2026-09-23 · capture scheduling, not a search verdict or production profile.**
`d3262-horizon4-frontier.json` has SHA-256
`ee5a62e8db4624cb824e0596ecac72c3ef1896edaa3de8c8a12334d2d8d15875`.
`make semantic-search-horizon4-frontier` recomputes it from the exact legal reply graph,
the three Stockfish child-budget orders, direct configured Maia support, and the
source-blind exact-event reserve. Every selected reply is joined to its actual
legal edge and FEN; width-2/4 sets must be nested inside width 8. `[V]` Checked
artifact and `tools/d3262-search-calibration/horizon4-frontier.test.mjs`.

The width-8 union across the three partial arms contains **2,186 selected paths**
and **2,185 distinct reply positions**, from 6,310 exact legal replies after 196
root candidates. It preserves overlapping arm labels rather than counting a shared
position twice: 1,540 paths per Stockfish budget, 415/510 for configured Maia
0.80/0.90 prefix, and 1,434 per semantic-event budget. These are capture jobs,
not positive witnesses or all-defences results. They do not include the exact arm's
complete breadth as a policy frontier. `[V]` Checked frame and preregistration.

`make semantic-search-stockfish-horizon4-capture START=0 LIMIT=2 OUT=...` ran a
two-position disposable smoke on Stockfish 19 using one thread, 16 MB hash and a
top-eight MultiPV cap at depth 8, depth 12 and 100 ms. A checked smoke had 177
legal move instances across six probes, 48 retained ranked entries and two timed
probes with an explicitly discarded unfinished deeper iteration. The checked
`d3262-stockfish-horizon4-smoke.json` has SHA-256
`2090e849c7a9e477ed164d28bc46d219251ef96399093300b017c48b790cccb3`.
The full
2,185-position capture has **not** run. Every interval is checked against the
frame, legal denominator, rank 1–8, common depth, PV replay, executable digest
and partial/full label. `[V]` `stockfish-capture.mjs`,
`stockfish-horizon4-check.mjs`, their negative fixtures, and the checked smoke
artifact.

The smoke exposed [[D3285]] before bulk capture: the older latest-per-move
collector spliced rank updates from different depths. Its root and candidate-child
artifacts have no duplicate ranks, but 64/198 root probes and 188/588 child probes
mix adjacent depths, all in the 100-ms arm. Depth-8 and depth-12 tables do not mix.
The uncorrected two-position top-eight smoke had 10–11 entries per probe with
duplicate ranks; the coherent-table correction gives exactly eight per probe at
one complete depth. Previously reported timed-rank comparisons remain provisional
until coherent re-capture; the depth-12 contradiction in [[D3283]] is unaffected.
`[V]` Stored source captures, checked coherent-table fixture, and local smoke.

Next: run/merge checked bounded Stockfish intervals and obtain configured Maia
distributions at the selected deeper nodes, then evaluate actual horizon-four
proof/abstention and end-to-end cost for the preregistered arms. Neither this
manifest nor the smoke passes criterion 23 or Discharge D1 of the search RFC.
