// Accepted grades §2a / F2 §2.3a: durable modern attachments only, below the complete
// endpoint resolver. No pending/job/ledger selection, access grant, grade or provider request.
import { assertDeclaredEvidence, evidenceValueReceipt, type DeclaredEvidence } from "../evidence-contract.js";
import { parsePersistedProviderDelivery } from "../provider-exchange.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "../recorded-review-boundary.js";
import { isClosedReviewSourceRecord, REVIEW_PROVIDER_DELIVERY_KEY } from "../review-evidence.js";
import type { RecordedPosition, ReviewEnginePoint, StockfishPositionEvaluation } from "../review-points.js";
import type { EvidenceAttachedEvent } from "../types.js";
import type { RecordedEdge } from "../recorded-edge.js";
import { assertRecordedPositionInvocation, invokeEvidenceValueRoute, readReviewPointInvocation, readReviewPointResultInvocation } from "./evidence-value-routes.js";

declare const attachmentsBrand: unique symbol;
export interface RecordedEngineAttachments { readonly [attachmentsBrand]: true }
interface LegacyOccurrence {
  readonly kind: "legacy"; readonly eventOrdinal: number; readonly event: EvidenceAttachedEvent;
}
interface ModernOccurrence {
  readonly kind: "modern"; readonly eventOrdinal: number; readonly event: EvidenceAttachedEvent;
  readonly evaluation: DeclaredEvidence<StockfishPositionEvaluation>;
}
interface AttachmentRow {
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly occurrences: readonly (LegacyOccurrence | ModernOccurrence)[];
  /** Null means no modern attachment, not no evaluation, provider-off or an inferred pending job. */
  readonly selected: Readonly<{ occurrence: ModernOccurrence; point: DeclaredEvidence<ReviewEnginePoint> }> | null;
}
interface AttachmentData {
  readonly boundary: ReturnType<typeof readRecordedReviewBoundary>;
  readonly rows: readonly AttachmentRow[];
}
interface AttachmentScope {
  readonly boundary: RecordedReviewBoundary;
  readonly image: AttachmentData["boundary"];
  readonly origin: object;
}
interface AttachmentWork extends AttachmentScope {
  readonly nodes: Map<string, RecordedEngineAttachmentNode>;
  readonly byNode: ReadonlyMap<string, readonly { readonly eventOrdinal: number; readonly event: EvidenceAttachedEvent }[]>;
  readonly rows: AttachmentRow[];
}
declare const attachmentCollectionBrand: unique symbol;
/** Metadata/index and acquired rows; never admitted by the complete aggregate reader. */
export interface RecordedEngineAttachmentCollection { readonly [attachmentCollectionBrand]: true }
declare const attachmentNodeBrand: unique symbol;
/** One completed original node, not a partial aggregate or an access grant. */
export interface RecordedEngineAttachmentNode { readonly [attachmentNodeBrand]: true }
export type RecordedEngineAttachmentInput = RecordedEngineAttachments | RecordedEngineAttachmentNode;
const sources = new WeakMap<object, Readonly<{ scope: AttachmentScope; data: AttachmentData; nodes: Map<string, RecordedEngineAttachmentNode> }>>();
const collections = new WeakMap<object, AttachmentWork>();
const nodeSources = new WeakMap<object, Readonly<{ scope: AttachmentScope; data: Readonly<{ boundary: AttachmentData["boundary"]; row: AttachmentRow }> }>>();

function current(scope: AttachmentScope): void {
  if (readRecordedReviewBoundary(scope.boundary) !== scope.image) throw new TypeError("Recorded engine attachment boundary changed");
}
function prepare(input: Readonly<{ boundary: RecordedReviewBoundary }>): AttachmentWork {
  if (!isClosedReviewSourceRecord(input, ["boundary"])) throw new TypeError("Recorded engine attachments require exactly {boundary}");
  const boundary = input.boundary, image = readRecordedReviewBoundary(boundary);
  const byNode = new Map(image.path.map(entry => [entry.node.id, [] as { eventOrdinal: number; event: EvidenceAttachedEvent }[]]));
  for (const [eventOrdinal, event] of image.run.events.entries()) {
    if (event.type === "evidence.attached") byNode.get(event.data.nodeId)?.push(Object.freeze({ eventOrdinal, event }));
  }
  return { boundary, image, origin: Object.freeze({}), nodes: new Map(), rows: [], byNode };
}

