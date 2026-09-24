# Implementation receipt: `rfc/bounded-policy-targets.md` (local layer)

**Date:** 2026-09-24 · **By:** claude, at the owner's direction (no review rounds) · **Status
token:** left `draft` for status-parity; the coordinator flips the README row and body together.

## What shipped

- `tactics.ts`: `threatPassAnchor` / `assertThreatPassAnchor` (sealed WeakSet anchors); `threats()`
  consumes the same transform.
- `threat-pass-authority.ts`: the sole threat factory binds the exact pass-anchor result to the
  wrapper it minted; `threatEvidencePassAnchor` refuses spreads, casts and foreign equal payloads.
- `evidence-factories.ts`: `createRulesTacticConsequenceThreatV1Evidence` is FEN-owning and binds
  the anchor; three new routes `createDerivedBoundedTarget{NamedMaterialTarget,Immediate,BoundedReturn}V1Evidence`
  (the last async, requiring a service-created traversal authority). Registered in the central
  invoker only. Convention receipts come from main's register through `mint`.
- `bounded-target-chess.ts`: tracked identity (both castling forms, observed promotions, captures),
  the named-target join, immediate outcomes, the three-ply return with the
  `bounded-target-visited-positions@1` counters, sealed batch counter/traversal authority.
- `bounded-target.ts`: `BoundedTargetBackgroundService` (1 active / 8 queued, ≤512 pairs,
  25,000 / 100,000 visited caps, 64-position MessageChannel yields, authority-exact dedup, waiter-
  local cancellation, idempotent `close`, five result arms, never throws), specialized assertions,
  `assertBoundedTargetBatchResult`, request/result identities, `RUNTIME_EVIDENCE_PRODUCER_OPERATIONS`.
- `evidence-producer-operations.ts` + `evidence-manifest-check`: the background-producer census.
- `evidence-catalog.ts`: explicit checked producer latency on all 42 producers (legacy bytes
  preserved; manifest digest unchanged except for the new rows), one producer, three inspector-only
  projections. `evidence-operations.ts#boundedTargetSourceEvidence` mints the complete source set
  from one FEN. `cooperative-yield.ts` is the shared adapter.
- Semantic validation: the two reading roots plus `immediate@1` (explicit inspector-only event root)
  are live subjects with debt profiles; the ninth operation `runtime.semantic.bounded_target_batch`
  runs the real service (reach `required`: zero production callers by design).
- **Module registry / consumer pairs: none declared** — every projection is inspector-only (§5, 12).

## Census (`make bounded-target-census`, `tools/d1023-bounded-policy-harness/production-census-output.md`)

| population | played removed / preserved | lift | reintroduced | survives every defence | max pairs |
|---|---|---|---|---|---|
| authored | 122 / 27 | 4.12× | 71/122 | 2 | 111 |
| imported | 180 / 76 | 3.41× | 130/180 | 0 | 333 |

Contrary evidence vs the D1023 receipt (120/27, 4.10×, 69; 188/67, 2.85×, 130) is recorded, not
hidden: the harness replayed pawn promotion-captures without the promotion role (8 targets misread
`capture_illegal`) and dropped positive captures that also mate. All-defences counts are unchanged.
Position max > 1,000 ms still refuses request-thread `sync`.

## Criteria → tests (`packages/runtime/src/bounded-target.test.ts`, 19 tests; census)

1 census (contrary evidence recorded) · 2 "[2] makes latency explicit…", "[2][12] compiles exactly
the three…" · 3/23/30 "derives one sealed pass anchor…", "binds the anchor only…", "joins exactly…" ·
4 "[4] requires the complete positive exchange set…" · 5/6 "[5][6] correlates every immediate cause…" ·
7 "[7] seals a total return quantifier…" (+ `assertBoundedTargetReturnEvidence` shape checks) · 8/18
"[8][18] stops a candidate at its local cap…" · 9 not re-run (destination negative is research-only;
no destination projection is registered) · 10 no judgement vocabulary exists in any payload type ·
11 "[11] registers the concrete service submit…" · 12 inspector-only, zero bindings · 13 targets
`bounded-target-contract-production`, `bounded-target-census` · 15 "[15] refuses more than the
pair ceiling…" + census maxima · 16/19 "[16][19] settles only the aborting waiter…" (real
`setTimeout` abort; deterministic 64-position stop) · 17/22/33 "[17][22][33] binds the imported
primary manifest…" · 18 "[18] returns every failed arm…" · 21 "[21] closes idempotently…" · 24
"[24] mints only through the sealed route…" · 25/28 "[25][28] exports the protocol…" · 26
semantic-validation "[26] admits both readings and the inspector-only immediate event…" · 31/32/34
"[16][32] shares one execution…", "[34] returns the pre-identity rejected arm…".

## Remains

- D2/D3 → `bounded-target-policy-composition` (this session). D4–D6 consumer RFCs.
- Criterion 27/29 (generated declaration-AST module) and 35 (the author-repair make target) are
  author-contract instruments; the exported TypeScript types are the protocol image.
- Semantic-validation positives/negatives for the three subjects need independent authority.
