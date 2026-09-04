// DISPOSABLE executable author model for D2603-D2607. Not production code.
export type CanonicalFullFen = string & { readonly __canonicalFullFen: true };
export type ProviderRequestDigest = string & { readonly __providerRequestDigest: true };
export type TablebaseCategory = "win" | "draw" | "loss" | "unknown";
export type TablebasePerspective = "side_to_move";
export type PromotionRole = "queen" | "rook" | "bishop" | "knight";

export interface PawnIdentity {
  readonly square: string;
  readonly color: "white" | "black";
  readonly role: "pawn";
}

export interface ExactLegalMove {
  readonly uci: string;
  readonly from: string;
  readonly to: string;
  readonly role: string;
  readonly promotion?: PromotionRole;
}

export interface ExactLegalMoveMap {
  readonly fen: CanonicalFullFen;
  readonly moves: readonly ExactLegalMove[];
}

export interface PromotionRaceGeometry {
  readonly fen: CanonicalFullFen;
  readonly ordering: readonly Readonly<{ arrivalPly: number; pawns: readonly PawnIdentity[] }>[];
}

interface ExactLegalMoveFactoryReceipt {
  readonly fen: CanonicalFullFen;
  readonly map: ExactLegalMoveMap;
}
interface PromotionRaceGeometryFactoryReceipt {
  readonly fen: CanonicalFullFen;
  readonly geometry: PromotionRaceGeometry;
}

const legalFactoryReceipts = new WeakSet<ExactLegalMoveFactoryReceipt>();
const geometryFactoryReceipts = new WeakSet<PromotionRaceGeometryFactoryReceipt>();

export interface ExactLegalMovesEvidence {
  readonly receipt: ExactLegalMoveFactoryReceipt;
  readonly payload: ExactLegalMoveMap;
}
export interface PromotionRaceGeometryEvidence {
  readonly receipt: PromotionRaceGeometryFactoryReceipt;
  readonly payload: PromotionRaceGeometry;
}

const legalEvidence = new WeakSet<ExactLegalMovesEvidence>();
const geometryEvidence = new WeakSet<PromotionRaceGeometryEvidence>();

const assertCanonicalMoves = (moves: readonly ExactLegalMove[]): void => {
  const ids = moves.map((move) => move.uci);
  if (new Set(ids).size !== ids.length || ids.some((id) => !/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(id))) {
    throw new TypeError("LEGAL_MAP_IDENTITY_INVALID");
  }
  if (ids.some((id, index) => index > 0 && ids[index - 1]! > id)) throw new TypeError("LEGAL_MAP_ORDER_INVALID");
};

export function createExactLegalMoveFactoryReceipt(fen: CanonicalFullFen, moves: readonly ExactLegalMove[]): ExactLegalMoveFactoryReceipt {
  assertCanonicalMoves(moves);
  const map = Object.freeze({ fen, moves: Object.freeze([...moves]) });
  const receipt = Object.freeze({ fen, map });
  legalFactoryReceipts.add(receipt);
  return receipt;
}

export function createExactLegalMovesEvidence(receipt: ExactLegalMoveFactoryReceipt, map: ExactLegalMoveMap): ExactLegalMovesEvidence {
  if (!legalFactoryReceipts.has(receipt) || receipt.map !== map || receipt.fen !== map.fen) throw new TypeError("LEGAL_MAP_FACTORY_MISMATCH");
  const evidence = Object.freeze({ receipt, payload: map });
  legalEvidence.add(evidence);
  return evidence;
}

export function createPromotionRaceGeometryFactoryReceipt(geometry: PromotionRaceGeometry): PromotionRaceGeometryFactoryReceipt {
  const receipt = Object.freeze({ fen: geometry.fen, geometry });
  geometryFactoryReceipts.add(receipt);
  return receipt;
}

export function createPromotionRaceGeometryEvidence(receipt: PromotionRaceGeometryFactoryReceipt, geometry: PromotionRaceGeometry): PromotionRaceGeometryEvidence {
  if (!geometryFactoryReceipts.has(receipt) || receipt.geometry !== geometry || receipt.fen !== geometry.fen) throw new TypeError("GEOMETRY_FACTORY_MISMATCH");
  const evidence = Object.freeze({ receipt, payload: geometry });
  geometryEvidence.add(evidence);
  return evidence;
}

export function assertExactLegalMovesEvidence(value: unknown): asserts value is ExactLegalMovesEvidence {
  if (value === null || typeof value !== "object" || !legalEvidence.has(value as ExactLegalMovesEvidence)) throw new TypeError("LEGAL_MAP_UNSEALED");
}

