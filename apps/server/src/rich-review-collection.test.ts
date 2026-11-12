// Full original Map oracle through genuine SQLite/registry/RunService, below the not-yet-migrated
// HTTP/page receiver. Synthetic evaluations establish source/byte contracts, not chess quality.
import { afterEach, describe, expect, it, onTestFailed, vi } from "vitest";
import { recordedReviewLedgerFixture } from "./recorded-review-ledger.test-support.js";
import { RunService, type RichReviewAccess, type RichReviewProgress, type RichReviewCollection } from "./service.js";
import { RecordedGradeSourceOwner } from "./recorded-grade-sources.js";
import * as packetSources from "../../../packages/runtime/src/review-evidence.js";
import * as mapSources from "../../../packages/runtime/src/review-map-sources.js";
import * as phaseSources from "./phase-source-composition.js";
import { assertReviewMapResponse } from "../../web/src/lib/review-response.js";
import { reviewFixtureRun } from "../../../packages/runtime/src/testing/review-map-fixture.js";
import { revealFeedback, rewind, fork, commitMove } from "../../../packages/runtime/src/runtime.js";
import type { SQLiteRunStorage } from "./storage.js";
import { ReviewJobOwner } from "./review-job-owner.js";

const services: RunService[] = [], stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const service of services.splice(0)) service.closeReviewCollections(); for (const storage of stores.splice(0)) storage.close(); vi.restoreAllMocks(); vi.useRealTimers(); });
async function fixture(side: "white" | "black" = "white", modern = true, now?: () => number) {
  const f = await recordedReviewLedgerFixture(side, "mixed", modern); stores.push(f.storage);
  const service = new RunService(f.storage, { packRegistry: f.registry, reviewJobs: { maxJobs: 1, ...(now === undefined ? {} : { now }) } });
  services.push(service);
  const access: RichReviewAccess = { principal: f.principal, sessionId: "actual-test-session", assertCurrent: vi.fn() };
  return { ...f, service, access };
}
async function drain(service: RunService, lease: RichReviewCollection, progress: RichReviewProgress[] = [], group = 1) {
  for (let index = 0; index < 2_000; index++) {
    const result = await service.advanceRichReviewCollection(lease, map => JSON.stringify(map));
    if (result.kind === "complete") return result.value;
    progress.push(result.progress);
    if ((index + 1) % group === 0) await new Promise<void>(resolve => setImmediate(resolve));
  }
  throw new Error("Original Review collection did not finish");
}

