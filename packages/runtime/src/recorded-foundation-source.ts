// Foundation §§3.8c-e: private original inputs and recorded actor context, never a wire grant.
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import { positionFromFen } from "./position-cache.js";

interface CreationIdentity { readonly ordinal: number; readonly seq: number; readonly type: "run.started" | "move.committed" }
export interface FoundationPathMember {
  readonly nodeId: string;
  readonly sourcePly: number;
  readonly fen: string;
  readonly creation: CreationIdentity;
}
export interface FoundationPrefixAuthority {
  readonly operation: "foundation.recorded_prefix@1";
  readonly runId: string;
  readonly eventHead: Readonly<{ seq: number; digest: string }>;
  readonly branchId: string;
  readonly throughNodeId: string;
  readonly learnerSide: "white" | "black";
  readonly path: readonly FoundationPathMember[];
}
export interface FoundationDecisionAuthority {
  readonly operation: "foundation.recorded_decision@1";
  readonly prefix: FoundationPrefixAuthority;
  readonly selected: FoundationPathMember;
}
declare const prefixBrand: unique symbol;
declare const decisionBrand: unique symbol;
export interface FoundationRecordedPrefix { readonly [prefixBrand]: true }
export interface FoundationRecordedDecision { readonly [decisionBrand]: true }
declare const claimedChoiceBrand: unique symbol;
/** Private worker source; deliberately not a live recorded decision or actor occurrence. */
export interface FoundationClaimedChoiceDecision { readonly [claimedChoiceBrand]: true }
interface ClaimedChoiceAuthority {
  readonly operation: "foundation.claimed_choice_decision@1";
  readonly ownerLearnerId: string;
  readonly prefix: FoundationPrefixAuthority;
  readonly selected: FoundationPathMember;
  readonly after: FoundationPathMember;
  readonly eventSeq: number;
  readonly moveUci: string;
  readonly derivedRev: number;
  readonly sourceDigest: `sha256:${string}`;
}
interface ClaimedChoiceData { readonly authority: ClaimedChoiceAuthority; readonly prefix: FoundationRecordedPrefix }
const claimedChoices = new WeakMap<object, ClaimedChoiceData>();
const retiredClaimedChoices = new WeakSet<object>();
export type FoundationEarlyQueenDecision = FoundationRecordedDecision | FoundationClaimedChoiceDecision;
interface LivePrefixData {
  readonly kind: "live";
  readonly authority: FoundationPrefixAuthority;
  readonly boundary: RecordedReviewBoundary;
  readonly signal: AbortSignal;
}
interface ClaimedGamePrefixData {
  readonly kind: "claimed_game";
  readonly authority: FoundationPrefixAuthority;
}
type PrefixData = LivePrefixData | ClaimedGamePrefixData;
interface DecisionData { readonly authority: FoundationDecisionAuthority; readonly prefix: FoundationRecordedPrefix }
const prefixes = new WeakMap<object, Readonly<{ data: PrefixData; check: () => void }>>();
const decisions = new WeakMap<object, DecisionData>();
export type FoundationOccurrenceSelectionKind = "candidate" | "position" | "baseline";
export interface FoundationOccurrenceAuthority {
  readonly operation: "foundation.recorded_occurrence_context@1";
  readonly prefix: FoundationPrefixAuthority;
  readonly before: FoundationPathMember;
  readonly after: FoundationPathMember;
  readonly moveUci: string;
  readonly eventSeq: number;
  readonly actorClass: "imported" | "learner" | "opponent";
  readonly actorSide: "white" | "black";
  readonly decisionClass: "game" | "played";
  readonly kind: FoundationOccurrenceSelectionKind;
  readonly positionPhase?: "before" | "after";
}
declare const occurrenceContextBrand: unique symbol;
export interface FoundationRecordedOccurrenceContext { readonly [occurrenceContextBrand]: true }
interface OccurrenceContextData {
  readonly authority: FoundationOccurrenceAuthority;
  readonly decision: FoundationRecordedDecision;
  readonly prefix: FoundationRecordedPrefix;
}
const occurrenceContexts = new WeakMap<object, Readonly<{ data: OccurrenceContextData; check: () => void }>>();
const retiredOccurrenceContexts = new WeakSet<object>();
const refuse = (message: string): never => { throw new TypeError("Recorded foundation: " + message); };
function checkOwner(check: () => void): void {
  if (typeof check !== "function" || check() !== undefined) refuse("requires the actual source owner's current read check");
}
export function isFoundationRecordedPrefix(value: unknown): value is FoundationRecordedPrefix {
  return value !== null && typeof value === "object" && prefixes.has(value);
}
export function isFoundationRecordedDecision(value: unknown): value is FoundationRecordedDecision {
  return value !== null && typeof value === "object" && decisions.has(value);
}
export function isFoundationClaimedChoiceDecision(value: unknown): value is FoundationClaimedChoiceDecision {
  return value !== null && typeof value === "object" && claimedChoices.has(value);
}
export function isFoundationEarlyQueenDecision(value: unknown): value is FoundationEarlyQueenDecision {
  return isFoundationRecordedDecision(value) || isFoundationClaimedChoiceDecision(value);
}
export function readFoundationClaimedChoiceDecision(source: FoundationClaimedChoiceDecision): ClaimedChoiceData {
  if (retiredClaimedChoices.has(source)) return refuse("claimed choice decision is retired");
  const data = claimedChoices.get(source);
  if (data === undefined) return refuse("choice decision was not issued by the original worker source");
  try {
    const prefix = readFoundationRecordedPrefix(data.prefix), a = data.authority;
    if (prefix.kind !== "claimed_game" || a.prefix !== prefix.authority
      || a.selected !== a.prefix.path[a.selected.sourcePly]
      || a.after !== a.prefix.path[a.selected.sourcePly + 1]
      || a.after.creation.type !== "move.committed" || a.after.creation.seq !== a.eventSeq) {
      return refuse("choice decision lost its original claimed edge");
    }
    return data;
  } catch (error) { retiredClaimedChoices.add(source); throw error; }
}
/** Only the early-queen source accepts this finite union. Live readers remain unchanged. */
export function readFoundationEarlyQueenDecision(source: FoundationEarlyQueenDecision) {
  return isFoundationClaimedChoiceDecision(source) ? readFoundationClaimedChoiceDecision(source) : readFoundationRecordedDecision(source);
}
export function readFoundationRecordedPrefix(source: FoundationRecordedPrefix): PrefixData {
  if (!isFoundationRecordedPrefix(source)) return refuse("prefix was not issued by the original source owner");
  const owned = prefixes.get(source)!;
  if (owned.data.kind === "claimed_game") { checkOwner(owned.check); return owned.data; }
  owned.data.signal.throwIfAborted(); checkOwner(owned.check);
  const image = readRecordedReviewBoundary(owned.data.boundary);
  if (image.request.runId !== owned.data.authority.runId || image.request.branchId !== owned.data.authority.branchId
    || image.request.throughNodeId !== owned.data.authority.throughNodeId) return refuse("crossed original prefix");
  checkOwner(owned.check); owned.data.signal.throwIfAborted(); return owned.data;
}
export function readFoundationRecordedDecision(source: FoundationRecordedDecision): DecisionData {
  if (!isFoundationRecordedDecision(source)) return refuse("decision was not issued by the original source owner");
  const data = decisions.get(source)!, prefix = readFoundationRecordedPrefix(data.prefix);
  if (prefix.kind !== "live") return refuse("claimed GAME prefixes cannot issue live decisions");
  if (data.authority.prefix !== prefix.authority || prefix.authority.path[data.authority.selected.sourcePly] !== data.authority.selected) {
    return refuse("decision is not its original granted path member");
  }
  return data;
}

