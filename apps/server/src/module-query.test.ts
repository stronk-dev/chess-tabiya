import { compileAssistanceRequest, moduleDisclosureDigest, parseFinalizedAssistanceV1, parsePresentationReceipt, presentedSentence, type ModuleQueryPage, type WorkflowPreferenceReceipt } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

// rfc/module-registration.md §2.5.2 + rfc/intent-presets.md Checkpoint B (D5): the one module
// query route. The requested-assistance receipt is untrusted intent; the server re-derives the
// authority, compiles and finalizes it, and every delivery is bound to that final digest.

const MAROCZY = "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";
const at = "2026-09-24T00:00:00.000Z";
const executor: EvidenceExecutor = { async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } };
const named = (preset: "quiet" | "guided" | "support" | "analysis"): WorkflowPreferenceReceipt => ({ kind: "explicit", preset, overrides: {}, moduleOverrides: { include: [], exclude: [] } });
const post = (path: string, body: unknown) => new Request(`http://tabiya.test${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("POST /runs/:id/modules/query", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const storage of stores.splice(0)) storage.close(); });

  async function setup() {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: new EvidenceJobQueue(executor) });
    await service.create({ id: "modules", session: { kind: "position", start: { fen: MAROCZY, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4, createdAt: at }, "writer");
    return { service, storage, handler: createRestHandler(service) };
  }

  const finalizedFor = async (handler: ReturnType<typeof createRestHandler>, preset: "quiet" | "support") =>
    parseFinalizedAssistanceV1(((await (await handler(post("/runs/modules/assistance", compileAssistanceRequest({ contextHint: "position", preference: named(preset) })))).json()) as { assistance: unknown }).assistance);

  it("delivers the Support seats the preset compiled, each bound to the same final digest", async () => {
    const { storage, handler } = await setup();
    const nodeId = storage.read("modules")!.run.activeCursor.nodeId;
    const assistance = compileAssistanceRequest({ contextHint: "position", preference: named("support") });
    const response = await handler(post("/runs/modules/modules/query", { assistance, query: { timing: "pre_commit", nodeId, selectedSquare: "c4", requested: ["sight_on_request", "threat_radar"] } }));
    expect(response.status).toBe(200);
    const page = ((await response.json()) as { page: ModuleQueryPage }).page;
    const finalized = await finalizedFor(handler, "support");
    expect(page.effectiveConfigDigest).toBe(finalized.finalDigest);
    expect(page.requestedConfigDigest).toBe(assistance.requestDigest);
    expect(page.packets.map((packet) => packet.module)).toEqual(["sight_on_request", "threat_radar"]);
    for (const packet of page.packets) {
      const { digest, ...body } = packet.disclosure;
      expect(moduleDisclosureDigest(body)).toBe(digest);
      expect(packet.disclosure.effectiveConfigDigest).toBe(finalized.finalDigest);
      for (const item of parsePresentationReceipt(packet.receipt)) expect(presentedSentence(item)).not.toMatch(/Tabiya's|detector|_/u);
    }
  });

  it("delivers nothing Quiet did not compile, and refuses forged bytes and malformed subjects", async () => {
    const { storage, handler } = await setup();
    const nodeId = storage.read("modules")!.run.activeCursor.nodeId;
    const quiet = compileAssistanceRequest({ contextHint: "position", preference: named("quiet") });
    const page = ((await (await handler(post("/runs/modules/modules/query", { assistance: quiet, query: { timing: "pre_commit", nodeId, selectedSquare: "c4", requested: ["sight_on_request"] } }))).json()) as { page: ModuleQueryPage }).page;
    expect(page.packets).toEqual([]);
    expect(page.suppressions).toEqual([{ module: "sight_on_request", reason: "not_effective" }]);
    expect((await handler(post("/runs/modules/modules/query", { assistance: { ...quiet, preference: named("support") }, query: { timing: "pre_commit", nodeId, requested: [] } }))).status).toBe(400);
    expect((await handler(post("/runs/modules/modules/query", { assistance: quiet, query: { timing: "pre_commit", nodeId, selectedSquare: "z9", requested: [] } }))).status).toBe(400);
    expect((await handler(post("/runs/modules/modules/query", { assistance: quiet, query: { timing: "at_commit", nodeId, candidateUci: "e2e4", generation: 1 } }))).status).toBe(400);
    expect((await handler(post("/runs/modules/modules/query", { assistance: quiet, query: { timing: "review", nodeId, requested: [] }, effective: "forged" }))).status).toBe(400);
  });

  it("withholds post-commit delivery until the run opens feedback", async () => {
    const { service, storage, handler } = await setup();
    service.move("modules", "writer", "g8f6");
    const subject = storage.read("modules")!.run.nodes.find((node) => node.moveUci === "g8f6")!.id;
    const guided = compileAssistanceRequest({ contextHint: "position", preference: named("support") });
    const response = await handler(post("/runs/modules/modules/query", { assistance: guided, query: { timing: "post_commit", subjectNodeId: subject, requested: [] } }));
    expect(response.status).toBe(409);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe("ASSISTANCE_WITHHELD");
  });
});
