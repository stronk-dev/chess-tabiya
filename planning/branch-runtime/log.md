# branch-runtime — log (append-only)

## 2026-08-12 (claude, setup)

- RFC accepted after adversarial review (BR-C1..C8 all resolved; rulings in
  `planning/exploration/log.md` and RFC changelog).
- Plan created. Doctrine: TS core + Go workers; Svelte 5; Maia = containerized
  UCI sidecar (not needed for this RFC — mock opponent only).
- Next: codex session 1 → scaffold (§0) + core tree (§1).

## 2026-08-12 (codex, session 1) — §0 scaffold

- Added the pnpm workspace: shared runtime/schema packages, Node server binding, Svelte 5
  web smoke app, future workers/content/schema directories, strict shared TypeScript config,
  and neutral module boundaries under the settled `@chess-tabiya/*` scope.
- Added the root `make verify` gate (typecheck + Vitest + scaffold/schema check), separate
  production build target, repository-local pnpm store/cache/state, pinned dependencies,
  AGPL-3.0 license, and a single GitHub Actions workflow.
- Tests exercise the shared runtime import in Node/browser consumers, the pinned chessops
  rules package, fast-check, manifests/layout, license, cache policy, Make target, lockfile,
  and CI commands.
- Concurrency note: the scaffold files were swept into Claude's simultaneous naming commit
  `da84056`; this follow-up carries the strengthened scaffold verifier and the §0 completion
  record rather than rewriting shared history.
- Next: §1 living `drill_run` v0.2 schema and path-keyed core tree/events.

## 2026-08-12 (claude, review of §0)

- Independently verified: `make verify` green (0 TS errors, 3 tests, scaffold
  check OK), clean worktree, structure matches plan §0, `@chess-tabiya/*` scope,
  AGPL-3.0 text correct, CI = single pinned workflow, archive diff 0 lines,
  docs/ tier created per RFC-0000. **§0 APPROVED.**
- Non-blocking notes for §1: (1) `runSchemaVersion` is hardcoded in the runtime
  build info — should be owned by/derived from `packages/schema` once the living
  schema lands; (2) the fast-check test is wiring-proof only — §1 must replace it
  with real invariant properties (plan already requires this); (3) `make build`
  is outside `verify`/CI — acceptable now, revisit when the web app is real.
- §1 green-lit: living `drill_run` v0.2 schema + path-keyed core tree/events.

## 2026-08-12 (codex, session 2) — §1 core tree + events

- Landed the living Draft 2020-12 `schemas/drill_run.schema.json` v0.2. Ajv tests validate
  the complete path-keyed shape and reject events without `seq` and nodes without parent
  path identity. `packages/schema` now owns the run version; runtime build info derives it,
  resolving Claude review note 1.
- Added immutable Node/Branch/Run types and an event reducer whose log is source-of-truth.
  Event append assigns contiguous monotonic sequence numbers; replay reconstructs nodes,
  branches, checkpoint refs, objective projections, and the active cursor. Checkpoint pairs
  derive segments and emit `segment.completed`.
- Implemented legal `commitMove`, cursor-only rewind, explicit empty branches, and BR-C1:
  committing at a non-leaf cursor emits `branch.forked` then `move.committed` on `alt-N`;
  the first move on an explicit branch does not fork again. Nodes are path-distinct while
  normalized four-field FEN `transposeKey` values recognize transpositions.
- Added the full §1 typed error surface. Lease ownership remains a server concern in §5,
  but the shared `NOT_ACTIVE_WRITER` assertion and error contract now exist.
- Replaced the scaffold string-roundtrip property with two real fast-check properties over
  randomized legal games and rewind/fork histories. They exercise immutable old nodes,
  recoverable parent histories, branch metadata rather than copied games, event sequence,
  replay equality, and fork-before-commit ordering, resolving Claude review note 2.
- Verification: `make verify` green (4 files, 15 tests); `make build` green. Review note 3
  remains intentionally deferred: build is still outside CI until the web app is real.
- Stopped at the §1 boundary. Next planned work is §2 objective state machine; not started.

## 2026-08-12 (claude, review of §1)

- Independently verified: `make verify` green (15 tests / 4 files), clean
  worktree, archive intact. Schema requires transposeKey/seq/locus as specified;
  projection enforces seq contiguity and replay round-trip; property tests
  assert the BR-C1 event order [branch.forked, move.committed] after
  rewind-then-commit with old-node immutability, plus history/ply recoverability
  under random legal play. §0 notes 1–2 confirmed resolved. **§1 APPROVED.**
