import { Chess, castlingSide, normalizeMove } from "chessops/chess";
import { attacks, between } from "chessops/attacks";
import { makeFen } from "chessops/fen";
import type { Color, Move, Piece, Role, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseSquare, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
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
import { declareAvoidanceEvidence, declareCaptureClassEvidence, declareCastlingRightsLostEvidence, declareCheckEventEvidence, declareCheckZwischenzugEvidence, declareDefenderDutyEvidence, declareDefenderDutyRelocatedEvidence, declareDefenderRemovedEvidence, declareDiscoveredExecutedEvidence, declareDiscoveredLatencyEvidence, declareDoubleAttackEvidence, declareInterferenceEvidence, declareLegalExchangeEvidence, declareLineBlockerClearanceEvidence, declareLoosePieceEventEvidence, declareOverloadExploitationEvidence, declarePawnIslandEventEvidence, declareReplyBreadthEvidence, declareSquareClearanceEvidence, declareStructuralSemanticSourceEvidence, declareTradeCompletedEvidence, declareTransitionSemanticSourceEvidence } from "./evidence-source-adapters.js";
import {
  declareCapturedZoneDefenderEvidence,
  declareDefenderConsequenceEvidence,
  declareDefenderExposureEvidence,
  declareHarassmentPressureEvidence,
  declareKingZoneEventEvidence,
  declareKingZoneReadingEvidence,
  declareMaterialRoleEventEvidence,
  declareMaterialRoleReadingEvidence,
  declareMobilityEventEvidence,
  declareOpenFileOccupancyEvidence,
  declarePawnContactTimingEvidence,
  declarePawnContactsEvidence,
  declarePawnDynamicsEvidence,
  declarePawnTransitionEvidence,
  declareSquareControlEventEvidence,
  declareStructuralReadingSourceEvidence,
} from "./evidence-source-adapters.js";
import { kingZoneReading, type KingZoneParticipant } from "./king-state.js";
import { kingZoneEvents } from "./king-state.js";
import { materialRoleAsymmetryEvent, materialRoleSignatureReading } from "./material-state.js";
import { pieceDestinationEvents } from "./mobility.js";
import { pawnContactsReading, pawnDynamicsEvents, pawnTransitionEvents, type HarassmentPressureSequence, type PawnContactTimingSequence, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import { squareControlEvents, squareControlReading, type SquareControlEvent } from "./square-control.js";
import { pawnConnectivityReading, structuralReading, type StructuralObservation, type StructuralReading } from "./structure.js";
import { checkEvent, defenderDutyReading, defenderDutyRelocatedEvents, defenderRemovedEvents, discoveredExecutedEvents, discoveredLatencyReading, doubleAttackEvent, loosePieceEvents, replyBreadth, type CheckEvent, type DiscoveredExecutedEvent, type DoubleAttackEvent, type GainedSliderRay, type LoosePieceEvent, type ReplyBreadth } from "./tactics.js";
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

export function pawnIslandSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<PawnIslandEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const before = pawnConnectivityReading(anchor.beforeFen);
  const after = pawnConnectivityReading(anchor.afterFen);
  return Object.freeze((["white", "black"] as const).map((color) => {
    const prior = before.colors.find((value) => value.color === color)!.islandCount;
    const current = after.colors.find((value) => value.color === color)!.islandCount;
    const sign = current > prior ? "gained" : current < prior ? "lost" : "preserved";
    const payload = immutable({ before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen, family: "pawn_islands" as const, color, before: prior, after: current });
    return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declarePawnIslandEventEvidence(payload), anchor, sign, operands: payload });
  }));
}

export function loosePieceSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<LoosePieceEvent>[] | undefined {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const result = loosePieceEvents(anchor.beforeFen, anchor.moveUci);
  if (result.kind === "unavailable") return undefined;
  if (result.afterFen !== anchor.afterFen) throw new TypeError(`Loose-piece after FEN does not match ${anchor.moveUci}`);
  return Object.freeze(result.events.map((payload) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: declareLoosePieceEventEvidence(payload), anchor, sign: payload.sign, operands: payload,
  })));
}

export function discoveredExecutedSemanticEvents(beforeFen: string, moveUci: string, afterFen: string, transitionEvents: readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] = transitionSemanticEvents(beforeFen, moveUci, afterFen)): readonly SemanticEvidenceEvent<DiscoveredExecutedEvent>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const gainedRays = transitionEvents.filter((event) => event.operands.family === "slider_ray" && event.sign === "gained");
  const byPayload = new Map(gainedRays.map((event) => [event.operands, event]));
  const events = discoveredExecutedEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen, gainedRays.map((event) => event.operands as GainedSliderRay));
  const latencyEvidence = declareDiscoveredLatencyEvidence(discoveredLatencyReading(anchor.beforeFen));
  return Object.freeze(events.map((payload) => {
    const rayEvent = byPayload.get(payload.gainedRay as TransitionSemanticEventOperands);
    if (rayEvent === undefined) throw new TypeError("Discovered execution lost its exact gained-ray source");
    return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
      evidence: declareDiscoveredExecutedEvidence(payload), derivationInputs: [latencyEvidence, rayEvent.evidence], anchor, sign: "gained", operands: payload,
    });
  }));
}

