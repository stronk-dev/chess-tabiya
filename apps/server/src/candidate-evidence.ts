import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  assertConsumerEvidenceView,
  backRankReading,
  candidateMajorityReading,
  castlingLegality,
  castlingRights,
  declareBackRankEvidence,
  declareCandidateFeatureVectorEvidence,
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
  developmentReading,
  discoveredLatencyReading,
  evidenceForConsumer,
  forkSurvivesReply,
  kingZoneReading,
  legalExchange,
  localSemanticEvents,
  loosePieceReading,
  mateInOne,
  materialRoleSignatureReading,
  pawnConnectivityReading,
  pawnContactsReading,
  pieceDestinationsReading,
  promotionPressureReading,
  rayClassificationReading,
  replyBreadth,
  rookOnSeventhReading,
  spaceReading,
  squareControlReading,
  threats,
  trappedPieceReading,
  declareTrappedPieceEvidence,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
  type DoubleAttackEvent,
  type SelectionEngineIdentity,
  type VersionedEvidenceId,
} from "@chess-tabiya/runtime";

import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";

const CANDIDATE_COLLECTOR_IDS = new Set<string>([
  ...TACTICAL_COLLECTOR_PROJECTION_IDS,
  ...BREADTH_COLLECTOR_PROJECTION_IDS,
]);

export interface CandidateFeatureInput {
  readonly moveUci: string;
  /** Fixed-bound Stockfish score from the root mover's frame. */
  readonly scoreCp: number;
}

export interface CandidateCollectorResult {
  readonly source: VersionedEvidenceId;
  readonly payload: unknown;
}

export interface CandidateFeatureRow {
  readonly moveUci: string;
  readonly afterFen: string;
  readonly scoreCp: number;
  readonly results: readonly CandidateCollectorResult[];
}

export interface CandidateFeatureVector {
  readonly beforeFen: string;
  readonly scoreFrame: "root_side";
  readonly engine: SelectionEngineIdentity;
  readonly candidates: readonly CandidateFeatureRow[];
}

function positionFromFen(fen: string): Chess {
  try {
    return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  } catch (cause) {
    throw new TypeError("Candidate evidence requires a legal standard-chess FEN", { cause });
  }
}

function childForCandidate(before: Chess, moveUci: string): { readonly moveUci: string; readonly afterFen: string } {
  const move = parseUci(moveUci);
  if (move === undefined || !isNormal(move) || !before.isLegal(move)) {
    throw new TypeError(`Candidate evidence move is illegal: ${moveUci}`);
  }
  const child = before.clone();
  child.play(move);
  return Object.freeze({ moveUci: makeUci(move), afterFen: makeFen(child.toSetup()) });
}

function fixedBoundEngine(engine: SelectionEngineIdentity): SelectionEngineIdentity {
  if (engine.id.trim() === "" || engine.name.trim() === "" || engine.version.trim() === "") {
    throw new TypeError("Candidate evidence engine identity is incomplete");
  }
  if (engine.searchBound === undefined || !Number.isFinite(engine.searchBound.value) || engine.searchBound.value <= 0) {
    throw new TypeError("Candidate evidence requires a positive fixed engine search bound");
  }
  return Object.freeze({ ...engine, searchBound: Object.freeze({ ...engine.searchBound }) });
}

function childReadings(afterFen: string): readonly DeclaredEvidence<unknown>[] {
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

function collectorResults(beforeFen: string, moveUci: string, afterFen: string): readonly CandidateCollectorResult[] {
  const events = localSemanticEvents(beforeFen, moveUci, afterFen);
  const declared: DeclaredEvidence<unknown>[] = [
    ...childReadings(afterFen),
    ...events.filter((event) => CANDIDATE_COLLECTOR_IDS.has(event.projection.id)).map((event) => event.evidence),
  ];
  const exchange = legalExchange(beforeFen, moveUci);
  if (exchange !== undefined) declared.push(declareLegalExchangeEvidence(exchange));

  const doubleAttack = events.find((event) => event.projection.id === "rules.tactic.event.double_attack");
  if (doubleAttack !== undefined) {
    declared.push(declareForkSurvivalEvidence(forkSurvivesReply(
      doubleAttack.operands as DoubleAttackEvent,
      replyBreadth(beforeFen, moveUci),
    )));
  }

  return Object.freeze(declared.map((evidence) => {
    if (!CANDIDATE_COLLECTOR_IDS.has(evidence.projection.id)) {
      throw new TypeError(`Candidate evidence escaped the tactical/breadth collector closure: ${evidence.projection.id}@${evidence.projection.version}`);
    }
    return Object.freeze({ source: evidence.projection, payload: evidence.payload });
  }));
}

export function consumeCandidateFeatureVector(view: ConsumerEvidenceView<CandidateFeatureVector>): CandidateFeatureVector {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "opponent.selection" || view.consumer.version !== 1 || view.items.length !== 1) {
    throw new TypeError("Expected one derived candidate feature vector admitted to opponent.selection@1");
  }
  return view.items[0]!.payload;
}

/**
 * Re-runs the registered tactical/breadth collectors on hypothetical legal children.
 * This adapter adds no chess detector and emits no prose, grade, salience, or trait claim.
 */
export function candidateFeatureVector(input: {
  readonly beforeFen: string;
  readonly engine: SelectionEngineIdentity;
  readonly candidates: readonly CandidateFeatureInput[];
}): CandidateFeatureVector {
  const root = positionFromFen(input.beforeFen);
  const beforeFen = makeFen(root.toSetup());
  const engine = fixedBoundEngine(input.engine);
  if (input.candidates.length === 0) throw new TypeError("Candidate evidence requires at least one candidate");
  const seen = new Set<string>();
  const candidates = input.candidates.map((candidate) => {
    if (!Number.isFinite(candidate.scoreCp)) throw new TypeError(`Candidate evidence score is not finite: ${candidate.moveUci}`);
    const child = childForCandidate(root, candidate.moveUci);
    if (seen.has(child.moveUci)) throw new TypeError(`Candidate evidence move is duplicated: ${child.moveUci}`);
    seen.add(child.moveUci);
    return Object.freeze({
      moveUci: child.moveUci,
      afterFen: child.afterFen,
      scoreCp: candidate.scoreCp,
      results: collectorResults(beforeFen, child.moveUci, child.afterFen),
    });
  });
  const payload: CandidateFeatureVector = Object.freeze({
    beforeFen,
    scoreFrame: "root_side",
    engine,
    candidates: Object.freeze(candidates),
  });
  return consumeCandidateFeatureVector(evidenceForConsumer(
    EVIDENCE_MANIFEST,
    { id: "opponent.selection", version: 1 },
    [declareCandidateFeatureVectorEvidence(payload)],
  ));
}
