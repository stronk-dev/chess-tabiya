import { SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS } from "./semantic-validation.js";
import { isFoundationDetailKind } from "./foundation-snapshot-detail.js";
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
import { canonicalizeJson, STRUCTURAL_FEATURE_KINDS, assertLegacyStructuralExpression, assertStructuralConventionSelection, type StructuralConventionKind, type DrillPackDefinition, type StructuralFeature } from "@chess-tabiya/schema/drill-pack";
import { castlingSide, normalizeMove } from "chessops/chess";
import { kingCastlesTo, parseSquare, parseUci } from "chessops/util";
import type { SquareName } from "chessops/types";
import type { FoundationPositionTuple } from "./foundation-position-cells.js";
import { candidateOutcomePlayedRow, candidateOutcomeFoundationId, readCandidateOutcomeSources, type CandidateOutcomeReceipt } from "./candidate-population.js";
import { computeSubjectOutcomes } from "./semantic-subject-outcomes.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily, type SubjectOutcomePayload, type SubjectOutcomePopulationResult } from "./semantic-subject-types.js";

import { sha256Hex } from "./assistance-exchange.js";
import { castlingLegality, castlingRights, castlingRightsLost } from "./castling.js";
import { parseCorpusResultAbstention } from "./corpus-result.js";
import { isCompiledConceptRegistry, type CompiledConceptRegistry, type ConceptRef } from "./concept-registry.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { isRecordedClockSource, readRecordedClockSource, type RecordedClockSource } from "./recorded-clock-source.js";
import { recordedClockUseOperands, type RecordedClockReading, type RecordedClockDecision } from "./recorded-clock-operands.js";
import type { PhaseBandReadingV2 } from "./phase.js";
import { recordedBranchFacts, type BranchComparison, type ComparisonEvidenceEntry, type ComparisonScore, type RecordedBranchFacts } from "./compare.js";
import { endgameClassification } from "./endgame.js";
import { endgameMethodConvention, replayEndgameMethod, type MethodStage } from "./endgame-method.js";
import { endgameSetupConvention, endgameSetupMatch, type EndgameSetupMatch, type EndgameTechnique } from "./endgame-setup.js";
import { captureClassEvent, legalCaptureMovesTo, legalExchange, legalExchangeForMove, type LandingCaptureReading, type LegalExchangeResult } from "./exchange.js";
import { PRIMARY_EVIDENCE_MANIFEST, STRUCTURAL_EVENT_FAMILIES, TRANSITION_GEOMETRY_EVENT_FAMILIES, TRANSITION_RULE_EVENT_FAMILIES } from "./evidence-catalog.js";
import {
  assertDeclaredEvidence,
  declareEvidence,
  evidenceDigest,
  evidenceValueReceipt,
  isDeclaredEvidence,
  type DeclaredEvidence,
  type ProjectionDeclaration,
  type VersionedEvidenceId,
} from "./evidence-contract.js";
import { directProjectionConventions, conventionReplacementSource } from "./evidence-convention-closure.js";
import { computeComparisonReduction } from "./internal/comparison-reduction-authority.js";
import { computeLastLevelReduction, type RecordedLastLevelValue } from "./internal/last-level-reduction-authority.js";
import { computeOpeningHistoryReduction, type RecordedDeepestOpeningReached } from "./internal/opening-history-reduction-authority.js";
import { readAuthoredStructuralConditionSource, type AuthoredStructuralConditionSource, type AuthoredStructuralSourceImage } from "./internal/authored-structural-source.js";
import { readAuthoredPredicatePopulation, type AuthoredPredicatePopulation } from "./authored-predicate-population.js";
import { computeAuthoredPredicateReduction } from "./internal/authored-predicate-reduction-authority.js";
import { readRegisteredShapeScan, registeredShapeReceiptImage, type RegisteredShapeScan } from "./internal/registered-shape-scan.js";
import { isRecordedOpeningHistorySource, type RecordedOpeningHistorySource } from "./recorded-opening-history.js";
import { computeStoryRankReduction } from "./internal/story-rank-reduction-authority.js";
import { readRecordedReviewMoments, type RecordedReviewMomentSource } from "./recorded-review-moments.js";
import { readRecordedLastLevelPopulation, type RecordedLastLevelPopulation } from "./review-evidence.js";
import { readRecordedAnalyzeLineSource, type RecordedAnalyzeArm, type RecordedAnalyzeLineSource, type AnalyzeLineOperands } from "./recorded-analyze-line.js";
import { initiateEvidenceReduction, publishEvidenceReduction, publishSingleEvidenceReduction } from "./internal/evidence-reduction-seal.js";
import { readComparisonStructuralPopulation, type RecordedComparisonStructuralPopulation, type ScopedStructuralObservationChange } from "./comparison-structural-population.js";
import { COMPARISON_STRUCTURAL_ROUTES, type ComparisonStructuralRoute } from "./internal/comparison-structural-families.js";
import { conventionReceipt, type ConventionReceipt } from "./evidence-conventions.js";
import { resolveEvidenceReference, type EvidenceReferenceResolution } from "./evidence-ref-resolution.js";
import { resolveSourceAttribution, type SourceAttributionReceipt } from "./source-attribution.js";
import { kingZoneEvents, kingZoneReading } from "./king-state.js";
import { exactLegalMoveMap, exactMoveIdentity, type ExactLegalMove, type ExactLegalMoveMap } from "./legal-moves.js";
import { STRUCTURAL_DETAIL_KINDS, structuralDetail, type StructuralDetailByKind, type StructuralDetailKind } from "./structural-reading-detail.js";
import { materialRoleAsymmetryEvent, materialRoleSignatureReading } from "./material-state.js";
import { MATERIAL_COUNT_SLOTS, assertMaterialCauses, materialSignatureValue, materialAsymmetryValue } from "./internal/material-sources.js";
import { forcedMateAfterMove } from "./mate-proof.js";
import { moveQualityGrade, type MoveQualityGrade } from "./grade.js";
import { recordedEventDigest } from "./internal/recorded-event-digest.js";
import { isRecordedGradeSource, readRecordedGradeSource, type RecordedGradeSource } from "./recorded-grade-source.js";
import { isInstalledOpeningCatalogue, type InstalledOpeningCatalogue, type CurrentOpeningEndpoint, type OpeningCatalogueMembership } from "./opening-catalogue.js";
import { recordedOpeningLookup, readRecordedOpeningLookup, type RecordedOpeningLookup } from "./internal/recorded-opening-lookup.js";
import { pieceDestinationEvents, pieceDestinationsReading } from "./mobility.js";
import { candidateMajorityReading, harassmentPressureSequence, pawnContactsReading, pawnContactTimingSequence, pawnDynamicsEvents, pawnTransitionEvents, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import { developmentReading, phaseBandReading } from "./phase.js";
import { pivotalMarkerPayloadsForKind, pivotalMarkerRecordedSelection, isRecordedPivotalSource, recordedPivotalData, pivotalRecordedPayloads, reportedHumanSplit, type RecordedHumanDivergenceMarker, type RecordedPivotalSource, type PivotalKind, type PivotalMarker } from "./pivotal.js";
import { RECORDED_EDGE_FACTORY, recordedEdgePayload, type RecordedEdge } from "./recorded-edge.js";
import { isRecordedSequenceWindow, readRecordedSequenceWindow, recordedSequenceWindowOperands, recordedSequenceWindowInputs, recordedSequenceWindowValueAuthority, type RecordedSequenceWindow, type RecordedSequenceRoute } from "./recorded-sequence-window.js";
import { recordedReadingFromLedgerRecord, type SourcingLedgerRecord } from "./recorded-reading.js";
import {
  attractionObservedOperands,
  recordedAttractionObservedOperands,
  checkZwischenzugObservedOperands,
  recordedCheckZwischenzugObservedOperands,
  defenderConsequenceOperands,
  recordedDefenderConsequenceOperands,
  defenderExposureOperands,
  deflectionObservedInduction,
  deflectionObservedOperands,
  interferenceObservedOperands,
  lineBlockerClearanceObservedOperands,
  recordedDeflectionObservedOperands,
  recordedLineBlockerClearanceObservedOperands,
  openFileOccupancyOperands,
  capturedZoneDefenderOperands,
  overloadExploitationObservedOperands,
  squareClearanceObservedOperands,
  recordedSquareClearanceObservedOperands,
  exactRecordedSequenceInputs,
  exactSequenceInputs,
  recordedEdgeAnchors,
  structuralSemanticEventPayloads,
  transitionSemanticEventPayloads,
} from "./semantic-evidence.js";
import { shapeFirings, type ShapeTriggerSource } from "./shape-firing.js";
import { readRegisteredShapeSource, registeredShapeRecordsImage, type RegisteredShapeSource } from "./registered-shape-source.js";
import { squareControlEvents, squareControlReading, type SquareControlReading } from "./square-control.js";
import { INSPECTOR_DETAIL_SOURCES, buildInspectorDetailPayload, parseInspectorDetailScope,
  type InspectorDetailKind, type InspectorDetailPayload, type InspectorDetailSources, type InspectorDetailScope } from "./inspector-detail.js";
import { defenderExposurePassFen, defenderExposureTarget, defenderExposureValue, type AvailableDefenderExposureOperands } from "./internal/defender-exposure.js";
import { STORY_PIVOT_CP, rankStoryMoments, suggestTitle, type StoryMoment, type StoryTitleInput } from "./story.js";
import {
  learnerCentipawns,
  mateTransitionChanges,
  reviewPointCentipawns,
  reviewPointComparability,
  whiteWdl,
  type ForcedMateAfterMoveProofV2,
  type RecordedPosition,
  type ReviewEnginePoint,
  type ReviewEvalDelta,
  type ReviewMateTransition,
  type ReviewWdlPoint,
  type StockfishPositionEvaluation,
  type WhiteWdlPoint,
} from "./review-points.js";
import { evaluateStructuralPredicate } from "./structural-evidence.js";
import { readPawnFileGroups, readFileStates, pawnFileGroupChanges, fileStateChanges, fileAccessRevealed, readPawnIslandChanges, type FileStateChange } from "./foundation-pawn-sources.js";
import { readUnobstructedOpposition, readBackwardPawns, oppositionChanges, backwardPawnChanges, readFutureFileChallenges, readCaptureMigrationReach, readOutpostCandidates, readOccupiedOutposts, type FutureFileSnapshot, type OutpostCandidateSnapshot } from "./foundation-position-sources.js";
import { sliderMembershipChanges, readPhysicalSliderRays, type PhysicalSliderRaySnapshot } from "./foundation-slider-sources.js";
import { readMoverPieceRisk, type MoverPieceRiskInput, type MoverPieceRiskSnapshot } from "./foundation-risk-sources.js";
import type { BackwardPawnSnapshot, BackwardPawnSubject } from "./foundation-position-sources.js";
import { readCandidateRole, readPawnExtendedCenterDestination, readFianchettoSetups, readFianchettoScreens, readEarlyQueenCandidate, readFirstDecisionCastling, type CandidateRoleReading, type FianchettoSetupSnapshot, type FirstDecisionCastling } from "./foundation-style-sources.js";
import { isFoundationRecordedPrefix, isFoundationRecordedDecision, isFoundationClaimedChoiceDecision, isFoundationEarlyQueenDecision, readFoundationRecordedPrefix, readFoundationRecordedDecision, readFoundationClaimedChoiceDecision, readFoundationEarlyQueenDecision, type FoundationRecordedPrefix, type FoundationEarlyQueenDecision } from "./recorded-foundation-source.js";
import { matchingUnobstructedOpposition, matchingBackwardPawns, matchingOutpostCandidates, type SelectedStructuralFeature } from "./foundation-predicate-leaves.js";
import { evaluateNamedStructureWithWitness, matchesStructuralExpression, pawnConnectivityReading, spaceReading, structuralReading, type StructuralReading, type PawnConnectivityReading } from "./structure.js";
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
  nonterminalForkSurvival,
  loosePieceEvents,
  loosePieceReading,
  mateInOne,
  overloadedDefenderResponseConflict,
  promotionPressureReading,
  rayClassificationReading,
  replyBreadth,
  rookOnSeventhReading,
  threatPassAnchor,
  threats,
  trappedPieceReading,
  type DoubleAttackEvent,
  type GainedSliderRay,
  type OverloadedDefenderConflict,
  type ReplyBreadth,
} from "./tactics.js";
import { bindThreatEvidencePassAnchor } from "./threat-pass-authority.js";
import {
  deriveEngineTargetPolicy,
  deriveMaiaPolicyBounds,
  type BoundedTargetPolicyBounds,
  type EnginePolicyAbstention,
  type EngineTargetPolicyReading,
  type MaiaPageEvidence,
  type MaiaPolicyAbstention,
  type PolicyLocalInputs,
  type StockfishTableEvidence,
} from "./bounded-target-policy.js";
import {
  computeBoundedReturn,
  computeImmediate,
  computeNamedMaterialTarget,
  isBoundedTargetTraversalAuthority,
  type BoundedTargetImmediate,
  type BoundedTargetImmediateEvidence,
  type BoundedTargetReturn,
  type BoundedTargetReturnEvidence,
  type BoundedTargetTraversalAuthority,
  type LegalExchangeEvidence,
  type NamedMaterialTargetEvidence,
  type SourceLegalMovesEvidence,
  type ThreatEvidence,
} from "./bounded-target-chess.js";
import { transitionReading, transitionSemanticFacts } from "./transition.js";
import { branchPath } from "./branch-path.js";
import { recordedPieceRoutes, structureDeltaEntries } from "./compare-strip-values.js";
import { isRecordedComparisonSource, recordedComparisonData, recordedComparisonPathValue, assertRecordedComparisonPath, type RecordedComparisonSource, type RecordedComparisonPath } from "./recorded-comparison.js";
import { recordedComparisonEvalDeltaValue, type RecordedCompareEvalDeltaInput } from "./recorded-comparison-eval.js";
import { isRecordedComparisonPointSource, readRecordedComparisonPointSource, type RecordedComparisonPointSource, type RecordedComparisonEnginePoint } from "./recorded-comparison-point.js";
import { isRecordedReviewBoundary, readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import type { DrillRun, EvidencePayload, Node, RunOutcome, SelectionEngineIdentity } from "./types.js";
import { assertProviderDelivery, assertProviderLocalDomainResult } from "./provider-exchange.js";
import { providerProtocolRow, providerProtocolSourceBinding } from "./provider-protocol.js";
import { CORPUS_GUARD } from "./population-guard.js";
import type { ExplorerPopulationSummary, ExplorerPositionFrequency, ExplorerInspectorPopulation } from "./explorer-summary.js";
import type { ExplorerRepertoireFrontier } from "./explorer-frontier.js";
import { maiaExactFenOccurrencePayload, maiaRunOccurrencePayload, type MaiaExactFenMoveOccurrence, type MaiaOccurrencePageEvidence, type MaiaRunMoveOccurrence } from "./maia-occurrence.js";
import type { MaiaNodeInputs, MaiaNodeDistribution, MaiaNodeCandidateWdl } from "./maia-node.js";
import { resolveBranchPath } from "./branch-path.js";
import { assertResolvedRunSubject, type ResolvedRunSubject } from "./run-subject.js";
import type { RunEvidenceItemDigest } from "./run-subject.js";
import type { EvidenceKind, ObjectiveState, ObjectiveStateChangedEvent } from "./types.js";
import { isRecordedInspectorNode, recordedInspectorPacketValue, recordedInspectorSelectionValue, recordedInspectorCategoryValue, recordedInspectorDistanceValue, type RecordedInspectorPacket, type RecordedInspectorSelection } from "./recorded-inspector.js";
import type { ExplorerPositionPage } from "./provider-types.js";
import type { FixedBoundPrincipalVariation, ProviderDelivery, ProviderEvidenceDelivery, ProviderLocalDomainResult, ProviderOperationId, ProviderOperationResultMap } from "./provider-types.js";
import { hintDisclosurePayload, hintHorizonOccurrence, type HintDisclosurePayload, type HintHorizonOccurrence } from "./hint-horizon.js";
import { HINT_FAMILIES, HINT_RUNGS, HINT_SEARCH_SOURCE, hintDeclarationRow, hintDisclosureProjectionId, hintHorizonProjectionId, type HintDisclosureProjectionId, type HintFamily, type HintRung } from "./hint-registry.js";

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
const hasExactOwnDataKeys = (candidate: unknown, keys: readonly string[]): boolean => {
  if (!isRecord(candidate) || ![Object.prototype, null].includes(Object.getPrototypeOf(candidate))) return false;
  const own = Reflect.ownKeys(candidate);
  return own.length === keys.length && own.every(key => typeof key === "string" && keys.includes(key)
    && Object.hasOwn(Object.getOwnPropertyDescriptor(candidate, key)!, "value"));
};

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
  if (isFoundationRecordedPrefix(candidate)) return readFoundationRecordedPrefix(candidate).authority;
  if (isFoundationRecordedDecision(candidate)) return readFoundationRecordedDecision(candidate).authority;
  if (isFoundationClaimedChoiceDecision(candidate)) return readFoundationClaimedChoiceDecision(candidate).authority;
  if (isRecordedSequenceWindow(candidate)) return readRecordedSequenceWindow(candidate).authority;
  if (isRecordedPivotalSource(candidate)) return recordedPivotalData(candidate).authority;
  if (isRecordedComparisonSource(candidate)) return recordedComparisonData(candidate).authority;
  if (isRecordedComparisonPointSource(candidate)) return readRecordedComparisonPointSource(candidate).authority;
  if (isRecordedGradeSource(candidate)) return readRecordedGradeSource(candidate).authority;
  if (isRecordedReviewBoundary(candidate)) return readRecordedReviewBoundary(candidate);
  if (isRun(candidate)) return { run: candidate.id, nodes: candidate.nodes.length, events: candidate.events.length };
  if (candidate instanceof Map) return { map: [...candidate].map(([key, entry]) => [key, authorityShape(entry)]) };
  // A sealed value hashes as its receipt digest; anything else is an ordinary authority record.
  if (isDeclaredEvidence(candidate)) return { sealed: evidenceValueReceipt(candidate).payloadDigest };
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
// One edge mints ~200 values over the same frozen canonical edge authority ([[D3300]]). A frozen
// plain record of primitive data properties cannot change, and its authority shape is itself, so
// its digest is computed once per record. Frozen accessors and symbol-driven shape hooks are not
// ordinary data; every other authority is shaped and hashed per mint as before.
const FROZEN_AUTHORITY_DIGESTS = new WeakMap<object, string>();

function authorityDigest(authority: unknown): string {
  if (authority !== null && typeof authority === "object" && Object.isFrozen(authority)
    && Object.getPrototypeOf(authority) === Object.prototype
    // authorityShape also reads inherited iteration/run classifiers. Those can change even when
    // every own field is frozen primitive data, so they cannot enter this ordinary-record cache.
    && !(Symbol.iterator in authority)
    && ["id", "nodes", "events", "branches"].every((key) => !(key in authority) || Object.hasOwn(authority, key))) {
    // A cache entry proves this frozen record's own descriptors were checked once. Its own
    // data cannot change; inherited classifiers above must still be checked before every hit.
    const cached = FROZEN_AUTHORITY_DIGESTS.get(authority);
    if (cached !== undefined) return cached;
    const stable = Reflect.ownKeys(authority).every((key) => {
      if (typeof key !== "string") return false;
      const property = Object.getOwnPropertyDescriptor(authority, key)!;
      return "value" in property && (property.value === null || (typeof property.value !== "object" && typeof property.value !== "function"));
    });
    if (stable) {
      const digest = evidenceDigest(authorityShape(authority));
      FROZEN_AUTHORITY_DIGESTS.set(authority, digest);
      return digest;
    }
  }
  return evidenceDigest(authorityShape(authority));
}

// ---------------------------------------------------------------------------------------------
// Convention closure (rfc/semantic-convention-provenance.md §4; [[D1921]])
// ---------------------------------------------------------------------------------------------

const SOURCE_CONVENTION_RECEIPTS = new Map<string, ConventionReceipt>();
const INPUT_VALUE_DIGESTS = new WeakMap<object, string>();

/** One sealed input's identity inside a derived receipt: producer, projection, payload and its own closure. */
function conventionInputValueDigest(input: DeclaredEvidence<unknown>): string {
  const cached = INPUT_VALUE_DIGESTS.get(input);
  if (cached !== undefined) return cached;
  const receipt = evidenceValueReceipt(input);
  const digest = `sha256:${evidenceDigest({
    producer: `${input.producer.id}@${input.producer.version}`,
    projection: sealedRoute(input),
    payloadDigest: receipt.payloadDigest,
    convention: receipt.convention?.digest ?? null,
  })}`;
  INPUT_VALUE_DIGESTS.set(input, digest);
  return digest;
}

/**
 * The closure the mint seals with a value: the projection's direct refs plus, for a derived value,
 * the closures of the exact sealed inputs actually used, under the canonical member identity. A
 * source/computed value (no sealed inputs) has one per-route receipt.
 */
function mintConventionReceipt(route: string, sources: readonly (DeclaredEvidence<unknown> | string)[], instance: readonly VersionedEvidenceId[]): ConventionReceipt {
  const inputs = sources.filter((source): source is DeclaredEvidence<unknown> => typeof source !== "string");
  const direct = instance.length === 0 ? directProjectionConventions(route) : [...directProjectionConventions(route), ...instance];
  if (inputs.length === 0 && instance.length > 0) return conventionReceipt(direct, { kind: "source" });
  if (inputs.length === 0) {
    let receipt = SOURCE_CONVENTION_RECEIPTS.get(route);
    if (receipt === undefined) {
      receipt = conventionReceipt(direct, { kind: "source" });
      SOURCE_CONVENTION_RECEIPTS.set(route, receipt);
    }
    return receipt;
  }
  const refs = [...direct];
  for (const input of inputs) refs.push(...(evidenceValueReceipt(input).convention?.refs ?? []));
  return conventionReceipt(refs, {
    kind: "derived",
    member: [...new Set(inputs.map(sealedRoute))].sort().join("+"),
    inputs: inputs.map((input) => ({ projection: sealedRoute(input), valueDigest: conventionInputValueDigest(input) })),
  });
}

/**
 * The local mint helper. Deliberately not exported. `instance` names the registered conventions a
 * payload instance selected (a setup or method convention ref); unregistered refs fail the receipt.
 */
const REVIEW_MEMBER_INPUTS = new WeakMap<object, readonly DeclaredEvidence<unknown>[]>();
/** Actual reading factory membership, not a caller-supplied factory name or digest list. */
const FOUNDATION_VALUE_INPUTS = new WeakMap<object, readonly DeclaredEvidence<unknown>[]>();
const LANDING_CAPTURE_INPUTS = new WeakMap<object, Readonly<{ fen: string; landingSquare: SquareName }>>();
const REVIEW_MEMBER_ROUTES = new Set(["derived.review.eval_point@1", "derived.review.eval_delta@2", "derived.review.mate_transition@2",
  "derived.pivotal.irreversibility@1", "derived.pivotal.phase_change@2", "derived.pivotal.human_divergence@2", "derived.pivotal.option_collapse@2"]);
type LocalReadingInvocation = Readonly<{ kind: "fen"; fen: string }> | Readonly<{ kind: "edge"; edge: EvidenceEdge }>;
export type MoverPieceRiskFactoryResult =
  | { readonly kind: "available"; readonly value: DeclaredEvidence<MoverPieceRiskSnapshot> }
  | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone" };
type TotalRayInvocation = Readonly<{ kind: "total_ray"; position: DeclaredEvidence<ExactLegalMoveMap> }>;
type TotalRiskInvocation = Readonly<MoverPieceRiskInput & { kind: "total_risk"; result: MoverPieceRiskFactoryResult }>;
export interface SubjectOutcomeFactoryInput {
  readonly receipt: CandidateOutcomeReceipt;
  readonly moveUci: string;
}
export type SubjectOutcomeFactoryResult<F extends SubjectOutcomeFamily> =
  | { readonly kind: "available"; readonly values: readonly DeclaredEvidence<SubjectOutcomePayload<F>>[] }
  | { readonly kind: "unavailable"; readonly reason: "counterfactual_population_incomplete" };
type SubjectOutcomeInvocation = Readonly<SubjectOutcomeFactoryInput & {
  kind: "subject_outcomes"; family: SubjectOutcomeFamily; edge: EvidenceEdge;
  inputs: readonly DeclaredEvidence<unknown>[]; result: SubjectOutcomeFactoryResult<SubjectOutcomeFamily>;
  population: SubjectOutcomePopulationResult<SubjectOutcomeFamily>;
}>;
const LOCAL_READING_INVOCATIONS = new WeakMap<object, LocalReadingInvocation | TotalRayInvocation | TotalRiskInvocation | SubjectOutcomeInvocation>();

/** Exact thirteen-family original invocation. Copied results/values have no membership. */
export function readSubjectOutcomeInvocation(value: DeclaredEvidence<unknown> | SubjectOutcomeFactoryResult<SubjectOutcomeFamily>): SubjectOutcomeInvocation {
  const original = LOCAL_READING_INVOCATIONS.get(value);
  if (original?.kind !== "subject_outcomes" || !(original.result === value || original.result.kind === "available" && original.result.values.some(item => item === value))) {
    throw new TypeError("Subject outcome requires its original factory value or complete result");
  }
  readCandidateOutcomeSources(original.receipt);
  const played = candidateOutcomePlayedRow(original.receipt, original.moveUci);
  if (played.afterFen !== original.edge.afterFen) throw new TypeError("Subject outcome lost its original compiler/played member");
  if (original.result !== value) {
    assertDeclaredEvidence(value);
    const route = `derived.semantic_avoidance.${original.family}@2`, receipt = evidenceValueReceipt(value);
    const saved = FOUNDATION_VALUE_INPUTS.get(value);
    if (sealedRoute(value) !== route || receipt.factory !== evidenceFactorySymbol(route)
      || saved?.length !== original.inputs.length || saved.some((item, index) => item !== original.inputs[index])
      || receipt.sourceDigests.length !== saved.length || receipt.sourceDigests.some((digest, index) => digest !== evidenceValueReceipt(saved[index]!).payloadDigest)
      || receipt.inputDigest !== authorityDigest({ foundationId: candidateOutcomeFoundationId(original.receipt), compilerVersion: 8, moveUci: original.moveUci, family: original.family })) {
      throw new TypeError("Subject outcome lost its complete original ordered inputs");
    }
  }
  return original;
}
/** Internal nonminting reader of the complete original table. A public event/result copy or
 * another family's original result cannot authorize played-matching or empty population states. */
export function readSubjectOutcomePopulation<F extends SubjectOutcomeFamily>(family: F, result: SubjectOutcomeFactoryResult<F>): SubjectOutcomePopulationResult<F> {
  const original = readSubjectOutcomeInvocation(result);
  if (original.result !== result || original.family !== family) throw new TypeError("Subject population requires its exact family's original complete result");
  // Original invocation membership and the exact family check establish this dependent type.
  return original.population as SubjectOutcomePopulationResult<F>;
}

/** Original input membership at the sole mint, never inferred from payload or source digests. */
export function readReviewMemberInputs(value: DeclaredEvidence<unknown>): readonly DeclaredEvidence<unknown>[] {
  assertDeclaredEvidence(value);
  const inputs = REVIEW_MEMBER_INPUTS.get(value);
  if (inputs === undefined) throw new TypeError("Review member lacks original mint input membership");
  if (inputs.length !== evidenceValueReceipt(value).sourceDigests.length || inputs.some((input, index) => evidenceValueReceipt(input).payloadDigest !== evidenceValueReceipt(value).sourceDigests[index])) throw new TypeError("Review member lost its literal ordered inputs");
  return inputs;
}
export function readLocalReadingInvocation(value: DeclaredEvidence<unknown>): LocalReadingInvocation {
  assertDeclaredEvidence(value);
  const input = LOCAL_READING_INVOCATIONS.get(value);
  if (input === undefined || input.kind !== "fen" && input.kind !== "edge") throw new TypeError("Local reading lacks its original FEN/edge factory invocation");
  const authority = input.kind === "fen" ? { fen: input.fen } : input.edge;
  if (evidenceValueReceipt(value).inputDigest !== authorityDigest(authority)) throw new TypeError("Local reading differs from its original literal factory input");
  return input;
}

/** Finite total-source readers reuse the existing factory stores; public bytes are not membership. */
export function readPhysicalSliderRaysInvocation(value: DeclaredEvidence<PhysicalSliderRaySnapshot>) {
  assertDeclaredEvidence(value);
  const original = LOCAL_READING_INVOCATIONS.get(value), inputs = FOUNDATION_VALUE_INPUTS.get(value);
  const route = "rules.transition.reading.physical_slider_rays@1", receipt = evidenceValueReceipt(value);
  if (original?.kind !== "total_ray" || sealedRoute(value) !== route || receipt.factory !== evidenceFactorySymbol(route)
    || inputs?.length !== 1 || inputs[0] !== original.position
    || receipt.sourceDigests.length !== 1 || receipt.sourceDigests[0] !== evidenceValueReceipt(original.position).payloadDigest
    || receipt.inputDigest !== authorityDigest({ position: original.position })) throw new TypeError("Total ray source lost its original position invocation");
  assertPawnFoundationSource(original.position, "rules.mobility.reading.legal_moves@1");
  return Object.freeze({ position: original.position, inputs });
}

export function readMoverPieceRiskInvocation(result: MoverPieceRiskFactoryResult) {
  const original = LOCAL_READING_INVOCATIONS.get(result), inputs = FOUNDATION_VALUE_INPUTS.get(result);
  if (original?.kind !== "total_risk" || original.result !== result || inputs?.length !== 2
    || inputs[0] !== original.root || inputs[1] !== original.position) throw new TypeError("Risk result is not an original complete factory invocation");
  assertPawnFoundationSource(original.root, "rules.mobility.reading.legal_moves@1");
  assertPawnFoundationSource(original.position, "rules.mobility.reading.legal_moves@1");
  if (result.kind === "available") {
    assertDeclaredEvidence(result.value);
    const route = "rules.tactic.reading.mover_piece_risk@1", receipt = evidenceValueReceipt(result.value);
    const saved = FOUNDATION_VALUE_INPUTS.get(result.value);
    if (sealedRoute(result.value) !== route || receipt.factory !== evidenceFactorySymbol(route)
      || saved?.length !== 2 || saved.some((value, i) => value !== inputs[i])
      || receipt.sourceDigests.length !== 2 || receipt.sourceDigests.some((value, i) => value !== evidenceValueReceipt(inputs[i]!).payloadDigest)
      || receipt.inputDigest !== authorityDigest({ root: original.root, position: original.position, moveUci: original.moveUci })) {
      throw new TypeError("Risk source lost its original ordered root/position inputs");
    }
  }
  return Object.freeze({ root: original.root, position: original.position, moveUci: original.moveUci, inputs, result });
}
/** Value-authority §2.2b. Nonminting, exact-seven hand-off of the original factory inputs.
 * For tuple factories membership is the construction proof: raw move spelling need not equal
 * normalized payload spelling, so never reconstruct their original inputDigest authority. */
export function readFoundationEventInvocation(value: DeclaredEvidence<unknown>): Readonly<{ edge: EvidenceEdge; inputs: readonly DeclaredEvidence<unknown>[] }> {
  assertDeclaredEvidence(value);
  const route = sealedRoute(value), receipt = evidenceValueReceipt(value);
  if (!SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS.some(ref => `${ref.id}@${ref.version}` === route)
    || receipt.factory !== evidenceFactorySymbol(route)) throw new TypeError("Foundation event requires its exact original source factory");
  if (route === "rules.transition.event.slider_ray@2") {
    const original = readLocalReadingInvocation(value);
    if (original.kind !== "edge" || receipt.sourceDigests.length !== 0) throw new TypeError("Physical slider requires its original edge invocation");
    return Object.freeze({ edge: original.edge, inputs: Object.freeze([]) });
  }
  const inputs = FOUNDATION_VALUE_INPUTS.get(value);
  if (inputs === undefined || inputs.length !== receipt.sourceDigests.length
    || inputs.some((input, i) => evidenceValueReceipt(input).payloadDigest !== receipt.sourceDigests[i])) throw new TypeError("Foundation event lost its original ordered factory inputs");
  const payload = value.payload as EvidenceEdge;
  return Object.freeze({ edge: Object.freeze({ beforeFen: payload.beforeFen, moveUci: payload.moveUci, afterFen: payload.afterFen }), inputs });
}

function assertFoundationReplacementInputs(route: string, authority: unknown, sources: readonly (DeclaredEvidence<unknown> | string)[]): void {
  const required = conventionReplacementSource(route);
  if (required === undefined) return;
  const events = route.startsWith("rules.structural.event.");
  if (!isRecord(authority) || sources.length !== (events ? 2 : 1)
    || (events ? authority.before !== sources[0] || authority.after !== sources[1] : authority.source !== sources[0])) {
    throw new TypeError(`Convention replacement requires its original ordered source inputs: ${route}`);
  }
  for (const source of sources) {
    if (typeof source === "string") throw new TypeError(`Convention replacement refuses a source digest: ${route}`);
    assertDeclaredEvidence(source);
    const original = FOUNDATION_VALUE_INPUTS.get(source), receipt = evidenceValueReceipt(source);
    if (sealedRoute(source) !== required || receipt.factory !== evidenceFactorySymbol(required) || original === undefined
      || original.length !== receipt.sourceDigests.length || original.some((input, index) => evidenceValueReceipt(input).payloadDigest !== receipt.sourceDigests[index])) {
      throw new TypeError(`Convention replacement requires its genuine source factory invocation: ${route}`);
    }
  }
}

function mint<T>(route: string, symbol: string, payload: T, authority: unknown, sources: readonly (DeclaredEvidence<unknown> | string)[] = [], instance: readonly VersionedEvidenceId[] = []): DeclaredEvidence<T> {
  assertFoundationReplacementInputs(route, authority, sources);
  const projection = projectionFor(route);
  const result = declareEvidence(projection.producer, { id: projection.id, version: projection.version }, present(payload, route), {
    factory: symbol,
    inputDigest: authorityDigest(authority),
    sourceDigests: sources.map(sourceDigest),
    convention: mintConventionReceipt(route, sources, instance),
  });
  if (REVIEW_MEMBER_ROUTES.has(route)) {
    if (sources.some(source => typeof source === "string")) throw new TypeError("Review member requires original sealed inputs, not digest operands");
    REVIEW_MEMBER_INPUTS.set(result, Object.freeze([...sources] as DeclaredEvidence<unknown>[]));
  }
  return result;
}

/** Keep the actual immutable inputs, including complete empty source domains, at construction. */
function mintFoundationValue<T>(route: string, symbol: string, payload: T, authority: unknown, inputs: readonly DeclaredEvidence<unknown>[]): DeclaredEvidence<T> {
  const result = mint(route, symbol, payload, authority, inputs);
  FOUNDATION_VALUE_INPUTS.set(result, Object.freeze([...inputs]));
  return result;
}

function assertPawnFoundationSource(source: DeclaredEvidence<unknown>, route: string): void {
  assertDeclaredEvidence(source);
  const receipt = evidenceValueReceipt(source);
  if (sealedRoute(source) !== route || receipt.factory !== evidenceFactorySymbol(route)) throw new TypeError(`Pawn/file source requires ${route}`);
  if (["rules.structural.reading.pawn_connectivity@1", "rules.mobility.reading.legal_moves@1", "rules.square.reading.control@1", "rules.structural.reading.fianchetto_setup@1"].includes(route)) {
    if (readLocalReadingInvocation(source).kind !== "fen") throw new TypeError("Position source requires its original position invocation");
    return;
  }
  const inputs = FOUNDATION_VALUE_INPUTS.get(source);
  if (inputs === undefined || inputs.length !== receipt.sourceDigests.length || inputs.some((input, index) => evidenceValueReceipt(input).payloadDigest !== receipt.sourceDigests[index])) {
    throw new TypeError(`Pawn/file source is not its genuine original invocation: ${route}`);
  }
}

/** Finite nonminting join for the six original position sources, including quiet populations.
 * Equal payload bytes cannot replace the legal/connectivity object actually used by a snapshot. */
export function readFoundationPositionTuple(tuple: FoundationPositionTuple): FoundationPositionTuple {
  if (!Array.isArray(tuple) || tuple.length !== 6 || !Object.isFrozen(tuple)
    || Reflect.ownKeys(tuple).some(key => !["0", "1", "2", "3", "4", "5", "length"].includes(String(key)))
    || [0, 1, 2, 3, 4, 5].some(index => !("value" in (Object.getOwnPropertyDescriptor(tuple, index) ?? {})))) {
    throw new TypeError("Foundation handoff requires the complete immutable six-source tuple");
  }
  const routes = ["rules.mobility.reading.legal_moves@1", "rules.structural.reading.pawn_connectivity@1",
    "rules.structural.reading.king_opposition@3", "rules.structural.reading.backward_pawn@3",
    "derived.structural.reading.pawn_file_group@1", "derived.activity.reading.file_state@1"] as const;
  routes.forEach((route, index) => assertPawnFoundationSource(tuple[index]!, route));
  const fen = tuple[0].payload.fen;
  if (tuple.some(source => source.payload.fen !== fen)) throw new TypeError("Foundation handoff crosses position/counter identity");
  for (const source of [tuple[0], tuple[1]]) {
    const original = readLocalReadingInvocation(source);
    if (original.kind !== "fen" || canonicalFen(positionFromFen(original.fen)) !== fen) {
      throw new TypeError("Foundation position differs from its original source invocation");
    }
  }
  for (const [index, parentIndex, parameter] of [[2, 0, "position"], [3, 0, "position"], [4, 1, "source"], [5, 1, "source"]] as const) {
    const source = tuple[index], parent = tuple[parentIndex], inputs = FOUNDATION_VALUE_INPUTS.get(source);
    if (inputs?.length !== 1 || inputs[0] !== parent
      || evidenceValueReceipt(source).inputDigest !== authorityDigest({ [parameter]: parent })) {
      throw new TypeError("Foundation snapshot does not retain its original exact position prerequisite");
    }
  }
  return tuple;
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
  return factory({ route, symbol, shape: options.shape ?? "computed", arms: [{ fen: FEN }], result: "single", ...(options.dependency === undefined ? {} : { dependency: options.dependency }), ...(options.pending === undefined ? {} : { pending: options.pending }) }, ({ fen }: { readonly fen: string }) => {
    const result = mint(route, symbol, compute(validFen(fen)), { fen });
    LOCAL_READING_INVOCATIONS.set(result, Object.freeze({ kind: "fen", fen })); return result;
  });
}

export const createRulesCastlingReadingRightsV1Evidence = fenReading("rules.castling.reading.rights@1", castlingRights);
export const createRulesTacticReadingLoosePieceV1Evidence = fenReading("rules.tactic.reading.loose_piece@1", loosePieceReading);
export const createRulesTacticReadingRayClassificationV1Evidence = fenReading("rules.tactic.reading.ray_classification@1", rayClassificationReading);
/**
 * The sole threat factory (rfc/bounded-policy-targets.md §1.1, [[D2630]]): it owns the source FEN,
 * computes `threats()` itself and binds the exact `threatPassAnchor()` result to the wrapper it
 * minted, so target admission can join the passed exchange to the original source position.
 */
export const createRulesTacticConsequenceThreatV1Evidence = (() => {
  const route = "rules.tactic.consequence.threat@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN }], result: "single" }, ({ fen }: { readonly fen: string }) => {
    const valid = validFen(fen);
    const pass = threatPassAnchor(valid);
    const evidence = mint(route, symbol, threats(valid), { fen });
    bindThreatEvidencePassAnchor(evidence, pass);
    return evidence;
  });
})();
export const createRulesStructuralReadingPawnConnectivityV1Evidence = fenReading("rules.structural.reading.pawn_connectivity@1", pawnConnectivityReading);
export const createRulesPhaseDevelopmentV1Evidence = fenReading("rules.phase.development@1", developmentReading);
export const createRulesTacticReadingRookOnSeventhV1Evidence = fenReading("rules.tactic.reading.rook_on_seventh@1", rookOnSeventhReading);
export const createRulesStructuralReadingSpaceV1Evidence = fenReading("rules.structural.reading.space@1", spaceReading);
export const createRulesTacticReadingDiscoveredLatencyV1Evidence = fenReading("rules.tactic.reading.discovered_latency@1", discoveredLatencyReading);
export const createRulesTacticReadingTrappedPieceV1Evidence = fenReading("rules.tactic.reading.trapped_piece@1", trappedPieceReading);
export const createRulesTacticReadingBackRankV1Evidence = fenReading("rules.tactic.reading.back_rank@1", backRankReading);
export const createRulesTacticConsequenceMateInOneV1Evidence = fenReading("rules.tactic.consequence.mate_in_one@1", mateInOne);
export const createRulesSquareReadingControlV1Evidence = fenReading("rules.square.reading.control@1", squareControlReading, { dependency: "semantic-convention-provenance" });
export const createRulesMobilityReadingPieceDestinationsV1Evidence = fenReading("rules.mobility.reading.piece_destinations@1", pieceDestinationsReading);
export const createRulesMobilityReadingLegalMovesV1Evidence = fenReading("rules.mobility.reading.legal_moves@1", exactLegalMoveMap);
export const createRulesMobilityReadingCandidateRoleV1Evidence = (() => {
  const route = "rules.mobility.reading.candidate_role@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ position: sealed("rules.mobility.reading.legal_moves@1"), moveUci: value("an exact canonical legal UCI member", isText) }], result: "availability" },
    (input: { readonly position: DeclaredEvidence<ExactLegalMoveMap>; readonly moveUci: string }) => {
      assertPawnFoundationSource(input.position, "rules.mobility.reading.legal_moves@1");
      return available(mintFoundationValue(route, symbol, readCandidateRole(input.position.payload, input.moveUci), input, [input.position]));
    });
})();
export const createRulesMobilityReadingPawnExtendedCenterDestinationV1Evidence = (() => {
  const route = "rules.mobility.reading.pawn_extended_center_destination@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ source: sealed("rules.mobility.reading.candidate_role@1") }], result: "availability" },
    ({ source }: { readonly source: DeclaredEvidence<CandidateRoleReading> }) => {
      assertPawnFoundationSource(source, "rules.mobility.reading.candidate_role@1");
      return available(Object.freeze(readPawnExtendedCenterDestination(source.payload).map(payload => mintFoundationValue(route, symbol, payload, { source }, [source]))));
    });
})();
const RECORDED_FOUNDATION_INVOCATIONS = new WeakMap<object, Readonly<{
  prefix?: FoundationRecordedPrefix;
  decision?: FoundationEarlyQueenDecision;
  candidate?: DeclaredEvidence<CandidateRoleReading>;
}>>();
/** Original context membership remains live even though the emitted fact is immutable. */
export function readRecordedFoundationInvocation(value: DeclaredEvidence<unknown>) {
  assertDeclaredEvidence(value);
  const original = RECORDED_FOUNDATION_INVOCATIONS.get(value);
  if (original === undefined) throw new TypeError("Recorded foundation value is not an original factory invocation");
  if (original.prefix !== undefined) readFoundationRecordedPrefix(original.prefix);
  if (original.decision !== undefined) {
    if (isFoundationClaimedChoiceDecision(original.decision) && sealedRoute(value) !== "rules.mobility.reading.early_queen_move@1") throw new TypeError("Worker choice cannot become a live recorded invocation");
    readFoundationEarlyQueenDecision(original.decision);
  }
  if (original.candidate !== undefined) assertPawnFoundationSource(original.candidate, "rules.mobility.reading.candidate_role@1");
  return original;
}

