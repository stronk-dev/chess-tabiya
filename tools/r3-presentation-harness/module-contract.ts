// DISPOSABLE research harness — platform-alignment R3. Not production code.

export type GuidanceModuleId =
  | "rules_floor"
  | "sight_on_request"
  | "blunder_prevention"
  | "postcommit_nudge"
  | "guided_hint"
  | "compare_coach"
  | "theory_breadcrumb"
  | "review_map"
  | "full_inspector";

export type Timing = "precommit" | "postcommit" | "disclosed" | "analysis";
export type GuidanceForm = "sentence" | "square" | "arrow" | "timeline" | "audio" | "panel";

export interface EvidenceFact {
  readonly id: string;
  readonly kind: string;
  readonly eligible: boolean;
  readonly allowedConsumers: readonly GuidanceModuleId[];
  readonly availableAt: Timing;
  readonly sourceRung: 0 | 1 | 2 | 3 | 4 | 5;
  readonly exactness: "exact" | "model" | "corpus" | "authored";
  readonly sign: "gained" | "lost" | "preserved" | "avoided" | "state";
  readonly squares: readonly string[];
  readonly text: string;
  readonly moveUci?: string;
  readonly recommendedMoveUci?: string;
  readonly principalVariation?: readonly string[];
}

export interface GuidanceModuleContract {
  readonly id: GuidanceModuleId;
  readonly intent: string;
  readonly timing: Timing;
  readonly activation: "automatic" | "on_request" | "explicit_preset" | "explicit_mode";
  readonly maxFacts: number;
  readonly forms: readonly GuidanceForm[];
  readonly allowsRecommendedMove: boolean;
  readonly status: "existing_policy" | "research_candidate" | "owner_ruled_candidate";
}

export interface ModulePacket {
  readonly moduleId: GuidanceModuleId;
  readonly facts: readonly EvidenceFact[];
  readonly abstained: boolean;
  readonly reason?: "no_eligible_fact";
}

const TIMING_ORDER: Record<Timing, number> = {
  precommit: 0,
  postcommit: 1,
  disclosed: 2,
  analysis: 3,
};

export const MODULES: readonly GuidanceModuleContract[] = Object.freeze([
  { id: "rules_floor", intent: "Show legal interaction affordances, not advice.", timing: "precommit", activation: "automatic", maxFacts: 0, forms: ["square"], allowsRecommendedMove: false, status: "existing_policy" },
  { id: "sight_on_request", intent: "Answer one concrete board-sight question without ranking moves.", timing: "precommit", activation: "on_request", maxFacts: 1, forms: ["sentence", "square", "arrow"], allowsRecommendedMove: false, status: "owner_ruled_candidate" },
  { id: "blunder_prevention", intent: "Warn about a validated staged-move risk only inside explicit Support, without naming an alternative.", timing: "precommit", activation: "explicit_preset", maxFacts: 1, forms: ["sentence", "square"], allowsRecommendedMove: false, status: "owner_ruled_candidate" },
  { id: "postcommit_nudge", intent: "Name at most two consequences of the move just played.", timing: "postcommit", activation: "automatic", maxFacts: 2, forms: ["sentence", "square", "arrow"], allowsRecommendedMove: false, status: "research_candidate" },
  { id: "guided_hint", intent: "Reveal a progressive hint only after an explicit request and disclosure.", timing: "disclosed", activation: "on_request", maxFacts: 2, forms: ["sentence", "square", "arrow", "audio"], allowsRecommendedMove: true, status: "research_candidate" },
  { id: "compare_coach", intent: "Name the smallest grounded difference between preserved attempts.", timing: "disclosed", activation: "on_request", maxFacts: 2, forms: ["sentence", "square", "panel"], allowsRecommendedMove: false, status: "research_candidate" },
  { id: "theory_breadcrumb", intent: "Link one applicable cited theory passage to rehearsal.", timing: "postcommit", activation: "on_request", maxFacts: 1, forms: ["sentence", "panel"], allowsRecommendedMove: false, status: "research_candidate" },
  { id: "review_map", intent: "Select grounded moments that open a retry, branch, drill, or theory action.", timing: "analysis", activation: "automatic", maxFacts: 3, forms: ["timeline", "sentence", "panel"], allowsRecommendedMove: true, status: "research_candidate" },
  { id: "full_inspector", intent: "Expose attributed evidence and engine lines for deliberate analysis.", timing: "analysis", activation: "explicit_mode", maxFacts: 20, forms: ["panel", "sentence", "square", "arrow"], allowsRecommendedMove: true, status: "research_candidate" },
]);

export function compileModulePacket(
  contract: GuidanceModuleContract,
  facts: readonly EvidenceFact[],
): ModulePacket {
  const admitted = facts
    .filter((fact) => fact.eligible)
    .filter((fact) => fact.allowedConsumers.includes(contract.id))
    .filter((fact) => TIMING_ORDER[fact.availableAt] <= TIMING_ORDER[contract.timing])
    .filter((fact) => contract.allowsRecommendedMove || (fact.recommendedMoveUci === undefined && fact.principalVariation === undefined))
    .slice(0, contract.maxFacts);
  if (admitted.length === 0) {
    return Object.freeze({ moduleId: contract.id, facts: Object.freeze([]), abstained: true, reason: "no_eligible_fact" });
  }
  return Object.freeze({ moduleId: contract.id, facts: Object.freeze(admitted), abstained: false });
}
