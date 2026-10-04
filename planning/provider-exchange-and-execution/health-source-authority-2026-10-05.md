# Application tablebase authority and typed refusal

D3378 repairs the application's health adapter, which previously erased a supplied
source's `probeEvidence` method. That made a modern source look like standalone
compatibility and bypassed the whole-source checks downstream. The adapter now
preserves the optional method, its class receiver and the sealed result. Both methods
receive the health operation's cancellation signal and absolute deadline; caller
cancellation does not mark the provider unhealthy. Standalone sources retain their
explicit compatibility path without an invented evidence method.

D3379 maps modern source-admission TypeErrors to `TABLEBASE_UNAVAILABLE`, rather than
an HTTP 500. It neither accepts invalid evidence nor substitutes a move or bare probe.
The successful selection code and guard/objective computations are unchanged.

Nine new controls exercise the real application composition and authenticated HTTP
selection, class receiver, active cancellation in both arms and pre-cancelled work.
Genuine evidence succeeds; crossed position/clock, copied evidence and source failure
return unavailable with no bare fallback. Controlled provider responses are not native
tablebase accuracy or latency measurements. The normal focused gate passes 143 tests
across seven files, including the existing durable, cancellation and consumer controls.

Canonical compatibility maintenance preserves all 899 predecessor declarations and
275 factory outcomes, appending only two opponent v12 successors. Independent comparison
against `53e449e7` proves authored fields unchanged; only 104 requirement stamps and
68 ledger digests refresh. No pack graduation, content expansion or user-document
migration follows. Complete provider execution/resolution/availability, whole-source
persistence and the separate Inspector/Maia/Stockfish/opening contract holds remain open.

## Verification

Final exact-index `make staged-software-contracts` passes at
`86dc041939f0a2e43a84b60c2f7ee994d6855525`: 2,907 software tests across 325 files,
seven isolated performance tests across four files, zero type errors/Svelte warnings,
and downstream packaging, source/value/history, lifecycle and migration checks.
The snapshot excludes unrelated working-tree edits. No product, test, content, schema
or tooling changes follow this snapshot. Semantic validation remains 38/38 cases with
zero fully passed subject profiles; full semantic validation completion is not claimed.

`make verify-content` passes 223 tests/23 files, zero clearance errors and all 104
exact requirements. `make test-browser-ci` passes 111 journeys with one optional
real-Maia latency skip and zero retries. Complete governance passes. D3378/D3379
close with the ledger, durable work state, queue, RFC/register, docs and anchored roadmap
updated together: zero untriaged/1,678 live items. No full RFC or milestone is promoted.
Final staged-process checks and normal commit hooks run before committing.
