/**
 * The sole production mint boundary (rfc/evidence-value-authority.md §1–§2).
 *
 * This is the only non-test module that may import and call `declareEvidence`. Its local `mint`
 * helper is not exported. Every exported value is one projection-specific factory whose parameters
 * are authority inputs — a FEN, a validated edge, bounded domain parameters, exact sealed inputs, a
 * source response or an authored record. No factory accepts a caller-authored output payload.
 *
 * Factories are imported only by `internal/evidence-value-routes.ts`, whose
 * `invokeEvidenceValueRoute` is the single dispatcher; `make evidence-value-authority` enforces
 * both edges. Nothing here is re-exported from the package barrel.
 */
import { STRUCTURAL_FEATURE_KINDS, type DrillPackDefinition, type StructuralFeature } from "@chess-tabiya/schema/drill-pack";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";

import { castlingLegality, castlingRights, castlingRightsLost } from "./castling.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { recordedBranchFacts, type BranchComparison, type ComparisonEvidenceEntry, type ComparisonScore, type RecordedBranchFacts } from "./compare.js";
import { endgameClassification } from "./endgame.js";
import { captureClassEvent, legalExchange, type LegalExchangeResult } from "./exchange.js";
import { PRIMARY_EVIDENCE_MANIFEST, STRUCTURAL_EVENT_FAMILIES, TRANSITION_GEOMETRY_EVENT_FAMILIES, TRANSITION_RULE_EVENT_FAMILIES } from "./evidence-catalog.js";
import {
  assertDeclaredEvidence,
  declareEvidence,
  evidenceDigest,
  evidenceValueReceipt,
  type DeclaredEvidence,
  type ProjectionDeclaration,
  type VersionedEvidenceId,
} from "./evidence-contract.js";
import { resolveEvidenceReference, type EvidenceReferenceResolution } from "./evidence-ref-resolution.js";
import { kingZoneEvents, kingZoneReading } from "./king-state.js";
import { exactLegalMoveMap, exactMoveIdentity } from "./legal-moves.js";
import { materialRoleAsymmetryEvent, materialRoleSignatureReading } from "./material-state.js";
import { forcedMateAfterMove } from "./mate-proof.js";
import { moveQualityGrade, type GradeContext, type GradeSide, type MoveQualityGrade } from "./grade.js";
import { gradeReadingFromPayload } from "./grade-reading.js";
import { pieceDestinationEvents, pieceDestinationsReading } from "./mobility.js";
import { candidateMajorityReading, harassmentPressureSequence, pawnContactsReading, pawnContactTimingSequence, pawnDynamicsEvents, pawnTransitionEvents, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import { developmentReading, phaseBandReading } from "./phase.js";
import { pivotalMarkerPayloads, type PivotalKind, type PivotalMarker } from "./pivotal.js";
import { RECORDED_EDGE_FACTORY, recordedEdgePayload, type RecordedEdge } from "./recorded-edge.js";
import { recordedReadingFromLedgerRecord, type SourcingLedgerRecord } from "./recorded-reading.js";
import {
  assertSemanticEvidenceEvent,
  attractionObservedOperands,
  checkZwischenzugObservedOperands,
  defenderConsequenceOperands,
  defenderExposureOperands,
  deflectionObservedInduction,
  deflectionObservedOperands,
  interferenceObservedOperands,
  legalAlternativeEdges,
  lineBlockerClearanceObservedOperands,
  openFileOccupancyOperands,
  capturedZoneDefenderOperands,
  overloadExploitationObservedOperands,
  squareClearanceObservedOperands,
  exactRecordedSequenceInputs,
  exactSequenceInputs,
  recordedEdgeAnchors,
  structuralSemanticEventPayloads,
  transitionSemanticEventPayloads,
  type CounterfactualAbsenceOperands,
  type SemanticEvidenceEvent,
} from "./semantic-evidence.js";
import { shapeFirings, type ShapeTriggerSource } from "./shape-firing.js";
import { squareControlEvents, squareControlReading } from "./square-control.js";
import { STORY_MATE_CP, STORY_PIVOT_CP, rankStoryMoments, storyEvaluation, suggestTitle, type StoryMoment, type StoryTitleInput } from "./story.js";
import { evaluateStructuralPredicate } from "./structural-evidence.js";
import { matchesStructuralExpression, pawnConnectivityReading, spaceReading, structuralReading, type StructuralReading } from "./structure.js";
import {
  backRankReading,
  checkEvent,
  defenderDutyReading,
  defenderDutyRelocatedEvents,
  defenderRemovedEvents,
  discoveredExecutedEvents,
  discoveredLatencyReading,
  doubleAttackEvent,
  forkSurvivesReply,
  loosePieceEvents,
  loosePieceReading,
  mateInOne,
  overloadedDefenderResponseConflict,
  promotionPressureReading,
  rayClassificationReading,
  replyBreadth,
  rookOnSeventhReading,
  threats,
  trappedPieceReading,
  type DoubleAttackEvent,
  type GainedSliderRay,
  type ReplyBreadth,
} from "./tactics.js";
import { transitionReading, transitionSemanticFacts } from "./transition.js";
import { branchPath } from "./branch-path.js";
import { recordedPieceRoutes, structureDeltaEntries } from "./compare-strip-values.js";
import type { DrillRun, EvidencePayload, Node, RunOutcome, SelectionEngineIdentity } from "./types.js";
import { candidateCollectorResults, type CandidateFeatureInput, type CandidateFeatureVector } from "./candidate-feature-vector.js";

// ---------------------------------------------------------------------------------------------
// Public (package-internal) shapes. None of these is re-exported by the package barrel.
// ---------------------------------------------------------------------------------------------

/** Documentation vocabulary for the four construction shapes; not a shared exported enum. */
export type EvidenceValueFactoryShape = "computed" | "derived" | "source_receipt" | "authored_authority";

export type EvidenceInputSpec =
  | { readonly kind: "fen" }
  | { readonly kind: "edge" }
  | { readonly kind: "sealed"; readonly routes: readonly string[] }
  | { readonly kind: "sealed_list"; readonly routes: readonly string[]; readonly min: number; readonly max: number | null }
  | { readonly kind: "semantic_events"; readonly min: number }
  | { readonly kind: "run" }
  | { readonly kind: "comparison" }
  | { readonly kind: "value"; readonly label: string; readonly accepts: (value: unknown) => boolean };

export type EvidenceInputArm = Readonly<Record<string, EvidenceInputSpec & { readonly optional?: boolean }>>;

export interface EvidenceValueFactoryMeta {
  readonly route: string;
  readonly symbol: string;
  readonly shape: EvidenceValueFactoryShape;
  readonly arms: readonly EvidenceInputArm[];
  /** `none`, or the RFC whose authority this row consumes. */
  readonly dependency: string;
  /** Explicit statement of what remains unproven until `dependency` lands; absent when complete. */
  readonly pending?: string;
  readonly result: "single" | "population" | "availability" | "items";
}

export type EvidenceValueFactory<I, R> = ((input: I) => R) & { readonly meta: EvidenceValueFactoryMeta };

/** Optional readings: an exact available value, or a declared unavailable reason. */
export type EvidenceAvailability<T> =
  | { readonly kind: "available"; readonly value: T }
  | { readonly kind: "unavailable"; readonly reason: string; readonly dependency?: string };

/** A derived item plus the exact sealed inputs its receipt names, for event compilation. */
export interface DerivedEvidence<T> {
  readonly evidence: DeclaredEvidence<T>;
  readonly inputs: readonly DeclaredEvidence<unknown>[];
}

/** A run projection item plus the recorded node/offset that places it on a timeline. */
export interface RunEvidenceItem<T> {
  readonly evidence: DeclaredEvidence<T>;
  readonly nodeId: string;
  readonly plyOffset: number;
}

export interface EvidenceEdge {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
}

// ---------------------------------------------------------------------------------------------
// Input specs and validators
// ---------------------------------------------------------------------------------------------

const FEN: EvidenceInputSpec = Object.freeze({ kind: "fen" });
const EDGE: EvidenceInputSpec = Object.freeze({ kind: "edge" });
const RUN: EvidenceInputSpec = Object.freeze({ kind: "run" });
const COMPARISON: EvidenceInputSpec = Object.freeze({ kind: "comparison" });
const sealed = (...routes: string[]): EvidenceInputSpec => Object.freeze({ kind: "sealed", routes: Object.freeze(routes) });
const sealedList = (min: number, max: number | null, ...routes: string[]): EvidenceInputSpec => Object.freeze({ kind: "sealed_list", routes: Object.freeze(routes), min, max });
const value = (label: string, accepts: (candidate: unknown) => boolean): EvidenceInputSpec => Object.freeze({ kind: "value", label, accepts });
const optional = <T extends EvidenceInputSpec>(spec: T): T & { readonly optional: true } => Object.freeze({ ...spec, optional: true as const }) as unknown as T & { readonly optional: true };

const isText = (candidate: unknown): candidate is string => typeof candidate === "string" && candidate.trim() !== "";
const isRecord = (candidate: unknown): candidate is Readonly<Record<string, unknown>> => typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
const hasExactKeys = (candidate: unknown, keys: readonly string[]): boolean => isRecord(candidate) && Object.keys(candidate).length === keys.length && keys.every((key) => key in candidate);

const EDGE_CACHE = new Map<string, EvidenceEdge>();
const MEMO = new Map<string, unknown>();
const MEMO_LIMIT = 2048;

function memo<T>(key: string, compute: () => T): T {
  if (MEMO.has(key)) {
    const cached = MEMO.get(key) as T;
    MEMO.delete(key);
    MEMO.set(key, cached);
    return cached;
  }
  const computed = compute();
  MEMO.set(key, computed);
  if (MEMO.size > MEMO_LIMIT) MEMO.delete(MEMO.keys().next().value as string);
  return computed;
}

/** Validates a canonicalizable FEN; the given bytes are what the producer receives. */
export function validFen(candidate: unknown): string {
  if (typeof candidate !== "string") throw new TypeError("Evidence authority FEN must be a string");
  positionFromFen(candidate);
  return candidate;
}

/** Validates and canonicalizes one legal played edge. The after FEN must be the move's result. */
export function validEdge(candidate: unknown): EvidenceEdge {
  if (!hasExactKeys(candidate, ["beforeFen", "moveUci", "afterFen"])) throw new TypeError("Evidence authority edge must be exactly { beforeFen, moveUci, afterFen }");
  const edge = candidate as EvidenceEdge;
  if (typeof edge.beforeFen !== "string" || typeof edge.moveUci !== "string" || typeof edge.afterFen !== "string") throw new TypeError("Evidence authority edge fields must be strings");
  const key = `${edge.beforeFen}|${edge.moveUci}|${edge.afterFen}`;
  const cached = EDGE_CACHE.get(key);
  if (cached !== undefined) return cached;
  const before = positionFromFen(edge.beforeFen);
  const beforeFen = canonicalFen(before);
  const moveUci = exactMoveIdentity(beforeFen, edge.moveUci);
  const child = positionFromFen(beforeFen);
  const parsed = parseUci(moveUci)!;
  child.play(normalizeMove(child, parsed));
  const afterFen = canonicalFen(child);
  if (canonicalFen(positionFromFen(edge.afterFen)) !== afterFen) throw new TypeError(`Evidence authority edge after FEN is not the result of ${moveUci}`);
  const canonical = Object.freeze({ beforeFen, moveUci, afterFen });
  EDGE_CACHE.set(key, canonical);
  if (EDGE_CACHE.size > MEMO_LIMIT) EDGE_CACHE.delete(EDGE_CACHE.keys().next().value as string);
  return canonical;
}


function isRun(candidate: unknown): candidate is DrillRun {
  return isRecord(candidate) && typeof candidate.id === "string" && Array.isArray(candidate.nodes) && Array.isArray(candidate.events) && Array.isArray(candidate.branches);
}

function isComparison(candidate: unknown): candidate is BranchComparison {
  return isRecord(candidate) && typeof candidate.forkNodeId === "string" && Array.isArray(candidate.columns) && isRecord(candidate.evidence);
}

function sealedRoute(evidence: DeclaredEvidence<unknown>): string {
  return `${evidence.projection.id}@${evidence.projection.version}`;
}

/** Admission of one input value against its spec; returns a readable failure or undefined. */
export function admitInputValue(spec: EvidenceInputSpec, candidate: unknown): string | undefined {
  try {
    switch (spec.kind) {
      case "fen": validFen(candidate); return undefined;
      case "edge": validEdge(candidate); return undefined;
      case "run": return isRun(candidate) ? undefined : "is not a recorded DrillRun";
      case "comparison": return isComparison(candidate) ? undefined : "is not a BranchComparison";
      case "sealed": {
        assertDeclaredEvidence(candidate);
        return spec.routes.includes(sealedRoute(candidate)) ? undefined : `is sealed ${sealedRoute(candidate)}, not ${spec.routes.join(" | ")}`;
      }
      case "sealed_list": {
        if (!Array.isArray(candidate)) return "is not a sealed-evidence list";
        if (candidate.length < spec.min || (spec.max !== null && candidate.length > spec.max)) return `has ${candidate.length} items outside [${spec.min}, ${spec.max ?? "∞"}]`;
        for (const item of candidate) {
          assertDeclaredEvidence(item);
          if (!spec.routes.includes(sealedRoute(item))) return `contains sealed ${sealedRoute(item)}, not ${spec.routes.join(" | ")}`;
        }
        return undefined;
      }
      case "semantic_events": {
        if (!Array.isArray(candidate) || candidate.length < spec.min) return "is not a non-empty semantic-event list";
        for (const item of candidate) assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, item);
        return undefined;
      }
      case "value": return spec.accepts(candidate) ? undefined : `is not ${spec.label}`;
      default: { const exhaustive: never = spec; return `has unknown spec ${String(exhaustive)}`; }
    }
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

// ---------------------------------------------------------------------------------------------
// The mint boundary
// ---------------------------------------------------------------------------------------------

let projectionIndex: ReadonlyMap<string, ProjectionDeclaration> | undefined;

function projectionFor(route: string): ProjectionDeclaration {
  projectionIndex ??= new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]));
  const projection = projectionIndex.get(route);
  if (projection === undefined) throw new TypeError(`Evidence route ${route} names no catalogue projection`);
  if (projection.disposition?.kind === "retired") throw new TypeError(`Evidence route ${route} is retired and cannot be minted`);
  return projection;
}

