// schemas/campaign.schema.json (campaign-schema lane 3): the authored campaign document.
// Lane 2 (rfc/campaign-core.md) closed the run-reward union, consumer declarations, durable grants
// and publication channel; lane 3 (rfc/campaign-boss-games.md) added the `boss_game` encounter arm.

export const CAMPAIGN_SCHEMA_LANE = 3 as const;
export const CAMPAIGN_SCHEMA_ID = "urn:chess-tabiya:schema:campaign:3" as const;

export type CampaignSha256 = `sha256:${string}`;

export interface CampaignEconomyDefinition {
  readonly startingCharges: number;
  readonly actGrants: Readonly<Record<"act1" | "act2" | "act3", number>>;
  readonly validation: "candidate";
}

export type CampaignRunRewardDefinition<ModuleId extends string> =
  | { readonly kind: "module_unlock"; readonly moduleId: ModuleId }
  | { readonly kind: "theory_unlock"; readonly bundleId: string; readonly passageId: string }
  | { readonly kind: "resource_grant"; readonly resourceId: "campaign_rewind_charge"; readonly amount: number };

export type CampaignRunRewardRefDefinition<ModuleId extends string> =
  | { readonly kind: "module_unlock"; readonly moduleId: ModuleId }
  | { readonly kind: "theory_unlock"; readonly bundleId: string; readonly passageId: string }
  | { readonly kind: "resource_grant"; readonly resourceId: "campaign_rewind_charge" };

export type DurableCampaignRewardDefinition =
  | { readonly kind: "completion_mark"; readonly campaignId: string; readonly campaignVersion: number }
  | { readonly kind: "prestige_mark"; readonly campaignId: string; readonly campaignVersion: number }
  | { readonly kind: "cosmetic_unlock"; readonly target: { readonly kind: "app_theme" | "board_theme" | "piece_set"; readonly id: string } };

export interface DurableRewardGrantDefinition {
  readonly when: "completed" | "prestige";
  readonly reward: DurableCampaignRewardDefinition;
}

export interface CampaignPackEncounterDefinition {
  readonly kind: "pack";
  readonly packId: string;
}

export interface CampaignBotProfileReferenceDefinition {
  readonly id: string;
  readonly family: string;
  readonly band: number;
  readonly version: 1;
  readonly digest: CampaignSha256;
  readonly model: { readonly id: string; readonly version: string };
  readonly sampler: { readonly temperature: number; readonly topP: number; readonly requestedWidth: number; readonly returnedMassFloor: number };
  readonly orderedLayers: readonly string[];
}

export interface CampaignBossCalibrationReferenceDefinition {
  readonly profileDigest: CampaignSha256;
  readonly calibrationId: string;
  readonly timeControlScope: string;
  readonly harnessReceipt: string;
}

export interface CampaignBossGameEncounterDefinition {
  readonly kind: "boss_game";
  readonly start: { readonly fen: string; readonly learnerSide: "white" | "black" };
  readonly opponent: {
    readonly profile: CampaignBotProfileReferenceDefinition;
    readonly calibration?: CampaignBossCalibrationReferenceDefinition;
  };
  readonly rating: "rated_when_clean" | "unrated";
  readonly briefingRef: { readonly kind: "pack_start"; readonly packId: string };
}

export type CampaignEncounterDefinition = CampaignPackEncounterDefinition | CampaignBossGameEncounterDefinition;

export interface CampaignNodeDefinition<ModuleId extends string> {
  readonly id: string;
  readonly encounter: CampaignEncounterDefinition;
  readonly suppress?: readonly ModuleId[];
  readonly reward?: CampaignRunRewardDefinition<ModuleId>;
  readonly consumes?: readonly CampaignRunRewardRefDefinition<ModuleId>[];
  readonly boss?: true;
}

export interface CampaignLayerDefinition<ModuleId extends string> {
  readonly choices: readonly CampaignNodeDefinition<ModuleId>[];
}

export interface CampaignActDefinition<ModuleId extends string> {
  readonly id: "act1" | "act2" | "act3";
  readonly layers: readonly [CampaignLayerDefinition<ModuleId>, CampaignLayerDefinition<ModuleId>, CampaignLayerDefinition<ModuleId>];
}

export interface CampaignCurriculumMetadataDefinition {
  readonly targetLearner: { readonly bracketId: string; readonly prerequisites: readonly string[] };
  readonly expectedEnvelope: { readonly minimumMinutes: number; readonly maximumMinutes: number };
  readonly phaseCoverage: Readonly<Record<"opening" | "middlegame" | "endgame", readonly string[]>>;
  readonly formCoverage: readonly { readonly encounterKind: CampaignEncounterDefinition["kind"]; readonly nodeIds: readonly string[] }[];
  readonly theoryProvenance: readonly { readonly nodeId: string; readonly passage: { readonly bundleId: string; readonly passageId: string }; readonly evidenceRefs: readonly string[] }[];
  readonly dependencyAvailability: readonly {
    readonly requirement: string;
    readonly requiredAt: readonly string[];
    readonly unavailableAction: "refuse_start" | "honest_degradation";
    readonly fallbackOperation?: string;
    readonly sourceAvailable: boolean;
  }[];
  readonly reviewReceipt: { readonly authority: "owner_human_chess_review"; readonly documentDigest: CampaignSha256; readonly reviewedAt: string };
}

export type CampaignPublicationDefinition =
  | { readonly channel: "community" }
  | { readonly channel: "official"; readonly curriculum: CampaignCurriculumMetadataDefinition };

export interface CampaignDocumentDefinition<ModuleId extends string> {
  readonly id: string;
  readonly title: string;
  readonly version: number;
  readonly publication: CampaignPublicationDefinition;
  readonly acts: readonly [CampaignActDefinition<ModuleId>, CampaignActDefinition<ModuleId>, CampaignActDefinition<ModuleId>];
  readonly economy: CampaignEconomyDefinition;
  readonly startingModules: readonly ModuleId[];
  readonly durableRewards: readonly DurableRewardGrantDefinition[];
}