export function readFoundationRecordedOccurrenceContext(source: FoundationRecordedOccurrenceContext): OccurrenceContextData {
  if (retiredOccurrenceContexts.has(source)) return refuse("recorded occurrence context is retired");
  const owned = occurrenceContexts.get(source);
  if (owned === undefined) return refuse("occurrence context was not issued by its actual recorded owner");
  try {
    checkOwner(owned.check);
    const data = owned.data, decision = readFoundationRecordedDecision(data.decision), prefix = readFoundationRecordedPrefix(data.prefix);
    if (prefix.kind !== "live") return refuse("claimed GAME prefixes cannot issue actor occurrences");
    const a = data.authority, after = prefix.authority.path[decision.authority.selected.sourcePly + 1];
    const image = readRecordedReviewBoundary(prefix.boundary), actual = image.path[after?.sourcePly ?? -1];
    if (decision.prefix !== data.prefix || a.prefix !== prefix.authority || a.before !== decision.authority.selected
      || a.after !== after || actual?.node.id !== after?.nodeId || actual?.creationEvent.type !== "move.committed"
      || actual.creationEvent.seq !== a.eventSeq || actual.node.parentId !== a.before.nodeId
      || actual.node.moveUci !== a.moveUci || actual.node.fen !== after.fen
      || a.actorSide !== positionFromFen(a.before.fen).turn) return refuse("occurrence lost its original outgoing event and decision");
    if (a.actorClass === "opponent" && (a.kind === "baseline" || a.actorSide === a.prefix.learnerSide)) {
      return refuse("opponent context cannot own the learner baseline or learner side");
    }
    checkOwner(owned.check); return data;
  } catch (error) {
    retiredOccurrenceContexts.add(source);
    throw error;
  }
}

