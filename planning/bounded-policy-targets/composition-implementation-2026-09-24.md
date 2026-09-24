# Implementation receipt: `rfc/bounded-target-policy-composition.md`

**Date:** 2026-09-24 · **By:** claude, at the owner's direction (no review rounds). Status token left
`draft` for status-parity; the coordinator flips the README row and body together.

## What shipped

- `packages/runtime/src/bounded-target-policy.ts`: pure derivations `deriveEngineTargetPolicy`
  (depth 8/10 stable category, selected root row, second-opportunity availability through the
  tracked target) and `deriveMaiaPolicyBounds` (three-arm next-execution interval, verified/known-
  failure path mass, 0.90 gate, mass-less refusal, band-specific denominators).
- `evidence-factories.ts`: `createDerivedBoundedTarget{EngineTargetPolicy,PolicyBounds}V1Evidence`
  (sole routes; ancestry = local facts + raw sealed receipts); `evidence-operations.ts#derivedBoundedTargetPolicyEvidence`.
- `evidence-catalog.ts`: producer `derived.bounded_target_policy@1` (local/sync), two inspector-only
  `reported` rows; `evidence-contract.ts#effectiveEvidenceExecution` / `assertPathEffectiveExecution`.
- `apps/server/src/bounded-target-policy.ts#BoundedTargetPolicyCompositionOperation.evaluate(request,
  scope, signal)`, composed in `application.ts` (`application.boundedTargetPolicy`) with the
  bounded-target service, the shared scheduler and the Stockfish identity; at most 2 + 9 provider
  calls per row, no private cache/queue, cancellation propagated.
- **Consumer pairs: none** (inspector-only; D3–D6 are consumer RFCs). `bounded-target-policy.test.ts`
  (14 tests) runs both arms end to end over `MockProviderEngineClient` behind the real scheduler.

## Criteria → tests (`apps/server/src/bounded-target-policy.test.ts`)

1 "compiles both reported, inspector-only rows…" · 2 "reports next execution…" (retained tables/
facts) · 3 raw legal-root completeness is the existing parser's (unchanged) · **4 open** (needs live
Stockfish over the D1023 population) · 5/11 "coalesces exact duplicate pages…" · 6 the three
next-execution tests · 7 "refuses below the 0.90 retained-mass gate and on a mass-less row…" · 8 the
two quantities are separate fields; no sum exists · **9 open** (live Maia rerun) · 10 "executes both
arms through the application-composed operation", "[10] reports provider unavailability…" · 11
"propagates cancellation…" (TTL/restart/model-change reuse the provider scheduler's own suite) · 12
"lands zero learner bindings…" · 13 verification below · 14 ledger/log left to the coordinator.

## Remains

Live D1023 provider reruns (criteria 4, 9); consumer bindings (D3–D6). Ledger D1652/D1653 were
already served by provider exchange; D1655 and D1658 are addressed by this operation for the
coordinator to flip.
