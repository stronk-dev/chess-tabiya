// Accepted move-quality-grades §2a: one fixed selection per original node, below grading and
// current consumer access. No provider calls, synthetic grades or pair-dependent report search.
import { collectRecordedEngineAttachments, collectRecordedEngineEdge, readRecordedEngineAttachments, type RecordedEngineAttachments } from "../../../packages/runtime/src/internal/recorded-engine-attachments.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { recordedOfflineEngineEndpoint, recordedEngineRequestedBound as requestedBound, type RecordedEngineAvailable } from "../../../packages/runtime/src/internal/recorded-engine-endpoint-values.js";
import { PackRegistry, RecordedMeasurementSourceError, type RecordedMeasurementAdmission, type RecordedMeasurementPopulation } from "./pack-registry.js";
import { ReviewEvidenceCoordinator } from "./review-evidence.js";
import { readRecordedEngineNode, recordedEngineNodesComparable, type RecordedEngineNodeCapture } from "../../../packages/runtime/src/internal/recorded-engine-node.js";
import { sideToMove } from "../../../packages/runtime/src/review-points.js";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import type { DeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import type { RecordedEdge } from "../../../packages/runtime/src/recorded-edge.js";

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
type PairAbsence = "source_pending" | "missing_eval" | "input_abstained" | "unequal_instrument";
/** Private measurement pair, not a grade or Nudge/Review permission. The whole endpoint image
 * survives even when comparison is unavailable; graph coverage is not evaluated accuracy. */
export interface RecordedEnginePair {
  readonly before: Endpoint;
  readonly after: Endpoint;
  readonly edge: DeclaredEvidence<RecordedEdge>;
  readonly mover: "white" | "black";
  readonly state: Readonly<{ kind: "unavailable"; reason: PairAbsence }>
    | Readonly<{ kind: "available"; before: Available; after: Available;
        inputs: readonly [DeclaredEvidence<unknown>, DeclaredEvidence<unknown>, DeclaredEvidence<RecordedEdge>] }>;
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
  readonly pairs: Map<string, RecordedEnginePair>;
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
    this.#sources.set(source, { boundary, signal, attachments, admission, populations, image: Object.freeze({ boundary: image, rows }), pairs: new Map() });
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

  /** Derive only from this snapshot's fixed per-node selections. Revalidate live owners before
   * even a cached unavailable result; absence must not hide revocation or source corruption. */
  resolveRecordedEnginePair(source: RecordedEngineEndpoints, afterNodeId: string): RecordedEnginePair {
    const image = this.read(source), owned = this.#sources.get(source)!;
    const index = image.boundary.path.findIndex(entry => entry.node.id === afterNodeId);
    if (index <= 0) return invalid("Engine pair requires an actual incoming edge on the original granted path");
    const existing = owned.pairs.get(afterNodeId);
    if (existing !== undefined) return existing;
    const before = image.rows[index - 1]!, after = image.rows[index]!;
    const first = this.#node(source, before), second = this.#node(source, after);
    const edge = collectRecordedEngineEdge(owned.attachments, afterNodeId);
    const pair = Object.freeze({ before, after, edge, mover: sideToMove(edge.payload.beforeFen), state: pairState(before, after, edge, first, second) });
    this.read(source); // actual storage/registry/pending/cancellation still owns publication
    owned.pairs.set(afterNodeId, pair);
    return pair;
  }

  /** Original operands for separately authorized workflow issuers, not a numeric endpoint API. */
  nodeCapture(source: RecordedEngineEndpoints, nodeId: string): RecordedEngineNodeCapture {
    const row = this.resolveRecordedEngineEndpoint(source, nodeId), owned = this.#sources.get(source)!;
    const ledger = row.ledger;
    return Object.freeze({ attachments: owned.attachments, nodeId, pending: row.pending,
      offline: ledger === null ? null : Object.freeze({ packDigest: ledger.artifact.packDigest,
        ledgerDigest: ledger.artifact.ledgerDigest, manifestDigest: ledger.artifact.manifestDigest,
        ledger: ledger.artifact.ledger, manifest: ledger.artifact.manifest, candidates: ledger.records, abstentions: ledger.abstentions }),
    });
  }

  #node(source: RecordedEngineEndpoints, endpoint: Endpoint) {
    const node = readRecordedEngineNode(this.nodeCapture(source, endpoint.position.payload.nodeId));
    if (node.row !== endpoint.modern || node.selectedOrdinal !== endpoint.selectedOrdinal
      || (node.selected === null ? endpoint.state.kind !== "unavailable" || node.unavailable !== endpoint.state.reason
        : canonicalizeJson(node.selected) !== canonicalizeJson(endpoint.state))) return invalid("Engine node differs from its original fixed selection");
    return node;
  }

  #pending(image: SourceImage["boundary"], nodeId: string, fen: string) {
    return this.coordinator?.recordedPendingRequest(image.run.id, image.request.branchId, nodeId, fen);
  }

  #admit(packDigest: string): RecordedMeasurementAdmission {
    try { return this.registry!.resolveRecordedMeasurementSource(packDigest); }
    catch (cause) { throw new RecordedMeasurementSourceError(cause instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed", "Recorded endpoint lookup failed", { cause }); }
  }
}

function pairState(before: Endpoint, after: Endpoint, edge: DeclaredEvidence<RecordedEdge>, first: ReturnType<typeof readRecordedEngineNode>, second: ReturnType<typeof readRecordedEngineNode>): RecordedEnginePair["state"] {
  // Ordered local absence, never catch a source-contract failure into an ungradeable move.
  for (const reason of ["source_pending", "missing_eval", "input_abstained"] as const) {
    if ([before.state, after.state].some(state => state.kind === "unavailable" && state.reason === reason)) return Object.freeze({ kind: "unavailable", reason });
  }
  const left = before.state, right = after.state;
  if (left.kind !== "available" || right.kind !== "available") return invalid("Engine pair has an unknown endpoint state");
  if (!recordedEngineNodesComparable(first, second)) return Object.freeze({ kind: "unavailable", reason: "unequal_instrument" });
  if (first.selectedOperand === null || second.selectedOperand === null) return invalid("Comparable engine pair lost its original operands");
  return Object.freeze({ kind: "available", before: left, after: right,
    inputs: Object.freeze([first.selectedOperand, second.selectedOperand, edge] as const) });
}