describe("complete original rich Review under its private lifetime", () => {
  it("atomically completes the actual final unit and serialization against a concurrent advance", async () => {
    const f = await fixture(), expected = JSON.stringify(await f.service.review(f.run.id, f.principal));
    const job = f.service.beginRichReviewCollection(f.run.id, f.access), original = ReviewJobOwner.prototype.unit;
    let held!: () => void, release!: () => void;
    const arrived = new Promise<void>(resolve => { held = resolve; }), barrier = new Promise<void>(resolve => { release = resolve; });
    let holding = false;
    vi.spyOn(ReviewJobOwner.prototype, "unit").mockImplementation(async function(this: ReviewJobOwner, ...args) {
      const result = await Reflect.apply(original, this, args);
      if (!holding && result !== null && typeof result === "object" && "done" in result && result.done === true) { holding = true; held(); await barrier; }
      return result;
    });
    const serialize = vi.fn((map: Awaited<ReturnType<RunService["review"]>>) => JSON.stringify(map));
    const first = (async () => {
      for (;;) { const result = await f.service.advanceRichReviewCollection(job.lease, serialize); if (result.kind === "complete") return result.value; }
    })();
    const settledFirst = first.then(value => ({ kind: "value" as const, value }), error => ({ kind: "error" as const, error }));
    await arrived;
    const peer = await f.service.advanceRichReviewCollection(job.lease, serialize)
      .then(value => ({ kind: "value" as const, value }), error => ({ kind: "error" as const, error }));
    release(); const actual = await settledFirst;
    expect(peer.kind).toBe("error");
    if (peer.kind === "error") expect(["busy", "not_found"]).toContain(peer.error.reason);
    expect(actual).toEqual({ kind: "value", value: expected }); expect(serialize).toHaveBeenCalledTimes(1);
  });
  it.each([
    ["white", true], ["black", true], ["white", false], ["black", false],
  ] as const)("retains every %s Map byte with modern=%s and no eager fallback", async (side, modern) => {
    const f = await fixture(side, modern), expected = JSON.stringify(await f.service.review(f.run.id, f.principal));
    const eager = ["reviewSources", "reviewPopulation", "reviewMeasurements"] as const;
    for (const method of eager) vi.spyOn(RecordedGradeSourceOwner.prototype, method).mockImplementation(() => { throw new Error("Unbudgeted eager Review fallback"); });
    vi.spyOn(phaseSources, "compilePhaseArc").mockImplementation(() => { throw new Error("Eager PhaseArc fallback"); });
    vi.spyOn(mapSources, "collectReviewRelations").mockImplementation(() => { throw new Error("Hidden relation recollection"); });
    vi.spyOn(mapSources, "collectReviewOpeningEvents").mockImplementation(() => { throw new Error("Hidden opening recollection"); });
    const packet = vi.spyOn(packetSources, "advanceReviewPacketCollection"), phase = vi.spyOn(phaseSources, "advanceRecordedPhaseArcCollection");
    const relations = vi.spyOn(mapSources, "advanceReviewMapSourceCollection"), grade = vi.spyOn(RecordedGradeSourceOwner.prototype, "resolveMove");
    const collect = vi.spyOn(f.registry, "collectRecordedMeasurements"), before = JSON.stringify(f.storage.read(f.run.id)!.run);
    const job = f.service.beginRichReviewCollection(f.run.id, f.access);
    expect(packet).not.toHaveBeenCalled(); expect(collect).not.toHaveBeenCalled();
    const progress: RichReviewProgress[] = [], actual = await drain(f.service, job.lease, progress);
    expect(actual).toBe(expected);
    assertReviewMapResponse(JSON.parse(actual), { runId: f.run.id, branchId: job.branchId });
    expect(progress.filter(row => row.stage === "subject").map(row => row.nodeId)).toEqual(f.run.nodes.map(node => node.id));
    expect(packet).toHaveBeenCalledTimes(3); expect(phase).toHaveBeenCalledTimes(4);
    expect(relations).toHaveBeenCalledTimes(5); expect(grade).toHaveBeenCalledTimes(2);
    expect(collect).toHaveBeenCalledTimes(modern ? 6 : 9);
    // Without modern evaluations, original grade endpoints independently read one engine
    // population per node BEFORE the six historical engine/tablebase report populations.
    if (!modern) expect(collect.mock.calls.slice(0, 3).map(([input]) => [input.position.payload.nodeId, input.projection]))
      .toEqual(f.run.nodes.map(node => [node.id, "recorded.engine.eval@1"]));
    expect(collect.mock.calls.slice(modern ? 0 : 3).map(([input]) => [input.position.payload.nodeId, input.projection]))
      .toEqual(f.run.nodes.flatMap(node => [[node.id, "recorded.engine.eval@1"], [node.id, "recorded.tablebase.result@1"]]));
    expect(JSON.stringify(f.storage.read(f.run.id)!.run)).toBe(before);
    await expect(f.service.advanceRichReviewCollection(job.lease, map => JSON.stringify(map))).rejects.toMatchObject({ reason: "not_found" });
  });

  it.each([1, 2, 32])("retains the original complete long-line Map across real-yield source groups=%s", async group => {
    const began = performance.now(); let oracleMs: number | null = null, jobBegan: number | null = null;
    const progress: RichReviewProgress[] = [];
    onTestFailed(() => { console.error("Original rich Review timeout attribution", { group, oracleMs, elapsedMs: performance.now() - began,
      jobMs: jobBegan === null ? null : performance.now() - jobBegan, last: progress.at(-1), units: progress.length }); });
    const f = await fixture();
    let run = reviewFixtureRun({ id: "long-rich-review", kind: "position", plies: 34 });
    run = revealFeedback(run, "2026-11-12T00:00:00.000Z").run; f.storage.create(run, f.lease);
    const expected = JSON.stringify(await f.service.review(run.id, f.principal));
    oracleMs = performance.now() - began; jobBegan = performance.now();
    const job = f.service.beginRichReviewCollection(run.id, f.access);
    expect(await drain(f.service, job.lease, progress, group)).toBe(expected);
    expect(progress.filter(row => row.stage === "subject").map(row => row.nodeId)).toEqual(run.nodes.map(node => node.id));
  });

  it("retains inherited subjects and a genuine distinct occurrence with the same full FEN", async () => {
    const f = await fixture();
    const original = reviewFixtureRun({ id: "inherited-rich-review", kind: "position", plies: 8 });
    const entry = original.nodes[3]!, following = original.nodes[4]!;
    let run = rewind(original, entry.id, "2026-11-12T00:00:00.000Z").run;
    run = fork(run, entry.id, { at: "2026-11-12T00:00:00.000Z" }).run;
    run = commitMove(run, following.moveUci!, { at: "2026-11-12T00:00:00.000Z" }).run;
    run = revealFeedback(run, "2026-11-12T00:00:00.000Z").run; f.storage.create(run, f.lease);
    const branchId = run.activeCursor.branchId, expected = JSON.stringify(await f.service.review(run.id, f.principal, branchId));
    const job = f.service.beginRichReviewCollection(run.id, f.access, branchId, entry.id), progress: RichReviewProgress[] = [];
    expect(await drain(f.service, job.lease, progress)).toBe(expected);
    const subjects = progress.filter(row => row.stage === "subject").map(row => row.nodeId);
    expect(subjects).toEqual([...original.nodes.slice(0, 4).map(node => node.id), run.activeCursor.nodeId]);
    expect(run.nodes.find(node => node.id === run.activeCursor.nodeId)!.fen).toBe(following.fen);
    expect(run.activeCursor.nodeId).not.toBe(following.id); expect(subjects).not.toContain(following.id);
  });

  it.each(["session", "grant", "storage", "registry"] as const)("retires before further source work after actual %s changes", async change => {
    const f = await fixture(), reader = { learnerId: "rich-reader", handle: "rich-reader" }, at = "2026-11-12T00:00:00.000Z";
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: at });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    const access = { ...f.access, principal: reader, assertCurrent: vi.fn() };
    const job = f.service.beginRichReviewCollection(f.run.id, access);
    for (;;) {
      const step = await f.service.advanceRichReviewCollection(job.lease, map => JSON.stringify(map));
      if (step.kind !== "progress") throw new Error("Missing original partial source state");
      if (step.progress.stage === "ledger_begin") break;
    }
    const collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    if (change === "session") access.assertCurrent.mockImplementation(() => { throw new Error("Actual session revoked"); });
    else if (change === "grant") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    else if (change === "storage") vi.spyOn(f.storage, "read").mockReturnValue(undefined);
    else vi.spyOn(f.registry, "resolveRecordedMeasurementSource").mockReturnValue({ kind: "unavailable", reason: "source_absent" });
    await expect(f.service.advanceRichReviewCollection(job.lease, map => JSON.stringify(map))).rejects.toMatchObject({ reason: "stale" });
    expect(collect).not.toHaveBeenCalled();
    await expect(f.service.advanceRichReviewCollection(job.lease, map => JSON.stringify(map))).rejects.toMatchObject({ reason: "not_found" });
  });

  it("charges the real grade constructor to its original clock, cancels partial sources, and frees capacity", async () => {
    let now = 0; const f = await fixture("white", true, () => now);
    const begin = f.service.beginGradeRecordedContext.bind(f.service);
    let captured: ReturnType<typeof begin> | undefined;
    vi.spyOn(f.service, "beginGradeRecordedContext").mockImplementation((...args) => { captured = begin(...args); now = 5_001; return captured; });
    const job = f.service.beginRichReviewCollection(f.run.id, f.access);
    await expect(f.service.advanceRichReviewCollection(job.lease, map => JSON.stringify(map))).rejects.toMatchObject({ reason: "budget_exhausted" });
    expect(captured).toBeDefined(); expect(f.service.cancelGradeRecordedContext(captured!)).toBe(false);
    now = 0; expect(() => f.service.beginRichReviewCollection(f.run.id, f.access)).not.toThrow();
  });

  it("cleans an original constructor's returned handle when cancellation happens inside it", async () => {
    const f = await fixture(), begin = packetSources.beginReviewPacketCollection;
    const job = f.service.beginRichReviewCollection(f.run.id, f.access);
    let captured: ReturnType<typeof begin> | undefined;
    vi.spyOn(packetSources, "beginReviewPacketCollection").mockImplementation((...args) => {
      captured = begin(...args); f.service.cancelReviewCollection(f.run.id, f.access, job.jobId); return captured;
    });
    await expect(drain(f.service, job.lease)).rejects.toMatchObject({ reason: "cancelled" });
    expect(captured).toBeDefined(); expect(packetSources.cancelReviewPacketCollection(captured!)).toBe(false);
  });

  it("does not cross private service owners and does not acquire when cancelled before the first unit", async () => {
    const f = await fixture(), other = new RunService(f.storage, { packRegistry: f.registry }); services.push(other);
    const collect = vi.spyOn(RecordedGradeSourceOwner.prototype, "beginResolve"), job = f.service.beginRichReviewCollection(f.run.id, f.access);
    await expect(other.advanceRichReviewCollection(job.lease, map => JSON.stringify(map))).rejects.toMatchObject({ reason: "not_found" });
    expect(() => f.service.cancelReviewCollection(f.run.id, { ...f.access, sessionId: "foreign" }, job.jobId)).toThrow(expect.objectContaining({ reason: "not_found" }));
    f.service.cancelReviewCollection(f.run.id, f.access, job.jobId);
    await expect(f.service.advanceRichReviewCollection(job.lease, map => JSON.stringify(map))).rejects.toMatchObject({ reason: "not_found" });
    expect(collect).not.toHaveBeenCalled();
  });
});
