// DISPOSABLE normative declaration image for the proposed runtime subpath. This file is the
// complete author-time public protocol source; the consuming fixture may not restate it locally.
type Color = "white" | "black";
type Role = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
type SquareName = string;
type ThreatResult = Readonly<{ readonly kind: "threats"; readonly sourceFen: string }>;
type LegalExchangeResult = Readonly<{ readonly captureUci: string; readonly resultUnits: number }>;
type ExactLegalMove = Readonly<{ readonly uci: string }>;
type ExactLegalMoveMap = Readonly<{ readonly fen: string; readonly moves: readonly ExactLegalMove[] }>;
type DeclaredEvidence<Payload> = Readonly<{ readonly payload: Payload }>;
declare const PRIMARY_EVIDENCE_MANIFEST: Readonly<{ readonly digest: string }>;
declare const THREAT_CONVENTION: "threat@1";
declare const THREAT_SOURCE_BOUND: unique symbol;

export type ProjectionEvidence<Id extends string, Payload> = DeclaredEvidence<Payload> & {
  readonly projection: { readonly id: Id; readonly version: 1 };
};

export interface ThreatPassAnchor {
  readonly conventionId: typeof THREAT_CONVENTION;
  readonly sourceFen: string;
  readonly passedFen: string;
}
export type ThreatPassAnchorResult =
  | { readonly kind: "available"; readonly anchor: ThreatPassAnchor }
  | { readonly kind: "unavailable"; readonly reason: "pass_while_in_check"; readonly sourceFen: string };
export type SourceBoundThreatEvidence = ProjectionEvidence<"rules.tactic.consequence.threat", ThreatResult> & {
  readonly [THREAT_SOURCE_BOUND]: true;
};
export type ThreatEvidence = SourceBoundThreatEvidence;
export type LegalExchangeEvidence = ProjectionEvidence<"rules.exchange.predicate.legal_exchange", LegalExchangeResult>;
export type SourceLegalMovesEvidence = ProjectionEvidence<"rules.mobility.reading.legal_moves", ExactLegalMoveMap>;

export interface TrackedPieceIdentity {
  readonly color: Color;
  readonly role: Role;
  readonly square: SquareName;
}
export interface ObservedPromotionEdge {
  readonly ply: 1 | 2 | 3;
  readonly moveUci: string;
  readonly from: SquareName;
  readonly to: SquareName;
  readonly fromRole: "pawn";
  readonly toRole: "queen" | "rook" | "bishop" | "knight";
}
export interface NamedMaterialTarget {
  readonly convention: "bounded-target@1";
  readonly passAnchor: ThreatPassAnchor;
  readonly attacker: TrackedPieceIdentity;
  readonly victim: TrackedPieceIdentity;
  readonly captureUci: string;
  readonly threat: ThreatEvidence;
  readonly exchange: LegalExchangeEvidence;
  readonly sourcePosition: SourceLegalMovesEvidence;
}

export interface PostCandidateExchangeEvaluation {
  readonly convention: "legal-exchange-for-move@1";
  readonly captureUci: string;
  readonly resultUnits: number;
  readonly result: "positive" | "non_positive";
}
export type ImmediateTargetOutcome =
  | { readonly result: "preserved"; readonly cause: "preserved"; readonly postCandidateExchange: PostCandidateExchangeEvaluation & { readonly result: "positive" } }
  | { readonly result: "removed"; readonly cause: "attacker_captured" | "target_moved" | "capture_illegal"; readonly postCandidateExchange: null }
  | { readonly result: "removed"; readonly cause: "exchange_neutralized"; readonly postCandidateExchange: PostCandidateExchangeEvaluation & { readonly result: "non_positive" } };
export interface BoundedTargetImmediate {
  readonly target: NamedMaterialTarget;
  readonly candidateUci: string;
  readonly afterFen: string;
  readonly outcome: ImmediateTargetOutcome;
}

export type CandidateLine = readonly [candidateUci: string];
export type RefutationLine = readonly [candidateUci: string, preparationUci: string, replyUci: string];
export type ReintroductionLine = readonly [candidateUci: string, preparationUci: string, replyUci: string, captureUci: string];
export type BoundedReturnOutcome =
  | { readonly kind: "not_reintroduced"; readonly firstRefutation: RefutationLine | null }
  | { readonly kind: "reintroduced"; readonly witness: ReintroductionLine; readonly firstRefutation: RefutationLine }
  | { readonly kind: "survives_every_defence"; readonly witness: ReintroductionLine };
export interface BoundedTargetReturn {
  readonly immediate: BoundedTargetImmediate & { readonly outcome: Extract<ImmediateTargetOutcome, { readonly result: "removed" }> };
  readonly horizonPlies: 3;
  readonly visitedPositions: number;
  readonly outcome: BoundedReturnOutcome;
}

export type NamedMaterialTargetEvidence = ProjectionEvidence<"derived.bounded_target.named_material_target", NamedMaterialTarget>;
export type BoundedTargetImmediateEvidence<Outcome extends ImmediateTargetOutcome = ImmediateTargetOutcome> = ProjectionEvidence<"derived.bounded_target.immediate", BoundedTargetImmediate & { readonly outcome: Outcome }>;
export type BoundedTargetReturnEvidence = ProjectionEvidence<"derived.bounded_target.bounded_return", BoundedTargetReturn>;
export type NamedMaterialTargetFactoryResult =
  | { readonly kind: "evidence"; readonly item: NamedMaterialTargetEvidence }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.named_material_target"; readonly version: 1 }; readonly reason: "input_abstained" | "position_mismatch" | "target_mismatch" };
