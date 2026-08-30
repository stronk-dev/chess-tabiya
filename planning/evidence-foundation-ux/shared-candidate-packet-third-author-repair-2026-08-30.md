# Shared candidate packet third author repair — 2026-08-30

## Outcome

Repaired [[D2198]]–[[D2201]] at the author-contract boundary. The RFC remains draft and no packet,
collector, cache, consumer, provider, API or schema implementation is authorized before another
fresh independent review.

## Repairs

- Removed caller-selected manifests from both product and test factories. The compiler closes over
  `PRIMARY_EVIDENCE_MANIFEST`, and the private receipt map retains that exact object beside the
  packet, legal input, rows, values and collector outcomes.
- Added literal projection identity to available, unavailable and failed collector results. Each
  declaration emits exactly one result per output, and every non-empty value agrees with it.
- Replaced the impossible positional `operation` rows with thirteen named one-context adapters.
  Each row individually satisfies its exact output and dependency types; dependency memo keys are
  unavailable unless declared.
- Defined the previously missing memo, service-stat and receipt-reference protocols, including
  bounded safe-integer gauges/counters and exact reference assertions.

## Verification

Maintained packet contracts pass 11/11, 4/4, 5/5 and 8/8. The new author contract passes 4/4 and
its TypeScript buildability fixture rejects undeclared memo reads and crossed value projections.
Full governance and repository verification remain the next gate.

No production, schema, content, archive or protected-intent byte changed.
