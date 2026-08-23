import { describe, expect, expectTypeOf, it } from "vitest";

import { MODULE_IDS } from "./module-contract.js";
import { CampaignModuleError, campaignModuleInventory, effectiveCampaignModules, isUnlockableModuleId, type CampaignNodeReward, type UnlockableModuleId } from "./campaign-contract.js";

describe("campaign authored contract", () => {
  it("keeps the unlock pool equal to the ten assistance modules", () => {
    const unlockable = MODULE_IDS.filter(isUnlockableModuleId);
    expect(unlockable).toHaveLength(10);
    expect(unlockable).not.toContain("rules_floor");
    expectTypeOf<UnlockableModuleId>().not.toEqualTypeOf<"rules_floor">();
  });

  it("types rewards as module unlocks", () => {
    const reward: CampaignNodeReward = { kind: "module_unlock", moduleId: "guided_hint" };
    expect(reward).toEqual({ kind: "module_unlock", moduleId: "guided_hint" });
    // @ts-expect-error The rules floor is an affordance, never campaign inventory.
    const refused: CampaignNodeReward = { kind: "module_unlock", moduleId: "rules_floor" };
    expect(refused.moduleId).toBe("rules_floor");
  });

  it("builds inventory from the rules floor, authored start, and earned unlocks", () => {
    expect(campaignModuleInventory(
      { startingModules: ["sight_on_request"] },
      ["postcommit_nudge", "theory_breadcrumb", "postcommit_nudge"],
    )).toEqual(["rules_floor", "sight_on_request", "postcommit_nudge", "theory_breadcrumb"]);
    expect(() => campaignModuleInventory({ startingModules: [] }, ["blunder_prevention"]))
      .toThrowError(expect.objectContaining<Partial<CampaignModuleError>>({ code: "CAMPAIGN_UNLOCK_OUTSIDE_CEILING" }));
  });

  it("intersects context, inventory, boss suppression, and preset request", () => {
    const inventory = campaignModuleInventory(
      { startingModules: ["sight_on_request", "guided_hint", "theory_breadcrumb"] },
      ["postcommit_nudge", "full_inspector"],
    );
    expect(effectiveCampaignModules({
      inventory,
      suppressed: ["guided_hint"],
      presetModules: ["rules_floor", "sight_on_request", "guided_hint", "postcommit_nudge", "theory_breadcrumb"],
    })).toEqual(["rules_floor", "sight_on_request", "postcommit_nudge", "theory_breadcrumb"]);
    expect(effectiveCampaignModules({
      inventory,
      suppressed: [],
      presetModules: ["rules_floor", "review_map", "full_inspector"],
    })).toEqual(["rules_floor", "full_inspector"]);
    expect(() => effectiveCampaignModules({ inventory, suppressed: ["rules_floor"], presetModules: MODULE_IDS }))
      .toThrowError(expect.objectContaining<Partial<CampaignModuleError>>({ code: "CAMPAIGN_RULES_FLOOR_SUPPRESSED" }));
  });
});
