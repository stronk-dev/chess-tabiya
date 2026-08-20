// DISPOSABLE research harness — platform-alignment R3. Not production code.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { compilePrototypeState, moduleMessage, modules, presets, workflows } from "./prototype-model.js";

describe("R3 participant workflow prototype", () => {
  it("exposes workflow intent and keeps source/provider names out of the primary choices", () => {
    expect(Object.keys(workflows)).toEqual(["just_play", "guided_rehearsal", "learn_position", "review_retry", "analyze_freely", "campaign"]);
    expect(Object.values(presets).map((item) => item.label)).toEqual(["Quiet", "Guide me", "Theory only", "Support", "Analyze"]);
    expect(Object.values(presets).map((item) => item.label).join(" ")).not.toMatch(/Stockfish|Maia|classifier/i);
  });

  it("makes theory-only a first-class composition with no warning, evaluation or line consumer", () => {
    const state = compilePrototypeState({ workflowId: "learn_position", presetId: "theory_only", scenarioId: "useful" });
    expect(state.enabled).toEqual(["rules_floor", "theory_breadcrumb"]);
    expect(state.enabled).not.toContain("blunder_prevention");
    expect(state.enabled).not.toContain("full_inspector");
  });

  it("keeps proactive warning inside explicit Just Play Support", () => {
    expect(compilePrototypeState({ workflowId: "just_play", presetId: "support", scenarioId: "useful", staged: true }).visible).toContain("blunder_prevention");
    expect(() => compilePrototypeState({ workflowId: "guided_rehearsal", presetId: "support", scenarioId: "useful" })).toThrow(/not allowed/);
  });

  it("distinguishes an honest empty packet from an unavailable optional provider", () => {
    const empty = compilePrototypeState({ workflowId: "guided_rehearsal", presetId: "guided", scenarioId: "empty", committed: true });
    const unavailable = compilePrototypeState({ workflowId: "guided_rehearsal", presetId: "guided", scenarioId: "unavailable", committed: true });
    expect(moduleMessage("postcommit_nudge", empty).tone).toBe("empty");
    expect(moduleMessage("postcommit_nudge", unavailable).tone).toBe("unavailable");
  });

  it("lets a workflow ceiling remove capability and blocks forbidden presets", () => {
    const campaign = compilePrototypeState({ workflowId: "campaign", presetId: "guided", scenarioId: "useful", committed: true });
    expect(campaign.enabled).not.toContain("blunder_prevention");
    expect(campaign.enabled).not.toContain("full_inspector");
    expect(() => compilePrototypeState({ workflowId: "campaign", presetId: "analysis", scenarioId: "useful" })).toThrow(/not allowed/);
  });

  it("assigns every primitive module to a visible configuration disposition", () => {
    expect(Object.values(modules).every((item) => ["normal", "advanced", "inspector", "operator"].includes(item.disposition))).toBe(true);
  });

  it("ships a responsive, keyboard-addressable static artifact", () => {
    const html = readFileSync(new URL("./prototype.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("./prototype.css", import.meta.url), "utf8");
    const js = readFileSync(new URL("./prototype.js", import.meta.url), "utf8");
    expect(html).toContain('name="viewport"');
    expect(html).toContain('type="module"');
    expect(css).toMatch(/@media \(max-width: 850px\)/);
    expect(js).toContain('aria-label="Research chessboard fixture"');
    expect(js).toContain('aria-pressed=');
  });
});
