// DISPOSABLE complete-transaction author model for D2693-D2700. Not production code.
import { createHash } from "node:crypto";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { declareEvidence, assertDeclaredEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { exactMoveIdentity, type ExactLegalMove } from "../../packages/runtime/src/legal-moves.js";
import type { PawnIdentity, PromotionRaceGeometry } from "../../packages/runtime/src/pawn-dynamics.js";
import { parseTablebasePosition, type TablebaseCategory, type TablebasePosition } from "../../apps/server/src/tablebase.js";
import { countFenPieces } from "../../apps/server/src/sourcing/chess-facts.js";

import {
  assertExactLegalMovesEvidence,
  createRulesMobilityReadingLegalMovesV1Evidence,
  type CanonicalFullFen,
  type ExactLegalMovesEvidence,
  type PawnContactsEvidence,
  type ProviderRequestScope,
  type ProviderSourceFailureReason,
} from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceGeometryCompletion,
  assertPromotionRaceGeometryEvidence,
  derivePromotionRaceGeometry as deriveAvailablePromotionRaceGeometry,
  type PromotionRaceGeometryEvidence,
  type PromotionRaceGeometryResult as AvailablePromotionRaceGeometryResult,
} from "../d2650-semantic-collectors-promotion-seventh-author-repair/model.js";

function canonicalFullFen(value: string): CanonicalFullFen {
  const rendered = canonicalFen(positionFromFen(value));
  if (rendered !== value) throw new TypeError("CANONICAL_FULL_FEN_REQUIRED");
  return value as CanonicalFullFen;
}

function immutableCopy<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(immutableCopy)) as T;
  return Object.freeze(Object.fromEntries(Reflect.ownKeys(value as object).map((key) => {
    if (typeof key !== "string") throw new TypeError("SYMBOL_PROPERTY_REFUSED");
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError("ACCESSOR_PROPERTY_REFUSED");
    return [key, immutableCopy(descriptor.value)];
  }))) as T;
}

