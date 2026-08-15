# Validator integrity implementation

Status: implementing

## Sequence

- [x] Add coded objective-compilation failures and total validation compilation.
- [x] Extract objective-local checks with top-level/trajectory-leg parity.
- [x] Admit root grounding for trajectories without weakening leg grounding.
- [x] Refuse unsatisfiable material equality and meaningless rules winners.
- [x] Repair the two theory trajectories and ground the B+N trajectory root.
- [x] Add exercising acceptance coverage and update canonical docs/ledger.
- [x] Run both gates, archive the lifecycle, and commit.

## Constraints

- No schema, run-schema, or migration version moves.
- Locate all implementation sites by symbol, not stale RFC line number.
- `objectiveIssues` must not read `pack.objective`.
- Leg Syzygy assessments remain refused because their entry positions are dynamic.
