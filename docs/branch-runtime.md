# Branch runtime

Learner board marks are deliberately stored outside the run event log. Their gesture timing cannot satisfy the log's adjacency invariants, and no mark may become grading input; see `docs/board-annotation.md`.

The branch runtime is the implemented foundation for a chess-tabiya rehearsal. It
records play as an immutable, path-keyed tree: play forward, rewind to an earlier
node, choose another move, and compare the consequences without destroying the
original attempt.

Trajectory packs add derived `trajectoryLegSpans`, `legIndexAt`, and
`trajectoryVerdict` read-back shapes. At a checkpoint boundary the pack orchestrator may
seal the outgoing leg and reset its node state to active for the incoming objective. The
two events are ordered and replay-validated; no trajectory state is stored separately.

The transport-independent implementation is `packages/runtime`. The Node binding
is `apps/server`, the living wire schema is `schemas/drill_run.schema.json` v0.10,
and `packages/schema` owns the schema version constant. Browser and server code
import the same TypeScript runtime; there is no second implementation of chess
semantics.

## Run model

A run contains four projections:

- `nodes`: immutable positions joined by `parentId`;
- `branches`: named paths identified by their fork node;
- `events`: the authoritative, append-only history;
- `activeCursor`: the node and branch currently being played.

The event log is the source of truth. Nodes, branches, checkpoints, objective
state, and the cursor can be rebuilt from it. Event `seq` values start at 1 and
must remain contiguous; incremental readers ask for events whose sequence is
greater than a supplied cursor.

Shape firings, line membership, trajectory spans, and timing-window states are
derived projections rather than events. A timing window walks only the root-to-node
path, so rewinding above a close and choosing another branch recomputes counters and
verdict from that sibling's moves; abandoned sibling spend cannot leak into it. Closed
verdicts persist only when they drive the existing `objective.state_changed` event,
through a `tempo:<window>.<verdict>` evidence reference.

### Nodes are path-keyed

Every committed move creates a new node, even when its position transposes to one
already in the tree. A node contains:

`id, parentId, fen, transposeKey, moveUci, moveSan, ply, actor, branchId,
checkpointRefs, objectiveState, evidenceRefs, createdAt`, plus optional opaque
`clockState`.

`transposeKey` is the normalized four-field FEN: piece placement, side to move,
castling rights, and en-passant square. It recognizes equivalent positions without
merging distinct attempts. Following `parentId` from any node recovers its complete
history.

A branch contains `id, forkNodeId, label, seed`, and an optional `intent`. It is
metadata over a path, not a copied game. The initial branch is `main`. With
`seedMode: per_branch`, each new branch derives a distinct seed; `fixed` and
`per_run` reuse the primary seed.

Every run owns its session identity: `sessionKind`, nullable
`packId`/`packDigest`, an RFC-8785 SHA-256 `sessionDigest`, canonical `start`,
`feedbackPolicy`, `opponentPolicy`, and `policyConfig`. A pack digest identifies
the exact registered pack. A position digest covers its canonical FEN, learner
side, attempt-end feedback policy, and opponent policy; seed and execution locus
deliberately do not alter session identity. Position runs cannot request
`theory_strict`, because they have no authored spine. Imported sessions are also
non-pack `attempt_end` runs. Their identity additionally covers the digest of the
canonical root and complete historical movetext; their source bytes and headers
live in the import record described by `game-import-and-story.md`.

The nullable pack fields are an all-or-nothing pair. Projection also enforces
that position sessions use `attempt_end`, pack sessions do not, `start.fen`
equals the root node's FEN, and the session digest has the canonical SHA-256
shape. Policy config identifies whether execution happened in the browser or server and records every
engine/model id and version. Determinism claims apply only within the same recorded
execution locus.

## Move, rewind, and fork semantics

`commitMove` accepts every legal user/system chess move. A move is never rejected
because it leaves an authored line; deviation classification is separate from
legality. Opponent moves use the selection-aware helper described below.

- At a leaf cursor, the move extends the active branch.
- After rewind, committing at a node that already has children creates an implicit
  branch labeled with the next available `alt-N`, then commits the move there. The
  emitted order is always `branch.forked` followed by `move.committed`.
- `fork(nodeId, label?, intent?)` creates an empty explicit branch and moves the
  cursor to it. Its first move does not create another branch.
