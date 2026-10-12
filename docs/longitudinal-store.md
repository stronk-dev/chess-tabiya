# Longitudinal store

The longitudinal store is the personal observation ledger behind every future cross-game learner
surface (style, skills, opening performance, recommendations, campaign credit). It persists
**opportunity/outcome pairs over declared evidence**, split by phase and decision class, plus
per-root attempt-structure counts. It is a projection of each run's immutable event log: rows are
re-derivable byte-for-byte and never a second source of truth. Contract: `rfc/longitudinal-store.md`.
Its first consumer is the private [learner profile](learner-profile.md) (`/learner-profile`, client
route `/profile`); the store itself still has no route of its own.

Current derivation revision is **4** (D3636, 2026-10-09). This recomputes the existing
67-member registry after retained pawn-gain identity, castling-rook mobility and preceding special-move corrections; it admits no new family or
personal attribution. On upgrade, normal application startup atomically removes old derived
rows and requeues untouched revision-1/2/3 histories. The existing background worker rebuilds
them; Profile reports incomplete/rebuilding until the current cut completes. No manual rebuild
is required, and saved moves are unchanged. Permanent file-backed and real-worker startup tests
cover corrected promotion duty, castling-rook mobility and both-color retained pawn gains,
exact current-revision reads and idempotent restart.

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

Failed startup retains ownership of the starting thread until its termination promise settles.
Invalid first frames, missing readiness, early errors and exits preserve the first refusal;
later ready/progress messages cannot revive it. Application cleanup therefore closes its database
only after the failed worker has finished termination. `make longitudinal-worker-start-check`
covers this ordering with real threads and actual file-backed application cleanup.

`/healthz` returns `{ status, engineMode, longitudinal: { status, reason? } }`; a degraded or
draining worker is HTTP 503. `close()` drains the worker before closing storage, bounded by
`LONGITUDINAL_DRAIN_GRACE_MS` (2 s): the supervisor sets a shared drain cell that the thread reads
at every decision checkpoint, so the thread abandons its in-flight claim — the lease is expired in
place by a full-tuple CAS, which fences the claim and lets the next start re-lease the row at once
with no failure counted — closes its connection and exits. A thread that has not reported drained
when the grace elapses is terminated and lease expiry recovers its claim.

A historical revision-1 measurement: a 78-ply imported game projects in about 5 s on a heavily loaded development host (it took about
32 s before D3300); the per-edge cost is dominated by sealing ~200 evidence values per legal
candidate. Output bytes are unchanged at `OBSERVATION_DERIVATION_REV = 1`
(`planning/longitudinal-store/d3300-projector-and-drain-2026-09-24.md`).
Fresh-process revision-4 measurement (2026-10-11) of the real 80-ply performance
arm takes 3.51–4.27 s for White and 3.26–3.86 s for Black on the loaded development
host, versus about 20 ms for warm membership reuse. Both retain all legal edges,
exact output and forty decision checkpoints. `make longitudinal-projector-profile`
separates fresh-process timing from CPU sampling; it keeps only an ignored compact
aggregate, never raw CPU recordings. See
`planning/longitudinal-store/d3300-cold-profile-2026-10-11.md` for scope and controls.
These timings isolate the projector, not HTTP/queue/database latency. Cold cost
remains open; locating the cost does not prove further output-preserving improvement
impossible or authorize narrowing the evidence contract.
The output-preserving D3300 follow-up reuses one before-position's four private
square-control indexes and serializes structural sort keys once per observation.
Exact full-event/receipt and projected-row comparison over both players is unchanged;
24 fresh-process cold pairs show a modest 4.91% summed-time reduction on the loaded
development host, with one slower pair. This is not cold-cost completion or a changed
derivation revision. See `planning/longitudinal-store/d3300-index-reuse-2026-10-11.md`.
The next scoped correction retains only the latest successful complete square-control
delta. The control source and defender-exposure derivation reuse it within the same
edge; no alternative or fact is omitted. Its full before/after FENs and original UCI
must match exactly, including clocks. Different edges replace it, invalid requests
still fail, and all retained operands are immutable. Permanent both-colour controls
exercise the actual sealed closure, independent array/Set results, special moves,
clock separation, failure and replacement. Cold cost remains a separate open obligation.
The final 2026-10-11 observation after both corrections is 3.476 s White / 3.391 s
Black cold and 22.15 / 22.02 ms warm, with unchanged complete populations and rows.
This is not a paired speed benchmark or a further implementation change; host load
differs from the earlier samples. The dated measurement receipt retains the distinction.
Growing prefixes now reuse complete local v1 projection/sign memberships for exact
before-FEN/move/after-FEN tuples. The worker retains at most 4,096 immutable entries, FIFO;
clock fields remain part of identity, failures are recollected, and injected collectors stay
uncached. Every projection still replays its source, enumerates every legal alternative and
recomputes ownership, decision refs, denominators and publication rows. Lease/drain checkpoints
still run after every decision, including retained edges. This speeds repeated prefixes, not cold
unseen games, and changes neither the evidence authority nor derivation revision.
`make longitudinal-projector-check` exercises real sealed collectors, byte-identical growing
prefixes, changed ownership, unchanged checkpoints, absence, immutability and bounded eviction.
The test-only `createInMemoryTestApplication` has no worker and reports `disabled_test`.

The structural-event collector also uses exact JSON strings for its private subject
joins instead of hashing them. These strings never become public evidence identities;
event/value digests, payload order and complete populations remain unchanged. Caller-injected
research readers retain their historical encoder. No extra structural cache is added.
Five permanent controls and eight fresh-process full-output comparisons cover this correction;
summed cold time was 12.54% lower locally (seven faster pairs, one slower), not a portable
latency guarantee. The existing D3300 measurement receipt retains both the result and
the rejected cache experiment. Residual cold cost remains open.

Exact-target capture enumeration now computes legal destinations only for geometric
attackers of the requested landing square, using one shared chessops legality context.
Geometry never grants a capture: ordinary destination, capture and promotion checks
still apply, including en passant, pins, checks and all four promotion roles. The
complete sorted capture set and every legal-exchange continuation are unchanged;
there is no new cache, sampling, pruning or local-exchange convention. The permanent
full-destination reference checks all 64 targets with unrestricted, own, enemy and
empty origin queries. `make collector-index-check` includes exchange and mobility
regressions alongside the existing work-reuse checks. D3300 residual cold cost stays open.

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
