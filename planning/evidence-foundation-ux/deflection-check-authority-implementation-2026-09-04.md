# Deflection check authority — production implementation receipt

- **Date:** 2026-09-04
- **Rows:** [[D2536]], [[D2552]], [[D2553]], [[D2554]], [[D2555]], [[D2556]]
- **RFC:** `rfc/semantic-collectors.md` §3.2.1 / C17
- **Scope:** bounded deflection check-authority implementation; the held promotion pair is unchanged

## Production boundary

`derived.tactic.deflection_observed@1` now declares two exact derivation members. Both retain the
recorded move, defender-duty, capture and positive legal-exchange inputs; only the check-induced
member adds `rules.tactic.event.check@1`. The exported `deflectionObservedInduction` operation is
the single bait-before-check selector used by the detector, emitter and both recorded-path
compilers. Callers neither infer nor retry a private arm.

The exported `checkSemanticEvent` operation is the narrow constructor for the existing check
projection. It validates the canonical edge, runs the declared check adapter and returns a
runtime-sealed semantic event. Broad tactical collection delegates to it. Exact-source recorded
path compilation retains that sealed event for deflection and passes only its declared evidence to
attraction and zwischenzug, so it does not widen into reply-breadth or double-attack work.

`deflectionObservedSemanticEvent` asserts the event seal, exact projection and exact first-edge
anchor. It refuses missing check evidence on the check arm, unnecessary check evidence on the
bait-capture arm, copied/unsealed values, crossed edges and wrong projections. Permanent legal
fixtures cover the check-only `Ra8+ Rg8 Rxe7` line and the dual-arm `Bxa7+ Nxa7 Rxe7` line.

## Maintained verification

- All six retained author/fresh-review targets pass.
- `make test-software`: 181 files / 1,111 tests pass.
- `make verify-software`: typecheck, software/performance tests, schemas, build and scaffold pass.
- Evidence manifest: 37 producers / 193 projections / 25 consumers / 210 dispositions; digest
  `cb4a034b3f09ee7bfd9e92ba5b73d95b2ac21fe9b1aa426e2428760b9bbc56e6`.
- `make recorded-semantic-path-cost`: eager full-path compilation remains deliberately refused at
  40 and 80 plies (p95 838.8 ms and 1,418.1 ms).
- `make recorded-semantic-path-source`: exact-source output is byte-identical to eager compilation
  and passes the 500 ms bound at 20/40/80 plies (p95 74.3/144.4/245.2 ms).
- `make verify`: passed after tracker regeneration, including 1,111 software tests and 172
  real-content tests.

## Compatibility and flow-back

No schema, migration, persistence, API, content, producer id, projection id, operand id or module
eligibility changed. The canonical evidence docs now describe the live manifest rather than the
pre-deflection gap, and D1930/D1931 have maintained Make entry points. `module-registration.md` is
still draft: its check-induced deflection dependency is no longer upstream-blocked, but a fresh
independent review must exercise that newly buildable join before acceptance. The value-authority
route receipt now includes `checkSemanticEvent` as the 46th exact callable operation; its author
contract asserts that symbol rather than merely accepting a larger count.
