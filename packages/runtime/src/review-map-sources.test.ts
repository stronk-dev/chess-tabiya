// D4250: full original sources and complete Review projection, not job/API/budget clearance.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { admitInstalledOpeningCatalogueText } from "./opening-catalogue.js";
import { readRecordedReviewBoundary } from "./recorded-review-boundary.js";
import { compileEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { reviewMapProjection, type ReviewMapInput } from "./review-map.js";
import {
  advanceReviewMapSourceCollection, beginReviewMapSourceCollection, cancelReviewMapSourceCollection,
  finishReviewMapSourceCollection, readPreparedReviewMapSources, reviewMapSequenceRoutes,
  type PreparedReviewMapSources,
} from "./review-map-sources.js";
import { recordedReviewFixtureSources } from "./testing/recorded-grade-fixture.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import { importedRun, play, REVIEW_AT } from "./testing/review-evidence-fixture.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES } from "./testing/recorded-sequence-fixtures.js";
import { storyMomentsForRun } from "./story.js";
import { branchPath } from "./branch-path.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import { rewind } from "./runtime.js";
import type { DrillRun } from "./types.js";
import * as sequences from "./recorded-sequence-window.js";
import * as openingHistory from "./recorded-opening-history.js";
import * as localEdges from "./postcommit-nudge.js";
import * as routes from "./internal/evidence-value-routes.js";

const opening = await admitInstalledOpeningCatalogueText(readFileSync(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8"));
if (opening.kind !== "available") throw new Error("expected the real installed opening source");
const sequenceRoutes = reviewMapSequenceRoutes(compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 }));

function fixture(run: DrillRun, branchId = run.activeCursor.branchId, withOpening = false) {
  const sources = recordedReviewFixtureSources(run, branchId), boundary = sources.recordedObjectives.boundary;
  const input: ReviewMapInput = { run, branchId, story: storyMomentsForRun(run, branchId), ...sources,
    context: run.sessionKind === "imported" ? "imported_analysis" : "review", viewer: { role: "learner", session: run.sessionKind },
    ...(withOpening ? { opening } : {}) };
  return { run, input, boundary, image: readRecordedReviewBoundary(boundary), path: branchPath(run, branchId) };
}
function prepare(f: ReturnType<typeof fixture>): PreparedReviewMapSources {
  const handle = beginReviewMapSourceCollection(f.boundary, f.input.opening);
  expect(advanceReviewMapSourceCollection(handle)).toEqual({ stage: "windows", nodeId: null, completedSubjects: 0, totalSubjects: f.path.length, complete: false });
  for (const [index, node] of f.path.entries()) expect(advanceReviewMapSourceCollection(handle)).toEqual({
    stage: "relations", nodeId: node.id, completedSubjects: index + 1, totalSubjects: f.path.length, complete: false,
  });
  expect(() => finishReviewMapSourceCollection(handle)).toThrow(/incomplete/);
  expect(advanceReviewMapSourceCollection(handle)).toEqual({ stage: "opening", nodeId: null, completedSubjects: f.path.length, totalSubjects: f.path.length, complete: true });
  return finishReviewMapSourceCollection(handle);
}

function mutableBoundaryFixture() {
  const initial = recordedComparisonFixture().run;
  let run = initial;
  const branchId = run.activeCursor.branchId, path = branchPath(run, branchId);
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
  const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId: path.at(-1)!.id });
  return { boundary, path, image: readRecordedReviewBoundary(boundary),
    mutate: () => { run = rewind(initial, path[0]!.id, REVIEW_AT).run; } };
}

