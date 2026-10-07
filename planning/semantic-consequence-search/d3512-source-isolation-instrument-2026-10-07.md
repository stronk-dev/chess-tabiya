# D3512 — isolated case execution and frozen missing-attempt custody

Disposable RFC-0000 research implementing the already preregistered D3512
case-isolation protocol. **No new native Stockfish measurement, production
recovery policy or default is claimed.** D3512/D3262 remain doing; the delivered
headline remains 23 qualified settings / 26,634 of 61,374 cases.

## Implemented execution boundary

`executeIsolatedTriplet` creates a fresh UCI process for each cold case, validates
its original binary/configuration identity before spawning, and performs no
retry within a case. Source startup/readiness precedes the request-ready operation;
the enclosing interval, complete cold interval, teardown and actual process exit
are retained separately. Native execution still uses the original 60-second
deadline, depth/MultiPV/traversal semantics and strict canonical PV parser. [V]
`cost-case-isolation.mjs`, original `cost-stockfish.mjs` and preregistration.

Every cold dependency binds literal operands, query interval, exact emitted
UCI command range and search-command presence, typed outcome, receipt digest and
whether it inherited an earlier fatal adapter failure. Fatal events remain in
order. Commands bind exact startup options, FEN, depth/time budget, MultiPV width,
cleared hash and complete legal `searchmoves`. A written stdin command is not
proof the engine consumed it, engine CPU time or an independent elapsed clock.
Readiness failure is retained as startup failure/source unavailability, never a
new search-timeout observation. Nonfatal invalid-PV admission stays invalid. [V]
Instrument and `verifyIsolatedTriplet`.

The engine is closed **before warm replay**. Warm can consume only the exact
admitted receipts from that cold case; any fresh source call is an instrument
error. Offline has no receipts and cannot execute/reuse a source. Closed state,
cache, result, query, memory and interval vocabularies reject resealed raw
forgeries. Recorded RSS stays a sampled parent lower bound, not an engine/model
peak. The pure qualification join retains both original and successor outcome/
raw identities; `qualifiedSettings` stays null and independent replay remains
explicitly unestablished by that join. [V] Instrument, `cost-isolation-selection.mjs`
and their synthetic controls.

## Verification and original custody

Normal `make semantic-search-cost-case-isolation-test` and current selection
freeze/check pass **60 Node tests**, including actual subprocess crash/timeout,
fresh-process success, repeated failures without success-only retry, startup
failure, retained within-case inherited refusals, canonical-PV refusal, source
identity before spawn, closed-before-warm/cache ownership, immutable output and
negative command/state/interval/memory/selection/original-successor joins.
Synthetic processes and FENs are controls, not new Stockfish/chess/timing evidence.
The first development run correctly rejected an incomplete named-target fixture
and a warm test whose cloned receipt still aliased the original; the fixtures
were corrected without weakening the reader. [V] Actual normal Make terminals,
`cost-case-isolation.test.mjs`, `cost-isolation-selection.test.mjs` and fixture.

Current exclusive-create selection is
`d3512-isolated-source-selection-v2-2026-10-07.json`, SHA-256
`06b0bc849996c5272d731a29e2cbdf1fc11ac80736a605decaaebf645f0bc96a`.
It derives **697 original cold identities / 2,091 matching triplet cases** from
the complete original 6,948-case archive, preserving all original raw/group,
plan, source, protocol and successor-instrument hashes and source images.
The source-width split is 339 top-eight/top-eight and 358 top-eight/all-legal
cold cases. The original first fatal case remains selected; successful,
no-target, invalid-PV and node-only-exhausted originals are not silently added.
`nativeExecuted` and `productionProfileSelected` are false. [V] Current selection,
`loadIsolationParent`, `buildIsolationSelection` and terminal freeze/read-only check.

The earlier v1 prototype selection/source snapshot is retained unchanged at
`d3512-isolated-source-selection-v1-2026-10-07.json`, SHA-256
`b7606aed769827dfdb86c24a4a91d792f6fc9d49335c4d4ef0ef11892e340b59`.
It predates seven extra closed-vocabulary/memory/interval controls and is not
current capture authority. v2 does not overwrite it or change the selected
population. Original eighteen executor sources still match the original archive.
[V] Both frozen selection/source images, test history and original digest join.

Normal `make semantic-search-cost-isolation-selection-independent` passes three
Python methods with sixteen corruption variants, then reconstructs the **actual
full 6,948-case original / 697 selected cold / 2,091 successor-case** custody with
the same v2 digest. The independent scope is **selection and byte custody**, not
new source, chess, lifecycle or wall-clock evidence. Its read-only mount and
disabled network cannot modify originals or acquire missing engine results.
Initial Docker-socket access was sandbox-denied; the identical Make command
with proper permission passed, without changing environment or assertions. [V]
`cost-isolation-selection-check.py`, Python controls and terminal normal Make.

## Remaining before missing attempts qualify

Build the immutable whole-cohort native controller and its metadata/journal/
source-image and partial-abort controls, bound to this frozen selection and
original binary/configuration. It must write each whole triplet exclusively,
preserve partial prefixes on failure and reject reusing an existing output.
Do not start native collection through an ad hoc shell loop or change these
frozen source snapshots during capture.

Then obtain separately identified actual successor attempts, retain their
literal source/clock/lifecycle receipts and independently replay lifecycle,
source, board, observation and quantifier custody. Check the full original/
successor qualification join without deleting, merging away or success-selecting
failed originals. Only then can the affected wide-arm missing-attempt question
be evaluated. Broader source/model memory, real consumer/cache/browser,
D3508/D3373 admission and useful production-profile acceptance remain separate.
No capability, milestone, official-content or full-1.0 completion follows.
