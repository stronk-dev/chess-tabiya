import { castlingSide, normalizeMove } from "chessops/chess";
import { makeFen } from "chessops/fen";
import type { Color, Move, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST, STRUCTURAL_EVENT_FAMILIES } from "./evidence-catalog.js";
import {
  EvidenceManifestError,
  assertDeclaredEvidence,
  evidenceDigest,
  type CompiledEvidenceManifest,
  type DeclaredEvidence,
  type EvidenceGrounding,
  type EvidenceSelectionPolicyDeclaration,
  type ProjectionDeclaration,
  type SemanticEventSign,
  type VersionedEvidenceId,
} from "./evidence-contract.js";
import { declareAvoidanceEvidence, declareCheckEventEvidence, declareDoubleAttackEvidence, declareReplyBreadthEvidence, declareStructuralSemanticSourceEvidence, declareTransitionSemanticSourceEvidence } from "./evidence-source-adapters.js";
import { structuralReading, type StructuralObservation, type StructuralReading } from "./structure.js";
import { checkEvent, doubleAttackEvent, replyBreadth, type CheckEvent, type DoubleAttackEvent, type ReplyBreadth } from "./tactics.js";
import { transitionSemanticFacts, type TransitionSemanticFact } from "./transition.js";

const SEMANTIC_EVENT: unique symbol = Symbol("tabiya.evidence.semantic_event");
const SELECTED_EVIDENCE: unique symbol = Symbol("tabiya.evidence.selected");
const SEMANTIC_EVENT_VALUES = new WeakSet<object>();
const SELECTED_EVIDENCE_VALUES = new WeakSet<object>();
const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;
const ref = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 1 });

export interface SemanticEventAnchor {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly side: Color;
  readonly runId?: string;
  readonly branchId?: string;
  readonly nodeId?: string;
}

export interface SemanticEvidenceEvent<T = unknown> {
  readonly [SEMANTIC_EVENT]: true;
  readonly id: string;
  readonly projection: VersionedEvidenceId;
  readonly evidence: DeclaredEvidence<T>;
  readonly derivationInputs: readonly DeclaredEvidence<unknown>[];
  readonly anchor: SemanticEventAnchor;
  readonly sign: SemanticEventSign;
  readonly operands: T;
  readonly basis: {
    readonly grounding: EvidenceGrounding;
    readonly exactness: ProjectionDeclaration["exactness"];
    readonly confidence: ProjectionDeclaration["confidence"];
  };
  readonly valence?: {
    readonly value: "favorable" | "unfavorable" | "mixed";
    readonly authority: DeclaredEvidence<unknown>;
  };
}

export type SelectedEvidenceFact =
  | { readonly kind: "played_event"; readonly event: SemanticEvidenceEvent; readonly sameFamilyShare: number }
  | { readonly kind: "counterfactual_absence"; readonly event: SemanticEvidenceEvent<CounterfactualAbsenceOperands> };

export interface CounterfactualAbsenceOperands {
  readonly relation: "avoided";
  readonly family: { readonly projection: VersionedEvidenceId; readonly sign: SemanticEventSign };
  readonly legalAlternatives: number;
  readonly alternativesWithFamily: number;
  readonly alternativeEvents: readonly SemanticEvidenceEvent[];
}

export interface EvidenceSelectionResult {
  readonly [SELECTED_EVIDENCE]: true;
  readonly policy: VersionedEvidenceId;
  readonly consumer: VersionedEvidenceId;
  readonly population: { readonly legalAlternatives: number; readonly evaluatedAlternatives: number };
  readonly selected: readonly SelectedEvidenceFact[];
  readonly rejected: readonly {
    readonly candidate: { readonly kind: "played_event" | "counterfactual_absence"; readonly id: string };
    readonly reason: VersionedEvidenceId;
  }[];
  readonly emptyReason?: VersionedEvidenceId;
}

export interface SemanticEventInput<T> {
  readonly evidence: DeclaredEvidence<T>;
  readonly derivationInputs?: readonly DeclaredEvidence<unknown>[];
  readonly anchor: SemanticEventAnchor;
  readonly sign: SemanticEventSign;
  readonly operands: T;
}

