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
});
