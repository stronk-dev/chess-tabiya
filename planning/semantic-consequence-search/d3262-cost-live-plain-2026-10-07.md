# D3262 actual engine-beam and provider-free reply cost

Disposable RFC-0000 research, not production search. D3262 remains doing;
the semantic-consequence-search RFC remains draft. Routine metadata and tracking
are maintained automatically.

## Independent full-population boundary — D3504

The independent checker now reconstructs every scheduled engine/exact edge, not
only the legality of observations a capture happens to retain. It consumes source
receipts in first-admission order, coalesces identical operands across targets
and transpositions, and retains distinct target observations. First engine replies
follow canonical legal order filtered by source rank; deeper replies follow the
source order. Failed sources supply no invented edges. A shared node counter
reconstructs each actual budget stop, including its denied next visit. `[V]`
`tools/d3262-search-calibration/cost-independent.py`, `cost-stockfish.mjs`,
`cost-execution.mjs` and `cost-independent.test.py`.

Sixteen independent boundary tests pass, including self-consistent trimming,
missing/foreign/reordered queries, incorrect budget/rank width, omitted/duplicated
observations, target-sharing, absent sources, two-ply stops, absorbing terminals
and the two exact trigger meanings. They are run automatically before the normal
`make semantic-search-cost-independent` replay target. `[V]` terminal Make output
and `cost-independent.test.py`; these are not production-software or browser tests.

The first full replay exposed a checker mismatch: it expected repeated queries
for separately observed targets. The actual dependency layer deliberately admits
each identical query once, including failed queries. Independent replay now models
that declared operation boundary; a two-target regression asserts one query set
and two observation sets. Capture bytes, timing thresholds and traversal behavior
were not changed. `[V]` `CostDependencies.query`, checker and regression test.

## Capture checkpoint

The engine depth-8/top-2 setting retains all 193 candidates / 66 roots, both
horizons and cold/warm/provider-offline cases: 1,158 rows in disjoint six + 1,152
batches. Complete independent replay retains 32 + 5,752 target observations and
six corruption refusals per batch. `[V]` original metadata/triplets and successful
`make semantic-search-cost-independent` outputs.

Both provider-free trigger populations retain the complete frozen 1,158-case
range. Independent replay retains 144,654 square-control and 90,423 enemy-piece
target observations, with five corruption refusals each. With engine replay this
is 240,861 observations across separate cold/warm/offline executions, not that
many distinct chess positions. Each provider-free setting remains usable with
providers denied; it makes no source queries. `[V]` immutable captures and
successful full independent Make replay outputs.

This wave adds 3,474 measured case identities. With the earlier five complete
setting populations, the retained total is **9,264 / 61,374**, eight of 53
settings. All five primary search families now have a complete live population,
but this is not a full profile comparison: 45 settings, fresh-source sensitivity,
source memory, consumer scope and browser/profile evidence remain open. `[V]`
frozen plan, archive ranges and preceding live-cost dossiers.

The exact arms observe third-ply **availability**, not invented fourth-move
execution. The square-control trigger admits check/capture/new declared-square
attack; enemy-piece restricts the last trigger to the material target family.
These geometric scheduling conditions are not profit or engine causality. `[V]`
`exact-arm-trigger-core.mjs`, `cost-execution.mjs`, and the frozen common
comparison's `availability_witnesses_not_played_fourth_moves` authority.

The initial engine package SHA-256 is
`c28a6ee78ea92355ecd1fe9e41309d47619005fd415c215d4c3e9063e45af7ea`;
its remaining-population package is
`3f00d672b1729aaf1d89524d75c5b1fa8428ab6854ce3bed3f361cee2040cf0a`.
Square-control package SHA-256 is
`afaedfa2a65fb7c75d61d1e58b53f6b2446de23e659aaaf3f6d5d814f723210a`.
Enemy-piece package SHA-256 is
`67e5e8eeff8a7a9267930946ced92ba0b2b4d07f88042c69f2254d17d35a9465`.
Source snapshots and previous evidence remain unchanged. `[V]` canonical pack
writer outputs and immutable package bytes.

## Measured server cost, not an interactive profile decision

Four-ply available-case population p95, milliseconds rounded for display.
Every setting retains 46 opening, 53 unclear, 41 middlegame and 39 endgame
target-bearing candidates in each regime. Fourteen no-target candidates remain
separate; every focus value remains unknown. These are single candidate executions,
not repeated-machine trials or a randomized between-policy timing study. `[V]`
`d3262-cost-live-plain-summary-2026-10-07.json` and frozen candidate frame.