- `rewind(nodeId)` changes only the cursor and appends `run.rewound`. Existing
  nodes and branches remain unchanged. Rewind by the latest matching checkpoint is
  also available.

Opponent plies use `appendOpponentPly(selection)`, not a bare opponent
`commitMove`. The writer supplies the authoritative v0.4 selection (chosen move,
ranked candidates with optional policy mass, and exact engine/model identity).
The helper emits `opponent.move_selected` followed immediately by the matching
`move.committed`; a mismatch is rejected before either event is appended.

A successful rewind can notify a `JobObserver.onRewound(prunedNodeIds)` hook about
nodes leaving the active path. The runtime does not run or cancel analysis jobs;
future worker code owns that action.

Checkpoints append `checkpoint.reached` and add the checkpoint id to the referenced
node projection. A traversed interval between distinct checkpoint nodes emits
`segment.completed`; coincident checkpoints mark one node and do not invent a segment.
`deriveSegments` is a projection of those authoritative events rather than a second
checkpoint-pair recurrence. Each event must immediately follow its ending checkpoint and
match both referenced checkpoint events in sequence, branch, and node metadata. Genuine
pre-guard zero-length events remain readable; forged or corrupted scope is rejected.

When a committed move creates a checkmate or draw position, the same mutation
emits `outcome.reached` immediately after `move.committed`. Its closed result is
`win`, `loss`, or `draw` from `start.side`, the learner's perspective. Terminal
starting FENs are refused with `TERMINAL_START_POSITION`: a finished position
contains no decision to rehearse. Rewinding and replaying a terminal move creates
a new node and therefore a new outcome event for that node.

Illegal operations fail with typed errors rather than becoming no-ops:
`ILLEGAL_MOVE` (reason `malformed-UCI`, `wrong-side`, or `not-a-legal-move`),
`UNKNOWN_NODE`, `UNKNOWN_CHECKPOINT`, `TERMINAL_START_POSITION`, `RUN_TERMINATED`, and
`NOT_ACTIVE_WRITER`.

## Objective state machine

The runtime owns six objective states:

- non-terminal: `active`, `preserved`, `degraded`;
- terminal: `achieved`, `failed`, `transitioned`.

Any non-terminal state may transition to any *different* state. Terminal states
are absorbing, and a self-transition is not an event. Every accepted transition
must carry at least one non-empty evidence reference; the runtime appends
`objective.state_changed` and projects its state/evidence onto the active node.
Play cannot continue from a terminal node. Terminal outcomes include checkmate,
stalemate/insufficient material, halfmove-clock 100, and the third occurrence of one
position on the active path. The latter two may leave legal moves on the board; the
persisted `outcome.reached` event, not move availability, closes the node.

Synchronous objective rules are engine-free and deterministic. Implemented
predicates cover:

- checkmate, stalemate, and runtime-provable draw (insufficient material,
  50-move availability, or threefold occurrence on the active path);
- material balance in pawn units from either color's perspective;
- transpose-key equality, a piece or vacancy on a square, and exact/containing
  white and black pawn structures;
- whether a checkpoint was reached on the active path;
- whether a checkpoint fired at the active node, preventing a historical
  checkpoint fact from oscillating a non-terminal grade on later plies;
- whether the active path contains a validated learner-perspective terminal
  result;
- `all`, `any`, and `not` composition.

Rules are evaluated in authored order; the first rule matching the current state
wins. An asynchronous `ObjectiveEvidenceUpgrader` interface can request a proposal
from a future worker, but this runtime does not execute workers or automatically
apply their proposals.

The generic transition graph remains permissive for non-outcome objectives.
Outcome Drill narrows it in the server compiler: non-terminal progress is
monotone (`active` to `preserved` to `degraded`), absorbing grades require an
`outcome.reached`, and degradation rules precede checkpoint resolution. This is
an orchestration contract rather than a change to the reusable state machine.

`opponentMovesFromEvents` is the shared read-back pairing primitive for
`opponent.move_selected` and its adjacent committed child. Replay and
path-resistance reporting use that same primitive and therefore fail on the
same malformed adjacency. Resistance is attributed only when the committed
child lies on the requested path, so a sibling branch cannot inherit an
opponent identity from another attempt.

## Events and authoritative replay

The supported event vocabulary is:

`run.started`, `move.committed`, `opponent.move_selected`,
`checkpoint.reached`, `objective.state_changed`, `evidence.attached`,
`branch.forked`, `run.rewound`, `segment.completed`, `feedback.generated`,
`outcome.reached`, `transfer.scheduled`, `feedback.revealed`, `prediction.recorded`, and
`group.created`.