/** D4140: finite, nonminting original-input reader for the recorded style occurrence owner. */
export function readRecordedStyleValueInput(value: DeclaredEvidence<unknown>) {
  const route = sealedRoute(value);
  if (!["rules.structural.reading.fianchetto_setup@1", "rules.structural.reading.fianchetto_knight_screen@1",
    "rules.mobility.reading.candidate_role@1", "rules.mobility.reading.pawn_extended_center_destination@1",
    "rules.mobility.reading.early_queen_move@1", "run.record.castling_eligibility@1"].includes(route)) {
    throw new TypeError("Recorded style occurrence requires one of its six exact original source factories");
  }
  assertPawnFoundationSource(value, route);
  if (route === "rules.structural.reading.fianchetto_setup@1") {
    const original = readLocalReadingInvocation(value);
    if (original.kind !== "fen") throw new TypeError("Fianchetto requires its original position invocation");
    return Object.freeze({ kind: "position" as const, route, fen: original.fen,
      setup: value as DeclaredEvidence<FianchettoSetupSnapshot> });
  }
  const inputs = FOUNDATION_VALUE_INPUTS.get(value)!;
  if (route === "rules.structural.reading.fianchetto_knight_screen@1") {
    if (inputs.length !== 1 || sealedRoute(inputs[0]!) !== "rules.structural.reading.fianchetto_setup@1") throw new TypeError("Screen lost its original setup source");
    const original = readLocalReadingInvocation(inputs[0]!);
    if (original.kind !== "fen") throw new TypeError("Screen requires an original position setup");
    return Object.freeze({ kind: "position" as const, route, fen: original.fen,
      setup: inputs[0] as DeclaredEvidence<FianchettoSetupSnapshot> });
  }
  if (route === "run.record.castling_eligibility@1") {
    const original = readRecordedFoundationInvocation(value);
    if (original.prefix === undefined || inputs.length !== 0) throw new TypeError("Castling lost its original prefix invocation");
    return Object.freeze({ kind: "baseline" as const, route, prefix: original.prefix });
  }
  const original = route === "rules.mobility.reading.early_queen_move@1" ? readRecordedFoundationInvocation(value) : undefined;
  const candidate = route === "rules.mobility.reading.candidate_role@1" ? value as DeclaredEvidence<CandidateRoleReading>
    : inputs[0] as DeclaredEvidence<CandidateRoleReading>;
  if (inputs.length !== 1 || candidate === undefined || original !== undefined && (original.candidate !== candidate || original.decision === undefined)) {
    throw new TypeError("Candidate occurrence lost its original complete input invocation");
  }
  assertPawnFoundationSource(candidate, "rules.mobility.reading.candidate_role@1");
  const position = FOUNDATION_VALUE_INPUTS.get(candidate)?.[0];
  if (position === undefined) throw new TypeError("Candidate lost its original complete legal-map source");
  assertPawnFoundationSource(position, "rules.mobility.reading.legal_moves@1");
  const origin = readLocalReadingInvocation(position);
  if (origin.kind !== "fen") throw new TypeError("Candidate requires its original position invocation");
  return Object.freeze({ kind: "candidate" as const, route, fen: origin.fen, candidate,
    position: position as DeclaredEvidence<ExactLegalMoveMap>,
    ...(original?.decision === undefined ? {} : { decision: original.decision }) });
}
export const createRulesMobilityReadingEarlyQueenMoveV1Evidence = (() => {
  const route = "rules.mobility.reading.early_queen_move@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ decision: value("an original live or claimed choice decision", isFoundationEarlyQueenDecision), candidate: sealed("rules.mobility.reading.candidate_role@1") }], result: "availability" },
    (input: { readonly decision: FoundationEarlyQueenDecision; readonly candidate: DeclaredEvidence<CandidateRoleReading> }) => {
      const decision = readFoundationEarlyQueenDecision(input.decision);
      assertPawnFoundationSource(input.candidate, "rules.mobility.reading.candidate_role@1");
      const values = Object.freeze(readEarlyQueenCandidate(decision.authority, input.candidate.payload).map(payload => {
        const result = mintFoundationValue(route, symbol, payload, input, [input.candidate]);
        RECORDED_FOUNDATION_INVOCATIONS.set(result, Object.freeze({ decision: input.decision, candidate: input.candidate }));
        readRecordedFoundationInvocation(result); return result;
      }));
      // False outcomes still belong to an authentic current original decision and candidate.
      readFoundationEarlyQueenDecision(input.decision); return available(values);
    });
})();
interface RecordedClockInvocation { readonly source: RecordedClockSource; readonly phase?: DeclaredEvidence<PhaseBandReadingV2> }
const RECORDED_CLOCK_INVOCATIONS = new WeakMap<object, RecordedClockInvocation>();
function actualClockPhase(phase: DeclaredEvidence<PhaseBandReadingV2>, beforeFen: string): void {
  assertDeclaredEvidence(phase);
  if (sealedRoute(phase) !== "rules.phase.reading@2" || evidenceValueReceipt(phase).factory !== evidenceFactorySymbol("rules.phase.reading@2")) throw new TypeError("Clock decision requires the exact phase2 factory");
  const original = readLocalReadingInvocation(phase);
  if (original.kind !== "fen" || original.fen !== beforeFen || phase.payload.fen !== beforeFen) throw new TypeError("Clock decision phase is not its original BEFORE position");
}
export function readRecordedClockInvocation(value: DeclaredEvidence<unknown>): RecordedClockInvocation {
  const input = RECORDED_CLOCK_INVOCATIONS.get(value);
  if (input === undefined) throw new TypeError("Recorded clock value is not an original factory invocation");
  const clock = readRecordedClockSource(input.source);
  if (input.phase !== undefined) actualClockPhase(input.phase, clock.authority.original.beforeFen);
  readRecordedClockSource(input.source);
  return input;
}
export const createRunRecordClockReadingV1Evidence = (() => {
  const route = "run.record.clock_reading@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ source: value("an original owned clock source", isRecordedClockSource) }], result: "single", dependency: "recorded-clocks" },
    ({ source }: { readonly source: RecordedClockSource }): DeclaredEvidence<RecordedClockReading> => {
      const a = readRecordedClockSource(source).authority;
      const payload: RecordedClockReading = Object.freeze({ subject: a.subject, original: a.original, retention: a.retention, sample: a.sample, control: a.control });
      const result = mintFoundationValue(route, symbol, payload, { clock: a }, []);
      RECORDED_CLOCK_INVOCATIONS.set(result, Object.freeze({ source })); readRecordedClockInvocation(result); return result;
    });
})();
export const createRunRecordClockDecisionV1Evidence = (() => {
  const route = "run.record.clock_decision@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ source: value("an original owned clock source", isRecordedClockSource), phase: sealed("rules.phase.reading@2") }], result: "availability", dependency: "recorded-clocks" },
    (input: { readonly source: RecordedClockSource; readonly phase: DeclaredEvidence<PhaseBandReadingV2> }): EvidenceAvailability<DeclaredEvidence<RecordedClockDecision>> => {
      const a = readRecordedClockSource(input.source).authority;
      actualClockPhase(input.phase, a.original.beforeFen);
      const operands = recordedClockUseOperands(input.source);
      if (operands.kind === "unavailable") { actualClockPhase(input.phase, a.original.beforeFen); readRecordedClockSource(input.source); return operands; }
      const payload: RecordedClockDecision = Object.freeze({ subject: a.subject,
        actor: Object.freeze({ kind: "imported", side: a.original.side }),
        decision: Object.freeze({ nodeId: a.original.beforeNodeId, rootedIndex: a.original.decisionIndex,
          eventSeq: a.original.eventSeq, moveUci: a.original.moveUci, beforeFen: a.original.beforeFen }),
        phase: input.phase.payload, ...operands.value });
      const result = mintFoundationValue(route, symbol, payload, { clock: a, phase: evidenceValueReceipt(input.phase).payloadDigest }, [input.phase]);
      RECORDED_CLOCK_INVOCATIONS.set(result, Object.freeze({ source: input.source, phase: input.phase }));
      readRecordedClockInvocation(result); return available(result);
    });
})();
export const createRunRecordCastlingEligibilityV1Evidence = (() => {
  const route = "run.record.castling_eligibility@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ prefix: value("an original recorded prefix", isFoundationRecordedPrefix) }], result: "availability" },
    (input: { readonly prefix: FoundationRecordedPrefix }): EvidenceAvailability<DeclaredEvidence<FirstDecisionCastling>> => {
      const prefix = readFoundationRecordedPrefix(input.prefix), payload = readFirstDecisionCastling(prefix.authority);
      if (payload === undefined) { readFoundationRecordedPrefix(input.prefix); return unavailable("first_decision_not_represented"); }
      const result = mintFoundationValue(route, symbol, payload, input, []);
      RECORDED_FOUNDATION_INVOCATIONS.set(result, Object.freeze({ prefix: input.prefix }));
      readRecordedFoundationInvocation(result); return available(result);
    });
})();
export const createRulesStructuralReadingFianchettoSetupV1Evidence = fenReading("rules.structural.reading.fianchetto_setup@1", readFianchettoSetups);
export const createRulesStructuralReadingFianchettoKnightScreenV1Evidence = (() => {
  const route = "rules.structural.reading.fianchetto_knight_screen@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ source: sealed("rules.structural.reading.fianchetto_setup@1") }], result: "availability" },
    ({ source }: { readonly source: DeclaredEvidence<FianchettoSetupSnapshot> }) => {
      assertPawnFoundationSource(source, "rules.structural.reading.fianchetto_setup@1");
      return available(mintFoundationValue(route, symbol, readFianchettoScreens(source.payload), { source }, [source]));
    });
})();
/** Complete snapshots from one real position authority; callers cannot supply another FEN/payload. */
function foundationPositionFactory<T>(route: string, read: (position: DeclaredEvidence<ExactLegalMoveMap>) => T) {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: route.startsWith("derived.") ? "derived" : "computed", arms: [{ position: sealed("rules.mobility.reading.legal_moves@1") }], result: "availability" }, ({ position }: { readonly position: DeclaredEvidence<ExactLegalMoveMap> }) => {
    assertPawnFoundationSource(position, "rules.mobility.reading.legal_moves@1");
    return available(mintFoundationValue(route, symbol, read(position), { position }, [position]));
  });
}
export const createRulesStructuralReadingKingOppositionV3Evidence = foundationPositionFactory("rules.structural.reading.king_opposition@3", readUnobstructedOpposition);
export const createRulesStructuralReadingBackwardPawnV3Evidence = foundationPositionFactory("rules.structural.reading.backward_pawn@3", readBackwardPawns);
export const createRulesTransitionReadingPhysicalSliderRaysV1Evidence = (() => {
  const route = "rules.transition.reading.physical_slider_rays@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ position: sealed("rules.mobility.reading.legal_moves@1") }], result: "single" },
    (input: { readonly position: DeclaredEvidence<ExactLegalMoveMap> }) => {
      if (!hasExactOwnDataKeys(input, ["position"])) throw new TypeError("Total ray source requires exactly its position data field");
      const position = input.position;
      assertPawnFoundationSource(position, "rules.mobility.reading.legal_moves@1");
      const result = mintFoundationValue(route, symbol, readPhysicalSliderRays(position), { position }, [position]);
      LOCAL_READING_INVOCATIONS.set(result, Object.freeze({ kind: "total_ray", position }));
      return result;
    });
})();
export const createRulesTacticReadingMoverPieceRiskV1Evidence = (() => {
  const route = "rules.tactic.reading.mover_piece_risk@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ root: sealed("rules.mobility.reading.legal_moves@1"), position: sealed("rules.mobility.reading.legal_moves@1"),
    moveUci: value("null for the original root or an exact canonical child UCI", candidate => candidate === null || isText(candidate)) }], result: "availability" },
    (input: MoverPieceRiskInput): MoverPieceRiskFactoryResult => {
      if (!hasExactOwnDataKeys(input, ["root", "position", "moveUci"])) throw new TypeError("Risk source requires exactly its original frame data fields");
      const captured = Object.freeze({ root: input.root, position: input.position, moveUci: input.moveUci });
      assertPawnFoundationSource(captured.root, "rules.mobility.reading.legal_moves@1");
      assertPawnFoundationSource(captured.position, "rules.mobility.reading.legal_moves@1");
      const computed = readMoverPieceRisk(captured);
      const inputs = Object.freeze([captured.root, captured.position]);
      const result: MoverPieceRiskFactoryResult = computed.kind === "unavailable" ? computed
        : Object.freeze({ kind: "available", value: mintFoundationValue(route, symbol, computed.value, captured, inputs) });
      FOUNDATION_VALUE_INPUTS.set(result, inputs);
      LOCAL_READING_INVOCATIONS.set(result, Object.freeze({ kind: "total_risk", ...captured, result }));
      return result;
    });
})();
export const createDerivedSquareReadingFutureFileChallengeV1Evidence = foundationPositionFactory("derived.square.reading.future_file_challenge@1", readFutureFileChallenges);
export const createDerivedSquareReadingCaptureMigrationReachV1Evidence = foundationPositionFactory("derived.square.reading.capture_migration_reach@1", readCaptureMigrationReach);
export const createDerivedStructuralReadingOutpostCandidateV1Evidence = (() => {
  const route = "derived.structural.reading.outpost_candidate@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ control: sealed("rules.square.reading.control@1"), future: sealed("derived.square.reading.future_file_challenge@1") }], result: "availability" },
    (input: { readonly control: DeclaredEvidence<SquareControlReading>; readonly future: DeclaredEvidence<FutureFileSnapshot> }) => {
      assertPawnFoundationSource(input.control, "rules.square.reading.control@1");
      assertPawnFoundationSource(input.future, "derived.square.reading.future_file_challenge@1");
      return available(mintFoundationValue(route, symbol, readOutpostCandidates(input.control.payload, input.future.payload), input, [input.control, input.future]));
    });
})();
export const createDerivedStructuralReadingOccupiedOutpostV1Evidence = (() => {
  const route = "derived.structural.reading.occupied_outpost@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ source: sealed("derived.structural.reading.outpost_candidate@1") }], result: "availability" },
    ({ source }: { readonly source: DeclaredEvidence<OutpostCandidateSnapshot> }) => {
      assertPawnFoundationSource(source, "derived.structural.reading.outpost_candidate@1");
      return available(mintFoundationValue(route, symbol, readOccupiedOutposts(source.payload), { source }, [source]));
    });
})();

