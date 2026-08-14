import { describe, expect, it } from "vitest";
import { SILENT_ASSISTANCE } from "@chess-tabiya/runtime";
import { assistanceKey, loadAssistance, saveAssistance } from "./assistance-preference.js";

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
    expect(loadAssistance("imported", storage)).toEqual({ ...SILENT_ASSISTANCE, spoken: "browser" });
    const current = { getItem: () => JSON.stringify({ ...SILENT_ASSISTANCE, ambient: "on" }), setItem() {} };
    expect(loadAssistance("imported", current)).toEqual({ ...SILENT_ASSISTANCE, ambient: "on" });
  });
});
