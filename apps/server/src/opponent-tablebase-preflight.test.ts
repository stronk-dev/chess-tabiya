import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as runtime from "@chess-tabiya/runtime";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { providerOperationDescriptors } from "./provider-operations.js";
import { ExchangeTablebaseSource } from "./provider-tablebase.js";
import { ControlledFetch, flush, syzygyBody } from "./provider-exchange.test-support.js";

const FEN = "8/8/8/8/8/8/3Q4/k1K5 w - - 0 1";
const originalCompile = runtime.compileEvidenceConsumerExecution;
const faults = ["missing_policy", "impossible_latency", "extra_raw_binding"] as const;
afterEach(() => vi.restoreAllMocks());

async function genuineSource() {
  const remote = new ControlledFetch();
  const scheduler = new ProviderExchangeScheduler({
    descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: remote.fetch, explorerFetch: null, explorerToken: null }),
    maxActive: 1, maxQueued: 4, maxRetainedEntries: 8, maxRetainedWeight: 1_000,
    retentionTtlMs: 10_000, monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString(),
  });
  const source = new ExchangeTablebaseSource({ scheduler, monotonicNowMs: () => performance.now(), timeoutMs: 4_000 });
  const pending = source.probeEvidence(FEN);
  await flush(); remote.respond(0, syzygyBody(FEN));
  return pending;
}

async function applicationControl(fault?: typeof faults[number], faultAt = 1) {
  const delivery = await genuineSource();
  const trace: string[] = [];
  const probe = vi.fn(async () => { throw new Error("modern refusal must not fall back to bare probe"); });
  const probeEvidence = vi.fn(async () => { trace.push("source"); return delivery; });
  const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false,
    tablebaseSource: { kind: "lichess", probe, probeEvidence },
  });
  // Install after startup: these controls attack the live opponent, not another consumer's
  // startup compilation. Use the real compiler and a changed binding image, never a fake error.
  let compiledProbes = 0;
  const compile = vi.spyOn(runtime, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
    if (consumer.id !== "opponent.selection") return originalCompile(manifest, consumer);
    trace.push("compile");
    compiledProbes += 1;
    if (fault === undefined || compiledProbes !== faultAt) return originalCompile(manifest, consumer);
    const bindings = manifest.bindings.filter(row => row.consumer.id === consumer.id && row.consumer.version === consumer.version);
    const first = bindings[0]!;
    const changed = manifest.bindings.map(row => {
      if (row !== first) return row;
      if (fault === "impossible_latency") return { ...row, latency: { mode: "sync" as const, maxMs: 0 } };
      if (fault === "missing_policy") { const { sourceAbsence: _policy, ...bare } = row; return bare; }
      return row;
    });
    if (fault === "extra_raw_binding") changed.push({ ...first, adapter: { id: "adapter.fixture.raw", version: 1 },
      producer: { id: "live.stockfish", version: 1 }, projection: { id: "live.stockfish.uci_response", version: 1 } });
    return originalCompile({ ...manifest, bindings: changed }, consumer);
  });
  try {
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "tablebase_preflight", password: "tablebase-test-password" }) });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    return { application, compile, trace, probe, probeEvidence, async select(mode: "perfect_tablebase" | "practical_resistance") {
      return fetch(`${origin}/select-move`, { method: "POST", headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ startFen: FEN, historyUci: [], seed: 73,
          policy: { mode, policyConfigDigest: `sha256:${"a".repeat(64)}`, ...(mode === "practical_resistance" ? { targetElo: 1800 } : {}) } }) });
    } };
  } catch (error) { compile.mockRestore(); await application.close(); throw error; }
}

describe("actual opponent tablebase complete consumer preflight", () => {
  it.each((["perfect_tablebase", "practical_resistance"] as const).flatMap(mode => faults.map(fault => ({ mode, fault }))))("$mode/$fault refuses before source I/O", { timeout: 30_000 }, async ({ mode, fault }) => {
      const app = await applicationControl(fault);
      try {
        const response = await app.select(mode);
        const body = await response.json();
        expect(response.status, JSON.stringify({ fault, body })).toBe(503);
        expect(body).toMatchObject({ error: { code: "TABLEBASE_UNAVAILABLE" } });
        expect(JSON.stringify(body)).not.toMatch(/bestMove|moveUci|principalVariation|EXECUTION_|BINDING_|adapter\.fixture/iu);
        expect(app.probeEvidence, fault).not.toHaveBeenCalled();
        expect(app.probe, fault).not.toHaveBeenCalled();
        expect(app.trace, fault).toEqual(["compile"]);
        expect(app.compile.mock.calls.some(([, consumer]) => consumer.id === "opponent.selection" && consumer.version === 2)).toBe(true);
      } finally { app.compile.mockRestore(); await app.application.close(); }
  });

  it.each(faults)("rechecks %s before a practical-resistance reply acquisition", { timeout: 30_000 }, async fault => {
    const app = await applicationControl(fault, 2);
    try {
      const response = await app.select("practical_resistance");
      const body = await response.json();
      expect(response.status, JSON.stringify(body)).toBe(503);
      expect(body).toMatchObject({ error: { code: "TABLEBASE_UNAVAILABLE" } });
      expect(JSON.stringify(body)).not.toMatch(/moveUci|principalVariation|EXECUTION_|BINDING_/iu);
      expect(app.trace).toEqual(["compile", "source", "compile"]);
      expect(app.probeEvidence).toHaveBeenCalledTimes(1);
      expect(app.probe).not.toHaveBeenCalled();
    } finally { app.compile.mockRestore(); await app.application.close(); }
  });

  it("compiles the exact complete successor before successful authenticated selection", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    try {
      const response = await app.select("perfect_tablebase");
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ policyModeApplied: "perfect_tablebase", moveUci: expect.any(String) });
      expect(app.trace).toEqual(["compile", "source"]);
      expect(app.probeEvidence).toHaveBeenCalledTimes(1);
      expect(app.probe).not.toHaveBeenCalled();
      expect(app.compile.mock.calls.some(([, consumer]) => consumer.id === "opponent.selection" && consumer.version === 2)).toBe(true);
    } finally { app.compile.mockRestore(); await app.application.close(); }
  });
});
