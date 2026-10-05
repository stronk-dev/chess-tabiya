import type { AddressInfo } from "node:net";
import * as runtime from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { CandidatePopulationService } from "./candidate-population-service.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";

const FEN = "k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1";
const originalCompile = runtime.compileEvidenceConsumerExecution;
const faults = ["missing_policy", "impossible_latency", "extra_raw_binding"] as const;
type Fault = typeof faults[number];
afterEach(() => vi.restoreAllMocks());

async function control(initialFault?: Fault) {
  const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
  try {
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "hint_preflight", password: "hint-test-password" }) });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const headers = { "content-type": "application/json", cookie, "x-writer-id": "hint-preflight-writer" };
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    const created = await post("/runs", { id: "hint-preflight", session: { kind: "position", start: { fen: FEN, side: "white" },
      feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3 });
    expect(created.status, await created.clone().text()).toBe(201);
    expect((await post("/runs/hint-preflight/reveal", {})).status).toBe(200);
    const graph = await (await fetch(`${origin}/runs/hint-preflight/graph`, { headers })).json() as { graph: Pick<runtime.DrillRun, "nodes" | "branches" | "activeCursor"> };
    const events = await (await fetch(`${origin}/runs/hint-preflight/events?sinceSeq=0`, { headers })).json() as { events: runtime.DrillRun["events"] };
    const decision = runtime.hintDecisionStamp({ id: "hint-preflight", feedbackPolicy: "attempt_end", ...graph.graph, events: events.events } as runtime.DrillRun);
    // Installed after composition/auth/reveal. Only the live Hint operation is attacked;
    // fault controls run the real compiler over changed declarations, not a fake rejection.
    let fault = initialFault;
    const trace: string[] = [];
    const compile = vi.spyOn(runtime, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
      if (consumer.id !== "module.guided_hint") return originalCompile(manifest, consumer);
      trace.push("compile");
      if (fault === undefined) return originalCompile(manifest, consumer);
      const first = manifest.bindings.find(row => row.consumer.id === consumer.id && row.consumer.version === consumer.version)!;
      const changed = manifest.bindings.map(row => {
        if (row !== first) return row;
        if (fault === "impossible_latency") return { ...row, latency: { mode: "sync" as const, maxMs: 0 } };
        if (fault === "missing_policy") { const { sourceAbsence: _policy, ...bare } = row; return bare; }
        return row;
      });
      if (fault === "extra_raw_binding") changed.push({ ...first, adapter: { id: "adapter.fixture.hint_raw", version: 1 },
        producer: { id: "live.stockfish", version: 1 }, projection: { id: "live.stockfish.uci_response", version: 1 } });
      return originalCompile({ ...manifest, bindings: changed }, consumer);
    });
    const start = vi.spyOn(MockProviderEngineClient.prototype, "start");
    const exchange = vi.spyOn(MockProviderEngineClient.prototype, "exchange");
    const packets = vi.spyOn(CandidatePopulationService.prototype, "wide");
    const ask = async (rung: runtime.HintRung) => {
      const response = await post("/runs/hint-preflight/hints", { nodeId: graph.graph.activeCursor.nodeId, rung, decisionDigest: decision.digest,
        assistance: runtime.compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) });
      expect(response.status, await response.clone().text()).toBe(200);
      return runtime.parseHintResponse((await response.json() as { hint: unknown }).hint);
    };
    const settle = async (first: runtime.HintResponse) => {
      let result = first;
      for (let attempt = 0; attempt < 400 && result.state === "pending"; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 25));
        const response = await fetch(`${origin}/runs/hint-preflight/hints/${result.requestId}`, { headers });
        expect(response.status).toBe(200);
        result = runtime.parseHintResponse((await response.json() as { hint: unknown }).hint);
      }
      return result;
    };
    return { application, compile, trace, start, exchange, packets, ask, settle, fault(value: Fault) { fault = value; } };
  } catch (error) { vi.restoreAllMocks(); await application.close(); throw error; }
}

describe("authenticated complete Guided Hint preflight", () => {
  it.each(faults)("%s refuses before engine identity, search or candidate acquisition", { timeout: 30_000 }, async fault => {
    const app = await control(fault);
    try {
      expect(await app.ask("pattern")).toEqual({ state: "failed", requestId: expect.stringMatching(/^[a-f0-9]{32}$/u), rung: "pattern", reason: "contract_violation" });
      expect(app.trace).toEqual(["compile"]);
      expect(app.start).not.toHaveBeenCalled();
      expect(app.exchange).not.toHaveBeenCalled();
      expect(app.packets).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); await app.application.close(); }
  });

  it.each(faults)("%s cannot reuse a previously valid cached horizon", { timeout: 30_000 }, async fault => {
    const app = await control();
    try {
      const first = await app.settle(await app.ask("pattern"));
      expect(first.state).toBe("available");
      app.start.mockClear(); app.exchange.mockClear(); app.packets.mockClear(); app.trace.length = 0;
      app.fault(fault);
      expect(await app.ask("distance")).toEqual({ state: "failed", requestId: expect.stringMatching(/^[a-f0-9]{32}$/u), rung: "distance", reason: "contract_violation" });
      expect(app.trace).toEqual(["compile"]);
      expect(app.start).not.toHaveBeenCalled(); expect(app.exchange).not.toHaveBeenCalled(); expect(app.packets).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); await app.application.close(); }
  });

  it("preflights each authenticated request and retains one shared search for all permitted rungs", { timeout: 30_000 }, async () => {
    const app = await control();
    try {
      for (const rung of ["pattern", "square", "piece", "distance"] as const) {
        const result = await app.settle(await app.ask(rung));
        expect(result.state).toBe("available");
        if (result.state === "available") expect(result.delivery.marks.rung).toBe(rung);
      }
      expect(app.trace).toEqual(["compile", "compile", "compile", "compile"]);
      expect(app.compile.mock.calls.filter(([, consumer]) => consumer.id === "module.guided_hint").every(([, consumer]) => consumer.version === 1)).toBe(true);
      expect(app.exchange).toHaveBeenCalledTimes(1);
      expect(app.packets).toHaveBeenCalledTimes(1);
    } finally { vi.restoreAllMocks(); await app.application.close(); }
  });
});
