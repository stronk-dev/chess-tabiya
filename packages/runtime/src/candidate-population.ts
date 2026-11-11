/**
 * Shared candidate evidence packet — rfc/shared-candidate-evidence-packet.md.
 *
 * One score-free, provider-free, complete legal-candidate event packet compiled from the root FEN
 * and the exact legal-move authority. It retains the ORIGINAL sealed events/readings by reference
 * and is recognised only through a process-local receipt authority. It is an internal execution
 * value: never an F1 projection, never persisted, never sent to a learner surface, and carrying no
 * score, rank, salience, valence, prose or grade. The runtime service/cache
 * (rfc/candidate-population-service.md) and the executable collector registry
 * (rfc/candidate-collector-registry.md) are separate successors and are not defined here.
 */
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";

import { castlingLegality, castlingRights } from "./castling.js";
import { foundationPositionCells, type FoundationPositionTuple } from "./foundation-position-cells.js";
import { assertCandidateTotalInputs, collectCandidateTotalInputs, type CandidateTotalInputs } from "./candidate-total-inputs.js";
import type { MoverPieceRiskSnapshot } from "./foundation-risk-sources.js";
import type { PhysicalSliderRaySnapshot } from "./foundation-slider-sources.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import {
  CANDIDATE_COLLECTOR_PROJECTION_KEYS,
  CANDIDATE_PACKET_ABSTENTION_REASONS,
} from "./candidate-population-projections.generated.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceDigest, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readFoundationEventInvocation, readFoundationPositionTuple, readMoverPieceRiskInvocation, readPhysicalSliderRaysInvocation } from "./internal/evidence-value-routes.js";
import { CANDIDATE_CHILD_READING_ROUTES, CANDIDATE_CURRENT_SOURCE_ROUTES } from "./internal/candidate-child-reading-routes.js";
import { legalExchange } from "./exchange.js";
import { kingZoneReading } from "./king-state.js";
import { MOVE_IDENTITY_CONVENTION, type ExactLegalMove, type ExactLegalMoveMap } from "./legal-moves.js";
import { materialRoleSignatureReading } from "./material-state.js";
import { pieceDestinationsReading } from "./mobility.js";
import { candidateMajorityReading, pawnContactsReading } from "./pawn-dynamics.js";
import { developmentReading } from "./phase.js";
import {
  assertSemanticEvidenceEvent,
  localSemanticEventClosure,
  LocalSemanticCollection,
  localSemanticCollectorOutcomes,
  type SemanticEvidenceEvent,
} from "./semantic-evidence.js";
import { squareControlReading } from "./square-control.js";
import { pawnConnectivityReading, spaceReading, type StructuralReading } from "./structure.js";
import {
  backRankReading,
  discoveredLatencyReading,
  forkSurvivesReply,
  loosePieceReading,
  mateInOne,
  promotionPressureReading,
  rayClassificationReading,
  rookOnSeventhReading,
  threats,
  trappedPieceReading,
  type DoubleAttackEvent,
  type ReplyBreadth,
} from "./tactics.js";

/** Every construction-semantic change must move this literal (criterion 11/21 identity fixtures). */
export const CANDIDATE_PACKET_COMPILER_VERSION = 8 as const;
export const CANDIDATE_PACKET_LEGAL_CONVENTION = Object.freeze({ id: "rules.mobility.reading.legal_moves", version: 1 } as const);

export type CandidateEventsScope = { readonly events: true; readonly readings: false };
export type CandidateReadingsScope = { readonly events: false; readonly readings: true };
export type CandidateWideScope = { readonly events: true; readonly readings: true };
export type CandidatePacketScope = CandidateEventsScope | CandidateReadingsScope | CandidateWideScope;
export type ProjectableCandidateScope<S extends CandidatePacketScope> = S extends CandidateWideScope ? CandidatePacketScope : S;
export type CandidatePacketScopeMember = "events" | "readings" | "events_and_readings";

export const CANDIDATE_EVENTS_SCOPE: CandidateEventsScope = Object.freeze({ events: true, readings: false });
export const CANDIDATE_READINGS_SCOPE: CandidateReadingsScope = Object.freeze({ events: false, readings: true });
export const CANDIDATE_WIDE_SCOPE: CandidateWideScope = Object.freeze({ events: true, readings: true });

export type CandidateCollectorProjection = {
  [K in keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS]: (typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS)[K][number]
}[keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS];

export type CandidatePacketAbstention = {
  [P in keyof typeof CANDIDATE_PACKET_ABSTENTION_REASONS]: {
    readonly projection: P;
    readonly reason: (typeof CANDIDATE_PACKET_ABSTENTION_REASONS)[P][number];
  }
}[keyof typeof CANDIDATE_PACKET_ABSTENTION_REASONS];

const EVENT_GROUPS = Object.freeze((Object.keys(CANDIDATE_COLLECTOR_PROJECTION_KEYS) as (keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS)[]).filter((group) => group.startsWith("event.")));
const READING_GROUPS = Object.freeze((Object.keys(CANDIDATE_COLLECTOR_PROJECTION_KEYS) as (keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS)[]).filter((group) => group.startsWith("reading.")));
/** The code-derived closure a packet row may retain as events (§5.3, criterion 16). */
export const LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS: readonly CandidateCollectorProjection[] = Object.freeze(EVENT_GROUPS.flatMap((group) => [...CANDIDATE_COLLECTOR_PROJECTION_KEYS[group]]));
/** The declared child readings plus legal exchange and fork survival (§5.3, criterion 9). */
export const LOCAL_CANDIDATE_READING_PROJECTION_KEYS: readonly CandidateCollectorProjection[] = Object.freeze(READING_GROUPS.flatMap((group) => [...CANDIDATE_COLLECTOR_PROJECTION_KEYS[group]]));
const EVENT_KEYS: ReadonlySet<string> = new Set<string>(LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS);
const READING_KEYS: ReadonlySet<string> = new Set<string>(LOCAL_CANDIDATE_READING_PROJECTION_KEYS);

export interface CandidateEventPopulation<S extends CandidatePacketScope = CandidatePacketScope> {
  readonly id: string;
  readonly beforeFen: string;
  readonly ruleset: "standard";
  readonly scope: S;
  readonly legalConvention: typeof CANDIDATE_PACKET_LEGAL_CONVENTION;
  readonly moveIdentityConvention: typeof MOVE_IDENTITY_CONVENTION;
  readonly manifestDigest: string;
  readonly compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION;
  readonly legalMoves: readonly ExactLegalMove[];
  readonly candidates: readonly CandidateEventRow[];
  readonly terminal?: { readonly reason: "checkmate" | "stalemate" };
}

export interface CandidateEventRow {
  readonly moveUci: string;
  readonly afterFen: string;
  readonly events: readonly SemanticEvidenceEvent[];
  readonly readings: readonly DeclaredEvidence<unknown>[];
  readonly abstentions: readonly CandidatePacketAbstention[];
}

export interface CandidatePopulationRequest<S extends CandidatePacketScope = CandidatePacketScope> {
  readonly beforeFen: string;
  readonly ruleset: "standard";
  readonly scope: S;
}

/**
 * The minimal sealed outcome behind a published abstention. The complete per-collector outcome
 * set, its memo and its failure identity are rfc/candidate-collector-registry.md's (Discharge D12).
 */
export interface SealedCandidateCollectorOutcome {
  readonly moveUci: string;
  readonly projection: CandidatePacketAbstention["projection"];
  readonly result: { readonly kind: "unavailable"; readonly reason: CandidatePacketAbstention["reason"] };
}

export interface CandidatePopulationReceipt<S extends CandidatePacketScope = CandidatePacketScope> {
  readonly packet: CandidateEventPopulation<S>;
  readonly selectedMember: CandidatePacketScopeMember;
  readonly manifest: typeof PRIMARY_EVIDENCE_MANIFEST;
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
  readonly candidateInputs: readonly {
    readonly moveUci: string;
    readonly events: readonly SemanticEvidenceEvent[];
    readonly readings: readonly DeclaredEvidence<unknown>[];
    readonly collectorOutcomes: readonly SealedCandidateCollectorOutcome[];
  }[];
}

