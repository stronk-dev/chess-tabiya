// DISPOSABLE author fixture — D2120-D2126. Not production code.
import { STRUCTURAL_FEATURE_KINDS } from "../../packages/schema/src/drill-pack/types.js";
import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
  TRANSITION_GEOMETRY_EVENT_FAMILIES,
} from "../../packages/runtime/src/evidence-catalog.js";

const structuralEvents = STRUCTURAL_EVENT_PROJECTION_IDS.filter((id) => ![
  "rules.structural.event.piece_count", "rules.structural.event.direct_attack_count",
  "rules.structural.event.line_blockers",
].includes(id));
const transitionGeometry = TRANSITION_GEOMETRY_EVENT_FAMILIES.map((family) => `rules.transition.event.${family}`);
const transitionRules = TRANSITION_EVENT_PROJECTION_IDS.filter((id) =>
  !transitionGeometry.includes(id) && id !== "rules.transition.event.clock_reset");
const avoidance = [
  ...AVOIDANCE_EVENT_PROJECTION_IDS.filter((id) => ![
    "derived.semantic_avoidance.piece_count", "derived.semantic_avoidance.direct_attack_count",
    "derived.semantic_avoidance.line_blockers",
  ].includes(id)),
  ...TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS,
];
const observed = SEMANTIC_WAVE_EVENT_PROJECTION_IDS.filter((id) => id.startsWith("derived.tactic."));

const POSTCOMMIT = [
  ...structuralEvents, ...transitionGeometry, ...transitionRules,
  "rules.castling.event.rights_lost", "rules.tactic.event.double_attack",
  "rules.tactic.event.check", "rules.tactic.event.loose_piece",
  "derived.exchange.capture_class", "derived.exchange.trade_completed",
  "rules.structural.event.pawn_islands", ...avoidance, "rules.pawn.event.dynamics",
  "derived.pawn.event.transitions", "rules.king.event.zone_state",
  "derived.king.captured_zone_defender", "derived.activity.event.open_file_occupancy",
  "derived.grade.move_quality", ...observed,
] as const;

export const AUTHOR_MODULE_ACCEPTS = Object.freeze({
  sight_on_request: Object.freeze([
    ...STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count").map((kind) => `rules.structural.reading.${kind}`),
    "rules.castling.reading.rights", "rules.castling.reading.legality",
    "rules.tactic.reading.rook_on_seventh", "rules.square.reading.control",
    "rules.pawn.reading.contacts",
  ]),
  blunder_prevention: Object.freeze([
    "rules.tactic.consequence.threat", "rules.tactic.consequence.mate_in_one",
    "rules.tactic.reading.loose_piece",
  ]),
  threat_radar: Object.freeze([
    "rules.tactic.consequence.threat", "rules.tactic.consequence.mate_in_one",
    "rules.tactic.reading.loose_piece", "rules.tactic.reading.back_rank",
    "rules.tactic.reading.trapped_piece", "rules.tactic.reading.ray_classification",
    "derived.tactic.defender_exposure",
  ]),
  postcommit_nudge: Object.freeze(POSTCOMMIT),
  structure_nudge: Object.freeze([
    "theory.shapes.firing", "rules.structural.reading.named_structure",
    "rules.structural.reading.space", "rules.structural.reading.pawn_connectivity",
    "rules.phase.reading", "rules.endgame.reading",
  ]),
  theory_breadcrumb: Object.freeze([
    "pack.authored.claim", "theory.shapes.firing", "derived.explorer.population_summary",
    "theory.opening.current_endpoint",
  ]),
  compare_coach: Object.freeze([
    "derived.compare.structure_delta", "derived.compare.eval_delta",
    "derived.compare.engine_trajectory", "derived.compare.piece_route", "run.record.fork",
    "run.record.consequence", "run.record.objective_transition", "run.record.checkpoint_hit",
  ]),
  review_map: Object.freeze([
    ...POSTCOMMIT, "rules.pivotal.marker", "rules.phase.reading", "rules.endgame.reading",
    "recorded.engine.eval", "recorded.tablebase.result", "live.stockfish.eval",
    "live.stockfish.wdl", "run.record.objective_transition", "run.record.consequence",
    "run.record.imported_result",
  ]),
  full_inspector: Object.freeze([
    "rules.tactic.reading.loose_piece", "rules.tactic.reading.ray_classification",
    "rules.tactic.reading.rook_on_seventh", "rules.tactic.reading.trapped_piece",
    "rules.tactic.reading.back_rank", "rules.tactic.reading.discovered_latency",
    "rules.tactic.consequence.threat", "rules.tactic.consequence.mate_in_one",
    "rules.tactic.consequence.reply_breadth", "rules.structural.reading.space",
    "rules.structural.reading.pawn_connectivity", "rules.phase.development",
    "rules.castling.reading.rights", "rules.castling.reading.legality",
    "derived.tactic.discovered_executed", "derived.tactic.promotion_pressure",
    "rules.square.reading.control", "rules.mobility.reading.piece_destinations",
    "rules.pawn.reading.contacts", "rules.pawn.reading.candidate_majority",
    "derived.material.reading.role_signature", "rules.king.reading.zone_state",
    "live.stockfish.eval", "live.stockfish.wdl", "live.stockfish.pv", "human.maia.policy",
    "human.maia.candidate_wdl", "human.explorer.population", "live.syzygy.result",
    "live.syzygy.category", "live.syzygy.distance", "recorded.engine.eval",
    "recorded.tablebase.result", "theory.shapes.firing", "rules.phase.reading",
    "rules.pivotal.marker", "derived.compare.structure_delta", "derived.compare.eval_delta",
    "derived.story.rank", "pack.authored.classifier", ...observed,
  ]),
} as const);

