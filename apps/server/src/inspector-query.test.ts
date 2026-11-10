// Actual current102 source-page operation, never a narrowed manifest or a generic module packet.
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders, createRun, commitMove } from "@chess-tabiya/runtime";
import { parseInspectorQueryPage } from "../../web/src/lib/inspector-query-response.js";
import { INSPECTOR_SOURCE_TOPICS, type InspectorQueryView, type InspectorQueryRequest, type InspectorSourceContext } from "../../../packages/runtime/src/inspector-query-contract.js";
import { recordedComparisonFixture } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { assertInspectorSourcePagePreflight } from "./inspector-query.js";
import * as bindingExecution from "../../../packages/runtime/src/evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T22:00:00.000Z", owner = { learnerId: "query-page-owner", handle: "query-page-owner" };
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
function fixture(reveal = true) {
  const base = recordedComparisonFixture(false, "query-page"), run = reveal ? revealFeedback(base.run, at).run : base.run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  storage.create(run, { writerId: "query-page-writer", learnerId: owner.learnerId });
  const service = new RunService(storage), controller = new AbortController();
  const request = (view: InspectorQueryView = { kind: "inventory", start: 0 }): InspectorQueryRequest => ({ protocol: "inspector.query_page@1", assistance: requested,
    query: { branchId: base.main, nodeId: base.mainPath.at(-1)!.id, decisionDigest: moduleDecisionStamp(run).digest, view } });
  const send = (value: unknown = request(), principal = owner) => service.queryInspectorSources(run.id, principal, value, availability, controller.signal);
  return { ...base, run, storage, service, controller, request, send };
}

