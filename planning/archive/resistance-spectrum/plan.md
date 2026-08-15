# Resistance spectrum implementation

Status: implementing

## Sequence

- [x] Re-review the cross-reviewed RFC against the current run and storage baselines.
- [x] Add the pure concession-mass primitive and practical-resistance selector.
- [x] Publish and persist applied policy/band facts; close the D36 wire narrowing.
- [x] Advance run schema 0.14 with stamp migration 19.
- [x] Exercise selector, refusal, replay, capability, migration, and browser paths.
- [x] Reconcile canonical docs and ledger rows, archive the lifecycle, run both gates, and commit.

## Constraints

- No pack-schema change.
- A practical-resistance selection never falls back to another mode.
- Zero concession mass is a named refusal; missing policy mass is an honest abstention with deterministic tie-breaking.
- `eloApplied` is recorded but is not added to group-journal identity matching.
- Strong-engine reproducibility remains D35 and is not folded into this lifecycle.
