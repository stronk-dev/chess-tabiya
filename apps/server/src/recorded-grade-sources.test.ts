// Actual RunService/storage/access source boundary. Synthetic scores are not chess qualification.
import { afterEach, describe, expect, it, vi } from "vitest";
import { commitMove, revealFeedback } from "../../../packages/runtime/src/runtime.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { recordedGradeFixture } from "../../../packages/runtime/src/testing/recorded-grade-fixture.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { parsePresentationReceipt, presentedSentence } from "../../../packages/runtime/src/presentation-contract.js";
import { readRecordedSequenceWindow } from "../../../packages/runtime/src/recorded-sequence-window.js";
import { RecordedGradeSourceOwner } from "./recorded-grade-sources.js";

const stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const storage of stores.splice(0)) storage.close(); });
function fixture(black = false, input: Pick<NonNullable<Parameters<typeof recordedGradeFixture>[0]>, "before" | "after"> = {}) {
  const original = recordedGradeFixture({ black, ...input }), run = revealFeedback(original.run, "2026-11-02T00:00:00.000Z").run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const principal = { learnerId: "grade-owner", handle: "grade-owner" }, lease = { ...principal, writerId: "grade-writer" };
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: "2026-11-02T00:00:00.000Z" });
  storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const query = { branchId: run.activeCursor.branchId, throughNodeId: original.child.id, decisionDigest: moduleDecisionStamp(run).digest, timing: "review" as const };
  const resolve = () => service.resolveGradeRecordedContext(run.id, principal, null, query, controller.signal);
  return { ...original, run, storage, service, principal, lease, controller, query, resolve };
}
describe("sole service-owned recorded grade issuer", () => {
  it.each(["mutable", "frozen-envelope"] as const)("D3944 never reuses run bytes over a %s mutable descendant", shape => {
    const f = fixture(), stored = f.storage.read(f.run.id)!, mutable = structuredClone(stored.run);
    const borrowed = shape === "mutable" ? mutable : Object.freeze({ ...mutable });
    const read = vi.spyOn(f.storage, "read").mockReturnValue({ ...stored, run: borrowed });
    try {
      const context = f.resolve(), source = f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal });
      expect(Reflect.set(mutable.start, "side", "black")).toBe(true);
      expect(() => f.service.readGradeMoveSource(source)).toThrow(/changed|storage/u);
      expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: source })).toThrow();
    } finally { read.mockRestore(); }
  });
  for (const black of [false, true]) it.each([
    { kind: "graded", input: {}, result: "available", count: 1 },
    { kind: "below_threshold", input: { after: "cp -100" }, result: "available", count: 0 },
    { kind: "missing", input: { before: null, after: null }, result: "unavailable", count: null },
  ] as const)(`D3934 rechecks revoked access before $kind factory publication for black=${black}`, row => {
    const f = fixture(black, row.input), reader = { learnerId: "grade-reader", handle: "grade-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: "2026-11-02T00:00:00.000Z" });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, "2026-11-02T00:00:00.000Z");
    const context = f.service.resolveGradeRecordedContext(f.run.id, reader, null, f.query, f.controller.signal);
    const source = f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal });
    const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: source });
    expect(result.kind).toBe(row.result);
    if (row.count !== null && result.kind === "available") expect(result.value).toHaveLength(row.count);
    f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    expect(() => f.service.readGradeMoveSource(source)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: source }))
      .toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it.each([false, true])("D3934 refuses a changed role on a retained source while admitting a fresh Review context for black=%s", black => {
    const f = fixture(black), reader = { learnerId: "grade-reader", handle: "grade-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: "2026-11-02T00:00:00.000Z" });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, "2026-11-02T00:00:00.000Z");
    const oldContext = f.service.resolveGradeRecordedContext(f.run.id, reader, null, f.query, f.controller.signal);
    const source = f.service.resolveGradeMoveSource(oldContext, { nodeId: f.child.id, signal: f.controller.signal });
    f.storage.grantRole(f.run.id, reader.learnerId, "participant", f.lease, "2026-11-02T00:00:00.000Z");
    expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: source })).toThrow(/permission|changed/u);
    const current = f.service.resolveGradeRecordedContext(f.run.id, reader, null, f.query, f.controller.signal);
    const fresh = f.service.resolveGradeMoveSource(current, { nodeId: f.child.id, signal: f.controller.signal });
    expect(f.service.readGradeMoveSource(fresh).authority.permission.role).toBe("participant");
    expect(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: fresh }).kind).toBe("available");
  });

  it.each([false, true])("shares only overlapping past windows across actual learner/ancestor queries for black=%s", async black => {
    const f = fixture(black), current = recordedGradeFixture({ black, timing: "post_commit" });
    let run = f.run;
    const moves = black ? ["e2e4", "b8c6", "g1f3", "g8f6", "f1c4", "f8c5", "d2d3", "d7d6", "c2c3"]
      : ["e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "d2d3", "f8c5", "c2c3", "d7d6"];
    for (const [index, move] of moves.entries()) run = commitMove(run, move, { actor: index % 2 === 0 ? "system" : "user", at: "2026-11-02T00:00:00.000Z" }).run;
    run = revealFeedback(run, "2026-11-02T00:00:00.000Z").run; f.storage.save(run, f.lease);
    const subject = run.nodes.at(-2)!, captured: ReturnType<RecordedGradeSourceOwner["postcommitSources"]>[] = [];
    const acquire = RecordedGradeSourceOwner.prototype.postcommitSources;
    const spy = vi.spyOn(RecordedGradeSourceOwner.prototype, "postcommitSources").mockImplementation(function (this: RecordedGradeSourceOwner, context) {
      const value = acquire.call(this, context); captured.push(value); return value;
    });
    try {
      await f.service.queryModules(run.id, f.principal, current.capture.permission.assistance!, { timing: "post_commit", subjectNodeId: subject.id, requested: [] }, {}, f.controller.signal);
      expect(captured.length).toBeGreaterThan(1);
      const seen = new Map<string, unknown>(), endpoints = new Set<string>();
      for (const population of captured) for (const family of population.windows.values()) for (const window of family.windows) {
        const data = readRecordedSequenceWindow(window); endpoints.add(data.authority.throughNodeId);
        expect(data.edges.at(-1)!.payload.afterNodeId).toBe(data.authority.throughNodeId);
        expect(data.edges.every(edge => edge.payload.afterNodeId !== run.activeCursor.nodeId)).toBe(true);
        for (const edge of data.edges) { const previous = seen.get(edge.payload.afterNodeId); if (previous !== undefined) expect(edge).toBe(previous); seen.set(edge.payload.afterNodeId, edge); }
      }
      expect(endpoints.size).toBe(4);
      expect(endpoints.has(subject.id)).toBe(true);
    } finally { spy.mockRestore(); }
  });
  it("reaches the actual Review operation with the same complete grade component, accuracy and graph", async () => {
    const f = fixture(), review = await f.service.review(f.run.id, f.principal);
    expect(review.rows).toHaveLength(1);
    expect(review.rows[0]!.grade?.klass).toBe("blunder");
    const component = parsePresentationReceipt(review.rows[0]!.packet).find(item => item.adapter.projection.id === "derived.grade.move_quality");
    expect(component?.adapter.consumer).toEqual({ id: "module.review_map", version: 2 });
    expect(presentedSentence(component!)).toBe(review.rows[0]!.grade!.sentence);
    expect(review.accuracy.white).toMatchObject({ kind: "rendered", decisions: 1, evaluated: 1 });
    expect(review.evalGraph.points[0]).toMatchObject({ kind: "evaluated", joinFromPrevious: false });
  });
  it.each([false, true])("issues the original fixed incoming edge through actual storage/access for black=%s", black => {
    const f = fixture(black), context = f.resolve();
    const source = f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal });
    const data = f.service.readGradeMoveSource(source);
    expect(data.mover).toBe(black ? "black" : "white");
    expect(data.authority.permission.assistance).toBeNull();
    const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: source });
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("Synthetic comparable grade absent");
    expect(result.value[0]!.payload.klass).toBe("blunder");
    expect(f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal })).toBe(source);
  });
  it("rejects a foreign principal, stale decision, copied context and crossed cancellation", () => {
    const f = fixture(), context = f.resolve();
    expect(() => f.service.resolveGradeRecordedContext(f.run.id, { learnerId: "outsider", handle: "outsider" }, null, f.query, f.controller.signal)).toThrow();
    expect(() => f.service.resolveGradeRecordedContext(f.run.id, f.principal, null, { ...f.query, decisionDigest: "stale" }, f.controller.signal)).toThrow();
    expect(() => f.service.resolveGradeMoveSource({ ...context }, { nodeId: f.child.id, signal: f.controller.signal })).toThrow();
    expect(() => f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: new AbortController().signal })).toThrow();
    expect(() => f.service.resolveGradeMoveSource(context, { nodeId: f.parent.id, signal: f.controller.signal })).toThrow();
  });
  it("rechecks the actual request signal before a cached source can be returned or minted", () => {
    const f = fixture(), context = f.resolve(), source = f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal });
    f.controller.abort();
    expect(() => f.service.readGradeMoveSource(source)).toThrow();
    expect(() => invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: source })).toThrow();
    expect(() => f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal })).toThrow();
  });
  it("cannot reinterpret the dedicated Review grant as live Nudge permission", () => {
    const f = fixture();
    expect(() => f.service.resolveGradeRecordedContext(f.run.id, f.principal, null, { ...f.query, timing: "post_commit" }, f.controller.signal)).toThrow();
  });
});