export function castlingSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent<CastlingSemanticEventOperands>[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  return Object.freeze(castlingRightsLost(anchor.beforeFen, anchor.moveUci, anchor.afterFen).map((payload) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: declareCastlingRightsLostEvidence(payload), anchor, sign: "lost", operands: payload,
  })));
}

export function derivedExchangeSemanticEvents(beforeFen: string, moveUci: string, afterFen: string, transitionEvents: readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] = transitionSemanticEvents(beforeFen, moveUci, afterFen)): readonly SemanticEvidenceEvent<DerivedExchangeSemanticEventOperands>[] {
  const capture = transitionEvents.find((event) => event.operands.family === "capture");
  if (capture === undefined || capture.operands.family !== "capture") return [];
  const payload = captureClassEvent({
    before_fen: capture.operands.before_fen,
    move_uci: capture.operands.move_uci,
    after_fen: capture.operands.after_fen,
    capture: capture.operands,
  });
  if (payload === undefined) return [];
  return Object.freeze([compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: declareCaptureClassEvidence(payload),
    derivationInputs: [capture.evidence, declareLegalExchangeEvidence(payload.exchange)],
    anchor: capture.anchor,
    sign: "state",
    operands: payload,
  })]);
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
  const payload = immutable({
    startFen: first.anchor.beforeFen,
    firstMoveUci: first.anchor.moveUci,
    boundaryFen: first.anchor.afterFen,
    secondMoveUci: second.anchor.moveUci,
    endFen: second.anchor.afterFen,
    landingSquare: first.operands.to,
    first: first.operands,
    second: second.operands,
    moveAnchors: [firstMoveAnchor.payload, secondMoveAnchor.payload],
  });
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: declareTradeCompletedEvidence(payload), derivationInputs: [first.evidence, second.evidence, firstMoveAnchor, secondMoveAnchor], anchor: second.anchor, sign: "state", operands: payload,
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

/** Exact three-edge defender displacement followed by a positive capture of the retained target. */
export function deflectionObservedOperands(values: readonly RecordedMoveAnchor[]): readonly DeflectionObservedOperands[] {
  const anchors = canonicalRecordedPath(values, 3);
  const first = anchorMove(anchors[0]!);
  const reply = anchorMove(anchors[1]!);
  const targetCapture = positiveCapture(anchors[2]!);
  if (targetCapture === undefined) return Object.freeze([]);
  const baitCapture = captureFact(anchors[1]!);
  const inducedByBait = reply.move.to === first.move.to && baitCapture?.family === "capture" && baitCapture.captured.color === first.position.turn;
  const inducedByCheck = positionFromFen(anchors[0]!.afterFen).isCheck();
  if (!inducedByBait && !inducedByCheck) return Object.freeze([]);
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
  const controls = squareControlEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen).events;
  const controlEvidence = new Map(controls.map((payload) => [payload, declareSquareControlEventEvidence(payload)]));
  for (const payload of controls) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: controlEvidence.get(payload)!, anchor, sign: payload.sign, operands: payload }));
  for (const payload of pieceDestinationEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen).events) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareMobilityEventEvidence(payload), anchor, sign: "state", operands: payload }));
  for (const payload of pawnDynamicsEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declarePawnDynamicsEvidence(payload), anchor, sign: payload.kind === "candidate_majority_advanced" ? "state" : "gained", operands: payload }));
  const contactsEvidence = declarePawnContactsEvidence(pawnContactsReading(anchor.beforeFen));
  for (const payload of pawnTransitionEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declarePawnTransitionEvidence(payload), derivationInputs: [contactsEvidence], anchor, sign: payload.kind === "moved_pawn_became_passed" || payload.kind === "capture_created_moved_passer" ? "gained" : "state", operands: payload }));
  for (const payload of defenderExposureOperands(anchor.beforeFen, anchor.moveUci, anchor.afterFen)) {
    const sources = payload.kind === "available" ? [declareSquareControlEventEvidence(payload.controllerEvent!), ...payload.captures!.map(declareLegalExchangeEvidence)] : [];
    if (payload.kind === "unavailable") continue;
    result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareDefenderExposureEvidence(payload), derivationInputs: sources, anchor, sign: "gained", operands: payload }));
  }
  const material = materialRoleAsymmetryEvent(anchor.beforeFen, anchor.moveUci, anchor.afterFen);
  if (material !== undefined) {
    const readings = [declareMaterialRoleReadingEvidence(materialRoleSignatureReading(anchor.beforeFen)), declareMaterialRoleReadingEvidence(materialRoleSignatureReading(anchor.afterFen))];
    result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareMaterialRoleEventEvidence(material), derivationInputs: readings, anchor, sign: "state", operands: material }));
  }
  for (const payload of kingZoneEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareKingZoneEventEvidence(payload), anchor, sign: "state", operands: payload }));
  const kingReadingEvidence = declareKingZoneReadingEvidence(kingZoneReading(anchor.beforeFen));
  const transitionEvents = transitionSemanticEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen);
  const capture = transitionEvents.find((event) => event.operands.family === "capture");
  if (capture !== undefined) for (const payload of capturedZoneDefenderOperands(anchor.beforeFen, anchor.moveUci, anchor.afterFen)) result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareCapturedZoneDefenderEvidence(payload), derivationInputs: [capture.evidence, kingReadingEvidence], anchor, sign: "state", operands: payload }));
  const activity = openFileOccupancyOperands(anchor.beforeFen, anchor.moveUci, anchor.afterFen);
  if (activity !== undefined && activity.fileClass === "open_file") {
    const source = declareStructuralReadingSourceEvidence(activity.sourceReading as StructuralObservation & { readonly kind: string });
    result.push(compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareOpenFileOccupancyEvidence(activity), derivationInputs: [source], anchor, sign: "gained", operands: activity }));
  }
  return Object.freeze(result.sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection)) || left.id.localeCompare(right.id)));
}

