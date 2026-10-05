// D3411/D3412: actual production HintService and authenticated application/health/HTTP voice path.
import type { AddressInfo } from "node:net";
import {
  compileAssistanceRequest, hintDecisionStamp, parseHintResponse,
  type DrillRun, type HintResponse, type HintRung, type TypedProviderResult,
} from "@chess-tabiya/runtime";
import { describe, expect, it, vi } from "vitest";
import { CandidatePopulationService } from "./candidate-population-service.js";
import { ExternalHttpVoiceProvider } from "./external-voice.js";
import { HintService, type HintAccess, type HintProviderGateway } from "./hint-service.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";

const FEN = "k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1";
const run = { id: "lifetime", feedbackPolicy: "attempt_end", events: [{ seq: 1, type: "feedback.revealed", at: "2026-10-05T12:00:00.000Z", data: { nodeId: "n0" } }], nodes: [], branches: [], activeCursor: { branchId: "main", nodeId: "n0" } } as unknown as DrillRun;
const access = (voiceRequested = true): HintAccess => ({ run, decision: hintDecisionStamp(run), fen: FEN, role: "learner", session: "position", voiceRequested });
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
  return new HintService({ scheduler: realScheduler(), requestedEngine: async () => ({ id: "stockfish-analysis", version: "mock-1" }), populations: new CandidatePopulationService({ capacity: 8 }), depth: 12, timeoutMs: 5_000, maxOperations: 8, ...extra });
}
function id(response: HintResponse): string {
  if (response.state === "available") return response.delivery.requestId;
  if ("requestId" in response) return response.requestId;
  throw new Error(`expected operation identity: ${response.state}`);
}

