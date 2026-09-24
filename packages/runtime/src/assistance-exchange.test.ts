import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SILENT_ASSISTANCE, accessPermission, permittedAssistance, type AssistanceAccess, type AssistanceContext, type AssistancePermission } from "./assistance.js";
import {
  ASSISTANCE_FIELD_EFFECT_ADAPTER,
  MODULE_EFFECT_CATALOG,
  MODULE_SOURCE_AUTHORITY,
  SUPPRESSION_REASONS,
  SUPPRESSION_RENDERERS,
  assistanceDigest,
  browserChannelReceipt,
  compileAssistanceRequest,
  compileAuthoritativeAssistance,
  compiledPresetDisclosure,
  effectSourceDependencies,
  finalizeAssistanceEffects,
  narrowBrowserChannels,
  parseFinalizedAssistanceV1,
  parseRequestedAssistanceV1,
  registryPresentationFacts,
  renderSuppression,
  serverAvailabilityFromProviders,
  sha256Hex,
  type AuthoritativeAssistanceV1,
  type ServerAssistanceAuthority,
  type ServerEvidenceAvailabilityReceipt,
} from "./assistance-exchange.js";
import { MODULE_IDS, type ModuleId } from "./module-contract.js";
import {
  ASSISTANCE_FIELD_DOMAINS,
  ASSISTANCE_PREFERENCE_FIELDS,
  CONFIGURABLE_MODULE_IDS,
  HINT_CEILING_TABLE,
  MODULE_PRESENTATION_FACTS,
  MODULE_PRESENTATION_SOURCE,
  PRESET_DECLARATIONS,
  PRESET_IDS,
  WORKFLOW_CONTEXT_POLICIES,
  WORKFLOW_CONTEXTS,
  PresetRefusalError,
  contextClamp,
  deriveWorkflowContext,
  fieldRank,
  hintCeiling,
  permissionCeiling,
  pointwiseMin,
  presetDeclaration,
  selectNamedPreset,
  setPreferenceField,
  setPreferenceModule,
  workflowContextPolicy,
  type OrdinaryWorkflowContextId,
  type OrdinaryWorkflowContextOrigin,
  type PresetId,
  type WorkflowPreferenceReceipt,
} from "./presets.js";

const ORIGINS: Readonly<Record<OrdinaryWorkflowContextId, OrdinaryWorkflowContextOrigin>> = {
  pack: { kind: "run", sessionKind: "pack", feedbackPolicy: "attempt_end" },
  position: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" },
  imported: { kind: "run", sessionKind: "imported", feedbackPolicy: "attempt_end" },
  match: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "match" },
  stream: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "stream" },
  academy: { kind: "run", sessionKind: "pack", feedbackPolicy: "attempt_end", liveKind: "academy" },
  onramp: { kind: "run", sessionKind: "pack", feedbackPolicy: "immediate_guard" },
};
const ORDINARY = Object.keys(ORIGINS) as OrdinaryWorkflowContextId[];
const PERMISSIVE: AssistanceAccess = { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false };
const ALL_AVAILABLE = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
const authority = (context: OrdinaryWorkflowContextId, access: AssistanceAccess = PERMISSIVE, availability: ServerEvidenceAvailabilityReceipt = ALL_AVAILABLE): ServerAssistanceAuthority => ({ origin: ORIGINS[context], access, availability });
const compile = (context: OrdinaryWorkflowContextId, preference: WorkflowPreferenceReceipt, access?: AssistanceAccess, availability?: ServerEvidenceAvailabilityReceipt): AuthoritativeAssistanceV1 =>
  compileAuthoritativeAssistance(compileAssistanceRequest({ contextHint: context, preference }), authority(context, access, availability));
const named = (preset: PresetId): WorkflowPreferenceReceipt => ({ kind: "explicit", preset, overrides: {}, moduleOverrides: { include: [], exclude: [] } });
const MAX_FIELDS = Object.fromEntries(ASSISTANCE_PREFERENCE_FIELDS.map((field) => [field, ASSISTANCE_FIELD_DOMAINS[field].at(-1)])) as Record<string, string>;
const code = (fn: () => unknown): string | undefined => { try { fn(); return undefined; } catch (error) { return (error as { code?: string }).code; } };
const ACCESS_MATRIX: readonly AssistanceAccess[] = [false, true].flatMap((deliveryOpen) => (["solo", "host", "participant", "spectator"] as const).flatMap((role) => [false, true].flatMap((seatedInContest) => [false, true].map((reviewing) => ({ deliveryOpen, role, seatedInContest, reviewing })))));

