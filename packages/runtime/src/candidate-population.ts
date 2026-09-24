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
import { canonicalFen, positionFromFen } from "./chess.js";
import {
  CANDIDATE_COLLECTOR_PROJECTION_KEYS,
  CANDIDATE_PACKET_ABSTENTION_REASONS,
} from "./candidate-population-projections.generated.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceDigest, type DeclaredEvidence } from "./evidence-contract.js";
import {
  createRulesMobilityReadingLegalMovesV1Evidence,
  declareBackRankEvidence,
  declareCandidateMajorityEvidence,
  declareCastlingLegalityEvidence,
  declareCastlingRightsEvidence,
  declareDevelopmentReadingEvidence,
  declareDiscoveredLatencyEvidence,
  declareForkSurvivalEvidence,
  declareKingZoneReadingEvidence,
  declareLegalExchangeEvidence,
  declareLoosePieceEvidence,
  declareMateInOneEvidence,
  declareMaterialRoleReadingEvidence,
  declareMobilityReadingEvidence,
  declarePawnConnectivityEvidence,
  declarePawnContactsEvidence,
  declarePromotionPressureEvidence,
  declareRayClassificationEvidence,
  declareRookOnSeventhEvidence,
  declareSpaceEvidence,
  declareSquareControlReadingEvidence,
  declareThreatEvidence,
  declareTrappedPieceEvidence,
} from "./evidence-source-adapters.js";
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
  tacticalSemanticEvents,
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
export const CANDIDATE_PACKET_COMPILER_VERSION = 1 as const;
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
/** The twenty child readings plus legal exchange and fork survival (§5.3, criterion 9). */
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
 * The twenty per-child readings, moved from the server-private `childReadings` so one runtime
 * authority owns them (§12 row 1, criterion 20). No detector, grade or prose is added.
 */
export function candidateChildReadings(afterFen: string): readonly DeclaredEvidence<unknown>[] {
  return Object.freeze([
    declareCastlingRightsEvidence(castlingRights(afterFen)),
    ...castlingLegality(afterFen).map(declareCastlingLegalityEvidence),
    declareLoosePieceEvidence(loosePieceReading(afterFen)),
    declareRayClassificationEvidence(rayClassificationReading(afterFen)),
    declareThreatEvidence(threats(afterFen)),
    declarePawnConnectivityEvidence(pawnConnectivityReading(afterFen)),
    declareDevelopmentReadingEvidence(developmentReading(afterFen)),
    declareRookOnSeventhEvidence(rookOnSeventhReading(afterFen)),
    declareSpaceEvidence(spaceReading(afterFen)),
    declareDiscoveredLatencyEvidence(discoveredLatencyReading(afterFen)),
    declareTrappedPieceEvidence(trappedPieceReading(afterFen)),
    declareBackRankEvidence(backRankReading(afterFen)),
    declareMateInOneEvidence(mateInOne(afterFen)),
    declarePromotionPressureEvidence(promotionPressureReading(afterFen)),
    declareSquareControlReadingEvidence(squareControlReading(afterFen)),
    declareMobilityReadingEvidence(pieceDestinationsReading(afterFen)),
    declarePawnContactsEvidence(pawnContactsReading(afterFen)),
    declareCandidateMajorityEvidence(candidateMajorityReading(afterFen)),
    declareMaterialRoleReadingEvidence(materialRoleSignatureReading(afterFen)),
    declareKingZoneReadingEvidence(kingZoneReading(afterFen)),
  ]);
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
  const legalMovesInput = createRulesMobilityReadingLegalMovesV1Evidence(beforeFen);
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
  return [declareForkSurvivalEvidence(forkSurvivesReply(doubleAttack.operands as DoubleAttackEvent, breadth.operands as ReplyBreadth))];
}

function compileRow(beforeFen: string, move: ExactLegalMove, member: CandidatePacketScopeMember, structuralCache: Map<string, StructuralReading>): CompiledRowValues {
  const afterFen = childFen(beforeFen, move);
  const wantsEvents = member !== "readings";
  const wantsReadings = member !== "events";
  // Scope selects retained families; it never removes a dependency a retained output needs. Fork
  // survival reads the tactical events privately when events are not retained (§3.4).
  const closure = wantsEvents ? localSemanticEventClosure(beforeFen, move.uci, afterFen, structuralCache) : undefined;
  const events = closure?.events ?? EMPTY;
  let readings: readonly DeclaredEvidence<unknown>[] = EMPTY;
  if (wantsReadings) {
    const exchange = legalExchange(beforeFen, move.uci);
    const tactical = closure === undefined ? tacticalSemanticEvents(beforeFen, move.uci, afterFen) : closure.events;
    readings = Object.freeze([
      ...candidateChildReadings(afterFen),
      ...(exchange === undefined ? [] : [declareLegalExchangeEvidence(exchange)]),
      ...forkSurvival(tactical),
    ]);
  }
  const abstentions: readonly CandidatePacketAbstention[] = closure === undefined || closure.abstentions.length === 0 ? EMPTY : closure.abstentions;
  const outcomes = Object.freeze(abstentions.map((abstention) => {
    const outcome: SealedCandidateCollectorOutcome = Object.freeze({ moveUci: move.uci, projection: abstention.projection, result: Object.freeze({ kind: "unavailable" as const, reason: abstention.reason }) });
    OUTCOMES.add(outcome);
    return outcome;
  }));
  return Object.freeze({ afterFen, events, readings, abstentions, outcomes });
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
}

