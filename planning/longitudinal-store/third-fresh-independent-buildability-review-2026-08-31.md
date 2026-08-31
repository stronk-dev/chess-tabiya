# Longitudinal store — third fresh independent buildability review

- **Date:** 2026-08-31
- **Reviewer:** codex, independent of the Claude author repair
- **Input:** `rfc/longitudinal-store.md` after the D2227–D2232 third author repair
- **Verdict:** **returned on D2402–D2406; no migration, worker, reader or consumer implementation is authorized**
- **Executable reproduction:** `make longitudinal-store-third-fresh-review` — 5/5 blocker controls pass

## What survived re-review

The third author repair genuinely closes its six named returns. `unclear` reaches the schema and
reader; the event/root projector is back in the normative fold; the claim tuple has a renewable
lease; `all_complete` starts from eligible runs; startup owns a reconciliation receipt; and the
composite foreign keys prevent a valid learner id being paired with somebody else's run. The
existing 24-arm author contract is useful evidence for those properties.

Those repairs do not make the operation buildable yet. Applying the amended contract to revision
change, cut replacement, the Node execution model, shared-run behavior and permanent failure found
five new seams. Each finding is reproduced by a passing positive control rather than a prose grep
alone.

## Blocking findings

### D2402 — revision reset has no state transition

The startup contract says reconciliation “resets a wrong `derived_rev`”
(`rfc/longitudinal-store.md:469-475`). The job DDL and publication protocol make revision part of
the truth, but no SQL/algebra says what happens to `completed_seq`, `state`, live claim fields,
failure state or already-published rows.

The executable author model makes the omission visible. Its `ReconciliationJob` contains only
`runId`, `learnerId`, `requestedSeq` and `derivedRev`
(`tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts:415-416`); the repair replaces
that four-field value and increments `revisionReset` (`:435-466`). A previously complete revision-1
job therefore becomes a revision-2 value in the model without proving it is pending or that its
revision-1 rows are unreadable. The new control demonstrates exactly that green falsehood.

The repair needs one atomic wrong-revision transition for complete, running and failed jobs:
invalidate the claim generation, clear the claim/failure tuple, make the current run head pending,
prevent old projections being read as the new revision, and remain restart-idempotent. Crash before
and after the transition must converge on the same state.

### D2403 — the typed reader promises historical cuts that replacement storage cannot serve

`LongitudinalReadQuery` accepts caller-supplied `{runId,requestedSeq}` cuts
(`rfc/longitudinal-store.md:407-436`). Publication replaces all three row sets in place (`:374-401`),
and none of their primary keys contains a published cut. Once cut M replaces N, the database has no
N bytes left.

The result union can say not-requested, revision-mismatch or profile-suppressed, but cannot say
“that cut was superseded” (`:423-433`). The prose also does not require a caller cut to equal the
job's exact currently published cut (`:439-453`). An implementation can therefore return M rows to
a caller that requested N while satisfying the listed complete/revision tests.

Choose one truthful contract: retain versioned row sets by cut, or restrict `runs` reads to the
exact currently published cut and add a closed mismatch/superseded result. Race fixtures must cover
N complete → M pending → M complete while a consumer retains N.

### D2404 — background scheduling still blocks the HTTP event loop

The measured complete-prefix projector is one synchronous loop calling synchronous
`legalAlternativeEdges` and `localSemanticEvents`
(`tools/d1405-longitudinal-cost-harness/cost.test.ts:115-152`). The RFC reports 47.29 seconds p95
for 80 plies, then composes `LongitudinalProjectionWorker` directly beside storage inside
`createApplication` (`rfc/longitudinal-store.md:456-467`). It names no worker thread, child process,
cooperative yield boundary or event-loop-delay budget.

“After the response” is not “off the request thread” in Node. A synchronous 47-second projection
freezes all routes and also prevents a timer-driven 10-second heartbeat from executing. The author
lifecycle model only increments an in-flight counter; it never runs the measured projector.

Specify process/thread isolation or a bounded cooperative slice/yield protocol. The acceptance
fixture must run a real 80-ply projection while a route latency probe and lease renewals continue to
meet explicit budgets. Provider-free does not establish responsiveness.

### D2405 — shared-run structure facts are attributed to the owner without actor evidence

The normative decision projector correctly requires durable owner authorship for moves
(`rfc/longitudinal-store.md:164-181`). The immediately following structure projector counts every
rewind, fork, group and outcome by branch with no actor rule (`:183-191`), then stores the result
under `learner_id`.

The executable positive is decisive: mark every committed move in a real shared, forked and rewound
run as authored by `other`. `projectNormativeRun` returns zero decisions but still emits the same
owner-keyed `branchCount=2`, `rewoundCount=1`, `forkedCount=1` row. The implementation does exactly
what the prose permits (`tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts:243-295`).

Either classify these as run-level facts, exclude shared/unattributable structure events, or add
durable actor identity and apply the owner rule. Downstream Skills and style may not consume them as
learner behavior until that provenance is real.

### D2406 — permanent failures retry forever

Claims explicitly admit every `failed` row immediately and order only by `updated_at`
(`rfc/longitudinal-store.md:345-354`). The schema has no attempt count, next-attempt time, backoff or
terminal/quarantine state. The model proves a `snapshot_invalid` 80-ply job can fail at time 1 and
be claimed again at time 2. With a one-second poll and an expensive projector, a corrupt legacy run
becomes permanent background denial of service.

Specify bounded retry/backoff, a durable operator-visible terminal posture, and the transition that
reopens work after the run bytes or derivation revision actually changes. The oldest-first queue is
fair among rows; it does not bound repeated global work.

## Required next author round

One repair should treat these as a single snapshot-operation boundary:

1. exact revision-reset SQL/state algebra;
2. exact current/superseded cut semantics;
3. isolated or cooperatively bounded execution with a responsiveness measurement;
4. truthful shared structure provenance; and
5. bounded failure scheduling and recovery.

The next author falsifier must keep all 24 existing positives and add a mutation that would make
each of these five controls fail. Another fresh independent review remains mandatory before this
RFC can be accepted or implemented.