describe("rfc/intent-presets.md — the ∩ algebra, compiled", () => {
  it("criterion 1: every admitted pair narrows pointwise under every access and receipt", () => {
    const receipts = (preset: PresetId): readonly WorkflowPreferenceReceipt[] => [
      named(preset),
      { kind: "explicit", preset, overrides: MAX_FIELDS, moduleOverrides: { include: CONFIGURABLE_MODULE_IDS.filter((id) => !presetDeclaration(preset).modules.includes(id)), exclude: [] } },
      { kind: "explicit", preset, overrides: { markers: "off", boardLighting: "off" }, moduleOverrides: { include: [], exclude: CONFIGURABLE_MODULE_IDS.filter((id) => presetDeclaration(preset).modules.includes(id)) } },
    ];
    let pairs = 0;
    for (const context of ORDINARY) {
      const policy = workflowContextPolicy(context);
      for (const preset of policy.allowedPresets) {
        pairs += 1;
        for (const receipt of receipts(preset)) {
          for (const access of ACCESS_MATRIX) {
            const result = compile(context, receipt, access);
            const include = receipt.kind === "explicit" ? receipt.moduleOverrides.include : [];
            const exclude = receipt.kind === "explicit" ? receipt.moduleOverrides.exclude : [];
            const requested = new Set<ModuleId>([...presetDeclaration(preset).modules, ...include].filter((id) => !exclude.includes(id as never)));
            for (const id of result.modules) {
              expect(id === "rules_floor" || requested.has(id)).toBe(true);
              expect(policy.moduleCeiling).toContain(id);
            }
            const clamp = pointwiseMin(accessPermission(access), contextClamp(context));
            for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
              expect(fieldRank(field, result.config[field]), `${context}/${preset}/${field}`).toBeLessThanOrEqual(fieldRank(field, permissionCeiling(field, clamp[field])));
            }
          }
        }
      }
    }
    // Drift tripwire only: the seven ordinary contexts admit 24 of Campaign's excluded 28.
    expect(pairs).toBe(WORKFLOW_CONTEXT_POLICIES.filter((policy) => policy.id !== "campaign").reduce((sum, policy) => sum + policy.allowedPresets.length, 0));
  });

  it("criterion 2: every refused pair is a typed refusal at selection and at the server", () => {
    let refused = 0;
    for (const context of WORKFLOW_CONTEXTS) {
      for (const preset of PRESET_IDS) {
        if (workflowContextPolicy(context).allowedPresets.includes(preset)) continue;
        refused += 1;
        expect(() => selectNamedPreset(context, { kind: "unset" }, preset)).toThrowError(PresetRefusalError);
        if (context !== "campaign") expect(code(() => compile(context, named(preset)))).toBe("PRESET_NOT_ALLOWED");
      }
    }
    expect(refused).toBe(PRESET_IDS.length * WORKFLOW_CONTEXTS.length - WORKFLOW_CONTEXT_POLICIES.reduce((sum, policy) => sum + policy.allowedPresets.length, 0));
  });

  it("criterion 3: the rules floor is unexpressible-off in every compiled output", () => {
    const legal: AssistancePermission = "legal";
    expect(legal).toBe("legal");
    for (const context of ORDINARY) {
      const quiet = compile(context, named("quiet"));
      expect(quiet.config.boardLighting).toBe("legal");
      for (const access of ACCESS_MATRIX) {
        const stored = compile(context, { kind: "explicit", preset: "quiet", overrides: { boardLighting: "off" }, moduleOverrides: { include: [], exclude: [] } }, access);
        expect(["legal", "sight", "evidence"]).toContain(stored.config.boardLighting);
        expect(stored.modules).toContain("rules_floor");
      }
    }
    // Forged untyped bytes cannot exclude the floor: the wire parser refuses it and the compiler reinserts it.
    const forged = { ...compileAssistanceRequest({ contextHint: "position", preference: named("quiet") }), preference: { kind: "explicit", preset: "quiet", overrides: {}, moduleOverrides: { include: [], exclude: ["rules_floor"] } } };
    expect(code(() => parseRequestedAssistanceV1(forged))).toBe("EXCHANGE_SHAPE_INVALID");
    expect(code(() => setPreferenceModule("position", { kind: "unset" }, "rules_floor" as never, false))).toBe("PREFERENCE_MODULE_AUTHORITY");
  });

  it("criterion 4: explicit narrowing survives; context narrowing is labelled; widening is Custom", () => {
    // Fixture A.
    const off = selectNamedPreset("position", setPreferenceField("position", { kind: "unset" }, "guided", "off").intent, "guided").intent;
    const a = compile("position", off);
    expect(a.config.guided).toBe("off");
    expect(off).toMatchObject({ overrides: { guided: "off" } });
    expect(a.suppressed).toContainEqual({ kind: "field", field: "guided", requested: "live", effective: "off", by: "stored_choice", reason: "explicitly_disabled" });
    // Fixture B.
    const b = compile("match", { kind: "explicit", preset: "quiet", overrides: { arrows: "sight" }, moduleOverrides: { include: [], exclude: [] } });
    expect(b.config.arrows).toBe("off");
    expect(b.suppressed).toContainEqual({ kind: "field", field: "arrows", requested: "sight", effective: "off", by: "context_ceiling", reason: "context_clamped_field" });
    // Fixture C.
    expect(compile("position", { kind: "explicit", preset: "guided", overrides: { boardLighting: "evidence" }, moduleOverrides: { include: [], exclude: [] } }).displayMode).toBe("custom");
    expect(compile("position", named("guided")).displayMode).toBe("named");
    // Access, when strictly lower than the context, carries the access label.
    const participant = compile("position", named("analysis"), { ...PERMISSIVE, role: "participant" });
    expect(participant.suppressed).toContainEqual({ kind: "field", field: "humanSplit", requested: "on_request", effective: "off", by: "access", reason: "access_clamped_field" });
  });

  it("criterion 5 + 14: permittedAssistance is access ∩ context, reads the context, and moves exactly match/academy/onramp", () => {
    const moved: Record<string, number> = {};
    for (const context of WORKFLOW_CONTEXTS) {
      const composed = permittedAssistance({ ...PERMISSIVE, workflowContext: context });
      const head = accessPermission(PERMISSIVE);
      moved[context] = ASSISTANCE_PREFERENCE_FIELDS.filter((field) => composed[field] !== head[field]).length;
      for (const access of ACCESS_MATRIX) {
        const input: AssistanceContext = { ...access, workflowContext: context };
        expect(permittedAssistance(input)).toEqual(pointwiseMin(accessPermission(input), contextClamp(context)));
      }
    }
    // Before/after pairs. academy/onramp move four fields (humanSplit, corpus, boardLighting, arrows) after
    // the 2026-09-24 corpus correction; the drafted "three" predates it. The other five agree.
    expect(moved).toEqual({ pack: 0, position: 0, imported: 0, match: 9, stream: 0, academy: 4, onramp: 4, campaign: 0 });
    // @ts-expect-error sessionKind is removed from AssistanceContext (criterion 14).
    const legacy: AssistanceContext = { ...PERMISSIVE, workflowContext: "pack", sessionKind: "pack" };
    expect(legacy.workflowContext).toBe("pack");
  });

  it("criterion 5: one derivation, imported by both the client and the server", () => {
    const root = join(__dirname, "../../..");
    const read = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return read(path);
      return /\.(ts|svelte)$/u.test(entry.name) && !entry.name.includes(".test.") ? [readFileSync(path, "utf8")] : [];
    });
    expect(read(join(root, "apps/server/src")).some((text) => text.includes("deriveWorkflowContext"))).toBe(true);
    expect(read(join(root, "apps/web/src")).some((text) => text.includes("deriveWorkflowContext"))).toBe(true);
    for (const liveKind of [undefined, "match", "stream", "academy"] as const) {
      for (const feedbackPolicy of ["delayed_checkpoint", "segment_end", "attempt_end", "immediate_guard"] as const) {
        for (const sessionKind of ["pack", "position", "imported"] as const) {
          const context = deriveWorkflowContext({ sessionKind, feedbackPolicy, liveKind });
          expect(context).not.toBe("campaign");
          expect(context).toBe(feedbackPolicy === "immediate_guard" ? "onramp" : liveKind ?? sessionKind);
        }
      }
    }
  });

  it("criterion 6: presets.ts and the exchange import no eligibility, event or evidence-packet symbol", () => {
    for (const file of ["presets.ts", "assistance-exchange.ts"]) {
      const imports = [...readFileSync(join(__dirname, file), "utf8").matchAll(/from "(\.\/[^"]+)"/gu)].map((match) => match[1]);
      expect(imports.every((path) => ["./assistance.js", "./module-contract.js", "./module-policy.js", "./types.js", "./presets.js"].includes(path!)), `${file}: ${imports.join(", ")}`).toBe(true);
    }
  });

  it("criterion 8: every table entry is a candidate and the hint table is marked proposed (D1639)", () => {
    for (const entry of [...PRESET_DECLARATIONS, ...WORKFLOW_CONTEXT_POLICIES]) expect(entry.validation).toBe("candidate");
    expect(HINT_CEILING_TABLE).toMatchObject({ validation: "proposed", ruling: "D1639" });
  });

  it("criterion 17: the strict wire parser crosses every malformed shape", () => {
    const good = compileAssistanceRequest({ contextHint: "position", preference: named("guided") });
    const bad = (preference: unknown) => code(() => parseRequestedAssistanceV1({ ...good, preference }));
    expect(bad(null)).toBe("EXCHANGE_SHAPE_INVALID");
    expect(bad([])).toBe("EXCHANGE_SHAPE_INVALID");
    expect(bad({ ...named("guided"), extra: 1 })).toBe("EXCHANGE_SHAPE_INVALID");
    expect(bad({ ...named("guided"), overrides: { markers: "loud" } })).toBe("EXCHANGE_SHAPE_INVALID");
    expect(bad({ ...named("guided"), overrides: { hintDistance: "move" } })).toBe("EXCHANGE_SHAPE_INVALID");
    expect(bad({ ...named("guided"), moduleOverrides: { include: ["review_map"], exclude: ["review_map"] } })).toBe("EXCHANGE_SHAPE_INVALID");
    expect(bad({ ...named("guided"), moduleOverrides: { include: ["review_map", "review_map"], exclude: [] } })).toBe("EXCHANGE_SHAPE_INVALID");
    expect(code(() => parseRequestedAssistanceV1({ ...good, stage: "authoritative" }))).toBe("EXCHANGE_STAGE_MISMATCH");
    expect(code(() => parseRequestedAssistanceV1({ ...good, schemaVersion: 2 }))).toBe("EXCHANGE_SHAPE_INVALID");
  });

  it("criterion 18: named is literal; Advanced reaches every domain member and every module", () => {
    for (const context of ORDINARY) {
      for (const preset of workflowContextPolicy(context).allowedPresets) {
        const projection = presetDeclaration(preset).config;
        for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
          for (const value of ASSISTANCE_FIELD_DOMAINS[field]) {
            const receipt = setPreferenceField(context, named(preset), field, value).intent;
            const result = compile(context, receipt);
            const higher = fieldRank(field, value) > fieldRank(field, projection[field]);
            expect(result.displayMode, `${context}/${preset}/${field}=${value}`).toBe(higher ? "custom" : "named");
            if (!higher) for (const other of ASSISTANCE_PREFERENCE_FIELDS) expect(fieldRank(other, result.config[other])).toBeLessThanOrEqual(fieldRank(other, projection[other]));
          }
        }
      }
    }
    // Analysis → Quiet cannot keep Analysis-only help under the Quiet label; an explicit off stays off.
    const wide = setPreferenceField("position", setPreferenceField("position", named("analysis"), "markers", "off").intent, "guided", "live").intent;
    const quiet = compile("position", selectNamedPreset("position", wide, "quiet").intent);
    expect(quiet.displayMode).toBe("named");
    expect(quiet.config).toEqual(SILENT_ASSISTANCE);
    // "Analyze plus named guidance" only through explicit module includes, still under context/access.
    const plus = setPreferenceField("position", setPreferenceModule("position", setPreferenceModule("position", named("analysis"), "structure_nudge", true).intent, "guided_hint", true).intent, "guided", "live").intent;
    const compiled = compile("position", plus);
    expect(compiled.displayMode).toBe("custom");
    expect(compiled.modules).toEqual(expect.arrayContaining(["structure_nudge", "guided_hint"]));
    expect(compiled.effects.map((item) => item.effectId)).toContain("structure_nudge:post_commit:proactive");
    const inAcademy = compileAuthoritativeAssistance(compileAssistanceRequest({ contextHint: "academy", preference: { ...plus, preset: "guided" } as WorkflowPreferenceReceipt }), authority("academy"));
    expect(inAcademy.modules).not.toContain("full_inspector");
  });

  it("criterion 19: one effect authority — the adapter covers nine fields and lowering removes exactly its effects", () => {
    expect(Object.keys(ASSISTANCE_FIELD_EFFECT_ADAPTER).sort()).toEqual([...ASSISTANCE_PREFERENCE_FIELDS].sort());
    expect(new Set(MODULE_EFFECT_CATALOG.map((item) => item.moduleId))).toEqual(new Set(MODULE_IDS));
    const full = compile("position", { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: CONFIGURABLE_MODULE_IDS.filter((id) => !presetDeclaration("analysis").modules.includes(id)), exclude: [] } });
    const allIds = full.effects.map((item) => item.effectId);
    for (const field of ASSISTANCE_PREFERENCE_FIELDS) {
      const entry = ASSISTANCE_FIELD_EFFECT_ADAPTER[field];
      if (entry.kind !== "governs_effects") continue;
      const lowered = compile("position", { kind: "explicit", preset: "analysis", overrides: { [field]: ASSISTANCE_FIELD_DOMAINS[field][0] }, moduleOverrides: { include: CONFIGURABLE_MODULE_IDS.filter((id) => !presetDeclaration("analysis").modules.includes(id)), exclude: [] } });
      expect(allIds.filter((id) => !lowered.effects.some((item) => item.effectId === id)).sort()).toEqual(entry.effectIds.filter((id) => allIds.includes(id)).sort());
    }
    // A raw field value alone never grants a module: Quiet + guided:"live" has no structure_nudge effect.
    const raw = compile("position", setPreferenceField("position", named("quiet"), "guided", "live").intent);
    expect(raw.modules).toEqual(["rules_floor"]);
    expect(raw.effects.map((item) => item.moduleId)).toEqual(["rules_floor"]);
    // Support keeps its staged hint although it projects guided:"off" (the adapter correction).
    expect(compile("position", named("support")).effects.map((item) => item.effectId)).toContain("guided_hint:checkpoint:on_request");
  });

  it("criterion 20: availability narrows provider channels only, with typed reasons", () => {
    const wants = { kind: "explicit" as const, preset: "guided" as const, overrides: { voice: "persona" as const, spoken: "provider" as const }, moduleOverrides: { include: [], exclude: [] } };
    for (const state of [{ state: "pending" as const }, { state: "unavailable" as const, reason: "x" }, { state: "failed" as const, reason: "x" }]) {
      const result = compile("position", wants, PERMISSIVE, { ...ALL_AVAILABLE, llm: state, tts: state });
      expect(result.config.voice).toBe("authored");
      expect(result.config.spoken).toBe("browser");
      const reason = state.state === "pending" ? "source_pending" : state.state === "failed" ? "source_failed" : "source_unavailable";
      expect(result.suppressed).toContainEqual({ kind: "field", field: "voice", requested: "persona", effective: "authored", by: "source_availability", reason });
      expect(result.modules).toEqual(compile("position", wants).modules);
    }
    const available = compile("position", wants);
    expect([available.config.voice, available.config.spoken]).toEqual(["persona", "provider"]);
  });

  it("criterion 21: Campaign is declared-awaiting at every seat", () => {
    expect(code(() => compileAssistanceRequest({ contextHint: "campaign" as OrdinaryWorkflowContextId, preference: { kind: "unset" } }))).toBe("CONTEXT_DECLARED_AWAITING");
    const body = { stage: "requested", schemaVersion: 1, contextHint: "campaign", preference: { kind: "unset" } };
    // A correctly digested hand-built Campaign request still fails closed at the server.
    expect(code(() => compileAuthoritativeAssistance({ ...body, requestDigest: assistanceDigest(body) } as never, authority("pack")))).toBe("CONTEXT_DECLARED_AWAITING");
  });
});

