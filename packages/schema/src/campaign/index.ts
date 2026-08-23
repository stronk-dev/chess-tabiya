export interface CampaignEconomyDefinition {
  readonly startingCharges: number;
  readonly actGrants: Readonly<Record<"act1" | "act2" | "act3", number>>;
  readonly validation: "candidate";
}

export interface CampaignNodeDefinition<ModuleId extends string> {
  readonly id: string;
  readonly encounter: { readonly kind: "pack"; readonly packId: string };
  readonly suppress?: readonly ModuleId[];
  readonly reward?: { readonly kind: "module_unlock"; readonly moduleId: ModuleId };
  readonly boss?: true;
}

export interface CampaignLayerDefinition<ModuleId extends string> {
  readonly choices: readonly CampaignNodeDefinition<ModuleId>[];
}

export interface CampaignActDefinition<ModuleId extends string> {
  readonly id: "act1" | "act2" | "act3";
  readonly layers: readonly [CampaignLayerDefinition<ModuleId>, CampaignLayerDefinition<ModuleId>, CampaignLayerDefinition<ModuleId>];
}

export interface CampaignDocumentDefinition<ModuleId extends string> {
  readonly id: string;
  readonly title: string;
  readonly version: number;
  readonly acts: readonly [CampaignActDefinition<ModuleId>, CampaignActDefinition<ModuleId>, CampaignActDefinition<ModuleId>];
  readonly economy: CampaignEconomyDefinition;
  readonly startingModules: readonly ModuleId[];
}
