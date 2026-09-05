// DISPOSABLE authority repair for D2748-D2752. Not production code.
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { countFenPieces } from "../../apps/server/src/sourcing/chess-facts.js";

import type { CanonicalFullFen, ExactLegalMovesEvidence } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceTablebaseResult as assertPriorResult,
  collectPromotionRaceTablebase as collectPrior,
  createExactLegalMovesResolver as createPriorLegalResolver,
  createPromotionRaceContactsUnavailable,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createRecordedTablebaseLookup as createPriorRecordedLookup,
  createRecordedTablebaseResultV1Evidence as createPriorRecordedEvidence,
  createSourcingLedgerTablebaseResultV1Evidence as createPriorLedgerEvidence,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  recordedTablebaseValueReceipt,
  type PromotionRaceTablebaseRequest,
  type PromotionRaceTablebaseResult as PriorPromotionRaceTablebaseResult,
  type ProviderExchangeScheduler,
  type ProviderSourceFactories,
  type RecordedTablebaseEvidence,
  type SyzygyFixtureOutcome,
} from "../d2693-semantic-collectors-promotion-eighth-author-repair/model.js";

export {
  createPromotionRaceContactsUnavailable,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  recordedTablebaseValueReceipt,
};
export type { PromotionRaceTablebaseRequest, ProviderExchangeScheduler, ProviderSourceFactories, SyzygyFixtureOutcome };

type RecordedFailureReason = "storage_unavailable" | "invalid_record";
type LegalUnavailableReason = "not_collected" | "upstream_unavailable";

export interface SourcingManifest {
  readonly schema: "tabiya.source-manifest.v1";
  readonly sources: readonly Readonly<{
    id: string;
    operation: "syzygy.position@1";
    grounding: "tablebase_exact";
  }>[];
}

export interface DurableTablebaseRecord {
  readonly kind: "tablebase_result";
  readonly anchor: Readonly<{ fen: CanonicalFullFen }>;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly grounds: "machine_validation";
  readonly values: Readonly<Record<string, unknown>>;
  readonly supports: readonly string[];
}

export interface DurableSourcingLedger {
  readonly schema: "tabiya.sourcing.evidence.v1";
  readonly sourcedAt: string;
  readonly records: readonly DurableTablebaseRecord[];
  readonly abstentions: readonly unknown[];
}

export interface DurableSourcingSnapshot {
  readonly manifest: SourcingManifest;
  readonly ledger: DurableSourcingLedger;
}

const SNAPSHOTS = new WeakSet<object>();

function exactKeys(value: Record<string, unknown>, expected: readonly string[], code: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(code);
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("DURABLE_LEDGER_OBJECT_REQUIRED");
  return value as Record<string, unknown>;
}

function instant(value: unknown, code: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) throw new TypeError(code);
  return value;
}

function fullFen(value: unknown): CanonicalFullFen {
  if (typeof value !== "string" || canonicalFen(positionFromFen(value)) !== value) throw new TypeError("CANONICAL_FULL_FEN_REQUIRED");
  return value as CanonicalFullFen;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreeze)) as T;
  const source = value as Record<string, unknown>;
  return Object.freeze(Object.fromEntries(Object.keys(source).map((key) => [key, deepFreeze(source[key])]))) as T;
}

