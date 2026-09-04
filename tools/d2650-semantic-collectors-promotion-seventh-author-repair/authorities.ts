// DISPOSABLE central-authority model for the held promotion collectors. Not production code.
import {
  declareExactLegalMovesEvidence,
  declarePawnContactsEvidence,
} from "../../packages/runtime/src/evidence-source-adapters.js";
import { assertDeclaredEvidence, declareEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { exactLegalMoveMap, type ExactLegalMoveMap } from "../../packages/runtime/src/legal-moves.js";
import { pawnContactsReading, type PawnContactsReading } from "../../packages/runtime/src/pawn-dynamics.js";
import { parseTablebasePosition, type TablebasePosition } from "../../apps/server/src/tablebase.js";

export type CanonicalFullFen = string & { readonly __canonicalFullFen: true };
export type ProviderRequestDigest = `sha256:${string}`;

const CONTACTS = new WeakSet<object>();
const LEGAL_MAPS = new WeakSet<object>();
const PROVIDER_RESULTS = new WeakSet<object>();
const RECORDED_SOURCES = new WeakSet<object>();

function immutableCopy<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(immutableCopy)) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, immutableCopy(child)]))) as T;
}

function exactIdentity(value: unknown, producer: string, projection: string): void {
  assertDeclaredEvidence(value);
  const item = value as DeclaredEvidence<unknown>;
  if (item.producer.id !== producer || item.producer.version !== 1 || item.projection.id !== projection || item.projection.version !== 1) {
    throw new TypeError("DECLARED_EVIDENCE_IDENTITY_MISMATCH");
  }
}

export type PawnContactsEvidence = DeclaredEvidence<PawnContactsReading>;
export function createRulesPawnReadingContactsV1Evidence(fen: CanonicalFullFen): PawnContactsEvidence {
  const item = declarePawnContactsEvidence(pawnContactsReading(fen));
  CONTACTS.add(item);
  return item;
}

export function assertPawnContactsEvidence(value: unknown): asserts value is PawnContactsEvidence {
  exactIdentity(value, "rules.pawn", "rules.pawn.reading.contacts");
  if (!CONTACTS.has(value as object)) throw new TypeError("PAWN_CONTACTS_VALUE_RECEIPT_MISSING");
}

export type ExactLegalMovesEvidence = DeclaredEvidence<ExactLegalMoveMap>;
export function createRulesMobilityReadingLegalMovesV1Evidence(fen: CanonicalFullFen): ExactLegalMovesEvidence {
  const item = declareExactLegalMovesEvidence(exactLegalMoveMap(fen));
  LEGAL_MAPS.add(item);
  return item;
}

export function assertExactLegalMovesEvidence(value: unknown): asserts value is ExactLegalMovesEvidence {
  exactIdentity(value, "rules.mobility", "rules.mobility.reading.legal_moves");
  if (!LEGAL_MAPS.has(value as object)) throw new TypeError("EXACT_LEGAL_MOVES_VALUE_RECEIPT_MISSING");
}

export interface ProviderRequestScope {
  readonly id: string;
  readonly budgetMs: number;
}
export interface SyzygyPositionRequest {
  readonly rules: "chess";
  readonly variant: "standard";
  readonly fen: CanonicalFullFen;
  readonly timeoutMs: number;
}
export type TypedProviderRequest<K extends "syzygy.position@1"> = Readonly<{
  operation: K;
  request: SyzygyPositionRequest;
}>;
export interface LiveSyzygyPosition {
  readonly fen: CanonicalFullFen;
  readonly position: TablebasePosition;
}
export interface SyzygyOutsideDomain {
  readonly kind: "outside_domain";
  readonly reason: "piece_count";
  readonly pieceCount: number;
  readonly maximumPieceCount: 7;
}
export type ProviderSourceFailureReason =
  | "provider_unavailable"
  | "deadline_exceeded"
  | "queue_full"
  | "cancelled"
  | "invalid_response"
  | "identity_mismatch";
export type TypedProviderResult<K extends "syzygy.position@1"> =
  | Readonly<{
      kind: "success";
      operation: K;
      normalizedRequestDigest: ProviderRequestDigest;
      delivery: Readonly<{
        kind: "live";
        servedAt: string;
        acquisition: Readonly<{
          operation: K;
          normalizedRequestDigest: ProviderRequestDigest;
          requestedAt: string;
          retrievedAt: string;
        }>;
        payload: LiveSyzygyPosition;
      }>;
    }>
  | Readonly<{
      kind: "local_domain_result";
      operation: K;
      normalizedRequestDigest: ProviderRequestDigest;
      observedAt: string;
      payload: SyzygyOutsideDomain;
    }>
  | Readonly<{
      kind: "source_failure";
      operation: K;
      normalizedRequestDigest: ProviderRequestDigest;
      failedAt: string;
      reason: ProviderSourceFailureReason;
    }>;
