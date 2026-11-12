import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { attachEvidence } from "./evidence.js";
import * as routes from "./internal/evidence-value-routes.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import {
  advanceRecordedReviewSourceCollection, beginRecordedReviewSourceCollection,
  cancelRecordedReviewSourceCollection, collectRecordedReviewSourcePopulation,
  finishRecordedReviewSourceCollection, readRecordedReviewSourcePopulation,
  type RecordedReviewSourceCollection, type ReviewProviderNodeState,
} from "./review-evidence.js";
import { rewind } from "./runtime.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import { evaluationDelivery, importedRun, play, REVIEW_AT } from "./testing/review-evidence-fixture.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import type { DrillRun } from "./types.js";

function fixture(initial: DrillRun, branchId = initial.activeCursor.branchId) {
  let run = initial;
  const path = branchPath(run, branchId), main = branchPath(run, run.branches[0]!.id);
  const record = run.sessionKind !== "imported" ? undefined : {
    runId: run.id, result: "1-0" as const,
    movetextDigest: `sha256:${createHash("sha256").update(canonicalizeJson({ rootFen: main[0]!.fen, uci: main.slice(1).map(node => node.moveUci) })).digest("hex")}`,
  };
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => record });
  const engine = new Map<string, ReviewProviderNodeState>();
  const context = { engine, shapes: [] as ShapeTriggerSource[] };
  const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId: path.at(-1)!.id });
  return { boundary, context, owner, path, setRun: (value: DrillRun) => { run = value; },
    deliver: (index: number, score: string) => {
      const delivery = routes.invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(path[index]!.fen, score) });
      engine.set(path[index]!.id, { kind: "delivered", delivery }); return delivery;
    } };
}
function drain(handle: RecordedReviewSourceCollection, count: number) {
  for (let index = 0; index < count; index++) {
    const progress = advanceRecordedReviewSourceCollection(handle);
    expect(progress.completedSubjects).toBe(index + 1); expect(progress.totalSubjects).toBe(count);
    expect(progress.complete).toBe(index + 1 === count);
  }
  return finishRecordedReviewSourceCollection(handle);
}
const image = (population: ReturnType<typeof collectRecordedReviewSourcePopulation>) => {
  const data = readRecordedReviewSourcePopulation(population);
  return { shapes: data.shapes, plan: data.plan, results: data.results.map(result => ({
    slot: result.slot, state: result.state, items: result.items.map(item => ({ projection: item.projection, payload: item.payload })),
  })) };
};