export function createDurableSourcingSnapshot(manifestInput: unknown, ledgerInput: unknown): DurableSourcingSnapshot {
  const manifestObject = record(manifestInput);
  exactKeys(manifestObject, ["schema", "sources"], "SOURCE_MANIFEST_KEYS_INVALID");
  if (manifestObject.schema !== "tabiya.source-manifest.v1" || !Array.isArray(manifestObject.sources)) throw new TypeError("SOURCE_MANIFEST_INVALID");
  const sources = manifestObject.sources.map((candidate) => {
    const source = record(candidate);
    exactKeys(source, ["id", "operation", "grounding"], "SOURCE_MANIFEST_ENTRY_KEYS_INVALID");
    if (typeof source.id !== "string" || source.id.trim() === "" || source.operation !== "syzygy.position@1" || source.grounding !== "tablebase_exact") throw new TypeError("SOURCE_MANIFEST_ENTRY_INVALID");
    return deepFreeze({ id: source.id, operation: "syzygy.position@1" as const, grounding: "tablebase_exact" as const });
  });
  if (new Set(sources.map((source) => source.id)).size !== sources.length) throw new TypeError("SOURCE_MANIFEST_DUPLICATE_ID");

  const ledgerObject = record(ledgerInput);
  exactKeys(ledgerObject, ["schema", "sourcedAt", "records", "abstentions"], "SOURCING_LEDGER_KEYS_INVALID");
  const sourcedAt = instant(ledgerObject.sourcedAt, "SOURCING_LEDGER_TIME_INVALID");
  if (ledgerObject.schema !== "tabiya.sourcing.evidence.v1" || !Array.isArray(ledgerObject.records) || !Array.isArray(ledgerObject.abstentions)) throw new TypeError("SOURCING_LEDGER_INVALID");
  if (ledgerObject.abstentions.length !== 0) throw new TypeError("SOURCING_LEDGER_ABSTENTION_SCOPE_INVALID");
  const sourceIds = new Set(sources.map((source) => source.id));
  const records = ledgerObject.records.map((candidate) => {
    const item = record(candidate);
    exactKeys(item, ["kind", "anchor", "sourceId", "retrievedAt", "grounds", "values", "supports"], "TABLEBASE_RECORD_KEYS_INVALID");
    const anchor = record(item.anchor);
    exactKeys(anchor, ["fen"], "TABLEBASE_ANCHOR_KEYS_INVALID");
    const fen = fullFen(anchor.fen);
    const retrievedAt = instant(item.retrievedAt, "TABLEBASE_RETRIEVED_AT_INVALID");
    if (Date.parse(retrievedAt) > Date.parse(sourcedAt)) throw new TypeError("TABLEBASE_RETRIEVED_AFTER_SNAPSHOT");
    if (item.kind !== "tablebase_result" || typeof item.sourceId !== "string" || !sourceIds.has(item.sourceId) || item.grounds !== "machine_validation") throw new TypeError("TABLEBASE_RECORD_AUTHORITY_INVALID");
    if (!Array.isArray(item.supports) || item.supports.length === 0 || !item.supports.every((value) => typeof value === "string" && value.startsWith("/"))) throw new TypeError("TABLEBASE_RECORD_SUPPORTS_INVALID");
    const values = record(item.values);
    if (values.fen !== fen || values.pieceCount !== countFenPieces(fen)) throw new TypeError("TABLEBASE_RECORD_POSITION_CROSSED");
    if (countFenPieces(fen) > 7) throw new TypeError("TABLEBASE_DOMAIN_REQUIRED");
    return deepFreeze({
      kind: "tablebase_result" as const,
      anchor: { fen },
      sourceId: item.sourceId,
      retrievedAt,
      grounds: "machine_validation" as const,
      values,
      supports: [...item.supports] as string[],
    });
  });
  if (new Set(records.map((item) => item.anchor.fen)).size !== records.length) throw new TypeError("TABLEBASE_RECORD_DUPLICATE_FEN");
  const snapshot = deepFreeze({
    manifest: { schema: "tabiya.source-manifest.v1" as const, sources },
    ledger: { schema: "tabiya.sourcing.evidence.v1" as const, sourcedAt, records, abstentions: [] },
  });
  SNAPSHOTS.add(snapshot);
  return snapshot;
}

export interface RecordedAuthorityReceipt {
  readonly snapshot: DurableSourcingSnapshot;
  readonly record: DurableTablebaseRecord;
  readonly evidence: RecordedTablebaseEvidence;
}

