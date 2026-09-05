// DISPOSABLE independent-review falsifiers for D2846-D2851. Not production code.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  APPLICATION_DECLARATIONS,
  ExactCache,
  ExchangeAuthority,
  ProviderHealthAuthority,
  RenewableBackoffCoordinator,
  generationSet,
} from "../d2815-provider-health-sixth-author-repair/contract.js";

const source = readFileSync(
  "tools/d2815-provider-health-sixth-author-repair/contract.ts",
  "utf8",
);

describe("provider-health sixth repair seventh fresh-review returns", () => {
  test("D2846 unknown configuration is silently dropped and configured identity is absent", () => {
    expect(
      () =>
        new ProviderHealthAuthority([
          { instanceId: "attacker-instance", generation: "g1" },
        ] as never),
    ).not.toThrow();

    const authority = new ProviderHealthAuthority([
      { instanceId: "maia-inference", generation: "g1" },
    ]);
    const configured = authority
      .snapshot(0)
      .find((row) => row.instanceId === "maia-inference");
    expect(configured).toEqual({
      instanceId: "maia-inference",
      generation: "g1",
      state: "unverified",
    });
    expect(configured).not.toHaveProperty("familyId");
    expect(configured).not.toHaveProperty("implementation");
  });

  test("D2847 an old or cross-registry sealed snapshot clears a live lease", () => {
    const first = new ProviderHealthAuthority([
      { instanceId: "explorer-primary", generation: "g1" },
    ]);
    const second = new ProviderHealthAuthority([
      { instanceId: "explorer-primary", generation: "unrelated" },
    ]);
    const stale = generationSet(first.snapshot(0));
    first.changeGeneration("explorer-primary", "g2");
    const current = generationSet(first.snapshot(1));
    const crossed = generationSet(second.snapshot(1));
    const coordinator = new RenewableBackoffCoordinator();

    expect(coordinator.acquire(1, current, 100)).toMatchObject({ kind: "acquired" });
    expect(coordinator.acquire(2, stale, 100)).toMatchObject({ kind: "acquired" });
    expect(coordinator.acquire(3, crossed, 100)).toMatchObject({ kind: "acquired" });
  });

  test("D2848 settling a rate-limited lease cannot establish the required shared block", () => {
    const authority = new ProviderHealthAuthority([
      { instanceId: "explorer-primary", generation: "g1" },
      { instanceId: "tablebase-primary", generation: "g1" },
    ]);
    const generations = generationSet(authority.snapshot(0));
    const coordinator = new RenewableBackoffCoordinator();
    const claim = coordinator.acquire(0, generations, 100);
    if (claim.kind !== "acquired") throw new Error("fixture");

    // settle has no result/retry-after operand, so the next cross-instance request
    // is admitted immediately even when the completed request was a Lichess 429.
    coordinator.settle(1, generations, claim.token);
    expect(coordinator.acquire(2, generations, 100)).toMatchObject({ kind: "acquired" });
    expect(source).not.toMatch(/blockedUntil|retryAfter/i);
  });

  test("D2849 an exact-cache hit has neither application grain nor a cache-service receipt", () => {
    const exchange = new ExchangeAuthority();
    const authority = new ProviderHealthAuthority([
      { instanceId: "external-voice", generation: "g1" },
    ]);
    const cache = new ExactCache<string>(authority);
    const request = exchange.request(
      "external_voice.render@1",
      "external-voice",
      "g1",
      "same-text-request",
    );
    cache.put(exchange.success(request, "rendered", "response"), 100, 0);
    const result = cache.resolve(request, 1);

    expect(result).toMatchObject({ kind: "hit", delivery: { payload: "rendered" } });
    expect(result).not.toHaveProperty("value");
    expect(result).not.toHaveProperty("original");
    expect(result).not.toHaveProperty("cacheServiceReceipt");
    const cacheSource = source.slice(
      source.indexOf("export class ExactCache"),
      source.indexOf("type GenerationSet"),
    );
    expect(cacheSource).not.toMatch(/applicationOperationId|stageId|cacheKeyDigest/);
  });

  test("D2850 the exact compiled population keeps dependency and condition semantics vacuous", () => {
    expect(APPLICATION_DECLARATIONS).toHaveLength(10);
    expect(
      APPLICATION_DECLARATIONS.every(
        (operation) =>
          operation.stages.length === 1 &&
          operation.stages[0]?.when === "always" &&
          operation.stages[0]?.dependsOn.length === 0,
      ),
    ).toBe(true);
    expect(source).not.toMatch(/when:\s*"audio_requested"/u);
  });

  test("D2851 the replacement checkpoint drops the earlier outcome, selector and release authorities", () => {
    expect(source).not.toMatch(/export (?:type|interface|class|function) ApplicationProviderOutcome\b/u);
    expect(source).not.toMatch(/export (?:type|interface|class|function) selectProfileAvailability\b/u);
    expect(source).not.toMatch(/export (?:type|interface|class|function) ProviderReleaseReceipt\b/u);
    expect(source).not.toMatch(/export (?:function|class) settleOperation\b/u);
  });
});
