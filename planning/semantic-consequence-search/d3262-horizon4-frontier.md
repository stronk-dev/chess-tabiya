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
The full **2,185-position Stockfish capture now exists** as
`d3262-stockfish-horizon4-capture.json` (SHA-256
`fa67d49debd72854ebd07fa9188fbd8f8d6e55a9e75a7455bfc41c87750e8931`).
Its 88 immutable 25-position-or-smaller intervals were checked before merge; the
merged artifact contains 196,782 legal-move instances across three budgets,
51,741 coherent ranked entries and 1,825 explicitly marked unfinished deeper
timed iterations. Source-only depth-8 p50/p95 was 39.26/86.49 ms; depth-12
379.69/735.64 ms; 100-ms search 101.19/102.69 ms on this machine. These are
per-selected-position engine probes, not end-to-end hint latency or a production
budget. Every interval and the merged artifact are checked against the
frame, legal denominator, rank 1–8, common depth, PV replay, executable digest
and partial/full label. `make semantic-search-stockfish-horizon4-check` is now
part of the opt-in RFC-evidence gate. `[V]` Checked full capture,
`stockfish-capture.mjs`, `stockfish-horizon4-check.mjs`, batch/merge negative
fixtures and the retained smoke artifact.

The smoke exposed [[D3285]] before bulk capture: the older latest-per-move
collector spliced rank updates from different depths. Its root and candidate-child
artifacts have no duplicate ranks, but 64/198 root probes and 188/588 child probes
mix adjacent depths, all in the 100-ms arm. Depth-8 and depth-12 tables do not mix.
The uncorrected two-position top-eight smoke had 10–11 entries per probe with
duplicate ranks; the coherent-table correction gives exactly eight per probe at
one complete depth. The subsequent 66-root / 196-child same-width coherent
re-capture now exists and is checked at all three budgets. Old timed-rank
comparisons remain historical, not automatically corrected: the 100-ms best
changes on 18 roots and 63 children, and the new root best is outside the
frozen candidate frame on three roots ([[D3289]]). Fixed-depth all-legal ranks
reproduce exactly, so the depth-12 contradiction in [[D3283]] is unaffected.
`[V]` Stored source captures, checked coherent-table fixture, local smoke and
`d3262-stockfish-coherent-recapture.md`.

Next: use the separately captured path-aware Maia distributions, declare an
honest corrected candidate population for any full provider-best comparison,
then evaluate actual horizon-four proof/abstention and end-to-end cost. Neither
this manifest nor the source recaptures pass criterion 23 or Discharge D1 of
the search RFC.

The 2,185-FEN deduplication is **Stockfish-only**. [[D3286]] found that the
pinned Maia3 adapter with UCI history tokenizes the root and each replayed move,
and its model consumes those tokens. The checked `paths` array therefore remains
the 2,186-query authority for the **frozen empty-history experiment**; the sole same-FEN pair has
different path identities, which the frozen-frame test asserts. Earlier direct
child logits used empty history at each child FEN and cannot be silently
substituted for the path-replayed policy. Paired replay now measures the source
effect: the corrected first-reply Maia selection would produce 2,189 paths
over 2,188 FENs, 19 of which were not in this Stockfish capture. This remains
a separate counterfactual frame, not a retroactive change to the frozen
artifact or a five-arm result. Those 19 positions and the corrected frame's
2,189 deeper Maia paths are now independently checked in
`d3262-path-history-provider-capture.md`; the original capture bytes are
unchanged. `[V]` `d3262-maia-history-replay.md`, pinned Maia3 UCI source,
`apps/server/src/opponent-selector.ts` `positionCommand`, direct-logit receipt,
and `horizon4-frontier.test.mjs`.
