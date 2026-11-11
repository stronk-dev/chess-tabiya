# Longitudinal store

Profile no longer exposes the old pooled event-prevalence observations as habits. Its overview
returns observationStatus unavailable/subject_metrics_not_adopted and observations:[]; old
observation detail returns authenticated409 PROFILE_OBSERVATIONS_NOT_ADOPTED. The UI states
“Detailed structure statistics are unavailable.” GAME/choice/skills/history remain independent.
The historical aggregate descriptions below do not authorize current personal-habit delivery.


The longitudinal store is the personal observation ledger behind every future cross-game learner
surface (style, skills, opening performance, recommendations, campaign credit). It persists
**opportunity/outcome pairs over declared evidence**, split by phase and decision class, plus
per-root attempt-structure counts, typed per-game source reductions and complete choice facts. It is a projection of each run's immutable event log: rows are
re-derivable byte-for-byte and never a second source of truth. Contract: `rfc/longitudinal-store.md`.
Its first consumer is the private [learner profile](learner-profile.md) (`/learner-profile`, client
route `/profile`); the store itself still has no route of its own.

Current derivation revision is **10**, with storage migration **36** (D4200).
The 65-entry registry separates seven native subject sources, 34 prevalence sources, 13 condition
sources and 11 deferred paths. One complete legal population per decision supplies the 54
admitted sources. Available observations and per-source gaps publish with the same completion
watermark. Normal startup invalidates earlier derived revisions and requeues their jobs.
The worker rebuilds all seven families from saved play. Profile reports incomplete coverage
while a cut rebuilds.

The revision 9 predecessor test restores five actual schema 35 jobs, starts the current
application and worker, and checks revision 10 publication, reopening and repair. The upgrade
retains saved play, imports and account data. The predecessor fixture is committed and the
normal test suite needs no archived executable or raw research dumps.

## Storage

| Object | Meaning |
|---|---|
| `drill_runs.longitudinal_profile_disposition` | `profileable`, or `account_deleted` once an owner's deletion suppresses a retained shared run; rebuild never re-derives a suppressed run |
| `drill_runs.longitudinal_structure_attribution` | `single_player` (every new run), `unattributable_shared` (monotone: set by a live session or a non-owner write grant, never reverted) or `unattributable_legacy` (pre-migration default) |
| `learner_observation_denominators` | decisions per `(run, phase, decision_class)`, family-independent |
| `learner_observations` | one row per admitted `(projection, version, semantic sign, source sign, phase, class)` with `opportunities`, `occurred`, `alternative_share_sum` and canonical typed decision refs |
| `learner_game_facts` | migration33: exactly one typed per-cut GAME row, including ineligible games and explicit field unavailability; original first-owner BEFORE and earliest configuration snapshot references |
| `learner_choice_facts` | migration34: exactly one typed per-cut complete choice document, including ineligible runs and unavailable decisions; original move refs, chosen flags, legal identities and integer trait counts |
| `learner_subject_observations` | migration35: exact native and condition subjects from available sources |
| `learner_subject_evaluations` | migration36: one record per original decision, including actor, phase, decision class, legal-alternative count and exact unavailable sources |
| `learner_structure_stats` | per-root branch/rewind/fork/group/outcome counts, single-player runs only |
| `learner_observation_jobs` | the durable five-state projection job (`pending`, `running`, `complete`, `retry_wait`, `quarantined`) |

Every child row carries a composite `(run_id, learner_id) → drill_runs(id, owner_learner_id)`
foreign key (`ON UPDATE RESTRICT`), so a crossed learner/run pair fails and an owner cannot change
while private rows exist. `observed_at` is the immutable `run.started.at`, never a wall clock.

## What is observed

`apps/server/src/longitudinal-registry.ts` defines the exact 65-entry ingest registry against
the compiled evidence catalogue.
For every owner-authored decision the projector enumerates the complete legal population once;
a family is an opportunity only when at least one legal move exhibits it and at least one does not.
Imported source-game moves are `game`, the learner's own moves `played`, first predictions per
checkpoint `predicted`. Move authorship comes from durable records: no collaboration journal means
the owner (single-player and pre-migration runs); a live session's `board.granted` timeline
attributes each commit to its holder; grant-only shared runs and imported arena legs abstain.
Predictions are admitted only on `single_player` runs. That decision algebra (`normativeDecisions`)
lives in `longitudinal-decisions.ts` so the HTTP-side profile can share it without importing the
projector's population enumeration, which stays off the HTTP module graph.