function authorityShape(candidate: unknown): unknown {
  if (candidate === null || typeof candidate !== "object") return candidate;
  if (Array.isArray(candidate)) return candidate.map(authorityShape);
  if (isRun(candidate)) return { run: candidate.id, nodes: candidate.nodes.length, events: candidate.events.length };
  if (candidate instanceof Map) return { map: [...candidate].map(([key, entry]) => [key, authorityShape(entry)]) };
  try {
    assertDeclaredEvidence(candidate);
    return { sealed: evidenceValueReceipt(candidate).payloadDigest };
  } catch {
    // Ordinary authority record.
  }
  if ((candidate as { readonly [key: symbol]: unknown })[Symbol.iterator] !== undefined && !Array.isArray(candidate)) return String(candidate);
  const shape: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(candidate)) if (typeof entry !== "function") shape[key] = authorityShape(entry);
  return shape;
}

function sourceDigest(source: DeclaredEvidence<unknown> | string): string {
  return typeof source === "string" ? source : evidenceValueReceipt(source).payloadDigest;
}

function present<T>(payload: T, route: string): T {
  if (payload === undefined || payload === null) throw new TypeError(`${route} evidence payload is absent`);
  return payload;
}

/** The local mint helper. Deliberately not exported. */
function mint<T>(route: string, symbol: string, payload: T, authority: unknown, sources: readonly (DeclaredEvidence<unknown> | string)[] = []): DeclaredEvidence<T> {
  const projection = projectionFor(route);
  return declareEvidence(projection.producer, { id: projection.id, version: projection.version }, present(payload, route), {
    factory: symbol,
    inputDigest: evidenceDigest(authorityShape(authority)),
    sourceDigests: sources.map(sourceDigest),
  });
}

function factory<I, R>(meta: Omit<EvidenceValueFactoryMeta, "dependency"> & { readonly dependency?: string }, body: (input: I, meta: EvidenceValueFactoryMeta) => R): EvidenceValueFactory<I, R> {
  const frozen: EvidenceValueFactoryMeta = Object.freeze({ ...meta, dependency: meta.dependency ?? "none", arms: Object.freeze(meta.arms.map((arm) => Object.freeze({ ...arm }))) });
  const operation = (input: I): R => body(input, frozen);
  Object.defineProperty(operation, "name", { value: frozen.symbol });
  Object.defineProperty(operation, "meta", { value: frozen, enumerable: true });
  return Object.freeze(operation) as EvidenceValueFactory<I, R>;
}

/** Canonical factory symbol for a route: create + PascalCase(id) + V{version} + Evidence. */
export function evidenceFactorySymbol(route: string): string {
  const [id, version] = route.split("@");
  const name = id!.split(/[._-]/u).map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join("");
  return `create${name}V${version}Evidence`;
}

const available = <T>(valueOf: T): EvidenceAvailability<T> => Object.freeze({ kind: "available", value: valueOf });
const unavailable = <T>(reason: string, dependency?: string): EvidenceAvailability<T> => Object.freeze({ kind: "unavailable", reason, ...(dependency === undefined ? {} : { dependency }) });

// ---------------------------------------------------------------------------------------------
// Computed: one reading per FEN
// ---------------------------------------------------------------------------------------------

function fenReading<T>(route: string, compute: (fen: string) => T, options: { readonly shape?: EvidenceValueFactoryShape; readonly dependency?: string; readonly pending?: string } = {}): EvidenceValueFactory<{ readonly fen: string }, DeclaredEvidence<T>> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: options.shape ?? "computed", arms: [{ fen: FEN }], result: "single", ...(options.dependency === undefined ? {} : { dependency: options.dependency }), ...(options.pending === undefined ? {} : { pending: options.pending }) }, ({ fen }: { readonly fen: string }) => mint(route, symbol, compute(validFen(fen)), { fen }));
}

const CONVENTION_CLOSURE_PENDING = "The direct convention identity is carried in-payload; the registered descriptor/closure receipt lands with semantic-convention-provenance.";

export const createRulesCastlingReadingRightsV1Evidence = fenReading("rules.castling.reading.rights@1", castlingRights);
export const createRulesTacticReadingLoosePieceV1Evidence = fenReading("rules.tactic.reading.loose_piece@1", loosePieceReading);
export const createRulesTacticReadingRayClassificationV1Evidence = fenReading("rules.tactic.reading.ray_classification@1", rayClassificationReading);
export const createRulesTacticConsequenceThreatV1Evidence = fenReading("rules.tactic.consequence.threat@1", threats);
export const createRulesStructuralReadingPawnConnectivityV1Evidence = fenReading("rules.structural.reading.pawn_connectivity@1", pawnConnectivityReading);
export const createRulesPhaseDevelopmentV1Evidence = fenReading("rules.phase.development@1", developmentReading);
export const createRulesTacticReadingRookOnSeventhV1Evidence = fenReading("rules.tactic.reading.rook_on_seventh@1", rookOnSeventhReading);
export const createRulesStructuralReadingSpaceV1Evidence = fenReading("rules.structural.reading.space@1", spaceReading);
export const createRulesTacticReadingDiscoveredLatencyV1Evidence = fenReading("rules.tactic.reading.discovered_latency@1", discoveredLatencyReading);
export const createRulesTacticReadingTrappedPieceV1Evidence = fenReading("rules.tactic.reading.trapped_piece@1", trappedPieceReading);
export const createRulesTacticReadingBackRankV1Evidence = fenReading("rules.tactic.reading.back_rank@1", backRankReading);
export const createRulesTacticConsequenceMateInOneV1Evidence = fenReading("rules.tactic.consequence.mate_in_one@1", mateInOne);
export const createRulesSquareReadingControlV1Evidence = fenReading("rules.square.reading.control@1", squareControlReading, { dependency: "semantic-convention-provenance", pending: CONVENTION_CLOSURE_PENDING });
export const createRulesMobilityReadingPieceDestinationsV1Evidence = fenReading("rules.mobility.reading.piece_destinations@1", pieceDestinationsReading);
export const createRulesMobilityReadingLegalMovesV1Evidence = fenReading("rules.mobility.reading.legal_moves@1", exactLegalMoveMap);
export const createRulesPawnReadingContactsV1Evidence = fenReading("rules.pawn.reading.contacts@1", pawnContactsReading);
export const createRulesPawnReadingCandidateMajorityV1Evidence = fenReading("rules.pawn.reading.candidate_majority@1", candidateMajorityReading);
export const createRulesKingReadingZoneStateV1Evidence = fenReading("rules.king.reading.zone_state@1", kingZoneReading);
export const createRulesTacticReadingDefenderDutySetV1Evidence = fenReading("rules.tactic.reading.defender_duty_set@1", defenderDutyReading, { dependency: "semantic-convention-provenance", pending: CONVENTION_CLOSURE_PENDING });
export const createRulesPhaseReadingV2Evidence = fenReading("rules.phase.reading@2", phaseBandReading, { dependency: "semantic-convention-provenance", pending: "phase-bands@1 is carried as the payload conventionId; its registered descriptor lands with semantic-convention-provenance." });
/** Derived reading whose declared piece-count inputs are recomputed in the same pass from the FEN. */
export const createDerivedMaterialReadingRoleSignatureV1Evidence = fenReading("derived.material.reading.role_signature@1", materialRoleSignatureReading, { shape: "derived" });
/** Derived reading whose declared predicate inputs are recomputed in the same pass from the FEN. */
export const createDerivedTacticPromotionPressureV1Evidence = fenReading("derived.tactic.promotion_pressure@1", (fen) => promotionPressureReading(fen), { shape: "derived" });

// ---------------------------------------------------------------------------------------------
// Computed: FEN populations
// ---------------------------------------------------------------------------------------------

function fenPopulation<T>(route: string, compute: (fen: string) => readonly T[], options: { readonly dependency?: string; readonly pending?: string } = {}): EvidenceValueFactory<{ readonly fen: string }, readonly DeclaredEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN }], result: "population", ...(options.dependency === undefined ? {} : { dependency: options.dependency }), ...(options.pending === undefined ? {} : { pending: options.pending }) }, ({ fen }: { readonly fen: string }) => {
    const valid = validFen(fen);
    return Object.freeze(compute(valid).map((payload) => mint(route, symbol, payload, { fen })));
  });
}

function cachedStructuralReading(fen: string): StructuralReading {
  return memo(`structuralReading|${fen}`, () => structuralReading(fen));
}

export const createRulesCastlingReadingLegalityV1Evidence = fenPopulation("rules.castling.reading.legality@1", castlingLegality);
export const createRulesStructuralReadingNamedStructureV2Evidence = fenPopulation("rules.structural.reading.named_structure@2", (fen) => cachedStructuralReading(fen).structures.map((structure) => Object.freeze({ id: structure.id, name: structure.name, provenanceNote: structure.provenanceNote })), { dependency: "semantic-convention-provenance", pending: "The structure catalogue is the product-owned convention; its registered descriptor lands with semantic-convention-provenance." });
export const createRulesEndgameClassificationV1Evidence = fenPopulation("rules.endgame.classification@1", (fen) => { const reading = endgameClassification(fen); return reading === null ? [] : [reading]; }, { dependency: "semantic-convention-provenance", pending: "endgame-material-census@1 is carried in-payload; its registered descriptor lands with semantic-convention-provenance." });

const STRUCTURAL_READING_KINDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count" && kind !== "named_structure"));
export type StructuralReadingKind = (typeof STRUCTURAL_READING_KINDS)[number];
/** One population factory per structural reading family (sixteen named function objects). */
export const STRUCTURAL_READING_FACTORIES = Object.freeze(Object.fromEntries(STRUCTURAL_READING_KINDS.map((kind) => {
  const route = `rules.structural.reading.${kind}@1`;
  return [route, fenPopulation(route, (fen) => cachedStructuralReading(fen).features.filter((feature) => feature.kind === kind))];
})) as Readonly<Record<`rules.structural.reading.${StructuralReadingKind}@1`, EvidenceValueFactory<{ readonly fen: string }, readonly DeclaredEvidence<StructuralReading["features"][number]>[]>>>);

/** One `{ fen, feature }` predicate factory per structural feature kind (eighteen). */
export const STRUCTURAL_PREDICATE_FACTORIES = Object.freeze(Object.fromEntries(STRUCTURAL_FEATURE_KINDS.map((kind) => {
  const route = `rules.structural.predicate.${kind}@1`;
  const symbol = evidenceFactorySymbol(route);
  return [route, factory({ route, symbol, shape: "computed", arms: [{ fen: FEN, feature: value(`a ${kind} StructuralFeature`, (candidate) => isRecord(candidate) && candidate.kind === kind) }], result: "single" }, ({ fen, feature }: { readonly fen: string; readonly feature: StructuralFeature }) => {
    const valid = validFen(fen);
    const matched = matchesStructuralExpression(valid, { kind: "feature", feature });
    return mint(route, symbol, Object.freeze({ fen: valid, feature, matched }), { fen, feature });
  })];
})) as Readonly<Record<`rules.structural.predicate.${(typeof STRUCTURAL_FEATURE_KINDS)[number]}@1`, EvidenceValueFactory<{ readonly fen: string; readonly feature: StructuralFeature }, DeclaredEvidence<{ readonly fen: string; readonly feature: StructuralFeature; readonly matched: boolean }>>>>);

// ---------------------------------------------------------------------------------------------
// Computed: validated-edge populations
// ---------------------------------------------------------------------------------------------

function edgePopulation<T>(route: string, compute: (edge: EvidenceEdge) => readonly T[], options: { readonly dependency?: string; readonly pending?: string } = {}): EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "population", ...(options.dependency === undefined ? {} : { dependency: options.dependency }), ...(options.pending === undefined ? {} : { pending: options.pending }) }, (input: EvidenceEdge) => {
    const edge = validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    return Object.freeze(compute(edge).map((payload) => mint(route, symbol, payload, edge)));
  });
}

const edgeKey = (edge: EvidenceEdge): string => `${edge.beforeFen}|${edge.moveUci}|${edge.afterFen}`;

