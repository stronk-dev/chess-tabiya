// DISPOSABLE research harness — D1585/D1586/D1587/D1589/D1591. Not production code.
import type { AnswerDistance, EvidenceRole } from "../../packages/runtime/src/evidence-contract.js";

export type AnswerCapability =
  | "observation"
  | "pattern"
  | "threat"
  | "theory"
  | "evaluation"
  | "candidates"
  | "ranked_candidates"
  | "move"
  | "principal_variation";

/**
 * Answer distance is a branched disclosure vocabulary, not one total ladder.
 * These are explicit capability sets; a module declaration may union only the
 * branches it actually promises.
 */
export const ANSWER_CAPABILITY_IMAGE = Object.freeze({
  observation: Object.freeze(["fact"]),
  pattern: Object.freeze(["fact", "pattern"]),
  threat: Object.freeze(["fact", "threat"]),
  theory: Object.freeze(["fact", "pattern", "theory", "principle", "plan"]),
  evaluation: Object.freeze(["fact", "evaluation"]),
  candidates: Object.freeze(["fact", "candidate_moves"]),
  ranked_candidates: Object.freeze(["fact", "candidate_moves", "ranked_moves"]),
  move: Object.freeze(["fact", "candidate_moves", "ranked_moves", "move"]),
  principal_variation: Object.freeze(["fact", "candidate_moves", "ranked_moves", "move", "principal_variation"]),
} satisfies Record<AnswerCapability, readonly AnswerDistance[]>);

export function answerPolicy(...capabilities: readonly AnswerCapability[]): readonly AnswerDistance[] {
  return Object.freeze([...new Set(capabilities.flatMap((capability) => ANSWER_CAPABILITY_IMAGE[capability]))]);
}

export function answerPolicyAdmits(policy: readonly AnswerDistance[], content: readonly AnswerDistance[]): boolean {
  return content.every((item) => policy.includes(item));
}

export interface ExplorerPopulation {
  readonly source: "lichess-explorer";
  readonly ratings: readonly number[];
  readonly speeds: readonly string[];
  readonly since: string;
  readonly until: string;
}

export type ExplorerPage = {
  readonly nodeId: string;
  readonly committedMoveSan: string | null;
  readonly result:
    | {
        readonly kind: "stats";
        readonly total: number;
        readonly white: number;
        readonly draws: number;
        readonly black: number;
        readonly moves: readonly {
          readonly san: string;
          readonly uci: string;
          readonly playedCount: number;
          readonly sharePct: number;
          readonly white: number;
          readonly draws: number;
          readonly black: number;
        }[];
        readonly recency: { readonly kind: "month"; readonly lastPlayedMonth: string } | { readonly kind: "absent" };
        readonly population: ExplorerPopulation;
      }
    | {
        readonly kind: "abstention";
        readonly reason: "no_data_at_band" | "source_unavailable";
        readonly detail: string;
        readonly population: ExplorerPopulation;
      };
};

export type ExplorerPopulationSummary =
  | {
      readonly nodeId: string;
      readonly kind: "stats";
      readonly total: number;
      readonly white: number;
      readonly draws: number;
      readonly black: number;
      readonly recency: { readonly kind: "month"; readonly lastPlayedMonth: string } | { readonly kind: "absent" };
      readonly population: ExplorerPopulation;
    }
  | {
      readonly nodeId: string;
      readonly kind: "abstention";
      readonly reason: "no_data_at_band" | "source_unavailable";
      readonly detail: string;
      readonly population: ExplorerPopulation;
    };

/** Literal derivation: population context survives; candidate identities cannot. */
export function explorerPopulationSummary(page: ExplorerPage): ExplorerPopulationSummary {
  if (page.result.kind === "abstention") {
    return Object.freeze({
      nodeId: page.nodeId,
      kind: "abstention",
      reason: page.result.reason,
      detail: page.result.detail,
      population: page.result.population,
    });
  }
  return Object.freeze({
    nodeId: page.nodeId,
    kind: "stats",
    total: page.result.total,
    white: page.result.white,
    draws: page.result.draws,
    black: page.result.black,
    recency: page.result.recency,
    population: page.result.population,
  });
}

export const RULES_FLOOR_ROLES = Object.freeze([
  "learner",
  "host",
  "participant",
] satisfies readonly EvidenceRole[]);

export function moduleRoleAdmitted(roles: readonly EvidenceRole[], role: EvidenceRole): boolean {
  return roles.includes(role);
}
