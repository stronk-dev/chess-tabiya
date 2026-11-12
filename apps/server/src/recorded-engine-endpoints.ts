// Accepted move-quality-grades §2a: one fixed selection per original node, below grading and
// current consumer access. No provider calls, synthetic grades or pair-dependent report search.
import { collectRecordedEngineAttachments, collectRecordedEngineEdge, readRecordedEngineAttachments, type RecordedEngineAttachments,
  beginRecordedEngineAttachmentCollection, advanceRecordedEngineAttachmentCollection, finishRecordedEngineAttachmentCollection,
  cancelRecordedEngineAttachmentCollection, recordedEngineAttachmentNode, readRecordedEngineAttachmentNode,
  type RecordedEngineAttachmentCollection, type RecordedEngineAttachmentInput } from "../../../packages/runtime/src/internal/recorded-engine-attachments.js";
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
declare const endpointCaptureBrand: unique symbol;
/** Incomplete original acquisition, never a source or permission. */
export interface RecordedEngineEndpointCapture { readonly [endpointCaptureBrand]: true }
interface CaptureWork {
  readonly boundary: RecordedReviewBoundary;
  readonly signal: AbortSignal;
  readonly image: SourceImage["boundary"];
  readonly attachmentWork: RecordedEngineAttachmentCollection;
  attachments: RecordedEngineAttachments | undefined;
  admission: RecordedMeasurementAdmission | null;
  readonly populations: RecordedMeasurementPopulation[];
  readonly rows: Endpoint[];
  readonly pairs: Map<string, RecordedEnginePair>;
}
const invalid = (message: string): never => { throw new RecordedMeasurementSourceError("source_contract_invalid", message); };

/** Server-private source owner. A storage boundary is source scope, not Nudge/Review/Compare
 * permission; those complete current consumer operations must admit access before calling it. */
export class RecordedEngineEndpointOwner {
  readonly #sources = new WeakMap<object, Owned>();
  readonly #captures = new WeakMap<object, CaptureWork>();
  constructor(readonly registry: PackRegistry | undefined, readonly coordinator: ReviewEvidenceCoordinator | undefined) {}