- Non-blocking for §2: (1) seedMode "fixed" currently behaves like per_branch in
  branch-seed derivation — fix + test; (2) commitMove copies the parent's
  evidenceRefs onto the new node — new nodes should start with empty evidence;
  (3) O(n²) full replay per append — acceptable, revisit at §5 latency
  measurements; (4) dead startEvent construction in createRun — cosmetic.
- §2 green-lit: objective state machine (engine-free predicates, transition
  graph, evidence-carrying state changes). Address notes 1–2 first.

## 2026-08-12 (codex, session 3) — §1 corrections + §2 objective machine

- Fixed both requested §1 review notes in commit `c92abe5`: `fixed` and `per_run`
  branch seed modes now reuse the primary seed while only `per_branch` derives a new
  seed; newly committed nodes begin with empty `evidenceRefs`. Runtime and living-schema
  regression tests cover both contracts.
- Added the exact BR-C3 transition graph and exhaustive edge tests: active can enter any
  named result; preserved can only degrade; degraded can recover to preserved or fail;
  achieved/failed/transitioned have no outgoing edges and reject further play.
- Added deterministic predicate evaluation for checkmate, stalemate, runtime-provable draw
  (insufficient material, 50-move claim, or threefold on the recorded active path),
  material balance (pawn units), FEN transpose-key/piece/pawn-structure matching, boolean
  composition, and checkpoint reach along the active node path. Authored rules are ordered;
  the first matching rule for the current state wins.
- `objective.state_changed` requires non-empty `evidenceRefs` in both the live transition
  API and event-log replay. State and evidence project onto the evaluated node; mismatched,
  illegal, self-loop, terminal, and evidence-free changes are rejected rather than ignored.
- Added a data-only async `ObjectiveEvidenceUpgrader` request/proposal interface and fake
  test. It deliberately does not apply worker proposals; worker execution remains a later
  RFC as required by the §2 plan boundary.
- Verification before commit: `make verify` green (5 files, 30 tests); `make build` green.
  §1 review note 3 (O(n²) replay) remains deferred to §5 measurements; note 4 is cosmetic.
- Stopped at the §2 boundary. Next planned work is §3 replay/compare/export; not started.

## 2026-08-12 (claude, review of §1-fixes + §2)

- Independently verified: `make verify` green (30 tests / 5 files), clean
  worktree, archive intact. Seed fix correct (fixed/per_run reuse primary;
  per_branch derives); nodes start with empty evidenceRefs; transition graph
  enforced exactly as the RFC specified, terminals absorbing, evidence required
  (empty/blank refs throw); predicate vocabulary exceeds spec (path-aware
  checkpoints, transposeKey threefold, 50-move, pawnStructure, all/any/not).
  **§2 APPROVED as implemented.**
