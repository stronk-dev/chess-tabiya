import type { ModuleId } from "./module-contract.js";
import { MODULE_IDS } from "./module-contract.js";
import { workflowContextPolicy } from "./presets.js";
import type {
  CampaignActDefinition,
  CampaignDocumentDefinition,
  CampaignEconomyDefinition,
  CampaignLayerDefinition,
  CampaignNodeDefinition,
} from "@chess-tabiya/schema/campaign";

export type UnlockableModuleId = Exclude<ModuleId, "rules_floor">;
export type CampaignActId = "act1" | "act2" | "act3";

export type CampaignEconomy = CampaignEconomyDefinition;

export interface CampaignNodeReward {
  readonly kind: "module_unlock";
  readonly moduleId: UnlockableModuleId;
}

export type CampaignNode = CampaignNodeDefinition<UnlockableModuleId>;

export type CampaignLayer = CampaignLayerDefinition<UnlockableModuleId>;

export type CampaignAct = CampaignActDefinition<UnlockableModuleId>;

export type CampaignDocument = CampaignDocumentDefinition<UnlockableModuleId>;

export const CAMPAIGN_ACT_IDS = Object.freeze(["act1", "act2", "act3"] as const);

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

export function assertCampaignUnlockAllowed(moduleId: ModuleId): asserts moduleId is UnlockableModuleId {
  if (moduleId === "rules_floor" || !workflowContextPolicy("campaign").moduleCeiling.includes(moduleId)) {
    throw new CampaignModuleError("CAMPAIGN_UNLOCK_OUTSIDE_CEILING", `module ${moduleId} is outside the campaign context ceiling`);
  }
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

export function effectiveCampaignModules(input: {
  readonly inventory: readonly ModuleId[];
  readonly suppressed: readonly ModuleId[];
  readonly presetModules: readonly ModuleId[];
}): readonly ModuleId[] {
  if (input.suppressed.includes("rules_floor")) {
    throw new CampaignModuleError("CAMPAIGN_RULES_FLOOR_SUPPRESSED", "campaign suppression cannot remove the rules floor");
  }
  const context = new Set<ModuleId>(workflowContextPolicy("campaign").moduleCeiling);
  const inventory = new Set(input.inventory);
  const suppressed = new Set(input.suppressed);
  const preset = new Set(input.presetModules);
  return Object.freeze(MODULE_IDS.filter((moduleId) => context.has(moduleId) && inventory.has(moduleId) && !suppressed.has(moduleId) && preset.has(moduleId)));
}
