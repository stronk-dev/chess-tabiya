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
binding of this contract; the client-side runtime binds the same contract locally
(see Execution model).

### Execution model (owner ruling 2026-08-12)

**Hybrid with backend capability parity.** Every capability MUST have a backend
implementation (the homeserver has the compute; full-strength Maia lives there).
Browser-side implementations — rules, board, shallow Stockfish WASM, possibly a
small quantized Maia — are progressive enhancements the client negotiates per
capability; in-browser model downloads are opt-in, never required. The event log
syncs to the server regardless of where moves were computed.

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

- Storage binding (SQLite vs Postgres) and server language — server language
  constrained by owner ruling 2026-08-12: **no Python, no Rust; Go or Node/TS**,
  pending the stack-selection research dossier (`design/research/`); storage per
  deferred-decisions register at implementation start.
- Clock/time-pressure state is carried (`clockState`) but semantics are undesigned
  (BACKLOG: time-pressure dimension) — explicitly deferred to a future RFC.


## Acceptance review blockers (2026-08-12 — BR-C1..BR-C8)

**BR-C1 — Fork-on-rewind is only in the Summary; `commitMove` at a non-leaf cursor is undefined in the Specification.** [blocking]
The Summary says "rewind moves a cursor; the next move forks a named branch," but the normative API lists `commitMove` and `fork` as separate operations and never says what `commitMove` does when the cursor node already has a child on the active branch: implicit fork (with what auto-generated branch id, label, seed?), error demanding an explicit `fork` first, or something else. Event ordering is likewise unspecified (does `branch.forked` precede `move.committed`? does `fork` without a subsequent move create an empty branch?). This is the core mechanic of the product; codex will have to invent it.

**BR-C2 — Determinism invariant 7 cannot hold under the hybrid execution model as written.** [blocking]
Invariant 7 promises same (packDigest, policyConfig, seed, user moves) → same opponent moves, but the owner-ruled execution model lets the opponent move be computed by browser shallow Stockfish WASM, a "small quantized Maia," or backend full Maia, negotiated per capability per client — different implementations will not produce identical moves for the same seed. Either `policyConfig` must capture the execution locus and exact engine/model version (it is never defined in this RFC), or invariant 7 must be scoped to a single locus, or replay must treat logged `opponent.move_selected` events as authoritative rather than recomputing. The "replaying the event log reproduces the run exactly (given seeds)" requirement is ambiguous between recompute-and-verify and read-back, and the property test for invariant 7 is unwritable until this is resolved.

**BR-C3 — Objective state machine: no evaluator is assigned and engine-free evaluation is not specified.** [blocking]
"Evaluated per node against the pack's objective contract" never says who evaluates (session runtime core? a pack-rules module? the out-of-scope workers?) or what inputs it may use. Pack objective types (win/hold/save/resist, preserve_plan_window) plausibly need eval/tablebase evidence, yet engines are explicitly out of scope and the acceptance scenario is engine-free — so either the pack contract must supply engine-free predicates (not specified in `rfc/drill-pack-format.md` either) or the mock scenario cannot exercise `objective.state_changed` at all. The transition graph is also incomplete: only `active → X` is drawn; whether `degraded → preserved` is legal, which states are terminal, and what evidenceRefs are mandatory per transition are all unstated.

**BR-C4 — Error and concurrency semantics are absent: illegal moves, bad rewind targets, two clients on one run.** [blocking]
Invariant 8 covers legal moves only; the CET teardown (`design/research/teardown-cet.md`) explicitly recorded silent illegal-move rejection as a confusion-causing failure, yet the API contract defines no error surface for illegal UCI, `rewind` to a nonexistent nodeId/checkpoint, or `fork` on an unknown node. Worse, the execution model syncs the event log to the server "regardless of where moves were computed," which implies at least two writers (client runtime + server binding) with no ordering, conflict, or single-writer rule — an append-only source-of-truth log with unspecified multi-device merge is a data-corruption design gap, not a detail.

**BR-C5 — Transpositions: "tree" is asserted but never defended, and position-keyed concerns are left dangling.** [blocking]
Two branches can reach the identical FEN; path-keyed tree nodes are the defensible choice (PGN export, immutability, invariants 2/3 all depend on it) but the RFC never says "nodes are identified by path, not position, and transposed positions are distinct nodes." Without that sentence, an implementer may key nodes by FEN and silently build a DAG, and the genuinely open consequences stay unspecified: whether pack checkpoint triggers and the `authoredBoundary` node-set match by position or by path (critical for Line Drill transpositions back into book), and how comparison behaves when two branches transpose into each other.

**BR-C6 — Invariant 4 (rewind cancels stale analysis jobs) is untestable inside this RFC's scope.** [blocking]
Engines and workers are declared out of scope, the data model has no job concept, and the event vocabulary has no `analysis.*` events — yet the acceptance criteria demand property tests for invariants 1–8, making invariant 4 unimplementable as written. Either specify a minimal cancellation interface here (e.g., a job-handle registry the runtime signals on `run.rewound`, testable with fake jobs) or explicitly move the invariant to the engine-workers RFC and amend the acceptance criteria; currently codex must choose between inventing a job abstraction and shipping a failing gate.

**BR-C7 — `compare` has no output contract and alignment edge cases are unresolved.** [blocking]
Invariant 6 gives one rule (align by relative ply from the fork node) but `compare(run, branchA, branchB)` has no defined return shape, no behavior for branches of different lengths (does the shorter pad, truncate, or mark absent?), and no statement of whether comparison is defined when the two branches fork from *different* nodes. `design/02`'s difference strip (eval/WDL trajectories, structure changes) needs engines that are out of scope here, so what an engine-free runtime `compare` actually returns — and what "compare aligns correctly" means in the acceptance scenario — is unverifiable as specified.

**BR-C8 — Field-level drift from the archive baseline with no normative schema in this RFC.** [advisory]
The node/branch/run shapes are prose, diverging from `archive/brief-v2/schemas/drill_run.schema.json` without noting it: `activeNodeId`→`activeCursor`, `packVersion`→`packDigest`, added `policyConfig`/`actor`/`checkpointRefs`/`evidenceRefs`/`createdAt`/`clockState`, and the archive's event object is `additionalProperties: false` with only `type/at/nodeId/data` — no sequence number, so `events(run, since?)` has no well-defined cursor (timestamps collide). The pack RFC promises a living schema copy under `schemas/`; this RFC should do the same or declare the prose canonical.

**Reviewer verdict:** hold at `draft` until BR-C1..BR-C6 are resolved in the Specification; BR-C7 via a minimal engine-free comparison payload; BR-C8 via a living drill_run schema. Owner rulings pending.

## Changelog

- 2026-08-12: created as first post-exploration draft.
- 2026-08-12: execution model resolved by owner ruling (hybrid, backend capability parity); stack constrained (no Python/Rust).
- 2026-08-12: acceptance review landed (BR-C1..BR-C8); held at draft pending owner rulings.