export type SyzygyProviderSuccess = Extract<TypedProviderResult<"syzygy.position@1">, { kind: "success" }>;
export type SyzygyProviderDelivery = SyzygyProviderSuccess["delivery"];
export type SyzygyLocalDomainResult = Extract<TypedProviderResult<"syzygy.position@1">, { kind: "local_domain_result" }>;

export function makeSyzygySuccess(
  request: TypedProviderRequest<"syzygy.position@1">,
  digest: ProviderRequestDigest,
  rawPosition: unknown,
): TypedProviderResult<"syzygy.position@1"> {
  const position = immutableCopy(parseTablebasePosition(rawPosition));
  const acquisition = Object.freeze({
    operation: "syzygy.position@1" as const,
    normalizedRequestDigest: digest,
    requestedAt: "2026-09-04T00:00:00.000Z",
    retrievedAt: "2026-09-04T00:00:00.010Z",
  });
  const result = Object.freeze({
    kind: "success" as const,
    operation: "syzygy.position@1" as const,
    normalizedRequestDigest: digest,
    delivery: Object.freeze({
      kind: "live" as const,
      servedAt: "2026-09-04T00:00:00.011Z",
      acquisition,
      payload: Object.freeze({ fen: request.request.fen, position }),
    }),
  });
  PROVIDER_RESULTS.add(result);
  return result;
}

export function makeSyzygyLocalDomain(
  request: TypedProviderRequest<"syzygy.position@1">,
  digest: ProviderRequestDigest,
  pieceCount: number,
): TypedProviderResult<"syzygy.position@1"> {
  if (!Number.isSafeInteger(pieceCount) || pieceCount <= 7) throw new TypeError("SYZYGY_DOMAIN_RESULT_INVALID");
  const result = Object.freeze({
    kind: "local_domain_result" as const,
    operation: "syzygy.position@1" as const,
    normalizedRequestDigest: digest,
    observedAt: "2026-09-04T00:00:00.000Z",
    payload: Object.freeze({ kind: "outside_domain" as const, reason: "piece_count" as const, pieceCount, maximumPieceCount: 7 as const }),
  });
  PROVIDER_RESULTS.add(result);
  return result;
}

export function makeSyzygyFailure(
  _request: TypedProviderRequest<"syzygy.position@1">,
  digest: ProviderRequestDigest,
  reason: ProviderSourceFailureReason,
): TypedProviderResult<"syzygy.position@1"> {
  const result = Object.freeze({
    kind: "source_failure" as const,
    operation: "syzygy.position@1" as const,
    normalizedRequestDigest: digest,
    failedAt: "2026-09-04T00:00:00.010Z",
    reason,
  });
  PROVIDER_RESULTS.add(result);
  return result;
}

export function assertSyzygyProviderResult(value: unknown): asserts value is TypedProviderResult<"syzygy.position@1"> {
  if (value === null || typeof value !== "object" || !PROVIDER_RESULTS.has(value as object)) throw new TypeError("SYZYGY_PROVIDER_RESULT_UNSEALED");
}

export type RecordedTablebaseEvidence = DeclaredEvidence<Readonly<{
  fen: CanonicalFullFen;
  position: TablebasePosition;
}>>;
export function createRecordedTablebaseResultV1Evidence(fen: CanonicalFullFen, rawPosition: unknown): RecordedTablebaseEvidence {
  const payload = Object.freeze({ fen, position: immutableCopy(parseTablebasePosition(rawPosition)) });
  const item = declareEvidence({ id: "recorded.tablebase", version: 1 }, { id: "recorded.tablebase.result", version: 1 }, payload);
  RECORDED_SOURCES.add(item);
  return item;
}

export function assertRecordedTablebaseEvidence(value: unknown): asserts value is RecordedTablebaseEvidence {
  exactIdentity(value, "recorded.tablebase", "recorded.tablebase.result");
  if (!RECORDED_SOURCES.has(value as object)) throw new TypeError("RECORDED_TABLEBASE_VALUE_RECEIPT_MISSING");
}