function captureOccurrence(scope: AttachmentScope, eventOrdinal: number, event: EvidenceAttachedEvent): LegacyOccurrence | ModernOccurrence | null {
  const payload = event.data.payload;
  if (Object.hasOwn(payload.values, REVIEW_PROVIDER_DELIVERY_KEY)) {
    if (payload.kind !== "eval" || payload.source !== "engine_validated") throw new TypeError("Recorded modern engine attachment has an invalid kind/source");
    // Every original occurrence is checked, even when a later valid occurrence exists.
    const delivery = parsePersistedProviderDelivery("stockfish.position_evaluation@1", payload.values[REVIEW_PROVIDER_DELIVERY_KEY]);
    const node = scope.image.path.find(entry => entry.node.id === event.data.nodeId)!.node;
    if (delivery.payload.fen !== node.fen) throw new TypeError("Recorded modern engine attachment crosses its exact full FEN");
    const evaluation = invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery });
    if (evaluation.payload !== delivery) throw new TypeError("Recorded engine evaluation is not its original parsed delivery");
    return Object.freeze({ kind: "modern", eventOrdinal, event, evaluation });
  }
  return payload.kind === "eval" && payload.source === "engine_validated" ? Object.freeze({ kind: "legacy", eventOrdinal, event }) : null;
}
function captureRow(scope: AttachmentScope, index: number, original: readonly (LegacyOccurrence | ModernOccurrence)[]): AttachmentRow {
  const node = scope.image.path[index]!.node;
  const position = invokeEvidenceValueRoute("run.record.position@1", { run: scope.image.run, nodeId: node.id });
  const occurrences = Object.freeze([...original]), occurrence = occurrences.filter((item): item is ModernOccurrence => item.kind === "modern").at(-1);
  if (occurrence === undefined) return Object.freeze({ position, occurrences, selected: null });
  const result = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: occurrence.evaluation, position });
  const inputs = readReviewPointResultInvocation(result);
  if (inputs.position !== position || inputs.evaluation !== occurrence.evaluation || result.kind !== "available") throw new TypeError("Recorded engine point is not its original matched invocation");
  return Object.freeze({ position, occurrences, selected: Object.freeze({ occurrence, point: result.value }) });
}
function finish(work: AttachmentWork): RecordedEngineAttachments {
  if (work.rows.length !== work.image.path.length) throw new TypeError("Recorded engine attachment collection is incomplete");
  for (const [index, row] of work.rows.entries()) assertRow(row, work.image, index);
  current(work);
  const source = Object.freeze({}) as RecordedEngineAttachments;
  sources.set(source, Object.freeze({ scope: Object.freeze({ boundary: work.boundary, image: work.image, origin: work.origin }),
    data: Object.freeze({ boundary: work.image, rows: Object.freeze([...work.rows]) }), nodes: work.nodes }));
  return source;
}

