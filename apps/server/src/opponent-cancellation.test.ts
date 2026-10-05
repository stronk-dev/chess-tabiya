import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";
import { OpponentSelector, type SelectMoveRequest, type SelectorEngineClient } from "./opponent-selector.js";
import type { EngineRequest } from "./engine-supervisor.js";
import type { TablebaseSource } from "./tablebase.js";
import { testRegistry } from "./provider-health.test-support.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const lines = ["info multipv 1 policy 1 pv e2e4", "bestmove e2e4"];
const query = (mode = "human_common"): SelectMoveRequest => ({ startFen: INITIAL_FEN, historyUci: [], policy: { mode, policyConfigDigest: "fixture" }, seed: 17 });
function client(execute: (request: EngineRequest) => Promise<readonly string[]>): SelectorEngineClient {
  return { execute: (_id, request) => execute(request), health: id => ({ id, status: "ready", restartCount: 0, identity: { id, kind: "opponent", name: "Cancellation fixture", version: "1", seedHonored: false } }) };
}

describe("opponent caller cancellation", () => {
  it("refuses a pre-aborted caller before any engine acquisition", async () => {
    let calls = 0;
    const selector = new OpponentSelector(client(async () => { calls += 1; return lines; }));
    const caller = new AbortController(); caller.abort();
    await expect(selector.select(query(), { signal: caller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(calls).toBe(0); expect(selector.cacheSize()).toBe(0);
  });

  it("detaches one caller while its coalesced peer receives the unchanged selection", async () => {
    const ready = deferred<EngineRequest>(), gate = deferred<readonly string[]>();
    let calls = 0;
    const selector = new OpponentSelector(client(async request => { calls += 1; ready.resolve(request); return gate.promise; }));
    const caller = new AbortController();
    const cancelled = selector.select(query(), { signal: caller.signal });
    const peer = selector.selectWithReceipt(query());
    const request = await ready.promise;
    expect(request.signal).toBeDefined(); caller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
    expect(request.signal!.aborted).toBe(false);
    gate.resolve(lines);
    expect(await peer).toMatchObject({ selection: { moveUci: "e2e4", policyModeApplied: "human_common" }, receipt: { source: "live" } });
    expect(calls).toBe(1); expect(selector.cacheSize()).toBe(1);
    expect((await selector.selectWithReceipt(query())).receipt.source).toBe("cached_exact");
  });

  it("cancels upstream only when the final waiter leaves and keeps provider health unchanged", async () => {
    const health = await testRegistry({ "maia-inference": "unverified" });
    const ready = deferred<EngineRequest>(), stopped = deferred<void>();
    const selector = new OpponentSelector(client(async request => {
      ready.resolve(request);
      return new Promise<readonly string[]>((_resolve, reject) => request.signal?.addEventListener("abort", () => { stopped.resolve(); reject(new DOMException("cancelled", "AbortError")); }, { once: true }));
    }), { health });
    const first = new AbortController(), last = new AbortController();
    const one = selector.select(query(), { signal: first.signal });
    const two = selector.select(query(), { signal: last.signal });
    const request = await ready.promise;
    first.abort(); await expect(one).rejects.toMatchObject({ name: "AbortError" });
    expect(request.signal!.aborted).toBe(false);
    last.abort(); await expect(two).rejects.toMatchObject({ name: "AbortError" });
    await stopped.promise;
    expect(request.signal!.aborted).toBe(true);
    expect(selector.cacheSize()).toBe(0);
    expect(health.operationAvailability("opponent.maia_inference").state).toBe("requestable_unverified");
  });

  it("an ignored abort cannot fill the cache, erase the next flight or split its peer", async () => {
    const ready = [deferred<EngineRequest>(), deferred<EngineRequest>()], gates = [deferred<readonly string[]>(), deferred<readonly string[]>()];
    let calls = 0;
    const selector = new OpponentSelector(client(async request => { const index = calls++; ready[index]!.resolve(request); return gates[index]!.promise; }));
    const caller = new AbortController();
    const abandoned = selector.select(query(), { signal: caller.signal });
    await ready[0]!.promise; caller.abort(); await expect(abandoned).rejects.toMatchObject({ name: "AbortError" });
    const current = selector.select(query()); await ready[1]!.promise;
    gates[0]!.resolve(lines); await new Promise<void>(resolve => setImmediate(resolve));
    expect(selector.cacheSize()).toBe(0);
    const peer = selector.select(query());
    gates[1]!.resolve(lines);
    expect((await current).moveUci).toBe("e2e4"); expect((await peer).moveUci).toBe("e2e4");
    expect(calls).toBe(2); expect(selector.cacheSize()).toBe(1);
  });

  it("does not retry an off-window sampled move after the caller leaves", async () => {
    const ready = deferred<void>(), gate = deferred<readonly string[]>(); let calls = 0;
    const selector = new OpponentSelector(client(async () => { calls += 1; ready.resolve(); return gate.promise; }));
    const caller = new AbortController(); const pending = selector.select(query(), { signal: caller.signal });
    await ready.promise; caller.abort(); gate.resolve(["info multipv 1 policy 1 pv d2d4", "bestmove e2e4"]);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(calls).toBe(1); expect(selector.cacheSize()).toBe(0);
  });

  it.each(["strong_engine", "theory_strict", "perfect_tablebase", "practical_resistance"])("forwards cancellation into the first %s stage", async mode => {
    const ready = deferred<AbortSignal | undefined>(), stopped = deferred<void>();
    const wait = (signal?: AbortSignal): Promise<never> => {
      ready.resolve(signal);
      return new Promise((_resolve, reject) => signal?.addEventListener("abort", () => { stopped.resolve(); reject(new DOMException("cancelled", "AbortError")); }, { once: true }));
    };
    const tablebase: TablebaseSource = { kind: "mock", probe: (_fen, options) => wait(options?.signal) };
    const selector = new OpponentSelector(client(request => wait(request.signal)), { tablebaseSource: tablebase });
    const caller = new AbortController();
    const pending = selector.select({ ...query(mode), ...(mode.includes("tablebase") || mode === "practical_resistance" ? { startFen: "8/8/8/8/8/2k5/4K3/7R b - - 0 1" } : {}) }, { signal: caller.signal });
    const signal = await ready.promise; expect(signal).toBeDefined(); caller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" }); await stopped.promise;
    expect(signal!.aborted).toBe(true); expect(selector.cacheSize()).toBe(0);
  });
});
