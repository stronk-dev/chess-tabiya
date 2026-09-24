import { ApiError } from "./api.js";

// rfc/campaign-core.md §7.1 — the browser half of the closed /campaign family. The client never
// sends a learner id, a loadout it did not choose, an origin, a balance or a verdict: every mutation
// carries only a durable command id plus the revision it saw.

export type CampaignVerdict = "achieved" | "failed" | "transitioned" | "open";
export type CampaignModuleId =
  | "sight_on_request" | "blunder_prevention" | "threat_radar" | "postcommit_nudge" | "structure_nudge"
  | "theory_breadcrumb" | "guided_hint" | "compare_coach" | "review_map" | "full_inspector";

export type CampaignRunReward =
  | { readonly kind: "module_unlock"; readonly moduleId: CampaignModuleId }
  | { readonly kind: "theory_unlock"; readonly bundleId: string; readonly passageId: string }
  | { readonly kind: "resource_grant"; readonly resourceId: "campaign_rewind_charge"; readonly amount: number };

export interface CampaignNodeCard {
  readonly nodeId: string;
  readonly kind: "pack" | "boss_game";
  readonly title: string;
  readonly packId: string;
  readonly phase: string | null;
  readonly objectiveSummary: string | null;
  readonly boss: boolean;
  readonly suppress: readonly CampaignModuleId[];
  readonly reward: CampaignRunReward | null;
  readonly opponent: { readonly profileId: string; readonly band: number; readonly family: string } | null;
  readonly rating: "rated_when_clean" | "unrated" | null;
  readonly seal:
    | { readonly kind: "pack"; readonly verdict: CampaignVerdict; readonly playRunId: string }
    | { readonly kind: "boss_game"; readonly outcome: "win" | "loss" | "draw"; readonly reason: string; readonly playRunId: string }
    | null;
  readonly selectable: boolean;
  readonly active: boolean;
  readonly unavailable: "pack_unavailable" | "opponent_unavailable" | null;
}

export interface CampaignProjection {
  readonly campaignRun: {
    readonly id: string;
    readonly campaignId: string;
    readonly campaignVersion: number;
    readonly title: string;
    readonly channel: "community" | "official";
    readonly documentDigest: string;
    readonly status: "active" | "completed" | "abandoned";
    readonly revision: number;
    readonly createdAt: string;
  };
  readonly cursor: { readonly kind: "active"; readonly act: "act1" | "act2" | "act3"; readonly layer: 1 | 2 | 3 } | { readonly kind: "completed" } | { readonly kind: "abandoned" };
  readonly activeEncounter: { readonly nodeId: string; readonly playRunId: string; readonly title: string } | null;
  readonly acts: readonly {
    readonly id: "act1" | "act2" | "act3";
    readonly layers: readonly { readonly layer: 1 | 2 | 3; readonly state: "sealed" | "current" | "locked"; readonly choices: readonly CampaignNodeCard[] }[];
  }[];
  readonly charges: { readonly balance: number; readonly startingIncome: number; readonly actIncome: number; readonly rewardIncome: number; readonly spent: number };
  readonly economy: { readonly startingCharges: number; readonly actGrants: Readonly<Record<"act1" | "act2" | "act3", number>> };
  readonly kit: {
    readonly owned: readonly CampaignModuleId[];
    readonly equipped: readonly CampaignModuleId[];
    readonly ceiling: readonly CampaignModuleId[];
    readonly shelf: readonly { readonly moduleId: CampaignModuleId; readonly effective: boolean; readonly reason: string | null }[];
  };
  readonly prestige: { readonly eligible: boolean };
  readonly awards: readonly { readonly durableRewardId: string; readonly awardedAt: string }[];
  readonly abandonedEncounter: { readonly nodeId: string; readonly playRunId: string } | null;
}

export interface CampaignCommandResult {
  readonly result: { readonly kind: string; readonly campaignRevision?: number; readonly response?: Readonly<Record<string, unknown>> } & Readonly<Record<string, unknown>>;
  readonly replayed?: boolean;
  readonly campaign: CampaignProjection;
}

export interface CampaignCatalogueEntry {
  readonly id: string;
  readonly version: number;
  readonly title: string;
  readonly channel: "community" | "official";
  readonly nodeCount: number;
  readonly available: boolean;
  readonly unavailablePacks: readonly string[];
  readonly activeRunId: string | null;
  readonly completedRuns: number;
  readonly marks: readonly string[];
}

export interface CampaignRunResult {
  readonly campaign: CampaignProjection;
  readonly path: readonly ({ readonly nodeId: string; readonly act: string; readonly layer: number; readonly title: string; readonly playRunId: string } & (
    { readonly kind: "pack"; readonly verdict: CampaignVerdict } | { readonly kind: "boss_game"; readonly outcome: "win" | "loss" | "draw"; readonly reason: string }
  ))[];
  readonly prestigeEligible: boolean;
  readonly awards: readonly { readonly durableRewardId: string; readonly awardedAt: string }[];
}

