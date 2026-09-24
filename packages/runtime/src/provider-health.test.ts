import { describe, expect, it } from "vitest";

import {
  APPLICATION_PROVIDER_EXECUTION,
  APPLICATION_PROVIDER_OPERATION_IDS,
  F1_PROVIDER_PRODUCERS,
  PROVIDER_FAMILY_IDS,
  PROVIDER_INSTANCE_DECLARATIONS,
  PROVIDER_INSTANCE_IDS,
  compileApplicationProviderExecution,
  combineOperationAvailability,
  parseProviderHealthCapabilities,
  parseProviderHealthSnapshot,
  providerAvailabilityNotice,
  providerBackoffGroupMembers,
  serverAvailabilityFromProviderHealth,
  type ProviderOperationAvailability,
} from "./provider-health.js";

const GEN = `sha256:${"c".repeat(64)}`;
const AT = "2026-09-24T12:00:00.000Z";

function wire(overrides: { providers?: unknown[]; operations?: unknown[]; policyModes?: unknown[] } = {}): Record<string, unknown> {
  const providers = PROVIDER_INSTANCE_DECLARATIONS.map((row) => ({ instanceId: row.instanceId, familyId: row.familyId, state: "not_configured" }));
  const operations = APPLICATION_PROVIDER_EXECUTION.map((row) => ({ operation: row.operation, availability: { state: "unavailable", instanceIds: [row.instanceId], reason: "not_configured" } }));
  const modes: Record<string, string[]> = { human_common: ["maia-inference"], strong_engine: ["stockfish-play"], theory_strict: ["maia-inference"], perfect_tablebase: ["tablebase-primary"], practical_resistance: ["maia-inference", "tablebase-primary"] };
  const policyModes = Object.entries(modes).map(([mode, instanceIds]) => ({ mode, availability: { state: "unavailable", instanceIds, reason: "not_configured" } }));
  return { generatedAt: AT, providers: overrides.providers ?? providers, operations: overrides.operations ?? operations, policyModes: overrides.policyModes ?? policyModes };
}

describe("provider-health declarations (criterion 1, 14)", () => {
  it("derives six families, seven instances and ten application operations from one tuple", () => {
    expect(PROVIDER_FAMILY_IDS).toEqual(["stockfish", "maia", "tablebase", "explorer", "voice", "tts"]);
    expect(PROVIDER_INSTANCE_IDS).toEqual(["stockfish-play", "stockfish-analysis", "maia-inference", "tablebase-primary", "explorer-primary", "external-voice", "external-tts"]);
    expect(APPLICATION_PROVIDER_OPERATION_IDS).toHaveLength(10);
    expect(new Set(APPLICATION_PROVIDER_OPERATION_IDS).size).toBe(10);
    expect(providerBackoffGroupMembers("lichess-api")).toEqual(["tablebase-primary", "explorer-primary"]);
    expect(providerBackoffGroupMembers("external-voice-api")).toEqual(["external-voice"]);
  });

  it("maps the four provider-backed F1 producers exactly once and opponent Stockfish only to stockfish-play", () => {
    expect(F1_PROVIDER_PRODUCERS).toEqual({ "live.stockfish": "stockfish-analysis", "live.syzygy": "tablebase-primary", "human.maia": "maia-inference", "human.explorer": "explorer-primary" });
    expect(APPLICATION_PROVIDER_EXECUTION.filter((row) => row.operation === "opponent.stockfish_play").map((row) => row.instanceId)).toEqual(["stockfish-play"]);
    expect(APPLICATION_PROVIDER_EXECUTION.find((row) => row.operation === "render.speech")).toMatchObject({ instanceId: "external-tts", fallback: "browser_speech_or_text" });
    expect(APPLICATION_PROVIDER_EXECUTION.find((row) => row.operation === "review.reasoning")).toMatchObject({ instanceId: "external-voice", fallback: "none" });
    // Each operation has exactly one provider stage and a compiled consumer-budget deadline.
    for (const row of APPLICATION_PROVIDER_EXECUTION) {
      expect(Object.keys(row).sort()).toEqual(["consumer", "consumerBudgetMs", "exchangeOperation", "fallback", "instanceId", "operation", "stageId"]);
      expect(row.consumerBudgetMs).toBeGreaterThan(0);
      expect(row.consumerBudgetMs).toBeLessThanOrEqual(4_000);
    }
  });

  it("refuses a duplicate, a crossed instance, an unknown consumer and an illegal fallback at compile time", () => {
    const base = APPLICATION_PROVIDER_EXECUTION.map(({ consumerBudgetMs: _, ...row }) => row);
    expect(() => compileApplicationProviderExecution([...base, base[0]!])).toThrow(/duplicate/u);
    expect(() => compileApplicationProviderExecution([{ ...base[0]!, stageId: "select:maia-inference" }])).toThrow(/does not name its instance/u);
    expect(() => compileApplicationProviderExecution([{ ...base[0]!, consumer: "made.up" }])).toThrow(/unknown consumer/u);
    expect(() => compileApplicationProviderExecution([{ ...base[5]!, fallback: "browser_speech_or_text" }])).toThrow(/fallback|speech/u);
  });
});

