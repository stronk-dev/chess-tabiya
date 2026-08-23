import { describe, expect, expectTypeOf, it } from "vitest";

import { MODULE_IDS } from "./module-contract.js";
import { isUnlockableModuleId, type CampaignNodeReward, type UnlockableModuleId } from "./campaign-contract.js";

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
});
