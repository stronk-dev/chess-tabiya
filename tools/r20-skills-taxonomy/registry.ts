// DISPOSABLE research registry — platform-alignment R20. Not a product taxonomy.
import { SEMANTIC_EVENT_PROJECTION_IDS } from "../../packages/runtime/src/evidence-catalog.js";

export const SKILL_CATEGORIES = Object.freeze([
  "fundamentals", "openings", "tactics", "strategy", "endgames",
] as const);

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export type SkillDisposition =
  | "credit_candidate"
  | "habit_only"
  | "review_only"
  | "refused_as_skill";

export interface SkillEvidenceRow {
  readonly projectionId: string;
  readonly categories: readonly [SkillCategory, ...SkillCategory[]];
  readonly disposition: SkillDisposition;
  readonly reason: string;
}

const TACTIC_CREDIT = new Set([
  "rules.transition.event.checkmate",
  "rules.tactic.event.double_attack",
  "derived.tactic.discovered_executed",
]);
const FUNDAMENTAL_CREDIT = new Set(["derived.semantic_avoidance.loose_piece"]);
const ENDGAME_CREDIT = new Set(["rules.transition.event.promotion"]);

function categories(id: string): readonly [SkillCategory, ...SkillCategory[]] {
  if (id.includes("promotion") || id.includes("passed_pawn") || id.includes("king_opposition")) {
    return ["endgames"];
  }
  if (id.includes("tactic") || id.includes("checkmate") || id.includes("capture_class") || id.includes("loose_piece")) {
    return ["tactics"];
  }
  if (id.includes("castl") || id.includes("developed") || id.includes("last_of_role") || id.includes("clock_reset")) {
    return ["fundamentals", "openings"];
  }
  if (id.startsWith("derived.semantic_avoidance.") && /backward_pawn|doubled_pawn|isolated_pawn|pawn_islands/u.test(id)) {
    return ["fundamentals", "strategy"];
  }
  return ["strategy"];
}

function disposition(id: string): Pick<SkillEvidenceRow, "disposition" | "reason"> {
  if (FUNDAMENTAL_CREDIT.has(id) || TACTIC_CREDIT.has(id) || ENDGAME_CREDIT.has(id)) {
    return {
      disposition: "credit_candidate",
      reason: "A legal-alternative population can count a declinable opportunity and the played edge can establish literal conversion; production still needs a measured floor and reference distribution.",
    };
  }
  if (id.includes("_observed") || id.includes("sequence.") || id.includes("defender_consequence")) {
    return {
      disposition: "review_only",
      reason: "The projection proves an observed bounded sequence, not a complete opportunity population; counting it would restate exposure.",
    };
  }
  if (id.endsWith("direct_attack_count") || id.endsWith("piece_count") || id.includes("reply_breadth")) {
    return {
      disposition: "refused_as_skill",
      reason: "A count or breadth is an operand without learner valence; a tier over it would manufacture skill meaning.",
    };
  }
  return {
    disposition: "habit_only",
    reason: "The signed or literal event can describe repeated choices, but its occurrence is not intrinsically good and cannot earn a skill tier without a separate outcome join.",
  };
}

export const SKILL_EVIDENCE_ROWS: readonly SkillEvidenceRow[] = Object.freeze(
  SEMANTIC_EVENT_PROJECTION_IDS.map((projectionId) => Object.freeze({
    projectionId,
    categories: Object.freeze(categories(projectionId)),
    ...disposition(projectionId),
  })),
);

export interface CandidateCreditRule {
  readonly id: string;
  readonly category: SkillCategory;
  readonly projections: readonly [string, ...string[]];
  readonly opportunity: string;
  readonly occurrence: string;
  readonly floorGames: number | null;
  readonly floorStatus: "measured_short_session" | "unmeasured";
  readonly tierRule: "reference_quantile_lower_bound@1";
  readonly state: "research_only" | "measurement_blocked";
  readonly moduleConsumers: readonly ("module.postcommit_nudge" | "module.review_map" | "module.full_inspector")[];
}

