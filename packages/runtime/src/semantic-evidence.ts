import { Chess, normalizeMove } from "chessops/chess";
import { attacks, between } from "chessops/attacks";
import { makeFen } from "chessops/fen";
import type { Color, Move, Piece, Role, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseSquare, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { exactLegalMoves, exactMoveDestination, exactMoveIdentity } from "./legal-moves.js";
import { castlingRightsLost, type CastlingRightLostEvent } from "./castling.js";
import { captureClassEvent, legalCaptureMovesTo, legalExchangeForMove, type CaptureClassEvent, type LegalExchangeResult } from "./exchange.js";
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
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { assertRecordedEdgeEvidence, type RecordedEdge } from "./recorded-edge.js";
import { kingZoneReading, type KingZoneParticipant } from "./king-state.js";
import { kingZoneEvents } from "./king-state.js";
import { materialRoleAsymmetryEvent, materialRoleSignatureReading } from "./material-state.js";
import { pieceDestinationEvents } from "./mobility.js";
import { pawnContactsReading, pawnDynamicsEvents, pawnTransitionEvents, type HarassmentPressureSequence, type PawnContactTimingSequence, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import { squareControlEvents, squareControlReading, type SquareControlEvent } from "./square-control.js";
import { pawnConnectivityReading, structuralReading, type StructuralObservation, type StructuralReading } from "./structure.js";
import { checkEvent, defenderDutyReading, defenderDutyRelocatedEvents, defenderRemovedEvents, discoveredExecutedEvents, discoveredLatencyReading, doubleAttackEvent, loosePieceEvents, replyBreadth, type CheckEvent, type DiscoveredExecutedEvent, type DoubleAttackEvent, type GainedSliderRay, type LoosePieceEvent, type ReplyBreadth } from "./tactics.js";
import { transitionSemanticFacts, type TransitionSemanticFact } from "./transition.js";
import {
  CANDIDATE_EVENTS_SCOPE,
  assertCandidatePopulationReceipt,
  candidateAlternatives,
  candidatePlayedRow,
  compileCandidatePopulation,
  type CandidatePopulationReceipt,
} from "./candidate-population.js";

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

/**
 * Event compilation input. The operands ARE the factory-sealed payload: the compiler never accepts
 * a second caller-supplied operand object, and the derivation inputs must be exactly the sealed
 * inputs named by the evidence's value receipt (rfc/evidence-value-authority.md §2.2).
 */
export interface SemanticEventInput<T> {
  readonly evidence: DeclaredEvidence<T>;
  readonly derivationInputs?: readonly DeclaredEvidence<unknown>[];
  readonly anchor: SemanticEventAnchor;
  readonly sign: SemanticEventSign;
}

/**
 * Selection input: a compiled candidate packet receipt plus the played move in
 * `MOVE_IDENTITY_CONVENTION`. There is no caller-supplied population (§3.2, §11.2).
 */
export interface SemanticSelectionInput {
  readonly receipt: CandidatePopulationReceipt;
  readonly moveUci: string;
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
export type CastlingSemanticEventOperands = CastlingRightLostEvent;
export type DerivedExchangeSemanticEventOperands = CaptureClassEvent;

export interface PawnIslandEventOperands {
  readonly before_fen: string;
  readonly move_uci: string;
  readonly after_fen: string;
  readonly family: "pawn_islands";
  readonly color: Color;
  readonly before: number;
  readonly after: number;
}

export interface TradeCompletedEventOperands {
  readonly startFen: string;
  readonly firstMoveUci: string;
  readonly boundaryFen: string;
  readonly secondMoveUci: string;
  readonly endFen: string;
  readonly landingSquare: string;
  readonly first: TransitionSemanticEventOperands;
  readonly second: TransitionSemanticEventOperands;
  readonly moveAnchors: readonly unknown[];
}

export interface DefenderExposureOperands {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly kind: "available" | "unavailable";
  readonly reason?: "invalid_turn_clone";
  readonly defender?: { readonly square: SquareName; readonly piece: Piece };
  readonly target?: { readonly square: SquareName; readonly piece: Piece };
  readonly captures?: readonly LegalExchangeResult[];
  readonly controllerEvent?: SquareControlEvent;
  readonly passConvention: "mover-turn-ep-cleared@1";
}

export interface DefenderConsequenceOperands {
  readonly kind: "edge_lost_target_captured" | "defender_relocated_target_captured";
  readonly anchors: readonly RecordedMoveAnchor[];
  readonly nodes: readonly { readonly nodeId: string; readonly fen: string }[];
  readonly defender: { readonly before: { readonly square: SquareName; readonly piece: Piece }; readonly after?: { readonly square: SquareName; readonly piece: Piece } };
  readonly target: { readonly square: SquareName; readonly piece: Piece };
  readonly firstMoveCapturedDefender: boolean;
  readonly finalCapture: LegalExchangeResult;
}

export interface CapturedZoneDefenderOperands {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly capture: TransitionSemanticEventOperands;
  readonly capturedSquare: SquareName;
  readonly kingColor: Color;
  readonly defender: KingZoneParticipant;
}

export interface OpenFileOccupancyOperands {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly piece: { readonly before: { readonly square: SquareName; readonly piece: Piece }; readonly after: { readonly square: SquareName; readonly piece: Piece } };
  readonly fileClass: "open_file" | "half_open_file";
  readonly sourceReading: StructuralObservation;
}

export interface ObservedSequenceBase {
  readonly anchors: readonly RecordedMoveAnchor[];
  readonly nodes: readonly { readonly nodeId: string; readonly fen: string }[];
  readonly conventionId: "observed-window@1";
}

export interface DeflectionObservedOperands extends ObservedSequenceBase {
  readonly baitMove: RecordedMoveAnchor;
  readonly defenderBefore: { readonly square: SquareName; readonly piece: Piece };
  readonly defenderAfter: { readonly square: SquareName; readonly piece: Piece };
  readonly lostDuty: { readonly defender: { readonly square: SquareName; readonly piece: Piece }; readonly target: { readonly square: SquareName; readonly piece: Piece } };
  readonly targetCapture: LegalExchangeResult;
}

export type DeflectionObservedInduction = "bait_capture" | "check_induced";

export interface AttractionObservedOperands extends ObservedSequenceBase {
  readonly horizon: 3 | 5;
  readonly baitMove: RecordedMoveAnchor;
  readonly heavyPiece: { readonly before: { readonly square: SquareName; readonly piece: Piece }; readonly arrival: { readonly square: SquareName; readonly piece: Piece } };
  readonly arrivalSquare: SquareName;
  readonly checkOrCaptureConsequence: { readonly kind: "check"; readonly move: RecordedMoveAnchor } | { readonly kind: "capture"; readonly move: RecordedMoveAnchor; readonly capture: TransitionSemanticEventOperands };
}

export interface LineBlockerClearanceObservedOperands extends ObservedSequenceBase {
  readonly blocker: { readonly square: SquareName; readonly piece: Piece };
  readonly slider: { readonly square: SquareName; readonly piece: Piece };
  readonly ray: readonly SquareName[];
  readonly target: { readonly square: SquareName; readonly piece: Piece };
  readonly targetCapture: LegalExchangeResult;
}

export interface SquareClearanceObservedOperands extends ObservedSequenceBase {
  readonly vacatedSquare: SquareName;
  readonly vacatingPiece: { readonly square: SquareName; readonly piece: Piece };
  readonly laterSlider: { readonly square: SquareName; readonly piece: Piece };
  readonly laterMove: RecordedMoveAnchor;
}

export interface InterferenceObservedOperands extends ObservedSequenceBase {
  readonly interposingMove: RecordedMoveAnchor;
  readonly slider: { readonly square: SquareName; readonly piece: Piece };
  readonly betweenSquare: SquareName;
  readonly target: { readonly square: SquareName; readonly piece: Piece };
  readonly brokenDuty: { readonly defender: { readonly square: SquareName; readonly piece: Piece }; readonly target: { readonly square: SquareName; readonly piece: Piece } };
  readonly targetCapture: LegalExchangeResult;
}

export interface CheckZwischenzugObservedOperands extends ObservedSequenceBase {
  readonly expectedRecapture: readonly string[];
  readonly intermediateCheck: RecordedMoveAnchor;
  readonly reply: RecordedMoveAnchor;
  readonly retainedRecapture: LegalExchangeResult;
}

export interface OverloadExploitationObservedOperands extends ObservedSequenceBase {
  readonly firstCapture: TransitionSemanticEventOperands;
  readonly defenderRecapture: TransitionSemanticEventOperands;
  readonly secondTargetCapture: LegalExchangeResult;
  readonly dutySet: readonly { readonly defender: { readonly square: SquareName; readonly piece: Piece }; readonly target: { readonly square: SquareName; readonly piece: Piece } }[];
}

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
  return exactMoveIdentity(beforeFen, moveUci);
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

function structuralEventSign(payload: StructuralSemanticEventOperands): "gained" | "lost" | "preserved" {
  return payload.before === null ? "gained" : payload.after === null ? "lost" : structuralMagnitude(payload.after) > structuralMagnitude(payload.before) ? "gained" : structuralMagnitude(payload.after) < structuralMagnitude(payload.before) ? "lost" : "preserved";
}

/** Pure structural-event operand population for one edge (the factory's producer operation). */
export function structuralSemanticEventPayloads(beforeFen: string, moveUci: string, afterFen: string, read: (fen: string) => StructuralReading = structuralReading): readonly StructuralSemanticEventOperands[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const before = read(anchor.beforeFen).features.filter((item): item is StructuralObservation & { kind: StructuralSemanticEventOperands["family"] } => STRUCTURAL_EVENT_FAMILIES.includes(item.kind as StructuralSemanticEventOperands["family"]));
  const after = read(anchor.afterFen).features.filter((item): item is StructuralObservation & { kind: StructuralSemanticEventOperands["family"] } => STRUCTURAL_EVENT_FAMILIES.includes(item.kind as StructuralSemanticEventOperands["family"]));
  const payloads: StructuralSemanticEventOperands[] = [];
  for (const family of STRUCTURAL_EVENT_FAMILIES) {
    const left = new Map(before.filter((item) => item.kind === family).map((item) => [structuralSubject(item), item]));
    const right = new Map(after.filter((item) => item.kind === family).map((item) => [structuralSubject(item), item]));
    for (const key of new Set([...left.keys(), ...right.keys()])) {
      payloads.push(immutable({ before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen, family, before: left.get(key) ?? null, after: right.get(key) ?? null }));
    }
  }
  return Object.freeze(payloads);
}

function edgeOf(anchor: SemanticEventAnchor) {
  return { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen };
}

function structuralSemanticEventsCached(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<StructuralSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const events: SemanticEvidenceEvent<StructuralSemanticEventOperands>[] = [];
  for (const family of STRUCTURAL_EVENT_FAMILIES) {
    for (const evidence of invokeEvidenceValueRoute(`rules.structural.event.${family}@1`, edgeOf(anchor))) {
      const payload = evidence.payload as StructuralSemanticEventOperands;
      events.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: evidence as DeclaredEvidence<StructuralSemanticEventOperands>, anchor, sign: structuralEventSign(payload) }));
    }
  }
  return Object.freeze(events.sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection)) || left.sign.localeCompare(right.sign) || left.id.localeCompare(right.id)));
}