describe("the strict provider-health wire parser (criterion 2, 17)", () => {
  it("round-trips a total snapshot and preserves requestable_unverified, recovering and temporarily_blocked", () => {
    const providers = PROVIDER_INSTANCE_DECLARATIONS.map((row) => row.instanceId === "external-voice"
      ? { instanceId: row.instanceId, familyId: row.familyId, state: "unverified", implementation: "external_http", generation: GEN, retryAfterMs: null }
      : row.instanceId === "maia-inference"
        ? { instanceId: row.instanceId, familyId: row.familyId, state: "recovering", implementation: "uci_sidecar", generation: GEN, priorReason: "timeout", consecutiveSuccesses: 1, requiredSuccesses: 2, checkedAt: AT, lastSuccessAt: AT, lastFailureAt: AT }
        : { instanceId: row.instanceId, familyId: row.familyId, state: "not_configured" });
    const value = wire({ providers });
    const operations = value.operations as { operation: string; availability: unknown }[];
    operations.find((row) => row.operation === "render.voice")!.availability = { state: "requestable_unverified", instanceIds: ["external-voice"] };
    operations.find((row) => row.operation === "opponent.maia_inference")!.availability = { state: "recovering", instanceIds: ["maia-inference"] };
    operations.find((row) => row.operation === "evidence.explorer_query")!.availability = { state: "temporarily_blocked", instanceIds: ["explorer-primary"], reason: "upstream_backoff", retryAfterMs: 60_000 };
    const parsed = parseProviderHealthCapabilities(JSON.parse(JSON.stringify(value)));
    expect(parsed.operations.find((row) => row.operation === "render.voice")!.availability.state).toBe("requestable_unverified");
    expect(parsed.operations.find((row) => row.operation === "opponent.maia_inference")!.availability.state).toBe("recovering");
    expect(parsed.operations.find((row) => row.operation === "evidence.explorer_query")!.availability).toEqual({ state: "temporarily_blocked", instanceIds: ["explorer-primary"], reason: "upstream_backoff", retryAfterMs: 60_000 });
  });

  it("rejects invented fields on not_configured, missing fields on outcome arms and illegal reason/cache combinations", () => {
    expect(() => parseProviderHealthSnapshot({ instanceId: "explorer-primary", familyId: "explorer", state: "not_configured", generation: GEN })).toThrow(/exactly/u);
    expect(() => parseProviderHealthSnapshot({ instanceId: "explorer-primary", familyId: "explorer", state: "available", implementation: "lichess_http", generation: GEN, reason: null, checkedAt: AT, lastSuccessAt: AT })).toThrow(/exactly|timestamp/u);
    expect(() => parseProviderHealthSnapshot({ instanceId: "explorer-primary", familyId: "explorer", state: "unavailable", implementation: "lichess_http", generation: GEN, reason: "network", retryAfterMs: 5000, cacheScope: "exact_request", checkedAt: AT, lastSuccessAt: null, lastFailureAt: AT })).toThrow(/none/u);
    expect(() => parseProviderHealthSnapshot({ instanceId: "explorer-primary", familyId: "explorer", state: "degraded_cached_only", implementation: "lichess_http", generation: GEN, reason: "network", retryAfterMs: 5000, cacheScope: "exact_request", validExactEntries: 0, cacheRevision: 3, checkedAt: AT, lastSuccessAt: null, lastFailureAt: AT })).toThrow(/at least one/u);
    expect(() => parseProviderHealthSnapshot({ instanceId: "explorer-primary", familyId: "maia", state: "not_configured" })).toThrow(/familyId/u);
    // A mock provider is published as local_fixture; it cannot be serialized as a real implementation it is not allowed.
    expect(() => parseProviderHealthSnapshot({ instanceId: "maia-inference", familyId: "maia", state: "unverified", implementation: "lichess_http", generation: GEN, retryAfterMs: null })).toThrow(/implementation/u);
  });

  it("fails the set-equality fixture on a server-only state, instance, mode, field or a serialized cached_exact_only", () => {
    expect(() => parseProviderHealthCapabilities({ ...wire(), extra: true })).toThrow(/exactly/u);
    expect(() => parseProviderHealthCapabilities(wire({ providers: (wire().providers as unknown[]).slice(1) }))).toThrow(/exactly once/u);
    expect(() => parseProviderHealthCapabilities(wire({ policyModes: [...(wire().policyModes as unknown[]), { mode: "plan_defense", availability: { state: "unavailable", instanceIds: ["maia-inference"], reason: "not_configured" } }] }))).toThrow();
    const operations = wire().operations as { operation: string; availability: unknown }[];
    operations[0]!.availability = { state: "cached_exact_only", instanceIds: ["stockfish-play"] };
    expect(() => parseProviderHealthCapabilities(wire({ operations }))).toThrow(/never serialized/u);
    const crossed = wire().operations as { operation: string; availability: unknown }[];
    crossed[0]!.availability = { state: "available", instanceIds: ["stockfish-analysis"] };
    expect(() => parseProviderHealthCapabilities(wire({ operations: crossed }))).toThrow(/declared population/u);
    const unknownState = wire().operations as { operation: string; availability: unknown }[];
    unknownState[0]!.availability = { state: "green", instanceIds: ["stockfish-play"] };
    expect(() => parseProviderHealthCapabilities(wire({ operations: unknownState }))).toThrow(/state/u);
  });
});