function assertRow(row: AttachmentRow, image: AttachmentData["boundary"], index: number): void {
  const node = image.path[index]?.node;
  if (node === undefined) throw new TypeError("Recorded engine attachment has no original path occurrence");
  assertRecordedPositionInvocation(row.position, image.run, node.id);
  let selected: ModernOccurrence | undefined, previousOrdinal = -1;
  for (const occurrence of row.occurrences) {
    if (occurrence.eventOrdinal <= previousOrdinal || image.run.events[occurrence.eventOrdinal] !== occurrence.event
      || occurrence.event.seq !== occurrence.eventOrdinal + 1 || occurrence.event.data.nodeId !== node.id) throw new TypeError("Recorded engine attachment lost its original event/head/node occurrence");
    previousOrdinal = occurrence.eventOrdinal;
    if (occurrence.kind === "modern") {
      assertDeclaredEvidence(occurrence.evaluation);
      if (occurrence.evaluation.projection.id !== "live.stockfish.position_eval" || occurrence.evaluation.projection.version !== 1
        || evidenceValueReceipt(occurrence.evaluation).factory !== "createLiveStockfishPositionEvalV1Evidence"
        || occurrence.evaluation.payload.payload.fen !== node.fen) throw new TypeError("Recorded engine attachment lost its exact modern delivery/FEN join");
      selected = occurrence;
    }
  }
  if (selected === undefined) { if (row.selected !== null) throw new TypeError("Recorded engine selection invented a modern attachment"); return; }
  if (row.selected?.occurrence !== selected) throw new TypeError("Recorded engine selection is not the latest original modern occurrence");
  const inputs = readReviewPointInvocation(row.selected.point);
  if (inputs.position !== row.position || inputs.evaluation !== selected.evaluation) throw new TypeError("Recorded engine point crosses its original attachment/position");
}

/** Original synchronous order: all original events, then every position/point, same helpers. */
export function collectRecordedEngineAttachments(input: Readonly<{ boundary: RecordedReviewBoundary }>): RecordedEngineAttachments {
  const work = prepare(input), occurrences = new Map(work.image.path.map(entry => [entry.node.id, [] as (LegacyOccurrence | ModernOccurrence)[]]));
  for (const [eventOrdinal, event] of work.image.run.events.entries()) {
    if (event.type !== "evidence.attached") continue;
    const rows = occurrences.get(event.data.nodeId); if (rows === undefined) continue;
    const captured = captureOccurrence(work, eventOrdinal, event); if (captured !== null) rows.push(captured);
  }
  for (const [index, entry] of work.image.path.entries()) work.rows.push(captureRow(work, index, occurrences.get(entry.node.id)!));
  return finish(work);
}

export function beginRecordedEngineAttachmentCollection(input: Readonly<{ boundary: RecordedReviewBoundary }>): RecordedEngineAttachmentCollection {
  const work = prepare(input), handle = Object.freeze({}) as RecordedEngineAttachmentCollection;
  collections.set(handle, work); return handle;
}
function workOf(handle: RecordedEngineAttachmentCollection): AttachmentWork {
  const work = handle !== null && typeof handle === "object" ? collections.get(handle) : undefined;
  if (work === undefined) throw new TypeError("Recorded engine attachment collection is foreign or retired");
  return work;
}
/** One original node's complete occurrences, position and point. No later node factory runs. */
export function advanceRecordedEngineAttachmentCollection(handle: RecordedEngineAttachmentCollection): Readonly<{
  nodeId: string; completedSubjects: number; totalSubjects: number; complete: boolean;
}> {
  const work = workOf(handle), index = work.rows.length;
  if (index === work.image.path.length) throw new TypeError("Recorded engine attachment collection has no remaining node");
  try {
    current(work);
    const node = work.image.path[index]!.node, occurrences = work.byNode.get(node.id)!.flatMap(({ eventOrdinal, event }) => {
      const result = captureOccurrence(work, eventOrdinal, event); return result === null ? [] : [result];
    });
    const row = captureRow(work, index, occurrences); assertRow(row, work.image, index);
    current(work); work.rows.push(row);
    return Object.freeze({ nodeId: node.id, completedSubjects: work.rows.length, totalSubjects: work.image.path.length, complete: work.rows.length === work.image.path.length });
  } catch (error) { collections.delete(handle); throw error; }
}
export function finishRecordedEngineAttachmentCollection(handle: RecordedEngineAttachmentCollection): RecordedEngineAttachments {
  const work = workOf(handle);
  if (work.rows.length !== work.image.path.length) throw new TypeError("Recorded engine attachment collection is incomplete");
  try { return finish(work); } finally { collections.delete(handle); }
}
export function cancelRecordedEngineAttachmentCollection(handle: RecordedEngineAttachmentCollection): boolean {
  return handle !== null && typeof handle === "object" && collections.delete(handle);
}

