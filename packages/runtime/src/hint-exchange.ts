// rfc/hint-distance.md §4, §5, §7 — the Guided Hint wire: decision stamp, request identity, the closed
// `HintResponse` union and the `HintDeliveryReceipt` both sides validate.
//
// The F1 seal is process-local and cannot survive JSON ([[D1582]]). The server therefore terminates
// the admitted, rendered, voice-checked item in this closed receipt; the browser validates the shape,
// recomputes the digest, checks the exact family x rung projection id and renders only the sentence
// and marks it carries. Nothing here claims to re-create evidence admission in the browser.

import { assistanceDigest, type AssistanceDigest } from "./assistance-exchange.js";
import { feedbackDeliveryOpen } from "./feedback.js";
import {
  HINT_DISTANCES,
  HINT_FAMILIES,
  HINT_RELATIONS,
  HINT_RUNGS,
  hintDisclosureIdentity,
  hintDisclosureProjectionId,
  type HintDisclosureProjectionId,
  type HintFamily,
  type HintRelation,
  type HintRung,
} from "./hint-registry.js";
import type { DrillRun } from "./types.js";

// ---------------------------------------------------------------------------------------------
// §5 — the decision stamp. There is no `committedMoveCount` or run revision ([[D1643]], [[D1858]]).

export interface HintDecisionStamp {
  readonly eventHeadSeq: number;
  readonly cursor: { readonly branchId: string; readonly nodeId: string };
  readonly disclosureBoundarySeq: number | null;
  readonly digest: AssistanceDigest;
}

/**
 * The exact currently open disclosure occurrence, or null when delivery is closed. It follows the
 * shipped disclosure model (`feedbackDeliveryOpen`): the last reveal/outcome since the last commit
 * for `attempt_end`, the opening checkpoint/segment/outcome for the delayed policies, and the run's
 * own first event for `immediate_guard`, whose pack consented to open delivery for the whole run.
 */
export function hintDisclosureBoundarySeq(run: DrillRun): number | null {
  if (!feedbackDeliveryOpen(run)) return null;
  const opening: Readonly<Record<DrillRun["feedbackPolicy"], readonly string[]>> = {
    attempt_end: ["feedback.revealed", "outcome.reached"],
    delayed_checkpoint: ["checkpoint.reached", "outcome.reached"],
    segment_end: ["segment.completed", "outcome.reached"],
    immediate_guard: [],
  };
  const types = opening[run.feedbackPolicy];
  if (types.length === 0) return run.events[0]?.seq ?? 0;
  let boundary: number | null = null;
  for (const event of run.events) {
    if (types.includes(event.type)) boundary = event.seq;
    else if (run.feedbackPolicy === "attempt_end" && event.type === "move.committed") boundary = null;
  }
  return boundary;
}

/** §5: one exact decision identity over bytes that exist: run, event head, cursor and open boundary. */
export function hintDecisionStamp(run: DrillRun): HintDecisionStamp {
  const eventHeadSeq = run.events.length === 0 ? 0 : run.events[run.events.length - 1]!.seq;
  const cursor = Object.freeze({ branchId: run.activeCursor.branchId, nodeId: run.activeCursor.nodeId });
  const disclosureBoundarySeq = hintDisclosureBoundarySeq(run);
  return Object.freeze({ eventHeadSeq, cursor, disclosureBoundarySeq, digest: assistanceDigest({ runId: run.id, eventHeadSeq, cursor, disclosureBoundarySeq }) });
}

/** §7 step 2: deterministic request identity; a repeated POST joins the same operation. */
export function hintRequestId(input: { readonly decisionDigest: string; readonly rung: HintRung; readonly manifestDigest: string; readonly compiler: string; readonly source: string }): string {
  return assistanceDigest({ kind: "guided_hint_request@1", ...input }).slice("sha256:".length, "sha256:".length + 32);
}

// ---------------------------------------------------------------------------------------------
// §4 — the closed delivery receipt.

export interface HintPieceMark { readonly color: "white" | "black"; readonly role: "pawn" | "knight" | "bishop" | "rook" | "queen" | "king"; readonly square: string }

/** A rung-discriminated closed union; a lower arm cannot carry a higher field. */
export type HintDeliveryMarks =
  | { readonly rung: "pattern" }
  | { readonly rung: "square"; readonly squares: readonly string[] }
  | { readonly rung: "piece"; readonly squares: readonly string[]; readonly piece: HintPieceMark }
  | { readonly rung: "distance"; readonly squares: readonly string[]; readonly piece: HintPieceMark }
  | { readonly rung: "move"; readonly squares: readonly string[]; readonly piece: HintPieceMark; readonly arrow: { readonly from: string; readonly to: string } };