describe("original Review Map source preparation", () => {
  it("D4263 retires genuine nested work returned after its Map owner is cancelled", () => {
    const f = mutableBoundaryFixture(), handle = beginReviewMapSourceCollection(f.boundary), original = sequences.beginRecordedSemanticBranchWindows;
    let nested: ReturnType<typeof original> | undefined;
    const begin = vi.spyOn(sequences, "beginRecordedSemanticBranchWindows").mockImplementation((...args) => {
      nested = original(...args); cancelReviewMapSourceCollection(handle); return nested;
    });
    try {
      let state = "progress";
      try { advanceReviewMapSourceCollection(handle); } catch { state = "refused"; }
      expect(nested).toBeDefined();
      const stillActive = sequences.cancelRecordedSemanticBranchWindows(nested!);
      expect({ state, stillActive }).toEqual({ state: "refused", stillActive: false });
      expect(cancelReviewMapSourceCollection(handle)).toBe(false);
    } finally { begin.mockRestore(); if (nested !== undefined) sequences.cancelRecordedSemanticBranchWindows(nested); }
  });

  it.each(["relations", "opening", "finish"] as const)("D4263 refuses publication after cancellation inside %s", stage => {
    const f = mutableBoundaryFixture(), handle = beginReviewMapSourceCollection(f.boundary, opening);
    advanceReviewMapSourceCollection(handle); advanceReviewMapSourceCollection(handle); // scope metadata, root
    if (stage !== "relations") for (let i = 1; i < f.path.length; i++) advanceReviewMapSourceCollection(handle);
    if (stage === "finish") advanceReviewMapSourceCollection(handle);
    const originalEdge = localEdges.collectPostcommitEdge, originalOpening = openingHistory.collectRecordedOpeningHistory;
    const originalFinish = sequences.finishRecordedSemanticBranchWindows;
    const edge = vi.spyOn(localEdges, "collectPostcommitEdge").mockImplementation((...args) => {
      const result = originalEdge(...args); if (stage === "relations") cancelReviewMapSourceCollection(handle); return result;
    });
    const history = vi.spyOn(openingHistory, "collectRecordedOpeningHistory").mockImplementation((...args) => {
      const result = originalOpening(...args); if (stage === "opening") cancelReviewMapSourceCollection(handle); return result;
    });
    const finish = vi.spyOn(sequences, "finishRecordedSemanticBranchWindows").mockImplementation((...args) => {
      const result = originalFinish(...args); if (stage === "finish") cancelReviewMapSourceCollection(handle); return result;
    });
    try {
      expect(() => stage === "finish" ? finishReviewMapSourceCollection(handle) : advanceReviewMapSourceCollection(handle)).toThrow(/retired/);
      expect(cancelReviewMapSourceCollection(handle)).toBe(false);
    } finally { edge.mockRestore(); history.mockRestore(); finish.mockRestore(); }
  });

  it("keeps begin metadata-only and complete assembly free from relation/opening recollection", () => {
    const f = fixture(play(importedRun("review-source-stages"), ["e2e4", "e7e5", "g1f3", "b8c6"]), undefined, true);
    const expected = JSON.stringify(reviewMapProjection(f.input));
    const windows = vi.spyOn(sequences, "beginRecordedSemanticBranchWindows"), step = vi.spyOn(sequences, "advanceRecordedSemanticBranchWindows");
    const eager = vi.spyOn(sequences, "prepareRecordedSemanticBranchWindows").mockImplementation(() => { throw new Error("Eager full-branch window acquisition"); });
    const edge = vi.spyOn(localEdges, "collectPostcommitEdge");
    const history = vi.spyOn(openingHistory, "collectRecordedOpeningHistory"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const handle = beginReviewMapSourceCollection(f.boundary, opening);
      expect(windows).not.toHaveBeenCalled(); expect(edge).not.toHaveBeenCalled(); expect(history).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
      expect(() => finishReviewMapSourceCollection(handle)).toThrow(/incomplete/);
      expect(() => reviewMapProjection({ ...f.input, preparedSources: handle as unknown as PreparedReviewMapSources })).toThrow(/not complete original/);
      advanceReviewMapSourceCollection(handle);
      expect(windows).toHaveBeenCalledTimes(1); expect(edge).not.toHaveBeenCalled(); expect(history).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled(); expect(step).not.toHaveBeenCalled();
      for (const _node of f.path) advanceReviewMapSourceCollection(handle);
      expect(edge).toHaveBeenCalledTimes(f.path.length - 1); expect(history).not.toHaveBeenCalled();
      expect(step.mock.results.map(result => result.value.nodeId)).toEqual(f.path.slice(1).map(node => node.id));
      expect(() => finishReviewMapSourceCollection(handle)).toThrow(/incomplete/);
      advanceReviewMapSourceCollection(handle);
      expect(history).toHaveBeenCalledTimes(1);
      const beforeFinish = dispatch.mock.calls.length, sources = finishReviewMapSourceCollection(handle);
      expect(dispatch).toHaveBeenCalledTimes(beforeFinish);
      const data = readPreparedReviewMapSources(sources, f.image, sequenceRoutes, opening);
      expect(Object.isFrozen(data)).toBe(true); expect(Object.isFrozen(data.recorded!.events)).toBe(true);
      expect(data.recorded!.events.every(Object.isFrozen)).toBe(true);
      const actual = reviewMapProjection({ ...f.input, preparedSources: sources });
      expect(JSON.stringify(actual)).toBe(expected);
      expect(windows).toHaveBeenCalledTimes(1); expect(edge).toHaveBeenCalledTimes(f.path.length - 1); expect(history).toHaveBeenCalledTimes(1);
      expect(eager).not.toHaveBeenCalled();
      expect(dispatch.mock.calls.slice(beforeFinish).every(([ref]) => ref === "derived.grade.move_quality@2")).toBe(true);
      expect(() => finishReviewMapSourceCollection(handle)).toThrow(/retired/);
    } finally { windows.mockRestore(); step.mockRestore(); eager.mockRestore(); edge.mockRestore(); history.mockRestore(); dispatch.mockRestore(); }
  });

  it.each([false, true])("preserves the complete inherited/mirrored Review Map: black=%s", black => {
    const original = recordedComparisonFixture(black), f = fixture(original.run, original.peer, true);
    const expected = JSON.stringify(reviewMapProjection(f.input));
    expect(JSON.stringify(reviewMapProjection({ ...f.input, preparedSources: prepare(f) }))).toBe(expected);
  });

  it.each(RECORDED_SEQUENCE_POSITIVES)("retains actual $projection positive occurrences", value => {
    const f = fixture(play(importedRun(`review-source-positive-${value.projection}`, "white", value.fen), value.moves));
    const sources = prepare(f), data = readPreparedReviewMapSources(sources, f.image, sequenceRoutes, undefined);
    const events = data.recorded!.events.filter(event => event.evidence.projection.id === value.projection);
    expect(events.length).toBeGreaterThan(0);
    expect(events.every(event => f.path.some(node => node.id === event.nodeId))).toBe(true);
    expect(JSON.stringify(reviewMapProjection({ ...f.input, preparedSources: sources }))).toBe(JSON.stringify(reviewMapProjection(f.input)));
  });

  it.each(RECORDED_SEQUENCE_HARD_NEGATIVES)("retains actual $projection hard-negative absence", value => {
    const f = fixture(play(importedRun(`review-source-negative-${value.projection}`, "white", value.fen), value.moves));
    const data = readPreparedReviewMapSources(prepare(f), f.image, sequenceRoutes, undefined);
    expect(data.recorded!.events.filter(event => event.nodeId === f.path.at(-1)!.id && event.evidence.projection.id === value.projection)).toEqual([]);
  });

  it.each([1, 2, 32])("retains a full over32-node Map across real-yield groups=%s", async limit => {
    const moves = ["g1f3", "g8f6", "f3g1", "f6g8", "e2e4", "e7e5", "g1f3", "b8c6",
      "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6",
      "c2c3", "e8g8", "h2h3", "c6b8", "d2d4", "b8d7", "b1d2", "c7c5", "d4d5", "d8c7",
      "d2f1", "f8e8", "f1g3", "g7g6", "a2a4", "b5b4", "c3b4", "c5b4"];
    const f = fixture(play(importedRun(`review-source-long-${limit}`), moves), undefined, true);
    const expected = JSON.stringify(reviewMapProjection(f.input)), seen: string[] = [];
    const handle = beginReviewMapSourceCollection(f.boundary, opening);
    advanceReviewMapSourceCollection(handle); await new Promise<void>(done => setTimeout(done, 0));
    for (let start = 0; start < f.path.length; start += limit) {
      for (let index = start; index < Math.min(start + limit, f.path.length); index++) {
        seen.push(advanceReviewMapSourceCollection(handle).nodeId!);
        await new Promise<void>(done => setTimeout(done, 0));
      }
      expect(() => finishReviewMapSourceCollection(handle)).toThrow(/incomplete/);
    }
    advanceReviewMapSourceCollection(handle);
    const sources = finishReviewMapSourceCollection(handle);
    expect(seen).toEqual(f.path.map(node => node.id)); expect(seen).toHaveLength(37);
    expect(JSON.stringify(reviewMapProjection({ ...f.input, preparedSources: sources }))).toBe(expected);
  });

  it("preserves root-only genuine emptiness and the original opening result", () => {
    const f = fixture(importedRun("review-source-root"), undefined, true), sources = prepare(f);
    const data = readPreparedReviewMapSources(sources, f.image, sequenceRoutes, opening);
    expect(data.recorded).toBeUndefined(); expect(data.openingEvents).toEqual([]);
    expect(reviewMapProjection({ ...f.input, preparedSources: sources })).toEqual(reviewMapProjection(f.input));
  });

  it("rejects forged work, other genuine boundaries and changed opening context", () => {
    const original = recordedComparisonFixture(), f = fixture(original.run, original.peer, true), sources = prepare(f);
    const other = fixture(structuredClone(original.run), original.peer, true);
    expect(() => reviewMapProjection({ ...other.input, preparedSources: sources })).toThrow(/original boundary/);
    const { opening: _opening, ...withoutOpening } = f.input;
    expect(() => reviewMapProjection({ ...withoutOpening, preparedSources: sources })).toThrow(/opening authority/);
    expect(() => reviewMapProjection({ ...f.input, preparedSources: { ...sources } })).toThrow(/not complete original/);
    const handle = beginReviewMapSourceCollection(f.boundary, opening);
    expect(() => advanceReviewMapSourceCollection({ ...handle })).toThrow(/retired/);
    expect(cancelReviewMapSourceCollection(handle)).toBe(true);
  });

  it.each([0, 1, 2])("cancels only the exact original work after %s advances", advances => {
    const f = fixture(play(importedRun(`review-source-cancel-${advances}`), ["e2e4"]));
    const begin = vi.spyOn(sequences, "beginRecordedSemanticBranchWindows");
    const handle = beginReviewMapSourceCollection(f.boundary), other = beginReviewMapSourceCollection(f.boundary);
    try {
      for (let index = 0; index < advances; index++) advanceReviewMapSourceCollection(handle);
      expect(cancelReviewMapSourceCollection(handle)).toBe(true); expect(cancelReviewMapSourceCollection(handle)).toBe(false);
      expect(() => finishReviewMapSourceCollection(handle)).toThrow(/retired/);
      if (advances > 0) expect(sequences.cancelRecordedSemanticBranchWindows(begin.mock.results[0]!.value)).toBe(false);
      for (let index = 0; index < f.path.length + 2; index++) advanceReviewMapSourceCollection(other);
      expect(() => readPreparedReviewMapSources(finishReviewMapSourceCollection(other), f.image, sequenceRoutes, undefined)).not.toThrow();
      expect(sequences.cancelRecordedSemanticBranchWindows(begin.mock.results.at(-1)!.value)).toBe(false);
    } finally { begin.mockRestore(); }
  });

  it("retires the nested window owner on mutation during actual endpoint acquisition", () => {
    const f = mutableBoundaryFixture(), handle = beginReviewMapSourceCollection(f.boundary);
    const begin = vi.spyOn(sequences, "beginRecordedSemanticBranchWindows"), original = sequences.advanceRecordedSemanticBranchWindows;
    const step = vi.spyOn(sequences, "advanceRecordedSemanticBranchWindows").mockImplementation((...args) => {
      const result = original(...args); f.mutate(); return result;
    });
    try {
      advanceReviewMapSourceCollection(handle); advanceReviewMapSourceCollection(handle); // metadata, then root
      expect(() => advanceReviewMapSourceCollection(handle)).toThrow(/no longer/);
      expect(cancelReviewMapSourceCollection(handle)).toBe(false);
      expect(sequences.cancelRecordedSemanticBranchWindows(begin.mock.results[0]!.value)).toBe(false);
    } finally { begin.mockRestore(); step.mockRestore(); }
  });

  it.each(["node", "completed", "total", "complete"] as const)("refuses crossed original window progress: %s", fault => {
    const f = fixture(play(importedRun(`review-window-progress-${fault}`), ["e2e4", "e7e5"]));
    const handle = beginReviewMapSourceCollection(f.boundary), original = sequences.advanceRecordedSemanticBranchWindows;
    const step = vi.spyOn(sequences, "advanceRecordedSemanticBranchWindows").mockImplementation((...args) => {
      const result = original(...args);
      return { ...result, ...(fault === "node" ? { nodeId: f.path[0]!.id } : fault === "completed" ? { completedSubjects: 2 }
        : fault === "total" ? { totalSubjects: 1 } : { complete: true }) };
    });
    try {
      advanceReviewMapSourceCollection(handle); advanceReviewMapSourceCollection(handle);
      expect(() => advanceReviewMapSourceCollection(handle)).toThrow(/original endpoint/);
      expect(cancelReviewMapSourceCollection(handle)).toBe(false);
      expect(sequences.cancelRecordedSemanticBranchWindows(step.mock.calls[0]![0])).toBe(false);
    } finally { step.mockRestore(); }
  });

  it.each(["windows", "relations", "opening", "finish"] as const)("rechecks actual storage at the %s boundary", stage => {
    const f = mutableBoundaryFixture(), handle = beginReviewMapSourceCollection(f.boundary, opening);
    if (stage !== "windows") advanceReviewMapSourceCollection(handle);
    if (stage === "opening" || stage === "finish") for (const _node of f.path) advanceReviewMapSourceCollection(handle);
    if (stage === "finish") advanceReviewMapSourceCollection(handle);
    f.mutate();
    expect(() => stage === "finish" ? finishReviewMapSourceCollection(handle) : advanceReviewMapSourceCollection(handle)).toThrow(/no longer/);
    expect(cancelReviewMapSourceCollection(handle)).toBe(false);
  });

  it.each(["windows", "relations", "opening"] as const)("rejects storage mutation during the actual %s acquisition", stage => {
    const f = mutableBoundaryFixture(), handle = beginReviewMapSourceCollection(f.boundary, opening);
    if (stage !== "windows") advanceReviewMapSourceCollection(handle);
    if (stage === "relations") advanceReviewMapSourceCollection(handle); // root has no incoming edge
    if (stage === "opening") for (const _node of f.path) advanceReviewMapSourceCollection(handle);
    const originalWindows = sequences.beginRecordedSemanticBranchWindows, originalEdge = localEdges.collectPostcommitEdge;
    const originalOpening = openingHistory.collectRecordedOpeningHistory;
    const windows = vi.spyOn(sequences, "beginRecordedSemanticBranchWindows").mockImplementation((...args) => {
      const result = originalWindows(...args); if (stage === "windows") f.mutate(); return result;
    });
    const edge = vi.spyOn(localEdges, "collectPostcommitEdge").mockImplementation((...args) => {
      const result = originalEdge(...args); if (stage === "relations") f.mutate(); return result;
    });
    const history = vi.spyOn(openingHistory, "collectRecordedOpeningHistory").mockImplementation((...args) => {
      const result = originalOpening(...args); if (stage === "opening") f.mutate(); return result;
    });
    try {
      expect(() => advanceReviewMapSourceCollection(handle)).toThrow(/no longer/);
      expect(cancelReviewMapSourceCollection(handle)).toBe(false);
      expect(() => finishReviewMapSourceCollection(handle)).toThrow(/retired/);
      if (stage === "windows") expect(sequences.cancelRecordedSemanticBranchWindows(windows.mock.results[0]!.value)).toBe(false);
    } finally { windows.mockRestore(); edge.mockRestore(); history.mockRestore(); }
  });

  it("retained complete frames recheck storage without recollecting any source", () => {
    const f = mutableBoundaryFixture(), handle = beginReviewMapSourceCollection(f.boundary, opening);
    for (let index = 0; index < f.path.length + 2; index++) advanceReviewMapSourceCollection(handle);
    const sources = finishReviewMapSourceCollection(handle);
    f.mutate();
    const windows = vi.spyOn(sequences, "prepareRecordedSemanticBranchWindows"), edge = vi.spyOn(localEdges, "collectPostcommitEdge");
    const history = vi.spyOn(openingHistory, "collectRecordedOpeningHistory");
    try {
      expect(() => readPreparedReviewMapSources(sources, f.image, sequenceRoutes, opening)).toThrow(/no longer/);
      expect(windows).not.toHaveBeenCalled(); expect(edge).not.toHaveBeenCalled(); expect(history).not.toHaveBeenCalled();
    } finally { windows.mockRestore(); edge.mockRestore(); history.mockRestore(); }
  });

  it("captures the opening wrapper without changing the installed source authority", () => {
    const f = fixture(play(importedRun("review-source-opening-capture"), ["e2e4"]), undefined, true);
    const expected = JSON.stringify(reviewMapProjection(f.input)), mutable = { ...opening };
    const handle = beginReviewMapSourceCollection(f.boundary, mutable);
    Object.assign(mutable, { kind: "unavailable", reason: "artifact_missing" });
    for (let index = 0; index < f.path.length + 2; index++) advanceReviewMapSourceCollection(handle);
    const sources = finishReviewMapSourceCollection(handle);
    expect(readPreparedReviewMapSources(sources, f.image, sequenceRoutes, opening).opening!.kind).toBe("available");
    expect(JSON.stringify(reviewMapProjection({ ...f.input, preparedSources: sources }))).toBe(expected);
  });

  it("retires actual source failures instead of publishing an empty complete frame", () => {
    const f = mutableBoundaryFixture(), handle = beginReviewMapSourceCollection(f.boundary, opening);
    advanceReviewMapSourceCollection(handle); advanceReviewMapSourceCollection(handle);
    const edge = vi.spyOn(localEdges, "collectPostcommitEdge").mockImplementation(() => { throw new TypeError("actual relation source failure"); });
    try { expect(() => advanceReviewMapSourceCollection(handle)).toThrow(/actual relation source failure/); }
    finally { edge.mockRestore(); }
    expect(cancelReviewMapSourceCollection(handle)).toBe(false);
    expect(() => finishReviewMapSourceCollection(handle)).toThrow(/retired/);
  });
});