`feedback.generated` now has its first production emitter: the post-commit guard. Replay
requires its node to exist and its evidence-reference list to be non-empty.

`evidence.attached` is the v0.3 worker amendment. It identifies a node, one or
more evidence references, and a typed payload whose kind is `eval`, `wdl`, or
`bestline` and whose source is `engine_validated` or
`human_model_predicted`. Projection appends unique references to that node only;
attaching evidence does not itself change objective state.

The v0.4 worker amendment adds the typed `selection` payload to
`opponent.move_selected`. The selected move is repeated at the event-data level
so adjacency checks remain cheap; the runtime requires both values to agree.

Replay is read-back, not policy recomputation. An opponent move must be represented
by `opponent.move_selected` immediately followed by its matching opponent
`move.committed`. The selection is authoritative. Replay rejects a missing,
non-adjacent, or disagreeing pair and never calls an engine/model policy. This makes
old runs reproducible even when an opponent implementation changes.

The v0.5 session amendment adds `feedback.revealed`. It is valid only for an
`attempt_end` run. The event is a durable disclosure record, but
its delivery window is narrower: reveal opens staged-evidence delivery and the
next `move.committed` closes it. Historical evidence stays disclosed while new
analysis cannot silently become live assistance. Repeating reveal while open is
idempotent.

The v0.6 amendment closes `outcome.reached` to `win|loss|draw` and makes it a
feedback reveal under every policy. Projection treats it as security-sensitive:
the event must immediately follow the matching terminal node's move, name the
derived learner-perspective result, and occur once for that node. Unknown,
non-terminal, duplicated, misordered, or mismatched outcomes fail replay rather
than opening the disclosure barrier. Under `attempt_end`, an outcome opens
delivery, rewind leaves it open, and the next committed move closes it.

## Compare and PGN export

`compareBranches(run, branchIds)` accepts two through eight distinct branches and
derives one deepest fork shared by the whole set.
It returns:

- the common `forkNodeId`;
- branch-keyed rows aligned by ply offset after the fork. Each row partitions
  present columns by node identity, so a shared prefix is not rendered as a difference;
- objective-transition timelines and checkpoint hits keyed by branch;
- per-branch consequence facts; and
- per-branch recorded evaluation and best-line evidence aligned by ply offset. Each entry
  carries its node and evidence references plus a White-perspective score
  encoded as either centipawns or moves to mate.

The evaluation overlay is derived only from durable `evidence.attached` events
on each branch path, never from the transient job queue. Its v1 scope is
engine-validated `eval` payloads with an integer `centipawns` or `mateIn`
value; WDL, best-line, human-model, and future evidence sources remain typed
events but are not score points in this overlay.

`exportPgn` also accepts guarded header overrides. Imported sessions use them to
preserve original game attribution and result while retaining Tabiya's run/session
identity and exporting the complete original plus rehearsal branches. See
`game-import-and-story.md`.

Run schema v0.8 adds `Branch.origin` (`played|simulated`) and durable
`prediction.recorded` events. `exportPgn` writes a selected set of branches as a
legal PGN with variations and marks promoted simulated branches.
Before serialization, chessops replays every path and verifies the stored UCI,
SAN, and resulting FEN. Corrupt or illegal paths fail rather than producing a
plausible-looking PGN.

Run schema v0.9 adds durable branch groups and the `enumerated` applied-policy
value. A group is projected solely from `group.created` and points at ordinary
direct-child branches; replay validates membership and any machine-source
distribution. Group creation, controlled resistance, client behavior, and
migration 11 are documented in `branch-groups.md`.

## In-process and REST surfaces

The public runtime exports run creation, move commit, rewind by node/checkpoint,
explicit fork, checkpoint reach, event projection/read-back, objective evaluation,
comparison, and PGN export. `apps/server` is a thin boundary around those functions;
it does not reimplement their semantics.

