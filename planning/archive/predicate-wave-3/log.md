# Log

## 2026-08-15 — codex

- Re-reviewed the accepted owner rulings against the current tree.
- Corrected unchanged run/storage baselines to 0.14/19, the superseded `king_distance` register text, and the duplicate Active row.
- Began implementation with pack schema 0.18 and shape-entry schema 0.3.

## 2026-08-15 — codex implementation

- Added `piece_count`, `king_zone`, and static `piece_distance` to both duplicated schema grammars, the runtime evaluator, mirror rules, reading projection, evidence facts, and fixed sentence tables.
- Added the shared present/prospective shape-reference normalizer and fail-closed validation for duplicate, absent-present, and unsatisfiable plan-consequence references.
- Compiled `plan_consequence` through `planClass.shapePlan` to the shape plan's structural signature; the applied objective record starts with `planClass#<id>`, and revealed plan classes publish closed gradability states.
- Replaced the authored existence hacks and pawn-count uses mechanically. The concurrent signature-authoring pass changed the measured plan coverage to 96 non-null / 21 null of 117; implementation consumes that content but does not turn it into a format guarantee.
- The new satisfiability check caught Pack B stopping before the consequence its own annotation already named. Extended only that verbatim-authored `...h6, bxc6, bxc6` continuation; no new strategic claim was introduced.
- Verification after implementation: `ENGINES_REQUIRED=1 make verify` green at 541 tests / 87 files. Browser initially caught stale Carlsbad label assertions after the concurrent signature pass; the assertion now follows the authored labels and is rerun at closeout.
