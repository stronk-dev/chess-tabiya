# Authoring frictions implementation

Status: implementing

## Sequence

- [x] Open the lifecycle and map all nine normative sections to current consumers.
- [x] Implement pack schema 0.16 and matching schema/types/lint/validation changes.
- [x] Implement root deviations, root checkpoints, variants, length targets, and guard tuning.
- [x] Implement the tablebase walker and collision-safe sourcing identities.
- [x] Implement cursed/blessed admission, bare-draw evidence, and terminal draw outcomes.
- [x] Add exercising tests for all 18 refusal codes and every acceptance criterion.
- [x] Update canonical docs and flip shipped ledger rows by title.
- [x] Run `ENGINES_REQUIRED=1 make verify` and zero-retry `make test-browser`.
- [x] Archive the RFC and planning directory after independent-ready verification.

## Constraints

- No content re-authoring or invented chess judgment.
- No migration and no run-schema change.
- Keep §9 precedence: existing chess termination before fifty-move/repetition fallback.
- Add bare `draw` to `RULES_EVIDENCE_FACTS`; widening only the pack enum would recreate D32.
