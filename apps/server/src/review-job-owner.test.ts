// Private lifecycle controls plus actual registry/SQLite/RunService source ownership.
// Synthetic recorded values do not establish chess truth or an appliance cost budget.
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewJobOwner, type ReviewJobIdentity, type ReviewJobLease } from "./review-job-owner.js";
import { recordedReviewLedgerFixture } from "./recorded-review-ledger.test-support.js";
import { readRecordedReviewLedgerSource } from "../../../packages/runtime/src/recorded-review-ledger.js";
import type { SQLiteRunStorage } from "./storage.js";

const identity: ReviewJobIdentity = { principalId: "learner", sessionId: "session", runId: "run", scope: "rich_review", selectionKey: "original-selection" };
const owners: ReviewJobOwner[] = [], stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const owner of owners.splice(0)) owner.close(); for (const storage of stores.splice(0)) storage.close(); vi.useRealTimers(); vi.restoreAllMocks(); });
function owner(maxJobs = 1, now?: () => number) { const value = new ReviewJobOwner({ maxJobs, ...(now === undefined ? {} : { now }) }); owners.push(value); return value; }
function simple(input = owner()) {
  const dispose = vi.fn(), checkCurrent = vi.fn(), value = { count: 0 };
  const lease = input.start(identity, () => ({ value, checkCurrent, dispose }));
  return { owner: input, lease, value, dispose, checkCurrent, id: input.clock(lease).jobId };
}

