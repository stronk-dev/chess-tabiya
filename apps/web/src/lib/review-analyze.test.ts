// Actual source/HTTP/transport fixtures, not fabricated Inspector pages or a flat sentence path.
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, branchPath, moduleDecisionStamp, revealFeedback, presentedSentence } from "@chess-tabiya/runtime";
import { recordedInspectorRun } from "../../../../packages/runtime/src/testing/recorded-inspector-fixture.js";
import { play, attachDelivery, evaluationDelivery, lineDelivery, REVIEW_AT } from "../../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { RunService } from "../../../server/src/service.js";
import { SQLiteRunStorage } from "../../../server/src/storage.js";
import { IdentityService } from "../../../server/src/identity.js";
import { createRestHandler } from "../../../server/src/rest.js";
import { DrillApi } from "./api.js";
import { parseReviewAssistanceResponse, parseReviewDecision, requestReviewAnalyze, reviewAnalyzeIntent, type ReviewAnalyzeTarget } from "./review-analyze.js";

const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
type Arm = "typed" | "pv" | "first" | "none" | "empty" | "unattributed" | "invalid";
async function fixture(arm: Arm = "pv") {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false,
    derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const handler = createRestHandler(service, undefined, undefined, identity);
  const registered = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "analyze-client-owner", password: "analyze-client-test-password" }) }));
  expect(registered.status).toBe(201);
  const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!, owner = storage.learnerByHandle("analyze-client-owner")!;
  let run = play(recordedInspectorRun(undefined, "analyze-client"), ["e2e4", "e7e5", "g1f3"]);
  const path = branchPath(run, run.activeCursor.branchId), parent = path[0]!, child = path[1]!;
  if (arm === "typed") run = attachDelivery(run, parent.id, evaluationDelivery(parent.fen, "cp 20"), lineDelivery(parent.fen, ["d2d4", "d7d5", "c2c4"], { maxPlies: 2 }));
  else if (arm !== "none") run = attachEvidence(run, parent.id, ["recorded:analyze-client"], {
    kind: arm === "first" || arm === "invalid" ? "eval" : "bestline", source: "engine_validated",
    values: arm === "invalid" ? { providerLineDelivery: null, bestMoveUci: "d2d4", engineId: "saved", requestedDepth: 12 }
      : arm === "first" ? { bestMoveUci: "d2d4", engineId: "saved", requestedDepth: 12 }
      : { movesUci: arm === "empty" ? [] : ["d2d4", "d7d5"], ...(arm === "unattributed" ? {} : { engineId: "saved" }), requestedDepth: 12 },
  }, REVIEW_AT).run;
  run = revealFeedback(run, REVIEW_AT).run;
  storage.create(run, { writerId: "analyze-client-writer", learnerId: owner.id });
  const target: ReviewAnalyzeTarget = { runId: run.id, branchId: run.activeCursor.branchId, nodeId: child.id, entryNodeId: parent.id, fen: child.fen, decision: moduleDecisionStamp(run), workflowContext: "position" };
  const calls: Request[] = [];
  const transport = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers); headers.set("cookie", cookie);
    const request = new Request(String(input), { ...init, headers }); calls.push(request.clone());
    return handler(request);
  };
  const api = new DrillApi("http://tabiya.test", transport);
  return { storage, service, handler, api, transport, calls, target, run };
}

