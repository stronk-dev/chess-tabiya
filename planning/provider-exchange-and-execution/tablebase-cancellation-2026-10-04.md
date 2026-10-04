# Shared tablebase cancellation — 2026-10-04

Implements D3364 under `rfc/provider-exchange-and-execution.md` §§4/7/10. This is a
production worker/source repair, not completion of the provider RFC or evidence milestone.

## Original failure and repair

The durable worker carried its lease's abort signal to engine execution but dropped it at
`#tablebasePayload`. The application tablebase adapter then created an unrelated signal.
The store correctly cancelled or returned the lease, but remote work continued and queue
shutdown waited for it. The four original controls failed at the public adapter and actual
SQLite worker boundaries: cancelled coalesced caller, already-cancelled caller, and shutdown
with/without a peer. An additional sandbox-only HTTP listen refusal was not a product failure;
the unchanged normal target runs with its required local-listen permission.

The worker now passes its signal through `TablebaseProbeOptions` into the existing shared
scheduler. No new queue, cache, parser, provider operation, fallback or evidence authority
is introduced. Only the departing waiter is removed; the existing scheduler owns final-waiter
abort and shared acquisition retention. The legacy packet bytes remain unchanged.

## Permanent verification

`make tablebase-cancellation-check` passes 27 tests across the provider-tablebase and
evidence-queue suites. Six new cases cover already-aborted admission, coalesced-peer
survival, real durable shutdown with/without a peer, actual service rewind, and cancellation
while waiting for shared Lichess admission. They assert no late dispatch, no cancelled result
or fabricated outage, correct durable `shutdown` retry versus `cancelled` state, and retained
success only for the surviving peer. Existing authenticated production HTTP opponent and
durable queue source-sharing tests remain included.

The rewind fixture uses a separate internal batch key: reusing the automatic enrichment
key returned that earlier batch instead of admitting the intended test job. That first fixture
failure was corrected, not treated as a production cancellation finding.

Complete software, content, provider, browser, governance and exact-index gates run before
commit; results are appended below only after they finish. Routine metadata/hash updates,
if required by those gates, are normal implementation work. No authored content, frozen
declaration or gate is weakened. Unrelated shared edits remain excluded; no push, worktree,
publication, protected intent change or RFC archival is performed.

Compiled execution/source-absence paths, exact-subject availability, D3363's Inspector
consumer contract and the remaining legacy caller retirement remain open. This fix does
not grant an unsealed packet a provider receipt or complete that migration.

## Retained intermediate gate outcomes

The first complete software run loaded the rewind fixture before its batch-key correction:
2799 tests passed and that one fixture failed. It is not final verification. The corrected
run passed all 2800 tests/322 files with zero type errors/Svelte warnings, then failed the
unchanged rewind p95 timing gate at 130.77 ms (limit 100 ms). That measurement overlapped
the browser and independent staged-software runs. Concurrency is a possible measurement
confound, not an established explanation or permission to dismiss the failure. No limit,
sample policy or performance-test byte was changed. Final complete exact-index verification
is required below.

## Final gate results

The complete exact-index `verify-software` target passes against tree
`273d7b0342d0cfff18223bfaa795d1c2076c931f`: 2800 tests/322 files, all seven performance
tests/four files, zero type errors/Svelte warnings, builds, packaging and every downstream
source/history/lifecycle/migration gate. The retained earlier timing failure is not erased;
the final run uses the same unchanged timing contract. The generated source proof is retained
as `tablebase-cancellation-software-2026-10-04.json` in this directory. Product source/test
bytes remain identical after that snapshot; only final closeout/tracking/proof text follows.

`make verify-content` passes 223 tests/23 files, zero clearance errors and all 104 exact
requirement documents. `make provider-exchange-check` passes 196 tests. Browser CI passes
111 journeys, one optional real-Maia latency skip, zero retries. `make verify-governance`
passes. All 851 capability declarations and canonical semantic-validation receipts remain
current, and the 352-document migration plan has zero remaining rows. No content, capability
history, parser or validation metadata update is required for this server-only repair.

Ledger/work-state, queue, RFC/register, docs, roadmap and append-only exploration log flow
back with this commit. Only D3364 closes; full execution/availability, D3363 and legacy source
retirement remain open. Final exact-index governance and normal hooks run after staging
these closeout bytes. Unrelated shared files are excluded and the 1.0 goal stays active.