describe("actual current Inspector source-page operation", () => {
  it.each([
    ["7k/8/5K2/6Q1/8/8/8/8 w - - 0 1", "g5g7"],
    ["7k/8/6K1/5Q2/8/8/8/8 w - - 0 1", "f5f7"],
    ["8/8/8/8/6q1/5k2/8/7K b - - 0 1", "g4g2"],
    ["8/8/8/8/5q2/6k1/8/7K b - - 0 1", "f4f2"],
  ])("D3796 retains the complete zero-move terminal reading through actual source delivery: %s / %s", async (fen, move) => {
    const initial = createRun({ id: `terminal-inspector-${move}`, session: { kind: "position", start: { fen, side: fen.split(" ")[1] === "w" ? "white" : "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const run = revealFeedback(commitMove(initial, move, { actor: "user", at }).run, at).run;
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
    storage.create(run, { writerId: "terminal-inspector-writer", learnerId: owner.learnerId });
    const service = new RunService(storage), node = run.nodes.find(node => node.id === run.activeCursor.nodeId)!;
    const request: InspectorQueryRequest = { protocol: "inspector.query_page@1", assistance: requested, query: { ...run.activeCursor,
      decisionDigest: moduleDecisionStamp(run).digest, view: { kind: "source", projection: "rules.mobility.reading.legal_moves@1", context: { kind: "position" }, start: 0, collectionKey: null } } };
    const before = JSON.stringify(storage.read(run.id));
    const value = await service.queryInspectorSources(run.id, owner, request, availability, new AbortController().signal);
    expect(value.kind).toBe("page"); if (value.kind !== "page") throw new Error("Terminal reading refused");
    const page = parseInspectorQueryPage(JSON.parse(JSON.stringify(value)), { runId: run.id, request, fen: node.fen,
      requestedDigest: value.requestedConfigDigest, finalDigest: value.effectiveConfigDigest });
    expect(page.kind).toBe("page"); if (page.kind !== "page") throw new Error("Terminal reading failed receiver");
    expect(page.body).toMatchObject({ kind: "source", outcome: { kind: "available", collected: 1, displayed: 1, deferred: 0 } });
    expect(page.items).toHaveLength(1); expect(page.items[0]!.component).toMatchObject({ id: "fact_statement", operand: { rendererId: "play.legal_moves@1", operands: { pieces: 0, moves: 0 } } });
    expect(JSON.stringify(storage.read(run.id))).toBe(before);
  });
  it("requires the real complete102-ref image rather than a rebased/filtered consumer", () => {
    expect(() => assertInspectorSourcePagePreflight()).not.toThrow();
  });
  it.each(["missing", "duplicate", "substituted", "absence"] as const)("refuses a %s compiled source image before acquisition", kind => {
    const original = bindingExecution.compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 });
    const bindings = [...original.bindings];
    if (kind === "missing") bindings.pop();
    else if (kind === "duplicate") bindings[0] = bindings[1]!;
    else if (kind === "substituted") bindings[0] = { ...bindings[0]!, binding: { ...bindings[0]!.binding, projection: { id: "undeclared.inspector.source", version: 1 } } };
    else bindings[0] = { ...bindings[0]!, sourceAbsence: null };
    vi.spyOn(bindingExecution, "compileEvidenceConsumerExecutionV2").mockReturnValue({ ...original, bindings });
    expect(() => assertInspectorSourcePagePreflight()).toThrow(/complete accepted image|exact source-absence policy/u);
  });
  it("requires complete preflight even for inventory, before any source owner", async () => {
    const f = fixture(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    expect(await f.send()).toMatchObject({ protocol: "inspector.query_page@1", kind: "page", body: { kind: "inventory", range: { start: 0, count: 8, total: 88, next: 8 } } });
    expect(acquire).not.toHaveBeenCalled();
  });
  it("acquires only the actual requested source for each of the88 topics", async () => {
    const f = fixture(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource"), original = JSON.stringify(f.storage.read(f.run.id));
    for (const topic of INSPECTOR_SOURCE_TOPICS) {
      const kind = topic.contexts[0]!, nodeId = f.mainPath.at(-1)!.id;
      const context: InspectorSourceContext = kind === "branch" || kind === "recorded_review" ? { kind, throughNodeId: nodeId }
        : kind === "comparison" ? { kind, otherBranchId: f.peer, otherNodeId: f.peerPath.at(-1)!.id } : { kind };
      const projection = topic.projection;
      const view: InspectorQueryView = projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2"
        ? { kind: "source", projection, context, start: 0, collectionKey: null, parameters: { kind: "forced_mate", maxAttackerMoves: 1 } }
        : { kind: "source", projection, context, start: 0, collectionKey: null };
      expect(await f.send(f.request(view))).toMatchObject({ protocol: "inspector.query_page@1", kind: "page", body: { kind: "source", projection } });
    }
    expect(acquire).toHaveBeenCalledTimes(88); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
  });
  it("keeps current access, disclosure and decision refusals ahead of source work", async () => {
    const f = fixture(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    expect(await f.send(f.request(), { learnerId: "foreign", handle: "foreign" })).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "not_found" });
    const stale = f.request();
    expect(await f.send({ ...stale, query: { ...stale.query, decisionDigest: `sha256:${"0".repeat(64)}` } })).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "stale" });
    const withheld = fixture(false);
    expect(await withheld.send()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "withheld" });
    expect(acquire).not.toHaveBeenCalled();
  });
  it("keeps malformed request and cancellation separate from source absence", async () => {
    const f = fixture(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    expect(await f.send({})).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "invalid_request" });
    f.controller.abort(new Error("retired Inspector request"));
    await expect(f.send()).rejects.toThrow("retired Inspector request");
    expect(acquire).not.toHaveBeenCalled();
  });
  it.each(["foreign-branch", "foreign-node"])("returns a closed invalid-request result for %s without acquiring sources", async missing => {
    const f = fixture(), request = f.request(), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    expect(await f.send({ ...request, query: { ...request.query, ...(missing === "foreign-branch" ? { branchId: missing } : { nodeId: missing }) } }))
      .toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "invalid_request" });
    expect(acquire).not.toHaveBeenCalled();
  });
});