function digest(value: unknown): ProviderRequestDigest {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}` as ProviderRequestDigest;
}

export type ProviderRequestDigest = `sha256:${string}` & { readonly __providerRequestDigest: true };

export interface PromotionRaceContactsUnavailable {
  readonly kind: "unavailable";
  readonly reason: "not_collected" | "upstream_unavailable";
}
const CONTACTS_UNAVAILABLE = new WeakSet<object>();
export function createPromotionRaceContactsUnavailable(reason: PromotionRaceContactsUnavailable["reason"]): PromotionRaceContactsUnavailable {
  const result = Object.freeze({ kind: "unavailable" as const, reason });
  CONTACTS_UNAVAILABLE.add(result);
  return result;
}

export type PromotionRaceContactsInput =
  | Readonly<{ kind: "evidence"; evidence: PawnContactsEvidence }>
  | PromotionRaceContactsUnavailable;
export type PromotionRaceGeometryResult = AvailablePromotionRaceGeometryResult;
const GEOMETRY_UNAVAILABLE = new WeakSet<object>();

export function derivePromotionRaceGeometry(input: PromotionRaceContactsInput): PromotionRaceGeometryResult {
  if (input.kind === "evidence") return deriveAvailablePromotionRaceGeometry(input.evidence);
  if (!CONTACTS_UNAVAILABLE.has(input)) throw new TypeError("PROMOTION_CONTACTS_UNAVAILABLE_UNSEALED");
  const result = Object.freeze({
    kind: "unavailable" as const,
    reason: "input_abstained" as const,
    missing: Object.freeze(["contacts"] as const),
    upstreamReason: input.reason,
  });
  GEOMETRY_UNAVAILABLE.add(result);
  return result;
}

function assertGeometryResult(value: PromotionRaceGeometryResult): void {
  if (value.kind === "completed") assertPromotionRaceGeometryCompletion(value);
  else if (!GEOMETRY_UNAVAILABLE.has(value)) throw new TypeError("PROMOTION_GEOMETRY_UNAVAILABLE_UNSEALED");
}

export interface SourcingLedgerTablebaseRecord {
  readonly kind: "tablebase_result";
  readonly fen: CanonicalFullFen;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly values: TablebasePosition;
}
export type SourcingLedgerTablebaseEvidence = DeclaredEvidence<SourcingLedgerTablebaseRecord>;
const LEDGER_TABLEBASE = new WeakSet<object>();

function validateTablebaseMoves(fen: CanonicalFullFen, position: TablebasePosition): void {
  for (const move of position.moves) {
    if (exactMoveIdentity(fen, move.uci) !== move.uci) throw new TypeError("TABLEBASE_MOVE_IDENTITY_INVALID");
  }
}

export function createSourcingLedgerTablebaseResultV1Evidence(input: Readonly<{
  fen: string;
  sourceId: string;
  retrievedAt: string;
  rawPosition: unknown;
}>): SourcingLedgerTablebaseEvidence {
  const fen = canonicalFullFen(input.fen);
  if (input.sourceId.trim() === "" || Number.isNaN(Date.parse(input.retrievedAt)) || new Date(input.retrievedAt).toISOString() !== input.retrievedAt) throw new TypeError("TABLEBASE_RECORD_IDENTITY_INVALID");
  const values = immutableCopy(parseTablebasePosition(input.rawPosition));
  validateTablebaseMoves(fen, values);
  const evidence = declareEvidence(
    { id: "sourcing.ledger", version: 1 },
    { id: "sourcing.ledger.tablebase_result", version: 1 },
    immutableCopy({ kind: "tablebase_result" as const, fen, sourceId: input.sourceId, retrievedAt: input.retrievedAt, values }),
  );
  LEDGER_TABLEBASE.add(evidence);
  return evidence;
}

export type RecordedTablebaseEvidence = DeclaredEvidence<SourcingLedgerTablebaseRecord>;
export interface RecordedTablebaseValueReceipt {
  readonly source: SourcingLedgerTablebaseEvidence;
  readonly sourceDigest: `sha256:${string}`;
  readonly output: RecordedTablebaseEvidence;
}
const RECORDED_TABLEBASE = new WeakSet<object>();
const RECORDED_RECEIPTS = new WeakMap<object, RecordedTablebaseValueReceipt>();

export function createRecordedTablebaseResultV1Evidence(source: SourcingLedgerTablebaseEvidence): RecordedTablebaseEvidence {
  assertDeclaredEvidence(source);
  if (!LEDGER_TABLEBASE.has(source)) throw new TypeError("SOURCING_LEDGER_TABLEBASE_RECEIPT_MISSING");
  const output = declareEvidence(
    { id: "recorded.tablebase", version: 1 },
    { id: "recorded.tablebase.result", version: 1 },
    source.payload,
  );
  const receipt = Object.freeze({ source, sourceDigest: digest(source.payload), output });
  RECORDED_TABLEBASE.add(output);
  RECORDED_RECEIPTS.set(output, receipt);
  return output;
}

export function recordedTablebaseValueReceipt(evidence: RecordedTablebaseEvidence): RecordedTablebaseValueReceipt {
  const receipt = RECORDED_RECEIPTS.get(evidence);
  if (receipt === undefined) throw new TypeError("RECORDED_TABLEBASE_VALUE_RECEIPT_MISSING");
  return receipt;
}

function assertRecordedTablebaseEvidence(value: unknown): asserts value is RecordedTablebaseEvidence {
  assertDeclaredEvidence(value);
  if (!RECORDED_TABLEBASE.has(value as object)) throw new TypeError("RECORDED_TABLEBASE_VALUE_RECEIPT_MISSING");
  const receipt = RECORDED_RECEIPTS.get(value as object);
  if (receipt === undefined || receipt.output !== value || !LEDGER_TABLEBASE.has(receipt.source) || receipt.source.payload !== (value as RecordedTablebaseEvidence).payload) {
    throw new TypeError("RECORDED_TABLEBASE_VALUE_RECEIPT_CROSSED");
  }
}

export type RecordedTablebaseEvidenceLookupResult =
  | Readonly<{ kind: "found"; evidence: RecordedTablebaseEvidence }>
  | Readonly<{ kind: "absent" }>
  | Readonly<{ kind: "failed"; reason: "storage_unavailable" | "invalid_record" }>;
export interface RecordedTablebaseEvidenceLookup {
  get(fen: CanonicalFullFen): RecordedTablebaseEvidenceLookupResult;
}
const RECORDED_LOOKUPS = new WeakSet<object>();
export function createRecordedTablebaseLookup(entries: readonly RecordedTablebaseEvidence[], calls?: string[]): RecordedTablebaseEvidenceLookup {
  const byFen = new Map<string, RecordedTablebaseEvidence>();
  for (const entry of entries) {
    assertRecordedTablebaseEvidence(entry);
    if (byFen.has(entry.payload.fen)) throw new TypeError("RECORDED_TABLEBASE_DUPLICATE_FEN");
    byFen.set(entry.payload.fen, entry);
  }
  const lookup = Object.freeze({
    get(fen: CanonicalFullFen) {
      calls?.push(`recorded:${fen}`);
      const evidence = byFen.get(fen);
      return evidence === undefined ? Object.freeze({ kind: "absent" as const }) : Object.freeze({ kind: "found" as const, evidence });
    },
  });
  RECORDED_LOOKUPS.add(lookup);
  return lookup;
}

export interface SyzygyPositionRequest {
  readonly rules: "chess";
  readonly variant: "standard";
  readonly fen: CanonicalFullFen;
  readonly timeoutMs: number;
}
export type TypedProviderRequest = Readonly<{ operation: "syzygy.position@1"; request: SyzygyPositionRequest }>;
export interface SyzygyOutsideDomain { readonly kind: "outside_domain"; readonly reason: "piece_count"; readonly pieceCount: number; readonly maximumPieceCount: 7 }
export interface LiveSyzygyPosition { readonly fen: CanonicalFullFen; readonly position: TablebasePosition }
export interface SyzygyProviderDelivery {
  readonly kind: "live";
  readonly servedAt: string;
  readonly cacheIdentity: null;
  readonly acquisition: Readonly<{
    operation: "syzygy.position@1";
    normalizedRequestDigest: ProviderRequestDigest;
    requestedAt: string;
    retrievedAt: string;
    responseDigest: `sha256:${string}`;
  }>;
  readonly payload: LiveSyzygyPosition;
  readonly payloadReceipt: Readonly<{
    operation: "syzygy.position@1";
    parser: "parse.syzygy_position@1";
    responseDigest: `sha256:${string}`;
    payloadDigest: `sha256:${string}`;
  }>;
}
export type TypedProviderResult =
  | Readonly<{ kind: "success"; operation: "syzygy.position@1"; normalizedRequestDigest: ProviderRequestDigest; delivery: SyzygyProviderDelivery }>
  | Readonly<{ kind: "local_domain_result"; operation: "syzygy.position@1"; normalizedRequestDigest: ProviderRequestDigest; observedAt: string; payload: SyzygyOutsideDomain }>
  | Readonly<{ kind: "source_failure"; operation: "syzygy.position@1"; normalizedRequestDigest: ProviderRequestDigest; failedAt: string; reason: ProviderSourceFailureReason }>;

export type SyzygyFixtureOutcome =
  | Readonly<{ kind: "success"; rawPosition: unknown }>
  | Readonly<{ kind: "local_domain_result"; pieceCount: number }>
  | Readonly<{ kind: "source_failure"; reason: ProviderSourceFailureReason }>;
export interface ProviderExchangeScheduler {
  normalizedRequestDigest(request: TypedProviderRequest): ProviderRequestDigest;
  get(request: TypedProviderRequest, scope: ProviderRequestScope, signal: AbortSignal): Promise<TypedProviderResult>;
}
const SCHEDULERS = new WeakSet<object>();
const PROVIDER_RESULTS = new WeakSet<object>();
const PROVIDER_DELIVERIES = new WeakSet<object>();

function requestDigest(request: TypedProviderRequest): ProviderRequestDigest {
  return digest({ operation: request.operation, provider: "syzygy", requestedIdentity: { request: request.request } });
}

export function createSyzygyFixtureScheduler(
  outcome: (request: TypedProviderRequest) => SyzygyFixtureOutcome,
  calls?: string[],
): ProviderExchangeScheduler {
  const scheduler: ProviderExchangeScheduler = Object.freeze({
    normalizedRequestDigest(request: TypedProviderRequest) {
      calls?.push(`digest:${request.request.fen}:${request.request.timeoutMs}`);
      return requestDigest(request);
    },
    async get(request: TypedProviderRequest, scope: ProviderRequestScope, signal: AbortSignal) {
      calls?.push(`provider:${request.request.fen}:${request.request.timeoutMs}`);
      if (!Number.isSafeInteger(scope.budgetMs) || scope.budgetMs <= 0 || scope.id.trim() === "") throw new TypeError("PROVIDER_SCOPE_INVALID");
      const normalizedRequestDigest = requestDigest(request);
      const now = "2026-09-05T00:00:00.000Z";
      const selected: SyzygyFixtureOutcome = signal.aborted ? { kind: "source_failure", reason: "cancelled" } : outcome(request);
      let result: TypedProviderResult;
      if (selected.kind === "source_failure") {
        result = immutableCopy({ kind: "source_failure" as const, operation: request.operation, normalizedRequestDigest, failedAt: now, reason: selected.reason });
      } else if (selected.kind === "local_domain_result") {
        const actualPieceCount = countFenPieces(request.request.fen);
        if (!Number.isSafeInteger(selected.pieceCount) || selected.pieceCount !== actualPieceCount || actualPieceCount <= 7) {
          result = immutableCopy({ kind: "source_failure" as const, operation: request.operation, normalizedRequestDigest, failedAt: now, reason: "identity_mismatch" as const });
        } else {
          result = immutableCopy({
            kind: "local_domain_result" as const,
            operation: request.operation,
            normalizedRequestDigest,
            observedAt: now,
            payload: { kind: "outside_domain" as const, reason: "piece_count" as const, pieceCount: actualPieceCount, maximumPieceCount: 7 as const },
          });
        }
      } else {
        try {
          const position = immutableCopy(parseTablebasePosition(selected.rawPosition));
          validateTablebaseMoves(request.request.fen, position);
          const responseDigest = digest(selected.rawPosition);
          const payload = immutableCopy({ fen: request.request.fen, position });
          const delivery: SyzygyProviderDelivery = immutableCopy({
            kind: "live" as const,
            servedAt: now,
            cacheIdentity: null,
            acquisition: { operation: request.operation, normalizedRequestDigest, requestedAt: now, retrievedAt: now, responseDigest },
            payload,
            payloadReceipt: { operation: request.operation, parser: "parse.syzygy_position@1" as const, responseDigest, payloadDigest: digest(payload) },
          });
          PROVIDER_DELIVERIES.add(delivery);
          result = Object.freeze({ kind: "success" as const, operation: request.operation, normalizedRequestDigest, delivery });
        } catch {
          result = immutableCopy({ kind: "source_failure" as const, operation: request.operation, normalizedRequestDigest, failedAt: now, reason: "invalid_response" as const });
        }
      }
      PROVIDER_RESULTS.add(result);
      return result;
    },
  });
  SCHEDULERS.add(scheduler);
  return scheduler;
}

function assertProviderResult(value: unknown): asserts value is TypedProviderResult {
  if (value === null || typeof value !== "object" || !PROVIDER_RESULTS.has(value)) throw new TypeError("PROVIDER_RESULT_UNSEALED");
}
function assertProviderDelivery(value: unknown): asserts value is SyzygyProviderDelivery {
  if (value === null || typeof value !== "object" || !PROVIDER_DELIVERIES.has(value)) throw new TypeError("PROVIDER_DELIVERY_UNSEALED");
}

export interface ProviderSourceFactories {
  readonly "syzygy.position@1": Readonly<{
    make(delivery: SyzygyProviderDelivery): DeclaredEvidence<SyzygyProviderDelivery>;
  }>;
}
const SOURCE_FACTORIES = new WeakSet<object>();
const LIVE_EVIDENCE = new WeakSet<object>();
const DOMAIN_EVIDENCE = new WeakSet<object>();
export function createProviderSourceFactories(): ProviderSourceFactories {
  const factories = Object.freeze({
    "syzygy.position@1": Object.freeze({
      make(delivery: SyzygyProviderDelivery) {
        assertProviderDelivery(delivery);
        const evidence = declareEvidence(
          { id: "live.syzygy", version: 1 },
          { id: "live.syzygy.position_result", version: 1 },
          delivery,
        );
        LIVE_EVIDENCE.add(evidence);
        return evidence;
      },
    }),
  });
  SOURCE_FACTORIES.add(factories);
  return factories;
}

function declareSyzygyTablebaseDomainEvidence(result: Extract<TypedProviderResult, { kind: "local_domain_result" }>): DeclaredEvidence<TypedProviderResult> {
  assertProviderResult(result);
  const evidence = declareEvidence(
    { id: "rules.endgame", version: 1 },
    { id: "rules.endgame.tablebase_domain", version: 1 },
    result,
  );
  DOMAIN_EVIDENCE.add(evidence);
  return evidence;
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
  assertGeometryResult(geometry);
  if (providerScope.id.trim() === "" || !Number.isSafeInteger(providerScope.budgetMs) || providerScope.budgetMs <= 0) throw new TypeError("PROVIDER_SCOPE_INVALID");
  const request = Object.freeze({ geometry, providerScope: Object.freeze({ ...providerScope }), signal });
  REQUESTS.add(request);
  return request;
}

export function makePromotionRaceSyzygyRequest(fen: CanonicalFullFen, scope: ProviderRequestScope): TypedProviderRequest {
  return immutableCopy({
    operation: "syzygy.position@1" as const,
    request: { rules: "chess" as const, variant: "standard" as const, fen, timeoutMs: Math.min(scope.budgetMs, 500) },
  });
}

export interface PromotionRaceProviderInvocationReceipt {
  readonly request: TypedProviderRequest;
  readonly requestDigest: ProviderRequestDigest;
  readonly result: TypedProviderResult;
}
const INVOCATIONS = new WeakSet<object>();
function createInvocation(request: TypedProviderRequest, expected: ProviderRequestDigest, result: TypedProviderResult): PromotionRaceProviderInvocationReceipt {
  assertProviderResult(result);
  if (result.operation !== request.operation || result.normalizedRequestDigest !== expected) throw new TypeError("PROMOTION_PROVIDER_RESULT_CROSSED");
  if (result.kind === "success") {
    assertProviderDelivery(result.delivery);
    if (result.delivery.acquisition.normalizedRequestDigest !== expected || result.delivery.payload.fen !== request.request.fen) throw new TypeError("PROMOTION_PROVIDER_DELIVERY_CROSSED");
  }
  const invocation = Object.freeze({ request, requestDigest: expected, result });
  INVOCATIONS.add(invocation);
  return invocation;
}

export type PromotionRaceTablebaseSource =
  | Readonly<{ kind: "recorded"; evidence: RecordedTablebaseEvidence }>
  | Readonly<{ kind: "live"; evidence: DeclaredEvidence<SyzygyProviderDelivery>; invocation: PromotionRaceProviderInvocationReceipt }>;
const SOURCES = new WeakSet<object>();
function recordedSource(evidence: RecordedTablebaseEvidence): PromotionRaceTablebaseSource {
  assertRecordedTablebaseEvidence(evidence);
  const source = Object.freeze({ kind: "recorded" as const, evidence });
  SOURCES.add(source);
  return source;
}
function liveSource(evidence: DeclaredEvidence<SyzygyProviderDelivery>, invocation: PromotionRaceProviderInvocationReceipt): PromotionRaceTablebaseSource {
  assertDeclaredEvidence(evidence);
  if (!LIVE_EVIDENCE.has(evidence) || !INVOCATIONS.has(invocation) || invocation.result.kind !== "success" || evidence.payload !== invocation.result.delivery) throw new TypeError("PROMOTION_LIVE_SOURCE_CROSSED");
  const source = Object.freeze({ kind: "live" as const, evidence, invocation });
  SOURCES.add(source);
  return source;
}

function sourcePosition(source: PromotionRaceTablebaseSource): Readonly<{ fen: CanonicalFullFen; position: TablebasePosition }> {
  if (!SOURCES.has(source)) throw new TypeError("PROMOTION_SOURCE_UNSEALED");
  return source.kind === "recorded"
    ? Object.freeze({ fen: source.evidence.payload.fen, position: source.evidence.payload.values })
    : Object.freeze({ fen: source.evidence.payload.payload.fen, position: source.evidence.payload.payload.position });
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
  readonly promotionFirst: readonly PawnIdentity[];
}
export type PromotionRaceTablebaseEvidence = DeclaredEvidence<PromotionRaceTablebaseValue>;
export interface PromotionRaceTablebaseDerivationReceipt {
  readonly request: PromotionRaceTablebaseRequest;
  readonly geometry: PromotionRaceGeometryEvidence;
  readonly legalMoves: ExactLegalMovesEvidence;
  readonly source: PromotionRaceTablebaseSource;
  readonly output: PromotionRaceTablebaseEvidence;
}
const DERIVATIONS = new WeakSet<object>();
const OUTPUTS = new WeakSet<object>();

function createDerivedEvidence(input: Readonly<{
  request: PromotionRaceTablebaseRequest;
  geometry: PromotionRaceGeometryEvidence;
  legalMoves: ExactLegalMovesEvidence;
  source: PromotionRaceTablebaseSource;
}>): PromotionRaceTablebaseDerivationReceipt {
  if (!REQUESTS.has(input.request) || input.request.geometry.kind !== "completed" || input.request.geometry.output.kind !== "evidence" || input.request.geometry.output.item !== input.geometry) throw new TypeError("PROMOTION_REQUEST_GEOMETRY_CROSSED");
  assertPromotionRaceGeometryEvidence(input.geometry);
  assertExactLegalMovesEvidence(input.legalMoves);
  const selected = sourcePosition(input.source);
  if (input.geometry.payload.fen !== input.legalMoves.payload.fen || input.geometry.payload.fen !== selected.fen) throw new TypeError("PROMOTION_INPUT_FEN_MISMATCH");
  const immediatePromotion = Object.freeze(input.legalMoves.payload.pieces.flatMap((piece) => piece.moves.filter((move) => move.promotion !== undefined)));
  const promotionFirst = input.geometry.payload.ordering[0]?.pawns ?? Object.freeze([]);
  const output = declareEvidence(
    { id: "derived.pawn", version: 1 },
    { id: "derived.pawn.promotion_race_tablebase", version: 1 },
    Object.freeze({
      fen: selected.fen,
      perspective: "side_to_move" as const,
      geometry: input.geometry.payload,
      source: input.source,
      category: selected.position.category,
      dtz: selected.position.dtz,
      preciseDtz: selected.position.preciseDtz ?? null,
      immediatePromotion,
      promotionFirst,
    }),
  );
  OUTPUTS.add(output);
  const receipt = Object.freeze({ ...input, output });
  DERIVATIONS.add(receipt);
  return receipt;
}

function assertDerivation(value: unknown): asserts value is PromotionRaceTablebaseDerivationReceipt {
  if (value === null || typeof value !== "object" || !DERIVATIONS.has(value)) throw new TypeError("PROMOTION_DERIVATION_UNSEALED");
  const receipt = value as PromotionRaceTablebaseDerivationReceipt;
  if (!OUTPUTS.has(receipt.output) || receipt.output.payload.geometry !== receipt.geometry.payload || receipt.output.payload.source !== receipt.source || receipt.request.geometry.kind !== "completed" || receipt.request.geometry.output.kind !== "evidence" || receipt.request.geometry.output.item !== receipt.geometry) throw new TypeError("PROMOTION_DERIVATION_CROSSED");
}

export type PromotionRaceTablebaseResult =
  | Readonly<{ kind: "reading"; request: PromotionRaceTablebaseRequest; item: PromotionRaceTablebaseEvidence; derivation: PromotionRaceTablebaseDerivationReceipt }>
  | Readonly<{ kind: "unavailable"; reason: "outside_tablebase_domain"; request: PromotionRaceTablebaseRequest; geometry: PromotionRaceGeometryEvidence; source: DeclaredEvidence<TypedProviderResult>; requestDigest: ProviderRequestDigest; invocation: PromotionRaceProviderInvocationReceipt }>
  | Readonly<{ kind: "unavailable"; reason: "provider_unavailable"; request: PromotionRaceTablebaseRequest; geometry: PromotionRaceGeometryEvidence; requestDigest: ProviderRequestDigest; providerReason: ProviderSourceFailureReason; invocation: PromotionRaceProviderInvocationReceipt }>
  | Readonly<{ kind: "completed"; request: PromotionRaceTablebaseRequest; output: Extract<Extract<PromotionRaceGeometryResult, { kind: "completed" }>["output"], { kind: "no_evidence" }> }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained"; request: PromotionRaceTablebaseRequest; missing: readonly ("geometry" | "legal_moves")[] }>;
const RESULTS = new WeakSet<object>();
function result<T extends PromotionRaceTablebaseResult>(value: T): T {
  // Every retained child arrives through its own sealed authority. Preserve those exact references;
  // cloning here would destroy both DeclaredEvidence's symbol identity and the provider seals.
  const sealed = Object.freeze(value);
  RESULTS.add(sealed);
  return sealed;
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceTablebaseResult {
  if (value === null || typeof value !== "object" || !RESULTS.has(value)) throw new TypeError("PROMOTION_RESULT_UNSEALED");
  const checked = value as PromotionRaceTablebaseResult;
  if (!REQUESTS.has(checked.request)) throw new TypeError("PROMOTION_RESULT_REQUEST_UNSEALED");
  if (checked.kind === "reading") {
    assertDerivation(checked.derivation);
    if (checked.item !== checked.derivation.output || checked.request !== checked.derivation.request) throw new TypeError("PROMOTION_READING_CROSSED");
  }
  if (checked.kind === "unavailable" && checked.reason !== "input_abstained") {
    if (!INVOCATIONS.has(checked.invocation) || checked.invocation.requestDigest !== checked.requestDigest) throw new TypeError("PROMOTION_PROVIDER_OUTCOME_CROSSED");
    if (checked.reason === "outside_tablebase_domain" && (!DOMAIN_EVIDENCE.has(checked.source) || checked.source.payload !== checked.invocation.result)) throw new TypeError("PROMOTION_DOMAIN_EVIDENCE_CROSSED");
  }
}

export type PromotionRaceLegalMovesResolution =
  | Readonly<{ kind: "evidence"; evidence: ExactLegalMovesEvidence }>
  | Readonly<{ kind: "unavailable"; reason: "not_collected" | "upstream_unavailable" }>;
export interface PromotionRaceTablebaseDependencies {
  readonly recordedLookup: RecordedTablebaseEvidenceLookup;
  readonly resolveLegalMoves: (fen: CanonicalFullFen) => PromotionRaceLegalMovesResolution;
  readonly scheduler: ProviderExchangeScheduler;
  readonly sourceFactories: ProviderSourceFactories;
}
const LEGAL_RESOLVERS = new WeakSet<Function>();

export async function collectPromotionRaceTablebase(
  request: PromotionRaceTablebaseRequest,
  dependencies: PromotionRaceTablebaseDependencies,
): Promise<PromotionRaceTablebaseResult> {
  if (!REQUESTS.has(request)) throw new TypeError("PROMOTION_REQUEST_UNSEALED");
  assertGeometryResult(request.geometry);
  if (request.geometry.kind === "unavailable") {
    return result({ kind: "unavailable", reason: "input_abstained", request, missing: Object.freeze(["geometry"] as const) });
  }
  if (request.geometry.output.kind === "no_evidence") {
    return result({ kind: "completed", request, output: request.geometry.output });
  }
  const geometry = request.geometry.output.item;
  assertPromotionRaceGeometryEvidence(geometry);
  const fen = canonicalFullFen(geometry.payload.fen);

  if (!RECORDED_LOOKUPS.has(dependencies.recordedLookup)) throw new TypeError("PROMOTION_RECORDED_LOOKUP_UNSEALED");
  const recorded = dependencies.recordedLookup.get(fen);
  let source: PromotionRaceTablebaseSource;
  if (recorded.kind === "failed") throw new TypeError(`RECORDED_TABLEBASE_${recorded.reason.toUpperCase()}`);
  if (recorded.kind === "found") {
    assertRecordedTablebaseEvidence(recorded.evidence);
    if (recorded.evidence.payload.fen !== fen) throw new TypeError("PROMOTION_RECORDED_FEN_CROSSED");
    source = recordedSource(recorded.evidence);
  } else {
    if (!SCHEDULERS.has(dependencies.scheduler) || !SOURCE_FACTORIES.has(dependencies.sourceFactories)) throw new TypeError("PROMOTION_PROVIDER_DEPENDENCY_UNSEALED");
    const typedRequest = makePromotionRaceSyzygyRequest(fen, request.providerScope);
    const expected = dependencies.scheduler.normalizedRequestDigest(typedRequest);
    const providerResult = await dependencies.scheduler.get(typedRequest, request.providerScope, request.signal);
    const invocation = createInvocation(typedRequest, expected, providerResult);
    if (providerResult.kind === "local_domain_result") {
      const source = declareSyzygyTablebaseDomainEvidence(providerResult);
      return result({ kind: "unavailable", reason: "outside_tablebase_domain", request, geometry, source, requestDigest: expected, invocation });
    }
    if (providerResult.kind === "source_failure") {
      return result({ kind: "unavailable", reason: "provider_unavailable", request, geometry, requestDigest: expected, providerReason: providerResult.reason, invocation });
    }
    const evidence = dependencies.sourceFactories["syzygy.position@1"].make(providerResult.delivery);
    source = liveSource(evidence, invocation);
  }

  if (!LEGAL_RESOLVERS.has(dependencies.resolveLegalMoves)) throw new TypeError("PROMOTION_LEGAL_RESOLVER_UNSEALED");
  const legal = dependencies.resolveLegalMoves(fen);
  if (legal.kind === "unavailable") {
    return result({ kind: "unavailable", reason: "input_abstained", request, missing: Object.freeze(["legal_moves"] as const) });
  }
  assertExactLegalMovesEvidence(legal.evidence);
  if (legal.evidence.payload.fen !== fen) throw new TypeError("PROMOTION_LEGAL_FEN_CROSSED");
  const derivation = createDerivedEvidence({ request, geometry, legalMoves: legal.evidence, source });
  return result({ kind: "reading", request, item: derivation.output, derivation });
}

export function createExactLegalMovesResolver(calls?: string[]): PromotionRaceTablebaseDependencies["resolveLegalMoves"] {
  const resolver: PromotionRaceTablebaseDependencies["resolveLegalMoves"] = (fen) => {
    calls?.push(`legal:${fen}`);
    return Object.freeze({ kind: "evidence" as const, evidence: createRulesMobilityReadingLegalMovesV1Evidence(fen) });
  };
  LEGAL_RESOLVERS.add(resolver);
  return resolver;
}
