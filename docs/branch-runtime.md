# Branch runtime

The branch runtime is the implemented foundation for a chess-tabiya rehearsal. It
records play as an immutable, path-keyed tree: play forward, rewind to an earlier
node, choose another move, and compare the consequences without destroying the
first line.

The transport-independent implementation is `packages/runtime`. The Node binding
is `apps/server`, the living wire schema is `schemas/drill_run.schema.json` v0.2,
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

The run also records `packId`, `packDigest`, and `policyConfig`. Policy config
identifies whether execution happened in the browser or server and records every
engine/model id and version. Determinism claims apply only within the same recorded
execution locus.

## Move, rewind, and fork semantics

`commitMove` accepts every legal chess move. A move is never rejected because it
leaves an authored line; deviation classification is separate from legality.

- At a leaf cursor, the move extends the active branch.
- After rewind, committing at a node that already has children creates an implicit
  branch labeled with the next available `alt-N`, then commits the move there. The
  emitted order is always `branch.forked` followed by `move.committed`.
- `fork(nodeId, label?, intent?)` creates an empty explicit branch and moves the
  cursor to it. Its first move does not create another branch.
- `rewind(nodeId)` changes only the cursor and appends `run.rewound`. Existing
  nodes and branches remain unchanged. Rewind by the latest matching checkpoint is
  also available.

A successful rewind can notify a `JobObserver.onRewound(prunedNodeIds)` hook about
nodes leaving the active path. The runtime does not run or cancel analysis jobs;
future worker code owns that action.

Checkpoints append `checkpoint.reached` and add the checkpoint id to the referenced
node projection. Consecutive checkpoint hits on the same branch derive a segment
and emit `segment.completed`.

Illegal operations fail with typed errors rather than becoming no-ops:
`ILLEGAL_MOVE` (reason `malformed-UCI`, `wrong-side`, or `not-a-legal-move`),
`UNKNOWN_NODE`, `UNKNOWN_CHECKPOINT`, `RUN_TERMINATED`, and
`NOT_ACTIVE_WRITER`.

## Objective state machine

The runtime owns six objective states:

- non-terminal: `active`, `preserved`, `degraded`;
- terminal: `achieved`, `failed`, `transitioned`.

Any non-terminal state may transition to any *different* state. Terminal states
are absorbing, and a self-transition is not an event. Every accepted transition
must carry at least one non-empty evidence reference; the runtime appends
`objective.state_changed` and projects its state/evidence onto the active node.
Play cannot continue from a terminal node.

Synchronous objective rules are engine-free and deterministic. Implemented
predicates cover:

- checkmate, stalemate, and runtime-provable draw (insufficient material,
  50-move availability, or threefold occurrence on the active path);
- material balance in pawn units from either color's perspective;
- transpose-key equality, a piece or vacancy on a square, and exact/containing
  white and black pawn structures;
- whether a checkpoint was reached on the active path;
- `all`, `any`, and `not` composition.

Rules are evaluated in authored order; the first rule matching the current state
wins. An asynchronous `ObjectiveEvidenceUpgrader` interface can request a proposal
from a future worker, but this runtime does not execute workers or automatically
apply their proposals.

## Events and authoritative replay

The supported event vocabulary is:

`run.started`, `move.committed`, `opponent.move_selected`,
`checkpoint.reached`, `objective.state_changed`, `branch.forked`, `run.rewound`,
`segment.completed`, `feedback.generated`, `outcome.reached`, and
`transfer.scheduled`.

Replay is read-back, not policy recomputation. An opponent move must be represented
by `opponent.move_selected` immediately followed by its matching opponent
`move.committed`. The selection is authoritative. Replay rejects a missing,
non-adjacent, or disagreeing pair and never calls an engine/model policy. This makes
old runs reproducible even when an opponent implementation changes.

## Compare and PGN export

`compare(run, branchA, branchB)` requires the two branches to share a fork node.
It returns:

- the common `forkNodeId`;
- move pairs aligned by ply offset after the fork, omitting `a` or `b` explicitly
  when that side has no node at an offset;