export function newCampaignCommandId(): string {
  return `cmd-${globalThis.crypto.randomUUID()}`;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export class CampaignApi {
  readonly #fetch: Fetcher;

  constructor(fetcher: Fetcher = (input, init) => globalThis.fetch(input, init)) {
    this.#fetch = fetcher;
  }

  async #json<T>(path: string, method: "GET" | "POST" | "PUT" = "GET", body?: unknown, writerId?: string): Promise<T> {
    const response = await this.#fetch(path, {
      method,
      credentials: "same-origin",
      headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...(writerId === undefined ? {} : { "x-writer-id": writerId }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let value: unknown = {};
    try { value = await response.json(); } catch { /* typed transport error below */ }
    if (!response.ok) {
      const error = (value as { error?: Record<string, unknown> }).error ?? {};
      const { code, message, ...details } = error;
      throw new ApiError(response.status, typeof code === "string" ? code : "HTTP_ERROR", typeof message === "string" ? message : `HTTP ${response.status}`, details);
    }
    return value as T;
  }

  catalogue(): Promise<{ readonly campaigns: readonly CampaignCatalogueEntry[] }> { return this.#json("/campaigns"); }
  active(): Promise<{ readonly runs: readonly { readonly campaignRunId: string; readonly campaignId: string; readonly title: string; readonly revision: number; readonly chargeBalance: number; readonly activeEncounter: { readonly nodeId: string; readonly playRunId: string; readonly title: string } | null }[] }> {
    return this.#json("/campaigns/active");
  }
  rewards(): Promise<{ readonly awards: readonly { readonly campaignId: string; readonly durableRewardId: string; readonly awardedAt: string }[] }> { return this.#json("/campaign-rewards"); }
  create(campaignId: string, campaignVersion: number, commandId: string): Promise<CampaignCommandResult> {
    return this.#json(`/campaigns/${encodeURIComponent(campaignId)}/runs`, "POST", { campaignVersion, commandId });
  }
  read(campaignRunId: string): Promise<CampaignProjection> { return this.#json(`/campaign-runs/${encodeURIComponent(campaignRunId)}`); }
  result(campaignRunId: string): Promise<CampaignRunResult> { return this.#json(`/campaign-runs/${encodeURIComponent(campaignRunId)}/result`); }
  start(campaignRunId: string, nodeId: string, expectedRevision: number, commandId: string, writerId: string): Promise<CampaignCommandResult> {
    return this.#json(`/campaign-runs/${encodeURIComponent(campaignRunId)}/nodes/${encodeURIComponent(nodeId)}/start`, "POST", { expectedRevision, commandId }, writerId);
  }
  submit(campaignRunId: string, nodeId: string, input: { readonly runId: string; readonly branchId?: string; readonly expectedRevision: number; readonly commandId: string }): Promise<CampaignCommandResult> {
    return this.#json(`/campaign-runs/${encodeURIComponent(campaignRunId)}/nodes/${encodeURIComponent(nodeId)}/submit`, "POST", input);
  }
  loadout(campaignRunId: string, equippedModuleIds: readonly CampaignModuleId[], expectedRevision: number, commandId: string): Promise<CampaignCommandResult> {
    return this.#json(`/campaign-runs/${encodeURIComponent(campaignRunId)}/loadout`, "PUT", { equippedModuleIds, expectedRevision, commandId });
  }
  abandon(campaignRunId: string, expectedRevision: number, commandId: string): Promise<CampaignCommandResult> {
    return this.#json(`/campaign-runs/${encodeURIComponent(campaignRunId)}/abandon`, "POST", { expectedRevision, commandId });
  }
  review(campaignRunId: string, nodeId: string): Promise<{ readonly kind: "available" | "abandoned" | "unavailable"; readonly route?: string; readonly reason?: string }> {
    return this.#json(`/campaign-runs/${encodeURIComponent(campaignRunId)}/nodes/${encodeURIComponent(nodeId)}/review`);
  }
}

// ---------------------------------------------------------------------------------------------
// Closed copy (rfc/campaign-core.md §7/§8): no eval, grade or score vocabulary; charges are
// inventory, never a score; rewards say what became available, never that they caused anything.

export const CAMPAIGN_MODULE_LABELS: Readonly<Record<CampaignModuleId, string>> = Object.freeze({
  sight_on_request: "Square facts on request", blunder_prevention: "Staged-move risk check", threat_radar: "Threat radar",
  postcommit_nudge: "After-move nudge", structure_nudge: "Named-structure nudge", theory_breadcrumb: "Theory pointer",
  guided_hint: "Step-by-step hint", compare_coach: "Attempt comparison", review_map: "Review map", full_inspector: "Full inspector",
});

export function rewardText(reward: CampaignRunReward | null): string {
  if (reward === null) return "No reward on this node";
  if (reward.kind === "module_unlock") return `Unlocks ${CAMPAIGN_MODULE_LABELS[reward.moduleId]}`;
  if (reward.kind === "resource_grant") return `+${reward.amount} earned ${reward.amount === 1 ? "rewind" : "rewinds"}`;
  return "Unlocks a theory passage";
}

export function verdictText(seal: CampaignNodeCard["seal"]): string {
  if (seal === null) return "Not played";
  if (seal.kind === "boss_game") return seal.outcome === "win" ? `Game won (${seal.reason.replaceAll("_", " ")})` : seal.outcome === "loss" ? `Game lost (${seal.reason.replaceAll("_", " ")})` : `Game drawn (${seal.reason.replaceAll("_", " ")})`;
  return seal.verdict === "achieved" ? "Objective reached" : seal.verdict === "failed" ? "Objective not reached" : seal.verdict === "transitioned" ? "Objective transitioned" : "Played to the authored boundary";
}

export const SHELF_REASON_TEXT: Readonly<Record<string, string>> = Object.freeze({
  honesty_ceiling: "outside what Campaign allows",
  resting_until_act: "resting until the next act",
  boss_suppressed: "set aside by this boss",
  source_unavailable: "its source is unavailable",
  not_equipped: "not in your loadout",
});

export const ACT_LABELS: Readonly<Record<"act1" | "act2" | "act3", string>> = Object.freeze({ act1: "Act I", act2: "Act II", act3: "Act III" });
