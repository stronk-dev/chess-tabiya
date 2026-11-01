// Accepted move-quality-grades §2a: one fixed selection per original node, below grading and
// current consumer access. No provider calls, synthetic grades or pair-dependent report search.
import { collectRecordedEngineAttachments, readRecordedEngineAttachments, type RecordedEngineAttachments } from "../../../packages/runtime/src/internal/recorded-engine-attachments.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import type { ReviewEngineScore, ReviewSearchBound } from "../../../packages/runtime/src/review-points.js";
import { PackRegistry, RecordedMeasurementSourceError, type RecordedMeasurementAdmission, type RecordedMeasurementPopulation } from "./pack-registry.js";
import { ReviewEvidenceCoordinator } from "./review-evidence.js";

type ModernRows = ReturnType<typeof readRecordedEngineAttachments>;
type Population = ReturnType<PackRegistry["readRecordedMeasurements"]>;
type Instrument = Readonly<{ origin: "provider_delivery"; engineVersion: string; generation: number }>
  | Readonly<{ origin: "offline_engine"; engineVersion: string; profile: { readonly threads: number; readonly hashMb: number; readonly multiPv: 1 } }>;
interface Available {
  readonly kind: "available";
  readonly engineId: string;
  readonly score: ReviewEngineScore;
  readonly instrument: Instrument;
  readonly bound: RequestedBound;
}
type RequestedBound = Readonly<{ kind: "depth"; requestedDepth: number }>
  | Readonly<{ kind: "movetime"; requestedMs: number }> | Readonly<{ kind: "nodes"; requestedNodes: number }>;
function requestedBound(bound: ReviewSearchBound): RequestedBound {
  return Object.freeze(bound.kind === "depth" ? { kind: "depth", requestedDepth: bound.requestedDepth }
    : bound.kind === "movetime" ? { kind: "movetime", requestedMs: bound.requestedMs } : { kind: "nodes", requestedNodes: bound.requestedNodes });
}
type Candidate = Readonly<{ row: Population["records"][number]; disposition: "selected" | "eligible" | "input_abstained" | "ledger_record_not_admitted" }>;
interface Endpoint {
  readonly position: ModernRows["rows"][number]["position"];
  readonly origin: "provider_delivery" | "offline_engine" | null;
  readonly state: Available | Readonly<{ kind: "unavailable"; reason: "source_pending" | "missing_eval" | "input_abstained" }>;
  readonly modern: ModernRows["rows"][number];
  readonly pending: object | null;
  readonly ledger: Population | null;
  readonly candidates: readonly Candidate[];
  readonly selectedOrdinal: number | null;
}
declare const endpointSourceBrand: unique symbol;
export interface RecordedEngineEndpoints { readonly [endpointSourceBrand]: true }
interface SourceImage {
  readonly boundary: ReturnType<typeof readRecordedReviewBoundary>;
  readonly rows: readonly Endpoint[];
}
interface Owned {
  readonly boundary: RecordedReviewBoundary;
  readonly signal: AbortSignal;
  readonly attachments: RecordedEngineAttachments;
  readonly admission: RecordedMeasurementAdmission | null;
  readonly populations: readonly RecordedMeasurementPopulation[];
  readonly image: SourceImage;
}
const positive = (value: number) => Number.isSafeInteger(value) && value > 0;
const invalid = (message: string): never => { throw new RecordedMeasurementSourceError("source_contract_invalid", message); };