export type CandidatePopulationFailure =
  | { readonly code: "invalid_request"; readonly reason: "shape" | "scope" | "fen_type" }
  | { readonly code: "unsupported_ruleset"; readonly received: string }
  | { readonly code: "invalid_fen"; readonly message: string }
  | { readonly code: "non_terminal_empty"; readonly beforeFen: string }
  | { readonly code: "invariant_failed"; readonly invariant: "terminal" | "legal_set" | "child_fen" | "receipt" };

export type CandidatePopulationCompileResult<S extends CandidatePacketScope> =
  | { readonly kind: "ready"; readonly receipt: CandidatePopulationReceipt<S> }
  | { readonly kind: "failed"; readonly error: CandidatePopulationFailure };

export type CandidatePopulationProjectionResult<S extends CandidatePacketScope> =
  | { readonly kind: "ready"; readonly receipt: CandidatePopulationReceipt<S> }
  | {
      readonly kind: "failed";
      readonly error: { readonly code: "invalid_scope_projection"; readonly source: CandidatePacketScope; readonly target: CandidatePacketScope };
    };

/** Every identity term of a factual packet, and nothing else (§6.1). */
export interface CandidatePacketIdentity {
  readonly beforeFen: string;
  readonly legalConvention: string;
  readonly moveIdentityConvention: string;
  readonly manifestDigest: string;
  readonly compilerVersion: number;
  readonly ruleset: string;
  readonly scope: CandidatePacketScopeMember;
}

/** A caller UCI that is not one of this packet's `MOVE_IDENTITY_CONVENTION` identities. Never normalised (§4.4). */
export class CandidatePacketMoveError extends TypeError {
  readonly code = "move_not_in_packet" as const;
  readonly convention = MOVE_IDENTITY_CONVENTION;
  constructor(readonly moveUci: string, readonly beforeFen: string) {
    super(`${moveUci} is not a ${MOVE_IDENTITY_CONVENTION} move identity of the candidate packet at ${beforeFen}; convert at the engine/pack boundary before reading`);
  }
}

interface CompiledRowValues {
  readonly afterFen: string;
  readonly events: readonly SemanticEvidenceEvent[];
  readonly readings: readonly DeclaredEvidence<unknown>[];
  readonly abstentions: readonly CandidatePacketAbstention[];
  readonly outcomes: readonly SealedCandidateCollectorOutcome[];
  readonly common?: FoundationPositionTuple;
  readonly foundation?: CandidateFoundationPosition;
}

/** Internal original-source handoff, never a public packet reading or transport field. */
export interface CandidateFoundationPosition {
  readonly common: FoundationPositionTuple;
  readonly totals: CandidateTotalInputs;
  readonly rays: DeclaredEvidence<PhysicalSliderRaySnapshot>;
  readonly risk:
    | { readonly kind: "available"; readonly value: DeclaredEvidence<MoverPieceRiskSnapshot> }
    | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone" };
}

export interface CandidateFoundationSources {
  readonly root: CandidateFoundationPosition;
  readonly candidates: readonly {
    readonly move: ExactLegalMove;
    readonly row: CandidateEventRow;
    readonly position: CandidateFoundationPosition;
  }[];
}

/** Complete foundation authority, deliberately not a packet or a wide-scope projection. */
export interface CandidateFoundationReceipt {
  readonly kind: "foundation";
  readonly beforeFen: string;
  readonly compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION;
  readonly id: string;
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
}
export interface CandidateOutcomeSources {
  readonly root: CandidateFoundationPosition;
  readonly candidates: readonly {
    readonly move: ExactLegalMove;
    readonly row: Readonly<{ moveUci: string; afterFen: string }>;
    readonly position: CandidateFoundationPosition;
  }[];
}
export type CandidateOutcomeReceipt = CandidateFoundationReceipt | CandidatePopulationReceipt<CandidateWideScope>;
export type CandidateAcquisitionScope = CandidatePacketScopeMember | "foundation";
/** Opaque process-local construction token; copying its public tag grants no membership. */
export interface CandidateConstruction { readonly kind: "candidate_construction" }
export type CandidateAcquisitionReceipt<S extends CandidateAcquisitionScope> = S extends "foundation"
  ? CandidateFoundationReceipt : S extends "events_and_readings" ? CandidatePopulationReceipt<CandidateWideScope>
    : S extends "events" ? CandidatePopulationReceipt<CandidateEventsScope> : CandidatePopulationReceipt<CandidateReadingsScope>;
export type CandidateAcquisitionResult<S extends CandidateAcquisitionScope> =
  | { readonly kind: "pending" }
  | { readonly kind: "ready"; readonly receipt: CandidateAcquisitionReceipt<S> }
  | { readonly kind: "failed"; readonly error: CandidatePopulationFailure };
interface CandidateConstructionState {
  readonly beforeFen: string;
  owner?: CandidateCompilation;
  legalFailure?: CandidatePopulationFailure;
  readonly failures: Map<CandidateAcquisitionScope, CandidatePopulationFailure>;
  readonly receipts: Map<CandidateAcquisitionScope, CandidatePopulationReceipt | CandidateFoundationReceipt>;
}
const CONSTRUCTIONS = new WeakMap<CandidateConstruction, CandidateConstructionState>();
const FOUNDATION_RECEIPTS = new WeakMap<CandidateFoundationReceipt, CandidateOutcomeSources>();

/** Common prerequisites exist privately for events-only too; avoidance totals remain wide-only. */
interface CandidateCommonSources {
  readonly root: FoundationPositionTuple;
  readonly candidates: readonly { readonly move: ExactLegalMove; readonly row: CandidateEventRow; readonly common: FoundationPositionTuple }[];
}

interface CandidatePopulationReceiptReferences {
  readonly manifest: typeof PRIMARY_EVIDENCE_MANIFEST;
  readonly packet: CandidateEventPopulation;
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
  readonly candidateInputs: readonly {
    readonly row: CandidateEventRow;
    readonly events: CandidateEventRow["events"];
    readonly readings: CandidateEventRow["readings"];
  }[];
  readonly foundation?: CandidateFoundationSources;
  readonly common?: CandidateCommonSources;
  readonly originalFoundation?: CandidateFoundationReceipt;
}

const CANDIDATE_POPULATION_RECEIPTS = new WeakMap<object, CandidatePopulationReceiptReferences>();
const OUTCOMES = new WeakSet<object>();
const VERIFIED_EVENTS = new WeakSet<object>();
const VERIFIED_READINGS = new WeakSet<object>();
const EMPTY: readonly never[] = Object.freeze([]);

class CandidateInvariantFailure extends Error {
  constructor(readonly invariant: "terminal" | "legal_set" | "child_fen" | "receipt", detail: string) { super(`candidate packet invariant ${invariant}: ${detail}`); }
}

function memberOf(scope: CandidatePacketScope): CandidatePacketScopeMember {
  return scope.events && scope.readings ? "events_and_readings" : scope.events ? "events" : "readings";
}

function scopeOf(member: CandidatePacketScopeMember): CandidatePacketScope {
  return member === "events" ? CANDIDATE_EVENTS_SCOPE : member === "readings" ? CANDIDATE_READINGS_SCOPE : CANDIDATE_WIDE_SCOPE;
}

export function candidatePacketId(identity: CandidatePacketIdentity): string {
  return evidenceDigest({
    beforeFen: identity.beforeFen,
    legalConvention: identity.legalConvention,
    moveIdentityConvention: identity.moveIdentityConvention,
    manifestDigest: identity.manifestDigest,
    compilerVersion: identity.compilerVersion,
    ruleset: identity.ruleset,
    scope: identity.scope,
  });
}

function packetIdentity(beforeFen: string, member: CandidatePacketScopeMember): CandidatePacketIdentity {
  return {
    beforeFen,
    legalConvention: `${CANDIDATE_PACKET_LEGAL_CONVENTION.id}@${CANDIDATE_PACKET_LEGAL_CONVENTION.version}`,
    moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
    compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
    ruleset: "standard",
    scope: member,
  };
}

/**
 * Local per-child readings. The complete legal-position source is retained exactly once and
 * shared by the foundation snapshots; a parent's legal map is never a child's source.
 */
export function candidateChildReadings(afterFen: string): readonly DeclaredEvidence<unknown>[] {
  return childReadingsFromFoundation(foundationPositionCells(afterFen));
}