export const createRulesCastlingEventRightsLostV1Evidence = edgePopulation("rules.castling.event.rights_lost@1", (edge) => castlingRightsLost(edge.beforeFen, edge.moveUci, edge.afterFen));
export const createRulesStructuralEventPawnIslandsV1Evidence = edgePopulation("rules.structural.event.pawn_islands@1", (edge) => {
  const before = pawnConnectivityReading(edge.beforeFen);
  const after = pawnConnectivityReading(edge.afterFen);
  return (["white", "black"] as const).map((color) => Object.freeze({
    before_fen: edge.beforeFen, move_uci: edge.moveUci, after_fen: edge.afterFen, family: "pawn_islands" as const, color,
    before: before.colors.find((entry) => entry.color === color)!.islandCount,
    after: after.colors.find((entry) => entry.color === color)!.islandCount,
  }));
});
export const createRulesTacticConsequenceReplyBreadthV1Evidence = (() => {
  const route = "rules.tactic.consequence.reply_breadth@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "single" }, (input: EvidenceEdge) => {
    const edge = validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    const breadth = replyBreadth(edge.beforeFen, edge.moveUci);
    if (breadth.afterFen !== edge.afterFen) throw new TypeError(`Reply-breadth after FEN does not match ${edge.moveUci}`);
    return mint(route, symbol, breadth, edge);
  });
})();
export const createRulesTacticEventCheckV1Evidence = edgePopulation("rules.tactic.event.check@1", (edge) => { const check = checkEvent(edge.beforeFen, edge.moveUci); return check === undefined ? [] : [check]; });
export const createRulesTacticEventDoubleAttackV1Evidence = edgePopulation("rules.tactic.event.double_attack@1", (edge) => { const fork = doubleAttackEvent(edge.beforeFen, edge.moveUci); return fork === undefined ? [] : [fork]; });
export const createRulesSquareEventControlV1Evidence = edgePopulation("rules.square.event.control@1", (edge) => squareControlEvents(edge.beforeFen, edge.moveUci, edge.afterFen).events, { dependency: "semantic-convention-provenance", pending: CONVENTION_CLOSURE_PENDING });
export const createRulesMobilityEventPieceDestinationsV1Evidence = edgePopulation("rules.mobility.event.piece_destinations@1", (edge) => pieceDestinationEvents(edge.beforeFen, edge.moveUci, edge.afterFen).events);
export const createRulesPawnEventDynamicsV1Evidence = edgePopulation("rules.pawn.event.dynamics@1", (edge) => pawnDynamicsEvents(edge.beforeFen, edge.moveUci, edge.afterFen));
export const createRulesKingEventZoneStateV1Evidence = edgePopulation("rules.king.event.zone_state@1", (edge) => kingZoneEvents(edge.beforeFen, edge.moveUci, edge.afterFen));
function captureFactFor(edge: EvidenceEdge) {
  const fact = transitionSemanticFacts(edge.beforeFen, edge.moveUci, edge.afterFen).find((candidate) => candidate.family === "capture");
  return fact?.family === "capture" ? fact : undefined;
}
export const createRulesTacticEventDefenderRemovedV1Evidence = edgePopulation("rules.tactic.event.defender_removed@1", (edge) => defenderRemovedEvents(edge.beforeFen, edge.moveUci, edge.afterFen, captureFactFor(edge)), { dependency: "semantic-convention-provenance", pending: CONVENTION_CLOSURE_PENDING });
export const createRulesTacticEventDefenderDutyRelocatedV1Evidence = edgePopulation("rules.tactic.event.defender_duty_relocated@1", (edge) => defenderDutyRelocatedEvents(edge.beforeFen, edge.moveUci, edge.afterFen), { dependency: "semantic-convention-provenance", pending: CONVENTION_CLOSURE_PENDING });

export const createRulesTacticEventLoosePieceV1Evidence = (() => {
  const route = "rules.tactic.event.loose_piece@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "availability" }, (input: EvidenceEdge): EvidenceAvailability<readonly DeclaredEvidence<unknown>[]> => {
    const edge = validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    const result = loosePieceEvents(edge.beforeFen, edge.moveUci);
    if (result.kind === "unavailable") return unavailable(result.reason);
    if (result.afterFen !== edge.afterFen) throw new TypeError(`Loose-piece after FEN does not match ${edge.moveUci}`);
    return available(Object.freeze(result.events.map((payload) => mint(route, symbol, payload, edge))));
  });
})();

export const createRulesExchangePredicateLegalExchangeV1Evidence = (() => {
  const route = "rules.exchange.predicate.legal_exchange@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN, captureUci: value("a UCI string", isText) }], result: "population" }, ({ fen, captureUci }: { readonly fen: string; readonly captureUci: string }) => {
    const exchange = legalExchange(validFen(fen), captureUci);
    return Object.freeze(exchange === undefined ? [] : [mint(route, symbol, exchange, { fen, captureUci })]);
  });
})();

export const createRulesTacticConsequenceForcedMateAfterMoveV1Evidence = (() => {
  const route = "rules.tactic.consequence.forced_mate_after_move@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, breadth: sealed("rules.tactic.consequence.reply_breadth@1"), maxAttackerMoves: value("an integer attacker-move horizon", Number.isSafeInteger) }], result: "availability", dependency: "semantic-convention-provenance", pending: "mate-proof@1 is carried in-payload; its registered descriptor lands with semantic-convention-provenance." }, ({ beforeFen, breadth, maxAttackerMoves }: { readonly beforeFen: string; readonly breadth: DeclaredEvidence<ReplyBreadth>; readonly maxAttackerMoves: number }): EvidenceAvailability<DeclaredEvidence<unknown>> => {
    const result = forcedMateAfterMove(validFen(beforeFen), breadth.payload.triggeringMove, maxAttackerMoves, breadth.payload);
    if (result.kind === "unavailable") return unavailable(result.reason);
    return available(mint(route, symbol, result.proof, { beforeFen, breadth, maxAttackerMoves }, [breadth]));
  });
})();

function structuralEventsForEdge(edge: EvidenceEdge) {
  return memo(`structuralEvents|${edgeKey(edge)}`, () => structuralSemanticEventPayloads(edge.beforeFen, edge.moveUci, edge.afterFen, cachedStructuralReading));
}
/** One population factory per structural event family (eleven). */
export const STRUCTURAL_EVENT_FACTORIES = Object.freeze(Object.fromEntries(STRUCTURAL_EVENT_FAMILIES.map((family) => {
  const route = `rules.structural.event.${family}@1`;
  return [route, edgePopulation(route, (edge) => structuralEventsForEdge(edge).filter((payload) => payload.family === family))];
})) as Readonly<Record<`rules.structural.event.${(typeof STRUCTURAL_EVENT_FAMILIES)[number]}@1`, EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<ReturnType<typeof structuralSemanticEventPayloads>[number]>[]>>>);

function transitionEventsForEdge(edge: EvidenceEdge) {
  return memo(`transitionEvents|${edgeKey(edge)}`, () => transitionSemanticEventPayloads(edge.beforeFen, edge.moveUci, edge.afterFen));
}
const TRANSITION_EVENT_FAMILIES = Object.freeze([...TRANSITION_GEOMETRY_EVENT_FAMILIES, ...TRANSITION_RULE_EVENT_FAMILIES]);
/** One population factory per transition event family (thirteen). */
export const TRANSITION_EVENT_FACTORIES = Object.freeze(Object.fromEntries(TRANSITION_EVENT_FAMILIES.map((family) => {
  const route = `rules.transition.event.${family}@1`;
  return [route, edgePopulation(route, (edge) => transitionEventsForEdge(edge).filter((payload) => payload.family === family))];
})) as Readonly<Record<`rules.transition.event.${(typeof TRANSITION_EVENT_FAMILIES)[number]}@1`, EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<ReturnType<typeof transitionSemanticEventPayloads>[number]>[]>>>);

const TRANSITION_READING_LEAVES = Object.freeze([
  "attacked_squares_changed.gained", "attacked_squares_changed.lost",
  "defended_squares_changed.gained", "defended_squares_changed.lost",
  "slider_lines_changed.opened", "slider_lines_changed.closed",
  "escape_squares_changed.gained", "escape_squares_changed.lost",
  "defended_duties_changed.acquired", "defended_duties_changed.released",
  "move_irreversibility.castled", "move_irreversibility.clock_zeroed",
  "move_irreversibility.last_of_role", "move_irreversibility.pawn_break",
] as const);
type TransitionObservationValue = NonNullable<ReturnType<typeof transitionReading>>["observations"][number];
function transitionLeaf(observation: TransitionObservationValue): string {
  return observation.kind === "move_irreversibility" ? `move_irreversibility.${observation.subkind}` : `${observation.kind}.${observation.direction}`;
}
/**
 * One population factory per transition reading leaf (fourteen). The edge must be a legal played
 * edge whose after FEN is the move's result; the reading is computed on the recorded FEN bytes.
 */
export const TRANSITION_READING_FACTORIES = Object.freeze(Object.fromEntries(TRANSITION_READING_LEAVES.map((leaf) => {
  const route = `rules.transition.reading.${leaf}@1`;
  const symbol = evidenceFactorySymbol(route);
  return [route, factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "population" }, (input: EvidenceEdge) => {
    validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    const reading = memo(`transitionReading|${edgeKey(input)}`, () => transitionReading(input.beforeFen, input.moveUci, input.afterFen));
    return Object.freeze((reading?.observations ?? []).filter((observation) => transitionLeaf(observation) === leaf).map((observation) => mint(route, symbol, observation, { beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen })));
  })];
})) as Readonly<Record<`rules.transition.reading.${(typeof TRANSITION_READING_LEAVES)[number]}@1`, EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<TransitionObservationValue>[]>>>);

// ---------------------------------------------------------------------------------------------
// Derived: exact sealed inputs
// ---------------------------------------------------------------------------------------------

function sameDigest(left: unknown, right: unknown): boolean {
  return evidenceDigest(left) === evidenceDigest(right);
}

type CapturePayload = ReturnType<typeof transitionSemanticEventPayloads>[number] & { readonly family: "capture" };

export const createDerivedExchangeCaptureClassV1Evidence = (() => {
  const route = "derived.exchange.capture_class@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ capture: sealed("rules.transition.event.capture@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }], result: "population" }, ({ capture, exchange }: { readonly capture: DeclaredEvidence<unknown>; readonly exchange: DeclaredEvidence<LegalExchangeResult> }) => {
    const operands = capture.payload as CapturePayload;
    const payload = captureClassEvent({ before_fen: operands.before_fen, move_uci: operands.move_uci, after_fen: operands.after_fen, capture: operands as never });
    if (payload === undefined) return Object.freeze([] as DeclaredEvidence<unknown>[]);
    if (!sameDigest(payload.exchange, exchange.payload)) throw new TypeError("Capture-class exchange input is not the exact exchange of this capture");
    return Object.freeze([mint(route, symbol, payload, { capture, exchange }, [capture, exchange])]);
  });
})();

export const createDerivedExchangeTradeCompletedV1Evidence = (() => {
  const route = "derived.exchange.trade_completed@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ first: sealed("rules.transition.event.capture@1"), second: sealed("rules.transition.event.capture@1"), firstMove: sealed("run.record.move@1"), secondMove: sealed("run.record.move@1") }], result: "population" }, ({ first, second, firstMove, secondMove }: { readonly first: DeclaredEvidence<unknown>; readonly second: DeclaredEvidence<unknown>; readonly firstMove: DeclaredEvidence<unknown>; readonly secondMove: DeclaredEvidence<unknown> }) => {
    const a = first.payload as CapturePayload, b = second.payload as CapturePayload;
    if (a.after_fen !== b.before_fen || a.to !== b.to) return Object.freeze([] as DeclaredEvidence<unknown>[]);
    // The recorded-move anchors must be the path anchors of exactly these two capture edges.
    const anchored = (move: DeclaredEvidence<unknown>, capture: CapturePayload): boolean => {
      const context = (move.payload as { readonly context?: unknown }).context as Partial<RecordedMoveAnchor> | undefined;
      return isRecord(context) && context.beforeFen === capture.before_fen && context.moveUci === capture.move_uci && context.afterFen === capture.after_fen;
    };
    if (!anchored(firstMove, a) || !anchored(secondMove, b)) throw new TypeError("Trade completion recorded-move anchors are not the two capture edges");
    const firstContext = (firstMove.payload as { readonly context: RecordedMoveAnchor }).context, secondContext = (secondMove.payload as { readonly context: RecordedMoveAnchor }).context;
    if (firstContext.afterNodeId !== secondContext.beforeNodeId) throw new TypeError("Trade completion recorded moves are not contiguous");
    const payload = Object.freeze({
      startFen: a.before_fen, firstMoveUci: a.move_uci, boundaryFen: a.after_fen, secondMoveUci: b.move_uci, endFen: b.after_fen,
      landingSquare: a.to, first: a, second: b, moveAnchors: Object.freeze([firstMove.payload, secondMove.payload]),
    });
    return Object.freeze([mint(route, symbol, payload, { first, second, firstMove, secondMove }, [first, second, firstMove, secondMove])]);
  });
})();

export const createDerivedTacticDiscoveredExecutedV1Evidence = (() => {
  const route = "derived.tactic.discovered_executed@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ latency: sealed("rules.tactic.reading.discovered_latency@1"), rays: sealedList(0, null, "rules.transition.event.slider_ray@1") }], result: "items" }, ({ latency, rays }: { readonly latency: DeclaredEvidence<{ readonly fen: string }>; readonly rays: readonly DeclaredEvidence<Record<string, unknown>>[] }): readonly DerivedEvidence<unknown>[] => {
    const gained = rays.filter((ray) => ray.payload.sign === "gained");
    if (gained.length === 0) return Object.freeze([]);
    const edge = validEdge({ beforeFen: String(gained[0]!.payload.before_fen), moveUci: String(gained[0]!.payload.move_uci), afterFen: String(gained[0]!.payload.after_fen) });
    if (gained.some((ray) => ray.payload.before_fen !== edge.beforeFen || ray.payload.move_uci !== edge.moveUci || ray.payload.after_fen !== edge.afterFen)) throw new TypeError("Discovered execution rays cross edges");
    if (canonicalFen(positionFromFen(latency.payload.fen)) !== edge.beforeFen) throw new TypeError("Discovered execution latency reading is not the edge's before position");
    const byPayload = new Map(gained.map((ray) => [ray.payload, ray]));
    return Object.freeze(discoveredExecutedEvents(edge.beforeFen, edge.moveUci, edge.afterFen, gained.map((ray) => ray.payload as unknown as GainedSliderRay)).map((payload) => {
      const ray = byPayload.get(payload.gainedRay as unknown as Record<string, unknown>);
      if (ray === undefined) throw new TypeError("Discovered execution lost its exact gained-ray source");
      return Object.freeze({ evidence: mint(route, symbol, payload, { latency, ray }, [latency, ray]), inputs: Object.freeze([latency, ray]) });
    }));
  });
})();

export const createDerivedTacticForkSurvivesReplyV1Evidence = (() => {
  const route = "derived.tactic.fork_survives_reply@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ doubleAttack: sealed("rules.tactic.event.double_attack@1"), breadth: sealed("rules.tactic.consequence.reply_breadth@1") }], result: "single" }, ({ doubleAttack, breadth }: { readonly doubleAttack: DeclaredEvidence<DoubleAttackEvent>; readonly breadth: DeclaredEvidence<ReplyBreadth> }) =>
    mint(route, symbol, forkSurvivesReply(doubleAttack.payload, breadth.payload), { doubleAttack, breadth }, [doubleAttack, breadth]));
})();

