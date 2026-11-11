import { compileAssistanceRequest, createRun, hintDecisionStamp, revealFeedback, type HintResponse, type TypedProviderResult } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidatePopulationService } from "./candidate-population-service.js";
import { HintService, type HintAccess, type HintProviderGateway, type HintServiceOptions } from "./hint-service.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { ProviderRegistry } from "./provider-health.js";
import { observeHintAcquisition } from "../../../tools/d3497-hint-latency/acquisition-observer.js";

const FEN = "k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1";
const run = revealFeedback(createRun({ id: "hint-acquisition", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } },
  sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3, createdAt: "2026-11-11T12:00:00.000Z" }), "2026-11-11T12:00:01.000Z").run;
const access = (extra: Partial<HintAccess> = {}): HintAccess => ({ learnerId: "owner", writerId: "source-writer", run, decision: hintDecisionStamp(run), fen: FEN, role: "learner", session: "position", voiceRequested: false,
  assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }), revalidate: () => true, ...extra });
const key = (n = 0) => n.toString(16).padStart(32, "0");
const id = (response: HintResponse): string => {
  if (response.state === "available") return response.delivery.requestId;
  if ("requestId" in response) return response.requestId;
  throw new Error(`No action identity: ${response.state}`);
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(yes => { resolve = yes; });
  return { promise, resolve };
}
function fixture(options: Partial<HintServiceOptions> = {}) {
  const engine = new MockProviderEngineClient();
  const registry = new ProviderRegistry({ configured: [{ instanceId: "stockfish-analysis", implementation: "local_fixture", endpoint: "hint-source-control", identity: "actual mock analysis" }] });
  registry.recordHandshake("stockfish-analysis");
  const providers = composeProviderTraversalApplication({ engines: engine, tablebaseFetch: null, explorerFetch: null, explorerToken: null });
  const populations = options.populations ?? new CandidatePopulationService({ capacity: 8 });
  const get = vi.fn<HintProviderGateway["get"]>((...args) => providers.scheduler.get(...args));
  const requestedEngine = vi.fn<HintServiceOptions["requestedEngine"]>(async () => { const identity = await engine.start("stockfish-analysis"); return { id: identity.id, version: identity.version }; });
  const hints = new HintService({ scheduler: { get }, requestedEngine, sourceGenerations: () => ({ registry: registry.generation("stockfish-analysis"), engine: engine.establishedGeneration("stockfish-analysis") }), populations, depth: 12, timeoutMs: 5_000, maxOperations: 8, ...options });
  return { hints, engine, registry, populations, get, requestedEngine, providers };
}
const poll = (hints: HintService, requestId: string, owner = "owner") => hints.poll(run.id, requestId, hintDecisionStamp(run), owner);
afterEach(() => vi.restoreAllMocks());

