import { describe, expect, it } from "vitest";
import { ProviderRequestInvalid, assertDeclaredEvidence, assertProviderDelivery, providerSourceEvidence, type MaiaInferenceTaskRequest } from "@chess-tabiya/runtime";
import { maiaTaskRequest } from "../../../packages/runtime/src/provider-test-fixtures.js";
import type { EngineExchangeCapture, EngineExchangeRequest } from "./engine-supervisor.js";
import { FakeEngines, ManualClock, flush } from "./provider-exchange.test-support.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { providerOperationDescriptors } from "./provider-operations.js";

/** Scripted engine capture, not a real-model discharge. Exercise the real descriptor/exchange. */
class TaskEngines extends FakeEngines {
  release: Promise<void> = Promise.resolve();
  constructor() {
    super();
    this.maiaOptions.push({ name: "SelfElo", type: "spin", default: "1400", min: 0, max: 3000 }, { name: "OppoElo", type: "spin", default: "1500", min: 0, max: 3000 });
    this.respond = () => ["info multipv 1 policy 0.4 score cp 12 wdl 400 300 300 pv e2e4", "info multipv 3 pv d2d4", "bestmove g1f3"];
  }
  override async exchange(engineId: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture> {
    const capture = await super.exchange(engineId, request);
    await this.release;
    if (request.signal?.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
    return capture;
  }
}
function harness() {
  const engines = new TaskEngines(), clock = new ManualClock();
  const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines, tablebaseFetch: null, explorerFetch: null, explorerToken: null }),
    maxActive: 2, maxQueued: 4, maxRetainedEntries: 8, maxRetainedWeight: 100, retentionTtlMs: 10_000,
    monotonicNowMs: clock.now, wallNow: clock.wall, timers: clock });
  const get = (request: MaiaInferenceTaskRequest = maiaTaskRequest(), signal = new AbortController().signal) => scheduler.get({ operation: "maia.inference_task@1", request }, { id: "maia-task-source-test", budgetMs: 5000 }, signal);
  return { engines, clock, scheduler, get };
}

describe("Maia task source through the actual registered shared exchange", () => {
  it("retains genuine same-task sampled move, full candidate operands and original capture defaults", async () => {
    const h = harness(), result = await h.get();
    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error(JSON.stringify(result));
    assertProviderDelivery("maia.inference_task@1", result.delivery);
    expect(result.delivery.acquisition.actualIdentity.optionImage.appliedSetoptionCommands).toEqual([]);
    expect(result.delivery.payload).toMatchObject({ appliedBand: 1500, termination: { rawBestMoveUci: "g1f3", moveUci: "g1f3" },
      candidates: [{ moveUci: "e2e4", rank: 1, mass: 0.4, scoreCp: 12, wdl: { win: 400, draw: 300, loss: 300 } }, { moveUci: "d2d4", rank: 3, mass: null, scoreCp: null, wdl: null }] });
    expect(h.engines.calls[0]!.commands.slice(0, 4)).toEqual(["setoption name SelfElo value 1400", "setoption name OppoElo value 1500", "setoption name Elo value 1500", "setoption name Temperature value 1"]);
    expect(h.engines.calls[0]!.commands.some(command => command.includes(result.delivery.payload.request.sampleRequestId))).toBe(false);
    const source = providerSourceEvidence("maia.inference_task@1", result.delivery);
    assertDeclaredEvidence(source); expect(source.payload).toBe(result.delivery);
    for (const forged of [{ ...result.delivery }, JSON.parse(JSON.stringify(result.delivery)), result.delivery.payload]) {
      expect(() => providerSourceEvidence("maia.inference_task@1", forged as never)).toThrow();
    }
  });

  it("reuses only the identical draw and isolates new UUIDs at pending and retained boundaries", async () => {
    const h = harness(); let release!: () => void;
    h.engines.release = new Promise(resolve => { release = resolve; });
    const cancelled = new AbortController(), request = maiaTaskRequest();
    const first = h.get(request, cancelled.signal), same = h.get(request), next = h.get({ ...request, sampleRequestId: "00000000-0000-4000-8000-000000000002" });
    await flush(); expect(h.engines.calls).toHaveLength(2);
    cancelled.abort(); expect(await first).toMatchObject({ kind: "source_failure", reason: "cancelled" });
    expect(h.engines.calls[0]!.signal!.aborted).toBe(false);
    release();
    const [original, different] = await Promise.all([same, next]);
    expect(original.kind).toBe("success"); expect(different.kind).toBe("success");
    const replay = await h.get(request);
    expect(replay).toMatchObject({ kind: "success", delivery: { kind: "retained_exact" } });
    if (original.kind !== "success" || replay.kind !== "success" || different.kind !== "success") throw new Error("expected all draw observations");
    expect(replay.delivery.acquisition).toBe(original.delivery.acquisition);
    expect(different.delivery.acquisition.normalizedRequestDigest).not.toBe(original.delivery.acquisition.normalizedRequestDigest);
    expect(h.engines.calls).toHaveLength(2);
    h.engines.generation++;
    expect(await h.get(request)).toMatchObject({ kind: "success", delivery: { kind: "live" } });
    expect(h.engines.calls).toHaveLength(3);
  });

  it("keeps distinct ordered histories even when they reach the same complete FEN", async () => {
    const h = harness(), root = maiaTaskRequest();
    const a = { kind: "history_conditioned" as const, startFen: root.position.kind === "exact_fen" ? root.position.fen : root.position.startFen, historyUci: ["g1f3", "g8f6", "b1c3", "b8c6"] };
    const b = { ...a, historyUci: ["b1c3", "b8c6", "g1f3", "g8f6"] };
    h.engines.respond = () => ["bestmove e2e4"];
    const first = await h.get({ ...root, position: a }), second = await h.get({ ...root, position: b });
    expect(first.kind).toBe("success"); expect(second.kind).toBe("success"); expect(h.engines.calls).toHaveLength(2);
    expect(h.engines.calls.map(call => call.commands.at(-2))).toEqual([`position fen ${a.startFen} moves ${a.historyUci.join(" ")}`, `position fen ${a.startFen} moves ${b.historyUci.join(" ")}`]);
  });

  it.each(["width", "model", "band"] as const)("refuses invalid %s before UCI work without clamping", async fault => {
    const h = harness(), request = maiaTaskRequest(fault === "width" ? { requestedWidth: 21 } : fault === "band" ? { band: 999 } : { requestedModel: { id: "foreign", version: "foreign" } });
    if (fault === "model") expect(await h.get(request)).toMatchObject({ kind: "source_failure", reason: "identity_mismatch" });
    else await expect(h.get(request)).rejects.toThrow(ProviderRequestInvalid);
    expect(h.engines.calls).toHaveLength(0);
  });

  it("rejects changed generation, malformed task and mutated actual option image without retaining success", async () => {
    for (const fault of ["generation", "protocol", "option-image"] as const) {
      const h = harness(), exchange = h.engines.exchange.bind(h.engines);
      if (fault === "generation") h.engines.respond = () => { h.engines.generation++; return ["bestmove e2e4"]; };
      if (fault === "protocol") h.engines.respond = () => ["bestmove e2e4", "info multipv 1 pv d2d4"];
      if (fault === "option-image") h.engines.exchange = async (...args) => {
        const capture = await exchange(...args);
        return { ...capture, optionImage: { ...capture.optionImage, advertisedUciOptionLines: [] } };
      };
      expect(await h.get()).toMatchObject({ kind: "source_failure" });
      expect(h.scheduler.stats().retained).toBe(0);
    }
  });
});
