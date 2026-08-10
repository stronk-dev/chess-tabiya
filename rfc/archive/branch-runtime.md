# RFC: Immutable Branch & Rewind Runtime

- **Status:** implemented
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` (episode loop), `design/02-product-shape.md` (UX commitments, latency budgets)
- **Exploration gate:** owner override, logged `planning/exploration/log.md` 2026-08-12
- **Depends on:** `rfc/drill-pack-format.md`
- **Parent / amends:** mines `archive/brief-v2/rfcs/RFC-0002-branch-runtime.md` sketch, `archive/brief-v2/schemas/drill_run.schema.json`, `archive/brief-v2/12_SYSTEM_ARCHITECTURE.md` event model
- **Supersedes / superseded by:** —
- **Planning:** `planning/archive/branch-runtime/`

## Summary

The core mechanic as a data structure: every move is an immutable node in a
path-keyed tree rooted at the drill start; rewind moves a cursor; committing a move
at a non-leaf cursor forks a branch automatically; nothing is ever destroyed. E1
verified this system's absence in every competitor — it IS the product.

## Motivation

Everything else sits on this. Out of scope: engine/Maia workers (own RFC), feedback
composition (own RFC), any UI, multi-device conflict merge (v1 is single-writer).

## Specification

### Implementation doctrine (owner rulings 2026-08-12)

- **TS core + Go workers.** The runtime is one TypeScript package (chessops for
  rules/PGN) imported by both the browser client and the Node server — one
  implementation of every invariant below. Self-contained workers that speak only
  data formats (future corpus pipeline, engine-pool supervision if needed) are Go.
  Client framework: Svelte 5.
- **Maia-3 runs as a containerized Python sidecar** speaking UCI — same pattern as
  the Stockfish binary. Python exists only inside worker containers, never in
  server code. ONNX export tracked as a later optimization (would also enable
  browser Maia).

### Node model (path-keyed tree — BR-C5 ruling)

Nodes are identified **by path, not by position**: transposed positions are
distinct nodes. Each node carries a `transposeKey` (normalized FEN: piece
placement, side to move, castling, e.p. — no clocks); pack triggers, checkpoints,
and `authoredBoundary` match by `transposeKey`/predicate, never by node identity —
so a Line Drill that transposes back into book is recognized.

Node: `id, parentId, fen, transposeKey, moveUci, moveSan, ply, actor
(user|opponent|system), branchId, checkpointRefs[], objectiveState, evidenceRefs[],
createdAt, clockState?`. Branch: `id, forkNodeId, label, intent?, seed`. Run: `id,
packId, packDigest, policyConfig, nodes[], branches[], events[], activeCursor`.
`policyConfig` includes the **execution locus**: `{executedAt: browser|server,
engineIds+versions, modelIds+versions}` (BR-C2).

The normative shapes live in `schemas/drill_run.schema.json` (living, v0.2,
committed at implementation start; prose defers to it — BR-C8). Events carry a
monotonic `seq`; `events(run, since)` cursors on `seq`, not timestamps.

### Fork semantics (BR-C1 ruling)

- `commitMove` at a leaf cursor: appends to the active branch.
- `commitMove` at a **non-leaf** cursor (after rewind): **implicit fork** — new
  branch with auto id, label `alt-N`, seed derived per the pack's `seedMode`;
  events emitted in order `branch.forked`, then `move.committed`. Rewind-then-move
  stays one frictionless gesture (design/02: rewind creates an experiment).
- Explicit `fork(nodeId, label?, intent?)` creates an **empty named branch** and
  moves the cursor; the next `commitMove` appends to it (no second fork).

### Objective state machine (BR-C3 ruling)

Owned by the runtime core. States: `active, preserved, degraded` (non-terminal) and
`achieved, failed, transitioned` (terminal, absorbing). **Any non-terminal state may
transition to any other state**; self-transitions are not events. The path a run
takes (e.g. degraded → preserved recovery, or degraded → achieved in a save drill)
is descriptive history, not a prescriptive graph — the machine's invariants are:
terminals absorb, and every transition carries evidence. Synchronous evaluation uses **engine-free pack predicates** only
(rules facts: mate/stalemate/draw, material balance, fenPredicate, checkpoint
reach). Workers may later **asynchronously upgrade** a state with evidence — every
`objective.state_changed` event carries `evidenceRefs` (the CET lesson: never a
bare banner). The mock acceptance scenario uses a rules-only objective.

### Event-sourced log & replay (BR-C2 ruling)

Append-only events (each with `seq`): `run.started, move.committed,
opponent.move_selected, checkpoint.reached, objective.state_changed, branch.forked,
run.rewound, segment.completed, feedback.generated, outcome.reached,
transfer.scheduled`. The event log is the source of truth; node/branch tables are a
projection. A **segment** is the span between consecutive `checkpoint.reached`
events on a branch (referenced by the pack format's `segment_end`).

**Replay is read-back:** logged `opponent.move_selected` events are authoritative;
replay never recomputes opponent moves. Recompute-and-verify is a diagnostic mode,
valid only within the same execution locus (same engine/model versions per
`policyConfig`).

### Errors & concurrency (BR-C4 ruling)

Typed error surface — **never silent** (CET teardown lesson): `ILLEGAL_MOVE`
(with reason: not-a-legal-move / wrong-side / malformed-UCI), `UNKNOWN_NODE`,
`UNKNOWN_CHECKPOINT`, `NOT_ACTIVE_WRITER`, `RUN_TERMINATED`. Concurrency: **one
active writer per run** (lease held by one client; server rejects appends from
non-holders with `NOT_ACTIVE_WRITER`); other devices attach read-only via
`events(since)`. Multi-device merge is explicitly out of scope for v1.

### Invariants (property-tested)

1. Old nodes never mutate; rewind only moves the cursor.
2. A branch is a named path through nodes, not a copied game.
3. Full history recoverable from any node.
4. *(moved to the engine-workers RFC — BR-C6)* The runtime exposes a
   `JobObserver.onRewound(prunedNodeIds)` hook, tested here with fakes; actual
   analysis-job cancellation is specified where jobs exist.
5. Export of any branch set is legal PGN with variations.
6. Comparison aligns nodes by relative ply from the common fork node.
7. Opponent determinism **within a single locus**: same (packDigest, policyConfig
   incl. locus+versions, seed, user moves) → same opponent moves; `seedMode:
   per_branch` gives each branch its own stream. Across loci, the event log is
   authoritative (see Replay).
8. Deviation never blocks: any legal move is accepted; classification and
   objective state respond; the runtime never refuses.

### Compare contract (BR-C7 ruling)

`compare(run, branchA, branchB)` requires a **common fork node** (v1) and returns:
`{forkNodeId, pairs: [{plyOffset, a?: NodeRef, b?: NodeRef}] (absent side marked
when branches differ in length), objectiveTimelines: {a, b}, checkpointHits:
{a, b}}`. Engine/feature overlays attach later via `evidenceRefs`; they are not
part of this RFC's payload.

### API surface (transport-agnostic contract)

`createRun(pack) · commitMove(run, uci) · rewind(run, nodeId|checkpoint) ·
fork(run, nodeId, label?, intent?) · graph(run) · compare(run, a, b) ·
exportPgn(run, branches?) · events(run, sinceSeq?)`. The REST binding
(`POST /runs`, `/moves`, `/rewind`, `/fork`, `GET /graph`, `POST /compare`,
`GET /events?sinceSeq=`) and the in-process client binding wrap the same TS
package.

### Execution model (owner ruling 2026-08-12)

Hybrid with **backend capability parity**: every capability has a backend
implementation; browser implementations (rules, board, shallow Stockfish WASM,
possibly small Maia) are negotiated progressive enhancements; in-browser model
downloads are opt-in. The event log syncs to the server regardless of where moves
were computed, under the single-writer lease.

### Latency budgets (acceptance targets, from design/02)

Rewind <100 ms · branch switch <50 ms · board-ready <250 ms warm · cached opponent
move perceived-instant. Table stakes (CET is already fast), not differentiators.

## Deviations from design

None.

## Acceptance criteria

- Property tests (fast-check) for invariants 1–3, 5–8 + the `JobObserver` hook
  with fakes.
- Replay determinism test: event log → identical reconstruction, twice; opponent
  moves read back, never recomputed.
- Error surface test: illegal move returns `ILLEGAL_MOVE` with reason — never a
  silent no-op.
- Scripted vertical scenario with a deterministic mock opponent: play 6 plies →
  checkpoint → rewind → commitMove (implicit fork, `alt-1`) → play alternative →
  `compare` returns aligned pairs with correct absent-marking → export legal PGN
  containing both branches.
- Latency budgets measured and recorded honestly.

## Resolved decision and deferred question

- Storage binding: SQLite was ratified by the owner. The adapter boundary preserves
  PostgreSQL as a bounded follow-up for multi-host deployment or demonstrated
  contention. Ruling and measurements are in
  `planning/archive/branch-runtime/log.md`.
- `clockState` semantics (time-pressure dimension) — deferred to a future RFC
  (BACKLOG row exists).

## Acceptance review blockers (2026-08-12 — BR-C1..BR-C8) — RESOLVED

All eight ruled 2026-08-12 and folded into the Specification: C1 → implicit-fork
semantics; C2 → read-back replay + per-locus determinism + locus in policyConfig;
C3 → runtime-owned state machine, engine-free predicates, async evidence upgrades,
full transition graph; C4 → typed errors + single-writer lease; C5 → path-keyed
tree + transposeKey matching; C6 → invariant moved out, JobObserver hook in;
C7 → compare payload contract; C8 → living drill_run schema + event `seq`.
Original blocker texts: git history (commit 22fa697).

## Changelog

- 2026-08-12: created as first post-exploration draft.
- 2026-08-12: execution model resolved (hybrid, backend parity); stack constrained.
- 2026-08-12: acceptance review landed (BR-C1..BR-C8); held at draft.
- 2026-08-12: all blockers resolved; implementation doctrine added (TS core + Go
  workers, Svelte 5, Maia sidecar); **status → accepted**.
- 2026-08-12: §2 review amendment — transition graph generalized (any non-terminal
  → any other state; terminals absorbing). The drafted graph made `achieved`
  unreachable from `preserved` and blocked save-drill and mode-transformation
  paths; caught in review of the faithful implementation.
- 2026-08-12: implementation started with the shared monorepo scaffold; **status →
  implementing**.
- 2026-08-12: §5 server binding implemented; SQLite selected as the provisional
  default pending owner ratification, with PostgreSQL revisit triggers recorded.
- 2026-08-12: SQLite ratified; canonical behavior distilled to
  `docs/branch-runtime.md`; **status → implemented** and RFC/planning records
  archived.
