import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import { branchPath, exactLegalMoves, providerSourceEvidence, type SyzygyPositionRequest } from "@chess-tabiya/runtime";

import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { ControlledFetch, ManualClock, flush, syzygyBody } from "./provider-exchange.test-support.js";
import { providerOperationDescriptors } from "./provider-operations.js";
import { testRegistry } from "./provider-health.test-support.js";
import { ExchangeTablebaseSource, healthAdmittedSyzygyOperation } from "./provider-tablebase.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { RunService } from "./service.js";
import { createRestHandler } from "./rest.js";
import { SQLiteRunStorage } from "./storage.js";
import { OpponentSelector } from "./opponent-selector.js";
import type { TablebaseProbeEvidence, TablebaseSource } from "./tablebase.js";

const FEN = "8/8/8/8/8/8/3Q4/k1K5 w - - 0 1";
const OTHER = "8/8/8/8/8/8/3R4/k1K5 w - - 0 1";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const request = (fen = FEN): SyzygyPositionRequest => ({ rules: "chess", variant: "standard", fen, timeoutMs: 4_000 });

async function harness() {
  const clock = new ManualClock();
  const healthClock = { get now() { return clock.monotonic; }, set now(value: number) { clock.monotonic = value; }, wall: clock.wall(), advance: () => undefined };
  const health = await testRegistry({ "tablebase-primary": "unverified", "explorer-primary": "unverified" }, { clock: healthClock });
  const remote = new ControlledFetch();
  const base = providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null });
  const scheduler = new ProviderExchangeScheduler({
    descriptors: { ...base, "syzygy.position@1": healthAdmittedSyzygyOperation(remote.fetch, health) },
    maxActive: 2, maxQueued: 4, maxRetainedEntries: 8, maxRetainedWeight: 1_000,
    retentionTtlMs: 10_000, monotonicNowMs: clock.now, wallNow: clock.wall, timers: clock,
  });
  health.registerCacheInventory("tablebase-primary", scheduler.retainedInventory("syzygy.position@1"));
  const source = new ExchangeTablebaseSource({ scheduler, monotonicNowMs: clock.now, timeoutMs: 4_000, health });
  return { source, scheduler, clock, remote, health };
}

