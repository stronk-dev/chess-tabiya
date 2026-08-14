# Grounding pair log

## 2026-08-14 — codex implementation review

- Approved after verifying current baselines, the six target drafts, the declared/executable partition, and the existing assessment admission path.
- Official lila-tablebase response semantics require inverting each move's resulting-position category into the current mover's perspective before category-preserving selection. Recorded as an implementation pin.

## 2026-08-14 — implementation

- Added the interactive tablebase provider, capability publication, deterministic legal category-preserving DTZ selection, named refusal mappings, run schema v0.13, and stamp-only migration 18.
- Added `make verify-draft`, per-FEN offline fixtures, flat sidecar emission, exact root contradiction refusal, spine-regression enforcement, and registry-admission closure.
- A first live run exposed an implementation mistake: the spine regression rule had been applied to deviations. No sidecars were written; the enumerator was corrected to gate spine transitions only, after which all six authored endgame drafts verified.
- A second offline run exposed a schema boundary: `assessedBy.sourceId` is fixed to `syzygy`, so fixture-specific source IDs made the pack invalid. Offline fixtures now retain the required source ID and use deterministic per-FEN retrieval timestamps to preserve manifest identity without collisions.
- Six drafts now carry flat evidence/source/job siblings and load as `ledger_verified`; the pack files changed semantically only in the two permitted retrieval-provenance fields.
- Focused authoring, selector, provider, capability, schema, and migration tests pass. The first full gate passed at 470 tests across 79 files before the final admission/provider tests were added.
- Did not add local `.rtbw`/`.rtbz` probing, pack promotion, prose grounding, or automatic policy substitution: each is outside this RFC and would weaken its trust boundary.

## 2026-08-14 — completion

- Distilled the joint authoring/runtime trust contract into `docs/tablebase-grounding.md` and reconciled `docs/content-sourcing.md`, `docs/engine-workers.md`, and `docs/outcome-drill-grading.md`. A dedicated page reads better than folding the command and selector across three systems because their shared no-substitution boundary is the point of the RFC.
- `ENGINES_REQUIRED=1 make verify` passed: 470 tests across 79 files, schema/scaffold/packaging clean, Svelte 0 errors and 0 warnings.
- `make test-browser` passed at zero retries: 24 passed, one optional Maia test skipped.
- Lifecycle archived only after both gates passed.

## 2026-08-14 — post-archive gate refresh

- Final `ENGINES_REQUIRED=1 make verify`: 474 tests across 80 files; schema/scaffold/packaging clean; Svelte 0 errors and 0 warnings.
- Final `make test-browser`: 24 passed at zero retries; one optional Maia test skipped.