export type DurableRecordedLookupResult =
  | Readonly<{ kind: "found"; evidence: RecordedTablebaseEvidence; receipt: RecordedAuthorityReceipt }>
  | Readonly<{ kind: "absent" }>
  | Readonly<{ kind: "failed"; reason: RecordedFailureReason }>;

export interface DurableRecordedLookup {
  get(fen: CanonicalFullFen): DurableRecordedLookupResult;
}

const DURABLE_LOOKUPS = new WeakSet<object>();
const RECORDED_AUTHORITIES = new WeakMap<object, RecordedAuthorityReceipt>();

export function createDurableRecordedLookup(snapshot: DurableSourcingSnapshot, calls?: string[]): DurableRecordedLookup {
  if (!SNAPSHOTS.has(snapshot)) throw new TypeError("DURABLE_SOURCING_SNAPSHOT_UNSEALED");
  const lookup = Object.freeze({
    get(fen: CanonicalFullFen): DurableRecordedLookupResult {
      calls?.push(`recorded:${fen}`);
      const durableRecord = snapshot.ledger.records.find((item) => item.anchor.fen === fen);
      if (durableRecord === undefined) return Object.freeze({ kind: "absent" as const });
      const source = createPriorLedgerEvidence({
        fen,
        sourceId: durableRecord.sourceId,
        retrievedAt: durableRecord.retrievedAt,
        rawPosition: durableRecord.values,
      });
      const evidence = createPriorRecordedEvidence(source);
      const receipt = Object.freeze({ snapshot, record: durableRecord, evidence });
      RECORDED_AUTHORITIES.set(evidence, receipt);
      return Object.freeze({ kind: "found" as const, evidence, receipt });
    },
  });
  DURABLE_LOOKUPS.add(lookup);
  return lookup;
}

export function createFailedDurableRecordedLookup(reason: RecordedFailureReason, calls?: string[]): DurableRecordedLookup {
  const lookup = Object.freeze({
    get(fen: CanonicalFullFen): DurableRecordedLookupResult {
      calls?.push(`recorded:${fen}`);
      return Object.freeze({ kind: "failed" as const, reason });
    },
  });
  DURABLE_LOOKUPS.add(lookup);
  return lookup;
}

export function recordedAuthorityReceipt(evidence: RecordedTablebaseEvidence): RecordedAuthorityReceipt {
  const receipt = RECORDED_AUTHORITIES.get(evidence);
  if (receipt === undefined || receipt.evidence !== evidence || !SNAPSHOTS.has(receipt.snapshot)) throw new TypeError("RECORDED_DURABLE_AUTHORITY_MISSING");
  return receipt;
}

export interface TotalLegalMovesResolver {
  readonly resolve: (fen: CanonicalFullFen) => Readonly<{ kind: "evidence"; evidence: ExactLegalMovesEvidence }> | Readonly<{ kind: "unavailable"; reason: LegalUnavailableReason }>;
}

type LegalState =
  | Readonly<{ kind: "evidence"; prior: ReturnType<typeof createPriorLegalResolver> }>
  | Readonly<{ kind: "unavailable"; reason: LegalUnavailableReason }>;
const LEGAL_RESOLVERS = new WeakMap<object, LegalState>();

export function createExactLegalMovesResolver(calls?: string[]): TotalLegalMovesResolver {
  const prior = createPriorLegalResolver(calls);
  const resolver = Object.freeze({ resolve: prior });
  LEGAL_RESOLVERS.set(resolver, Object.freeze({ kind: "evidence", prior }));
  return resolver;
}

export function createUnavailableLegalMovesResolver(reason: LegalUnavailableReason, calls?: string[]): TotalLegalMovesResolver {
  const resolver = Object.freeze({
    resolve(fen: CanonicalFullFen) {
      calls?.push(`legal:${fen}`);
      return Object.freeze({ kind: "unavailable" as const, reason });
    },
  });
  LEGAL_RESOLVERS.set(resolver, Object.freeze({ kind: "unavailable", reason }));
  return resolver;
}