export const createDerivedTacticOverloadedDefenderResponseConflictV1Evidence = (() => {
  const route = "derived.tactic.overloaded_defender_response_conflict@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ duties: sealed("rules.tactic.reading.defender_duty_set@1"), capture: sealed("rules.transition.event.capture@1") }], result: "availability" }, ({ duties, capture }: { readonly duties: DeclaredEvidence<{ readonly fen: string }>; readonly capture: DeclaredEvidence<unknown> }): EvidenceAvailability<readonly DeclaredEvidence<unknown>[]> => {
    const captured = capture.payload as CapturePayload;
    const edge = validEdge({ beforeFen: captured.before_fen, moveUci: captured.move_uci, afterFen: captured.after_fen });
    if (canonicalFen(positionFromFen(duties.payload.fen)) !== edge.beforeFen) throw new TypeError("Overload conflict duty reading is not the capture's before position");
    const result = overloadedDefenderResponseConflict(edge.beforeFen, edge.moveUci, edge.afterFen, capture.payload as never);
    if (result.kind === "unavailable") return unavailable(result.reason);
    return available(Object.freeze(result.conflicts.map((conflict) => mint(route, symbol, conflict, { duties, capture }, [duties, capture]))));
  });
})();

/**
 * Self-sourcing edge derivations: the factory computes the declared inputs from the validated edge
 * through the computed factories above, derives the output from them in the same pass, and returns
 * each output with the exact sealed inputs its receipt names.
 */
function edgeDerived<T>(route: string, compute: (edge: EvidenceEdge) => readonly { readonly payload: T; readonly inputs: readonly DeclaredEvidence<unknown>[] }[], options: { readonly dependency?: string } = {}): EvidenceValueFactory<EvidenceEdge, readonly DerivedEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "items", ...(options.dependency === undefined ? {} : { dependency: options.dependency }) }, (input: EvidenceEdge) => {
    const edge = validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    return Object.freeze(compute(edge).map((item) => Object.freeze({ evidence: mint(route, symbol, item.payload, { edge, inputs: item.inputs }, item.inputs), inputs: Object.freeze([...item.inputs]) })));
  });
}

function selectByPayload<T>(items: readonly DeclaredEvidence<T>[], payload: unknown, label: string): DeclaredEvidence<T> {
  const digest = evidenceDigest(payload);
  const found = items.find((item) => evidenceValueReceipt(item).payloadDigest === digest);
  if (found === undefined) throw new TypeError(`${label} input is not in its computed authority population`);
  return found;
}

export const createDerivedPawnEventTransitionsV1Evidence = edgeDerived("derived.pawn.event.transitions@1", (edge) => {
  const contacts = createRulesPawnReadingContactsV1Evidence({ fen: edge.beforeFen });
  return pawnTransitionEvents(edge.beforeFen, edge.moveUci, edge.afterFen).map((payload) => ({ payload, inputs: [contacts] }));
});

export const createDerivedTacticDefenderExposureV1Evidence = edgeDerived("derived.tactic.defender_exposure@1", (edge) => {
  const controls = createRulesSquareEventControlV1Evidence(edge);
  return defenderExposureOperands(edge.beforeFen, edge.moveUci, edge.afterFen).flatMap((payload) => {
    if (payload.kind !== "available") return [];
    const control = selectByPayload(controls, payload.controllerEvent, "Defender exposure controller event");
    const exchanges = payload.captures!.map((capture) => selectByPayload(createRulesExchangePredicateLegalExchangeV1Evidence({ fen: capture.beforeFen, captureUci: capture.captureUci }), capture, "Defender exposure exchange"));
    return [{ payload, inputs: [control, ...exchanges] }];
  });
});

export const createDerivedMaterialEventRoleAsymmetryV1Evidence = edgeDerived("derived.material.event.role_asymmetry@1", (edge) => {
  const material = materialRoleAsymmetryEvent(edge.beforeFen, edge.moveUci, edge.afterFen);
  if (material === undefined) return [];
  const readings = [createDerivedMaterialReadingRoleSignatureV1Evidence({ fen: edge.beforeFen }), createDerivedMaterialReadingRoleSignatureV1Evidence({ fen: edge.afterFen })];
  const families = [...new Set(material.sourceEvents.map((source) => source.family))];
  const authorities = families.flatMap((family) => (TRANSITION_EVENT_FACTORIES as Readonly<Record<string, EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<unknown>[]>>>)[`rules.transition.event.${family}@1`]!(edge));
  return [{ payload: material, inputs: [...readings, ...authorities] }];
});

export const createDerivedKingCapturedZoneDefenderV1Evidence = edgeDerived("derived.king.captured_zone_defender@1", (edge) => {
  const captures = TRANSITION_EVENT_FACTORIES["rules.transition.event.capture@1"](edge);
  if (captures.length === 0) return [];
  const reading = createRulesKingReadingZoneStateV1Evidence({ fen: edge.beforeFen });
  return capturedZoneDefenderOperands(edge.beforeFen, edge.moveUci, edge.afterFen).map((payload) => ({ payload, inputs: [captures[0]!, reading] }));
});

export const createDerivedActivityEventOpenFileOccupancyV1Evidence = edgeDerived("derived.activity.event.open_file_occupancy@1", (edge) => {
  const activity = openFileOccupancyOperands(edge.beforeFen, edge.moveUci, edge.afterFen);
  if (activity === undefined) return [];
  const route = `rules.structural.reading.${activity.sourceReading.kind}@1` as `rules.structural.reading.${StructuralReadingKind}@1`;
  const source = selectByPayload(STRUCTURAL_READING_FACTORIES[route]({ fen: edge.afterFen }), activity.sourceReading, "Open-file occupancy source reading");
  return [{ payload: activity, inputs: [source] }];
});

// Observed sequences: anchors are derived from the sealed recorded-move inputs, never supplied.
function anchorsFromMoves(moves: readonly DeclaredEvidence<unknown>[]): readonly RecordedMoveAnchor[] {
  return Object.freeze(moves.map((move, offset) => {
    const payload = move.payload as { readonly context?: unknown; readonly offset?: unknown };
    const context = payload.context;
    if (payload.offset !== offset || !hasExactKeys(context, ["beforeNodeId", "afterNodeId", "beforeFen", "moveUci", "afterFen"])) throw new TypeError("Observed sequence requires recorded-path run.record.move evidence in offset order");
    return context as RecordedMoveAnchor;
  }));
}

function sequenceFactory<T>(route: string, arm: EvidenceInputArm, compute: (input: Record<string, unknown>, anchors: readonly RecordedMoveAnchor[]) => readonly T[], sources: (input: Record<string, unknown>) => readonly DeclaredEvidence<unknown>[]): EvidenceValueFactory<Record<string, unknown>, readonly DeclaredEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [arm], result: "population", dependency: "recorded-semantic-path", pending: "Recorded moves are validated as a legal contiguous path; durable run.record.edge@1 identity lands with recorded-semantic-path." }, (input: Record<string, unknown>) => {
    const moves = input.moves as readonly DeclaredEvidence<unknown>[];
    const anchors = anchorsFromMoves(moves);
    const inputs = sources(input);
    return Object.freeze(compute(input, anchors).map((payload) => mint(route, symbol, payload, input, inputs)));
  });
}

const MOVES = (count: number, max: number | null = count) => sealedList(count, max, "run.record.move@1");

export const createDerivedPawnSequenceContactTimingV1Evidence = sequenceFactory("derived.pawn.sequence.contact_timing@1", { moves: MOVES(1, null) }, (_input, anchors) => { const payload = pawnContactTimingSequence(anchors); return payload === undefined ? [] : [payload]; }, (input) => input.moves as readonly DeclaredEvidence<unknown>[]);
export const createDerivedPawnSequenceHarassmentPressureV1Evidence = sequenceFactory("derived.pawn.sequence.harassment_pressure@1", { moves: MOVES(2) }, (_input, anchors) => { const payload = harassmentPressureSequence(anchors); return payload === undefined ? [] : [payload]; }, (input) => input.moves as readonly DeclaredEvidence<unknown>[]);
export const createDerivedTacticSequenceDefenderConsequenceV1Evidence = sequenceFactory("derived.tactic.sequence.defender_consequence@1", { moves: MOVES(3) }, (_input, anchors) => defenderConsequenceOperands(anchors), (input) => input.moves as readonly DeclaredEvidence<unknown>[]);
export const createDerivedTacticSquareClearanceObservedV1Evidence = sequenceFactory("derived.tactic.square_clearance_observed@1", { moves: MOVES(3) }, (input, anchors) => { exactSequenceInputs(anchors, input.moves as readonly DeclaredEvidence<unknown>[], 3, [], []); return squareClearanceObservedOperands(anchors); }, (input) => input.moves as readonly DeclaredEvidence<unknown>[]);
export const createDerivedTacticLineBlockerClearanceObservedV1Evidence = sequenceFactory("derived.tactic.line_blocker_clearance_observed@1", { moves: MOVES(3), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  const exchange = input.exchange as DeclaredEvidence<unknown>;
  exactSequenceInputs(anchors, input.moves as readonly DeclaredEvidence<unknown>[], 3, [exchange], ["rules.exchange.predicate.legal_exchange"]);
  return lineBlockerClearanceObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, exchange.payload));
}, (input) => [...(input.moves as readonly DeclaredEvidence<unknown>[]), input.exchange as DeclaredEvidence<unknown>]);
export const createDerivedTacticDeflectionObservedV1Evidence = sequenceFactory("derived.tactic.deflection_observed@1", { moves: MOVES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), captures: sealedList(1, null, "rules.transition.event.capture@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1"), check: optional(sealed("rules.tactic.event.check@1")) }, (input, anchors) => {
  const induction = deflectionObservedInduction(anchors);
  if (induction === undefined) throw new TypeError("Observed deflection has no induction authority");
  const check = input.check as DeclaredEvidence<{ readonly triggeringMove?: string }> | undefined;
  if (induction === "bait_capture" && check !== undefined) throw new TypeError("unnecessary-check");
  if (induction === "check_induced") {
    if (check === undefined) throw new TypeError("missing-check");
    const first = anchors[0]!;
    const expected = createRulesTacticEventCheckV1Evidence({ beforeFen: first.beforeFen, moveUci: first.moveUci, afterFen: first.afterFen });
    if (expected.length !== 1 || evidenceValueReceipt(expected[0]!).payloadDigest !== evidenceValueReceipt(check).payloadDigest) throw new TypeError("crossed-edge-check");
  }
  const exchange = input.exchange as DeclaredEvidence<unknown>;
  const others = [input.duty as DeclaredEvidence<unknown>, ...(input.captures as readonly DeclaredEvidence<unknown>[]), exchange, ...(check === undefined ? [] : [check])];
  exactSequenceInputs(anchors, input.moves as readonly DeclaredEvidence<unknown>[], 3, others, ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange", ...(induction === "check_induced" ? ["rules.tactic.event.check"] : [])]);
  return deflectionObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, exchange.payload));
}, (input) => [...(input.moves as readonly DeclaredEvidence<unknown>[]), input.duty as DeclaredEvidence<unknown>, ...(input.captures as readonly DeclaredEvidence<unknown>[]), input.exchange as DeclaredEvidence<unknown>, ...(input.check === undefined ? [] : [input.check as DeclaredEvidence<unknown>])]);
export const createDerivedTacticAttractionObservedV1Evidence = sequenceFactory("derived.tactic.attraction_observed@1", { moves: MOVES(3, 5), captures: sealedList(1, null, "rules.transition.event.capture@1"), check: optional(sealed("rules.tactic.event.check@1")) }, (input, anchors) => {
  const check = input.check as DeclaredEvidence<unknown> | undefined;
  const payloads = attractionObservedOperands(anchors);
  for (const payload of payloads) if ((payload.checkOrCaptureConsequence.kind === "check") !== (check !== undefined)) throw new TypeError("Observed attraction check authority disagrees with its consequence kind");
  exactSequenceInputs(anchors, input.moves as readonly DeclaredEvidence<unknown>[], anchors.length, [...(input.captures as readonly DeclaredEvidence<unknown>[]), ...(check === undefined ? [] : [check])], ["rules.transition.event.capture", ...(check === undefined ? [] : ["rules.tactic.event.check"])]);
  return payloads;
}, (input) => [...(input.moves as readonly DeclaredEvidence<unknown>[]), ...(input.captures as readonly DeclaredEvidence<unknown>[]), ...(input.check === undefined ? [] : [input.check as DeclaredEvidence<unknown>])]);
export const createDerivedTacticInterferenceObservedV1Evidence = sequenceFactory("derived.tactic.interference_observed@1", { moves: MOVES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  const exchange = input.exchange as DeclaredEvidence<unknown>;
  exactSequenceInputs(anchors, input.moves as readonly DeclaredEvidence<unknown>[], 3, [input.duty as DeclaredEvidence<unknown>, exchange], ["rules.tactic.reading.defender_duty_set", "rules.exchange.predicate.legal_exchange"]);
  return interferenceObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, exchange.payload));
}, (input) => [...(input.moves as readonly DeclaredEvidence<unknown>[]), input.duty as DeclaredEvidence<unknown>, input.exchange as DeclaredEvidence<unknown>]);
export const createDerivedTacticCheckZwischenzugObservedV1Evidence = sequenceFactory("derived.tactic.check_zwischenzug_observed@1", { moves: MOVES(4), capture: sealed("rules.transition.event.capture@1"), check: sealed("rules.tactic.event.check@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  const exchange = input.exchange as DeclaredEvidence<unknown>;
  exactSequenceInputs(anchors, input.moves as readonly DeclaredEvidence<unknown>[], 4, [input.capture as DeclaredEvidence<unknown>, input.check as DeclaredEvidence<unknown>, exchange], ["rules.transition.event.capture", "rules.tactic.event.check", "rules.exchange.predicate.legal_exchange"]);
  return checkZwischenzugObservedOperands(anchors).filter((payload) => sameDigest(payload.retainedRecapture, exchange.payload));
}, (input) => [...(input.moves as readonly DeclaredEvidence<unknown>[]), input.capture as DeclaredEvidence<unknown>, input.check as DeclaredEvidence<unknown>, input.exchange as DeclaredEvidence<unknown>]);
export const createDerivedTacticOverloadExploitationObservedV1Evidence = sequenceFactory("derived.tactic.overload_exploitation_observed@1", { moves: MOVES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), captures: sealedList(3, 3, "rules.transition.event.capture@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  const exchange = input.exchange as DeclaredEvidence<unknown>;
  exactSequenceInputs(anchors, input.moves as readonly DeclaredEvidence<unknown>[], 3, [input.duty as DeclaredEvidence<unknown>, ...(input.captures as readonly DeclaredEvidence<unknown>[]), exchange], ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
  return overloadExploitationObservedOperands(anchors).filter((payload) => sameDigest(payload.secondTargetCapture, exchange.payload));
}, (input) => [...(input.moves as readonly DeclaredEvidence<unknown>[]), input.duty as DeclaredEvidence<unknown>, ...(input.captures as readonly DeclaredEvidence<unknown>[]), input.exchange as DeclaredEvidence<unknown>]);

// Counterfactual absence: computed only from the complete sealed alternative population.
const AVOIDANCE_FAMILIES = Object.freeze([...STRUCTURAL_EVENT_FAMILIES, "loose_piece", "pawn_islands"] as const);
/** One factory per counterfactual-absence family (thirteen). */
export const AVOIDANCE_FACTORIES = Object.freeze(Object.fromEntries(AVOIDANCE_FAMILIES.map((family) => {
  const route = `derived.semantic_avoidance.${family}@1`;
  const symbol = evidenceFactorySymbol(route);
  const source = family === "loose_piece" ? "rules.tactic.event.loose_piece@1" : `rules.structural.event.${family}@1`;
  return [route, factory({ route, symbol, shape: "derived", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN, sign: value("a semantic event sign", isText), events: { kind: "semantic_events", min: 1 } }], result: "single" }, (input: EvidenceEdge & { readonly sign: string; readonly events: readonly SemanticEvidenceEvent[] }) => {
    const edge = validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    const alternatives = legalAlternativeEdges(edge.beforeFen, edge.moveUci);
    const alternativeMoves = new Set(alternatives.map((alternative) => alternative.moveUci));
    const seen = new Set<string>();
    for (const event of input.events) {
      if (`${event.projection.id}@${event.projection.version}` !== source || event.sign !== input.sign) throw new TypeError(`Counterfactual absence ${family} mixes another event family or sign`);
      if (event.anchor.beforeFen !== edge.beforeFen || !alternativeMoves.has(event.anchor.moveUci)) throw new TypeError(`Counterfactual absence ${family} names an edge that is not a legal alternative`);
      if (seen.has(event.anchor.moveUci)) throw new TypeError(`Counterfactual absence ${family} repeats an alternative`);
      seen.add(event.anchor.moveUci);
    }
    const payload: CounterfactualAbsenceOperands = Object.freeze({ relation: "avoided", family: Object.freeze({ projection: input.events[0]!.projection, sign: input.sign as never }), legalAlternatives: alternatives.length, alternativesWithFamily: input.events.length, alternativeEvents: Object.freeze([...input.events]) });
    return mint(route, symbol, payload, { edge, sign: input.sign, events: input.events.map((event) => event.evidence) }, input.events.map((event) => event.evidence));
  })];
})) as Readonly<Record<`derived.semantic_avoidance.${(typeof AVOIDANCE_FAMILIES)[number]}@1`, EvidenceValueFactory<EvidenceEdge & { readonly sign: string; readonly events: readonly SemanticEvidenceEvent[] }, DeclaredEvidence<CounterfactualAbsenceOperands>>>>);