export type HintVoiceState =
  | { readonly state: "not_requested" }
  | { readonly state: "rendered"; readonly sentence: string }
  | { readonly state: "fallback"; readonly reason: "provider_unavailable" | "deadline_exceeded" | "refused" | "invalid_output" };

export interface HintDeliveryReceipt {
  readonly version: 1;
  readonly requestId: string;
  readonly runId: string;
  readonly decision: HintDecisionStamp;
  readonly rung: HintRung;
  readonly family: HintFamily;
  readonly projectionId: HintDisclosureProjectionId;
  readonly disclosureDigest: string;
  readonly manifestDigest: string;
  readonly rendered: {
    readonly source: "deterministic";
    readonly sentence: string;
    readonly voice: HintVoiceState;
  };
  readonly marks: HintDeliveryMarks;
  readonly receiptDigest: AssistanceDigest;
}

// ---------------------------------------------------------------------------------------------
// §7 — the closed response union. `source_unavailable` (search) and voice fallback are distinct
// ([[D1638]]): voice failure never turns an available hint into a source failure.

export const HINT_EMPTY_REASONS = Object.freeze(["no_admitted_occurrence", "terminal_position"] as const);
export type HintEmptyReason = (typeof HINT_EMPTY_REASONS)[number];
export const HINT_SOURCE_REASONS = Object.freeze(["provider_unavailable", "deadline_exceeded", "queue_full", "cancelled", "invalid_response", "identity_mismatch"] as const);
export type HintSourceReason = (typeof HINT_SOURCE_REASONS)[number];
export const HINT_POLICY_REASONS = Object.freeze(["module_inactive", "above_ceiling", "disclosure_closed", "not_your_decision", "rated_game_open"] as const);
export type HintPolicyReason = (typeof HINT_POLICY_REASONS)[number];
export const HINT_FAILURE_REASONS = Object.freeze(["contract_violation", "internal_error"] as const);
export type HintFailureReason = (typeof HINT_FAILURE_REASONS)[number];

export type HintResponse =
  | { readonly state: "pending"; readonly requestId: string; readonly rung: HintRung }
  | { readonly state: "available"; readonly delivery: HintDeliveryReceipt }
  | { readonly state: "honest_empty"; readonly requestId: string; readonly rung: HintRung; readonly reason: HintEmptyReason }
  | { readonly state: "source_unavailable"; readonly requestId: string; readonly rung: HintRung; readonly reason: HintSourceReason }
  | { readonly state: "policy_refused"; readonly rung: HintRung; readonly reason: HintPolicyReason }
  | { readonly state: "failed"; readonly requestId: string; readonly rung: HintRung; readonly reason: HintFailureReason }
  | { readonly state: "stale" | "cancelled"; readonly requestId: string; readonly rung: HintRung };

// ---------------------------------------------------------------------------------------------
// Receipt digest and strict parsers (server self-check and browser admission share one parser).

export class HintExchangeError extends TypeError {
  constructor(message: string) {
    super(`HINT_EXCHANGE_INVALID: ${message}`);
    this.name = "HintExchangeError";
  }
}

const fail = (message: string): never => { throw new HintExchangeError(message); };
const plain = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exactKeys = (value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const SQUARE = /^[a-h][1-8]$/u;
const COLORS = ["white", "black"];
const ROLES = ["pawn", "knight", "bishop", "rook", "queen", "king"];
const DIGEST = /^sha256:[0-9a-f]{64}$/u;
const REQUEST_ID = /^[0-9a-f]{32}$/u;

/** §4: the receipt digest covers canonical JSON of every preceding field. */
export function hintReceiptDigest(receipt: Omit<HintDeliveryReceipt, "receiptDigest">): AssistanceDigest {
  return assistanceDigest(receipt);
}

function parseSquares(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((square) => typeof square !== "string" || !SQUARE.test(square))) return fail("marks squares must be a non-empty square list");
  return value as readonly string[];
}

function parsePiece(value: unknown): HintPieceMark {
  if (!plain(value) || !exactKeys(value, ["color", "role", "square"]) || !COLORS.includes(value.color as string) || !ROLES.includes(value.role as string) || typeof value.square !== "string" || !SQUARE.test(value.square)) return fail("marks piece is malformed");
  return value as unknown as HintPieceMark;
}

