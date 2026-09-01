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
  // Deliberately present and empty until hint-distance publishes the literal
  // family x rung disclosure registry. Omitting this key made the old author
  // contract pass at R=0 (D2168).
  guided_hint: Object.freeze([]),
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

export const GUIDED_HINT_AUTHORITY = Object.freeze({
  status: "owner_blocked",
  blocker: "D1639",
  projectionRegistry: "HINT_DISCLOSURE_PROJECTION_IDS",
  familyRegistry: "HINT_HORIZON_FAMILIES",
  rungRegistry: "HINT_RUNGS",
  requires: Object.freeze({ minFamilies: 1, minRungs: 1, cartesianSetEquality: true }),
} as const);

/**
 * Literal author input for the future MODULE_DECLARATIONS registry. The
 * generator may consume this authority; it may not recreate any of these
 * policy bytes in a neighbouring table. Session ceilings are intentionally
 * absent because they are derived from WORKFLOW_CONTEXT_POLICIES.
 */
export const AUTHOR_MODULE_POLICIES = Object.freeze({
  sight_on_request: Object.freeze({ timings: ["precommit", "postcommit"], roles: ["learner", "host"], forms: ["sentence", "card", "square", "arrow"], maxFacts: 1 }),
  blunder_prevention: Object.freeze({ timings: ["at_commit"], roles: ["learner", "host"], forms: ["sentence", "card", "square", "arrow"], maxFacts: 1 }),
  threat_radar: Object.freeze({ timings: ["precommit", "postcommit"], roles: ["learner", "host"], forms: ["sentence", "card", "square", "arrow"], maxFacts: 3 }),
  postcommit_nudge: Object.freeze({ timings: ["postcommit"], roles: ["learner", "host"], forms: ["sentence", "card", "square", "arrow"], maxFacts: 2 }),
  structure_nudge: Object.freeze({ timings: ["postcommit"], roles: ["learner", "host"], forms: ["card", "timeline_mark"], maxFacts: 1 }),
  theory_breadcrumb: Object.freeze({ timings: ["postcommit"], roles: ["learner", "host"], forms: ["sentence", "card"], maxFacts: 1 }),
  guided_hint: Object.freeze({ timings: ["checkpoint"], roles: ["learner", "host"], forms: ["sentence", "square", "arrow"], maxFacts: 1 }),
  compare_coach: Object.freeze({ timings: ["checkpoint", "attempt_end", "review", "analysis"], roles: ["learner", "host"], forms: ["sentence", "card", "arrow"], maxFacts: 2 }),
  review_map: Object.freeze({ timings: ["review", "analysis"], roles: ["learner", "host", "participant", "spectator"], forms: ["timeline_mark", "card", "sentence", "square", "arrow"], maxFacts: 3 }),
  full_inspector: Object.freeze({ timings: ["review", "analysis"], roles: ["learner", "host"], forms: ["panel", "sentence", "square", "arrow"], maxFacts: 20 }),
} as const);

/**
 * Exact semantic exceptions to the sealed-pool stage profiles. A projection
 * enters this table because its own payload grain differs from the pool's
 * common grain; producer names are never consulted.
 */
export const AUTHOR_PROJECTION_SUBJECT_OVERRIDES = Object.freeze({
  "derived.activity.event.open_file_occupancy": "edge",
  "derived.compare.engine_trajectory": "branch_pair",
  "derived.compare.eval_delta": "branch_pair",
  "derived.compare.piece_route": "branch_pair",
  "derived.compare.structure_delta": "branch_pair",
  "derived.exchange.capture_class": "edge",
  "derived.exchange.trade_completed": "edge",
  "derived.grade.move_quality": "edge",
  "derived.king.captured_zone_defender": "edge",
  "derived.material.reading.role_signature": "position",
  "derived.pawn.event.transitions": "edge",
  "derived.semantic_avoidance.backward_pawn": "edge",
  "derived.semantic_avoidance.doubled_pawn": "edge",
  "derived.semantic_avoidance.half_open_file": "edge",
  "derived.semantic_avoidance.isolated_pawn": "edge",
  "derived.semantic_avoidance.king_opposition": "edge",
  "derived.semantic_avoidance.king_zone": "edge",
  "derived.semantic_avoidance.loose_piece": "edge",
  "derived.semantic_avoidance.open_file": "edge",
  "derived.semantic_avoidance.passed_pawn": "edge",
  "derived.semantic_avoidance.pawn_islands": "edge",
  "derived.story.rank": "run_prefix",
  "derived.tactic.attraction_observed": "edge",
  "derived.tactic.check_zwischenzug_observed": "edge",
  "derived.tactic.defender_exposure": "edge",
  "derived.tactic.deflection_observed": "edge",
  "derived.tactic.discovered_executed": "edge",
  "derived.tactic.interference_observed": "edge",
  "derived.tactic.line_blocker_clearance_observed": "edge",
  "derived.tactic.overload_exploitation_observed": "edge",
  "derived.tactic.promotion_pressure": "edge",
  "derived.tactic.square_clearance_observed": "edge",
  "rules.castling.event.rights_lost": "edge",
  "rules.castling.reading.legality": "position",
  "rules.castling.reading.rights": "position",
  "rules.king.event.zone_state": "edge",
  "rules.king.reading.zone_state": "position",
  "rules.mobility.reading.piece_destinations": "position",
  "rules.pawn.event.dynamics": "edge",
  "rules.pawn.reading.candidate_majority": "position",
  "rules.pawn.reading.contacts": "position",
  "rules.square.reading.control": "position",
  "rules.structural.event.backward_pawn": "edge",
  "rules.structural.event.doubled_pawn": "edge",
  "rules.structural.event.half_open_file": "edge",
  "rules.structural.event.isolated_pawn": "edge",
  "rules.structural.event.king_opposition": "edge",
  "rules.structural.event.king_zone": "edge",
  "rules.structural.event.open_file": "edge",
  "rules.structural.event.passed_pawn": "edge",
  "rules.structural.event.pawn_islands": "edge",
  "rules.tactic.consequence.mate_in_one": "edge",
  "rules.tactic.consequence.reply_breadth": "edge",
  "rules.tactic.consequence.threat": "edge",
  "rules.tactic.event.check": "edge",
  "rules.tactic.event.double_attack": "edge",
  "rules.tactic.event.loose_piece": "edge",
  "rules.tactic.reading.back_rank": "position",
  "rules.tactic.reading.discovered_latency": "position",
  "rules.tactic.reading.loose_piece": "position",
  "rules.tactic.reading.ray_classification": "position",
  "rules.tactic.reading.rook_on_seventh": "position",
  "rules.tactic.reading.trapped_piece": "position",
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