export const createDerivedStructuralPredicateResultV1Evidence = (() => {
  const route = "derived.structural.predicate_result@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ condition: sealed("authored.structural_condition.input@1"), fen: FEN }], result: "single" }, ({ condition, fen }: { readonly condition: DeclaredEvidence<{ readonly expression: Parameters<typeof evaluateStructuralPredicate>[1] }>; readonly fen: string }) =>
    mint(route, symbol, evaluateStructuralPredicate(validFen(fen), condition.payload.expression), { condition, fen }, [condition]));
})();

// ---------------------------------------------------------------------------------------------
// Recorded run projections (source-receipt shape; the recorded run is the receipt stand-in)
// ---------------------------------------------------------------------------------------------

const RUN_PENDING = "The recorded DrillRun is the receipt stand-in; durable run.record.edge@1 identity lands with recorded-semantic-path.";

function runNode(run: DrillRun, nodeId: string): Node {
  const node = run.nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) throw new TypeError(`Recorded run has no node ${nodeId}`);
  return node;
}

export const createRunRecordPositionV1Evidence = (() => {
  const route = "run.record.position@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, nodeId: value("a node id", isText) }], result: "single", dependency: "recorded-semantic-path", pending: RUN_PENDING }, ({ run, nodeId }: { readonly run: DrillRun; readonly nodeId: string }) => {
    const node = runNode(run, nodeId);
    return mint(route, symbol, Object.freeze({ nodeId: node.id, ply: node.ply, fen: node.fen }), { run, nodeId });
  });
})();

function validRecordedPath(path: unknown): readonly RecordedMoveAnchor[] {
  if (!Array.isArray(path) || path.length === 0) throw new TypeError("Recorded path must be a non-empty anchor list");
  const anchors = path.map((anchor) => {
    if (!hasExactKeys(anchor, ["beforeNodeId", "afterNodeId", "beforeFen", "moveUci", "afterFen"])) throw new TypeError("Recorded path anchor has an open shape");
    const value = anchor as RecordedMoveAnchor;
    if (!isText(value.beforeNodeId) || !isText(value.afterNodeId) || value.beforeNodeId === value.afterNodeId) throw new TypeError("Recorded path anchor requires distinct node ids");
    const edge = validEdge({ beforeFen: value.beforeFen, moveUci: value.moveUci, afterFen: value.afterFen });
    if (edge.beforeFen !== value.beforeFen || edge.moveUci !== value.moveUci || edge.afterFen !== value.afterFen) throw new TypeError("Recorded path anchor bytes are not canonical");
    return value;
  });
  for (let index = 1; index < anchors.length; index += 1) if (anchors[index - 1]!.afterNodeId !== anchors[index]!.beforeNodeId || anchors[index - 1]!.afterFen !== anchors[index]!.beforeFen) throw new TypeError("Recorded path has a broken node/FEN boundary");
  return anchors;
}

/**
 * The comparison supplies only its fork node and branch set; every recorded fact is recomputed from
 * the run for that fork and branch. The fork must lie on every compared branch path.
 */
function comparisonFacts(run: DrillRun, comparison: BranchComparison, branchId: string): RecordedBranchFacts {
  if (!comparison.columns.some((column) => column.branchId === branchId)) throw new TypeError(`Comparison has no branch ${branchId}`);
  for (const column of comparison.columns) recordedBranchFacts(run, comparison.forkNodeId, column.branchId);
  return recordedBranchFacts(run, comparison.forkNodeId, branchId);
}

export const createRunRecordMoveV1Evidence = (() => {
  const route = "run.record.move@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }, { path: value("a recorded anchor path", Array.isArray), offset: value("a path offset", Number.isSafeInteger) }], result: "single", dependency: "recorded-semantic-path", pending: RUN_PENDING }, (input: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string } | { readonly path: readonly RecordedMoveAnchor[]; readonly offset: number }) => {
    if ("path" in input) {
      const anchors = validRecordedPath(input.path);
      const anchor = anchors[input.offset];
      if (anchor === undefined) throw new TypeError("Recorded path offset is outside the path");
      return mint(route, symbol, Object.freeze({ context: Object.freeze({ ...anchor }), offset: input.offset, moveSan: anchor.moveUci }), input);
    }
    const facts = comparisonFacts(input.run, input.comparison, input.branchId);
    return mint(route, symbol, Object.freeze({ context: "compare", offset: facts.ownForkOffset, moveSan: facts.decision?.moveSan ?? null }), input);
  });
})();

export const createRunRecordForkV1Evidence = (() => {
  const route = "run.record.fork@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, comparison: COMPARISON }], result: "single", dependency: "recorded-semantic-path", pending: RUN_PENDING }, ({ run, comparison }: { readonly run: DrillRun; readonly comparison: BranchComparison }) => {
    for (const column of comparison.columns) recordedBranchFacts(run, comparison.forkNodeId, column.branchId);
    return mint(route, symbol, Object.freeze({ context: "compare", forkNodeId: comparison.forkNodeId, sharedPly: runNode(run, comparison.forkNodeId).ply }), { run, comparison });
  });
})();

export const createRunRecordCheckpointHitV1Evidence = (() => {
  const route = "run.record.checkpoint_hit@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }], result: "items", dependency: "recorded-semantic-path", pending: RUN_PENDING }, ({ run, comparison, branchId }: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string }): readonly RunEvidenceItem<unknown>[] => {
    return Object.freeze(comparisonFacts(run, comparison, branchId).checkpointHits.map((hit) => Object.freeze({ evidence: mint(route, symbol, Object.freeze({ context: "compare", checkpointId: hit.checkpointId, plyOffset: hit.plyOffset }), { run, comparison, branchId, eventSeq: hit.eventSeq }), nodeId: hit.nodeId, plyOffset: hit.plyOffset })));
  });
})();

export const createRunRecordObjectiveTransitionV1Evidence = (() => {
  const route = "run.record.objective_transition@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }], result: "items", dependency: "recorded-semantic-path", pending: RUN_PENDING }, ({ run, comparison, branchId }: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string }): readonly RunEvidenceItem<unknown>[] => {
    return Object.freeze(comparisonFacts(run, comparison, branchId).objectiveTimeline.map((entry) => Object.freeze({ evidence: mint(route, symbol, Object.freeze({ context: "compare", from: entry.from, to: entry.to }), { run, comparison, branchId, eventSeq: entry.eventSeq }), nodeId: entry.nodeId, plyOffset: entry.plyOffset })));
  });
})();

export const createRunRecordConsequenceV1Evidence = (() => {
  const route = "run.record.consequence@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }, { run: RUN, branchId: value("a branch id", isText) }], result: "items", dependency: "recorded-semantic-path", pending: RUN_PENDING }, (input: { readonly run: DrillRun; readonly comparison?: BranchComparison; readonly branchId: string }): readonly RunEvidenceItem<unknown>[] => {
    if (input.comparison !== undefined) {
      const consequence = comparisonFacts(input.run, input.comparison, input.branchId);
      const leaf = consequence.leafNodeId;
      const payload = consequence.terminal
        ? Object.freeze({ context: "compare", terminal: true, outcome: consequence.outcome })
        : Object.freeze({ context: "compare", terminal: false, plies: consequence.plies, objectiveState: consequence.objectiveState });
      return Object.freeze([Object.freeze({ evidence: mint(route, symbol, payload, input), nodeId: leaf, plyOffset: consequence.plies })]);
    }
    const path = branchPath(input.run, input.branchId);
    const ids = new Set(path.map((node) => node.id));
    const outcome = [...input.run.events].reverse().find((event) => event.type === "outcome.reached" && ids.has(event.data.nodeId));
    if (outcome?.type !== "outcome.reached") return Object.freeze([]);
    const node = runNode(input.run, outcome.data.nodeId);
    return Object.freeze([Object.freeze({ evidence: mint(route, symbol, Object.freeze({ context: "story", terminal: true, outcome: outcome.data.outcome }), input), nodeId: node.id, plyOffset: node.ply })]);
  });
})();

const PGN_RESULT_TOKENS = new Set(["1-0", "0-1", "1/2-1/2"]);
export const createRunRecordImportedResultV1Evidence = (() => {
  const route = "run.record.imported_result@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, branchId: value("a branch id", isText), recordedResult: value("a decisive or drawn PGN result token", (candidate) => typeof candidate === "string" && PGN_RESULT_TOKENS.has(candidate)) }], result: "items", dependency: "recorded-semantic-path", pending: "The imported PGN result token is validated as a closed token; its import-source receipt lands with recorded-semantic-path/import provenance." }, ({ run, branchId, recordedResult }: { readonly run: DrillRun; readonly branchId: string; readonly recordedResult: "1-0" | "0-1" | "1/2-1/2" }): readonly RunEvidenceItem<unknown>[] => {
    const leaf = branchPath(run, branchId).at(-1)!;
    return Object.freeze([Object.freeze({ evidence: mint(route, symbol, Object.freeze({ context: "story", result: recordedResult }), { run, branchId, recordedResult }), nodeId: leaf.id, plyOffset: leaf.ply })]);
  });
})();

export const createRunRecordEvidenceRefResolutionV1Evidence = (() => {
  const route = "run.record.evidence_ref_resolution@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ reference: value("an evidence reference token", isText), pack: optional(value("a drill-pack definition", isRecord)), payloads: optional(value("a reference→payload map", (candidate) => candidate instanceof Map)) }], result: "single" }, (input: { readonly reference: string; readonly pack?: DrillPackDefinition; readonly payloads?: ReadonlyMap<string, EvidencePayload> }): DeclaredEvidence<EvidenceReferenceResolution> => {
    const resolved = resolveEvidenceReference(input.reference, input.pack, input.payloads ?? new Map());
    return mint(route, symbol, Object.freeze({ reference: resolved.reference, text: resolved.text, sourceLabel: resolved.sourceLabel }), input);
  });
})();

// ---------------------------------------------------------------------------------------------
// Derived comparison and story projections
// ---------------------------------------------------------------------------------------------

function scoreCp(score: ComparisonScore): number { return score.kind === "cp" ? score.value : score.movesTo < 0 ? -STORY_MATE_CP : STORY_MATE_CP; }

function verifiedTrail(run: DrillRun, comparison: BranchComparison, branchId: string): readonly ComparisonEvidenceEntry[] {
  const recorded = new Set(comparisonFacts(run, comparison, branchId).evidence.map((entry) => evidenceDigest(entry)));
  const claimed = comparison.evidence[branchId] ?? [];
  for (const entry of claimed) if (!recorded.has(evidenceDigest(entry))) throw new TypeError("Comparison engine entry is not an engine-validated evidence event of the recorded run");
  return claimed;
}

