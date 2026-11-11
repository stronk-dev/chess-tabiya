// D3411/D3412: actual production HintService and authenticated application/health/HTTP voice path.
import type { AddressInfo } from "node:net";
import {
  compileAssistanceRequest, hintDecisionStamp, parseHintResponse,
  type DrillRun, type HintResponse, type HintRung, type TypedProviderResult,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidatePopulationService } from "./candidate-population-service.js";
import { EngineCapabilities } from "./capabilities.js";
import { ExternalHttpVoiceProvider } from "./external-voice.js";
import { HintService, type HintAccess, type HintProviderGateway } from "./hint-service.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { RunService } from "./service.js";

const FEN = "k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1";
afterEach(() => { vi.restoreAllMocks(); });
const run = { id: "lifetime", feedbackPolicy: "attempt_end", events: [{ seq: 1, type: "feedback.revealed", at: "2026-10-05T12:00:00.000Z", data: { nodeId: "n0" } }], nodes: [], branches: [], activeCursor: { branchId: "main", nodeId: "n0" } } as unknown as DrillRun;
const access = (voiceRequested = true): HintAccess => ({ learnerId: "owner", writerId: "unit-writer", assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }), revalidate: () => true, run, decision: hintDecisionStamp(run), fen: FEN, role: "learner", session: "position", voiceRequested });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function bounded<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("cancelled work did not detach")), 1_000); })]);
  } finally { clearTimeout(timer); }
}
const realScheduler = () => composeProviderTraversalApplication({ engines: new MockProviderEngineClient(), tablebaseFetch: null, explorerFetch: null, explorerToken: null }).scheduler;
function service(extra: Partial<ConstructorParameters<typeof HintService>[0]> = {}) {
  return new HintService({ sourceGenerations: () => ({ registry: "unit-registry", engine: 1 }), scheduler: realScheduler(), requestedEngine: async () => ({ id: "stockfish-analysis", version: "mock-1" }), populations: new CandidatePopulationService({ capacity: 8 }), depth: 12, timeoutMs: 5_000, maxOperations: 8, ...extra });
}
function id(response: HintResponse): string {
  if (response.state === "available") return response.delivery.requestId;
  if ("requestId" in response) return response.requestId;
  throw new Error(`expected operation identity: ${response.state}`);
}