export function structuralSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<StructuralSemanticEventOperands>[] {
  return structuralSemanticEventsCached(beforeFen, moveUci, afterFen);
}

/** Pure transition-event operand population for one edge (the factory's producer operation). */
export function transitionSemanticEventPayloads(beforeFen: string, moveUci: string, afterFen: string): readonly TransitionSemanticEventOperands[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  return Object.freeze(transitionSemanticFacts(beforeFen, moveUci, afterFen).map((fact) => {
    const destination = fact.family === "castled" ? exactMoveDestination(anchor.beforeFen, anchor.moveUci) : undefined;
    const normalizedFact = fact.family === "castled" ? { ...fact, from: anchor.moveUci.slice(0, 2), to: destination, detail: Object.freeze({ ...fact.detail, resultingKingSquare: destination }) } : fact;
    return immutable({ ...normalizedFact, before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen }) as TransitionSemanticEventOperands;
  }));
}

/** transitionSemanticFacts sorts by family name first; visiting families alphabetically keeps its order. */
const TRANSITION_EVENT_FAMILY_ORDER = Object.freeze(["capture", "castled", "checkmate", "clock_reset", "defended_duty", "developed", "last_of_role", "occupied_attack", "occupied_defence", "pawn_contact", "piece_escape", "promotion", "slider_ray"] as const);

export function transitionSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  return Object.freeze(TRANSITION_EVENT_FAMILY_ORDER.flatMap((family) => invokeEvidenceValueRoute(`rules.transition.event.${family}@1`, edgeOf(anchor))).map((evidence) => {
    const payload = evidence.payload as TransitionSemanticEventOperands;
    return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: evidence as DeclaredEvidence<TransitionSemanticEventOperands>, anchor, sign: payload.sign });
  }));
}

export function checkSemanticEvent(beforeFen: string, moveUci: string, afterFen: string): SemanticEvidenceEvent<CheckEvent> | undefined {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const check = invokeEvidenceValueRoute("rules.tactic.event.check@1", edgeOf(anchor))[0];
  if (check === undefined) return undefined;
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: check as DeclaredEvidence<CheckEvent>, anchor, sign: "state" });
}

export function tacticalSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<TacticalSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const events: SemanticEvidenceEvent<TacticalSemanticEventOperands>[] = [];
  const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", edgeOf(anchor));
  events.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: breadth as DeclaredEvidence<TacticalSemanticEventOperands>, anchor, sign: "state" }));
  const check = checkSemanticEvent(anchor.beforeFen, anchor.moveUci, anchor.afterFen);
  if (check !== undefined) events.push(check);
  for (const fork of invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", edgeOf(anchor))) events.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: fork as DeclaredEvidence<TacticalSemanticEventOperands>, anchor, sign: "gained" }));
  return Object.freeze(events.sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection))));
}

export function pawnIslandSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<PawnIslandEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  return Object.freeze(invokeEvidenceValueRoute("rules.structural.event.pawn_islands@1", edgeOf(anchor)).map((evidence) => {
    const payload = evidence.payload as PawnIslandEventOperands;
    const sign = payload.after > payload.before ? "gained" : payload.after < payload.before ? "lost" : "preserved";
    return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: evidence as DeclaredEvidence<PawnIslandEventOperands>, anchor, sign });
  }));
}

export function loosePieceSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<LoosePieceEvent>[] | undefined {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const result = invokeEvidenceValueRoute("rules.tactic.event.loose_piece@1", edgeOf(anchor));
  if (result.kind === "unavailable") return undefined;
  return Object.freeze(result.value.map((evidence) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: evidence as DeclaredEvidence<LoosePieceEvent>, anchor, sign: (evidence.payload as LoosePieceEvent).sign,
  })));
}

export function discoveredExecutedSemanticEvents(beforeFen: string, moveUci: string, afterFen: string, transitionEvents: readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] = transitionSemanticEvents(beforeFen, moveUci, afterFen)): readonly SemanticEvidenceEvent<DiscoveredExecutedEvent>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const gainedRays = transitionEvents.filter((event) => event.operands.family === "slider_ray" && event.sign === "gained");
  const latency = invokeEvidenceValueRoute("rules.tactic.reading.discovered_latency@1", { fen: anchor.beforeFen });
  return Object.freeze(invokeEvidenceValueRoute("derived.tactic.discovered_executed@1", { latency, rays: gainedRays.map((event) => event.evidence) }).map((item) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: item.evidence as DeclaredEvidence<DiscoveredExecutedEvent>, derivationInputs: item.inputs, anchor, sign: "gained",
  })));
}

export function castlingSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<CastlingSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  return Object.freeze(invokeEvidenceValueRoute("rules.castling.event.rights_lost@1", edgeOf(anchor)).map((evidence) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: evidence as DeclaredEvidence<CastlingSemanticEventOperands>, anchor, sign: "lost",
  })));
}

export function derivedExchangeSemanticEvents(beforeFen: string, moveUci: string, afterFen: string, transitionEvents: readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] = transitionSemanticEvents(beforeFen, moveUci, afterFen)): readonly SemanticEvidenceEvent<DerivedExchangeSemanticEventOperands>[] {
  const capture = transitionEvents.find((event) => event.operands.family === "capture");
  if (capture === undefined || capture.operands.family !== "capture") return [];
  const exchange = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: capture.operands.before_fen, captureUci: capture.operands.move_uci })[0];
  if (exchange === undefined) return [];
  return Object.freeze(invokeEvidenceValueRoute("derived.exchange.capture_class@1", { capture: capture.evidence, exchange }).map((evidence) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: evidence as DeclaredEvidence<DerivedExchangeSemanticEventOperands>,
    derivationInputs: [capture.evidence, exchange],
    anchor: capture.anchor,
    sign: "state",
  })));
}

export function tradeCompletedSemanticEvent(
  first: SemanticEvidenceEvent<TransitionSemanticEventOperands>,
  second: SemanticEvidenceEvent<TransitionSemanticEventOperands>,
  firstMoveAnchor: DeclaredEvidence<unknown>,
  secondMoveAnchor: DeclaredEvidence<unknown>,
): SemanticEvidenceEvent<TradeCompletedEventOperands> | undefined {
  assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, first);
  assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, second);
  assertDeclaredEvidence(firstMoveAnchor);
  assertDeclaredEvidence(secondMoveAnchor);
  if (first.operands.family !== "capture" || second.operands.family !== "capture") return undefined;
  if (first.anchor.afterFen !== second.anchor.beforeFen || first.operands.to !== second.operands.to) return undefined;
  if (refKey(firstMoveAnchor.projection) !== "run.record.move@1" || refKey(secondMoveAnchor.projection) !== "run.record.move@1") throw new TypeError("Trade completion requires two run.record.move anchors");
  const evidence = invokeEvidenceValueRoute("derived.exchange.trade_completed@1", { first: first.evidence, second: second.evidence, firstMove: firstMoveAnchor, secondMove: secondMoveAnchor })[0];
  if (evidence === undefined) return undefined;
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: evidence as DeclaredEvidence<TradeCompletedEventOperands>, derivationInputs: [first.evidence, second.evidence, firstMoveAnchor, secondMoveAnchor], anchor: second.anchor, sign: "state",
  });
}

function moverTurnClone(fen: string, mover: Color): Chess | undefined {
  const position = positionFromFen(fen);
  const clone = Chess.fromSetup({ ...position.toSetup(), turn: mover, epSquare: undefined });
  return clone.isOk ? clone.value : undefined;
}

function exactPiece(position: ReturnType<typeof positionFromFen>, square: SquareName): { readonly square: SquareName; readonly piece: Piece } | undefined {
  const index = parseSquare(square);
  const piece = index === undefined ? undefined : position.board.get(index);
  return piece === undefined ? undefined : Object.freeze({ square, piece });
}

function sameOccupant(left: Piece, right: Piece): boolean {
  return left.color === right.color && left.role === right.role && Boolean(left.promoted) === Boolean(right.promoted);
}

/** Exact lost enemy defence edges joined to positive legal captures under the disclosed pass clone. */
export function defenderExposureOperands(beforeFen: string, moveUci: string, afterFen: string): readonly DefenderExposureOperands[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const pass = moverTurnClone(anchor.afterFen, anchor.side);
  if (pass === undefined) return Object.freeze([{ beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen, kind: "unavailable", reason: "invalid_turn_clone", passConvention: "mover-turn-ep-cleared@1" }]);
  const enemy = opposite(anchor.side);
  const beforePosition = positionFromFen(anchor.beforeFen);
  const afterPosition = positionFromFen(anchor.afterFen);
  const lost = squareControlEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen).events.filter((event) => event.color === enemy && event.mode === "pseudo" && event.sign === "lost");
  const result: DefenderExposureOperands[] = [];
  for (const event of lost) {
    const targetBefore = exactPiece(beforePosition, event.target);
    const targetAfter = exactPiece(afterPosition, event.target);
    if (targetBefore === undefined || targetAfter === undefined || targetBefore.piece.color !== enemy || !sameOccupant(targetBefore.piece, targetAfter.piece)) continue;
    const targetSquare = parseSquare(event.target)!;
    const captures = legalCaptureMovesTo(pass, targetSquare).map((capture) => legalExchangeForMove(pass, capture)).filter((value): value is LegalExchangeResult => value !== undefined && value.resultUnits > 0);
    if (captures.length === 0) continue;
    result.push(Object.freeze({
      beforeFen: anchor.beforeFen,
      moveUci: anchor.moveUci,
      afterFen: anchor.afterFen,
      kind: "available",
      defender: event.controller,
      target: targetAfter,
      captures: Object.freeze(captures),
      controllerEvent: event,
      passConvention: "mover-turn-ep-cleared@1",
    }));
  }
  return Object.freeze(result);
}

function canonicalRecordedPath(values: readonly RecordedMoveAnchor[], expected: number): readonly RecordedMoveAnchor[] {
  if (values.length !== expected) throw new TypeError(`Recorded consequence requires exactly ${expected} anchors`);
  const result = values.map((value) => {
    const anchor = canonicalAnchor({ beforeFen: value.beforeFen, moveUci: value.moveUci, afterFen: value.afterFen, side: positionFromFen(value.beforeFen).turn });
    if (value.beforeNodeId.length === 0 || value.afterNodeId.length === 0 || value.beforeNodeId === value.afterNodeId) throw new TypeError("Recorded consequence requires distinct node ids");
    return Object.freeze({ beforeNodeId: value.beforeNodeId, afterNodeId: value.afterNodeId, beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen });
  });
  for (let index = 1; index < result.length; index += 1) if (result[index - 1]!.afterNodeId !== result[index]!.beforeNodeId || result[index - 1]!.afterFen !== result[index]!.beforeFen) throw new TypeError("Recorded consequence has a broken node/FEN boundary");
  return Object.freeze(result);
}

