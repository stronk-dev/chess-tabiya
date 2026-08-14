# Predicate Wave 2 implementation log

Append-only.

## 2026-08-14 — Codex implementation review

Approved. The pack/shape schema baselines and duplicated runtime/schema unions match the RFC. The two named duck-typed walkers still fail open for future node kinds and are correctly in scope. `king_opposition` is exactly derivable from king squares plus side to move under the closed direct/distant definition, including the stated mirror behavior. No migration is required.

## 2026-08-14 — Codex implementation

Implemented the fifteen-kind vocabulary and seven-node expression grammar across both schemas, both TypeScript copies, the evaluator, evidence references, learner sentences, and exhaustive validation walks. Updated the five named official entries and exercised their intended differences: bishop-family triggers no longer co-fire, Black's fianchetto covers both wings without claiming the White colour mirror, three authored fans collapse to bounded quantifiers, and the opposition plan has a tempo-qualified signature.

The exercising refusal tests found one integration defect not visible in the RFC review: `validateShapeEntry` collected the correct runtime issue and then evaluated the invalid trigger anyway, throwing for reversed quantified ranges and mirrored catalogue names. Validation now skips evaluation after a structural refusal and returns the named issue. The RFC also contained one internally contradictory opposition sentence (`X` to move versus its own Black-to-move example); corrected to the opponent of `X` to move.

The first browser run exposed a stale content selector after the six-pack opening wave added two more Najdorf titles. It now selects the exact schema-example title rather than the substring “Najdorf”; this is a test-maintenance correction, not a retry. Repository verification passed at 416 tests / 70 files. Browser verification then passed 16 tests with the optional Maia test skipped, zero retries. The widened structural sample measured 3.393 ms median / 5.336 ms maximum over 200 samples.