export const CANDIDATE_CREDIT_RULES: readonly CandidateCreditRule[] = Object.freeze([
  {
    id: "skills.fundamentals.loose_piece_avoidance@1",
    category: "fundamentals",
    projections: ["derived.semantic_avoidance.loose_piece"],
    opportunity: "At least one legal candidate creates a rules.tactic.event.loose_piece relation for the mover while at least one candidate avoids it.",
    occurrence: "The played edge carries derived.semantic_avoidance.loose_piece over that same complete legal-candidate set.",
    floorGames: null,
    floorStatus: "unmeasured",
    tierRule: "reference_quantile_lower_bound@1",
    state: "measurement_blocked",
    moduleConsumers: ["module.postcommit_nudge", "module.review_map"],
  },
  {
    id: "skills.tactics.double_attack_conversion@1",
    category: "tactics",
    projections: ["rules.tactic.event.double_attack", "rules.tactic.consequence.reply_breadth"],
    opportunity: "At least one legal candidate creates a meaningful double attack under the registered target-value rule; reply breadth is retained and never renamed force.",
    occurrence: "The played edge is one of those candidates; persistence beyond the declared reply horizon is not implied.",
    floorGames: null,
    floorStatus: "unmeasured",
    tierRule: "reference_quantile_lower_bound@1",
    state: "measurement_blocked",
    moduleConsumers: ["module.postcommit_nudge", "module.review_map"],
  },
  {
    id: "skills.tactics.mate_conversion@1",
    category: "tactics",
    projections: ["rules.transition.event.checkmate"],
    opportunity: "At least one legal candidate checkmates immediately.",
    occurrence: "The played edge checkmates immediately.",
    floorGames: null,
    floorStatus: "unmeasured",
    tierRule: "reference_quantile_lower_bound@1",
    state: "measurement_blocked",
    moduleConsumers: ["module.postcommit_nudge", "module.review_map"],
  },
  {
    id: "skills.tactics.discovered_execution@1",
    category: "tactics",
    projections: ["derived.tactic.discovered_executed"],
    opportunity: "At least one legal candidate produces the registered discovered-executed event with the exact line and target retained.",
    occurrence: "The played edge produces that event.",
    floorGames: null,
    floorStatus: "unmeasured",
    tierRule: "reference_quantile_lower_bound@1",
    state: "measurement_blocked",
    moduleConsumers: ["module.full_inspector"],
  },
  {
    id: "skills.endgames.promotion_completion@1",
    category: "endgames",
    projections: ["rules.transition.event.promotion"],
    opportunity: "At least one legal candidate promotes and at least one legal candidate does not; promotion role remains part of move identity.",
    occurrence: "The played edge promotes. This says completion, not that the promotion wins or is best.",
    floorGames: null,
    floorStatus: "unmeasured",
    tierRule: "reference_quantile_lower_bound@1",
    state: "measurement_blocked",
    moduleConsumers: ["module.postcommit_nudge", "module.review_map"],
  },
]);

export const MEASURED_HABIT_ROWS = Object.freeze([
  { id: "habits.openings.surprisal@1", category: "openings" as const, floorGames: 25, rho200: 0.974, productionProjection: null },
  { id: "habits.openings.family_entropy@1", category: "openings" as const, floorGames: 100, rho200: 0.935, productionProjection: null },
] as const);

export const TIER_RULE = Object.freeze({
  id: "reference_quantile_lower_bound@1" as const,
  input: "opportunity-normalized occurrence rate",
  uncertainty: "game-bootstrap 95% interval",
  baseline: "versioned reference population matched on declared phase and time-control scope",
  levels: Object.freeze([
    "insufficient_evidence: below the metric-specific floor",
    "established: floor met; rate and interval render without a mastery claim",
    "above_reference: lower interval bound exceeds the reference median",
    "distinctive: lower interval bound exceeds the reference 75th percentile",
  ]),
  refusal: "No raw-count, streak, global marketing floor, or LLM-authored tier is permitted.",
});