describe("Guided Hint operation lifetimes", () => {
  it("repeat POST cannot replace the original writer, assistance intent or authority callback", async () => {
    const engine = deferred<{ id: string; version: string }>();
    let permitted = true;
    const originalAuthority = vi.fn(() => permitted);
    const replacementAuthority = vi.fn(() => true);
    const get = vi.fn<HintProviderGateway["get"]>();
    const hints = service({ scheduler: { get }, requestedEngine: () => engine.promise });
    const original = { ...access(false), revalidate: originalAuthority };
    const requestId = id((await (hints.request(original, "pattern", "0".repeat(32)))));
    try {
      const changedIntent = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
      for (const replacement of [{ writerId: "replacement" }, { assistance: changedIntent }]) {
        expect((await (hints.request({ ...original, ...replacement, revalidate: replacementAuthority }, "pattern", "0".repeat(32))))).toMatchObject({ state: "failed", reason: "contract_violation", requestId });
      }
      expect(hints.operationCount).toBe(1);
      await new Promise<void>(resolve => setImmediate(resolve));
      permitted = false;
      engine.resolve({ id: "stockfish-analysis", version: "mock-1" });
      await bounded(hints.whenIdle());
      expect(hints.poll(run.id, requestId, original.decision, "owner")).toMatchObject({ state: "stale", requestId });
      expect(hints.operationCount).toBe(1); // Same bounded terminal record; no rebinding map.
      expect(get).not.toHaveBeenCalled();
      expect(replacementAuthority).not.toHaveBeenCalled();
      expect(originalAuthority).toHaveBeenCalled();
    } finally { engine.resolve({ id: "stockfish-analysis", version: "mock-1" }); await hints.close(); }
  });

  it("equal public action IDs belong to independent owners while their search remains shared", async () => {
    const result = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    void result.promise.catch(() => undefined); // Cleanup may run before the scheduler subscribes.
    const scheduler = realScheduler();
    let signal: AbortSignal | undefined;
    let fulfill!: () => Promise<void>;
    const get = vi.fn<HintProviderGateway["get"]>(async (request, scope, current) => {
      signal = current;
      fulfill = async () => result.resolve(await scheduler.get(request, scope, current));
      return result.promise;
    });
    const hints = service({ scheduler: { get } });
    const first = id((await (hints.request({ ...access(false), learnerId: "owner" }, "pattern", "0".repeat(32)))));
    const peer = id((await (hints.request({ ...access(false), learnerId: "peer" }, "pattern", "0".repeat(32)))));
    try {
      expect(peer).toBe(first); // Ownership is internal, not a new public digest field.
      expect(hints.operationCount).toBe(2);
      await vi.waitFor(() => expect(signal).toBeDefined());
      expect(() => hints.poll(run.id, first, access().decision, "stranger")).toThrow(/not known/u);
      expect(() => hints.cancel(run.id, first, "stranger")).toThrow(/not known/u);
      expect(hints.operationCount).toBe(2);
      expect(hints.cancel(run.id, peer, "peer").state).toBe("cancelled");
      expect(signal!.aborted).toBe(false);
      await fulfill();
      await bounded(hints.whenIdle());
      expect(get).toHaveBeenCalledTimes(1);
      expect(hints.poll(run.id, first, access().decision, "owner").state).toBe("available");
      expect(() => hints.poll(run.id, peer, access().decision, "peer")).toThrow(/not known/u);
    } finally { result.reject(new Error("closed")); await hints.close(); }
  });

  it("two-slot horizon pressure evicts an unused result, not an older surviving search", async () => {
    const result = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    const scheduler = realScheduler();
    let firstSignal!: AbortSignal;
    let fulfill!: () => Promise<void>;
    let calls = 0;
    const get: HintProviderGateway["get"] = async (request, scope, signal) => {
      if (++calls !== 1) return scheduler.get(request, scope, signal);
      firstSignal = signal;
      fulfill = async () => result.resolve(await scheduler.get(request, scope, signal));
      return result.promise; // Ignore abort so losing this waiter cannot quietly pass.
    };
    const hints = service({ maxOperations: 2, scheduler: { get } });
    const decision = (seq: number) => {
      const current = { ...run, events: [{ ...run.events[0]!, seq }] } as DrillRun;
      return { ...access(false), run: current, decision: hintDecisionStamp(current) };
    };
    const firstAccess = decision(1), secondAccess = decision(2), thirdAccess = decision(3);
    const first = id((await (hints.request(firstAccess, "pattern", "0".repeat(32)))));
    try {
      await vi.waitFor(() => expect(firstSignal).toBeDefined());
      const second = id((await (hints.request(secondAccess, "pattern", "0".repeat(32)))));
      await vi.waitFor(() => expect(hints.poll(run.id, second, secondAccess.decision, "owner").state).toBe("available"));
      const third = id((await (hints.request(thirdAccess, "pattern", "0".repeat(32)))));
      await vi.waitFor(() => expect(hints.poll(run.id, third, thirdAccess.decision, "owner").state).toBe("available"));
      expect(hints.operationCount).toBe(2);
      expect(() => hints.poll(run.id, second, secondAccess.decision, "owner")).toThrow(/not known/u);
      expect(firstSignal.aborted).toBe(false);
      await fulfill();
      await bounded(hints.whenIdle());
      expect(hints.poll(run.id, first, firstAccess.decision, "owner").state).toBe("available");
    } finally { result.reject(new Error("closed")); await hints.close(); }
  });

  it.each(["cancel", "stale", "evict", "close"] as const)("%s aborts private voice, detaches ignored abort and cannot publish late output", async action => {
    const reply = deferred<string>();
    let signal: AbortSignal | undefined;
    const hints = service({ maxOperations: action === "evict" ? 1 : 8, voiceTimeoutMs: 60_000,
      voice: async (_view, _sentence, current) => { signal = current; return reply.promise; } });
    const requestId = id((await (hints.request(access(), "pattern", "0".repeat(32)))));
    try {
      await vi.waitFor(() => expect(signal).toBeDefined());
      if (action === "cancel") expect(hints.cancel(run.id, requestId, "owner").state).toBe("cancelled");
      else if (action === "stale") expect(hints.poll(run.id, requestId, { ...access().decision, digest: "sha256:changed" }, "owner").state).toBe("stale");
      else if (action === "evict") (await (hints.request(access(false), "square", "0".repeat(32))));
      else await bounded(hints.close());
      expect(signal!.aborted).toBe(true);
      await bounded(hints.whenIdle());
      reply.resolve("The best move is Nb2.");
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(() => hints.poll(run.id, requestId, access().decision, "owner")).toThrow(/not known/u);
      if (action === "close") expect((await (hints.request(access(), "pattern", "0".repeat(32))))).toMatchObject({ state: "source_unavailable", reason: "cancelled" });
    } finally { reply.resolve(""); await hints.close(); }
  });

  it("one cancelled voice leaves another rung and the one shared search alive", async () => {
    const replies = [deferred<string>(), deferred<string>()];
    const signals: AbortSignal[] = [];
    const sentences: string[] = [];
    const scheduler = realScheduler();
    const search = vi.fn<HintProviderGateway["get"]>((...args) => scheduler.get(...args));
    const hints = service({ scheduler: { get: search }, voiceTimeoutMs: 60_000,
      voice: async (_view, sentence, signal) => { const index = signals.length; signals.push(signal); sentences.push(sentence); return replies[index]!.promise; } });
    const first = id((await (hints.request(access(), "pattern", "0".repeat(32)))));
    const second = id((await (hints.request(access(), "square", "0".repeat(32)))));
    try {
      await vi.waitFor(() => expect(signals).toHaveLength(2));
      hints.cancel(run.id, first, "owner");
      expect(signals.map(signal => signal.aborted)).toEqual([true, false]);
      replies[1]!.resolve(sentences[1]!);
      await bounded(hints.whenIdle());
      expect(search).toHaveBeenCalledTimes(1);
      expect(hints.poll(run.id, second, access().decision, "owner")).toMatchObject({ state: "available", delivery: { rung: "square", rendered: { voice: { state: "rendered", sentence: sentences[1] } } } });
      replies[0]!.reject(new Error("late discarded provider rejection"));
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(() => hints.poll(run.id, first, access().decision, "owner")).toThrow(/not known/u);
    } finally { for (const reply of replies) reply.resolve(""); await hints.close(); }
  });

  it("one cancelled search waiter leaves its peer; the final waiter aborts and detaches an ignored signal", async () => {
    const result = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    let signal: AbortSignal | undefined;
    const get = vi.fn<HintProviderGateway["get"]>(async (_request, _scope, current) => { signal = current; return result.promise; });
    const hints = service({ scheduler: { get } });
    const first = id((await (hints.request(access(false), "pattern", "0".repeat(32)))));
    const second = id((await (hints.request(access(false), "square", "0".repeat(32)))));
    try {
      await vi.waitFor(() => expect(signal).toBeDefined());
      hints.cancel(run.id, first, "owner");
      expect(signal!.aborted).toBe(false);
      hints.cancel(run.id, second, "owner");
      expect(signal!.aborted).toBe(true);
      await bounded(hints.whenIdle());
      expect(get).toHaveBeenCalledTimes(1);
    } finally { result.reject(new Error("cancelled upstream")); await hints.close(); }
  });

  it("cancelled startup cannot later begin provider acquisition", async () => {
    const engine = deferred<{ id: string; version: string }>();
    const get = vi.fn<HintProviderGateway["get"]>();
    const hints = service({ requestedEngine: () => engine.promise, scheduler: { get } });
    const requestId = id((await (hints.request(access(false), "pattern", "0".repeat(32)))));
    hints.cancel(run.id, requestId, "owner");
    await bounded(hints.whenIdle());
    engine.resolve({ id: "stockfish-analysis", version: "mock-1" });
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(get).not.toHaveBeenCalled();
    await hints.close();
  });

  it("an abandoned same-key search cannot erase or satisfy its replacement", async () => {
    const old = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    const current = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    const signals: AbortSignal[] = [];
    const scheduler = realScheduler();
    let fulfill!: () => Promise<void>;
    const get = vi.fn<HintProviderGateway["get"]>(async (request, scope, signal) => {
      signals.push(signal);
      if (signals.length === 1) return old.promise;
      fulfill = async () => { current.resolve(await scheduler.get(request, scope, signal)); };
      return current.promise;
    });
    const hints = service({ scheduler: { get } });
    const first = id((await (hints.request(access(false), "pattern", "0".repeat(32)))));
    try {
      await vi.waitFor(() => expect(signals).toHaveLength(1));
      hints.cancel(run.id, first, "owner");
      await bounded(hints.whenIdle());
      const replacement = id((await (hints.request(access(false), "pattern", "0".repeat(32)))));
      expect(replacement).toBe(first);
      await vi.waitFor(() => expect(signals).toHaveLength(2));
      old.reject(new Error("abandoned search"));
      await new Promise<void>(resolve => setImmediate(resolve));
      const peer = id((await (hints.request(access(false), "square", "0".repeat(32)))));
      expect(get).toHaveBeenCalledTimes(2);
      expect(signals[1]!.aborted).toBe(false);
      await fulfill();
      await bounded(hints.whenIdle());
      expect(hints.poll(run.id, replacement, access().decision, "owner").state).toBe("available");
      expect(hints.poll(run.id, peer, access().decision, "owner").state).toBe("available");
    } finally { old.reject(new Error("closed")); current.reject(new Error("closed")); await hints.close(); }
  });

  it.each(["null", "rejection", "throw"] as const)("%s engine discovery coalesces, stays unavailable, then recovers after explicit cancel/re-POST", async failure => {
    let starts = 0;
    const hints = service({ requestedEngine: () => {
      starts += 1;
      if (starts > 1) return Promise.resolve({ id: "stockfish-analysis", version: "mock-1" });
      if (failure === "throw") throw new Error("startup failed");
      return failure === "null" ? Promise.resolve(null) : Promise.reject(new Error("startup failed"));
    } });
    try {
      const first = id((await (hints.request(access(false), "pattern", "0".repeat(32)))));
      const peer = id((await (hints.request(access(false), "square", "0".repeat(32)))));
      await hints.whenIdle();
      expect(starts).toBe(1);
      expect(hints.poll(run.id, first, access().decision, "owner")).toMatchObject({ state: "source_unavailable" });
      expect(hints.poll(run.id, peer, access().decision, "owner")).toMatchObject({ state: "source_unavailable" });
      // Ordinary idempotent POST/poll preserves that settled result; explicit retry removes it.
      expect((await (hints.request(access(false), "pattern", "0".repeat(32)))).state).toBe("source_unavailable");
      hints.cancel(run.id, first, "owner");
      expect(id((await (hints.request(access(false), "pattern", "0".repeat(32)))))).toBe(first);
      await hints.whenIdle();
      expect(starts).toBe(2);
      expect(hints.poll(run.id, first, access().decision, "owner").state).toBe("available");
    } finally { await hints.close(); }
  });

  it("voice deadlines reject non-finite, non-integer and non-positive configuration", () => {
    for (const voiceTimeoutMs of [NaN, Infinity, -1, 0, 1.5]) expect(() => service({ voiceTimeoutMs })).toThrow(/voiceTimeoutMs/u);
  });

  it.each(["head", "branch"] as const)("a same-node/FEN new %s cannot inherit an earlier sealed horizon", async change => {
    const scheduler = realScheduler();
    const get = vi.fn<HintProviderGateway["get"]>((...args) => scheduler.get(...args));
    const hints = service({ scheduler: { get } });
    try {
      const first = id((await (hints.request(access(false), "pattern", "0".repeat(32)))));
      await hints.whenIdle();
      expect(hints.poll(run.id, first, access().decision, "owner").state).toBe("available");
      const changed = {
        ...run,
        ...(change === "head"
          ? { events: [...run.events, { ...run.events[0]!, seq: 2 }] }
          : { activeCursor: { ...run.activeCursor, branchId: "fork" } }),
      } as DrillRun;
      const next = { ...access(false), run: changed, decision: hintDecisionStamp(changed) };
      expect(next.decision.digest).not.toBe(access().decision.digest);
      const second = id((await (hints.request(next, "square", "0".repeat(32)))));
      await hints.whenIdle();
      const result = hints.poll(run.id, second, next.decision, "owner");
      expect(result).toMatchObject({ state: "available", delivery: { decision: next.decision } });
      expect(get).toHaveBeenCalledTimes(2);
      // Only the decision's local occurrence must be rebuilt. Scheduler/source dedupe is unchanged.
      const peer = id((await (hints.request(next, "piece", "0".repeat(32)))));
      await hints.whenIdle();
      expect(hints.poll(run.id, peer, next.decision, "owner").state).toBe("available");
      expect(get).toHaveBeenCalledTimes(2);
    } finally { await hints.close(); }
  });
});

