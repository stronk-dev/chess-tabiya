// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SILENT_ASSISTANCE } from "@chess-tabiya/runtime";
import { ASSISTANCE_PROFILES, PROFILE_DEFAULTS, assistanceKey, assistanceProfile, loadAssistance, loadWorkflowPreset, saveAssistance, saveWorkflowPreset, workflowKey } from "./assistance-preference.js";
import AssistanceSettings from "./AssistanceSettings.svelte";

afterEach(() => document.body.replaceChildren());

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

describe("assistance preference", () => {
  it("defaults silently and keeps pack and position surfaces separate", () => {
    const values = new Map<string, string>(); const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(loadAssistance("pack", storage)).toEqual(SILENT_ASSISTANCE);
    saveAssistance("position", { ...SILENT_ASSISTANCE, markers: "live" }, storage);
    expect(loadAssistance("position", storage).markers).toBe("live");
    expect(loadAssistance("pack", storage).markers).toBe("off");
    values.set(assistanceKey("pack"), "not-json");
    expect(loadAssistance("pack", storage)).toEqual(SILENT_ASSISTANCE);
  });

  it("upgrades version one without changing the storage key", () => {
    const storage = { getItem: () => JSON.stringify({ version: 1, markers: "live", guided: "off", humanSplit: "on_request", voice: "authored" }), setItem() {} };
    expect(loadAssistance("pack", storage)).toEqual({ version: 4, markers: "live", guided: "off", humanSplit: "on_request", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" });
    expect(assistanceKey("pack")).toBe("tabiya.assistance.v1.pack");
  });

  it("upgrades version two with spoken delivery disabled", () => {
    const storage = { getItem: () => JSON.stringify({ version: 2, markers: "off", guided: "live", humanSplit: "off", corpus: "on_request", voice: "persona" }), setItem() {} };
    expect(loadAssistance("position", storage)).toEqual({ version: 4, markers: "off", guided: "live", humanSplit: "off", corpus: "on_request", voice: "persona", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" });
  });

  it("upgrades version three idempotently and maps browser speech", () => {
    const value = { version: 3, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "on" };
    const storage = { getItem: () => JSON.stringify(value), setItem() {} };
    expect(loadAssistance("imported", storage)).toEqual({ ...SILENT_ASSISTANCE, spoken: "browser", boardLighting: "legal" });
    const current = { getItem: () => JSON.stringify({ ...SILENT_ASSISTANCE, ambient: "on" }), setItem() {} };
    expect(loadAssistance("imported", current)).toEqual({ ...SILENT_ASSISTANCE, ambient: "on" });
  });

  it("exposes all eight contexts with guard and live-session precedence", () => {
    expect(ASSISTANCE_PROFILES).toEqual(["pack", "position", "imported", "match", "stream", "academy", "onramp", "campaign"]);
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end" })).toBe("pack");
    expect(assistanceProfile({ sessionKind: "position", feedbackPolicy: "attempt_end" })).toBe("position");
    expect(assistanceProfile({ sessionKind: "imported", feedbackPolicy: "attempt_end" })).toBe("imported");
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end", liveKind: "match" })).toBe("match");
    expect(assistanceProfile({ sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "stream" })).toBe("stream");
    expect(assistanceProfile({ sessionKind: "imported", feedbackPolicy: "attempt_end", liveKind: "academy" })).toBe("academy");
    expect(assistanceProfile({ sessionKind: "position", feedbackPolicy: "immediate_guard" })).toBe("onramp");
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "immediate_guard", liveKind: "stream" })).toBe("onramp");
  });

  it("does not inherit or overwrite a Just Play preference in a stream", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const position = { ...SILENT_ASSISTANCE, markers: "live" as const, boardLighting: "off" as const };
    saveAssistance("position", position, storage);
    expect(loadAssistance("stream", storage)).toEqual(SILENT_ASSISTANCE);
    saveAssistance("stream", { ...SILENT_ASSISTANCE, ambient: "on" }, storage);
    expect(loadAssistance("position", storage)).toEqual(position);
    expect(values.get(assistanceKey("position"))).toBe(JSON.stringify(position));
  });

  it("defaults only on-ramp guidance live and preserves an explicit stored off", () => {
    const maximum = { version: 4, markers: "live", guided: "live", humanSplit: "on_request", corpus: "on_request", voice: "persona", spoken: "provider", boardLighting: "evidence", arrows: "evidence", ambient: "on" } as const;
    for (const profile of ["pack", "position", "imported", "match", "stream", "campaign"] as const) {
      expect(loadAssistance(profile, { getItem: () => null, setItem() {} })).toEqual(SILENT_ASSISTANCE);
    }
    expect(PROFILE_DEFAULTS.onramp).toEqual({ ...SILENT_ASSISTANCE, guided: "live" });
    const storedOff = { ...maximum, markers: "off" as const, guided: "off" as const, humanSplit: "off" as const, corpus: "off" as const, voice: "authored" as const, spoken: "off" as const, boardLighting: "legal" as const, arrows: "off" as const, ambient: "off" as const };
    expect(loadAssistance("onramp", { getItem: () => JSON.stringify(storedOff), setItem() {} })).toEqual(storedOff);
    expect(loadAssistance("onramp", { getItem: () => "malformed", setItem() {} })).toEqual(PROFILE_DEFAULTS.onramp);
  });

  it("renders every context and exposes a visible reason for unavailable voice controls", async () => {
    const component = mount(AssistanceSettings, { target: target(), props: {
      onSignOut: vi.fn(), onExport: vi.fn(), onDelete: vi.fn(),
    } });
    await tick();

    const legends = [...document.querySelectorAll("fieldset legend")].map((element) => element.textContent?.trim());
    expect(legends).toEqual(["Curated drill", "Just Play", "Imported game", "Match / Arena", "Streamed session", "Academy", "On-ramp", "Campaign"]);
    expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(ASSISTANCE_PROFILES.length * 6);
    for (const fieldset of document.querySelectorAll("fieldset")) {
      const control = [...fieldset.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
        .find((input) => input.parentElement?.textContent?.includes("External voice"))!;
      expect(control.disabled).toBe(true);
      const reasonId = control.getAttribute("aria-describedby")!;
      const reason = document.getElementById(reasonId)!;
      expect(reason.textContent).toContain("External voice is unavailable");
      expect(reason.hidden).toBe(false);
      expect(reason.getAttribute("aria-hidden")).toBeNull();
    }
    expect(document.querySelectorAll("#external-voice-unavailable")).toHaveLength(1);
    await unmount(component);
  });

  it("stores workflow choice beside technical preferences and refuses disallowed presets", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(loadWorkflowPreset("position", storage)).toBe("quiet");
    expect(loadWorkflowPreset("academy", storage)).toBe("guided");
    saveWorkflowPreset("position", "support", storage);
    expect(values.get(workflowKey("position"))).toBe(JSON.stringify({ version: 1, preset: "support" }));
    expect(values.has(assistanceKey("position"))).toBe(false);
    expect(loadWorkflowPreset("position", storage)).toBe("support");
    expect(() => saveWorkflowPreset("match", "analysis", storage)).toThrow(/unavailable/u);
    values.set(workflowKey("academy"), JSON.stringify({ version: 1, preset: "analysis" }));
    expect(loadWorkflowPreset("academy", storage)).toBe("guided");
  });
});