export function assertPromotionRaceGeometryEvidence(value: unknown): asserts value is PromotionRaceGeometryEvidence {
  if (value === null || typeof value !== "object" || !geometryEvidence.has(value as PromotionRaceGeometryEvidence)) throw new TypeError("GEOMETRY_UNSEALED");
}

export interface PromotionRaceTablebaseRequest {
  readonly fen: CanonicalFullFen;
  readonly operation: "syzygy.position@1";
}
const requests = new WeakSet<PromotionRaceTablebaseRequest>();
export function createPromotionRaceTablebaseRequest(fen: CanonicalFullFen): PromotionRaceTablebaseRequest {
  const request = Object.freeze({ fen, operation: "syzygy.position@1" as const });
  requests.add(request);
  return request;
}

export interface PromotionRaceProviderInvocationReceipt {
  readonly request: PromotionRaceTablebaseRequest;
  readonly requestDigest: ProviderRequestDigest;
  readonly resultKind: "success" | "local_domain_result" | "source_failure";
}
const invocations = new WeakSet<PromotionRaceProviderInvocationReceipt>();
export function createPromotionRaceProviderInvocation(
  request: PromotionRaceTablebaseRequest,
  requestDigest: ProviderRequestDigest,
  resultKind: PromotionRaceProviderInvocationReceipt["resultKind"],
): PromotionRaceProviderInvocationReceipt {
  if (!requests.has(request)) throw new TypeError("REQUEST_UNSEALED");
  const invocation = Object.freeze({ request, requestDigest, resultKind });
  invocations.add(invocation);
  return invocation;
}

interface TablebaseOutcome {
  readonly category: TablebaseCategory;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly perspective: TablebasePerspective;
}
export type PromotionRaceTablebaseSource =
  | Readonly<{ kind: "recorded"; fen: CanonicalFullFen; outcome: TablebaseOutcome }>
  | Readonly<{ kind: "live"; fen: CanonicalFullFen; outcome: TablebaseOutcome; invocation: PromotionRaceProviderInvocationReceipt }>;
const sources = new WeakSet<PromotionRaceTablebaseSource>();

export function createRecordedTablebaseSource(fen: CanonicalFullFen, outcome: TablebaseOutcome): PromotionRaceTablebaseSource {
  const source = Object.freeze({ kind: "recorded" as const, fen, outcome: Object.freeze({ ...outcome }) });
  sources.add(source);
  return source;
}

export function createLiveTablebaseSource(
  fen: CanonicalFullFen,
  outcome: TablebaseOutcome,
  invocation: PromotionRaceProviderInvocationReceipt,
): PromotionRaceTablebaseSource {
  if (!invocations.has(invocation) || invocation.resultKind !== "success" || invocation.request.fen !== fen) throw new TypeError("LIVE_SOURCE_INVOCATION_MISMATCH");
  const source = Object.freeze({ kind: "live" as const, fen, outcome: Object.freeze({ ...outcome }), invocation });
  sources.add(source);
  return source;
}

export interface PromotionRaceTablebaseValue {
  readonly fen: CanonicalFullFen;
  readonly perspective: TablebasePerspective;
  readonly geometry: PromotionRaceGeometry;
  readonly source: PromotionRaceTablebaseSource;
  readonly category: TablebaseCategory;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly immediatePromotion: readonly ExactLegalMove[];
  readonly promotionFirst: readonly PawnIdentity[];
}
export interface PromotionRaceTablebaseEvidence { readonly payload: PromotionRaceTablebaseValue }
export interface PromotionRaceTablebaseDerivationReceipt {
  readonly request: PromotionRaceTablebaseRequest;
  readonly geometry: PromotionRaceGeometryEvidence;
  readonly legalMoves: ExactLegalMovesEvidence;
  readonly source: PromotionRaceTablebaseSource;
  readonly output: PromotionRaceTablebaseEvidence;
}

const outputs = new WeakSet<PromotionRaceTablebaseEvidence>();
const derivations = new WeakSet<PromotionRaceTablebaseDerivationReceipt>();

