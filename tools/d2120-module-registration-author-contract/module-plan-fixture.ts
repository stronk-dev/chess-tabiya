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
  sight_on_request: Object.freeze({ timings: ["precommit", "postcommit"], roles: ["learner", "host"], forms: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"], maxFacts: 1 }),
  blunder_prevention: Object.freeze({ timings: ["at_commit"], roles: ["learner", "host"], forms: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"], maxFacts: 1 }),
  threat_radar: Object.freeze({ timings: ["precommit", "postcommit"], roles: ["learner", "host"], forms: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"], maxFacts: 3 }),
  postcommit_nudge: Object.freeze({ timings: ["postcommit"], roles: ["learner", "host"], forms: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"], maxFacts: 2 }),
  structure_nudge: Object.freeze({ timings: ["postcommit"], roles: ["learner", "host"], forms: ["panel", "timeline_marker"], maxFacts: 1 }),
  theory_breadcrumb: Object.freeze({ timings: ["postcommit"], roles: ["learner", "host"], forms: ["sentence", "panel"], maxFacts: 1 }),
  guided_hint: Object.freeze({ timings: ["checkpoint"], roles: ["learner", "host"], forms: ["sentence", "panel", "lit_squares", "piece_halo", "arrows"], maxFacts: 1 }),
  compare_coach: Object.freeze({ timings: ["checkpoint", "attempt_end", "review", "analysis"], roles: ["learner", "host"], forms: ["sentence", "panel", "arrows"], maxFacts: 2 }),
  review_map: Object.freeze({ timings: ["review", "analysis"], roles: ["learner", "host", "participant", "spectator"], forms: ["timeline_marker", "panel", "sentence", "lit_squares", "piece_halo", "arrows"], maxFacts: 3 }),
  full_inspector: Object.freeze({ timings: ["review", "analysis"], roles: ["learner", "host"], forms: ["panel", "sentence", "lit_squares", "piece_halo", "arrows"], maxFacts: 20 }),
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
