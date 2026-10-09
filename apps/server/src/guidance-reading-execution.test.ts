import type { AddressInfo } from "node:net";
import { INITIAL_FEN } from "chessops/fen";
import { afterEach, describe, expect, it, vi } from "vitest";
import { evidenceForConsumer, recordedReadingEvidence } from "@chess-tabiya/runtime";
import * as execution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as phase from "./phase-source-composition.js";
import * as positions from "./position-evidence.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
import { appendRecordedReadings, evidencePacket, renderRecordedReadingEvidence, renderVoice, type VoiceProvider } from "./guidance.js";
import { IdentityService } from "./identity.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import type { TtsProvider } from "./external-tts.js";

const consumer = { id: "guidance.recorded_reading", version: 1 } as const;
const at = "2026-10-09T00:00:00.000Z";
const faults = ["missing_policy", "impossible_latency", "raw_source", "duplicate_adapter", "missing_bindings"] as const;
type Fault = typeof faults[number];
const originalCompile = execution.compileEvidenceConsumerExecution;
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

function observe(fault?: Fault) {
  const trace: string[] = [];
  const compile = vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((manifest, requested) => {
    trace.push(`compile:${requested.id}`);
    if (requested.id !== consumer.id || fault === undefined) return originalCompile(manifest, requested);
    const first = manifest.bindings.find(row => row.consumer.id === consumer.id && row.consumer.version === consumer.version)!;
    const { sourceAbsence: _absence, ...base } = first;
    const extra = { ...base, adapter: { id: "adapter.fixture.recorded_execution", version: 1 }, producer: { id: "live.stockfish", version: 1 },
      projection: { id: fault === "raw_source" ? "live.stockfish.uci_response" : "live.stockfish.position_eval", version: 1 },
      latency: { mode: fault === "impossible_latency" ? "sync" as const : "interactive" as const, maxMs: 1000 },
      ...(fault === "missing_policy" ? {} : { sourceAbsence: { necessity: "required" as const, whenNoPath: "operation_unavailable" as const } }),
    };
    const bindings = fault === "missing_bindings" ? manifest.bindings.filter(row => row.consumer.id !== consumer.id)
      : fault === "duplicate_adapter" ? [...manifest.bindings, first] : [...manifest.bindings, extra];
    // The production compiler decides the refusal over the complete mutated contract.
    // No mocked throw, admitted subset or forged evidence item stands in for that decision.
    return originalCompile({ ...manifest, bindings }, requested);
  });
  const originalRoute = routes.invokeEvidenceValueRoute;
  const collect = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => { trace.push("collect"); return originalRoute(...args); });
  const prepare = vi.spyOn(phase, "compilePhaseSourcePoint");
  const recorded = vi.spyOn(positions, "recordedReadingsAt");
  return { trace, compile, collect, prepare, recorded };
}

async function setup() {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const identity = new IdentityService(storage, { cookieSecure: false, derive: async (password, salt) => Buffer.alloc(32, password.length + salt.length) });
  const owner = await identity.register({ handle: "reading_owner", password: "reading-execution-password" });
  const guest = await identity.register({ handle: "reading_guest", password: "reading-execution-password" });
  const principal = { learnerId: owner.learner.id, handle: owner.learner.handle };
  const queue = new EvidenceJobQueue({ async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } });
  const service = new RunService(storage, { evidenceQueue: queue });
  const run = await service.create({ id: "recorded-execution", session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }, { writerId: "reading-writer", learnerId: owner.learner.id });
  service.reveal(run.id, principal, "reading-writer", at);
  const input = { run, node: run.nodes[0]!, authored: { items: [], hasWithheldAuthoredContent: false } };
  const request = (action: "voice" | "speech", cookie = owner.cookie) => new Request(`http://tabiya.test/runs/${run.id}/${action}`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ scope: "reading", nodeId: input.node.id }) });
  return { service, identity, run, input, principal, owner, guest, request, queue };
}