- objective-transition timelines for both paths;
- checkpoint hits for both paths.

Engine scores and other overlays are not part of the comparison payload; later
systems attach them through evidence references.

`exportPgn` writes a selected set of branches as a legal PGN with variations.
Before serialization, chessops replays every path and verifies the stored UCI,
SAN, and resulting FEN. Corrupt or illegal paths fail rather than producing a
plausible-looking PGN.

## In-process and REST surfaces

The public runtime exports run creation, move commit, rewind by node/checkpoint,
explicit fork, checkpoint reach, event projection/read-back, objective evaluation,
comparison, and PGN export. `apps/server` is a thin boundary around those functions;
it does not reimplement their semantics.

| HTTP route | Writer required | Result |
|---|---|---|
| `POST /runs` | `x-writer-id` establishes the lease | `{run}` |
| `POST /runs/:id/moves` | yes | `{run, emitted}` |
| `POST /runs/:id/rewind` | yes | `{run, emitted}` |
| `POST /runs/:id/fork` | yes | `{run, emitted}` |
| `GET /runs/:id/graph` | no | `{graph: {id, nodes, branches, activeCursor}}` |
| `POST /runs/:id/compare` | no | `{comparison}` |
| `GET /runs/:id/events?sinceSeq=N` | no | `{events, nextSeq}` |

Rewind bodies contain exactly one of `nodeId` or `checkpointId`. Move bodies
contain `uci` and may contain `actor`, `at`, and `clockState`. Fork bodies contain
`nodeId` and may contain `label`, `intent`, and `at`.

HTTP errors always use `{error: {code, message, reason?}}`. Malformed requests map
to 400; unknown runs/nodes/checkpoints/branches to 404; duplicate runs, terminal
runs, and writer conflicts to 409; illegal moves and comparisons without a common
fork to 422. Unexpected and storage failures return a non-revealing structured
500.

## Writer lease and SQLite storage

Each run has one active writer id. The service checks it before every mutation,
and the SQLite `UPDATE` repeats the writer predicate atomically with the snapshot
write. A different writer receives `NOT_ACTIVE_WRITER` / HTTP 409. Other clients
may still read the graph, comparisons, and sequenced events.

`RunStorage` isolates persistence behind `create`, `read`, `save`, and `close`.
The ratified implementation is `SQLiteRunStorage`; PostgreSQL is a bounded future
adapter only if multi-host deployment or measured contention requires it.

SQLite stores one canonical JSON snapshot and active-writer id per run in a
`STRICT` table. File-backed databases enable WAL and use a five-second busy
timeout. Supplying no filename creates an in-memory database, so a durable server
composition must pass a file path.

The adapter memoizes immutable run projections in-process. A warm read returns
that projection. A cold read parses the stored snapshot, rebuilds it from the
authoritative event log with `readBackReplay`, validates opponent event adjacency,
and caches the result.

## Measured envelope

The server-bound benchmark used Node 26.5.0, in-memory SQLite, JSON response
consumption, and loopback Node HTTP. Each exact-size snapshot received three
warm-ups and twenty measured samples; preparation/reset time was excluded.
Milliseconds are `median / p95 / max`:

| Events | Cold replay + graph transport | Rewind (budget <100 ms) | Implicit fork+commit (budget <50 ms) |
|---:|---:|---:|---:|
| 200 | 2.408 / 2.862 / 3.062 | 2.820 / 3.594 / 4.619 | 2.481 / 3.224 / 3.530 |
| 1000 | 6.303 / 8.024 / 9.494 | 15.705 / 17.017 / 17.051 | 6.643 / 7.947 / 8.384 |

The supported experimental envelope is **at most 1000 events per drill run**.
That is a documented assumption, not an enforced limit. The benchmark proves the
interaction budgets only for this environment and envelope; it is not a browser,
wide-area-network, durable-disk, or marathon-session guarantee.

## Current limitations

- A lease has no expiry, renewal, transfer, or steal endpoint. “Continue on this
  device” needs a follow-up concurrency contract. Multi-device merge is absent.
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
