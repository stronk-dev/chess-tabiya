// DISPOSABLE independent-review falsifiers for D2857-D2859. Not production code.
import { describe, expect, test } from "vitest";

import {
  BackoffCoordinator,
  ExactCache,
  ExchangeAuthority,
  ProviderRegistry,
  cacheKey,
  compileApplications,
  selectProfileAvailability,
} from "../d2846-provider-health-seventh-author-repair/contract.js";

function configured(instanceId: string, implementation: string, generation = "g1") {
  return { instanceId, implementation, generation };
}

describe("provider-health seventh repair eighth fresh-review returns", () => {
  test("D2857 read-only generation validation invalidates the operation snapshot", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const snapshot = registry.snapshot(0);
    const generations = registry.generationSet(snapshot, "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");

    expect(coordinator.acquire(0, generations, 100)).toMatchObject({ kind: "acquired" });

    // Merely validating the generation set calls snapshot() internally and replaces
    // the registry's current-snapshot object. No health, cache or generation byte changed.
    expect(() =>
      selectProfileAvailability(snapshot, "evidence.explorer_query"),
    ).toThrow(/SNAPSHOT_STALE_OR_CROSSED/);
  });

  test("D2858 unknown and inexact backoff settlements are accepted as authority", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const generations = registry.generationSet(registry.snapshot(0), "lichess-api");
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const first = coordinator.acquire(0, generations, 100);
    if (first.kind !== "acquired") throw new Error("fixture");

    // The implementation's final else arm silently interprets any unknown kind as
    // transient_failure instead of parsing the closed union.
    expect(() =>
      coordinator.settle(1, generations, first.token, { kind: "invented" } as never),
    ).not.toThrow();
    expect(coordinator.acquire(2, generations, 100)).toEqual({
      kind: "blocked",
      retryAfterMs: 4_999,
    });

    const secondRegistry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const secondGenerations = secondRegistry.generationSet(
      secondRegistry.snapshot(0),
      "lichess-api",
    );
    const secondCoordinator = new BackoffCoordinator(secondRegistry, "lichess-api");
    const second = secondCoordinator.acquire(0, secondGenerations, 100);
    if (second.kind !== "acquired") throw new Error("fixture");
    expect(() =>
      secondCoordinator.settle(1, secondGenerations, second.token, {
        kind: "success",
        retryAfterMs: 90_000,
      } as never),
    ).not.toThrow();
  });

  test("D2859 an already-frozen envelope keeps mutable payload bytes under one digest", () => {
    const registry = new ProviderRegistry([
      configured("external-voice", "external_http"),
    ]);
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
    const declaration = compileApplications().find(
      (row) => row.operationId === "render.voice",
    );
    if (declaration === undefined) throw new Error("fixture");
    const key = cacheKey(declaration, request, "cache-key-digest");
    const cache = new ExactCache<typeof payload>(registry);
    cache.put(key, delivery, 100, 0);

    nested.sentence = "after";
    const result = cache.resolve(key, 1);
    expect(result).toMatchObject({
      kind: "hit",
      value: { nested: { sentence: "after" } },
      original: { responseDigest: "response-digest" },
    });
    expect(Object.isFrozen(nested)).toBe(false);
  });
});