/** Private production importers: live source owner and the store-issued GAME source owner. */
export const RECORDED_FOUNDATION_SOURCE_AUTHORITY = Object.freeze({
  /** Private issuer: the actual existing store scope validates owner MOVE, role and original edge. */
  issueClaimedChoiceDecision(prefix: FoundationRecordedPrefix, selection: Readonly<{
    ownerLearnerId: string; beforeNodeId: string; afterNodeId: string; eventSeq: number; moveUci: string;
    derivedRev: number; sourceDigest: `sha256:${string}`;
  }>): FoundationClaimedChoiceDecision {
    const data = readFoundationRecordedPrefix(prefix);
    if (data.kind !== "claimed_game") return refuse("choice decision requires its original claimed worker prefix");
    const selected = data.authority.path.find(member => member.nodeId === selection.beforeNodeId);
    const after = selected === undefined ? undefined : data.authority.path[selected.sourcePly + 1];
    if (selected === undefined || after?.nodeId !== selection.afterNodeId
      || after.creation.type !== "move.committed" || after.creation.seq !== selection.eventSeq
      || typeof selection.ownerLearnerId !== "string" || selection.ownerLearnerId.length === 0
      || typeof selection.moveUci !== "string" || selection.moveUci.length === 0
      || !Number.isSafeInteger(selection.derivedRev) || selection.derivedRev < 1
      || !/^sha256:[a-f0-9]{64}$/u.test(selection.sourceDigest)) return refuse("choice decision requires its actual original outgoing edge");
    const source = Object.freeze({}) as FoundationClaimedChoiceDecision;
    claimedChoices.set(source, Object.freeze({ prefix, authority: Object.freeze({
      operation: "foundation.claimed_choice_decision@1", ownerLearnerId: selection.ownerLearnerId,
      prefix: data.authority, selected, after, eventSeq: selection.eventSeq, moveUci: selection.moveUci,
      derivedRev: selection.derivedRev, sourceDigest: selection.sourceDigest,
    }) }));
    readFoundationClaimedChoiceDecision(source); return source;
  },
  issuePrefix(boundary: RecordedReviewBoundary, signal: AbortSignal, check: () => void): FoundationRecordedPrefix {
    if (!(signal instanceof AbortSignal)) return refuse("requires actual request cancellation");
    signal.throwIfAborted(); checkOwner(check);
    const image = readRecordedReviewBoundary(boundary);
    const path = Object.freeze(image.path.map((entry, sourcePly) => {
      if (image.originalPath[sourcePly] !== entry) return refuse("missing original rooted path member");
      return Object.freeze({ nodeId: entry.node.id, sourcePly, fen: entry.node.fen,
        creation: Object.freeze({ ordinal: entry.creationEventOrdinal, seq: entry.creationEvent.seq, type: entry.creationEvent.type }) });
    }));
    if (path.length === 0 || path.some((entry, index) => entry.sourcePly !== index)) return refuse("prefix lost its original rooted indices");
    const authority: FoundationPrefixAuthority = Object.freeze({ operation: "foundation.recorded_prefix@1", runId: image.run.id,
      eventHead: Object.freeze({ ...image.eventHead }), branchId: image.request.branchId, throughNodeId: image.request.throughNodeId,
      learnerSide: image.learnerSide, path });
    checkOwner(check); signal.throwIfAborted();
    const source = Object.freeze({}) as FoundationRecordedPrefix;
    prefixes.set(source, Object.freeze({ data: Object.freeze({ kind: "live" as const, authority, boundary, signal }), check }));
    readFoundationRecordedPrefix(source); return source;
  },
  /** Only the genuine store-owned GAME issuer may call this private arm after its legal graph pass. */
  issueClaimedGamePrefix(authority: FoundationPrefixAuthority, check: () => void): FoundationRecordedPrefix {
    checkOwner(check);
    const source = Object.freeze({}) as FoundationRecordedPrefix;
    prefixes.set(source, Object.freeze({ data: Object.freeze({ kind: "claimed_game" as const, authority }), check }));
    readFoundationRecordedPrefix(source); return source;
  },
  issueDecision(prefix: FoundationRecordedPrefix, nodeId: string): FoundationRecordedDecision {
    const data = readFoundationRecordedPrefix(prefix);
    if (data.kind !== "live") return refuse("claimed GAME prefixes cannot issue live decisions");
    if (typeof nodeId !== "string" || nodeId.length === 0) return refuse("decision requires an actual node identity");
    const selected = data.authority.path.find(entry => entry.nodeId === nodeId);
    if (selected === undefined) return refuse("decision is outside the granted original prefix");
    const source = Object.freeze({}) as FoundationRecordedDecision;
    decisions.set(source, Object.freeze({ prefix, authority: Object.freeze({ operation: "foundation.recorded_decision@1", prefix: data.authority, selected }) }));
    readFoundationRecordedDecision(source); return source;
  },
  /** Actual application owner supplies its historical-author check, never a public caller. */
  issueOccurrenceContext(decision: FoundationRecordedDecision,
    selection: Readonly<{ kind: FoundationOccurrenceSelectionKind; positionPhase?: "before" | "after" }>,
    actorClass: "imported" | "learner" | "opponent", check: () => void): FoundationRecordedOccurrenceContext {
    checkOwner(check);
    const d = readFoundationRecordedDecision(decision), p = readFoundationRecordedPrefix(d.prefix);
    if (p.kind !== "live") return refuse("claimed GAME prefixes cannot issue actor occurrences");
    if (actorClass !== "imported" && actorClass !== "learner" && actorClass !== "opponent"
      || !["candidate", "position", "baseline"].includes(selection.kind)
      || Reflect.ownKeys(selection).length !== (selection.kind === "position" ? 2 : 1)
      || selection.kind === "position" && selection.positionPhase !== "before" && selection.positionPhase !== "after") {
      return refuse("invalid closed occurrence selection/actor");
    }
    const before = d.authority.selected, after = p.authority.path[before.sourcePly + 1];
    const image = readRecordedReviewBoundary(p.boundary), child = image.path[after?.sourcePly ?? -1];
    if (after === undefined || child?.creationEvent.type !== "move.committed" || child.node.moveUci === null
      || child.node.id !== after.nodeId || child.node.parentId !== before.nodeId) return refuse("occurrence requires an actual next committed member");
    if (actorClass === "opponent" && (selection.kind === "baseline" || positionFromFen(before.fen).turn === p.authority.learnerSide)) {
      return refuse("opponent context cannot own the learner baseline or learner side");
    }
    const authority: FoundationOccurrenceAuthority = Object.freeze({ operation: "foundation.recorded_occurrence_context@1",
      prefix: p.authority, before, after, moveUci: child.node.moveUci, eventSeq: child.creationEvent.seq,
      actorClass, actorSide: positionFromFen(before.fen).turn, decisionClass: actorClass === "imported" ? "game" : "played",
      kind: selection.kind, ...(selection.kind === "position" ? { positionPhase: selection.positionPhase! } : {}) });
    const source = Object.freeze({}) as FoundationRecordedOccurrenceContext;
    occurrenceContexts.set(source, Object.freeze({ data: Object.freeze({ authority, decision, prefix: d.prefix }), check }));
    readFoundationRecordedOccurrenceContext(source); return source;
  },
});
