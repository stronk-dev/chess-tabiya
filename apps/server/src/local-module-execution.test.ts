import type { AddressInfo } from "node:net";
import * as runtime from "@chess-tabiya/runtime";
import * as execution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { afterEach, describe, expect, it, onTestFailed, vi } from "vitest";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { responseStatus } from "./http-response.test-support.js";
import { ShapeRegistry } from "./shape-registry.js";

const FEN = "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";
const modules = ["sight_on_request", "threat_radar", "blunder_prevention", "structure_nudge"] as const;
type LocalModule = typeof modules[number];
const faults = ["missing_policy", "impossible_latency", "extra_raw_binding"] as const;
type Fault = typeof faults[number];
const originalCompile = execution.compileEvidenceConsumerExecution;
const originalRoute = routes.invokeEvidenceValueRoute;
afterEach(() => vi.restoreAllMocks());

async function control(module: LocalModule, fault?: Fault, disclose = true) {
  const started = performance.now();
  const boundaries: string[] = [];
  const boundary = (stage: string) => boundaries.push(`${Math.round(performance.now() - started)}ms ${stage}`);
  boundary("compose application");
  onTestFailed(() => console.error(`Local Support (${module}) lifecycle: ${boundaries.join(" → ")}`));
  vi.spyOn(console, "info").mockImplementation(() => {});
  const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
  const close = async () => {
    boundary("close application");
    await application.close();
    boundary("application closed");
  };
  try {
    boundary("listen");
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const request = async (path: string, init: RequestInit) => {
      boundary(`request ${path}`);
      const response = await fetch(`${origin}${path}`, init);
      boundary(`headers ${path}`);
      return response;
    };
    const registered = await request("/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "local_module", password: "local-module-password" }) });
    expect(await responseStatus(registered)).toBe(201);
    const headers = { "content-type": "application/json", cookie: registered.headers.get("set-cookie")!.split(";", 1)[0]!, "x-writer-id": "local-module-writer" };
    const post = (path: string, body: unknown) => request(path, { method: "POST", headers, body: JSON.stringify(body) });
    const created = await post("/runs", { id: "local-module", session: { kind: "position", start: { fen: FEN, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4 });
    expect(created.status, await created.text()).toBe(201);
    if (module === "structure_nudge") {
      const moved = await post("/runs/local-module/moves", { uci: "g8f6" });
      expect(moved.status, await moved.text()).toBe(200);
      if (disclose) expect(await responseStatus(post("/runs/local-module/reveal", {}))).toBe(200);
    }
    const graph = await (await request("/runs/local-module/graph", { headers })).json() as { graph: Pick<runtime.DrillRun, "activeCursor"> };
    boundary("graph body read");
    const nodeId = graph.graph.activeCursor.nodeId;
    const trace: string[] = [];
    const originalShapes = ShapeRegistry.prototype.list;
    const prepare = vi.spyOn(ShapeRegistry.prototype, "list").mockImplementation(function (this: ShapeRegistry) {
      trace.push("prepare");
      return originalShapes.call(this);
    });
    const compile = vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
      trace.push(`compile:${consumer.id}@${consumer.version}`);
      if (consumer.id !== `module.${module}` || fault === undefined) return originalCompile(manifest, consumer);
      const first = manifest.bindings.find(row => row.consumer.id === consumer.id && row.consumer.version === consumer.version)!;
      expect(first).toBeDefined();
      // Add a genuine provider requirement to the complete consumer. The real compiler,
      // not a stubbed rejection, must detect its missing policy/latency/source contract.
      const extra = { ...first, adapter: { id: "adapter.fixture.local_execution", version: 1 }, producer: { id: "live.stockfish", version: 1 },
        projection: { id: fault === "extra_raw_binding" ? "live.stockfish.uci_response" : "live.stockfish.position_eval", version: 1 },
        latency: { mode: fault === "impossible_latency" ? "sync" as const : "interactive" as const, maxMs: 1000 },
        ...(fault === "missing_policy" ? {} : { sourceAbsence: { necessity: "required" as const, whenNoPath: "operation_unavailable" as const } }),
      };
      return originalCompile({ ...manifest, bindings: [...manifest.bindings, extra] }, consumer);
    });
    const collect = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
      trace.push(`collect:${args[0]}`);
      return originalRoute(...args);
    });
    const query: runtime.ModuleQueryRequest = module === "structure_nudge"
      ? { timing: "post_commit", subjectNodeId: nodeId, requested: [] }
      : module === "blunder_prevention" ? { timing: "at_commit", nodeId, candidateUci: "g8f6", generation: 1 }
        : { timing: "pre_commit", nodeId, selectedSquare: "c6", requested: [module] };
    const ask = (preset: "quiet" | "support" | "guided" = module === "structure_nudge" ? "guided" : "support", overrideQuery: runtime.ModuleQueryRequest = query, isolate = true) => post("/runs/local-module/modules/query", {
      assistance: runtime.compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset, overrides: {}, moduleOverrides: { include: [], exclude: isolate ? runtime.MODULE_IDS.filter((id): id is Exclude<runtime.ModuleId, "rules_floor"> => id !== module && id !== "rules_floor") : [] } } }),
      query: overrideQuery,
    });
    return { application, close, ask, query, trace, compile, collect, prepare, fault(value?: Fault) { fault = value; } };
  } catch (error) { vi.restoreAllMocks(); await close(); throw error; }
}