async function applicationControl() {
  const exchanges: { signal: AbortSignal; reply: ReturnType<typeof deferred<Response>>; sentence: string }[] = [];
  const voice = new ExternalHttpVoiceProvider({ url: "https://voice.invalid/render", timeoutMs: 60_000,
    fetch: async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { scope: string; items: { sentences: string[] }[] };
      expect(body.scope).toBe("hint");
      expect(body.items).toHaveLength(1);
      const reply = deferred<Response>();
      exchanges.push({ signal: init!.signal as AbortSignal, reply, sentence: body.items[0]!.sentences.join(" ") });
      return reply.promise; // Deliberately ignore cancellation, as a malfunctioning transport can.
    } });
  installEmptyApplicationCatalogues();
  const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, voiceProvider: voice });
  try {
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "hint_lifetime", password: "hint-test-password" }) });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const headers = { "content-type": "application/json", cookie, "x-writer-id": "hint-lifetime-writer" };
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    const created = await post("/runs", { id: "hint-lifetime", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3 });
    expect(created.status).toBe(201);
    expect((await post("/runs/hint-lifetime/reveal", {})).status).toBe(200);
    const graph = await (await fetch(`${origin}/runs/hint-lifetime/graph`, { headers })).json() as { graph: Pick<DrillRun, "nodes" | "branches" | "activeCursor"> };
    const events = await (await fetch(`${origin}/runs/hint-lifetime/events?sinceSeq=0`, { headers })).json() as { events: DrillRun["events"] };
    const decision = hintDecisionStamp({ id: "hint-lifetime", feedbackPolicy: "attempt_end", ...graph.graph, events: events.events } as DrillRun);
    const hintBody = (rung: HintRung) => ({ clientRequestId: "0".repeat(32), nodeId: graph.graph.activeCursor.nodeId, rung, decisionDigest: decision.digest,
      assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: { voice: "persona" }, moduleOverrides: { include: [], exclude: [] } } }) });
    const ask = async (rung: HintRung = "pattern") => {
      const response = await post("/runs/hint-lifetime/hints", hintBody(rung));
      expect(response.status, await response.clone().text()).toBe(200);
      return parseHintResponse((await response.json() as { hint: unknown }).hint);
    };
    const poll = async (requestId: string) => fetch(`${origin}/runs/hint-lifetime/hints/${requestId}`, { headers });
    const cancel = async (requestId: string) => fetch(`${origin}/runs/hint-lifetime/hints/${requestId}`, { method: "DELETE", headers });
    const state = () => application.providerHealth.snapshot().providers.find(row => row.instanceId === "external-voice")!;
    return { application, exchanges, origin, headers, decision, hintBody, post, ask, poll, cancel, state };
  } catch (error) { for (const exchange of exchanges) exchange.reply.reject(error); await application.close(); throw error; }
}