An original `invalid_turn_clone` outcome marks the affected source unavailable for that
decision. It leaves independent complete sources and the normative decision count intact.
The coverage read includes quiet and forced decisions even when neither has observation rows.

`make longitudinal-incidence` is an opt-in diagnostic, not a CI/progress prerequisite. In the
three fixed PGNs measured for D4018, 60 of 109 decisions have complete populations and 49 are
unavailable; all legal alternatives and both learner colors are included. This is not a general
chess rate or source qualification. The existing implementation receipt records exact-sign
counts, including the allowed but unemitted exposure `state` sign (D4019), and the diagnostic
writes only an ignored compact aggregate, not raw collector recordings.

## Writes, jobs and the worker

The worker and rebuild tool also own a private exact-cut foundation GAME source scope
(`apps/server/src/profile-game-source.ts`, `rfc/profile-game-facts.md` §§1–2). A worker scope
requires the identical image returned for its original same-store claim. Actual lease renewals
preserve it; claim replacement, expiry, source movement, deletion, observed failure and explicit
close retire it. The worker closes the scope after publication, conflict, failure or drain.

Acquisition checks every node's original creation identity, canonical position, declared branch
and actual legal parent edge before narrowing to the primary line. Later replayed checkpoint
annotations are allowed. The original castling factory can read the private claimed-prefix arm;
live decision, actor and clock issuance reject that arm. It carries a historical cut, without
claiming to be the latest live position or proving a learner action.

Rebuild captures a separate complete-job source scope in a short read transaction and projects
after releasing the lock. It checks the original tuple before comparison and the actual source
digest again inside repair, then closes even on exceptions. The store's dependency path contains
no semantic projector/worker executor. The machine-only `profile.game_facts@1` consumer uses
original setup/screen snapshots and the first-side castling source; it joins each genuine factory
value to its original FEN/setup/prefix. Original computed rows belong to that operation scope;
copies, foreign scopes and context-free test outputs cannot publish or repair.

All seven families replace atomically with the completion watermark. Rebuild compares and repairs
GAME and choice rows as well, tolerating corrupt persisted JSON without losing the other families.
`includeGameFacts: true` is a separate read-query option: run/session/pack selection applies,
while decision phase/class/projection filters do not shrink the GAME population. Each selected
complete cut returns an available row or explicit missing/invalid GAME outcome. Missing GAME
evidence preserves the independently complete original decision rows/history.

The new table is private behavioral data: tagged account export includes it; account restore
never copies it and queues rederivation from saved play. Run/account deletion cascades. Schema32/
revision6 upgrade and reopen controls preserve exact saved source images. This introduces no new
public endpoint or wider attribution/semantic qualification.

The same original claimed/rebuild scope now issues a separate finite owner-choice decision.
It is not a live grant: live occurrence and clock readers still refuse it. Only early queen
accepts this explicit additional original-context arm. Actual single-player role plus original
owner MOVE is required; unsupported roles remain selected with unavailable choice data. The
`profile.choice_facts@1` consumer uses exact legal-map/candidate-role/centre/early-queen inputs,
retains all canonical legal moves including the chosen one, and reduces integer counts and
chosen flags without dropping forced, unanimous or all-false populations. No opportunity-row
average can substitute for these chosen-inclusive denominators.