describe("Hint generation, startup and cooperative source lifetime", () => {
  it("the actual latency observer records cooperative full cold/warm packets and their stage costs", async () => {
    const f = fixture();
    const trace = { deps: 0, packets: [] as Record<string, unknown>[] };
    const restore = observeHintAcquisition(() => trace);
    try {
      const cold = await f.hints.request(access(), "pattern", key()); await f.hints.whenIdle();
      expect(poll(f.hints, id(cold)).state).toBe("available");
      expect(trace.packets).toHaveLength(1);
      expect(trace.packets[0]).toMatchObject({ kind: "ready", hitsDelta: 0, missesDelta: 1 });
      expect(Number(trace.packets[0]!.advances)).toBeGreaterThan(2);
      expect(trace.packets[0]!.legalMoves).toBe(trace.packets[0]!.candidates);
      expect(Number(trace.packets[0]!.longestStepMs)).toBeGreaterThanOrEqual(0);
      expect(Number(trace.packets[0]!.activeMs)).toBeLessThanOrEqual(Number(trace.packets[0]!.ms));
      expect(trace.deps).toBe(trace.packets[0]!.completedAt);
      trace.packets.length = 0;
      const another = { ...run, id: "hint-observer-warm" };
      const warm = await f.hints.request(access({ run: another, decision: hintDecisionStamp(another) }), "pattern", key()); await f.hints.whenIdle();
      expect(f.hints.poll(another.id, id(warm), hintDecisionStamp(another), "owner").state).toBe("available");
      expect(trace.packets).toHaveLength(1);
      expect(trace.packets[0]).toMatchObject({ kind: "ready", hitsDelta: 1, missesDelta: 0, advances: 1 });
      expect(trace.packets[0]!.legalMoves).toBe(trace.packets[0]!.candidates);
    } finally { restore(); await f.hints.close(); f.registry.shutdown(); }
  });

  it("cold discovery reserves/coalesces slots and seals the actual post-handshake pair, equal to a subsequent warm action", async () => {
    const gate = deferred<void>();
    const f = fixture();
    let established = false;
    const actualGeneration = f.engine.establishedGeneration.bind(f.engine);
    vi.spyOn(f.engine, "establishedGeneration").mockImplementation(engineId => established ? actualGeneration(engineId) : null);
    const sink = f.registry.engineLifecycleSink({ "stockfish-analysis": "stockfish-analysis" });
    const originalStart = f.engine.start.bind(f.engine);
    vi.spyOn(f.engine, "start").mockImplementation(async engineId => {
      sink({ engineId, kind: "starting" });
      await gate.promise;
      const identity = await originalStart(engineId); established = true; sink({ engineId, kind: "ready" }); return identity;
    });
    let acknowledged = false;
    const first = f.hints.request(access(), "pattern", key()).then(result => { acknowledged = true; return result; });
    const repeated = f.hints.request(access(), "pattern", key());
    const peer = f.hints.request(access(), "square", key());
    try {
      expect(f.hints.operationCount).toBe(2);
      await vi.waitFor(() => expect(f.requestedEngine).toHaveBeenCalledTimes(1));
      expect(acknowledged).toBe(false); expect(f.get).not.toHaveBeenCalled();
      const before = f.hints.requestIdFor(access().decision.digest, "pattern", key());
      expect(() => poll(f.hints, before)).toThrow(/not known/u);
      gate.resolve();
      const [one, same, two] = await Promise.all([first, repeated, peer]);
      expect(id(one)).toBe(id(same)); expect(id(one)).not.toBe(before);
      await f.hints.whenIdle();
      expect(poll(f.hints, id(one)).state).toBe("available"); expect(poll(f.hints, id(two)).state).toBe("available");
      expect(f.requestedEngine).toHaveBeenCalledTimes(1); expect(f.get).toHaveBeenCalledTimes(1);
      f.hints.cancel(run.id, id(one), "owner");
      const warm = await f.hints.request(access(), "pattern", key());
      expect(id(warm)).toBe(id(one)); await f.hints.whenIdle();
      expect(poll(f.hints, id(warm)).state).toBe("available"); expect(f.requestedEngine).toHaveBeenCalledTimes(1);
    } finally { gate.resolve(); await f.hints.close(); f.registry.shutdown(); }
  });

  it("cold pressure bounds every pre-ack slot; evicted promises terminate and late discovery runs only the surviving shared source", async () => {
    const gate = deferred<void>();
    let established = false;
    const f = fixture({ maxOperations: 2 });
    vi.spyOn(f.engine, "establishedGeneration").mockImplementation(() => established ? 1 : null);
    const original = f.requestedEngine.getMockImplementation()!;
    f.requestedEngine.mockImplementation(async () => { await gate.promise; established = true; return original(); });
    const requests = [];
    try {
      for (let n = 0; n < 10; n++) {
        requests.push(f.hints.request(access(), "pattern", key(n)));
        expect(f.hints.operationCount).toBeLessThanOrEqual(2);
      }
      const retired = await Promise.all(requests.slice(0, 8));
      expect(retired.every(value => value.state === "cancelled")).toBe(true);
      expect(f.get).not.toHaveBeenCalled(); expect(f.populations.stats().misses).toBe(0);
      gate.resolve(); const surviving = await Promise.all(requests.slice(8));
      await f.hints.whenIdle();
      expect(f.requestedEngine).toHaveBeenCalledTimes(1); expect(f.get).toHaveBeenCalledTimes(1);
      expect(surviving.every(value => poll(f.hints, id(value)).state === "available")).toBe(true);
      expect(f.hints.operationCount).toBe(2);
    } finally { gate.resolve(); await f.hints.close(); f.registry.shutdown(); }
  });

  it("a terminal-only cold attempt stays terminal after recovery; a fresh explicit key may use the established source", async () => {
    const f = fixture(); let ready = false;
    vi.spyOn(f.engine, "establishedGeneration").mockImplementation(() => ready ? 1 : null);
    f.requestedEngine.mockResolvedValueOnce(null);
    try {
      const failed = await f.hints.request(access(), "pattern", key());
      expect(failed).toMatchObject({ state: "source_unavailable", reason: "provider_unavailable" });
      ready = true;
      expect(await f.hints.request(access(), "pattern", key())).toEqual(failed);
      expect(f.requestedEngine).toHaveBeenCalledTimes(1); expect(f.get).not.toHaveBeenCalled();
      const fresh = await f.hints.request(access(), "pattern", key(1)); await f.hints.whenIdle();
      expect(id(fresh)).not.toBe(id(failed)); expect(poll(f.hints, id(fresh)).state).toBe("available");
    } finally { await f.hints.close(); f.registry.shutdown(); }
  });

  it("a cold start ignoring abort cannot outlive its source cap or start late search", { timeout: 10_000 }, async () => {
    const start = deferred<{ id: string; version: string } | null>();
    const f = fixture({ timeoutMs: 1, requestedEngine: () => start.promise });
    vi.spyOn(f.engine, "establishedGeneration").mockReturnValue(null);
    try {
      const result = await f.hints.request(access(), "pattern", key());
      expect(result).toMatchObject({ state: "source_unavailable", reason: "deadline_exceeded" });
      start.resolve({ id: "stockfish-analysis", version: "mock-1" }); await f.hints.whenIdle();
      expect(f.get).not.toHaveBeenCalled(); expect(f.populations.stats().misses).toBe(0);
      expect(await f.hints.request(access(), "pattern", key())).toEqual(result);
    } finally { start.resolve(null); await f.hints.close(); f.registry.shutdown(); }
  });

  it.each([false, true])("full acquisition yields actual stages and preserves every legal candidate (foundation first: %s)", async foundationFirst => {
    const f = fixture();
    if (foundationFirst) {
      const begun = f.populations.begin(FEN); if (begun.kind !== "started") throw new Error("begin failed");
      while (f.populations.advance(begun.entry, "foundation").kind === "pending") { /* fixed source precondition */ }
    }
    const wide = vi.spyOn(f.populations, "wide");
    const original = f.populations.advance.bind(f.populations);
    let advances = 0, heartbeats = 0;
    const advancing = vi.spyOn(f.populations, "advance").mockImplementation((...args) => {
      if (advances > 0) expect(heartbeats).toBe(advances);
      advances++;
      setImmediate(() => { heartbeats++; });
      return original(...args);
    });
    const reading = vi.spyOn(f.populations, "read");
    try {
      const first = await f.hints.request(access(), "pattern", key()); await f.hints.whenIdle();
      expect(poll(f.hints, id(first)).state).toBe("available"); expect(advances).toBeGreaterThan(2);
      expect(heartbeats).toBe(advances); expect(wide).not.toHaveBeenCalled(); expect(reading).toHaveBeenCalledTimes(1);
      const token = reading.mock.calls[0]![0]; const sealed = f.populations.read(token, "events_and_readings");
      expect(sealed.kind).toBe("ready");
      if (sealed.kind === "ready") {
        expect(sealed.receipt.selectedMember).toBe("events_and_readings");
        const synchronous = f.populations.wide(FEN);
        expect(synchronous.kind).toBe("ready"); if (synchronous.kind === "ready") expect(synchronous.receipt).toBe(sealed.receipt);
      }
      expect(f.populations.stats().misses).toBe(1);
    } finally { advancing.mockRestore(); await f.hints.close(); f.registry.shutdown(); }
  });

  it.each(["revoke", "retire", "generation", "deadline"] as const)("%s after a genuine advance prevents all later acquisition and publication", async fault => {
    const f = fixture(); let permitted = true, calls = 0;
    const origin = performance.now(); let clock = origin;
    const now = vi.spyOn(performance, "now").mockImplementation(() => clock);
    const advance = f.populations.advance.bind(f.populations);
    const advancing = vi.spyOn(f.populations, "advance").mockImplementation((token, scope) => {
      const step = advance(token, scope); calls++;
      if (calls === 1) setImmediate(() => {
        if (fault === "revoke") permitted = false;
        if (fault === "retire") for (let n = 1; n <= 8; n++) f.populations.begin(`7k/8/8/8/8/8/8/K7 w - - ${n} 1`);
        if (fault === "generation") f.registry.engineLifecycleSink({ "stockfish-analysis": "stockfish-analysis" })({ engineId: "stockfish-analysis", kind: "starting" });
        if (fault === "deadline") clock = origin + 6_001;
      });
      return step;
    });
    const reading = vi.spyOn(f.populations, "read");
    try {
      const first = await f.hints.request(access({ revalidate: () => permitted }), "pattern", key()); await f.hints.whenIdle();
      const response = poll(f.hints, id(first));
      expect(response).toMatchObject(fault === "revoke" ? { state: "stale" } : fault === "retire" ? { state: "failed" } : { state: "source_unavailable", reason: fault === "generation" ? "identity_mismatch" : "deadline_exceeded" });
      expect(calls).toBe(fault === "retire" ? 2 : 1); // The second retired-token advance refuses before a producer.
      expect(reading).not.toHaveBeenCalled();
    } finally { advancing.mockRestore(); now.mockRestore(); await f.hints.close(); f.registry.shutdown(); }
  });

  it("a detached creator's shared cap survives a later peer's synchronous authority check crossing that cap", async () => {
    const f = fixture(); const result = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    const realGet = f.get.getMockImplementation()!; let fulfill!: () => Promise<void>;
    f.get.mockImplementation(async (...args) => { fulfill = async () => result.resolve(await realGet(...args)); return result.promise; });
    const origin = performance.now(); let clock = origin, cross = false, checks = 0, calls = 0;
    const now = vi.spyOn(performance, "now").mockImplementation(() => clock);
    const advance = f.populations.advance.bind(f.populations);
    const advancing = vi.spyOn(f.populations, "advance").mockImplementation((...args) => {
      const step = advance(...args); calls++;
      if (calls === 1) setImmediate(() => { clock = origin + 5_999; cross = true; });
      return step;
    });
    try {
      const first = await f.hints.request(access(), "pattern", key());
      clock += 500;
      const peer = await f.hints.request(access({ revalidate: () => { if (cross && ++checks === 2) { clock += 2; cross = false; } return true; } }), "square", key());
      await vi.waitFor(() => expect(fulfill).toBeTypeOf("function"));
      f.hints.cancel(run.id, id(first), "owner");
      await fulfill(); await f.hints.whenIdle();
      expect(poll(f.hints, id(peer))).toMatchObject({ state: "source_unavailable", reason: "deadline_exceeded" });
      expect(calls).toBe(1); // No next stage after the authority work crossed the shared cap.
      expect(f.get.mock.calls[0]![1].budgetMs).toBeLessThanOrEqual(6_000);
      expect(Number.isSafeInteger(f.get.mock.calls[0]![1].budgetMs)).toBe(true);
    } finally { result.resolve({ kind: "source_failure", reason: "cancelled" } as never); advancing.mockRestore(); now.mockRestore(); await f.hints.close(); f.registry.shutdown(); }
  });

  it("a genuine same-generation PV for another normalized root is refused before collectors", async () => {
    const f = fixture(); const original = f.get.getMockImplementation()!;
    f.get.mockImplementation((request, scope, signal) => original({ ...request, request: { ...request.request, fen: "7k/8/8/8/8/8/8/K7 w - - 0 1" } }, scope, signal));
    const begin = vi.spyOn(f.populations, "begin");
    try {
      const first = await f.hints.request(access(), "pattern", key()); await f.hints.whenIdle();
      expect(poll(f.hints, id(first))).toMatchObject({ state: "source_unavailable", reason: "identity_mismatch" });
      expect(begin).not.toHaveBeenCalled();
    } finally { await f.hints.close(); f.registry.shutdown(); }
  });

  it("an earlier individual cap detaches only its action while a later-created shared source finishes for its peer", async () => {
    const startup = deferred<{ id: string; version: string }>();
    const f = fixture({ requestedEngine: () => startup.promise });
    let established = false;
    vi.spyOn(f.engine, "establishedGeneration").mockImplementation(() => established ? 1 : null);
    const origin = performance.now(); let clock = origin, advances = 0;
    const now = vi.spyOn(performance, "now").mockImplementation(() => clock);
    const actual = f.populations.advance.bind(f.populations);
    const advancing = vi.spyOn(f.populations, "advance").mockImplementation((...args) => {
      const step = actual(...args);
      if (++advances === 1) setImmediate(() => { clock = origin + 6_001; });
      return step;
    });
    try {
      const earlier = f.hints.request(access(), "pattern", key());
      await new Promise<void>(resolve => setImmediate(resolve));
      clock += 500; established = true;
      const later = await f.hints.request(access(), "square", key());
      startup.resolve({ id: "stockfish-analysis", version: "mock-1" });
      const first = await earlier; await f.hints.whenIdle();
      expect(poll(f.hints, id(first))).toMatchObject({ state: "source_unavailable", reason: "deadline_exceeded" });
      expect(poll(f.hints, id(later)).state).toBe("available");
      expect(f.get).toHaveBeenCalledTimes(1); expect(advances).toBeGreaterThan(2);
    } finally { startup.resolve({ id: "stockfish-analysis", version: "mock-1" }); advancing.mockRestore(); now.mockRestore(); await f.hints.close(); f.registry.shutdown(); }
  });

  it("the actual shared timer keeps its creator's cap after cancellation and detaches an abort-ignoring provider", { timeout: 10_000 }, async () => {
    const late = deferred<TypedProviderResult<"stockfish.principal_variation@1">>();
    const f = fixture({ timeoutMs: 1 });
    let signal: AbortSignal | undefined;
    f.get.mockImplementation(async (_request, _scope, current) => { signal = current; return late.promise; });
    const begin = vi.spyOn(f.populations, "begin");
    try {
      const first = await f.hints.request(access(), "pattern", key());
      await new Promise<void>(resolve => setTimeout(resolve, 20));
      const peer = await f.hints.request(access(), "square", key());
      f.hints.cancel(run.id, id(first), "owner");
      await f.hints.whenIdle();
      expect(signal!.aborted).toBe(true);
      expect(poll(f.hints, id(peer))).toMatchObject({ state: "source_unavailable", reason: "deadline_exceeded" });
      late.resolve({ kind: "source_failure", reason: "cancelled" } as never);
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(begin).not.toHaveBeenCalled();
      expect(poll(f.hints, id(peer))).toMatchObject({ state: "source_unavailable", reason: "deadline_exceeded" });
    } finally { late.resolve({ kind: "source_failure", reason: "cancelled" } as never); await f.hints.close(); f.registry.shutdown(); }
  });

  it("a timely complete source keeps its separate voice phase after the original source deadline", async () => {
    const voice = deferred<string>(); let sentence = "";
    const f = fixture({ voice: async (_view, canonical) => { sentence = canonical; return voice.promise; } });
    const origin = performance.now();
    try {
      const first = await f.hints.request(access({ voiceRequested: true }), "pattern", key());
      await vi.waitFor(() => expect(sentence).not.toBe(""));
      const now = vi.spyOn(performance, "now").mockReturnValue(origin + 6_001);
      voice.resolve(sentence); await f.hints.whenIdle();
      expect(poll(f.hints, id(first))).toMatchObject({ state: "available", delivery: { rendered: { voice: { state: "rendered", sentence } } } });
      now.mockRestore();
    } finally { voice.resolve(sentence); await f.hints.close(); f.registry.shutdown(); }
  });
});