/** The only receipt constructor (§3.1). Admission is by reference identity, never by seal or digest (§5.2). */
function compileCandidatePopulationReceipt(input: MintInput): CandidatePopulationReceipt {
  const { rows, legalMoves } = input;
  if ((rows.length === 0) !== (input.terminal !== undefined)) throw new CandidateInvariantFailure("terminal", "an empty population is legal exactly for checkmate or stalemate");
  const legalUcis = legalMoves.map((move) => move.uci);
  const legalSet = new Set(legalUcis);
  const rowSet = new Set(rows.map((row) => row.moveUci));
  if (legalSet.size !== legalUcis.length || rowSet.size !== rows.length || rows.length !== legalMoves.length || rows.some((row) => !legalSet.has(row.moveUci))) {
    throw new CandidateInvariantFailure("legal_set", "candidate move identities are not set-equal to the legal authority");
  }
  for (const row of rows) if (row.afterFen !== input.compiled.get(row.moveUci)?.afterFen) throw new CandidateInvariantFailure("child_fen", `${row.moveUci} does not carry the compiler's derived child`);
  if (legalMoves !== input.authorityLegalMoves || !Object.isFrozen(legalMoves)) throw new CandidateInvariantFailure("receipt", "legal moves are not the flat container of the sealed exact map");
  const authorityMembers = new Set<ExactLegalMove>(input.legalMovesInput.payload.pieces.flatMap((piece) => piece.moves));
  if (legalMoves.some((move) => !authorityMembers.has(move))) throw new CandidateInvariantFailure("receipt", "a legal move is not the authority's own object");
  const manifestDigest = PRIMARY_EVIDENCE_MANIFEST.digest;
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
    legalMovesInput: input.legalMovesInput,
    candidateInputs: Object.freeze(frozenRows.map((row) => Object.freeze({ row, events: row.events, readings: row.readings }))),
  }));
  return receipt;
}

/** Contract-test seam: it can substitute the legal list or rows, and every substitution can only fail. */
export interface CandidatePopulationContractTamper {
  readonly legalMoves?: (authority: readonly ExactLegalMove[]) => readonly ExactLegalMove[];
  readonly rows?: (rows: readonly CandidateEventRow[]) => readonly CandidateEventRow[];
}

function compileInternal(request: unknown, tamper?: CandidatePopulationContractTamper): CandidatePopulationCompileResult<CandidatePacketScope> {
  const parsed = parseRequest(request);
  if (parsed.kind === "failed") return Object.freeze({ kind: "failed", error: parsed.error });
  let legal: ReturnType<typeof compileLegalPopulation>;
  try { legal = compileLegalPopulation(parsed.beforeFen); } catch (error) {
    return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invalid_fen", message: error instanceof Error ? error.message : String(error) }) });
  }
  const beforeFen = legal.legalMovesInput.payload.fen;
  const position = positionFromFen(beforeFen);
  const terminal = position.isCheckmate() ? Object.freeze({ reason: "checkmate" as const }) : position.isStalemate() ? Object.freeze({ reason: "stalemate" as const }) : undefined;
  const legalMoves = tamper?.legalMoves === undefined ? legal.legalMoves : tamper.legalMoves(legal.legalMoves);
  const structuralCache = new Map<string, StructuralReading>();
  const compiled = new Map<string, CompiledRowValues>();
  for (const move of legalMoves) if (!compiled.has(move.uci)) compiled.set(move.uci, compileRow(beforeFen, move, parsed.member, structuralCache));
  const built: readonly CandidateEventRow[] = legalMoves.map((move) => {
    const values = compiled.get(move.uci)!;
    return Object.freeze({ moveUci: move.uci, afterFen: values.afterFen, events: values.events, readings: values.readings, abstentions: values.abstentions });
  });
  const rows = tamper?.rows === undefined ? built : tamper.rows(built);
  if (rows.length === 0 && terminal === undefined) return Object.freeze({ kind: "failed", error: Object.freeze({ code: "non_terminal_empty", beforeFen }) });
  try {
    const receipt = compileCandidatePopulationReceipt({ beforeFen, member: parsed.member, legalMovesInput: legal.legalMovesInput, authorityLegalMoves: legal.legalMoves, legalMoves, rows, compiled, terminal });
    return Object.freeze({ kind: "ready", receipt });
  } catch (error) {
    if (error instanceof CandidateInvariantFailure) return Object.freeze({ kind: "failed", error: Object.freeze({ code: "invariant_failed", invariant: error.invariant }) });
    throw error;
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
  for (const [index, recorded] of references.candidateInputs.entries()) {
    const row = packet.candidates[index];
    const input = receipt.candidateInputs[index];
    if (row !== recorded.row || row.events !== recorded.events || row.readings !== recorded.readings || input === undefined || input.moveUci !== row.moveUci || input.events !== recorded.events || input.readings !== recorded.readings) {
      throw new TypeError("Candidate population receipt does not retain its recorded row references");
    }
  }
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