function foundationEventFactory<S extends { readonly fen: string }, T>(route: "rules.structural.event.king_opposition@2" | "rules.structural.event.backward_pawn@2", source: string, changes: (edge: EvidenceEdge, before: S, after: S) => readonly T[]) {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ before: sealed(source), moveUci: value("a UCI move", input => typeof input === "string" && input.length > 0), after: sealed(source) }], result: "availability" }, (input: { readonly before: DeclaredEvidence<S>; readonly moveUci: string; readonly after: DeclaredEvidence<S> }) => {
    const sources = [input.before, input.after];
    if (conventionReplacementSource(route) !== source) throw new TypeError(`Source event lacks its exact convention replacement: ${route}`);
    // Guard even an available empty event population; missing authority can never become false.
    assertFoundationReplacementInputs(route, input, sources);
    const edge = validEdge({ beforeFen: input.before.payload.fen, moveUci: input.moveUci, afterFen: input.after.payload.fen });
    const events = changes(edge, input.before.payload, input.after.payload);
    return available(Object.freeze(events.map(payload => mintFoundationValue(route, symbol, payload, input, sources))));
  });
}
export const createRulesStructuralEventKingOppositionV2Evidence = foundationEventFactory("rules.structural.event.king_opposition@2", "rules.structural.reading.king_opposition@3", oppositionChanges);
export const createRulesStructuralEventBackwardPawnV2Evidence = foundationEventFactory("rules.structural.event.backward_pawn@2", "rules.structural.reading.backward_pawn@3", backwardPawnChanges);
function pawnFoundationSnapshot<T>(route: string, read: (source: PawnConnectivityReading) => T) {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ source: sealed("rules.structural.reading.pawn_connectivity@1") }], result: "availability" }, ({ source }: { readonly source: DeclaredEvidence<PawnConnectivityReading> }) => {
    assertPawnFoundationSource(source, "rules.structural.reading.pawn_connectivity@1");
    return available(mintFoundationValue(route, symbol, read(source.payload), { source }, [source]));
  });
}
export const createDerivedStructuralReadingPawnFileGroupV1Evidence = pawnFoundationSnapshot("derived.structural.reading.pawn_file_group@1", readPawnFileGroups);
export const createDerivedActivityReadingFileStateV1Evidence = pawnFoundationSnapshot("derived.activity.reading.file_state@1", readFileStates);

function pawnFoundationEvent<S extends { readonly fen: string }, T>(route: string, source: string, read: (edge: EvidenceEdge, before: S, after: S) => readonly T[], shape: EvidenceValueFactoryShape = "derived") {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape, arms: [{ before: sealed(source), moveUci: value("a UCI move", isText), after: sealed(source) }], result: "availability" }, (input: { readonly before: DeclaredEvidence<S>; readonly moveUci: string; readonly after: DeclaredEvidence<S> }) => {
    assertPawnFoundationSource(input.before, source);
    assertPawnFoundationSource(input.after, source);
    const edge = validEdge({ beforeFen: input.before.payload.fen, moveUci: input.moveUci, afterFen: input.after.payload.fen });
    return available(Object.freeze(read(edge, input.before.payload, input.after.payload).map(payload => mintFoundationValue(route, symbol, payload, input, [input.before, input.after]))));
  });
}
export const createDerivedStructuralEventPawnFileGroupV1Evidence = pawnFoundationEvent("derived.structural.event.pawn_file_group@1", "derived.structural.reading.pawn_file_group@1", pawnFileGroupChanges);
export const createDerivedActivityEventFileStateV1Evidence = pawnFoundationEvent("derived.activity.event.file_state@1", "derived.activity.reading.file_state@1", fileStateChanges);
export const createRulesStructuralEventPawnIslandsV2Evidence = pawnFoundationEvent("rules.structural.event.pawn_islands@2", "rules.structural.reading.pawn_connectivity@1", readPawnIslandChanges, "computed");
export const createDerivedActivityEventFileAccessRevealedV1Evidence = (() => {
  const route = "derived.activity.event.file_access_revealed@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ change: sealed("derived.activity.event.file_state@1") }], result: "availability" }, ({ change }: { readonly change: DeclaredEvidence<FileStateChange> }) => {
    assertPawnFoundationSource(change, "derived.activity.event.file_state@1");
    return available(Object.freeze(fileAccessRevealed(change.payload).map(payload => mintFoundationValue(route, symbol, payload, { change }, [change]))));
  });
})();
export const createRulesPawnReadingContactsV1Evidence = fenReading("rules.pawn.reading.contacts@1", pawnContactsReading);
export const createRulesPawnReadingCandidateMajorityV1Evidence = fenReading("rules.pawn.reading.candidate_majority@1", candidateMajorityReading);
export const createRulesKingReadingZoneStateV1Evidence = fenReading("rules.king.reading.zone_state@1", kingZoneReading);
export const createRulesTacticReadingDefenderDutySetV1Evidence = fenReading("rules.tactic.reading.defender_duty_set@1", defenderDutyReading, { dependency: "semantic-convention-provenance" });
export const createRulesPhaseReadingV2Evidence = fenReading("rules.phase.reading@2", phaseBandReading, { dependency: "semantic-convention-provenance" });
/** Derived reading whose declared predicate inputs are recomputed in the same pass from the FEN. */
export const createDerivedTacticPromotionPressureV1Evidence = fenReading("derived.tactic.promotion_pressure@1", (fen) => promotionPressureReading(fen), { shape: "derived" });

export const createRulesTacticReadingPromotionPressureV1Evidence = (() => {
  const route = "rules.tactic.reading.promotion_pressure@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN }], result: "single" }, ({ fen }: { readonly fen: string }) => {
    const canonical = canonicalFen(positionFromFen(validFen(fen)));
    return mint(route, symbol, promotionPressureReading(canonical), { fen: canonical });
  });
})();

// ---------------------------------------------------------------------------------------------
// Computed: FEN populations
// ---------------------------------------------------------------------------------------------

interface FenPopulationInvocation {
  readonly projection: VersionedEvidenceId;
  readonly factory: string;
  readonly fen: string;
  readonly inputDigest: string;
  readonly items: readonly DeclaredEvidence<unknown>[];
  readonly convention: ConventionReceipt;
}
const FEN_POPULATION_INVOCATIONS = new WeakMap<object, FenPopulationInvocation>();
const COMPARISON_STRUCTURAL_ROUTE_SET: ReadonlySet<string> = new Set(COMPARISON_STRUCTURAL_ROUTES);

/** Private read only: successful empty arrays need the same actual invocation proof as positives. */
export function readStructuralPopulationInvocation(items: readonly DeclaredEvidence<unknown>[], route: ComparisonStructuralRoute, fen: string): FenPopulationInvocation {
  if (!COMPARISON_STRUCTURAL_ROUTE_SET.has(route)) throw new TypeError("Unknown structural population route");
  return readFenPopulationInvocation(items, route, fen);
}
export function readEndgamePopulationInvocation(items: readonly DeclaredEvidence<unknown>[], fen: string): FenPopulationInvocation {
  return readFenPopulationInvocation(items, "rules.endgame.classification@1", fen);
}
function readFenPopulationInvocation(items: readonly DeclaredEvidence<unknown>[], route: string, fen: string): FenPopulationInvocation {
  const invocation = items !== null && typeof items === "object" ? FEN_POPULATION_INVOCATIONS.get(items) : undefined;
  if (invocation === undefined
    || `${invocation.projection.id}@${invocation.projection.version}` !== route
    || invocation.factory !== evidenceFactorySymbol(route) || invocation.fen !== fen
    || invocation.inputDigest !== evidenceDigest({ fen }) || invocation.items !== items) {
    throw new TypeError("Structural population is not the complete exact factory invocation");
  }
  for (const item of items) {
    assertDeclaredEvidence(item);
    const receipt = evidenceValueReceipt(item);
    if (sealedRoute(item) !== route || receipt.factory !== invocation.factory
      || receipt.inputDigest !== invocation.inputDigest || receipt.convention !== invocation.convention) {
      throw new TypeError("Structural population item crosses its original invocation");
    }
  }
  return invocation;
}

function fenPopulation<T>(route: string, compute: (fen: string) => readonly T[], options: { readonly dependency?: string; readonly pending?: string } = {}): EvidenceValueFactory<{ readonly fen: string }, readonly DeclaredEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN }], result: "population", ...(options.dependency === undefined ? {} : { dependency: options.dependency }), ...(options.pending === undefined ? {} : { pending: options.pending }) }, ({ fen }: { readonly fen: string }) => {
    const valid = validFen(fen);
    const items = Object.freeze(compute(valid).map((payload) => mint(route, symbol, payload, { fen })));
    if (COMPARISON_STRUCTURAL_ROUTE_SET.has(route) || route === "rules.endgame.classification@1") {
      const projection = projectionFor(route);
      FEN_POPULATION_INVOCATIONS.set(items, Object.freeze({ projection: Object.freeze({ id: projection.id, version: projection.version }),
        factory: symbol, fen, inputDigest: evidenceDigest({ fen }), items, convention: mintConventionReceipt(route, [], []) }));
    }
    return items;
  });
}

function cachedStructuralReading(fen: string): StructuralReading {
  return memo(`structuralReading|${fen}`, () => structuralReading(fen));
}

export const createRulesCastlingReadingLegalityV1Evidence = fenPopulation("rules.castling.reading.legality@1", castlingLegality);
export const createRulesStructuralReadingNamedStructureV2Evidence = fenPopulation("rules.structural.reading.named_structure@2", (fen) => cachedStructuralReading(fen).structures.map((structure) => Object.freeze({ id: structure.id, name: structure.name, provenanceNote: structure.provenanceNote, squares: Object.freeze([...evaluateNamedStructureWithWitness(fen, structure.id).squares]) })), { dependency: "semantic-convention-provenance" });
export const createRulesEndgameClassificationV1Evidence = fenPopulation("rules.endgame.classification@1", (fen) => { const reading = endgameClassification(fen); return reading === null ? [] : [reading]; }, { dependency: "semantic-convention-provenance" });

const STRUCTURAL_READING_KINDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count" && kind !== "named_structure"));
export type StructuralReadingKind = (typeof STRUCTURAL_READING_KINDS)[number];
/** One population factory per structural reading family (sixteen named function objects). */
export const STRUCTURAL_READING_FACTORIES = Object.freeze(Object.fromEntries(STRUCTURAL_READING_KINDS.map((kind) => {
  const route = `rules.structural.reading.${kind}@1`;
  return [route, fenPopulation(route, (fen) => cachedStructuralReading(fen).features.filter((feature) => feature.kind === kind))];
})) as Readonly<Record<`rules.structural.reading.${StructuralReadingKind}@1`, EvidenceValueFactory<{ readonly fen: string }, readonly DeclaredEvidence<StructuralReading["features"][number]>[]>>>);

/** Sixteen own-FEN sources; never issue caller-authored observations or widen @1 sources. */
export const STRUCTURAL_DETAIL_FACTORIES = Object.freeze(Object.fromEntries(STRUCTURAL_DETAIL_KINDS.map(kind => {
  const route = `rules.structural.reading.${kind}@2`;
  return [route, fenPopulation(route, fen => cachedStructuralReading(fen).features
    .filter(observation => observation.kind === kind).map(observation => structuralDetail(kind, observation)))];
})) as { readonly [K in StructuralDetailKind as `rules.structural.reading.${K}@2`]: EvidenceValueFactory<{ readonly fen: string }, readonly DeclaredEvidence<StructuralDetailByKind[K]>[]> });

export const createDerivedMaterialReadingRoleSignatureV2Evidence = (() => {
  const route = "derived.material.reading.role_signature@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ fen: FEN }], result: "single" }, ({ fen }: { readonly fen: string }) => {
    const canonical = canonicalFen(positionFromFen(validFen(fen)));
    const population = STRUCTURAL_READING_FACTORIES["rules.structural.reading.piece_count@1"]({ fen: canonical });
    const expected = [...MATERIAL_COUNT_SLOTS, { color: "white", role: "king" }, { color: "black", role: "king" }];
    if (population.length !== 12 || expected.some(slot => population.filter(item => item.payload.color === slot.color && item.payload.role === slot.role).length !== 1)) {
      throw new TypeError("Material signature requires the complete piece-count population");
    }
    const inputs = MATERIAL_COUNT_SLOTS.map(slot => population.find(item => item.payload.color === slot.color && item.payload.role === slot.role)!);
    return mint(route, symbol, materialSignatureValue(canonical, inputs), { fen: canonical }, inputs);
  });
})();

/** One `{ fen, feature }` predicate factory per structural feature kind (eighteen). */
const STRUCTURAL_PREDICATE_INVOCATIONS = new WeakMap<object, Readonly<{ fen: string; feature: StructuralFeature; sources: readonly DeclaredEvidence<unknown>[] }>>();
export function readStructuralPredicateInvocation(value: DeclaredEvidence<unknown>) {
  const input = STRUCTURAL_PREDICATE_INVOCATIONS.get(value);
  if (input === undefined) throw new TypeError("Structural leaf is not an original predicate invocation");
  assertDeclaredEvidence(value); return input;
}
export const STRUCTURAL_PREDICATE_FACTORIES = Object.freeze(Object.fromEntries(STRUCTURAL_FEATURE_KINDS.map((kind) => {
  const route = `rules.structural.predicate.${kind}@1`;
  const symbol = evidenceFactorySymbol(route);
  return [route, factory({ route, symbol, shape: "computed", arms: [{ fen: FEN, feature: value(`a ${kind} StructuralFeature`, (candidate) => isRecord(candidate) && candidate.kind === kind) }], result: "single" }, ({ fen, feature }: { readonly fen: string; readonly feature: StructuralFeature }) => {
    const valid = validFen(fen);
    // StructuralFeature is bounded data, including piece_distance's nested target. Capture
    // it before evaluation so caller accessors cannot change the fact retained afterward.
    const captured = structuredClone(feature);
    if (captured.kind !== kind) throw new TypeError(`Evidence route ${route} requires a ${kind} StructuralFeature`);
    const matched = matchesStructuralExpression(valid, { kind: "feature", feature: captured });
    const result = mint(route, symbol, Object.freeze({ fen: valid, feature: captured, matched }), { fen, feature: captured });
    STRUCTURAL_PREDICATE_INVOCATIONS.set(result, Object.freeze({ fen: valid, feature: result.payload.feature, sources: Object.freeze([]) }));
    return result;
  })];
})) as Readonly<Record<`rules.structural.predicate.${(typeof STRUCTURAL_FEATURE_KINDS)[number]}@1`, EvidenceValueFactory<{ readonly fen: string; readonly feature: StructuralFeature }, DeclaredEvidence<{ readonly fen: string; readonly feature: StructuralFeature; readonly matched: boolean }>>>>);

function isSelectedStructuralFeature<K extends StructuralConventionKind>(kind: K, candidate: unknown): candidate is SelectedStructuralFeature<K> {
  if (!isRecord(candidate) || candidate.kind !== kind || !hasExactKeys(candidate, ["kind", "color", kind === "king_opposition" ? "form" : kind === "backward_pawn" ? "file" : "square", "conventionRef"])
    || candidate.color !== "white" && candidate.color !== "black") return false;
  try { assertStructuralConventionSelection(candidate); } catch { return false; }
  return kind === "king_opposition" ? candidate.form === "direct" || candidate.form === "distant"
    : kind === "backward_pawn" ? typeof candidate.file === "string" && /^[a-h]$/u.test(candidate.file)
    : typeof candidate.square === "string" && /^[a-h][1-8]$/u.test(candidate.square);
}
function foundationPredicateFactory<K extends StructuralConventionKind, S extends { readonly fen: string }, T>(kind: K, sourceRoute: string, matching: (source: S, feature: SelectedStructuralFeature<K>) => readonly T[]) {
  const route = `rules.structural.predicate.${kind}@2`, symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ source: sealed(sourceRoute), feature: value("the exact selected structural feature", input => isSelectedStructuralFeature(kind, input)) }], result: "single" },
    (input: { readonly source: DeclaredEvidence<S>; readonly feature: SelectedStructuralFeature<K> }) => {
      assertPawnFoundationSource(input.source, sourceRoute);
      const feature = structuredClone(input.feature);
      if (!isSelectedStructuralFeature(kind, feature)) throw new TypeError(`Predicate ${route} requires its exact kind/convention feature`);
      const subjects = matching(input.source.payload, feature);
      const result = mintFoundationValue(route, symbol, Object.freeze({ fen: input.source.payload.fen, feature, matched: subjects.length > 0, subjects }),
        { source: input.source, feature }, [input.source]);
      STRUCTURAL_PREDICATE_INVOCATIONS.set(result, Object.freeze({ fen: input.source.payload.fen, feature: result.payload.feature, sources: Object.freeze([input.source]) }));
      return result;
    });
}
export const createRulesStructuralPredicateKingOppositionV2Evidence = foundationPredicateFactory("king_opposition", "rules.structural.reading.king_opposition@3", matchingUnobstructedOpposition);
export const createRulesStructuralPredicateBackwardPawnV2Evidence = foundationPredicateFactory("backward_pawn", "rules.structural.reading.backward_pawn@3", matchingBackwardPawns);
export const createRulesStructuralPredicateOutpostV2Evidence = foundationPredicateFactory("outpost", "derived.structural.reading.outpost_candidate@1", matchingOutpostCandidates);

// ---------------------------------------------------------------------------------------------
// Computed: validated-edge populations
// ---------------------------------------------------------------------------------------------

function edgePopulation<T>(route: string, compute: (edge: EvidenceEdge) => readonly T[], options: { readonly dependency?: string; readonly pending?: string } = {}): EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  // Direct events and their derivations can request the same complete population. Retain only
  // this factory's latest successful validated edge, never a provider, window or game history.
  let previous: { readonly edge: EvidenceEdge; readonly values: readonly DeclaredEvidence<T>[] } | undefined;
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "population", ...(options.dependency === undefined ? {} : { dependency: options.dependency }), ...(options.pending === undefined ? {} : { pending: options.pending }) }, (input: EvidenceEdge) => {
    const edge = validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    if (previous?.edge === edge) return previous.values;
    const values = Object.freeze(compute(edge).map((payload) => {
      const result = mint(route, symbol, payload, edge);
      if (route === "rules.transition.event.slider_ray@2") LOCAL_READING_INVOCATIONS.set(result, Object.freeze({ kind: "edge", edge }));
      return result;
    }));
    previous = { edge, values }; // empty successes are complete; exceptions are never retained
    return values;
  });
}

const edgeKey = (edge: EvidenceEdge): string => `${edge.beforeFen}|${edge.moveUci}|${edge.afterFen}`;

export const createRulesCastlingEventRightsLostV1Evidence = edgePopulation("rules.castling.event.rights_lost@1", (edge) => castlingRightsLost(edge.beforeFen, edge.moveUci, edge.afterFen));
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
export const createRulesTransitionEventSliderRayV2Evidence = edgePopulation("rules.transition.event.slider_ray@2", sliderMembershipChanges);
export const createRulesTacticEventCheckV1Evidence = edgePopulation("rules.tactic.event.check@1", (edge) => { const check = checkEvent(edge.beforeFen, edge.moveUci); return check === undefined ? [] : [check]; });
export const createRulesTacticEventDoubleAttackV1Evidence = edgePopulation("rules.tactic.event.double_attack@1", (edge) => { const fork = doubleAttackEvent(edge.beforeFen, edge.moveUci); return fork === undefined ? [] : [fork]; });
export const createRulesSquareEventControlV1Evidence = edgePopulation("rules.square.event.control@1", (edge) => squareControlEvents(edge.beforeFen, edge.moveUci, edge.afterFen).events, { dependency: "semantic-convention-provenance" });
export const createRulesMobilityEventPieceDestinationsV1Evidence = edgePopulation("rules.mobility.event.piece_destinations@1", (edge) => pieceDestinationEvents(edge.beforeFen, edge.moveUci, edge.afterFen).events);
export const createRulesPawnEventDynamicsV1Evidence = edgePopulation("rules.pawn.event.dynamics@1", (edge) => pawnDynamicsEvents(edge.beforeFen, edge.moveUci, edge.afterFen));
export const createRulesKingEventZoneStateV1Evidence = edgePopulation("rules.king.event.zone_state@1", (edge) => kingZoneEvents(edge.beforeFen, edge.moveUci, edge.afterFen));
function captureFactFor(edge: EvidenceEdge) {
  const fact = transitionSemanticFacts(edge.beforeFen, edge.moveUci, edge.afterFen).find((candidate) => candidate.family === "capture");
  return fact?.family === "capture" ? fact : undefined;
}
export const createRulesTacticEventDefenderRemovedV1Evidence = edgePopulation("rules.tactic.event.defender_removed@1", (edge) => defenderRemovedEvents(edge.beforeFen, edge.moveUci, edge.afterFen, captureFactFor(edge)), { dependency: "semantic-convention-provenance" });
export const createRulesTacticEventDefenderDutyRelocatedV1Evidence = edgePopulation("rules.tactic.event.defender_duty_relocated@1", (edge) => defenderDutyRelocatedEvents(edge.beforeFen, edge.moveUci, edge.afterFen), { dependency: "semantic-convention-provenance" });

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

export const createRulesExchangeReadingLandingCapturesV1Evidence = (() => {
  const route = "rules.exchange.reading.landing_captures@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN,
    landingSquare: value("a board square", candidate => typeof candidate === "string" && /^[a-h][1-8]$/u.test(candidate)) }],
    result: "single" }, ({ fen, landingSquare }: { readonly fen: string; readonly landingSquare: SquareName }): DeclaredEvidence<LandingCaptureReading> => {
    const position = positionFromFen(validFen(fen)), target = parseSquare(landingSquare);
    if (target === undefined) throw new TypeError("Landing capture requires a board square");
    const canonical = canonicalFen(position);
    const captures = legalCaptureMovesTo(position, target).map(move => {
      const result = legalExchangeForMove(position, move);
      if (result === undefined) throw new TypeError("Enumerated legal capture has no exchange result");
      return result;
    });
    const authority = Object.freeze({ fen: canonical, landingSquare });
    const result = mint(route, symbol, { fen: canonical, landingSquare, captures: Object.freeze(captures) }, authority);
    LANDING_CAPTURE_INPUTS.set(result, authority);
    return result;
  });
})();

interface BackwardPawnLegalAdvance extends EvidenceEdge {
  readonly pawn: BackwardPawnSubject;
  readonly advancedPawn: { readonly color: "white" | "black"; readonly role: "pawn"; readonly square: SquareName };
  readonly landing: LandingCaptureReading;
  readonly replies: readonly LegalExchangeResult[];
}
export const createDerivedPawnConsequenceBackwardPawnLegalAdvanceV1Evidence = (() => {
  const route = "derived.pawn.consequence.backward_pawn_legal_advance@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ source: sealed("rules.structural.reading.backward_pawn@3"), moveUci: value("a UCI move", isText), landing: sealed("rules.exchange.reading.landing_captures@1") }], result: "availability" },
    (input: { readonly source: DeclaredEvidence<BackwardPawnSnapshot>; readonly moveUci: string; readonly landing: DeclaredEvidence<LandingCaptureReading> }) => {
      assertPawnFoundationSource(input.source, "rules.structural.reading.backward_pawn@3");
      assertDeclaredEvidence(input.landing);
      const original = LANDING_CAPTURE_INPUTS.get(input.landing), receipt = evidenceValueReceipt(input.landing);
      if (sealedRoute(input.landing) !== "rules.exchange.reading.landing_captures@1" || original === undefined
        || receipt.factory !== evidenceFactorySymbol("rules.exchange.reading.landing_captures@1") || receipt.inputDigest !== authorityDigest(original)
        || original.fen !== input.landing.payload.fen || original.landingSquare !== input.landing.payload.landingSquare) throw new TypeError("Advance requires its genuine complete landing-capture invocation");
      const edge = validEdge({ beforeFen: input.source.payload.fen, moveUci: input.moveUci, afterFen: input.landing.payload.fen });
      const move = parseUci(edge.moveUci)!;
      const position = positionFromFen(edge.beforeFen);
      const castle = castlingSide(position, move), destination = castle === undefined ? move.to : kingCastlesTo(position.turn, castle);
      if (!("from" in move) || parseSquare(input.landing.payload.landingSquare) !== destination) throw new TypeError("Advance landing square differs from the exact edge destination");
      const pawn = input.source.payload.pawns.find(row => row.color === position.turn && row.pawn === edge.moveUci.slice(0, 2) && row.stop === input.landing.payload.landingSquare && row.stopOccupancy.kind === "empty");
      if (pawn === undefined || position.board.get(move.from)?.role !== "pawn" || move.promotion !== undefined) return available(Object.freeze([]));
      const advancedPawn = { color: pawn.color, role: "pawn" as const, square: pawn.stop };
      const replies = input.landing.payload.captures.filter(reply => reply.capturer.role === "pawn" && reply.capturer.color !== pawn.color
        && reply.captured.color === pawn.color && reply.captured.role === "pawn" && reply.captured.square === pawn.stop);
      const payload: BackwardPawnLegalAdvance = { ...edge, pawn, advancedPawn, landing: input.landing.payload, replies: Object.freeze(replies) };
      return available(Object.freeze([mintFoundationValue(route, symbol, payload, input, [input.source, input.landing])]));
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
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, breadth: sealed("rules.tactic.consequence.reply_breadth@1"), maxAttackerMoves: value("an integer attacker-move horizon", Number.isSafeInteger) }], result: "availability", dependency: "semantic-convention-provenance" }, ({ beforeFen, breadth, maxAttackerMoves }: { readonly beforeFen: string; readonly breadth: DeclaredEvidence<ReplyBreadth>; readonly maxAttackerMoves: number }): EvidenceAvailability<DeclaredEvidence<unknown>> => {
    const result = forcedMateAfterMove(validFen(beforeFen), breadth.payload.triggeringMove, maxAttackerMoves, breadth.payload);
    if (result.kind === "unavailable") return unavailable(result.reason);
    return available(mint(route, symbol, result.proof, { beforeFen, breadth, maxAttackerMoves }, [breadth]));
  });
})();

/**
 * rfc/review-evidence-compiler.md §3.2: the same mate-proof computation through a separate exact
 * adapter. It retains exactly the nine declared operands — including both position endpoints — and
 * drops every undeclared key, so Review can join it to one byte-identical recorded edge.
 */
