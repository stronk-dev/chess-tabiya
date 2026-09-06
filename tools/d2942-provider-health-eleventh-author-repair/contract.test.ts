import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { ExchangeAuthority, PROVIDER_INSTANCE_DECLARATIONS, assertProviderReleaseReceipt, createProviderHealth, parseProviderOperationAvailability } from "./contract.js";

const SOURCE = readFileSync(new URL("./contract.ts", import.meta.url), "utf8");
const configured = (instanceId: string, implementation: string, generation = "g1") => ({ instanceId, implementation, generation });

describe("provider-health eleventh author repair", () => {
  test("D2942 group membership derives only from the canonical declarations", () => {
    expect(SOURCE).toContain("PROVIDER_INSTANCE_DECLARATIONS.map");
    expect(SOURCE).not.toContain("GROUP_BY_INSTANCE");
    expect(PROVIDER_INSTANCE_DECLARATIONS.filter((row) => row.backoffGroup === "lichess-api").map((row) => row.instanceId)).toEqual(["tablebase-primary", "explorer-primary"]);
  });

  test("D2943 predecessor mutation authority is not exposed", () => {
    const health = createProviderHealth([configured("external-voice", "external_http")]);
    expect((health as unknown as { prior?: unknown }).prior).toBeUndefined();
    const snapshot = health.snapshot(0, "2026-09-06T12:00:00.000Z");
    const receipt = health.releaseReceipt(snapshot, 0);
    expect(() => assertProviderReleaseReceipt(receipt, 0)).not.toThrow();
  });

  test("D2944 coordinator construction and ownership remain private", () => {
    const left = createProviderHealth([configured("external-voice", "external_http")]);
    const right = createProviderHealth([configured("external-voice", "external_http")]);
    expect((left as unknown as { registerCoordinator?: unknown }).registerCoordinator).toBeUndefined();
    const claim = right.acquire("external-voice-api", 0, 100);
    if (!("token" in claim)) throw new TypeError("fixture");
    const exchange = new ExchangeAuthority();
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    expect(() => left.settle(claim, request, exchange.success(request, "voice", "response"), 1)).toThrow(/LEASE_STALE_OR_CROSSED/u);
  });

  test("D2945 only a real generation transition resets group state", () => {
    const health = createProviderHealth([configured("explorer-primary", "lichess_http"), configured("tablebase-primary", "lichess_http")]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request("lichess_explorer.position_page@1", "lichess_http", "g1", "request");
    const claim = health.acquire("lichess-api", 0, 100);
    if (!("token" in claim)) throw new TypeError("fixture");
    health.settle(claim, request, exchange.failure(request, "rate_limited"), 1);
    expect((health as unknown as { generationChanged?: unknown }).generationChanged).toBeUndefined();
    expect(() => health.changeGeneration("explorer-primary", "g1")).toThrow(/GENERATION_MUST_CHANGE/u);
    expect(health.snapshot(1, "2026-09-06T12:00:00.000Z").backoffGroups[0]).toMatchObject({ state: "blocked", retryAfterMs: 60_000 });
    health.changeGeneration("explorer-primary", "g2");
    expect(health.snapshot(1, "2026-09-06T12:00:00.000Z").backoffGroups[0]).toMatchObject({ state: "available" });
  });

  test("D2946 one sealed exchange outcome atomically drives health and group state", () => {
    const health = createProviderHealth([configured("explorer-primary", "lichess_http"), configured("tablebase-primary", "lichess_http")]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request("lichess_explorer.position_page@1", "lichess_http", "g1", "request");
    const claim = health.acquire("lichess-api", 0, 100);
    if (!("token" in claim)) throw new TypeError("fixture");
    expect(() => health.settle(claim, request, { kind: "success" } as never, 1)).toThrow();
    health.settle(claim, request, exchange.failure(request, "network"), 1);
    const snapshot = health.snapshot(1, "2026-09-06T12:00:00.000Z");
    expect(snapshot.instances.find((row) => row.instanceId === "explorer-primary")).toMatchObject({ state: "unavailable", reason: "network" });
    expect(snapshot.backoffGroups[0]).toMatchObject({ state: "blocked", retryAfterMs: 5_000 });
    expect(health.availability(snapshot, "evidence.tablebase_probe", 1)).toEqual({ state: "temporarily_blocked", instanceIds: ["tablebase-primary"], reason: "upstream_backoff", retryAfterMs: 5_000 });
  });

  test("D2947 only atomic exact-key resolution returns cached_exact_only", () => {
    const health = createProviderHealth([configured("external-voice", "external_http")]);
    const exchange = new ExchangeAuthority();
    const cached = exchange.request("external_voice.render@1", "external_http", "g1", "cached");
    const uncached = exchange.request("external_voice.render@1", "external_http", "g1", "uncached");
    health.cacheSuccess("render.voice", cached, exchange.success(cached, "voice", "response"), "cached-key", 100, 0);
    const beforeHit = health.snapshot(1, "2026-09-06T12:00:00.000Z");
    const hit = health.resolveExact<string>(beforeHit, "render.voice", cached, "cached-key", 1);
    expect(hit).toMatchObject({ kind: "hit", availability: { state: "cached_exact_only", instanceIds: ["external-voice"] }, value: "voice" });
    const beforeMiss = health.snapshot(1, "2026-09-06T12:00:00.000Z");
    const miss = health.resolveExact<string>(beforeMiss, "render.voice", uncached, "uncached-key", 1);
    expect(miss.kind).toBe("miss");
  });

  test("D2948 the wire population is strict, plural and reason-bearing", () => {
    expect(parseProviderOperationAvailability({ state: "unavailable", instanceIds: ["external-voice"], reason: "not_configured" })).toEqual({ state: "unavailable", instanceIds: ["external-voice"], reason: "not_configured" });
    expect(() => parseProviderOperationAvailability({ state: "unavailable", instanceId: "external-voice" })).toThrow(/AVAILABILITY_INVALID/u);
    expect(() => parseProviderOperationAvailability({ state: "temporarily_blocked", instanceIds: ["external-voice"], retryAfterMs: 5_000 })).toThrow(/AVAILABILITY_INVALID/u);
    const absent = createProviderHealth([]);
    expect(absent.availability(absent.snapshot(0, "2026-09-06T12:00:00.000Z"), "render.voice", 0)).toEqual({ state: "unavailable", instanceIds: ["external-voice"], reason: "not_configured" });
  });

  test("D2949 monotonic and civil clocks are independent", () => {
    const health = createProviderHealth([]);
    const first = health.snapshot(1, "2026-09-06T12:00:00.000Z");
    const second = health.snapshot(1, "2030-01-02T03:04:05.000Z");
    expect(first.observedAtMonotonic).toBe(second.observedAtMonotonic);
    expect(first.generatedAt).toBe("2026-09-06T12:00:00.000Z");
    expect(second.generatedAt).toBe("2030-01-02T03:04:05.000Z");
    expect(first.generatedAt).not.toBe("1970-01-01T00:00:00.001Z");
  });
});