describe("learner Syzygy shared exchange", () => {
  async function queuedTablebase(source: TablebaseSource) {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    const queue = new EvidenceJobQueue({ async execute() { throw new Error("tablebase work must not run the engine executor"); } }, {
      tablebaseSource: source, retry: { maxAttempts: 1, retryDelayMs: 0 },
    });
    const service = new RunService(storage, { evidenceQueue: queue });
    const run = await service.create({
      id: "whole-source-tablebase-worker", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73, createdAt: "2026-10-05T00:00:00.000Z",
    }, "writer");
    const root = run.nodes[0]!;
    storage.admitInternalEvidence(run.id, [{
      origin: "run_enrichment", idempotencyKey: `queued-whole-source@1:${root.id}`,
      request: { schema: "evidence_batch_request@1", runId: run.id, origin: "run_enrichment", jobs: [{ schema: "evidence_job_request@1", runId: run.id, nodeId: root.id, fen: FEN, kind: "tablebase", depth: null, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null }] },
    }]);
    return { storage, queue, service, run };
  }

  it("admits the whole source before staging the actual durable tablebase packet", async () => {
    const { source, remote } = await harness();
    const bare = vi.spyOn(source, "probe").mockRejectedValue(new Error("durable modern source must not use bare probe"));
    const app = await queuedTablebase(source);
    try {
      await flush(); expect(remote.calls).toHaveLength(1);
      remote.respond(0, syzygyBody(FEN));
      await app.queue.whenIdle();
      expect(app.storage.evidenceJobs.jobsForRun(app.run.id)).toMatchObject([{ state: "settled_success" }]);
      expect(app.queue.page(app.run.id).results).toMatchObject([{ payload: { kind: "tablebase", values: { fen: FEN, category: "win", pieceCount: 3, sourceId: "tablebase.lichess.org" } } }]);
      app.service.reveal(app.run.id, "writer", "2026-10-05T00:00:01.000Z");
      const handler = createRestHandler(app.service);
      const applied = await handler(new Request(`http://tabiya.test/runs/${app.run.id}/evidence`, { method: "POST", headers: { "x-writer-id": "writer", "content-type": "application/json" }, body: JSON.stringify({ resultSeq: app.queue.page(app.run.id).results[0]!.seq, at: "2026-10-05T00:00:01.000Z" }) }));
      expect(applied.status).toBe(200);
      expect(app.storage.read(app.run.id)!.run.events.filter(event => event.type === "evidence.attached")).toMatchObject([{ data: { payload: { kind: "tablebase", values: { fen: FEN, category: "win" } } } }]);
      expect(bare).not.toHaveBeenCalled();
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      await app.queue.close(); app.storage.close(); bare.mockRestore();
    }
  });

  it.each(["position", "halfmove", "fullmove", "clone", "failure"])("does not stage an exact durable fact from a modern %s defect", async arm => {
    const { source, remote } = await harness();
    const fen = arm === "position" ? OTHER : arm === "halfmove" ? FEN.replace("0 1", "1 1") : arm === "fullmove" ? FEN.replace("0 1", "0 2") : FEN;
    const pending = source.probeEvidence(fen);
    await flush(); remote.respond(0, syzygyBody(fen));
    const evidence = await pending;
    const bare = vi.fn(async () => ({ category: "win" as const, dtz: 1, moves: [] }));
    const app = await queuedTablebase({ kind: "lichess", probe: bare, async probeEvidence() {
      if (arm === "failure") throw new Error("source unavailable");
      return arm === "clone" ? { ...evidence } as TablebaseProbeEvidence : evidence;
    } });
    try {
      await app.queue.whenIdle();
      expect(bare).not.toHaveBeenCalled();
      expect(app.queue.page(app.run.id).results).toEqual([]);
      const jobs = app.storage.evidenceJobs.jobsForRun(app.run.id);
      expect(jobs).toMatchObject([{ state: "settled_empty", settlement: { kind: "empty", reason: "provider_unavailable" } }]);
      expect(app.storage.read(app.run.id)!.run.events.filter(event => event.type === "evidence.attached")).toEqual([]);
    } finally { await app.queue.close(); app.storage.close(); }
  });

  async function decidedness(source: TablebaseSource, disclosed = true, fen = FEN) {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    const queue = new EvidenceJobQueue({ async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0, perspective: "white" } }; } });
    const service = new RunService(storage, { tablebaseSource: source, evidenceQueue: queue });
    const at = "2026-10-04T12:00:00.000Z";
    const run = await service.create({
      id: "whole-source-decidedness", session: { kind: "position", start: { fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73, createdAt: at,
    }, "writer");
    if (disclosed) service.reveal(run.id, "writer", at);
    const handler = createRestHandler(service);
    return { storage, service, queue, run, async read() {
      const response = await handler(new Request(`http://tabiya.test/runs/${run.id}/branch-decidedness`, { method: "POST", headers: { "content-type": "application/json", "x-writer-id": "writer" }, body: JSON.stringify({ branchIds: [run.branches[0]!.id] }) }));
      expect(response.status).toBe(200);
      return (await response.json() as { decidedness: Record<string, unknown> }).decidedness[run.branches[0]!.id];
    } };
  }

  it("uses the whole source at the actual branch-decidedness HTTP boundary and retains exact answers", async () => {
    const { source, remote } = await harness();
    const bare = vi.spyOn(source, "probe").mockRejectedValue(new Error("bare probe must not be used"));
    const app = await decidedness(source);
    const pending = app.read();
    try {
      await flush();
      expect(remote.calls).toHaveLength(1);
      remote.respond(0, syzygyBody(FEN));
      expect(await pending).toMatchObject({ state: "decided", ground: { kind: "tablebase", category: "win", nodeId: app.run.nodes[0]!.id, pieces: 3 } });
      expect(await app.read()).toMatchObject({ state: "decided", ground: { category: "win" } });
      expect(remote.calls).toHaveLength(1);
      expect(bare).not.toHaveBeenCalled();
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      await pending;
      app.storage.close(); bare.mockRestore();
    }
  });

  it.each([OTHER, FEN.replace("0 1", "1 2")])("cannot decide a branch from another sealed exact FEN (%s)", async crossedFen => {
    const { source, remote } = await harness();
    const pending = source.probeEvidence(crossedFen);
    await flush(); remote.respond(0, syzygyBody(crossedFen));
    const evidence = await pending;
    const bare = vi.fn(async () => ({ category: "win" as const, dtz: 1, moves: [] }));
    const app = await decidedness({ kind: "lichess", probe: bare, async probeEvidence() { return evidence; } });
    try {
      expect(await app.read()).toEqual({ state: "unknown", reason: "provider_unavailable" });
      expect(bare).not.toHaveBeenCalled();
    } finally { app.storage.close(); }
  });

  it.each(["clone", "failure"])("never turns a modern %s into a bare decidedness answer", async arm => {
    const { source, remote } = await harness();
    const pending = source.probeEvidence(FEN);
    await flush(); remote.respond(0, syzygyBody(FEN));
    const evidence = await pending;
    const bare = vi.fn(async () => ({ category: "win" as const, dtz: 1, moves: [] }));
    const app = await decidedness({ kind: "lichess", probe: bare, async probeEvidence() {
      if (arm === "failure") throw new Error("source unavailable");
      return { ...evidence } as TablebaseProbeEvidence;
    } });
    try {
      expect(await app.read()).toEqual({ state: "unknown", reason: "provider_unavailable" });
      expect(bare).not.toHaveBeenCalled();
    } finally { app.storage.close(); }
  });

  it.each([false, true])("does not acquire tablebase evidence when feedback is withheld or material is outside domain (domain=%s)", async outside => {
    const { source, remote } = await harness();
    const whole = vi.spyOn(source, "probeEvidence"), bare = vi.spyOn(source, "probe");
    const app = await decidedness(source, outside, outside ? START : FEN);
    try {
      expect(await app.read()).toEqual({ state: "unknown", reason: outside ? "out_of_range" : "withheld" });
      expect(whole).not.toHaveBeenCalled(); expect(bare).not.toHaveBeenCalled(); expect(remote.calls).toHaveLength(0);
    } finally { app.storage.close(); whole.mockRestore(); bare.mockRestore(); }
  });

  it.each([false, true])("does not attach an in-flight answer to a newly advanced branch (reopened=%s)", async reopened => {
    const { source, remote } = await harness();
    const app = await decidedness(source);
    const pending = app.read();
    try {
      await flush(); expect(remote.calls).toHaveLength(1);
      app.service.move(app.run.id, "writer", "d2d3", { at: "2026-10-04T12:00:01.000Z" });
      if (reopened) app.service.reveal(app.run.id, "writer", "2026-10-04T12:00:02.000Z");
      remote.respond(0, syzygyBody(FEN));
      expect(await pending).toEqual({ state: "unknown", reason: reopened ? "not_probed" : "withheld" });
      if (!reopened) {
        expect(await app.read()).toEqual({ state: "unknown", reason: "withheld" });
        expect(remote.calls).toHaveLength(1);
      }
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      await pending; await app.queue.close(); app.storage.close();
    }
  });

  it.each(["window", "grant"])("stops a multi-branch acquisition after the %s changes during the first probe", async arm => {
    const { source, remote } = await harness();
    const app = await decidedness(source);
    const at = "2026-10-04T12:00:00.000Z";
    app.service.move(app.run.id, "writer", "d2d3", { at });
    const forked = app.service.fork(app.run.id, "writer", app.run.nodes[0]!.id, { at });
    app.service.reveal(app.run.id, "writer", at);
    const reader = { learnerId: "multi-branch-reader", handle: "multi-branch-reader" };
    const actor = { learnerId: "__legacy", writerId: "writer" };
    app.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: at });
    app.storage.grantRole(app.run.id, reader.learnerId, "spectator", actor, at);
    const firstFen = branchPath(forked.run, forked.run.branches[0]!.id).at(-1)!.fen;
    const pending = app.service.branchDecidedness(app.run.id, reader, forked.run.branches.map(branch => branch.id)).then(value => ({ value }), error => ({ error }));
    try {
      await flush(); expect(remote.calls).toHaveLength(1);
      if (arm === "window") app.service.move(app.run.id, "writer", "d2d4", { at });
      else app.storage.revokeGrant(app.run.id, reader.learnerId, actor);
      remote.respond(0, syzygyBody(firstFen));
      await flush();
      // Settle an incorrectly started second request as well, so the negative fails on
      // acquisition count rather than hanging until the test timeout.
      for (let index = 1; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      const result = await pending;
      expect(remote.calls).toHaveLength(1);
      if (arm === "window") expect(result).toEqual({ value: Object.fromEntries(forked.run.branches.map(branch => [branch.id, { state: "unknown", reason: "withheld" }])) });
      else expect(result).toMatchObject({ error: { code: "RUN_NOT_FOUND" } });
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      await pending; await app.queue.close(); app.storage.close();
    }
  });

  it("rechecks a real read grant after acquisition and performs no work for an unauthorized reader", async () => {
    const { source, remote } = await harness();
    const app = await decidedness(source);
    const reader = { learnerId: "comparison-reader", handle: "comparison-reader" };
    const actor = { learnerId: "__legacy", writerId: "writer" };
    const at = "2026-10-04T12:00:00.000Z";
    app.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: at });
    let pending: Promise<unknown> | undefined;
    try {
      await expect(app.service.branchDecidedness(app.run.id, reader, [app.run.branches[0]!.id])).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
      expect(remote.calls).toHaveLength(0);
      app.storage.grantRole(app.run.id, reader.learnerId, "spectator", actor, at);
      pending = app.service.branchDecidedness(app.run.id, reader, [app.run.branches[0]!.id]).then(value => ({ value }), error => ({ error }));
      await flush(); expect(remote.calls).toHaveLength(1);
      app.storage.revokeGrant(app.run.id, reader.learnerId, actor);
      remote.respond(0, syzygyBody(FEN));
      expect(await pending).toMatchObject({ error: { code: "RUN_NOT_FOUND" } });
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      await pending; await app.queue.close(); app.storage.close();
    }
  });

  it("selects through whole provider evidence without re-wrapping the bare compatibility position", async () => {
    const { source, remote, clock } = await harness();
    const bare = vi.spyOn(source, "probe").mockRejectedValue(new Error("legacy bare-position path must not be used"));
    const selector = new OpponentSelector({
      async execute() { throw new Error("unexpected engine execution"); },
      health(id) { return { id, status: "stopped", restartCount: 0 }; },
    }, { tablebaseSource: source, monotonicNowMs: clock.now, wallNow: clock.wall });
    const selection = selector.select({ startFen: FEN, historyUci: [], policy: { mode: "perfect_tablebase", policyConfigDigest: `sha256:${"a".repeat(64)}` }, seed: 73 }).then(value => ({ value }), error => ({ error }));
    try {
      await flush();
      expect(remote.calls).toHaveLength(1);
      remote.respond(0, syzygyBody(FEN));
      expect(await selection).toMatchObject({ value: { policyModeApplied: "perfect_tablebase" } });
      expect(bare).not.toHaveBeenCalled();
    } finally {
      if (remote.calls.length !== 0) remote.respond(0, syzygyBody(FEN));
      await selection;
      bare.mockRestore();
    }
  });

  it.each([OTHER, FEN.replace("0 1", "1 2")])("refuses an admitted page for a different exact FEN, including clocks (%s)", async crossedFen => {
    const { source, remote, clock } = await harness();
    const page = source.probeEvidence(crossedFen);
    await flush();
    remote.respond(0, syzygyBody(crossedFen));
    const evidence = await page;
    const bare = vi.fn(async () => { throw new Error("must not fall back to bare data"); });
    const crossed: TablebaseSource = { kind: "lichess", probe: bare, async probeEvidence() { return evidence; } };
    const selector = new OpponentSelector({ async execute() { throw new Error("unexpected engine"); }, health(id) { return { id, status: "stopped", restartCount: 0 }; } }, { tablebaseSource: crossed, monotonicNowMs: clock.now });
    await expect(selector.select({ startFen: FEN, historyUci: [], policy: { mode: "perfect_tablebase", policyConfigDigest: `sha256:${"a".repeat(64)}` }, seed: 73 })).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE", message: "Tablebase evidence does not match the requested position" });
    expect(bare).not.toHaveBeenCalled();
    expect(remote.calls).toHaveLength(1);
  });

  it("refuses forged evidence and does not retry provider failures through the legacy method", async () => {
    const { source, remote, clock } = await harness();
    const page = source.probeEvidence(FEN);
    await flush();
    remote.respond(0, syzygyBody(FEN));
    const evidence = await page;
    const bare = vi.fn(async () => { throw new Error("must not fall back to bare data"); });
    for (const answer of [
      async () => ({ ...evidence }) as TablebaseProbeEvidence,
      async () => { throw Object.assign(new Error("source unavailable"), { code: "TABLEBASE_UNAVAILABLE" }); },
    ]) {
      const selector = new OpponentSelector({ async execute() { throw new Error("unexpected engine"); }, health(id) { return { id, status: "stopped", restartCount: 0 }; } }, { tablebaseSource: { kind: "lichess", probe: bare, probeEvidence: answer }, monotonicNowMs: clock.now });
      await expect(selector.select({ startFen: FEN, historyUci: [], policy: { mode: "perfect_tablebase", policyConfigDigest: `sha256:${"a".repeat(64)}` }, seed: 73 })).rejects.toThrow();
    }
    expect(bare).not.toHaveBeenCalled();
  });

  it("keeps whole deliveries for the practical-resistance root and both candidate reply positions", async () => {
    // Synthetic source-control rows, not an assertion of real tablebase outcomes or bot strength.
    const root = "8/8/8/8/8/2k5/4K3/7R b - - 0 1";
    const b3 = "8/8/8/8/8/1k6/4K3/7R w - - 1 2";
    const c2 = "8/8/8/8/8/8/2k1K3/7R w - - 1 2";
    const body = (fen: string) => ({
      category: fen === root ? "loss" : "win", dtz: fen === root ? -20 : 19, precise_dtz: null,
      moves: exactLegalMoves(fen).map(move => ({ uci: move.uci, san: move.uci, category: fen === root ? ["c3b3", "c3c2"].includes(move.uci) ? "win" : "loss" : move.uci === (fen === b3 ? "h1h3" : "e2f2") ? "draw" : "loss", dtz: 0, precise_dtz: 0 })),
    });
    const { source, remote, clock } = await harness();
    const bare = vi.spyOn(source, "probe").mockRejectedValue(new Error("legacy root or child probe must not be used"));
    const selector = new OpponentSelector({
      async execute(_id, value) {
        const first = value.commands.find(command => command.startsWith("position "))!.endsWith("c3b3");
        return ["info depth 1 multipv 1 policy 0.1 pv " + (first ? "h1h3" : "h1h2"), "info depth 1 multipv 2 policy 0.9 pv e2f2", "bestmove e2f2"];
      },
      health(id) { return { id, status: "ready", restartCount: 0, identity: { id, kind: "opponent", name: "Synthetic Maia", version: "fixture", seedHonored: false, eloHonored: true }, bandOption: "Elo", bandRange: { min: 1000, max: 2400 } }; },
    }, { tablebaseSource: source, monotonicNowMs: clock.now });
    const selection = selector.select({ startFen: root, historyUci: [], policy: { mode: "practical_resistance", policyConfigDigest: `sha256:${"a".repeat(64)}`, targetElo: 1800 }, seed: 73 }).then(value => ({ value }), error => ({ error }));
    try {
      for (const [index, fen] of [root, b3, c2].entries()) {
        await flush();
        expect(remote.calls, fen).toHaveLength(index + 1);
        expect(new URL(remote.calls[index]!.url).searchParams.get("fen")).toBe(fen);
        remote.respond(index, body(fen));
      }
      expect(await selection).toMatchObject({ value: { policyModeApplied: "practical_resistance", moveUci: "c3c2", candidates: [{ moveUci: "c3b3", concessionRatio: 0.1 }, { moveUci: "c3c2", concessionRatio: 0.9 }] } });
      expect(bare).not.toHaveBeenCalled();
      expect(remote.calls).toHaveLength(3);
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, body(new URL(remote.calls[index]!.url).searchParams.get("fen")!));
      await selection;
      bare.mockRestore();
    }
  });

  it("detaches an aborted caller without cancelling a peer's shared acquisition", async () => {
    const { source, remote, scheduler } = await harness();
    const controller = new AbortController();
    let cancelled = false;
    const first = source.probe(FEN, { signal: controller.signal }).catch((error: unknown) => {
      expect(error).toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
      cancelled = true;
    });
    const peer = source.probe(FEN);
    try {
      await flush();
      expect(remote.calls).toHaveLength(1);
      controller.abort();
      await flush();
      expect(cancelled).toBe(true);
      expect(remote.calls[0]!.signal.aborted).toBe(false);
      remote.respond(0, syzygyBody(FEN));
      await expect(peer).resolves.toMatchObject({ category: "win" });
      expect(scheduler.stats()).toMatchObject({ retained: 1 });
    } finally {
      if (remote.calls.length !== 0) remote.respond(0, syzygyBody(FEN));
      await Promise.allSettled([first, peer]);
    }
  });

  it("does not start acquisition for an already-aborted caller", async () => {
    const { source, remote } = await harness();
    const controller = new AbortController();
    controller.abort();
    let cancelled = false;
    const pending = source.probe(FEN, { signal: controller.signal }).catch((error: unknown) => {
      expect(error).toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
      cancelled = true;
    });
    try {
      await flush();
      expect(cancelled).toBe(true);
      expect(remote.calls).toHaveLength(0);
    } finally {
      if (remote.calls.length !== 0) remote.respond(0, syzygyBody(FEN));
      await pending;
    }
  });

  it.each([false, true])("shuts down the actual durable worker without waiting for the remote (peer=%s)", async (hasPeer) => {
    const { source, remote, scheduler } = await harness();
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    const queue = new EvidenceJobQueue({ async execute() { throw new Error("unexpected engine execution"); } }, { tablebaseSource: source });
    const service = new RunService(storage, { evidenceQueue: queue });
    let peer: ReturnType<typeof source.probe> | undefined;
    let shutdown: Promise<void> | undefined;
    try {
      const run = await service.create({
        id: `tablebase-shutdown-${hasPeer}`, session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73, createdAt: "2026-10-04T12:00:00.000Z",
      }, "writer");
      const root = run.nodes[0]!;
      storage.admitInternalEvidence(run.id, [{
        origin: "run_enrichment", idempotencyKey: `run_enrichment@1:${root.id}`,
        request: { schema: "evidence_batch_request@1", runId: run.id, origin: "run_enrichment", jobs: [{ schema: "evidence_job_request@1", runId: run.id, nodeId: root.id, fen: FEN, kind: "tablebase", depth: null, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null }] },
      }]);
      if (hasPeer) peer = source.probe(FEN);
      await flush();
      expect(remote.calls).toHaveLength(1);
      let stopped = false;
      shutdown = queue.close().then(() => { stopped = true; });
      await flush();
      expect(stopped).toBe(true);
      expect(remote.calls[0]!.signal.aborted).toBe(!hasPeer);
      expect(queue.page(run.id).results).toEqual([]);
      expect(queue.failures(run.id)).toEqual([]);
      expect(storage.evidenceJobs.jobsForRun(run.id)).toMatchObject([{ state: "retry_wait", retryBasis: { kind: "shutdown" } }]);
      if (peer !== undefined) {
        remote.respond(0, syzygyBody(FEN));
        await expect(peer).resolves.toMatchObject({ category: "win" });
        expect(scheduler.stats()).toMatchObject({ retained: 1 });
      } else {
        expect(scheduler.stats()).toMatchObject({ retained: 0 });
      }
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      await Promise.allSettled([shutdown ?? queue.close(), ...(peer === undefined ? [] : [peer])]);
      storage.close();
    }
  });

  it("rewinds away from an in-flight tablebase job and aborts its unshared acquisition", async () => {
    const { source, remote, scheduler } = await harness();
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    const queue = new EvidenceJobQueue({ async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0, perspective: "white" } }; } }, { tablebaseSource: source });
    const service = new RunService(storage, { evidenceQueue: queue });
    const at = "2026-10-04T12:00:00.000Z";
    try {
      const run = await service.create({
        id: "tablebase-rewind", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73, createdAt: at,
      }, "writer");
      const moved = service.move(run.id, "writer", "d2d3", { at }).run;
      await queue.whenIdle();
      const node = moved.nodes.find((candidate) => candidate.id === moved.activeCursor.nodeId)!;
      storage.admitInternalEvidence(run.id, [{
        origin: "run_enrichment", idempotencyKey: `tablebase-cancellation-control@1:${node.id}`,
        request: { schema: "evidence_batch_request@1", runId: run.id, origin: "run_enrichment", jobs: [{ schema: "evidence_job_request@1", runId: run.id, nodeId: node.id, fen: node.fen, kind: "tablebase", depth: null, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null }] },
      }]);
      await flush();
      expect(remote.calls).toHaveLength(1);
      service.rewind(run.id, "writer", { nodeId: run.activeCursor.nodeId }, at);
      await flush();
      expect(remote.calls[0]!.signal.aborted).toBe(true);
      await queue.whenIdle();
      expect(storage.evidenceJobs.jobsForRun(run.id).filter((job) => job.request.kind === "tablebase")).toMatchObject([{ state: "cancelled" }]);
      expect(queue.page(run.id).results.filter((result) => result.payload.kind === "tablebase")).toEqual([]);
      expect(queue.failures(run.id)).toEqual([]);
      expect(scheduler.stats()).toMatchObject({ retained: 0 });
    } finally {
      for (let index = 0; index < remote.calls.length; index += 1) remote.respond(index, syzygyBody(FEN));
      await queue.close();
      storage.close();
    }
  });

  it("cancels a waiter before Lichess admission without dispatching it later", async () => {
    const { source, remote, health } = await harness();
    const occupied = await health.admit("evidence.explorer_query");
    const controller = new AbortController();
    const pending = source.probe(FEN, { signal: controller.signal });
    await flush();
    expect(remote.calls).toHaveLength(0);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
    health.settle(occupied, { kind: "success" });
    await flush();
    expect(remote.calls).toHaveLength(0);
  });

  it("shares acquisition, parsing and retention with direct provider consumers", async () => {
    const { source, scheduler, remote } = await harness();
    const learner = source.probe(FEN);
    const direct = scheduler.get({ operation: "syzygy.position@1", request: request() }, { id: "test-direct", budgetMs: 4_000 }, new AbortController().signal);
    await flush();
    expect(remote.calls).toHaveLength(1);
    remote.respond(0, syzygyBody(FEN));
    const [position, delivery] = await Promise.all([learner, direct]);
    expect(delivery.kind).toBe("success");
    if (delivery.kind !== "success") throw new Error("expected sealed delivery");
    expect(providerSourceEvidence("syzygy.position@1", delivery.delivery).payload.payload.position).toBe(position);
    expect(await source.probe(FEN)).toBe(position);
    expect(remote.calls).toHaveLength(1);
    expect(scheduler.stats()).toMatchObject({ retained: 1 });
  });

  it("does not alias either FEN clock and expires at the absolute TTL boundary", async () => {
    const { source, remote, clock } = await harness();
    for (const fen of [FEN, FEN.replace("0 1", "1 1"), FEN.replace("0 1", "0 2")]) {
      const pending = source.probe(fen);
      await flush();
      remote.respond(remote.calls.length - 1, syzygyBody(fen));
      await pending;
    }
    expect(remote.calls).toHaveLength(3);
    await clock.advance(9_999);
    await source.probe(FEN);
    await clock.advance(1);
    const expired = source.probe(FEN);
    await flush();
    expect(remote.calls).toHaveLength(4);
    remote.respond(3, syzygyBody(FEN));
    await expired;
  });

  it("publishes an operation-only inventory with revisions for insertion, expiry and invalidation", async () => {
    const { source, remote, scheduler, clock } = await harness();
    const inventory = scheduler.retainedInventory("syzygy.position@1");
    const other = scheduler.retainedInventory("stockfish.position_evaluation@1");
    const initial = inventory.revision();
    const pending = source.probe(FEN);
    await flush(); remote.respond(0, syzygyBody(FEN)); await pending;
    expect(inventory.validExactEntries(clock.monotonic, "current")).toBe(1);
    expect(other.validExactEntries(clock.monotonic, "current")).toBe(0);
    expect(inventory.revision()).toBeGreaterThan(initial);
    expect(Object.keys(inventory).sort()).toEqual(["invalidateExcept", "revision", "validExactEntries"]);
    const inserted = inventory.revision();
    await clock.advance(10_000);
    expect(inventory.validExactEntries(clock.monotonic, "current")).toBe(0);
    expect(inventory.revision()).toBeGreaterThan(inserted);
    const refreshed = source.probe(FEN);
    await flush(); remote.respond(1, syzygyBody(FEN)); await refreshed;
    const revision = inventory.revision();
    inventory.invalidateExcept("successor-generation");
    expect(inventory.validExactEntries(clock.monotonic, "successor-generation")).toBe(0);
    expect(inventory.revision()).toBeGreaterThan(revision);
    expect(other.revision()).toBe(0);
  });

  it("keeps local domain refusal separate from network absence", async () => {
    const { source, remote, health } = await harness();
    await expect(source.probe(START)).rejects.toMatchObject({ code: "TABLEBASE_OUT_OF_RANGE" });
    expect(remote.calls).toHaveLength(0);
    expect(health.operationAvailability("evidence.tablebase_probe").state).toBe("requestable_unverified");
  });

  it("retains exact answers during shared Lichess backoff without admitting unknown positions", async () => {
    const { source, remote, health, clock } = await harness();
    const first = source.probe(FEN);
    await flush(); remote.respond(0, syzygyBody(FEN)); await first;
    const failed = source.probe(OTHER);
    await flush(); remote.respond(1, "busy", { status: 429, headers: { "retry-after": "60" } });
    await expect(failed).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE", details: { retryAfterMs: 60_000 } });
    expect(health.operationAvailability("evidence.explorer_query")).toMatchObject({ state: "temporarily_blocked", reason: "upstream_backoff" });
    expect(health.snapshot().providers.find((row) => row.instanceId === "tablebase-primary")).toMatchObject({ state: "degraded_cached_only", validExactEntries: 1 });
    await source.probe(FEN);
    await expect(source.probe(OTHER)).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
    expect(remote.calls).toHaveLength(2);
    await clock.advance(10_000);
    expect(health.snapshot().providers.find((row) => row.instanceId === "tablebase-primary")).toMatchObject({ state: "unavailable" });
  });

  it("refuses missing or illegal provider moves before health records success, and never retains the failure", async () => {
    const { source, remote, scheduler, health } = await harness();
    const pending = source.probe(FEN);
    await flush();
    remote.respond(0, { category: "win", dtz: 1, precise_dtz: 1, moves: [] });
    await expect(pending).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
    expect(scheduler.stats().retained).toBe(0);
    expect(health.snapshot().providers.find((row) => row.instanceId === "tablebase-primary")).toMatchObject({ state: "unavailable", reason: "protocol" });
  });

  it("keeps invalid-response failure identity even when older exact answers remain cached", async () => {
    const { source, remote, scheduler } = await harness();
    const first = source.probe(FEN);
    await flush(); remote.respond(0, syzygyBody(FEN)); await first;
    const bad = scheduler.get({ operation: "syzygy.position@1", request: request(OTHER) }, { id: "invalid-peer", budgetMs: 4_000 }, new AbortController().signal);
    await flush(); remote.respond(1, { category: "win", dtz: 1, precise_dtz: 1, moves: [] });
    expect(await bad).toMatchObject({ kind: "source_failure", reason: "invalid_response" });
    await expect(source.probe(FEN)).resolves.toMatchObject({ category: "win" });
    expect(remote.calls).toHaveLength(2);
  });

  it("does not dispatch a cancelled request after waiting for Lichess group admission", async () => {
    const { source, remote, clock, health } = await harness();
    const occupied = await health.admit("evidence.explorer_query");
    const pending = source.probe(FEN, { deadlineMonotonic: 10 });
    await flush();
    expect(remote.calls).toHaveLength(0);
    await clock.advance(10);
    await expect(pending).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
    health.settle(occupied, { kind: "success" });
    await flush();
    expect(remote.calls).toHaveLength(0);
    expect(health.operationAvailability("evidence.tablebase_probe").state).toBe("requestable_unverified");
  });

  it("gives coalesced callers independent deadlines without aborting the surviving caller", async () => {
    const { source, remote, clock } = await harness();
    const short = source.probe(FEN, { deadlineMonotonic: 10 });
    const long = source.probe(FEN, { deadlineMonotonic: 1_000 });
    await flush();
    await clock.advance(10);
    await expect(short).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
    expect(remote.calls[0]!.signal.aborted).toBe(false);
    remote.respond(0, syzygyBody(FEN));
    await expect(long).resolves.toMatchObject({ category: "win" });
    expect(remote.calls).toHaveLength(1);
  });

  it("binds the durable evidence queue to the same sealed provider acquisition", async () => {
    const { source, scheduler, remote } = await harness();
    const storage = new SQLiteRunStorage(":memory:");
    const queue = new EvidenceJobQueue({ async execute() { throw new Error("unexpected engine execution"); } }, { tablebaseSource: source });
    const service = new RunService(storage, { evidenceQueue: queue });
    try {
      const run = await service.create({
        id: "exchange-tablebase-evidence", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73, createdAt: "2026-09-30T12:00:00.000Z",
      }, "writer");
      const root = run.nodes[0]!;
      storage.admitInternalEvidence(run.id, [{
        origin: "run_enrichment", idempotencyKey: `run_enrichment@1:${root.id}`,
        request: { schema: "evidence_batch_request@1", runId: run.id, origin: "run_enrichment", jobs: [{ schema: "evidence_job_request@1", runId: run.id, nodeId: root.id, fen: FEN, kind: "tablebase", depth: null, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null }] },
      }]);
      const direct = scheduler.get({ operation: "syzygy.position@1", request: request() }, { id: "other-consumer", budgetMs: 4_000 }, new AbortController().signal);
      await flush();
      expect(remote.calls).toHaveLength(1);
      remote.respond(0, syzygyBody(FEN));
      const delivered = await direct;
      expect(delivered.kind).toBe("success");
      await queue.whenIdle();
      expect(queue.page(run.id).results[0]?.payload).toMatchObject({ kind: "tablebase", source: "tablebase_exact", values: { fen: FEN, category: "win", dtz: 5, sourceId: "tablebase.lichess.org" } });
      expect(remote.calls).toHaveLength(1);
    } finally { await queue.whenIdle(); storage.close(); }
  });

  it("reaches the shared exchange from the authenticated production opponent route with engines down", { timeout: 30_000 }, async () => {
    const realFetch = globalThis.fetch;
    let requests = 0;
    const fetcher: typeof fetch = async (input, init) => {
      if (!String(input).startsWith("https://tablebase.lichess.org/standard?")) return realFetch(input, init);
      requests += 1;
      const fen = new URL(String(input)).searchParams.get("fen")!;
      return new Response(JSON.stringify(syzygyBody(fen)), { status: 200, headers: { etag: '"fixture"' } });
    };
    vi.stubGlobal("fetch", fetcher);
    const bare = vi.spyOn(ExchangeTablebaseSource.prototype, "probe").mockRejectedValue(new Error("production selection must keep the sealed delivery"));
    let application: Awaited<ReturnType<typeof createInMemoryTestApplication>> | undefined;
    try {
      application = await createInMemoryTestApplication({ engineMode: "maia", stockfishCommand: "/nonexistent/tabiya-test-stockfish", maiaHost: "127.0.0.1", maiaPort: 1, cookieSecure: false });
      await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await realFetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "syzygy_shared", password: "tablebase-test-password" }) });
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const selected = await realFetch(`${origin}/select-move`, {
        method: "POST", headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ startFen: FEN, historyUci: [], policy: { mode: "perfect_tablebase", policyConfigDigest: `sha256:${"a".repeat(64)}` }, seed: 73 }),
      });
      const body = await selected.json();
      expect(selected.status, JSON.stringify(body)).toBe(200);
      expect(body).toMatchObject({ policyModeApplied: "perfect_tablebase" });
      const delivered = await application.providers.scheduler.get({ operation: "syzygy.position@1", request: request() }, { id: "production-proof", budgetMs: 4_000 }, new AbortController().signal);
      expect(delivered).toMatchObject({ kind: "success", delivery: { kind: "retained_exact" } });
      expect(requests).toBe(1);
      expect(application.providerHealth.snapshot().providers.find((row) => row.instanceId === "tablebase-primary")).toMatchObject({ state: "available" });
      expect(bare).not.toHaveBeenCalled();
    } finally { await application?.close(); bare.mockRestore(); vi.unstubAllGlobals(); }
  });
});