export const createRulesTacticConsequenceForcedMateAfterMoveV2Evidence = (() => {
  const route = "rules.tactic.consequence.forced_mate_after_move@2";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, breadth: sealed("rules.tactic.consequence.reply_breadth@1"), maxAttackerMoves: value("an integer attacker-move horizon", Number.isSafeInteger) }], result: "availability", dependency: "semantic-convention-provenance" }, ({ beforeFen, breadth, maxAttackerMoves }: { readonly beforeFen: string; readonly breadth: DeclaredEvidence<ReplyBreadth>; readonly maxAttackerMoves: number }): EvidenceAvailability<DeclaredEvidence<ForcedMateAfterMoveProofV2>> => {
    const result = forcedMateAfterMove(validFen(beforeFen), breadth.payload.triggeringMove, maxAttackerMoves, breadth.payload);
    if (result.kind === "unavailable") return unavailable(result.reason);
    const { proof } = result;
    const exact: ForcedMateAfterMoveProofV2 = Object.freeze({
      beforeFen: proof.beforeFen, candidate: proof.candidate, afterFen: proof.afterFen, attacker: proof.attacker,
      maxAttackerMoves: proof.maxAttackerMoves, proofStatus: proof.proofStatus, proofDigest: proof.proofDigest,
      rootReplies: proof.rootReplies, nodes: proof.nodes,
    });
    return available(mint(route, symbol, exact, { beforeFen, breadth, maxAttackerMoves }, [breadth]));
  });
})();

function structuralEventsForEdge(edge: EvidenceEdge) {
  return memo(`structuralEvents|${edgeKey(edge)}`, () => structuralSemanticEventPayloads(edge.beforeFen, edge.moveUci, edge.afterFen));
}
const RETAINED_STRUCTURAL_EVENT_FAMILIES = Object.freeze(["king_zone", "passed_pawn", "piece_count", "direct_attack_count"] as const);
/** The four retained public structural populations; predecessor meanings stay in test custody. */
export const STRUCTURAL_EVENT_FACTORIES = Object.freeze(Object.fromEntries(RETAINED_STRUCTURAL_EVENT_FAMILIES.map((family) => {
  const route = `rules.structural.event.${family}@1`;
  return [route, edgePopulation(route, (edge) => structuralEventsForEdge(edge).filter((payload) => payload.family === family))];
})) as Readonly<Record<`rules.structural.event.${(typeof RETAINED_STRUCTURAL_EVENT_FAMILIES)[number]}@1`, EvidenceValueFactory<EvidenceEdge, readonly DeclaredEvidence<ReturnType<typeof structuralSemanticEventPayloads>[number]>[]>>>);

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
    const edge = validEdge({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    const reading = memo(`transitionReading|${edgeKey(input)}`, () => transitionReading(input.beforeFen, input.moveUci, input.afterFen));
    return Object.freeze((reading?.observations ?? []).filter((observation) => transitionLeaf(observation) === leaf).map((observation) => {
      const result = mint(route, symbol, observation, { beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
      LOCAL_READING_INVOCATIONS.set(result, Object.freeze({ kind: "edge", edge })); return result;
    }));
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

export const createDerivedTacticNonterminalForkSurvivalV1Evidence = (() => {
  const route = "derived.tactic.nonterminal_fork_survival@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ doubleAttack: sealed("rules.tactic.event.double_attack@1"), breadth: sealed("rules.tactic.consequence.reply_breadth@1") }], result: "single" },
    ({ doubleAttack, breadth }: { readonly doubleAttack: DeclaredEvidence<DoubleAttackEvent>; readonly breadth: DeclaredEvidence<ReplyBreadth> }) => {
      for (const [source, expected] of [[doubleAttack, "rules.tactic.event.double_attack@1"], [breadth, "rules.tactic.consequence.reply_breadth@1"]] as const) {
        assertDeclaredEvidence(source);
        if (sealedRoute(source) !== expected || evidenceValueReceipt(source).factory !== evidenceFactorySymbol(expected)) throw new TypeError("Fork survival requires the exact registered source factory");
      }
      const event = doubleAttack.payload, replies = breadth.payload;
      const edge = validEdge({ beforeFen: event.beforeFen, moveUci: event.moveUci, afterFen: event.afterFen });
      const digest = authorityDigest(edge);
      if (event.beforeFen !== edge.beforeFen || event.moveUci !== edge.moveUci || event.afterFen !== edge.afterFen ||
        [doubleAttack, breadth].some(source => evidenceValueReceipt(source).inputDigest !== digest)) throw new TypeError("Fork survival source authorities cross full legal edges");
      const after = positionFromFen(edge.afterFen);
      if (replies.afterFen !== edge.afterFen || replies.triggeringMove !== edge.moveUci || replies.count !== replies.replies.length ||
        new Set(replies.replies).size !== replies.count || replies.terminal !== (replies.count === 0) || replies.check !== after.isCheck() ||
        replies.replies.some(uci => exactMoveIdentity(edge.afterFen, uci) !== uci)) throw new TypeError("Fork survival reply population is inconsistent with its edge");
      return mint(route, symbol, nonterminalForkSurvival(event, replies), { doubleAttack, breadth }, [doubleAttack, breadth]);
    });
})();

export const createRulesTacticPredicateOverloadConflictV1Evidence = (() => {
  const route = "rules.tactic.predicate.overload_conflict@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "availability" },
    (input: EvidenceEdge): EvidenceAvailability<readonly DeclaredEvidence<OverloadedDefenderConflict>[]> => {
      const edge = validEdge(input);
      const result = overloadedDefenderResponseConflict(edge.beforeFen, edge.moveUci, edge.afterFen, captureFactFor(edge));
      if (result.kind === "unavailable") return unavailable(result.reason);
      return available(Object.freeze(result.conflicts.map(payload => mint(route, symbol, payload, edge))));
    });
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


export const createDerivedTacticDefenderExposureV2Evidence = (() => {
  const route = "derived.tactic.defender_exposure@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ beforeFen: FEN, moveUci: value("a UCI string", isText), afterFen: FEN }], result: "availability" },
    (input: EvidenceEdge): EvidenceAvailability<readonly DerivedEvidence<AvailableDefenderExposureOperands>[]> => {
      const edge = validEdge(input), passFen = defenderExposurePassFen(edge);
      if (passFen === undefined) return unavailable("invalid_turn_clone");
      const controls = createRulesSquareEventControlV1Evidence(edge);
      const readings = new Map<SquareName, DeclaredEvidence<LandingCaptureReading>>();
      const result: DerivedEvidence<AvailableDefenderExposureOperands>[] = [];
      for (const control of controls) {
        const target = defenderExposureTarget(edge, control);
        if (target === undefined) continue;
        let reading = readings.get(target.square);
        if (reading === undefined) {
          reading = createRulesExchangeReadingLandingCapturesV1Evidence({ fen: passFen, landingSquare: target.square });
          readings.set(target.square, reading);
        }
        const payload = defenderExposureValue(edge, control, reading);
        if (payload === undefined) continue;
        const inputs = Object.freeze([control, reading]);
        result.push(Object.freeze({ evidence: mint(route, symbol, payload, { edge, inputs }, inputs), inputs }));
      }
      return available(Object.freeze(result));
    });
})();


export const createDerivedMaterialEventRoleAsymmetryV2Evidence = edgeDerived("derived.material.event.role_asymmetry@2", edge => {
  const captures = TRANSITION_EVENT_FACTORIES["rules.transition.event.capture@1"](edge);
  const promotions = TRANSITION_EVENT_FACTORIES["rules.transition.event.promotion@1"](edge);
  if (captures.length > 1 || promotions.length > 1) throw new TypeError("A material edge has at most one cause per family");
  const causes = [...captures, ...promotions];
  assertMaterialCauses(edge, causes);
  if (causes.length === 0) return [];
  const before = createDerivedMaterialReadingRoleSignatureV2Evidence({ fen: edge.beforeFen });
  const after = createDerivedMaterialReadingRoleSignatureV2Evidence({ fen: edge.afterFen });
  return [{ payload: materialAsymmetryValue(edge, before, after, causes), inputs: [before, after, ...causes] }];
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
function subjectOutcomeFactory<F extends SubjectOutcomeFamily>(family: F): EvidenceValueFactory<SubjectOutcomeFactoryInput, SubjectOutcomeFactoryResult<F>> {
  const route = `derived.semantic_avoidance.${family}@2`, symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{
    receipt: value("an original foundation or wide candidate receipt", candidate => {
      try { readCandidateOutcomeSources(candidate as CandidateOutcomeReceipt); return true; } catch { return false; }
    }), moveUci: value("an exact played member of the original receipt", isText),
  }], result: "availability" }, input => {
    if (!hasExactOwnDataKeys(input, ["receipt", "moveUci"])) throw new TypeError("Subject outcome factory requires exactly receipt and moveUci data fields");
    readCandidateOutcomeSources(input.receipt);
    const played = candidateOutcomePlayedRow(input.receipt, input.moveUci);
    const computed = computeSubjectOutcomes(family, input.receipt, input.moveUci);
    const inputs = computed.kind === "available" ? computed.inputs : Object.freeze([]);
    const authority = { foundationId: candidateOutcomeFoundationId(input.receipt), compilerVersion: 8, moveUci: input.moveUci, family };
    const result: SubjectOutcomeFactoryResult<F> = computed.kind === "unavailable" ? computed
      : Object.freeze({ kind: "available", values: Object.freeze(computed.payloads.map(payload => mintFoundationValue(route, symbol, payload, authority, inputs))) });
    const invocation: SubjectOutcomeInvocation = Object.freeze({ kind: "subject_outcomes", receipt: input.receipt, moveUci: input.moveUci, family,
      edge: Object.freeze({ beforeFen: input.receipt.legalMovesInput.payload.fen, moveUci: played.moveUci, afterFen: played.afterFen }), inputs, result,
      population: computed.kind === "available" ? Object.freeze({ kind: "available", population: computed.population })
        : Object.freeze({ kind: "unavailable", family, reason: computed.reason }) });
    LOCAL_READING_INVOCATIONS.set(result, invocation);
    if (result.kind === "available") for (const item of result.values) LOCAL_READING_INVOCATIONS.set(item, invocation);
    return result;
  });
}

/** All thirteen source-owned factories; neither a selected top-two list nor a caller event list. */
export const SUBJECT_OUTCOME_FACTORIES = Object.freeze(Object.fromEntries(SUBJECT_OUTCOME_FAMILIES.map(family =>
  [`derived.semantic_avoidance.${family}@2`, subjectOutcomeFactory(family)])) as {
    readonly [F in SubjectOutcomeFamily as `derived.semantic_avoidance.${F}@2`]: EvidenceValueFactory<SubjectOutcomeFactoryInput, SubjectOutcomeFactoryResult<F>>;
  });

export const createDerivedStructuralPredicateResultV2Evidence = (() => {
  const route = "derived.structural.predicate_result@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ population: value("an original authored predicate population", candidate => {
    try { readAuthoredPredicatePopulation(candidate as AuthoredPredicatePopulation); return true; } catch { return false; }
  }) }], result: "single" }, ({ population }: { readonly population: AuthoredPredicatePopulation }) => {
    const computed = computeAuthoredPredicateReduction(population), projection = projectionFor(route), proof = computed.proof;
    const authority = initiateEvidenceReduction(computed.authority);
    const value = declareEvidence(projection.producer, { id: projection.id, version: projection.version }, computed.payload, {
      factory: symbol, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal: 0 },
    });
    publishSingleEvidenceReduction(authority, value); return value;
  });
})();

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

const RECORDED_POSITION_INVOCATIONS = new WeakMap<object, Readonly<{
  runId: string; headDigest: string; nodeId: string;
  pack: Readonly<{ id: string; digest: string }> | null;
}>>();
/** Internal recognition of the sole factory's original position, not a run/access validator. */
export function readRecordedPositionInvocation(position: DeclaredEvidence<RecordedPosition>) {
  assertDeclaredEvidence(position);
  const invocation = RECORDED_POSITION_INVOCATIONS.get(position);
  if (invocation === undefined || sealedRoute(position) !== "run.record.position@1"
    || evidenceValueReceipt(position).factory !== "createRunRecordPositionV1Evidence"
    || position.payload.nodeId !== invocation.nodeId) throw new TypeError("Recorded position was not issued by its original factory invocation");
  return invocation;
}
/** Private original-head membership; never changes the historical position value receipt. */
export function assertRecordedPositionInvocation(position: DeclaredEvidence<RecordedPosition>, run: DrillRun, nodeId: string): void {
  const invocation = readRecordedPositionInvocation(position), node = runNode(run, nodeId), receipt = evidenceValueReceipt(position);
  if (invocation.runId !== run.id || invocation.nodeId !== nodeId
    || invocation.headDigest !== recordedEventDigest(run.events) || sealedRoute(position) !== "run.record.position@1"
    || receipt.factory !== "createRunRecordPositionV1Evidence"
    || receipt.inputDigest !== evidenceDigest({ run: { run: run.id, nodes: run.nodes.length, events: run.events.length }, nodeId })
    || position.payload.nodeId !== nodeId || position.payload.ply !== node.ply || position.payload.fen !== node.fen) {
    throw new TypeError("Recorded position is not the original source head/node invocation");
  }
}

export const createRunRecordPositionV1Evidence = (() => {
  const route = "run.record.position@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, nodeId: value("a node id", isText) }], result: "single", dependency: "recorded-semantic-path", pending: RUN_PENDING }, ({ run, nodeId }: { readonly run: DrillRun; readonly nodeId: string }) => {
    const node = runNode(run, nodeId);
    const position = mint(route, symbol, Object.freeze({ nodeId: node.id, ply: node.ply, fen: node.fen }), { run, nodeId });
    RECORDED_POSITION_INVOCATIONS.set(position, Object.freeze({ runId: run.id, headDigest: recordedEventDigest(run.events), nodeId,
      pack: run.sessionKind === "pack" && run.packId !== null && run.packDigest !== null
        ? Object.freeze({ id: run.packId, digest: run.packDigest }) : null,
    }));
    return position;
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

/** D3927: original events on one genuine recorded Review path, not comparison snapshots. */
export interface RecordedReviewObjectiveTransition {
  readonly context: "review";
  readonly from: ObjectiveState;
  readonly to: ObjectiveState;
}
export interface RecordedReviewObjectives {
  readonly boundary: RecordedReviewBoundary;
  readonly items: readonly RunEvidenceItem<RecordedReviewObjectiveTransition>[];
}
function recordedObjectiveOccurrences(image: ReturnType<typeof readRecordedReviewBoundary>) {
  const path = new Map(image.path.map(entry => [entry.node.id, entry.node]));
  return image.run.events.flatMap((event, eventOrdinal) => {
    if (event.type !== "objective.state_changed") return [];
    const node = path.get(event.data.nodeId);
    return node === undefined ? [] : [{ event: event as ObjectiveStateChangedEvent, eventOrdinal, node }];
  });
}
type RecordedObjectiveOccurrence = ReturnType<typeof recordedObjectiveOccurrences>[number];
function recordedObjectiveItem(recordedReview: RecordedReviewBoundary, { event, eventOrdinal, node }: RecordedObjectiveOccurrence): RunEvidenceItem<RecordedReviewObjectiveTransition> {
  const route = "run.record.objective_transition@2";
  return Object.freeze({
    evidence: mint(route, evidenceFactorySymbol(route), Object.freeze({ context: "review" as const, from: event.data.from, to: event.data.to }),
      { recordedReview, eventOrdinal, event }), nodeId: node.id, plyOffset: node.ply,
  });
}
/** Same complete original invocation for both synchronous and cooperative acquisition. */
function completeRecordedObjectives(recordedReview: RecordedReviewBoundary, items: readonly RunEvidenceItem<RecordedReviewObjectiveTransition>[]) {
  const complete = Object.freeze([...items]), route = "run.record.objective_transition@2";
  publishRecordedReviewItems(route, recordedReview, complete);
  assertRecordedReviewResultInvocation(complete, route, recordedReview);
  return complete;
}
export const createRunRecordObjectiveTransitionV2Evidence = (() => {
  const route = "run.record.objective_transition@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ recordedReview: value("a storage-owned recorded Review boundary", isRecordedReviewBoundary) }], result: "items" },
    ({ recordedReview }: { readonly recordedReview: RecordedReviewBoundary }): readonly RunEvidenceItem<RecordedReviewObjectiveTransition>[] => {
      const image = readRecordedReviewBoundary(recordedReview);
      return completeRecordedObjectives(recordedReview, recordedObjectiveOccurrences(image).map(original => recordedObjectiveItem(recordedReview, original)));
    });
})();

declare const recordedReviewObjectiveCollectionBrand: unique symbol;
/** Internal work, never an unfinished result array or a permission grant. */
export interface RecordedReviewObjectiveCollection { readonly [recordedReviewObjectiveCollectionBrand]: true }
interface RecordedObjectiveWork {
  readonly boundary: RecordedReviewBoundary;
  readonly subjects: readonly string[];
  readonly originals: readonly RecordedObjectiveOccurrence[];
  readonly byNode: ReadonlyMap<string, readonly RecordedObjectiveOccurrence[]>;
  readonly acquired: Map<number, RunEvidenceItem<RecordedReviewObjectiveTransition>>;
  completed: number;
  busy: boolean;
}
const RECORDED_OBJECTIVE_COLLECTIONS = new WeakMap<object, RecordedObjectiveWork>();
function objectiveCollection(handle: RecordedReviewObjectiveCollection): RecordedObjectiveWork {
  const work = handle !== null && typeof handle === "object" ? RECORDED_OBJECTIVE_COLLECTIONS.get(handle) : undefined;
  if (work === undefined) throw new TypeError("Recorded objective collection is foreign or retired");
  if (work.busy) throw new TypeError("Recorded objective collection is already advancing or finishing");
  return work;
}
function assertObjectiveCollectionCurrent(handle: RecordedReviewObjectiveCollection, work: RecordedObjectiveWork): void {
  readRecordedReviewBoundary(work.boundary);
  if (RECORDED_OBJECTIVE_COLLECTIONS.get(handle) !== work) throw new TypeError("Recorded objective collection retired during acquisition");
}
/** Index the original full source only; no objective evidence is minted before its subject. */
export function beginRecordedReviewObjectiveCollection(boundary: RecordedReviewBoundary): RecordedReviewObjectiveCollection {
  const image = readRecordedReviewBoundary(boundary);
  if (image.path.length !== image.originalPath.length) throw new TypeError("Recorded objective collection requires the complete original branch");
  const originals = recordedObjectiveOccurrences(image), byNode = new Map<string, RecordedObjectiveOccurrence[]>();
  for (const original of originals) {
    const entries = byNode.get(original.node.id) ?? [];
    entries.push(original); byNode.set(original.node.id, entries);
  }
  const handle = Object.freeze({}) as RecordedReviewObjectiveCollection;
  RECORDED_OBJECTIVE_COLLECTIONS.set(handle, { boundary, subjects: image.path.map(entry => entry.node.id), originals, byNode,
    acquired: new Map(), completed: 0, busy: false });
  return handle;
}
export function advanceRecordedReviewObjectiveCollection(handle: RecordedReviewObjectiveCollection) {
  const work = objectiveCollection(handle);
  if (work.completed === work.subjects.length) throw new TypeError("Recorded objective collection has no remaining subject");
  work.busy = true;
  try {
    assertObjectiveCollectionCurrent(handle, work);
    const nodeId = work.subjects[work.completed]!;
    for (const original of work.byNode.get(nodeId) ?? []) {
      assertObjectiveCollectionCurrent(handle, work);
      const item = recordedObjectiveItem(work.boundary, original);
      assertObjectiveCollectionCurrent(handle, work);
      work.acquired.set(original.eventOrdinal, item);
    }
    assertObjectiveCollectionCurrent(handle, work);
    work.completed++;
    return Object.freeze({ nodeId, completedSubjects: work.completed, totalSubjects: work.subjects.length,
      complete: work.completed === work.subjects.length });
  } catch (error) { RECORDED_OBJECTIVE_COLLECTIONS.delete(handle); throw error; }
  finally { work.busy = false; }
}
export function finishRecordedReviewObjectiveCollection(handle: RecordedReviewObjectiveCollection): RecordedReviewObjectives {
  const work = objectiveCollection(handle);
  if (work.completed !== work.subjects.length) throw new TypeError("Recorded objective collection is incomplete");
  work.busy = true;
  try {
    assertObjectiveCollectionCurrent(handle, work);
    // Node-major execution must not reorder later updates to inherited or earlier nodes.
    const items = completeRecordedObjectives(work.boundary, work.originals.map(original => {
      const item = work.acquired.get(original.eventOrdinal);
      if (item === undefined) throw new TypeError("Recorded objective collection lost an original occurrence");
      return item;
    }));
    assertObjectiveCollectionCurrent(handle, work);
    return Object.freeze({ boundary: work.boundary, items });
  } finally { RECORDED_OBJECTIVE_COLLECTIONS.delete(handle); work.busy = false; }
}
export function cancelRecordedReviewObjectiveCollection(handle: RecordedReviewObjectiveCollection): boolean {
  return handle !== null && typeof handle === "object" && RECORDED_OBJECTIVE_COLLECTIONS.delete(handle);
}

const RECORDED_REVIEW_RESULT_INVOCATIONS = new WeakMap<object, Readonly<{ route: string; boundary: RecordedReviewBoundary }>>();
function publishRecordedReviewItems(route: string, boundary: RecordedReviewBoundary, items: readonly RunEvidenceItem<unknown>[]): readonly RunEvidenceItem<unknown>[] {
  RECORDED_REVIEW_RESULT_INVOCATIONS.set(items, Object.freeze({ route, boundary }));
  return items;
}
/** Read-only original invocation membership, including successful empty result arrays. */
export function assertRecordedReviewResultInvocation(items: readonly RunEvidenceItem<unknown>[], route: string, boundary: RecordedReviewBoundary): void {
  const invocation = RECORDED_REVIEW_RESULT_INVOCATIONS.get(items);
  if (invocation === undefined || invocation.route !== route || invocation.boundary !== boundary || !Object.isFrozen(items)) throw new TypeError("Recorded Review result is not its original boundary/factory invocation");
  const image = readRecordedReviewBoundary(boundary);
  const objectives = route === "run.record.objective_transition@2" ? recordedObjectiveOccurrences(image) : undefined;
  if (objectives !== undefined && objectives.length !== items.length) throw new TypeError("Recorded objective result omits an original event occurrence");
  for (const [index, item] of items.entries()) {
    assertDeclaredEvidence(item.evidence);
    const receipt = evidenceValueReceipt(item.evidence);
    const original = objectives?.[index];
    const authority = original === undefined ? { recordedReview: image }
      : { recordedReview: image, eventOrdinal: original.eventOrdinal, event: original.event };
    if (sealedRoute(item.evidence) !== route || receipt.factory !== evidenceFactorySymbol(route)
      || receipt.inputDigest !== evidenceDigest(authority)) throw new TypeError("Recorded Review result differs from its original full boundary authority");
    if (original !== undefined && (!Object.isFrozen(item)
      || Object.keys(item).sort().join("|") !== "evidence|nodeId|plyOffset"
      || item.nodeId !== original.node.id || item.plyOffset !== original.node.ply
      || evidenceDigest(item.evidence.payload) !== evidenceDigest({ context: "review", from: original.event.data.from, to: original.event.data.to }))) {
      throw new TypeError("Recorded objective item differs from its exact original event ordinal/node/payload");
    }
  }
}

export const createRunRecordConsequenceV1Evidence = (() => {
  const route = "run.record.consequence@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }, { run: RUN, branchId: value("a branch id", isText) }, { recordedReview: value("a storage-owned recorded Review boundary", isRecordedReviewBoundary) }], result: "items", dependency: "recorded-semantic-path", pending: RUN_PENDING }, (input: { readonly run: DrillRun; readonly comparison?: BranchComparison; readonly branchId: string } | { readonly recordedReview: RecordedReviewBoundary }): readonly RunEvidenceItem<unknown>[] => {
    if ("recordedReview" in input) {
      const source = readRecordedReviewBoundary(input.recordedReview), outcome = source.outcome;
      if (outcome.kind !== "board_terminal") return publishRecordedReviewItems(route, input.recordedReview, Object.freeze([]));
      const node = source.path.find(entry => entry.node.id === outcome.nodeId)!.node;
      return publishRecordedReviewItems(route, input.recordedReview, Object.freeze([Object.freeze({ evidence: mint(route, symbol, Object.freeze({ context: "story", terminal: true, outcome: outcome.result }), input), nodeId: node.id, plyOffset: node.ply })]));
    }
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
  return factory({ route, symbol, shape: "source_receipt", arms: [{ run: RUN, branchId: value("a branch id", isText), recordedResult: value("a decisive or drawn PGN result token", (candidate) => typeof candidate === "string" && PGN_RESULT_TOKENS.has(candidate)) }, { recordedReview: value("a storage-owned recorded Review boundary", isRecordedReviewBoundary) }], result: "items", dependency: "recorded-semantic-path", pending: "The imported PGN result token is validated as a closed token; its import-source receipt lands with recorded-semantic-path/import provenance." }, (input: { readonly run: DrillRun; readonly branchId: string; readonly recordedResult: "1-0" | "0-1" | "1/2-1/2" } | { readonly recordedReview: RecordedReviewBoundary }): readonly RunEvidenceItem<unknown>[] => {
    if ("recordedReview" in input) {
      const source = readRecordedReviewBoundary(input.recordedReview);
      if (source.outcome.kind !== "recorded_result") return publishRecordedReviewItems(route, input.recordedReview, Object.freeze([]));
      const leaf = source.path.at(-1)!.node;
      return publishRecordedReviewItems(route, input.recordedReview, Object.freeze([Object.freeze({ evidence: mint(route, symbol, Object.freeze({ context: "story", result: source.outcome.result }), input), nodeId: leaf.id, plyOffset: leaf.ply })]));
    }
    const { run, branchId, recordedResult } = input;
    const leaf = branchPath(run, branchId).at(-1)!;
    return Object.freeze([Object.freeze({ evidence: mint(route, symbol, Object.freeze({ context: "story", result: recordedResult }), { run, branchId, recordedResult }), nodeId: leaf.id, plyOffset: leaf.ply })]);
  });
})();

/**
 * rfc/evidence-presentation.md Checkpoint P ([[D2158]]): the one source-bound citation. It takes the
 * sealed resolution and exactly one sealed source item of the same reference; the resolution's text
 * must be byte-equal to the text the reference resolves to over THAT source payload (the content
 * join), and attribution comes only from the versioned registry row plus the exact source receipt.
 */
const CITATION_SOURCES = Object.freeze(["live.stockfish.eval@1", "live.stockfish.wdl@1", "live.stockfish.pv@1", "live.syzygy.result@1", "human.maia.event@1"]);
export const createDerivedCitationAttributionV1Evidence = (() => {
  const route = "derived.citation.attribution@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ resolution: sealed("run.record.evidence_ref_resolution@1"), source: sealed(...CITATION_SOURCES), sourceMetadata: optional(value("the exact source instance attribution metadata", isRecord)) }], result: "availability", dependency: "shared-resource bootstrap ([[D2401]])", pending: "The source-attribution registry is a registered in-code resource; its shared-resource root claim lands with the bootstrap." }, ({ resolution, source, sourceMetadata }: { readonly resolution: DeclaredEvidence<{ readonly reference: string; readonly text: string; readonly sourceLabel: string }>; readonly source: DeclaredEvidence<unknown>; readonly sourceMetadata?: SourceAttributionReceipt }): EvidenceAvailability<DeclaredEvidence<unknown>> => {
    const reference = resolution.payload.reference;
    const joined = resolveEvidenceReference(reference, undefined, new Map([[reference, source.payload as EvidencePayload]]));
    if (joined.payload === undefined || joined.text !== resolution.payload.text) return unavailable("citation_content_absent");
    const sourceProjection = `${source.projection.id}@${source.projection.version}`;
    const attributed = resolveSourceAttribution(sourceProjection, sourceMetadata);
    if (attributed.kind === "absent") return unavailable(attributed.reason);
    const text = resolution.payload.text;
    const citation = Object.freeze({
      content: Object.freeze({
        kind: "quoted_passage" as const, text,
        binding: Object.freeze({ projection: Object.freeze({ ...resolution.projection }), field: "text", evidenceDigest: `sha256:${evidenceValueReceipt(resolution).payloadDigest}`, valueDigest: citationValueDigest(text) }),
      }),
      source: Object.freeze({
        source: Object.freeze({ ...source.projection }), title: attributed.attribution.title, locator: attributed.attribution.locator,
        licence: attributed.attribution.licence.value, revision: attributed.attribution.revision.value,
        ...(attributed.attribution.url === undefined ? {} : { url: attributed.attribution.url }),
      }),
    });
    return available(mint(route, symbol, citation, { resolution, source, sourceMetadata: sourceMetadata ?? null }, [resolution, source]));
  });
})();