function childReadingsFromFoundation(foundation: ReturnType<typeof foundationPositionCells>): readonly DeclaredEvidence<unknown>[] {
  const afterFen = foundation.fen;
  const position = foundation.legal();
  const connectivity = foundation.connectivity();
  const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: afterFen });
  const screen = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: setup });
  if (screen.kind !== "available") throw new CandidateInvariantFailure("receipt", "Complete child fianchetto screen unavailable");
  const control = foundation.control();
  const future = invokeEvidenceValueRoute("derived.square.reading.future_file_challenge@1", { position });
  const migration = invokeEvidenceValueRoute("derived.square.reading.capture_migration_reach@1", { position });
  if (future.kind !== "available" || migration.kind !== "available") throw new CandidateInvariantFailure("receipt", "Complete child pawn challenges unavailable");
  const candidates = invokeEvidenceValueRoute("derived.structural.reading.outpost_candidate@1", { control, future: future.value });
  if (candidates.kind !== "available") throw new CandidateInvariantFailure("receipt", "Complete child outpost candidates unavailable");
  const occupied = invokeEvidenceValueRoute("derived.structural.reading.occupied_outpost@1", { source: candidates.value });
  if (occupied.kind !== "available") throw new CandidateInvariantFailure("receipt", "Complete child occupied outposts unavailable");
  const readings = Object.freeze(CANDIDATE_CHILD_READING_ROUTES.flatMap((route): readonly DeclaredEvidence<unknown>[] => {
    if (route === "rules.mobility.reading.legal_moves@1") return [position];
    if (route === "rules.structural.reading.pawn_connectivity@1") return [connectivity];
    if (route === "rules.structural.reading.fianchetto_setup@1") return [setup];
    if (route === "rules.structural.reading.fianchetto_knight_screen@1") return [screen.value];
    if (route === "rules.square.reading.control@1") return [control];
    if (route === "derived.square.reading.future_file_challenge@1") return [future.value];
    if (route === "derived.square.reading.capture_migration_reach@1") return [migration.value];
    if (route === "derived.structural.reading.outpost_candidate@1") return [candidates.value];
    if (route === "derived.structural.reading.occupied_outpost@1") return [occupied.value];
    if (route === "derived.structural.reading.pawn_file_group@1") return [foundation.groups()];
    if (route === "derived.activity.reading.file_state@1") return [foundation.files()];
    if (route === "rules.structural.reading.king_opposition@3") return [foundation.opposition()];
    if (route === "rules.structural.reading.backward_pawn@3") return [foundation.backward()];
    const value = invokeEvidenceValueRoute(route, { fen: afterFen });
    return "projection" in value ? [value] : value;
  }));
  // Quiet snapshots must still retain the legal/connectivity objects acquired by this call.
  // Genuine equal-byte snapshots from another invocation cannot stand in for this handoff.
  foundation.values();
  return readings;
}

function candidateFoundationPosition(foundation: ReturnType<typeof foundationPositionCells>, root: DeclaredEvidence<ExactLegalMoveMap>, moveUci: string | null): CandidateFoundationPosition {
  const common = foundation.values();
  const risk = invokeEvidenceValueRoute("rules.tactic.reading.mover_piece_risk@1", { root, position: common[0], moveUci });
  return Object.freeze({ common,
    rays: invokeEvidenceValueRoute("rules.transition.reading.physical_slider_rays@1", { position: common[0] }),
    risk, totals: collectCandidateTotalInputs(risk, foundation.control()),
  });
}

/** Original factory readers validate complete quiet sources, not just emitted event wrappers. */
function assertCandidateFoundationPosition(value: CandidateFoundationPosition, root: DeclaredEvidence<ExactLegalMoveMap>, fen: string, moveUci: string | null): void {
  const common = readFoundationPositionTuple(value.common);
  if (common[0].payload.fen !== fen || moveUci === null && common[0] !== root) throw new TypeError("Candidate foundation position crosses its original root/child");
  const rays = readPhysicalSliderRaysInvocation(value.rays), risk = readMoverPieceRiskInvocation(value.risk);
  if (rays.position !== common[0] || risk.root !== root || risk.position !== common[0] || risk.moveUci !== moveUci) {
    throw new TypeError("Candidate total sources cross their original root/child inputs");
  }
  assertCandidateTotalInputs(value.totals, value.risk);
}

/**
 * The closure guard every retained value passes (§5.3, §8.2, criterion 16). A projection outside
 * the code-derived local closure — including the provider-only `human.maia.candidate_wdl` — is
 * refused even when it is correctly sealed.
 */
export function assertCandidatePacketProjection(value: unknown, family: "events" | "readings"): void {
  if (family === "events") {
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value);
    const key = `${value.projection.id}@${value.projection.version}`;
    if (!EVENT_KEYS.has(key)) throw new TypeError(`Candidate packet refuses event projection outside the local collector closure: ${key}`);
    return;
  }
  assertDeclaredEvidence(value);
  const key = `${value.projection.id}@${value.projection.version}`;
  if (!READING_KEYS.has(key)) throw new TypeError(`Candidate packet refuses reading projection outside the local collector closure: ${key}`);
}

function verifyRetained(events: readonly SemanticEvidenceEvent[], readings: readonly DeclaredEvidence<unknown>[]): void {
  for (const event of events) {
    if (VERIFIED_EVENTS.has(event)) continue;
    assertCandidatePacketProjection(event, "events");
    VERIFIED_EVENTS.add(event);
  }
  for (const reading of readings) {
    if (VERIFIED_READINGS.has(reading)) continue;
    assertCandidatePacketProjection(reading, "readings");
    VERIFIED_READINGS.add(reading);
  }
}

type ParsedRequest = { readonly kind: "ok"; readonly beforeFen: string; readonly member: CandidatePacketScopeMember } | { readonly kind: "failed"; readonly error: CandidatePopulationFailure };

function plainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  return Object.getOwnPropertyNames(value).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor !== undefined && "value" in descriptor && descriptor.enumerable === true;
  });
}

function exactKeys(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  const own = Object.keys(value).sort();
  return own.length === keys.length && [...keys].sort().every((key, index) => own[index] === key);
}

function parseRequest(value: unknown): ParsedRequest {
  if (!plainRecord(value)) return { kind: "failed", error: Object.freeze({ code: "invalid_request", reason: "shape" }) };
  // Ruleset identity is admitted before any FEN parse, key construction or legal enumeration (§4.0).
  if (value.ruleset !== "standard") return { kind: "failed", error: Object.freeze({ code: "unsupported_ruleset", received: value.ruleset === undefined ? "undefined" : String(value.ruleset) }) };
  if (!exactKeys(value, ["beforeFen", "ruleset", "scope"])) return { kind: "failed", error: Object.freeze({ code: "invalid_request", reason: "shape" }) };
  const scope = value.scope;
  if (!plainRecord(scope) || !exactKeys(scope, ["events", "readings"]) || typeof scope.events !== "boolean" || typeof scope.readings !== "boolean" || (!scope.events && !scope.readings)) {
    return { kind: "failed", error: Object.freeze({ code: "invalid_request", reason: "scope" }) };
  }
  if (typeof value.beforeFen !== "string") return { kind: "failed", error: Object.freeze({ code: "invalid_request", reason: "fen_type" }) };
  return { kind: "ok", beforeFen: value.beforeFen, member: memberOf(scope as CandidatePacketScope) };
}

/** The module-private legal compiler: exactly one source call, no second enumerator (§3.1, §4.1). */
function compileLegalPopulation(beforeFen: string): Readonly<{ legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>; legalMoves: readonly ExactLegalMove[] }> {
  const legalMovesInput = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: beforeFen }) as DeclaredEvidence<ExactLegalMoveMap>;
  assertDeclaredEvidence(legalMovesInput);
  // flatMap allocates only the flat container; every member is the authority's own object.
  return Object.freeze({ legalMovesInput, legalMoves: Object.freeze(legalMovesInput.payload.pieces.flatMap((piece) => piece.moves)) });
}

function childFen(beforeFen: string, move: ExactLegalMove): string {
  const position = positionFromFen(beforeFen);
  const parsed = parseUci(move.uci);
  if (parsed === undefined) throw new TypeError(`Exact legal move has invalid UCI ${move.uci}`);
  const playable = normalizeMove(position, parsed);
  if (!position.isLegal(playable)) throw new TypeError(`Exact legal move is illegal at the root: ${move.uci}`);
  position.play(playable);
  return canonicalFen(position);
}

