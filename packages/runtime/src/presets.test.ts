import { describe, expect, it } from "vitest";

import { MODULE_IDS } from "./module-contract.js";
import { SILENT_ASSISTANCE } from "./assistance.js";
import {
  PRESET_DECLARATIONS,
  PRESET_IDS,
  WORKFLOW_CONTEXT_POLICIES,
  WORKFLOW_CONTEXTS,
  PresetContractError,
  assertPresetFoundation,
  deriveContextClamp,
  derivePresetProjection,
  deriveWorkflowContext,
  presetDeclaration,
  workflowContextPolicy,
} from "./presets.js";

describe("intent preset foundation", () => {
  it("closes the six presets over all eleven module ids", () => {
    // 2026-09-24: rfc/campaign-core.md §5 adds the Campaign kit preset (Campaign-only).
    expect(PRESET_IDS).toEqual(["quiet", "guided", "theory_only", "support", "analysis", "campaign_kit"]);
    expect(new Set(PRESET_DECLARATIONS.flatMap((preset) => preset.modules))).toEqual(new Set(MODULE_IDS));
    expect(() => assertPresetFoundation()).not.toThrow();
  });

  it("admits 29 context/preset pairs and refuses 19", () => {
    expect(WORKFLOW_CONTEXTS).toHaveLength(8);
    expect(WORKFLOW_CONTEXT_POLICIES.reduce((sum, context) => sum + context.allowedPresets.length, 0)).toBe(29);
    expect(48 - 29).toBe(19);
    expect(WORKFLOW_CONTEXT_POLICIES.find((context) => context.id === "match")?.allowedPresets).toEqual(["quiet"]);
    expect(WORKFLOW_CONTEXT_POLICIES.find((context) => context.id === "position")?.allowedPresets).toEqual(PRESET_IDS.filter((id) => id !== "campaign_kit"));
    expect(WORKFLOW_CONTEXT_POLICIES.filter((context) => context.allowedPresets.includes("campaign_kit")).map((context) => context.id)).toEqual(["campaign"]);
    expect(WORKFLOW_CONTEXT_POLICIES.find((context) => context.id === "campaign")).toEqual(expect.objectContaining({
      defaultPreset: "campaign_kit",
      allowedPresets: ["campaign_kit", "quiet", "guided", "theory_only", "analysis"],
    }));
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

  // Criterion 12: transcribed, not invented — row for row against the RFC's §4a and §3.2 tables…
  const FIELDS = ["markers", "guided", "humanSplit", "corpus", "voice", "spoken", "boardLighting", "arrows", "ambient"] as const;
  const row = (values: string) => Object.fromEntries(values.split(" ").map((value, index) => [FIELDS[index], value]));
  it("transcribes §4a's projection table exactly (54 cells with the Campaign kit)", () => {
    expect(Object.fromEntries(PRESET_DECLARATIONS.map((preset) => [preset.id, preset.config]))).toEqual({
      quiet: row("off off off off authored off legal off off"),
      guided: row("live live off off authored off sight sight on"),
      theory_only: row("off off off off authored off legal off on"),
      support: row("live off off off authored off sight sight on"),
      analysis: row("live off on_request on_request authored off evidence evidence on"),
      campaign_kit: row("live live on_request on_request authored off evidence evidence on"),
    });
  });

  it("transcribes §3.2's clamp table exactly (72 cells, corpus corrected for academy/onramp)", () => {
    expect(Object.fromEntries(WORKFLOW_CONTEXT_POLICIES.map((context) => [context.id, context.configClamp]))).toEqual({
      pack: row("free free free free free free evidence evidence free"),
      position: row("free free free free free free evidence evidence free"),
      imported: row("free free free free free free evidence evidence free"),
      match: row("locked_off locked_off locked_off locked_off locked_off locked_off legal locked_off locked_off"),
      stream: row("free free free free free free evidence evidence free"),
      academy: row("free free locked_off locked_off free free sight sight free"),
      onramp: row("free free locked_off locked_off free free sight sight free"),
      campaign: row("free free free free free free evidence evidence free"),
    });
  });

  // …and independently re-derived from the module bindings, so a hand-edited cell no module justifies fails.
  it("re-derives both tables from module bindings and fails a widened ceiling cell (flip-a-constant)", () => {
    for (const preset of PRESET_DECLARATIONS) expect(preset.config).toEqual(derivePresetProjection(preset.modules));
    for (const context of WORKFLOW_CONTEXT_POLICIES) expect(context.configClamp).toEqual(deriveContextClamp(context.moduleCeiling));
    const widened = WORKFLOW_CONTEXT_POLICIES.map((context) => context.id === "academy" ? { ...context, configClamp: { ...context.configClamp, humanSplit: "free" as const } } : context);
    expect(() => assertPresetFoundation(PRESET_DECLARATIONS, widened)).toThrow(/CONTEXT_CLAMP_UNDERIVED/u);
    const projected = PRESET_DECLARATIONS.map((preset) => preset.id === "quiet" ? { ...preset, config: { ...preset.config, ambient: "on" as const } } : preset);
    expect(() => assertPresetFoundation(projected, WORKFLOW_CONTEXT_POLICIES)).toThrow(/PRESET_PROJECTION_UNDERIVED/u);
    const floorless = WORKFLOW_CONTEXT_POLICIES.map((context) => context.id === "pack" ? { ...context, configClamp: { ...context.configClamp, boardLighting: "free" as const } } : context);
    expect(() => assertPresetFoundation(PRESET_DECLARATIONS, floorless)).toThrow(/CONTEXT_CLAMP_UNDERIVED/u);
  });

  it("criterion 13: Quiet is the silence default byte-for-byte", () => {
    const { version: _version, ...silent } = SILENT_ASSISTANCE;
    expect(presetDeclaration("quiet").config).toEqual(silent);
  });

  it("criterion 10: the on-ramp default is derived once, from the Guided projection", () => {
    expect(workflowContextPolicy("onramp").defaultPreset).toBe("guided");
    expect(presetDeclaration("guided").config.guided).toBe("live");
  });
});