/** The presentation contract's citation value digest (`presentation.citation.value@1`), recomputed here. */
export function citationValueDigest(text: string): string {
  return `sha256:${evidenceDigest(`presentation.citation.value@1\n${canonicalizeJson(text)}`)}`;
}

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

/** rfc/review-evidence-compiler.md refusal 1: a mate score is never converted to cp; no delta crosses the type boundary. */
function scoreCp(score: ComparisonScore): number | null { return score.kind === "cp" ? score.value : null; }

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

export const createDerivedCompareEngineTrajectoryV2Evidence = (() => {
  const route = "derived.compare.engine_trajectory@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ comparisonPoint: value("an original Compare point source", isRecordedComparisonPointSource) }], result: "availability" },
    (input: { readonly comparisonPoint: RecordedComparisonPointSource }) => {
      const data = readRecordedComparisonPointSource(input.comparisonPoint);
      return data.payload === null ? unavailable<DeclaredEvidence<RecordedComparisonEnginePoint>>(data.unavailable) : available(mint(route, symbol, data.payload, input, data.inputs));
    });
})();

export const createDerivedCompareEvalDeltaV1Evidence = (() => {
  const route = "derived.compare.eval_delta@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ run: RUN, comparison: COMPARISON, branchId: value("a branch id", isText) }], result: "population", dependency: "provider-exchange-and-execution", pending: "Recorded engine entries are verified against the run's evidence.attached events; the live exchange receipt lands with provider-exchange-and-execution." }, ({ run, comparison, branchId }: { readonly run: DrillRun; readonly comparison: BranchComparison; readonly branchId: string }) => {
    const trail = [...verifiedTrail(run, comparison, branchId)].sort((left, right) => left.plyOffset - right.plyOffset);
    const result: DeclaredEvidence<unknown>[] = [];
    for (let index = 1; index < trail.length; index += 1) {
      const afterCp = scoreCp(trail[index]!.score), beforeCp = scoreCp(trail[index - 1]!.score);
      if (afterCp === null || beforeCp === null) continue;
      const delta = afterCp - beforeCp;
      if (Math.abs(delta) >= STORY_PIVOT_CP) result.push(mint(route, symbol, Object.freeze({ delta, plyOffset: trail[index]!.plyOffset }), { run, branchId, before: trail[index - 1], after: trail[index] }, [evidenceDigest(trail[index - 1]), evidenceDigest(trail[index])]));
    }
    return Object.freeze(result);
  });
})();

const RECORDED_COMPARE_EVAL_INVOCATIONS = new WeakMap<object, Readonly<RecordedCompareEvalDeltaInput>>();
/** Authenticate the original complete factory array, including an exact successful empty pair. */
export function readRecordedCompareEvalInvocation(items: readonly DeclaredEvidence<unknown>[], input: RecordedCompareEvalDeltaInput) {
  const original = RECORDED_COMPARE_EVAL_INVOCATIONS.get(items);
  if (original === undefined || original.comparison !== input.comparison || original.branchId !== input.branchId
    || original.before !== input.before || original.after !== input.after) throw new TypeError("Recorded comparison result crosses its original pair invocation");
  for (const item of items) {
    assertDeclaredEvidence(item);
    if (sealedRoute(item) !== "derived.compare.eval_delta@2" || evidenceValueReceipt(item).factory !== "createDerivedCompareEvalDeltaV2Evidence") throw new TypeError("Recorded comparison result crosses its exact factory");
  }
  return original;
}

export const createDerivedCompareEvalDeltaV2Evidence = (() => {
  const route = "derived.compare.eval_delta@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ before: sealed("recorded.inspector.eval_packet@1"), after: sealed("recorded.inspector.eval_packet@1"),
    comparison: value("an owned recorded comparison", isRecordedComparisonSource), branchId: value("a granted branch id", isText) }], result: "population" },
    (input: RecordedCompareEvalDeltaInput) => {
      const payload = recordedComparisonEvalDeltaValue(input);
      const result = Object.freeze(payload === undefined ? [] : [mint(route, symbol, payload, input, [input.before, input.after])]);
      RECORDED_COMPARE_EVAL_INVOCATIONS.set(result, Object.freeze({ ...input }));
      return result;
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

export const createDerivedCompareStructureDeltaV2Evidence = (() => {
  const route = "derived.compare.structure_delta@2", symbol = evidenceFactorySymbol(route);
  const populationInput = value("an original complete recorded structural population", candidate => {
    try { readComparisonStructuralPopulation(candidate as RecordedComparisonStructuralPopulation); return true; } catch { return false; }
  });
  return factory({ route, symbol, shape: "derived", arms: [{ population: populationInput, branchId: value("a granted branch id", isText) }], result: "items" },
    ({ population, branchId }: { readonly population: RecordedComparisonStructuralPopulation; readonly branchId: string }): readonly RunEvidenceItem<ScopedStructuralObservationChange>[] => {
      const computed = computeComparisonReduction(population, branchId), projection = projectionFor(route), proof = computed.proof;
      const authority = initiateEvidenceReduction(computed.authority);
      const result = Object.freeze(computed.appearances.map((appearance, ordinal) => Object.freeze({ nodeId: appearance.nodeId, plyOffset: appearance.plyOffset,
        evidence: declareEvidence(projection.producer, { id: projection.id, version: projection.version }, appearance.payload, {
          factory: symbol, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal },
        }) })));
      publishEvidenceReduction(authority, result);
      return result;
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

export const createRunRecordComparisonPathV1Evidence = (() => {
  const route = "run.record.comparison_path@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ comparison: value("an owned recorded comparison", isRecordedComparisonSource), branchId: value("a granted branch id", isText) }], result: "single" },
    ({ comparison, branchId }: { readonly comparison: RecordedComparisonSource; readonly branchId: string }) =>
      mint(route, symbol, recordedComparisonPathValue(comparison, branchId), { comparison, branchId }));
})();

export const createDerivedComparePieceRouteV2Evidence = (() => {
  const route = "derived.compare.piece_route@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ comparison: value("an owned recorded comparison", isRecordedComparisonSource), branchId: value("a granted branch id", isText), path: sealed("run.record.comparison_path@1") }], result: "population" },
    ({ comparison, branchId, path }: { readonly comparison: RecordedComparisonSource; readonly branchId: string; readonly path: DeclaredEvidence<RecordedComparisonPath> }) => {
      assertRecordedComparisonPath(comparison, branchId, path);
      return Object.freeze(recordedPieceRoutes(path.payload.nodes.map(entry => entry.node)).map(payload => mint(route, symbol, payload, { comparison, branchId, path }, [path])));
    });
})();

const isLearnerSide = (candidate: unknown): boolean => candidate === "white" || candidate === "black";

export const createDerivedStoryLastLevelV2Evidence = (() => {
  const route = "derived.story.last_level@2", symbol = evidenceFactorySymbol(route);
  const populationInput = value("an original complete recorded last-level population", candidate => {
    try { readRecordedLastLevelPopulation(candidate as RecordedLastLevelPopulation); return true; } catch { return false; }
  });
  return factory({ route, symbol, shape: "derived", arms: [{ population: populationInput }], result: "items" },
    ({ population }: { readonly population: RecordedLastLevelPopulation }): readonly RunEvidenceItem<RecordedLastLevelValue>[] => {
      const computed = computeLastLevelReduction(population), projection = projectionFor(route), proof = computed.proof;
      const authority = initiateEvidenceReduction(computed.authority);
      const result = Object.freeze(computed.selected.map((selected, ordinal) => Object.freeze({ nodeId: selected.nodeId, plyOffset: selected.plyOffset,
        evidence: declareEvidence(projection.producer, { id: projection.id, version: projection.version }, selected.payload, {
          factory: symbol, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal },
        }) })));
      publishEvidenceReduction(authority, result); return result;
    });
})();

/**
 * rfc/review-evidence-compiler.md §5: last-level evaluates typed cp review points only and converts
 * White evidence to the learner's perspective here, at the consumer. A mate point can neither
 * satisfy nor fail the within-one-pawn convention.
 */
export const createDerivedStoryLastLevelV1Evidence = (() => {
  const route = "derived.story.last_level@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ path: value("an ordered recorded path of node ids", (candidate) => Array.isArray(candidate) && candidate.every(isText)), side: value("a learner side", isLearnerSide), recordedResult: value("a PGN result token", (candidate) => typeof candidate === "string" && PGN_RESULT_TOKENS.has(candidate)), points: sealedList(0, null, "derived.review.eval_point@1") }], result: "items", dependency: "provider-exchange-and-execution" }, ({ path, side, recordedResult, points }: { readonly path: readonly string[]; readonly side: "white" | "black"; readonly recordedResult: "1-0" | "0-1" | "1/2-1/2"; readonly points: readonly DeclaredEvidence<ReviewEnginePoint>[] }): readonly RunEvidenceItem<unknown>[] => {
    const lost = (side === "white" && recordedResult === "0-1") || (side === "black" && recordedResult === "1-0");
    if (!lost) return Object.freeze([]);
    const order = new Map(path.map((nodeId, index) => [nodeId, index]));
    let last: { readonly point: DeclaredEvidence<ReviewEnginePoint>; readonly index: number; readonly learnerCp: number; readonly whiteCp: number } | undefined;
    for (const point of points) {
      const index = order.get(point.payload.position.payload.nodeId);
      if (index === undefined) throw new TypeError("Last-level point is not on the recorded path");
      const whiteCp = reviewPointCentipawns(point.payload);
      if (whiteCp === null) continue;
      const learnerCp = learnerCentipawns(whiteCp, side);
      if (learnerCp >= -100 && (last === undefined || index > last.index)) last = { point, index, learnerCp, whiteCp };
    }
    if (last === undefined) return Object.freeze([]);
    const position = last.point.payload.position.payload;
    return Object.freeze([Object.freeze({ evidence: mint(route, symbol, Object.freeze({ recordedResult, evaluation: Object.freeze({ nodeId: position.nodeId, whiteCentipawns: last.whiteCp, learnerCentipawns: last.learnerCp, side }) }), { path, side, recordedResult, points }, [last.point]), nodeId: position.nodeId, plyOffset: position.ply })]);
  });
})();

const MOMENT_KIND_SOURCES: Readonly<Record<string, string>> = Object.freeze({
  irreversibility: "derived.pivotal.irreversibility@1", phase_change: "derived.pivotal.phase_change@1",
  human_divergence: "derived.pivotal.human_divergence@1", option_collapse: "derived.pivotal.option_collapse@1",
  eval_pivot: "derived.review.eval_delta@2", mate_transition: "derived.review.mate_transition@2", last_level: "derived.story.last_level@1",
  endgame_entry: "rules.endgame.classification@1", shape_span: "theory.shapes.firing@1",
});

export const createDerivedStoryRankV3Evidence = (() => {
  const route = "derived.story.rank@3", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ recordedReview: value("an original complete recorded Review moment source", candidate => {
    try { readRecordedReviewMoments(candidate as RecordedReviewMomentSource); return true; } catch { return false; }
  }) }], result: "single" }, ({ recordedReview }: { readonly recordedReview: RecordedReviewMomentSource }): DeclaredEvidence<{ readonly rank: readonly string[] }> => {
    const computed = computeStoryRankReduction(recordedReview), projection = projectionFor(route), proof = computed.proof;
    const authority = initiateEvidenceReduction(computed.authority);
    const value = declareEvidence(projection.producer, { id: projection.id, version: projection.version }, computed.payload, {
      factory: symbol, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal: 0 },
    });
    publishSingleEvidenceReduction(authority, value); return value;
  });
})();

export const createDerivedStoryRankV2Evidence = (() => {
  const route = "derived.story.rank@2";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ moments: value("a Story moment list", Array.isArray) }], result: "single" }, ({ moments }: { readonly moments: readonly StoryMoment[] }) => {
    const sources: DeclaredEvidence<unknown>[] = [];
    for (const moment of moments) {
      const routes = new Set(moment.evidence.map((item) => { assertDeclaredEvidence(item); sources.push(item); return sealedRoute(item); }));
      for (const kind of moment.kinds) {
        const required = kind === "outcome" ? ["run.record.consequence@1", "run.record.imported_result@1"] : [MOMENT_KIND_SOURCES[kind]!];
        if (!required.some((candidate) => routes.has(candidate))) throw new TypeError(`Story moment kind ${kind} has no sealed ${required.join(" | ")} evidence`);
      }
      // The moment's typed evaluation pair must be exactly the endpoints of its sealed transition.
      const transition = moment.evidence.find((item) => sealedRoute(item) === "derived.review.eval_delta@2" || sealedRoute(item) === "derived.review.mate_transition@2")?.payload as ReviewEvalDelta | ReviewMateTransition | undefined;
      if (moment.evaluation !== null) {
        if (transition === undefined) throw new TypeError("Story moment evaluation has no sealed review transition");
        const before = transition.before.payload.evaluation.payload.payload.score;
        const after = transition.after.payload.evaluation.payload.payload.score;
        if (!sameDigest(before, moment.evaluation.before) || !sameDigest(after, moment.evaluation.after)) throw new TypeError("Story moment evaluations are not its sealed review transition");
      }
    }
    return mint(route, symbol, Object.freeze({ rank: rankStoryMoments(moments) }), { moments: moments.map((moment) => ({ nodeId: moment.nodeId, ply: moment.ply, kinds: moment.kinds, evidence: moment.evidence })) }, sources);
  });
})();

// ---------------------------------------------------------------------------------------------
// rfc/review-evidence-compiler.md §§1–3: the typed Review projections. Each derivation retains its
// exact sealed inputs literally and is measured/reported; none widens the provider delivery.
// ---------------------------------------------------------------------------------------------

const sameCanonicalFen = (left: string, right: string): boolean => left === right;
const REVIEW_POINT_INVOCATIONS = new WeakMap<object, Readonly<{ evaluation: DeclaredEvidence<StockfishPositionEvaluation>; position: DeclaredEvidence<RecordedPosition> }>>();
const REVIEW_POINT_RESULT_INVOCATIONS = new WeakMap<object, Readonly<{ evaluation: DeclaredEvidence<StockfishPositionEvaluation>; position: DeclaredEvidence<RecordedPosition> }>>();
/** Original availability result, including a genuine rejected delivery. No registration setter. */
export function readReviewPointResultInvocation(result: unknown) {
  const inputs = result !== null && typeof result === "object" ? REVIEW_POINT_RESULT_INVOCATIONS.get(result) : undefined;
  if (inputs === undefined) throw new TypeError("Review point result is not an original factory invocation");
  return inputs;
}
/** Exact literal inputs used at the sole point factory, not inferred from equal payloads later. */
export function readReviewPointInvocation(point: DeclaredEvidence<ReviewEnginePoint>) {
  assertDeclaredEvidence(point);
  const inputs = REVIEW_POINT_INVOCATIONS.get(point), receipt = evidenceValueReceipt(point);
  if (inputs === undefined || sealedRoute(point) !== "derived.review.eval_point@1" || receipt.factory !== "createDerivedReviewEvalPointV1Evidence"
    || point.payload.position !== inputs.position || point.payload.evaluation !== inputs.evaluation
    || receipt.sourceDigests.length !== 2 || receipt.sourceDigests[0] !== evidenceValueReceipt(inputs.evaluation).payloadDigest
    || receipt.sourceDigests[1] !== evidenceValueReceipt(inputs.position).payloadDigest) throw new TypeError("Review point is not the original ordered evaluation/position invocation");
  return inputs;
}

export interface RecordedAnalyzeLineValue {
  readonly nodeId: string;
  readonly entryNodeId: string;
  readonly operands: AnalyzeLineOperands;
}
type AnalyzeRoute = "derived.review.analysis_typed_pv@1" | "derived.review.analysis_recorded_pv@1" | "derived.review.analysis_recorded_first@1";
const ANALYZE_ROUTE_ARM: Readonly<Record<AnalyzeRoute, RecordedAnalyzeArm>> = Object.freeze({
  "derived.review.analysis_typed_pv@1": "typed_pv",
  "derived.review.analysis_recorded_pv@1": "recorded_bestline",
  "derived.review.analysis_recorded_first@1": "recorded_search_first",
});
const ANALYZE_INVOCATIONS = new WeakMap<object, Readonly<{ route: AnalyzeRoute; source: RecordedAnalyzeLineSource }>>();
/** Original invocation and complete retained operands, not a copied or rehashed payload. */
export function readRecordedAnalyzeLineInvocation(result: unknown) {
  const invocation = result !== null && typeof result === "object" ? ANALYZE_INVOCATIONS.get(result) : undefined;
  if (invocation === undefined) throw new TypeError("Analyze value is not its original factory invocation");
  const data = readRecordedAnalyzeLineSource(invocation.source);
  if (data.sourceArm !== null && data.sourceArm !== ANALYZE_ROUTE_ARM[invocation.route]) throw new TypeError("Analyze invocation crosses its literal route/source arm");
  if (isDeclaredEvidence(result)) {
    const receipt = evidenceValueReceipt(result);
    if (sealedRoute(result) !== invocation.route || receipt.factory !== evidenceFactorySymbol(invocation.route)
      || data.outcome.kind !== "available" || data.operands === null
      || !sameDigest(result.payload, { nodeId: data.reviewed.id, entryNodeId: data.parent.id, operands: data.operands })
      || !sameDigest(receipt.sourceDigests, data.inputs.map(input => evidenceValueReceipt(input).payloadDigest))) {
      throw new TypeError("Analyze value lost its original source/operand relationship");
    }
  }
  return Object.freeze({ ...invocation, data });
}
const analyzeSource = (expected: RecordedAnalyzeArm) => value(`an original ${expected} Analyze collection or actual absence`, candidate => {
  try {
    const data = readRecordedAnalyzeLineSource(candidate as RecordedAnalyzeLineSource);
    return data.sourceArm === expected || data.sourceArm === null && data.outcome.kind === "unavailable";
  } catch { return false; }
});
function analyzeValue(route: AnalyzeRoute, source: RecordedAnalyzeLineSource): EvidenceAvailability<DeclaredEvidence<RecordedAnalyzeLineValue>> {
  const data = readRecordedAnalyzeLineSource(source), invocation = Object.freeze({ route, source });
  if (data.sourceArm !== null && data.sourceArm !== ANALYZE_ROUTE_ARM[route]) throw new TypeError("Analyze factory crosses its literal route/source arm");
  if (data.outcome.kind !== "available" || data.operands === null) {
    const result = unavailable<DeclaredEvidence<RecordedAnalyzeLineValue>>(data.outcome.kind === "unavailable" || data.outcome.kind === "failed" ? data.outcome.reason : "no_witness");
    ANALYZE_INVOCATIONS.set(result, invocation); return result;
  }
  if (data.packet === null || data.event === null || data.ordinal === null || data.sourceArm === null) throw new TypeError("Analyze available value has no original selected occurrence");
  const expected = data.sourceArm === "typed_pv" ? ["run.record.edge@1", "recorded.inspector.eval_packet@1", "live.stockfish.principal_variation@1"]
    : ["run.record.edge@1", data.sourceArm === "recorded_bestline" ? "recorded.inspector.pv_packet@1" : "recorded.inspector.eval_packet@1"];
  if (!sameDigest(data.inputs.map(sealedRoute), expected) || data.inputs[0] !== data.edge || data.inputs[1] !== data.packet
    || data.sourceArm === "typed_pv" && (data.typed === null || data.inputs[2] !== data.typed)
    || data.packet.payload.event !== data.event || data.run.events[data.ordinal] !== data.event) throw new TypeError("Analyze source crosses its literal original inputs");
  const payload = Object.freeze({ nodeId: data.reviewed.id, entryNodeId: data.parent.id, operands: data.operands });
  const item = mint(route, evidenceFactorySymbol(route), payload,
    { branchId: data.branchId, nodeId: data.reviewed.id, edge: data.edge, packet: data.packet, ordinal: data.ordinal }, data.inputs);
  const result = available(item);
  ANALYZE_INVOCATIONS.set(item, invocation); ANALYZE_INVOCATIONS.set(result, invocation);
  readRecordedAnalyzeLineInvocation(item); return result;
}
export const createDerivedReviewAnalysisTypedPvV1Evidence = (() => {
  const route = "derived.review.analysis_typed_pv@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ source: analyzeSource("typed_pv") }], result: "availability", dependency: "review-map" },
    ({ source }: { readonly source: RecordedAnalyzeLineSource }) => analyzeValue(route, source));
})();
export const createDerivedReviewAnalysisRecordedPvV1Evidence = (() => {
  const route = "derived.review.analysis_recorded_pv@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ source: analyzeSource("recorded_bestline") }], result: "availability", dependency: "review-map" },
    ({ source }: { readonly source: RecordedAnalyzeLineSource }) => analyzeValue(route, source));
})();
export const createDerivedReviewAnalysisRecordedFirstV1Evidence = (() => {
  const route = "derived.review.analysis_recorded_first@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ source: analyzeSource("recorded_search_first") }], result: "availability", dependency: "review-map" },
    ({ source }: { readonly source: RecordedAnalyzeLineSource }) => analyzeValue(route, source));
})();

export const createDerivedReviewEvalPointV1Evidence = (() => {
  const route = "derived.review.eval_point@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ evaluation: sealed("live.stockfish.position_eval@1"), position: sealed("run.record.position@1") }], result: "availability", dependency: "provider-exchange-and-execution" }, ({ evaluation, position }: { readonly evaluation: DeclaredEvidence<StockfishPositionEvaluation>; readonly position: DeclaredEvidence<RecordedPosition> }): EvidenceAvailability<DeclaredEvidence<ReviewEnginePoint>> => {
    const inputs = Object.freeze({ evaluation, position });
    if (!sameCanonicalFen(evaluation.payload.payload.fen, position.payload.fen)) {
      const result = unavailable<DeclaredEvidence<ReviewEnginePoint>>("position_mismatch");
      REVIEW_POINT_RESULT_INVOCATIONS.set(result, inputs);
      return result;
    }
    const point = mint(route, symbol, Object.freeze({ projectionId: "derived.review.eval_point@1" as const, position, evaluation }), { evaluation, position }, [evaluation, position]);
    REVIEW_POINT_INVOCATIONS.set(point, inputs);
    const result = available(point);
    REVIEW_POINT_RESULT_INVOCATIONS.set(result, inputs);
    return result;
  });
})();

type ReviewTransitionRoute = "derived.review.eval_delta@2" | "derived.review.mate_transition@2";
const REVIEW_TRANSITION_INVOCATIONS = new WeakMap<object, Readonly<{
  route: ReviewTransitionRoute; before: DeclaredEvidence<ReviewEnginePoint>; after: DeclaredEvidence<ReviewEnginePoint>;
}>>();
function recordReviewTransitionResult<T>(route: ReviewTransitionRoute, before: DeclaredEvidence<ReviewEnginePoint>, after: DeclaredEvidence<ReviewEnginePoint>, result: EvidenceAvailability<T>): EvidenceAvailability<T> {
  REVIEW_TRANSITION_INVOCATIONS.set(result, Object.freeze({ route, before, after }));
  return result;
}
/** Read-only original availability membership, including incomparable/nonmatching endpoints. */
export function readReviewTransitionResultInvocation(result: unknown, route: ReviewTransitionRoute) {
  const inputs = result !== null && typeof result === "object" ? REVIEW_TRANSITION_INVOCATIONS.get(result) : undefined;
  if (inputs === undefined || inputs.route !== route) throw new TypeError("Review transition result is not its original factory invocation");
  readReviewPointInvocation(inputs.before); readReviewPointInvocation(inputs.after);
  return inputs;
}

export const createDerivedReviewEvalDeltaV2Evidence = (() => {
  const route = "derived.review.eval_delta@2";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ before: sealed("derived.review.eval_point@1"), after: sealed("derived.review.eval_point@1") }], result: "availability", dependency: "provider-exchange-and-execution" }, ({ before, after }: { readonly before: DeclaredEvidence<ReviewEnginePoint>; readonly after: DeclaredEvidence<ReviewEnginePoint> }): EvidenceAvailability<DeclaredEvidence<ReviewEvalDelta>> => {
    const comparability = reviewPointComparability(before.payload, after.payload);
    if (comparability !== "comparable") return recordReviewTransitionResult(route, before, after, unavailable(comparability));
    const beforeCp = reviewPointCentipawns(before.payload), afterCp = reviewPointCentipawns(after.payload);
    if (beforeCp === null || afterCp === null) return recordReviewTransitionResult(route, before, after, unavailable("mate_operand"));
    return recordReviewTransitionResult(route, before, after, available(mint(route, symbol, Object.freeze({ projectionId: "derived.review.eval_delta@2" as const, before, after, deltaCp: afterCp - beforeCp }), { before, after }, [before, after])));
  });
})();

export const createDerivedReviewMateTransitionV2Evidence = (() => {
  const route = "derived.review.mate_transition@2";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ before: sealed("derived.review.eval_point@1"), after: sealed("derived.review.eval_point@1") }], result: "availability", dependency: "provider-exchange-and-execution" }, ({ before, after }: { readonly before: DeclaredEvidence<ReviewEnginePoint>; readonly after: DeclaredEvidence<ReviewEnginePoint> }): EvidenceAvailability<DeclaredEvidence<ReviewMateTransition>> => {
    const comparability = reviewPointComparability(before.payload, after.payload);
    if (comparability !== "comparable") return recordReviewTransitionResult(route, before, after, unavailable(comparability));
    const changes = mateTransitionChanges(before.payload.evaluation.payload.payload.score, after.payload.evaluation.payload.payload.score);
    if (typeof changes === "string") return recordReviewTransitionResult(route, before, after, unavailable(changes));
    return recordReviewTransitionResult(route, before, after, available(mint(route, symbol, Object.freeze({ projectionId: "derived.review.mate_transition@2" as const, before, after, changes }), { before, after }, [before, after])));
  });
})();

export const createDerivedReviewWdlWhiteV1Evidence = (() => {
  const route = "derived.review.wdl_white@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ evaluation: sealed("live.stockfish.position_eval@1") }], result: "single", dependency: "provider-exchange-and-execution" }, ({ evaluation }: { readonly evaluation: DeclaredEvidence<StockfishPositionEvaluation> }): DeclaredEvidence<WhiteWdlPoint> => {
    const fen = evaluation.payload.payload.fen;
    const normalized = whiteWdl(fen, evaluation.payload.payload.rawWdl);
    return mint(route, symbol, Object.freeze({ projectionId: "derived.review.wdl_white@1" as const, source: evaluation, fen, rawSubject: normalized.rawSubject, perspective: "white" as const, win: normalized.win, draw: normalized.draw, loss: normalized.loss }), { evaluation }, [evaluation]);
  });
})();

export const createDerivedReviewWdlPointV1Evidence = (() => {
  const route = "derived.review.wdl_point@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ normalized: sealed("derived.review.wdl_white@1"), position: sealed("run.record.position@1") }], result: "availability", dependency: "provider-exchange-and-execution" }, ({ normalized, position }: { readonly normalized: DeclaredEvidence<WhiteWdlPoint>; readonly position: DeclaredEvidence<RecordedPosition> }): EvidenceAvailability<DeclaredEvidence<ReviewWdlPoint>> => {
    if (!sameCanonicalFen(normalized.payload.fen, position.payload.fen)) return unavailable("position_mismatch");
    return available(mint(route, symbol, Object.freeze({ projectionId: "derived.review.wdl_point@1" as const, position, normalized }), { normalized, position }, [normalized, position]));
  });
})();