  capture(input: Readonly<{ boundary: RecordedReviewBoundary; signal: AbortSignal }>): RecordedEngineEndpoints {
    const handle = this.beginCapture(input);
    const work = this.#captureWork(handle);
    try {
      // No yield here: retain the original single-pass checks and selection order rather than
      // repeating cooperative guards over every prior row. Both paths share the same issuers.
      work.attachments = collectRecordedEngineAttachments({ boundary: work.boundary });
      for (const row of readRecordedEngineAttachments(work.attachments).rows) work.rows.push(this.#captureEndpoint(work, row));
      return this.finishCapture(handle);
    } catch (error) { this.cancelCapture(handle); throw error; }
  }

  /** Metadata only. Each advance acquires and selects exactly one original node. */
  beginCapture(input: Readonly<{ boundary: RecordedReviewBoundary; signal: AbortSignal }>): RecordedEngineEndpointCapture {
    if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype
      || Reflect.ownKeys(input).length !== 2 || !["boundary", "signal"].every(key => {
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        return descriptor !== undefined && descriptor.enumerable && "value" in descriptor;
      })) return invalid("Engine endpoints require exactly {boundary,signal}");
    const { boundary, signal } = input;
    signal.throwIfAborted();
    const image = readRecordedReviewBoundary(boundary);
    const handle = Object.freeze({}) as RecordedEngineEndpointCapture;
    this.#captures.set(handle, { boundary, signal, image, attachmentWork: beginRecordedEngineAttachmentCollection({ boundary }), attachments: undefined,
      admission: null, populations: [], rows: [], pairs: new Map() });
    return handle;
  }

  #captureWork(handle: RecordedEngineEndpointCapture): CaptureWork {
    const work = typeof handle === "object" && handle !== null ? this.#captures.get(handle) : undefined;
    if (work === undefined) return invalid("Engine endpoint capture is foreign or retired");
    return work;
  }

  #captureCurrent(work: CaptureWork): void {
    work.signal.throwIfAborted();
    if (readRecordedReviewBoundary(work.boundary) !== work.image) return invalid("Engine endpoint capture boundary changed");
    const complete = work.attachments === undefined ? undefined : readRecordedEngineAttachments(work.attachments);
    for (const [index, row] of work.rows.entries()) {
      const original = complete === undefined
        ? readRecordedEngineAttachmentNode(recordedEngineAttachmentNode(work.attachmentWork, row.position.payload.nodeId), row.position.payload.nodeId).row
        : complete.rows[index];
      if (row.modern !== original) return invalid("Engine endpoint lost its original modern occurrence");
    }
    this.#checkDependencies(work.image, work.rows, work.admission, work.populations);
    work.signal.throwIfAborted();
  }

  assertCaptureCurrent(handle: RecordedEngineEndpointCapture): void { this.#captureCurrent(this.#captureWork(handle)); }

  advanceCapture(handle: RecordedEngineEndpointCapture): Readonly<{
    stage: "endpoint"; nodeId: string;
    completedSubjects: number; totalSubjects: number; complete: boolean;
  }> {
    const work = this.#captureWork(handle), totalSubjects = work.image.path.length;
    if (work.rows.length === totalSubjects) return invalid("Engine endpoint capture has no remaining subject");
    try {
      this.#captureCurrent(work);
      const nodeId = work.image.path[work.rows.length]!.node.id;
      const acquired = advanceRecordedEngineAttachmentCollection(work.attachmentWork);
      if (acquired.nodeId !== nodeId || acquired.completedSubjects !== work.rows.length + 1
        || acquired.totalSubjects !== totalSubjects || acquired.complete !== (work.rows.length + 1 === totalSubjects)) return invalid("Engine attachment acquisition crossed its original subject");
      const row = readRecordedEngineAttachmentNode(recordedEngineAttachmentNode(work.attachmentWork, nodeId), nodeId).row;
      work.rows.push(this.#captureEndpoint(work, row));
      this.#captureCurrent(work);
      return Object.freeze({ stage: "endpoint", nodeId: row.position.payload.nodeId,
        completedSubjects: work.rows.length, totalSubjects, complete: work.rows.length === totalSubjects });
    } catch (error) { this.cancelCapture(handle); throw error; }
  }

  #captureEndpoint(work: CaptureWork, row: ModernRows["rows"][number]): Endpoint {
    const { signal, image } = work;
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
    work.admission ??= this.#admit(image.run.packDigest!);
    const admission = work.admission;
    if (admission.kind === "failed") throw new RecordedMeasurementSourceError(admission.reason, "Recorded endpoint artifact admission failed");
    if (admission.kind === "unavailable") return Object.freeze({ ...empty, origin: "offline_engine", pending: null,
      state: Object.freeze({ kind: "unavailable", reason: "missing_eval" }) });
    const population = this.registry.collectRecordedMeasurements({ source: admission.source, position: row.position, projection: "recorded.engine.eval@1" });
    work.populations.push(population);
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
  }

  /** Sole original endpoint-source issuer, after every original selection has been observed. */
  finishCapture(handle: RecordedEngineEndpointCapture): RecordedEngineEndpoints {
    const work = this.#captureWork(handle);
    if (work.rows.length !== work.image.path.length) return invalid("Engine endpoint capture is incomplete");
    try {
      this.#captureCurrent(work);
      if (work.attachments === undefined) {
        work.attachments = finishRecordedEngineAttachmentCollection(work.attachmentWork);
        this.#captureCurrent(work);
      }
      const source = Object.freeze({}) as RecordedEngineEndpoints;
      this.#sources.set(source, { boundary: work.boundary, signal: work.signal, attachments: work.attachments,
        admission: work.admission, populations: Object.freeze([...work.populations]),
        image: Object.freeze({ boundary: work.image, rows: Object.freeze([...work.rows]) }), pairs: work.pairs });
      this.read(source); return source;
    } finally { this.cancelCapture(handle); }
  }

  cancelCapture(handle: RecordedEngineEndpointCapture): boolean {
    const work = typeof handle === "object" && handle !== null ? this.#captures.get(handle) : undefined;
    if (work === undefined) return false;
    this.#captures.delete(handle); cancelRecordedEngineAttachmentCollection(work.attachmentWork); return true;
  }

  read(source: RecordedEngineEndpoints): SourceImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) return invalid("Engine endpoint source is foreign or not original");
    this.#checkCurrent(owned); return owned.image;
  }

  #checkCurrent(owned: Omit<Owned, "pairs">): void {
    owned.signal.throwIfAborted();
    if (readRecordedReviewBoundary(owned.boundary) !== owned.image.boundary) return invalid("Engine endpoint storage boundary changed");
    const modern = readRecordedEngineAttachments(owned.attachments);
    for (const [index, row] of owned.image.rows.entries()) {
      if (row.modern !== modern.rows[index]) return invalid("Engine endpoint lost its original modern occurrence");
    }
    this.#checkDependencies(owned.image.boundary, owned.image.rows, owned.admission, owned.populations);
    owned.signal.throwIfAborted();
  }

  #checkDependencies(image: SourceImage["boundary"], rows: readonly Endpoint[], admission: RecordedMeasurementAdmission | null,
    populations: readonly RecordedMeasurementPopulation[]): void {
    for (const row of rows) {
      if (row.modern.selected === null && (this.#pending(image, row.position.payload.nodeId, row.position.payload.fen) ?? null) !== row.pending) return invalid("Engine endpoint pending source changed");
    }
    if (admission !== null) {
      const current = this.#admit(image.run.packDigest!);
      if (current.kind !== admission.kind || (current.kind === "available" && admission.kind === "available"
        ? current.source !== admission.source : "reason" in current && "reason" in admission && current.reason !== admission.reason)) return invalid("Engine endpoint artifact source changed");
    }
    for (const population of populations) this.registry!.readRecordedMeasurements(population);
  }

  resolveRecordedEngineEndpoint(source: RecordedEngineEndpoints, nodeId: string): Endpoint {
    const row = this.read(source).rows.find(candidate => candidate.position.payload.nodeId === nodeId);
    if (row === undefined) return invalid("Engine endpoint is outside the original granted path");
    return row;
  }

  /** A completed original selection, never an implicit acquisition or a partial aggregate. */
  capturedNode(handle: RecordedEngineEndpointCapture, nodeId: string): RecordedEngineNodeCapture {
    const work = this.#captureWork(handle); this.#captureCurrent(work);
    const row = work.rows.find(row => row.position.payload.nodeId === nodeId);
    if (row === undefined) return invalid("Engine endpoint node has not been acquired");
    const attachments = recordedEngineAttachmentNode(work.attachmentWork, nodeId);
    const result = this.#nodeCapture(attachments, row);
    this.assertCaptureCurrent(handle); return result;
  }

  capturedPair(handle: RecordedEngineEndpointCapture, afterNodeId: string): RecordedEnginePair {
    const work = this.#captureWork(handle); this.#captureCurrent(work);
    const index = work.image.path.findIndex(entry => entry.node.id === afterNodeId);
    if (index <= 0) return invalid("Engine pair requires an actual incoming edge on the original granted path");
    const before = work.rows[index - 1], after = work.rows[index];
    if (before === undefined || after === undefined) return invalid("Engine pair subjects have not been acquired");
    const previous = work.pairs.get(afterNodeId); if (previous !== undefined) return previous;
    const left = this.capturedNode(handle, before.position.payload.nodeId), right = this.capturedNode(handle, afterNodeId);
    const first = this.#checkedNode(left, before), second = this.#checkedNode(right, after);
    const edge = collectRecordedEngineEdge(right.attachments, afterNodeId);
    const pair = Object.freeze({ before, after, edge, mover: sideToMove(edge.payload.beforeFen), state: pairState(before, after, edge, first, second) });
    this.assertCaptureCurrent(handle); work.pairs.set(afterNodeId, pair); return pair;
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
  nodeCapture(source: RecordedEngineEndpoints, nodeId: string): RecordedEngineNodeCapture & Readonly<{ attachments: RecordedEngineAttachments }> {
    const row = this.resolveRecordedEngineEndpoint(source, nodeId), owned = this.#sources.get(source)!;
    return this.#nodeCapture(owned.attachments, row);
  }

  #nodeCapture<Source extends RecordedEngineAttachmentInput>(attachments: Source, row: Endpoint) {
    const ledger = row.ledger;
    return Object.freeze({ attachments, nodeId: row.position.payload.nodeId, pending: row.pending,
      offline: ledger === null ? null : Object.freeze({ packDigest: ledger.artifact.packDigest,
        ledgerDigest: ledger.artifact.ledgerDigest, manifestDigest: ledger.artifact.manifestDigest,
        ledger: ledger.artifact.ledger, manifest: ledger.artifact.manifest, candidates: ledger.records, abstentions: ledger.abstentions }),
    });
  }

  #node(source: RecordedEngineEndpoints, endpoint: Endpoint) {
    return this.#checkedNode(this.nodeCapture(source, endpoint.position.payload.nodeId), endpoint);
  }

  #checkedNode(capture: RecordedEngineNodeCapture, endpoint: Endpoint) {
    const node = readRecordedEngineNode(capture);
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
