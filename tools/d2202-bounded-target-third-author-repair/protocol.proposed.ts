// DISPOSABLE generated declaration image for the proposed runtime subpath. The consuming fixture
// imports these bytes; it may not restate the protocol locally.
export interface BoundedTargetRequestIdentity { readonly domain: "tabiya:bounded-target-request@1"; readonly requestDigest: string; readonly manifestDigest: string }
export interface BoundedTargetResultIdentity extends BoundedTargetRequestIdentity { readonly resultDomain: "tabiya:bounded-target-result@1"; readonly resultDigest: string }
export type ImmediateTargetOutcome =
  | { readonly result: "preserved"; readonly cause: "preserved"; readonly postCandidateExchange: { readonly result: "positive"; readonly captureUci: string; readonly resultUnits: number } }
  | { readonly result: "removed"; readonly cause: "attacker_captured" | "target_moved" | "capture_illegal"; readonly postCandidateExchange: null }
  | { readonly result: "removed"; readonly cause: "exchange_neutralized"; readonly postCandidateExchange: { readonly result: "non_positive"; readonly captureUci: string; readonly resultUnits: number } };
export type BoundedTargetImmediateEvidence<O extends ImmediateTargetOutcome = ImmediateTargetOutcome> = Readonly<{ projection: "derived.bounded_target.immediate"; payload: { readonly outcome: O } }>;
export type BoundedTargetReturnEvidence = Readonly<{ projection: "derived.bounded_target.bounded_return" }>;
export type ReturnDerivation =
  | { readonly kind: "evidence"; readonly item: BoundedTargetReturnEvidence }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.bounded_return"; readonly version: 1 }; readonly reason: "budget_exhausted"; readonly candidateUci: string; readonly visitedPositions: number };
export type CandidateDerivation =
  | { readonly kind: "preserved"; readonly immediate: BoundedTargetImmediateEvidence<Extract<ImmediateTargetOutcome, { readonly result: "preserved" }>> }
  | { readonly kind: "removed"; readonly immediate: BoundedTargetImmediateEvidence<Extract<ImmediateTargetOutcome, { readonly result: "removed" }>>; readonly boundedReturn: ReturnDerivation }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.immediate"; readonly version: 1 }; readonly reason: "identity_lost"; readonly candidateUci: string };
export interface TargetDerivation { readonly candidates: readonly CandidateDerivation[] }
export interface BoundedTargetBatchCompleted { readonly kind: "completed"; readonly identity: BoundedTargetResultIdentity; readonly targets: readonly TargetDerivation[]; readonly visitedPositions: number }
export interface BoundedTargetBatchAbstained { readonly kind: "abstained"; readonly identity: BoundedTargetResultIdentity; readonly reason: "input_abstained" | "position_mismatch" | "target_mismatch" | "exchange_set_mismatch" | "multiplication_limit" | "batch_budget_exhausted" | "queue_full"; readonly visitedPositions: number }
export interface BoundedTargetBatchCancelled { readonly kind: "cancelled"; readonly identity: BoundedTargetResultIdentity; readonly reason: "caller_aborted" | "service_closed"; readonly visitedPositions: number }
export interface BoundedTargetBatchFailed { readonly kind: "failed"; readonly identity: BoundedTargetResultIdentity; readonly reason: "yield_failed" | "traversal_failed" | "seal_failed" | "invariant_failed"; readonly visitedPositions: number }
export type BoundedTargetBatchResult = BoundedTargetBatchCompleted | BoundedTargetBatchAbstained | BoundedTargetBatchCancelled | BoundedTargetBatchFailed;