describe("Guided Hint operation lifetimes", () => {
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
    const first = id(hints.request(firstAccess, "pattern"));
    try {
      await vi.waitFor(() => expect(firstSignal).toBeDefined());
      const second = id(hints.request(secondAccess, "pattern"));
      await vi.waitFor(() => expect(hints.poll(run.id, second, secondAccess.decision).state).toBe("available"));
      const third = id(hints.request(thirdAccess, "pattern"));
      await vi.waitFor(() => expect(hints.poll(run.id, third, thirdAccess.decision).state).toBe("available"));
      expect(hints.operationCount).toBe(2);
      expect(() => hints.poll(run.id, second, secondAccess.decision)).toThrow(/not known/u);
      expect(firstSignal.aborted).toBe(false);
      await fulfill();
      await bounded(hints.whenIdle());
      expect(hints.poll(run.id, first, firstAccess.decision).state).toBe("available");
    } finally { result.reject(new Error("closed")); await hints.close(); }
  });

  it.each(["cancel", "stale", "evict", "close"] as const)("%s aborts private voice, detaches ignored abort and cannot publish late output", async action => {
    const reply = deferred<string>();
    let signal: AbortSignal | undefined;
    const hints = service({ maxOperations: action === "evict" ? 1 : 8, voiceTimeoutMs: 60_000,
      voice: async (_view, _sentence, current) => { signal = current; return reply.promise; } });
    const requestId = id(hints.request(access(), "pattern"));
    try {
      await vi.waitFor(() => expect(signal).toBeDefined());
      if (action === "cancel") expect(hints.cancel(run.id, requestId).state).toBe("cancelled");
      else if (action === "stale") expect(hints.poll(run.id, requestId, { ...access().decision, digest: "sha256:changed" }).state).toBe("stale");
      else if (action === "evict") hints.request(access(false), "square");
      else await bounded(hints.close());
      expect(signal!.aborted).toBe(true);
      await bounded(hints.whenIdle());
      reply.resolve("The best move is Nb2.");
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(() => hints.poll(run.id, requestId, access().decision)).toThrow(/not known/u);
      if (action === "close") expect(hints.request(access(), "pattern")).toMatchObject({ state: "source_unavailable", reason: "cancelled" });
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
    const first = id(hints.request(access(), "pattern"));
    const second = id(hints.request(access(), "square"));
    try {
      await vi.waitFor(() => expect(signals).toHaveLength(2));
      hints.cancel(run.id, first);
      expect(signals.map(signal => signal.aborted)).toEqual([true, false]);
      replies[1]!.resolve(sentences[1]!);
      await bounded(hints.whenIdle());
      expect(search).toHaveBeenCalledTimes(1);
      expect(hints.poll(run.id, second, access().decision)).toMatchObject({ state: "available", delivery: { rung: "square", rendered: { voice: { state: "rendered", sentence: sentences[1] } } } });
      replies[0]!.reject(new Error("late discarded provider rejection"));
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(() => hints.poll(run.id, first, access().decision)).toThrow(/not known/u);
    } finally { for (const reply of replies) reply.resolve(""); await hints.close(); }
  });

  it("one cancelled search waiter leaves its peer; the final waiter aborts and detaches an ignored signal", async () => {
    const result = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    let signal: AbortSignal | undefined;
    const get = vi.fn<HintProviderGateway["get"]>(async (_request, _scope, current) => { signal = current; return result.promise; });
    const hints = service({ scheduler: { get } });
    const first = id(hints.request(access(false), "pattern"));
    const second = id(hints.request(access(false), "square"));
    try {
      await vi.waitFor(() => expect(signal).toBeDefined());
      hints.cancel(run.id, first);
      expect(signal!.aborted).toBe(false);
      hints.cancel(run.id, second);
      expect(signal!.aborted).toBe(true);
      await bounded(hints.whenIdle());
      expect(get).toHaveBeenCalledTimes(1);
    } finally { result.reject(new Error("cancelled upstream")); await hints.close(); }
  });

  it("cancelled startup cannot later begin provider acquisition", async () => {
    const engine = deferred<{ id: string; version: string }>();
    const get = vi.fn<HintProviderGateway["get"]>();
    const hints = service({ requestedEngine: () => engine.promise, scheduler: { get } });
    const requestId = id(hints.request(access(false), "pattern"));
    hints.cancel(run.id, requestId);
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
    const first = id(hints.request(access(false), "pattern"));
    try {
      await vi.waitFor(() => expect(signals).toHaveLength(1));
      hints.cancel(run.id, first);
      await bounded(hints.whenIdle());
      const replacement = id(hints.request(access(false), "pattern"));
      expect(replacement).toBe(first);
      await vi.waitFor(() => expect(signals).toHaveLength(2));
      old.reject(new Error("abandoned search"));
      await new Promise<void>(resolve => setImmediate(resolve));
      const peer = id(hints.request(access(false), "square"));
      expect(get).toHaveBeenCalledTimes(2);
      expect(signals[1]!.aborted).toBe(false);
      await fulfill();
      await bounded(hints.whenIdle());
      expect(hints.poll(run.id, replacement, access().decision).state).toBe("available");
      expect(hints.poll(run.id, peer, access().decision).state).toBe("available");
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
      const first = id(hints.request(access(false), "pattern"));
      const peer = id(hints.request(access(false), "square"));
      await hints.whenIdle();
      expect(starts).toBe(1);
      expect(hints.poll(run.id, first, access().decision)).toMatchObject({ state: "source_unavailable" });
      expect(hints.poll(run.id, peer, access().decision)).toMatchObject({ state: "source_unavailable" });
      // Ordinary idempotent POST/poll preserves that settled result; explicit retry removes it.
      expect(hints.request(access(false), "pattern").state).toBe("source_unavailable");
      hints.cancel(run.id, first);
      expect(id(hints.request(access(false), "pattern"))).toBe(first);
      await hints.whenIdle();
      expect(starts).toBe(2);
      expect(hints.poll(run.id, first, access().decision).state).toBe("available");
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
      const first = id(hints.request(access(false), "pattern"));
      await hints.whenIdle();
      expect(hints.poll(run.id, first, access().decision).state).toBe("available");
      const changed = {
        ...run,
        ...(change === "head"
          ? { events: [...run.events, { ...run.events[0]!, seq: 2 }] }
          : { activeCursor: { ...run.activeCursor, branchId: "fork" } }),
      } as DrillRun;
      const next = { ...access(false), run: changed, decision: hintDecisionStamp(changed) };
      expect(next.decision.digest).not.toBe(access().decision.digest);
      const second = id(hints.request(next, "square"));
      await hints.whenIdle();
      const result = hints.poll(run.id, second, next.decision);
      expect(result).toMatchObject({ state: "available", delivery: { decision: next.decision } });
      expect(get).toHaveBeenCalledTimes(2);
      // Only the decision's local occurrence must be rebuilt. Scheduler/source dedupe is unchanged.
      const peer = id(hints.request(next, "piece"));
      await hints.whenIdle();
      expect(hints.poll(run.id, peer, next.decision).state).toBe("available");
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
    const ask = async (rung: HintRung = "pattern") => {
      const response = await post("/runs/hint-lifetime/hints", { nodeId: graph.graph.activeCursor.nodeId, rung, decisionDigest: decision.digest,
        assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: { voice: "persona" }, moduleOverrides: { include: [], exclude: [] } } }) });
      expect(response.status, await response.clone().text()).toBe(200);
      return parseHintResponse((await response.json() as { hint: unknown }).hint);
    };
    const poll = async (requestId: string) => fetch(`${origin}/runs/hint-lifetime/hints/${requestId}`, { headers });
    const cancel = async (requestId: string) => fetch(`${origin}/runs/hint-lifetime/hints/${requestId}`, { method: "DELETE", headers });
    const state = () => application.providerHealth.snapshot().providers.find(row => row.instanceId === "external-voice")!;
    return { application, exchanges, post, ask, poll, cancel, state };
  } catch (error) { for (const exchange of exchanges) exchange.reply.reject(error); await application.close(); throw error; }
}

describe("authenticated Hint → application → health → external HTTP voice cancellation", () => {
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
