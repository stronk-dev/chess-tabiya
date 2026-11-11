// Explicit Review action: confirm one historical target, then read one original source arm.
// No preferences, provider captures, raw run fetch or flat sentence admission lives here.
import { compileAssistanceRequest, moduleDecisionStamp, parseFinalizedAssistanceV1, presentationDigest, WORKFLOW_CONTEXTS,
  type FinalizedAssistanceV1, type RequestedAssistanceV1, type InspectorQueryRequest, type WorkflowContextId } from "@chess-tabiya/runtime/client";
import { parseInspectorQueryPage, type ParsedInspectorPage } from "./inspector-query-response.js";
import type { ReviewMap } from "./api.js";

export type ReviewDecision = ReturnType<typeof moduleDecisionStamp>;
export interface ReviewAnalyzeTarget {
  readonly runId: string; readonly branchId: string; readonly nodeId: string; readonly entryNodeId: string;
  readonly fen: string; readonly decision: ReviewDecision; readonly workflowContext: WorkflowContextId;
}
export interface ReviewAssistanceRequest {
  readonly assistance: RequestedAssistanceV1;
  readonly review: { readonly branchId: string; readonly nodeId: string; readonly entryNodeId: string; readonly decisionDigest: string };
}
export interface ReviewAnalyzeApi {
  reviewAssistance(runId: string, body: ReviewAssistanceRequest, signal?: AbortSignal): Promise<unknown>;
  inspector(runId: string, body: InspectorQueryRequest, signal?: AbortSignal): Promise<unknown>;
}
export interface ReviewAnalyzeResult { readonly target: ReviewAnalyzeTarget; readonly page: ParsedInspectorPage }
const fail = (message: string): never => { throw new TypeError(`Review Analyze: ${message}`); };
function snapshot(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || ancestors.has(value)) return fail("acyclic own JSON data required");
  const array = Array.isArray(value);
  if (Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype)) return fail("plain own JSON data required");
  const keys = Reflect.ownKeys(value);
  if (array && keys.length !== value.length + 1) return fail("dense plain array required");
  ancestors.add(value);
  try {
    const output: Record<string, unknown> = {};
    for (const key of keys) {
      if (array && key === "length") continue;
      const field = Object.getOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !field.enumerable || !("value" in field)) return fail("own enumerable data fields required");
      Object.defineProperty(output, key, { value: snapshot(field.value, ancestors), enumerable: true });
    }
    if (array) return Object.freeze(Array.from({ length: value.length }, (_, i) => Object.hasOwn(output, i) ? output[i] : fail("dense array required")));
    return Object.freeze(output);
  } finally { ancestors.delete(value); }
}
const record = (value: unknown, keys: readonly string[]): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Reflect.ownKeys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) return fail("closed object shape");
  return value as Record<string, unknown>;
};
const text = (value: unknown): string => typeof value === "string" && value.trim() !== "" ? value : fail("nonempty identity required");
const equal = (a: unknown, b: unknown) => presentationDigest("review.analyze.equal@1", a) === presentationDigest("review.analyze.equal@1", b);
export function parseReviewDecision(input: unknown): ReviewDecision {
  const row = record(snapshot(input), ["eventHeadSeq", "cursor", "disclosureBoundarySeq", "digest"]), cursor = record(row.cursor, ["branchId", "nodeId"]);
  if (!Number.isSafeInteger(row.eventHeadSeq) || Number(row.eventHeadSeq) < 0 || row.disclosureBoundarySeq !== null && (!Number.isSafeInteger(row.disclosureBoundarySeq) || Number(row.disclosureBoundarySeq) < 0 || Number(row.disclosureBoundarySeq) > Number(row.eventHeadSeq))) return fail("decision boundary");
  const body = { eventHeadSeq: Number(row.eventHeadSeq), cursor: { branchId: text(cursor.branchId), nodeId: text(cursor.nodeId) }, disclosureBoundarySeq: row.disclosureBoundarySeq === null ? null : Number(row.disclosureBoundarySeq) };
  if (row.digest !== presentationDigest("module.decision_stamp@1", body)) return fail("decision digest");
  return Object.freeze({ ...body, cursor: Object.freeze(body.cursor), digest: String(row.digest) });
}
export function reviewAnalyzeTarget(review: ReviewMap, nodeId: string): ReviewAnalyzeTarget {
  const row = review.rows.find(row => row.nodeId === nodeId);
  if (row === undefined || row.entryNodeId === review.openRetryEntryNodeId) return fail("reviewed target is not available");
  if (!(WORKFLOW_CONTEXTS as readonly string[]).includes(review.workflowContext)) return fail("workflow context");
  return Object.freeze({ runId: review.runId, branchId: review.branchId, nodeId, entryNodeId: row.entryNodeId, fen: row.fen,
    decision: parseReviewDecision(review.decision), workflowContext: review.workflowContext });
}
export function reviewAnalyzeIntent(target: ReviewAnalyzeTarget): RequestedAssistanceV1 {
  return compileAssistanceRequest({ contextHint: target.workflowContext, preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
}
export function parseReviewAssistanceResponse(input: unknown, target: ReviewAnalyzeTarget, intent: RequestedAssistanceV1): FinalizedAssistanceV1 {
  const body = record(snapshot(input), ["assistance", "review"]), row = record(body.review, ["runId", "branchId", "nodeId", "entryNodeId", "fen", "decision"]);
  if (["runId", "branchId", "nodeId", "entryNodeId", "fen"].some(key => row[key] !== target[key as keyof ReviewAnalyzeTarget]) || !equal(parseReviewDecision(row.decision), target.decision)) return fail("confirmation target/decision mismatch");
  const assistance = parseFinalizedAssistanceV1(body.assistance);
  if (assistance.context !== target.workflowContext || assistance.requestedDigest !== intent.requestDigest) return fail("confirmation assistance/context mismatch");
  return assistance;
}
export function assertReviewAnalyzeResult(result: ReviewAnalyzeResult, target: ReviewAnalyzeTarget): void {
  if (!equal(result.target, target)) return fail("analysis identity changed");
  if (result.page.kind === "page" && (result.page.runId !== target.runId || result.page.branchId !== target.branchId || result.page.nodeId !== target.nodeId || result.page.decision.digest !== target.decision.digest)) return fail("analysis page identity changed");
}
export async function confirmReviewAssistance(api: ReviewAnalyzeApi, target: ReviewAnalyzeTarget, signal: AbortSignal, check: () => void) {
  check();
  const assistance = reviewAnalyzeIntent(target);
  const confirmation: ReviewAssistanceRequest = { assistance, review: { branchId: target.branchId, nodeId: target.nodeId, entryNodeId: target.entryNodeId, decisionDigest: target.decision.digest } };
  const raw = await api.reviewAssistance(target.runId, confirmation, signal);
  check();
  return { assistance, finalized: parseReviewAssistanceResponse(raw, target, assistance) };
}
export async function requestReviewAnalyze(api: ReviewAnalyzeApi, target: ReviewAnalyzeTarget, signal: AbortSignal, current: () => boolean = () => true): Promise<ReviewAnalyzeResult> {
  const active = () => { signal.throwIfAborted(); if (!current()) throw new DOMException("Review Analyze target retired", "AbortError"); };
  const { assistance, finalized } = await confirmReviewAssistance(api, target, signal, active);
  let finalPage: ParsedInspectorPage | undefined;
  for (const projection of ["derived.review.analysis_typed_pv@1", "derived.review.analysis_recorded_pv@1", "derived.review.analysis_recorded_first@1"] as const) {
    active();
    const request: InspectorQueryRequest = { protocol: "inspector.query_page@1", assistance, query: { branchId: target.branchId, nodeId: target.nodeId, decisionDigest: target.decision.digest,
      view: { kind: "source", projection, context: { kind: "incoming_edge" }, start: 0, collectionKey: null } } };
    const raw = await api.inspector(target.runId, request, signal); active();
    finalPage = parseInspectorQueryPage(raw, { runId: target.runId, request, fen: target.fen, requestedDigest: assistance.requestDigest, finalDigest: finalized.finalDigest });
    if (finalPage.kind !== "page" || finalPage.body.kind !== "source" || finalPage.body.outcome.kind !== "unavailable" || finalPage.body.outcome.reason !== "source_absent") break;
  }
  active();
  if (finalPage === undefined) return fail("no source response");
  return Object.freeze({ target, page: finalPage });
}
