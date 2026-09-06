import { describe, expect, test } from "vitest";

import {
  assertProviderReleaseReceipt,
  createProviderHealth,
  ExchangeAuthority,
} from "../d2942-provider-health-eleventh-author-repair/contract.js";

const configured = (instanceId: string, implementation: string, generation = "g1") => ({
  instanceId,
  implementation,
  generation,
});

describe("provider-health twelfth fresh independent review", () => {
  test("D2966 a caller-created exchange authority can mark an uncalled provider available", () => {
    const health = createProviderHealth([configured("explorer-primary", "lichess_http")]);
    const claim = health.acquire("lichess-api", 0, 100);
    if (!("token" in claim)) throw new TypeError("fixture");
    const caller = new ExchangeAuthority();
    const request = caller.request("lichess_explorer.position_page@1", "lichess_http", "g1", "invented-request");
    health.settle(claim, request, caller.success(request, { moves: [] }, "invented-response"), 1);
    expect(health.snapshot(1, "2026-09-06T12:00:00.000Z").instances
      .find((row) => row.instanceId === "explorer-primary")?.state).toBe("available");
  });

  test("D2967 arbitrary generation relabeling clears a real shared block", () => {
    const health = createProviderHealth([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const claim = health.acquire("lichess-api", 0, 100);
    if (!("token" in claim)) throw new TypeError("fixture");
    const exchange = new ExchangeAuthority();
    const request = exchange.request("lichess_explorer.position_page@1", "lichess_http", "g1", "request");
    health.settle(claim, request, exchange.failure(request, "rate_limited"), 1);
    expect(health.snapshot(1, "2026-09-06T12:00:00.000Z").backoffGroups[0]?.state).toBe("blocked");
    health.changeGeneration("explorer-primary", "caller-relabeled-g2");
    expect(health.snapshot(1, "2026-09-06T12:00:00.000Z").backoffGroups[0]?.state).toBe("available");
  });

  test("D2968 the composed authority drops renewal and explicit expiry", () => {
    const health = createProviderHealth([configured("external-voice", "external_http")]);
    expect((health as unknown as { renew?: unknown }).renew).toBeUndefined();
    expect((health as unknown as { expire?: unknown }).expire).toBeUndefined();
  });

  test("D2969 rate-limited exchange outcomes cannot carry a longer Retry-After", () => {
    const health = createProviderHealth([
      configured("explorer-primary", "lichess_http"),
      configured("tablebase-primary", "lichess_http"),
    ]);
    const claim = health.acquire("lichess-api", 0, 100);
    if (!("token" in claim)) throw new TypeError("fixture");
    const exchange = new ExchangeAuthority();
    const request = exchange.request("lichess_explorer.position_page@1", "lichess_http", "g1", "request");
    const failure = exchange.failure(request, "rate_limited");
    expect(Object.keys(failure)).not.toContain("retryAfterMs");
    health.settle(claim, request, failure, 1);
    expect(health.snapshot(1, "2026-09-06T12:00:00.000Z").backoffGroups[0])
      .toMatchObject({ state: "blocked", retryAfterMs: 60_000 });
  });

  test("D2970 a test-only provider implementation receives valid release authority", () => {
    const health = createProviderHealth([configured("external-voice", "local_fixture")]);
    const snapshot = health.snapshot(0, "2026-09-06T12:00:00.000Z");
    const receipt = health.releaseReceipt(snapshot, 0);
    expect(receipt.generations).toEqual([
      { instanceId: "external-voice", implementation: "local_fixture", generation: "g1" },
    ]);
    expect(() => assertProviderReleaseReceipt(receipt, 0)).not.toThrow();
  });

  test("D2971 a 48-hour exact-cache TTL remains serviceable after 24 hours", () => {
    const health = createProviderHealth([configured("external-voice", "external_http")]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request("external_voice.render@1", "external_http", "g1", "request");
    const delivery = exchange.success(request, "rendered", "response");
    const fortyEightHours = 48 * 60 * 60 * 1_000;
    const twentyFiveHours = 25 * 60 * 60 * 1_000;
    expect(() => health.cacheSuccess("render.voice", request, delivery, "cache-key", fortyEightHours, 0))
      .not.toThrow();
    const snapshot = health.snapshot(twentyFiveHours, "2026-09-07T13:00:00.000Z");
    expect(health.resolveExact<string>(snapshot, "render.voice", request, "cache-key", twentyFiveHours).kind)
      .toBe("hit");
  });
});
