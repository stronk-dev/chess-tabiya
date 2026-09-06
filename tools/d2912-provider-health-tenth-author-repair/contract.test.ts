import { describe, expect, test } from "vitest";

import {
  BackoffCoordinator,
  ExactCache,
  ExchangeAuthority,
  ProviderRegistry,
  assertProviderReleaseReceipt,
  cacheKey,
  compileApplications,
  selectProfileAvailability,
} from "./contract.js";

function configured(instanceId: string, implementation: string, generation = "g1") {
  return { instanceId, implementation, generation };
}

describe("provider-health tenth author repair", () => {
  test("D2912 conditional cache inventory never impersonates an exact request hit", () => {
    const registry = new ProviderRegistry([configured("external-voice", "external_http")]);
    new BackoffCoordinator(registry, "external-voice-api");
    const exchange = new ExchangeAuthority();
    const cachedRequest = exchange.request("external_voice.render@1", "external_http", "g1", "cached");
    const uncachedRequest = exchange.request("external_voice.render@1", "external_http", "g1", "uncached");
    const voice = compileApplications().find((row) => row.operationId === "render.voice")!;
    const cache = new ExactCache<string>(registry);
    cache.put(cacheKey(registry, voice, cachedRequest, "cached-key"), exchange.success(cachedRequest, "voice", "response"), 100, 0);
    registry.failure(cachedRequest, exchange.failure(cachedRequest, "timeout"), 1);
    const snapshot = registry.snapshot(1);

    expect(selectProfileAvailability(snapshot, "render.voice", 1)).toMatchObject({ state: "conditional_exact_cache" });
    expect(cache.resolve(cacheKey(registry, voice, uncachedRequest, "uncached-key"), 1)).toEqual({ kind: "miss" });
  });

  test("D2913 release authority is current only against an injected monotonic sample", () => {
    const registry = new ProviderRegistry([configured("external-voice", "external_http")]);
    new BackoffCoordinator(registry, "external-voice-api");
    const exchange = new ExchangeAuthority();
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    registry.failure(request, exchange.failure(request, "timeout"), 0);
    const snapshot = registry.snapshot(0);
    const receipt = registry.releaseReceipt(snapshot, 0);

    expect(() => assertProviderReleaseReceipt(receipt, 0)).not.toThrow();
    expect(() => assertProviderReleaseReceipt(receipt, 5_001)).toThrow(/SNAPSHOT_STALE_OR_CROSSED/);
  });

  test("D2914 one group projection drives both admission and sibling availability", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const initial = registry.snapshot(0);
    const generations = registry.generationSet(initial, "lichess-api");
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new Error("fixture");
    coordinator.settle(1, generations, claim.token, { kind: "rate_limited", retryAfterMs: null });
    const current = registry.snapshot(1);

    expect(coordinator.acquire(1, registry.generationSet(current, "lichess-api"), 100)).toEqual({ kind: "blocked", retryAfterMs: 60_000 });
    expect(selectProfileAvailability(current, "evidence.tablebase_probe", 1)).toMatchObject({
      state: "temporarily_blocked",
      retryAfterMs: 60_000,
    });
  });

  test("D2917 recovering remains a distinct operation-availability arm", () => {
    const registry = new ProviderRegistry([configured("external-voice", "external_http")]);
    new BackoffCoordinator(registry, "external-voice-api");
    const exchange = new ExchangeAuthority();
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    const failure = exchange.failure(request, "timeout");
    registry.failure(request, failure, 0);
    registry.failure(request, failure, 1);
    registry.success(request, exchange.success(request, "voice", "response"), 2);

    const snapshot = registry.snapshot(2);
    expect(selectProfileAvailability(snapshot, "render.voice", 2)).toMatchObject({
      state: "recovering",
      instanceId: "external-voice",
    });
  });

  test("D2915 issuance and validation share one canonical generation image", () => {
    const registry = new ProviderRegistry([
      configured("tablebase-primary", "lichess_http"),
      configured("explorer-primary", "lichess_http"),
    ]);
    new BackoffCoordinator(registry, "lichess-api");
    const snapshot = registry.snapshot(0);
    const receipt = registry.releaseReceipt(snapshot, 0);

    expect(receipt.generations.map((row) => row.instanceId)).toEqual(["explorer-primary", "tablebase-primary"]);
    expect(() => assertProviderReleaseReceipt(receipt, 0)).not.toThrow();
  });

  test("D2918 every configured backoff group must have one snapshot projection", () => {
    const registry = new ProviderRegistry([configured("explorer-primary", "lichess_http")]);
    expect(() => registry.snapshot(0)).toThrow(/BACKOFF_COORDINATOR_MISSING/);

    new BackoffCoordinator(registry, "lichess-api");
    expect(registry.snapshot(0).backoffGroups).toEqual([
      { group: "lichess-api", state: "available", retryAfterMs: null },
    ]);
  });

  test("D2919 shared transient backoff retains the declared 5/15/60 sequence", () => {
    const registry = new ProviderRegistry([configured("explorer-primary", "lichess_http")]);
    const coordinator = new BackoffCoordinator(registry, "lichess-api");

    const firstSnapshot = registry.snapshot(0);
    const firstGenerations = registry.generationSet(firstSnapshot, "lichess-api");
    const firstClaim = coordinator.acquire(0, firstGenerations, 100);
    if (firstClaim.kind !== "acquired") throw new Error("fixture");
    coordinator.settle(1, firstGenerations, firstClaim.token, { kind: "transient_failure" });

    const secondSnapshot = registry.snapshot(5_001);
    const secondGenerations = registry.generationSet(secondSnapshot, "lichess-api");
    const secondClaim = coordinator.acquire(5_001, secondGenerations, 100);
    if (secondClaim.kind !== "acquired") throw new Error("fixture");
    coordinator.settle(5_002, secondGenerations, secondClaim.token, { kind: "transient_failure" });

    const blocked = registry.snapshot(5_002);
    expect(selectProfileAvailability(blocked, "evidence.explorer_query", 5_002)).toMatchObject({
      state: "temporarily_blocked",
      retryAfterMs: 15_000,
    });
  });

  test("the repaired checkpoint composes cache, group, time and release authority", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
      configured("external-voice", "external_http"),
    ]);
    new BackoffCoordinator(registry, "lichess-api");
    new BackoffCoordinator(registry, "external-voice-api");
    const snapshot = registry.snapshot(0);
    const receipt = registry.releaseReceipt(snapshot, 0);
    expect(selectProfileAvailability(snapshot, "evidence.explorer_query", 0)).toMatchObject({ state: "requestable_unverified" });
    expect(() => assertProviderReleaseReceipt(receipt, 0)).not.toThrow();
  });
});