/** Original complete aggregate reader. Neither collection nor completed-node handles qualify. */
export function readRecordedEngineAttachments(source: RecordedEngineAttachments): AttachmentData {
  const owned = source !== null && typeof source === "object" ? sources.get(source) : undefined;
  if (owned === undefined) throw new TypeError("Recorded engine attachments were not issued by their owner");
  current(owned.scope);
  if (owned.data.rows.length !== owned.scope.image.path.length) throw new TypeError("Recorded engine attachment source crossed its original boundary");
  return owned.data;
}

/** Publish only an already acquired original node. Does not collect, grade or authorize. */
export function recordedEngineAttachmentNode(source: RecordedEngineAttachments | RecordedEngineAttachmentCollection, nodeId: string): RecordedEngineAttachmentNode {
  const full = source !== null && typeof source === "object" ? sources.get(source) : undefined;
  const work = full === undefined ? workOf(source as RecordedEngineAttachmentCollection) : undefined;
  const scope = full?.scope ?? work!;
  current(scope);
  const row = (full?.data.rows ?? work!.rows).find(row => row.position.payload.nodeId === nodeId);
  if (row === undefined) throw new TypeError("Recorded engine attachment node has not been acquired in its original scope");
  const nodes = full?.nodes ?? work!.nodes, previous = nodes.get(nodeId); if (previous !== undefined) return previous;
  const node = Object.freeze({}) as RecordedEngineAttachmentNode;
  nodeSources.set(node, Object.freeze({ scope: Object.freeze({ boundary: scope.boundary, image: scope.image, origin: scope.origin }),
    data: Object.freeze({ boundary: scope.image, row }) }));
  nodes.set(nodeId, node); return node;
}
function nodeOwner(source: RecordedEngineAttachmentInput, nodeId: string) {
  const direct = source !== null && typeof source === "object" ? nodeSources.get(source) : undefined;
  if (direct !== undefined) {
    current(direct.scope);
    if (direct.data.row.position.payload.nodeId !== nodeId) throw new TypeError("Recorded engine attachment node crosses its original occurrence");
    return direct;
  }
  if (source === null || typeof source !== "object" || !sources.has(source)) throw new TypeError("Recorded engine attachment source was not issued by its owner");
  return nodeSources.get(recordedEngineAttachmentNode(source as RecordedEngineAttachments, nodeId))!;
}
export function readRecordedEngineAttachmentNode(source: RecordedEngineAttachmentInput, nodeId: string): Readonly<{ boundary: AttachmentData["boundary"]; row: AttachmentRow }> {
  return nodeOwner(source, nodeId).data;
}
/** Same original capture scope, not merely equal FENs, bytes or two independent node captures. */
export function sameRecordedEngineAttachmentSource(first: RecordedEngineAttachmentInput, firstNodeId: string,
  second: RecordedEngineAttachmentInput, secondNodeId: string): boolean {
  return nodeOwner(first, firstNodeId).scope.origin === nodeOwner(second, secondNodeId).scope.origin;
}

/** One actual incoming edge in this original source prefix, through the sole evidence dispatcher.
 * Not a raw run/payload factory wrapper or permission to grade its measurements. */
export function collectRecordedEngineEdge(source: RecordedEngineAttachmentInput, afterNodeId: string): DeclaredEvidence<RecordedEdge> {
  const { boundary } = readRecordedEngineAttachmentNode(source, afterNodeId);
  const index = boundary.path.findIndex(entry => entry.node.id === afterNodeId);
  if (index <= 0) throw new TypeError("Recorded engine edge is outside the original incoming-edge prefix");
  const edge = invokeEvidenceValueRoute("run.record.edge@1", { run: boundary.run,
    parent: boundary.path[index - 1]!.node, child: boundary.path[index]!.node });
  readRecordedEngineAttachmentNode(source, afterNodeId);
  return edge;
}
