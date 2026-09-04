import type { BoundedReturnOutcome, BoundedTargetBatchRequest, BoundedTargetBatchResult, BoundedTargetImmediateFactoryResult, BoundedTargetResultIdentity, BoundedTargetServiceOptions, CandidateDerivation, NamedMaterialTargetFactoryResult, ReturnDerivation, TargetDerivation } from "./protocol.proposed.js";
import { createBoundedTargetBackgroundService } from "./protocol.proposed.js";

function never(value: never): never { throw new Error(String(value)); }
function consumeOutcome(outcome: BoundedReturnOutcome): string {
  switch (outcome.kind) {
    case "not_reintroduced": return outcome.firstRefutation?.join(",") ?? "none";
    case "reintroduced": return outcome.witness.join(",") + outcome.firstRefutation.join(",");
    case "survives_every_defence": return outcome.witness.join(",");
    default: return never(outcome);
  }
}
function consumeReturn(result: ReturnDerivation): string {
  switch (result.kind) {
    case "evidence": return consumeOutcome(result.item.payload.outcome);
    case "abstained": return result.projection.id + result.reason;
    default: return never(result);
  }
}
function consumeCandidate(candidate: CandidateDerivation): string {
  switch (candidate.kind) {
    case "preserved": return candidate.immediate.payload.target.captureUci;
    case "removed": return consumeReturn(candidate.boundedReturn);
    case "abstained": return candidate.projection.id + candidate.reason;
    default: return never(candidate);
  }
}
function consumeTarget(target: TargetDerivation): string {
  return target.target.payload.sourcePosition.payload.fen + target.candidates.map(consumeCandidate).join(",");
}
function consumeResult(result: BoundedTargetBatchResult): string {
  switch (result.kind) {
    case "completed": return result.identity.inputs.threat + result.targets.map(consumeTarget).join(",");
    case "abstained": return result.reason;
    case "cancelled": return result.reason;
    case "failed": return result.reason;
    default: return never(result);
  }
}
function consumeNamedFactory(result: NamedMaterialTargetFactoryResult): string {
  return result.kind === "evidence" ? result.item.payload.captureUci : result.projection.id + result.reason;
}
function consumeImmediateFactory(result: BoundedTargetImmediateFactoryResult): string {
  return result.kind === "evidence" ? result.item.payload.afterFen : result.projection.id + result.reason;
}

declare const identity: BoundedTargetResultIdentity;
declare const request: BoundedTargetBatchRequest;
declare const namedFactoryResult: NamedMaterialTargetFactoryResult;
declare const immediateFactoryResult: BoundedTargetImmediateFactoryResult;
const options: BoundedTargetServiceOptions = { limits: { maxQueued: 8 } };
const service = createBoundedTargetBackgroundService(options);
void service.submit(request, new AbortController().signal).then(consumeResult);
void service.close();
consumeNamedFactory(namedFactoryResult);
consumeImmediateFactory(immediateFactoryResult);

declare const target: TargetDerivation;
const removed = target.candidates.find((candidate) => candidate.kind === "removed");
if (removed?.kind === "removed") consumeReturn(removed.boundedReturn);
consumeResult({ kind: "completed", identity, targets: [{ target: target.target, candidates: target.candidates }], visitedPositions: 25_000 });
// @ts-expect-error a top-level failure cannot carry completed targets
const crossedTop: BoundedTargetBatchResult = { kind: "failed", identity, reason: "seal_failed", visitedPositions: 0, targets: [] };
void crossedTop;
