# Longitudinal store — third author repair

- **Date:** 2026-08-31
- **Input:** second fresh independent return [[D2227]]–[[D2232]]
- **Status:** author repair complete; third fresh independent review required
- **Production authorization:** none

## What changed

The repair treats the six returns as one history-integrity boundary rather than six prose edits.

1. The exact runtime `DetectedPhase` union, including `unclear`, now crosses the model, both STRICT
   tables, denominators and read filters.
2. The folded normative contract contains the complete event-to-decision and event-to-root algebra.
   The author fixture starts with the real runtime, commits, rewinds and forks, then crosses imported
   mainline, owner fork, duplicate prediction and group events.
3. The worker now claims only immediately executable work. Its 120-second lease is renewed every
   10 seconds by a full claim/run-owner CAS; an expired generation cannot renew or publish.
4. `all_complete` begins at a transaction-fixed eligible-run census and left-joins jobs. Missing
   jobs are an explicit `not_requested`, never invisible history.
5. `reconcileLongitudinalJobs()` is a mandatory pre-readiness startup/upgrade operation with a typed
   appliance receipt. It queues untouched old native, imported and shared runs without doing
   semantic work.
6. Every child table has a composite `(run_id, learner_id)` foreign key to the durable run owner.
   Renewal/publication repeat that ownership check; reassignment cannot leave stale facts writable.

## Executable evidence

`make longitudinal-store-author-contract` now has 24 passing arms. The new arms include four real
phase FENs through SQLite, real runtime event projection, slow renewal/reclaim and batch scheduling,
eligible-run/reconciliation idempotency, and crossed two-learner SQL ownership negatives.

The old second-review harness remains a historical reproduction and is expected to invert after
repair; it is not relabelled as a completion test. Repository verification is recorded in the
landing commit.

`make verify` passed before checkpoint: strict TypeScript/Svelte checks; 1,085 software tests;
2 performance tests; 172 real-content tests; schema, scaffold, packaging, evidence-manifest,
build, register, status, work-index, roadmap, intent-parity and staged-process contracts.

## Boundaries

No production migration, storage method, worker, API, renderer, profile, bot, campaign, content,
archive or protected design byte changed. The RFC remains draft until a third fresh independent
review attacks the repaired contract.
