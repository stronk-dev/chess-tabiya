import { readFileSync } from "node:fs";

import { classifyPhase, declareCompareDerivedEvidence, declarePhaseReadingEvidence, voiceCheck, type EvidencePacket, type RenderedEvidenceView } from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";

import { HUMAN_COMMON_RESISTANCE_PROFILE, type CapabilitiesProvider } from "./capabilities.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import type { EngineHealth, EngineRequest } from "./engine-supervisor.js";
import { evidencePacket, renderRecordedReadingEvidence, renderVoice, voiceEvidenceView, type VoiceEvidenceView, type VoiceProvider } from "./guidance.js";
import { OpponentSelector, type SelectorEngineClient } from "./opponent-selector.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { FixtureCorpusSource } from "./corpus.js";
import { ExternalHttpVoiceProvider, type ReasoningReviewProvider } from "./external-voice.js";
import { ExternalHttpTtsProvider, type TtsProvider } from "./external-tts.js";
import { IdentityService } from "./identity.js";
import { PackRegistry } from "./pack-registry.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-14T00:00:00.000Z";
const reasoningDocument = JSON.parse(readFileSync(new URL("../../../content/drafts/stated-reasoning.browser.json", import.meta.url), "utf8")) as DrillPackDefinition;
const executor: EvidenceExecutor = { async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } };
class MaiaClient implements SelectorEngineClient {
  readonly calls: EngineRequest[] = [];
  async execute(_id: string, request: EngineRequest): Promise<readonly string[]> { this.calls.push(request); return ["info multipv 1 policy 0.31 pv e2e4", "info multipv 2 policy 0.24 pv d2d4", "info multipv 3 policy 0.19 pv g1f3", "bestmove e2e4"]; }
  health(id: string): EngineHealth { return { id, status: "ready", restartCount: 0, identity: { id, kind: "opponent", name: "Maia fixture", version: "1", seedHonored: false } }; }
}
const capabilities: CapabilitiesProvider = {
  async get() {
    return {
      engines: [], policyModes: ["human_common"], feedbackPolicies: ["delayed_checkpoint", "segment_end", "immediate_guard"], guardBasis: ["rules"], costBasis: ["material"], capabilityDispositions: [], recordedReadingKinds: [], runSchemaVersion: "0.17", evidenceManifest: { digest: "fixture", counts: { producers: 25, projections: 146, consumers: 25, bindings: 182, semanticEvents: 40, eligibility: 40, reasons: 15, selectionPolicies: 1 }, availability: [], bindings: [] },
      tempoVerdicts: ["unopened", "open", "in_time", "over_budget", "too_slow", "outpaced", "premature"], tempoGradeable: ["in_time", "over_budget", "too_slow", "premature", "outpaced"], tempoDefaults: { outpaced: "failed" },
      assessmentCategories: ["win", "loss", "draw", "cursed-win", "blessed-loss"],
      objectiveAssessmentSets: { win: ["win"], hold: ["draw", "cursed-win", "blessed-loss"], save: ["loss", "blessed-loss"], resist: ["loss", "blessed-loss"] },
      policyProfiles: { strong_engine: { movetimeMs: 100, nodes: 50_000, threads: 1, hashMb: 16, multiPv: 1 }, human_common: { elo: { min: null, max: null, default: null, source: "unpublished", advertised: { min: null, max: null } }, resistance: HUMAN_COMMON_RESISTANCE_PROFILE } },
      providers: { opponent: "maia", judge: "none", llm: "none", corpus: "mock", tts: "none", tablebase: "none" },
      surfaces: { play: "available", review: "available", learn: "available", live: "available", create: "available", justPlay: "available", fromPosition: "available" },
    };
  },
};
function request(path: string, method = "GET", body?: unknown, cookie?: string): Request { return new Request(`http://tabiya.test${path}`, { method, headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...(cookie === undefined ? {} : { cookie }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
function fixturePacket(): EvidencePacket {
  const detected = classifyPhase(FEN);
  return Object.freeze({ fen: FEN, phase: { source: "detector" as const, value: detected.phase }, structures: [], observations: [], markers: [], endgame: null, plans: [], authored: [], readings: [], declared: [declarePhaseReadingEvidence(detected)] });
}

describe("adaptive guidance server seams", () => {
  it("voices compare structure operands instead of raw detector ids", () => {
    const evidence = declareCompareDerivedEvidence("structure_delta", { observation: { kind: "isolated_pawn", color: "white", file: "d", squares: [] } });
    const rendered = voiceEvidenceView(fixturePacket(), "compare", [evidence], false).rendered;
    expect(rendered.items[0]!.sentences).toEqual(["White isolated pawn appeared on the d-file. Source: Tabiya structural detector."]);
    expect(rendered.items[0]!.sentences.join(" ")).not.toContain("isolated_pawn");
  });
  it("rejects bare recorded readings at the deterministic consumer boundary", () => {
    if (false) {
      // @ts-expect-error Recorded-reading delivery consumes an admitted view.
      renderRecordedReadingEvidence([]);
    }
  });
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const storage of stores.splice(0)) storage.close(); });

  async function setup() {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: new EvidenceJobQueue(executor) });
    const run = await service.create({ id: "guide", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4, createdAt: at }, "writer");
    const client = new MaiaClient(), selector = new OpponentSelector(client, { maiaEngineId: "maia", strongEngineId: "stockfish" });
    return { service, run, client, selector };
  }

  it("withholds human split, opens it on reveal, then closes it on the next move", async () => {
    const { service, run, client, selector } = await setup();
    const handler = createRestHandler(service, selector, capabilities);
    expect((await handler(request(`/runs/guide/human-split?nodeId=${encodeURIComponent(run.activeCursor.nodeId)}`))).status).toBe(409);
    service.reveal("guide", "writer", at);
    const open = await handler(request(`/runs/guide/human-split?nodeId=${encodeURIComponent(run.activeCursor.nodeId)}`));
    expect(open.status).toBe(200);
    expect(await open.json()).toMatchObject({ engine: { name: "Maia fixture" }, candidates: [{ mass: .31 }, { mass: .24 }, { mass: .19 }] });
    expect(client.calls[0]!.commands).toContain("setoption name MultiPV value 20");
    service.move("guide", "writer", "e2e4", { at });
    const current = service.graph("guide").activeCursor.nodeId;
    expect((await handler(request(`/runs/guide/human-split?nodeId=${encodeURIComponent(current)}`))).status).toBe(409);
  });

  it("maps absent voice to a typed 503 and rejects provider inventions after one retry", async () => {
    const { service, run } = await setup();
    const absent = createRestHandler(service);
    const response = await absent(request("/runs/guide/voice", "POST", { nodeId: run.activeCursor.nodeId, scope: "reading" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "VOICE_UNAVAILABLE" } });
    let calls = 0;
    const provider: VoiceProvider = { async render() { calls += 1; return "Play e2e4 because it is best."; } };
    const packet = fixturePacket();
    expect(await renderVoice(provider, packet, "plain")).toEqual({ text: "Detected by Tabiya's phase bands: opening.", source: "deterministic" });
    expect(calls).toBe(2);
  });

  it("keeps learner-drawn squares outside the voice allowlist", async () => {
    const { service, run } = await setup();
    service.reveal("guide", "writer", at);
    const packets: VoiceEvidenceView[] = [];
    const provider: VoiceProvider = {
      async render(packet, _persona, deterministicText) {
        packets.push(packet);
        return deterministicText;
      },
    };
    const handler = createRestHandler(
      service,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      provider,
    );
    const body = { nodeId: run.activeCursor.nodeId, scope: "reading" };
    expect((await handler(request("/runs/guide/voice", "POST", body))).status).toBe(200);
    const source = packets[0]!.rendered.items.flatMap((item) => item.sentences).join("\n").toLowerCase();
    const markedSquare = Array.from({ length: 64 }, (_, index) =>
      `${String.fromCharCode(97 + (index % 8))}${Math.floor(index / 8) + 1}`,
    ).find((square) => !source.includes(square))!;
    const graph = service.graph("guide");
    const write = await handler(request("/runs/guide/marks", "PUT", {
      nodeId: graph.activeCursor.nodeId,
      branchId: graph.activeCursor.branchId,
      scope: "position",
      shapes: [{ brush: "green", orig: markedSquare }],
    }));
    expect(write.status).toBe(200);
    expect((await handler(request("/runs/guide/voice", "POST", body))).status).toBe(200);
    expect(packets[1]!.rendered.items).toEqual(packets[0]!.rendered.items);
    expect(voiceCheck(packets[1]!.rendered, markedSquare).violations).toContain(`square:${markedSquare}`);
    expect(() => voiceCheck({ consumer: packets[1]!.rendered.consumer, items: [{ evidence: packets[1]!.rendered.items[0]!.evidence, sentences: [markedSquare] }] } as unknown as RenderedEvidenceView, markedSquare)).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));

    const restSource = readFileSync(new URL("./rest.ts", import.meta.url), "utf8");
    expect(restSource).not.toContain("basePacket.sentences");
    expect(restSource).not.toContain("narrative.groups.flatMap");
  });

  it("keeps delivered claim prose outside evidence packets and the voice allowlist", async () => {
    const { run } = await setup();
    const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
    const text = "The author's pack-wide claim must stay on the authored sheet.";
    const authored = {
      items: [{
        kind: "claim" as const,
        id: "claim#packet",
        revealedBy: { kind: "outcome" as const, eventSeq: 9 },
        anchor: { claimId: "packet" },
        text,
        evidenceTypes: ["hypothesis"],
        earnedEvidenceTypes: [],
        binding: "self_declared" as const,
        authorSpans: [],
        principles: [],
      }],
      hasWithheldAuthoredContent: false,
    };
    const packet = evidencePacket({
      run,
      node,
      authored,
    });
    expect(packet.authored).toEqual([]);
    expect(voiceEvidenceView(packet).rendered.items.flatMap((item) => item.sentences).join("\n")).not.toContain(text);
    expect(packet).toEqual(evidencePacket({ run, node, authored: { items: [], hasWithheldAuthoredContent: false } }));
  });

  it("keeps voice and speech byte-identical when the authored page gains a delivered claim", async () => {
    const { service, run } = await setup();
    service.reveal("guide", "writer", at);
    const voiceProvider: VoiceProvider = { async render(_packet, _persona, deterministicText) { return deterministicText; } };
    const spoken: string[] = [];
    const tts: TtsProvider = { async synthesize(text) { spoken.push(text); return { bytes: new TextEncoder().encode(text), contentType: "audio/test" }; } };
    const handler = createRestHandler(service, undefined, undefined, undefined, undefined, undefined, undefined, undefined, voiceProvider, undefined, undefined, undefined, tts);
    const body = { nodeId: run.activeCursor.nodeId, scope: "reading" };
    const voiceBefore = await (await handler(request("/runs/guide/voice", "POST", body))).text();
    const speechBefore = new Uint8Array(await (await handler(request("/runs/guide/speech", "POST", body))).arrayBuffer());
    const claimText = "A delivered authored claim that must not widen either renderer.";
    Object.defineProperty(service, "authoredFeedback", { value: () => ({
      items: [{
        kind: "claim" as const,
        id: "claim#route-boundary",
        revealedBy: { kind: "outcome" as const, eventSeq: 8 },
        anchor: { claimId: "route-boundary" },
        text: claimText,
        evidenceTypes: ["hypothesis"],
        earnedEvidenceTypes: [],
        binding: "self_declared" as const,
        authorSpans: [],
        principles: [],
      }],
      hasWithheldAuthoredContent: false,
    }) });
    const voiceAfter = await (await handler(request("/runs/guide/voice", "POST", body))).text();
    const speechAfter = new Uint8Array(await (await handler(request("/runs/guide/speech", "POST", body))).arrayBuffer());
    expect(voiceAfter).toBe(voiceBefore);
    expect(speechAfter).toEqual(speechBefore);
    expect(spoken[1]).toBe(spoken[0]);
    expect(voiceAfter).not.toContain(claimText);

    const source = readFileSync(new URL("./guidance.ts", import.meta.url), "utf8");
    const authoredText = source.slice(source.indexOf("function authoredText"), source.indexOf("export function evidencePacket"));
    expect(authoredText).not.toMatch(/kind\s*===\s*["']claim["']/u);
  });

  it("maps absent TTS to 503 and sends only deterministic checked text", async () => {
    const { service, run } = await setup();
    const input = { nodeId: run.activeCursor.nodeId, scope: "reading" };
    const absent = await createRestHandler(service)(request("/runs/guide/speech", "POST", input));
    expect(absent.status).toBe(503);
    expect(await absent.json()).toMatchObject({ error: { code: "TTS_UNAVAILABLE" } });

    const sent: string[] = [];
    const tts: TtsProvider = { async synthesize(text) { sent.push(text); return { bytes: new Uint8Array([1, 2, 3]), contentType: "audio/test" }; } };
    service.reveal("guide", "writer", at);
    const before = service.events("guide", 0).events;
    const handler = createRestHandler(service, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, tts);
    const response = await handler(request("/runs/guide/speech", "POST", input));
    expect(response.status).toBe(200); expect(response.headers.get("content-type")).toBe("audio/test");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3]);
    expect(sent).toHaveLength(1); expect(sent[0]).toContain("opening"); expect(sent[0]).not.toContain("guide");
    expect(service.events("guide", 0).events).toEqual(before);
  });

  it("withholds voice and speech behind the same human-split permission", async () => {
    const { service, run } = await setup();
    const provider: VoiceProvider = { async render(_packet, _persona, deterministicText) { return deterministicText; } };
    const tts: TtsProvider = { async synthesize() { return { bytes: new Uint8Array([1]), contentType: "audio/test" }; } };
    const handler = createRestHandler(service, undefined, undefined, undefined, undefined, undefined, undefined, undefined, provider, undefined, undefined, undefined, tts);
    const voice = { nodeId: run.activeCursor.nodeId, scope: "reading" };
    const speech = { nodeId: run.activeCursor.nodeId, scope: "reading" };
    for (const [path, body] of [["/runs/guide/voice", voice], ["/runs/guide/speech", speech]] as const) {
      const withheld = await handler(request(path, "POST", body));
      expect(withheld.status).toBe(409);
      expect(await withheld.json()).toMatchObject({ error: { code: "ASSISTANCE_WITHHELD" } });
    }
    service.reveal("guide", "writer", at);
    expect((await handler(request("/runs/guide/voice", "POST", voice))).status).toBe(200);
    expect((await handler(request("/runs/guide/speech", "POST", speech))).status).toBe(200);
  });

  it("never opens voice or speech to participants and spectators", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const identity = new IdentityService(storage, { cookieSecure: false, derive: async (password, salt) => Buffer.alloc(32, password.length + salt.length) });
    const host = await identity.register({ handle: "voice-host", password: "correct horse battery staple" });
    const participant = await identity.register({ handle: "voice-participant", password: "correct horse battery staple" });
    const spectator = await identity.register({ handle: "voice-spectator", password: "correct horse battery staple" });
    const service = new RunService(storage, { evidenceQueue: new EvidenceJobQueue(executor) });
    const run = await service.create({ id: "role-guide", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4, createdAt: at }, { writerId: "host-writer", learnerId: host.learner.id });
    const hostPrincipal = { learnerId: host.learner.id, handle: host.learner.handle };
    service.updateGrant("role-guide", hostPrincipal, "host-writer", { op: "grant", handle: participant.learner.handle, role: "participant" }, at);
    service.updateGrant("role-guide", hostPrincipal, "host-writer", { op: "grant", handle: spectator.learner.handle, role: "spectator" }, at);
    service.reveal("role-guide", hostPrincipal, "host-writer", at);
    const provider: VoiceProvider = { async render(_packet, _persona, deterministicText) { return deterministicText; } };
    const tts: TtsProvider = { async synthesize() { return { bytes: new Uint8Array([1]), contentType: "audio/test" }; } };
    const handler = createRestHandler(service, undefined, undefined, identity, undefined, undefined, undefined, undefined, provider, undefined, undefined, undefined, tts);
    for (const session of [participant, spectator]) for (const path of ["voice", "speech"] as const) {
      const response = await handler(request(`/runs/role-guide/${path}`, "POST", { nodeId: run.activeCursor.nodeId, scope: "reading" }, session.cookie));
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: "ASSISTANCE_WITHHELD" } });
    }
    expect((await handler(request("/runs/role-guide/voice", "POST", { nodeId: run.activeCursor.nodeId, scope: "reading" }, host.cookie))).status).toBe(200);
    expect((await handler(request("/runs/role-guide/speech", "POST", { nodeId: run.activeCursor.nodeId, scope: "reading" }, host.cookie))).status).toBe(200);
  });

  it("withholds reasoning-review evidence packets from participants and spectators", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const identity = new IdentityService(storage, { cookieSecure: false, derive: async (password, salt) => Buffer.alloc(32, password.length + salt.length) });
    const host = await identity.register({ handle: "reason-host", password: "correct horse battery staple" });
    const participant = await identity.register({ handle: "reason-participant", password: "correct horse battery staple" });
    const spectator = await identity.register({ handle: "reason-spectator", password: "correct horse battery staple" });
    const registry = await PackRegistry.fromDocuments([{ source: "reasoning-disclosure", value: reasoningDocument }]);
    const service = new RunService(storage, { packRegistry: registry, evidenceQueue: new EvidenceJobQueue(executor) });
    const hostPrincipal = { learnerId: host.learner.id, handle: host.learner.handle };
    await service.create({ id: "reasoning-disclosure", session: { kind: "pack", packId: reasoningDocument.id }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }, { writerId: "host-writer", learnerId: host.learner.id });
    const moved = service.move("reasoning-disclosure", hostPrincipal, "host-writer", "h2h3", { at });
    const checkpoint = moved.run.events.find((event) => event.type === "checkpoint.reached")!;
    service.recordReasoning("reasoning-disclosure", hostPrincipal, "host-writer", { nodeId: moved.run.activeCursor.nodeId, checkpointEventSeq: checkpoint.seq, transcript: { candidates: ["Keep the queen"], plan: "protect the queen", fears: "rook on the d-file" }, at });
    service.updateGrant("reasoning-disclosure", hostPrincipal, "host-writer", { op: "grant", handle: participant.learner.handle, role: "participant" }, at);
    service.updateGrant("reasoning-disclosure", hostPrincipal, "host-writer", { op: "grant", handle: spectator.learner.handle, role: "spectator" }, at);
    let providerCalls = 0;
    const provider: ReasoningReviewProvider = { async review() { providerCalls += 1; return "[]"; } };
    const handler = createRestHandler(service, undefined, undefined, identity, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, provider);
    for (const session of [participant, spectator]) {
      const response = await handler(request("/runs/reasoning-disclosure/reasoning-review", "POST", { checkpointEventSeq: checkpoint.seq }, session.cookie));
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: "ASSISTANCE_WITHHELD" } });
    }
    expect(providerCalls).toBe(0);
    expect((await handler(request("/runs/reasoning-disclosure/reasoning-review", "POST", { checkpointEventSeq: checkpoint.seq }, host.cookie))).status).toBe(200);
    expect(providerCalls).toBe(1);
  });

  it("posts only text bytes to the external TTS provider", async () => {
    const bodies: unknown[] = [];
    const provider = new ExternalHttpTtsProvider({ url: "https://tts.test/speak", key: "SENTINEL_SECRET", fetch: async (_input, init) => {
      bodies.push(init?.body); expect(new Headers(init?.headers).get("authorization")).toBe("Bearer SENTINEL_SECRET");
      return new Response(new Uint8Array([4]), { headers: { "content-type": "audio/ogg" } });
    } });
    expect(await provider.synthesize("Only this checked sentence.")).toMatchObject({ contentType: "audio/ogg", bytes: new Uint8Array([4]) });
    expect(bodies).toEqual(["Only this checked sentence."]);
  });

  it("sends only the pinned external voice packet and falls back after transport failures", async () => {
    const packet = fixturePacket();
    const deterministic = "Detected by Tabiya's phase bands: opening.";
    const bodies: unknown[] = [];
    const provider = new ExternalHttpVoiceProvider({ url: "https://voice.test/render", key: "SENTINEL_SECRET", fetch: async (_input, init) => {
      bodies.push(JSON.parse(String(init?.body)) as unknown);
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer SENTINEL_SECRET");
      return Response.json({ text: deterministic });
    } });
    expect(await renderVoice(provider, packet, "plain", "marker")).toEqual({ text: deterministic, source: "provider" });
    expect(bodies).toEqual([{ personaPrompt: "plain", scope: "marker", items: [{ evidence: expect.objectContaining({ producer: { id: "rules.phase", version: 1 }, projection: { id: "rules.phase.reading", version: 1 } }), sentences: [deterministic] }] }]);

    let failures = 0;
    const failing = new ExternalHttpVoiceProvider({ url: "https://voice.test/render", fetch: async () => { failures += 1; return new Response("no", { status: 503 }); } });
    expect(await renderVoice(failing, packet, "plain", "story")).toEqual({ text: deterministic, source: "deterministic" });
    expect(failures).toBe(2);

    let timeouts = 0;
    const timeoutProvider = new ExternalHttpVoiceProvider({ url: "https://voice.test/render", timeoutMs: 1, fetch: async (_input, init) => {
      timeouts += 1;
      return await new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true }));
    } });
    expect(await renderVoice(timeoutProvider, packet, "plain", "reading")).toEqual({ text: deterministic, source: "deterministic" });
    expect(timeouts).toBe(2);
  });

  it("sends reasoning review as its own non-evidence request", async () => {
    const bodies: unknown[] = [];
    const provider = new ExternalHttpVoiceProvider({ url: "https://voice.test/reasoning", fetch: async (_input, init) => {
      bodies.push(JSON.parse(String(init?.body)) as unknown);
      return Response.json({ text: "[]" });
    } });
    const requestBody = { task: "Quote contiguous learner text.", transcript: { plan: "protect the queen" }, keyPoints: [{ id: "k1", label: "Safety", phrases: ["protect"] }], detections: [] };
    expect(await provider.review(requestBody)).toBe("[]");
    expect(bodies).toEqual([{ personaPrompt: "Quote only contiguous learner text; do not add chess claims.", ...requestBody }]);
    expect(JSON.stringify(bodies)).not.toMatch(/evidence|sentences|phase|Stockfish/);
  });

  it("declares detector phase bytes separately from an authored pack phase", async () => {
    const registry = await PackRegistry.fromDocuments([{ source: "reasoning-disclosure", value: reasoningDocument }]);
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const service = new RunService(storage, { packRegistry: registry, evidenceQueue: new EvidenceJobQueue(executor) });
    const run = await service.create({ id: "phase-packet", session: { kind: "pack", packId: reasoningDocument.id }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }, "writer");
    const packet = evidencePacket({ run, node: run.nodes[0]!, pack: reasoningDocument, authored: { items: [], hasWithheldAuthoredContent: false } });
    const detector = packet.declared.find((item) => item.projection.id === "rules.phase.reading")!;
    const authored = packet.declared.find((item) => item.projection.id === "pack.authored.phase")!;
    expect(detector.payload).toEqual(classifyPhase(run.nodes[0]!.fen));
    expect(authored.payload).toBe(reasoningDocument.phase);
  });

  it("keeps recorded readings out of provider input and appends their frozen prose for the learner", async () => {
    const pack = JSON.parse(readFileSync(new URL("../../../content/drafts/anti-caro-advance.json", import.meta.url), "utf8")) as DrillPackDefinition;
    const ledger = JSON.parse(readFileSync(new URL("../../../content/drafts/anti-caro-advance.evidence.json", import.meta.url), "utf8")) as unknown;
    const manifest = JSON.parse(readFileSync(new URL("../../../content/drafts/anti-caro-advance.sources.json", import.meta.url), "utf8")) as unknown;
    const registry = await PackRegistry.fromDocuments([{ source: "anti-caro", value: pack, ledger, manifest }]);
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const service = new RunService(storage, { packRegistry: registry, evidenceQueue: new EvidenceJobQueue(executor) });
    const run = await service.create({ id: "recorded-guide", session: { kind: "pack", packId: pack.id }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }, "writer");
    const selected = (moveUci: string) => ({
      moveUci,
      policyModeApplied: "human_common" as const,
      engine: { id: "fixture", name: "Fixture", version: "1", seedHonored: true },
    });
    service.opponentPly(run.id, "writer", selected("c8f5"), { at });
    service.move(run.id, "writer", "g1f3", { at });
    service.opponentPly(run.id, "writer", selected("e7e6"), { at });
    service.move(run.id, "writer", "f1e2", { at });
    const bodies: unknown[] = [];
    const provider = new ExternalHttpVoiceProvider({ url: "https://voice.test/render", fetch: async (_input, init) => {
      bodies.push(JSON.parse(String(init?.body)) as unknown);
      return Response.json({ text: "Authored packet." });
    } });
    const handler = createRestHandler(service, undefined, undefined, undefined, undefined, undefined, undefined, undefined, provider);
    const response = await handler(request(`/runs/${run.id}/voice`, "POST", { nodeId: run.activeCursor.nodeId, scope: "reading" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ text: expect.stringContaining("Recorded reading at this position: Stockfish 18") });
    expect(JSON.stringify(bodies)).not.toMatch(/Recorded reading|Stockfish|Syzygy|DTZ|DTM|depth/);
  });

  it("pins every evidence-packet construction site behind disclosure", () => {
    const source = readFileSync(new URL("./rest.ts", import.meta.url), "utf8");
    const sites = [...source.matchAll(/\bevidencePacket\(/gu)].map((match) => match.index!);
    expect(sites).toHaveLength(3);
    for (const index of sites) expect(source.slice(Math.max(0, index - 800), index)).toContain("requireGuidanceDisclosure(");
    expect("Clear, concise Tabiya voice. Do not add chess claims.").not.toMatch(/reading|recorded|coverage|queried|silent|absent/i);
  });

  it("withholds ephemeral corpus evidence until reveal and closes it on the next move", async () => {
    const { service, run, selector } = await setup();
    const source = new FixtureCorpusSource();
    const handler = createRestHandler(service, selector, capabilities, undefined, undefined, undefined, undefined, undefined, undefined, undefined, source);
    const path = `/runs/guide/corpus?nodeId=${encodeURIComponent(run.activeCursor.nodeId)}`;
    expect((await handler(request(path))).status).toBe(409);
    const before = service.events("guide", 0);
    service.reveal("guide", "writer", at);
    const opened = await handler(request(path));
    expect(opened.status).toBe(200);
    expect(await opened.json()).toMatchObject({ result: { kind: "stats", total: 120 }, committedMoveSan: null });
    expect(service.events("guide", 0).events.filter((event) => event.type === "evidence.attached")).toEqual(before.events.filter((event) => event.type === "evidence.attached"));
    service.move("guide", "writer", "e2e4", { at });
    expect((await handler(request(`/runs/guide/corpus?nodeId=${encodeURIComponent(service.graph("guide").activeCursor.nodeId)}`))).status).toBe(409);
  });

  it("maps an absent corpus provider to its typed 503", async () => {
    const { service, run, selector } = await setup(); service.reveal("guide", "writer", at);
    const response = await createRestHandler(service, selector, capabilities)(request(`/runs/guide/corpus?nodeId=${encodeURIComponent(run.activeCursor.nodeId)}`));
    expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ error: { code: "CORPUS_UNAVAILABLE" } });
  });
});
