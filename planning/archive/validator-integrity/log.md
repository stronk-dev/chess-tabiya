# Validator integrity implementation log

Append-only.

## 2026-08-15 — implementation opened (codex)

- Pulled queue item 2 immediately after `authoring-frictions` archived.
- Re-read the cross-reviewed RFC against the post-0.16 tree and located sites by symbol rather than stale coordinates.
- Confirmed the three mandated content repairs are still absent: both theory trajectories lack boundaries, and the B+N trajectory lacks top-level root grading.

## 2026-08-15 — implementation complete (codex)

- Added `PackCompileError` and made validation compile every root and leg objective through the shipped rule compiler. Featureless structural conditions now fail at their JSON pointer; unexpected failures become `OBJECTIVE_RULES_UNCOMPILABLE` rather than stack traces.
- Extracted `objectiveIssues` with objective-local grading, transition, condition, and grounding checks. Outcome/theory identity is derived from the examined objective; Syzygy root checks deliberately stay dead for trajectory legs.
- Admitted optional terminal root grounding for `run_trajectory`, keyed Syzygy admission to the final outcome leg, and kept dynamically reached leg assessments authored.
- Added the D39/D40 refusals for fractional material equality and winners on non-checkmate facts.
- Repaired the two theory trajectories with finite first-leg authored boundaries and one crossing checkpoint each. Ran the shipped live `make verify-draft` path for `trajectory-mate-bishop-knight`; it now owns its evidence ledger, source manifest, and job receipt and loads as `ledger_verified`.
- Folded the canonical description into `docs/drill-pack-format.md`, `docs/trajectory-drill.md`, and `docs/outcome-drill-grading.md`. Folding is clearer than a new validator page because the behavior is the admission contract of those three existing systems, not a new product surface.
- Exercising coverage pins root/leg compiler failures, per-leg parity, all objective types entering compilation, the plain-error backstop, trajectory grounding refusals, D39/D40, theory-boundary behavior, and registry grounding.
- Pre-closeout `ENGINES_REQUIRED=1 make verify` passed: 508 tests across 82 files, Svelte 0/0, schema/scaffold/packaging clean. All draft and candidate pack documents passed the rebuilt checker; negative fixture behavior remains covered by the unit gate.

## 2026-08-15 — completion protocol (codex)

- Set the RFC to implemented, folded canonical behavior into the three owning docs, moved the RFC and planning job to their archives, updated the RFC index, and closed ledger rows D32, D33, D37, D38, D39, and D40 in the implementation commit.
- Post-move gates are green: `ENGINES_REQUIRED=1 make verify` passed 508 tests across 82 files with Svelte 0/0 and clean scaffold/packaging checks; `make test-browser` passed 24 tests at zero retries with the optional Maia latency test skipped.