export const STAGE_BY_PRODUCER = Object.freeze({
  "rules.structural": "position_local", "rules.transition": "edge_local",
  "rules.castling": "position_or_edge_local", "rules.exchange": "edge_local",
  "rules.tactic": "position_or_edge_local", "rules.square": "position_or_edge_local",
  "rules.mobility": "position_or_edge_local", "rules.pawn": "position_or_edge_local",
  "rules.king": "position_or_edge_local", "rules.phase": "position_local",
  "rules.pivotal": "run_local", "rules.endgame": "position_local",
  "theory.shapes": "catalogue_local", "pack.authored": "pack_local",
  "recorded.engine": "recorded_local", "recorded.tablebase": "recorded_local",
  "live.stockfish": "provider_optional", "live.syzygy": "provider_optional",
  "human.maia": "provider_optional", "human.explorer": "provider_optional",
  "theory.opening.runtime": "catalogue_local", "run.record": "run_local",
  "derived.compare_narrative": "derived_after_inputs", "derived.story": "derived_after_inputs",
  "derived.grade": "derived_after_inputs", "derived.exchange": "derived_after_inputs",
  "derived.tactic": "derived_after_inputs", "derived.pawn": "derived_after_inputs",
  "derived.material": "derived_after_inputs", "derived.king": "derived_after_inputs",
  "derived.activity": "derived_after_inputs", "derived.semantic_avoidance": "derived_after_inputs",
} as const);