export type BoundedTargetImmediateFactoryResult =
  | { readonly kind: "evidence"; readonly item: BoundedTargetImmediateEvidence }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.immediate"; readonly version: 1 }; readonly reason: "position_mismatch" | "target_mismatch" | "identity_lost"; readonly candidateUci: string };

export interface BoundedTargetBatchRequest {
  readonly kind: "source_position_batch";
  readonly threat: ThreatEvidence;
  readonly exchanges: readonly LegalExchangeEvidence[];
  readonly sourcePosition: SourceLegalMovesEvidence;
}
export type ReturnDerivation =
  | { readonly kind: "evidence"; readonly item: BoundedTargetReturnEvidence }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.bounded_return"; readonly version: 1 }; readonly reason: "budget_exhausted"; readonly candidateUci: string; readonly visitedPositions: number };
export type CandidateDerivation =
  | { readonly kind: "preserved"; readonly immediate: BoundedTargetImmediateEvidence<Extract<ImmediateTargetOutcome, { readonly result: "preserved" }>> }
  | { readonly kind: "removed"; readonly immediate: BoundedTargetImmediateEvidence<Extract<ImmediateTargetOutcome, { readonly result: "removed" }>>; readonly boundedReturn: ReturnDerivation }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.immediate"; readonly version: 1 }; readonly reason: "identity_lost"; readonly candidateUci: string };
export interface TargetDerivation {
  readonly target: NamedMaterialTargetEvidence;
  readonly candidates: readonly CandidateDerivation[];
}
export interface BoundedTargetInputDigests {
  readonly threat: string;
  readonly exchanges: readonly string[];
  readonly sourcePosition: string;
}
export interface BoundedTargetRequestIdentity {
  readonly domain: "tabiya:bounded-target-request@1";
  readonly requestDigest: string;
  readonly manifestDigest: typeof PRIMARY_EVIDENCE_MANIFEST.digest;
  readonly inputs: BoundedTargetInputDigests;
}
export interface BoundedTargetResultIdentity extends BoundedTargetRequestIdentity {
  readonly resultDomain: "tabiya:bounded-target-result@1";
  readonly resultDigest: string;
}
export interface BoundedTargetBatchCompleted {
  readonly kind: "completed";
  readonly identity: BoundedTargetResultIdentity;
  readonly targets: readonly TargetDerivation[];
  readonly visitedPositions: number;
}
export type BoundedTargetBatchAbstentionReason = "input_abstained" | "position_mismatch" | "target_mismatch" | "exchange_set_mismatch" | "multiplication_limit" | "batch_budget_exhausted" | "queue_full";
export interface BoundedTargetBatchAbstained {
  readonly kind: "abstained";
  readonly identity: BoundedTargetResultIdentity;
  readonly reason: BoundedTargetBatchAbstentionReason;
  readonly visitedPositions: number;
}
export type BoundedTargetBatchCancellationReason = "caller_aborted" | "service_closed";
export interface BoundedTargetBatchCancelled {
  readonly kind: "cancelled";
  readonly identity: BoundedTargetResultIdentity;
  readonly reason: BoundedTargetBatchCancellationReason;
  readonly visitedPositions: number;
}
export type BoundedTargetBatchFailureReason = "yield_failed" | "traversal_failed" | "seal_failed" | "invariant_failed";
export interface BoundedTargetBatchFailed {
  readonly kind: "failed";
  readonly identity: BoundedTargetResultIdentity;
  readonly reason: BoundedTargetBatchFailureReason;
  readonly visitedPositions: number;
}
export type BoundedTargetBatchRejectionReason = "invalid_request";
export interface BoundedTargetBatchRejected {
  readonly kind: "rejected";
  readonly reason: BoundedTargetBatchRejectionReason;
}
export type BoundedTargetBatchResult =
  | BoundedTargetBatchCompleted
  | BoundedTargetBatchAbstained
  | BoundedTargetBatchCancelled
  | BoundedTargetBatchFailed
  | BoundedTargetBatchRejected;

export interface BoundedTargetServiceLimits {
  readonly maxActive: number;
  readonly maxQueued: number;
  readonly maxPairs: number;
  readonly maxVisitedPositions: number;
  readonly maxBatchVisitedPositions: number;
  readonly yieldEveryVisited: number;
}
export interface BoundedTargetServiceOptions {
  readonly limits?: Partial<BoundedTargetServiceLimits>;
}
export declare class BoundedTargetBackgroundService {
  private constructor();
  static create(options?: BoundedTargetServiceOptions): BoundedTargetBackgroundService;
  submit(request: BoundedTargetBatchRequest, signal: AbortSignal): Promise<BoundedTargetBatchResult>;
  close(): Promise<void>;
}
export declare function threatPassAnchor(sourceFen: string): ThreatPassAnchorResult;
export declare function assertThreatPassAnchor(value: unknown): asserts value is ThreatPassAnchor;
export declare function threatEvidencePassAnchor(evidence: SourceBoundThreatEvidence): ThreatPassAnchorResult;
export declare function assertNamedMaterialTargetEvidence(value: unknown): asserts value is NamedMaterialTargetEvidence;
export declare function assertBoundedTargetImmediateEvidence(value: unknown): asserts value is BoundedTargetImmediateEvidence;
export declare function assertBoundedTargetReturnEvidence(value: unknown): asserts value is BoundedTargetReturnEvidence;
export declare function assertBoundedTargetBatchResult(value: unknown): asserts value is BoundedTargetBatchResult;
export declare function createBoundedTargetBackgroundService(options?: BoundedTargetServiceOptions): BoundedTargetBackgroundService;
