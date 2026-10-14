import { BOT_FAMILY_LABELS, preferenceDisplayMode, presetDeclaration, requestedModules, requestedPreset, type ModuleId, type WorkflowPreferenceReceipt } from "@chess-tabiya/runtime/client";

import { ApiError } from "./api.js";

// rfc/campaign-core.md §7.1 — the browser half of the closed /campaign family. The client never
// sends a learner id, a loadout it did not choose, an origin, a balance or a verdict: every mutation
// carries only a durable command id plus the revision it saw.

/** The Campaign seal is permanent; the saved chess recording is not locked or deleted. */
export const CAMPAIGN_DECLARE_DONE_NOTE = "Declare done seals this campaign choice. Your recorded attempts are kept, but this campaign result cannot be changed.";

/** Read/display state only. It never authorizes a Campaign command. */
export interface CampaignEncounterState {
  readonly runId: string;
  readonly status: "pending" | "active" | "inactive" | "failed";
}

export interface CampaignTerminalAction {
  readonly label: string;
  readonly busy: boolean;
  readonly error?: string | undefined;
  readonly unavailableText?: string | undefined;
  readonly refreshing?: boolean | undefined;
  readonly onAction: () => void;
  readonly onRefresh?: (() => void) | undefined;
}

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

/** Encounter rules are independent of source/honesty withholding and never change the kit. */
export function campaignRestrictionText(card: Pick<CampaignNodeCard, "boss" | "suppress" | "seal">): string | undefined {
  if (card.suppress.length === 0) return undefined;
  const tools = card.suppress.map(id => CAMPAIGN_MODULE_LABELS[id]).join(", ");
  if (card.seal !== null) return `This ${card.boss ? "boss’s" : "encounter’s"} restriction ended for: ${tools}. Your earned tools and equipment are kept. Your help style, the next encounter and available evidence still determine what appears.`;
  return `This ${card.boss ? "boss" : "encounter"} sets aside: ${tools}. These tools will not provide help in this encounter. Your earned tools and equipment are kept.`;
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

/** A replay keeps its original command result but may carry a newer canonical map (§6.0). */
export function assertCampaignCommand(result: CampaignCommandResult, requested: CampaignProjection, kind: string): void {
  const actual = result?.campaign?.campaignRun;
  const expected = requested.campaignRun;
  const revision = result?.result?.campaignRevision;
  if (actual?.id !== expected.id || actual.campaignId !== expected.campaignId || actual.campaignVersion !== expected.campaignVersion
    || actual.documentDigest !== expected.documentDigest || result?.result?.kind !== kind
    || typeof revision !== "number" || revision !== expected.revision + 1 || !Number.isSafeInteger(actual.revision) || actual.revision < revision) {
    throw new Error("Crossed campaign command response");
  }
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

/** The saved document, not today's installed definition, owns this resume summary. */
export interface CampaignActiveRun {
  readonly campaignRunId: string;
  readonly campaignId: string;
  readonly title: string;
  readonly revision: number;
  readonly chargeBalance: number;
  readonly activeEncounter: { readonly nodeId: string; readonly playRunId: string; readonly title: string } | null;
}

function parseActiveCampaigns(value: unknown): { readonly runs: readonly CampaignActiveRun[] } {
  const record = (item: unknown): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item);
  const text = (item: unknown): item is string => typeof item === "string" && item.trim() !== "";
  const count = (item: unknown): item is number => typeof item === "number" && Number.isSafeInteger(item) && item >= 0;
  if (!record(value) || !Array.isArray(value.runs)) throw new Error("Invalid saved campaigns");
  const seen = new Set<string>();
  const runs = value.runs.map((row: unknown): CampaignActiveRun => {
    if (!record(row) || !text(row.campaignRunId) || !text(row.campaignId) || !text(row.title)
      || !count(row.revision) || !count(row.chargeBalance) || seen.has(row.campaignRunId)) throw new Error("Invalid saved campaign");
    seen.add(row.campaignRunId);
    let activeEncounter: CampaignActiveRun["activeEncounter"] = null;
    if (row.activeEncounter !== null) {
      const encounter = row.activeEncounter;
      if (!record(encounter) || !text(encounter.nodeId) || !text(encounter.playRunId) || !text(encounter.title)) throw new Error("Invalid saved encounter");
      activeEncounter = Object.freeze({ nodeId: encounter.nodeId, playRunId: encounter.playRunId, title: encounter.title });
    }
    return Object.freeze({ campaignRunId: row.campaignRunId, campaignId: row.campaignId, title: row.title,
      revision: row.revision, chargeBalance: row.chargeBalance, activeEncounter });
  });
  return Object.freeze({ runs: Object.freeze(runs) });
}

export interface CampaignRunResult {
  readonly campaign: CampaignProjection;
  readonly path: readonly ({ readonly nodeId: string; readonly act: string; readonly layer: number; readonly title: string; readonly playRunId: string } & (
    { readonly kind: "pack"; readonly verdict: CampaignVerdict } | { readonly kind: "boss_game"; readonly outcome: "win" | "loss" | "draw"; readonly reason: string }
  ))[];
  readonly prestigeEligible: boolean;
  readonly awards: readonly { readonly durableRewardId: string; readonly awardedAt: string }[];
}

interface CampaignEncounterIdentity {
  readonly runId: string;
  readonly nodeId: string;
  readonly campaignDocumentDigest: string;
}

/** campaign-core §6.3: a retained game, an unsealed abandoned attempt, or a deleted game. */
export type CampaignEncounterReview = CampaignEncounterIdentity & (
  | { readonly kind: "available"; readonly route: string; readonly reviewNodeId: string | null; readonly reviewBranchId: string; readonly reviewRoute: string | null }
  | { readonly kind: "abandoned"; readonly reason: "campaign_encounter_abandoned"; readonly route: string; readonly reviewNodeId: string | null; readonly reviewBranchId: string; readonly reviewRoute: string | null }
  | { readonly kind: "unavailable"; readonly reason: "campaign_encounter_run_deleted" | "campaign_abandoned_run_deleted" }
);

/** Play and Game Review targets come from the server's recorded subject, never the current cursor. */
export function parseCampaignEncounterReview(value: unknown, expected: CampaignEncounterIdentity & { readonly abandoned: boolean }): CampaignEncounterReview {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Invalid campaign encounter history");
  const row = value as Record<string, unknown>;
  if (row.runId !== expected.runId || row.nodeId !== expected.nodeId || row.campaignDocumentDigest !== expected.campaignDocumentDigest) throw new Error("Crossed campaign encounter history");
  const kind = expected.abandoned ? "abandoned" : "available";
  const reason = expected.abandoned ? "campaign_abandoned_run_deleted" : "campaign_encounter_run_deleted";
  const unavailable = row.kind === "unavailable" && row.reason === reason && row.route === undefined && row.reviewRoute === undefined && row.reviewNodeId === undefined && row.reviewBranchId === undefined;
  const reviewTarget = (row.reviewNodeId === null || (typeof row.reviewNodeId === "string" && row.reviewNodeId.trim() !== ""))
    && typeof row.reviewBranchId === "string" && row.reviewBranchId.trim() !== ""
    && (row.reviewRoute === null || row.reviewRoute === `/review/game/${encodeURIComponent(expected.runId)}?branch=${encodeURIComponent(row.reviewBranchId)}${row.reviewNodeId === null ? "" : `&node=${encodeURIComponent(row.reviewNodeId as string)}`}`);
  const retained = row.kind === kind && row.route === `/play/run/${encodeURIComponent(expected.runId)}`
    && reviewTarget
    && (expected.abandoned ? row.reason === "campaign_encounter_abandoned" : row.reason === undefined);
  if (!unavailable && !retained) throw new Error("Invalid campaign encounter history state or route");
  return value as CampaignEncounterReview;
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
  async active(): Promise<{ readonly runs: readonly CampaignActiveRun[] }> {
    return parseActiveCampaigns(await this.#json<unknown>("/campaigns/active"));
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
  review(campaignRunId: string, nodeId: string): Promise<CampaignEncounterReview> {
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

/** Presentation of the existing canonical request, never encounter/source authority. */
export function campaignHelpRequest(preference: WorkflowPreferenceReceipt | undefined):
  { readonly kind: "unavailable" } | { readonly kind: "requested"; readonly label: string; readonly modules: readonly ModuleId[] } {
  if (preference === undefined) return { kind: "unavailable" };
  const preset = requestedPreset(preference, "campaign");
  if (preset === undefined) return { kind: "unavailable" };
  return { kind: "requested", label: preferenceDisplayMode(preference, preset) === "custom" ? "Custom" : presetDeclaration(preset).label,
    modules: requestedModules(preference, preset) };
}

export function campaignToolRequestText(request: ReturnType<typeof campaignHelpRequest>, id: CampaignModuleId): string {
  if (request.kind === "unavailable") return "Help-style request unavailable.";
  return request.modules.includes(id)
    ? `Requested by ${request.label}.`
    : `Not requested by ${request.label} — remains equipped.`;
}

/** Node-result copy comes from its retained seal and pinned economy, not balance differences.
 * A command replay may carry a later map: the income stays this node's, kit/balance stay current.
 * The same view can be rebuilt after reload without a second submit or another durable record.
 */
export function campaignEncounterResult(campaign: CampaignProjection, nodeId: string, runId: string) {
  for (const act of campaign.acts) for (const layer of act.layers) {
    const card = layer.choices.find(item => item.nodeId === nodeId);
    if (card?.seal == null || card.seal.playRunId !== runId) continue;
    const actIncome = campaign.economy.actGrants[act.id];
    if (!Number.isSafeInteger(actIncome) || actIncome < 0 || !Number.isSafeInteger(campaign.charges.balance) || campaign.charges.balance < 0) throw new Error("Invalid campaign result income");
    const reward = card.reward;
    if (reward?.kind === "module_unlock" && !campaign.kit.owned.includes(reward.moduleId)) throw new Error("Unlocked tool missing from campaign kit");
    if (reward?.kind === "resource_grant" && (!Number.isSafeInteger(reward.amount) || reward.amount < 1)) throw new Error("Invalid campaign result reward");
    const tools = campaign.kit.owned.map(id => {
      if (!Object.hasOwn(CAMPAIGN_MODULE_LABELS, id)) throw new Error("Unknown campaign tool");
      return { moduleId: id, label: CAMPAIGN_MODULE_LABELS[id], equipped: campaign.kit.equipped.includes(id) };
    });
    return {
      title: card.title,
      verdict: verdictText(card.seal),
      act: ACT_LABELS[act.id],
      actIncome,
      resourceIncome: reward?.kind === "resource_grant" ? reward.amount : 0,
      reward: reward?.kind === "module_unlock" ? `Unlocked ${CAMPAIGN_MODULE_LABELS[reward.moduleId]}` : reward?.kind === "theory_unlock" ? "Unlocked a theory passage" : undefined,
      tools,
      endedRestrictions: card.suppress.map(id => CAMPAIGN_MODULE_LABELS[id]),
      balance: campaign.charges.balance,
      completed: campaign.campaignRun.status === "completed",
    };
  }
  return undefined;
}

/** Learner copy for the rules result that ended a boss game; an unlisted reason is not shown raw. */
const GAME_END_TEXT: Readonly<Record<string, string>> = Object.freeze({
  checkmate: "checkmate",
  stalemate: "stalemate",
  insufficient_material: "insufficient material",
  fifty_move: "the fifty-move rule",
  threefold: "threefold repetition",
  resignation: "resignation",
});

function gameEndText(reason: string): string {
  return GAME_END_TEXT[reason] ?? "the rules";
}

/** A registered bot's honest name: its family and model band, never the raw profile id. */
export function campaignBotLabel(profileId: string): string {
  const match = /^([a-z-]+)\.(\d+)@\d+$/u.exec(profileId);
  const family = match === null ? undefined : BOT_FAMILY_LABELS[match[1] as keyof typeof BOT_FAMILY_LABELS];
  return family === undefined ? "a registered bot" : `${family} · model band ${match![2]}`;
}

export function verdictText(seal: CampaignNodeCard["seal"]): string {
  if (seal === null) return "Not played";
  if (seal.kind === "boss_game") return seal.outcome === "win" ? `Game won by ${gameEndText(seal.reason)}` : seal.outcome === "loss" ? `Game lost by ${gameEndText(seal.reason)}` : `Game drawn by ${gameEndText(seal.reason)}`;
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