function recordNodes(anchors: readonly RecordedMoveAnchor[]): readonly { readonly nodeId: string; readonly fen: string }[] {
  return Object.freeze([{ nodeId: anchors[0]!.beforeNodeId, fen: anchors[0]!.beforeFen }, ...anchors.map((anchor) => ({ nodeId: anchor.afterNodeId, fen: anchor.afterFen }))]);
}

function defenseEdges(fen: string, color: Color): readonly { readonly defender: { readonly square: SquareName; readonly piece: Piece }; readonly target: { readonly square: SquareName; readonly piece: Piece } }[] {
  const position = positionFromFen(fen);
  const control = squareControlReading(fen).colors.find((entry) => entry.color === color)!.pseudo;
  const result = [];
  for (const square of control) {
    const target = exactPiece(position, square.target);
    if (target?.piece.color !== color) continue;
    for (const controller of square.controllers) result.push(Object.freeze({ defender: controller, target }));
  }
  return Object.freeze(result);
}

function defenseKey(value: ReturnType<typeof defenseEdges>[number]): string {
  return `${value.defender.square}:${value.defender.piece.color}:${value.defender.piece.role}:${value.target.square}:${value.target.piece.role}`;
}

/** Three recorded edges retaining defender/target identity; no force or causal semantics. */
export function defenderConsequenceOperands(values: readonly RecordedMoveAnchor[]): readonly DefenderConsequenceOperands[] {
  const anchors = canonicalRecordedPath(values, 3);
  const firstPosition = positionFromFen(anchors[0]!.beforeFen);
  const enemy = opposite(firstPosition.turn);
  const initialEdges = defenseEdges(anchors[0]!.beforeFen, enemy);
  const afterFirstEdges = new Set(defenseEdges(anchors[0]!.afterFen, enemy).map(defenseKey));
  const afterReplyEdges = new Set(defenseEdges(anchors[1]!.afterFen, enemy).map(defenseKey));
  const thirdPosition = positionFromFen(anchors[2]!.beforeFen);
  const thirdMove = parseUci(anchors[2]!.moveUci);
  if (thirdMove === undefined || !("from" in thirdMove)) return Object.freeze([]);
  const finalExchange = legalExchangeForMove(thirdPosition, thirdMove);
  if (finalExchange === undefined || finalExchange.resultUnits <= 0) return Object.freeze([]);
  const firstCapture = transitionSemanticFacts(anchors[0]!.beforeFen, anchors[0]!.moveUci, anchors[0]!.afterFen).find((fact) => fact.family === "capture");
  const replyMove = parseUci(anchors[1]!.moveUci);
  const results: DefenderConsequenceOperands[] = [];
  for (const edge of initialEdges) {
    if (edge.target.square !== finalExchange.captured.square || !sameOccupant(edge.target.piece, finalExchange.captured)) continue;
    const targetAfterFirst = exactPiece(positionFromFen(anchors[0]!.afterFen), edge.target.square);
    const targetAfterReply = exactPiece(positionFromFen(anchors[1]!.afterFen), edge.target.square);
    if (targetAfterFirst === undefined || targetAfterReply === undefined || !sameOccupant(edge.target.piece, targetAfterFirst.piece) || !sameOccupant(edge.target.piece, targetAfterReply.piece)) continue;
    const capturedDefender = firstCapture?.family === "capture" && firstCapture.to === edge.defender.square && firstCapture.captured.color === edge.defender.piece.color && firstCapture.captured.role === edge.defender.piece.role;
    if (!afterFirstEdges.has(defenseKey(edge))) {
      results.push(Object.freeze({ kind: "edge_lost_target_captured", anchors, nodes: recordNodes(anchors), defender: Object.freeze({ before: edge.defender }), target: edge.target, firstMoveCapturedDefender: capturedDefender, finalCapture: finalExchange }));
      continue;
    }
    if (replyMove === undefined || !("from" in replyMove) || makeSquare(replyMove.from) !== edge.defender.square) continue;
    const relocated = exactPiece(positionFromFen(anchors[1]!.afterFen), makeSquare(replyMove.to));
    if (relocated === undefined || !sameOccupant(edge.defender.piece, relocated.piece)) continue;
    const relocatedKey = defenseKey({ defender: relocated, target: edge.target });
    if (afterReplyEdges.has(relocatedKey)) continue;
    const beforePass = moverTurnClone(anchors[0]!.beforeFen, firstPosition.turn);
    const afterPass = moverTurnClone(anchors[0]!.afterFen, firstPosition.turn);
    const defenderSquare = parseSquare(edge.defender.square)!;
    if (beforePass === undefined || afterPass === undefined) continue;
    const attackedBefore = legalCaptureMovesTo(beforePass, defenderSquare).some((capture) => (legalExchangeForMove(beforePass, capture)?.resultUnits ?? 0) > 0);
    const attackedAfter = legalCaptureMovesTo(afterPass, defenderSquare).some((capture) => (legalExchangeForMove(afterPass, capture)?.resultUnits ?? 0) > 0);
    if (attackedBefore || !attackedAfter) continue;
    results.push(Object.freeze({ kind: "defender_relocated_target_captured", anchors, nodes: recordNodes(anchors), defender: Object.freeze({ before: edge.defender, after: relocated }), target: edge.target, firstMoveCapturedDefender: false, finalCapture: finalExchange }));
  }
  return Object.freeze(results);
}

function anchorMove(anchor: RecordedMoveAnchor) {
  const position = positionFromFen(anchor.beforeFen);
  const move = parseUci(anchor.moveUci);
  if (move === undefined || !("from" in move) || !position.isLegal(move)) throw new TypeError(`Recorded semantic move is illegal: ${anchor.moveUci}`);
  return { position, move };
}

function captureFact(anchor: RecordedMoveAnchor): TransitionSemanticEventOperands | undefined {
  const fact = transitionSemanticFacts(anchor.beforeFen, anchor.moveUci, anchor.afterFen).find((value) => value.family === "capture");
  return fact?.family === "capture" ? immutable({ ...fact, before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen }) as TransitionSemanticEventOperands : undefined;
}

function positiveCapture(anchor: RecordedMoveAnchor): LegalExchangeResult | undefined {
  const { position, move } = anchorMove(anchor);
  const exchange = legalExchangeForMove(position, move);
  return exchange !== undefined && exchange.resultUnits > 0 ? exchange : undefined;
}

function observed<T extends { readonly anchors: readonly RecordedMoveAnchor[] }>(payload: Omit<T, "nodes" | "conventionId">): T {
  return immutable({ ...payload, nodes: recordNodes(payload.anchors), conventionId: "observed-window@1" as const }) as unknown as T;
}

/** Selects the exact observed induction arm, preferring bait capture when both facts hold. */
export function deflectionObservedInduction(values: readonly RecordedMoveAnchor[]): DeflectionObservedInduction | undefined {
  const anchors = canonicalRecordedPath(values, 3);
  const first = anchorMove(anchors[0]!);
  const reply = anchorMove(anchors[1]!);
  const baitCapture = captureFact(anchors[1]!);
  if (reply.move.to === first.move.to && baitCapture?.family === "capture" && baitCapture.captured.color === first.position.turn) return "bait_capture";
  return positionFromFen(anchors[0]!.afterFen).isCheck() ? "check_induced" : undefined;
}

/** Exact three-edge defender displacement followed by a positive capture of the retained target. */
export function deflectionObservedOperands(values: readonly RecordedMoveAnchor[]): readonly DeflectionObservedOperands[] {
  const anchors = canonicalRecordedPath(values, 3);
  if (deflectionObservedInduction(anchors) === undefined) return Object.freeze([]);
  const first = anchorMove(anchors[0]!);
  const reply = anchorMove(anchors[1]!);
  const targetCapture = positiveCapture(anchors[2]!);
  if (targetCapture === undefined) return Object.freeze([]);
  const defendedColor = opposite(first.position.turn);
  const afterReply = positionFromFen(anchors[1]!.afterFen);
  const afterReplyEdges = new Set(defenseEdges(anchors[1]!.afterFen, defendedColor).map(defenseKey));
  const result: DeflectionObservedOperands[] = [];
  for (const duty of defenseEdges(anchors[0]!.beforeFen, defendedColor)) {
    if (makeSquare(reply.move.from) !== duty.defender.square || duty.target.square !== targetCapture.captured.square || !sameOccupant(duty.target.piece, targetCapture.captured)) continue;
    const defenderAfter = exactPiece(afterReply, makeSquare(reply.move.to));
    if (defenderAfter === undefined || !sameOccupant(duty.defender.piece, defenderAfter.piece)) continue;
    if (afterReplyEdges.has(defenseKey({ defender: defenderAfter, target: duty.target }))) continue;
    result.push(observed<DeflectionObservedOperands>({ anchors, baitMove: anchors[0]!, defenderBefore: duty.defender, defenderAfter, lostDuty: duty, targetCapture }));
  }
  return Object.freeze(result);
}

/** Heavy-piece attraction on the measured three-edge king or five-edge queen/rook horizon. */
export function attractionObservedOperands(values: readonly RecordedMoveAnchor[]): readonly AttractionObservedOperands[] {
  if (values.length !== 3 && values.length !== 5) throw new TypeError("Attraction requires exactly three or five anchors");
  const anchors = canonicalRecordedPath(values, values.length);
  const first = anchorMove(anchors[0]!);
  const reply = anchorMove(anchors[1]!);
  if (reply.move.to !== first.move.to) return Object.freeze([]);
  const baitCapture = captureFact(anchors[1]!);
  if (baitCapture?.family !== "capture" || baitCapture.captured.color !== first.position.turn) return Object.freeze([]);
  const heavyBefore = exactPiece(reply.position, makeSquare(reply.move.from));
  if (heavyBefore === undefined || heavyBefore.piece.color === first.position.turn || !["king", "queen", "rook"].includes(heavyBefore.piece.role)) return Object.freeze([]);
  const arrival = exactPiece(positionFromFen(anchors[1]!.afterFen), makeSquare(reply.move.to));
  if (arrival === undefined || !sameOccupant(heavyBefore.piece, arrival.piece)) return Object.freeze([]);
  const follow = anchorMove(anchors[2]!);
  const afterFollow = positionFromFen(anchors[2]!.afterFen);
  const follower = afterFollow.board.get(follow.move.to);
  if (follower?.color !== first.position.turn || !attacks(follower, follow.move.to, afterFollow.board.occupied).has(reply.move.to)) return Object.freeze([]);
  if (heavyBefore.piece.role === "king") {
    if (anchors.length !== 3 || !afterFollow.isCheck()) return Object.freeze([]);
    return Object.freeze([observed<AttractionObservedOperands>({ anchors, horizon: 3, baitMove: anchors[0]!, heavyPiece: Object.freeze({ before: heavyBefore, arrival }), arrivalSquare: arrival.square, checkOrCaptureConsequence: Object.freeze({ kind: "check", move: anchors[2]! }) })]);
  }
  if (anchors.length !== 5) return Object.freeze([]);
  const finishCapture = captureFact(anchors[4]!);
  if (finishCapture?.family !== "capture" || finishCapture.to !== arrival.square || finishCapture.captured.color !== arrival.piece.color || finishCapture.captured.role !== arrival.piece.role) return Object.freeze([]);
  return Object.freeze([observed<AttractionObservedOperands>({ anchors, horizon: 5, baitMove: anchors[0]!, heavyPiece: Object.freeze({ before: heavyBefore, arrival }), arrivalSquare: arrival.square, checkOrCaptureConsequence: Object.freeze({ kind: "capture", move: anchors[4]!, capture: finishCapture }) })]);
}

