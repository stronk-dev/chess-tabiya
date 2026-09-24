// @vitest-environment happy-dom

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SILENT_ASSISTANCE, parseWorkflowPreferenceV2, selectNamedPreset, setPreferenceField, setPreferenceModule } from "@chess-tabiya/runtime";
import { ASSISTANCE_PROFILES, assistanceProfile, loadWorkflowPreference, requestedAssistanceConfig, saveWorkflowPreference, workflowPreferenceKey } from "./assistance-preference.js";
import AssistanceSettings from "./AssistanceSettings.svelte";

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

function memory(entries: readonly (readonly [string, string])[] = []) {
  const values = new Map<string, string>(entries);
  const writes: string[] = [];
  return { values, writes, storage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { writes.push(key); values.set(key, value); } } };
}

const legacy = (context: string) => `tabiya.assistance.v1.${context}`;
const legacyWorkflow = (context: string) => `tabiya.workflow.v1.${context}`;

describe("workflow preference receipt (rfc/intent-presets.md §5.3, criterion 17)", () => {
  it("represents empty storage as unset — never as nine explicit choices — and seals the same arm", () => {
    const { values, storage } = memory();
    expect(loadWorkflowPreference("pack", storage)).toEqual({ kind: "unset" });
    expect(values.size).toBe(0);
    values.set(workflowPreferenceKey("pack"), JSON.stringify({ version: 2, assistanceHead: 4, intent: { kind: "unset" } }));
    // A later context default still applies to unset: the sealed arm is not rewritten to explicit.
    expect(loadWorkflowPreference("pack", storage)).toEqual({ kind: "unset" });
    expect(requestedAssistanceConfig("onramp", { kind: "unset" })).toEqual({ ...SILENT_ASSISTANCE, markers: "live", guided: "live", boardLighting: "sight", arrows: "sight", ambient: "on" });
    expect(loadWorkflowPreference("pack", undefined)).toEqual({ kind: "unset" });
  });

  it("migrates a v1 workflow key alone to explicit with no overrides", () => {
    const { storage } = memory([[legacyWorkflow("position"), JSON.stringify({ version: 1, preset: "support" })]]);
    expect(loadWorkflowPreference("position", storage)).toEqual({ kind: "explicit", preset: "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } });
  });

  it("migrates every v1–v4 assistance snapshot to a Custom migrated snapshot preserving bytes", () => {
    const cases = [
      [{ version: 1, markers: "live", guided: "off", humanSplit: "on_request", voice: "authored" }, 1, { ...SILENT_ASSISTANCE, markers: "live", humanSplit: "on_request" }],
      [{ version: 2, markers: "off", guided: "live", humanSplit: "off", corpus: "on_request", voice: "persona" }, 2, { ...SILENT_ASSISTANCE, guided: "live", corpus: "on_request", voice: "persona" }],
      [{ version: 3, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "on" }, 3, { ...SILENT_ASSISTANCE, spoken: "browser" }],
      [{ ...SILENT_ASSISTANCE, ambient: "on" }, 4, { ...SILENT_ASSISTANCE, ambient: "on" }],
    ] as const;
    for (const [stored, sourceVersion, config] of cases) {
      const { values, storage } = memory([[legacy("imported"), JSON.stringify(stored)]]);
      const receipt = loadWorkflowPreference("imported", storage);
      expect(receipt).toEqual({ kind: "migrated_snapshot", preset: "quiet", config, sourceVersion, moduleOverrides: { include: [], exclude: [] } });
      // Repeated reloads keep the arm and provenance (D2173).
      expect(loadWorkflowPreference("imported", storage)).toEqual(receipt);
      expect(parseWorkflowPreferenceV2(JSON.parse(values.get(workflowPreferenceKey("imported"))!)).intent).toEqual(receipt);
    }
  });

  it("treats malformed legacy or v2 bytes as a visible recovery, never an explicit choice", () => {
    expect(loadWorkflowPreference("pack", memory([[legacy("pack"), "not-json"]]).storage)).toEqual({ kind: "invalid_fallback", reason: "malformed" });
    expect(loadWorkflowPreference("pack", memory([[legacyWorkflow("pack"), JSON.stringify({ version: 1, preset: "support" })]]).storage)).toEqual({ kind: "invalid_fallback", reason: "malformed" });
    const invalid = memory([[workflowPreferenceKey("pack"), JSON.stringify({ version: 2, assistanceHead: 4, intent: { kind: "unset" }, extra: 1 })], [legacy("pack"), JSON.stringify({ ...SILENT_ASSISTANCE, markers: "live" })]]);
    // An invalid v2 value never resurrects legacy bytes.
    expect(loadWorkflowPreference("pack", invalid.storage)).toEqual({ kind: "invalid_fallback", reason: "malformed" });
    const throwing = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
    expect(loadWorkflowPreference("pack", throwing)).toEqual({ kind: "invalid_fallback", reason: "storage_unavailable" });
  });

  it("lets a valid v2 value win, after which legacy writes change nothing", () => {
    const { values, storage } = memory([[legacy("position"), JSON.stringify({ ...SILENT_ASSISTANCE, markers: "live" })]]);
    const sealed = loadWorkflowPreference("position", storage);
    values.set(legacy("position"), JSON.stringify({ ...SILENT_ASSISTANCE, ambient: "on" }));
    values.set(legacyWorkflow("position"), JSON.stringify({ version: 1, preset: "analysis" }));
    expect(loadWorkflowPreference("position", storage)).toEqual(sealed);
  });

  it("writes only tabiya.workflow.v2.* and keeps contexts separate", () => {
    const { values, writes, storage } = memory();
    expect(saveWorkflowPreference("position", selectNamedPreset("position", { kind: "unset" }, "support"), storage)).toBe(true);
    expect(writes.every((key) => key.startsWith("tabiya.workflow.v2."))).toBe(true);
    expect(loadWorkflowPreference("stream", storage)).toEqual({ kind: "unset" });
    expect(loadWorkflowPreference("position", storage)).toEqual({ kind: "explicit", preset: "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } });
    expect([...values.keys()].some((key) => key.startsWith("tabiya.assistance.v1.") || key.startsWith("tabiya.workflow.v1."))).toBe(false);
    expect(saveWorkflowPreference("position", selectNamedPreset("position", { kind: "unset" }, "quiet"), undefined)).toBe(false);
  });

  it("explicit lower overrides survive a named preset; higher ones and module deltas are cleared (criterion 4 fixture A/C)", () => {
    const off = setPreferenceField("position", { kind: "unset" }, "guided", "off");
    const guided = selectNamedPreset("position", off.intent, "guided");
    expect(guided.intent).toEqual({ kind: "explicit", preset: "guided", overrides: { guided: "off" }, moduleOverrides: { include: [], exclude: [] } });
    const widened = setPreferenceModule("position", setPreferenceField("position", guided.intent, "humanSplit", "on_request").intent, "full_inspector", true);
    const quiet = selectNamedPreset("position", widened.intent, "quiet");
    expect(quiet.intent).toEqual({ kind: "explicit", preset: "quiet", overrides: { guided: "off" }, moduleOverrides: { include: [], exclude: [] } });
  });

  it("exposes all eight contexts with guard and live-session precedence", () => {
    expect(ASSISTANCE_PROFILES).toEqual(["pack", "position", "imported", "match", "stream", "academy", "onramp", "campaign"]);
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "attempt_end" })).toBe("pack");
    expect(assistanceProfile({ sessionKind: "imported", feedbackPolicy: "attempt_end", liveKind: "academy" })).toBe("academy");
    expect(assistanceProfile({ sessionKind: "pack", feedbackPolicy: "immediate_guard", liveKind: "stream" })).toBe("onramp");
  });

  it("census: the v1 writers and PROFILE_DEFAULTS have zero production definitions or callers (criteria 10, 15)", () => {
    const root = join(process.cwd(), "apps/web/src");
    const files: string[] = [];
    const walk = (dir: string) => { for (const entry of readdirSync(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (entry.isDirectory()) walk(path); else if (/\.(ts|svelte)$/u.test(entry.name) && !entry.name.includes(".test.")) files.push(path); } };
    walk(root);
    const sources = files.map((path) => [path, readFileSync(path, "utf8")] as const);
    for (const symbol of ["saveAssistance", "loadAssistance", "saveWorkflowPreset", "loadWorkflowPreset", "PROFILE_DEFAULTS"]) {
      expect(sources.filter(([, text]) => new RegExp(`\\b${symbol}\\b`, "u").test(text)).map(([path]) => path), symbol).toEqual([]);
    }
    const setItemV1 = sources.filter(([, text]) => /setItem\([^)]*tabiya\.(assistance|workflow)\.v1/u.test(text));
    expect(setItemV1).toEqual([]);
    for (const symbol of ["loadWorkflowPreference", "saveWorkflowPreference"]) {
      expect(sources.filter(([path, text]) => !path.endsWith("assistance-preference.ts") && text.includes(symbol)).length, symbol).toBeGreaterThan(0);
    }
  });
});

describe("settings: preset first, primitives under Advanced", () => {
  const contexts = () => [...document.querySelectorAll<HTMLFieldSetElement>("fieldset[data-assistance-context]")];

  it("renders every context with a help-style choice and keeps the 72 primitives plus modules under Advanced", async () => {
    const component = mount(AssistanceSettings, { target: target(), props: {
      onSignOut: vi.fn(), onExport: vi.fn(), onDelete: vi.fn(),
    } });
    await tick();

    expect(contexts().map((fieldset) => fieldset.querySelector(":scope > legend")?.textContent?.trim())).toEqual(["Curated drill", "Just Play", "Imported game", "Match / Arena", "Streamed session", "Academy", "On-ramp", "Campaign"]);
    for (const fieldset of contexts()) {
      const style = [...fieldset.querySelectorAll<HTMLSelectElement>(":scope > label select")];
      expect(style).toHaveLength(1);
      const advanced = fieldset.querySelector<HTMLDetailsElement>("details.advanced-assistance")!;
      expect(advanced.open).toBe(false);
      expect(advanced.querySelectorAll('.assistance-fields input[type="checkbox"]')).toHaveLength(6);
      expect(advanced.querySelectorAll(".assistance-fields select")).toHaveLength(3);
      expect(advanced.querySelectorAll('.module-toggles input[type="checkbox"]')).toHaveLength(10);
    }
    expect(document.querySelectorAll(".assistance-fields input, .assistance-fields select")).toHaveLength(ASSISTANCE_PROFILES.length * 9);
    // Only allowedPresets are offered, per context.
    const optionsFor = (kind: string) => [...document.querySelector(`fieldset[data-assistance-context="${kind}"] > label select`)!.querySelectorAll("option")].map((option) => option.value);
    expect(optionsFor("position")).toEqual(["quiet", "guided", "theory_only", "support", "analysis"]);
    expect(optionsFor("pack")).toEqual(["quiet", "guided", "theory_only", "analysis"]);
    expect(optionsFor("match")).toEqual(["quiet"]);
    expect(optionsFor("academy")).toEqual(["quiet", "guided", "theory_only"]);
    for (const fieldset of contexts()) {
      const match = fieldset.dataset.assistanceContext === "match";
      const control = [...fieldset.querySelectorAll<HTMLInputElement>('.assistance-fields input[type="checkbox"]')]
        .find((input) => input.parentElement?.textContent?.includes("External voice"))!;
      expect(control.disabled).toBe(true);
      const reason = document.getElementById(control.getAttribute("aria-describedby")!)!;
      expect(reason.textContent).toContain(match ? "legal board interaction only" : "External voice is unavailable");
    }
    const match = contexts().find((fieldset) => fieldset.dataset.assistanceContext === "match")!;
    expect([...match.querySelectorAll("select, input")].every((control) => (control as HTMLInputElement | HTMLSelectElement).disabled)).toBe(true);
    expect(document.querySelectorAll("#external-voice-unavailable")).toHaveLength(1);
    await unmount(component);
  });

  it("choosing a style writes v2, and a higher Advanced value turns the context Custom", async () => {
    const { values, storage } = memory();
    vi.stubGlobal("localStorage", storage);
    const component = mount(AssistanceSettings, { target: target(), props: { onSignOut: vi.fn(), onExport: vi.fn(), onDelete: vi.fn() } });
    const position = () => document.querySelector<HTMLFieldSetElement>('fieldset[data-assistance-context="position"]')!;
    const style = position().querySelector<HTMLSelectElement>(":scope > label select")!;
    expect(style.value).toBe("quiet");
    style.value = "guided";
    style.dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    expect(JSON.parse(values.get(workflowPreferenceKey("position"))!).intent).toEqual({ kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } });
    const lighting = position().querySelector<HTMLSelectElement>(".assistance-fields select")!;
    expect(lighting.value).toBe("sight");
    lighting.value = "evidence";
    lighting.dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    expect(style.value).toBe("custom");
    expect(position().textContent).toContain("Custom help");
    expect(JSON.parse(values.get(workflowPreferenceKey("position"))!).intent.overrides).toEqual({ boardLighting: "evidence" });
    await unmount(component);
  });

  it("renders stored assistance on the first component paint", async () => {
    const { storage } = memory([[legacy("position"), JSON.stringify({ ...SILENT_ASSISTANCE, boardLighting: "evidence", markers: "live" })]]);
    vi.stubGlobal("localStorage", storage);
    const component = mount(AssistanceSettings, { target: target(), props: { onSignOut: vi.fn(), onExport: vi.fn(), onDelete: vi.fn() } });
    const fieldset = document.querySelector<HTMLFieldSetElement>('fieldset[data-assistance-context="position"]')!;
    expect(fieldset.querySelector<HTMLSelectElement>(".assistance-fields select")?.value).toBe("evidence");
    expect([...fieldset.querySelectorAll<HTMLInputElement>('.assistance-fields input[type="checkbox"]')].find((input) => input.parentElement?.textContent?.includes("Passive markers"))?.checked).toBe(true);
    expect(fieldset.querySelector<HTMLSelectElement>(":scope > label select")?.value).toBe("custom");
    await unmount(component);
  });
});
