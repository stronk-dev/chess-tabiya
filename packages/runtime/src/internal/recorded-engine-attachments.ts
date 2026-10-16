// Accepted grades §2a / F2 §2.3a: durable modern attachments only, below the complete
// endpoint resolver. No pending/job/ledger selection, access grant, grade or provider request.
import { assertDeclaredEvidence, evidenceValueReceipt, type DeclaredEvidence } from "../evidence-contract.js";
import { parsePersistedProviderDelivery } from "../provider-exchange.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "../recorded-review-boundary.js";
import { isClosedReviewSourceRecord, REVIEW_PROVIDER_DELIVERY_KEY } from "../review-evidence.js";
import type { RecordedPosition, ReviewEnginePoint, StockfishPositionEvaluation } from "../review-points.js";
import type { EvidenceAttachedEvent } from "../types.js";
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
const sources = new WeakMap<object, Readonly<{ boundary: RecordedReviewBoundary; data: AttachmentData }>>();

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

/** Capture every original prefix node and attachment. No caller readings, scores or callbacks. */
export function collectRecordedEngineAttachments(input: Readonly<{ boundary: RecordedReviewBoundary }>): RecordedEngineAttachments {
  if (!isClosedReviewSourceRecord(input, ["boundary"])) throw new TypeError("Recorded engine attachments require exactly {boundary}");
  const boundary = input.boundary, image = readRecordedReviewBoundary(boundary);
  const byNode = new Map(image.path.map(entry => [entry.node.id, [] as (LegacyOccurrence | ModernOccurrence)[]]));
  for (const [eventOrdinal, event] of image.run.events.entries()) {
    if (event.type !== "evidence.attached") continue;
    const occurrences = byNode.get(event.data.nodeId);
    if (occurrences === undefined) continue;
    const payload = event.data.payload, modern = Object.hasOwn(payload.values, REVIEW_PROVIDER_DELIVERY_KEY);
    if (modern) {
      if (payload.kind !== "eval" || payload.source !== "engine_validated") throw new TypeError("Recorded modern engine attachment has an invalid kind/source");
      // A corrupt modern occurrence is fatal even beside another valid modern or scalar report.
      // Do not catch parse errors into absence, search backward or use the legacy scalar fields.
      const delivery = parsePersistedProviderDelivery("stockfish.position_evaluation@1", payload.values[REVIEW_PROVIDER_DELIVERY_KEY]);
      const node = image.path.find(entry => entry.node.id === event.data.nodeId)!.node;
      if (delivery.payload.fen !== node.fen) throw new TypeError("Recorded modern engine attachment crosses its exact full FEN");
      const evaluation = invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery });
      if (evaluation.payload !== delivery) throw new TypeError("Recorded engine evaluation is not its original parsed delivery");
      occurrences.push(Object.freeze({ kind: "modern", eventOrdinal, event, evaluation }));
    } else if (payload.kind === "eval" && payload.source === "engine_validated") occurrences.push(Object.freeze({ kind: "legacy", eventOrdinal, event }));
  }
  const rows = Object.freeze(image.path.map(({ node }): AttachmentRow => {
    const position = invokeEvidenceValueRoute("run.record.position@1", { run: image.run, nodeId: node.id });
    const occurrences = Object.freeze(byNode.get(node.id)!);
    const occurrence = occurrences.filter((item): item is ModernOccurrence => item.kind === "modern").at(-1);
    if (occurrence === undefined) return Object.freeze({ position, occurrences, selected: null });
    const result = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: occurrence.evaluation, position });
    const inputs = readReviewPointResultInvocation(result);
    if (inputs.position !== position || inputs.evaluation !== occurrence.evaluation || result.kind !== "available") throw new TypeError("Recorded engine point is not its original matched invocation");
    return Object.freeze({ position, occurrences, selected: Object.freeze({ occurrence, point: result.value }) });
  }));
  const data = Object.freeze({ boundary: image, rows });
  for (const [index, row] of rows.entries()) assertRow(row, image, index);
  if (readRecordedReviewBoundary(boundary) !== image) throw new TypeError("Recorded engine attachment boundary changed during collection");
  const source = Object.freeze({}) as RecordedEngineAttachments;
  sources.set(source, Object.freeze({ boundary, data })); return source;
}

/** Internal original membership/current storage, not a service permission or complete endpoint. */
export function readRecordedEngineAttachments(source: RecordedEngineAttachments): AttachmentData {
  const owned = source !== null && typeof source === "object" ? sources.get(source) : undefined;
  if (owned === undefined) throw new TypeError("Recorded engine attachments were not issued by their owner");
  const image = readRecordedReviewBoundary(owned.boundary);
  if (image !== owned.data.boundary || owned.data.rows.length !== image.path.length) throw new TypeError("Recorded engine attachment source crossed its original boundary");
  for (const [index, row] of owned.data.rows.entries()) assertRow(row, image, index);
  return owned.data;
}