describe("learner projection (criterion 21, §10)", () => {
  it("gives provider-off, blocked, cache-only, recovering and ready five different notices", () => {
    const states: ProviderOperationAvailability[] = [
      { state: "unavailable", instanceIds: ["explorer-primary"], reason: "network" },
      { state: "unavailable", instanceIds: ["explorer-primary"], reason: "not_configured" },
      { state: "temporarily_blocked", instanceIds: ["explorer-primary"], reason: "upstream_backoff", retryAfterMs: 60_000 },
      { state: "conditional_exact_cache", instanceIds: ["explorer-primary"] },
      { state: "recovering", instanceIds: ["explorer-primary"] },
      { state: "requestable_unverified", instanceIds: ["explorer-primary"] },
    ];
    const notices = states.map((state) => providerAvailabilityNotice(state, "Human-game statistics"));
    expect(new Set(notices.map((notice) => notice.reason)).size).toBe(notices.length);
    expect(notices.map((notice) => notice.requestable)).toEqual([false, false, false, false, true, true]);
    expect(notices[0]!.retryable).toBe(true);
    expect(notices[1]!.retryable).toBe(false);
    expect(notices[1]!.notConfigured).toBe(true);
    // Provider-off is never worded as a domain answer.
    for (const notice of notices) expect(notice.reason).not.toMatch(/no games|outside (?:the )?tablebase/iu);
    expect(notices[5]!.label).toBe("Ready to try");
    expect(providerAvailabilityNotice({ state: "cached_exact_only", instanceIds: ["maia-inference"] }, "The opponent").reason).toBe("Using a saved response for this position.");
  });

  it("combines a two-operation mode as its least available member", () => {
    expect(combineOperationAvailability([{ state: "available", instanceIds: ["tablebase-primary"] }, { state: "unavailable", instanceIds: ["maia-inference"], reason: "process_exit" }])).toEqual({ state: "unavailable", instanceIds: ["maia-inference", "tablebase-primary"], reason: "process_exit" });
    expect(combineOperationAvailability([{ state: "temporarily_blocked", instanceIds: ["tablebase-primary"], reason: "upstream_backoff", retryAfterMs: 61_000 }, { state: "recovering", instanceIds: ["maia-inference"] }])).toMatchObject({ state: "temporarily_blocked", retryAfterMs: 61_000 });
  });

  it("derives the assistance availability receipt from live health, not configuration", () => {
    const value = parseProviderHealthCapabilities(wire());
    expect(serverAvailabilityFromProviderHealth(value).llm).toEqual({ state: "unavailable", reason: "not_configured" });
    expect(serverAvailabilityFromProviderHealth(undefined).explorer).toEqual({ state: "unavailable", reason: "not_configured" });
    const operations = wire().operations as { operation: string; availability: unknown }[];
    operations.find((row) => row.operation === "evidence.explorer_query")!.availability = { state: "unavailable", instanceIds: ["explorer-primary"], reason: "rate_limited" };
    const providers = (wire().providers as { instanceId: string }[]).map((row) => row.instanceId === "explorer-primary" ? { instanceId: "explorer-primary", familyId: "explorer", state: "unavailable", implementation: "lichess_http", generation: GEN, reason: "rate_limited", retryAfterMs: 60_000, cacheScope: "none", checkedAt: AT, lastSuccessAt: null, lastFailureAt: AT } : row);
    expect(serverAvailabilityFromProviderHealth(parseProviderHealthCapabilities(wire({ providers, operations }))).explorer).toEqual({ state: "failed", reason: "rate_limited" });
  });
});
