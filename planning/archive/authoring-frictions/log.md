# Authoring frictions implementation log

Append-only.

## 2026-08-15 — implementation opened (codex)

- Re-read the full RFC, including the post-review §8 correction.
- Opened the lifecycle at pack schema 0.16 with no migration and no run-schema change.
- Preserved the load-bearing correction: `rules_fact: draw` must widen both the pack schema and `RULES_EVIDENCE_FACTS`, with a compile/play regression.

## 2026-08-15 — implementation complete (codex)

- Shipped all nine normative sections at pack schema 0.16, with no run-schema change and no storage migration.
- Added the read-only TypeScript tablebase walker, explicit offline abstentions, a hard query budget, and immutable online caching. The Philidor acceptance walk reports `h6h8` as a learner loss and exactly eleven missing root successors.
- Added root-addressable deviations/checkpoints, machine-proved sibling variants, per-leg length targets, guard windows/overrides/tier controls, collision-safe candidate identities, objective-specific cursed/blessed admission, and automatic fifty-move/threefold outcomes.
- The full gate exposed two stale test assumptions rather than product defects: repeated knight cycling now correctly terminates as threefold, and the browser comparison may receive one or two recorded eval points per branch depending on queue completion. Both fixtures now assert their real invariant.
- Verification: `ENGINES_REQUIRED=1 make verify` passed with 499 tests across 81 files; Svelte reported 0 errors and 0 warnings; `make test-browser` passed 24 tests at zero retries with the optional Maia latency test skipped.
