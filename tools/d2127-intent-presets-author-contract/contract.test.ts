import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MODULE_IDS } from "../../packages/runtime/src/module-contract.js";
import {
  authoritativeRequest, browserReceipt, campaignContext, compileRequest, effectSourceState, FIELDS,
  finalizeEffects, loadWithLegacyPrecedence, narrowBrowserChannels, parsePreferenceV2,
  renderSuppression, requestedModules, requireExecutableModuleAuthority, selectNamedPreset,
  serializePreferenceV2, SHARED_RESOURCE_REQUIREMENTS,
} from "./fixture.js";

const rfc = readFileSync("rfc/intent-presets.md", "utf8");
const explicit = () => ({ version: 2 as const, assistanceHead: 4 as const, intent: { kind: "explicit" as const, preset: "analysis" as const, overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const completeConfig = Object.fromEntries(FIELDS.map((field) => [field, field === "voice" ? "authored" : field === "boardLighting" ? "legal" : "off"]));

describe("intent-presets D2171-D2178 third author repair", () => {
  it("D2171 refuses effect compilation from requirements-only module artifacts", () => {
    const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));
    const bindings = JSON.parse(readFileSync("rfc/contracts/module-binding-plan-v1.json", "utf8"));
    expect(() => requireExecutableModuleAuthority(execution, bindings)).toThrow(/MODULE_AUTHORITY_NOT_ACCEPTED/u);
    expect(execution.sourceInputs).toHaveLength(9);
    expect(execution.guidedHint).toMatchObject({ status: "owner_blocked", blocker: "D1639" });
  });

  it("D2172 correlates the four typed stages and their digests", () => {
    const requested = compileRequest("position", parsePreferenceV2(explicit()));
    const authoritative = authoritativeRequest(requested, "position");
    const finalized = finalizeEffects(authoritative, "sha256:sources");
    const narrowed = narrowBrowserChannels(finalized, browserReceipt(7, false));
    expect([requested.stage, authoritative.stage, finalized.stage, narrowed.stage]).toEqual(["requested", "authoritative", "finalized", "browser_narrowed"]);
    expect(finalized.authoritativeDigest).toBe(authoritative.effectiveDigest);
    expect(narrowed.serverDigest).toBe(finalized.finalDigest);
    expect(() => authoritativeRequest({ ...requested, contextHint: "pack" }, "pack")).toThrow(/REQUEST_DIGEST/u);
  });

  it("D2173 preserves unset, explicit, migrated and invalid intent byte-for-byte across reloads", () => {
    const arms = [
      { version: 2, assistanceHead: 4, intent: { kind: "unset" } }, explicit(),
      { version: 2, assistanceHead: 4, intent: { kind: "migrated_snapshot", preset: "guided", config: completeConfig, sourceVersion: 3, moduleOverrides: { include: ["guided_hint"], exclude: [] } } },
      { version: 2, assistanceHead: 4, intent: { kind: "invalid_fallback", reason: "malformed" } },
    ];
    for (const arm of arms) {
      const first = serializePreferenceV2(parsePreferenceV2(arm));
      const second = serializePreferenceV2(parsePreferenceV2(JSON.parse(first)));
      expect(second).toBe(first);
      expect(JSON.parse(second).intent.kind).toBe((arm as any).intent.kind);
    }
    expect(loadWithLegacyPrecedence(explicit(), { guided: "live" })).toMatchObject({ version: 2 });
    expect(loadWithLegacyPrecedence({ ...explicit(), extra: true }, { guided: "live" })).toBe("invalid_v2");
  });

  it("D2174 makes named selection literal and clears Custom module deltas", () => {
    const custom = parsePreferenceV2({ version: 2, assistanceHead: 4, intent: { kind: "explicit", preset: "analysis", overrides: { guided: "off" }, moduleOverrides: { include: ["guided_hint"], exclude: ["full_inspector"] } } });
    const named = selectNamedPreset(custom, "quiet", { guided: "off" });
    expect(named.intent).toMatchObject({ kind: "explicit", preset: "quiet", overrides: { guided: "off" }, moduleOverrides: { include: [], exclude: [] } });
  });

  it("D2175 keeps browser readiness out of the request and binds one current receipt after finalization", () => {
    const requested = compileRequest("position", parsePreferenceV2(explicit()));
    expect(requested).not.toHaveProperty("browserChannels");
    const finalized = finalizeEffects({ ...authoritativeRequest(requested, "position"), spoken: "provider" }, "sha256:sources");
    expect(narrowBrowserChannels(finalized, browserReceipt(8, true))).toMatchObject({ spoken: "browser", browserGeneration: 8 });
    const receipt = browserReceipt(8, true);
    expect(() => narrowBrowserChannels(finalized, { ...receipt, browserSpeech: false })).toThrow(/BROWSER_RECEIPT_DIGEST/u);
  });

  it("D2176 makes rules_floor impossible to exclude and mandatory after every clamp", () => {
    expect(() => parsePreferenceV2({ ...explicit(), intent: { ...explicit().intent, moduleOverrides: { include: [], exclude: ["rules_floor"] } } })).toThrow(/PREFERENCE_MODULE_AUTHORITY/u);
    const preference = parsePreferenceV2({ ...explicit(), intent: { ...explicit().intent, moduleOverrides: { include: ["guided_hint"], exclude: ["full_inspector"] } } });
    expect(requestedModules([], preference, [])).toEqual(["rules_floor"]);
    expect(requestedModules(["rules_floor", "full_inspector"], preference, MODULE_IDS)).toEqual(["rules_floor", "guided_hint"]);
  });

  it("D2177 renders recovery from a closed safe arm without attacker bytes", () => {
    expect(renderSuppression({ kind: "preference_recovery", reason: "malformed" })).toBe("Saved help preferences were invalid, so safe defaults are active.");
    expect(renderSuppression({ kind: "preference_recovery", reason: "storage_unavailable" })).toMatch(/could not be read/u);
    expect(renderSuppression({ kind: "module", moduleId: "guided_hint", requested: true, effective: false, reason: "role ceiling" })).toMatch(/role ceiling/u);
  });

  it("D2178 routes all shared grammars/vocabulary to explicit register requirements", () => {
    expect(SHARED_RESOURCE_REQUIREMENTS).toEqual(["workflow-preference", "assistance-exchange", "assistance-permission"]);
    expect(rfc).toMatch(/workflow-preference.*assistance-exchange.*assistance-permission/su);
    expect(rfc).toMatch(/register implementation is a hard predecessor/u);
  });

  it("retains source-alternative honesty and Campaign refusal", () => {
    const alternatives = [{ all: ["rules", "stockfish"] }, { all: ["rules", "authored"] }];
    expect(effectSourceState(alternatives, { rules: "available", stockfish: "unavailable", authored: "available" })).toBe("deliver");
    expect(effectSourceState([{ all: ["rules", "stockfish"] }], { rules: "available", stockfish: "no_witness" })).toBe("honest_empty");
    expect(campaignContext).toThrow(/CONTEXT_DECLARED_AWAITING/u);
  });
});
