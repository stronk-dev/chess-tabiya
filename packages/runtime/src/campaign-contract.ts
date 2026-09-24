import type { ModuleId } from "./module-contract.js";
import { MODULE_IDS } from "./module-contract.js";
import { workflowContextPolicy } from "./presets.js";
import type {
  CampaignActDefinition,
  CampaignBossGameEncounterDefinition,
  CampaignDocumentDefinition,
  CampaignEconomyDefinition,
  CampaignEncounterDefinition,
  CampaignLayerDefinition,
  CampaignNodeDefinition,
  CampaignPackEncounterDefinition,
  CampaignRunRewardDefinition,
  CampaignRunRewardRefDefinition,
  DurableCampaignRewardDefinition,
  DurableRewardGrantDefinition,
} from "@chess-tabiya/schema/campaign";

// rfc/campaign-core.md §1/§3 — the authored campaign contract over schema lanes 2 and 3.

export type UnlockableModuleId = Exclude<ModuleId, "rules_floor">;
export type CampaignActId = "act1" | "act2" | "act3";

/** §3.1: the unlock pool is exactly the ten non-floor modules (compile-time count). */
type LastOf<U> = ((U extends unknown ? (value: () => U) => void : never) extends (value: infer I) => void ? I : never) extends () => infer L ? L : never;
type CountUnion<U, Acc extends readonly unknown[] = []> = [U] extends [never] ? Acc["length"] : CountUnion<Exclude<U, LastOf<U>>, [...Acc, LastOf<U>]>;
export type UnlockableModuleCount = CountUnion<UnlockableModuleId>;
const TEN_UNLOCKABLE_MODULES: UnlockableModuleCount = 10;
void TEN_UNLOCKABLE_MODULES;
/** §3.1: the run-reward union is exactly three members (compile-time count). */
const THREE_RUN_REWARD_KINDS: CountUnion<CampaignRunReward["kind"]> = 3;
void THREE_RUN_REWARD_KINDS;

export type CampaignEconomy = CampaignEconomyDefinition;
export type CampaignRunReward = CampaignRunRewardDefinition<UnlockableModuleId>;
export type CampaignRunRewardRef = CampaignRunRewardRefDefinition<UnlockableModuleId>;
export type DurableCampaignReward = DurableCampaignRewardDefinition;
export type DurableRewardGrant = DurableRewardGrantDefinition;
export type CampaignEncounter = CampaignEncounterDefinition;
export type CampaignPackEncounter = CampaignPackEncounterDefinition;
export type CampaignBossGameEncounter = CampaignBossGameEncounterDefinition;
export type CampaignNode = CampaignNodeDefinition<UnlockableModuleId>;
export type CampaignLayer = CampaignLayerDefinition<UnlockableModuleId>;
export type CampaignAct = CampaignActDefinition<UnlockableModuleId>;
export type CampaignDocument = CampaignDocumentDefinition<UnlockableModuleId>;
/** Back-compat name for the module arm of the run-reward union. */
export type CampaignNodeReward = Extract<CampaignRunReward, { readonly kind: "module_unlock" }>;

export const CAMPAIGN_RUN_REWARD_KINDS = Object.freeze(["module_unlock", "theory_unlock", "resource_grant"] as const);
export const CAMPAIGN_ACT_IDS = Object.freeze(["act1", "act2", "act3"] as const);
export const CAMPAIGN_REWIND_RESOURCE = "campaign_rewind_charge" as const;

export function isUnlockableModuleId(value: ModuleId): value is UnlockableModuleId {
  return value !== "rules_floor";
}

export class CampaignModuleError extends TypeError {
  readonly code: "CAMPAIGN_UNLOCK_OUTSIDE_CEILING" | "CAMPAIGN_RULES_FLOOR_SUPPRESSED";
  constructor(code: CampaignModuleError["code"], message: string) {
    super(`${code}: ${message}`);
    this.name = "CampaignModuleError";
    this.code = code;
  }
}

/** The campaign context ceiling, read from the registered ContextContract (never a copied list). */
export function campaignModuleCeiling(): readonly ModuleId[] {
  return workflowContextPolicy("campaign").moduleCeiling;
}

export function assertCampaignUnlockAllowed(moduleId: ModuleId): asserts moduleId is UnlockableModuleId {
  if (moduleId === "rules_floor" || !campaignModuleCeiling().includes(moduleId)) {
    throw new CampaignModuleError("CAMPAIGN_UNLOCK_OUTSIDE_CEILING", `module ${moduleId} is outside the campaign context ceiling`);
  }
}

/** Canonical identity of a run reward (grant-only fields such as `amount` are dropped). */
export function campaignRewardRef(reward: CampaignRunReward): CampaignRunRewardRef {
  if (reward.kind === "module_unlock") return Object.freeze({ kind: "module_unlock", moduleId: reward.moduleId });
  if (reward.kind === "theory_unlock") return Object.freeze({ kind: "theory_unlock", bundleId: reward.bundleId, passageId: reward.passageId });
  return Object.freeze({ kind: "resource_grant", resourceId: reward.resourceId });
}

