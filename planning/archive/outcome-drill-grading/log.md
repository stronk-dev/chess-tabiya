# Outcome Drill grading — log

Append-only.

## 2026-08-12 — Codex implementation start

- Revision 3 passed implementation review. The prior sibling-resistance leak,
  requested-versus-applied policy claim, browser start-order mismatch, and sidecar
  trust/discovery blockers are closed in the accepted mechanism.
- The sourcing-validator extraction is isolated first because it gates every sourcing
  pipeline. Existing issue output will be captured before and compared after extraction.
- One non-blocking RFC wording correction: `assessmentGrounding` needs a type-only import
  of `DrillPackDefinition`; the new module cannot literally import only `./types.js`.

## 2026-08-12 — Core grading and sourcing seam

- Pack schema v0.3 closes `objective`, adds grading and typed conditions, and keeps the
  run schema unchanged. Pack C v0.2 replaces its root-true trigger with an authored
  ply-8 resolution and records material degradation without an absorbing success state.
- Objective compilation is monotone for outcome drills, result predicates are path-scoped,
  coincident checkpoints no longer create zero-length segments, and resistance identity
  follows the paired committed child rather than the ambiguous parent selection node.
- Sourcing validators were extracted with the existing sourcing suite green. Pack discovery
  and sidecar resolution share one reserved-name constant; exact Syzygy grounding requires
  a fully valid, manifest-linked ledger. The positive path uses real emitter output.
- `make verify`: 271 tests across 45 files, typechecks and packaging green.

## 2026-08-12 — Outcome presentation and browser acceptance

- The client renders root assessment, requested resistance, recorded per-path engine
  identity, non-terminal resolution, and terminal result/grade as distinct facts. It never
  infers the applied policy from an engine identity and labels unverified roots as claims.
- Added deterministic hold and resist browser fixtures. The hold reaches `preserved` and
  remains playable; the resist fixture reaches its checkpoint and later renders the terminal
  loss separately from `Objective: resist — achieved`. Pack C renders its authored 11-piece
  caveat and the actual mock opponent rather than claiming Maia.
- Playwright exposed a real cached-bounds bug: adding the grade banner shifted Chessground
  without resizing it, so moves after Continue mapped against the old board position. The
  board now redraws after reactive layout settles; all eight default browser tests pass.
- `ENGINES_REQUIRED=1 make verify`: 276 tests across 46 files, typechecks and packaging green.

## 2026-08-12 — Canonical documentation

- Added `docs/outcome-drill-grading.md` as a separate canonical page because the
  trust and grading contract crosses the pack schema, runtime, sourcing sidecars,
  registry, and browser; folding it into one parent page would hide those seams.
- Reconciled the v0.3 format, outcome predicates/compiler, exact-assessment
  admission, pack projection, and learner-facing result across the existing
  canonical pages and index.
- Lifecycle archival remains deliberately pending independent implementation
  approval; the RFC stays `implementing` for that review.
- Final documented-tree gates: `ENGINES_REQUIRED=1 make verify` passed 276 tests
  across 46 files with schema/packaging checks green; `make test-browser` passed
  all eight default flows with the tagged Maia latency case skipped as designed.

## 2026-08-12 — D14 browser-gate diagnosis

- Reproduced the reported flake without retries. The Najdorf flow and viewport
  projection both observed a null bounding box for Chessground's private
  `<cg-board>` during transient relayout; failure screenshots already showed the
  stable, labeled board wrapper visibly rendered. The viewport test also used a
  zero-count loading assertion that could complete before asynchronous run load
  began.
- Browser interaction and viewport assertions now synchronize on the component's
  public `aria-label="Chessboard"` boundary and require it to be visible before
  reading geometry. No retries, sleeps, or timeout increases were introduced.
- Five consecutive complete `make test-browser` runs passed: 40 default flows in
  total, with the tagged Maia latency case skipped each time as designed.

## 2026-08-12 — Completion

- Independent implementation review approved the RFC and verified Pack C's
  repaired ply-8 resolution. D14 was diagnosed and stabilized before relying on
  the browser gate for closeout.
- Completion reconciliation corrected two stale canonical statements: Outcome
  Drill result grounding now ships, and development docs now name the registry's
  reserved sourcing-sidecar rule.
- Status set to implemented; RFC and planning history archived together with the
  index update.
- Post-move gates on the exact archival tree: `ENGINES_REQUIRED=1 make verify`
  passed 276 tests across 46 files with schema/packaging green;
  `make test-browser` passed all eight default flows with only the tagged Maia
  latency case skipped as designed.
