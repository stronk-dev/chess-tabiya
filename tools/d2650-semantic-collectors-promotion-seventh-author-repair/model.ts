// DISPOSABLE executable author model for D2650-D2654. Not production code.
import { assertDeclaredEvidence, declareEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { promotionRaceGeometry, type PawnContactsReading, type PromotionRaceGeometry } from "../../packages/runtime/src/pawn-dynamics.js";
import type { ExactLegalMove } from "../../packages/runtime/src/legal-moves.js";
import type { TablebaseCategory, TablebasePosition } from "../../apps/server/src/tablebase.js";

import {
  assertExactLegalMovesEvidence,
  assertPawnContactsEvidence,
  assertRecordedTablebaseEvidence,
  assertSyzygyProviderResult,
  type CanonicalFullFen,
  type ExactLegalMovesEvidence,
  type PawnContactsEvidence,
  type ProviderRequestDigest,
  type ProviderRequestScope,
  type ProviderSourceFailureReason,
  type RecordedTablebaseEvidence,
  type SyzygyLocalDomainResult,
  type SyzygyProviderDelivery,
  type TypedProviderRequest,
  type TypedProviderResult,
} from "./authorities.js";

export type PromotionRaceGeometryEvidence = DeclaredEvidence<PromotionRaceGeometry>;
export type PromotionRaceGeometryResult =
  | Readonly<{
      kind: "completed";
      output: Readonly<{ kind: "evidence"; input: PawnContactsEvidence; item: PromotionRaceGeometryEvidence }>;
      derivation: PromotionRaceGeometryDerivationReceipt;
    }>
  | Readonly<{
      kind: "completed";
      output: Readonly<{ kind: "no_evidence"; reason: "no_opposing_passed_clear_paths"; input: PawnContactsEvidence }>;
      derivation: PromotionRaceGeometryDerivationReceipt;
    }>
  | Readonly<{
      kind: "unavailable";
      reason: "input_abstained";
      missing: readonly ["contacts"];
      upstreamReason: "not_collected" | "upstream_unavailable";
    }>;
export interface PromotionRaceGeometryDerivationReceipt {
  readonly input: PawnContactsEvidence;
  readonly output: Readonly<{ kind: "evidence"; item: PromotionRaceGeometryEvidence }> | Readonly<{ kind: "no_evidence"; reason: "no_opposing_passed_clear_paths" }>;
}

const GEOMETRY_ITEMS = new WeakSet<object>();
const GEOMETRY_DERIVATIONS = new WeakSet<object>();
const GEOMETRY_COMPLETIONS = new WeakSet<object>();

export function derivePromotionRaceGeometry(contacts: PawnContactsEvidence): PromotionRaceGeometryResult {
  assertPawnContactsEvidence(contacts);
  const result = promotionRaceGeometry(contacts.payload.fen);
  if (result.kind !== "available") {
    const derivation = Object.freeze({ input: contacts, output: Object.freeze({ kind: "no_evidence" as const, reason: "no_opposing_passed_clear_paths" as const }) });
    GEOMETRY_DERIVATIONS.add(derivation);
    const completion = Object.freeze({
      kind: "completed" as const,
      output: Object.freeze({ kind: "no_evidence" as const, reason: "no_opposing_passed_clear_paths" as const, input: contacts }),
      derivation,
    });
    GEOMETRY_COMPLETIONS.add(completion);
    return completion;
  }
  const item = declareEvidence(
    { id: "derived.pawn", version: 1 },
    { id: "derived.pawn.promotion_race_geometry", version: 1 },
    result.value,
  );
  GEOMETRY_ITEMS.add(item);
  const derivation = Object.freeze({ input: contacts, output: Object.freeze({ kind: "evidence" as const, item }) });
  GEOMETRY_DERIVATIONS.add(derivation);
  const completion = Object.freeze({
    kind: "completed" as const,
    output: Object.freeze({ kind: "evidence" as const, input: contacts, item }),
    derivation,
  });
  GEOMETRY_COMPLETIONS.add(completion);
  return completion;
}

export function assertPromotionRaceGeometryEvidence(value: unknown): asserts value is PromotionRaceGeometryEvidence {
  assertDeclaredEvidence(value);
  const item = value as DeclaredEvidence<unknown>;
  if (item.producer.id !== "derived.pawn" || item.producer.version !== 1 || item.projection.id !== "derived.pawn.promotion_race_geometry" || item.projection.version !== 1 || !GEOMETRY_ITEMS.has(value as object)) {
    throw new TypeError("PROMOTION_GEOMETRY_VALUE_RECEIPT_MISSING");
  }
}

export function assertPromotionRaceGeometryCompletion(value: unknown): asserts value is Extract<PromotionRaceGeometryResult, { kind: "completed" }> {
  if (value === null || typeof value !== "object" || !GEOMETRY_COMPLETIONS.has(value as object)) throw new TypeError("PROMOTION_GEOMETRY_COMPLETION_UNSEALED");
  const completion = value as Extract<PromotionRaceGeometryResult, { kind: "completed" }>;
  if (!GEOMETRY_DERIVATIONS.has(completion.derivation) || completion.derivation.input !== completion.output.input) throw new TypeError("PROMOTION_GEOMETRY_COMPLETION_CROSSED");
  assertPawnContactsEvidence(completion.output.input);
  if (completion.output.kind === "evidence") {
    assertPromotionRaceGeometryEvidence(completion.output.item);
    if (completion.derivation.output.kind !== "evidence" || completion.derivation.output.item !== completion.output.item || completion.output.item.payload.fen !== completion.output.input.payload.fen) {
      throw new TypeError("PROMOTION_GEOMETRY_COMPLETION_CROSSED");
    }
  } else if (completion.derivation.output.kind !== "no_evidence") {
    throw new TypeError("PROMOTION_GEOMETRY_COMPLETION_CROSSED");
  }
}

export interface PromotionRaceTablebaseRequest {
  readonly geometry: PromotionRaceGeometryResult;
  readonly providerScope: ProviderRequestScope;
  readonly signal: AbortSignal;
}
const REQUESTS = new WeakSet<object>();
export function createPromotionRaceTablebaseRequest(
  geometry: PromotionRaceGeometryResult,
  providerScope: ProviderRequestScope,
  signal: AbortSignal,
): PromotionRaceTablebaseRequest {
  if (geometry.kind === "completed") assertPromotionRaceGeometryCompletion(geometry);
  if (providerScope.id.trim().length === 0 || !Number.isSafeInteger(providerScope.budgetMs) || providerScope.budgetMs <= 0) throw new TypeError("PROVIDER_SCOPE_INVALID");
  const request = Object.freeze({ geometry, providerScope: Object.freeze({ ...providerScope }), signal });
  REQUESTS.add(request);
  return request;
}

export function makePromotionRaceSyzygyRequest(request: PromotionRaceTablebaseRequest): TypedProviderRequest<"syzygy.position@1"> {
  if (!REQUESTS.has(request) || request.geometry.kind !== "completed" || request.geometry.output.kind !== "evidence") throw new TypeError("PROMOTION_REQUEST_HAS_NO_GEOMETRY");
  return Object.freeze({
    operation: "syzygy.position@1" as const,
    request: Object.freeze({
      rules: "chess" as const,
      variant: "standard" as const,
      fen: request.geometry.output.item.payload.fen as CanonicalFullFen,
      timeoutMs: Math.min(request.providerScope.budgetMs, 500),
    }),
  });
}

export interface PromotionRaceProviderInvocationReceipt {
  readonly request: TypedProviderRequest<"syzygy.position@1">;
  readonly requestDigest: ProviderRequestDigest;
  readonly result: TypedProviderResult<"syzygy.position@1">;
}
const INVOCATIONS = new WeakSet<object>();
export function createPromotionRaceProviderInvocation(
  request: TypedProviderRequest<"syzygy.position@1">,
  result: TypedProviderResult<"syzygy.position@1">,
): PromotionRaceProviderInvocationReceipt {
  assertSyzygyProviderResult(result);
  if (result.operation !== request.operation || result.normalizedRequestDigest.trim().length === 0) throw new TypeError("PROMOTION_PROVIDER_RESULT_CROSSED");
  if (result.kind === "success" && (result.delivery.acquisition.operation !== request.operation || result.delivery.acquisition.normalizedRequestDigest !== result.normalizedRequestDigest || result.delivery.payload.fen !== request.request.fen)) {
    throw new TypeError("PROMOTION_PROVIDER_DELIVERY_CROSSED");
  }
  const receipt = Object.freeze({ request, requestDigest: result.normalizedRequestDigest, result });
  INVOCATIONS.add(receipt);
  return receipt;
}

export type PromotionRaceTablebaseSource =
  | Readonly<{ kind: "recorded"; evidence: RecordedTablebaseEvidence }>
  | Readonly<{
      kind: "live";
      evidence: DeclaredEvidence<SyzygyProviderDelivery>;
      invocation: PromotionRaceProviderInvocationReceipt;
    }>;
const SOURCES = new WeakSet<object>();

export function createRecordedTablebaseSource(evidence: RecordedTablebaseEvidence): PromotionRaceTablebaseSource {
  assertRecordedTablebaseEvidence(evidence);
  const source = Object.freeze({ kind: "recorded" as const, evidence });
  SOURCES.add(source);
  return source;
}

export function createLiveTablebaseSource(invocation: PromotionRaceProviderInvocationReceipt): PromotionRaceTablebaseSource {
  if (!INVOCATIONS.has(invocation) || invocation.result.kind !== "success") throw new TypeError("PROMOTION_LIVE_INVOCATION_INVALID");
  const deliveryEvidence = declareEvidence(
    { id: "live.syzygy", version: 1 },
    { id: "live.syzygy.position_result", version: 1 },
    invocation.result.delivery,
  );
  const source = Object.freeze({
    kind: "live" as const,
    evidence: deliveryEvidence,
    invocation,
  });
  SOURCES.add(source);
  return source;
}

function sourcePosition(source: PromotionRaceTablebaseSource): Readonly<{
  fen: CanonicalFullFen;
  category: TablebaseCategory;
  dtz: number | null;
  preciseDtz: number | null;
  perspective: "side_to_move";
}> {
  if (!SOURCES.has(source)) throw new TypeError("PROMOTION_TABLEBASE_SOURCE_UNSEALED");
  const fen = source.kind === "recorded" ? source.evidence.payload.fen : source.evidence.payload.payload.fen;
  const position = source.kind === "recorded" ? source.evidence.payload.position : source.evidence.payload.payload.position;
  return Object.freeze({ fen, category: position.category, dtz: position.dtz, preciseDtz: position.preciseDtz ?? null, perspective: "side_to_move" as const });
}

export interface PromotionRaceTablebaseValue {
  readonly fen: CanonicalFullFen;
  readonly perspective: "side_to_move";
  readonly geometry: PromotionRaceGeometry;
  readonly source: PromotionRaceTablebaseSource;
  readonly category: TablebaseCategory;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly immediatePromotion: readonly ExactLegalMove[];
  readonly promotionFirst: PromotionRaceGeometry["ordering"][number]["pawns"];
}
export type PromotionRaceTablebaseEvidence = DeclaredEvidence<PromotionRaceTablebaseValue>;
export interface PromotionRaceTablebaseValueReceipt {
  readonly factory: "createDerivedPawnPromotionRaceTablebaseV1Evidence";
  readonly request: PromotionRaceTablebaseRequest;
  readonly geometry: PromotionRaceGeometryEvidence;
  readonly legalMoves: ExactLegalMovesEvidence;
  readonly source: PromotionRaceTablebaseSource;
  readonly output: PromotionRaceTablebaseEvidence;
}
export interface PromotionRaceTablebaseDerivationReceipt extends PromotionRaceTablebaseValueReceipt {
  readonly valueReceipt: PromotionRaceTablebaseValueReceipt;
}
const OUTPUTS = new WeakSet<object>();
const VALUE_RECEIPTS = new WeakSet<object>();
const DERIVATIONS = new WeakSet<object>();

export function createDerivedPawnPromotionRaceTablebaseV1Evidence(input: Readonly<{
  request: PromotionRaceTablebaseRequest;
  geometry: PromotionRaceGeometryEvidence;
  legalMoves: ExactLegalMovesEvidence;
  source: PromotionRaceTablebaseSource;
}>): PromotionRaceTablebaseDerivationReceipt {
  if (!REQUESTS.has(input.request) || input.request.geometry.kind !== "completed" || input.request.geometry.output.kind !== "evidence" || input.request.geometry.output.item !== input.geometry) throw new TypeError("PROMOTION_REQUEST_GEOMETRY_CROSSED");
  assertPromotionRaceGeometryEvidence(input.geometry);
  assertExactLegalMovesEvidence(input.legalMoves);
  const position = sourcePosition(input.source);
  if (input.geometry.payload.fen !== input.legalMoves.payload.fen || input.geometry.payload.fen !== position.fen) throw new TypeError("PROMOTION_INPUT_FEN_MISMATCH");
  const immediatePromotion = Object.freeze(input.legalMoves.payload.pieces.flatMap((piece) => piece.moves.filter((move) => move.promotion !== undefined)));
  const promotionFirst = Object.freeze([...(input.geometry.payload.ordering[0]?.pawns ?? [])]);
  const value = Object.freeze({
    fen: position.fen,
    perspective: position.perspective,
    geometry: input.geometry.payload,
    source: input.source,
    category: position.category,
    dtz: position.dtz,
    preciseDtz: position.preciseDtz,
    immediatePromotion,
    promotionFirst,
  });
  const output = declareEvidence(
    { id: "derived.pawn", version: 1 },
    { id: "derived.pawn.promotion_race_tablebase", version: 1 },
    value,
  );
  OUTPUTS.add(output);
  const valueReceipt = Object.freeze({ factory: "createDerivedPawnPromotionRaceTablebaseV1Evidence" as const, request: input.request, geometry: input.geometry, legalMoves: input.legalMoves, source: input.source, output });
  VALUE_RECEIPTS.add(valueReceipt);
  const derivation = Object.freeze({ ...valueReceipt, valueReceipt });
  DERIVATIONS.add(derivation);
  return derivation;
}

export function assertPromotionRaceTablebaseDerivation(value: unknown): asserts value is PromotionRaceTablebaseDerivationReceipt {
  if (value === null || typeof value !== "object" || !DERIVATIONS.has(value as object)) throw new TypeError("PROMOTION_TABLEBASE_DERIVATION_UNSEALED");
  const derivation = value as PromotionRaceTablebaseDerivationReceipt;
  if (!VALUE_RECEIPTS.has(derivation.valueReceipt) || derivation.valueReceipt.output !== derivation.output || !OUTPUTS.has(derivation.output)) throw new TypeError("PROMOTION_VALUE_RECEIPT_CROSSED");
  assertDeclaredEvidence(derivation.output);
}

export type PromotionRaceTablebaseResult =
  | Readonly<{ kind: "reading"; request: PromotionRaceTablebaseRequest; item: PromotionRaceTablebaseEvidence; derivation: PromotionRaceTablebaseDerivationReceipt }>
  | Readonly<{ kind: "unavailable"; reason: "outside_tablebase_domain"; request: PromotionRaceTablebaseRequest; geometry: PromotionRaceGeometryEvidence; source: DeclaredEvidence<SyzygyLocalDomainResult>; requestDigest: ProviderRequestDigest; invocation: PromotionRaceProviderInvocationReceipt }>
  | Readonly<{ kind: "unavailable"; reason: "provider_unavailable"; request: PromotionRaceTablebaseRequest; geometry: PromotionRaceGeometryEvidence; operation: "syzygy.position@1"; requestDigest: ProviderRequestDigest; providerReason: ProviderSourceFailureReason; invocation: PromotionRaceProviderInvocationReceipt }>
  | Readonly<{ kind: "completed"; request: PromotionRaceTablebaseRequest; output: Extract<Extract<PromotionRaceGeometryResult, { kind: "completed" }>["output"], { kind: "no_evidence" }> }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained"; request: PromotionRaceTablebaseRequest; missing: readonly ("geometry" | "legal_moves")[] }>;
const RESULTS = new WeakSet<object>();
const sealResult = <T extends PromotionRaceTablebaseResult>(value: T): T => { RESULTS.add(value); return value; };

export function createPromotionRaceReadingResult(request: PromotionRaceTablebaseRequest, derivation: PromotionRaceTablebaseDerivationReceipt): PromotionRaceTablebaseResult {
  if (!REQUESTS.has(request) || derivation.request !== request) throw new TypeError("PROMOTION_READING_RESULT_CROSSED");
  assertPromotionRaceTablebaseDerivation(derivation);
  return sealResult(Object.freeze({ kind: "reading" as const, request, item: derivation.output, derivation }));
}

export function createPromotionRaceOutsideDomainResult(request: PromotionRaceTablebaseRequest, geometry: PromotionRaceGeometryEvidence, invocation: PromotionRaceProviderInvocationReceipt): PromotionRaceTablebaseResult {
  if (!REQUESTS.has(request) || !INVOCATIONS.has(invocation) || invocation.result.kind !== "local_domain_result" || request.geometry.kind !== "completed" || request.geometry.output.kind !== "evidence" || request.geometry.output.item !== geometry) throw new TypeError("PROMOTION_DOMAIN_RESULT_CROSSED");
  const source = declareEvidence({ id: "rules.endgame", version: 1 }, { id: "rules.endgame.tablebase_domain", version: 1 }, invocation.result);
  return sealResult(Object.freeze({ kind: "unavailable" as const, reason: "outside_tablebase_domain" as const, request, geometry, source, requestDigest: invocation.requestDigest, invocation }));
}

export function createPromotionRaceProviderUnavailableResult(request: PromotionRaceTablebaseRequest, geometry: PromotionRaceGeometryEvidence, invocation: PromotionRaceProviderInvocationReceipt): PromotionRaceTablebaseResult {
  if (!REQUESTS.has(request) || !INVOCATIONS.has(invocation) || invocation.result.kind !== "source_failure" || request.geometry.kind !== "completed" || request.geometry.output.kind !== "evidence" || request.geometry.output.item !== geometry) throw new TypeError("PROMOTION_PROVIDER_RESULT_CROSSED");
  return sealResult(Object.freeze({ kind: "unavailable" as const, reason: "provider_unavailable" as const, request, geometry, operation: "syzygy.position@1" as const, requestDigest: invocation.requestDigest, providerReason: invocation.result.reason, invocation }));
}

export function createPromotionRaceNoEvidenceResult(request: PromotionRaceTablebaseRequest): PromotionRaceTablebaseResult {
  if (!REQUESTS.has(request) || request.geometry.kind !== "completed" || request.geometry.output.kind !== "no_evidence") throw new TypeError("PROMOTION_NO_EVIDENCE_COMPLETION_REQUIRED");
  assertPromotionRaceGeometryCompletion(request.geometry);
  return sealResult(Object.freeze({ kind: "completed" as const, request, output: request.geometry.output }));
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceTablebaseResult {
  if (value === null || typeof value !== "object" || !RESULTS.has(value as object)) throw new TypeError("PROMOTION_RESULT_UNSEALED");
  const result = value as PromotionRaceTablebaseResult;
  if (!REQUESTS.has(result.request)) throw new TypeError("PROMOTION_RESULT_REQUEST_UNSEALED");
  if (result.kind === "reading") assertPromotionRaceTablebaseDerivation(result.derivation);
  if (result.kind === "completed") assertPromotionRaceGeometryCompletion(result.request.geometry);
  if (result.kind === "unavailable" && result.reason !== "input_abstained" && (!INVOCATIONS.has(result.invocation) || result.invocation.requestDigest !== result.requestDigest)) throw new TypeError("PROMOTION_RESULT_INVOCATION_CROSSED");
}

export type { CanonicalFullFen, ExactLegalMovesEvidence, PawnContactsEvidence, ProviderRequestDigest, ProviderRequestScope, TypedProviderRequest, TypedProviderResult } from "./authorities.js";
export type { PawnContactsReading };