/** Normalize only an individually admitted original engine report, never an arbitrary reading. */
function offline(row: Population["records"][number]): Available | null {
  const origin = row.source.origin;
  if (origin.kind === "engine" && origin.evidenceKind !== "engine_eval") return invalid("Engine endpoint has a conflicting original source evidence kind");
  if (row.invocation.result.kind !== "available") return null;
  const reading = row.invocation.result.value.payload;
  if (reading.kind !== "engine_eval") return invalid("Engine endpoint has a crossed reading kind");
  if (origin.kind !== "engine") return null;
  const values = reading.values;
  if (origin.engineId !== values.engineId || origin.engineVersion !== values.engineVersion
    || (origin.engineName !== null && origin.engineName !== values.engineName)) return invalid("Engine endpoint report conflicts with its original instrument identity");
  if (!positive(origin.profile.threads) || !positive(origin.profile.hashMb) || origin.profile.multiPv !== 1) return null;
  const budget = origin.budget;
  if (Object.keys(budget).length !== 1) return invalid("Engine endpoint requested budget is ambiguous");
  const bound: RequestedBound = "depth" in budget ? { kind: "depth", requestedDepth: budget.depth } : { kind: "movetime", requestedMs: budget.movetimeMs };
  if (!positive("depth" in budget ? budget.depth : budget.movetimeMs)) return null;
  let score: ReviewEngineScore;
  if (values.centipawns !== undefined) score = { kind: "centipawns", value: values.centipawns };
  else {
    const mate = values.mateIn;
    // A fractional/unsigned-zero mate report supplies no unambiguous side/distance. Never
    // repair it into cp or invent a terminal engine value from the board's rules result.
    if (mate === undefined || !Number.isSafeInteger(mate) || mate === 0) return null;
    score = { kind: "mate", side: mate > 0 ? "white" : "black", distance: Math.abs(mate), unit: "moves" };
  }
  return Object.freeze({ kind: "available", engineId: values.engineId, score: Object.freeze(score), bound: Object.freeze(bound),
    instrument: Object.freeze({ origin: "offline_engine", engineVersion: origin.engineVersion,
      profile: Object.freeze({ threads: origin.profile.threads, hashMb: origin.profile.hashMb, multiPv: 1 as const }) }) });
}

/** Server-private source owner. A storage boundary is source scope, not Nudge/Review/Compare
 * permission; those complete current consumer operations must admit access before calling it. */
export class RecordedEngineEndpointOwner {
  readonly #sources = new WeakMap<object, Owned>();
  constructor(readonly registry: PackRegistry | undefined, readonly coordinator: ReviewEvidenceCoordinator | undefined) {}

