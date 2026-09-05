import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";

import {
  APPLICATION_DECLARATIONS,
  BackoffCoordinator,
  ExactCache,
  ExchangeAuthority,
  ProviderRegistry,
  assertProviderReleaseReceipt,
  cacheKey,
  compileApplications,
  selectProfileAvailability,
  settleOperation,
} from "./contract.js";

function configured(instanceId: string, implementation: string, generation = "g1") {
  return { instanceId, implementation, generation };
}

describe("provider-health eighth composed author repair", () => {
  test("D2846 configuration is closed and snapshots retain family plus implementation", () => {
    expect(() => new ProviderRegistry([configured("attacker", "local_fixture")])).toThrow(/CONFIG_INVALID/);
    expect(() => new ProviderRegistry([configured("maia-inference", "lichess_http")])).toThrow(/CONFIG_IMPLEMENTATION_INVALID/);
    const registry = new ProviderRegistry([configured("maia-inference", "local_service")]);
    expect(registry.snapshot(0).instances.find((row) => row.instanceId === "maia-inference")).toEqual({
      instanceId: "maia-inference", familyId: "maia", implementation: "local_service", generation: "g1", state: "unverified", retryAfterMs: null,
    });
  });

  test("D2847 generation sets are current, registry-owned and group-scoped", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
      configured("external-voice", "external_http"),
    ]);
    const other = new ProviderRegistry([configured("explorer-primary", "lichess_http", "other")]);
    const stale = registry.generationSet(registry.snapshot(0), "lichess-api");
    const crossed = other.generationSet(other.snapshot(0), "lichess-api");
    registry.changeGeneration("explorer-primary", "g2");
    const current = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    expect(coordinator.acquire(0, current, 100)).toMatchObject({ kind: "acquired" });
    expect(() => coordinator.acquire(1, stale, 100)).toThrow(/GENERATION_SET_STALE_OR_CROSSED/);
    expect(() => coordinator.acquire(1, crossed, 100)).toThrow(/GENERATION_SET_STALE_OR_CROSSED/);
    const voice = registry.generationSet(registry.snapshot(1), "external-voice-api");
    expect(() => coordinator.acquire(1, voice, 100)).toThrow(/GENERATION_SET_STALE_OR_CROSSED/);
  });

  test("D2848 a Lichess rate limit blocks both group members for at least sixty seconds", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"), configured("tablebase-primary", "lichess_http"),
    ]);
    const generations = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new Error("fixture");
    coordinator.settle(1, generations, claim.token, { kind: "rate_limited", retryAfterMs: null });
    expect(coordinator.acquire(2, generations, 100)).toEqual({ kind: "blocked", retryAfterMs: 59_999 });
    expect(coordinator.acquire(60_001, generations, 100)).toMatchObject({ kind: "acquired" });
  });

  test("D2849 exact cache returns value, original and current service receipt at full grain", () => {
    const registry = new ProviderRegistry([configured("external-voice", "external_http")]);
    const exchange = new ExchangeAuthority();
    const declaration = compileApplications().find((row) => row.operationId === "render.voice_story")!;
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    const delivery = exchange.success(request, "story", "response");
    const key = cacheKey(declaration, request, "key");
    const cache = new ExactCache<string>(registry);
    cache.put(key, delivery, 100, 0);
    expect(cache.resolve(key, 1)).toMatchObject({
      kind: "hit", value: "story", original: delivery,
      cacheServiceReceipt: { source: "retained_exact", cacheKeyDigest: "key", servedAtMonotonic: 1 },
    });
    const crossed = compileApplications().find((row) => row.operationId === "render.voice")!;
    expect(() => cacheKey(crossed, request, "key")).not.toThrow();
    expect(cacheKey(crossed, request, "key").applicationOperationId).not.toBe(key.applicationOperationId);
  });

  test("D2850 dead DAG axes are removed and the exact independent speech operation remains", () => {
    expect(APPLICATION_DECLARATIONS).toHaveLength(10);
    expect(APPLICATION_DECLARATIONS.every((row) => "stage" in row && !("stages" in row))).toBe(true);
    expect(APPLICATION_DECLARATIONS.some((row) => row.operationId === "render.speech" && row.stage.exchangeOperation === "external_tts.synthesize@1")).toBe(true);
  });

  test("D2851 one checkpoint exports outcomes, availability and current release authority", () => {
    const registry = new ProviderRegistry([configured("external-voice", "external_http")]);
    const snapshot = registry.snapshot(0);
    expect(selectProfileAvailability(snapshot, "render.voice")).toMatchObject({ state: "requestable_unverified", instanceId: "external-voice" });
    const receipt = registry.releaseReceipt(snapshot);
    expect(() => assertProviderReleaseReceipt(receipt)).not.toThrow();

    const exchange = new ExchangeAuthority();
    const declaration = compileApplications().find((row) => row.operationId === "render.voice")!;
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    const failure = exchange.failure(request, "timeout");
    expect(settleOperation(declaration, { kind: "failed", stageId: "text", request, failure }, "deterministic")).toMatchObject({ kind: "fallback", value: "deterministic", source: "deterministic_renderer" });
    registry.failure(request, failure, 1);
    expect(() => selectProfileAvailability(snapshot, "render.voice")).toThrow(/SNAPSHOT_STALE_OR_CROSSED/);
    expect(() => assertProviderReleaseReceipt(receipt)).toThrow(/RELEASE_RECEIPT_STALE_OR_CROSSED/);
  });

  test("D2857 read-only generation validation preserves the issuing operation snapshot", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const snapshot = registry.snapshot(0);
    const generations = registry.generationSet(snapshot, "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");

    expect(coordinator.acquire(0, generations, 100)).toMatchObject({ kind: "acquired" });
    expect(selectProfileAvailability(snapshot, "evidence.explorer_query")).toEqual({
      state: "requestable_unverified",
      instanceId: "explorer-primary",
      generation: "g1",
    });
  });

  test("D2858 invalid settlement bytes fail before consuming the live claim", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const generations = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const first = coordinator.acquire(0, generations, 100);
    if (first.kind !== "acquired") throw new Error("fixture");

    expect(() => coordinator.settle(1, generations, first.token, { kind: "invented" })).toThrow(/BACKOFF_SETTLEMENT_INVALID/);
    expect(coordinator.acquire(2, generations, 100)).toEqual({ kind: "claimed" });
    expect(() => coordinator.settle(3, generations, first.token, { kind: "success", retryAfterMs: 90_000 })).toThrow(/BACKOFF_SETTLEMENT_INVALID/);
    expect(coordinator.acquire(4, generations, 100)).toEqual({ kind: "claimed" });
    coordinator.settle(5, generations, first.token, { kind: "success" });
    expect(coordinator.acquire(6, generations, 100)).toMatchObject({ kind: "acquired" });
  });

  test("D2859 provider payloads are copied, recursively sealed and payload-digest bound", () => {
    const exchange = new ExchangeAuthority();
    const request = exchange.request(
      "external_voice.render@1",
      "external_http",
      "g1",
      "request-digest",
    );
    const nested = { sentence: "before" };
    const payload = Object.freeze({ nested });
    const delivery = exchange.success(request, payload, "response-digest");

    nested.sentence = "after";
    expect(delivery.payload).toEqual({ nested: { sentence: "before" } });
    expect(delivery.payload).not.toBe(payload);
    expect(Object.isFrozen(delivery.payload.nested)).toBe(true);
    expect(delivery.payloadDigest).toBe(
      `sha256:${createHash("sha256").update('{"nested":{"sentence":"before"}}').digest("hex")}`,
    );
  });
});