export const createDerivedCompareEngineTrajectoryV1Evidence = (() => {
  const route = "derived.compare.engine_trajectory@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }], result: "population", dependency: "provider-exchange-and-execution", pending: "Recorded engine entries are verified against the run's evidence.attached events; the live exchange receipt lands with provider-exchange-and-execution." }, ({ run, comparison, branchId }: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string }) =>
    Object.freeze(verifiedTrail(run, comparison, branchId).map((entry) => mint(route, symbol, entry, { run, comparison: comparison.forkNodeId, branchId, entry }, [evidenceDigest(entry)]))));
})();

export const createDerivedCompareEvalDeltaV1Evidence = (() => {
  const route = "derived.compare.eval_delta@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }], result: "population", dependency: "provider-exchange-and-execution", pending: "Recorded engine entries are verified against the run's evidence.attached events; the live exchange receipt lands with provider-exchange-and-execution." }, ({ run, comparison, branchId }: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string }) => {
    const trail = [...verifiedTrail(run, comparison, branchId)].sort((left, right) => left.plyOffset - right.plyOffset);
    const result: DeclaredEvidence<unknown>[] = [];
    for (let index = 1; index < trail.length; index += 1) {
      const delta = scoreCp(trail[index]!.score) - scoreCp(trail[index - 1]!.score);
      if (Math.abs(delta) >= STORY_PIVOT_CP) result.push(mint(route, symbol, Object.freeze({ delta, plyOffset: trail[index]!.plyOffset }), { run, branchId, before: trail[index - 1], after: trail[index] }, [evidenceDigest(trail[index - 1]), evidenceDigest(trail[index])]));
    }
    return Object.freeze(result);
  });
})();

export const createDerivedCompareStructureDeltaV1Evidence = (() => {
  const route = "derived.compare.structure_delta@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }], result: "items" }, ({ run, comparison, branchId }: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string }): readonly RunEvidenceItem<unknown>[] => {
    comparisonFacts(run, comparison, branchId);
    return Object.freeze(structureDeltaEntries(run, comparison, branchId, cachedStructuralReading).map((entry) => Object.freeze({ evidence: mint(route, symbol, Object.freeze({ observation: entry.observation }), { run, branchId, nodeId: entry.nodeId }), nodeId: entry.nodeId, plyOffset: entry.plyOffset })));
  });
})();

export const createDerivedComparePieceRouteV1Evidence = (() => {
  const route = "derived.compare.piece_route@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }], result: "population", dependency: "recorded-semantic-path", pending: RUN_PENDING }, ({ run, comparison, branchId }: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string }) => {
    const fork = comparisonFacts(run, comparison, branchId).fork;
    const path = branchPath(run, branchId).filter((node) => node.ply >= fork.ply);
    return Object.freeze(recordedPieceRoutes(path).map((routeValue) => mint(route, symbol, routeValue, { run, branchId })));
  });
})();

export const createDerivedStoryEvalShiftV1Evidence = (() => {
  const route = "derived.story.eval_shift@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, branchId: value("a branch id", isText) }], result: "items", dependency: "provider-exchange-and-execution", pending: "Recorded evaluations come from the run's engine_validated evidence.attached events; the live exchange receipt lands with provider-exchange-and-execution." }, ({ run, branchId }: { readonly run: DrillRun; readonly branchId: string }): readonly RunEvidenceItem<unknown>[] => {
    const path = branchPath(run, branchId);
    const evaluations = path.map((node) => storyEvaluation(run, node));
    const result: RunEvidenceItem<unknown>[] = [];
    for (let index = 1; index < path.length; index += 1) {
      const before = evaluations[index - 1], after = evaluations[index];
      if (before === undefined || after === undefined) continue;
      const delta = after.centipawns - before.centipawns;
      if (Math.abs(delta) < STORY_PIVOT_CP) continue;
      result.push(Object.freeze({ evidence: mint(route, symbol, Object.freeze({ before, after, delta }), { run, branchId, nodeId: path[index]!.id }), nodeId: path[index]!.id, plyOffset: path[index]!.ply }));
    }
    return Object.freeze(result);
  });
})();

export const createDerivedStoryLastLevelV1Evidence = (() => {
  const route = "derived.story.last_level@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, branchId: value("a branch id", isText), recordedResult: value("a PGN result token", (candidate) => typeof candidate === "string" && PGN_RESULT_TOKENS.has(candidate)) }], result: "items", dependency: "provider-exchange-and-execution", pending: "Recorded evaluations come from the run's engine_validated evidence.attached events; the live exchange receipt lands with provider-exchange-and-execution." }, ({ run, branchId, recordedResult }: { readonly run: DrillRun; readonly branchId: string; readonly recordedResult: "1-0" | "0-1" | "1/2-1/2" }): readonly RunEvidenceItem<unknown>[] => {
    const side = run.start.side;
    const lost = (side === "white" && recordedResult === "0-1") || (side === "black" && recordedResult === "1-0");
    if (!lost) return Object.freeze([]);
    const path = branchPath(run, branchId);
    const evaluations = path.map((node) => storyEvaluation(run, node));
    let last = -1;
    for (let index = 0; index < evaluations.length; index += 1) if ((evaluations[index]?.centipawns ?? -101) >= -100) last = index;
    if (last < 0) return Object.freeze([]);
    return Object.freeze([Object.freeze({ evidence: mint(route, symbol, Object.freeze({ recordedResult, evaluation: evaluations[last] }), { run, branchId, recordedResult }), nodeId: path[last]!.id, plyOffset: path[last]!.ply })]);
  });
})();

const MOMENT_KIND_SOURCES: Readonly<Record<string, string>> = Object.freeze({
  irreversibility: "derived.pivotal.irreversibility@1", phase_change: "derived.pivotal.phase_change@1",
  human_divergence: "derived.pivotal.human_divergence@1", option_collapse: "derived.pivotal.option_collapse@1",
  eval_pivot: "derived.story.eval_shift@1", last_level: "derived.story.last_level@1",
  endgame_entry: "rules.endgame.classification@1", shape_span: "theory.shapes.firing@1",
});

export const createDerivedStoryRankV1Evidence = (() => {
  const route = "derived.story.rank@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ moments: value("a Story moment list", Array.isArray) }], result: "single" }, ({ moments }: { readonly moments: readonly StoryMoment[] }) => {
    const sources: DeclaredEvidence<unknown>[] = [];
    for (const moment of moments) {
      const routes = new Set(moment.evidence.map((item) => { assertDeclaredEvidence(item); sources.push(item); return sealedRoute(item); }));
      for (const kind of moment.kinds) {
        const required = kind === "outcome" ? ["run.record.consequence@1", "run.record.imported_result@1"] : [MOMENT_KIND_SOURCES[kind]!];
        if (!required.some((candidate) => routes.has(candidate))) throw new TypeError(`Story moment kind ${kind} has no sealed ${required.join(" | ")} evidence`);
      }
      const shift = moment.evidence.find((item) => sealedRoute(item) === "derived.story.eval_shift@1")?.payload as { readonly before?: unknown; readonly after?: unknown } | undefined;
      if ((moment.evalBefore !== undefined || moment.evalAfter !== undefined) && (shift === undefined || !sameDigest(shift.before, moment.evalBefore) || !sameDigest(shift.after, moment.evalAfter))) throw new TypeError("Story moment evaluations are not its sealed evaluation shift");
    }
    return mint(route, symbol, Object.freeze({ rank: rankStoryMoments(moments) }), { moments: moments.map((moment) => ({ nodeId: moment.nodeId, ply: moment.ply, kinds: moment.kinds, evidence: moment.evidence })) }, sources);
  });
})();

export const createDerivedStoryTitleV1Evidence = (() => {
  const route = "derived.story.title@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ story: value("a Story title input", isRecord), rank: sealed("derived.story.rank@1") }], result: "single" }, ({ story, rank }: { readonly story: StoryTitleInput; readonly rank: DeclaredEvidence<{ readonly rank: readonly string[] }> }) => {
    if (!sameDigest(story.rank, rank.payload.rank)) throw new TypeError("Story title rank is not its sealed rank evidence");
    const title = suggestTitle(story);
    return mint(route, symbol, Object.freeze({ title, rank: story.rank, outcome: story.outcome }), { story: { side: story.side, outcome: story.outcome, rank: story.rank }, rank }, [rank]);
  });
})();

// ---------------------------------------------------------------------------------------------
// Pivotal markers: four exact derived projections
// ---------------------------------------------------------------------------------------------

function pivotalFactory(kind: PivotalKind): EvidenceValueFactory<{ readonly run: DrillRun; readonly branchId: string }, readonly DerivedEvidence<PivotalMarker>[]> {
  const route = `derived.pivotal.${kind}@1`;
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, branchId: value("a branch id", isText) }], result: "items", dependency: kind === "human_divergence" ? "provider-exchange-and-execution" : "recorded-semantic-path", pending: kind === "human_divergence" ? "The Maia distribution is the run's recorded opponent selection; the model exchange receipt lands with provider-exchange-and-execution." : RUN_PENDING }, ({ run, branchId }: { readonly run: DrillRun; readonly branchId: string }) => {
    const path = branchPath(run, branchId);
    const byId = new Map(path.map((node, index) => [node.id, { node, index }]));
    return Object.freeze(pivotalMarkerPayloads(run, branchId).filter((marker) => marker.kind === kind).map((marker) => {
      const located = byId.get(marker.nodeId)!;
      const position = createRunRecordPositionV1Evidence({ run, nodeId: marker.nodeId });
      let inputs: DeclaredEvidence<unknown>[];
      if (kind === "irreversibility") {
        const parent = path[located.index - 1]!;
        const detail = marker.detail as { readonly subkind: string };
        const readings = (TRANSITION_READING_FACTORIES as Readonly<Record<string, EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<unknown>[]>>>)[`rules.transition.reading.move_irreversibility.${detail.subkind}@1`]!({ beforeFen: parent.fen, moveUci: located.node.moveUci!, afterFen: located.node.fen });
        if (readings.length !== 1) throw new TypeError("Irreversibility marker lost its exact transition reading");
        inputs = [readings[0]!, position];
      } else if (kind === "phase_change") {
        inputs = [createRulesPhaseReadingV2Evidence({ fen: located.node.fen }), position];
      } else if (kind === "human_divergence") {
        inputs = [createHumanMaiaPolicyV1Evidence({ run, nodeId: marker.nodeId }), position];
      } else {
        inputs = [createRulesMobilityReadingLegalMovesV1Evidence({ fen: located.node.fen }), position];
      }
      return Object.freeze({ evidence: mint(route, symbol, marker, { run, branchId, nodeId: marker.nodeId }, inputs), inputs: Object.freeze(inputs) });
    }));
  });
}

// ---------------------------------------------------------------------------------------------
// Source receipts: provider, model, corpus and ledger responses
// ---------------------------------------------------------------------------------------------

const PROVIDER_PENDING = "The typed response bytes are shape-checked and digested; the accepted exchange receipt (request/subject/provider/occurrence) lands with provider-exchange-and-execution.";

function packetFactory(route: string, accepts: (packet: EvidencePayload) => boolean, project: (packet: EvidencePayload) => unknown = (packet) => packet): EvidenceValueFactory<{ readonly packet: EvidencePayload }, DeclaredEvidence<unknown>> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ packet: value("an attached evidence packet of this projection's kind/source", (candidate) => hasExactKeys(candidate, ["kind", "source", "values"]) && isRecord((candidate as EvidencePayload).values) && accepts(candidate as EvidencePayload)) }], result: "single", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, ({ packet }: { readonly packet: EvidencePayload }) =>
    mint(route, symbol, project(packet), { packet }, [evidenceDigest(packet)]));
}

const isModel = (packet: EvidencePayload): boolean => packet.source === "human_model_predicted";
export const createLiveStockfishEvalV1Evidence = packetFactory("live.stockfish.eval@1", (packet) => packet.kind === "eval" && !isModel(packet));
export const createLiveStockfishWdlV1Evidence = packetFactory("live.stockfish.wdl@1", (packet) => packet.kind === "wdl" && !isModel(packet));
export const createLiveStockfishPvV1Evidence = packetFactory("live.stockfish.pv@1", (packet) => packet.kind === "bestline" && !isModel(packet));
export const createLiveSyzygyResultV1Evidence = packetFactory("live.syzygy.result@1", (packet) => packet.kind === "tablebase" && !isModel(packet));
export const createLiveSyzygyCategoryV1Evidence = packetFactory("live.syzygy.category@1", (packet) => packet.kind === "tablebase" && !isModel(packet) && "category" in packet.values, (packet) => packet.values);
export const createLiveSyzygyDistanceV1Evidence = packetFactory("live.syzygy.distance@1", (packet) => packet.kind === "tablebase" && !isModel(packet) && "category" in packet.values, (packet) => packet.values);
export const createHumanMaiaEventV1Evidence = packetFactory("human.maia.event@1", isModel);

function linesFactory(route: string): EvidenceValueFactory<{ readonly lines: readonly string[] }, DeclaredEvidence<readonly string[]>> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ lines: value("a UCI response line list", (candidate) => Array.isArray(candidate) && candidate.every((line) => typeof line === "string")) }], result: "single", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, ({ lines }: { readonly lines: readonly string[] }) =>
    mint(route, symbol, Object.freeze([...lines]), { lines }, [evidenceDigest(lines)]));
}
export const createLiveStockfishUciResponseV1Evidence = linesFactory("live.stockfish.uci_response@1");
export const createHumanMaiaUciResponseV1Evidence = linesFactory("human.maia.uci_response@1");

export const createLiveSyzygyProbeResultV1Evidence = (() => {
  const route = "live.syzygy.probe_result@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ position: value("a tablebase probe { category, moves }", (candidate) => isRecord(candidate) && "category" in candidate && Array.isArray(candidate.moves)) }], result: "single", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, ({ position }: { readonly position: Readonly<Record<string, unknown>> }) =>
    mint(route, symbol, position, { position }, [evidenceDigest(position)]));
})();