| HTTP route | Writer required | Result |
|---|---|---|
| `POST /runs` | authenticated host + `x-writer-id` establishes the lease | `{run}` |
| `POST /select-move` | no; pure selection only | `{moveUci, candidates?, engine}` |
| `POST /runs/:id/moves` | yes | `{run, emitted}` |
| `POST /runs/:id/rewind` | yes | `{run, emitted}` |
| `POST /runs/:id/fork` | yes | `{run, emitted}` |
| `POST /runs/:id/group` | yes | `{group, run, emitted, comparison}` |
| `POST /runs/:id/group-reply` | yes | `{selection, reusedFromNodeId}` |
| `GET /runs/:id/graph` | no | `{graph: {id, nodes, branches, activeCursor}}` |
| `POST /runs/:id/compare` | no | `{comparison}` |
| `GET /runs/:id/events?sinceSeq=N` | no | `{events, nextSeq}` |
| `POST /runs/:id/reveal` | yes | `{run, emitted}` |

Run creation uses a closed `session` union. Pack requests supply `kind: pack`,
`packId`, and an optional digest staleness check; the server derives start,
feedback, opponent policy, and stored digest from the registry. Position
requests supply `kind: position`, start, `attempt_end`, and a selectable
human/strong opponent policy. Unknown create-body fields are rejected with
their JSON pointer.

Rewind bodies contain exactly one of `nodeId` or `checkpointId`. User/system move
bodies contain `uci` and may contain `actor`, `at`, and `clockState`; opponent
move bodies contain the selector's `selection` plus optional `at`/`clockState`.
Fork bodies contain
`nodeId` and may contain `label`, `intent`, and `at`.

HTTP errors always use `{error: {code, message, reason?}}`. Malformed requests map
to 400; unknown runs/nodes/checkpoints/branches to 404; duplicate runs, terminal
runs, and writer conflicts to 409; illegal moves and comparisons without a common
fork to 422. Unexpected and storage failures return a non-revealing structured
500.

## Writer lease and SQLite storage

Each run has one active device writer id and one active learner holder. A
learner must first hold a per-run `host` or `participant` grant; the service then
checks both learner and device before every mutation, and the SQLite `UPDATE`
repeats both predicates atomically with the snapshot write. A spectator receives
HTTP 403; a writer-capable learner who does not hold the board receives
`NOT_ACTIVE_WRITER` / HTTP 409. Authorized readers may still read the graph,
comparisons, and sequenced events, but no read response publishes the opaque
writer id.

There is now an explicit claim operation. Any writer-capable learner may claim
the board for their current device; there is deliberately no lease expiry. If a
grant mutation removes write access from the current holder, storage transfers
the lease to the acting host in the same transaction. Account deletion transfers
it to the non-authenticating `__legacy` sentinel, leaving the board claimable by
any surviving writer-capable member.

`RunStorage` isolates persistence behind `create`, `read`, `save`, and `close`.
The ratified implementation is `SQLiteRunStorage`; PostgreSQL is a bounded future
adapter only if multi-host deployment or measured contention requires it.

SQLite stores one canonical JSON snapshot and active-writer id per run in a
`STRICT` table. File-backed databases enable WAL and use a five-second busy
timeout. Supplying no filename creates an in-memory database, so a durable server
composition must pass a file path.

Migration 3 adds a stored run-schema version. Pre-v0.5 rows cannot be upgraded
honestly because their events do not contain learner side or feedback/opponent
policy, so they remain on disk but are quarantined from reads and listings.
Migration 1 reads legacy snapshot structure directly instead of replaying it
through the current runtime: migrations must not depend on the projection whose
job is to reject obsolete shapes. Run summaries record session kind, nullable
pack id, and session digest.

Migration 4 upgrades ordinary v0.5 snapshots and their indexed version to v0.6,
so history and resume remain available after the wire bump. A v0.5 row already
containing the formerly producer-less `outcome.reached` event is left quarantined
instead of being trusted or rewritten.

Migration 4 writes the frozen literal `0.6`; it does not reference the moving
schema-version constant. Migration 5 then upgrades v0.6 snapshots to run schema
v0.7 by adding `policyModeApplied: unknown` to historical opponent selections.
It never infers an applied policy from the request or engine identity.

Migration 11 stamps v0.8 snapshots and indexed rows to run schema v0.9 using
frozen literals. It adds no invented fields: historical runs contain neither a
group event nor an enumerated selection. The stamp is still required because
reads and listings admit only the current run-schema version.

Migration 19 stamps v0.13 snapshots and indexed rows to run schema v0.14 using
the frozen literals `0.13` and `0.14`. It rewrites no event or selection data:
the new practical-resistance mode, per-candidate concession ratio, and
Elo-capability facts are additive. Historical group journals therefore replay
and compare exactly as before the stamp.

