// Collection-local pure parse reuse; never a source of chess judgements or access authority.
import { afterEach, describe, expect, it, vi } from "vitest";
import { createReviewDurableEngineMemo, reviewDurableEngineStates, REVIEW_PROVIDER_DELIVERY_KEY } from "./review-evidence.js";
import * as providers from "./provider-exchange.js";
import { reviewFixtureRun } from "./testing/review-map-fixture.js";

afterEach(() => vi.restoreAllMocks());
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
function fixture() { return reviewFixtureRun({ kind: "position", plies: 0 }); }
describe("owned durable engine parse memo", () => {
  it("parses immutable original bytes once but still issues each actual observation", () => {
    const run = fixture(), memo = createReviewDurableEngineMemo(), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    const first = reviewDurableEngineStates(run, run.nodes, memo).get(run.nodes[0]!.id)!;
    const second = reviewDurableEngineStates(run, run.nodes, memo).get(run.nodes[0]!.id)!;
    expect(first.kind).toBe("delivered"); expect(second.kind).toBe("delivered"); expect(parse).toHaveBeenCalledTimes(1);
    if (first.kind !== "delivered" || second.kind !== "delivered") throw new Error("Missing original provider observation");
    expect(first.delivery).not.toBe(second.delivery); expect(first.delivery.payload).toBe(second.delivery.payload);
    expect(first.delivery).toEqual(second.delivery);
  });

  it("does not share parse ownership across jobs or equal-but-distinct immutable records", () => {
    const run = fixture(), memo = createReviewDurableEngineMemo(), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    reviewDurableEngineStates(run, run.nodes, memo);
    reviewDurableEngineStates(run, run.nodes, createReviewDurableEngineMemo());
    const copied = freeze(structuredClone(run)); reviewDurableEngineStates(copied, copied.nodes, memo);
    expect(parse).toHaveBeenCalledTimes(3);
  });

  it("revalidates mutable records and does not freeze borrowed input or hide changed bytes", () => {
    const run = structuredClone(fixture()), memo = createReviewDurableEngineMemo(), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    const event = run.events.find(event => event.type === "evidence.attached");
    if (event?.type !== "evidence.attached") throw new Error("Missing original modern attachment");
    const persisted = event.data.payload.values[REVIEW_PROVIDER_DELIVERY_KEY]!;
    expect(reviewDurableEngineStates(run, run.nodes, memo).get(run.nodes[0]!.id)!.kind).toBe("delivered");
    expect(reviewDurableEngineStates(run, run.nodes, memo).get(run.nodes[0]!.id)!.kind).toBe("delivered");
    expect(Object.isFrozen(persisted)).toBe(false);
    Object.assign(persisted, { cacheIdentity: "changed-original-bytes" });
    expect(reviewDurableEngineStates(run, run.nodes, memo).get(run.nodes[0]!.id)).toEqual({ kind: "unavailable", reason: "legacy_provenance_missing" });
    expect(parse).toHaveBeenCalledTimes(3);
  });

  it("still checks the exact requested node FEN after reuse and rejects foreign memo handles", () => {
    const run = fixture(), memo = createReviewDurableEngineMemo();
    reviewDurableEngineStates(run, run.nodes, memo);
    expect(reviewDurableEngineStates(run, [{ ...run.nodes[0]!, fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1" }], memo).get(run.nodes[0]!.id))
      .toEqual({ kind: "unavailable", reason: "legacy_provenance_missing" });
    expect(() => reviewDurableEngineStates(run, [], {} as never)).toThrow(/foreign/u);
  });

  it("leaves ordinary non-memoized calls unchanged", () => {
    const run = fixture(), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    reviewDurableEngineStates(run, run.nodes); reviewDurableEngineStates(run, run.nodes);
    expect(parse).toHaveBeenCalledTimes(2);
  });
});