describe("recorded guidance complete execution", () => {
  it.each(faults)("packet refuses %s before phase, source or value preparation, even without readings", async fault => {
    const fixture = await setup();
    const observed = observe(fault);
    expect(() => evidencePacket(fixture.input)).toThrow(/BINDING_|EXECUTION_/u);
    expect(observed.trace).toEqual([`compile:${consumer.id}`]);
    expect(observed.prepare).not.toHaveBeenCalled();
    expect(observed.recorded).not.toHaveBeenCalled();
    expect(observed.collect).not.toHaveBeenCalled();
  });

  for (const operation of ["renderer", "append", "voice"] as const) {
    it.each(faults)(`${operation} refuses %s with a previously built packet/view, before any provider or fallback`, async fault => {
      const fixture = await setup();
      const packet = evidencePacket(fixture.input);
      const view = evidenceForConsumer(EVIDENCE_MANIFEST, consumer, packet.declared);
      const provider = { render: vi.fn(async () => { throw new Error("provider must not run"); }) };
      const observed = observe(fault);
      if (operation === "voice") await expect(renderVoice(provider, packet, "plain")).rejects.toThrow(/BINDING_|EXECUTION_/u);
      else expect(() => operation === "renderer" ? renderRecordedReadingEvidence(view) : appendRecordedReadings("Already rendered", packet)).toThrow(/BINDING_|EXECUTION_/u);
      expect(observed.trace).toEqual([`compile:${consumer.id}`]);
      expect(observed.collect).not.toHaveBeenCalled();
      expect(provider.render).not.toHaveBeenCalled();
    });
  }

  it("preflights every packet, including an empty recorded source, without changing current bytes", async () => {
    const fixture = await setup();
    const expected = evidencePacket(fixture.input);
    const observed = observe();
    for (let call = 0; call < 2; call += 1) {
      observed.trace.length = 0;
      expect(evidencePacket(fixture.input)).toEqual(expected);
      expect(observed.trace[0]).toBe(`compile:${consumer.id}`);
    }
    expect(observed.compile).toHaveBeenCalledTimes(2);
    expect(appendRecordedReadings("Already rendered", expected)).toBe("Already rendered");
  });

  it("retains exact recorded engine text after provider rendering and deterministic fallback, never in provider input", async () => {
    const fixture = await setup();
    const item = recordedReadingEvidence({ kind: "engine_eval", anchor: { fen: INITIAL_FEN }, sourceId: "sf", retrievedAt: "2026-01-01T00:00:00Z", grounds: "machine_validation", values: { centipawns: 20, depth: 20, multiPv: 1, perspective: "white", engineId: "sf", engineName: "Stockfish", engineVersion: "17" }, supports: [] });
    expect(item).toBeDefined();
    const packet = evidencePacket({ ...fixture.input, packEvidence: new Map([[fixture.input.node.transposeKey, [item!]]]) });
    const sentences = renderRecordedReadingEvidence(evidenceForConsumer(EVIDENCE_MANIFEST, consumer, packet.declared));
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toContain("Recorded engine evaluation at this position:");
    const provider = { render: vi.fn<VoiceProvider["render"]>(async (view, _persona, text) => {
      expect(JSON.stringify(view)).not.toMatch(/recorded\.engine|centipawns|Stockfish/u);
      expect(text).not.toContain(sentences[0]);
      return text;
    }) } satisfies VoiceProvider;
    const delivered = await renderVoice(provider, packet, "plain");
    expect(delivered.source).toBe("provider");
    expect(delivered.text.endsWith(sentences[0]!)).toBe(true);
    const failing = { render: vi.fn(async () => { throw new Error("provider failure"); }) };
    expect(await renderVoice(failing, packet, "plain")).toEqual({ ...delivered, source: "deterministic" });
    expect(failing.render).toHaveBeenCalledTimes(2);
  });
});

