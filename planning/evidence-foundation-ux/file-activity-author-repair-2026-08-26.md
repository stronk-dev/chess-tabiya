# D1732/D1733 exact file state and access — author handoff

**Inputs:** `design/research/open-file-state-and-access.md` and
`tools/d1732-file-activity-harness/`.

## Required contract

1. Derive exact per-file pawn state from the D1728/pawn-connectivity authority; no second pawn scan
   or incompatible file ontology.
2. Preserve current open/half-open author predicate truth and legacy narrow state semantics.
3. Register exact before/after file-state change with pawn/capture identity when present.
4. Add `file_access_revealed` for an unchanged rook/queen whose file moves from ineligible to open
   or color-relative half-open.
5. Keep it distinct from the existing moved-heavy `open_file_occupancy` event. Neither event uses
   optional operands to hide the other cause.
6. Refuse activity, control, improvement, recommendation, intention and grade without separate
   evidence; a class change is not automatically learner-prominent.
7. Bind D1710 execution, D1711 validation and D1726-corrected module accepts before activation.

## Frozen measurements

- state: authored 1,758 open + 604 half-open + 552 heavy occupancies; imported 577 + 1,877 + 1,222;
- moved-heavy event: 19/353 alternatives = 1.40× authored; 26/682 = 1.24× imported;
- stationary access: 27/289 = 2.43× authored; 35/297 = 3.83× imported;
- stationary roles/classes: authored Q-half 18, R-half 9; imported Q-half 19, R-half 11,
  Q-open 4, R-open 1.

## Able-to-fail fixtures

1. Exact file states are set-equal to both legacy predicates over both fixed populations.
2. Open file is not half-open for either color; a one-color pawn file is half-open only for the
   opposite color.
3. Moved rook/queen onto an existing eligible file fires only moved-entry.
4. Pawn capture off a retained rook's file fires only stationary access.
5. Same class before/after, removed heavy piece, or stationary minor piece is a hard negative.
6. Rook/queen × open/half-open form a closed fixture product even where corpus cells are sparse.
7. Any renderer saying “active,” “controls,” “good,” “should” or a plan from this source alone
   fails.
