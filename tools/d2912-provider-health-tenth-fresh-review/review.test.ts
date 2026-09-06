// DISPOSABLE independent-review falsifiers for the provider-health ninth author repair.
// Not production code.
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
} from "../d2869-provider-health-ninth-author-repair/contract.js";

function configured(instanceId: string, implementation: string, generation = "g1") {
  return { instanceId, implementation, generation };
}

describe("provider-health ninth repair tenth fresh-review returns", () => {
  test("D2912 one cached request is reported as an exact hit for a different request", () => {
    const registry = new ProviderRegistry([
      configured("external-voice", "external_http"),
    ]);
    const exchange = new ExchangeAuthority();
    const cachedRequest = exchange.request(
      "external_voice.render@1",
      "external_http",
      "g1",
      "cached-request",
    );
    const uncachedRequest = exchange.request(
      "external_voice.render@1",
      "external_http",
      "g1",
      "uncached-request",
    );
    const delivery = exchange.success(cachedRequest, "cached voice", "response");
    const failure = exchange.failure(cachedRequest, "timeout");
    const voice = compileApplications().find((row) => row.operationId === "render.voice");
    if (voice === undefined) throw new Error("fixture");
    const cache = new ExactCache<string>(registry);
    cache.put(cacheKey(registry, voice, cachedRequest, "cached-key"), delivery, 100, 0);
    const uncachedKey = cacheKey(registry, voice, uncachedRequest, "uncached-key");
    registry.failure(cachedRequest, failure, 1);

    const snapshot = registry.snapshot(1);
    expect(selectProfileAvailability(snapshot, "render.voice", 1)).toMatchObject({
      state: "cached_exact_only",
    });
    expect(cache.resolve(uncachedKey, 1)).toEqual({ kind: "miss" });
  });

  test("D2913 a release receipt remains current after its source time projection is stale", () => {
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
    registry.failure(request, exchange.failure(request, "timeout"), 0);
    const snapshot = registry.snapshot(0);
    const receipt = registry.releaseReceipt(snapshot, 0);

    expect(() =>
      selectProfileAvailability(snapshot, "render.voice", 5_001),
    ).toThrow(/SNAPSHOT_STALE_OR_CROSSED/);
    expect(() => assertProviderReleaseReceipt(receipt)).not.toThrow();
  });

  test("D2914 Lichess group admission is blocked while sibling availability says requestable", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request(
      "lichess_explorer.position_page@1",
      "lichess_http",
      "g1",
      "position",
    );
    const generations = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new Error("fixture");
    coordinator.settle(1, generations, claim.token, {
      kind: "rate_limited",
      retryAfterMs: null,
    });
    registry.failure(request, exchange.failure(request, "rate_limited"), 1);

    const current = registry.snapshot(1);
    expect(coordinator.acquire(1, registry.generationSet(current, "lichess-api"), 100)).toEqual({
      kind: "blocked",
      retryAfterMs: 60_000,
    });
    expect(selectProfileAvailability(current, "evidence.tablebase_probe", 1)).toMatchObject({
      state: "requestable_unverified",
      instanceId: "tablebase-primary",
    });
  });

  test("D2915 a two-provider release receipt rejects itself without any transition", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const snapshot = registry.snapshot(0);
    const receipt = registry.releaseReceipt(snapshot, 0);

    expect(() => assertProviderReleaseReceipt(receipt)).toThrow(
      /RELEASE_RECEIPT_STALE_OR_CROSSED/,
    );
  });
});
