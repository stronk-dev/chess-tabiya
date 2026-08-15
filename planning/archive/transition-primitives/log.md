# Transition primitives implementation log

## 2026-08-15 — implementation

- Added pack schema 0.22, six transition leaves, the five-node sibling expression grammar,
  objective evaluation, evidence refs, and closed exhaustive dispatch.
- Replayed spine plus legal deviation edges during pack validation. Positive zero-coverage and
  negative always-present claims fail; broad positive claims warn. Direct refusal tests cover all
  new codes, including the schema-shadowed defensive fallthrough.
- Landing audit: 634 transitions, 0 mismatches for the independent comparable arithmetic. The
  accepted RFC's claim that the old duty harness was identical was stale: it counted moved pieces;
  production correctly retains the specified same-square identity. Measured maxima are 4/3/3/11/2
  for attack/defence/lines/escapes/duties; median full reading 51.32 µs per ply.
- Authored consumers: Carlsbad transition consequence (including the grounded backward-pawn target), pawn-break preservation, queen-mate flight
  geometry plus a deviation-backed negative condition. All three pass `pack-check`.
- R3 fallback applied: the reading is closed by default and learner-opened; no live marker or new
  preference. The older RFC clauses requiring a marker are superseded by the measured header and
  owner handoff.
- Fixed `structuralDelta` eviction scanning to parse each FEN once while keeping the function
  outside every transition call path.

## 2026-08-15 — completion

- Independent implementation gates passed before archival: 565 tests across 92 files and 24
  browser tests at zero retries (one optional Maia test skipped).
- Final diff review caught and fixed the specified illegal-edge boundary: transition expressions
  now refuse illegal or mismatched before/move/after triples instead of allowing a position-only
  expression to evaluate them.
- Canonical behavior lives in `docs/transition-primitives.md`; the RFC and this planning job are
  archived under the completion protocol.
