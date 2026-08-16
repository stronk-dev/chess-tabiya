# Opponent contracts implementation log

## 2026-08-16 — implementation complete, independent review pending

- Added the optional persisted `OpponentSelection.orderingBasis` contract, run schema
  0.17, and stamp-only storage migration 23. Historical v0.16 selections remain
  byte-identical and do not infer the new field.
- Replaced residual UCI-lexicographic tablebase ties with the position-pure
  `sha256(fen + "\0" + uci)` order. DTZ remains the primary comparator in won and lost
  roots; drawn roots publish `orderingBasis: "none"`.
- Closed the REST reconstruction gap: the parser enumerates the complete selection wire
  shape, preserves `orderingBasis`, and refuses unknown future fields rather than silently
  dropping them.
- Published the measured `human_common` resistance profile at mode scope, completed the
  opponent-mode format dispositions, added their totality gate, and added the static
  perfect-tablebase/hold warning.
- Re-ran the census with the original 507-position source corpus
  (`sha256 4cc202fc633cbf6a6accdda37caafbd9bdc080c912e7da0fcae6d98b8c070760`) and
  the updated `census.py`:
  - drawn roots: 3/66 capture-or-pawn selections = 4.55%; the per-position uniform
    expectation is 4.02%, inside the 95% Wilson interval [1.56%, 12.53%] (A9 pass);
  - won roots: 24/218 = 11.01%, or 1.18x the per-position uniform expectation of 9.34%;
    this remains inside the original 10.6%–20.0% Wilson interval (A10 pass). The point
    estimate moved from 1.57x and is recorded rather than described as unchanged;
  - 130/218 won roots have at least two preserving moves tied at minimum |DTZ|, so A10 is
    non-vacuous.
- Verification on the final implementation tree: `ENGINES_REQUIRED=1 make verify` passed
  727 tests across 114 files with schema/scaffold/packaging clean and Svelte 0 errors / 0
  warnings; `make test-browser` passed 24 tests with one optional Maia test skipped and
  Playwright retries unset.
- Lifecycle remains `implementing`. Archival, the exploration-log append, and final
  canonical reconciliation wait for independent implementation review.