/** Friendly blocker vacates a sole ray and the unchanged slider later captures the retained target. */
export function lineBlockerClearanceObservedOperands(values: readonly RecordedMoveAnchor[]): readonly LineBlockerClearanceObservedOperands[] {
  const anchors = canonicalRecordedPath(values, 3);
  const first = anchorMove(anchors[0]!);
  const third = anchorMove(anchors[2]!);
  const blocker = exactPiece(first.position, makeSquare(first.move.from));
  const targetCapture = positiveCapture(anchors[2]!);
  if (blocker === undefined || targetCapture === undefined) return Object.freeze([]);
  const afterFirst = positionFromFen(anchors[0]!.afterFen);
  const result: LineBlockerClearanceObservedOperands[] = [];
  for (const [sliderSquare, sliderPiece] of first.position.board) {
    if (sliderPiece.color !== first.position.turn || !["bishop", "rook", "queen"].includes(sliderPiece.role)) continue;
    for (const [targetSquare, targetPiece] of first.position.board) {
      if (targetPiece.color === sliderPiece.color || targetPiece.role === "king") continue;
      const span = between(sliderSquare, targetSquare);
      const occupied = [...span.intersect(first.position.board.occupied)];
      if (occupied.length !== 1 || occupied[0] !== first.move.from || blocker.piece.color !== sliderPiece.color) continue;
      if (!attacks(sliderPiece, sliderSquare, afterFirst.board.occupied).has(targetSquare)) continue;
      if (third.move.from !== sliderSquare || third.move.to !== targetSquare || targetCapture.captured.square !== makeSquare(targetSquare) || !sameOccupant(targetPiece, targetCapture.captured)) continue;
      result.push(observed<LineBlockerClearanceObservedOperands>({ anchors, blocker, slider: Object.freeze({ square: makeSquare(sliderSquare), piece: sliderPiece }), ray: Object.freeze([...span].map(makeSquare)), target: Object.freeze({ square: makeSquare(targetSquare), piece: targetPiece }), targetCapture }));
    }
  }
  return Object.freeze(result);
}

/** Exact square vacation followed by a quiet same-side slider move to or through that square. */
export function squareClearanceObservedOperands(values: readonly RecordedMoveAnchor[]): readonly SquareClearanceObservedOperands[] {
  const anchors = canonicalRecordedPath(values, 3);
  const first = anchorMove(anchors[0]!);
  const third = anchorMove(anchors[2]!);
  if (first.move.from === third.move.from || captureFact(anchors[2]!) !== undefined) return Object.freeze([]);
  const vacatingPiece = exactPiece(first.position, makeSquare(first.move.from));
  const laterSlider = exactPiece(third.position, makeSquare(third.move.from));
  if (vacatingPiece === undefined || laterSlider?.piece.color !== first.position.turn || !["bishop", "rook", "queen"].includes(laterSlider.piece.role)) return Object.freeze([]);
  if (third.move.to !== first.move.from && !between(third.move.from, third.move.to).has(first.move.from)) return Object.freeze([]);
  return Object.freeze([observed<SquareClearanceObservedOperands>({ anchors, vacatedSquare: vacatingPiece.square, vacatingPiece, laterSlider, laterMove: anchors[2]! })]);
}

/** Interposition breaks an enemy slider duty and the retained target is positively captured. */
export function interferenceObservedOperands(values: readonly RecordedMoveAnchor[]): readonly InterferenceObservedOperands[] {
  const anchors = canonicalRecordedPath(values, 3);
  const first = anchorMove(anchors[0]!);
  const targetCapture = positiveCapture(anchors[2]!);
  if (targetCapture === undefined) return Object.freeze([]);
  const defendedColor = opposite(first.position.turn);
  const afterFirstEdges = new Set(defenseEdges(anchors[0]!.afterFen, defendedColor).map(defenseKey));
  const result: InterferenceObservedOperands[] = [];
  for (const duty of defenseEdges(anchors[0]!.beforeFen, defendedColor)) {
    if (!["bishop", "rook", "queen"].includes(duty.defender.piece.role) || !between(parseSquare(duty.defender.square)!, parseSquare(duty.target.square)!).has(first.move.to)) continue;
    if (afterFirstEdges.has(defenseKey(duty)) || duty.target.square !== targetCapture.captured.square || !sameOccupant(duty.target.piece, targetCapture.captured)) continue;
    const targetAfterFirst = exactPiece(positionFromFen(anchors[0]!.afterFen), duty.target.square);
    const targetAfterReply = exactPiece(positionFromFen(anchors[1]!.afterFen), duty.target.square);
    if (targetAfterFirst === undefined || targetAfterReply === undefined || !sameOccupant(duty.target.piece, targetAfterFirst.piece) || !sameOccupant(duty.target.piece, targetAfterReply.piece)) continue;
    result.push(observed<InterferenceObservedOperands>({ anchors, interposingMove: anchors[0]!, slider: duty.defender, betweenSquare: makeSquare(first.move.to), target: duty.target, brokenDuty: duty, targetCapture }));
  }
  return Object.freeze(result);
}

/** Exact recapture existed, a check intervened, and that same recapturer later captured positively. */
export function checkZwischenzugObservedOperands(values: readonly RecordedMoveAnchor[]): readonly CheckZwischenzugObservedOperands[] {
  const anchors = canonicalRecordedPath(values, 4);
  const initialCapture = captureFact(anchors[0]!);
  const betweenMove = anchorMove(anchors[1]!);
  const finalMove = anchorMove(anchors[3]!);
  if (initialCapture?.family !== "capture") return Object.freeze([]);
  const captureSquare = parseSquare(initialCapture.to)!;
  const recaptures = legalCaptureMovesTo(positionFromFen(anchors[0]!.afterFen), captureSquare).map((move) => makeUci(move)).sort();
  if (recaptures.length === 0 || betweenMove.move.to === captureSquare || !positionFromFen(anchors[1]!.afterFen).isCheck()) return Object.freeze([]);
  const retainedRecapture = positiveCapture(anchors[3]!);
  if (retainedRecapture === undefined || finalMove.move.to !== captureSquare || !recaptures.some((uci) => parseUci(uci) && (parseUci(uci) as Move & { from: number }).from === finalMove.move.from)) return Object.freeze([]);
  return Object.freeze([observed<CheckZwischenzugObservedOperands>({ anchors, expectedRecapture: Object.freeze(recaptures), intermediateCheck: anchors[1]!, reply: anchors[2]!, retainedRecapture })]);
}

/** Observed three-edge exploitation of a defender that held at least two duties. */
export function overloadExploitationObservedOperands(values: readonly RecordedMoveAnchor[]): readonly OverloadExploitationObservedOperands[] {
  const anchors = canonicalRecordedPath(values, 3);
  const first = anchorMove(anchors[0]!);
  const reply = anchorMove(anchors[1]!);
  const firstCapture = captureFact(anchors[0]!);
  const defenderRecapture = captureFact(anchors[1]!);
  const secondTargetCapture = positiveCapture(anchors[2]!);
  if (firstCapture?.family !== "capture" || defenderRecapture?.family !== "capture" || secondTargetCapture === undefined) return Object.freeze([]);
  const duties = defenseEdges(anchors[0]!.beforeFen, opposite(first.position.turn));
  const groups = new Map<string, typeof duties>();
  for (const duty of duties) {
    const key = `${duty.defender.square}:${duty.defender.piece.color}:${duty.defender.piece.role}`;
    groups.set(key, Object.freeze([...(groups.get(key) ?? []), duty]));
  }
  const result: OverloadExploitationObservedOperands[] = [];
  for (const dutySet of groups.values()) {
    if (dutySet.length < 2) continue;
    const firstDuty = dutySet.find((duty) => duty.target.square === firstCapture.to && duty.target.piece.color === firstCapture.captured.color && duty.target.piece.role === firstCapture.captured.role);
    if (firstDuty === undefined || makeSquare(reply.move.from) !== firstDuty.defender.square || makeSquare(reply.move.to) !== firstDuty.target.square || defenderRecapture.captured.color !== first.position.turn) continue;
    const secondDuty = dutySet.find((duty) => duty.target.square !== firstDuty.target.square && duty.target.square === secondTargetCapture.captured.square && sameOccupant(duty.target.piece, secondTargetCapture.captured));
    if (secondDuty === undefined) continue;
    result.push(observed<OverloadExploitationObservedOperands>({ anchors, firstCapture, defenderRecapture, secondTargetCapture, dutySet }));
  }
  return Object.freeze(result);
}

/** Generic capture identity joined to the captured piece's exact prior king-zone defender role. */
export function capturedZoneDefenderOperands(beforeFen: string, moveUci: string, afterFen: string): readonly CapturedZoneDefenderOperands[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const capture = transitionSemanticFacts(anchor.beforeFen, anchor.moveUci, anchor.afterFen).find((fact) => fact.family === "capture");
  if (capture?.family !== "capture") return Object.freeze([]);
  const from = parseSquare(capture.from)!;
  const to = parseSquare(capture.to)!;
  const capturedIndex = capture.enPassant ? ((Math.floor(from / 8) * 8 + to % 8) as typeof to) : to;
  const capturedSquare = makeSquare(capturedIndex);
  const state = kingZoneReading(anchor.beforeFen).kings.find((entry) => entry.color === capture.captured.color)!;
  return Object.freeze(state.defenders.filter((value) => value.square === capturedSquare && value.piece.role === capture.captured.role).map((defender) => Object.freeze({ beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen, capture: immutable({ ...capture, before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen }) as TransitionSemanticEventOperands, capturedSquare, kingColor: capture.captured.color, defender })));
}

