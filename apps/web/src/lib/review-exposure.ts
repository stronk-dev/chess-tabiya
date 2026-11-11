import { parseInspectorDetailPayload, parsePresentationReceipt, type InspectorQueryRequest, type PresentedEvidenceItem } from "@chess-tabiya/runtime/client";
import type { ExposureDetailScope } from "../../../../packages/runtime/src/defender-exposure-detail.js";
import type { InspectorDetailPayload } from "../../../../packages/runtime/src/inspector-detail.js";
import type { ReviewMap } from "./api.js";
import { parseInspectorQueryPage } from "./inspector-query-response.js";
import { confirmReviewAssistance, reviewAnalyzeTarget, type ReviewAnalyzeApi } from "./review-analyze.js";

type ReviewRow = ReviewMap["rows"][number];
export type ReviewExposureOccurrence = Extract<ReviewRow["defenderExposure"], { kind: "available" }>["occurrences"][number];
export type ReviewExposurePage = InspectorDetailPayload<"defender_exposure">;
export interface ReviewExposureSession {
  readonly initialPage: ReviewExposurePage;
  read(scope: ExposureDetailScope, start: number, signal: AbortSignal, current: () => boolean): Promise<ReviewExposurePage>;
}

const projection = "derived.tactic.defender_exposure@2";
const context = { kind: "incoming_edge" } as const;
const fail = (): never => { throw new TypeError("The exact defender exposure is unavailable"); };

export function reviewExposureFacts(row: ReviewRow, items: readonly PresentedEvidenceItem[]) {
  if (row.defenderExposure.kind !== "available") return [];
  const occurrences = row.defenderExposure.occurrences;
  const facts = items.filter(item => item.adapter.projection.id === "derived.tactic.defender_exposure" && item.adapter.projection.version === 2);
  if (facts.length !== occurrences.length) return fail();
  return facts.map((fact, index) => {
    const occurrence = occurrences[index]!;
    if (fact.componentDigest !== occurrence.componentDigest || fact.evidenceRef === null || fact.component.id !== "fact_statement"
      || fact.component.operand.rendererId !== "review.defender_exposure@1") return fail();
    return { occurrence, evidenceRef: fact.evidenceRef, summary: fact.component.operand.operands };
  });
}

export async function openReviewExposure(api: ReviewAnalyzeApi, review: ReviewMap, nodeId: string, occurrence: ReviewExposureOccurrence,
  signal: AbortSignal, current: () => boolean): Promise<ReviewExposureSession> {
  const target = reviewAnalyzeTarget(review, nodeId);
  const row = review.rows.find(candidate => candidate.nodeId === nodeId)!;
  const fact = reviewExposureFacts(row, parsePresentationReceipt(row.packet)).find(candidate =>
    candidate.occurrence.factoryOrdinal === occurrence.factoryOrdinal && candidate.occurrence.componentDigest === occurrence.componentDigest) ?? fail();
  const active = (requestSignal: AbortSignal = signal, pageCurrent: () => boolean = current) => {
    signal.throwIfAborted();
    requestSignal.throwIfAborted();
    if (!current() || !pageCurrent()) throw new DOMException("Review inspection retired", "AbortError");
  };
  const { assistance, finalized } = await confirmReviewAssistance(api, target, signal, active);
  if (!finalized.modules.includes("full_inspector")) return fail();

  async function query(view: InspectorQueryRequest["query"]["view"], requestSignal: AbortSignal, pageCurrent: () => boolean) {
    active(requestSignal, pageCurrent);
    const request: InspectorQueryRequest = { protocol: "inspector.query_page@1", assistance, query: {
      branchId: target.branchId, nodeId: target.nodeId, decisionDigest: target.decision.digest, view,
    } };
    const raw = await api.inspector(target.runId, request, requestSignal);
    active(requestSignal, pageCurrent);
    return parseInspectorQueryPage(raw, { runId: target.runId, request, fen: target.fen,
      requestedDigest: assistance.requestDigest, finalDigest: finalized.finalDigest });
  }

  async function source(start: number, collectionKey: string | null) {
    const page = await query({ kind: "source", projection, context, start, collectionKey }, signal, current);
    if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") return fail();
    return { page, outcome: page.body.outcome };
  }
  let { page, outcome } = await source(0, null);
  let index = page.disclosure.sourceOrdinals.indexOf(occurrence.factoryOrdinal);
  if (index < 0 || outcome.facts[index]?.disposition === "deferred") {
    if (occurrence.factoryOrdinal === 0) return fail();
    ({ page, outcome } = await source(occurrence.factoryOrdinal, outcome.collectionKey));
    index = page.disclosure.sourceOrdinals.indexOf(occurrence.factoryOrdinal);
  }
  const selected = outcome.facts[index];
  if (selected?.disposition !== "presented" || selected.detail !== "derived.inspector.detail.defender_exposure@1") return fail();
  const sourceRef = page.items[outcome.facts.slice(0, index).filter(item => item.disposition === "presented").length]?.evidenceRef;
  if (sourceRef == null || sourceRef.evidenceDigest !== fact.evidenceRef.evidenceDigest
    || sourceRef.producer.id !== fact.evidenceRef.producer.id || sourceRef.producer.version !== fact.evidenceRef.producer.version
    || sourceRef.projection.id !== fact.evidenceRef.projection.id || sourceRef.projection.version !== fact.evidenceRef.projection.version) return fail();
  const sourceKey = selected.sourceKey;

  const read: ReviewExposureSession["read"] = async (scope, start, requestSignal, pageCurrent) => {
    const result = await query({ kind: "detail", projection, context, sourceKey, scope, start }, requestSignal, pageCurrent);
    if (result.kind !== "page" || result.body.kind !== "detail" || result.items[0]?.component.id !== "fact_statement") return fail();
    const detail = parseInspectorDetailPayload("defender_exposure", result.items[0].component.operand.operands);
    const { defender, target: exposed, captureCount, passConvention, moveUci } = detail.context;
    const summary = fact.summary;
    if (moveUci !== row.moveUci || captureCount !== summary.captureCount || passConvention !== summary.passConvention
      || defender.square !== summary.defender.square || defender.piece.role !== summary.defender.role || defender.piece.color !== summary.defender.color
      || exposed.square !== summary.target.square || exposed.piece.role !== summary.target.role || exposed.piece.color !== summary.target.color) return fail();
    return detail;
  };
  const initialPage = await read({ kind: "exposure_captures" }, 0, signal, current);
  return { initialPage, read };
}
