// DISPOSABLE independent-review falsifiers for the provider-health eighth author repair.
// Not production code.
import { describe, expect, test } from "vitest";

import {
  BackoffCoordinator,
  ExactCache,
  ExchangeAuthority,
  ProviderRegistry,
  cacheKey,
  compileApplications,
  selectProfileAvailability,
  settleOperation,
  type CacheKey,
} from "../d2857-provider-health-eighth-author-repair/contract.js";

function configured(instanceId: string, implementation: string, generation = "g1") {
  return { instanceId, implementation, generation };
}

describe("provider-health eighth repair ninth fresh-review returns", () => {
  test("D2869 a second read-only snapshot revokes the first without a state transition", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
    ]);
    const first = registry.snapshot(0);
    const second = registry.snapshot(0);

    expect(second.revision).toBe(first.revision);
    expect(second.instances).toEqual(first.instances);
    expect(() =>
      selectProfileAvailability(first, "evidence.explorer_query"),
    ).toThrow(/SNAPSHOT_STALE_OR_CROSSED/);
  });

  test("D2870 an unsealed cache key relabels a delivery under another application operation", () => {
    const registry = new ProviderRegistry([
      configured("external-voice", "external_http"),
    ]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request(
      "external_voice.render@1",
      "external_http",
      "g1",
      "request",
    );
    const delivery = exchange.success(request, "voice bytes", "response");
    const forged = Object.freeze({
      applicationOperationId: "opponent.maia_inference",
      stageId: "select",
      operation: request.operation,
      instanceId: request.instanceId,
      implementation: request.implementation,
      generation: request.generation,
      requestDigest: request.requestDigest,
      cacheKeyDigest: "forged-application-grain",
    }) as unknown as CacheKey;
    const cache = new ExactCache<string>(registry);

    expect(() => cache.put(forged, delivery, 100, 0)).not.toThrow();
    expect(cache.resolve(forged, 1)).toMatchObject({
      kind: "hit",
      value: "voice bytes",
      cacheServiceReceipt: { cacheKeyDigest: "forged-application-grain" },
    });
  });

  test("D2871 an unrelated cache transition invalidates a live Lichess group lease", () => {
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
    const voiceRequest = exchange.request(
      "external_voice.render@1",
      "external_http",
      "g1",
      "voice-request",
    );
    const voiceDelivery = exchange.success(voiceRequest, "voice", "voice-response");
    const voice = compileApplications().find((row) => row.operationId === "render.voice");
    if (voice === undefined) throw new Error("fixture");
    const voiceKey = cacheKey(voice, voiceRequest, "voice-key");
    const cache = new ExactCache<string>(registry);
    cache.put(voiceKey, voiceDelivery, 100, 1);

    expect(() =>
      coordinator.settle(2, generations, claim.token, { kind: "success" }),
    ).toThrow(/GENERATION_SET_STALE_OR_CROSSED/);
  });

  test("D2872 stage settlement accepts extra fields instead of crossing the strict parser", () => {
    const exchange = new ExchangeAuthority();
    const declaration = compileApplications().find(
      (row) => row.operationId === "render.voice",
    );
    if (declaration === undefined) throw new Error("fixture");
    const request = exchange.request(
      "external_voice.render@1",
      "external_http",
      "g1",
      "request",
    );
    const delivery = exchange.success(request, "voice", "response");

    expect(() => settleOperation(declaration, {
      kind: "success",
      stageId: declaration.stage.stageId,
      request,
      delivery,
      inventedAuthority: true,
    } as never)).not.toThrow();

    expect(() => settleOperation(declaration, {
      kind: "local_domain",
      stageId: declaration.stage.stageId,
      request,
      value: { callerAuthored: true },
    })).not.toThrow();
  });

  test("D2873 implementation changes can reuse a generation and retain the old group claim", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const before = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    expect(coordinator.acquire(0, before, 100)).toMatchObject({ kind: "acquired" });

    registry.changeGeneration("explorer-primary", "g1", "local_service");
    const after = registry.generationSet(registry.snapshot(1), "lichess-api");

    expect(after.digest).toBe(before.digest);
    expect(coordinator.acquire(1, after, 100)).toEqual({ kind: "claimed" });
  });
});