| Setting | Phase | Cold p95 ms | Warm p95 ms |
|---|---|---:|---:|
| engine depth8/top2 | opening | 714.937 | 105.020 |
| engine depth8/top2 | unclear | 733.348 | 119.923 |
| engine depth8/top2 | middlegame | 706.490 | 121.789 |
| engine depth8/top2 | endgame | 479.904 | 79.147 |
| forcing square control | opening | 192.318 | 191.228 |
| forcing square control | unclear | 229.874 | 227.789 |
| forcing square control | middlegame | 216.672 | 218.210 |
| forcing square control | endgame | 74.201 | 76.786 |
| forcing enemy piece | opening | 87.434 | 85.859 |
| forcing enemy piece | unclear | 108.206 | 105.985 |
| forcing enemy piece | middlegame | 164.236 | 156.854 |
| forcing enemy piece | endgame | 65.830 | 68.923 |

The engine setting retains 716 available, 358 source-unavailable and 84 no-target
rows. Each provider-free setting retains 1,074 available and 84 no-target rows;
its offline regime still executes the same local search. Warm source-free work
has no provider dependency cache to reuse and still recomputes the evidence.
No live invalid-source, exhausted-budget or absorbing-candidate outcome occurred;
the permanent controls cover those classes. `[V]` immutable summary/captures and
`cost-independent.test.py`/`cost-execution.test.mjs`.

All these available-case server p95 values are below 1,500 ms, but that does not
clear the browser envelope or show equal evidence strength. The host is not an
isolated benchmark appliance; the first square-control population also overlaps
an earlier archive's read-only package validation. Startup is separate, parent
RSS is a sampled lower bound, and source/model peak memory is not measured.
No timing is restamped and no production profile is selected. `[V]` original
metadata/clock boundaries, this pass's command chronology and frozen cost plan.

The combined summary retains 3,474 rows / 1,158 cold-warm pairs / 126 explicit
phase-focus-result groups. SHA-256:
`7e8a568f9ef9996ed6cceb68a4ea52b9369878a6c98b5d22d2da22480abef992`.
Earlier PV synthesis remains byte-identical. `[V]` canonical summary writer and
eight synthesis controls.

## Normal verification and remaining work

```sh
make semantic-search-cost-test semantic-search-cost-contract
make semantic-search-cost-independent-test
make semantic-search-cost-independent OUT=planning/semantic-consequence-search/d3262-cost-live-forcing-enemy-piece-2026-10-07.json.gz
make semantic-search-cost-packed-check ARCHIVE=planning/semantic-consequence-search/d3262-cost-live-engine-depth8-top2-population-2026-10-07.json.gz
make semantic-search-cost-summary
```

D3504 closes only the disposable plain-population verifier gap. D3262 remains
doing on the remaining 45 settings, fresh-source outcome sensitivity, individual
source/model memory, consumer scope and actual browser/profile qualification.
Search remains draft; no production UI/API behavior, assistance default,
capability, milestone, content graduation or full-1.0 promotion is claimed. `[V]`
work-state, frozen plan and `rfc/semantic-consequence-search.md`.

Full `make staged-software-contracts` terminates zero on exact index tree
`9f14363822db57b6d1797f10ea0ab0ba9fc14e01`: 3,398 software tests / 344 files,
seven isolated performance tests / four files, clean types and full downstream
build/package/source/value/capability/history/migration contracts. The original
proof is preserved without overwrite in `d3262-cost-plain-software-2026-10-07.json`.
Final source/Make bytes equal that tested image; subsequent changes are tracking
and evidence only. No new browser or GitHub run is claimed for this research-only
wave. `[V]` terminal Make result, preserved proof and exact-index diff.

Full `make verify-content` terminates zero: 227 tests / 23 files, zero
clearance-corpus errors over 92 documents and all 104 exact-capability documents.
This preserves authored content and historical capability meaning; it is not
content graduation or release completion. `[V]` terminal Make results.

Full `make staged-process-contracts verify-governance` terminates zero, including
R1–R10, lifecycle/history/state parity, append-only logs and staged-source isolation.
All 1,689 live ledger rows are routed, with zero untriaged/unrouted; the new
research-instrument closeout has path evidence rather than closeout prose.
Canonical receipts/source anchors are current. Only the explicitly owned files
are staged; the other worker's two test edits and untracked files remain untouched.
The full-1.0 goal remains active. `[V]` terminal Make census and final staged diff.