export interface SemanticSelectionInput {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly playedEvents: readonly SemanticEvidenceEvent[];
  readonly evaluateAlternative: (edge: { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }) => readonly SemanticEvidenceEvent[] | undefined;
}

export interface StructuralSemanticEventOperands {
  readonly before_fen: string;
  readonly move_uci: string;
  readonly after_fen: string;
  readonly family: (typeof STRUCTURAL_EVENT_FAMILIES)[number];
  readonly before: StructuralObservation | null;
  readonly after: StructuralObservation | null;
}

export type TransitionSemanticEventOperands = TransitionSemanticFact & {
  readonly before_fen: string;
  readonly move_uci: string;
  readonly after_fen: string;
};

export type TacticalSemanticEventOperands = DoubleAttackEvent | ReplyBreadth | CheckEvent;

function immutable<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) immutable(child);
    Object.freeze(value);
  }
  return value;
}

function genericBypass(message: string): never {
  throw new EvidenceManifestError("EVIDENCE_GENERIC_BYPASS", message, ["semantic-evidence:unsealed"]);
}

export function canonicalMoveUci(beforeFen: string, moveUci: string): string {
  const position = positionFromFen(beforeFen);
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid semantic-event move ${moveUci}`);
  const side = castlingSide(position, parsed);
  if (side === undefined) return makeUci(parsed);
  const rank = Math.floor(parsed.from / 8);
  return makeUci({ from: parsed.from, to: (rank * 8 + (side === "h" ? 6 : 2)) as typeof parsed.to });
}

function canonicalAnchor(anchor: SemanticEventAnchor): SemanticEventAnchor {
  const before = positionFromFen(anchor.beforeFen);
  const beforeFen = canonicalFen(before);
  const moveUci = canonicalMoveUci(beforeFen, anchor.moveUci);
  const parsed = parseUci(moveUci)!;
  const playable = normalizeMove(before, parsed);
  if (!before.isLegal(playable)) throw new TypeError(`Semantic-event anchor move is illegal: ${moveUci}`);
  const side = before.turn;
  before.play(playable);
  const afterFen = canonicalFen(positionFromFen(anchor.afterFen));
  if (makeFen(before.toSetup()) !== afterFen) throw new TypeError(`Semantic-event anchor after FEN does not match ${moveUci}`);
  if (anchor.side !== side) throw new TypeError(`Semantic-event anchor side does not match ${moveUci}`);
  return immutable({ beforeFen, moveUci, afterFen, side, ...(anchor.runId === undefined ? {} : { runId: anchor.runId }), ...(anchor.branchId === undefined ? {} : { branchId: anchor.branchId }), ...(anchor.nodeId === undefined ? {} : { nodeId: anchor.nodeId }) });
}

function operandKeys(value: unknown): readonly string[] {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? Object.keys(value as Record<string, unknown>) : [];
}

function structuralSubject(value: StructuralObservation): string {
  const record: Record<string, unknown> = { kind: value.kind };
  for (const key of ["color", "role", "file", "shade", "form", "zone"] as const) if (value[key] !== undefined) record[key] = value[key];
  record.squares = value.kind === "king_zone" ? [] : value.squares;
  return evidenceDigest(record);
}

function structuralMagnitude(value: StructuralObservation): number {
  return value.count ?? 1;
}

function declareStructuralEventEvidence(family: StructuralSemanticEventOperands["family"], payload: StructuralSemanticEventOperands): DeclaredEvidence<StructuralSemanticEventOperands> {
  if (!STRUCTURAL_EVENT_FAMILIES.includes(family)) throw new TypeError(`Unsupported structural event family ${family}`);
  return declareStructuralSemanticSourceEvidence(family, payload);
}

function structuralSemanticEventsCached(beforeFen: string, moveUci: string, afterFen: string, cache?: Map<string, StructuralReading>): readonly SemanticEvidenceEvent<StructuralSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const read = (fen: string): StructuralReading => {
    const existing = cache?.get(fen);
    if (existing !== undefined) return existing;
    const value = structuralReading(fen);
    cache?.set(fen, value);
    return value;
  };
  const before = read(anchor.beforeFen).features.filter((item): item is StructuralObservation & { kind: StructuralSemanticEventOperands["family"] } => STRUCTURAL_EVENT_FAMILIES.includes(item.kind as StructuralSemanticEventOperands["family"]));
  const after = read(anchor.afterFen).features.filter((item): item is StructuralObservation & { kind: StructuralSemanticEventOperands["family"] } => STRUCTURAL_EVENT_FAMILIES.includes(item.kind as StructuralSemanticEventOperands["family"]));
  const events: SemanticEvidenceEvent<StructuralSemanticEventOperands>[] = [];
  for (const family of STRUCTURAL_EVENT_FAMILIES) {
    const left = new Map(before.filter((item) => item.kind === family).map((item) => [structuralSubject(item), item]));
    const right = new Map(after.filter((item) => item.kind === family).map((item) => [structuralSubject(item), item]));
    for (const key of new Set([...left.keys(), ...right.keys()])) {
      const prior = left.get(key) ?? null;
      const current = right.get(key) ?? null;
      const sign: "gained" | "lost" | "preserved" = prior === null ? "gained" : current === null ? "lost" : structuralMagnitude(current) > structuralMagnitude(prior) ? "gained" : structuralMagnitude(current) < structuralMagnitude(prior) ? "lost" : "preserved";
      const payload = immutable({ before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen, family, before: prior, after: current });
      events.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareStructuralEventEvidence(family, payload), anchor, sign, operands: payload }));
    }
  }
  return Object.freeze(events.sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection)) || left.sign.localeCompare(right.sign) || left.id.localeCompare(right.id)));
}

export function structuralSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<StructuralSemanticEventOperands>[] {
  return structuralSemanticEventsCached(beforeFen, moveUci, afterFen);
}

function declareTransitionEventEvidence(payload: TransitionSemanticEventOperands): DeclaredEvidence<TransitionSemanticEventOperands> {
  return declareTransitionSemanticSourceEvidence(payload.family, payload);
}

export function transitionSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  return Object.freeze(transitionSemanticFacts(beforeFen, moveUci, afterFen).map((fact) => {
    const normalizedFact = fact.family === "castled" ? { ...fact, from: anchor.moveUci.slice(0, 2), to: anchor.moveUci.slice(2, 4), detail: Object.freeze({ ...fact.detail, resultingKingSquare: anchor.moveUci.slice(2, 4) }) } : fact;
    const payload = immutable({ ...normalizedFact, before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen }) as TransitionSemanticEventOperands;
    return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareTransitionEventEvidence(payload), anchor, sign: payload.sign, operands: payload });
  }));
}

export function tacticalSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<TacticalSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const events: SemanticEvidenceEvent<TacticalSemanticEventOperands>[] = [];
  const breadth = replyBreadth(anchor.beforeFen, anchor.moveUci);
  if (breadth.afterFen !== anchor.afterFen) throw new TypeError(`Reply-breadth after FEN does not match ${anchor.moveUci}`);
  events.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareReplyBreadthEvidence(breadth), anchor, sign: "state", operands: breadth }));
  const check = checkEvent(anchor.beforeFen, anchor.moveUci);
  if (check !== undefined) events.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareCheckEventEvidence(check), anchor, sign: "state", operands: check }));
  const fork = doubleAttackEvent(anchor.beforeFen, anchor.moveUci);
  if (fork !== undefined) events.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareDoubleAttackEvidence(fork), anchor, sign: "gained", operands: fork }));
  return Object.freeze(events.sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection))));
}

export function localSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent[] {
  return Object.freeze([...structuralSemanticEvents(beforeFen, moveUci, afterFen), ...transitionSemanticEvents(beforeFen, moveUci, afterFen), ...tacticalSemanticEvents(beforeFen, moveUci, afterFen)]);
}

export function compileSemanticEvidenceEvent<T>(manifest: CompiledEvidenceManifest, input: SemanticEventInput<T>): SemanticEvidenceEvent<T> {
  assertDeclaredEvidence(input.evidence);
  const declaration = manifest.semanticEvents.find((candidate) => refKey(candidate.projection) === refKey(input.evidence.projection));
  const projection = manifest.projections.find((candidate) => refKey(candidate) === refKey(input.evidence.projection));
  if (declaration === undefined || projection === undefined || refKey(projection.producer) !== refKey(input.evidence.producer)) genericBypass("semantic event evidence is not an exact declared event source");
  if (!declaration.allowedSigns.includes(input.sign)) throw new EvidenceManifestError("EVIDENCE_EVENT_SIGN_WIDENS", "runtime event sign is not declared", [refKey(input.evidence.projection)]);
  const keys = operandKeys(input.operands);
  if (!declaration.requiredOperands.every((operand) => keys.includes(operand))) throw new EvidenceManifestError("EVIDENCE_EVENT_OPERAND_MISSING", "runtime event payload lacks a required operand", [refKey(input.evidence.projection)]);
  if (input.evidence.payload !== input.operands) genericBypass("semantic event operands differ from the sealed evidence payload");
  const derivationInputs = [...(input.derivationInputs ?? [])];
  for (const value of derivationInputs) assertDeclaredEvidence(value);
  const expectedInputs = new Set((declaration.derivationInputs ?? []).map(refKey));
  const actualInputs = new Set(derivationInputs.map((value) => refKey(value.projection)));
  if (expectedInputs.size !== actualInputs.size || [...expectedInputs].some((key) => !actualInputs.has(key)) || (expectedInputs.size > 0 && derivationInputs.length === 0)) throw new EvidenceManifestError("EVIDENCE_EVENT_DERIVATION_MISMATCH", "runtime derivation inputs disagree with the event declaration", [refKey(input.evidence.projection)]);
  const anchor = canonicalAnchor(input.anchor);
  const operandRecord = input.operands as Record<string, unknown>;
  if (("before_fen" in operandRecord && operandRecord.before_fen !== anchor.beforeFen) || ("move_uci" in operandRecord && operandRecord.move_uci !== anchor.moveUci) || ("after_fen" in operandRecord && operandRecord.after_fen !== anchor.afterFen)) throw new EvidenceManifestError("EVIDENCE_EVENT_OPERAND_MISSING", "runtime edge operands are not canonical anchor bytes", [refKey(input.evidence.projection)]);
  const id = evidenceDigest({ projection: input.evidence.projection, beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen, sign: input.sign, operands: input.operands });
  const value = immutable({
    [SEMANTIC_EVENT]: true as const, id, projection: { ...input.evidence.projection }, evidence: input.evidence,
    derivationInputs, anchor, sign: input.sign, operands: input.operands,
    basis: { grounding: projection.grounding, exactness: projection.exactness, confidence: projection.confidence },
  });
  SEMANTIC_EVENT_VALUES.add(value);
  return value;
}

export function assertSemanticEvidenceEvent(manifest: CompiledEvidenceManifest, value: unknown): asserts value is SemanticEvidenceEvent {
  if (typeof value !== "object" || value === null || (value as { readonly [SEMANTIC_EVENT]?: unknown })[SEMANTIC_EVENT] !== true || !SEMANTIC_EVENT_VALUES.has(value)) genericBypass("semantic event was not constructed by compileSemanticEvidenceEvent");
  const event = value as SemanticEvidenceEvent;
  const rebuilt = compileSemanticEvidenceEvent(manifest, { evidence: event.evidence, derivationInputs: event.derivationInputs, anchor: event.anchor, sign: event.sign, operands: event.operands });
  if (rebuilt.id !== event.id || evidenceDigest(rebuilt.basis) !== evidenceDigest(event.basis)) genericBypass("semantic event seal does not match its declared bytes");
}

const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

export function legalAlternativeEdges(beforeFen: string, committedMoveUci: string): readonly { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }[] {
  const position = positionFromFen(beforeFen);
  const canonicalBefore = canonicalFen(position);
  const committed = canonicalMoveUci(canonicalBefore, committedMoveUci);
  const moves: Move[] = [];
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    const reachesBackRank = position.board.getRole(from) === "pawn" && (to < 8 || to >= 56);
    if (reachesBackRank) for (const promotion of PROMOTIONS) moves.push({ from, to, promotion });
    else moves.push({ from, to });
  }
  const byUci = new Map<string, Move>();
  for (const move of moves) {
    const canonical = canonicalMoveUci(canonicalBefore, makeUci(move));
    if (canonical !== committed) byUci.set(canonical, normalizeMove(position, move));
  }
  return Object.freeze([...byUci].sort(([left], [right]) => left.localeCompare(right)).map(([moveUci, move]) => {
    const child = position.clone();
    if (!child.isLegal(move)) throw new TypeError(`Alternative enumerator produced illegal move ${moveUci}`);
    child.play(move);
    return Object.freeze({ beforeFen: canonicalBefore, moveUci, afterFen: canonicalFen(child) });
  }));
}

function eligible(manifest: CompiledEvidenceManifest, event: SemanticEvidenceEvent, consumer: VersionedEvidenceId): boolean {
  assertSemanticEvidenceEvent(manifest, event);
  return manifest.eligibility.some((row) => refKey(row.event) === refKey(event.projection) && refKey(row.consumer) === refKey(consumer) && row.disposition === "eligible" && row.allowedSigns.includes(event.sign));
}

function familyKey(event: SemanticEvidenceEvent): string {
  return `${refKey(event.projection)}:${event.sign}`;
}

function policyFor(manifest: CompiledEvidenceManifest, policy: VersionedEvidenceId): EvidenceSelectionPolicyDeclaration {
  const value = manifest.selectionPolicies.find((candidate) => refKey(candidate) === refKey(policy));
  if (value === undefined) throw new EvidenceManifestError("EVIDENCE_POLICY_INVALID", "selection names an absent compiled policy", [refKey(policy)]);
  return value;
}

export function selectSemanticEvidence(manifest: CompiledEvidenceManifest, policyRef: VersionedEvidenceId, input: SemanticSelectionInput): EvidenceSelectionResult {
  const policy = policyFor(manifest, policyRef);
  const consumer = policy.consumer;
  const played = input.playedEvents.filter((event) => eligible(manifest, event, consumer));
  const alternatives = legalAlternativeEdges(input.beforeFen, input.moveUci);
  const populations: { edge: (typeof alternatives)[number]; events: readonly SemanticEvidenceEvent[] }[] = [];
  for (const edge of alternatives) {
    const values = input.evaluateAlternative(edge);
    if (values === undefined) return selectedResult(manifest, policy, alternatives.length, populations.length, [], [], ref("counterfactual_population_incomplete"));
    populations.push({ edge, events: values.filter((event) => eligible(manifest, event, consumer)) });
  }
  const byFamily = new Map<string, SemanticEvidenceEvent[]>();
  for (const population of populations) for (const event of population.events) {
    const key = familyKey(event);
    const values = byFamily.get(key) ?? [];
    if (!values.some((candidate) => candidate.anchor.moveUci === event.anchor.moveUci)) values.push(event);
    byFamily.set(key, values);
  }
  const critical = new Set(policy.criticalEvents.map(refKey));
  const candidates: { fact: SelectedEvidenceFact; support: number; critical: boolean; operandDigest: string }[] = [];
  const rejected: EvidenceSelectionResult["rejected"][number][] = [];
  for (const event of played) {
    const share = alternatives.length === 0 ? 0 : (byFamily.get(familyKey(event))?.length ?? 0) / alternatives.length;
    const isCritical = critical.has(refKey(event.projection));
    if (!isCritical && alternatives.length < policy.minimumAlternatives) rejected.push({ candidate: { kind: "played_event", id: event.id }, reason: ref("insufficient_alternatives") });
    else if (!isCritical && share > policy.maximumSameFamilyShare) rejected.push({ candidate: { kind: "played_event", id: event.id }, reason: ref("nothing_distinctive") });
    else candidates.push({ fact: { kind: "played_event", event, sameFamilyShare: share }, support: 1 - share, critical: isCritical, operandDigest: evidenceDigest(event.operands) });
  }
  if (policy.minimumAlternativeOnlyShare !== null && alternatives.length >= policy.minimumAlternatives) for (const [key, events] of byFamily) {
    if (played.some((event) => familyKey(event) === key)) continue;
    const [projectionKey, sign] = key.split(":") as [string, SemanticEventSign];
    if (!projectionKey.startsWith("rules.structural.event.")) continue;
    const share = events.length / alternatives.length;
    if (share < policy.minimumAlternativeOnlyShare) continue;
    const suffix = projectionKey.slice("rules.structural.event.".length).replace(/@\d+$/u, "");
    const operands: CounterfactualAbsenceOperands = immutable({ relation: "avoided", family: { projection: events[0]!.projection, sign }, legalAlternatives: alternatives.length, alternativesWithFamily: events.length, alternativeEvents: events });
    const evidence = declareAvoidanceEvidence(suffix, operands);
    const event = compileSemanticEvidenceEvent(manifest, { evidence, derivationInputs: events.map((value) => value.evidence), anchor: { beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen, side: positionFromFen(input.beforeFen).turn }, sign: "avoided", operands });
    if (eligible(manifest, event, consumer)) candidates.push({ fact: { kind: "counterfactual_absence", event }, support: share, critical: false, operandDigest: evidenceDigest(operands) });
  }
  candidates.sort((left, right) => Number(right.critical) - Number(left.critical) || right.support - left.support || (left.fact.kind === right.fact.kind ? 0 : left.fact.kind === "played_event" ? -1 : 1) || refKey(left.fact.event.projection).localeCompare(refKey(right.fact.event.projection)) || left.operandDigest.localeCompare(right.operandDigest) || left.fact.event.id.localeCompare(right.fact.event.id));
  if (policy.maxFacts === 0) return selectedResult(manifest, policy, alternatives.length, alternatives.length, [], rejected, ref("budget_zero"));
  const selected = candidates.slice(0, policy.maxFacts).map((candidate) => candidate.fact);
  for (const candidate of candidates.slice(policy.maxFacts)) rejected.push({ candidate: { kind: candidate.fact.kind, id: candidate.fact.event.id }, reason: ref(candidate.critical ? "critical_budget_exhausted" : "nothing_distinctive") });
  const emptyReason = selected.length > 0 ? undefined : played.length === 0 && candidates.length === 0 ? ref("no_eligible_events") : alternatives.length < policy.minimumAlternatives ? ref("insufficient_alternatives") : ref("nothing_distinctive");
  return selectedResult(manifest, policy, alternatives.length, alternatives.length, selected, rejected, emptyReason);
}

export function selectLocalSemanticEvidence(policyRef: VersionedEvidenceId, input: Omit<SemanticSelectionInput, "playedEvents" | "evaluateAlternative">): EvidenceSelectionResult {
  const cache = new Map<string, StructuralReading>();
  const events = (edge: { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }): readonly SemanticEvidenceEvent[] => Object.freeze([...structuralSemanticEventsCached(edge.beforeFen, edge.moveUci, edge.afterFen, cache), ...transitionSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen), ...tacticalSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen)]);
  return selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, policyRef, {
    ...input,
    playedEvents: events(input),
    evaluateAlternative: events,
  });
}

function selectedResult(manifest: CompiledEvidenceManifest, policy: EvidenceSelectionPolicyDeclaration, legalAlternatives: number, evaluatedAlternatives: number, selected: readonly SelectedEvidenceFact[], rejected: readonly EvidenceSelectionResult["rejected"][number][], emptyReason?: VersionedEvidenceId): EvidenceSelectionResult {
  const result = immutable({ [SELECTED_EVIDENCE]: true as const, policy: { id: policy.id, version: policy.version }, consumer: { ...policy.consumer }, population: { legalAlternatives, evaluatedAlternatives }, selected: [...selected], rejected: [...rejected], ...(emptyReason === undefined ? {} : { emptyReason }) });
  SELECTED_EVIDENCE_VALUES.add(result);
  assertEvidenceSelectionResult(manifest, result);
  return result;
}

export function assertEvidenceSelectionResult(manifest: CompiledEvidenceManifest, value: unknown): asserts value is EvidenceSelectionResult {
  if (typeof value !== "object" || value === null || (value as { readonly [SELECTED_EVIDENCE]?: unknown })[SELECTED_EVIDENCE] !== true || !SELECTED_EVIDENCE_VALUES.has(value)) genericBypass("selection result was not constructed by selectSemanticEvidence");
  const result = value as EvidenceSelectionResult;
  const policy = policyFor(manifest, result.policy);
  if (refKey(policy.consumer) !== refKey(result.consumer)) genericBypass("selection result consumer differs from its policy");
  for (const fact of result.selected) if (!eligible(manifest, fact.event, result.consumer)) genericBypass("selection result contains an ineligible or unsealed event");
}
