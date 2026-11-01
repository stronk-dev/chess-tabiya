// Accepted move-quality-grades §2a: one fixed selection per original node, below grading and
// current consumer access. No provider calls, synthetic grades or pair-dependent report search.
import { collectRecordedEngineAttachments, readRecordedEngineAttachments, type RecordedEngineAttachments } from "../../../packages/runtime/src/internal/recorded-engine-attachments.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { recordedOfflineEngineEndpoint, recordedEngineRequestedBound as requestedBound, type RecordedEngineAvailable } from "../../../packages/runtime/src/internal/recorded-engine-endpoint-values.js";
import { PackRegistry, RecordedMeasurementSourceError, type RecordedMeasurementAdmission, type RecordedMeasurementPopulation } from "./pack-registry.js";
import { ReviewEvidenceCoordinator } from "./review-evidence.js";
import type { RecordedComparisonPointCapture } from "../../../packages/runtime/src/recorded-comparison-point.js";

type ModernRows = ReturnType<typeof readRecordedEngineAttachments>;
type Population = ReturnType<PackRegistry["readRecordedMeasurements"]>;
type Available = RecordedEngineAvailable;
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
const invalid = (message: string): never => { throw new RecordedMeasurementSourceError("source_contract_invalid", message); };

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
      let normalized: readonly (Available | null)[];
      try { normalized = ledger.records.map(recordedOfflineEngineEndpoint); }
      catch (cause) { throw new RecordedMeasurementSourceError("source_contract_invalid", "Invalid original engine endpoint", { cause }); }
      const selected = normalized.findIndex(value => value !== null);
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

  /** Original operands for the restricted Compare issuer, not a public numeric endpoint API. */
  comparisonPointCapture(source: RecordedEngineEndpoints, nodeId: string): Pick<RecordedComparisonPointCapture, "attachments" | "offline" | "pending"> {
    const row = this.resolveRecordedEngineEndpoint(source, nodeId), owned = this.#sources.get(source)!;
    const ledger = row.ledger;
    return Object.freeze({ attachments: owned.attachments, pending: row.pending,
      offline: ledger === null ? null : Object.freeze({ packDigest: ledger.artifact.packDigest,
        ledgerDigest: ledger.artifact.ledgerDigest, manifestDigest: ledger.artifact.manifestDigest,
        ledger: ledger.artifact.ledger, manifest: ledger.artifact.manifest, candidates: ledger.records, abstentions: ledger.abstentions }),
    });
  }

  #pending(image: SourceImage["boundary"], nodeId: string, fen: string) {
    return this.coordinator?.recordedPendingRequest(image.run.id, image.request.branchId, nodeId, fen);
  }

  #admit(packDigest: string): RecordedMeasurementAdmission {
    try { return this.registry!.resolveRecordedMeasurementSource(packDigest); }
    catch (cause) { throw new RecordedMeasurementSourceError(cause instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed", "Recorded endpoint lookup failed", { cause }); }
  }
}