  capture(input: Readonly<{ boundary: RecordedReviewBoundary; signal: AbortSignal }>): RecordedEngineEndpoints {
    if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype
      || Reflect.ownKeys(input).length !== 2 || !["boundary", "signal"].every(key => {
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        return descriptor !== undefined && descriptor.enumerable && "value" in descriptor;
      })) return invalid("Engine endpoints require exactly {boundary,signal}");
    const { boundary, signal } = input;
    signal.throwIfAborted();
    const image = readRecordedReviewBoundary(boundary);
    const attachments = collectRecordedEngineAttachments({ boundary }), modern = readRecordedEngineAttachments(attachments);
    let admission: RecordedMeasurementAdmission | null = null;
    const populations: RecordedMeasurementPopulation[] = [];
    const rows = Object.freeze(modern.rows.map((row): Endpoint => {
      signal.throwIfAborted();
      if (row.selected !== null) {
        const value = row.selected.occurrence.evaluation.payload, actual = value.acquisition.actualIdentity;
        const generation = value.acquisition.generation;
        if (generation === null) return invalid("Modern engine endpoint has no actual engine generation");
        return Object.freeze({ position: row.position, modern: row, origin: "provider_delivery", pending: null, ledger: null,
          candidates: Object.freeze([]), selectedOrdinal: null,
          state: Object.freeze({ kind: "available", engineId: actual.id, score: value.payload.score, bound: requestedBound(value.payload.bound),
            instrument: Object.freeze({ origin: "provider_delivery", engineVersion: actual.version, generation }) }) });
      }
      const pending = this.#pending(image, row.position.payload.nodeId, row.position.payload.fen);
      const empty = { position: row.position, modern: row, ledger: null, candidates: Object.freeze([]), selectedOrdinal: null };
      if (pending !== undefined) return Object.freeze({ ...empty, origin: "provider_delivery", pending,
        state: Object.freeze({ kind: "unavailable", reason: "source_pending" }) });
      if (image.run.sessionKind !== "pack" || this.registry === undefined) return Object.freeze({ ...empty, origin: null, pending: null,
        state: Object.freeze({ kind: "unavailable", reason: "missing_eval" }) });
      admission ??= this.#admit(image.run.packDigest!);
      if (admission.kind === "failed") throw new RecordedMeasurementSourceError(admission.reason, "Recorded endpoint artifact admission failed");
      if (admission.kind === "unavailable") return Object.freeze({ ...empty, origin: "offline_engine", pending: null,
        state: Object.freeze({ kind: "unavailable", reason: "missing_eval" }) });
      const population = this.registry.collectRecordedMeasurements({ source: admission.source, position: row.position, projection: "recorded.engine.eval@1" });
      populations.push(population);
      const ledger = this.registry.readRecordedMeasurements(population);
      // Normalize the complete candidate image before selecting. A later conflicting artifact
      // must fail, not disappear because an earlier candidate would have been usable.
      const normalized = ledger.records.map(offline), selected = normalized.findIndex(value => value !== null);
      const candidates = Object.freeze(ledger.records.map((candidate, index): Candidate => Object.freeze({ row: candidate,
        disposition: candidate.invocation.result.kind === "unavailable" ? "ledger_record_not_admitted"
          : normalized[index] === null ? "input_abstained" : index === selected ? "selected" : "eligible" })));
      return Object.freeze({ position: row.position, modern: row, origin: "offline_engine", pending: null, ledger, candidates,
        selectedOrdinal: selected < 0 ? null : ledger.records[selected]!.ordinal,
        state: selected < 0 ? Object.freeze({ kind: "unavailable", reason: ledger.records.length > 0 || ledger.abstentions.length > 0 ? "input_abstained" : "missing_eval" }) : normalized[selected]! });
    }));
    const source = Object.freeze({}) as RecordedEngineEndpoints;
    this.#sources.set(source, { boundary, signal, attachments, admission, populations, image: Object.freeze({ boundary: image, rows }) });
    this.read(source);
    return source;
  }

  read(source: RecordedEngineEndpoints): SourceImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) return invalid("Engine endpoint source is foreign or not original");
    owned.signal.throwIfAborted();
    if (readRecordedReviewBoundary(owned.boundary) !== owned.image.boundary) return invalid("Engine endpoint storage boundary changed");
    const modern = readRecordedEngineAttachments(owned.attachments);
    for (const [index, row] of owned.image.rows.entries()) {
      if (row.modern !== modern.rows[index]) return invalid("Engine endpoint lost its original modern occurrence");
      if (row.modern.selected === null && (this.#pending(owned.image.boundary, row.position.payload.nodeId, row.position.payload.fen) ?? null) !== row.pending) return invalid("Engine endpoint pending source changed");
    }
    if (owned.admission !== null) {
      const current = this.#admit(owned.image.boundary.run.packDigest!);
      if (current.kind !== owned.admission.kind || (current.kind === "available" && owned.admission.kind === "available"
        ? current.source !== owned.admission.source : "reason" in current && "reason" in owned.admission && current.reason !== owned.admission.reason)) return invalid("Engine endpoint artifact source changed");
    }
    for (const population of owned.populations) this.registry!.readRecordedMeasurements(population);
    owned.signal.throwIfAborted();
    return owned.image;
  }

  resolveRecordedEngineEndpoint(source: RecordedEngineEndpoints, nodeId: string): Endpoint {
    const row = this.read(source).rows.find(candidate => candidate.position.payload.nodeId === nodeId);
    if (row === undefined) return invalid("Engine endpoint is outside the original granted path");
    return row;
  }

  #pending(image: SourceImage["boundary"], nodeId: string, fen: string) {
    return this.coordinator?.recordedPendingRequest(image.run.id, image.request.branchId, nodeId, fen);
  }

  #admit(packDigest: string): RecordedMeasurementAdmission {
    try { return this.registry!.resolveRecordedMeasurementSource(packDigest); }
    catch (cause) { throw new RecordedMeasurementSourceError(cause instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed", "Recorded endpoint lookup failed", { cause }); }
  }
}