export function campaignRewardRefKey(ref: CampaignRunRewardRef): string {
  if (ref.kind === "module_unlock") return `module:${ref.moduleId}`;
  if (ref.kind === "theory_unlock") return `theory:${ref.bundleId}#${ref.passageId}`;
  return `resource:${ref.resourceId}`;
}

export interface LocatedCampaignNode {
  readonly node: CampaignNode;
  readonly act: CampaignActId;
  readonly actIndex: number;
  /** 1-based layer within the act. */
  readonly layer: 1 | 2 | 3;
  /** 0-based index over the nine selected layers. */
  readonly layerOrdinal: number;
}

export function locateCampaignNodes(document: CampaignDocument): readonly LocatedCampaignNode[] {
  return Object.freeze(document.acts.flatMap((act, actIndex) => act.layers.flatMap((layer, layerIndex) =>
    layer.choices.map((node) => Object.freeze({ node, act: act.id, actIndex, layer: (layerIndex + 1) as 1 | 2 | 3, layerOrdinal: actIndex * 3 + layerIndex })),
  )));
}

export function campaignModuleInventory(
  document: Pick<CampaignDocument, "startingModules">,
  unlocked: readonly ModuleId[],
): readonly ModuleId[] {
  const inventory = new Set<ModuleId>(["rules_floor"]);
  for (const moduleId of [...document.startingModules, ...unlocked]) {
    assertCampaignUnlockAllowed(moduleId);
    inventory.add(moduleId);
  }
  return Object.freeze(MODULE_IDS.filter((moduleId) => inventory.has(moduleId)));
}

/** §3.2 module family: context ∩ owned ∩ equipped − suppressed (∩ preset request when given). */
export function effectiveCampaignModules(input: {
  readonly inventory: readonly ModuleId[];
  readonly suppressed: readonly ModuleId[];
  readonly presetModules: readonly ModuleId[];
}): readonly ModuleId[] {
  if (input.suppressed.includes("rules_floor")) {
    throw new CampaignModuleError("CAMPAIGN_RULES_FLOOR_SUPPRESSED", "campaign suppression cannot remove the rules floor");
  }
  const context = new Set<ModuleId>(campaignModuleCeiling());
  const inventory = new Set(input.inventory);
  const suppressed = new Set(input.suppressed);
  const preset = new Set(input.presetModules);
  return Object.freeze(MODULE_IDS.filter((moduleId) => context.has(moduleId) && inventory.has(moduleId) && !suppressed.has(moduleId) && preset.has(moduleId)));
}

/** §3.2 closed per-module ineffective reasons, in precedence order. */
export const CAMPAIGN_MODULE_REASONS = Object.freeze(["honesty_ceiling", "resting_until_act", "boss_suppressed", "source_unavailable", "not_equipped"] as const);
export type CampaignModuleReason = (typeof CAMPAIGN_MODULE_REASONS)[number];
export const CAMPAIGN_THEORY_REASONS = Object.freeze(["not_applicable", "authorizing_module_inactive", "disclosure_ceiling", "source_unavailable"] as const);
export type CampaignTheoryReason = (typeof CAMPAIGN_THEORY_REASONS)[number];

export interface CampaignModuleShelfRow {
  readonly moduleId: UnlockableModuleId;
  readonly effective: boolean;
  readonly reason: CampaignModuleReason | null;
}

/**
 * The module shelf for one encounter: every owned module gets exactly one row, effective or with the
 * first matching reason of the closed precedence. `resting` is an input seam only ([[D1600]]).
 */
export function campaignModuleShelf(input: {
  readonly owned: readonly UnlockableModuleId[];
  readonly equipped: readonly UnlockableModuleId[];
  readonly suppressed: readonly ModuleId[];
  readonly resting?: readonly UnlockableModuleId[];
  readonly unavailable?: readonly UnlockableModuleId[];
}): readonly CampaignModuleShelfRow[] {
  const ceiling = new Set<ModuleId>(campaignModuleCeiling());
  return Object.freeze(MODULE_IDS.filter((id): id is UnlockableModuleId => id !== "rules_floor" && input.owned.includes(id as UnlockableModuleId)).map((moduleId) => {
    const reasons: CampaignModuleReason[] = [];
    if (!ceiling.has(moduleId)) reasons.push("honesty_ceiling");
    if (input.resting?.includes(moduleId) === true) reasons.push("resting_until_act");
    if (input.suppressed.includes(moduleId)) reasons.push("boss_suppressed");
    if (input.unavailable?.includes(moduleId) === true) reasons.push("source_unavailable");
    if (!input.equipped.includes(moduleId)) reasons.push("not_equipped");
    const reason = CAMPAIGN_MODULE_REASONS.find((candidate) => reasons.includes(candidate)) ?? null;
    return Object.freeze({ moduleId, effective: reason === null, reason });
  }));
}
