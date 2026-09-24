import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ProviderRegistry, ProviderUnavailableError, classifyHttpStatus, type ProviderCacheInventory } from "./provider-health.js";
import { MANUAL_TIMERS, driveTo, testClock, testRegistry } from "./provider-health.test-support.js";

function snapshotOf(registry: ProviderRegistry, instanceId: string) {
  return registry.snapshot().providers.find((row) => row.instanceId === instanceId)!;
}

function availabilityOf(registry: ProviderRegistry, operation: Parameters<ProviderRegistry["operationAvailability"]>[0]) {
  return registry.operationAvailability(operation);
}

class TestInventory implements ProviderCacheInventory {
  entries: { generation: string; expiresAt: number }[] = [];
  #revision = 0;
  add(generation: string, expiresAt: number): void { this.entries.push({ generation, expiresAt }); this.#revision += 1; }
  clear(): void { this.entries = []; this.#revision += 1; }
  validExactEntries(now: number, generation: string): number { return this.entries.filter((entry) => entry.generation === generation && now < entry.expiresAt).length; }
  revision(): number { return this.#revision; }
  invalidateExcept(generation: string | null): void { this.entries = this.entries.filter((entry) => entry.generation === generation); this.#revision += 1; }
}

describe("provider registry configuration (criterion 1, 9)", () => {
  it("parses configuration against the declaration tuple before construction", () => {
    expect(() => new ProviderRegistry({ configured: [{ instanceId: "stockfish-cloud" as never, implementation: "uci_sidecar", endpoint: "x", identity: "y" }] })).toThrow(/Unknown provider instance/u);
    expect(() => new ProviderRegistry({ configured: [{ instanceId: "maia-inference", implementation: "lichess_http", endpoint: "x", identity: "y" }] })).toThrow(/does not admit/u);
    expect(() => new ProviderRegistry({ configured: [{ instanceId: "maia-inference", implementation: "uci_sidecar", endpoint: "x", identity: "y" }, { instanceId: "maia-inference", implementation: "uci_sidecar", endpoint: "x", identity: "y" }] })).toThrow(/twice/u);
    expect(() => new ProviderRegistry({ configured: [{ instanceId: "explorer-primary", implementation: "lichess_http", endpoint: "https://explorer?token=secret", identity: "y" }] })).toThrow(/query/u);
  });

  it("derives a distinct generation per behavior-affecting configuration and never from a caller string", async () => {
    const remote = await testRegistry({ "tablebase-primary": "unverified" });
    const local = await testRegistry({ "tablebase-primary": "unverified" }, { implementations: { "tablebase-primary": "local_service" } });
    expect(remote.generation("tablebase-primary")).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(local.generation("tablebase-primary")).not.toBe(remote.generation("tablebase-primary"));
    expect(snapshotOf(local, "tablebase-primary")).toMatchObject({ implementation: "local_service" });
    expect(Object.keys(ProviderRegistry.prototype)).not.toContain("setGeneration");
  });
});

describe("state machine (criterion 2)", () => {
  it("configuration alone is not_configured or unverified; only a real outcome makes available", async () => {
    const registry = await testRegistry({ "external-voice": "unverified", "stockfish-play": "unverified" });
    expect(snapshotOf(registry, "external-tts")).toEqual({ instanceId: "external-tts", familyId: "tts", state: "not_configured" });
    expect(snapshotOf(registry, "external-voice")).toMatchObject({ state: "unverified", retryAfterMs: null });
    expect(availabilityOf(registry, "render.voice")).toEqual({ state: "requestable_unverified", instanceIds: ["external-voice"] });
    // The first real learner request is admitted without a probe, and its outcome decides the state.
    const ticket = await registry.admit("render.voice");
    registry.settle(ticket, { kind: "success" });
    expect(snapshotOf(registry, "external-voice")).toMatchObject({ state: "available", reason: null });
    registry.recordHandshake("stockfish-play");
    expect(snapshotOf(registry, "stockfish-play").state).toBe("available");
  });

  it("an unverified provider can also fail its first real request", async () => {
    const registry = await testRegistry({ "external-voice": "unverified" });
    const ticket = await registry.admit("render.voice");
    registry.settle(ticket, { kind: "failure", reason: "authentication" });
    expect(snapshotOf(registry, "external-voice")).toMatchObject({ state: "unavailable", reason: "authentication", retryAfterMs: null, cacheScope: "none" });
    // Authentication stays open until generation/configuration change or an explicit operator retry.
    await expect(registry.admit("render.voice")).rejects.toBeInstanceOf(ProviderUnavailableError);
    const operator = await registry.admit("render.voice", { operatorRetry: true });
    registry.settle(operator, { kind: "success" });
    expect(snapshotOf(registry, "external-voice").state).toBe("available");
  });

  it("repeat opens inside five minutes need two consecutive successes; an intervening failure resets", async () => {
    const clock = testClock();
    const registry = await testRegistry({ "maia-inference": "available" }, { clock });
    await driveTo(registry, "maia-inference", { failed: "timeout" });
    clock.advance(5_000);
    await driveTo(registry, "maia-inference", { failed: "timeout" });
    clock.advance(15_000);
    let ticket = await registry.admit("opponent.maia_inference");
    registry.settle(ticket, { kind: "success" });
    expect(snapshotOf(registry, "maia-inference")).toMatchObject({ state: "recovering", priorReason: "timeout", consecutiveSuccesses: 1, requiredSuccesses: 2 });
    ticket = await registry.admit("opponent.maia_inference");
    registry.settle(ticket, { kind: "failure", reason: "timeout" });
    expect(snapshotOf(registry, "maia-inference").state).toBe("unavailable");
    clock.advance(60_000);
    ticket = await registry.admit("opponent.maia_inference");
    registry.settle(ticket, { kind: "success" });
    expect(snapshotOf(registry, "maia-inference").state).toBe("recovering");
    ticket = await registry.admit("opponent.maia_inference");
    registry.settle(ticket, { kind: "success" });
    expect(snapshotOf(registry, "maia-inference").state).toBe("available");
  });

  it("two transient opens more than five minutes apart stay independent", async () => {
    const clock = testClock();
    const registry = await testRegistry({ "maia-inference": "available" }, { clock });
    await driveTo(registry, "maia-inference", { failed: "network" });
    clock.advance(6_000);
    let ticket = await registry.admit("opponent.maia_inference");
    registry.settle(ticket, { kind: "success" });
    clock.advance(301_000);
    await driveTo(registry, "maia-inference", { failed: "network" });
    clock.advance(6_000);
    ticket = await registry.admit("opponent.maia_inference");
    registry.settle(ticket, { kind: "success" });
    expect(snapshotOf(registry, "maia-inference").state).toBe("available");
  });

  it("caller cancellation neither heals nor damages provider health (criterion 4)", async () => {
    const registry = await testRegistry({ "external-voice": "unverified" });
    const ticket = await registry.admit("render.voice");
    registry.settle(ticket, { kind: "cancelled", by: "caller" });
    expect(snapshotOf(registry, "external-voice").state).toBe("unverified");
  });

  it("stockfish-play and stockfish-analysis fail and recover independently (criterion 1)", async () => {
    const registry = await testRegistry({ "stockfish-play": "available", "stockfish-analysis": "available" });
    const sink = registry.engineLifecycleSink({ "stockfish-play": "stockfish-play", "stockfish-analysis": "stockfish-analysis" });
    sink({ engineId: "stockfish-analysis", kind: "failed", reason: "process_exit" });
    expect(availabilityOf(registry, "evidence.stockfish_analysis")).toMatchObject({ state: "unavailable", reason: "process_exit" });
    expect(availabilityOf(registry, "opponent.stockfish_play").state).toBe("available");
    sink({ engineId: "stockfish-play", kind: "starting" });
    sink({ engineId: "stockfish-play", kind: "ready" });
    expect(availabilityOf(registry, "evidence.stockfish_analysis").state).toBe("unavailable");
  });

  it("reading a snapshot never refreshes checkedAt (criterion 12)", async () => {
    const clock = testClock();
    const registry = await testRegistry({ "external-voice": "available" }, { clock });
    const before = snapshotOf(registry, "external-voice");
    clock.advance(10_000);
    registry.snapshot();
    expect(snapshotOf(registry, "external-voice")).toEqual(before);
  });
});

describe("generation change (criterion 9, 19)", () => {
  it("a supervisor restart moves to a new generation, invalidates caches, and discards a late old-generation result", async () => {
    const registry = await testRegistry({ "maia-inference": "available" });
    const inventory = new TestInventory();
    registry.registerCacheInventory("maia-inference", inventory);
    const oldGeneration = registry.generation("maia-inference")!;
    inventory.add(oldGeneration, Number.POSITIVE_INFINITY);
    const ticket = await registry.admit("opponent.maia_inference");
    const sink = registry.engineLifecycleSink({ "maia-5m": "maia-inference" });
    sink({ engineId: "maia-5m", kind: "starting" });
    expect(registry.generation("maia-inference")).not.toBe(oldGeneration);
    expect(inventory.entries).toEqual([]);
    expect(snapshotOf(registry, "maia-inference")).toMatchObject({ state: "unavailable", reason: "startup" });
    // The late result of the old generation cannot heal the new one.
    expect(registry.isCurrentTicket(ticket)).toBe(false);
    expect(registry.settle(ticket, { kind: "success" })).toEqual({ current: false });
    expect(snapshotOf(registry, "maia-inference").state).toBe("unavailable");
    sink({ engineId: "maia-5m", kind: "ready" });
    expect(snapshotOf(registry, "maia-inference").state).toBe("available");
  });
});

describe("settlement authority (criterion 8)", () => {
  it("refuses a caller-authored ticket and a second settlement", async () => {
    const registry = await testRegistry({ "external-voice": "unverified" });
    const forged = { operation: "render.voice", instanceId: "external-voice", generation: registry.generation("external-voice")!, admittedAtMonotonic: 0, deadlineMonotonic: 1 } as const;
    expect(() => registry.settle(forged, { kind: "success" })).toThrow(/issued by this registry/u);
    const ticket = await registry.admit("render.voice");
    const other = await testRegistry({ "external-voice": "unverified" });
    expect(() => other.settle(ticket, { kind: "success" })).toThrow(/issued by this registry/u);
    registry.settle(ticket, { kind: "success" });
    expect(() => registry.settle(ticket, { kind: "success" })).toThrow(/settles once/u);
  });
});

describe("shared backoff (criterion 6, 7, 15)", () => {
  it("a Lichess 429 blocks both Explorer and tablebase for at least 60 s while their snapshots stay distinct", async () => {
    const clock = testClock();
    const registry = await testRegistry({ "explorer-primary": "available", "tablebase-primary": "available" }, { clock });
    const ticket = await registry.admit("evidence.explorer_query");
    registry.settle(ticket, classifyHttpStatus(429, null));
    expect(availabilityOf(registry, "evidence.tablebase_probe")).toMatchObject({ state: "temporarily_blocked", reason: "upstream_backoff", retryAfterMs: 60_000 });
    expect(availabilityOf(registry, "evidence.explorer_query")).toMatchObject({ state: "temporarily_blocked" });
    expect(snapshotOf(registry, "tablebase-primary").state).toBe("available");
    expect(snapshotOf(registry, "explorer-primary")).toMatchObject({ state: "unavailable", reason: "rate_limited" });
    await expect(registry.admit("evidence.tablebase_probe")).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    clock.advance(60_000);
    const tablebase = await registry.admit("evidence.tablebase_probe");
    registry.settle(tablebase, { kind: "success" });
  });

  it("honors a longer valid Retry-After instead of collapsing it to the floor", async () => {
    const registry = await testRegistry({ "explorer-primary": "available", "tablebase-primary": "available" });
    const ticket = await registry.admit("evidence.explorer_query");
    registry.settle(ticket, classifyHttpStatus(429, "120"));
    expect(availabilityOf(registry, "evidence.tablebase_probe")).toMatchObject({ state: "temporarily_blocked", retryAfterMs: 120_000 });
  });

  it("escalates repeated transient failures 5 s, 15 s, 60 s and resets on success", async () => {
    const clock = testClock();
    const registry = await testRegistry({ "tablebase-primary": "available" }, { clock });
    const blocked = (): number => { const value = availabilityOf(registry, "evidence.tablebase_probe"); return value.state === "temporarily_blocked" ? value.retryAfterMs : 0; };
    for (const expected of [5_000, 15_000, 60_000, 60_000]) {
      const ticket = await registry.admit("evidence.tablebase_probe");
      registry.settle(ticket, { kind: "failure", reason: "network" });
      expect(blocked()).toBe(expected);
      clock.advance(expected);
    }
    const ticket = await registry.admit("evidence.tablebase_probe");
    registry.settle(ticket, { kind: "success" });
    const next = await registry.admit("evidence.tablebase_probe");
    registry.settle(next, { kind: "failure", reason: "network" });
    expect(blocked()).toBe(5_000);
  });

  it("claims are single-flight, token-bound and expire; a stale claim cannot clear its successor", async () => {
    const registry = await testRegistry({ "explorer-primary": "available" });
    const coordinator = registry.coordinator("lichess-api")!;
    expect(coordinator.belongsTo(registry)).toBe(true);
    expect(registry.coordinator("external-voice-api")).toBeUndefined();
    const first = coordinator.acquire(1_000, "image", 100);
    expect(first.kind).toBe("claim");
    expect(coordinator.acquire(1_050, "image", 100).kind).toBe("claimed");
    if (first.kind !== "claim") throw new Error("expected a claim");
    // Expiry admits exactly one successor; the expired token can neither renew nor settle it.
    const successor = coordinator.acquire(1_200, "image", 100);
    expect(successor.kind).toBe("claim");
    expect(() => coordinator.renew(first.token, "image", 1_210, 100)).toThrow(/stale/u);
    expect(() => coordinator.settle(first.token, "image", 1_210, { kind: "success" })).toThrow(/stale/u);
    if (successor.kind !== "claim") throw new Error("expected a claim");
    expect(() => coordinator.settle(successor.token, "other-image", 1_210, { kind: "success" })).toThrow(/stale/u);
    coordinator.renew(successor.token, "image", 1_250, 100);
    coordinator.settle(successor.token, "image", 1_260, { kind: "success" });
    expect(coordinator.acquire(1_270, "image", 100).kind).toBe("claim");
  });
});

describe("cache inventory join (criterion 12)", () => {
  it("is cache-only while a current exact row exists and unavailable the moment the last one leaves", async () => {
    const clock = testClock();
    const registry = await testRegistry({ "maia-inference": "available" }, { clock });
    const inventory = new TestInventory();
    registry.registerCacheInventory("maia-inference", inventory);
    inventory.add(registry.generation("maia-inference")!, clock.now + 10_000);
    inventory.add("sha256:stale-generation", clock.now + 10_000);
    await driveTo(registry, "maia-inference", { failed: "process_exit" });
    const cached = snapshotOf(registry, "maia-inference");
    expect(cached).toMatchObject({ state: "degraded_cached_only", cacheScope: "exact_request", validExactEntries: 1 });
    expect(availabilityOf(registry, "opponent.maia_inference").state).toBe("conditional_exact_cache");
    clock.advance(10_000);
    const expired = snapshotOf(registry, "maia-inference");
    expect(expired).toMatchObject({ state: "unavailable", cacheScope: "none" });
    expect((expired as { checkedAt: string }).checkedAt).toBe((cached as { checkedAt: string }).checkedAt);
  });
});

describe("snapshot currency and release receipts (criterion 9, 13)", () => {
  it("equal read-only snapshots are independently current; a transition rejects both", async () => {
    const registry = await testRegistry({ "external-voice": "unverified", "maia-inference": "available" });
    const first = registry.snapshot();
    const second = registry.snapshot();
    expect(registry.isCurrent(first)).toBe(true);
    expect(registry.isCurrent(second)).toBe(true);
    const ticket = await registry.admit("render.voice");
    registry.settle(ticket, { kind: "success" });
    expect(registry.isCurrent(first)).toBe(false);
    expect(registry.isCurrent(second)).toBe(false);
    const clone = JSON.parse(JSON.stringify(registry.snapshot())) as ReturnType<ProviderRegistry["snapshot"]>;
    expect(registry.isCurrent(clone)).toBe(false);
  });

  it("issues a receipt only over a current, fixture-free snapshot and validates it by registry, revision and generation image", async () => {
    const registry = await testRegistry({ "maia-inference": "available", "stockfish-analysis": "available" });
    const receipt = registry.releaseReceipt(registry.snapshot());
    expect(registry.validateReleaseReceipt(receipt)).toBe("valid");
    expect(receipt.generationImage.map((row) => row.instanceId)).toEqual(["maia-inference", "stockfish-analysis"]);
    expect(registry.validateReleaseReceipt({ ...receipt })).toBe("forged");
    const other = await testRegistry({ "maia-inference": "available", "stockfish-analysis": "available" });
    expect(other.validateReleaseReceipt(receipt)).toBe("forged");
    registry.engineLifecycleSink({ "maia-5m": "maia-inference" })({ engineId: "maia-5m", kind: "starting" });
    expect(registry.validateReleaseReceipt(receipt)).toBe("stale");
    const fixture = await testRegistry({ "maia-inference": "available" }, { implementations: { "maia-inference": "local_fixture" } });
    expect(() => fixture.releaseReceipt(fixture.snapshot())).toThrow(/local_fixture/u);
    const stale = registry.snapshot();
    registry.engineLifecycleSink({ "maia-5m": "maia-inference" })({ engineId: "maia-5m", kind: "ready" });
    expect(() => registry.releaseReceipt(stale)).toThrow(/current snapshot/u);
  });
});

describe("exchange availability (bot-policy D7)", () => {
  it("serves Maia pages only when the running generation carries its container identity", async () => {
    let captured = false;
    const registry = await testRegistry({ "maia-inference": "available", "stockfish-analysis": "available" }, { exchangeArtifact: (instanceId) => instanceId !== "maia-inference" || captured });
    expect(registry.exchangeOperationAvailability("maia.policy_page@1")).toEqual({ state: "unavailable", instanceIds: ["maia-inference"], reason: "protocol" });
    // Opponent selection through the supervisor does not need the artifact and stays available.
    expect(registry.operationAvailability("opponent.maia_inference").state).toBe("available");
    captured = true;
    expect(registry.exchangeOperationAvailability("maia.policy_page@1").state).toBe("available");
    expect(registry.exchangeOperationAvailability("stockfish.legal_root_table@1").instanceIds).toEqual(["stockfish-analysis"]);
  });
});

describe("run(): one deadline, typed unavailable (criterion 3, 5)", () => {
  it("a refused admission returns the typed outcome without calling the provider", async () => {
    const registry = await testRegistry({ "maia-inference": { failed: "process_exit" } });
    let called = false;
    await expect(registry.run("opponent.maia_inference", async () => { called = true; return 1; }, () => ({ kind: "failure", reason: "network" }))).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", details: { operation: "opponent.maia_inference", availability: { state: "unavailable", reason: "process_exit" } } });
    expect(called).toBe(false);
  });

  it("classifies a thrown provider error, settles it and surfaces the typed outcome", async () => {
    const registry = new ProviderRegistry({ configured: [{ instanceId: "external-tts", implementation: "external_http", endpoint: "tts", identity: "tts" }], timers: MANUAL_TIMERS });
    await expect(registry.run("render.speech", async () => { throw new Error("socket hang up"); }, () => ({ kind: "failure", reason: "network" }))).rejects.toBeInstanceOf(ProviderUnavailableError);
    expect(snapshotOf(registry, "external-tts")).toMatchObject({ state: "unavailable", reason: "network" });
  });
});

describe("source guards", () => {
  it("deletes the fixed 60-second Maia wait and every per-attempt voice deadline reset (criterion 5)", () => {
    const selector = readFileSync(new URL("./opponent-selector.ts", import.meta.url), "utf8");
    expect(selector).not.toMatch(/timeoutMs:\s*60_000/u);
    const guidance = readFileSync(new URL("./guidance.ts", import.meta.url), "utf8");
    const renderVoice = guidance.slice(guidance.indexOf("export async function renderVoice"));
    expect(renderVoice.slice(0, renderVoice.indexOf("\n}\n"))).toMatch(/AbortSignal\.timeout\(Math\.max\(1, budgetMs\)\)/u);
    expect(renderVoice.slice(renderVoice.indexOf("for (let attempt"), renderVoice.indexOf("\n}\n"))).not.toMatch(/setTimeout|AbortSignal\.timeout/u);
  });

  it("speech never calls external voice again ([[D2576]])", () => {
    const rest = readFileSync(new URL("./rest.ts", import.meta.url), "utf8");
    const start = rest.indexOf('route.action === "speech"');
    const speech = rest.slice(start, rest.indexOf('route.action === "share"', start));
    expect(speech).not.toMatch(/renderVoice|voiceProvider\.render/u);
    expect(speech).toMatch(/displayedVoice\.recall/u);
  });
});