describe("cooperative original recorded Review source collection", () => {
  it.each(["white", "black"] as const)("matches complete synchronous original outputs with real engine and pending sources: %s", side => {
    const run = play(importedRun(`review-collection-${side}`, side), ["e2e4", "e7e5", "g1f3", "b8c6"]), f = fixture(run);
    f.deliver(0, "cp 20"); f.deliver(1, "cp -30");
    f.context.engine.set(f.path[2]!.id, { kind: "pending", jobCount: 2, retrying: 1 });
    f.context.engine.set(f.path[3]!.id, { kind: "not_yet_scheduled" });
    const expected = collectRecordedReviewSourcePopulation({ boundary: f.boundary, context: f.context });
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    const actual = drain(handle, f.path.length);
    expect(image(actual)).toEqual(image(expected));
    const data = readRecordedReviewSourcePopulation(actual);
    expect(data.plan).toHaveLength(f.path.length * 12 - 2);
    expect(data.results.filter(result => result.slot.adapterId === "review.source.eval_point@1").map(result => result.state.kind))
      .toEqual(["available", "available", "pending", "not_yet_scheduled", "not_requested"]);
    expect(() => advanceRecordedReviewSourceCollection(handle)).toThrow(/retired/);
    expect(() => finishRecordedReviewSourceCollection(handle)).toThrow(/retired/);
  });

  it.each([false, true])("preserves inherited branch slots and original canonical source order: black=%s", black => {
    const original = recordedComparisonFixture(black), f = fixture(original.run, original.peer);
    const expected = collectRecordedReviewSourcePopulation({ boundary: f.boundary, context: f.context });
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    expect(image(drain(handle, f.path.length))).toEqual(image(expected));
  });

  it.each([1, 2, 32])("keeps complete original source bytes across real scheduling gaps at page size %s", async limit => {
    const moves = ["g1f3", "g8f6", "f3g1", "f6g8",
      "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6",
      "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8",
      "h2h3", "c6b8", "d2d4", "b8d7", "b1d2", "c7c5", "d4d5", "d8c7",
      "d2f1", "f8e8", "f1g3", "g7g6", "a2a4", "b5b4", "c3b4", "c5b4"];
    const f = fixture(play(importedRun(`review-source-pages-${limit}`), moves));
    f.context.shapes.push({ id: "original-knight-square", trigger: { kind: "pieceOnSquare", square: "f3", piece: { color: "white", role: "knight" } } });
    const expected = image(collectRecordedReviewSourcePopulation({ boundary: f.boundary, context: f.context }));
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    const seen: string[] = [];
    for (let start = 0; start < f.path.length; start += limit) {
      for (let index = start; index < Math.min(start + limit, f.path.length); index++) {
        seen.push(advanceRecordedReviewSourceCollection(handle).nodeId);
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
      if (seen.length < f.path.length) expect(() => finishRecordedReviewSourceCollection(handle)).toThrow(/incomplete/);
    }
    expect(seen).toEqual(f.path.map(node => node.id));
    const actual = image(finishRecordedReviewSourceCollection(handle));
    expect(actual).toEqual(expected);
    expect(actual.results.some(result => result.slot.adapterId === "review.source.shapes@1" && result.items.length > 0)).toBe(true);
  });

  it("begin performs no source dispatch; interim progress is not a partial population", () => {
    const f = fixture(play(importedRun("review-no-interim-evidence"), ["e2e4", "e7e5"]));
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
      expect(dispatch).not.toHaveBeenCalled();
      expect(() => finishRecordedReviewSourceCollection(handle)).toThrow(/incomplete/);
      const progress = advanceRecordedReviewSourceCollection(handle);
      expect(progress).toEqual({ nodeId: f.path[0]!.id, completedSubjects: 1, totalSubjects: 3, complete: false });
      expect(Object.keys(progress).sort()).toEqual(["complete", "completedSubjects", "nodeId", "totalSubjects"]);
      expect(() => readRecordedReviewSourcePopulation(handle as never)).toThrow(/not issued/);
      expect(() => finishRecordedReviewSourceCollection(handle)).toThrow(/incomplete/);
      expect(dispatch).toHaveBeenCalled();
      advanceRecordedReviewSourceCollection(handle); advanceRecordedReviewSourceCollection(handle);
      const calls = dispatch.mock.calls.length;
      const population = finishRecordedReviewSourceCollection(handle);
      readRecordedReviewSourcePopulation(population); readRecordedReviewSourcePopulation(population);
      expect(dispatch).toHaveBeenCalledTimes(calls);
    } finally { dispatch.mockRestore(); }
  });

  it.each([0, 1])("cancellation retires unstarted/partial original work without a population: steps=%s", steps => {
    const f = fixture(play(importedRun(`review-cancel-${steps}`), ["e2e4", "e7e5"]));
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    for (let index = 0; index < steps; index++) advanceRecordedReviewSourceCollection(handle);
    expect(cancelRecordedReviewSourceCollection(handle)).toBe(true);
    expect(cancelRecordedReviewSourceCollection(handle)).toBe(false);
    expect(() => advanceRecordedReviewSourceCollection(handle)).toThrow(/retired/);
    expect(() => finishRecordedReviewSourceCollection(handle)).toThrow(/retired/);
  });

  it("failure of an actual source retires the partial handle", () => {
    const f = fixture(play(importedRun("review-source-failure"), ["e2e4"]));
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(() => { throw new TypeError("injected real dispatch failure"); });
    try { expect(() => advanceRecordedReviewSourceCollection(handle)).toThrow(/injected real dispatch/); }
    finally { dispatch.mockRestore(); }
    expect(() => finishRecordedReviewSourceCollection(handle)).toThrow(/retired/);
    expect(cancelRecordedReviewSourceCollection(handle)).toBe(false);
  });

  it("a copied original factory result cannot enter the cooperative population", () => {
    const f = fixture(importedRun("review-copied-result"));
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    const original = routes.invokeEvidenceValueRoute;
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      const result = original(ref as never, input as never);
      return ref === "run.record.consequence@1" ? [...result as readonly unknown[]] : result;
    }) as typeof original);
    try { expect(() => advanceRecordedReviewSourceCollection(handle)).toThrow(/original|invocation/); }
    finally { dispatch.mockRestore(); }
    expect(cancelRecordedReviewSourceCollection(handle)).toBe(false);
  });

  it("actual storage mutation retires a pending collection before more source calls", () => {
    const initial = play(importedRun("review-mutation"), ["e2e4", "e7e5"]), f = fixture(initial);
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    advanceRecordedReviewSourceCollection(handle);
    f.setRun(rewind(initial, f.path[0]!.id, REVIEW_AT).run);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      expect(() => advanceRecordedReviewSourceCollection(handle)).toThrow(/no longer/);
      expect(dispatch).not.toHaveBeenCalled();
    } finally { dispatch.mockRestore(); }
    expect(cancelRecordedReviewSourceCollection(handle)).toBe(false);
  });

  it("finalization revalidates storage and retires failure instead of publishing stale originals", () => {
    const initial = importedRun("review-final-stale"), f = fixture(initial);
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    advanceRecordedReviewSourceCollection(handle);
    f.setRun(attachEvidence(initial, f.path[0]!.id, ["changed"], { kind: "eval", source: "engine_validated", values: {} }, REVIEW_AT).run);
    expect(() => finishRecordedReviewSourceCollection(handle)).toThrow(/no longer/);
    expect(cancelRecordedReviewSourceCollection(handle)).toBe(false);
  });

  it("rejects a narrowed boundary before dispatch and refuses forged handles", () => {
    const initial = play(importedRun("review-narrow-work"), ["e2e4"]), f = fixture(initial);
    const narrow = f.owner.resolve({ runId: initial.id, branchId: initial.activeCursor.branchId, throughNodeId: f.path[0]!.id });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      expect(() => beginRecordedReviewSourceCollection({ boundary: narrow, context: f.context })).toThrow(/complete original branch/);
      expect(dispatch).not.toHaveBeenCalled();
    } finally { dispatch.mockRestore(); }
    expect(() => advanceRecordedReviewSourceCollection({} as RecordedReviewSourceCollection)).toThrow(/retired/);
    expect(cancelRecordedReviewSourceCollection({} as RecordedReviewSourceCollection)).toBe(false);
  });

  it("captures provider state once without retaining a caller-mutable map", () => {
    const f = fixture(play(importedRun("review-captured-state"), ["e2e4"]));
    const state = { kind: "pending" as const, jobCount: 1, retrying: 0 };
    f.context.engine.set(f.path[0]!.id, state);
    const handle = beginRecordedReviewSourceCollection({ boundary: f.boundary, context: f.context });
    state.jobCount = 99; f.context.engine.clear();
    const data = readRecordedReviewSourcePopulation(drain(handle, f.path.length));
    expect(data.results.find(result => result.slot.adapterId === "review.source.eval_point@1" && result.slot.nodeId === f.path[0]!.id)!.state)
      .toEqual({ kind: "pending", jobCount: 1, retrying: 0 });
  });
});
