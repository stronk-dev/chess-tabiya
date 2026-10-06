# Guided Hint actual HTTP latency checkpoint — D3497 / D3498

Authority: implementing `rfc/hint-distance.md` §10/D7. This is the existing
production Hint application, not the draft semantic-consequence-search service.
No production policy, service, collector, deadline or renderer changes here.

## Complete corrected population

`make guided-hint-latency` and `make guided-hint-latency-receipt-check` terminate
zero on the corrected v2 experiment. The immutable receipt is
`hint-latency-http-2026-10-06.json`: SHA-256
`dc725d62669648a44b99b81a4a720f083f9ee1df9a0707d6eee7d1202ffa0e5a`.
It contains 880 responses / 44 cells / twenty samples each, sixty separately
retained paired no-voice baselines and 160 actual application startups. All
states remain: 480 honest-empty, 160 policy-refused, 220 available and twenty
source-unavailable. No failed or empty result is removed from a percentile.

Machine: Apple M3 Max, fourteen CPU threads, arm64 Darwin 27.0.0, Node v24.21.0.
Actual Stockfish 18 uses depth 12 / four PV plies / 10,000 ms timeout with the
shipping provider bounds and application-lifetime packet capacity of 64.
Its launched binary identity is
`sha256:5659ee5e43954d5e7f3d3cd7e6c2b7618bf77d55ec4d1d4887885338d935de43`,
independently joined to the executable bytes by the instrument. Literal source
acquisitions, requested/reached bound, cache identities, source digests,
manifest and packet/compiler identities, startup health, payloads, outcomes,
memory samples and all raw timing populations remain in the receipt.

Fresh-application coldness does not mean a cold OS executable cache. Warm runs
use the same application, exact FEN and source; every pattern request proves
`retained_exact` acquisition and packet hits against its cold identity. Later
rungs reuse the decision horizon and use the separately labelled request-entry
clock, not an invented new dependency completion. This is one local host and
loopback transport, not an isolated hardware benchmark or a Linux/appliance
performance promise.

## What the stopwatch measured

Nearest-rank p95, twenty samples per cell; these are **HTTP completion**, not paint:

| Cold first pattern | POST → pending/response | Full request → settled HTTP | Last mandatory dependency → HTTP |
|---|---:|---:|---:|
| Initial position, honest empty | 9.3 ms | 179.9 ms | 5.7 ms |
| Carlsbad, honest empty | 6.9 ms | 238.9 ms | 3.1 ms |
| Surviving-fork control, honest empty | 7.6 ms | 110.9 ms | 32.7 ms |
| Mate control, available | 7.3 ms | 110.6 ms | 84.1 ms |

The maximum POST p95 across all 44 cells is **20.4 ms**, within the 1,500 ms
honest-pending/response budget. Excluding optional voice timeout, the largest
dependencies-to-HTTP p95 is **129.0 ms**; that does not leave a measured browser
paint margin or certify the 150 ms rendering budget. The optional voice-timeout
cell reaches **2,102.1 ms** after mandatory source/packet completion, before
paint, and therefore already fails that budget. D3498 records the actual cause:
`HintService.#run` awaits optional voice before publishing deterministic evidence.
The provider timeout remains unchanged; no dependency or timing endpoint is
relabelled to make the criterion pass.

The available mate warm-rung response sizes are 874 / 904 / 996 / 1,033 bytes
for pattern / square / piece / distance. Move is a 74-byte **policy refusal**,
not an available move disclosure. Every learner preset currently stops at
distance or off; all 160 move requests refuse before source/packet acquisition.

## Source-off and optional voice are actual separate controls

All twenty source-off Hint requests return typed source-unavailable without
engine or candidate acquisition. A separate real committed Maroczy-control move
under the ordinary Guide me preset delivers structure (one item), theory (one
item) and its existing proactive nudge (two items), with Stockfish still off.
Theory retains explicit opening-artifact absence and unconfigured Explorer;
the local named-shape receipt is not replaced by a made-up engine explanation.
These are delivered component receipts, not proof they have painted in a browser.

Absent voice is unconfigured and the actual availability compiler disables
persona before the provider call: the available hint truthfully says
`not_requested`. Local controlled timeout and empty-output refusal reach the
real production voice path and return typed fallback. All sixty paired
deterministic sentences agree byte-for-byte. No paid/live LLM quality is measured.
The Node-only maximum RSS is recorded as 791,616 KiB; native Stockfish and whole
appliance peak are not inferred from it.

## Failed controls remain failed

The first full experiment remains in
`hint-latency-http-pre-module-control-repair-2026-10-06.json`, with its exact
predecessor plan/capture/checker images. Its twenty source-off queries selected
Support, whose named-pattern field remains off even after module inclusion.
They deliver theory but not structure; the original checker still refuses them.
V2 repeats every Hint cell and changes only the separate module-control preset
to Guide me. Positions, arms, sample counts, rungs, source profile and budgets
are unchanged. No rows are spliced, discarded or retroactively accepted.

Thirty-one fast synthetic checker controls reject missing/duplicate/relabelled
populations, wrong actual engine/FEN/depth, invented retained sources or packet
hits, missing baselines, altered sentence bytes, timing/receipt mismatches,
suppression masquerading as rendering and fifth-rung policy bypass. The ordinary
software gate includes these controls and the frozen predecessor check, not
machine-specific latency thresholds. Capture/check success validates instrument
structure; it explicitly prints `deterministicHttpBudgetSatisfied: false`,
`browserPaint: not_measured` and `d7Discharged: false`.

## Open work

D3497 remains doing for the actual shipping browser boundary and complete
permitted-rung evidence; D3498 owns a contract-preserving optional-voice repair
through the lifecycle amendment proposed in `hint-voice-latency-repair-proposal.md`.
Hint D7, Advanced D12, the proposed ceiling table, owner use and the full RFC
remain open. This local four-position measurement does not certify hint
usefulness, general tactical/quiet breadth, engine causality, D3262's five-arm
search cost/profile or any 1.0 milestone/release. All routine metadata flows back
automatically; the full goal stays active.

## Verification of this checkpoint

The normal `make verify-software` rerun terminates zero: 3,336 cases / 343 files,
seven isolated performance cases / four files, clean types and all downstream
software contracts. The composition-contract repair D3499 retains the mandatory
check by exact prerequisite token rather than insisting it be last; all 48
composition checker cases pass. The 31 Hint receipt controls and unchanged
rejected-predecessor check execute inside that ordinary gate.

`make staged-process-contracts verify-governance` and
`make roadmap-receipt roadmap-check work-state` terminate zero on the owned
checkpoint: 3,248 ledger rows, zero untriaged of 1,689 live, with D3497 and D3262
doing and D3498 queued. These checks do not turn the measured latency failure
green. No fresh browser/content/GitHub or full-release result is claimed here.
