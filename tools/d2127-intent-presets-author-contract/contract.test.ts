import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MODULE_IDS } from "../../packages/runtime/src/module-contract.js";
import {
  authoritativeRequest, campaignContext, compileRequest, effectSourceState, FIELDS,
  loadWithLegacyPrecedence, narrowBrowserChannels, parsePreferenceV2, renderSuppression,
  requestedModules, serializePreferenceV2,
} from "./fixture.js";

const rfc = readFileSync("rfc/intent-presets.md", "utf8");
const valid = () => ({ version: 2, assistanceHead: 4, preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } });

describe("intent-presets D2127-D2134 second author repair", () => {
  it("D2127 strictly parses the closed v2 preference image", () => {
    expect(FIELDS).toHaveLength(9);
    expect(parsePreferenceV2(valid())).toMatchObject(valid());
    const unordered = parsePreferenceV2({ ...valid(), overrides: { arrows: "sight", guided: "off" }, moduleOverrides: { include: ["guided_hint", "rules_floor"], exclude: [] } });
    expect(serializePreferenceV2(parsePreferenceV2(JSON.parse(serializePreferenceV2(unordered))))).toBe(serializePreferenceV2(unordered));
    for (const bad of [null, [], { ...valid(), extra: true }, { ...valid(), assistanceHead: 5 }, { ...valid(), overrides: { guided: "sometimes" } }, { ...valid(), moduleOverrides: { include: ["guided_hint"], exclude: ["guided_hint"] } }]) {
      expect(() => parsePreferenceV2(bad)).toThrow();
    }
  });

  it("D2128 derives preset identity only from the sealed receipt", () => {
    const preference = parsePreferenceV2(valid());
    const request = compileRequest("position", preference);
    expect(authoritativeRequest(request, "position").preset).toBe("analysis");
    expect(() => authoritativeRequest(request, "pack")).toThrow(/CONTEXT_MISMATCH/u);
  });

  it("D2129 binds client request bytes to a server-authoritative context", () => {
    const request = compileRequest("position", parsePreferenceV2(valid()));
    expect(authoritativeRequest(request, "position").requestedDigest).toBe(request.requestDigest);
    expect(() => authoritativeRequest({ ...request, contextHint: "pack" }, "pack")).toThrow(/REQUEST_DIGEST/u);
    const server = { modules: ["rules_floor", "guided_hint"] as const, spoken: "provider" as const };
    const narrowed = narrowBrowserChannels(server, false);
    expect(narrowed.modules).toEqual(server.modules);
    expect(narrowed.spoken).toBe("off");
    expect(rfc).toMatch(/client request\/server authority\/client channel\s+narrowing/u);
  });

  it("D2130 gives Custom an explicit module include/exclude algebra", () => {
    const preference = parsePreferenceV2({ ...valid(), moduleOverrides: { include: ["structure_nudge", "guided_hint"], exclude: ["full_inspector"] } });
    expect(requestedModules(["rules_floor", "full_inspector"], preference, MODULE_IDS)).toEqual(["rules_floor", "structure_nudge", "guided_hint"]);
    expect(requestedModules([], preference, ["rules_floor"])).toEqual([]);
  });

  it("D2131 renders every suppression from typed requested/effective/reason bytes", () => {
    expect(renderSuppression({ kind: "field", field: "arrows", requested: "sight", effective: "off", reason: "match ceiling" })).toMatch(/sight to off/u);
    expect(renderSuppression({ kind: "module", moduleId: "guided_hint", requested: true, effective: false, reason: "role ceiling" })).toMatch(/role ceiling/u);
    expect(renderSuppression({ kind: "effect", effectId: "guided_hint.card", moduleId: "guided_hint", requested: "enabled", effective: "disabled", reason: "provider unavailable" })).toMatch(/provider unavailable/u);
  });

  it("D2132 preserves AND/OR source alternatives and honest no-witness", () => {
    const alternatives = [{ all: ["rules", "stockfish"] }, { all: ["rules", "authored"] }];
    expect(effectSourceState(alternatives, { rules: "available", stockfish: "unavailable", authored: "available" })).toBe("deliver");
    expect(effectSourceState([{ all: ["rules", "stockfish"] }], { rules: "available", stockfish: "no_witness" })).toBe("honest_empty");
    expect(effectSourceState(alternatives, { rules: "available", stockfish: "failed", authored: "pending" })).toBe("suppress");
    const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));
    const bindings = JSON.parse(readFileSync("rfc/contracts/module-binding-plan-v1.json", "utf8"));
    const executionByProjection = new Map(execution.rows.map((row: any) => [`${row.projection.id}@${row.projection.version}`, row]));
    expect(bindings.rows.every((row: any) => executionByProjection.has(`${row.projection.id}@${row.projection.version}`))).toBe(true);
    const inspectorFamilies = new Set(bindings.rows.filter((row: any) => row.consumer.id === "module.full_inspector").map((row: any) => executionByProjection.get(`${row.projection.id}@${row.projection.version}`)?.sourceFamily));
    expect(inspectorFamilies.size).toBeGreaterThan(4);
  });

  it("D2133 makes valid or invalid v2 authoritative over stale legacy bytes", () => {
    expect(loadWithLegacyPrecedence(valid(), { guided: "live" })).toMatchObject({ version: 2 });
    expect(loadWithLegacyPrecedence({ ...valid(), extra: true }, { guided: "live" })).toBe("invalid_v2");
    expect(loadWithLegacyPrecedence(undefined, { guided: "live" })).toBe("migrate_legacy");
    expect(rfc).toMatch(/source census fails any write to either v1 namespace/u);
  });

  it("D2134 phases Campaign without inventing its receipt", () => {
    expect(campaignContext).toThrow(/CONTEXT_DECLARED_AWAITING/u);
    expect(rfc).toMatch(/will import that type; it will not copy or forecast its bytes/u);
  });
});