describe("authenticated Hint → application → health → external HTTP voice cancellation", () => {
  it("a real original-writer handoff between actual source stages stops the next stage and all voice/publication", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    let transfer: (() => void) | undefined, advances = 0;
    const originalAccess = RunService.prototype.hintAccess;
    const authority = vi.spyOn(RunService.prototype, "hintAccess").mockImplementation(function (this: RunService, ...args) {
      const access = originalAccess.apply(this, args);
      if (args[2] !== undefined) transfer = () => this.claimLease(args[0], args[1], "changed-between-stages");
      return access;
    });
    const originalAdvance = CandidatePopulationService.prototype.advance;
    const advancing = vi.spyOn(CandidatePopulationService.prototype, "advance").mockImplementation(function (this: CandidatePopulationService, ...args) {
      const step = originalAdvance.apply(this, args); advances++;
      if (advances === 1) setImmediate(() => { expect(transfer).toBeTypeOf("function"); transfer!(); });
      return step;
    } as typeof originalAdvance);
    const reading = vi.spyOn(CandidatePopulationService.prototype, "read");
    try {
      const requestId = id(await app.ask());
      await vi.waitFor(async () => expect(parseHintResponse((await (await app.poll(requestId)).json() as { hint: unknown }).hint)).toMatchObject({ state: "stale", requestId }));
      expect(advances).toBe(1); expect(reading).not.toHaveBeenCalled(); expect(app.exchanges).toHaveLength(0);
    } finally { authority.mockRestore(); advancing.mockRestore(); reading.mockRestore(); await app.application.close(); }
  });

  it("cold HTTP acknowledgements wait for the actual post-handshake pair and equal the same-source warm identity", { timeout: 30_000 }, async () => {
    const app = await applicationControl(); const gate = deferred<void>(); const reached = deferred<void>();
    let ready = false, acknowledged = false;
    const actualGeneration = MockProviderEngineClient.prototype.establishedGeneration;
    const generation = vi.spyOn(MockProviderEngineClient.prototype, "establishedGeneration").mockImplementation(function (this: MockProviderEngineClient, engineId) { return ready ? actualGeneration.call(this, engineId) : null; });
    const actualStart = MockProviderEngineClient.prototype.start;
    const sink = app.application.providerHealth.engineLifecycleSink({ "stockfish-analysis": "stockfish-analysis" });
    const discovery = vi.spyOn(MockProviderEngineClient.prototype, "start").mockImplementationOnce(async function (this: MockProviderEngineClient, engineId) {
      sink({ engineId, kind: "starting" }); reached.resolve(); await gate.promise;
      const identity = await actualStart.call(this, engineId); ready = true; sink({ engineId, kind: "ready" }); return identity;
    });
    const search = vi.spyOn(app.application.providers.scheduler, "get");
    const first = app.ask().then(response => { acknowledged = true; return response; });
    try {
      await bounded(reached.promise);
      expect(acknowledged).toBe(false); expect(search).not.toHaveBeenCalled();
      const repeat = app.ask(); gate.resolve();
      const [one, same] = await Promise.all([first, repeat]); expect(id(same)).toBe(id(one));
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
      await vi.waitFor(async () => expect(parseHintResponse((await (await app.poll(id(one))).json() as { hint: unknown }).hint).state).toBe("available"));
      expect((await app.cancel(id(one))).status).toBe(200);
      const warm = await app.ask(); expect(id(warm)).toBe(id(one));
      expect(discovery).toHaveBeenCalledTimes(1); expect(search).toHaveBeenCalledTimes(1);
    } finally { gate.resolve(); await first; generation.mockRestore(); discovery.mockRestore(); search.mockRestore(); for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("the production eleven-second cap bounds cold HTTP startup and prevents late provider/collector work", { timeout: 30_000 }, async () => {
    const app = await applicationControl(); const gate = deferred<void>(); const reached = deferred<void>();
    const generation = vi.spyOn(MockProviderEngineClient.prototype, "establishedGeneration").mockReturnValue(null);
    const actual = MockProviderEngineClient.prototype.start;
    const discovery = vi.spyOn(MockProviderEngineClient.prototype, "start").mockImplementationOnce(async function (this: MockProviderEngineClient, ...args) { reached.resolve(); await gate.promise; return actual.apply(this, args); });
    const search = vi.spyOn(app.application.providers.scheduler, "get");
    const collection = vi.spyOn(CandidatePopulationService.prototype, "begin");
    let acknowledged = false;
    const started = performance.now();
    const pending = app.ask().then(response => { acknowledged = true; return response; });
    try {
      await bounded(reached.promise);
      await new Promise<void>(resolve => setTimeout(resolve, 50));
      expect(acknowledged).toBe(false);
      const response = await pending;
      expect(response).toMatchObject({ state: "source_unavailable", reason: "deadline_exceeded" });
      expect(performance.now() - started).toBeGreaterThanOrEqual(10_900);
      gate.resolve(); await new Promise<void>(resolve => setImmediate(resolve));
      expect(search).not.toHaveBeenCalled(); expect(collection).not.toHaveBeenCalled(); expect(app.exchanges).toHaveLength(0);
      expect(await app.ask()).toEqual(response);
    } finally { gate.resolve(); await pending; generation.mockRestore(); discovery.mockRestore(); search.mockRestore(); collection.mockRestore(); await app.application.close(); }
  });

  it.each((["pending", "available"] as const).flatMap(phase => (["registry", "engine"] as const).map(domain => ({ phase, domain }))))("a $domain generation change invalidates a retained $phase action without replacement discovery or search", { timeout: 30_000 }, async ({ phase, domain }) => {
    const app = await applicationControl();
    const search = vi.spyOn(app.application.providers.scheduler, "get");
    const discovery = vi.spyOn(MockProviderEngineClient.prototype, "start");
    try {
      const requestId = id(await app.ask());
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      if (phase === "available") {
        app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
        await vi.waitFor(async () => expect(parseHintResponse((await (await app.poll(requestId)).json() as { hint: unknown }).hint).state).toBe("available"));
      }
      if (domain === "registry") {
        const old = app.application.providerHealth.generation("stockfish-analysis");
        const lifecycle = app.application.providerHealth.engineLifecycleSink({ "stockfish-analysis": "stockfish-analysis" });
        lifecycle({ engineId: "stockfish-analysis", kind: "starting" });
        lifecycle({ engineId: "stockfish-analysis", kind: "ready" });
        expect(app.application.providerHealth.generation("stockfish-analysis")).not.toBe(old);
      } else vi.spyOn(MockProviderEngineClient.prototype, "establishedGeneration").mockReturnValue(2);
      expect(await app.ask()).toMatchObject({ state: "source_unavailable", reason: "identity_mismatch", requestId });
      expect(parseHintResponse((await (await app.poll(requestId)).json() as { hint: unknown }).hint)).toMatchObject({ state: "source_unavailable", reason: "identity_mismatch", requestId });
      expect(search).toHaveBeenCalledTimes(1); expect(discovery).toHaveBeenCalledTimes(1);
      if (phase === "pending") expect(app.exchanges[0]!.signal.aborted).toBe(true);
      expect(app.exchanges).toHaveLength(1);
      if (domain === "registry") {
        expect((await app.cancel(requestId)).status).toBe(200);
        const fresh = await app.ask();
        expect(id(fresh)).not.toBe(requestId); // Same action bytes after explicit deletion, new actual registry source.
        await vi.waitFor(() => expect(app.exchanges).toHaveLength(2));
        app.exchanges[1]!.reply.resolve(Response.json({ text: app.exchanges[1]!.sentence }));
        await vi.waitFor(async () => expect(parseHintResponse((await (await app.poll(id(fresh))).json() as { hint: unknown }).hint).state).toBe("available"));
        expect(search).toHaveBeenCalledTimes(2);
      }
    } finally { search.mockRestore(); discovery.mockRestore(); for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("the actual acquired numeric engine generation must match the sealed engine domain before collectors or voice", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    const generation = vi.spyOn(MockProviderEngineClient.prototype, "establishedGeneration").mockReturnValue(2);
    const collection = vi.spyOn(CandidatePopulationService.prototype, "begin");
    try {
      const requestId = id(await app.ask()); // The real mock acquisition remains generation1.
      await vi.waitFor(async () => expect(parseHintResponse((await (await app.poll(requestId)).json() as { hint: unknown }).hint)).toMatchObject({ state: "source_unavailable", reason: "identity_mismatch", requestId }));
      expect(collection).not.toHaveBeenCalled(); expect(app.exchanges).toHaveLength(0);
    } finally { generation.mockRestore(); collection.mockRestore(); for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("a still-readable co-host demoted to spectator loses the pending action's original authority", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    try {
      const registered = await app.post("/auth/register", { handle: "hint_participant", password: "hint-participant-password" });
      expect(registered.status).toBe(201);
      const headers = { ...app.headers, cookie: registered.headers.get("set-cookie")!.split(";", 1)[0]!, "x-writer-id": "participant-writer" };
      const participantPost = (path: string, body: unknown) => fetch(`${app.origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
      expect((await app.post("/runs/hint-lifetime/grants", { op: "grant", handle: "hint_participant", role: "host" })).status).toBe(200);
      const session = await (await fetch(`${app.origin}/auth/session`, { headers: app.headers })).json() as { learner: { id: string } };
      const claimed = await participantPost("/runs/hint-lifetime/lease", { expectedHolderLearnerId: session.learner.id });
      expect(claimed.status, await claimed.clone().text()).toBe(200);
      const asked = await participantPost("/runs/hint-lifetime/hints", app.hintBody("pattern"));
      expect(asked.status, await asked.clone().text()).toBe(200);
      const requestId = id(parseHintResponse((await asked.json() as { hint: unknown }).hint));
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      expect((await app.post("/runs/hint-lifetime/grants", { op: "grant", handle: "hint_participant", role: "spectator" })).status).toBe(200);
      expect((await fetch(`${app.origin}/runs/hint-lifetime/graph`, { headers })).status).toBe(200);
      const polled = await fetch(`${app.origin}/runs/hint-lifetime/hints/${requestId}`, { headers });
      expect(polled.status).toBe(200);
      expect(parseHintResponse((await polled.json() as { hint: unknown }).hint)).toMatchObject({ state: "stale", requestId });
      expect(app.exchanges[0]!.signal.aborted).toBe(true);
    } finally { for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it.each(["creator", "peer"] as const)("logging out the %s during discovery retires only that action; another authenticated session finishes the one search", { timeout: 30_000 }, async invalid => {
    const app = await applicationControl();
    const gate = deferred<void>();
    const reached = deferred<void>();
    const original = MockProviderEngineClient.prototype.start;
    const discovery = vi.spyOn(MockProviderEngineClient.prototype, "start").mockImplementationOnce(async function (this: MockProviderEngineClient, ...args) {
      const engine = await original.apply(this, args);
      reached.resolve();
      await gate.promise;
      return engine;
    });
    const search = vi.spyOn(app.application.providers.scheduler, "get");
    try {
      const first = id(await app.ask("pattern"));
      await bounded(reached.promise);
      const logged = await app.post("/auth/login", { handle: "hint_lifetime", password: "hint-test-password" });
      expect(logged.status).toBe(200);
      const headers = { ...app.headers, cookie: logged.headers.get("set-cookie")!.split(";", 1)[0]! };
      const response = await fetch(`${app.origin}/runs/hint-lifetime/hints`, { method: "POST", headers, body: JSON.stringify(app.hintBody("square")) });
      expect(response.status).toBe(200);
      const second = id(parseHintResponse((await response.json() as { hint: unknown }).hint));
      const revoked = invalid === "creator" ? first : second;
      const retained = invalid === "creator" ? second : first;
      const logout = await fetch(`${app.origin}/auth/logout`, { method: "POST", headers: invalid === "creator" ? app.headers : headers, body: "{}" });
      expect(logout.status).toBeLessThan(300);
      gate.resolve();
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      expect(search).toHaveBeenCalledTimes(1);
      expect(app.exchanges[0]!.signal.aborted).toBe(false);
      app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
      const survivingHeaders = invalid === "creator" ? headers : app.headers;
      await vi.waitFor(async () => {
        const delivered = await fetch(`${app.origin}/runs/hint-lifetime/hints/${retained}`, { headers: survivingHeaders });
        expect(parseHintResponse((await delivered.json() as { hint: unknown }).hint).state).toBe("available");
      });
      const retired = await fetch(`${app.origin}/runs/hint-lifetime/hints/${revoked}`, { headers: survivingHeaders });
      expect(parseHintResponse((await retired.json() as { hint: unknown }).hint).state).toBe("stale");
      const again = await fetch(`${app.origin}/runs/hint-lifetime/hints/${revoked}`, { headers: survivingHeaders });
      expect(parseHintResponse((await again.json() as { hint: unknown }).hint).state).toBe("stale");
      expect(app.exchanges).toHaveLength(1);
    } finally { gate.resolve(); discovery.mockRestore(); search.mockRestore(); for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("a logged-out session cannot publish a late successful voice response or reuse its action under a new session", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    try {
      const requestId = id(await app.ask());
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      expect((await app.post("/auth/logout", {})).status).toBeLessThan(300);
      expect((await app.poll(requestId)).status).toBe(401);
      app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
      const logged = await app.post("/auth/login", { handle: "hint_lifetime", password: "hint-test-password" });
      expect(logged.status).toBe(200);
      const headers = { ...app.headers, cookie: logged.headers.get("set-cookie")!.split(";", 1)[0]! };
      const repeated = await fetch(`${app.origin}/runs/hint-lifetime/hints`, { method: "POST", headers, body: JSON.stringify(app.hintBody("pattern")) });
      expect(repeated.status).toBe(200);
      expect(parseHintResponse((await repeated.json() as { hint: unknown }).hint)).toMatchObject({ state: "stale", requestId });
      const response = await fetch(`${app.origin}/runs/hint-lifetime/hints/${requestId}`, { headers });
      expect(parseHintResponse((await response.json() as { hint: unknown }).hint).state).toBe("stale");
      expect(app.exchanges).toHaveLength(1);
    } finally { for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it.each(["pending", "available"] as const)("a replaced original writer invalidates a %s action without moving its decision", { timeout: 30_000 }, async phase => {
    const app = await applicationControl();
    try {
      const requestId = id(await app.ask());
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      if (phase === "available") {
        app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
        await vi.waitFor(async () => expect(parseHintResponse((await (await app.poll(requestId)).json() as { hint: unknown }).hint).state).toBe("available"));
      }
      const changed = await fetch(`${app.origin}/runs/hint-lifetime/lease`, { method: "POST", headers: { ...app.headers, "x-writer-id": "replacement-writer" }, body: "{}" });
      expect(changed.status, await changed.clone().text()).toBe(200);
      const response = await app.poll(requestId);
      expect(response.status).toBe(200);
      expect(parseHintResponse((await response.json() as { hint: unknown }).hint).state).toBe("stale");
      if (phase === "pending") expect(app.exchanges[0]!.signal.aborted).toBe(true);
      const again = await app.poll(requestId);
      expect(parseHintResponse((await again.json() as { hint: unknown }).hint).state).toBe("stale");
      const repeated = await fetch(`${app.origin}/runs/hint-lifetime/hints`, { method: "POST", headers: { ...app.headers, "x-writer-id": "replacement-writer" }, body: JSON.stringify({ ...app.hintBody("pattern"), assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) }) });
      expect(repeated.status).toBe(200);
      expect(parseHintResponse((await repeated.json() as { hint: unknown }).hint)).toMatchObject({ state: "stale", requestId });
      expect(app.exchanges).toHaveLength(1);
    } finally { for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("rechecks the original session and writer after awaiting capabilities, before admitting work", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    const gate = deferred<void>();
    const reached = deferred<void>();
    const original = EngineCapabilities.prototype.get;
    const capability = vi.spyOn(EngineCapabilities.prototype, "get").mockImplementationOnce(async function (this: EngineCapabilities, ...args) {
      const snapshot = await original.apply(this, args);
      reached.resolve();
      await gate.promise;
      return snapshot;
    });
    const search = vi.spyOn(app.application.providers.scheduler, "get");
    let response: Promise<Response> | undefined;
    try {
      response = app.post("/runs/hint-lifetime/hints", { clientRequestId: "0".repeat(32), nodeId: app.decision.cursor.nodeId, decisionDigest: app.decision.digest, rung: "pattern", assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) });
      await bounded(reached.promise);
      expect((await fetch(`${app.origin}/runs/hint-lifetime/lease`, { method: "POST", headers: { ...app.headers, "x-writer-id": "replacement-writer" }, body: "{}" })).status).toBe(200);
      gate.resolve();
      const result = await response;
      expect(result.status, await result.clone().text()).toBe(409);
      expect(await result.json()).toMatchObject({ error: { code: "NOT_ACTIVE_WRITER" } });
      expect(search).not.toHaveBeenCalled();
      expect(app.exchanges).toHaveLength(0);
    } finally { gate.resolve(); await response; capability.mockRestore(); search.mockRestore(); for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("DELETE detaches queued voice admission while the first rung keeps its upstream slot", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    const coordinator = app.application.providerHealth.coordinator("external-voice-api")!;
    const acquire = coordinator.acquireWithin.bind(coordinator);
    const admissions: { settled: boolean; signal: AbortSignal | undefined }[] = [];
    const observed = vi.spyOn(coordinator, "acquireWithin").mockImplementation(async (...args) => {
      const admission = { settled: false, signal: args[4] };
      admissions.push(admission);
      try { return await acquire(...args); }
      finally { admission.settled = true; }
    });
    try {
      const first = id(await app.ask("pattern"));
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      const before = app.state();
      const queued = id(await app.ask("square"));
      await vi.waitFor(() => expect(admissions).toHaveLength(2));
      expect(admissions[1]!.settled).toBe(false);
      expect((await app.cancel(queued)).status).toBe(200);
      await vi.waitFor(() => expect(admissions[1]!.settled).toBe(true));
      expect(admissions[1]!.signal!.aborted).toBe(true);
      expect(app.exchanges).toHaveLength(1);
      expect(app.exchanges[0]!.signal.aborted).toBe(false);
      expect(app.state()).toEqual(before);
      expect((await app.poll(queued)).status).toBe(404);
      // A new explicit request still queues behind the original; the cancelled one cannot run.
      expect(id(await app.ask("square"))).toBe(queued);
      await vi.waitFor(() => expect(admissions).toHaveLength(3));
      expect(admissions[2]!.settled).toBe(false);
      app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(2));
      expect(admissions[2]!.settled).toBe(true);
      app.exchanges[1]!.reply.resolve(Response.json({ text: app.exchanges[1]!.sentence }));
      for (const requestId of [first, queued]) await vi.waitFor(async () => {
        const response = await app.poll(requestId);
        expect(parseHintResponse((await response.json() as { hint: unknown }).hint)).toMatchObject({ state: "available", delivery: { rendered: { voice: { state: "rendered" } } } });
      });
      expect(app.exchanges).toHaveLength(2);
    } finally {
      observed.mockRestore();
      for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed"));
      await app.application.close();
    }
  });

  it("a real failed analysis start recovers on authenticated DELETE/re-POST of the same decision", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    const start = vi.spyOn(MockProviderEngineClient.prototype, "start").mockRejectedValueOnce(new Error("startup failed"));
    try {
      const requestId = id(await app.ask());
      await vi.waitFor(async () => {
        const response = await app.poll(requestId);
        expect(parseHintResponse((await response.json() as { hint: unknown }).hint)).toMatchObject({ state: "source_unavailable", reason: "provider_unavailable" });
      });
      expect(app.exchanges).toHaveLength(0);
      expect(await app.ask()).toMatchObject({ state: "source_unavailable" });
      expect(start).toHaveBeenCalledTimes(1);
      expect((await app.cancel(requestId)).status).toBe(200);
      expect(id(await app.ask())).toBe(requestId);
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
      await vi.waitFor(async () => {
        const response = await app.poll(requestId);
        expect(parseHintResponse((await response.json() as { hint: unknown }).hint).state).toBe("available");
      });
      expect(start).toHaveBeenCalledTimes(2);
    } finally { start.mockRestore(); for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it.each(["delete", "stale"] as const)("%s aborts the actual outbound transport and late success cannot heal health", { timeout: 30_000 }, async action => {
    const app = await applicationControl();
    try {
      const requestId = id(await app.ask());
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      const before = app.state();
      expect(before.state).toBe("unverified");
      if (action === "delete") expect((await app.cancel(requestId)).status).toBe(200);
      else {
        expect((await app.post("/runs/hint-lifetime/moves", { uci: "h7g7" })).status).toBeLessThan(300);
        const response = await app.poll(requestId);
        expect(parseHintResponse((await response.json() as { hint: unknown }).hint).state).toBe("stale");
      }
      await vi.waitFor(() => expect(app.exchanges[0]!.signal.aborted).toBe(true));
      app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(app.state()).toEqual(before);
      expect((await app.poll(requestId)).status).toBe(404);
      // Same-decision DELETE retry is a real new operation and may heal health only on its own success.
      if (action === "delete") {
        expect(id(await app.ask())).toBe(requestId);
        await vi.waitFor(() => expect(app.exchanges).toHaveLength(2));
        const current = app.exchanges[1]!;
        expect(current.signal.aborted).toBe(false);
        current.reply.resolve(Response.json({ text: current.sentence }));
        await vi.waitFor(async () => {
          const response = await app.poll(requestId);
          expect(parseHintResponse((await response.json() as { hint: unknown }).hint)).toMatchObject({ state: "available", delivery: { rendered: { voice: { state: "rendered" } } } });
        });
        expect(app.state().state).toBe("available");
      }
    } finally { for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("the unchanged two-second Hint deadline reaches the transport; byte-identical deterministic fallback cannot relabel late success", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    try {
      const requestId = id(await app.ask());
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      const before = app.state();
      await vi.waitFor(async () => {
        const response = await app.poll(requestId);
        const hint = parseHintResponse((await response.json() as { hint: unknown }).hint);
        expect(hint).toMatchObject({ state: "available", delivery: { rendered: { source: "deterministic", sentence: app.exchanges[0]!.sentence, voice: { state: "fallback", reason: "deadline_exceeded" } } } });
      }, { timeout: 6_000 });
      expect(app.exchanges[0]!.signal.aborted).toBe(true);
      app.exchanges[0]!.reply.resolve(Response.json({ text: app.exchanges[0]!.sentence }));
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(app.state()).toEqual(before);
      expect(parseHintResponse((await (await app.poll(requestId)).json() as { hint: unknown }).hint)).toMatchObject({ state: "available", delivery: { rendered: { voice: { state: "fallback", reason: "deadline_exceeded" } } } });
    } finally { for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); await app.application.close(); }
  });

  it("application shutdown aborts pending Hint voice before closing provider health", { timeout: 30_000 }, async () => {
    const app = await applicationControl();
    try {
      await app.ask();
      await vi.waitFor(() => expect(app.exchanges).toHaveLength(1));
      const closing = app.application.close();
      await vi.waitFor(() => expect(app.exchanges[0]!.signal.aborted).toBe(true));
      await closing;
    } finally { for (const exchange of app.exchanges) exchange.reply.reject(new Error("closed")); }
  });
});