function parseMarks(value: unknown, rung: HintRung): HintDeliveryMarks {
  if (!plain(value) || value.rung !== rung) return fail("marks must carry the receipt's rung");
  const keys: Readonly<Record<HintRung, readonly string[]>> = { pattern: ["rung"], square: ["rung", "squares"], piece: ["rung", "squares", "piece"], distance: ["rung", "squares", "piece"], move: ["rung", "squares", "piece", "arrow"] };
  if (!exactKeys(value, keys[rung])) return fail(`marks for ${rung} carry fields another rung owns`);
  if (rung !== "pattern") parseSquares(value.squares);
  if (rung === "piece" || rung === "distance" || rung === "move") parsePiece(value.piece);
  if (rung === "move") {
    const arrow = value.arrow;
    if (!plain(arrow) || !exactKeys(arrow, ["from", "to"]) || typeof arrow.from !== "string" || !SQUARE.test(arrow.from) || typeof arrow.to !== "string" || !SQUARE.test(arrow.to)) fail("the move arrow is malformed");
  }
  return value as unknown as HintDeliveryMarks;
}

function parseVoice(value: unknown): HintVoiceState {
  if (!plain(value)) return fail("voice state must be an object");
  if (value.state === "not_requested" && exactKeys(value, ["state"])) return value as unknown as HintVoiceState;
  if (value.state === "rendered" && exactKeys(value, ["state", "sentence"]) && typeof value.sentence === "string" && value.sentence.trim() !== "") return value as unknown as HintVoiceState;
  if (value.state === "fallback" && exactKeys(value, ["state", "reason"]) && ["provider_unavailable", "deadline_exceeded", "refused", "invalid_output"].includes(value.reason as string)) return value as unknown as HintVoiceState;
  return fail("voice state is not one of the three closed arms");
}

function parseStamp(value: unknown): HintDecisionStamp {
  if (!plain(value) || !exactKeys(value, ["eventHeadSeq", "cursor", "disclosureBoundarySeq", "digest"])) return fail("decision stamp shape");
  const cursor = value.cursor;
  if (!Number.isSafeInteger(value.eventHeadSeq) || !plain(cursor) || !exactKeys(cursor, ["branchId", "nodeId"]) || typeof cursor.branchId !== "string" || typeof cursor.nodeId !== "string"
    || !(value.disclosureBoundarySeq === null || Number.isSafeInteger(value.disclosureBoundarySeq)) || typeof value.digest !== "string" || !DIGEST.test(value.digest)) return fail("decision stamp values");
  return value as unknown as HintDecisionStamp;
}

/**
 * Strict receipt admission: closed keys, exact family x rung projection id, marks of that rung only,
 * a move arrow equal to the disclosed first move, and a recomputed digest. It detects corruption and
 * contract drift; it does not pretend to recreate the server's F1 seal.
 */
export function parseHintDeliveryReceipt(value: unknown): HintDeliveryReceipt {
  const keys = ["version", "requestId", "runId", "decision", "rung", "family", "projectionId", "disclosureDigest", "manifestDigest", "rendered", "marks", "receiptDigest"];
  if (!plain(value) || !exactKeys(value, keys)) return fail("receipt carries missing or extra fields");
  if (value.version !== 1 || typeof value.requestId !== "string" || !REQUEST_ID.test(value.requestId) || typeof value.runId !== "string" || value.runId === "") fail("receipt identity");
  parseStamp(value.decision);
  const rung = value.rung as HintRung;
  const family = value.family as HintFamily;
  if (!HINT_RUNGS.includes(rung) || !HINT_FAMILIES.includes(family)) fail("unknown rung or family");
  const identity = typeof value.projectionId === "string" ? hintDisclosureIdentity(value.projectionId) : undefined;
  if (identity === undefined || identity.family !== family || identity.rung !== rung || value.projectionId !== hintDisclosureProjectionId(family, rung)) fail("projection id is not the exact family x rung registry member");
  if (typeof value.disclosureDigest !== "string" || !/^[0-9a-f]{64}$/u.test(value.disclosureDigest) || typeof value.manifestDigest !== "string" || value.manifestDigest === "") fail("receipt digests");
  const rendered = value.rendered;
  if (!plain(rendered) || !exactKeys(rendered, ["source", "sentence", "voice"]) || rendered.source !== "deterministic" || typeof rendered.sentence !== "string" || rendered.sentence.trim() === "") fail("rendered sentence");
  parseVoice((rendered as Readonly<Record<string, unknown>>).voice);
  parseMarks(value.marks, rung);
  const { receiptDigest, ...body } = value;
  if (typeof receiptDigest !== "string" || hintReceiptDigest(body as Omit<HintDeliveryReceipt, "receiptDigest">) !== receiptDigest) fail("receipt digest does not match its bytes");
  return value as unknown as HintDeliveryReceipt;
}