/** Moved rook/queen newly occupying an existing open or mover-half-open file classification. */
export function openFileOccupancyOperands(beforeFen: string, moveUci: string, afterFen: string): OpenFileOccupancyOperands | undefined {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const beforePosition = positionFromFen(anchor.beforeFen);
  const afterPosition = positionFromFen(anchor.afterFen);
  const move = parseUci(anchor.moveUci);
  if (move === undefined || !("from" in move)) return undefined;
  const prior = beforePosition.board.get(move.from);
  const current = afterPosition.board.get(move.to);
  if (prior === undefined || current === undefined || (prior.role !== "rook" && prior.role !== "queen") || !sameOccupant(prior, current)) return undefined;
  const beforeFile = makeSquare(move.from)[0]!;
  const afterFile = makeSquare(move.to)[0]!;
  const eligible = (entry: StructuralObservation, file: string): boolean => entry.file === file && (entry.kind === "open_file" || entry.kind === "half_open_file" && entry.color === prior.color);
  const beforeClass = structuralReading(anchor.beforeFen).features.find((entry) => eligible(entry, beforeFile));
  const afterClass = structuralReading(anchor.afterFen).features.find((entry) => eligible(entry, afterFile));
  if (beforeClass !== undefined || afterClass === undefined || (afterClass.kind !== "open_file" && afterClass.kind !== "half_open_file")) return undefined;
  return Object.freeze({ beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen, piece: Object.freeze({ before: Object.freeze({ square: makeSquare(move.from), piece: prior }), after: Object.freeze({ square: makeSquare(move.to), piece: current }) }), fileClass: afterClass.kind, sourceReading: afterClass });
}

/** Brand-sealed one-edge breadth events. All remain eligible only for research.semantic_selection. */
export function breadthSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const result: SemanticEvidenceEvent[] = [];
  const edge = edgeOf(anchor);
  for (const evidence of invokeEvidenceValueRoute("rules.square.event.control@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, anchor, sign: (evidence.payload as SquareControlEvent).sign }));
  for (const evidence of invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, anchor, sign: "state" }));
  for (const evidence of invokeEvidenceValueRoute("rules.pawn.event.dynamics@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, anchor, sign: (evidence.payload as { readonly kind: string }).kind === "candidate_majority_advanced" ? "state" : "gained" }));
  for (const item of invokeEvidenceValueRoute("derived.pawn.event.transitions@1", edge)) {
    const kind = (item.evidence.payload as { readonly kind: string }).kind;
    result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: item.inputs, anchor, sign: kind === "moved_pawn_became_passed" || kind === "capture_created_moved_passer" ? "gained" : "state" }));
  }
  for (const item of invokeEvidenceValueRoute("derived.tactic.defender_exposure@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: item.inputs, anchor, sign: "gained" }));
  for (const item of invokeEvidenceValueRoute("derived.material.event.role_asymmetry@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: item.inputs, anchor, sign: "state" }));
  for (const evidence of invokeEvidenceValueRoute("rules.king.event.zone_state@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, anchor, sign: "state" }));
  for (const item of invokeEvidenceValueRoute("derived.king.captured_zone_defender@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: item.inputs, anchor, sign: "state" }));
  for (const item of invokeEvidenceValueRoute("derived.activity.event.open_file_occupancy@1", edge)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: item.inputs, anchor, sign: "gained" }));
  return Object.freeze(result.sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection)) || left.id.localeCompare(right.id)));
}

function sequenceAnchor(payload: { readonly anchors: readonly RecordedMoveAnchor[] }): SemanticEventAnchor {
  const edge = payload.anchors.at(-1)!;
  return Object.freeze({ beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen, side: positionFromFen(edge.beforeFen).turn });
}

/**
 * Selects the caller-named payload from the factory-computed population. The payload is only a
 * selector: a payload that the sealed inputs do not reproduce exactly cannot be compiled.
 */
function selectComputed<T>(population: readonly DeclaredEvidence<unknown>[], payload: T, label: string): DeclaredEvidence<T> {
  const digest = evidenceDigest(payload);
  const found = population.find((item) => evidenceValueReceipt(item).payloadDigest === digest);
  if (found === undefined) throw new TypeError(`${label} payload is not reproduced by its sealed inputs`);
  return found as DeclaredEvidence<T>;
}

function sequenceEvent<T>(route: EvidenceValueRoute, inputs: Readonly<Record<string, unknown>>, payload: T, derivationInputs: readonly DeclaredEvidence<unknown>[], anchors: readonly RecordedMoveAnchor[], label: string): SemanticEvidenceEvent<T> {
  const population = invokeEvidenceValueRoute(route, inputs as never) as unknown as readonly DeclaredEvidence<unknown>[];
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: selectComputed(population, payload, label), derivationInputs, anchor: sequenceAnchor({ anchors }), sign: "state" });
}

