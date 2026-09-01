# Shared candidate packet — sixth author repair

- **Date:** 2026-09-01
- **Input:** fifth fresh return [[D2428]]
- **Status:** author-repaired and D2468-corrected; fresh independent review required
- **Boundary:** RFC, disposable measurement/author contracts and planning/register records only

## Decision

Use one projection-specific FEN factory rather than retaining the current two-computation adapter.
`createRulesMobilityReadingLegalMovesV1Evidence(fen)` owns the sole `exactLegalMoveMap` invocation,
seals that exact return and accepts no caller-authored map. The packet compiler imports only the
registered factory and flattens the declared payload by reference.

This preserves the accepted exact-mobility semantics while strengthening authority: a caller can no
longer submit an equal or forged map for validation. The route lands through
`evidence-value-authority`; this RFC consumes that exact symbol and declares the dependency instead
of creating the forbidden `declareExactLegalMovesEvidence(fen)` alias.

## Measurement

`make candidate-packet-d2428-measurement` runs the current production functions over six positions:
ordinary, castling, promotion, middlegame, pawn endgame and terminal. After 20 warm-up rounds, 100
measured rounds produced these medians on the author machine:

| path | median ms/position |
|---|---:|
| one `exactLegalMoveMap` authority computation | 0.029465 |
| current compiler call plus validating adapter | 0.080278 |

The current path is 2.724× the single-authority floor before candidate collectors execute. This is
decision evidence, not a release latency claim.

## Executable author evidence

`make candidate-packet-sixth-author-repair` passes 3/3 plus strict TypeScript. It proves:

- one FEN factory call causes one authority call and retains one map/move object graph;
- a caller map is rejected before authority execution, while a packet-internal equal rebuild fails
  receipt identity; and
- the RFC owns the adapter file, measured boundary and fresh-review gate.

No runtime, cache, selector, server, API, schema, content or UX implementation is authorized by
this author repair.
