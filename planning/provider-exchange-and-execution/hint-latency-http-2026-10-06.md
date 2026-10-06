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

## Browser follow-up — separately measured, D3497 / D3503

The HTTP checkpoint above remains historical. The browser instrument separately
builds the shipping app, launches real Chromium at 1440×1000, and uses trusted
Hint/A little more clicks against isolated production application instances with
the existing pinned Stockfish 18 configuration. It changes no source result,
module policy, rung ceiling, cadence override, wire receipt or chess sentence.
`tools/d3497-hint-latency/browser-plan.json` freezes all base-plan cells.

The complete before-repair population is
`hint-latency-browser-before-cadence-2026-10-06.json`: 880 rows / 44 cells /
twenty samples and sixty separate voice baselines. It retains 220 available,
120 honest-empty, twenty source-unavailable, 160 move REST refusals and 360
higher-rung not-reachable outcomes. Unreachable/REST-only controls carry no
invented click or rendering time. Available hints must match the literal
outgoing decision/rung and the sealed response's presentation bytes. Source-off
independent structure/theory receipts remain separate API controls, not browser
rendering proof for those modules.

Rendering observations require viewport-visible, centre-hit-tested text after
two animation frames. Five browser/Node RPC brackets retain the narrowest
clock-offset interval; maximum width is 1.282 ms. This is a post-frame rendering
opportunity, not physical-display/compositor instrumentation. AsyncLocalStorage
binds mandatory source/packet completion to the actual Hint operation. Cached
horizon timing starts at actual server request entry, excluding driver delay.
Production source hashes and built artifact hashes identify the capture.

The before-repair voice-unavailable deterministic pattern has p95 161.875 ms
after dependencies (lower bound 161.444), above §10's 150 ms budget without a
voice call. The timeout's p95 is 2,115.411 ms (lower 2,115.125); its deterministic
sentence still matches the paired baseline. Cached initial/fork empty outcomes
reach 161.795/157.041 ms, but those are not described as rendered-rung failures.
First honest browser output is below 72 ms p95 in every measured cell, within
the 1,500 ms pending budget. Those values never certify default-on or D7.

D3503 is ledgered/assigned before repair. The shipping cadence moves from 100
to 50 ms, retaining the same 70-second deadline, serialized polls, explicit
retry and exact teardown identity; the count bound becomes 1,400. Mounted
controls pass at six readiness offsets. Restoring the original cadence makes
seven controls fail, including three readiness sentinels; restoring the repair
returns all 27 mounted/wire tests green. Strict instrument/project types and
the 31 HTTP/21 browser checker controls also pass. The complete replacement
twenty-sample population finishes and is replayed below; final regression gates
still precede closeout.

Earlier instrument failures remain failures: the first smoke's Node/browser
performance-name collision is fixed; the next full smoke is rejected for using
Homebrew Stockfish 19 rather than the configured pinned 18. That complete
44-row/three-baseline smoke is retained in cache, not promoted to full evidence.
Later two complete pinned-18 smokes pass. The first stricter TypeScript check
requires the normal workspace alias and explicit receiver annotation; both are
fixed, with no production authority change. Two stale 700-poll assertions are
corrected to the preserved deadline's exact new count. The before-repair capture
and seat source images are retained alongside its JSON. Machine-specific timing
is not a CI gate; permanent pure falsifiers and type checks are.

D3498 remains the distinct optional-voice lifecycle amendment. D3497/D7,
Hint v5/D12, D1639, owner-device use, full search cost/profile and full 1.0 remain
open. No RFC, capability, milestone, official content or release promotion.

### Complete browser repeat after the cadence repair

The replacement `hint-latency-browser-2026-10-06.json` has SHA-256
`2f9b3a7b841625e42c3d30406f11ae3d70411caf17407aa7bb81872f316314e4`.
It retains the same 880 rows, sixty baselines and all outcome counts: 220 available,
120 honest-empty, twenty unavailable, 160 REST ceiling refusals and 360 unreachable.
There are 360 measured browser rows, not 880 rendered hints. Source hashes and
complete structural replay pass. No capture result or timing row is rewritten.

| Measured p95 boundary | Before, ms | After, ms |
|---|---:|---:|
| Voice-unavailable deterministic pattern, dependency-to-frame upper bound | 161.875 | 97.382 |
| Maximum non-timeout rendered rung, same boundary | 161.875 | 105.526 |
| Maximum first honest browser output | 71.900 | 56.200 |
| Optional voice timeout, dependency-to-frame upper bound | 2115.411 | 2066.049 |

Every non-timeout rendered cell is below 150 ms p95; all measured first-honest
cells are below 1,500 ms. The timeout still fails, with lower bound 2065.772 ms.
`make guided-hint-browser-receipt-check` therefore reports pending budget true,
rendered budget false and D7 not discharged. The two-second voice deadline,
all paired deterministic bytes, actual cold/warm joins and refused fifth rung
remain intact. This is one desktop Chromium viewport, not owner-device/use proof.

An instrument review catches a weak absence guard: `empty !== null` also admits
an omitted field. A separately tested stronger source-off replay requires both
fixed positive controls to deliver actual items, explicit `empty: null`, exactly
one requested packet, post-commit protocol/timing and exact decision/subject/
component joins. Eleven permanent controls include missing/empty/duplicate/
suppressed/misjoined negatives. All twenty real source-off rows pass that stronger
replay; the captured checker/source hashes remain historical bytes, not silently
restamped. Normal software CI runs all 63 pure checker controls and capture
TypeScript, not a host-specific timing threshold. Final software, browser and
governance results are recorded at the checkpoint below before commit.

### Regression verification

`make staged-software-contracts` terminates zero on exact indexed tree
`0e4e2ba14b59ce2aacc80de23948c1b355df4d3d`: 3,398 tests/344 files, seven isolated
performance tests/four files, clean types and every downstream software contract,
including all 63 pure latency/source-off controls. Saved indexed proof:
`hint-latency-browser-software-2026-10-06.json`. Production/code/Make bytes match
that tree; later documentation/state/log changes have separate final governance
checks. All 984 capability declarations remain current, retained and unchanged;
the canonical migration plan has zero rewrites/restamps. Browser/content and
final governance gates still precede closure; terminal receipts follow here.

`make verify-content test-browser` terminates zero: 227 content tests/23 files,
zero graduation-corpus errors, all 104 exact capability documents and 145 browser
passes/one optional Maia skip/zero retries. All 112 composition cells pass, with
the normal ladder, explicit server/transport retry, final-rung and maximum-load
journeys included. D3503 closes on this path-backed before/after and regression
evidence; D3497/D7 and D3498 remain open. Final scoped governance and ordinary
commit hooks still precede the checkpoint commit; no fresh GitHub run is claimed.

Final `make staged-process-contracts verify-governance` terminates zero on the
explicitly inspected 32-file owned checkpoint. Register/status/roadmap/intent,
append-only log, source/state/ownership and test-tier checks all pass. The tracker
has 3,252 rows, zero untriaged of 1,689 live, 1,402 done and D3262/D3497 doing;
D3498 stays queued. Cached whitespace is clean. Routine hashes and generated
roadmap receipts are synchronized automatically. Ordinary hooks remain enabled;
other workers' edits are excluded, no push occurs and full 1.0 remains active.