const isHumanSplitPage = (candidate: unknown): boolean => hasExactKeys(candidate, ["nodeId", "engine", "targetElo", "candidates"]) && isText((candidate as { nodeId: unknown }).nodeId) && Array.isArray((candidate as { candidates: unknown }).candidates);
export const createHumanMaiaPolicyV1Evidence = (() => {
  const route = "human.maia.policy@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ page: value("a HumanSplitPage", isHumanSplitPage) }, { run: RUN, nodeId: value("a node id", isText) }], result: "single", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, (input: { readonly page: Readonly<Record<string, unknown>> } | { readonly run: DrillRun; readonly nodeId: string }) => {
    if ("page" in input) return mint(route, symbol, input.page, input, [evidenceDigest(input.page)]);
    const event = [...input.run.events].reverse().find((candidate) => candidate.type === "opponent.move_selected" && candidate.data.nodeId === input.nodeId);
    if (event?.type !== "opponent.move_selected" || event.data.selection.candidates === undefined) throw new TypeError(`Recorded run has no human-model selection at ${input.nodeId}`);
    const page = Object.freeze({ nodeId: input.nodeId, engine: event.data.selection.engine, targetElo: input.run.opponentPolicy.targetElo ?? null, candidates: event.data.selection.candidates });
    return mint(route, symbol, page, { run: input.run, nodeId: input.nodeId, eventSeq: event.seq }, [evidenceDigest(page)]);
  });
})();

export const createHumanMaiaCandidateWdlV1Evidence = (() => {
  const route = "human.maia.candidate_wdl@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ page: value("a HumanSplitPage", isHumanSplitPage) }], result: "availability", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, ({ page }: { readonly page: { readonly nodeId: string; readonly engine: object; readonly targetElo: number | null; readonly candidates: readonly { readonly moveUci: string; readonly rank: number; readonly wdl?: Readonly<{ win: number; draw: number; loss: number }> }[] } }): EvidenceAvailability<DeclaredEvidence<unknown>> => {
    const candidates = page.candidates.flatMap((candidate) => candidate.wdl === undefined ? [] : [Object.freeze({ moveUci: candidate.moveUci, rank: candidate.rank, wdl: candidate.wdl })]);
    if (candidates.length === 0) return unavailable("empty_population");
    return available(mint(route, symbol, Object.freeze({ nodeId: page.nodeId, engine: page.engine, targetElo: page.targetElo, candidates: Object.freeze(candidates) }), { page }, [evidenceDigest(page)]));
  });
})();

export const createHumanExplorerPopulationV1Evidence = (() => {
  const route = "human.explorer.population@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ page: value("a CorpusPage", (candidate) => hasExactKeys(candidate, ["nodeId", "result", "committedMoveSan"]) && isRecord((candidate as { result: unknown }).result)) }], result: "single", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, ({ page }: { readonly page: Readonly<Record<string, unknown>> }) =>
    mint(route, symbol, page, { page }, [evidenceDigest(page)]));
})();

export const createHumanExplorerPositionStatsV1Evidence = (() => {
  const route = "human.explorer.position_stats@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ result: value("a CorpusResult", (candidate) => isRecord(candidate) && (candidate.kind === "stats" || candidate.kind === "abstention") && "population" in candidate) }], result: "single", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, ({ result }: { readonly result: Readonly<Record<string, unknown>> }) =>
    mint(route, symbol, result, { result }, [evidenceDigest(result)]));
})();

const LEDGER_PENDING = "The validated sourcing-ledger record is shape-checked and digested; its durable ledger receipt lands with provider-exchange-and-execution.";
function ledgerFactory(route: string, kind: string, keys: readonly string[]): EvidenceValueFactory<{ readonly record: SourcingLedgerRecord }, DeclaredEvidence<SourcingLedgerRecord>> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: route.startsWith("theory.") ? "authored_authority" : "source_receipt", arms: [{ record: value(`a ${kind} sourcing-ledger record`, (candidate) => isRecord(candidate) && candidate.kind === kind && keys.every((key) => key in candidate) && isText(candidate.sourceId) && isText(candidate.retrievedAt)) }], result: "single", dependency: "provider-exchange-and-execution", pending: LEDGER_PENDING }, ({ record }: { readonly record: SourcingLedgerRecord }) =>
    mint(route, symbol, record, { record }, [evidenceDigest(record)]));
}
export const createSourcingLedgerEngineEvalV1Evidence = ledgerFactory("sourcing.ledger.engine_eval@1", "engine_eval", ["kind", "sourceId", "retrievedAt", "values"]);
export const createSourcingLedgerTablebaseResultV1Evidence = ledgerFactory("sourcing.ledger.tablebase_result@1", "tablebase_result", ["kind", "sourceId", "retrievedAt", "values"]);
export const createSourcingLedgerExplorerPositionCensusV1Evidence = ledgerFactory("sourcing.ledger.explorer_position_census@1", "explorer_position_census", ["kind", "sourceId", "retrievedAt", "values"]);
export const createSourcingLedgerCitableTextV1Evidence = ledgerFactory("sourcing.ledger.citable_text@1", "citable_text", ["kind", "sourceId", "retrievedAt", "values", "supports"]);
export const createTheoryOpeningIdentityRecordV1Evidence = ledgerFactory("theory.opening_identity.record@1", "opening_identity", ["kind", "sourceId", "retrievedAt", "values"]);

/** [[D2327]]: the runtime reading is derived from the exact same-record ledger evidence only. */
function recordedFactory(route: string, source: string): EvidenceValueFactory<{ readonly ledger: DeclaredEvidence<SourcingLedgerRecord> }, EvidenceAvailability<DeclaredEvidence<unknown>>> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ ledger: sealed(source) }], result: "availability", dependency: "provider-exchange-and-execution", pending: LEDGER_PENDING }, ({ ledger }: { readonly ledger: DeclaredEvidence<SourcingLedgerRecord> }) => {
    const reading = recordedReadingFromLedgerRecord(ledger.payload);
    return reading === undefined ? unavailable("ledger_record_not_admitted") : available(mint(route, symbol, reading, { ledger }, [ledger]));
  });
}
export const createRecordedEngineEvalV1Evidence = recordedFactory("recorded.engine.eval@1", "sourcing.ledger.engine_eval@1");
export const createRecordedTablebaseResultV1Evidence = recordedFactory("recorded.tablebase.result@1", "sourcing.ledger.tablebase_result@1");

// ---------------------------------------------------------------------------------------------
// Authored/theory authority
// ---------------------------------------------------------------------------------------------

const AUTHORED_PENDING = "Projects only fields present in the supplied authored record; the registered document digest/pointer receipt lands with registered authored provenance.";
const PACK_PHASES = new Set(["opening", "middlegame", "endgame", "cross_phase"]);

export const createPackAuthoredPhaseV1Evidence = (() => {
  const route = "pack.authored.phase@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ pack: value("a drill-pack definition with a pack phase", (candidate) => isRecord(candidate) && PACK_PHASES.has(String(candidate.phase))) }], result: "single", dependency: "registered-authored-provenance", pending: AUTHORED_PENDING }, ({ pack }: { readonly pack: DrillPackDefinition }) =>
    mint(route, symbol, pack.phase, { pack: { id: pack.id, phase: pack.phase } }, [evidenceDigest({ pack: pack.id, phase: pack.phase })]));
})();

/** Structural shape of one server authored-feedback page item. */
export interface AuthoredFeedbackItemRecord {
  readonly kind: string;
  readonly id: string;
  readonly text?: string;
  readonly note?: string;
  readonly description?: string;
  readonly label?: string;
  readonly revealedBy: { readonly kind: string; readonly eventSeq: number };
}

function authoredText(item: AuthoredFeedbackItemRecord): string | undefined {
  if (item.kind === "annotation") return item.text;
  if (item.kind === "deviation") return item.note;
  if (item.kind === "plan_class") return item.description ?? item.label;
  return undefined;
}

export const createPackAuthoredClaimV1Evidence = (() => {
  const route = "pack.authored.claim@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ item: value("an authored-feedback item", (candidate) => isRecord(candidate) && isText(candidate.kind) && isText(candidate.id) && isRecord(candidate.revealedBy)) }], result: "population", dependency: "registered-authored-provenance", pending: AUTHORED_PENDING }, ({ item }: { readonly item: AuthoredFeedbackItemRecord }) => {
    const text = authoredText(item);
    if (text === undefined) return Object.freeze([] as DeclaredEvidence<unknown>[]);
    return Object.freeze([mint(route, symbol, Object.freeze({ id: item.id, text, attribution: `authored:${item.revealedBy.kind}:${item.revealedBy.eventSeq}` }), { item }, [evidenceDigest(item)])]);
  });
})();

const CLAIM_BINDINGS = new Set(["ledger_bound", "author_attributed", "self_declared"]);
/** The exact server delivery-sheet claim item keys; any caller-added prose field is refused. */
const CLAIM_ITEM_KEYS = new Set(["kind", "id", "revealedBy", "anchor", "text", "evidenceTypes", "earnedEvidenceTypes", "binding", "authorSpans", "principles"]);
export const createPackAuthoredClaimDeliveryV1Evidence = (() => {
  const route = "pack.authored.claim_delivery@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ item: value("a closed delivery-sheet claim item", (candidate) => isRecord(candidate) && Object.keys(candidate).every((key) => CLAIM_ITEM_KEYS.has(key)) && candidate.kind === "claim" && isText(candidate.id) && isText(candidate.text) && Array.isArray(candidate.evidenceTypes) && Array.isArray(candidate.earnedEvidenceTypes) && CLAIM_BINDINGS.has(String(candidate.binding)) && Array.isArray(candidate.principles)) }], result: "single", dependency: "registered-authored-provenance", pending: AUTHORED_PENDING }, ({ item }: { readonly item: { readonly evidenceTypes: readonly string[]; readonly earnedEvidenceTypes: readonly string[] } & Readonly<Record<string, unknown>> }) => {
    if (item.earnedEvidenceTypes.some((type) => !item.evidenceTypes.includes(type))) throw new TypeError("Claim delivery earns evidence it does not declare");
    return mint(route, symbol, item, { item }, [evidenceDigest(item)]);
  });
})();

export const createAuthoredStructuralConditionInputV1Evidence = (() => {
  const route = "authored.structural_condition.input@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ source: value("pack | shape", (candidate) => candidate === "pack" || candidate === "shape"), documentId: value("a document id", isText), pointer: value("a document pointer", isText), expression: value("a StructuralExpression", isRecord) }], result: "single", dependency: "registered-authored-provenance", pending: AUTHORED_PENDING }, (input: { readonly source: "pack" | "shape"; readonly documentId: string; readonly pointer: string; readonly expression: Readonly<Record<string, unknown>> }) =>
    mint(route, symbol, Object.freeze({ source: input.source, documentId: input.documentId, pointer: input.pointer, expression: input.expression }), input, [evidenceDigest({ documentId: input.documentId, pointer: input.pointer })]));
})();

export const createTheoryShapesFiringV1Evidence = (() => {
  const route = "theory.shapes.firing@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ entries: value("registered shape trigger records", (candidate) => Array.isArray(candidate) && candidate.every((entry) => isRecord(entry) && isText(entry.id) && isRecord(entry.trigger))), path: value("a recorded { id, fen } path", (candidate) => Array.isArray(candidate) && candidate.every((node) => isRecord(node) && isText(node.id) && typeof node.fen === "string")) }], result: "population", dependency: "registered-authored-provenance", pending: AUTHORED_PENDING }, ({ entries, path }: { readonly entries: readonly ShapeTriggerSource[]; readonly path: readonly { readonly id: string; readonly fen: string }[] }) => {
    const nodes = path.map((node) => Object.freeze({ id: node.id, fen: validFen(node.fen) }));
    return Object.freeze(shapeFirings(entries, nodes).map((firing) => mint(route, symbol, firing, { entries: entries.map((entry) => entry.id), path: nodes }, [evidenceDigest(entries.find((entry) => entry.id === firing.entryId))])));
  });
})();

export const createTheoryEndgameSetupMatchV1Evidence = (() => {
  const route = "theory.endgame.setup_match@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN, convention: value("a versioned setup convention ref", (candidate) => hasExactKeys(candidate, ["id", "version"])) }], result: "availability", dependency: "semantic-convention-provenance", pending: "No registered, cited and versioned Lucena/Philidor/Vancura setup convention exists; every request is honest-unavailable and no setup sentence can render." }, ({ fen, convention }: { readonly fen: string; readonly convention: VersionedEvidenceId }): EvidenceAvailability<DeclaredEvidence<unknown>> => {
    validFen(fen);
    return unavailable(`setup_convention_unregistered:${convention.id}@${convention.version}`, "semantic-convention-provenance");
  });
})();

// ---------------------------------------------------------------------------------------------
// No-route projections gaining factories (§4): unavailable until their upstream authority lands
// ---------------------------------------------------------------------------------------------

const GRADE_CONTEXTS: ReadonlySet<unknown> = new Set(["drill", "review", "imported_analysis"]);
const isGradeSide = (candidate: unknown): candidate is GradeSide => candidate === "white" || candidate === "black";

/**
 * rfc/move-quality-grades.md D1 / rfc/review-map.md §3: the single production caller of the shipped
 * grader. It grades one move from two sealed evaluation readings of the positions before and after it,
 * from the mover's side, under the context's ladder. Below threshold it emits nothing ("good is the
 * absence of a grade"); an abstention is returned as an unavailable reason, never as a class.
 */
