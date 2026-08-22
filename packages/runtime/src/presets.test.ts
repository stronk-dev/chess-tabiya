import { describe, expect, it } from "vitest";

import { MODULE_IDS } from "./module-contract.js";
import {
  PRESET_DECLARATIONS,
  PRESET_IDS,
  WORKFLOW_CONTEXT_POLICIES,
  WORKFLOW_CONTEXTS,
  PresetContractError,
  assertPresetFoundation,
  deriveWorkflowContext,
} from "./presets.js";

describe("intent preset foundation", () => {
  it("closes the five presets over all eleven module ids", () => {
    expect(PRESET_IDS).toEqual(["quiet", "guided", "theory_only", "support", "analysis"]);
    expect(new Set(PRESET_DECLARATIONS.flatMap((preset) => preset.modules))).toEqual(new Set(MODULE_IDS));
    expect(() => assertPresetFoundation()).not.toThrow();
  });

  it("admits 24 context/preset pairs and refuses 11", () => {
    expect(WORKFLOW_CONTEXTS).toHaveLength(7);
    expect(WORKFLOW_CONTEXT_POLICIES.reduce((sum, context) => sum + context.allowedPresets.length, 0)).toBe(24);
    expect(35 - 24).toBe(11);
    expect(WORKFLOW_CONTEXT_POLICIES.find((context) => context.id === "match")?.allowedPresets).toEqual(["quiet"]);
    expect(WORKFLOW_CONTEXT_POLICIES.find((context) => context.id === "position")?.allowedPresets).toEqual(PRESET_IDS);
  });

  it("keeps the rules floor in every ceiling and prevention out of non-position contexts", () => {
    for (const context of WORKFLOW_CONTEXT_POLICIES) expect(context.moduleCeiling).toContain("rules_floor");
    for (const context of WORKFLOW_CONTEXT_POLICIES.filter((entry) => entry.id !== "position")) expect(context.moduleCeiling).not.toContain("blunder_prevention");
  });

  it("fails incomplete registries, dangling modules, and invalid context defaults", () => {
    expect(() => assertPresetFoundation(PRESET_DECLARATIONS.slice(1), WORKFLOW_CONTEXT_POLICIES)).toThrowError(PresetContractError);
    expect(() => assertPresetFoundation(PRESET_DECLARATIONS, WORKFLOW_CONTEXT_POLICIES.slice(1))).toThrowError(PresetContractError);
    expect(() => assertPresetFoundation(PRESET_DECLARATIONS, WORKFLOW_CONTEXT_POLICIES.map((context) => context.id === "match" ? { ...context, defaultPreset: "support" } : context))).toThrow(/invalid preset set or default/u);
  });

  it("derives all contexts with on-ramp precedence and academy no longer falling through", () => {
    expect(deriveWorkflowContext({ sessionKind: "pack", feedbackPolicy: "delayed_checkpoint" })).toBe("pack");
    expect(deriveWorkflowContext({ sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "stream" })).toBe("stream");
    expect(deriveWorkflowContext({ sessionKind: "imported", feedbackPolicy: "attempt_end", liveKind: "match" })).toBe("match");
    expect(deriveWorkflowContext({ sessionKind: "pack", feedbackPolicy: "attempt_end", liveKind: "academy" })).toBe("academy");
    expect(deriveWorkflowContext({ sessionKind: "pack", feedbackPolicy: "immediate_guard", liveKind: "academy" })).toBe("onramp");
  });
});
