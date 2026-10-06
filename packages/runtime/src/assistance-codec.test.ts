import { describe, expect, it } from "vitest";
import { assistanceTypeDomains } from "../../../tools/assistance-codec-conformance.js";
import { SILENT_ASSISTANCE } from "./assistance.js";
import { ASSISTANCE_FIELD_DOMAINS, ASSISTANCE_PREFERENCE_FIELDS, AssistanceCodecError, migrateAssistanceConfig, parseAssistanceConfig, parseAssistancePreferenceFields } from "./assistance-codec.js";
import { parseWorkflowPreferenceV2 } from "./presets.js";

const matrix = assistanceTypeDomains();

describe("shared current-head assistance codec", () => {
  it("is set-equal to the TypeChecker-derived registered fields and literal domains", () => {
    expect(matrix.version).toBe(SILENT_ASSISTANCE.version);
    expect([...ASSISTANCE_PREFERENCE_FIELDS].sort()).toEqual(Object.keys(matrix.fields).sort());
    expect(Object.fromEntries(Object.entries(ASSISTANCE_FIELD_DOMAINS).map(([key, values]) => [key, [...values].sort()]))).toEqual(matrix.fields);
  });

  for (const [field, values] of Object.entries(matrix.fields)) {
    for (const value of values) it(`round-trips the registered ${field}=${value} through config and workflow parsing`, () => {
      const config = { ...SILENT_ASSISTANCE, [field]: value };
      expect(parseAssistanceConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
      const workflow = parseWorkflowPreferenceV2({ version: 2, assistanceHead: matrix.version, intent: {
        kind: "migrated_snapshot", preset: "quiet", config, sourceVersion: 4, moduleOverrides: { include: [], exclude: [] },
      } });
      expect(workflow.intent).toMatchObject({ config });
      expect(Object.isFrozen(parseAssistanceConfig(config))).toBe(true);
    });
    it(`refuses missing/broad/unknown ${field} rather than dropping it`, () => {
      const missing = { ...SILENT_ASSISTANCE } as Record<string, unknown>;
      delete missing[field];
      expect(() => parseAssistanceConfig(missing)).toThrow();
      for (const value of ["unknown", "", 0, true, null, undefined, {}, [values[0]]]) {
        expect(() => parseAssistanceConfig({ ...SILENT_ASSISTANCE, [field]: value })).toThrow();
        expect(() => parseAssistancePreferenceFields({ [field]: value })).toThrow();
      }
    });
  }

  it("refuses future versions, extra fields, inherited fields and non-data objects", () => {
    for (const value of [null, [], Object.create(SILENT_ASSISTANCE), { ...SILENT_ASSISTANCE, version: 5 },
      { ...SILENT_ASSISTANCE, hintDistance: "move" }, { ...SILENT_ASSISTANCE, extra: true },
      { ...SILENT_ASSISTANCE, get ambient() { throw new Error("must not read accessor"); } }]) {
      expect(() => parseAssistanceConfig(value)).toThrow();
    }
    expect(() => parseAssistanceConfig({ ...SILENT_ASSISTANCE, [Symbol("hidden")]: "off" })).toThrow();
    expect(() => parseAssistancePreferenceFields({ hintDistance: "move" })).toThrow();
    // The refusal census requires actual dispositions, not newly registered test debt.
    for (const [value, code] of [
      [{ ...SILENT_ASSISTANCE, extra: true }, "ASSISTANCE_SHAPE"],
      [{ ...SILENT_ASSISTANCE, ambient: "unknown" }, "ASSISTANCE_VALUE"],
      [{ ...SILENT_ASSISTANCE, version: 5 }, "ASSISTANCE_VERSION"],
    ] as const) {
      let failure: unknown;
      try { parseAssistanceConfig(value); } catch (error) { failure = error; }
      expect(failure).toBeInstanceOf(AssistanceCodecError);
      expect(failure).toMatchObject({ code });
    }
  });

  it("retains literal legacy grammar/defaults and exact source-version provenance", () => {
    const base = { markers: "live", guided: "off", humanSplit: "on_request", voice: "persona" };
    for (const version of [1, 2, 3, 4] as const) {
      const raw = version === 4 ? { ...SILENT_ASSISTANCE, ...base, spoken: "provider", ambient: "on" }
        : { version, ...base, ...(version >= 2 ? { corpus: "on_request" } : {}), ...(version === 3 ? { spoken: "on" } : {}) };
      const expected = version === 4 ? raw : { ...SILENT_ASSISTANCE, ...base, corpus: version >= 2 ? "on_request" : "off", spoken: version === 3 ? "browser" : "off" };
      expect(migrateAssistanceConfig(raw)).toEqual({ config: expected, sourceVersion: version });
      // Existing v1–v4 browser inputs ignored extra keys; migration keeps that historical grammar.
      expect(migrateAssistanceConfig({ ...raw, ignored: "historical", hintDistance: "move" })).toEqual({ config: expected, sourceVersion: version });
      for (const field of ["markers", "guided", "humanSplit", "voice"]) {
        const invalid = { ...raw } as Record<string, unknown>;
        delete invalid[field];
        expect(() => migrateAssistanceConfig(invalid)).toThrow();
      }
    }
    expect(() => migrateAssistanceConfig({ version: 3, ...base, corpus: "off", spoken: "provider" })).toThrow();
    expect(() => migrateAssistanceConfig({ ...SILENT_ASSISTANCE, version: 5 })).toThrow();
  });

  it("the independent TypeChecker refuses broad domains and exposes added members/fields", () => {
    expect(() => assistanceTypeDomains("interface AssistanceConfig { readonly version: 4; readonly markers: string; }")).toThrow(/closed literal/u);
    expect(assistanceTypeDomains('interface AssistanceConfig { readonly version: 5; readonly newField: "off" | "new"; }')).toEqual({ version: 5, fields: { newField: ["new", "off"] } });
  });
});
