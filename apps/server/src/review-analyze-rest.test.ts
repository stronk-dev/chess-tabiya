// Actual cookie-authenticated REST boundary; no default-content or deployment clearance.
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, branchPath, commitMove, compileAssistanceRequest, createRun, moduleDecisionStamp, parseFinalizedAssistanceV1, revealFeedback } from "@chess-tabiya/runtime";
import { parseInspectorQueryPage } from "../../web/src/lib/inspector-query-response.js";
import * as analyze from "../../../packages/runtime/src/recorded-analyze-line.js";
import * as pages from "./inspector-query.js";
import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-03T02:00:00.000Z", stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
async function fixture(revealed = true) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false,
    derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const handler = createRestHandler(service, undefined, undefined, identity);
  const register = async (handle: string) => {
    const response = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: "review-confirmation-password" }) }));
    expect(response.status).toBe(201);
    return { cookie: response.headers.get("set-cookie")!.split(";", 1)[0]!, learner: storage.learnerByHandle(handle)! };
  };
  const owner = await register("review-confirm-owner"), stranger = await register("review-confirm-stranger");
  let run = createRun({ id: "recorded-review-confirmation", session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of ["e2e4", "e7e5", "g1f3"]) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, run.activeCursor.branchId), parent = path[0]!, child = path[1]!;
  run = attachEvidence(run, parent.id, ["recorded:review-rest"], { kind: "bestline", source: "engine_validated", values: { movesUci: ["d2d4", "d7d5"], engineId: "Saved engine", requestedDepth: 12 } }, at).run;
  if (revealed) run = revealFeedback(run, at).run;
  storage.create(run, { writerId: "review-confirm-writer", learnerId: owner.learner.id });
  const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const review = { branchId: run.activeCursor.branchId, nodeId: child.id, entryNodeId: parent.id, decisionDigest: moduleDecisionStamp(run).digest };
  const call = (action: string, body: unknown, cookie: string | null = owner.cookie, signal?: AbortSignal) => handler(new Request(`http://tabiya.test/runs/${run.id}/${action}`, {
    method: "POST", headers: { "content-type": "application/json", ...(cookie === null ? {} : { cookie }) }, body: JSON.stringify(body), ...(signal === undefined ? {} : { signal }) }));
  return { storage, service, handler, run, parent, child, owner, stranger, assistance, review, call };
}

describe("recorded Analyze confirmation on the existing authenticated assistance route", () => {
  it("confirms only actual target/help metadata, without acquiring evidence or changing storage", async () => {
    const f = await fixture(), before = JSON.stringify(f.storage.read(f.run.id));
    const collect = vi.spyOn(analyze, "collectRecordedAnalyzeLine"), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource"), compile = vi.spyOn(pages, "compileInspectorSourcePage");
    const response = await f.call("assistance", { assistance: f.assistance, review: f.review }), body = await response.json();
    expect(response.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(["assistance", "review"]);
    expect(body.review).toEqual({ runId: f.run.id, branchId: f.review.branchId, nodeId: f.child.id, entryNodeId: f.parent.id, fen: f.child.fen, decision: moduleDecisionStamp(f.run) });
    expect(parseFinalizedAssistanceV1(body.assistance).requestedDigest).toBe(f.assistance.requestDigest);
    expect(JSON.stringify(body)).not.toMatch(/providerLineDelivery|movesUci|bestMoveUci|recorded:review-rest/);
    expect(collect).not.toHaveBeenCalled(); expect(acquire).not.toHaveBeenCalled(); expect(compile).not.toHaveBeenCalled();
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("keeps the ordinary requested-assistance response unchanged", async () => {
    const f = await fixture(), response = await f.call("assistance", f.assistance), body = await response.json();
    expect(response.status).toBe(200); expect(Object.keys(body)).toEqual(["assistance"]);
    expect(parseFinalizedAssistanceV1(body.assistance).requestedDigest).toBe(f.assistance.requestDigest);
  });

  it("then serves the actual saved-line source through Full2 with the same confirmation identities", async () => {
    const f = await fixture(), confirmation = await (await f.call("assistance", { assistance: f.assistance, review: f.review })).json();
    const request = { protocol: "inspector.query_page@1" as const, assistance: f.assistance, query: { branchId: f.review.branchId, nodeId: f.child.id,
      decisionDigest: f.review.decisionDigest, view: { kind: "source" as const, projection: "derived.review.analysis_recorded_pv@1" as const, context: { kind: "incoming_edge" as const }, start: 0, collectionKey: null } } };
    const response = await f.call("inspector/query", request), body = await response.json();
    expect(response.status).toBe(200);
    const page = parseInspectorQueryPage(body, { runId: f.run.id, fen: f.child.fen, requestedDigest: f.assistance.requestDigest, finalDigest: confirmation.assistance.finalDigest, request });
    expect(page.kind).toBe("page");
    if (page.kind !== "page" || page.body.kind !== "source" || page.body.outcome.kind !== "available") throw new Error("Actual source did not publish");
    expect(page.body.outcome.displayed).toBe(1); expect(page.items).toHaveLength(1);
    expect(JSON.stringify(page.items)).toContain("saved report");
    expect(JSON.stringify(body)).not.toMatch(/providerLineDelivery|movesUci|bestMoveUci/);
  });

  it("does not let anonymous, foreign, stale, wrong-parent or extra-field targets confirm", async () => {
    const f = await fixture(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource"), envelope = { assistance: f.assistance, review: f.review };
    expect((await f.call("assistance", envelope, null)).status).toBe(401);
    expect((await f.call("assistance", envelope, f.stranger.cookie)).status).toBe(404);
    for (const body of [{ ...envelope, extra: true }, { ...envelope, assistance: {} }, { ...envelope, review: { ...f.review, extra: true } },
      { ...envelope, review: { ...f.review, entryNodeId: f.child.id } }, { ...envelope, review: { ...f.review, decisionDigest: `sha256:${"0".repeat(64)}` } }]) {
      const response = await f.call("assistance", body);
      expect(response.status).toBe(400);
      expect(JSON.stringify(await response.json())).not.toMatch(/movesUci|providerLineDelivery/);
    }
    expect(acquire).not.toHaveBeenCalled();
  });

  it("refuses an undisclosed unfinished line without treating it as an absent source", async () => {
    const f = await fixture(false), response = await f.call("assistance", { assistance: f.assistance, review: f.review });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "ASSISTANCE_WITHHELD" } });
  });

  it("propagates actual request cancellation instead of emitting a confirmation or 500", async () => {
    const f = await fixture(), controller = new AbortController(), reason = new DOMException("Review selection retired", "AbortError");
    controller.abort(reason);
    await expect(f.call("assistance", { assistance: f.assistance, review: f.review }, f.owner.cookie, controller.signal)).rejects.toBe(reason);
  });
});