export function createDerivedPawnPromotionRaceTablebaseV1Evidence(input: Readonly<{
  request: PromotionRaceTablebaseRequest;
  geometry: PromotionRaceGeometryEvidence;
  legalMoves: ExactLegalMovesEvidence;
  source: PromotionRaceTablebaseSource;
}>): PromotionRaceTablebaseDerivationReceipt {
  if (!requests.has(input.request)) throw new TypeError("REQUEST_UNSEALED");
  assertPromotionRaceGeometryEvidence(input.geometry);
  assertExactLegalMovesEvidence(input.legalMoves);
  if (!sources.has(input.source)) throw new TypeError("SOURCE_UNSEALED");
  if ([input.geometry.payload.fen, input.legalMoves.payload.fen, input.source.fen].some((fen) => fen !== input.request.fen)) {
    throw new TypeError("PROMOTION_INPUT_FEN_MISMATCH");
  }
  const immediatePromotion = Object.freeze(input.legalMoves.payload.moves.filter((move) => move.promotion !== undefined));
  const promotionFirst = Object.freeze([...(input.geometry.payload.ordering[0]?.pawns ?? [])]);
  const value = Object.freeze({
    fen: input.request.fen,
    perspective: input.source.outcome.perspective,
    geometry: input.geometry.payload,
    source: input.source,
    category: input.source.outcome.category,
    dtz: input.source.outcome.dtz,
    preciseDtz: input.source.outcome.preciseDtz,
    immediatePromotion,
    promotionFirst,
  });
  const output = Object.freeze({ payload: value });
  outputs.add(output);
  const derivation = Object.freeze({ ...input, output });
  derivations.add(derivation);
  return derivation;
}

export type PromotionRaceTablebaseResult =
  | Readonly<{ kind: "reading"; request: PromotionRaceTablebaseRequest; item: PromotionRaceTablebaseEvidence; derivation: PromotionRaceTablebaseDerivationReceipt }>
  | Readonly<{ kind: "unavailable"; reason: "outside_tablebase_domain"; request: PromotionRaceTablebaseRequest; invocation: PromotionRaceProviderInvocationReceipt; source: object }>
  | Readonly<{ kind: "unavailable"; reason: "provider_unavailable"; request: PromotionRaceTablebaseRequest; invocation: PromotionRaceProviderInvocationReceipt; providerFailure: object }>
  | Readonly<{ kind: "completed"; reason: "no_opposing_passed_clear_paths"; request: PromotionRaceTablebaseRequest; geometry: object }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained"; request: PromotionRaceTablebaseRequest; missing: readonly ("geometry" | "legal_moves")[] }>;

const results = new WeakSet<PromotionRaceTablebaseResult>();
const sealResult = <T extends PromotionRaceTablebaseResult>(result: T): T => {
  const frozen = Object.freeze(result);
  results.add(frozen);
  return frozen;
};

export function createPromotionRaceReadingResult(
  request: PromotionRaceTablebaseRequest,
  derivation: PromotionRaceTablebaseDerivationReceipt,
): PromotionRaceTablebaseResult {
  if (!requests.has(request) || !derivations.has(derivation) || derivation.request !== request || !outputs.has(derivation.output)) throw new TypeError("READING_RESULT_CROSSING");
  return sealResult({ kind: "reading", request, item: derivation.output, derivation });
}

export function createPromotionRaceOutsideDomainResult(request: PromotionRaceTablebaseRequest, invocation: PromotionRaceProviderInvocationReceipt, source: object): PromotionRaceTablebaseResult {
  if (!requests.has(request) || !invocations.has(invocation) || invocation.request !== request || invocation.resultKind !== "local_domain_result") throw new TypeError("DOMAIN_RESULT_CROSSING");
  return sealResult({ kind: "unavailable", reason: "outside_tablebase_domain", request, invocation, source });
}

export function createPromotionRaceProviderUnavailableResult(request: PromotionRaceTablebaseRequest, invocation: PromotionRaceProviderInvocationReceipt, providerFailure: object): PromotionRaceTablebaseResult {
  if (!requests.has(request) || !invocations.has(invocation) || invocation.request !== request || invocation.resultKind !== "source_failure") throw new TypeError("PROVIDER_RESULT_CROSSING");
  return sealResult({ kind: "unavailable", reason: "provider_unavailable", request, invocation, providerFailure });
}

export function createPromotionRaceInputAbstainedResult(request: PromotionRaceTablebaseRequest, missing: readonly ("geometry" | "legal_moves")[]): PromotionRaceTablebaseResult {
  if (!requests.has(request) || missing.length === 0) throw new TypeError("INPUT_ABSTENTION_INVALID");
  return sealResult({ kind: "unavailable", reason: "input_abstained", request, missing: Object.freeze([...missing]) });
}

export function createPromotionRaceNoEvidenceResult(request: PromotionRaceTablebaseRequest, geometry: object): PromotionRaceTablebaseResult {
  if (!requests.has(request)) throw new TypeError("REQUEST_UNSEALED");
  return sealResult({ kind: "completed", reason: "no_opposing_passed_clear_paths", request, geometry });
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceTablebaseResult {
  if (value === null || typeof value !== "object" || !results.has(value as PromotionRaceTablebaseResult)) throw new TypeError("PROMOTION_RESULT_UNSEALED");
}
