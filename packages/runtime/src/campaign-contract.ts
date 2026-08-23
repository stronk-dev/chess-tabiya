import type { ModuleId } from "./module-contract.js";
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