describe("authenticated recorded narration execution", () => {
  for (const action of ["voice", "speech"] as const) {
    it.each(faults)(`${action}: %s returns generic unavailability before collection or external work`, async fault => {
      const fixture = await setup();
      const voice = { render: vi.fn<VoiceProvider["render"]>(async (_view, _persona, text) => text) } satisfies VoiceProvider;
      const tts = { synthesize: vi.fn(async (text: string) => ({ bytes: new TextEncoder().encode(text), contentType: "audio/test" })) } satisfies TtsProvider;
      const handler = createRestHandler(fixture.service, undefined, undefined, fixture.identity, undefined, undefined, undefined, undefined, voice, undefined, undefined, undefined, tts);
      const before = fixture.service.events(fixture.run.id, fixture.principal).events;
      const observed = observe(fault);
      const response = await handler(fixture.request(action));
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE", message: "Evidence execution contract is unavailable" } });
      expect(observed.trace).toEqual([`compile:${consumer.id}`]);
      expect(observed.prepare).not.toHaveBeenCalled();
      expect(observed.recorded).not.toHaveBeenCalled();
      expect(observed.collect).not.toHaveBeenCalled();
      expect(voice.render).not.toHaveBeenCalled();
      expect(tts.synthesize).not.toHaveBeenCalled();
      expect(fixture.service.events(fixture.run.id, fixture.principal).events).toEqual(before);
    });

    it.each(["anonymous", "no_grant", "closed"] as const)(`${action}: ${"%s"} authority refusal precedes a broken execution contract`, async state => {
      const fixture = await setup();
      if (state === "closed") fixture.service.move(fixture.run.id, fixture.principal, "reading-writer", "e2e4", { at });
      await fixture.queue.whenIdle();
      const voice = { render: vi.fn<VoiceProvider["render"]>(async (_view, _persona, text) => text) } satisfies VoiceProvider;
      const handler = createRestHandler(fixture.service, undefined, undefined, fixture.identity, undefined, undefined, undefined, undefined, voice, undefined, undefined, undefined,
        { async synthesize() { throw new Error("must not run"); } });
      const observed = observe("missing_policy");
      const response = await handler(fixture.request(action, state === "anonymous" ? "" : state === "no_grant" ? fixture.guest.cookie : fixture.owner.cookie));
      expect(response.status).toBe(state === "anonymous" ? 401 : state === "no_grant" ? 404 : 409);
      expect(observed.trace).toEqual([]);
      expect(voice.render).not.toHaveBeenCalled();
    });
  }

  it.each(faults)("cached voice text cannot bypass %s admission during speech", async fault => {
    const fixture = await setup();
    const voice = { render: vi.fn<VoiceProvider["render"]>(async (_view, _persona, text) => `${text}\n`) } satisfies VoiceProvider;
    const tts = { synthesize: vi.fn(async (text: string) => ({ bytes: new TextEncoder().encode(text), contentType: "audio/test" })) } satisfies TtsProvider;
    const handler = createRestHandler(fixture.service, undefined, undefined, fixture.identity, undefined, undefined, undefined, undefined, voice, undefined, undefined, undefined, tts);
    const rendered = await handler(fixture.request("voice"));
    expect(rendered.status).toBe(200);
    const { text } = await rendered.json() as { text: string };
    const firstSpeech = await handler(fixture.request("speech"));
    expect(await firstSpeech.text()).toBe(text);
    expect(tts.synthesize).toHaveBeenCalledTimes(1);
    const observed = observe(fault);
    const refused = await handler(fixture.request("speech"));
    expect(refused.status).toBe(503);
    expect(observed.trace).toEqual([`compile:${consumer.id}`]);
    expect(tts.synthesize).toHaveBeenCalledTimes(1);
    expect(voice.render).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
    expect((await handler(fixture.request("speech"))).status).toBe(200);
    expect(tts.synthesize).toHaveBeenLastCalledWith(text, expect.any(AbortSignal));
  });

  it.each(["voice", "speech"] as const)("composed %s HTTP door refuses the broken contract before the provider", async action => {
    const voice = { render: vi.fn<VoiceProvider["render"]>(async (_view, _persona, text) => text) } satisfies VoiceProvider;
    const tts = { synthesize: vi.fn(async (text: string) => ({ bytes: new TextEncoder().encode(text), contentType: "audio/test" })) } satisfies TtsProvider;
    const owned = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, voiceProvider: voice, ttsProvider: tts }));
    try {
      await owned.ready;
      const app = owned.current()!;
      await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "http_reading_owner", password: "reading-execution-password" }) });
      expect(registered.status).toBe(201);
      const headers = { "content-type": "application/json", cookie: registered.headers.get("set-cookie")!.split(";", 1)[0]!, "x-writer-id": "reading-writer" };
      const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
      const created = await post("/runs", { id: "http-reading", session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
      expect(created.status).toBe(201);
      const { run } = await created.json() as { run: { activeCursor: { nodeId: string } } };
      expect((await post("/runs/http-reading/reveal", {})).status).toBe(200);
      const observed = observe("duplicate_adapter");
      const response = await post(`/runs/http-reading/${action}`, { scope: "reading", nodeId: run.activeCursor.nodeId });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE", message: "Evidence execution contract is unavailable" } });
      expect(observed.prepare).not.toHaveBeenCalled();
      expect(voice.render).not.toHaveBeenCalled();
      expect(tts.synthesize).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); await owned.close(); }
  });
});
