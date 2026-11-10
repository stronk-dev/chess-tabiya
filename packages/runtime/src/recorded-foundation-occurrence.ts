// Foundation §3.8: post-mint actor/decision context, not another chess projection or a source seal.
// Clock and the six recorded style sources retain separate constructors/readers and meanings.
import { evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { originalRecordedClockValueInput, originalRecordedStyleValueInput } from "./internal/evidence-value-routes.js";
import { readRecordedClockSource } from "./recorded-clock-source.js";
import { readFoundationRecordedDecision, readFoundationRecordedPrefix, readFoundationRecordedOccurrenceContext,
  type FoundationRecordedDecision, type FoundationRecordedPrefix, type FoundationRecordedOccurrenceContext } from "./recorded-foundation-source.js";
import type { RecordedClockDecision } from "./recorded-clock-operands.js";
import type { FirstDecisionCastling } from "./foundation-style-sources.js";
import { positionFromFen } from "./position-cache.js";

export interface ContextualFoundationOccurrenceImage {
  readonly runId: string;
  readonly eventHead: Readonly<{ seq: number; digest: string }>;
  readonly eventId: string;
  readonly eventSeq: number;
  readonly actorClass: "imported";
  readonly actorSide: "white" | "black";
  readonly decisionClass: "game";
  readonly decisionId: string;
  readonly decisionNodeId: string;
  readonly sourceProjection: Readonly<{ id: "run.record.clock_decision"; version: 1 }>;
  readonly sourceReceiptDigest: string;
}
declare const occurrenceBrand: unique symbol;
export interface ContextualFoundationOccurrence { readonly [occurrenceBrand]: true }
interface OccurrenceData { readonly value: DeclaredEvidence<RecordedClockDecision>; readonly image: ContextualFoundationOccurrenceImage }
export type RecordedStyleSelection =
  | Readonly<{ kind: "candidate"; decision: FoundationRecordedDecision }>
  | Readonly<{ kind: "position"; decision: FoundationRecordedDecision; positionPhase: "before" | "after" }>
  | Readonly<{ kind: "baseline"; prefix: FoundationRecordedPrefix }>;
export type RecordedStyleUnavailableReason = "pending_decision" | "first_decision_pending" | "historical_actor_unproved" | "unsupported_actor_context";
export type RecordedStyleOccurrenceResult = Readonly<{ kind: "available"; occurrence: ContextualFoundationOccurrence }>
  | Readonly<{ kind: "unavailable"; reason: RecordedStyleUnavailableReason }>;
export type RecordedStyleSubject =
  | Readonly<{ kind: "legal_candidate"; candidateUci: string; chosenUci: string; disposition: "chosen" | "alternative" }>
  | Readonly<{ kind: "actual_position"; positionPhase: "before" | "after"; positionNodeId: string }>
  | Readonly<{ kind: "first_decision_baseline"; firstDecisionNodeId: string; sourcePly: number; side: "white" | "black" }>;
export interface RecordedStyleOccurrenceImage {
  readonly runId: string;
  readonly eventHead: Readonly<{ seq: number; digest: string }>;
  readonly eventId: string;
  readonly eventSeq: number;
  readonly actorClass: "imported" | "learner" | "opponent";
  readonly actorSide: "white" | "black";
  readonly decisionClass: "game" | "played";
  readonly decisionId: string;
  readonly decisionNodeId: string;
  readonly sourceProjection: Readonly<{ id: string; version: number }>;
  readonly sourceReceiptDigest: string;
  readonly subject: RecordedStyleSubject;
}
interface StyleOccurrenceData { readonly value: DeclaredEvidence<unknown>; readonly image: RecordedStyleOccurrenceImage }
const occurrences = new WeakMap<object, Readonly<{ kind: "clock"; data: OccurrenceData }>
  | Readonly<{ kind: "style"; data: StyleOccurrenceData; context: FoundationRecordedOccurrenceContext }>>();

/** Original factory inputs only; this bridge grants no actor or consumer permission. */
export const recordedStyleOccurrenceInput = originalRecordedStyleValueInput;

/** Source joins precede context absence. This does not authenticate an actor or mint context. */
export function preflightRecordedStyleOccurrenceSource(value: DeclaredEvidence<unknown>, selection: RecordedStyleSelection): void {
  const input = originalRecordedStyleValueInput(value);
  if (input.kind !== selection.kind) throw new TypeError("Recorded style source crosses its selection kind");
  if (selection.kind === "baseline") {
    readFoundationRecordedPrefix(selection.prefix);
    if (input.kind !== "baseline" || input.prefix !== selection.prefix) throw new TypeError("Baseline source crosses its original prefix");
    return;
  }
  const decision = readFoundationRecordedDecision(selection.decision), prefix = readFoundationRecordedPrefix(decision.prefix);
  const before = decision.authority.selected;
  if (input.kind === "candidate") {
    if (input.fen !== before.fen || input.candidate.payload.turn !== positionFromFen(before.fen).turn
      || input.decision !== undefined && input.decision !== selection.decision) throw new TypeError("Candidate source crosses its original BEFORE position/decision");
  } else if (input.kind === "position" && selection.kind === "position") {
    if (selection.positionPhase !== "before" && selection.positionPhase !== "after") throw new TypeError("Invalid original position phase");
    const member = selection.positionPhase === "before" ? before : prefix.authority.path[before.sourcePly + 1];
    if (member !== undefined && input.fen !== member.fen) throw new TypeError("Position source crosses the selected actual position");
  }
}

function originalImage(value: DeclaredEvidence<RecordedClockDecision>): ContextualFoundationOccurrenceImage {
  const invocation = originalRecordedClockValueInput(value);
  if (value.projection.id !== "run.record.clock_decision" || value.projection.version !== 1 || invocation.phase === undefined) throw new TypeError("Clock occurrence requires the exact original decision factory value");
  const source = readRecordedClockSource(invocation.source), a = source.authority;
  const decision = readFoundationRecordedDecision(source.decision).authority.selected;
  if (value.payload.subject.runId !== a.subject.runId || value.payload.subject.nodeId !== a.subject.nodeId
    || value.payload.decision.nodeId !== decision.nodeId || value.payload.decision.rootedIndex !== decision.sourcePly
    || value.payload.actor.kind !== "imported" || value.payload.actor.side !== a.original.side
    || value.payload.decision.eventSeq !== a.original.eventSeq) throw new TypeError("Clock occurrence crosses its original actor/decision/source");
  const image: ContextualFoundationOccurrenceImage = Object.freeze({ runId: a.subject.runId, eventHead: a.subject.eventHead,
    eventId: `${a.subject.runId}:event:${a.original.eventSeq}`, eventSeq: a.original.eventSeq,
    actorClass: "imported", actorSide: a.original.side, decisionClass: "game",
    decisionId: `${a.subject.runId}:decision:${a.original.eventSeq}`, decisionNodeId: decision.nodeId,
    sourceProjection: Object.freeze({ id: "run.record.clock_decision", version: 1 }), sourceReceiptDigest: evidenceDigest(evidenceValueReceipt(value)) });
  originalRecordedClockValueInput(value); return image;
}

/** No caller actor, event, source ref, decision or receipt operand is accepted. */
export function contextualizeImportedClockDecision(value: DeclaredEvidence<RecordedClockDecision>): ContextualFoundationOccurrence {
  const image = originalImage(value), occurrence = Object.freeze({}) as ContextualFoundationOccurrence;
  occurrences.set(occurrence, Object.freeze({ kind: "clock", data: Object.freeze({ value, image }) }));
  readContextualFoundationOccurrence(occurrence); return occurrence;
}

export function readContextualFoundationOccurrence(occurrence: ContextualFoundationOccurrence): OccurrenceData {
  const owned = occurrences.get(occurrence);
  if (owned?.kind !== "clock") throw new TypeError("Actor occurrence is not the original sealed clock operation context");
  const data = owned.data;
  if (evidenceDigest(originalImage(data.value)) !== evidenceDigest(data.image)) throw new TypeError("Actor occurrence is no longer its exact original source/receipt context");
  return data;
}

function originalStyleImage(context: FoundationRecordedOccurrenceContext, value: DeclaredEvidence<unknown>): RecordedStyleOccurrenceImage {
  const owned = readFoundationRecordedOccurrenceContext(context), a = owned.authority;
  preflightRecordedStyleOccurrenceSource(value, a.kind === "baseline" ? { kind: "baseline", prefix: owned.prefix }
    : a.kind === "position" ? { kind: "position", decision: owned.decision, positionPhase: a.positionPhase! }
      : { kind: "candidate", decision: owned.decision });
  const input = originalRecordedStyleValueInput(value);
  if (input.kind !== a.kind) throw new TypeError("Recorded style source crosses its occurrence selection kind");
  let subject: RecordedStyleSubject;
  if (input.kind === "candidate") {
    if (input.fen !== a.before.fen || input.candidate.payload.turn !== a.actorSide
      || input.decision !== undefined && input.decision !== owned.decision) throw new TypeError("Recorded candidate crosses its original BEFORE decision");
    const candidateUci = input.candidate.payload.moveUci;
    subject = Object.freeze({ kind: "legal_candidate", candidateUci, chosenUci: a.moveUci,
      disposition: candidateUci === a.moveUci ? "chosen" : "alternative" });
  } else if (input.kind === "position") {
    const phase = a.positionPhase;
    if (phase !== "before" && phase !== "after") throw new TypeError("Position occurrence lacks its exact member phase");
    const member = phase === "before" ? a.before : a.after;
    if (input.fen !== member.fen) throw new TypeError("Recorded position source is not the selected actual member");
    subject = Object.freeze({ kind: "actual_position", positionPhase: phase, positionNodeId: member.nodeId });
  } else {
    const baseline = value.payload as FirstDecisionCastling;
    if (input.prefix !== owned.prefix || baseline.firstDecisionNodeId !== a.before.nodeId
      || baseline.sourcePly !== a.before.sourcePly || baseline.learnerColor !== a.actorSide) {
      throw new TypeError("Castling occurrence crosses its exact original first-decision baseline");
    }
    subject = Object.freeze({ kind: "first_decision_baseline", firstDecisionNodeId: a.before.nodeId,
      sourcePly: a.before.sourcePly, side: a.actorSide });
  }
  const image: RecordedStyleOccurrenceImage = Object.freeze({ runId: a.prefix.runId, eventHead: a.prefix.eventHead,
    eventId: `${a.prefix.runId}:event:${a.eventSeq}`, eventSeq: a.eventSeq,
    actorClass: a.actorClass, actorSide: a.actorSide, decisionClass: a.decisionClass,
    decisionId: `${a.prefix.runId}:decision:${a.eventSeq}`, decisionNodeId: a.before.nodeId,
    sourceProjection: Object.freeze({ id: value.projection.id, version: value.projection.version }),
    sourceReceiptDigest: evidenceDigest(evidenceValueReceipt(value)), subject });
  originalRecordedStyleValueInput(value); readFoundationRecordedOccurrenceContext(context); return image;
}

/** Only a genuine original recorded context and one exact six-source factory value are accepted. */
export function contextualizeRecordedStyleOccurrence(context: FoundationRecordedOccurrenceContext, value: DeclaredEvidence<unknown>): ContextualFoundationOccurrence {
  const image = originalStyleImage(context, value), occurrence = Object.freeze({}) as ContextualFoundationOccurrence;
  occurrences.set(occurrence, Object.freeze({ kind: "style", data: Object.freeze({ value, image }), context }));
  readRecordedStyleOccurrence(occurrence); return occurrence;
}

export function readRecordedStyleOccurrence(occurrence: ContextualFoundationOccurrence): StyleOccurrenceData {
  const owned = occurrences.get(occurrence);
  if (owned?.kind !== "style") throw new TypeError("Actor occurrence is not the original sealed recorded-style context");
  if (evidenceDigest(originalStyleImage(owned.context, owned.data.value)) !== evidenceDigest(owned.data.image)) {
    throw new TypeError("Recorded style occurrence lost its exact original context/source receipt");
  }
  return owned.data;
}