export const createDerivedStoryTitleV2Evidence = (() => {
  const route = "derived.story.title@2";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ story: value("a Story title input", isRecord), rank: sealed("derived.story.rank@2") }], result: "single" }, ({ story, rank }: { readonly story: StoryTitleInput; readonly rank: DeclaredEvidence<{ readonly rank: readonly string[] }> }) => {
    if (!sameDigest(story.rank, rank.payload.rank)) throw new TypeError("Story title rank is not its sealed rank evidence");
    const title = suggestTitle(story);
    return mint(route, symbol, Object.freeze({ title, rank: story.rank, outcome: story.outcome }), { story: { side: story.side, outcome: story.outcome, rank: story.rank }, rank }, [rank]);
  });
})();

// ---------------------------------------------------------------------------------------------
// Pivotal markers: four exact derived projections
// ---------------------------------------------------------------------------------------------

type WholePivotalInput = { readonly run: DrillRun; readonly branchId: string };
type ScopedPivotalInput = { readonly recordedPivotal: RecordedPivotalSource };
type PivotalInput<K extends PivotalKind, V extends 1 | 2> = V extends 2 ? ScopedPivotalInput : K extends "irreversibility" ? WholePivotalInput | ScopedPivotalInput : WholePivotalInput;

const RECORDED_RULE_PIVOTAL_INVOCATIONS = new WeakMap<object, Readonly<{
  source: RecordedPivotalSource; route: string; items: readonly DerivedEvidence<PivotalMarker>[];
}>>();
/** Original scoped rule calculation, even when the unchanged convention emits no marker. */
export function readRecordedRulePivotalInvocation(items: readonly DerivedEvidence<PivotalMarker>[], source: RecordedPivotalSource) {
  const proof = RECORDED_RULE_PIVOTAL_INVOCATIONS.get(items), data = recordedPivotalData(source);
  const kind = data.authority.kind, route = `derived.pivotal.${kind}@${kind === "irreversibility" ? 1 : 2}`;
  if (kind === "human_divergence" || proof === undefined || proof.source !== source || proof.route !== route || proof.items !== items) throw new TypeError("Recorded rule pivotal result is not its original scoped factory invocation");
  for (const item of items) {
    assertDeclaredEvidence(item.evidence);
    const receipt = evidenceValueReceipt(item.evidence);
    if (sealedRoute(item.evidence) !== route || receipt.factory !== evidenceFactorySymbol(route)
      || receipt.sourceDigests.length !== item.inputs.length
      || item.inputs.some((input, index) => receipt.sourceDigests[index] !== evidenceValueReceipt(input).payloadDigest)) throw new TypeError("Recorded rule pivotal item lost its original literal inputs");
    for (const input of item.inputs) if (sealedRoute(input) === "run.record.position@1") assertRecordedPositionInvocation(input as DeclaredEvidence<RecordedPosition>, data.run, (input.payload as RecordedPosition).nodeId);
  }
  return proof;
}

function pivotalFactory<K extends PivotalKind, V extends 1 | 2>(kind: K, version: V): EvidenceValueFactory<PivotalInput<K, V>, readonly DerivedEvidence<PivotalMarker>[]> {
  const route = `derived.pivotal.${kind}@${version}`;
  const symbol = evidenceFactorySymbol(route);
  const scopedArm = { recordedPivotal: value("an owned recorded pivotal source", isRecordedPivotalSource) };
  const arms = version === 2 ? [scopedArm] : [{ run: RUN, branchId: value("a branch id", isText) }, ...(kind === "irreversibility" ? [scopedArm] : [])];
  return factory({ route, symbol, shape: "derived", arms, result: "items", dependency: kind === "human_divergence" ? "provider-exchange-and-execution" : "recorded-semantic-path", pending: kind === "human_divergence" ? "The Maia distribution is the run's recorded opponent selection; the model exchange receipt lands with provider-exchange-and-execution." : RUN_PENDING }, (input: PivotalInput<K, V>) => {
    const source = "recordedPivotal" in input ? input.recordedPivotal : undefined;
    const scoped = source === undefined ? undefined : recordedPivotalData(source, kind);
    const { run, branchId } = scoped === undefined ? input as WholePivotalInput : { run: scoped.run, branchId: scoped.authority.branchId };
    const path = scoped?.authority.path ?? branchPath(run, branchId);
    const byId = new Map(path.map((node, index) => [node.id, { node, index }]));
    const markers = source === undefined ? pivotalMarkerPayloadsForKind(run, branchId, kind) : pivotalRecordedPayloads(source, kind);
    const items = Object.freeze(markers.map((marker) => {
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
        // §3.4: the previous definite phase may precede an intervening unclear band.
        // Retain both actual readings and their recorded occurrences, not just the label shown.
        const prior = path.slice(0, located.index).reverse().find((node) => phaseBandReading(node.fen).phase !== "unclear");
        if (prior === undefined) throw new TypeError("Phase-change marker lost its prior definite phase witness");
        const before = createRulesPhaseReadingV2Evidence({ fen: prior.fen });
        const after = createRulesPhaseReadingV2Evidence({ fen: located.node.fen });
        const detail = marker.detail as { readonly from: string; readonly to: string };
        if (before.payload.phase !== detail.from || after.payload.phase !== detail.to) throw new TypeError("Phase-change marker disagrees with its exact phase witnesses");
        inputs = [before, createRunRecordPositionV1Evidence({ run, nodeId: prior.id }), after, position];
      } else if (kind === "human_divergence") {
        const selection = pivotalMarkerRecordedSelection(marker);
        if (selection?.candidates === undefined) throw new TypeError("Human-divergence marker lost its own recorded selection");
        // Use the existing closed page arm over the actual retained source record, never
        // rebuild a distribution from marker masses or borrow the latest sibling selection.
        const page = Object.freeze({ nodeId: marker.nodeId, engine: selection.engine,
          targetElo: run.opponentPolicy.targetElo ?? null, candidates: selection.candidates });
        inputs = [createHumanMaiaPolicyV1Evidence({ page }), position];
      } else {
        const detail = marker.detail as { readonly color: "white" | "black"; readonly priorCount: number; readonly count: number; readonly nextCount: number };
        const sameSide = path.filter((node) => positionFromFen(node.fen).turn === detail.color);
        const index = sameSide.findIndex((node) => node.id === marker.nodeId);
        const prior = sameSide[index - 1], next = sameSide[index + 1];
        if (prior === undefined || next === undefined) throw new TypeError("Sustained-collapse marker lost its complete same-side witness span");
        const nodes = [prior, located.node, next];
        const readings = nodes.map((node) => createRulesMobilityReadingLegalMovesV1Evidence({ fen: node.fen }));
        const counts = readings.map((reading) => reading.payload.pieces.reduce((count, piece) => count + piece.moves.length, 0));
        if (counts[0] !== detail.priorCount || counts[1] !== detail.count || counts[2] !== detail.nextCount) throw new TypeError("Sustained-collapse marker disagrees with its exact mobility witnesses");
        inputs = nodes.flatMap((node, index) => [readings[index]!, createRunRecordPositionV1Evidence({ run, nodeId: node.id })]);
      }
      const authority = source === undefined ? { run, branchId, nodeId: marker.nodeId } : { route, recordedPivotal: source, marker, inputs };
      return Object.freeze({ evidence: mint(route, symbol, marker, authority, inputs), inputs: Object.freeze(inputs) });
    }));
    if (source !== undefined) RECORDED_RULE_PIVOTAL_INVOCATIONS.set(items, Object.freeze({ source, route, items }));
    return items;
  });
}

type RecordedHumanObservation = Readonly<{
  event: Extract<DrillRun["events"][number], { type: "opponent.move_selected" }>;
  resolved: ResolvedRunSubject;
  position: DeclaredEvidence<RecordedPosition>;
  selection: EvidenceAvailability<DeclaredEvidence<RecordedInspectorSelection>>;
  disposition: "source_absent" | "nonmatch" | "matched";
  item: DerivedEvidence<RecordedHumanDivergenceMarker> | null;
}>;
const RECORDED_HUMAN_INVOCATIONS = new WeakMap<object, Readonly<{ source: RecordedPivotalSource; observations: readonly RecordedHumanObservation[] }>>();

function assertRecordedHumanObservation(data: ReturnType<typeof recordedPivotalData>, observation: Pick<RecordedHumanObservation, "event" | "resolved" | "position" | "selection">): void {
  const { event, resolved, position, selection } = observation;
  assertResolvedRunSubject(resolved);
  assertRecordedPositionInvocation(position, data.run, event.data.nodeId);
  if (data.run.events[event.seq - 1] !== event || resolved.subject.kind !== "run_node" || resolved.subject.runId !== data.run.id
    || resolved.subject.eventHeadDigest !== data.authority.eventHeadDigest || resolved.headSeq !== data.run.events.length
    || resolved.subject.nodeId !== event.data.nodeId || resolved.subject.branchId !== event.data.branchId
    || resolved.subject.fen !== position.payload.fen) throw new TypeError("Recorded human observation crosses its actual full-head origin/position");
  if (selection.kind === "available") {
    assertDeclaredEvidence(selection.value);
    if (sealedRoute(selection.value) !== "recorded.inspector.maia_selection@1" || evidenceValueReceipt(selection.value).factory !== "createRecordedInspectorMaiaSelectionV1Evidence"
      || !sameDigest(selection.value.payload.event, event) || !sameDigest(selection.value.payload.subject, resolved.subject)
      || selection.value.payload.requestedTargetElo !== (data.run.opponentPolicy.targetElo ?? null)) throw new TypeError("Recorded human selection crossed its actual origin/head/event/context");
  } else if (selection.reason !== "source_absent" || event.data.selection.candidates !== undefined) throw new TypeError("Recorded human missing-source disposition changed");
}

/** Actual original result + complete observation dispositions, including absent candidates. */
export function readRecordedHumanDivergenceInvocation(result: readonly DerivedEvidence<RecordedHumanDivergenceMarker>[], source: RecordedPivotalSource) {
  const proof = RECORDED_HUMAN_INVOCATIONS.get(result), data = recordedPivotalData(source, "human_divergence");
  const originals = data.humanObservations;
  if (proof === undefined || proof.source !== source || originals === undefined || proof.observations.length !== originals.length) throw new TypeError("Recorded human result is not its original complete source invocation");
  for (const [index, observation] of proof.observations.entries()) {
    const original = originals[index]!;
    if (observation.event !== original.event || observation.resolved !== original.resolved) throw new TypeError("Recorded human result crossed its original observation");
    assertRecordedHumanObservation(data, observation);
    if (observation.item !== null) {
      const item = observation.item; assertDeclaredEvidence(item.evidence);
      if (observation.selection.kind !== "available" || observation.disposition !== "matched" || item.inputs[0] !== observation.selection.value || item.inputs[1] !== observation.position
        || item.evidence.payload.selection !== observation.selection.value || item.evidence.payload.position !== observation.position) throw new TypeError("Recorded human marker lost its exact literal inputs");
    }
  }
  const order = new Map(data.authority.path.map((node, index) => [node.id, index]));
  const expected = proof.observations.flatMap(observation => observation.item === null ? [] : [observation.item]).sort((a, b) => order.get(a.evidence.payload.nodeId)! - order.get(b.evidence.payload.nodeId)!);
  if (result.length !== expected.length || result.some((item, index) => item !== expected[index])) throw new TypeError("Recorded human result is not the complete original ordered output");
  return proof;
}

export const createDerivedPivotalHumanDivergenceV2Evidence = (() => {
  const route = "derived.pivotal.human_divergence@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ recordedPivotal: value("an owned recorded pivotal source", isRecordedPivotalSource) }], result: "items" },
    ({ recordedPivotal }: ScopedPivotalInput): readonly DerivedEvidence<RecordedHumanDivergenceMarker>[] => {
      const data = recordedPivotalData(recordedPivotal, "human_divergence");
      if (data.humanObservations === undefined) throw new TypeError("Recorded human source has no complete observation population");
      const observations = Object.freeze(data.humanObservations.map(({ event, resolved }): RecordedHumanObservation => {
        const selection = createRecordedInspectorMaiaSelectionV1Evidence({ resolved, eventSeq: event.seq });
        const position = createRunRecordPositionV1Evidence({ run: data.run, nodeId: event.data.nodeId });
        assertRecordedHumanObservation(data, { event, resolved, position, selection });
        const marker = selection.kind === "available" ? reportedHumanSplit(event.data.nodeId, selection.value.payload.event.data.selection,
          selection.value.payload.requestedTargetElo ?? undefined) : undefined;
        if (marker === undefined || selection.kind !== "available") return Object.freeze({ event, resolved, position, selection,
          disposition: selection.kind === "available" ? "nonmatch" : "source_absent", item: null });
        const inputs = Object.freeze([selection.value, position]);
        const payload = Object.freeze({ ...marker, selection: selection.value, position });
        const item = Object.freeze({ evidence: mint(route, symbol, payload, { recordedPivotal, event, origin: resolved.subject, inputs }, inputs), inputs });
        return Object.freeze({ event, resolved, position, selection, disposition: "matched", item });
      }));
      const order = new Map(data.authority.path.map((node, index) => [node.id, index]));
      const result = Object.freeze(observations.flatMap(observation => observation.item === null ? [] : [observation.item]).sort((a, b) => order.get(a.evidence.payload.nodeId)! - order.get(b.evidence.payload.nodeId)!));
      RECORDED_HUMAN_INVOCATIONS.set(result, Object.freeze({ source: recordedPivotal, observations }));
      readRecordedHumanDivergenceInvocation(result, recordedPivotal); return result;
    });
})();

// ---------------------------------------------------------------------------------------------
// Source receipts: provider, model, corpus and ledger responses
// ---------------------------------------------------------------------------------------------

const PROVIDER_PENDING = "Legacy pre-exchange route: the typed response bytes are shape-checked and digested only. The receipt-bearing successor is the operation-keyed provider source projection (live.stockfish.legal_root_table@1, live.stockfish.position_eval@1, human.maia.policy_page@1, live.syzygy.position_result@1, human.explorer.position_page@1); this route retires when its callers migrate through the provider exchange.";

// ---------------------------------------------------------------------------------------------
// Provider exchange source receipts (rfc/provider-exchange-and-execution.md §§3, 9; D2 of
// rfc/evidence-value-authority.md). Each factory admits only the scheduler-sealed delivery of its
// exact operation, asserts the acquisition and parsed-payload receipts, and seals the WHOLE
// delivery: stripping the receipt to a bare payload is not a representable input.
// ---------------------------------------------------------------------------------------------

function isSealedDelivery(operation: ProviderOperationId, candidate: unknown): boolean {
  try {
    assertProviderDelivery(operation, candidate);
    return true;
  } catch {
    return false;
  }
}

const hexOf = (digest: string): string => digest.slice("sha256:".length);

function providerSourceFactory<K extends ProviderOperationId>(operation: K, predecessor?: "syzygy-position-v1"): EvidenceValueFactory<{ readonly delivery: ProviderDelivery<ProviderOperationResultMap[K], K> }, DeclaredEvidence<ProviderEvidenceDelivery<ProviderOperationResultMap[K], K>>> {
  const row = providerProtocolRow(operation);
  if (predecessor !== undefined && operation !== "syzygy.position@1") throw new TypeError("Only the frozen Syzygy source predecessor is retained");
  const route = predecessor === undefined ? row.sourceProjection : "live.syzygy.position_result@1";
  const symbol = evidenceFactorySymbol(route);
  const binding = providerProtocolSourceBinding(route);
  if (binding === undefined || binding.operation !== operation || symbol !== binding.sourceFactoryId) throw new TypeError(`${operation} source factory symbol ${symbol} disagrees with the exact provider-protocol source binding`);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ delivery: value(`a scheduler-sealed ${operation} provider delivery`, (candidate) => isSealedDelivery(operation, candidate)) }], result: "single", dependency: "provider-exchange-and-execution" }, ({ delivery }: { readonly delivery: ProviderDelivery<ProviderOperationResultMap[K], K> }) => {
    assertProviderDelivery(operation, delivery);
    const { acquisition, payloadReceipt } = delivery;
    return mint(route, symbol, delivery as ProviderEvidenceDelivery<ProviderOperationResultMap[K], K>, {
      operation,
      kind: delivery.kind,
      normalizedRequestDigest: acquisition.normalizedRequestDigest,
      responseDigest: acquisition.responseDigest,
      parser: payloadReceipt.parser,
      parserImplementationDigest: payloadReceipt.parserImplementationDigest,
      payloadDigest: payloadReceipt.payloadDigest,
    }, [hexOf(acquisition.normalizedRequestDigest), hexOf(acquisition.responseDigest), hexOf(payloadReceipt.payloadDigest)]);
  });
}

export const createLiveStockfishLegalRootTableV1Evidence = providerSourceFactory("stockfish.legal_root_table@1");
export const createLiveStockfishPositionEvalV1Evidence = providerSourceFactory("stockfish.position_evaluation@1");
export const createLiveStockfishPrincipalVariationV1Evidence = providerSourceFactory("stockfish.principal_variation@1");
export const createHumanMaiaPolicyPageV1Evidence = providerSourceFactory("maia.policy_page@1");
export const createHumanMaiaInferenceTaskV1Evidence = providerSourceFactory("maia.inference_task@1");
export const createLiveSyzygyPositionResultV1Evidence = providerSourceFactory("syzygy.position@1", "syzygy-position-v1");
export const createLiveSyzygyPositionResultV2Evidence = providerSourceFactory("syzygy.position@1");
export const createHumanExplorerPositionPageV1Evidence = providerSourceFactory("lichess_explorer.position_page@1");

export const createDerivedExplorerPopulationSummaryV1Evidence = (() => {
  const route = "derived.explorer.population_summary@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ page: sealed("human.explorer.position_page@1") }], result: "single", dependency: "provider-exchange-and-execution" }, ({ page }: { readonly page: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">> }): DeclaredEvidence<ExplorerPopulationSummary> => {
    const { request, result } = page.payload.payload;
    return mint(route, symbol, Object.freeze({
      page,
      position: Object.freeze({ positionFen4: request.positionFen4, requestFen6: request.requestFen6, population: Object.freeze({ ratingBuckets: request.ratingBuckets, speeds: request.speeds, since: request.since, until: request.until }) }),
      totals: result.totals, listed: result.listed, unlisted: result.unlisted, averageRating: result.averageRating,
      opening: result.opening, history: result.history,
      disclosure: Object.freeze({ guard: "CORPUS_GUARD", statement: CORPUS_GUARD }),
    }), { page }, [page]);
  });
})();

export const createDerivedExplorerPositionFrequencyV1Evidence = (() => {
  const route = "derived.explorer.position_frequency@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ page: sealed("human.explorer.position_page@1") }], result: "single", dependency: "provider-exchange-and-execution" }, ({ page }: { readonly page: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">> }): DeclaredEvidence<ExplorerPositionFrequency> => {
    assertProviderDelivery("lichess_explorer.position_page@1", page.payload);
    const { request, result } = page.payload.payload;
    return mint(route, symbol, Object.freeze({ page, request, total: result.totals.total }), { page }, [page]);
  });
})();

export const createDerivedExplorerInspectorPopulationV1Evidence = (() => {
  const route = "derived.explorer.inspector_population@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ page: sealed("human.explorer.position_page@1") }], result: "single", dependency: "provider-exchange-and-execution" }, ({ page }: { readonly page: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">> }): DeclaredEvidence<ExplorerInspectorPopulation> => {
    assertProviderDelivery("lichess_explorer.position_page@1", page.payload);
    const { request, result } = page.payload.payload;
    const lastPlayedMonth = result.history.kind === "reported" ? result.history.rows.filter(row => row.played > 0).map(row => row.period).sort().at(-1) ?? null : null;
    const moves = Object.freeze([...result.moves].sort((a, b) => b.played - a.played || a.canonicalSan.localeCompare(b.canonicalSan)).map(row => Object.freeze({ san: row.canonicalSan, uci: row.canonicalUci, playedCount: row.played, ...row.counts })));
    return mint(route, symbol, Object.freeze({ page, request, totals: result.totals, moves, unlisted: result.unlisted, lastPlayedMonth }), { page }, [page]);
  });
})();

export const createDerivedExplorerRepertoireFrontierV1Evidence = (() => {
  const route = "derived.explorer.repertoire_frontier@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ page: sealed("human.explorer.position_page@1") }], result: "single", dependency: "provider-exchange-and-execution" }, ({ page }: { readonly page: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">> }): DeclaredEvidence<ExplorerRepertoireFrontier> => {
    assertProviderDelivery("lichess_explorer.position_page@1", page.payload);
    const { request, result } = page.payload.payload;
    return mint(route, symbol, Object.freeze({ page, request, totals: result.totals, moves: result.moves, listed: result.listed, unlisted: result.unlisted, history: result.history }), { page }, [page]);
  });
})();

export const createDerivedMaiaRunMoveOccurrenceV1Evidence = (() => {
  const route = "derived.maia.run_move_occurrence@1";
  const symbol = evidenceFactorySymbol(route);
  const isResolvedEdge = (candidate: unknown): boolean => {
    try { assertResolvedRunSubject(candidate as ResolvedRunSubject); return (candidate as ResolvedRunSubject).subject.kind === "run_edge"; }
    catch { return false; }
  };
  return factory({ route, symbol, shape: "derived", arms: [{ page: sealed("human.maia.policy_page@1"), resolved: value("a sealed historical run edge", isResolvedEdge), edge: sealed("run.record.edge@1") }], result: "single", dependency: "provider-exchange-and-execution" }, ({ page, resolved, edge }: { readonly page: MaiaOccurrencePageEvidence; readonly resolved: ResolvedRunSubject; readonly edge: DeclaredEvidence<RecordedEdge> }): DeclaredEvidence<MaiaRunMoveOccurrence> => {
    const payload = maiaRunOccurrencePayload(page, resolved, edge);
    return mint(route, symbol, payload, { page, subject: resolved.subject, edge }, [page, edge]);
  });
})();

export const createDerivedMaiaExactFenMoveOccurrenceV1Evidence = (() => {
  const route = "derived.maia.exact_fen_move_occurrence@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ page: sealed("human.maia.policy_page@1"), observedMoveUci: value("an observed canonical legal move", (candidate) => typeof candidate === "string" && candidate.length > 0) }], result: "single", dependency: "provider-exchange-and-execution" }, ({ page, observedMoveUci }: { readonly page: MaiaOccurrencePageEvidence; readonly observedMoveUci: string }): DeclaredEvidence<MaiaExactFenMoveOccurrence> => {
    const payload = maiaExactFenOccurrencePayload(page, observedMoveUci);
    return mint(route, symbol, payload, { page, observedMoveUci }, [page]);
  });
})();

const MAIA_NODE_INVOCATIONS = new WeakMap<object, Readonly<MaiaNodeInputs>>();
/** Includes authentic empty WDL results; no reconstructed/caller-authored source lookup. */
export function readMaiaNodeInvocation(result: unknown): Readonly<MaiaNodeInputs> {
  const input = result !== null && typeof result === "object" ? MAIA_NODE_INVOCATIONS.get(result) : undefined;
  if (input === undefined) throw new TypeError("Maia node result is not an original factory invocation");
  return input;
}

const MAIA_NODE_ARM = Object.freeze({ task: sealed("human.maia.inference_task@1"), position: sealed("run.record.position@1"),
  resolved: value("an exact sealed run-node subject", isRecordedInspectorNode) });

function maiaNodeInputs(input: MaiaNodeInputs): MaiaNodeInputs & { readonly engine: SelectionEngineIdentity; readonly nodeId: string } {
  const { task, position, resolved } = input;
  assertResolvedRunSubject(resolved);
  if (resolved.subject.kind !== "run_node") throw new TypeError("Maia node source requires a run-node subject");
  const subject = resolved.subject;
  assertRecordedPositionInvocation(position, resolved.run, subject.nodeId);
  // The sealed resolver owns the domain-specific event head; the original position invocation
  // above owns this exact run prefix. Do not compare that head to the different evidence digest.
  if (subject.runId !== resolved.run.id || subject.fen !== position.payload.fen) throw new TypeError("Maia node source has a crossed recorded subject");
  assertProviderDelivery("maia.inference_task@1", task.payload);
  const request = task.payload.payload.request, requestedPosition = request.position;
  if (requestedPosition.kind !== "history_conditioned") throw new TypeError("Maia node source requires history-conditioned task input");
  const path = resolveBranchPath(resolved.run, subject.branchId);
  if (path.kind !== "resolved") throw new TypeError("Maia node source has no selected branch path");
  const index = path.nodes.findIndex(node => node.id === subject.nodeId), startFen = resolved.run.start.fen;
  if (index < 0 || path.nodes[0]?.fen !== startFen || canonicalFen(positionFromFen(startFen)) !== startFen) throw new TypeError("Maia node source start/node is not canonical");
  const historyUci = path.nodes.slice(1, index + 1).map((node, i) => recordedEdgePayload(resolved.run, path.nodes[i]!, node).moveUci);
  if (requestedPosition.startFen !== startFen || requestedPosition.historyUci.length !== historyUci.length
    || requestedPosition.historyUci.some((move, i) => move !== historyUci[i])) throw new TypeError("Maia node task history identity mismatch");
  const actual = task.payload.acquisition.actualIdentity;
  const engine: SelectionEngineIdentity = Object.freeze({ id: actual.id, name: actual.name, version: actual.version,
    modelId: actual.modelId, containerDigest: actual.containerDigest, seedHonored: actual.seedHonored,
    eloHonored: actual.eloHonored, eloApplied: task.payload.payload.appliedBand });
  return Object.freeze({ task, position, resolved, engine, nodeId: subject.nodeId });
}

export const createDerivedMaiaNodeDistributionV1Evidence = (() => {
  const route = "derived.maia.node_distribution@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [MAIA_NODE_ARM], result: "single", dependency: "provider-exchange-and-execution" }, (input: MaiaNodeInputs): DeclaredEvidence<MaiaNodeDistribution> => {
    const { task, position, resolved, engine, nodeId } = maiaNodeInputs(input);
    if (resolved.subject.kind !== "run_node") throw new TypeError("Maia distribution has no node subject");
    const payload: MaiaNodeDistribution = Object.freeze({ task, position, nodeId, branchId: resolved.subject.branchId,
      eventHeadDigest: resolved.subject.eventHeadDigest, engine, requestedBand: task.payload.payload.request.band,
      appliedBand: task.payload.payload.appliedBand, coverage: "bounded_reported_window",
      candidates: Object.freeze(task.payload.payload.candidates.map(({ moveUci, rank, mass }) => Object.freeze({ moveUci, rank, mass }))) });
    const result = mint(route, symbol, payload, { task, position, subject: resolved.subject }, [task, position]);
    MAIA_NODE_INVOCATIONS.set(result, Object.freeze({ task, position, resolved }));
    return result;
  });
})();

export const createDerivedMaiaNodeCandidateWdlV1Evidence = (() => {
  const route = "derived.maia.node_candidate_wdl@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [MAIA_NODE_ARM], result: "availability", dependency: "provider-exchange-and-execution" }, (input: MaiaNodeInputs): EvidenceAvailability<DeclaredEvidence<MaiaNodeCandidateWdl>> => {
    const { task, position, resolved, engine, nodeId } = maiaNodeInputs(input), original = Object.freeze({ task, position, resolved });
    const candidates = Object.freeze(task.payload.payload.candidates.flatMap(({ moveUci, rank, wdl }) => wdl === null ? [] : [Object.freeze({ moveUci, rank, wdl })]));
    if (candidates.length === 0) {
      const result = unavailable<DeclaredEvidence<MaiaNodeCandidateWdl>>("empty_population");
      MAIA_NODE_INVOCATIONS.set(result, original);
      return result;
    }
    const payload: MaiaNodeCandidateWdl = Object.freeze({ task, position, nodeId, engine,
      requestedBand: task.payload.payload.request.band, appliedBand: task.payload.payload.appliedBand, candidates });
    const item = mint(route, symbol, payload, { task, position, subject: resolved.subject }, [task, position]), result = available(item);
    MAIA_NODE_INVOCATIONS.set(item, original); MAIA_NODE_INVOCATIONS.set(result, original);
    return result;
  });
})();