Migration 20 stamps v0.14 snapshots and indexed rows to run schema v0.15 using
the frozen literals `0.14` and `0.15`. The only wire widening is optional
`SelectionCandidate.offWindow`, marking a played engine sample that was outside
its reported MultiPV window. Historical selections are not rewritten and replay
remains byte-identical.

Migration 23 stamps v0.16 snapshots and indexed rows to run schema v0.17 using
the frozen literals `0.16` and `0.17`. It adds no event and infers no ordering:
historical opponent selections keep `orderingBasis` absent. New `perfect_tablebase`
selections record `dtz_ascending`, `dtz_descending`, or `none`; other modes cannot carry
the field, and read-back replay preserves the value.

## Derived Line Drill state

`spinePositionIndex` resolves authored positions by transpose key, keeping the
shallowest document-order node on collisions. `lineMembership` derives one of
`on_line`, `classified_deviation`, or `unknown` for each played ply; verdicts
are read-back projections, not events. `deviationPlayed` is the sole new
objective predicate and matches only the active move edge from its authored
parent position.

For `follow_theory`, an off-objective authored deviation may move
`active|preserved → degraded`, and first boundary crossing may move
`active → preserved`. No rule moves backward or enters `achieved`, `failed`, or
`transitioned`, so crossing the authored line never freezes continued play.

The adapter memoizes immutable run projections in-process. A warm read returns
that projection. A cold read parses the stored snapshot, rebuilds it from the
authoritative event log with `readBackReplay`, validates opponent event adjacency,
and caches the result.

## Measured envelope

The server-bound benchmark used Node 26.5.0, in-memory SQLite, JSON response
consumption, and loopback Node HTTP. Each exact-size snapshot received three
warm-ups and twenty measured samples; preparation/reset time was excluded.
Milliseconds are `median / p95 / max`.

The fork+commit budget was `<50 ms` when this benchmark ran; the owner ruling of
2026-08-13 replaced it with a worry/intervene band (`design/02-product-shape.md`).
Every figure below passes under either, so the numbers are unchanged — only the
citation is.

**Worth reading against the client-observed figures:** server-bound fork+commit
sits at 2–8 ms here, while a client-observed branch switch measures 45–53 ms
(`docs/app-shell.md`). So roughly 40–45 ms of a branch switch is client work and
transport, not run mutation. Anyone who ever does want that gesture faster should
start there, not in the runtime:

| Events | Cold replay + graph transport | Rewind (budget <100 ms) | Implicit fork+commit (budget: worry 100 ms / intervene 200 ms) |
|---:|---:|---:|---:|
| 200 | 2.408 / 2.862 / 3.062 | 2.820 / 3.594 / 4.619 | 2.481 / 3.224 / 3.530 |
| 1000 | 6.303 / 8.024 / 9.494 | 15.705 / 17.017 / 17.051 | 6.643 / 7.947 / 8.384 |

The supported experimental envelope is **at most 1000 events per drill run**.
That is a documented assumption, not an enforced limit. The benchmark proves the
interaction budgets only for this environment and envelope; it is not a browser,
wide-area-network, durable-disk, or marathon-session guarantee.

## Current limitations

- A lease has no expiry, renewal, heartbeat, or merge. Claim is unconditional
  among authorized writers (last claimer wins); concurrent multi-device edits
  are prevented, not merged.
- Every save serializes and replaces the entire run snapshot. This is O(n) write
  amplification even though warm reads are memoized. A future event-append adapter
  can change storage without changing runtime semantics.
- The process-local snapshot cache never evicts entries. This is acceptable for
  the current single-user experiment, not an unbounded hosted service.
- Runtime mutations still perform whole-log projection work. Incremental reducers
  plus periodic durable snapshots must be evaluated before lifting the 1000-event
  assumption; 3000+ event sessions have not been accepted or characterized.
- The runtime exposes only the job-observer and asynchronous-evidence interfaces;
  it contains no Stockfish, Maia, worker scheduling, feedback composition, or
  automatic evidence upgrade implementation.
- `clockState` is preserved as opaque data; time-pressure semantics are deferred.
- PostgreSQL, horizontally replicated servers, and multi-host SQLite are not
  implemented.

The implementation is covered by deterministic scenario tests, real fast-check
invariant properties, replay corruption tests, legal PGN round-trips, REST/lease
integration tests, cold SQLite reopen tests, and the latency instrumentation above.