describe("explicit Review Analyze through actual assistance and source-page transport", () => {
  it.each(["typed", "pv", "first", "none", "empty", "unattributed", "invalid"] as const)("reads only the selected original %s arm, with no settings or run writes", async arm => {
    const f = await fixture(arm), before = JSON.stringify(f.storage.read(f.run.id));
    const result = await requestReviewAnalyze(f.api, f.target, new AbortController().signal);
    expect(f.calls[0]!.url).toBe(`http://tabiya.test/runs/${f.run.id}/assistance`);
    const body = await f.calls[0]!.json();
    expect(body).toEqual({ assistance: reviewAnalyzeIntent(f.target), review: { branchId: f.target.branchId, nodeId: f.target.nodeId, entryNodeId: f.target.entryNodeId, decisionDigest: f.target.decision.digest } });
    const requests = await Promise.all(f.calls.slice(1).map(call => call.json()));
    const expectedProbes = arm === "typed" || arm === "invalid" ? 1 : arm === "first" || arm === "none" ? 3 : 2;
    expect(requests).toHaveLength(expectedProbes);
    expect(requests.map(row => row.query.view.projection)).toEqual(["derived.review.analysis_typed_pv@1", "derived.review.analysis_recorded_pv@1", "derived.review.analysis_recorded_first@1"].slice(0, expectedProbes));
    for (const request of requests) expect(request).toMatchObject({ assistance: body.assistance, query: { branchId: f.target.branchId, nodeId: f.target.nodeId, decisionDigest: f.target.decision.digest,
      view: { context: { kind: "incoming_edge" }, start: 0, collectionKey: null } } });
    expect(result.target).toEqual(f.target);
    if (result.page.kind !== "page" || result.page.body.kind !== "source") throw new Error("Expected actual source outcome");
    const outcome = result.page.body.outcome;
    expect(outcome.kind).toBe(arm === "none" ? "unavailable" : arm === "empty" ? "no_witness" : arm === "invalid" ? "failed" : "available");
    const text = result.page.items.map(presentedSentence).join(" ");
    if (arm === "typed") { expect(text).toContain("Stockfish"); expect(text).toContain("1. d4 d5"); expect(text).toContain("longer line"); }
    if (arm === "pv" || arm === "first") { expect(text).toContain("saved report names saved"); expect(text).toContain("depth 12 search"); }
    if (arm === "unattributed") { expect(text).toContain("engine attribution"); expect(text).not.toContain("d4"); }
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    expect(f.calls.every(call => call.method === "POST" && (call.url.endsWith("/assistance") || call.url.endsWith("/inspector/query")))).toBe(true);
  });

  it.each(["runId", "branchId", "nodeId", "entryNodeId", "fen", "decision"])("refuses a crossed confirmation %s before any source probe", async field => {
    const f = await fixture(), intent = reviewAnalyzeIntent(f.target);
    const response = await f.api.reviewAssistance(f.run.id, { assistance: intent, review: { branchId: f.target.branchId, nodeId: f.target.nodeId, entryNodeId: f.target.entryNodeId, decisionDigest: f.target.decision.digest } });
    const changed = structuredClone(response) as { assistance: unknown; review: Record<string, unknown> };
    changed.review[field] = field === "decision" ? { ...f.target.decision, digest: `sha256:${"0".repeat(64)}` } : "crossed";
    expect(() => parseReviewAssistanceResponse(changed, f.target, intent)).toThrow();
    expect(f.calls).toHaveLength(1);
  });

  it("refuses hidden/accessor/extra confirmation and forged decision metadata without reading getters", async () => {
    const f = await fixture(), intent = reviewAnalyzeIntent(f.target), envelope = await f.api.reviewAssistance(f.run.id, { assistance: intent, review: { branchId: f.target.branchId, nodeId: f.target.nodeId, entryNodeId: f.target.entryNodeId, decisionDigest: f.target.decision.digest } });
    let reads = 0;
    const getter = { review: {} }; Object.defineProperty(getter, "assistance", { enumerable: true, get() { reads++; return {}; } });
    const hidden = { ...envelope as object }; Object.defineProperty(hidden, "private", { enumerable: false, value: 1 });
    for (const bad of [getter, hidden, { ...envelope as object, extra: true }]) expect(() => parseReviewAssistanceResponse(bad, f.target, intent)).toThrow();
    expect(reads).toBe(0);
    expect(() => parseReviewDecision({ ...f.target.decision, eventHeadSeq: f.target.decision.eventHeadSeq + 1 })).toThrow();
    expect(() => parseReviewDecision({ ...f.target.decision, cursor: { ...f.target.decision.cursor, private: 1 } })).toThrow();
  });

  it("checks lifetime before parsing an abort-ignoring confirmation or publishing any probe", async () => {
    const f = await fixture(), controller = new AbortController();
    let release!: (value: unknown) => void, reads = 0;
    const response = new Promise<unknown>(resolve => { release = resolve; });
    const inspector = vi.fn(f.api.inspector.bind(f.api));
    const pending = requestReviewAnalyze({ reviewAssistance: () => response, inspector }, f.target, controller.signal);
    const rejected = expect(pending).rejects.toBeInstanceOf(Error);
    controller.abort();
    release(Object.defineProperty({}, "assistance", { enumerable: true, get() { reads++; return {}; } }));
    await rejected;
    expect(reads).toBe(0); expect(inspector).not.toHaveBeenCalled();
  });

  it("checks the current target before parsing a stale source and never starts its fallback", async () => {
    const f = await fixture(), controller = new AbortController();
    let current = true, entered!: () => void, release!: () => void, reads = 0;
    const started = new Promise<void>(resolve => { entered = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
    const inspector = vi.fn(async () => { entered(); await gate; return Object.defineProperty({}, "kind", { enumerable: true, get() { reads++; return "page"; } }); });
    const pending = requestReviewAnalyze({ reviewAssistance: f.api.reviewAssistance.bind(f.api), inspector }, f.target, controller.signal, () => current);
    const rejected = expect(pending).rejects.toBeInstanceOf(Error);
    await started; current = false; release(); await rejected;
    expect(reads).toBe(0); expect(inspector).toHaveBeenCalledTimes(1);
  });
});