export function pawnContactTimingSemanticEvent(payload: PawnContactTimingSequence, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<PawnContactTimingSequence> {
  if (moveEvidence.length !== payload.anchors.length || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError("Pawn-contact timing requires one run.record.move evidence item per anchor");
  return sequenceEvent("derived.pawn.sequence.contact_timing@1", { moves: moveEvidence }, payload, moveEvidence, payload.anchors, "Pawn-contact timing");
}

export function harassmentPressureSemanticEvent(payload: HarassmentPressureSequence, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<HarassmentPressureSequence> {
  if (moveEvidence.length !== 2 || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError("Harassment pressure requires two run.record.move evidence items");
  return sequenceEvent("derived.pawn.sequence.harassment_pressure@1", { moves: moveEvidence }, payload, moveEvidence, payload.anchors, "Harassment pressure");
}

export function defenderConsequenceSemanticEvent(payload: DefenderConsequenceOperands, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<DefenderConsequenceOperands> {
  if (moveEvidence.length !== 3 || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError("Defender consequence requires three run.record.move evidence items");
  return sequenceEvent("derived.tactic.sequence.defender_consequence@1", { moves: moveEvidence }, payload, moveEvidence, payload.anchors, "Defender consequence");
}

function exactRecordedMoveContext(value: unknown, anchor: RecordedMoveAnchor): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const context = value as Readonly<Record<string, unknown>>;
  return context.beforeNodeId === anchor.beforeNodeId
    && context.afterNodeId === anchor.afterNodeId
    && context.beforeFen === anchor.beforeFen
    && context.moveUci === anchor.moveUci
    && context.afterFen === anchor.afterFen;
}

function assertOccurrenceEvidence(anchors: readonly RecordedMoveAnchor[], value: DeclaredEvidence<unknown>): void {
  const payload = value.payload;
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new TypeError(`Observed semantic sequence has non-object ${refKey(value.projection)} evidence`);
  const record = payload as Readonly<Record<string, unknown>>;
  const projection = refKey(value.projection);
  if (projection === "rules.tactic.reading.defender_duty_set@1" && record.fen !== anchors[0]?.beforeFen) throw new TypeError("Observed semantic sequence has crossed position-duty evidence");
  if (projection === "rules.transition.event.capture@1" && !anchors.some((anchor) => record.before_fen === anchor.beforeFen && record.move_uci === anchor.moveUci && record.after_fen === anchor.afterFen)) throw new TypeError("Observed semantic sequence has crossed capture evidence");
  if (projection === "rules.exchange.predicate.legal_exchange@1" && !anchors.some((anchor) => record.beforeFen === anchor.beforeFen && record.captureUci === anchor.moveUci)) throw new TypeError("Observed semantic sequence has crossed exchange evidence");
  if (projection === "rules.tactic.event.check@1" && !anchors.some((anchor) => record.triggeringMove === anchor.moveUci)) throw new TypeError("Observed semantic sequence has crossed check evidence");
}

export function assertExactPayload(value: DeclaredEvidence<unknown>, expected: unknown, label: string): void {
  if (evidenceDigest(value.payload) !== evidenceDigest(expected)) throw new TypeError(`Observed semantic sequence has crossed ${label} evidence`);
}

export function exactSequenceInputs(anchors: readonly RecordedMoveAnchor[], moveEvidence: readonly DeclaredEvidence<unknown>[], expectedMoves: number, otherEvidence: readonly DeclaredEvidence<unknown>[], requiredOther: readonly string[]): readonly DeclaredEvidence<unknown>[] {
  if (anchors.length !== expectedMoves || moveEvidence.length !== expectedMoves || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError(`Observed semantic sequence requires ${expectedMoves} run.record.move evidence items`);
  for (const [index, value] of moveEvidence.entries()) {
    const payload = value.payload;
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new TypeError("Observed semantic sequence has malformed recorded-move evidence");
    const record = payload as Readonly<Record<string, unknown>>;
    if (record.offset !== index || record.moveSan !== anchors[index]!.moveUci || !exactRecordedMoveContext(record.context, anchors[index]!)) throw new TypeError("Observed semantic sequence has crossed recorded-move evidence");
  }
  const actual = otherEvidence.map((value) => refKey(value.projection));
  for (const required of requiredOther) if (!actual.includes(`${required}@1`)) throw new TypeError(`Observed semantic sequence is missing ${required}@1 evidence`);
  for (const value of otherEvidence) assertOccurrenceEvidence(anchors, value);
  return Object.freeze([...moveEvidence, ...otherEvidence]);
}

export function lineBlockerClearanceSemanticEvent(payload: LineBlockerClearanceObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<LineBlockerClearanceObservedOperands> {
  assertExactPayload(exchangeEvidence, payload.targetCapture, "target-exchange");
  const inputs = exactSequenceInputs(payload.anchors, moveEvidence, 3, [exchangeEvidence], ["rules.exchange.predicate.legal_exchange"]);
  return sequenceEvent("derived.tactic.line_blocker_clearance_observed@1", { moves: moveEvidence, exchange: exchangeEvidence }, payload, inputs, payload.anchors, "Observed line-blocker clearance");
}

export function deflectionObservedSemanticEvent(payload: DeflectionObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, captureEvidence: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>, checkEvidence?: SemanticEvidenceEvent<CheckEvent>): SemanticEvidenceEvent<DeflectionObservedOperands> {
  if (captureEvidence.length === 0 || captureEvidence.some((value) => refKey(value.projection) !== "rules.transition.event.capture@1")) throw new TypeError("Observed deflection requires exact capture evidence");
  const induction = deflectionObservedInduction(payload.anchors);
  if (induction === undefined) throw new TypeError("Observed deflection payload has no induction authority");
  if (induction === "bait_capture" && checkEvidence !== undefined) throw new TypeError("unnecessary-check");
  if (induction === "check_induced") {
    if (checkEvidence === undefined) throw new TypeError("missing-check");
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, checkEvidence);
    if (refKey(checkEvidence.projection) !== "rules.tactic.event.check@1") throw new TypeError("wrong-projection");
    const first = payload.anchors[0]!;
    if (checkEvidence.anchor.beforeFen !== first.beforeFen || checkEvidence.anchor.moveUci !== first.moveUci || checkEvidence.anchor.afterFen !== first.afterFen) throw new TypeError("crossed-edge-check");
  }
  const optionalCheck = checkEvidence === undefined ? [] : [checkEvidence.evidence];
  const required = ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange", ...(induction === "check_induced" ? ["rules.tactic.event.check"] : [])];
  assertExactPayload(exchangeEvidence, payload.targetCapture, "target-exchange");
  const inputs = exactSequenceInputs(payload.anchors, moveEvidence, 3, [dutyEvidence, ...captureEvidence, exchangeEvidence, ...optionalCheck], required);
  return sequenceEvent("derived.tactic.deflection_observed@1", { moves: moveEvidence, duty: dutyEvidence, captures: captureEvidence, exchange: exchangeEvidence, ...(checkEvidence === undefined ? {} : { check: checkEvidence.evidence }) }, payload, inputs, payload.anchors, "Observed deflection");
}

export function attractionObservedSemanticEvent(payload: AttractionObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], captureEvidence: readonly DeclaredEvidence<unknown>[], checkEvidence?: DeclaredEvidence<unknown>): SemanticEvidenceEvent<AttractionObservedOperands> {
  if (captureEvidence.length === 0 || captureEvidence.some((value) => refKey(value.projection) !== "rules.transition.event.capture@1")) throw new TypeError("Observed attraction requires exact capture evidence");
  const isCheck = payload.checkOrCaptureConsequence.kind === "check";
  if (isCheck !== (checkEvidence !== undefined) || checkEvidence !== undefined && refKey(checkEvidence.projection) !== "rules.tactic.event.check@1") throw new TypeError("Observed attraction check authority disagrees with its consequence kind");
  const inputs = exactSequenceInputs(payload.anchors, moveEvidence, payload.horizon, [...captureEvidence, ...(checkEvidence === undefined ? [] : [checkEvidence])], ["rules.transition.event.capture", ...(isCheck ? ["rules.tactic.event.check"] : [])]);
  return sequenceEvent("derived.tactic.attraction_observed@1", { moves: moveEvidence, captures: captureEvidence, ...(checkEvidence === undefined ? {} : { check: checkEvidence }) }, payload, inputs, payload.anchors, "Observed attraction");
}

export function squareClearanceSemanticEvent(payload: SquareClearanceObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<SquareClearanceObservedOperands> {
  const inputs = exactSequenceInputs(payload.anchors, moveEvidence, 3, [], []);
  return sequenceEvent("derived.tactic.square_clearance_observed@1", { moves: moveEvidence }, payload, inputs, payload.anchors, "Observed square clearance");
}

export function interferenceSemanticEvent(payload: InterferenceObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<InterferenceObservedOperands> {
  assertExactPayload(exchangeEvidence, payload.targetCapture, "target-exchange");
  const inputs = exactSequenceInputs(payload.anchors, moveEvidence, 3, [dutyEvidence, exchangeEvidence], ["rules.tactic.reading.defender_duty_set", "rules.exchange.predicate.legal_exchange"]);
  return sequenceEvent("derived.tactic.interference_observed@1", { moves: moveEvidence, duty: dutyEvidence, exchange: exchangeEvidence }, payload, inputs, payload.anchors, "Observed interference");
}

export function checkZwischenzugSemanticEvent(payload: CheckZwischenzugObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], captureEvidence: DeclaredEvidence<unknown>, checkEvidence: DeclaredEvidence<unknown>, exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<CheckZwischenzugObservedOperands> {
  assertExactPayload(exchangeEvidence, payload.retainedRecapture, "retained-exchange");
  const inputs = exactSequenceInputs(payload.anchors, moveEvidence, 4, [captureEvidence, checkEvidence, exchangeEvidence], ["rules.transition.event.capture", "rules.tactic.event.check", "rules.exchange.predicate.legal_exchange"]);
  return sequenceEvent("derived.tactic.check_zwischenzug_observed@1", { moves: moveEvidence, capture: captureEvidence, check: checkEvidence, exchange: exchangeEvidence }, payload, inputs, payload.anchors, "Observed check zwischenzug");
}

export function overloadExploitationSemanticEvent(payload: OverloadExploitationObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, captureEvidence: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<OverloadExploitationObservedOperands> {
  if (captureEvidence.length !== 3 || captureEvidence.some((value) => refKey(value.projection) !== "rules.transition.event.capture@1")) throw new TypeError("Observed overload exploitation requires three exact capture evidence items");
  assertExactPayload(exchangeEvidence, payload.secondTargetCapture, "second-target-exchange");
  const inputs = exactSequenceInputs(payload.anchors, moveEvidence, 3, [dutyEvidence, ...captureEvidence, exchangeEvidence], ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
  return sequenceEvent("derived.tactic.overload_exploitation_observed@1", { moves: moveEvidence, duty: dutyEvidence, captures: captureEvidence, exchange: exchangeEvidence }, payload, inputs, payload.anchors, "Observed overload exploitation");
}

// ---------------------------------------------------------------------------------------------
// rfc/recorded-semantic-path §3: v2 successors deriving from the exact run.record.edge@1 source.
// The v2 factories recompute each payload from the sealed edges; the payload argument below is a
// selector only (rfc/evidence-value-authority.md §2.2).
// ---------------------------------------------------------------------------------------------

function recordedEdgePayloads(edges: readonly DeclaredEvidence<unknown>[]): readonly RecordedEdge[] {
  return edges.map((value) => {
    assertDeclaredEvidence(value);
    assertRecordedEdgeEvidence(value);
    return value.payload;
  });
}

/** Binds each exact edge to its operand anchor value-for-value and to one run. */
export function assertRecordedEdges(anchors: readonly RecordedMoveAnchor[], edges: readonly DeclaredEvidence<unknown>[], expected: number): readonly RecordedEdge[] {
  if (anchors.length !== expected || edges.length !== expected) throw new TypeError(`Recorded semantic sequence requires ${expected} run.record.edge@1 evidence items`);
  const payloads = recordedEdgePayloads(edges);
  for (const [index, edge] of payloads.entries()) {
    const anchor = anchors[index]!;
    if (edge.runId !== payloads[0]!.runId) throw new TypeError("Recorded semantic sequence mixes edges from different runs");
    if (edge.beforeNodeId !== anchor.beforeNodeId || edge.afterNodeId !== anchor.afterNodeId || edge.beforeFen !== anchor.beforeFen || edge.moveUci !== anchor.moveUci || edge.afterFen !== anchor.afterFen) {
      throw new TypeError("Recorded semantic sequence has crossed run.record.edge@1 evidence");
    }
    if (index > 0 && (payloads[index - 1]!.afterNodeId !== edge.beforeNodeId || payloads[index - 1]!.ply + 1 !== edge.ply)) throw new TypeError("Recorded semantic sequence edges are not contiguous");
  }
  return payloads;
}

/** The operand anchors an ordered sealed-edge window denotes (never caller supplied). */
export function recordedEdgeAnchors(edges: readonly DeclaredEvidence<unknown>[]): readonly RecordedMoveAnchor[] {
  const payloads = recordedEdgePayloads(edges);
  const anchors = payloads.map((edge) => Object.freeze({ beforeNodeId: edge.beforeNodeId, afterNodeId: edge.afterNodeId, beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen }));
  assertRecordedEdges(anchors, edges, edges.length);
  return Object.freeze(anchors);
}

function recordedSequenceAnchor(payloads: readonly RecordedEdge[]): SemanticEventAnchor {
  const edge = payloads.at(-1)!;
  return Object.freeze({ beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen, side: positionFromFen(edge.beforeFen).turn, runId: edge.runId, branchId: edge.edgeBranchId, nodeId: edge.afterNodeId });
}

export function exactRecordedSequenceInputs(anchors: readonly RecordedMoveAnchor[], edges: readonly DeclaredEvidence<unknown>[], expected: number, otherEvidence: readonly DeclaredEvidence<unknown>[], requiredOther: readonly string[]): { readonly inputs: readonly DeclaredEvidence<unknown>[]; readonly anchor: SemanticEventAnchor } {
  const payloads = assertRecordedEdges(anchors, edges, expected);
  const actual = otherEvidence.map((value) => refKey(value.projection));
  for (const required of requiredOther) if (!actual.includes(`${required}@1`)) throw new TypeError(`Recorded semantic sequence is missing ${required}@1 evidence`);
  for (const value of otherEvidence) {
    assertDeclaredEvidence(value);
    assertOccurrenceEvidence(anchors, value);
  }
  return { inputs: Object.freeze([...edges, ...otherEvidence]), anchor: recordedSequenceAnchor(payloads) };
}

function recordedSequenceEvent<T>(route: EvidenceValueRoute, factoryInputs: Readonly<Record<string, unknown>>, payload: T, sequence: { readonly inputs: readonly DeclaredEvidence<unknown>[]; readonly anchor: SemanticEventAnchor }, label: string): SemanticEvidenceEvent<T> {
  const population = invokeEvidenceValueRoute(route, factoryInputs as never) as unknown as readonly DeclaredEvidence<unknown>[];
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: selectComputed(population, payload, label), derivationInputs: sequence.inputs, anchor: sequence.anchor, sign: "state" });
}

export function recordedTradeCompletedSemanticEvent(
  first: SemanticEvidenceEvent<TransitionSemanticEventOperands>,
  second: SemanticEvidenceEvent<TransitionSemanticEventOperands>,
  firstEdge: DeclaredEvidence<unknown>,
  secondEdge: DeclaredEvidence<unknown>,
): SemanticEvidenceEvent<TradeCompletedEventOperands> | undefined {
  assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, first);
  assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, second);
  const [left, right] = recordedEdgePayloads([firstEdge, secondEdge]) as [RecordedEdge, RecordedEdge];
  if (first.operands.family !== "capture" || second.operands.family !== "capture") return undefined;
  if (first.anchor.afterFen !== second.anchor.beforeFen || first.operands.to !== second.operands.to) return undefined;
  const matches = (event: SemanticEvidenceEvent, edge: RecordedEdge): boolean => event.anchor.beforeFen === edge.beforeFen && event.anchor.moveUci === edge.moveUci && event.anchor.afterFen === edge.afterFen;
  if (!matches(first, left) || !matches(second, right) || left.runId !== right.runId || left.afterNodeId !== right.beforeNodeId || left.ply + 1 !== right.ply) {
    throw new TypeError("Recorded trade completion has crossed run.record.edge@1 evidence");
  }
  const evidence = invokeEvidenceValueRoute("derived.exchange.trade_completed@2", { first: first.evidence, second: second.evidence, firstEdge, secondEdge })[0];
  if (evidence === undefined) return undefined;
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: evidence as DeclaredEvidence<TradeCompletedEventOperands>, derivationInputs: [first.evidence, second.evidence, firstEdge, secondEdge], anchor: recordedSequenceAnchor([left, right]), sign: "state",
  });
}

export function recordedPawnContactTimingSemanticEvent(payload: PawnContactTimingSequence, edges: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<PawnContactTimingSequence> {
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, payload.anchors.length, [], []);
  return recordedSequenceEvent("derived.pawn.sequence.contact_timing@2", { edges }, payload, sequence, "Recorded pawn-contact timing");
}

export function recordedHarassmentPressureSemanticEvent(payload: HarassmentPressureSequence, edges: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<HarassmentPressureSequence> {
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 2, [], []);
  return recordedSequenceEvent("derived.pawn.sequence.harassment_pressure@2", { edges }, payload, sequence, "Recorded harassment pressure");
}

export function recordedDefenderConsequenceSemanticEvent(payload: DefenderConsequenceOperands, edges: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<DefenderConsequenceOperands> {
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 3, [], []);
  return recordedSequenceEvent("derived.tactic.sequence.defender_consequence@2", { edges }, payload, sequence, "Recorded defender consequence");
}

export function recordedLineBlockerClearanceSemanticEvent(payload: LineBlockerClearanceObservedOperands, edges: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<LineBlockerClearanceObservedOperands> {
  assertExactPayload(exchangeEvidence, payload.targetCapture, "target-exchange");
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 3, [exchangeEvidence], ["rules.exchange.predicate.legal_exchange"]);
  return recordedSequenceEvent("derived.tactic.line_blocker_clearance_observed@2", { edges, exchange: exchangeEvidence }, payload, sequence, "Recorded line-blocker clearance");
}

export function recordedDeflectionObservedSemanticEvent(payload: DeflectionObservedOperands, edges: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, captureEvidence: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>, checkEvidence?: SemanticEvidenceEvent<CheckEvent>): SemanticEvidenceEvent<DeflectionObservedOperands> {
  if (captureEvidence.length === 0 || captureEvidence.some((value) => refKey(value.projection) !== "rules.transition.event.capture@1")) throw new TypeError("Observed deflection requires exact capture evidence");
  const induction = deflectionObservedInduction(payload.anchors);
  if (induction === undefined) throw new TypeError("Observed deflection payload has no induction authority");
  if (induction === "bait_capture" && checkEvidence !== undefined) throw new TypeError("unnecessary-check");
  if (induction === "check_induced") {
    if (checkEvidence === undefined) throw new TypeError("missing-check");
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, checkEvidence);
    if (refKey(checkEvidence.projection) !== "rules.tactic.event.check@1") throw new TypeError("wrong-projection");
    const first = payload.anchors[0]!;
    if (checkEvidence.anchor.beforeFen !== first.beforeFen || checkEvidence.anchor.moveUci !== first.moveUci || checkEvidence.anchor.afterFen !== first.afterFen) throw new TypeError("crossed-edge-check");
  }
  const optionalCheck = checkEvidence === undefined ? [] : [checkEvidence.evidence];
  const required = ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange", ...(induction === "check_induced" ? ["rules.tactic.event.check"] : [])];
  assertExactPayload(exchangeEvidence, payload.targetCapture, "target-exchange");
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 3, [dutyEvidence, ...captureEvidence, exchangeEvidence, ...optionalCheck], required);
  return recordedSequenceEvent("derived.tactic.deflection_observed@2", { edges, duty: dutyEvidence, captures: captureEvidence, exchange: exchangeEvidence, ...(checkEvidence === undefined ? {} : { check: checkEvidence.evidence }) }, payload, sequence, "Recorded deflection");
}

export function recordedAttractionObservedSemanticEvent(payload: AttractionObservedOperands, edges: readonly DeclaredEvidence<unknown>[], captureEvidence: readonly DeclaredEvidence<unknown>[], checkEvidence?: DeclaredEvidence<unknown>): SemanticEvidenceEvent<AttractionObservedOperands> {
  if (captureEvidence.length === 0 || captureEvidence.some((value) => refKey(value.projection) !== "rules.transition.event.capture@1")) throw new TypeError("Observed attraction requires exact capture evidence");
  const isCheck = payload.checkOrCaptureConsequence.kind === "check";
  if (isCheck !== (checkEvidence !== undefined) || checkEvidence !== undefined && refKey(checkEvidence.projection) !== "rules.tactic.event.check@1") throw new TypeError("Observed attraction check authority disagrees with its consequence kind");
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, payload.horizon, [...captureEvidence, ...(checkEvidence === undefined ? [] : [checkEvidence])], ["rules.transition.event.capture", ...(isCheck ? ["rules.tactic.event.check"] : [])]);
  return recordedSequenceEvent("derived.tactic.attraction_observed@2", { edges, captures: captureEvidence, ...(checkEvidence === undefined ? {} : { check: checkEvidence }) }, payload, sequence, "Recorded attraction");
}