export const createDerivedGradeMoveQualityV1Evidence = (() => {
  const route = "derived.grade.move_quality@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ before: sealed("recorded.engine.eval@1", "live.stockfish.eval@1"), after: sealed("recorded.engine.eval@1", "live.stockfish.eval@1"), mover: value("the moving side", isGradeSide), context: value("a grade context", (candidate) => GRADE_CONTEXTS.has(candidate)) }], result: "availability", dependency: "provider-exchange-and-execution", pending: "Paired-instrument identity (engine id, lane, requested search limit) is checked value-for-value from the two sealed readings; the provider exchange receipt that would attest each request lands with provider-exchange-and-execution." }, ({ before, after, mover, context }: { readonly before: DeclaredEvidence<unknown>; readonly after: DeclaredEvidence<unknown>; readonly mover: GradeSide; readonly context: GradeContext }): EvidenceAvailability<readonly DeclaredEvidence<MoveQualityGrade>[]> => {
    const result = moveQualityGrade(gradeReadingFromPayload(before.payload, mover), gradeReadingFromPayload(after.payload, mover === "white" ? "black" : "white"), context, mover);
    if (result === undefined) return available(Object.freeze([]));
    if ("abstained" in result) return unavailable(result.reason);
    return available(Object.freeze([mint(route, symbol, result, { mover, context }, [before, after])]));
  });
})();

export const createTheoryOpeningCurrentEndpointV1Evidence = (() => {
  const route = "theory.opening.current_endpoint@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ fen: FEN }], result: "availability", dependency: "runtime-opening-identity", pending: "The pinned opening catalogue artifact is server-resident; its runtime authority lands with runtime-opening-identity." }, ({ fen }: { readonly fen: string }): EvidenceAvailability<DeclaredEvidence<unknown>> => { validFen(fen); return unavailable("artifact_missing", "runtime-opening-identity"); });
})();

export const createTheoryOpeningCatalogueMembershipV1Evidence = (() => {
  const route = "theory.opening.catalogue_membership@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ fen: FEN }], result: "availability", dependency: "runtime-opening-identity", pending: "The pinned opening catalogue artifact is server-resident; its runtime authority lands with runtime-opening-identity." }, ({ fen }: { readonly fen: string }): EvidenceAvailability<DeclaredEvidence<unknown>> => { validFen(fen); return unavailable("artifact_missing", "runtime-opening-identity"); });
})();

export const createDerivedOpeningDeepestReachedV1Evidence = (() => {
  const route = "derived.opening.deepest_reached@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, branchId: value("a branch id", isText) }], result: "availability", dependency: "runtime-opening-identity", pending: "Requires theory.opening.current_endpoint@1, which is unavailable in runtime." }, (): EvidenceAvailability<DeclaredEvidence<unknown>> => unavailable("input_abstained", "runtime-opening-identity"));
})();

// ---------------------------------------------------------------------------------------------
// Opponent candidate feature vector
// ---------------------------------------------------------------------------------------------

export const createDerivedOpponentCandidateFeatureVectorV1Evidence = (() => {
  const route = "derived.opponent.candidate_feature_vector@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ beforeFen: FEN, engine: value("a fixed-bound engine identity", isRecord), candidates: value("a candidate list", Array.isArray) }], result: "single", dependency: "provider-exchange-and-execution", pending: "Candidate scores are the bounded Stockfish reading supplied with the request; the exchange receipt lands with provider-exchange-and-execution. Collector results are recomputed by their factories." }, (input: { readonly beforeFen: string; readonly engine: SelectionEngineIdentity; readonly candidates: readonly CandidateFeatureInput[] }): DeclaredEvidence<CandidateFeatureVector> => {
    const built = candidateCollectorResults(input, COLLECTOR_FACTORIES);
    return mint(route, symbol, built.vector, { beforeFen: input.beforeFen, engine: input.engine, candidates: input.candidates }, built.sources);
  });
})();

/** Collector factories the candidate vector recomputes on each hypothetical child. */
const COLLECTOR_FACTORIES = Object.freeze({
  exchange: (fen: string, moveUci: string) => createRulesExchangePredicateLegalExchangeV1Evidence({ fen, captureUci: moveUci }),
  forkSurvival: (doubleAttack: DeclaredEvidence<DoubleAttackEvent>, edge: EvidenceEdge) => createDerivedTacticForkSurvivesReplyV1Evidence({ doubleAttack, breadth: createRulesTacticConsequenceReplyBreadthV1Evidence(edge) }),
});
export type CandidateCollectorFactories = typeof COLLECTOR_FACTORIES;

// ---------------------------------------------------------------------------------------------
// Recorded semantic path (rfc/recorded-semantic-path): run.record.edge@1 and the eleven v2
// successors derived from exact sealed edges.
// ---------------------------------------------------------------------------------------------

export const createRunRecordEdgeV1Evidence = (() => {
  const route = "run.record.edge@1";
  const symbol = evidenceFactorySymbol(route);
  if (symbol !== RECORDED_EDGE_FACTORY) throw new TypeError("run.record.edge@1 factory symbol drifted from its assertion");
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, parent: value("an actual run node", isRecord), child: value("an actual run node", isRecord) }], result: "single" }, ({ run, parent, child }: { readonly run: DrillRun; readonly parent: Node; readonly child: Node }): DeclaredEvidence<RecordedEdge> =>
    mint(route, symbol, recordedEdgePayload(run, parent, child), { run, parentId: parent.id, childId: child.id }));
})();

const EDGES = (min: number, max: number | null = min) => sealedList(min, max, "run.record.edge@1");
const RECORDED_PENDING = "Exact run.record.edge@1 lineage is sealed; convention closure for the detector conventions lands with semantic-convention-provenance.";

function recordedSequenceFactory<T>(route: string, arm: EvidenceInputArm, compute: (input: Record<string, unknown>, anchors: readonly RecordedMoveAnchor[]) => readonly T[], sources: (input: Record<string, unknown>) => readonly DeclaredEvidence<unknown>[]): EvidenceValueFactory<Record<string, unknown>, readonly DeclaredEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [arm], result: "population", dependency: "semantic-convention-provenance", pending: RECORDED_PENDING }, (input: Record<string, unknown>) => {
    const anchors = recordedEdgeAnchors(input.edges as readonly DeclaredEvidence<unknown>[]);
    const inputs = sources(input);
    return Object.freeze(compute(input, anchors).map((payload) => mint(route, symbol, payload, input, inputs)));
  });
}

const edgesOf = (input: Record<string, unknown>) => input.edges as readonly DeclaredEvidence<unknown>[];
const others = (input: Record<string, unknown>, ...keys: string[]) => keys.flatMap((key) => input[key] === undefined ? [] : Array.isArray(input[key]) ? input[key] as readonly DeclaredEvidence<unknown>[] : [input[key] as DeclaredEvidence<unknown>]);

export const createDerivedExchangeTradeCompletedV2Evidence = (() => {
  const route = "derived.exchange.trade_completed@2";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ first: sealed("rules.transition.event.capture@1"), second: sealed("rules.transition.event.capture@1"), firstEdge: sealed("run.record.edge@1"), secondEdge: sealed("run.record.edge@1") }], result: "population", dependency: "semantic-convention-provenance", pending: RECORDED_PENDING }, ({ first, second, firstEdge, secondEdge }: { readonly first: DeclaredEvidence<unknown>; readonly second: DeclaredEvidence<unknown>; readonly firstEdge: DeclaredEvidence<unknown>; readonly secondEdge: DeclaredEvidence<unknown> }) => {
    const a = first.payload as CapturePayload, b = second.payload as CapturePayload;
    const [left, right] = [firstEdge.payload as RecordedEdge, secondEdge.payload as RecordedEdge];
    recordedEdgeAnchors([firstEdge, secondEdge]);
    if (a.after_fen !== b.before_fen || a.to !== b.to || a.before_fen !== left.beforeFen || a.move_uci !== left.moveUci || b.before_fen !== right.beforeFen || b.move_uci !== right.moveUci) return Object.freeze([] as DeclaredEvidence<unknown>[]);
    const payload = Object.freeze({
      startFen: a.before_fen, firstMoveUci: a.move_uci, boundaryFen: a.after_fen, secondMoveUci: b.move_uci, endFen: b.after_fen,
      landingSquare: a.to, first: a, second: b, moveAnchors: Object.freeze([left, right]),
    });
    return Object.freeze([mint(route, symbol, payload, { first, second, firstEdge, secondEdge }, [first, second, firstEdge, secondEdge])]);
  });
})();

export const createDerivedPawnSequenceContactTimingV2Evidence = recordedSequenceFactory("derived.pawn.sequence.contact_timing@2", { edges: EDGES(1, null) }, (_input, anchors) => { const payload = pawnContactTimingSequence(anchors); return payload === undefined ? [] : [payload]; }, edgesOf);
export const createDerivedPawnSequenceHarassmentPressureV2Evidence = recordedSequenceFactory("derived.pawn.sequence.harassment_pressure@2", { edges: EDGES(2) }, (_input, anchors) => { const payload = harassmentPressureSequence(anchors); return payload === undefined ? [] : [payload]; }, edgesOf);
export const createDerivedTacticSequenceDefenderConsequenceV2Evidence = recordedSequenceFactory("derived.tactic.sequence.defender_consequence@2", { edges: EDGES(3) }, (_input, anchors) => defenderConsequenceOperands(anchors), edgesOf);
export const createDerivedTacticSquareClearanceObservedV2Evidence = recordedSequenceFactory("derived.tactic.square_clearance_observed@2", { edges: EDGES(3) }, (_input, anchors) => squareClearanceObservedOperands(anchors), edgesOf);
export const createDerivedTacticLineBlockerClearanceObservedV2Evidence = recordedSequenceFactory("derived.tactic.line_blocker_clearance_observed@2", { edges: EDGES(3), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  exactRecordedSequenceInputs(anchors, edgesOf(input), 3, others(input, "exchange"), ["rules.exchange.predicate.legal_exchange"]);
  return lineBlockerClearanceObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "exchange")]);
export const createDerivedTacticDeflectionObservedV2Evidence = recordedSequenceFactory("derived.tactic.deflection_observed@2", { edges: EDGES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), captures: sealedList(1, null, "rules.transition.event.capture@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1"), check: optional(sealed("rules.tactic.event.check@1")) }, (input, anchors) => {
  const induction = deflectionObservedInduction(anchors);
  if (induction === undefined) throw new TypeError("Observed deflection has no induction authority");
  if ((induction === "check_induced") !== (input.check !== undefined)) throw new TypeError("Recorded deflection check authority disagrees with its induction arm");
  exactRecordedSequenceInputs(anchors, edgesOf(input), 3, others(input, "duty", "captures", "exchange", "check"), ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange", ...(induction === "check_induced" ? ["rules.tactic.event.check"] : [])]);
  return deflectionObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "duty", "captures", "exchange", "check")]);
export const createDerivedTacticAttractionObservedV2Evidence = recordedSequenceFactory("derived.tactic.attraction_observed@2", { edges: EDGES(3, 5), captures: sealedList(1, null, "rules.transition.event.capture@1"), check: optional(sealed("rules.tactic.event.check@1")) }, (input, anchors) => {
  const payloads = attractionObservedOperands(anchors);
  for (const payload of payloads) if ((payload.checkOrCaptureConsequence.kind === "check") !== (input.check !== undefined)) throw new TypeError("Observed attraction check authority disagrees with its consequence kind");
  exactRecordedSequenceInputs(anchors, edgesOf(input), anchors.length, others(input, "captures", "check"), ["rules.transition.event.capture", ...(input.check === undefined ? [] : ["rules.tactic.event.check"])]);
  return payloads;
}, (input) => [...edgesOf(input), ...others(input, "captures", "check")]);
export const createDerivedTacticInterferenceObservedV2Evidence = recordedSequenceFactory("derived.tactic.interference_observed@2", { edges: EDGES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  exactRecordedSequenceInputs(anchors, edgesOf(input), 3, others(input, "duty", "exchange"), ["rules.tactic.reading.defender_duty_set", "rules.exchange.predicate.legal_exchange"]);
  return interferenceObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "duty", "exchange")]);
export const createDerivedTacticCheckZwischenzugObservedV2Evidence = recordedSequenceFactory("derived.tactic.check_zwischenzug_observed@2", { edges: EDGES(4), capture: sealed("rules.transition.event.capture@1"), check: sealed("rules.tactic.event.check@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  exactRecordedSequenceInputs(anchors, edgesOf(input), 4, others(input, "capture", "check", "exchange"), ["rules.transition.event.capture", "rules.tactic.event.check", "rules.exchange.predicate.legal_exchange"]);
  return checkZwischenzugObservedOperands(anchors).filter((payload) => sameDigest(payload.retainedRecapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "capture", "check", "exchange")]);
export const createDerivedTacticOverloadExploitationObservedV2Evidence = recordedSequenceFactory("derived.tactic.overload_exploitation_observed@2", { edges: EDGES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), captures: sealedList(3, 3, "rules.transition.event.capture@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  exactRecordedSequenceInputs(anchors, edgesOf(input), 3, others(input, "duty", "captures", "exchange"), ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
  return overloadExploitationObservedOperands(anchors).filter((payload) => sameDigest(payload.secondTargetCapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "duty", "captures", "exchange")]);

export const createTheoryEndgameMethodStageV1Evidence = (() => {
  const route = "theory.endgame.method_stage@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ setup: sealed("theory.endgame.setup_match@1"), edges: EDGES(1, null), convention: value("a versioned method convention ref", (candidate) => hasExactKeys(candidate, ["id", "version"])) }], result: "availability", dependency: "semantic-convention-provenance", pending: "No registered, cited and versioned method convention (or setup convention) exists; every request is honest-unavailable and no Lucena/Philidor/Vančura stage can render." }, ({ edges, convention }: { readonly setup: DeclaredEvidence<unknown>; readonly edges: readonly DeclaredEvidence<unknown>[]; readonly convention: VersionedEvidenceId }): EvidenceAvailability<readonly DeclaredEvidence<unknown>[]> => {
    recordedEdgeAnchors(edges);
    return unavailable(`method_convention_unregistered:${convention.id}@${convention.version}`, "semantic-convention-provenance");
  });
})();

// Pivotal factories are defined last: they reuse the reading and source factories above.
export const createDerivedPivotalIrreversibilityV1Evidence = pivotalFactory("irreversibility");
export const createDerivedPivotalPhaseChangeV1Evidence = pivotalFactory("phase_change");
export const createDerivedPivotalHumanDivergenceV1Evidence = pivotalFactory("human_divergence");
export const createDerivedPivotalOptionCollapseV1Evidence = pivotalFactory("option_collapse");
