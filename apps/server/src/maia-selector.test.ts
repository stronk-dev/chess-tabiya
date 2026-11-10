import { afterEach, describe, expect, it, vi } from "vitest";
import * as runtime from "@chess-tabiya/runtime";
import { START_FEN } from "../../../packages/runtime/src/provider-test-fixtures.js";
import { OPPONENT_SELECTION_CACHE_BOUNDS, OpponentSelector, type SelectMoveRequest, type SelectorEngineClient } from "./opponent-selector.js";
import { FakeEngines, ManualClock, flush } from "./provider-exchange.test-support.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { ExchangeMaiaTaskSource, type MaiaTaskEvidence, type MaiaTaskSource } from "./provider-maia.js";
import { providerOperationDescriptors } from "./provider-operations.js";
import { FixtureTablebaseSource, parseTablebasePosition } from "./tablebase.js";
import { driveTo, testRegistry } from "./provider-health.test-support.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";

afterEach(() => vi.restoreAllMocks());
const request = (overrides: Partial<SelectMoveRequest> = {}): SelectMoveRequest => ({ startFen: START_FEN, historyUci: [],
  policy: { mode: "human_common", policyConfigDigest: `sha256:${"4".repeat(64)}`, targetElo: 1500 }, seed: 42, ...overrides });
