import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SILENT_ASSISTANCE } from "@chess-tabiya/runtime";
import { ASSISTANCE_PROFILES, assistanceKey, assistanceProfile, loadAssistance, saveAssistance } from "./assistance-preference.js";

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

  it("derives all six profiles with guard and live-session precedence", () => {
    expect(ASSISTANCE_PROFILES).toEqual(["pack", "position", "imported", "match", "stream", "onramp"]);
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end" })).toBe("pack");
    expect(assistanceProfile({ sessionKind: "position", feedbackPolicy: "attempt_end" })).toBe("position");
    expect(assistanceProfile({ sessionKind: "imported", feedbackPolicy: "attempt_end" })).toBe("imported");
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end", liveKind: "match" })).toBe("match");
    expect(assistanceProfile({ sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "stream" })).toBe("stream");
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

  it("keeps every fresh assistance profile fully silent", () => {
    const maximum = { version: 4, markers: "live", guided: "live", humanSplit: "on_request", corpus: "on_request", voice: "persona", spoken: "provider", boardLighting: "evidence", arrows: "evidence", ambient: "on" } as const;
    for (const profile of ["match", "stream", "onramp"] as const) {
      expect(loadAssistance(profile, { getItem: () => null, setItem() {} })).toEqual(SILENT_ASSISTANCE);
      const storedOff = { ...maximum, markers: "off" as const, guided: "off" as const, humanSplit: "off" as const, corpus: "off" as const, voice: "authored" as const, spoken: "off" as const, boardLighting: "off" as const, arrows: "off" as const, ambient: "off" as const };
      const resolved = loadAssistance(profile, { getItem: () => null, setItem() {} });
      const changed = Object.keys(resolved).filter((key) => resolved[key as keyof typeof resolved] !== storedOff[key as keyof typeof storedOff]);
      expect(changed).toEqual([]);
    }
  });

  it("renders settings from the same exhaustive profile list", () => {
    const source = readFileSync(new URL("./AssistanceSettings.svelte", import.meta.url), "utf8");
    expect(source).toContain("{#each ASSISTANCE_PROFILES as kind}");
    for (const label of ["Curated drill", "Just Play", "Imported game", "Match / Arena", "Streamed session", "On-ramp"]) expect(source).toContain(label);
  });
});