const FALLBACK_OPERATION_BY_PRODUCER = Object.freeze({
  "rules.structural": ["packages/runtime/src/structure.ts", "structuralReading"],
  "rules.transition": ["packages/runtime/src/transition.ts", "transitionSemanticFacts"],
  "rules.castling": ["packages/runtime/src/castling.ts", "castlingRights"],
  "rules.exchange": ["packages/runtime/src/exchange.ts", "legalExchange"],
  "rules.tactic": ["packages/runtime/src/tactics.ts", "loosePieceReading"],
  "rules.square": ["packages/runtime/src/square-control.ts", "squareControlReading"],
  "rules.mobility": ["packages/runtime/src/mobility.ts", "pieceDestinationsReading"],
  "rules.pawn": ["packages/runtime/src/pawn-dynamics.ts", "pawnContactsReading"],
  "rules.king": ["packages/runtime/src/king-state.ts", "kingZoneReading"],
  "rules.phase": ["packages/runtime/src/phase.ts", "classifyPhase"],
  "rules.pivotal": ["packages/runtime/src/pivotal.ts", "pivotalMarkers"],
  "rules.endgame": ["packages/runtime/src/endgame.ts", "endgameReading"],
  "theory.shapes": ["packages/runtime/src/shape-firing.ts", "shapeFirings"],
  "pack.authored": ["apps/server/src/authored-feedback.ts", "projectAuthoredFeedback"],
  "recorded.engine": ["apps/server/src/position-evidence.ts", "recordedReadingsAt"],
  "recorded.tablebase": ["apps/server/src/position-evidence.ts", "recordedReadingsAt"],
  "live.stockfish": ["apps/server/src/evidence-queue.ts", "StockfishEvidenceExecutor.prototype.execute"],
  "live.syzygy": ["apps/server/src/tablebase.ts", "LichessTablebaseSource.prototype.probe"],
  "human.maia": ["apps/server/src/opponent-selector.ts", "OpponentSelector.prototype.select"],
  "human.explorer": ["apps/server/src/corpus.ts", "LichessCorpusSource.prototype.stats"],
  "theory.opening.runtime": ["apps/server/src/opening-catalogue.ts", "openingIdentityAt"],
  "run.record": ["packages/runtime/src/story.ts", "storyMoments"],
  "derived.compare_narrative": ["packages/runtime/src/compare-strips.ts", "comparisonNarrative"],
  "derived.story": ["packages/runtime/src/story.ts", "storyMoments"],
  "derived.grade": ["packages/runtime/src/grade.ts", "moveQualityGrade"],
  "derived.exchange": ["packages/runtime/src/semantic-evidence.ts", "derivedExchangeSemanticEvents"],
  "derived.tactic": ["packages/runtime/src/semantic-evidence.ts", "localSemanticEvents"],
  "derived.pawn": ["packages/runtime/src/pawn-dynamics.ts", "pawnTransitionEvents"],
  "derived.material": ["packages/runtime/src/material-state.ts", "materialRoleSignatureReading"],
  "derived.king": ["packages/runtime/src/semantic-evidence.ts", "localSemanticEvents"],
  "derived.activity": ["packages/runtime/src/semantic-evidence.ts", "localSemanticEvents"],
  "derived.semantic_avoidance": ["packages/runtime/src/semantic-evidence.ts", "selectLocalSemanticEvidence"],
} as const);

const op = (source: string, symbol: string) => Object.freeze([source, symbol] as const);