function recordedInspectorPacketFactory<K extends EvidenceKind>(route: string, kind: K) {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ resolved: value("an exact sealed run-node subject", isRecordedInspectorNode), itemDigest: value("an existing run evidence-item digest", candidate => typeof candidate === "string" && /^sha256:[0-9a-f]{64}$/u.test(candidate)) }], result: "single" },
    ({ resolved, itemDigest }: { readonly resolved: ResolvedRunSubject; readonly itemDigest: RunEvidenceItemDigest }) => {
      const payload = recordedInspectorPacketValue(resolved, itemDigest, kind);
      return mint(route, symbol, payload, payload);
    });
}
export const createRecordedInspectorEvalPacketV1Evidence = recordedInspectorPacketFactory("recorded.inspector.eval_packet@1", "eval");
export const createRecordedInspectorWdlPacketV1Evidence = recordedInspectorPacketFactory("recorded.inspector.wdl_packet@1", "wdl");
export const createRecordedInspectorPvPacketV1Evidence = recordedInspectorPacketFactory("recorded.inspector.pv_packet@1", "bestline");
export const createRecordedInspectorTablebasePacketV1Evidence = recordedInspectorPacketFactory("recorded.inspector.tablebase_packet@1", "tablebase");
export const createRecordedInspectorMaiaSelectionV1Evidence = (() => {
  const route = "recorded.inspector.maia_selection@1", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ resolved: value("an exact sealed run-node subject", isRecordedInspectorNode), eventSeq: value("a positive safe event sequence", candidate => Number.isSafeInteger(candidate) && (candidate as number) > 0) }], result: "availability" },
    ({ resolved, eventSeq }: { readonly resolved: ResolvedRunSubject; readonly eventSeq: number }): EvidenceAvailability<DeclaredEvidence<RecordedInspectorSelection>> => {
      const payload = recordedInspectorSelectionValue(resolved, eventSeq);
      return payload === undefined ? unavailable("source_absent") : available(mint(route, symbol, payload, payload));
    });
})();
function recordedInspectorTablebaseView<T>(route: string, compute: (record: DeclaredEvidence<RecordedInspectorPacket<"tablebase">>) => T) {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ record: sealed("recorded.inspector.tablebase_packet@1") }], result: "single" },
    ({ record }: { readonly record: DeclaredEvidence<RecordedInspectorPacket<"tablebase">> }) => mint(route, symbol, compute(record), { record }, [record]));
}
export const createDerivedInspectorTablebaseCategoryV1Evidence = recordedInspectorTablebaseView("derived.inspector.tablebase_category@1", recordedInspectorCategoryValue);
export const createDerivedInspectorTablebaseDistanceV1Evidence = recordedInspectorTablebaseView("derived.inspector.tablebase_distance@1", recordedInspectorDistanceValue);

/** Accepted D3802: one original complete source, never caller rows or another detail view. */
function inspectorDetailFactory<K extends InspectorDetailKind>(kind: K) {
  const route = `derived.inspector.detail.${kind}@1`, sourceRoute = INSPECTOR_DETAIL_SOURCES[kind];
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ source: sealed(sourceRoute),
    scope: value("the closed source-specific detail scope", candidate => {
      try { parseInspectorDetailScope(kind, candidate); return true; } catch { return false; }
    }), start: value("a non-negative safe member index", candidate => Number.isSafeInteger(candidate) && (candidate as number) >= 0) }], result: "single" },
  (input: { readonly source: DeclaredEvidence<InspectorDetailSources[K]>; readonly scope: InspectorDetailScope; readonly start: number }): DeclaredEvidence<InspectorDetailPayload<K>> => {
    assertDeclaredEvidence(input.source);
    if (sealedRoute(input.source) !== sourceRoute) throw new TypeError("Inspector detail needs its exact original source");
    if (isFoundationDetailKind(kind)) assertPawnFoundationSource(input.source, sourceRoute);
    const scope = parseInspectorDetailScope(kind, input.scope);
    const payload = buildInspectorDetailPayload(kind, input.source.payload, scope, input.start);
    return mint(route, symbol, payload, { source: input.source, scope, start: input.start }, [input.source]);
  });
}
export const createDerivedInspectorDetailRaysV1Evidence = inspectorDetailFactory("rays");
export const createDerivedInspectorDetailSquareControlV1Evidence = inspectorDetailFactory("square_control");
export const createDerivedInspectorDetailPieceDestinationsV1Evidence = inspectorDetailFactory("piece_destinations");
export const createDerivedInspectorDetailDestinationChangesV1Evidence = inspectorDetailFactory("destination_changes");
export const createDerivedInspectorDetailKingZoneV1Evidence = inspectorDetailFactory("king_zone");
export const createDerivedInspectorDetailDefenderDutiesV1Evidence = inspectorDetailFactory("defender_duties");
export const createDerivedInspectorDetailDefenderExposureV1Evidence = inspectorDetailFactory("defender_exposure");

/** §7: the one adapter for the scheduler-sealed whole Syzygy outside-domain envelope. */
export const createRulesEndgameTablebaseDomainV1Evidence = (() => {
  const route = "rules.endgame.tablebase_domain@1";
  const symbol = evidenceFactorySymbol(route);
  const sealedLocal = (candidate: unknown): boolean => {
    try {
      assertProviderLocalDomainResult("syzygy.position@1", candidate);
      return true;
    } catch {
      return false;
    }
  };
  return factory({ route, symbol, shape: "source_receipt", arms: [{ result: value("a scheduler-sealed syzygy.position@1 local-domain result", sealedLocal) }], result: "single", dependency: "provider-exchange-and-execution" }, ({ result }: { readonly result: ProviderLocalDomainResult<"syzygy.position@1"> }) => {
    assertProviderLocalDomainResult("syzygy.position@1", result);
    return mint(route, symbol, result, { kind: result.kind, operation: result.operation, normalizedRequestDigest: result.normalizedRequestDigest, observedAt: result.observedAt, payload: result.payload }, [hexOf(result.normalizedRequestDigest)]);
  });
})();

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

/** [[D3103]]: an abstention arm is admitted only as the complete exported `CorpusResult` arm. */
function completeCorpusAbstention(candidate: unknown): boolean {
  try {
    parseCorpusResultAbstention(candidate);
    return true;
  } catch {
    return false;
  }
}

export const createHumanExplorerPositionStatsV1Evidence = (() => {
  const route = "human.explorer.position_stats@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "source_receipt", arms: [{ result: value("a CorpusResult", (candidate) => isRecord(candidate) && ((candidate.kind === "stats" && "population" in candidate) || (candidate.kind === "abstention" && completeCorpusAbstention(candidate)))) }], result: "single", dependency: "provider-exchange-and-execution", pending: PROVIDER_PENDING }, ({ result }: { readonly result: Readonly<Record<string, unknown>> }) =>
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
const RECORDED_READING_INVOCATIONS = new WeakMap<object, Readonly<{ ledger: DeclaredEvidence<SourcingLedgerRecord>; route: string }>>();
/** Internal original two-step invocation, including actual refusal outcomes. */
export function readRecordedReadingInvocation(result: object) {
  const invocation = RECORDED_READING_INVOCATIONS.get(result);
  if (invocation === undefined) throw new TypeError("Recorded reading result is not its original factory invocation");
  return invocation;
}
function recordedFactory(route: string, source: string): EvidenceValueFactory<{ readonly ledger: DeclaredEvidence<SourcingLedgerRecord> }, EvidenceAvailability<DeclaredEvidence<unknown>>> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ ledger: sealed(source) }], result: "availability", dependency: "provider-exchange-and-execution", pending: LEDGER_PENDING }, ({ ledger }: { readonly ledger: DeclaredEvidence<SourcingLedgerRecord> }) => {
    const reading = recordedReadingFromLedgerRecord(ledger.payload);
    const result: EvidenceAvailability<DeclaredEvidence<unknown>> = reading === undefined ? unavailable("ledger_record_not_admitted") : available(mint(route, symbol, reading, { ledger }, [ledger]));
    RECORDED_READING_INVOCATIONS.set(result, Object.freeze({ ledger, route }));
    return result;
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
    // rfc/evidence-presentation.md Checkpoint P ([[D2046]]): the exact `{phase}` payload, not a bare scalar.
    mint(route, symbol, Object.freeze({ phase: pack.phase }), { pack: { id: pack.id, phase: pack.phase } }, [evidenceDigest({ pack: pack.id, phase: pack.phase })]));
})();

/**
 * rfc/concept-registry.md §3: "this pack references this registered concept" — identity only.
 * Authority inputs are the complete pack document, its complete-document digest (recomputed and
 * compared, so a wrong digest is refused) and the private compiled registry (a digest-bearing
 * lookalike is refused). One value per `concepts[]` reference; an unregistered id refuses the whole
 * population rather than minting a partial one. It never claims occurrence, demonstration or value.
 */
export interface PackConceptReferencePayload {
  readonly packId: string;
  readonly packDigest: string;
  readonly concept: ConceptRef;
}

export const createPackAuthoredConceptReferenceV1Evidence = (() => {
  const route = "pack.authored.concept_reference@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({
    route, symbol, shape: "authored_authority",
    arms: [{
      pack: value("a complete drill-pack document (concepts optional)", (candidate) => isRecord(candidate) && isText(candidate.id) && (candidate.concepts === undefined || Array.isArray(candidate.concepts))),
      packDigest: value("the pack's complete-document digest", (candidate) => typeof candidate === "string" && /^sha256:[0-9a-f]{64}$/u.test(candidate)),
      registry: value("the private compiled concept registry", isCompiledConceptRegistry),
    }],
    result: "population",
  }, ({ pack, packDigest, registry }: { readonly pack: DrillPackDefinition; readonly packDigest: string; readonly registry: CompiledConceptRegistry }) => {
    const recomputed = `sha256:${sha256Hex(canonicalizeJson(pack))}`;
    if (recomputed !== packDigest) throw new TypeError(`Pack concept reference digest ${packDigest} is not the pack's complete-document digest ${recomputed}`);
    return Object.freeze((pack.concepts ?? []).map((id) => {
      const ref = registry.ref(id);
      const payload: PackConceptReferencePayload = Object.freeze({ packId: pack.id, packDigest, concept: ref });
      return mint(route, symbol, payload, { pack: { id: pack.id, digest: packDigest }, registry: registry.digest, concept: id }, [evidenceDigest({ packDigest, concept: ref })]);
    }));
  });
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
  return factory({ route, symbol, shape: "authored_authority", arms: [{ source: value("pack | shape", (candidate) => candidate === "pack" || candidate === "shape"), documentId: value("a document id", isText), pointer: value("a document pointer", isText), expression: value("a StructuralExpression", isRecord) }], result: "single", dependency: "registered-authored-provenance", pending: AUTHORED_PENDING }, (input: { readonly source: "pack" | "shape"; readonly documentId: string; readonly pointer: string; readonly expression: Readonly<Record<string, unknown>> }) => {
    const expression = structuredClone(input.expression);
    assertLegacyStructuralExpression(expression);
    return mint(route, symbol, Object.freeze({ source: input.source, documentId: input.documentId, pointer: input.pointer, expression }), { ...input, expression }, [evidenceDigest({ documentId: input.documentId, pointer: input.pointer })]);
  });
})();

const AUTHORED_STRUCTURAL_INPUTS = new WeakMap<object, AuthoredStructuralConditionSource>();
export function readAuthoredStructuralInput(value: DeclaredEvidence<AuthoredStructuralSourceImage>): AuthoredStructuralConditionSource {
  const source = AUTHORED_STRUCTURAL_INPUTS.get(value);
  if (source === undefined || sealedRoute(value) !== "authored.structural_condition.input@2"
    // The sole mint retains this exact immutable source image. Identity is stronger than
    // re-hashing two equal document trees, and the source reader still checks live ownership.
    || readAuthoredStructuralConditionSource(source) !== value.payload) throw new TypeError("Authored predicate input is not its original current document-source invocation");
  assertDeclaredEvidence(value); return source;
}
export const createAuthoredStructuralConditionInputV2Evidence = (() => {
  const route = "authored.structural_condition.input@2", symbol = evidenceFactorySymbol(route);
  // This input contains no position or evaluation state. Reuse only this original
  // source's genuine immutable mint; root/leaf/population/result values remain separate.
  const inputs = new WeakMap<AuthoredStructuralConditionSource, DeclaredEvidence<AuthoredStructuralSourceImage>>();
  return factory({ route, symbol, shape: "authored_authority", arms: [{ source: value("an original authored structural condition source", candidate => {
    try { readAuthoredStructuralConditionSource(candidate as AuthoredStructuralConditionSource); return true; } catch { return false; }
  }) }], result: "single" }, ({ source }: { readonly source: AuthoredStructuralConditionSource }) => {
    const image = readAuthoredStructuralConditionSource(source);
    const cached = inputs.get(source);
    if (cached !== undefined) {
      if (readAuthoredStructuralInput(cached) !== source) throw new TypeError("Authored input crosses its original source");
      return cached;
    }
    const result = mint(route, symbol, image, image, [image.origin.digest.slice(7), ...image.substitutions.map(row => row.shape.digest.slice(7))]);
    AUTHORED_STRUCTURAL_INPUTS.set(result, source);
    if (readAuthoredStructuralInput(result) !== source) throw new TypeError("Authored input lost its original source during mint");
    inputs.set(source, result); return result;
  });
})();

const SHAPE_FIRING_INVOCATIONS = new WeakMap<object, Readonly<{
  entries: readonly ShapeTriggerSource[]; path: readonly { readonly id: string; readonly fen: string }[];
  inputDigest: string; items: readonly DeclaredEvidence<unknown>[];
}>>();
/** Complete original shape calculation; trigger inputs and empty spans are not caller claims. */
export function readShapeFiringInvocation(items: readonly DeclaredEvidence<unknown>[], entries: readonly ShapeTriggerSource[], path: readonly { readonly id: string; readonly fen: string }[]) {
  const proof = SHAPE_FIRING_INVOCATIONS.get(items);
  if (proof === undefined || proof.items !== items || proof.entries !== entries || proof.path !== path
    || proof.inputDigest !== evidenceDigest({ entries, path })) throw new TypeError("Shape firing population is not its original input invocation");
  for (const item of items) {
    assertDeclaredEvidence(item);
    if (sealedRoute(item) !== "theory.shapes.firing@1" || evidenceValueReceipt(item).factory !== "createTheoryShapesFiringV1Evidence") throw new TypeError("Shape firing item crosses its original factory");
  }
  return proof;
}

export const createTheoryShapesFiringV1Evidence = (() => {
  const route = "theory.shapes.firing@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ entries: value("registered shape trigger records", (candidate) => Array.isArray(candidate) && candidate.every((entry) => isRecord(entry) && isText(entry.id) && isRecord(entry.trigger))), path: value("a recorded { id, fen } path", (candidate) => Array.isArray(candidate) && candidate.every((node) => isRecord(node) && isText(node.id) && typeof node.fen === "string")) }], result: "population", dependency: "registered-authored-provenance", pending: AUTHORED_PENDING }, ({ entries, path }: { readonly entries: readonly ShapeTriggerSource[]; readonly path: readonly { readonly id: string; readonly fen: string }[] }) => {
    const nodes = path.map((node) => Object.freeze({ id: node.id, fen: validFen(node.fen) }));
    const items = Object.freeze(shapeFirings(entries, nodes).map((firing) => mint(route, symbol, firing, { entries: entries.map((entry) => entry.id), path: nodes }, [evidenceDigest(entries.find((entry) => entry.id === firing.entryId))])));
    SHAPE_FIRING_INVOCATIONS.set(items, Object.freeze({ entries, path, inputDigest: evidenceDigest({ entries, path }), items }));
    return items;
  });
})();

export interface RegisteredShapeFiring {
  readonly entryId: string;
  readonly firstNodeId: string;
  readonly lastNodeId: string;
  readonly openEnded: boolean;
  readonly authority: Readonly<{ documentId: string; documentVersion: string; documentDigest: string;
    pointer: "/trigger"; name: string; channel: "official" | "community"; publisherHandle: string | null }>;
}
interface RegisteredShapeInvocation {
  readonly source: RegisteredShapeSource;
  readonly path: readonly { readonly id: string; readonly fen: string }[];
  readonly inputDigest: string;
  readonly items: readonly DeclaredEvidence<RegisteredShapeFiring>[];
}
const REGISTERED_SHAPE_INVOCATIONS = new WeakMap<object, RegisteredShapeInvocation>();
function registeredShapePath(path: RegisteredShapeInvocation["path"]): RegisteredShapeInvocation["path"] {
  const ids = new Set<string>();
  if (!Array.isArray(path) || Object.getPrototypeOf(path) !== Array.prototype || path.length === 0
    || Reflect.ownKeys(path).length !== path.length + 1) throw new TypeError("Registered shape path must be a complete ordinary data array");
  const captured: { readonly id: string; readonly fen: string }[] = [];
  for (let index = 0; index < path.length; index += 1) {
    const member = Object.getOwnPropertyDescriptor(path, index);
    if (member === undefined || !member.enumerable || !("value" in member)) throw new TypeError("Registered shape path must have own data members");
    const node: unknown = member.value;
    if (node === null || typeof node !== "object" || Object.getPrototypeOf(node) !== Object.prototype
      || Reflect.ownKeys(node).length !== 2) throw new TypeError("Registered shape node must be exactly an own data id/FEN record");
    const id = Object.getOwnPropertyDescriptor(node, "id"), fen = Object.getOwnPropertyDescriptor(node, "fen");
    if (id === undefined || fen === undefined || !id.enumerable || !fen.enumerable || !("value" in id) || !("value" in fen)
      || !isText(id.value) || ids.has(id.value) || canonicalFen(positionFromFen(validFen(fen.value))) !== fen.value) throw new TypeError("Registered shape path must have canonical FENs and unique complete node identities");
    ids.add(id.value); captured.push(Object.freeze({ id: id.value, fen: fen.value as string }));
  }
  return Object.freeze(captured);
}
function registeredShapeAuthority(source: RegisteredShapeSource, path: RegisteredShapeInvocation["path"]) {
  return { records: registeredShapeRecordsImage(readRegisteredShapeSource(source)), path: registeredShapePath(path) };
}
/** Original complete calculation, including an empty result. Never reconstructed by rerunning. */
export function readRegisteredShapeFiringInvocation(items: readonly DeclaredEvidence<RegisteredShapeFiring>[], source: RegisteredShapeSource, path: RegisteredShapeInvocation["path"]) {
  const proof = REGISTERED_SHAPE_INVOCATIONS.get(items);
  if (proof === undefined || proof.source !== source || proof.path !== path || proof.items !== items
    || proof.inputDigest !== evidenceDigest(registeredShapeAuthority(source, path))) throw new TypeError("Registered shape firing differs from its original source/path invocation");
  for (const item of items) {
    assertDeclaredEvidence(item);
    const receipt = evidenceValueReceipt(item);
    if (sealedRoute(item) !== "theory.shapes.firing@2" || receipt.factory !== "createTheoryShapesFiringV2Evidence"
      || receipt.inputDigest !== proof.inputDigest) throw new TypeError("Registered shape firing lost its original authority");
  }
  return proof;
}

export const createTheoryShapesFiringV2Evidence = (() => {
  const route = "theory.shapes.firing@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ source: value("the original registered shape source", candidate => {
    try { readRegisteredShapeSource(candidate as RegisteredShapeSource); return true; } catch { return false; }
  }), path: value("the complete ordered recorded node path", Array.isArray) }], result: "population", dependency: "evidence-value-authority" },
  ({ source, path }: { readonly source: RegisteredShapeSource; readonly path: RegisteredShapeInvocation["path"] }) => {
    const records = readRegisteredShapeSource(source), nodes = registeredShapePath(path);
    const authority = registeredShapeAuthority(source, nodes), inputDigest = evidenceDigest(authority);
    const entries = records.map(record => ({ id: record.document.id, trigger: record.document.trigger }));
    const byId = new Map(records.map(record => [record.document.id, record]));
    const items = Object.freeze(shapeFirings(entries, nodes).map(firing => {
      const record = byId.get(firing.entryId);
      if (record === undefined) throw new TypeError("Shape firing has no admitted registered document");
      const attribution = Object.freeze({ documentId: record.document.id, documentVersion: record.document.version,
        documentDigest: record.digest, pointer: "/trigger" as const, name: record.document.name,
        channel: record.channel, publisherHandle: record.publisherHandle });
      return mint(route, symbol, Object.freeze({ ...firing, authority: attribution }), authority,
        [evidenceDigest({ document: record.document, authority: attribution })]);
    }));
    readRegisteredShapeSource(source);
    REGISTERED_SHAPE_INVOCATIONS.set(items, Object.freeze({ source, path, inputDigest, items }));
    readRegisteredShapeFiringInvocation(items, source, path); return items;
  });
})();

const CURRENT_SHAPE_INVOCATIONS = new WeakMap<object, Readonly<{ scan: RegisteredShapeScan; inputDigest: string; items: readonly DeclaredEvidence<RegisteredShapeFiring>[] }>>();
export function readCurrentShapeFiringInvocation(items: readonly DeclaredEvidence<RegisteredShapeFiring>[], scan: RegisteredShapeScan) {
  const source = readRegisteredShapeScan(scan), proof = CURRENT_SHAPE_INVOCATIONS.get(items);
  if (proof === undefined || proof.scan !== scan || proof.items !== items || proof.inputDigest !== source.inputDigest) throw new TypeError("Current shape result lost its original complete scan invocation");
  for (const item of items) {
    assertDeclaredEvidence(item);
    const receipt = evidenceValueReceipt(item);
    if (sealedRoute(item) !== "theory.shapes.firing@3" || receipt.factory !== "createTheoryShapesFiringV3Evidence"
      || receipt.inputDigest !== proof.inputDigest) throw new TypeError("Current shape result crosses its original factory");
  }
  return proof;
}
export const createTheoryShapesFiringV3Evidence = (() => {
  const route = "theory.shapes.firing@3", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ scan: value("the original complete current registered shape scan", candidate => {
    try { readRegisteredShapeScan(candidate as RegisteredShapeScan); return true; } catch { return false; }
  }) }], result: "population", dependency: "evidence-value-authority" }, ({ scan }: { readonly scan: RegisteredShapeScan }) => {
    const source = readRegisteredShapeScan(scan), items: DeclaredEvidence<RegisteredShapeFiring>[] = [];
    for (const row of source.rows) {
      const record = row.record, authority = Object.freeze({ documentId: record.document.id, documentVersion: record.document.version,
        documentDigest: record.digest, pointer: "/trigger" as const, name: record.document.name, channel: record.channel, publisherHandle: record.publisherHandle });
      const sourceDigests = [evidenceDigest({ document: record.document, authority })], refs: VersionedEvidenceId[] = [];
      const matches = row.cells.map(cell => {
        const data = readAuthoredPredicatePopulation(cell);
        for (const input of [data.condition, data.position, ...data.leaves.map(row => row.value)]) {
          sourceDigests.push(evidenceDigest(registeredShapeReceiptImage(input)));
          refs.push(...(evidenceValueReceipt(input).convention?.refs ?? []));
        }
        return data.observation.matched;
      });
      let first = -1;
      for (let index = 0; index <= source.path.length; index++) {
        const matched = index < source.path.length && matches[index]!;
        if (matched && first < 0) first = index;
        if (!matched && first >= 0) {
          const payload = Object.freeze({ entryId: record.document.id, firstNodeId: source.path[first]!.id,
            lastNodeId: source.path[index - 1]!.id, openEnded: index === source.path.length, authority });
          items.push(mint(route, symbol, payload, source.image, sourceDigests, refs)); first = -1;
        }
      }
    }
    const result = Object.freeze(items);
    readRegisteredShapeScan(scan);
    CURRENT_SHAPE_INVOCATIONS.set(result, Object.freeze({ scan, inputDigest: source.inputDigest, items: result }));
    readCurrentShapeFiringInvocation(result, scan); return result;
  });
})();

/** `theory.endgame.setup_match@1` result: a sealed positive, an explicit operand-level miss, or unavailable. */
export type EndgameSetupMatchAvailability =
  | { readonly kind: "available"; readonly value: DeclaredEvidence<EndgameSetupMatch> }
  | { readonly kind: "not_matched"; readonly convention: VersionedEvidenceId; readonly failedOperandIds: readonly string[] }
  | { readonly kind: "unavailable"; readonly reason: string; readonly dependency?: string };

export const createTheoryEndgameSetupMatchV1Evidence = (() => {
  const route = "theory.endgame.setup_match@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "computed", arms: [{ fen: FEN, convention: value("a versioned setup convention ref", (candidate) => hasExactKeys(candidate, ["id", "version"])) }], result: "availability", dependency: "semantic-convention-provenance" }, ({ fen, convention }: { readonly fen: string; readonly convention: VersionedEvidenceId }): EndgameSetupMatchAvailability => {
    const result = endgameSetupMatch(validFen(fen), convention);
    if (result.kind === "unavailable") return Object.freeze({ kind: "unavailable", reason: result.reason, dependency: "semantic-convention-provenance" });
    if (result.kind === "not_matched") return result;
    return Object.freeze({ kind: "available", value: mint(route, symbol, result.value, { fen, convention }, [evidenceDigest(endgameSetupConvention(convention))], [convention]) });
  });
})();

// ---------------------------------------------------------------------------------------------
// No-route projections gaining factories (§4): unavailable until their upstream authority lands
// ---------------------------------------------------------------------------------------------

/** The sole current grader consumes its actual workflow-issued source, never caller readings. */
export const createDerivedGradeMoveQualityV2Evidence = (() => {
  const route = "derived.grade.move_quality@2";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ recordedGrade: value("the original workflow-owned recorded grade source", isRecordedGradeSource) }], result: "availability" },
    (input: { readonly recordedGrade: RecordedGradeSource }): EvidenceAvailability<readonly DeclaredEvidence<MoveQualityGrade>[]> => {
    const source = readRecordedGradeSource(input.recordedGrade), pair = source.state;
    if (pair.kind === "unavailable") return unavailable(pair.reason);
    const result = moveQualityGrade(pair.before, pair.after, source.mover);
    if (result === undefined) return available(Object.freeze([]));
    if ("abstained" in result) return unavailable(result.reason);
    return available(Object.freeze([mint(route, symbol, result, input, pair.inputs)]));
  });
})();

type OpeningPointRoute = "theory.opening.current_endpoint@1" | "theory.opening.catalogue_membership@1";
interface OpeningPointInput { readonly source: InstalledOpeningCatalogue; readonly position: DeclaredEvidence<RecordedPosition> }
type OpeningPointPayload = Extract<CurrentOpeningEndpoint, { kind: "matched" }> | Extract<OpeningCatalogueMembership, { kind: "member" }>;
interface OpeningPointInvocation extends OpeningPointInput {
  readonly route: OpeningPointRoute;
  readonly invocation: RecordedOpeningLookup;
  readonly lookup: ReturnType<typeof readRecordedOpeningLookup>["lookup"];
  readonly authority: unknown;
}
const OPENING_POINT_RESULTS = new WeakMap<object, OpeningPointInvocation>();
/** Only a fresh sole-factory result proves an executed lookup, including available([]). */
export function readRecordedOpeningPointResult(result: readonly DeclaredEvidence<OpeningPointPayload>[], input: OpeningPointInput, route: OpeningPointRoute): OpeningPointInvocation {
  const proof = result !== null && typeof result === "object" ? OPENING_POINT_RESULTS.get(result) : undefined;
  if (proof === undefined || proof.route !== route || proof.source !== input.source || proof.position !== input.position) throw new TypeError("Opening point result is not its original source/position/projection invocation");
  const original = readRecordedOpeningLookup(proof.invocation, input.source, input.position);
  if (original.lookup !== proof.lookup) throw new TypeError("Opening point result lost its original paired lookup");
  const expected = route === "theory.opening.current_endpoint@1" ? proof.lookup.result.currentEndpoint : proof.lookup.result.catalogueMembership;
  const matched = expected.kind === "matched" || expected.kind === "member";
  if (!Object.isFrozen(result) || result.length !== Number(matched)) throw new TypeError("Opening point result has an incomplete original population");
  for (const item of result) {
    assertDeclaredEvidence(item);
    const receipt = evidenceValueReceipt(item);
    if (sealedRoute(item) !== route || receipt.factory !== evidenceFactorySymbol(route) || receipt.inputDigest !== authorityDigest(proof.authority)
      || receipt.payloadDigest !== evidenceDigest(expected)) throw new TypeError("Opening point result crosses its original lookup operands");
  }
  return proof;
}