export function recordedSquareClearanceSemanticEvent(payload: SquareClearanceObservedOperands, edges: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<SquareClearanceObservedOperands> {
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 3, [], []);
  return recordedSequenceEvent("derived.tactic.square_clearance_observed@2", { edges }, payload, sequence, "Recorded square clearance");
}

export function recordedInterferenceSemanticEvent(payload: InterferenceObservedOperands, edges: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<InterferenceObservedOperands> {
  assertExactPayload(exchangeEvidence, payload.targetCapture, "target-exchange");
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 3, [dutyEvidence, exchangeEvidence], ["rules.tactic.reading.defender_duty_set", "rules.exchange.predicate.legal_exchange"]);
  return recordedSequenceEvent("derived.tactic.interference_observed@2", { edges, duty: dutyEvidence, exchange: exchangeEvidence }, payload, sequence, "Recorded interference");
}

export function recordedCheckZwischenzugSemanticEvent(payload: CheckZwischenzugObservedOperands, edges: readonly DeclaredEvidence<unknown>[], captureEvidence: DeclaredEvidence<unknown>, checkEvidence: DeclaredEvidence<unknown>, exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<CheckZwischenzugObservedOperands> {
  assertExactPayload(exchangeEvidence, payload.retainedRecapture, "retained-exchange");
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 4, [captureEvidence, checkEvidence, exchangeEvidence], ["rules.transition.event.capture", "rules.tactic.event.check", "rules.exchange.predicate.legal_exchange"]);
  return recordedSequenceEvent("derived.tactic.check_zwischenzug_observed@2", { edges, capture: captureEvidence, check: checkEvidence, exchange: exchangeEvidence }, payload, sequence, "Recorded check zwischenzug");
}

export function recordedOverloadExploitationSemanticEvent(payload: OverloadExploitationObservedOperands, edges: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, captureEvidence: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<OverloadExploitationObservedOperands> {
  if (captureEvidence.length !== 3 || captureEvidence.some((value) => refKey(value.projection) !== "rules.transition.event.capture@1")) throw new TypeError("Observed overload exploitation requires three exact capture evidence items");
  assertExactPayload(exchangeEvidence, payload.secondTargetCapture, "second-target-exchange");
  const sequence = exactRecordedSequenceInputs(payload.anchors, edges, 3, [dutyEvidence, ...captureEvidence, exchangeEvidence], ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
  return recordedSequenceEvent("derived.tactic.overload_exploitation_observed@2", { edges, duty: dutyEvidence, captures: captureEvidence, exchange: exchangeEvidence }, payload, sequence, "Recorded overload exploitation");
}

/** Brand-sealed one-edge duty events. They consume the already-compiled capture event. */
export function semanticDutyEvents(beforeFen: string, moveUci: string, afterFen: string, transitionEvents: readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] = transitionSemanticEvents(beforeFen, moveUci, afterFen)): readonly SemanticEvidenceEvent[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  void transitionEvents;
  const removed = invokeEvidenceValueRoute("rules.tactic.event.defender_removed@1", edgeOf(anchor)).map((evidence) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, anchor, sign: "state" }));
  const relocated = invokeEvidenceValueRoute("rules.tactic.event.defender_duty_relocated@1", edgeOf(anchor)).map((evidence) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, anchor, sign: "state" }));
  return Object.freeze([...removed, ...relocated]);
}

/** The one typed abstention the local one-edge closure publishes instead of swallowing. */
export interface LocalSemanticEventAbstention {
  readonly projection: "rules.tactic.event.loose_piece@1";
  readonly reason: "invalid_turn_clone";
}

export interface LocalSemanticEventClosure {
  readonly events: readonly SemanticEvidenceEvent[];
  readonly abstentions: readonly LocalSemanticEventAbstention[];
}

/**
 * The single code-derived one-edge event closure (shared-candidate-evidence-packet §1.5/§5.4).
 * `localSemanticEvents`, the candidate packet compiler and local semantic selection all read
 * this one composition, so no second, narrower enumerator can exist. The loose-piece collector's
 * `invalid_turn_clone` abstention is returned as a typed value rather than silently dropped.
 */
export function localSemanticEventClosure(beforeFen: string, moveUci: string, afterFen: string, structuralCache?: Map<string, StructuralReading>): LocalSemanticEventClosure {
  const transitionEvents = transitionSemanticEvents(beforeFen, moveUci, afterFen);
  const loose = loosePieceSemanticEvents(beforeFen, moveUci, afterFen);
  const events = Object.freeze([
    ...structuralSemanticEventsCached(beforeFen, moveUci, afterFen),
    ...pawnIslandSemanticEvents(beforeFen, moveUci, afterFen),
    ...transitionEvents,
    ...tacticalSemanticEvents(beforeFen, moveUci, afterFen),
    ...(loose ?? []),
    ...castlingSemanticEvents(beforeFen, moveUci, afterFen),
    ...derivedExchangeSemanticEvents(beforeFen, moveUci, afterFen, transitionEvents),
    ...discoveredExecutedSemanticEvents(beforeFen, moveUci, afterFen, transitionEvents),
    ...breadthSemanticEvents(beforeFen, moveUci, afterFen),
    ...semanticDutyEvents(beforeFen, moveUci, afterFen, transitionEvents),
  ]);
  const abstentions: readonly LocalSemanticEventAbstention[] = loose === undefined
    ? Object.freeze([Object.freeze({ projection: "rules.tactic.event.loose_piece@1" as const, reason: "invalid_turn_clone" as const })])
    : Object.freeze([]);
  return Object.freeze({ events, abstentions });
}

export function localSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent[] {
  return localSemanticEventClosure(beforeFen, moveUci, afterFen).events;
}