describe("rfc/intent-presets.md — the four staged authorities", () => {
  it("rule 0 and criterion 15: context disagreement, forged requests and altered responses fail before rendering", () => {
    const request = compileAssistanceRequest({ contextHint: "position", preference: named("guided") });
    expect(code(() => compileAuthoritativeAssistance(request, authority("match")))).toBe("CONTEXT_MISMATCH");
    const forged = { ...request, preference: named("analysis") };
    expect(code(() => compileAuthoritativeAssistance(forged, authority("position")))).toBe("EXCHANGE_DIGEST_MISMATCH");
    const authoritative = compileAuthoritativeAssistance(request, authority("position"));
    expect(authoritative.requestedDigest).toBe(request.requestDigest);
    const finalized = finalizeAssistanceEffects(authoritative, { authority: MODULE_SOURCE_AUTHORITY, availability: ALL_AVAILABLE });
    expect(finalized.authoritativeDigest).toBe(authoritative.effectiveDigest);
    const wire = JSON.parse(JSON.stringify(finalized)) as unknown;
    expect(parseFinalizedAssistanceV1(wire)).toEqual(wire);
    const widened = { ...(wire as Record<string, unknown>), config: { ...finalized.config, boardLighting: "evidence" } };
    expect(code(() => parseFinalizedAssistanceV1(widened))).toBe("EXCHANGE_DIGEST_MISMATCH");
    expect(code(() => parseFinalizedAssistanceV1({ ...(wire as object), stage: "authoritative" }))).toBe("EXCHANGE_STAGE_MISMATCH");
    const tampered = { ...authoritative, modules: [...authoritative.modules, "full_inspector"] } as AuthoritativeAssistanceV1;
    expect(code(() => finalizeAssistanceEffects(tampered, { authority: MODULE_SOURCE_AUTHORITY, availability: ALL_AVAILABLE }))).toBe("EXCHANGE_DIGEST_MISMATCH");
  });

  it("the presentation facts presets.ts derives from are the production registry's (module-registration landed)", () => {
    expect(registryPresentationFacts()).toEqual(MODULE_PRESENTATION_FACTS);
    expect(MODULE_PRESENTATION_SOURCE.kind).toBe("registry_mirror");
  });

  it("the requirements-only module artifacts are refused, not executed (D2171)", () => {
    expect(code(() => effectSourceDependencies(MODULE_SOURCE_AUTHORITY))).toBe("MODULE_AUTHORITY_NOT_ACCEPTED");
    for (const file of ["module-execution-plan-v1.json", "module-binding-plan-v1.json"]) {
      const artifact = JSON.parse(readFileSync(join(__dirname, "../../../rfc/contracts", file), "utf8")) as { completionClaim?: string };
      // When module-registration lands sealed sources this fails, forcing the stand-in to be replaced.
      expect(artifact.completionClaim, file).toBe(MODULE_SOURCE_AUTHORITY.completionClaim);
    }
    const finalized = finalizeAssistanceEffects(compile("position", named("guided")), { authority: MODULE_SOURCE_AUTHORITY, availability: ALL_AVAILABLE });
    expect(finalized.sourceAuthority).toEqual({ state: "not_accepted", code: "MODULE_AUTHORITY_NOT_ACCEPTED", source: MODULE_SOURCE_AUTHORITY.source });
  });

  it("browser narrowing removes only browser speech, binds its receipt, and cannot widen", () => {
    const finalized = finalizeAssistanceEffects(compile("position", setPreferenceField("position", named("guided"), "spoken", "browser").intent), { authority: MODULE_SOURCE_AUTHORITY, availability: ALL_AVAILABLE });
    const silent = narrowBrowserChannels(finalized, browserChannelReceipt(1, { state: "unavailable", reason: "no_voice" }));
    expect(silent.config).toEqual({ ...finalized.config, spoken: "off" });
    expect(silent.modules).toEqual(finalized.modules);
    expect(silent.suppressed.at(-1)).toEqual({ kind: "field", field: "spoken", requested: "browser", effective: "off", by: "browser_channel", reason: "browser_channel_unavailable" });
    expect(narrowBrowserChannels(finalized, browserChannelReceipt(2, { state: "available" })).config).toEqual(finalized.config);
    const stale = { ...browserChannelReceipt(3, { state: "available" }), browserSpeech: { state: "unavailable" as const, reason: "x" } };
    expect(code(() => narrowBrowserChannels(finalized, stale))).toBe("EXCHANGE_DIGEST_MISMATCH");
  });

  it("suppression renderers are closed, fixed-copy and never reflect stored bytes", () => {
    expect(SUPPRESSION_RENDERERS.preference_recovery.malformed).toBeTypeOf("function");
    for (const reason of SUPPRESSION_REASONS) expect(Object.values(SUPPRESSION_RENDERERS).some((table) => table[reason] !== undefined), reason).toBe(true);
    const recovery = compile("position", { kind: "invalid_fallback", reason: "malformed" });
    expect(recovery.suppressed[0]).toEqual({ kind: "preference_recovery", reason: "malformed" });
    expect(renderSuppression(recovery.suppressed[0]!, "position")).toBe("Your saved help settings could not be read, so this workflow's default is shown.");
    expect(recovery.preset).toBe("quiet");
    expect(compiledPresetDisclosure(compile("position", named("guided")))).toEqual({ pillLabel: "Guide me", headline: presetDeclaration("guided").promise, sentences: [] });
    expect(compiledPresetDisclosure(compile("match", { kind: "explicit", preset: "quiet", overrides: { arrows: "sight" }, moduleOverrides: { include: [], exclude: [] } })).sentences).toEqual(["Arrows is limited to off in a match."]);
  });

  it("preset activation: each named preset turns on its own modules by default in every ordinary context", () => {
    for (const context of ORDINARY) {
      const policy = workflowContextPolicy(context);
      const unset = compile(context, { kind: "unset" });
      expect(unset.preset).toBe(policy.defaultPreset);
      expect(unset.displayMode).toBe("named");
      for (const preset of policy.allowedPresets) {
        const result = compile(context, named(preset));
        expect(result.modules).toEqual(MODULE_IDS.filter((id) => presetDeclaration(preset).modules.includes(id) && policy.moduleCeiling.includes(id)));
        expect(result.config).toEqual({ version: 4, ...presetDeclaration(preset).config });
        expect(result.suppressed).toEqual([]);
      }
    }
    expect(compile("onramp", { kind: "unset" }).modules).toEqual(["rules_floor", "sight_on_request", "postcommit_nudge", "structure_nudge", "theory_breadcrumb", "guided_hint", "compare_coach"]);
  });

  it("D1639 (proposed): the per-context hint ceiling is preset ∩ context ∩ access and needs guided_hint", () => {
    expect(hintCeiling({ preset: "guided", context: "position", role: "solo", seatedInContest: false, modules: ["guided_hint"] })).toBe("distance");
    expect(hintCeiling({ preset: "guided", context: "match", role: "solo", seatedInContest: false, modules: ["guided_hint"] })).toBe("off");
    expect(hintCeiling({ preset: "support", context: "position", role: "spectator", seatedInContest: false, modules: ["guided_hint"] })).toBe("off");
    expect(hintCeiling({ preset: "guided", context: "position", role: "solo", seatedInContest: false, modules: ["rules_floor"] })).toBe("off");
    expect(compile("onramp", { kind: "unset" }).hintCeiling).toEqual({ rung: "distance", validation: "proposed", ruling: "D1639" });
    expect(compile("position", named("quiet")).hintCeiling.rung).toBe("off");
  });

  it("finding (owner-shaped, not changed): the match clamp still applies to a reviewing viewer after the session", () => {
    // §3's table says a seated contest shows the rules floor "pre-terminal"; the literal clamp has no
    // terminal arm, so a post-outcome reviewing grant in a match-derived run stays at the floor.
    expect(permittedAssistance({ workflowContext: "match", deliveryOpen: true, role: "spectator", seatedInContest: false, reviewing: true }).humanSplit).toBe("locked_off");
  });

  it("sha256Hex matches the FIPS vectors", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex("a".repeat(1000))).toBe("41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3");
  });
});
