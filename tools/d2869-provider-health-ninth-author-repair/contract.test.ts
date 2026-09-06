import { describe, expect, test } from "vitest";

import {
  BackoffCoordinator,
  ExactCache,
  ExchangeAuthority,
  ProviderRegistry,
  assertProviderReleaseReceipt,
  cacheKey,
  compileApplications,
  localDomainResult,
  selectProfileAvailability,
  settleOperation,
  type CacheKey,
} from "./contract.js";

function configured(instanceId: string, implementation: string, generation = "g1") {
  return { instanceId, implementation, generation };
}

describe("provider-health ninth author repair", () => {
  test("D2869 equal concurrent snapshots remain valid until state revision changes", () => {
    const registry = new ProviderRegistry([configured("explorer-primary", "lichess_http")]);
    const first = registry.snapshot(0);
    const second = registry.snapshot(0);
    expect(second).not.toBe(first);
    expect(second).toEqual(first);
    expect(selectProfileAvailability(first, "evidence.explorer_query")).toMatchObject({ state: "requestable_unverified" });
    expect(selectProfileAvailability(second, "evidence.explorer_query")).toMatchObject({ state: "requestable_unverified" });
  });

  test("D2870 only a registry-bound compiled application issuer can mint cache grain", () => {
    const registry = new ProviderRegistry([configured("external-voice", "external_http")]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    const delivery = exchange.success(request, "voice", "response");
    const voice = compileApplications().find((row) => row.operationId === "render.voice")!;
    const issued = cacheKey(registry, voice, request, "voice-key");
    const cache = new ExactCache<string>(registry);
    cache.put(issued, delivery, 100, 0);
    expect(cache.resolve(issued, 1)).toMatchObject({ kind: "hit", value: "voice" });

    const forged = Object.freeze({ ...issued, applicationOperationId: "opponent.maia_inference", stageId: "select" }) as unknown as CacheKey;
    expect(() => cache.put(forged, delivery, 100, 0)).toThrow(/CACHE_SUBJECT_CROSSED/);
    expect(() => cache.resolve(forged, 1)).toThrow(/CACHE_KEY_NOT_ISSUED/);
  });

  test("D2871 unrelated cache revision does not revoke an exact group lease", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
      configured("external-voice", "external_http"),
    ]);
    const generations = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new Error("fixture");

    const exchange = new ExchangeAuthority();
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "voice-request");
    const delivery = exchange.success(request, "voice", "voice-response");
    const declaration = compileApplications().find((row) => row.operationId === "render.voice")!;
    const cache = new ExactCache<string>(registry);
    cache.put(cacheKey(registry, declaration, request, "voice-key"), delivery, 100, 1);

    expect(() => coordinator.settle(2, generations, claim.token, { kind: "success" })).not.toThrow();
  });

  test("D2872 every settlement arm is exact and local-domain results are provider-issued", () => {
    const exchange = new ExchangeAuthority();
    const voice = compileApplications().find((row) => row.operationId === "render.voice")!;
    const voiceRequest = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    const delivery = exchange.success(voiceRequest, "voice", "response");
    expect(() => settleOperation(voice, { kind: "success", stageId: "text", request: voiceRequest, delivery, invented: true })).toThrow(/SETTLEMENT_INVALID/);

    const explorer = compileApplications().find((row) => row.operationId === "evidence.explorer_query")!;
    const explorerRequest = exchange.request("lichess_explorer.position_page@1", "lichess_http", "g1", "position");
    const structural = Object.freeze({ operation: explorerRequest.operation, instanceId: explorerRequest.instanceId, implementation: explorerRequest.implementation, generation: explorerRequest.generation, requestDigest: explorerRequest.requestDigest, value: { kind: "no_data" } });
    expect(() => settleOperation(explorer, { kind: "local_domain", stageId: "query", request: explorerRequest, result: structural })).toThrow(/LOCAL_DOMAIN_NOT_SEALED/);
    expect(() => localDomainResult({ ...explorerRequest }, { kind: "no_data" })).toThrow(/REQUEST_NOT_SEALED/);
    const issued = localDomainResult(explorerRequest, { kind: "no_data" });
    expect(settleOperation(explorer, { kind: "local_domain", stageId: "query", request: explorerRequest, result: issued })).toMatchObject({ kind: "complete", value: { kind: "no_data" } });
  });

  test("D2873 implementation/configuration changes require a distinct generation and revoke old claims", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const before = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    expect(coordinator.acquire(0, before, 100)).toMatchObject({ kind: "acquired" });
    expect(() => registry.changeGeneration("explorer-primary", "g1", "local_service")).toThrow(/GENERATION_MUST_CHANGE/);
    registry.changeGeneration("explorer-primary", "g2", "local_service");
    const after = registry.generationSet(registry.snapshot(1), "lichess-api");
    expect(after.digest).not.toBe(before.digest);
    expect(() => coordinator.settle(2, before, "not-live", { kind: "success" })).toThrow(/GENERATION_SET_STALE_OR_CROSSED/);
    expect(coordinator.acquire(2, after, 100)).toMatchObject({ kind: "acquired" });
  });

  test("the current checkpoint retains health, exact-cache, availability and release authority together", () => {
    const registry = new ProviderRegistry([configured("external-voice", "external_http")]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    const delivery = exchange.success(request, "voice", "response");
    const failure = exchange.failure(request, "timeout");
    const voice = compileApplications().find((row) => row.operationId === "render.voice")!;
    const key = cacheKey(registry, voice, request, "voice-key");
    const cache = new ExactCache<string>(registry);
    cache.put(key, delivery, 100, 0);
    registry.failure(request, failure, 1);

    const first = registry.snapshot(1);
    const second = registry.snapshot(1);
    expect(first.instances.find((row) => row.instanceId === "external-voice")).toMatchObject({ state: "degraded_cached_only" });
    expect(selectProfileAvailability(first, "render.voice", 1)).toMatchObject({ state: "cached_exact_only" });
    expect(selectProfileAvailability(second, "render.voice", 1)).toMatchObject({ state: "cached_exact_only" });
    const receipt = registry.releaseReceipt(first, 1);
    expect(() => assertProviderReleaseReceipt(receipt)).not.toThrow();

    expect(cache.resolve(key, 2)).toMatchObject({ kind: "hit", value: "voice" });
    expect(() => selectProfileAvailability(first, "render.voice", 2)).toThrow(/SNAPSHOT_STALE_OR_CROSSED/);
    expect(() => assertProviderReleaseReceipt(receipt)).toThrow(/RELEASE_RECEIPT_STALE_OR_CROSSED/);
  });
});
