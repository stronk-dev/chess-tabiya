import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  BackoffCoordinator,
  ExchangeAuthority,
  ProviderRegistry,
  assertProviderReleaseReceipt,
  selectProfileAvailability,
} from "../d2912-provider-health-tenth-author-repair/contract.js";

const SOURCE = readFileSync(
  new URL("../d2912-provider-health-tenth-author-repair/contract.ts", import.meta.url),
  "utf8",
);

function configured(instanceId: string, implementation: string, generation = "g1") {
  return { instanceId, implementation, generation };
}

describe("provider-health eleventh fresh independent review", () => {
  test("D2942 backoff membership is copied into a second partial map", () => {
    expect(SOURCE).toContain("const GROUP_BY_INSTANCE:");
    expect(SOURCE).toContain('"tablebase-primary": "lichess-api"');
    expect(SOURCE).toContain('"external-voice": "external-voice-api"');
    expect(SOURCE).not.toContain("PROVIDER_INSTANCE_DECLARATIONS");
    expect(SOURCE.match(/GROUP_BY_INSTANCE\[/gu)).toHaveLength(3);
  });

  test("D2943 public predecessor mutation splits snapshot and release generation authority", () => {
    const registry = new ProviderRegistry([
      configured("external-voice", "external_http", "g1"),
    ]);
    new BackoffCoordinator(registry, "external-voice-api");

    registry.prior().changeGeneration("external-voice", "g2");
    const snapshot = registry.snapshot(0);
    const receipt = registry.releaseReceipt(snapshot, 0);

    expect(snapshot.instances.find((row) => row.instanceId === "external-voice")).toMatchObject({
      generation: "g2",
    });
    expect(receipt.generations.find((row) => row.instanceId === "external-voice")).toMatchObject({
      generation: "g1",
    });
    expect(() => assertProviderReleaseReceipt(receipt, 0)).not.toThrow();
  });

  test("D2944 a registry accepts a coordinator owned by another registry", () => {
    const left = new ProviderRegistry([configured("external-voice", "external_http")]);
    const right = new ProviderRegistry([configured("external-voice", "external_http")]);
    const rightCoordinator = new BackoffCoordinator(right, "external-voice-api");

    left.registerCoordinator(rightCoordinator);
    expect(left.snapshot(0).backoffGroups).toEqual([
      { group: "external-voice-api", state: "available", retryAfterMs: null },
    ]);
  });

  test("D2945 public generationChanged clears a live block without a generation transition", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const initial = registry.snapshot(0);
    const generations = registry.generationSet(initial, "lichess-api");
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new TypeError("fixture did not acquire");
    coordinator.settle(1, generations, claim.token, {
      kind: "rate_limited",
      retryAfterMs: null,
    });
    const blocked = registry.snapshot(1);

    coordinator.generationChanged();
    const bypassed = registry.snapshot(1);

    expect(blocked.backoffGroups[0]).toMatchObject({ state: "blocked", retryAfterMs: 60_000 });
    expect(bypassed.backoffGroups[0]).toEqual({
      group: "lichess-api",
      state: "available",
      retryAfterMs: null,
    });
    expect(bypassed.stateRevision).toBe(blocked.stateRevision);
    expect(bypassed.instances).toEqual(blocked.instances);
  });

  test("D2946 an unsealed success contradicts a real failure and reopens the sibling", () => {
    const registry = new ProviderRegistry([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const exchange = new ExchangeAuthority();
    const request = exchange.request(
      "lichess_explorer.position_page@1",
      "lichess_http",
      "g1",
      "request",
    );
    const initial = registry.snapshot(0);
    const generations = registry.generationSet(initial, "lichess-api");
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new TypeError("fixture did not acquire");

    registry.failure(request, exchange.failure(request, "network"), 1);
    coordinator.settle(1, generations, claim.token, { kind: "success" });
    const contradictory = registry.snapshot(1);

    expect(contradictory.backoffGroups[0]).toEqual({
      group: "lichess-api",
      state: "available",
      retryAfterMs: null,
    });
    expect(selectProfileAvailability(
      contradictory,
      "evidence.tablebase_probe",
      1,
    )).toMatchObject({ state: "requestable_unverified" });
  });

  test("D2947 cached_exact_only has no composed operation result", () => {
    const availability = SOURCE.slice(
      SOURCE.indexOf("export type ProfileAvailability"),
      SOURCE.indexOf("export function cacheKey"),
    );
    expect(availability).toContain('"conditional_exact_cache"');
    expect(availability).not.toContain('"cached_exact_only"');
    expect(SOURCE).not.toContain('state: "cached_exact_only"');
  });

  test("D2948 operation availability omits the closed population and reason arms", () => {
    const absentRegistry = new ProviderRegistry([]);
    const absent = selectProfileAvailability(
      absentRegistry.snapshot(0),
      "render.voice",
      0,
    );
    expect(absent).toEqual({
      state: "unavailable",
      instanceId: "external-voice",
      generation: null,
    });
    expect(absent).not.toHaveProperty("instanceIds");
    expect(absent).not.toHaveProperty("reason");

    const registry = new ProviderRegistry([configured("explorer-primary", "lichess_http")]);
    const coordinator = new BackoffCoordinator(registry, "lichess-api");
    const snapshot = registry.snapshot(0);
    const generations = registry.generationSet(snapshot, "lichess-api");
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new TypeError("fixture did not acquire");
    coordinator.settle(1, generations, claim.token, {
      kind: "rate_limited",
      retryAfterMs: null,
    });
    const blocked = selectProfileAvailability(
      registry.snapshot(1),
      "evidence.explorer_query",
      1,
    );
    expect(blocked).not.toHaveProperty("instanceIds");
    expect(blocked).not.toHaveProperty("reason");
  });

  test("D2949 monotonic process duration is published as civil display time", () => {
    const registry = new ProviderRegistry([]);
    expect(registry.snapshot(1).generatedAt).toBe("1970-01-01T00:00:00.001Z");
  });
});
