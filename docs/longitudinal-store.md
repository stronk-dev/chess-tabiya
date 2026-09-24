# Longitudinal store

The longitudinal store is the personal observation ledger behind every future cross-game learner
surface (style, skills, opening performance, recommendations, campaign credit). It persists
**opportunity/outcome pairs over declared evidence**, split by phase and decision class, plus
per-root attempt-structure counts. It is a projection of each run's immutable event log: rows are
re-derivable byte-for-byte and never a second source of truth. Contract: `rfc/longitudinal-store.md`.
Its first consumer is the private [learner profile](learner-profile.md) (`/learner-profile`, client
route `/profile`); the store itself still has no route of its own.

## Storage (migration 26)

| Object | Meaning |
|---|---|
| `drill_runs.longitudinal_profile_disposition` | `profileable`, or `account_deleted` once an owner's deletion suppresses a retained shared run; rebuild never re-derives a suppressed run |
| `drill_runs.longitudinal_structure_attribution` | `single_player` (every new run), `unattributable_shared` (monotone: set by a live session or a non-owner write grant, never reverted) or `unattributable_legacy` (pre-migration default) |
| `learner_observation_denominators` | decisions per `(run, phase, decision_class)`, family-independent |
| `learner_observations` | one row per admitted `(projection, version, semantic sign, source sign, phase, class)` with `opportunities`, `occurred`, `alternative_share_sum` and canonical typed decision refs |
| `learner_structure_stats` | per-root branch/rewind/fork/group/outcome counts, single-player runs only |
| `learner_observation_jobs` | the durable five-state projection job (`pending`, `running`, `complete`, `retry_wait`, `quarantined`) |

Every child row carries a composite `(run_id, learner_id) → drill_runs(id, owner_learner_id)`
foreign key (`ON UPDATE RESTRICT`), so a crossed learner/run pair fails and an owner cannot change
while private rows exist. `observed_at` is the immutable `run.started.at`, never a wall clock.

## What is observed

`apps/server/src/longitudinal-registry.ts` rebuilds the literal 67-row ingest registry
(`rfc/contracts/longitudinal-ingest-registry-v1.json`, 46 edge / 13 avoidance-population /
8 deferred path families) from the compiled evidence catalogue and refuses to load on any drift.
For every owner-authored decision the projector enumerates the complete legal population once;
a family is an opportunity only when at least one legal move exhibits it and at least one does not.
Imported source-game moves are `game`, the learner's own moves `played`, first predictions per
checkpoint `predicted`. Move authorship comes from durable records: no collaboration journal means
the owner (single-player and pre-migration runs); a live session's `board.granted` timeline
attributes each commit to its holder; grant-only shared runs and imported arena legs abstain.
Predictions are admitted only on `single_player` runs. That decision algebra (`normativeDecisions`)
lives in `longitudinal-decisions.ts` so the HTTP-side profile can share it without importing the
projector's population enumeration, which stays off the HTTP module graph.

## Writes, jobs and the worker

Each of the eleven source mutations (`create`, `createRatedRun`, `createImportedRun`,
`createDerivedRun`, `createRepertoireGapRun`, `save`, `saveArenaImport`, `createLiveSession`,
`grantRole`, `deleteOwnedRun`, `deleteLearner`) calls one watermark primitive inside its own
`BEGIN IMMEDIATE … COMMIT`. It derives the current event head and the V4 source digest
(`tabiya.longitudinal-source.v4\0` + RFC 8785 bytes of the sealed source image) from the locked row,
is a no-op for byte-identical saves, and resets any other state to one exact pending image. It never
enumerates legal moves. A TypeScript-AST census in `longitudinal-store.test.ts` keeps the list closed.

Projection runs only in `apps/server/src/longitudinal-worker-thread.ts`, a `worker_threads` executor
with its own connection to the same database file. `createApplication` is always file-backed
(default `data/chess-tabiya.sqlite`), reconciles jobs for every eligible run, then waits for the
worker's ready message before returning. The worker claims pending, due-retry and expired-lease jobs
oldest-first (one execution slot, scan of four), renews its lease from synchronous per-decision
checkpoints, and publishes rows plus `completed_seq` in one compare-and-swap transaction.
`snapshot_invalid` quarantines immediately; `derivation_failed` and `publication_conflict` back off
5 s × 2ⁿ (capped at 5 min) and quarantine after 3 and 5 attempts. Only a changed source digest,
event head or derivation revision reopens a quarantine.

`/healthz` returns `{ status, engineMode, longitudinal: { status, reason? } }`; a degraded or
draining worker is HTTP 503. `close()` drains the worker's finite batch before closing storage.
The test-only `createInMemoryTestApplication` has no worker and reports `disabled_test`.

## Reading

`application.longitudinal.read(actorLearnerId, parseLongitudinalReadQuery(...))` (and
`SQLiteRunStorage#readLongitudinalSnapshot`) is the one consumer read. It returns rows only when
every requested or eligible run is complete at the requested revision and exact current cut;
otherwise it returns one outcome per run (`pending` with `retryAt`, `failed` with code and attempts,
or `unavailable`: `not_requested`, `revision_mismatch`, `profile_suppressed`, `cut_superseded`) and
no data. Consumer RFCs build on this handle. The learner profile reads `played` rows only and, when
some cuts are still pending, re-reads exactly the complete cuts so it can count them while naming
the rest.

## Operations

- `make longitudinal-worker-once` drains one bounded batch of queued work against `DATABASE_PATH`.
- `make longitudinal-rebuild [WRITE=1]` re-derives every complete projection, names each missing,
  surplus or changed row by run and key, and repairs with `WRITE=1`. It is never an upgrade step.
- Account export includes all four tables under `behavioralProfiles`; account and per-run deletion
  previews list them, and deletion removes them (see `account-data-lifecycle.md`).

The real 80-ply fixed-corpus arm projects in the worker while `/healthz` answers at 20 Hz with
event-loop delay p95 under 50 ms (`apps/server/src/longitudinal-worker-performance.test.ts`).