export function compileSemanticEvidenceEvent<T>(manifest: CompiledEvidenceManifest, input: SemanticEventInput<T>): SemanticEvidenceEvent<T> {
  assertDeclaredEvidence(input.evidence);
  const declaration = manifest.semanticEvents.find((candidate) => refKey(candidate.projection) === refKey(input.evidence.projection));
  const projection = manifest.projections.find((candidate) => refKey(candidate) === refKey(input.evidence.projection));
  if (declaration === undefined || projection === undefined || refKey(projection.producer) !== refKey(input.evidence.producer)) genericBypass("semantic event evidence is not an exact declared event source");
  if (!declaration.allowedSigns.includes(input.sign)) throw new EvidenceManifestError("EVIDENCE_EVENT_SIGN_WIDENS", "runtime event sign is not declared", [refKey(input.evidence.projection)]);
  const operands = input.evidence.payload;
  const keys = operandKeys(operands);
  if (!declaration.requiredOperands.every((operand) => keys.includes(operand))) throw new EvidenceManifestError("EVIDENCE_EVENT_OPERAND_MISSING", "runtime event payload lacks a required operand", [refKey(input.evidence.projection)]);
  const derivationInputs = [...(input.derivationInputs ?? [])];
  for (const value of derivationInputs) assertDeclaredEvidence(value);
  const receiptSources = [...evidenceValueReceipt(input.evidence).sourceDigests].sort();
  const suppliedSources = derivationInputs.map((value) => evidenceValueReceipt(value).payloadDigest).sort();
  if (receiptSources.join("|") !== suppliedSources.join("|")) throw new EvidenceManifestError("EVIDENCE_EVENT_DERIVATION_MISMATCH", "runtime derivation inputs are not the exact sealed inputs named by the factory receipt", [refKey(input.evidence.projection)]);
  const expectedMembers = declaration.derivationAnyOf ?? (declaration.derivationInputs === undefined ? [Object.freeze([])] : [declaration.derivationInputs]);
  const actualKeys = [...new Set(derivationInputs.map((value) => refKey(value.projection)))];
  const matchingMembers = expectedMembers.filter((member) => member.length === actualKeys.length && member.every((value) => actualKeys.includes(refKey(value))) && actualKeys.every((key) => member.some((value) => refKey(value) === key)));
  if (matchingMembers.length !== 1) throw new EvidenceManifestError("EVIDENCE_EVENT_DERIVATION_MISMATCH", "runtime derivation inputs disagree with the event declaration", [refKey(input.evidence.projection)]);
  const anchor = canonicalAnchor(input.anchor);
  const operandRecord = operands as Record<string, unknown>;
  if (("before_fen" in operandRecord && operandRecord.before_fen !== anchor.beforeFen) || ("move_uci" in operandRecord && operandRecord.move_uci !== anchor.moveUci) || ("after_fen" in operandRecord && operandRecord.after_fen !== anchor.afterFen)) throw new EvidenceManifestError("EVIDENCE_EVENT_OPERAND_MISSING", "runtime edge operands are not canonical anchor bytes", [refKey(input.evidence.projection)]);
  const id = evidenceDigest({
    projection: input.evidence.projection,
    beforeFen: anchor.beforeFen,
    moveUci: anchor.moveUci,
    afterFen: anchor.afterFen,
    sign: input.sign,
    operands,
    ...(declaration.derivationAnyOf === undefined ? {} : { derivationMember: [...actualKeys].sort() }),
  });
  const value = immutable({
    [SEMANTIC_EVENT]: true as const, id, projection: { ...input.evidence.projection }, evidence: input.evidence,
    derivationInputs, anchor, sign: input.sign, operands,
    basis: { grounding: projection.grounding, exactness: projection.exactness, confidence: projection.confidence },
  });
  SEMANTIC_EVENT_VALUES.add(value);
  return value;
}

export function assertSemanticEvidenceEvent(manifest: CompiledEvidenceManifest, value: unknown): asserts value is SemanticEvidenceEvent {
  if (typeof value !== "object" || value === null || (value as { readonly [SEMANTIC_EVENT]?: unknown })[SEMANTIC_EVENT] !== true || !SEMANTIC_EVENT_VALUES.has(value)) genericBypass("semantic event was not constructed by compileSemanticEvidenceEvent");
  const event = value as SemanticEvidenceEvent;
  if (event.operands !== event.evidence.payload) genericBypass("semantic event operands differ from the sealed evidence payload");
  const rebuilt = compileSemanticEvidenceEvent(manifest, { evidence: event.evidence, derivationInputs: event.derivationInputs, anchor: event.anchor, sign: event.sign });
  if (rebuilt.id !== event.id || evidenceDigest(rebuilt.basis) !== evidenceDigest(event.basis)) genericBypass("semantic event seal does not match its declared bytes");
}

export function legalAlternativeEdges(beforeFen: string, committedMoveUci: string): readonly { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }[] {
  const position = positionFromFen(beforeFen);
  const canonicalBefore = canonicalFen(position);
  const committed = canonicalMoveUci(canonicalBefore, committedMoveUci);
  const byUci = new Map<string, Move>();
  for (const exact of exactLegalMoves(canonicalBefore)) {
    const parsed = parseUci(exact.uci);
    if (parsed === undefined) throw new TypeError(`Exact legal move has invalid UCI ${exact.uci}`);
    const canonical = canonicalMoveUci(canonicalBefore, exact.uci);
    if (canonical !== committed) byUci.set(canonical, normalizeMove(position, parsed));
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
  // The population is a compiled packet receipt, never a caller callback (§1.2-§1.4, §3.2).
  assertCandidatePopulationReceipt(input.receipt);
  const packet = input.receipt.packet;
  if (!packet.scope.events) throw new TypeError("Semantic selection requires a candidate packet whose scope retains events");
  const playedRow = candidatePlayedRow(input.receipt, input.moveUci);
  const alternativeRows = candidateAlternatives(input.receipt, input.moveUci);
  for (const row of [playedRow, ...alternativeRows]) for (const event of row.events) {
    if (event.anchor.beforeFen !== packet.beforeFen || event.anchor.moveUci !== row.moveUci || event.anchor.afterFen !== row.afterFen) genericBypass("candidate packet event is not anchored to the edge it was retained for");
  }
  const alternatives = alternativeRows.length;
  // Measured, not asserted: an alternative whose event closure abstained was not evaluated.
  const evaluated = alternativeRows.filter((row) => row.abstentions.length === 0);
  if (playedRow.abstentions.length > 0 || evaluated.length !== alternatives) return selectedResult(manifest, policy, alternatives, evaluated.length, [], [], ref("counterfactual_population_incomplete"));
  const played = playedRow.events.filter((event) => eligible(manifest, event, consumer));
  const byFamily = new Map<string, SemanticEvidenceEvent[]>();
  for (const row of evaluated) for (const event of row.events.filter((value) => eligible(manifest, value, consumer))) {
    const key = familyKey(event);
    const values = byFamily.get(key) ?? [];
    if (!values.some((candidate) => candidate.anchor.moveUci === event.anchor.moveUci)) values.push(event);
    byFamily.set(key, values);
  }
  const afterFen = playedRow.afterFen;
  const critical = new Set(policy.criticalEvents.map(refKey));
  const candidates: { fact: SelectedEvidenceFact; support: number; critical: boolean; operandDigest: string }[] = [];
  const rejected: EvidenceSelectionResult["rejected"][number][] = [];
  for (const event of played) {
    const share = alternatives === 0 ? 0 : (byFamily.get(familyKey(event))?.length ?? 0) / alternatives;
    const isCritical = critical.has(refKey(event.projection));
    if (!isCritical && alternatives < policy.minimumAlternatives) rejected.push({ candidate: { kind: "played_event", id: event.id }, reason: ref("insufficient_alternatives") });
    else if (!isCritical && share > policy.maximumSameFamilyShare) rejected.push({ candidate: { kind: "played_event", id: event.id }, reason: ref("nothing_distinctive") });
    else candidates.push({ fact: { kind: "played_event", event, sameFamilyShare: share }, support: 1 - share, critical: isCritical, operandDigest: evidenceDigest(event.operands) });
  }
  if (policy.minimumAlternativeOnlyShare !== null && alternatives >= policy.minimumAlternatives) for (const [key, events] of byFamily) {
    if (played.some((event) => familyKey(event) === key)) continue;
    const [projectionKey, sign] = key.split(":") as [string, SemanticEventSign];
    const suffix = projectionKey.startsWith("rules.structural.event.")
      ? projectionKey.slice("rules.structural.event.".length).replace(/@\d+$/u, "")
      : projectionKey === "rules.tactic.event.loose_piece@1" ? "loose_piece" : undefined;
    if (suffix === undefined) continue;
    const share = events.length / alternatives;
    if (share < policy.minimumAlternativeOnlyShare) continue;
    const evidence = invokeEvidenceValueRoute(`derived.semantic_avoidance.${suffix}@1` as `derived.semantic_avoidance.${(typeof STRUCTURAL_EVENT_FAMILIES)[number] | "loose_piece" | "pawn_islands"}@1`, { beforeFen: packet.beforeFen, moveUci: playedRow.moveUci, afterFen, sign, events });
    const event = compileSemanticEvidenceEvent(manifest, { evidence, derivationInputs: events.map((value) => value.evidence), anchor: { beforeFen: packet.beforeFen, moveUci: playedRow.moveUci, afterFen, side: positionFromFen(packet.beforeFen).turn }, sign: "avoided" });
    if (eligible(manifest, event, consumer)) candidates.push({ fact: { kind: "counterfactual_absence", event }, support: share, critical: false, operandDigest: evidenceDigest(evidence.payload) });
  }
  candidates.sort((left, right) => Number(right.critical) - Number(left.critical) || right.support - left.support || (left.fact.kind === right.fact.kind ? 0 : left.fact.kind === "played_event" ? -1 : 1) || refKey(left.fact.event.projection).localeCompare(refKey(right.fact.event.projection)) || left.operandDigest.localeCompare(right.operandDigest) || left.fact.event.id.localeCompare(right.fact.event.id));
  if (policy.maxFacts === 0) return selectedResult(manifest, policy, alternatives, evaluated.length, [], rejected, ref("budget_zero"));
  const selected = candidates.slice(0, policy.maxFacts).map((candidate) => candidate.fact);
  for (const candidate of candidates.slice(policy.maxFacts)) rejected.push({ candidate: { kind: candidate.fact.kind, id: candidate.fact.event.id }, reason: ref(candidate.critical ? "critical_budget_exhausted" : "nothing_distinctive") });
  const emptyReason = selected.length > 0 ? undefined : played.length === 0 && candidates.length === 0 ? ref("no_eligible_events") : alternatives < policy.minimumAlternatives ? ref("insufficient_alternatives") : ref("nothing_distinctive");
  return selectedResult(manifest, policy, alternatives, evaluated.length, selected, rejected, emptyReason);
}

/**
 * Compiles the complete events-scope candidate packet at the root and selects over it. The move
 * is converted to `MOVE_IDENTITY_CONVENTION` here, at the caller boundary (§4.4); the packet
 * readers below never normalise.
 */
export function selectLocalSemanticEvidence(policyRef: VersionedEvidenceId, input: { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }): EvidenceSelectionResult {
  const compiled = compileCandidatePopulation({ beforeFen: input.beforeFen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
  if (compiled.kind !== "ready") throw new TypeError(`Candidate population did not compile: ${compiled.error.code}`);
  const moveUci = canonicalMoveUci(compiled.receipt.packet.beforeFen, input.moveUci);
  const row = candidatePlayedRow(compiled.receipt, moveUci);
  if (row.afterFen !== canonicalFen(positionFromFen(input.afterFen))) throw new TypeError(`Semantic selection after FEN does not match ${moveUci}`);
  return selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, policyRef, { receipt: compiled.receipt, moveUci });
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
