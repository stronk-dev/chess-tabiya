import { compileAssistanceRequest, parseFinalizedAssistanceV1, type WorkflowPreferenceReceipt } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

// rfc/intent-presets.md §5.1: the server boundary for stages 2+3. The browser's request is
// untrusted intent; context, access and provider state are re-derived here.

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-09-24T00:00:00.000Z";
const executor: EvidenceExecutor = { async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } };
const named = (preset: "quiet" | "guided" | "analysis"): WorkflowPreferenceReceipt => ({ kind: "explicit", preset, overrides: {}, moduleOverrides: { include: [], exclude: [] } });
const post = (path: string, body: unknown) => new Request(`http://tabiya.test${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("POST /runs/:id/assistance", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => { for (const storage of stores.splice(0)) storage.close(); });

  async function setup() {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const service = new RunService(storage, { evidenceQueue: new EvidenceJobQueue(executor) });
    await service.create({ id: "assist", session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4, createdAt: at }, "writer");
    return { service, handler: createRestHandler(service) };
  }

  it("compiles the requested preset with server-derived context and access, digest-bound", async () => {
    const { service, handler } = await setup();
    const request = compileAssistanceRequest({ contextHint: "position", preference: named("guided") });
    const response = await handler(post("/runs/assist/assistance", request));
    expect(response.status).toBe(200);
    const finalized = parseFinalizedAssistanceV1(((await response.json()) as { assistance: unknown }).assistance);
    expect(finalized).toMatchObject({ stage: "finalized", context: "position", preset: "guided", displayMode: "named", requestedDigest: request.requestDigest });
    expect(finalized.modules).toEqual(["rules_floor", "sight_on_request", "postcommit_nudge", "structure_nudge", "theory_breadcrumb", "guided_hint", "compare_coach"]);
    expect(finalized.sourceAuthority.code).toBe("MODULE_AUTHORITY_NOT_ACCEPTED");

    // Before disclosure opens, access (not the preset) narrows Analyze's raw evidence, and says so.
    const closed = parseFinalizedAssistanceV1(((await (await handler(post("/runs/assist/assistance", compileAssistanceRequest({ contextHint: "position", preference: named("analysis") })))).json()) as { assistance: unknown }).assistance);
    expect(closed.config.humanSplit).toBe("off");
    expect(closed.suppressed).toContainEqual({ kind: "field", field: "humanSplit", requested: "on_request", effective: "off", by: "access", reason: "access_clamped_field" });
    service.reveal("assist", "writer", at);
    const open = parseFinalizedAssistanceV1(((await (await handler(post("/runs/assist/assistance", compileAssistanceRequest({ contextHint: "position", preference: named("analysis") })))).json()) as { assistance: unknown }).assistance);
    expect(open.config.humanSplit).toBe("on_request");
  });

  it("refuses a context the run does not have, forged bytes, and non-request stages", async () => {
    const { handler } = await setup();
    expect((await handler(post("/runs/assist/assistance", compileAssistanceRequest({ contextHint: "pack", preference: named("quiet") })))).status).toBe(400);
    const request = compileAssistanceRequest({ contextHint: "position", preference: named("quiet") });
    expect((await handler(post("/runs/assist/assistance", { ...request, preference: named("analysis") }))).status).toBe(400);
    expect((await handler(post("/runs/assist/assistance", { ...request, stage: "finalized" }))).status).toBe(400);
    expect((await handler(post("/runs/missing/assistance", request))).status).toBe(404);
  });
});
