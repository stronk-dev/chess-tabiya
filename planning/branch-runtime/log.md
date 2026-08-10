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