describe("authenticated complete local Support execution", () => {
  for (const module of modules) {
    it.each(faults)(`${module}: %s refuses before any collector`, async fault => {
      const app = await control(module, fault);
      try {
        const response = await app.ask();
        const body = await response.json();
        expect(response.status).toBe(503);
        expect(body).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE", message: "Module execution contract is unavailable" } });
        expect(app.trace).toEqual([`compile:module.${module}@1`]);
        expect(app.collect).not.toHaveBeenCalled();
        expect(app.prepare).not.toHaveBeenCalled();
      } finally { vi.restoreAllMocks(); await app.close(); }
    });

    it(`${module}: real valid delivery follows complete preflight`, async () => {
      const app = await control(module);
      try {
        const response = await app.ask();
        const body = await response.text();
        expect(response.status, body).toBe(200);
        const page = (JSON.parse(body) as { page: runtime.ModuleQueryPage }).page;
        expect(page.packets.map(packet => packet.module)).toEqual([module]);
        expect(app.trace[0]).toBe(`compile:module.${module}@1`);
        expect(app.collect).toHaveBeenCalled();
        expect(app.prepare).toHaveBeenCalledTimes(1);
        for (const packet of page.packets) {
          const { digest, ...body } = packet.disclosure;
          expect(runtime.moduleDisclosureDigest(body)).toBe(digest);
          for (const item of runtime.parsePresentationReceipt(packet.receipt)) expect(runtime.presentedSentence(item)).not.toMatch(/detector|\b[a-h][1-8][a-h][1-8]\b/u);
        }
      } finally { vi.restoreAllMocks(); await app.close(); }
    });

    it(`${module}: Quiet suppresses even a broken contract without collection`, async () => {
      const app = await control(module, "extra_raw_binding");
      try {
        const response = await app.ask("quiet");
        const body = await response.json() as { page: runtime.ModuleQueryPage };
        expect(response.status).toBe(200);
        expect(body.page.packets).toEqual([]);
        expect(app.trace).toEqual([]);
      } finally { vi.restoreAllMocks(); await app.close(); }
    });
  }

  it("checks all effective local consumers before an earlier valid module can collect", async () => {
    const app = await control("threat_radar", "missing_policy");
    try {
      const response = await app.ask("support", { ...app.query, timing: "pre_commit", nodeId: "nodeId" in app.query ? app.query.nodeId : "", selectedSquare: "c6", requested: ["sight_on_request", "threat_radar"] }, false);
      expect(await responseStatus(response)).toBe(503);
      expect(app.trace).toEqual(["compile:module.sight_on_request@1", "compile:module.threat_radar@1"]);
      expect(app.collect).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); await app.close(); }
  });

  it("checks every repeated decision request, not only the first valid request", async () => {
    const app = await control("sight_on_request");
    try {
      expect(await responseStatus(app.ask())).toBe(200);
      app.trace.length = 0; app.collect.mockClear(); app.fault("missing_policy");
      expect(await responseStatus(app.ask())).toBe(503);
      expect(app.trace).toEqual(["compile:module.sight_on_request@1"]);
      expect(app.collect).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); await app.close(); }
  });

  it("does not prepare or compile Sight without a selected square", async () => {
    const app = await control("sight_on_request", "missing_policy");
    try {
      const nodeId = "nodeId" in app.query ? app.query.nodeId : "";
      const response = await app.ask("support", { timing: "pre_commit", nodeId, requested: ["sight_on_request"] });
      const page = (await response.json() as { page: runtime.ModuleQueryPage }).page;
      expect(response.status).toBe(200);
      expect(page.packets).toEqual([]);
      expect(page.suppressions).toEqual([{ module: "sight_on_request", reason: "no_square" }]);
      expect(app.trace).toEqual([]);
    } finally { vi.restoreAllMocks(); await app.close(); }
  });

  it("does not preflight an unopened on-request module", async () => {
    const app = await control("threat_radar", "extra_raw_binding");
    try {
      const nodeId = "nodeId" in app.query ? app.query.nodeId : "";
      const response = await app.ask("support", { timing: "pre_commit", nodeId, requested: [] });
      const body = await response.json() as { page: runtime.ModuleQueryPage };
      expect(response.status).toBe(200);
      expect(body.page.packets).toEqual([]);
      expect(app.trace).toEqual([]);
    } finally { vi.restoreAllMocks(); await app.close(); }
  });

  it("preserves timing suppression ahead of source preparation and execution", async () => {
    const app = await control("structure_nudge", "extra_raw_binding");
    try {
      const nodeId = "subjectNodeId" in app.query ? app.query.subjectNodeId : "";
      const response = await app.ask("guided", { timing: "checkpoint", nodeId, requested: ["structure_nudge"] });
      const page = (await response.json() as { page: runtime.ModuleQueryPage }).page;
      expect(response.status).toBe(200);
      expect(page.packets).toEqual([]);
      expect(page.suppressions).toEqual([{ module: "structure_nudge", reason: "timing_outside_module" }]);
      expect(app.trace).toEqual([]);
    } finally { vi.restoreAllMocks(); await app.close(); }
  });

  it("keeps post-commit disclosure closed even when its module contract is broken", async () => {
    const app = await control("structure_nudge", "missing_policy", false);
    try {
      const response = await app.ask();
      const body = await response.json() as { error: { code: string } };
      expect(response.status).toBe(409);
      expect(body.error.code).toBe("ASSISTANCE_WITHHELD");
      expect(app.trace).toEqual([]);
    } finally { vi.restoreAllMocks(); await app.close(); }
  });
});
