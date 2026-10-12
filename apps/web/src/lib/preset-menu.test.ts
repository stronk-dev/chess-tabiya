import { describe, expect, it } from "vitest";
import { presetDeclaration, WORKFLOW_CONTEXTS, workflowContextPolicy } from "@chess-tabiya/runtime";
import { helpStyleBoundary, offeredPresetChoices, unavailablePresetNotice } from "./preset-menu.js";

describe("D3741 presentation does not change preset authority", () => {
  const expected = {
    position: ["quiet", "theory_only", "guided", "support", "analysis"],
    pack: ["quiet", "theory_only", "guided", "analysis"],
    imported: ["quiet", "theory_only", "guided", "analysis"],
    match: ["quiet"],
    stream: ["quiet", "theory_only", "guided", "analysis"],
    academy: ["quiet", "theory_only", "guided"],
    onramp: ["quiet", "theory_only", "guided"],
    campaign: ["campaign_kit", "quiet", "theory_only", "guided", "analysis"],
  };
  it.each(WORKFLOW_CONTEXTS)("orders only the admitted %s choices and retains their actual declarations", context => {
    const policy = workflowContextPolicy(context);
    const original = JSON.stringify(policy);
    const options = offeredPresetChoices(context);
    expect(options.map(option => option.id)).toEqual(expected[context]);
    expect(options.map(option => option.id).sort()).toEqual([...policy.allowedPresets].sort());
    expect(options.some(option => option.id === policy.defaultPreset)).toBe(true);
    for (const option of options) expect(option).toBe(presetDeclaration(option.id));
    expect(JSON.stringify(policy)).toBe(original);
    if (context === "match") {
      expect(policy.moduleCeiling).toEqual(["rules_floor"]);
      expect(helpStyleBoundary(context)).toContain("chess guidance is not available during match play");
    } else expect(helpStyleBoundary(context)).toBeUndefined();
    const notice = unavailablePresetNotice(context);
    if (context === "position") expect(notice).toBeUndefined();
    else if (context === "match") expect(notice).toBe(helpStyleBoundary(context));
    else {
      expect(notice).toContain("Not offered in this activity: Support");
      expect(notice?.includes("Analyze")).toBe(context === "academy" || context === "onramp");
      expect(notice).toContain("also apply to Advanced support controls");
      expect(notice).not.toContain("Campaign kit");
    }
  });
});