describe("one bounded private Review job owner", () => {
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects maxJobs %s", maxJobs => {
    expect(() => new ReviewJobOwner({ maxJobs })).toThrow(/positive safe integer/u);
  });

  it.each([1, 2])("bounds actual entries at %s without acquiring or evicting a peer", capacity => {
    const jobs = owner(capacity), first = simple(jobs), others = Array.from({ length: capacity - 1 }, () => simple(jobs));
    const prepare = vi.fn();
    expect(() => jobs.start(identity, prepare)).toThrow(expect.objectContaining({ reason: "capacity" }));
    expect(prepare).not.toHaveBeenCalled(); expect(jobs.size).toBe(capacity);
    expect(jobs.resume(identity, first.id)).toBe(first.lease);
    expect(first.dispose).not.toHaveBeenCalled();
    for (const other of others) expect(other.id).not.toBe(first.id);
    jobs.cancel(identity, first.id); expect(jobs.size).toBe(capacity - 1);
    expect(simple(jobs).id).not.toBe(first.id);
  });

  it.each(["principalId", "sessionId", "runId", "scope", "selectionKey"] as const)("refuses a changed %s without checking or retiring another owned job", key => {
    const f = simple(), checks = f.checkCurrent.mock.calls.length;
    expect(() => f.owner.resume({ ...identity, [key]: key === "scope" ? "modules" : "foreign" }, f.id))
      .toThrow(expect.objectContaining({ reason: "not_found" }));
    expect(f.checkCurrent).toHaveBeenCalledTimes(checks); expect(f.dispose).not.toHaveBeenCalled();
    expect(f.owner.resume(identity, f.id)).toBe(f.lease);
  });

  it("has source-free cancellation for either scope, independent of a cursor/config body", () => {
    const jobs = owner(2), rich = simple(jobs);
    const dispose = vi.fn(), modules = jobs.start({ ...identity, scope: "modules" }, () => ({ value: {}, checkCurrent: () => {}, dispose }));
    const id = jobs.clock(modules).jobId;
    expect(() => jobs.cancel({ ...identity, sessionId: "foreign" }, rich.id)).toThrow(expect.objectContaining({ reason: "not_found" }));
    expect(jobs.cancel(identity, rich.id)).toEqual({ jobId: rich.id, state: "cancelled" });
    expect(rich.dispose).toHaveBeenCalledTimes(1); expect(dispose).not.toHaveBeenCalled();
    expect(jobs.cancel(identity, id)).toEqual({ jobId: id, state: "cancelled" });
    for (const retired of [rich.id, id, "unknown"]) expect(() => jobs.cancel(identity, retired)).toThrow(expect.objectContaining({ reason: "not_found" }));
  });

  it("charges synchronous preparation and live checks to the original absolute clock", () => {
    let now = 0; const jobs = owner(1, () => now), dispose = vi.fn();
    expect(() => jobs.start(identity, () => { now = 5_001; return { value: {}, checkCurrent: () => {}, dispose }; }))
      .toThrow(expect.objectContaining({ reason: "budget_exhausted" }));
    expect(dispose).toHaveBeenCalledTimes(1); expect(jobs.size).toBe(0);
    now = 0;
    expect(() => jobs.start(identity, () => ({ value: {}, dispose, checkCurrent: () => { now = 5_001; } })))
      .toThrow(expect.objectContaining({ reason: "budget_exhausted" }));
    expect(dispose).toHaveBeenCalledTimes(2); expect(jobs.size).toBe(0);
  });

  it.each(["close", "expiry"] as const)("disposes returned original preparation exactly once after synchronous %s", change => {
    let now = 0; const jobs = owner(1, () => now), dispose = vi.fn();
    expect(() => jobs.start(identity, control => {
      if (change === "close") jobs.close();
      else { now = 5_001; try { control.clock(); } catch { /* Original preparation still returns its owned handle. */ } }
      return { value: { originalSource: true }, checkCurrent: () => {}, dispose };
    })).toThrow(expect.objectContaining({ reason: change === "close" ? "cancelled" : "budget_exhausted" }));
    expect(jobs.size).toBe(0); expect(dispose).toHaveBeenCalledTimes(1);
    jobs.close(); expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("does not round a fractional remaining budget up into optional source dispatch", () => {
    let now = 0; const jobs = owner(1, () => now), dispatch = vi.fn(), dispose = vi.fn();
    expect(() => jobs.start(identity, control => {
      now = 4_999.5;
      void control.optionalSource(dispatch).catch(() => {});
      return { value: {}, checkCurrent: () => {}, dispose };
    })).toThrow(expect.objectContaining({ reason: "budget_exhausted" }));
    expect(dispatch).not.toHaveBeenCalled(); expect(jobs.size).toBe(0);
  });

  it("expires idle jobs and source timers without a later request or clock renewal", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let now = 0; const jobs = owner(1, () => now), dispose = vi.fn();
    const lease = jobs.start(identity, () => ({ value: {}, dispose, checkCurrent: () => {} }));
    const id = jobs.clock(lease).jobId;
    now = 4_900; expect(jobs.resume(identity, id)).toBe(lease);
    expect(jobs.clock(lease).remainingBudgetMs).toBe(100);
    now = 5_000; await vi.advanceTimersByTimeAsync(5_000);
    expect(jobs.size).toBe(0); expect(dispose).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
    expect(() => jobs.resume(identity, id)).toThrow(expect.objectContaining({ reason: "not_found" }));
  });

  it("caps an optional source at lesser of 500ms and actual remaining time", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let now = 0; const jobs = owner(1, () => now);
    const lease = jobs.start(identity, control => ({ value: control, checkCurrent: () => {}, dispose: () => {} }));
    let source: { signal: AbortSignal; timeoutMs: number } | undefined, settle!: (value: string) => void;
    const waiting = jobs.unit(lease, async control => {
      now = 4_875;
      try {
        return await control.optionalSource(budget => { source = budget; return new Promise<string>(resolve => { settle = resolve; }); });
      } catch { return "original adapter maps expired source"; }
    });
    await Promise.resolve(); await Promise.resolve();
    expect(source!.timeoutMs).toBe(125); expect(source!.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(124); expect(source!.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(source!.signal.aborted).toBe(true);
    await expect(waiting).resolves.toBe("original adapter maps expired source");
    settle("must not publish"); await Promise.resolve();
    expect(jobs.size).toBe(1); // The original caller still owns source outcome mapping.
  });

  it("caps an ignored optional source at500ms and rejects a synchronous source overrun", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let now = 0; const jobs = owner(1, () => now);
    const lease = jobs.start(identity, control => ({ value: control, checkCurrent: () => {}, dispose: () => {} }));
    const waiting = jobs.unit(lease, async control => {
      try { return await control.optionalSource(budget => { expect(budget.timeoutMs).toBe(500); return new Promise<never>(() => {}); }); }
      catch { return "source timeout"; }
    });
    await Promise.resolve(); await Promise.resolve();
    await vi.advanceTimersByTimeAsync(500); await expect(waiting).resolves.toBe("source timeout");
    // A synchronous source cannot be preempted; its result still must be rejected afterward.
    const overrun = jobs.unit(lease, async control => {
      try { return await control.optionalSource(() => { now = 501; return "must not publish"; }); }
      catch { return "source timeout"; }
    });
    await expect(overrun).resolves.toBe("source timeout");
  });

  it.each(["before", "during", "yield"] as const)("does no further work after cancellation %s a unit", async when => {
    const f = simple(), request = new AbortController(), collect = vi.fn(() => {
      if (when === "during") request.abort();
      if (when === "yield") setImmediate(() => request.abort());
      return 1;
    });
    if (when === "before") request.abort();
    await expect(f.owner.unit(f.lease, collect, request.signal)).rejects.toMatchObject({ reason: "cancelled" });
    expect(collect).toHaveBeenCalledTimes(when === "before" ? 0 : 1);
    expect(f.dispose).toHaveBeenCalledTimes(1); expect(f.owner.size).toBe(0);
  });

  it("cancels a provider that ignores abort without waiting for its late settlement", async () => {
    const f = simple(); let settle!: (value: number) => void;
    const waiting = f.owner.unit(f.lease, () => new Promise<number>(resolve => { settle = resolve; }));
    await Promise.resolve();
    const rejected = expect(waiting).rejects.toMatchObject({ reason: "cancelled" });
    f.owner.cancel(identity, f.id); await rejected;
    settle(7); await Promise.resolve(); expect(f.owner.size).toBe(0); expect(f.dispose).toHaveBeenCalledTimes(1);
  });

  it("expires an ignored provider under the original idle timer with no continuation request", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let now = 0; const f = simple(owner(1, () => now));
    const waiting = f.owner.unit(f.lease, () => new Promise<never>(() => {}));
    const rejected = expect(waiting).rejects.toMatchObject({ reason: "budget_exhausted" });
    await Promise.resolve(); now = 5_000; await vi.advanceTimersByTimeAsync(5_000); await rejected;
    expect(f.dispose).toHaveBeenCalledTimes(1); expect(f.owner.size).toBe(0); expect(vi.getTimerCount()).toBe(0);
  });

  it("cannot publish final serialized bytes after cancellation during the final yield", async () => {
    const f = simple();
    await expect(f.owner.finish(f.lease, value => {
      const bytes = JSON.stringify(value); setImmediate(() => f.owner.cancel(identity, f.id)); return bytes;
    })).rejects.toMatchObject({ reason: "cancelled" });
    expect(f.dispose).toHaveBeenCalledTimes(1); expect(f.owner.size).toBe(0);
  });

  it("refuses concurrent units without killing the original operation", async () => {
    const f = simple(); let settle!: (value: number) => void;
    const waiting = f.owner.unit(f.lease, () => new Promise<number>(resolve => { settle = resolve; }));
    await expect(f.owner.unit(f.lease, () => 2)).rejects.toMatchObject({ reason: "busy" });
    settle(1); await expect(waiting).resolves.toBe(1); expect(f.owner.size).toBe(1);
  });

  it.each(["unit", "finish"] as const)("refuses stale authority after actual %s work before publishing", async operation => {
    const f = simple();
    await expect(f.owner[operation](f.lease, () => {
      f.checkCurrent.mockImplementation(() => { throw new Error("Actual authority changed"); }); return "must not publish";
    })).rejects.toMatchObject({ reason: "stale" });
    expect(f.dispose).toHaveBeenCalledTimes(1); expect(f.owner.size).toBe(0);
  });

  it.each(["unit", "finish"] as const)("rejects synchronous deadline overrun during %s", async operation => {
    let now = 0; const f = simple(owner(1, () => now));
    await expect(f.owner[operation](f.lease, () => { now = 5_001; return "late"; })).rejects.toMatchObject({ reason: "budget_exhausted" });
    expect(f.dispose).toHaveBeenCalledTimes(1); expect(f.owner.size).toBe(0);
  });

  it("retires final serialization, failure and shutdown, even with retained tokens or broken cleanup", async () => {
    const f = simple();
    await expect(f.owner.finish(f.lease, value => JSON.stringify(value))).resolves.toBe('{"count":0}');
    expect(f.dispose).toHaveBeenCalledTimes(1); expect(f.owner.size).toBe(0);
    expect(() => f.owner.clock(f.lease)).toThrow(expect.objectContaining({ reason: "not_found" }));
    await expect(f.owner.unit({} as ReviewJobLease<unknown>, () => 1)).rejects.toMatchObject({ reason: "not_found" });
    const failure = simple(f.owner);
    await expect(f.owner.unit(failure.lease, () => { throw new Error("source failed"); })).rejects.toMatchObject({ reason: "source_failed" });
    const cleanup = vi.fn(() => { throw new Error("cleanup failed"); });
    f.owner.start(identity, () => ({ value: {}, checkCurrent: () => {}, dispose: cleanup }));
    expect(() => f.owner.close()).not.toThrow(); expect(cleanup).toHaveBeenCalledTimes(1); expect(f.owner.size).toBe(0);
    expect(() => f.owner.start(identity, () => ({ value: {}, checkCurrent: () => {}, dispose: () => {} })))
      .toThrow(expect.objectContaining({ reason: "not_found" }));
  });

  it("owns actual historical source capture through real authority, original issuer and final serialization", async () => {
    const f = await recordedReviewLedgerFixture(); stores.push(f.storage);
    const jobs = owner(), before = JSON.stringify(f.storage.read(f.run.id)!.run);
    const lease = jobs.start({ ...identity, principalId: f.principal.learnerId, runId: f.run.id }, control => {
      const context = f.service.resolveGradeRecordedContext(f.run.id, f.principal, null, f.query, control.signal);
      const capture = f.service.beginReviewMeasurementSource(context);
      return { value: { context, capture }, checkCurrent: () => { f.service.readGradeRecordedContext(context); },
        dispose: () => { f.service.cancelReviewMeasurementSource(capture); } };
    });
    for (let i = 0; i < 6; i++) await jobs.unit(lease, ({ capture }) => f.service.advanceReviewMeasurementSource(capture));
    const result = await jobs.finish(lease, ({ capture }) => {
      const image = readRecordedReviewLedgerSource(f.service.finishReviewMeasurementSource(capture));
      return JSON.stringify(image.rows.map(row => ({ nodeId: row.position.payload.nodeId, outcomes: row.slots.map(slot => slot.outcome) })));
    });
    expect(JSON.parse(result)).toEqual(f.run.nodes.map(node => ({ nodeId: node.id, outcomes: [
      { kind: "available", collected: 2 }, { kind: "available", collected: 1 },
    ] })));
    expect(jobs.size).toBe(0); expect(JSON.stringify(f.storage.read(f.run.id)!.run)).toBe(before);
  });

  it("starts the budget before actual grade preparation and cancels its real incomplete handle on overrun", async () => {
    const f = await recordedReviewLedgerFixture(); stores.push(f.storage);
    let now = 0; const jobs = owner(1, () => now), begin = f.service.beginGradeRecordedContext.bind(f.service);
    let capture: ReturnType<typeof begin> | undefined;
    const prepare = vi.spyOn(f.service, "beginGradeRecordedContext").mockImplementation((...args) => {
      capture = begin(...args); now = 5_001; return capture;
    });
    expect(() => jobs.start({ ...identity, principalId: f.principal.learnerId, runId: f.run.id }, control => {
      const handle = f.service.beginGradeRecordedContext(f.run.id, f.principal, null, f.query, control.signal);
      return { value: handle, checkCurrent: () => {}, dispose: () => { f.service.cancelGradeRecordedContext(handle); } };
    })).toThrow(expect.objectContaining({ reason: "budget_exhausted" }));
    expect(prepare).toHaveBeenCalledTimes(1); expect(capture).toBeDefined();
    expect(f.service.cancelGradeRecordedContext(capture!)).toBe(false); expect(jobs.size).toBe(0);
  });

  it("retires the actual partial ledger capture when a real grant is revoked after a collection", async () => {
    const f = await recordedReviewLedgerFixture(); stores.push(f.storage);
    const reader = { learnerId: "job-reader", handle: "job-reader" }, at = "2026-11-12T00:00:00.000Z";
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: at });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    const jobs = owner(), collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    const lease = jobs.start({ ...identity, principalId: reader.learnerId, runId: f.run.id }, control => {
      const context = f.service.resolveGradeRecordedContext(f.run.id, reader, null, f.query, control.signal);
      const capture = f.service.beginReviewMeasurementSource(context);
      return { value: capture, checkCurrent: () => { f.service.readGradeRecordedContext(context); },
        dispose: () => { f.service.cancelReviewMeasurementSource(capture); } };
    });
    let originalCapture: Parameters<typeof f.service.advanceReviewMeasurementSource>[0] | undefined;
    await expect(jobs.unit(lease, capture => {
      originalCapture = capture;
      const result = f.service.advanceReviewMeasurementSource(capture);
      f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease); return result;
    })).rejects.toMatchObject({ reason: "stale" });
    expect(collect).toHaveBeenCalledTimes(1); expect(jobs.size).toBe(0);
    expect(f.service.cancelReviewMeasurementSource(originalCapture!)).toBe(false);
  });
});
