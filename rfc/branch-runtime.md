# RFC: Immutable Branch & Rewind Runtime

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` (episode loop), `design/02-product-shape.md` (UX commitments, latency budgets)
- **Exploration gate:** owner override, logged `planning/exploration/log.md` 2026-08-12
- **Depends on:** `rfc/drill-pack-format.md` (packs define what runs execute)
- **Parent / amends:** mines `archive/brief-v2/rfcs/RFC-0002-branch-runtime.md` sketch, `archive/brief-v2/schemas/drill_run.schema.json`, `archive/brief-v2/12_SYSTEM_ARCHITECTURE.md` event model
- **Supersedes / superseded by:** —
- **Planning:** `planning/branch-runtime/` (once implementing)

## Summary

The core mechanic as a data structure: every move is an immutable node in a tree
rooted at the drill start; rewind moves a cursor; the next move forks a named branch;
nothing is ever destroyed. This is the system whose absence in every competitor was
verified during exploration (E1) — it IS the product.

## Motivation

Everything else (modes, feedback, comparison, session→pack distillation, streamer
overlay) sits on this. It must exist before any UI. Out of scope here: engine/Maia
workers (own RFC), feedback composition (own RFC), any UI.

## Specification

### Node model (per archive drill_run.schema.json, promoted)

Node: `id, parentId, fen, moveUci, moveSan, ply, actor (user|opponent|system),
branchId, checkpointRefs[], objectiveState, evidenceRefs[], createdAt, clockState?`.
Branch: `id, forkNodeId, label, intent?, seed`. Run: `id, packId, packDigest,
policyConfig, nodes[], branches[], events[], activeCursor`.

### Objective state machine

`active → preserved | degraded | failed | achieved | transitioned` — evaluated per
node against the pack's objective contract; transitions emit events (the CET lesson:
detect the flip AND carry the why via evidenceRefs; never a bare banner).

### Event-sourced log

Append-only run events (from `arch/12`): `run.started, move.committed,
opponent.move_selected, checkpoint.reached, objective.state_changed, branch.forked,
run.rewound, segment.completed, feedback.generated, outcome.reached,
transfer.scheduled`. The event log is the source of truth; node/branch tables are a
projection. **Session-replay requirement:** replaying the event log reproduces the
run exactly (given seeds) — this is what makes session→pack distillation and the
future streamer overlay possible.

### Invariants (property-tested)

1. Old nodes never mutate; rewind only moves the cursor.
2. A branch is a named path through nodes, not a copied game.
3. Full history recoverable from any node.
4. Rewind cancels stale analysis jobs (no zombie evaluations landing on dead
   branches).
5. Export of any branch set is legal PGN with variations.
6. Comparison aligns nodes by relative ply from the fork node.
7. Opponent determinism: same (packDigest, policyConfig, seed, user moves) → same
   opponent moves. `seedMode: per_branch` gives each branch its own stream.
8. Deviation never blocks: any legal move is accepted; classification (per pack) and
   objective state respond, the runtime never refuses.

### API surface (transport-agnostic contract)

`createRun(pack) · commitMove(run, uci) · rewind(run, nodeId|checkpoint) ·
fork(run, nodeId, label?, intent?) · graph(run) · compare(run, branchA, branchB) ·
exportPgn(run, branches?) · events(run, since?)`. The archive's REST sketch
(`POST /runs`, `/moves`, `/rewind`, `/fork`, `GET /graph`, `POST /compare`) is one
binding of this contract; see Open questions on client-side execution.

### Latency budgets (acceptance targets, from design/02)

Rewind <100 ms · branch switch <50 ms · board-ready from pack <250 ms warm ·
cached opponent move perceived-instant. (E1 finding: CET is already fast — these are
table stakes, not differentiators.)

## Deviations from design

None.

## Acceptance criteria

- Property tests for invariants 1–8 (fast-check style generative tests).
- Replay determinism test: event log → identical reconstruction, twice.
- A scripted vertical scenario with a **deterministic mock opponent** (no engines):
  play 6 plies → checkpoint → rewind → fork → play alternative → compare aligns
  correctly → export legal PGN containing both branches.
- Latency budget measurements recorded (even if not yet met, measured honestly).

## Open questions

- **Where the runtime executes:** browser-first (WASM engines, aligns with the
  owner's hosting posture; server only persists event logs) vs server-authoritative
  (simpler for streamer mode later). Leaning browser-first with event-log sync;
  decide before implementing.
- Storage binding (SQLite vs Postgres) and server language — deferred decisions
  register in `rfc/README.md`; resolve at implementation start, not in this spec.
- Clock/time-pressure state is carried (`clockState`) but semantics are undesigned
  (BACKLOG: time-pressure dimension) — explicitly deferred to a future RFC.

## Changelog

- 2026-08-12: created as first post-exploration draft.