- **Spec bug found in the RFC (mine, not codex's):** the drafted graph made
  `achieved` unreachable once `preserved`, and blocked degraded→achieved (save
  drills) and →transitioned (mode transformation). RFC amended in place:
  any non-terminal → any other state; terminals absorbing. Codex must update
  ALLOWED_TRANSITIONS + tests as §3 step 1.
- Forward note (pack-format, future v0.3): the ObjectiveTransitionRule /
  predicate vocabulary lives in the runtime; the pack schema's free-form
  `objective.successConditions` should eventually adopt it. Also: rule order =
  priority in evaluateObjective (first match wins) — document in pack authoring.
- §3 green-lit: read-back replay, compare contract, PGN export, JobObserver.

## 2026-08-12 (codex, session 4) — transition amendment + §3 replay/compare/export

- Applied the review amendment in `f5b5a1c`: every non-terminal objective state now reaches
  any different state while achieved/failed/transitioned remain absorbing. Exhaustive pair
  tests plus explicit preserved→achieved and degraded→achieved regressions cover the two
  cases that exposed the original RFC bug; evidence and no-self-transition rules remain.
- Added authoritative read-back replay in `9ae77ca`. Opponent commits now record
  `opponent.move_selected` immediately before `move.committed`; replay reads those logged
  choices without a policy callback and rejects missing or disagreeing pairs rather than
  recomputing them.
- Added the BR-C7 comparison payload in `186c5b6`: branches resolve to immutable root-to-head
  paths, align after their last common fork, omit an absent side when lengths differ, and
  return fork-relative objective timelines and checkpoint hits. Unknown/unrelated branch
  data fails explicitly.
- Added chessops PGN variation export in `fbe0858`. Selected paths are legality-checked move
  by move, including stored SAN and resulting FEN, before serialization. Tests parse the PGN
  back through chessops and legally walk every mainline/variation; corrupted paths fail.
- Added `JobObserver.onRewound` in `26b9d92`. A successful rewind reports a frozen list of
  nodes leaving the active path without deleting immutable history; validation failures do
  not notify. Actual job cancellation remains with the future worker implementation.
- Verification: `make verify` green (8 files, 42 tests); `make build` green. §3's four
  checkboxes were each flipped in the commit carrying their exercising tests.
- Stopped at the §3 boundary. Next planned work is §4 property/scenario hardening; not
  started.

## 2026-08-12 (claude, review of §3)

- Independently verified: `make verify` green (42 tests / 8 files), clean
  worktree, archive intact. Compare contract matches RFC (common fork, aligned
  pairs + absent marking, timelines/checkpoint hits with seq refs). Read-back
  replay structurally enforces authoritative selections (orphan opponent
  commits and disagreeing selections both throw). Amended graph in with tests.
  **§3 APPROVED.**
- Non-blocking notes: (1) replay requires strict adjacency
  opponent.move_selected → move.committed — a constraint on emitters; must be
  documented in the future engine-workers RFC; (2) literal reading of the
  amended graph permits preserved→active — harmless, but pack authors should
  treat re-activation as unusual; note for authoring docs.
- §4 green-lit: scripted mock-opponent vertical scenario + latency measurements
  (the remaining §4 items — core invariant properties already exist).

## 2026-08-12 (codex, session 5) — §4 vertical proof + latency

- Added the deterministic no-engine acceptance scenario in `6f460a8`: six mainline plies
  with every mock reply logged as adjacent `opponent.move_selected` → `move.committed`, a
  checkpoint, rewind to ply 2, user alternative with implicit `alt-1`, and a shorter
  alternative play-out. One test then verifies aligned comparison with absent `b` at the
  final offset, main-only checkpoint hit, legal two-branch chessops PGN, and two identical
  successful full-log read-backs.
- Expanded fast-check coverage so §4 now directly exercises invariants 1–3 and 5–8:
  immutable/recoverable path trees, legal PGN export, fork-relative comparison alignment,
  same-locus/seed/play opponent determinism, and acceptance of generated legal moves. The
  integrated error test reconfirms malformed-UCI, wrong-side, and illegal-move failures are
  typed rather than silent.
- Added repeatable latency instrumentation using exact 200- and 1000-event logs. Each
  operation received 3 warm-ups followed by 20 samples in the local Vitest process; run
  construction was excluded. Values are milliseconds (`median / p95 / max`):

  | events | full-log projection | rewind (budget <100) | implicit fork+commit (budget <50) |
  |---:|---:|---:|---:|
  | 200 | 0.092 / 0.121 / 0.189 | 0.486 / 0.591 / 0.606 | 0.209 / 0.255 / 0.263 |
  | 1000 | 2.057 / 2.247 / 2.313 | 10.883 / 11.487 / 12.385 | 1.999 / 2.410 / 2.451 |

- Both measured interaction operations were within budget at both sizes. These are local
  foundation measurements, not browser/network claims; §5 must remeasure through storage
  and transport rather than extrapolate them.
- Verification target after integration: `make verify` (10 files, 46 tests) and
  `make build`. All four §4 checkboxes are backed by the commit carrying their exercising
  test.
- Stopped at the §4 boundary. Next is §5 server binding; its report will include the
  SQLite-vs-Postgres storage proposal for owner ruling. §5 was not started.

## 2026-08-12 (claude, review of §4)

- Independently verified: `make verify` green (46 tests / 10 files), clean
  worktree. Vertical scenario is a real end-to-end assertion chain (20 expects:
  adjacency-correct mock opponent, checkpoint, rewind, implicit alt-1, aligned
  compare with absent-side, two-branch legal PGN, double read-back). Latency
  methodology honest and recorded. **§4 APPROVED.**
- Perf note with numbers: rewind scales ~quadratically (0.486ms@200ev →
  10.883ms@1000ev, ~22x for 5x) per the O(n²) full-log projection flagged at
  §1. Budget breach extrapolates to ~3000 events — beyond typical drill
  sessions, reachable in marathons. §5 item: either incremental projection /
  snapshot memoization, or a measured decision to defer with the session-size
  assumption documented.
- §5 green-lit: REST + events(sinceSeq) bindings, single-writer lease, storage
  proposal (SQLite vs Postgres) for owner ratification.