`includeChoiceFacts: true` opts into a separate complete-cut lane. Omitting it does not read
the new table. Run/session/pack selection chooses runs; phase/class/projection filters never
truncate their documents. Each selected completed cut has one available, missing or invalid
outcome. Unknown choice data does not remove a game's other rows or history. The strict data
parser and original source/metadata joins both apply before any Profile metric uses the row.
Actual schema33/revision7 upgrade, late insert rollback, missing/corrupt rebuild, source movement
and account rederivation controls cover the new family; current full verification is tracked
in `planning/foundation-source-identity/plan.md`.

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
Heartbeat deadlines retain their original phase, so checkpoint lateness does not accumulate;
one due checkpoint counts only its actual successful full-tuple CAS, never synthetic catch-up
renewals. Worker progress includes finite `claimElapsedMs` measured locally from claim processing
through actual publication, including source preparation. Later message delivery and HTTP
observation are separate. The real one-claim performance check uses that same claim's duration
and renewal count with the unchanged heartbeat floor and two-interval allowance.
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
The October-13 D3782 freezer-sharing candidates are rejected: both preserve the full
population but are slower in every counterbalanced cold pair. The separate memo/mint
freezers remain. D3783 changes only mint freeze ordering to prevent descendant hooks
replacing parent data; it does not reduce the semantic population or claim a speedup.
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
Growing prefixes reuse complete local projection/version/sign memberships for exact
before-FEN/move/after-FEN tuples. The worker retains at most 4,096 immutable entries, FIFO;
clock fields remain part of identity, failures are recollected, and injected collectors stay
uncached. Every projection still replays its source, enumerates every legal alternative and
recomputes ownership, decision refs, denominators and publication rows. Lease/drain checkpoints
still run after every decision, including retained edges. This speeds repeated prefixes, not cold
unseen games. The original reuse optimization changed neither evidence authority nor derivation
revision; D4018 separately changes the exact membership join and advances revision 6 as above.
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

The shared exact destination resolver also avoids rebuilding the entire legal population for
one selected move. It uses one parsed position and the existing normalization, legality and
castling landing rules; the complete move enumerator remains unchanged. Thirty-seven permanent
destination controls include three predecessor-failing work counts, all legal destinations in
22 both-color/check/pin/promotion/en-passant/castling/terminal positions and twelve refusal cases.
Eight fresh-process comparisons preserve every event, value/input receipt and projected row.
Five pairs are faster and three slower; summed cold time is only 0.75% lower locally, not a
substantial or portable whole-game speedup. This adds no cache, narrowed evidence or revision.

## Reading

`application.longitudinal.read(actorLearnerId, parseLongitudinalReadQuery(...))` (and
`SQLiteRunStorage#readLongitudinalSnapshot`) is the one consumer read. It returns rows only when
every requested or eligible run is complete at the requested revision and exact current cut;
otherwise it returns one outcome per run (`pending` with `retryAt`, `failed` with code and attempts,
or `unavailable`: `not_requested`, `revision_mismatch`, `profile_suppressed`, `cut_superseded`) and
no data. Consumer RFCs build on this handle. The learner profile reads `played` rows only and, when
some cuts are still pending, re-reads exactly the complete cuts so it can count them while naming
the rest.

Every complete snapshot includes typed source coverage. The ordinary view covers 34 prevalence
sources. `includeSubjectObservations: true` also admits the seven native and 13 condition
sources. Exact source filters project that union. Sign, actor and subject refinements filter
observations while preserving the decision cohort. Reads check source context and row cardinality
against the saved replay. A compare/rebuild re-executes the collectors to detect and repair
semantically incorrect stored availability.

## Operations

- `make longitudinal-worker-once` drains one bounded batch of queued work against `DATABASE_PATH`.
- `make longitudinal-rebuild [WRITE=1]` re-derives every complete projection, names each missing,
  surplus or changed row by run and key, and repairs with `WRITE=1`. It is never an upgrade step.
- Account export includes all seven derived families and their projection jobs under `behavioralProfiles`; account and per-run deletion
  previews list them, and deletion removes them (see `account-data-lifecycle.md`).

The real 80-ply fixed-corpus arm projects in the worker while `/healthz` answers at 20 Hz with
event-loop delay p95 under50ms, maximum under250ms and every probe under500ms
(`apps/server/src/longitudinal-worker-performance.test.ts`). `make longitudinal-lease-check`
retains controlled-clock cadence, actual preparation/publication time, late-observation isolation,
no invented renewals, full-CAS lease loss and timer-only negatives. All unchanged performance
contracts run with `make test-performance`.