function openingPointFactory<Route extends OpeningPointRoute>(route: Route) {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "authored_authority", arms: [{ source: value("the admitted installed opening catalogue", isInstalledOpeningCatalogue), position: sealed("run.record.position@1") }], result: "availability", dependency: "none" },
    (input: OpeningPointInput): EvidenceAvailability<readonly DeclaredEvidence<OpeningPointPayload>[]> => {
      const invocation = recordedOpeningLookup(input), original = readRecordedOpeningLookup(invocation, input.source, input.position), lookup = original.lookup;
      const payload = route === "theory.opening.current_endpoint@1" ? lookup.result.currentEndpoint : lookup.result.catalogueMembership;
      const authority = Object.freeze({ catalogue: lookup.catalogue.ref, position: Object.freeze({ invocation: original.positionInvocation,
        producer: input.position.producer, projection: input.position.projection, receipt: evidenceValueReceipt(input.position) }),
        endpointRow: lookup.endpointRow, membershipRow: lookup.membershipRow, result: lookup.result });
      const result = Object.freeze(payload.kind === "matched" || payload.kind === "member" ? [mint(route, symbol, payload, authority)] : []);
      OPENING_POINT_RESULTS.set(result, Object.freeze({ ...input, route, invocation, lookup, authority }));
      readRecordedOpeningPointResult(result, input, route);
      return available(result);
    });
}
export const createTheoryOpeningCurrentEndpointV1Evidence = openingPointFactory("theory.opening.current_endpoint@1");
export const createTheoryOpeningCatalogueMembershipV1Evidence = openingPointFactory("theory.opening.catalogue_membership@1");


export const createDerivedOpeningDeepestReachedV2Evidence = (() => {
  const route = "derived.opening.deepest_reached@2", symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ history: value("an original complete recorded opening history", isRecordedOpeningHistorySource) }], result: "items" },
    ({ history }: { readonly history: RecordedOpeningHistorySource }): readonly RunEvidenceItem<RecordedDeepestOpeningReached>[] => {
      const computed = computeOpeningHistoryReduction(history), projection = projectionFor(route), proof = computed.proof;
      const authority = initiateEvidenceReduction(computed.authority);
      const result = Object.freeze(computed.selected.map((selected, ordinal) => Object.freeze({ nodeId: selected.nodeId, plyOffset: selected.plyOffset,
        evidence: declareEvidence(projection.producer, { id: projection.id, version: projection.version }, selected.payload, {
          factory: symbol, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal },
        }) })));
      publishEvidenceReduction(authority, result); return result;
    });
})();

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

function recordedSequenceFactory<T>(route: string, arm: EvidenceInputArm, compute: (input: Record<string, unknown>, anchors: readonly RecordedMoveAnchor[]) => readonly T[], sources: (input: Record<string, unknown>) => readonly DeclaredEvidence<unknown>[]): EvidenceValueFactory<Record<string, unknown>, readonly DeclaredEvidence<T>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [arm], result: "population", dependency: "semantic-convention-provenance" }, (input: Record<string, unknown>) => {
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
  return factory({ route, symbol, shape: "derived", arms: [{ first: sealed("rules.transition.event.capture@1"), second: sealed("rules.transition.event.capture@1"), firstEdge: sealed("run.record.edge@1"), secondEdge: sealed("run.record.edge@1") }], result: "population", dependency: "semantic-convention-provenance" }, ({ first, second, firstEdge, secondEdge }: { readonly first: DeclaredEvidence<unknown>; readonly second: DeclaredEvidence<unknown>; readonly firstEdge: DeclaredEvidence<unknown>; readonly secondEdge: DeclaredEvidence<unknown> }) => {
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
export const createDerivedTacticSequenceDefenderConsequenceV2Evidence = recordedSequenceFactory("derived.tactic.sequence.defender_consequence@2", { edges: EDGES(3) }, (_input, anchors) => recordedDefenderConsequenceOperands(anchors), edgesOf);
export const createDerivedTacticSquareClearanceObservedV2Evidence = recordedSequenceFactory("derived.tactic.square_clearance_observed@2", { edges: EDGES(3) }, (_input, anchors) => recordedSquareClearanceObservedOperands(anchors), edgesOf);
export const createDerivedTacticLineBlockerClearanceObservedV2Evidence = recordedSequenceFactory("derived.tactic.line_blocker_clearance_observed@2", { edges: EDGES(3), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  exactRecordedSequenceInputs(anchors, edgesOf(input), 3, others(input, "exchange"), ["rules.exchange.predicate.legal_exchange"]);
  return recordedLineBlockerClearanceObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "exchange")]);
export const createDerivedTacticDeflectionObservedV2Evidence = recordedSequenceFactory("derived.tactic.deflection_observed@2", { edges: EDGES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), captures: sealedList(1, null, "rules.transition.event.capture@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1"), check: optional(sealed("rules.tactic.event.check@1")) }, (input, anchors) => {
  const induction = deflectionObservedInduction(anchors);
  if (induction === undefined) throw new TypeError("Observed deflection has no induction authority");
  if ((induction === "check_induced") !== (input.check !== undefined)) throw new TypeError("Recorded deflection check authority disagrees with its induction arm");
  exactRecordedSequenceInputs(anchors, edgesOf(input), 3, others(input, "duty", "captures", "exchange", "check"), ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange", ...(induction === "check_induced" ? ["rules.tactic.event.check"] : [])]);
  return recordedDeflectionObservedOperands(anchors).filter((payload) => sameDigest(payload.targetCapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "duty", "captures", "exchange", "check")]);
export const createDerivedTacticAttractionObservedV2Evidence = recordedSequenceFactory("derived.tactic.attraction_observed@2", { edges: EDGES(3, 5), captures: sealedList(1, null, "rules.transition.event.capture@1"), check: optional(sealed("rules.tactic.event.check@1")) }, (input, anchors) => {
  const payloads = recordedAttractionObservedOperands(anchors);
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
  return recordedCheckZwischenzugObservedOperands(anchors).filter((payload) => sameDigest(payload.retainedRecapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "capture", "check", "exchange")]);
export const createDerivedTacticOverloadExploitationObservedV2Evidence = recordedSequenceFactory("derived.tactic.overload_exploitation_observed@2", { edges: EDGES(3), duty: sealed("rules.tactic.reading.defender_duty_set@1"), captures: sealedList(3, 3, "rules.transition.event.capture@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1") }, (input, anchors) => {
  exactRecordedSequenceInputs(anchors, edgesOf(input), 3, others(input, "duty", "captures", "exchange"), ["rules.tactic.reading.defender_duty_set", "rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
  return overloadExploitationObservedOperands(anchors).filter((payload) => sameDigest(payload.secondTargetCapture, (input.exchange as DeclaredEvidence<unknown>).payload));
}, (input) => [...edgesOf(input), ...others(input, "duty", "captures", "exchange")]);

/** Accepted F2 §2.3j: no caller arrays, payloads, selected arms or truncated witness tuples. */
function ownedRecordedSequenceFactory(route: RecordedSequenceRoute): EvidenceValueFactory<{ readonly window: RecordedSequenceWindow }, readonly DeclaredEvidence<unknown>[]> {
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ window: value("an owned recorded sequence window", isRecordedSequenceWindow) }], result: "population", dependency: "semantic-convention-provenance" }, ({ window }: { readonly window: RecordedSequenceWindow }) => {
    readRecordedSequenceWindow(window, route);
    return Object.freeze(recordedSequenceWindowOperands(window, route).map(payload => {
      const inputs = recordedSequenceWindowInputs(window, payload);
      return mint(route, symbol, payload, recordedSequenceWindowValueAuthority(window, payload, inputs), inputs);
    }));
  });
}
export const createDerivedPawnSequenceContactTimingV3Evidence = ownedRecordedSequenceFactory("derived.pawn.sequence.contact_timing@3");
export const createDerivedPawnSequenceHarassmentPressureV3Evidence = ownedRecordedSequenceFactory("derived.pawn.sequence.harassment_pressure@3");
export const createDerivedTacticSequenceDefenderConsequenceV3Evidence = ownedRecordedSequenceFactory("derived.tactic.sequence.defender_consequence@3");
export const createDerivedTacticSquareClearanceObservedV3Evidence = ownedRecordedSequenceFactory("derived.tactic.square_clearance_observed@3");
export const createDerivedTacticLineBlockerClearanceObservedV3Evidence = ownedRecordedSequenceFactory("derived.tactic.line_blocker_clearance_observed@3");
export const createDerivedTacticInterferenceObservedV3Evidence = ownedRecordedSequenceFactory("derived.tactic.interference_observed@3");
export const createDerivedTacticCheckZwischenzugObservedV3Evidence = ownedRecordedSequenceFactory("derived.tactic.check_zwischenzug_observed@3");
export const createDerivedTacticOverloadExploitationObservedV3Evidence = ownedRecordedSequenceFactory("derived.tactic.overload_exploitation_observed@3");
export const createDerivedTacticDeflectionObservedV3Evidence = ownedRecordedSequenceFactory("derived.tactic.deflection_observed@3");
export const createDerivedTacticAttractionObservedV3Evidence = ownedRecordedSequenceFactory("derived.tactic.attraction_observed@3");

/** `theory.endgame.method_stage@1` payload (MethodStageV1). */
export interface MethodStageV1 {
  readonly technique: EndgameTechnique;
  readonly stage: MethodStage;
  readonly beneficiary: "white" | "black";
  readonly convention: VersionedEvidenceId;
  readonly pathId: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly edgeIds: readonly string[];
  readonly beforeFen: string;
  readonly afterFen: string;
  readonly triggeringUci: string;
}

export type EndgameMethodStageAvailability =
  | { readonly kind: "available"; readonly value: readonly DeclaredEvidence<MethodStageV1>[] }
  | { readonly kind: "no_stage" }
  | { readonly kind: "unavailable"; readonly reason: string; readonly dependency?: string };

export const createTheoryEndgameMethodStageV1Evidence = (() => {
  const route = "theory.endgame.method_stage@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ setup: sealed("theory.endgame.setup_match@1"), edges: EDGES(1, null), convention: value("a versioned method convention ref", (candidate) => hasExactKeys(candidate, ["id", "version"])) }], result: "availability", dependency: "semantic-convention-provenance" }, ({ setup, edges, convention }: { readonly setup: DeclaredEvidence<unknown>; readonly edges: readonly DeclaredEvidence<unknown>[]; readonly convention: VersionedEvidenceId }): EndgameMethodStageAvailability => {
    const anchors = recordedEdgeAnchors(edges);
    const method = endgameMethodConvention(convention);
    if (method === undefined) return Object.freeze({ kind: "unavailable", reason: `method_convention_unregistered:${convention.id}@${convention.version}`, dependency: "semantic-convention-provenance" });
    const match = setup.payload as EndgameSetupMatch;
    if (match.technique !== method.technique || match.convention.id !== method.setup.id || match.convention.version !== method.setup.version) throw new TypeError(`Method convention ${method.id}@${method.version} requires a ${method.setup.id}@${method.setup.version} setup match`);
    if (match.fen !== anchors[0]!.beforeFen) throw new TypeError("Method replay setup match is not the exact start of the recorded edge window");
    const payloads = edges.map((edge) => edge.payload as RecordedEdge);
    const observed = replayEndgameMethod(method, anchors);
    if (observed.length === 0) return Object.freeze({ kind: "no_stage" });
    return Object.freeze({ kind: "available", value: Object.freeze(observed.map((stage) => {
      const window = anchors.slice(0, stage.stepIndex + 1);
      const trigger = anchors[stage.stepIndex]!;
      const payload: MethodStageV1 = Object.freeze({
        technique: stage.technique,
        stage: stage.stage,
        beneficiary: stage.beneficiary,
        convention: Object.freeze({ id: method.id, version: method.version }),
        pathId: payloads[0]!.runId,
        startNodeId: anchors[0]!.beforeNodeId,
        endNodeId: trigger.afterNodeId,
        edgeIds: Object.freeze(window.map((edge) => `${edge.beforeNodeId}>${edge.afterNodeId}`)),
        beforeFen: trigger.beforeFen,
        afterFen: trigger.afterFen,
        triggeringUci: trigger.moveUci,
      });
      return mint(route, symbol, payload, { setup, edges: edges.slice(0, stage.stepIndex + 1), convention }, [setup, ...edges.slice(0, stage.stepIndex + 1), evidenceDigest(method)], [convention]);
    })) });
  });
})();

// ---------------------------------------------------------------------------------------------
// rfc/bounded-policy-targets.md §4: the three bounded-target value routes
// ---------------------------------------------------------------------------------------------

type NamedTargetInputs = { readonly threat: ThreatEvidence; readonly exchange: LegalExchangeEvidence; readonly sourcePosition: SourceLegalMovesEvidence };

export type NamedMaterialTargetFactoryResult =
  | { readonly kind: "evidence"; readonly item: NamedMaterialTargetEvidence }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.named_material_target"; readonly version: 1 }; readonly reason: "input_abstained" | "position_mismatch" | "target_mismatch" };

export type BoundedTargetImmediateFactoryResult =
  | { readonly kind: "evidence"; readonly item: BoundedTargetImmediateEvidence }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.immediate"; readonly version: 1 }; readonly reason: "position_mismatch" | "target_mismatch" | "identity_lost"; readonly candidateUci: string };

export type BoundedTargetReturnDerivation =
  | { readonly kind: "evidence"; readonly item: BoundedTargetReturnEvidence }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.bounded_return"; readonly version: 1 }; readonly reason: "budget_exhausted"; readonly candidateUci: string; readonly visitedPositions: number };

const isExactLegalMove = (candidate: unknown): boolean => isRecord(candidate)
  && typeof candidate.uci === "string" && typeof candidate.from === "string" && typeof candidate.to === "string" && typeof candidate.role === "string"
  && Object.keys(candidate).every((key) => ["uci", "from", "to", "role", "promotion"].includes(key));

/** Named target: one positive material capture joined to its exact threat, exchange and source map. */
export const createDerivedBoundedTargetNamedMaterialTargetV1Evidence = (() => {
  const route = "derived.bounded_target.named_material_target@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ threat: sealed("rules.tactic.consequence.threat@1"), exchange: sealed("rules.exchange.predicate.legal_exchange@1"), sourcePosition: sealed("rules.mobility.reading.legal_moves@1") }], result: "availability" }, (input: NamedTargetInputs): NamedMaterialTargetFactoryResult => {
    const computed = computeNamedMaterialTarget(input.threat, input.exchange, input.sourcePosition);
    if (computed.kind === "abstained") return Object.freeze({ kind: "abstained", projection: Object.freeze({ id: "derived.bounded_target.named_material_target" as const, version: 1 as const }), reason: computed.reason });
    const item = mint(route, symbol, computed.payload, { threat: input.threat, exchange: input.exchange, sourcePosition: input.sourcePosition }, [input.threat, input.exchange, input.sourcePosition]) as NamedMaterialTargetEvidence;
    return Object.freeze({ kind: "evidence", item });
  });
})();

/** Immediate: the exact outcome of one legal candidate from the retained source map. */
export const createDerivedBoundedTargetImmediateV1Evidence = (() => {
  const route = "derived.bounded_target.immediate@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ target: sealed("derived.bounded_target.named_material_target@1"), candidate: value("an exact legal move from the retained source map", isExactLegalMove) }], result: "availability" }, (input: { readonly target: NamedMaterialTargetEvidence; readonly candidate: ExactLegalMove }): BoundedTargetImmediateFactoryResult => {
    const computed = computeImmediate(input.target.payload, input.candidate);
    if (computed.kind === "abstained") return Object.freeze({ kind: "abstained", projection: Object.freeze({ id: "derived.bounded_target.immediate" as const, version: 1 as const }), reason: computed.reason, candidateUci: computed.candidateUci });
    const payload: BoundedTargetImmediate = Object.freeze({ target: input.target, candidateUci: computed.candidateUci, afterFen: computed.afterFen, outcome: computed.outcome });
    const item = mint(route, symbol, payload, { target: input.target, candidate: input.candidate }, [input.target]) as BoundedTargetImmediateEvidence;
    return Object.freeze({ kind: "evidence", item });
  });
})();

/** Bounded return: the async three-ply enumeration under a service-created traversal authority. */
export const createDerivedBoundedTargetBoundedReturnV1Evidence = (() => {
  const route = "derived.bounded_target.bounded_return@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ immediate: sealed("derived.bounded_target.immediate@1"), traversal: value("a service-created bounded-target traversal authority", isBoundedTargetTraversalAuthority) }], result: "availability" }, async (input: { readonly immediate: BoundedTargetImmediateEvidence; readonly traversal: BoundedTargetTraversalAuthority }): Promise<BoundedTargetReturnDerivation> => {
    const immediate = input.immediate.payload;
    if (immediate.outcome.result !== "removed") throw new TypeError("A preserved immediate target has no bounded return");
    const computed = await computeBoundedReturn(immediate as BoundedTargetImmediate & { readonly outcome: { readonly result: "removed" } }, input.traversal);
    if (computed.kind === "budget_exhausted") return Object.freeze({ kind: "abstained", projection: Object.freeze({ id: "derived.bounded_target.bounded_return" as const, version: 1 as const }), reason: "budget_exhausted", candidateUci: immediate.candidateUci, visitedPositions: computed.visitedPositions });
    const payload: BoundedTargetReturn = Object.freeze({ immediate: input.immediate as BoundedTargetReturn["immediate"], horizonPlies: 3, visitedPositions: computed.visitedPositions, outcome: computed.outcome });
    const item = mint(route, symbol, payload, { immediate: input.immediate, traversal: input.traversal.requestDigest }, [input.immediate]) as BoundedTargetReturnEvidence;
    return Object.freeze({ kind: "evidence", item });
  });
})();

// ---------------------------------------------------------------------------------------------
// rfc/bounded-target-policy-composition.md §§2–4: the two reported policy derivations
// ---------------------------------------------------------------------------------------------

export type EngineTargetPolicyFactoryResult =
  | { readonly kind: "evidence"; readonly item: DeclaredEvidence<EngineTargetPolicyReading> }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.engine_target_policy"; readonly version: 1 }; readonly reason: EnginePolicyAbstention };

export type BoundedTargetPolicyBoundsFactoryResult =
  | { readonly kind: "evidence"; readonly item: DeclaredEvidence<BoundedTargetPolicyBounds> }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.policy_bounds"; readonly version: 1 }; readonly reason: MaiaPolicyAbstention };

const isUciText = (candidate: unknown): boolean => typeof candidate === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(candidate);
const POLICY_LOCAL = {
  target: sealed("derived.bounded_target.named_material_target@1"),
  immediate: sealed("derived.bounded_target.immediate@1"),
  boundedReturn: optional(sealed("derived.bounded_target.bounded_return@1")),
  counterfactualUci: value("a UCI counterfactual", isUciText),
} as const;

function policyLocal(input: { readonly target: DeclaredEvidence<unknown>; readonly immediate: DeclaredEvidence<unknown>; readonly boundedReturn?: DeclaredEvidence<unknown>; readonly counterfactualUci: string }): PolicyLocalInputs {
  return { target: input.target as NamedMaterialTargetEvidence, immediate: input.immediate as BoundedTargetImmediateEvidence, boundedReturn: (input.boundedReturn ?? null) as BoundedTargetReturnEvidence | null, counterfactualUci: input.counterfactualUci };
}

function policyLocalSources(local: PolicyLocalInputs): readonly DeclaredEvidence<unknown>[] {
  return local.boundedReturn === null ? [local.target, local.immediate] : [local.target, local.immediate, local.boundedReturn];
}

/** Depth-stable Stockfish category over two complete same-exchange legal-root tables (depths 8, 10). */
export const createDerivedBoundedTargetEngineTargetPolicyV1Evidence = (() => {
  const route = "derived.bounded_target.engine_target_policy@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ ...POLICY_LOCAL, tables: sealedList(2, 2, "live.stockfish.legal_root_table@1") }], result: "availability" }, (input: Parameters<typeof policyLocal>[0] & { readonly tables: readonly DeclaredEvidence<unknown>[] }): EngineTargetPolicyFactoryResult => {
    const local = policyLocal(input);
    const tables = [input.tables[0], input.tables[1]] as unknown as readonly [StockfishTableEvidence, StockfishTableEvidence];
    const derived = deriveEngineTargetPolicy(local, tables);
    if (derived.kind === "abstained") return Object.freeze({ kind: "abstained", projection: Object.freeze({ id: "derived.bounded_target.engine_target_policy" as const, version: 1 as const }), reason: derived.reason });
    const item = mint(route, symbol, derived.payload, { local: policyLocalSources(local), counterfactualUci: local.counterfactualUci, tables }, [...policyLocalSources(local), ...tables]);
    return Object.freeze({ kind: "evidence", item });
  });
})();

/** One-band Maia execution/availability bounds over the retained root and expansion pages. */
export const createDerivedBoundedTargetPolicyBoundsV1Evidence = (() => {
  const route = "derived.bounded_target.policy_bounds@1";
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ ...POLICY_LOCAL, band: value("an applied Maia band", Number.isSafeInteger), root: sealed("human.maia.policy_page@1"), second: sealedList(0, 8, "human.maia.policy_page@1") }], result: "availability" }, (input: Parameters<typeof policyLocal>[0] & { readonly band: number; readonly root: DeclaredEvidence<unknown>; readonly second: readonly DeclaredEvidence<unknown>[] }): BoundedTargetPolicyBoundsFactoryResult => {
    const local = policyLocal(input);
    const expansion = { root: input.root as MaiaPageEvidence, second: input.second as readonly MaiaPageEvidence[] };
    const derived = deriveMaiaPolicyBounds(local, input.band, expansion);
    if (derived.kind === "abstained") return Object.freeze({ kind: "abstained", projection: Object.freeze({ id: "derived.bounded_target.policy_bounds" as const, version: 1 as const }), reason: derived.reason });
    const item = mint(route, symbol, derived.payload, { local: policyLocalSources(local), counterfactualUci: local.counterfactualUci, band: input.band, pages: derived.payload.pages }, [...policyLocalSources(local), ...derived.payload.pages]);
    return Object.freeze({ kind: "evidence", item });
  });
})();

// Pivotal factories are defined last: they reuse the reading and source factories above.
export const createDerivedPivotalIrreversibilityV1Evidence = pivotalFactory("irreversibility", 1);
export const createDerivedPivotalPhaseChangeV1Evidence = pivotalFactory("phase_change", 1);
export const createDerivedPivotalHumanDivergenceV1Evidence = pivotalFactory("human_divergence", 1);
export const createDerivedPivotalOptionCollapseV1Evidence = pivotalFactory("option_collapse", 1);
export const createDerivedPivotalPhaseChangeV2Evidence = pivotalFactory("phase_change", 2);
export const createDerivedPivotalOptionCollapseV2Evidence = pivotalFactory("option_collapse", 2);

// ---------------------------------------------------------------------------------------------
// Guided Hint (rfc/hint-distance.md §1–§3, [[D1640]]/[[D1641]]): seven family horizons and 35
// family x rung disclosures. The horizon payload is computed here from one sealed searched line and
// one sealed family source at an explicit root-side ply; a disclosure is computed from one sealed
// horizon. No caller ever supplies either payload.
// ---------------------------------------------------------------------------------------------

type HintLineEvidence = DeclaredEvidence<ProviderEvidenceDelivery<FixedBoundPrincipalVariation, "stockfish.principal_variation@1">>;

function hintHorizonFactory(family: HintFamily): EvidenceValueFactory<{ readonly line: HintLineEvidence; readonly source: DeclaredEvidence<unknown>; readonly ply: 1 | 3 }, EvidenceAvailability<DeclaredEvidence<HintHorizonOccurrence>>> {
  const row = hintDeclarationRow(family);
  const route = `${row.horizon.id}@${row.horizon.version}`;
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ line: sealed(`${HINT_SEARCH_SOURCE.id}@${HINT_SEARCH_SOURCE.version}`), source: sealed(`${row.source.id}@${row.source.version}`), ply: value("the searched root-side ply 1 or 3", (candidate) => candidate === 1 || candidate === 3) }], result: "availability" }, ({ line, source, ply }: { readonly line: HintLineEvidence; readonly source: DeclaredEvidence<unknown>; readonly ply: 1 | 3 }): EvidenceAvailability<DeclaredEvidence<HintHorizonOccurrence>> => {
    const occurrence = hintHorizonOccurrence(family, line.payload, source.payload, ply);
    if (occurrence === undefined) return unavailable("no_admitted_occurrence");
    return available(mint(route, symbol, occurrence, { line, source, ply }, [source, line]));
  });
}

/** One availability factory per hint family (seven). */
export const HINT_HORIZON_FACTORIES = Object.freeze(Object.fromEntries(HINT_FAMILIES.map((family) => {
  const ref = hintDeclarationRow(family).horizon;
  return [`${ref.id}@${ref.version}`, hintHorizonFactory(family)];
})) as Readonly<Record<`derived.hint.horizon.${HintFamily}@${1 | 2}`, ReturnType<typeof hintHorizonFactory>>>);

function hintDisclosureFactory(family: HintFamily, rung: HintRung): EvidenceValueFactory<{ readonly horizon: DeclaredEvidence<HintHorizonOccurrence> }, DeclaredEvidence<HintDisclosurePayload>> {
  const row = hintDeclarationRow(family), disclosure = row.disclosures[rung];
  const route = `${disclosure.id}@${disclosure.version}`;
  const symbol = evidenceFactorySymbol(route);
  return factory({ route, symbol, shape: "derived", arms: [{ horizon: sealed(`${row.horizon.id}@${row.horizon.version}`) }], result: "single" }, ({ horizon }: { readonly horizon: DeclaredEvidence<HintHorizonOccurrence> }) =>
    mint(route, symbol, hintDisclosurePayload(horizon.payload, rung), { horizon }, [horizon]));
}

/** One single-value factory per hint family x rung (thirty-five). */
export const HINT_DISCLOSURE_FACTORIES = Object.freeze(Object.fromEntries(HINT_FAMILIES.flatMap((family) => HINT_RUNGS.map((rung) => {
  const ref = hintDeclarationRow(family).disclosures[rung];
  return [`${ref.id}@${ref.version}`, hintDisclosureFactory(family, rung)];
}))) as Readonly<Record<`${HintDisclosureProjectionId}@${1 | 2}`, ReturnType<typeof hintDisclosureFactory>>>);

export const createDerivedInspectorDetailBackwardPawnsV1Evidence = inspectorDetailFactory("backward_pawns");
export const createDerivedInspectorDetailPawnFileGroupsV1Evidence = inspectorDetailFactory("pawn_file_groups");
export const createDerivedInspectorDetailFileStatesV1Evidence = inspectorDetailFactory("file_states");
export const createDerivedInspectorDetailFutureFileChallengesV1Evidence = inspectorDetailFactory("future_file_challenges");
export const createDerivedInspectorDetailCaptureMigrationReachesV1Evidence = inspectorDetailFactory("capture_migration_reaches");
export const createDerivedInspectorDetailOutpostCandidatesV1Evidence = inspectorDetailFactory("outpost_candidates");
export const createDerivedInspectorDetailOccupiedOutpostsV1Evidence = inspectorDetailFactory("occupied_outposts");
export const createDerivedInspectorDetailBackwardPawnAdvanceV1Evidence = inspectorDetailFactory("backward_pawn_advance");