function forkSurvival(tactical: readonly SemanticEvidenceEvent[]): readonly DeclaredEvidence<unknown>[] {
  const doubleAttack = tactical.find((event) => event.projection.id === "rules.tactic.event.double_attack");
  if (doubleAttack === undefined) return EMPTY;
  const breadth = tactical.find((event) => event.projection.id === "rules.tactic.consequence.reply_breadth");
  if (breadth === undefined) throw new TypeError("Fork survival requires the reply-breadth event of the same edge");
  return [invokeEvidenceValueRoute(CANDIDATE_CURRENT_SOURCE_ROUTES.forkSurvival, { doubleAttack: doubleAttack.evidence as DeclaredEvidence<DoubleAttackEvent>, breadth: breadth.evidence as DeclaredEvidence<ReplyBreadth> })];
}

interface CandidateStageFailure { readonly error: unknown }
type CandidateStage = "common" | "foundation" | "events" | "readings";
/** Fixed invocation-local stage memoization, including failure. No caller configures this. */
function retainCandidateStage<T>(failures: Map<CandidateStage, CandidateStageFailure>, stage: CandidateStage, collect: () => T): T {
  const failure = failures.get(stage); if (failure !== undefined) throw failure.error;
  try { return collect(); } catch (error) { failures.set(stage, Object.freeze({ error })); throw error; }
}

/** One private construction graph. Scoped requests retain the same original source cells;
 * the synchronous compiler and service advancement drain these identical finite stages. */
class CandidateCompilation {
  readonly beforeFen: string;
  readonly #rows = new Map<string, CandidateRowCompilation>();
  readonly #failures = new Map<CandidateStage, CandidateStageFailure>();
  #common: FoundationPositionTuple | undefined;
  #rootCells: ReturnType<typeof foundationPositionCells> | undefined;
  #foundation: CandidateFoundationPosition | undefined;