export function operationForProjection(id: string, producer: string): readonly [string, string] {
  if (id.startsWith("rules.structural.reading.")) return op("packages/runtime/src/structure.ts", "structuralReading");
  if (id.startsWith("rules.structural.event.")) return op("packages/runtime/src/semantic-evidence.ts", "structuralSemanticEvents");
  if (id.startsWith("rules.transition.event.")) return op("packages/runtime/src/semantic-evidence.ts", "transitionSemanticEvents");
  const exact: Readonly<Record<string, readonly [string, string]>> = Object.freeze({
    "rules.castling.reading.rights": op("packages/runtime/src/castling.ts", "castlingRights"),
    "rules.castling.reading.legality": op("packages/runtime/src/castling.ts", "castlingLegality"),
    "rules.castling.event.rights_lost": op("packages/runtime/src/castling.ts", "castlingRightsLost"),
    "rules.king.reading.zone_state": op("packages/runtime/src/king-state.ts", "kingZoneReading"),
    "rules.king.event.zone_state": op("packages/runtime/src/king-state.ts", "kingZoneEvents"),
    "rules.pawn.reading.contacts": op("packages/runtime/src/pawn-dynamics.ts", "pawnContactsReading"),
    "rules.pawn.reading.candidate_majority": op("packages/runtime/src/pawn-dynamics.ts", "candidateMajorityReading"),
    "rules.pawn.event.dynamics": op("packages/runtime/src/pawn-dynamics.ts", "pawnDynamicsEvents"),
    "rules.phase.reading": op("packages/runtime/src/phase.ts", "classifyPhase"),
    "rules.phase.development": op("packages/runtime/src/phase.ts", "developmentReading"),
    "rules.tactic.reading.loose_piece": op("packages/runtime/src/tactics.ts", "loosePieceReading"),
    "rules.tactic.reading.back_rank": op("packages/runtime/src/tactics.ts", "backRankReading"),
    "rules.tactic.reading.discovered_latency": op("packages/runtime/src/tactics.ts", "discoveredLatencyReading"),
    "rules.tactic.reading.ray_classification": op("packages/runtime/src/tactics.ts", "rayClassificationReading"),
    "rules.tactic.reading.rook_on_seventh": op("packages/runtime/src/tactics.ts", "rookOnSeventhReading"),
    "rules.tactic.reading.trapped_piece": op("packages/runtime/src/tactics.ts", "trappedPieceReading"),
    "rules.tactic.consequence.mate_in_one": op("packages/runtime/src/tactics.ts", "mateInOne"),
    "rules.tactic.consequence.reply_breadth": op("packages/runtime/src/tactics.ts", "replyBreadth"),
    "rules.tactic.consequence.threat": op("packages/runtime/src/tactics.ts", "threats"),
    "rules.tactic.event.check": op("packages/runtime/src/tactics.ts", "checkEvent"),
    "rules.tactic.event.double_attack": op("packages/runtime/src/tactics.ts", "doubleAttackEvent"),
    "rules.tactic.event.loose_piece": op("packages/runtime/src/tactics.ts", "loosePieceEvents"),
    "derived.activity.event.open_file_occupancy": op("packages/runtime/src/semantic-evidence.ts", "openFileOccupancyOperands"),
    "derived.compare.engine_trajectory": op("packages/runtime/src/compare-strips.ts", "comparisonEngineTrajectory"),
    "derived.compare.eval_delta": op("packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
    "derived.compare.piece_route": op("packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
    "derived.compare.structure_delta": op("packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
    "derived.exchange.capture_class": op("packages/runtime/src/semantic-evidence.ts", "derivedExchangeSemanticEvents"),
    "derived.exchange.trade_completed": op("packages/runtime/src/semantic-evidence.ts", "tradeCompletedSemanticEvent"),
    "derived.grade.move_quality": op("packages/runtime/src/grade.ts", "moveQualityGrade"),
    "derived.king.captured_zone_defender": op("packages/runtime/src/semantic-evidence.ts", "capturedZoneDefenderOperands"),
    "derived.material.reading.role_signature": op("packages/runtime/src/material-state.ts", "materialRoleSignatureReading"),
    "derived.pawn.event.transitions": op("packages/runtime/src/pawn-dynamics.ts", "pawnTransitionEvents"),
    "derived.story.rank": op("packages/runtime/src/story.ts", "storyMoments"),
    "derived.tactic.attraction_observed": op("packages/runtime/src/semantic-evidence.ts", "attractionObservedOperands"),
    "derived.tactic.check_zwischenzug_observed": op("packages/runtime/src/semantic-evidence.ts", "checkZwischenzugObservedOperands"),
    "derived.tactic.defender_exposure": op("packages/runtime/src/semantic-evidence.ts", "defenderExposureOperands"),
    "derived.tactic.deflection_observed": op("packages/runtime/src/semantic-evidence.ts", "deflectionObservedOperands"),
    "derived.tactic.discovered_executed": op("packages/runtime/src/semantic-evidence.ts", "discoveredExecutedSemanticEvents"),
    "derived.tactic.interference_observed": op("packages/runtime/src/semantic-evidence.ts", "interferenceObservedOperands"),
    "derived.tactic.line_blocker_clearance_observed": op("packages/runtime/src/semantic-evidence.ts", "lineBlockerClearanceObservedOperands"),
    "derived.tactic.overload_exploitation_observed": op("packages/runtime/src/semantic-evidence.ts", "overloadExploitationObservedOperands"),
    "derived.tactic.promotion_pressure": op("packages/runtime/src/tactics.ts", "promotionPressureReading"),
    "derived.tactic.square_clearance_observed": op("packages/runtime/src/semantic-evidence.ts", "squareClearanceObservedOperands"),
    "run.record.fork": op("packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
    "run.record.checkpoint_hit": op("packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
    "run.record.objective_transition": op("packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
    "run.record.consequence": op("packages/runtime/src/story.ts", "storyMoments"),
    "run.record.imported_result": op("packages/runtime/src/story.ts", "storyMoments"),
  });
  const selected = exact[id] ?? FALLBACK_OPERATION_BY_PRODUCER[producer as keyof typeof FALLBACK_OPERATION_BY_PRODUCER];
  if (selected === undefined) throw new TypeError(`missing operation for ${id} from ${producer}`);
  return selected;
}
