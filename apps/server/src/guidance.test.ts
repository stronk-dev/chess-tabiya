import type { EvidencePacket } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import type { CapabilitiesProvider } from "./capabilities.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import type { EngineHealth, EngineRequest } from "./engine-supervisor.js";
import { renderVoice, type VoiceProvider } from "./guidance.js";
import { OpponentSelector, type SelectorEngineClient } from "./opponent-selector.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { FixtureCorpusSource } from "./corpus.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-14T00:00:00.000Z";
const executor: EvidenceExecutor = { async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } };
class MaiaClient implements SelectorEngineClient {
  readonly calls: EngineRequest[] = [];
  async execute(_id: string, request: EngineRequest): Promise<readonly string[]> { this.calls.push(request); return ["info multipv 1 policy 0.31 pv e2e4", "info multipv 2 policy 0.24 pv d2d4", "info multipv 3 policy 0.19 pv g1f3", "bestmove e2e4"]; }
  health(id: string): EngineHealth { return { id, status: "ready", restartCount: 0, identity: { id, kind: "opponent", name: "Maia fixture", version: "1", seedHonored: false } }; }
}
const capabilities: CapabilitiesProvider = {
  async get() {
    return {
      engines: [], policyModes: ["human_common"], runSchemaVersion: "0.8",
      policyProfiles: { strong_engine: { movetimeMs: 100, threads: 1, hashMb: 16, multiPv: 1 } },
      providers: { opponent: "maia", judge: "none", llm: "none", corpus: "mock" },
      surfaces: { play: "available", review: "available", learn: "available", live: "available", create: "available", justPlay: "available", fromPosition: "available" },
    };
  },
};
function request(path: string, method = "GET", body?: unknown): Request { return new Request(`http://tabiya.test${path}`, { method, headers: body === undefined ? {} : { "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }

describe("adaptive guidance server seams", () => {
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
    expect(client.calls[0]!.commands).toContain("setoption name MultiPV value 8");
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
    const packet = { fen: FEN, phase: { source: "detector", value: "opening" }, structures: [], observations: [], markers: [], endgame: null, plans: [], authored: [], sentences: ["Detected by Tabiya's phase bands: opening."] } satisfies EvidencePacket;
    expect(await renderVoice(provider, packet, "plain")).toEqual({ text: packet.sentences[0], source: "deterministic" });
    expect(calls).toBe(2);
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