const rows = (best = "d2d4") => ["info depth 1 multipv 1 policy 0.8 score cp 20 wdl 400 300 300 pv e2e4", "info depth 1 multipv 2 policy 0.2 pv d2d4", `bestmove ${best}`];
function harness() {
  const engines = new FakeEngines(), clock = new ManualClock(); engines.respond = () => rows();
  const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines, tablebaseFetch: null, explorerFetch: null, explorerToken: null }),
    maxActive: 2, maxQueued: 4, maxRetainedEntries: 8, maxRetainedWeight: 100, retentionTtlMs: 10000, monotonicNowMs: clock.now, wallNow: clock.wall, timers: clock });
  const source = new ExchangeMaiaTaskSource({ scheduler, engines, monotonicNowMs: clock.now });
  const raw = vi.fn(async () => { throw new Error("Modern source must not use legacy execute"); });
  const client: SelectorEngineClient = { health: id => engines.health(id), execute: raw };
  let uuid = 0;
  const ids = () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, "0")}`;
  const selector = new OpponentSelector(client, { maiaTaskSource: source, sampleRequestId: ids, monotonicNowMs: clock.now, wallNow: clock.wall });
  return { engines, clock, scheduler, source, client, raw, ids, selector };
}

describe("accepted sampled-task source through the actual opponent selector", () => {
  it("plays the reported sample rather than argmax and shares its genuine source with exact cached Inspector use", async () => {
    const h = harness(), first = await h.selector.selectWithMaiaEvidence(request());
    expect(first.selection.moveUci).toBe("d2d4"); expect(first.selection.candidates?.[0]?.moveUci).toBe("e2e4");
    expect(first.maiaEvidence?.payload.payload.termination.moveUci).toBe("d2d4");
    expect(h.engines.calls).toHaveLength(1); expect(h.raw).not.toHaveBeenCalled();
    const hit = await h.selector.selectWithMaiaEvidence(request());
    expect(hit.maiaEvidence).toBe(first.maiaEvidence); expect(hit.selection).toBe(first.selection);
    expect(hit.receipt.source).toBe("cached_exact"); expect(hit.receipt.producedAt).toBe(first.receipt.producedAt);
    const publicResult = await h.selector.selectWithReceipt(request());
    expect(Object.keys(publicResult).sort()).toEqual(["receipt", "selection"]);
    expect(JSON.stringify(publicResult)).not.toMatch(/sampleRequestId|maiaEvidence|acquisition|optionImage/u);
    expect(h.engines.calls).toHaveLength(1);
  });

  it("retains only the final retry's source/window and never inserts a sampled off-window row into that source", async () => {
    const h = harness(); let count = 0;
    h.engines.respond = () => ++count === 1 ? ["info multipv 1 policy 0.8 pv e2e4", "bestmove d2d4"]
      : ["info multipv 3 score cp 8 wdl 300 400 300 pv c2c4", "bestmove g1f3"];
    const acquire = vi.spyOn(h.source, "acquire"), result = await h.selector.selectWithMaiaEvidence(request());
    expect(count).toBe(2); expect(acquire.mock.calls[0]![0].sampleRequestId).not.toBe(acquire.mock.calls[1]![0].sampleRequestId);
    expect(acquire.mock.calls[0]![1].deadlineMonotonic).toBe(acquire.mock.calls[1]![1].deadlineMonotonic);
    expect(result.maiaEvidence).toBe(await acquire.mock.results[1]!.value);
    expect(result.maiaEvidence?.payload.payload.candidates).toEqual([{ moveUci: "c2c4", rank: 3, mass: null, scoreCp: 8, wdl: { win: 300, draw: 400, loss: 300 } }]);
    expect(result.selection.candidates).toEqual([{ moveUci: "c2c4", rank: 3, scoreCp: 8, wdl: { win: 300, draw: 400, loss: 300 } }, { moveUci: "g1f3", rank: 4, offWindow: true }]);
    await h.selector.selectWithMaiaEvidence(request()); expect(count).toBe(2);
  });

  it("coalesces selection callers but cancels only the departing waiter, retaining one original task", async () => {
    const h = harness(); let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), exchange = h.engines.exchange.bind(h.engines);
    h.engines.exchange = async (...args) => { await gate; return exchange(...args); };
    const acquire = vi.spyOn(h.source, "acquire"), controller = new AbortController();
    const left = h.selector.selectWithMaiaEvidence(request(), { signal: controller.signal }), right = h.selector.selectWithMaiaEvidence(request());
    await flush(); expect(acquire).toHaveBeenCalledTimes(1); controller.abort(); await expect(left).rejects.toBeDefined();
    expect(acquire.mock.calls[0]![1].signal.aborted).toBe(false); release();
    const result = await right; expect(result.maiaEvidence).toBe(await acquire.mock.results[0]!.value);
    expect(h.engines.calls).toHaveLength(1); expect(h.selector.cacheSize()).toBe(1);
  });

  it("does not retain a late task when all selection waiters leave", async () => {
    const h = harness(); let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), acquire = h.source.acquire.bind(h.source);
    h.source.acquire = async (...args) => { const value = await acquire(...args); await gate; return value; };
    const controller = new AbortController(), pending = h.selector.selectWithMaiaEvidence(request(), { signal: controller.signal });
    await flush(); controller.abort(); await expect(pending).rejects.toBeDefined(); release(); await flush();
    expect(h.selector.cacheSize()).toBe(0); expect(h.raw).not.toHaveBeenCalled();
  });

  it("keeps task references inside the existing bounded TTL selection cache and refuses old generations", async () => {
    const h = harness(), selector = new OpponentSelector(h.client, { maiaTaskSource: h.source, sampleRequestId: h.ids, cache: { maxEntries: 2, ttlMs: 100 }, monotonicNowMs: h.clock.now, wallNow: h.clock.wall });
    const first = await selector.selectWithMaiaEvidence(request());
    await selector.select(request({ seed: 2 })); await selector.select(request({ seed: 3 })); expect(selector.cacheSize()).toBe(2);
    const evicted = await selector.selectWithMaiaEvidence(request()); expect(evicted.maiaEvidence).not.toBe(first.maiaEvidence);
    h.clock.monotonic += 101;
    const expired = await selector.selectWithMaiaEvidence(request()); expect(expired.maiaEvidence).not.toBe(evicted.maiaEvidence);
    h.engines.generation++;
    const replaced = await selector.selectWithMaiaEvidence(request()); expect(replaced.maiaEvidence?.payload.acquisition.generation).toBe(2);
    expect(replaced.maiaEvidence).not.toBe(expired.maiaEvidence); expect(OPPONENT_SELECTION_CACHE_BOUNDS.maxEntries).toBe(512);
  });

  it("retains exact cached selection/source while health is down but its owning generation is unchanged", async () => {
    const h = harness(), health = await testRegistry({ "maia-inference": "available" });
    const selector = new OpponentSelector(h.client, { maiaTaskSource: h.source, sampleRequestId: h.ids, health, monotonicNowMs: h.clock.now, wallNow: h.clock.wall });
    const first = await selector.selectWithMaiaEvidence(request()), generation = health.generation("maia-inference");
    await driveTo(health, "maia-inference", { failed: "protocol" });
    expect(health.generation("maia-inference")).toBe(generation);
    vi.spyOn(h.engines, "establishedGeneration").mockReturnValue(null);
    const cached = await selector.selectWithMaiaEvidence(request());
    expect(cached.maiaEvidence).toBe(first.maiaEvidence); expect(cached.selection).toBe(first.selection);
    expect(cached.receipt.source).toBe("cached_exact"); expect(h.engines.calls).toHaveLength(1);
  });

  it("invalidates a modern theory selection on task generation replacement even without retained whole-task evidence or health", async () => {
    const h = harness(), input = request({ policy: { ...request().policy, mode: "theory_strict",
      spine: [{ id: "e4", moveUci: "e2e4", children: [] }, { id: "d4", moveUci: "d2d4", children: [] }] } });
    const first = await h.selector.selectWithMaiaEvidence(input);
    expect(first.maiaEvidence).toBeNull(); expect(h.engines.calls).toHaveLength(1);
    expect((await h.selector.selectWithMaiaEvidence(input)).receipt.source).toBe("cached_exact");
    h.engines.generation++;
    const replaced = await h.selector.selectWithMaiaEvidence(input);
    expect(replaced.receipt.source).toBe("live"); expect(replaced.maiaEvidence).toBeNull();
    expect(h.engines.calls).toHaveLength(2); expect(h.raw).not.toHaveBeenCalled();
  });

  it("admits and settles health once per new shared task, never on cached selection/source reuse", async () => {
    const h = harness(), health = await testRegistry({ "maia-inference": "available" });
    const providers = composeProviderTraversalApplication({ engines: h.engines, maiaTaskHealth: health,
      tablebaseFetch: null, explorerFetch: null, explorerToken: null, monotonicNowMs: h.clock.now, wallNow: h.clock.wall });
    const source = new ExchangeMaiaTaskSource({ scheduler: providers.scheduler, engines: h.engines, health, monotonicNowMs: h.clock.now });
    const selector = new OpponentSelector(h.client, { maiaTaskSource: source, sampleRequestId: h.ids, health, monotonicNowMs: h.clock.now, wallNow: h.clock.wall });
    const run = vi.spyOn(health, "run"), settle = vi.spyOn(health, "settle");
    const first = await selector.selectWithMaiaEvidence(request());
    expect(run).toHaveBeenCalledTimes(1); expect(settle).toHaveBeenCalledTimes(1);
    expect(settle.mock.calls[0]![1]).toEqual({ kind: "success" });
    const cached = await selector.selectWithMaiaEvidence(request());
    expect(cached.maiaEvidence).toBe(first.maiaEvidence); expect(cached.receipt.source).toBe("cached_exact");
    // A source-level retained delivery is also an observation, not a fresh provider success.
    const replay = await source.acquire(first.maiaEvidence!.payload.payload.request,
      { signal: new AbortController().signal, deadlineMonotonic: h.clock.now() + 1000 });
    expect(replay.payload.kind).toBe("retained_exact");
    expect(run).toHaveBeenCalledTimes(1); expect(settle).toHaveBeenCalledTimes(1);
    await driveTo(health, "maia-inference", { failed: "protocol" });
    vi.spyOn(h.engines, "establishedGeneration").mockReturnValue(null);
    const failedSnapshot = health.snapshot(); run.mockClear(); settle.mockClear();
    expect((await selector.selectWithMaiaEvidence(request())).maiaEvidence).toBe(first.maiaEvidence);
    expect(health.snapshot()).toEqual(failedSnapshot); expect(run).not.toHaveBeenCalled(); expect(settle).not.toHaveBeenCalled();
    expect(h.engines.calls).toHaveLength(1); expect(h.raw).not.toHaveBeenCalled();
  });

  it("rejects a wrong actual option-image digest before health can record success", async () => {
    const h = harness(), health = await testRegistry({ "maia-inference": "available" }), exchange = h.engines.exchange.bind(h.engines);
    h.engines.exchange = async (...args) => {
      const capture = await exchange(...args);
      return { ...capture, optionImageDigest: runtime.digestEngineOptionImage({ ...capture.optionImage, advertisedUciOptionLines: [] }) };
    };
    const providers = composeProviderTraversalApplication({ engines: h.engines, maiaTaskHealth: health,
      tablebaseFetch: null, explorerFetch: null, explorerToken: null, monotonicNowMs: h.clock.now, wallNow: h.clock.wall });
    const source = new ExchangeMaiaTaskSource({ scheduler: providers.scheduler, engines: h.engines, health, monotonicNowMs: h.clock.now });
    const selector = new OpponentSelector(h.client, { maiaTaskSource: source, sampleRequestId: h.ids, health, monotonicNowMs: h.clock.now, wallNow: h.clock.wall });
    const settle = vi.spyOn(health, "settle");
    await expect(selector.select(request())).rejects.toBeDefined();
    expect(settle).toHaveBeenCalledTimes(1); expect(settle.mock.calls[0]![1]).toEqual({ kind: "failure", reason: "protocol" });
    expect(health.snapshot().providers.find(row => row.instanceId === "maia-inference")).toMatchObject({ state: "unavailable", reason: "protocol" });
    expect(providers.scheduler.stats().retained).toBe(0); expect(selector.cacheSize()).toBe(0); expect(h.raw).not.toHaveBeenCalled();
  });

  it.each(["uuid", "history", "options", "copy", "generation", "failure"] as const)("refuses %s source crossing without raw fallback or cached selection", async fault => {
    const h = harness(), acquire = h.source.acquire.bind(h.source);
    h.source.acquire = async (value, options) => {
      if (fault === "failure") throw new Error("modern source unavailable");
      const evidence = await acquire(fault === "uuid" ? { ...value, sampleRequestId: "ffffffff-ffff-4fff-8fff-ffffffffffff" }
        : fault === "history" ? { ...value, position: { kind: "exact_fen", fen: START_FEN } }
        : fault === "options" ? { ...value, temperature: 0.7 } : value, options);
      if (fault === "generation") h.engines.generation++;
      return fault === "copy" ? { ...evidence } as MaiaTaskEvidence : evidence;
    };
    await expect(h.selector.selectWithMaiaEvidence(request())).rejects.toBeDefined();
    expect(h.raw).not.toHaveBeenCalled(); expect(h.selector.cacheSize()).toBe(0);
  });

  it("compiles the complete exact consumer before source acquisition", async () => {
    const h = harness(), acquire = vi.spyOn(h.source, "acquire");
    vi.spyOn(runtime, "compileEvidenceConsumerExecution").mockImplementation(() => { throw new TypeError("invalid complete task binding"); });
    await expect(h.selector.select(request())).rejects.toThrow("invalid complete task binding");
    expect(acquire).not.toHaveBeenCalled(); expect(h.engines.calls).toHaveLength(0); expect(h.raw).not.toHaveBeenCalled();
  });

  it.each(["human_common", "theory_strict"] as const)("preserves %s selection bytes for equal valid legacy and modern tasks", async mode => {
    const h = harness(), legacy = harness();
    const reply = () => rows(mode === "human_common" ? "d2d4" : "g1f3"); h.engines.respond = reply; legacy.engines.respond = reply;
    const legacyClient: SelectorEngineClient = { health: id => { const health = legacy.engines.health(id); return { ...health, identity: { ...health.identity!, containerDigest: `sha256:${"c".repeat(64)}` } }; },
      execute: async (id, args) => (await legacy.engines.exchange(id, { ...args, timeoutMs: args.timeoutMs ?? 1000, resetCommands: [] })).transcript.filter(line => line.startsWith("< ")).map(line => line.slice(2)) };
    const oldSelector = new OpponentSelector(legacyClient, { monotonicNowMs: legacy.clock.now, wallNow: legacy.clock.wall });
    const input = request({ policy: { ...request().policy, mode, spine: [{ id: "e4", moveUci: "e2e4", children: [] }, { id: "d4", moveUci: "d2d4", children: [] }] } });
    expect(await h.selector.select(input)).toEqual(await oldSelector.select(input)); expect(h.raw).not.toHaveBeenCalled();
  });

  it("keeps all practical-resistance child histories and concession-mass ordering", async () => {
    const h = harness(), startFen = "8/8/8/8/8/2k5/4K3/7R b - - 0 1";
    const tablebase = new FixtureTablebaseSource({
      [startFen]: parseTablebasePosition({ category: "loss", dtz: -20, moves: [{ uci: "c3b3", san: "Kb3", category: "win", dtz: 19, precise_dtz: 19 }, { uci: "c3c2", san: "Kc2", category: "win", dtz: 17, precise_dtz: 17 }] }),
      "8/8/8/8/8/1k6/4K3/7R w - - 1 2": parseTablebasePosition({ category: "win", dtz: 19, moves: [{ uci: "h1h3", san: "Rh3", category: "draw", dtz: 0, precise_dtz: 0 }, { uci: "e2f2", san: "Kf2", category: "loss", dtz: -18, precise_dtz: -18 }] }),
      "8/8/8/8/8/8/2k1K3/7R w - - 1 2": parseTablebasePosition({ category: "win", dtz: 17, moves: [{ uci: "h1h2", san: "Rh2", category: "loss", dtz: -16, precise_dtz: -16 }, { uci: "e2f2", san: "Kf2", category: "draw", dtz: 0, precise_dtz: 0 }] }),
    });
    h.engines.respond = task => task.commands.at(-2)!.endsWith("c3b3") ? ["info multipv 1 policy 0.2 pv h1h3", "info multipv 2 policy 0.8 pv e2f2", "bestmove e2f2"]
      : ["info multipv 1 policy 0.1 pv h1h2", "info multipv 2 policy 0.9 pv e2f2", "bestmove h1h2"];
    const selector = new OpponentSelector(h.client, { maiaTaskSource: h.source, sampleRequestId: h.ids, tablebaseSource: tablebase, monotonicNowMs: h.clock.now, wallNow: h.clock.wall });
    const result = await selector.selectWithMaiaEvidence(request({ startFen, policy: { ...request().policy, mode: "practical_resistance" } }));
    expect(result.selection.moveUci).toBe("c3c2"); expect(result.maiaEvidence).toBeNull();
    expect(h.engines.calls.map(call => call.commands.at(-2))).toEqual([`position fen ${startFen} moves c3b3`, `position fen ${startFen} moves c3c2`]);
    h.engines.generation++;
    const replaced = await selector.selectWithMaiaEvidence(request({ startFen, policy: { ...request().policy, mode: "practical_resistance" } }));
    expect(replaced.receipt.source).toBe("live"); expect(replaced.selection).toEqual(result.selection);
    expect(replaced.maiaEvidence).toBeNull(); expect(h.engines.calls).toHaveLength(4);
  });
});