function sequenceAnchor(payload: { readonly anchors: readonly RecordedMoveAnchor[] }): SemanticEventAnchor {
  const edge = payload.anchors.at(-1)!;
  return Object.freeze({ beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen, side: positionFromFen(edge.beforeFen).turn });
}

export function pawnContactTimingSemanticEvent(payload: PawnContactTimingSequence, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<PawnContactTimingSequence> {
  if (moveEvidence.length !== payload.anchors.length || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError("Pawn-contact timing requires one run.record.move evidence item per anchor");
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declarePawnContactTimingEvidence(payload), derivationInputs: moveEvidence, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

export function harassmentPressureSemanticEvent(payload: HarassmentPressureSequence, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<HarassmentPressureSequence> {
  if (moveEvidence.length !== 2 || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError("Harassment pressure requires two run.record.move evidence items");
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareHarassmentPressureEvidence(payload), derivationInputs: moveEvidence, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

export function defenderConsequenceSemanticEvent(payload: DefenderConsequenceOperands, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<DefenderConsequenceOperands> {
  if (moveEvidence.length !== 3 || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError("Defender consequence requires three run.record.move evidence items");
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareDefenderConsequenceEvidence(payload), derivationInputs: moveEvidence, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

function exactSequenceInputs(moveEvidence: readonly DeclaredEvidence<unknown>[], expectedMoves: number, otherEvidence: readonly DeclaredEvidence<unknown>[], requiredOther: readonly string[]): readonly DeclaredEvidence<unknown>[] {
  if (moveEvidence.length !== expectedMoves || moveEvidence.some((value) => refKey(value.projection) !== "run.record.move@1")) throw new TypeError(`Observed semantic sequence requires ${expectedMoves} run.record.move evidence items`);
  const actual = otherEvidence.map((value) => refKey(value.projection));
  for (const required of requiredOther) if (!actual.includes(`${required}@1`)) throw new TypeError(`Observed semantic sequence is missing ${required}@1 evidence`);
  return Object.freeze([...moveEvidence, ...otherEvidence]);
}

export function lineBlockerClearanceSemanticEvent(payload: LineBlockerClearanceObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<LineBlockerClearanceObservedOperands> {
  const inputs = exactSequenceInputs(moveEvidence, 3, [exchangeEvidence], ["rules.exchange.predicate.legal_exchange"]);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareLineBlockerClearanceEvidence(payload), derivationInputs: inputs, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

export function squareClearanceSemanticEvent(payload: SquareClearanceObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[]): SemanticEvidenceEvent<SquareClearanceObservedOperands> {
  const inputs = exactSequenceInputs(moveEvidence, 3, [], []);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareSquareClearanceEvidence(payload), derivationInputs: inputs, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

export function interferenceSemanticEvent(payload: InterferenceObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<InterferenceObservedOperands> {
  const inputs = exactSequenceInputs(moveEvidence, 3, [dutyEvidence, exchangeEvidence], ["rules.tactic.reading.defender_duty_set", "rules.exchange.predicate.legal_exchange"]);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareInterferenceEvidence(payload), derivationInputs: inputs, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

export function checkZwischenzugSemanticEvent(payload: CheckZwischenzugObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], captureEvidence: DeclaredEvidence<unknown>, checkEvidence: DeclaredEvidence<unknown>, exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<CheckZwischenzugObservedOperands> {
  const inputs = exactSequenceInputs(moveEvidence, 4, [captureEvidence, checkEvidence, exchangeEvidence], ["rules.transition.event.capture", "rules.tactic.event.check", "rules.exchange.predicate.legal_exchange"]);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareCheckZwischenzugEvidence(payload), derivationInputs: inputs, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

export function overloadExploitationSemanticEvent(payload: OverloadExploitationObservedOperands, moveEvidence: readonly DeclaredEvidence<unknown>[], dutyEvidence: DeclaredEvidence<unknown>, captureEvidence: readonly DeclaredEvidence<unknown>[], exchangeEvidence: DeclaredEvidence<unknown>): SemanticEvidenceEvent<OverloadExploitationObservedOperands> {
  if (captureEvidence.length !== 2 || captureEvidence.some((value) => refKey(value.projection) !== "rules.transition.event.capture@1")) throw new TypeError("Observed overload exploitation requires two exact capture evidence items");
  const inputs = exactSequenceInputs(moveEvidence, 3, [dutyEvidence, ...captureEvidence, exchangeEvidence], ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareOverloadExploitationEvidence(payload), derivationInputs: inputs, anchor: sequenceAnchor(payload), sign: "state", operands: payload });
}

/** Brand-sealed one-edge duty events. They consume the already-compiled capture event. */
export function semanticDutyEvents(beforeFen: string, moveUci: string, afterFen: string, transitionEvents: readonly SemanticEvidenceEvent<TransitionSemanticEventOperands>[] = transitionSemanticEvents(beforeFen, moveUci, afterFen)): readonly SemanticEvidenceEvent[] {
  const anchor = canonicalAnchor({ beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn });
  const capture = transitionEvents.find((event) => event.operands.family === "capture");
  const removed = defenderRemovedEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen, capture?.operands as Extract<TransitionSemanticFact, { readonly family: "capture" }> | undefined).map((payload) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareDefenderRemovedEvidence(payload), anchor, sign: "state", operands: payload }));
  const relocated = defenderDutyRelocatedEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen).map((payload) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declareDefenderDutyRelocatedEvidence(payload), anchor, sign: "state", operands: payload }));
  return Object.freeze([...removed, ...relocated]);
}

export function localSemanticEvents(beforeFen: string, moveUci: string, afterFen: string): readonly SemanticEvidenceEvent[] {
  const transitionEvents = transitionSemanticEvents(beforeFen, moveUci, afterFen);
  return Object.freeze([...structuralSemanticEvents(beforeFen, moveUci, afterFen), ...pawnIslandSemanticEvents(beforeFen, moveUci, afterFen), ...transitionEvents, ...tacticalSemanticEvents(beforeFen, moveUci, afterFen), ...(loosePieceSemanticEvents(beforeFen, moveUci, afterFen) ?? []), ...castlingSemanticEvents(beforeFen, moveUci, afterFen), ...derivedExchangeSemanticEvents(beforeFen, moveUci, afterFen, transitionEvents), ...discoveredExecutedSemanticEvents(beforeFen, moveUci, afterFen, transitionEvents), ...breadthSemanticEvents(beforeFen, moveUci, afterFen), ...semanticDutyEvents(beforeFen, moveUci, afterFen, transitionEvents)]);
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
    const suffix = projectionKey.startsWith("rules.structural.event.")
      ? projectionKey.slice("rules.structural.event.".length).replace(/@\d+$/u, "")
      : projectionKey === "rules.tactic.event.loose_piece@1" ? "loose_piece" : undefined;
    if (suffix === undefined) continue;
    const share = events.length / alternatives.length;
    if (share < policy.minimumAlternativeOnlyShare) continue;
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
  const events = (edge: { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }): readonly SemanticEvidenceEvent[] | undefined => {
    const transitions = transitionSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen);
    const loose = loosePieceSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen);
    if (loose === undefined) return undefined;
    return Object.freeze([...structuralSemanticEventsCached(edge.beforeFen, edge.moveUci, edge.afterFen, cache), ...pawnIslandSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen), ...transitions, ...tacticalSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen), ...loose, ...castlingSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen), ...derivedExchangeSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen, transitions), ...discoveredExecutedSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen, transitions)]);
  };
  const playedEvents = events(input);
  return selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, policyRef, {
    ...input,
    playedEvents: playedEvents ?? [],
    evaluateAlternative: playedEvents === undefined ? () => undefined : events,
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