  constructor(readonly legal: ReturnType<typeof compileLegalPopulation>) {
    this.beforeFen = legal.legalMovesInput.payload.fen;
  }
  common(): FoundationPositionTuple {
    return retainCandidateStage(this.#failures, "common", () => {
      this.#rootCells ??= foundationPositionCells(this.beforeFen, this.legal.legalMovesInput);
      return this.#common ??= this.#rootCells.values();
    });
  }
  foundation(): CandidateFoundationPosition {
    return retainCandidateStage(this.#failures, "foundation", () => {
      this.common(); return this.#foundation ??= candidateFoundationPosition(this.#rootCells!, this.legal.legalMovesInput, null);
    });
  }
  failureFor(scope: CandidateAcquisitionScope): CandidateStageFailure | undefined {
    const needsRoot = scope !== "readings", needsFoundation = scope === "foundation" || scope === "events_and_readings";
    const root = needsRoot ? this.#failures.get("common") ?? this.#rootCells?.commonFailure()
      ?? (needsFoundation ? this.#failures.get("foundation") ?? this.#rootCells?.controlFailure() : undefined) : undefined;
    if (root !== undefined) return root;
    for (const row of this.#rows.values()) { const failure = row.failureFor(scope); if (failure !== undefined) return failure; }
    return undefined;
  }
  get commonReady(): boolean { return this.#common !== undefined; }
  get foundationReady(): boolean { return this.#foundation !== undefined; }
  existingRow(move: ExactLegalMove): CandidateRowCompilation | undefined { return this.#rows.get(move.uci); }
  row(move: ExactLegalMove): CandidateRowCompilation {
    let row = this.#rows.get(move.uci);
    if (row === undefined) { row = new CandidateRowCompilation(this, move); this.#rows.set(move.uci, row); }
    return row;
  }
}

/** Fixed root/child source cells, not a caller-configurable collector graph or evidence issuer. */
class CandidateRowCompilation {
  readonly afterFen: string;
  readonly #child: ReturnType<typeof foundationPositionCells>;
  readonly #collection: LocalSemanticCollection;
  readonly #failures = new Map<CandidateStage, CandidateStageFailure>();
  #closure: ReturnType<typeof localSemanticEventClosure> | undefined;
  #readings: readonly DeclaredEvidence<unknown>[] | undefined;
  #foundation: CandidateFoundationPosition | undefined;
  #outcomes: readonly SealedCandidateCollectorOutcome[] | undefined;

  constructor(readonly owner: CandidateCompilation, readonly move: ExactLegalMove) {
    this.afterFen = childFen(owner.beforeFen, move);
    this.#child = foundationPositionCells(this.afterFen);
    this.#collection = new LocalSemanticCollection(owner.beforeFen, move.uci, this.afterFen);
  }
  get eventsReady(): boolean { return this.#closure !== undefined; }
  get readingsReady(): boolean { return this.#readings !== undefined; }
  get foundationReady(): boolean { return this.#foundation !== undefined; }
  common(): FoundationPositionTuple { return this.#child.values(); }
  events(): ReturnType<typeof localSemanticEventClosure> {
    return retainCandidateStage(this.#failures, "events", () => this.#closure ??= this.#collection.collect([this.owner.common(), this.common()]));
  }
  readings(): readonly DeclaredEvidence<unknown>[] {
    return retainCandidateStage(this.#failures, "readings", () => this.#readings ??= this.collectReadings());
  }
  private collectReadings(): readonly DeclaredEvidence<unknown>[] {
    const legalMovesInput = this.owner.legal.legalMovesInput, moveUci = this.move.uci;
    const candidateRole = invokeEvidenceValueRoute(CANDIDATE_CURRENT_SOURCE_ROUTES.candidateRole, { position: legalMovesInput, moveUci });
    if (candidateRole.kind !== "available") throw new CandidateInvariantFailure("receipt", "Exact candidate role unavailable");
    const centre = invokeEvidenceValueRoute(CANDIDATE_CURRENT_SOURCE_ROUTES.extendedCenterDestination, { source: candidateRole.value });
    if (centre.kind !== "available") throw new CandidateInvariantFailure("receipt", "Exact candidate centre fact unavailable");
    const exchange = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: this.owner.beforeFen, captureUci: moveUci });
    const tactical = this.#closure === undefined ? this.#collection.tactical() : this.#closure.events;
    return this.#readings = Object.freeze([
      ...childReadingsFromFoundation(this.#child), candidateRole.value, ...centre.value, ...exchange, ...forkSurvival(tactical),
    ]);
  }
  foundation(): CandidateFoundationPosition {
    return retainCandidateStage(this.#failures, "foundation", () => this.#foundation ??= candidateFoundationPosition(this.#child, this.owner.legal.legalMovesInput, this.move.uci));
  }
  failureFor(scope: CandidateAcquisitionScope): CandidateStageFailure | undefined {
    const foundation = scope === "foundation" || scope === "events_and_readings", events = scope === "events" || scope === "events_and_readings";
    const readings = scope === "readings" || scope === "events_and_readings";
    return this.#child.commonFailure()
      ?? (foundation || readings ? this.#child.controlFailure() : undefined)
      ?? (foundation ? this.#failures.get("foundation") : undefined)
      ?? (events ? this.#failures.get("events") ?? this.#collection.collectionFailure : undefined)
      ?? (events || readings ? this.#collection.tacticalFailure : undefined)
      ?? (readings ? this.#failures.get("readings") : undefined);
  }
  outcomes(): readonly SealedCandidateCollectorOutcome[] {
    if (this.#closure === undefined) throw new TypeError("Collector outcomes require a completed original event group");
    return this.#outcomes ??= Object.freeze(localSemanticCollectorOutcomes(this.#closure).map(source => {
      const outcome: SealedCandidateCollectorOutcome = Object.freeze({ moveUci: this.move.uci, projection: source.projection, result: source.result });
      OUTCOMES.add(outcome); return outcome;
    }));
  }
}

function compileRow(row: CandidateRowCompilation, member: CandidatePacketScopeMember): CompiledRowValues {
  const wantsEvents = member !== "readings", wantsReadings = member !== "events";
  // Scope controls retained output; readings still acquire their private tactical dependency.
  const closure = wantsEvents ? row.events() : undefined;
  const events = closure?.events ?? EMPTY;
  const readings = wantsReadings ? row.readings() : EMPTY;
  const foundation = wantsEvents && wantsReadings ? row.foundation() : undefined;
  const abstentions: readonly CandidatePacketAbstention[] = closure === undefined || closure.abstentions.length === 0 ? EMPTY : closure.abstentions;
  const outcomes = closure === undefined ? EMPTY : row.outcomes();
  return Object.freeze({ afterFen: row.afterFen, events, readings, abstentions, outcomes,
    ...(wantsEvents ? { common: row.common() } : {}), ...(foundation === undefined ? {} : { foundation }) });
}

interface MintInput {
  readonly beforeFen: string;
  readonly member: CandidatePacketScopeMember;
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
  /** The exact flat container `compileLegalPopulation` returned. */
  readonly authorityLegalMoves: readonly ExactLegalMove[];
  /** The list the packet is about to carry. */
  readonly legalMoves: readonly ExactLegalMove[];
  readonly rows: readonly CandidateEventRow[];
  /** The values the compiler itself produced, keyed by move identity. */
  readonly compiled: ReadonlyMap<string, CompiledRowValues>;
  readonly terminal: CandidateEventPopulation["terminal"];
  readonly foundationRoot?: CandidateFoundationPosition;
  readonly commonRoot?: FoundationPositionTuple;
  readonly originalFoundation?: CandidateFoundationReceipt;
}

function assertCommonEventInputs(root: FoundationPositionTuple, child: FoundationPositionTuple, events: readonly SemanticEvidenceEvent[]): void {
  readFoundationPositionTuple(root); readFoundationPositionTuple(child);
  for (const event of events) {
    const key = `${event.projection.id}@${event.projection.version}`;
    let expected: readonly DeclaredEvidence<unknown>[];
    switch (key) {
      case "rules.structural.event.king_opposition@2": expected = [root[2], child[2]]; break;
      case "rules.structural.event.backward_pawn@2": expected = [root[3], child[3]]; break;
      case "derived.structural.event.pawn_file_group@1": expected = [root[4], child[4]]; break;
      case "rules.transition.event.slider_ray@2": expected = []; break;
      case "derived.activity.event.file_state@1": expected = [root[5], child[5]]; break;
      case "rules.structural.event.pawn_islands@2": expected = [root[1], child[1]]; break;
      case "derived.activity.event.file_access_revealed@1": {
        const invocation = readFoundationEventInvocation(event.evidence);
        const change = invocation.inputs[0];
        if (invocation.inputs.length !== 1 || !events.some(value => value.evidence === change && value.projection.id === "derived.activity.event.file_state" && value.projection.version === 1)) {
          throw new CandidateInvariantFailure("receipt", "file access lost its original collected file-change input");
        }
        expected = [change!]; break;
      }
      default: continue;
    }
    const actual = readFoundationEventInvocation(event.evidence).inputs;
    if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
      throw new CandidateInvariantFailure("receipt", "foundation event differs from the owner's original root/child sources");
    }
  }
}

/** The only receipt constructor (§3.1). Admission is by reference identity, never by seal or digest (§5.2). */
function compileCandidatePopulationReceipt(input: MintInput): CandidatePopulationReceipt {
  const { rows, legalMoves } = input;
  if (input.commonRoot !== undefined) {
    if (readFoundationPositionTuple(input.commonRoot)[0] !== input.legalMovesInput) throw new CandidateInvariantFailure("receipt", "common frame lost its original root authority");
  } else if (input.member !== "readings") throw new CandidateInvariantFailure("receipt", "events require original common sources even when quiet");
  if ((rows.length === 0) !== (input.terminal !== undefined)) throw new CandidateInvariantFailure("terminal", "an empty population is legal exactly for checkmate or stalemate");
  const legalUcis = legalMoves.map((move) => move.uci);
  const legalSet = new Set(legalUcis);
  const rowSet = new Set(rows.map((row) => row.moveUci));
  if (legalSet.size !== legalUcis.length || rowSet.size !== rows.length || rows.length !== legalMoves.length || rows.some((row) => !legalSet.has(row.moveUci))) {
    throw new CandidateInvariantFailure("legal_set", "candidate move identities are not set-equal to the legal authority");
  }
  for (const [index, row] of rows.entries()) {
    if (row.moveUci !== legalMoves[index]!.uci) throw new CandidateInvariantFailure("legal_set", "candidate order differs from the original legal authority");
    if (row.afterFen !== input.compiled.get(row.moveUci)?.afterFen) throw new CandidateInvariantFailure("child_fen", `${row.moveUci} does not carry the compiler's derived child`);
  }
  if (legalMoves !== input.authorityLegalMoves || !Object.isFrozen(legalMoves)) throw new CandidateInvariantFailure("receipt", "legal moves are not the flat container of the sealed exact map");
  const authorityMembers = new Set<ExactLegalMove>(input.legalMovesInput.payload.pieces.flatMap((piece) => piece.moves));
  if (legalMoves.some((move) => !authorityMembers.has(move))) throw new CandidateInvariantFailure("receipt", "a legal move is not the authority's own object");
  const manifestDigest = PRIMARY_EVIDENCE_MANIFEST.digest;
  if (input.member === "events_and_readings" && input.foundationRoot === undefined) throw new CandidateInvariantFailure("receipt", "wide population lost its original root sources");
  if (input.foundationRoot !== undefined) assertCandidateFoundationPosition(input.foundationRoot, input.legalMovesInput, input.beforeFen, null);
  if (input.member === "events_and_readings" && input.originalFoundation === undefined)
    throw new CandidateInvariantFailure("receipt", "Wide packet lost its original foundation receipt");
  if (input.originalFoundation !== undefined) {
    const original = readCandidateOutcomeSources(input.originalFoundation);
    if (original.root !== input.foundationRoot || original.root.common[0] !== input.legalMovesInput
      || original.candidates.length !== legalMoves.length || original.candidates.some((candidate, index) =>
        candidate.move !== legalMoves[index] || candidate.position !== input.compiled.get(candidate.move.uci)?.foundation))
      throw new CandidateInvariantFailure("receipt", "Packet crossed its original foundation receipt");
  }
  const candidateInputs = rows.map((row) => {
    const compiled = input.compiled.get(row.moveUci)!;
    if (row.events !== compiled.events || row.readings !== compiled.readings || row.abstentions !== compiled.abstentions) {
      throw new CandidateInvariantFailure("receipt", `${row.moveUci} retains values the compiler did not produce`);
    }
    if (input.member === "readings" && row.events.length > 0) throw new CandidateInvariantFailure("receipt", "a readings-only packet retained events");
    if (input.member === "events" && row.readings.length > 0) throw new CandidateInvariantFailure("receipt", "an events-only packet retained readings");
    for (const abstention of row.abstentions) {
      const source = compiled.outcomes.filter((outcome) => OUTCOMES.has(outcome) && outcome.moveUci === row.moveUci && outcome.projection === abstention.projection && outcome.result.reason === abstention.reason);
      if (source.length !== 1) throw new CandidateInvariantFailure("receipt", `${row.moveUci} publishes an abstention without exactly one sealed outcome`);
    }
    verifyRetained(row.events, row.readings);
    if (input.commonRoot !== undefined) {
      if (compiled.common === undefined || compiled.common[0].payload.fen !== row.afterFen) throw new CandidateInvariantFailure("receipt", "candidate lost its original child common sources");
      assertCommonEventInputs(input.commonRoot, compiled.common, row.events);
    }
    if (input.foundationRoot !== undefined) {
      if (compiled.foundation === undefined) throw new CandidateInvariantFailure("receipt", "candidate lost its complete original position sources");
      assertCandidateFoundationPosition(compiled.foundation, input.legalMovesInput, row.afterFen, row.moveUci);
      if (input.member !== "events") for (const original of compiled.foundation.common) {
        if (row.readings.filter(value => value.projection.id === original.projection.id && value.projection.version === original.projection.version).length !== 1
          || !row.readings.includes(original)) throw new CandidateInvariantFailure("receipt", "candidate readings replaced an original foundation source");
      }
      if (input.member !== "events" && !row.readings.includes(compiled.foundation.totals.control)) throw new CandidateInvariantFailure("receipt", "candidate control replaced its original total source");
    }
    return Object.freeze({ moveUci: row.moveUci, events: row.events, readings: row.readings, collectorOutcomes: compiled.outcomes });
  });
  const frozenRows = Object.freeze([...rows]);
  const packet: CandidateEventPopulation = Object.freeze({
    id: candidatePacketId(packetIdentity(input.beforeFen, input.member)),
    beforeFen: input.beforeFen,
    ruleset: "standard" as const,
    scope: scopeOf(input.member),
    legalConvention: CANDIDATE_PACKET_LEGAL_CONVENTION,
    moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
    manifestDigest,
    compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
    legalMoves,
    candidates: frozenRows,
    ...(input.terminal === undefined ? {} : { terminal: input.terminal }),
  });
  const receipt: CandidatePopulationReceipt = Object.freeze({
    packet,
    selectedMember: input.member,
    manifest: PRIMARY_EVIDENCE_MANIFEST,
    legalMovesInput: input.legalMovesInput,
    candidateInputs: Object.freeze(candidateInputs),
  });
  CANDIDATE_POPULATION_RECEIPTS.set(receipt, Object.freeze({
    manifest: PRIMARY_EVIDENCE_MANIFEST,
    packet,
    ...(input.originalFoundation === undefined ? {} : { originalFoundation: input.originalFoundation }),
    legalMovesInput: input.legalMovesInput,
    candidateInputs: Object.freeze(frozenRows.map((row) => Object.freeze({ row, events: row.events, readings: row.readings }))),
    ...(input.commonRoot === undefined ? {} : { common: Object.freeze({ root: input.commonRoot,
      candidates: Object.freeze(frozenRows.map((row, index) => Object.freeze({ row, move: legalMoves[index]!, common: input.compiled.get(row.moveUci)!.common! }))),
    }) }),
    ...(input.foundationRoot === undefined ? {} : { foundation: Object.freeze({ root: input.foundationRoot,
      candidates: Object.freeze(frozenRows.map((row, index) => Object.freeze({ row, move: legalMoves[index]!, position: input.compiled.get(row.moveUci)!.foundation! }))),
    }) }),
  }));
  return receipt;
}

/** Contract-test seam: it can substitute the legal list or rows, and every substitution can only fail. */
export interface CandidatePopulationContractTamper {
  readonly legalMoves?: (authority: readonly ExactLegalMove[]) => readonly ExactLegalMove[];
  readonly rows?: (rows: readonly CandidateEventRow[]) => readonly CandidateEventRow[];
}

function constructionState(value: CandidateConstruction): CandidateConstructionState {
  const state = CONSTRUCTIONS.get(value);
  if (state === undefined) throw new TypeError("Candidate construction requires its original process-local token");
  return state;
}
function acquisitionScope(value: CandidateAcquisitionScope): void {
  if (value !== "foundation" && value !== "events" && value !== "readings" && value !== "events_and_readings")
    throw new TypeError("Unknown candidate acquisition scope");
}

/** No producer runs at begin. The owning service counts this pending owner before advancement. */
export function beginCandidateConstruction(request: Readonly<{ beforeFen: string; ruleset: "standard" }>):
  | { readonly kind: "started"; readonly construction: CandidateConstruction }
  | { readonly kind: "failed"; readonly error: CandidatePopulationFailure } {
  if (!plainRecord(request)) return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invalid_request", reason: "shape" }) });
  if (request.ruleset !== "standard") return Object.freeze({ kind: "failed", error: Object.freeze({ code: "unsupported_ruleset", received: String(request.ruleset) }) });
  if (!exactKeys(request, ["beforeFen", "ruleset"])) return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invalid_request", reason: "shape" }) });
  if (typeof request.beforeFen !== "string") return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invalid_request", reason: "fen_type" }) });
  const construction: CandidateConstruction = Object.freeze({ kind: "candidate_construction" });
  CONSTRUCTIONS.set(construction, { beforeFen: request.beforeFen, failures: new Map(), receipts: new Map() });
  return Object.freeze({ kind: "started", construction });
}

function readyOwner(owner: CandidateCompilation, scope: CandidateAcquisitionScope): boolean {
  const foundation = scope === "foundation" || scope === "events_and_readings";
  const events = scope === "events" || scope === "events_and_readings";
  const readings = scope === "readings" || scope === "events_and_readings";
  return (!foundation || owner.foundationReady) && (!events || owner.commonReady)
    && owner.legal.legalMoves.every(move => {
      const row = owner.existingRow(move);
      return row !== undefined && (!foundation || row.foundationReady) && (!events || row.eventsReady) && (!readings || row.readingsReady);
    });
}

function sealFoundation(state: CandidateConstructionState): CandidateFoundationReceipt {
  const existing = state.receipts.get("foundation");
  if (existing !== undefined) return existing as CandidateFoundationReceipt;
  const owner = state.owner!;
  if (!readyOwner(owner, "foundation")) throw new TypeError("Incomplete candidate foundation cannot be sealed");
  const legal = owner.legal, root = owner.foundation();
  assertCandidateFoundationPosition(root, legal.legalMovesInput, owner.beforeFen, null);
  const candidates = Object.freeze(legal.legalMoves.map(move => {
    const child = owner.existingRow(move)!;
    const position = child.foundation();
    assertCandidateFoundationPosition(position, legal.legalMovesInput, child.afterFen, move.uci);
    return Object.freeze({ move, row: Object.freeze({ moveUci: move.uci, afterFen: child.afterFen }), position });
  }));
  const receipt: CandidateFoundationReceipt = Object.freeze({ kind: "foundation", beforeFen: owner.beforeFen,
    compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
    id: evidenceDigest({ ...packetIdentity(owner.beforeFen, "events_and_readings"), scope: "foundation" }), legalMovesInput: legal.legalMovesInput });
  FOUNDATION_RECEIPTS.set(receipt, Object.freeze({ root, candidates }));
  state.receipts.set("foundation", receipt); return receipt;
}

function sealPacket(state: CandidateConstructionState, member: CandidatePacketScopeMember, tamper?: CandidatePopulationContractTamper): CandidatePopulationCompileResult<CandidatePacketScope> {
  const owner = state.owner!, legal = owner.legal, beforeFen = owner.beforeFen;
  if (!readyOwner(owner, member)) throw new TypeError("Incomplete candidate packet cannot be sealed");
  const originalRoot = member === "readings" ? undefined : owner.common();
  const foundationRoot = member === "events_and_readings" ? owner.foundation() : undefined;
  const position = positionFromFen(beforeFen);
  const terminal = position.isCheckmate() ? Object.freeze({ reason: "checkmate" as const }) : position.isStalemate() ? Object.freeze({ reason: "stalemate" as const }) : undefined;
  const legalMoves = tamper?.legalMoves === undefined ? legal.legalMoves : tamper.legalMoves(legal.legalMoves);
  const compiled = new Map<string, CompiledRowValues>();
  for (const move of legalMoves) {
    const row = owner.existingRow(move);
    if (row === undefined) return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invariant_failed", invariant: "legal_set" }) });
    if (!compiled.has(move.uci)) compiled.set(move.uci, compileRow(row, member));
  }
  const built: readonly CandidateEventRow[] = legalMoves.map(move => {
    const values = compiled.get(move.uci)!;
    return Object.freeze({ moveUci: move.uci, afterFen: values.afterFen, events: values.events, readings: values.readings, abstentions: values.abstentions });
  });
  const rows = tamper?.rows === undefined ? built : tamper.rows(built);
  if (rows.length === 0 && terminal === undefined) return Object.freeze({ kind: "failed", error: Object.freeze({ code: "non_terminal_empty", beforeFen }) });
  try {
    return Object.freeze({ kind: "ready", receipt: compileCandidatePopulationReceipt({ beforeFen, member, legalMovesInput: legal.legalMovesInput,
      authorityLegalMoves: legal.legalMoves, legalMoves, rows, compiled, terminal,
      ...(originalRoot === undefined ? {} : { commonRoot: originalRoot }),
      ...(foundationRoot === undefined ? {} : { foundationRoot, originalFoundation: sealFoundation(state) }) }) });
  } catch (error) {
    if (error instanceof CandidateInvariantFailure) return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invariant_failed", invariant: error.invariant }) });
    throw error;
  }
}

/** Validate/seal completed data only. In particular this NEVER drains an uncomputed full group. */
export function readCandidateConstruction<S extends CandidateAcquisitionScope>(construction: CandidateConstruction, scope: S): CandidateAcquisitionResult<S> {
  acquisitionScope(scope); const state = constructionState(construction), failure = state.legalFailure ?? state.failures.get(scope);
  if (failure !== undefined) return Object.freeze({ kind: "failed", error: failure });
  const shared = state.owner?.failureFor(scope);
  if (shared !== undefined) {
    const error: CandidatePopulationFailure = Object.freeze({ code: "invariant_failed", invariant: shared.error instanceof CandidateInvariantFailure ? shared.error.invariant : "receipt" });
    state.failures.set(scope, error); return Object.freeze({ kind: "failed", error });
  }
  const saved = state.receipts.get(scope);
  if (saved !== undefined) return Object.freeze({ kind: "ready", receipt: saved as CandidateAcquisitionReceipt<S> });
  if (state.owner === undefined || !readyOwner(state.owner, scope)) return Object.freeze({ kind: "pending" });
  try {
    if (scope === "foundation") return Object.freeze({ kind: "ready", receipt: sealFoundation(state) as CandidateAcquisitionReceipt<S> });
    const result = sealPacket(state, scope);
    if (result.kind === "failed") { state.failures.set(scope, result.error); return result; }
    state.receipts.set(scope, result.receipt);
    return Object.freeze({ kind: "ready", receipt: result.receipt as CandidateAcquisitionReceipt<S> });
  } catch (error) {
    const failed: CandidatePopulationFailure = Object.freeze({ code: "invariant_failed", invariant: error instanceof CandidateInvariantFailure ? error.invariant : "receipt" });
    state.failures.set(scope, failed); return Object.freeze({ kind: "failed", error: failed });
  }
}

/** One finite root/child collection step. Callers can yield and reauthorize between EVERY step. */
export function advanceCandidateConstruction<S extends CandidateAcquisitionScope>(construction: CandidateConstruction, scope: S): CandidateAcquisitionResult<S> {
  acquisitionScope(scope); const state = constructionState(construction);
  const current = readCandidateConstruction(construction, scope); if (current.kind !== "pending") return current;
  if (state.owner === undefined) {
    try { state.owner = new CandidateCompilation(compileLegalPopulation(state.beforeFen)); }
    catch (error) { state.legalFailure = Object.freeze({ code: "invalid_fen", message: error instanceof Error ? error.message : String(error) }); }
    return readCandidateConstruction(construction, scope);
  }
  const owner = state.owner;
  try {
    if ((scope === "foundation" || scope === "events_and_readings") && !owner.foundationReady) owner.foundation();
    else if (scope === "events" && !owner.commonReady) owner.common();
    else {
      for (const move of owner.legal.legalMoves) {
        const row = owner.row(move);
        if ((scope === "events" || scope === "events_and_readings") && !row.eventsReady) { row.events(); break; }
        if ((scope === "readings" || scope === "events_and_readings") && !row.readingsReady) { row.readings(); break; }
        if ((scope === "foundation" || scope === "events_and_readings") && !row.foundationReady) { row.foundation(); break; }
      }
    }
  } catch (error) {
    state.failures.set(scope, Object.freeze({ code: "invariant_failed", invariant: error instanceof CandidateInvariantFailure ? error.invariant : "receipt" }));
  }
  return readCandidateConstruction(construction, scope);
}

export function compileCandidateFoundation(request: Readonly<{ beforeFen: string; ruleset: "standard" }>): Exclude<CandidateAcquisitionResult<"foundation">, { readonly kind: "pending" }> {
  const begun = beginCandidateConstruction(request); if (begun.kind === "failed") return begun;
  for (;;) { const result = advanceCandidateConstruction(begun.construction, "foundation"); if (result.kind !== "pending") return result; }
}

function compileInternal(request: unknown, tamper?: CandidatePopulationContractTamper): CandidatePopulationCompileResult<CandidatePacketScope> {
  const parsed = parseRequest(request); if (parsed.kind === "failed") return Object.freeze({ kind: "failed", error: parsed.error });
  const begun = beginCandidateConstruction({ beforeFen: parsed.beforeFen, ruleset: "standard" }); if (begun.kind === "failed") return begun;
  for (;;) {
    const result = advanceCandidateConstruction(begun.construction, parsed.member);
    if (result.kind === "pending") continue;
    if (result.kind === "failed" || tamper === undefined) return result;
    return sealPacket(constructionState(begun.construction), parsed.member, tamper);
  }
}

/**
 * Compile the complete candidate population for one root. The caller supplies exactly
 * `{ beforeFen, ruleset: "standard", scope }`; legal moves, children, events and readings are all
 * derived (§3.2). This is the compiler the successor service (rfc/candidate-population-service.md)
 * wraps; it keeps no cache and no module state beyond the receipt authority.
 */
export function compileCandidatePopulation<S extends CandidatePacketScope>(request: CandidatePopulationRequest<S>): CandidatePopulationCompileResult<S> {
  return compileInternal(request) as CandidatePopulationCompileResult<S>;
}

/** Not exported from the package barrel. Every tamper is a must-fail fixture (criteria 2, 3, 36). */
export function compileCandidatePopulationForContract(request: unknown, tamper: CandidatePopulationContractTamper): CandidatePopulationCompileResult<CandidatePacketScope> {
  return compileInternal(request, tamper);
}

export function assertCandidatePopulationReceipt(value: unknown): asserts value is CandidatePopulationReceipt {
  const references = typeof value === "object" && value !== null ? CANDIDATE_POPULATION_RECEIPTS.get(value) : undefined;
  if (references === undefined) throw new TypeError("Candidate population receipt was not minted by the packet compiler in this process");
  const receipt = value as CandidatePopulationReceipt;
  const packet = receipt.packet;
  if (receipt.manifest !== PRIMARY_EVIDENCE_MANIFEST || references.manifest !== PRIMARY_EVIDENCE_MANIFEST || packet !== references.packet || packet.manifestDigest !== PRIMARY_EVIDENCE_MANIFEST.digest) {
    throw new TypeError("Candidate population receipt does not point at its recorded manifest and packet");
  }
  if (receipt.legalMovesInput !== references.legalMovesInput || receipt.selectedMember !== memberOf(packet.scope) || packet.scope !== scopeOf(receipt.selectedMember)) {
    throw new TypeError("Candidate population receipt legal input or selected member is crossed");
  }
  if (packet.id !== candidatePacketId(packetIdentity(packet.beforeFen, receipt.selectedMember))) throw new TypeError("Candidate population packet id does not identify its facts");
  if (packet.candidates.length !== references.candidateInputs.length || receipt.candidateInputs.length !== references.candidateInputs.length) throw new TypeError("Candidate population receipt lost a retained candidate");
  if (references.common !== undefined) {
    if (references.common.root[0] !== receipt.legalMovesInput || references.common.candidates.length !== packet.candidates.length) throw new TypeError("Candidate receipt lost original common source membership");
  } else if (receipt.selectedMember !== "readings") throw new TypeError("Event candidate receipt lost original common sources");
  if (references.foundation !== undefined) {
    // Full source validation ran at the sole mint. The private graph and all nested evidence
    // are immutable originals; receipt reads compare membership without rehashing every board.
    if (references.foundation.root.common[0] !== receipt.legalMovesInput) throw new TypeError("Candidate source frame lost its original root");
    if (references.foundation.candidates.length !== packet.candidates.length) throw new TypeError("Candidate receipt lost an original source position");
  } else if (receipt.selectedMember === "events_and_readings") throw new TypeError("Wide candidate receipt lost its original source frame");
  for (const [index, recorded] of references.candidateInputs.entries()) {
    const row = packet.candidates[index];
    const input = receipt.candidateInputs[index];
    if (row !== recorded.row || row.events !== recorded.events || row.readings !== recorded.readings || input === undefined || input.moveUci !== row.moveUci || input.events !== recorded.events || input.readings !== recorded.readings) {
      throw new TypeError("Candidate population receipt does not retain its recorded row references");
    }
    const original = references.foundation?.candidates[index];
    const common = references.common?.candidates[index];
    if (common !== undefined && (common.row !== row || common.move !== packet.legalMoves[index] || common.common[0].payload.fen !== row.afterFen)) throw new TypeError("Candidate common sources cross their original row/move");
    if (original !== undefined) {
      if (original.row !== row || original.move !== packet.legalMoves[index] || original.move.uci !== row.moveUci) throw new TypeError("Candidate source frame crosses its original row/move membership");
      if (original.position.common[0].payload.fen !== row.afterFen) throw new TypeError("Candidate source frame crosses its exact child");
      if (receipt.selectedMember !== "events" && original.position.common.some(source => !row.readings.includes(source))) throw new TypeError("Candidate readings lost their original source frame");
      if (receipt.selectedMember !== "events" && !row.readings.includes(original.position.totals.control)) throw new TypeError("Candidate readings lost original square control");
    }
  }
}

/** Package-internal nonminting reader. Only an original WIDE receipt owns complete states.
 * Narrowing retains the private references for identity, but does not grant wide selection. */
export function readCandidateFoundationSources(receipt: CandidatePopulationReceipt<CandidateWideScope>): CandidateFoundationSources {
  assertCandidatePopulationReceipt(receipt);
  if (receipt.selectedMember !== "events_and_readings") throw new TypeError("Subject outcomes require the original wide candidate receipt");
  const foundation = CANDIDATE_POPULATION_RECEIPTS.get(receipt)!.foundation;
  if (foundation === undefined) throw new TypeError("Wide candidate receipt lacks complete original source positions");
  return foundation;
}

/** Original complete core sources only. Narrow packets and unowned JSON still grant nothing. */
export function readCandidateOutcomeSources(receipt: CandidateOutcomeReceipt): CandidateOutcomeSources {
  if (FOUNDATION_RECEIPTS.has(receipt as CandidateFoundationReceipt)) {
    const original = receipt as CandidateFoundationReceipt, frame = FOUNDATION_RECEIPTS.get(original)!;
    if (original.compilerVersion !== CANDIDATE_PACKET_COMPILER_VERSION || frame.root.common[0] !== original.legalMovesInput
      || original.beforeFen !== original.legalMovesInput.payload.fen) throw new TypeError("Foundation receipt lost its original source root");
    return frame;
  }
  assertCandidatePopulationReceipt(receipt);
  if (receipt.selectedMember !== "events_and_readings") throw new TypeError("Outcomes require an original foundation or wide receipt");
  const original = CANDIDATE_POPULATION_RECEIPTS.get(receipt)!.originalFoundation;
  if (original === undefined) throw new TypeError("Wide receipt lost its original foundation authority");
  const frame = readCandidateOutcomeSources(original), full = CANDIDATE_POPULATION_RECEIPTS.get(receipt)!.foundation;
  if (full === undefined || frame.root !== full.root || frame.root.common[0] !== receipt.legalMovesInput
    || frame.candidates.length !== full.candidates.length || frame.candidates.some((candidate, index) =>
      candidate.move !== full.candidates[index]!.move || candidate.position !== full.candidates[index]!.position))
    throw new TypeError("Wide packet crosses its original foundation authority");
  return frame;
}
export function candidateOutcomeFoundationId(receipt: CandidateOutcomeReceipt): string {
  readCandidateOutcomeSources(receipt);
  return FOUNDATION_RECEIPTS.has(receipt as CandidateFoundationReceipt) ? (receipt as CandidateFoundationReceipt).id
    : CANDIDATE_POPULATION_RECEIPTS.get(receipt as CandidatePopulationReceipt)!.originalFoundation!.id;
}
export function candidateOutcomePlayedRow(receipt: CandidateOutcomeReceipt, moveUci: string): CandidateOutcomeSources["candidates"][number]["row"] {
  const frame = readCandidateOutcomeSources(receipt), row = frame.candidates.find(candidate => candidate.move.uci === moveUci);
  if (row === undefined) throw new CandidatePacketMoveError(String(moveUci), receipt.legalMovesInput.payload.fen);
  return row.row;
}
export function isCandidateFoundationReceipt(value: CandidateOutcomeReceipt): value is CandidateFoundationReceipt {
  return FOUNDATION_RECEIPTS.has(value as CandidateFoundationReceipt);
}

/** Internal membership reader, not a way to grant a narrow receipt complete avoidance state. */
export function readCandidateCommonSources(receipt: CandidatePopulationReceipt): CandidateCommonSources {
  assertCandidatePopulationReceipt(receipt);
  const common = CANDIDATE_POPULATION_RECEIPTS.get(receipt)!.common;
  if (common === undefined) throw new TypeError("Candidate receipt has no original common event sources");
  return common;
}

const PROJECTION_ORDER: Readonly<Record<CandidatePacketScopeMember, readonly CandidatePacketScopeMember[]>> = Object.freeze({
  events_and_readings: Object.freeze(["events_and_readings", "events", "readings"] as const),
  events: Object.freeze(["events"] as const),
  readings: Object.freeze(["readings"] as const),
});

/**
 * Wide→narrow projection (§3.4): asserts the source, checks the literal partial order, performs no
 * chess work, retains the same legal/event/reading references permitted by the target and mints a
 * distinct receipt through the one private constructor.
 */
export function projectCandidatePopulationReceipt<S extends CandidatePacketScope, T extends ProjectableCandidateScope<S>>(receipt: CandidatePopulationReceipt<S>, scope: T): CandidatePopulationProjectionResult<T> {
  assertCandidatePopulationReceipt(receipt);
  const source = receipt.selectedMember;
  const parsed = parseRequest({ beforeFen: receipt.packet.beforeFen, ruleset: "standard", scope });
  if (parsed.kind === "failed") throw new TypeError("Candidate packet projection target is not one of the three closed scopes");
  const target = parsed.member;
  if (!PROJECTION_ORDER[source].includes(target)) {
    return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invalid_scope_projection", source: scopeOf(source), target: scopeOf(target) }) });
  }
  const recorded = CANDIDATE_POPULATION_RECEIPTS.get(receipt)!;
  const compiled = new Map<string, CompiledRowValues>();
  const rows = recorded.candidateInputs.map(({ row }, index) => {
    const outcomes = receipt.candidateInputs[index]!.collectorOutcomes;
    const keepEvents = target !== "readings";
    const values: CompiledRowValues = Object.freeze({
      afterFen: row.afterFen,
      events: keepEvents ? row.events : EMPTY,
      readings: target !== "events" ? row.readings : EMPTY,
      abstentions: keepEvents ? row.abstentions : EMPTY,
      outcomes: keepEvents ? outcomes : EMPTY,
      ...(recorded.common === undefined ? {} : { common: recorded.common.candidates[index]!.common }),
      ...(recorded.foundation === undefined ? {} : { foundation: recorded.foundation.candidates[index]!.position }),
    });
    compiled.set(row.moveUci, values);
    return Object.freeze({ moveUci: row.moveUci, afterFen: values.afterFen, events: values.events, readings: values.readings, abstentions: values.abstentions });
  });
  const minted = compileCandidatePopulationReceipt({
    beforeFen: receipt.packet.beforeFen,
    member: target,
    legalMovesInput: receipt.legalMovesInput,
    authorityLegalMoves: receipt.packet.legalMoves,
    legalMoves: receipt.packet.legalMoves,
    rows,
    compiled,
    terminal: receipt.packet.terminal,
    ...(recorded.common === undefined ? {} : { commonRoot: recorded.common.root }),
    ...(recorded.foundation === undefined ? {} : { foundationRoot: recorded.foundation.root }),
    ...(recorded.originalFoundation === undefined ? {} : { originalFoundation: recorded.originalFoundation }),
  });
  return Object.freeze({ kind: "ready", receipt: minted as CandidatePopulationReceipt<T> });
}

/** Review's/the bot's played-row reader (§4.3, §7.3). Exact `MOVE_IDENTITY_CONVENTION` lookup, no normalisation. */
export function candidatePlayedRow(receipt: CandidatePopulationReceipt, playedUci: string): CandidateEventRow {
  assertCandidatePopulationReceipt(receipt);
  const row = typeof playedUci === "string" ? receipt.packet.candidates.find((candidate) => candidate.moveUci === playedUci) : undefined;
  if (row === undefined) throw new CandidatePacketMoveError(String(playedUci), receipt.packet.beforeFen);
  return row;
}

/** The literal alternative denominator: every candidate except the played one, computed from the packet (§4.3). */
export function candidateAlternatives(receipt: CandidatePopulationReceipt, playedUci: string): readonly CandidateEventRow[] {
  const played = candidatePlayedRow(receipt, playedUci);
  return Object.freeze(receipt.packet.candidates.filter((row) => row !== played));
}

/**
 * The packet's own admission check (§5.2, criterion 8): an event is admitted only if it IS (`===`)
 * a value this receipt's compiler retained. A byte-identical, correctly sealed rebuild is refused.
 */
export function assertCandidatePacketEvent(receipt: CandidatePopulationReceipt, event: unknown): CandidateEventRow {
  assertCandidatePopulationReceipt(receipt);
  const owner = receipt.packet.candidates.find((row) => row.events.includes(event as SemanticEvidenceEvent));
  if (owner === undefined) throw new TypeError("Event is not a value this candidate packet compiled");
  return owner;
}
