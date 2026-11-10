// Accepted grade§4a criterion4: real authentication/storage/source/factory/registered rendering.
// Synthetic engine reports test workflow invariance, not chess quality or a live engine.
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { compileAssistanceRequest, commitMove, createRun, deriveWorkflowContext, parsePresentationReceipt,
  presentedGradeMeasurementReport, presentedSentence, revealFeedback, type DrillRun, type PresentationReceipt } from "@chess-tabiya/runtime";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { attachDelivery, evaluationDelivery } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";
import { offlineGradeFixture } from "./offline-grade.test-support.js";

const at = "2026-11-04T00:00:00.000Z", fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); });

async function source(workflow: "drill" | "review" | "imported_review", cp: number) {
  const pack = workflow === "drill" ? await offlineGradeFixture({ black: false, before: "cp 0", after: `cp ${cp}`, bound: { kind: "depth", requestedDepth: 12 } }) : undefined;
  pack?.storage.close(); // No private grant is borrowed; the authenticated service issues its own.
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const service = new RunService(storage, pack === undefined ? {} : { packRegistry: pack.registry });
  const identity = new IdentityService(storage, { cookieSecure: false, derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const handler = createRestHandler(service, undefined, undefined, identity);
  const registered = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "workflow_grade_owner", password: "workflow-grade-password" }) }));
  expect(registered.status).toBe(201);
  const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
  const principal = storage.learnerByHandle("workflow_grade_owner")!;
  const lease = { learnerId: principal.id, writerId: "workflow-grade-writer" };
  let run: DrillRun;
  if (workflow === "imported_review") {
    const imported = await handler(new Request("http://tabiya.test/runs/import", { method: "POST", headers: { cookie, "content-type": "application/json", "x-writer-id": lease.writerId }, body: JSON.stringify({
      id: "workflow-imported", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1, createdAt: at,
      source: { kind: "pgn", pgn: '[Result "*"]\n\n1. e4 *' },
    }) }));
    const body = await imported.json() as Awaited<ReturnType<RunService["importGame"]>>;
    expect(imported.status, JSON.stringify(body)).toBe(201); run = body.run;
    expect(storage.importedGame(run.id)).toEqual(body.importRecord);
  } else {
    run = pack?.run ?? commitMove(createRun({ id: "workflow-position", session: { kind: "position", start: { fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"d".repeat(64)}`, policyConfig, seed: 1, createdAt: at }), "e2e4", { at, actor: "user" }).run;
    storage.create(run, lease);
  }
  // All three workflows receive identical provider-origin operands/instrument. Pack ledger fallback
  // is deliberately present, so the actual source must prove it selected the matching delivery.
  for (const [i, node] of branchPath(run, run.activeCursor.branchId).entries()) {
    run = attachDelivery(run, node.id, evaluationDelivery(node.fen, i === 0 ? "cp 0" : `cp ${cp}`));
  }
  if (workflow !== "drill") run = revealFeedback(run, at).run;
  storage.save(run, lease);
  const authority = service.assistanceAuthority(run.id, { learnerId: principal.id, handle: principal.handle });
  expect(authority.origin).toMatchObject({ kind: "run", sessionKind: workflow === "drill" ? "pack" : workflow === "review" ? "position" : "imported" });
  if (authority.origin.kind !== "run") throw Error("Expected actual run authority");
  const context = deriveWorkflowContext(authority.origin);
  const body = { assistance: compileAssistanceRequest({ contextHint: context, preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
    query: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: [] } };
  const request = (authenticated: boolean) => workflow === "drill"
    ? new Request(`http://tabiya.test/runs/${run.id}/modules/query`, { method: "POST", headers: { "content-type": "application/json", ...(authenticated ? { cookie } : {}) }, body: JSON.stringify(body) })
    : new Request(`http://tabiya.test/runs/${run.id}/review`, { headers: authenticated ? { cookie } : {} });
  expect((await handler(request(false))).status).toBe(401);
  const saved = JSON.stringify(storage.read(run.id));
  const response = await handler(request(true)), result: unknown = await response.json();
  expect(response.status, JSON.stringify(result)).toBe(200);
  expect(JSON.stringify(storage.read(run.id))).toBe(saved);
  const receipt = workflow === "drill"
    ? (result as { page: { packets: { module: string; receipt: PresentationReceipt }[] } }).page.packets.find(packet => packet.module === "postcommit_nudge")!.receipt
    : (result as { rows: { packet: PresentationReceipt }[] }).rows[0]!.packet;
  const items = parsePresentationReceipt(receipt).filter(item => item.adapter.projection.id === "derived.grade.move_quality");
  expect(items).toHaveLength(1); const item = items[0]!;
  expect(item.adapter).toEqual({ consumer: { id: workflow === "drill" ? "module.postcommit_nudge" : "module.review_map", version: 2 }, projection: { id: "derived.grade.move_quality", version: 2 } });
  if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== (workflow === "drill" ? "play.move_quality_summary@1" : "grade.move_quality@2")) throw Error("Expected exact registered grade component");
  const full = workflow === "drill" ? presentedGradeMeasurementReport(item) : { kind: "available" as const, sentence: presentedSentence(item) };
  if (full?.kind !== "available") throw Error("Expected populated complete report, not absence/deferral");
  return { payload: item.component.operand.operands, full: full.sentence };
}

describe("D3765 authenticated three-workflow unified grade parity", () => {
  it.each([
    { cp: 28, klass: "inaccuracy", threshold: 2.5 },
    { cp: 66, klass: "inaccuracy", threshold: 2.5 },
    { cp: 157, klass: "mistake", threshold: 10 },
  ])("0→−$cp is a populated $klass in all three actual workflows", async row => {
    const results = [];
    for (const workflow of ["drill", "review", "imported_review"] as const) {
      const result = await source(workflow, row.cp);
      expect(result.payload).toMatchObject({ klass: row.klass, arm: "eval_delta", thresholdCrossed: row.threshold,
        before: { score: { kind: "cp", value: 0 } }, after: { score: { kind: "cp", value: -row.cp } },
        convention: { id: "grade-convention", version: 2 }, lane: "recorded", bound: { kind: "depth", requestedDepth: 12 },
        instrument: { origin: "provider_delivery", engineVersion: "19", generation: 1 } });
      results.push(result);
    }
    expect(results).toHaveLength(3);
    expect(JSON.stringify(results[1]!.payload)).toBe(JSON.stringify(results[0]!.payload));
    expect(JSON.stringify(results[2]!.payload)).toBe(JSON.stringify(results[0]!.payload));
    expect(results.map(result => result.full)).toEqual([results[0]!.full, results[0]!.full, results[0]!.full]);
  });
});