/** Strict parser of the closed response union. */
export function parseHintResponse(value: unknown): HintResponse {
  if (!plain(value) || typeof value.state !== "string") return fail("response must be a discriminated object");
  const rung = value.rung as HintRung;
  const requestIdOk = typeof value.requestId === "string" && REQUEST_ID.test(value.requestId);
  switch (value.state) {
    case "available":
      if (!exactKeys(value, ["state", "delivery"])) fail("available carries extra fields");
      parseHintDeliveryReceipt(value.delivery);
      return value as unknown as HintResponse;
    case "pending": case "stale": case "cancelled":
      if (!exactKeys(value, ["state", "requestId", "rung"]) || !requestIdOk || !HINT_RUNGS.includes(rung)) fail(`${value.state} shape`);
      return value as unknown as HintResponse;
    case "policy_refused":
      if (!exactKeys(value, ["state", "rung", "reason"]) || !HINT_RUNGS.includes(rung) || !(HINT_POLICY_REASONS as readonly unknown[]).includes(value.reason)) fail("policy_refused shape");
      return value as unknown as HintResponse;
    case "honest_empty": case "source_unavailable": case "failed": {
      const reasons: readonly unknown[] = value.state === "honest_empty" ? HINT_EMPTY_REASONS : value.state === "source_unavailable" ? HINT_SOURCE_REASONS : HINT_FAILURE_REASONS;
      if (!exactKeys(value, ["state", "requestId", "rung", "reason"]) || !requestIdOk || !HINT_RUNGS.includes(rung) || !reasons.includes(value.reason)) fail(`${value.state} shape`);
      return value as unknown as HintResponse;
    }
    default:
      return fail(`unknown response state ${String(value.state)}`);
  }
}

// ---------------------------------------------------------------------------------------------
// §5 — the ceiling gate. Source availability is never a term ([[D1371]]).

export type HintPolicyDecision = { readonly kind: "allowed" } | { readonly kind: "refused"; readonly reason: HintPolicyReason };

export function hintPolicyDecision(input: {
  readonly rung: HintRung;
  readonly ceiling: (typeof HINT_DISTANCES)[number];
  readonly moduleActive: boolean;
  readonly deliveryOpen: boolean;
  readonly learnerToMove: boolean;
  readonly ratedGameOpen: boolean;
}): HintPolicyDecision {
  if (input.ratedGameOpen) return Object.freeze({ kind: "refused", reason: "rated_game_open" });
  if (!input.moduleActive) return Object.freeze({ kind: "refused", reason: "module_inactive" });
  if (HINT_DISTANCES.indexOf(input.rung) > HINT_DISTANCES.indexOf(input.ceiling)) return Object.freeze({ kind: "refused", reason: "above_ceiling" });
  if (!input.deliveryOpen) return Object.freeze({ kind: "refused", reason: "disclosure_closed" });
  if (!input.learnerToMove) return Object.freeze({ kind: "refused", reason: "not_your_decision" });
  return Object.freeze({ kind: "allowed" });
}

/** The client-side, per-decision progression (§5): before `pattern`, one rung per request, reset on any stamp change. */
export interface HintRequestState {
  readonly decisionDigest: string;
  readonly revealed: HintRung | null;
}

export function nextHintRung(state: HintRequestState | undefined, decisionDigest: string, ceiling: (typeof HINT_DISTANCES)[number]): HintRung | undefined {
  const current = state?.decisionDigest === decisionDigest ? state.revealed : null;
  const next = current === null ? HINT_RUNGS[0] : HINT_RUNGS[HINT_RUNGS.indexOf(current) + 1];
  if (next === undefined || HINT_DISTANCES.indexOf(next) > HINT_DISTANCES.indexOf(ceiling)) return undefined;
  return next;
}

export { HINT_RELATIONS, type HintRelation };