export interface PromotionRaceTablebaseDependencies {
  readonly recordedLookup: DurableRecordedLookup;
  readonly legalResolver: TotalLegalMovesResolver;
  readonly scheduler: ProviderExchangeScheduler;
  readonly sourceFactories: ProviderSourceFactories;
}

export type PromotionRaceTablebaseResult = PriorPromotionRaceTablebaseResult
  | Readonly<{
      kind: "unavailable";
      reason: "outside_tablebase_domain";
      request: PromotionRaceTablebaseRequest;
      domain: Readonly<{ fen: CanonicalFullFen; pieceCount: number; maximumPieceCount: 7 }>;
    }>
  | Readonly<{
      kind: "unavailable";
      reason: "input_abstained";
      request: PromotionRaceTablebaseRequest;
      missing: readonly ["legal_moves"];
      upstreamReason: LegalUnavailableReason;
    }>;
const DOMAIN_RESULTS = new WeakSet<object>();
const LEGAL_UNAVAILABLE_RESULTS = new WeakSet<object>();

export async function collectPromotionRaceTablebase(
  request: PromotionRaceTablebaseRequest,
  dependencies: PromotionRaceTablebaseDependencies,
): Promise<PromotionRaceTablebaseResult> {
  if (!DURABLE_LOOKUPS.has(dependencies.recordedLookup)) throw new TypeError("PROMOTION_DURABLE_LOOKUP_UNSEALED");
  const legalState = LEGAL_RESOLVERS.get(dependencies.legalResolver);
  if (legalState === undefined) throw new TypeError("PROMOTION_TOTAL_LEGAL_RESOLVER_UNSEALED");
  if (request.geometry.kind !== "completed" || request.geometry.output.kind !== "evidence") {
    return collectPrior(request, {
      recordedLookup: createPriorRecordedLookup([]),
      resolveLegalMoves: createPriorLegalResolver(),
      scheduler: dependencies.scheduler,
      sourceFactories: dependencies.sourceFactories,
    });
  }
  const fen = fullFen(request.geometry.output.item.payload.fen);
  const pieceCount = countFenPieces(fen);
  if (pieceCount > 7) {
    const result = Object.freeze({
      kind: "unavailable" as const,
      reason: "outside_tablebase_domain" as const,
      request,
      domain: Object.freeze({ fen, pieceCount, maximumPieceCount: 7 as const }),
    });
    DOMAIN_RESULTS.add(result);
    return result;
  }
  if (legalState.kind === "unavailable") {
    dependencies.legalResolver.resolve(fen);
    const result = Object.freeze({
      kind: "unavailable" as const,
      reason: "input_abstained" as const,
      request,
      missing: Object.freeze(["legal_moves"] as const),
      upstreamReason: legalState.reason,
    });
    LEGAL_UNAVAILABLE_RESULTS.add(result);
    return result;
  }
  const recorded = dependencies.recordedLookup.get(fen);
  if (recorded.kind === "failed") throw new TypeError(`RECORDED_TABLEBASE_${recorded.reason.toUpperCase()}`);
  const priorLookup = recorded.kind === "found" ? createPriorRecordedLookup([recorded.evidence]) : createPriorRecordedLookup([]);
  if (recorded.kind === "found") recordedAuthorityReceipt(recorded.evidence);
  return collectPrior(request, {
    recordedLookup: priorLookup,
    resolveLegalMoves: legalState.prior,
    scheduler: dependencies.scheduler,
    sourceFactories: dependencies.sourceFactories,
  });
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceTablebaseResult {
  if (value !== null && typeof value === "object" && (DOMAIN_RESULTS.has(value) || LEGAL_UNAVAILABLE_RESULTS.has(value))) return;
  assertPriorResult(value);
}
