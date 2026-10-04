# Whole-source tablebase opponent selection — 2026-10-04

D3366 implements the built-in opponent consumer under the implementing
`rfc/provider-exchange-and-execution.md` §§7/9/10. This is not full legacy retirement,
whole-manifest execution, availability, bot calibration or a completed 1.0 milestone.

## Production boundary

Previously the built-in adapter stripped the sealed delivery to a bare position, and
selection re-minted legacy probe evidence. The new controls failed against that path,
including the real authenticated HTTP selection route. Selection now receives
`probeEvidence`, compiles its registered execution operation, admits the whole source
through `opponent.selection@1`, verifies the delivery seal and both requested/payload
exact FENs, and only then reads the position. Root and every practical-resistance reply
probe use this boundary. Different clocks are a different request.

A modern source failure or forged/crossed source never falls back to its bare probe.
Sources without this method remain explicit standalone/fixture compatibility; they do
not acquire modern authority by relabelling old bytes. The durable worker's existing
bare packet and the remaining Stockfish/Maia consumers still require their own migration.
Selection ordering, category inversion, outcome preservation and reply-ratio policy
remain unchanged. Synthetic practical-resistance rows exercise that existing algorithm,
not a claim of measured bot strength or real tablebase truth.

## Versioned compatibility

The old operator-only `live.syzygy.position_result@1` declaration and factory remain.
The bound successor is `live.syzygy.position_result@2`; only the operator-role opponent
consumer binds it, with no learner raw-evidence panel or new assistance permission.
The registered operation/parser/digest meanings remain `syzygy.position@1`.
Provider protocol resource image version 2 selects this successor factory; its six
operation members are unchanged. The source API and operator traversal follow the
registered successor. Review's retained v1 source slot is not silently migrated.

D3367 records the resulting retained-source execution seam: the strict compiler only
resolves the current protocol source row, so v1 refuses while v2 compiles. The checkpoint
instrument executes both controls. Full-manifest completion must reconcile historical
registration or explicit retirement; the source is not omitted or guessed from its payload.

Canonical generation retains all 851 predecessor declarations and adds eight successors
(859 total). The checkpoint metadata instrument verifies all 104 authored pack/example/
fixture documents, unchanged guard/objective evaluators, all 274 prior factory outcomes,
and untouched other source documents. It applies only derived `requires` values and
matching `packDigest` values in 68 ledgers. OpponentSelector's admission boundary
intentionally changes; it is not falsely included in an unchanged-evaluator claim.
No move, explanation, principle, shape, evidence claim, publication or graduation changes.

The normal targets are `make tablebase-selection-metadata-update` and
`make tablebase-selection-metadata-check`. The dated instrument preserves its fixed
pre-change baseline; it is not a new perpetual readiness gate over later work.

## Verification

The focused cancellation/source suite passes 32 tests. New controls include the actual
authenticated HTTP endpoint, root plus two practical-resistance reply acquisitions,
same-board/different-clock refusal, crossed positions, forged sources and modern failure
without legacy fallback. The source spies fail if production calls the bare adapter.
Existing cancellation/coalescing/rewind/shutdown controls remain green.

Complete provider, software, content, browser and governance results are recorded below
after they finish. An intermediate provider run exposed two stale inventory expectations;
their new exact counts are 47 producers, 282 projections, 35 consumers and 546 bindings,
with an explicit v2-only opponent-binding assertion. No authority or threshold is weakened.
Unrelated shared edits are excluded. No push, worktree, protected-intent edit or RFC archival.

The first exact-index software run passed 2,818 tests and failed one existing
Checkpoint-P machine-only fence: the draft incorrectly offered panel/list forms
on the opponent consumer. The source successor and consumer are corrected to
`machine_condition`; the unchanged permanent fence remains required. That run
is retained as `tablebase-selection-software-negative-2026-10-04.json`, not final
verification. No product/test bytes are changed after the final passing snapshot.

## Final software result

`make staged-software-contracts` passes the complete normal software target on exact
tree `589941e7a9aa743d8f6bd2fe58a79ebe64b75dbc`: 2,819 tests/323 files,
all seven unchanged performance tests/four files, zero type errors/Svelte warnings and
all downstream build, packaging, authority, history, lifecycle and migration contracts.
Proof: `tablebase-selection-software-2026-10-04.json`. Product/test bytes stay identical
afterward; only final results, the read-only checkpoint instrument, tracking/proof and
append-only log text follow. The earlier negative remains in its separate receipt.

`make verify-content` passes 223 tests/23 files, zero clearance errors and all 104
canonical requirement documents. `make provider-exchange-check` passes 233 tests.
Browser CI passes 111 journeys, one optional real-Maia latency skip, zero retries.
Canonical semantic validation remains current: 81 subjects, 38/38 passing cases,
53 population receipts, eight external receipts and zero fully validated profiles.
Its nine implementation receipts and population implementation digests change, not
case observations, external evidence or verdicts. The 352-document migration plan
has zero remaining rows. No content pack graduates.

Ledger/work-state, queue, RFC/register, docs, anchored roadmap and append-only exploration
log flow back together. Only D3366's built-in opponent-consumer scope closes; D3367 is
owned todo. Remaining legacy consumers, whole-manifest execution/digest, binding absence,
exact-subject availability and D3363 stay open. Complete governance and final exact-index
process checks run before the normal commit hooks. The 1.0 goal remains active.
