import type { BoundedTargetBatchResult, BoundedTargetResultIdentity, CandidateDerivation, ReturnDerivation } from "./protocol.proposed.js";

function never(value: never): never { throw new Error(String(value)); }
function consumeReturn(result: ReturnDerivation): string {
  switch (result.kind) { case "evidence": return result.item.projection; case "abstained": return result.reason; default: return never(result); }
}
function consumeCandidate(candidate: CandidateDerivation): string {
  switch (candidate.kind) { case "preserved": return candidate.immediate.payload.outcome.result; case "removed": return consumeReturn(candidate.boundedReturn); case "abstained": return candidate.reason; default: return never(candidate); }
}
function consumeResult(result: BoundedTargetBatchResult): string {
  switch (result.kind) { case "completed": return result.targets.flatMap((target) => target.candidates).map(consumeCandidate).join(","); case "abstained": return result.reason; case "cancelled": return result.reason; case "failed": return result.reason; default: return never(result); }
}

declare const identity: BoundedTargetResultIdentity;
const crossed: CandidateDerivation = { kind: "removed", immediate: { projection: "derived.bounded_target.immediate", payload: { outcome: { result: "removed", cause: "target_moved", postCandidateExchange: null } } }, boundedReturn: { kind: "abstained", projection: { id: "derived.bounded_target.bounded_return", version: 1 }, reason: "budget_exhausted", candidateUci: "e2e4", visitedPositions: 25_000 } };
consumeResult({ kind: "completed", identity, targets: [{ candidates: [crossed] }], visitedPositions: 25_000 });
// @ts-expect-error preserved arms cannot carry a return derivation
const impossible: CandidateDerivation = { kind: "preserved", immediate: { projection: "derived.bounded_target.immediate", payload: { outcome: { result: "preserved", cause: "preserved", postCandidateExchange: { result: "positive", captureUci: "e4d5", resultUnits: 1 } } } }, boundedReturn: { kind: "abstained" } };
void impossible;
// @ts-expect-error a top-level failure cannot carry completed targets
const crossedTop: BoundedTargetBatchResult = { kind: "failed", identity, reason: "seal_failed", visitedPositions: 0, targets: [] };
void crossedTop;
