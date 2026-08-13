# Line Drill theory grading — log

Append-only.

## 2026-08-13 — Codex implementation review

- Revision 2 approved for implementation. Migration 4 is the only migration body
  coupled to the moving run-schema constant and must be pinned to literal v0.6
  before migration 5. The REST parser must require the new applied-policy field.
- Membership and authored-prose reachability remain deliberately different
  computations. Membership grades only explicitly listed or predicate-matched
  positions under the ply cap; reachability may use ancestor closure.
- D15 closes by stamping applied policy inside each concrete selector path. The
  `theory_strict` off-spine fallback returns through `human_common`, so it records
  `human_common` by construction. The request mode is never used as the stamp.
- The existing selection cache omits the client-provided spine. Server resolution
  by `packId` therefore includes `packId` in the cache key and gets a named test.

## 2026-08-13 — Codex implementation

- Run schema v0.7 and SQLite migration 5 landed. Migration 4 now stamps the
  literal v0.6 before migration 5 writes `policyModeApplied: unknown`; tests
  exercise v0.6→v0.7 and v0.5→v0.6→v0.7 without inference.
- The selector stamps applied mode inside each concrete policy branch. Off-spine
  `theory_strict` fallback records `human_common`; `/select-move` rejects client
  spines, resolves the registry pack by `packId`, and keys the cache by that id.
- Pack schema v0.4, position-keyed authored membership, transposition re-entry,
  boundary crossing, `deviationPlayed`, monotone theory grading, D7 legality
  lint, and path-scoped verdict delivery are implemented.
- Pack A is now v0.2 Line Drill content. Its line is withheld from the browser;
  the browser path reaches its ordinary and boundary checkpoints, degrades on
  the authored O-O deviation, and renders the class and note.
- The separate browser fixture proves a cap can cross while the move remains on
  the authored line, play continues, and a later unknown verdict renders the
  mandatory non-judgement sentence.
- Implementation correction: placing authored-prose reachability in runtime
  would make schema lint import runtime and create a package cycle. Its single
  implementation lives in `@chess-tabiya/schema/drill-pack`, consumed by both
  lint and the server; position membership remains in runtime. Semantics are
  unchanged.
- Focused suite: 56 green. Full `make verify`: 287 tests / 48 files, schema and
  packaging green. Repeated full browser-gate results follow after final runs.

## 2026-08-13 — Full-browser seam

- The first committed-tree browser gate found a delivery-composition defect,
  not a flake: Pack A's deviation note had first revealed at `break-arrived`, so
  it was absent when the later boundary occurrence rendered the matching
  classified verdict. The checkpoint sheet now reunites an already-revealed
  deviation whose move and class match that occurrence's verdict. It does not
  change server attribution, repeat an item, or disclose anything early.
- The Pack A browser regression exercises the fix by requiring the prior note,
  the verbatim `concept_violation` class, and the degraded objective together at
  `past-the-book`.

## 2026-08-13 — Final verification

- `ENGINES_REQUIRED=1 make verify`: 287 tests / 48 files green; schema and
  packaging verification green.
- Three consecutive complete `make test-browser` runs passed with Playwright
  retries still unset: 9 passed, 1 optional Maia test skipped on each run.
- Browser-observed branch-switch timings were 49.2 ms, 50.4 ms, and 43.0 ms.
  The middle run exceeded the <50 ms benchmark by 0.4 ms; the existing
  full-log projection performance debt remains the named lever. This is logged,
  not rationalized into a pass/fail guarantee.
- `make pack-check` passes for Pack A v0.2, the living Najdorf example, and the
  dedicated Line browser fixture.

## 2026-08-13 — Final-gate correction

- The first post-closeout engine-enforced verify exposed a Svelte type-narrowing
  gap in the new checkpoint composition. Browser build had accepted it, while
  `svelte-check` correctly did not. The filter now carries an explicit
  `AuthoredFeedbackItem` type predicate. Final results below supersede the
  pre-correction verification line above.
- Post-correction `ENGINES_REQUIRED=1 make verify` is green: 287 tests / 48
  files, zero Svelte diagnostics, schema and packaging green. A complete
  zero-retry browser suite also passed 9/9 with the optional Maia test skipped;
  the three pack-check invocations remain green.
- Two further complete zero-retry suites on the same final tree also passed
  9/9 (optional Maia skipped), making three consecutive final-tree passes.
  Their branch-switch observations were 50.1 ms and 53.3 ms; together with the
  first final-tree run's 30.3 ms, this confirms the known measurement variance
  and does not erase the recorded performance deviation.
