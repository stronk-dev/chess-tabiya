// D4250: original PhaseArc source preparation, not a public job or latency clearance.
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as runtime from "@chess-tabiya/runtime";
import { evidenceDigest } from "../../../packages/runtime/src/evidence-contract.js";
import { createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { recordedComparisonFixture } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { importedRun, importRecord, play, REVIEW_AT } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { loadOpeningCatalogue } from "./opening-catalogue.js";
import {
  advanceRecordedPhaseArcCollection, assertPhaseArc, beginRecordedPhaseArcCollection,
  cancelRecordedPhaseArcCollection, compilePhaseArc, compileRecordedEvidenceSnapshot,
  finishRecordedPhaseArcCollection, type PhaseSourceDependencies, type RecordedPhaseArcCollection,
} from "./phase-source-composition.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { providerOperationDescriptors } from "./provider-operations.js";
import { syzygyBody } from "../../../packages/runtime/src/provider-test-fixtures.js";

const opening = await loadOpeningCatalogue(resolve(import.meta.dirname, "../artifacts/runtime-opening-catalogue.json"));
const dependencies: PhaseSourceDependencies = { opening, recorded: compileRecordedEvidenceSnapshot({ kind: "no_pack_source" }) };

function fixture(initial: runtime.DrillRun, branchId = initial.activeCursor.branchId, throughNodeId?: string) {
  let run = initial;
  const path = runtime.branchPath(run, branchId);
  const mainline = runtime.branchPath(initial, initial.branches[0]!.id);
  const record = initial.sessionKind === "imported" ? { ...importRecord(initial, "*"),
    movetextDigest: `sha256:${evidenceDigest({ rootFen: mainline[0]!.fen, uci: mainline.slice(1).map(node => node.moveUci) })}` } : undefined;
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run,
    loadImportRecord: () => record });
  const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId: throughNodeId ?? path.at(-1)!.id });
  const image = readRecordedReviewBoundary(boundary);
  return { boundary, image, path, setRun: (value: runtime.DrillRun) => { run = value; } };
}
function drain(handle: RecordedPhaseArcCollection, count: number) {
  expect(advanceRecordedPhaseArcCollection(handle)).toEqual({ stage: "path", nodeId: null, completedSubjects: 0, totalSubjects: count, complete: false });
  for (let index = 0; index < count; index++) expect(advanceRecordedPhaseArcCollection(handle))
    .toMatchObject({ completedSubjects: index + 1, totalSubjects: count, complete: index + 1 === count });
  return finishRecordedPhaseArcCollection(handle);
}

describe("original PhaseArc cooperative source collection", () => {
  it("keeps begin metadata-only and finish free of source reacquisition", () => {
    const f = fixture(play(importedRun("phase-arc-metadata"), ["e2e4", "e7e5"]));
    const collect = vi.spyOn(runtime, "recordedSemanticPath"), point = vi.spyOn(runtime, "invokeRunRecordPosition");
    try {
      const handle = beginRecordedPhaseArcCollection(f.boundary, dependencies);
      expect(collect).not.toHaveBeenCalled(); expect(point).not.toHaveBeenCalled();
      expect(() => assertPhaseArc(handle)).toThrow(/UNSEALED/);
      expect(() => finishRecordedPhaseArcCollection(handle)).toThrow(/incomplete/);
      expect(advanceRecordedPhaseArcCollection(handle)).toEqual({ stage: "path", nodeId: null, completedSubjects: 0, totalSubjects: f.path.length, complete: false });
      expect(collect).toHaveBeenCalledTimes(1); expect(point).not.toHaveBeenCalled();
      for (const [index, node] of f.path.entries()) expect(advanceRecordedPhaseArcCollection(handle)).toEqual({
        stage: "point", nodeId: node.id, completedSubjects: index + 1, totalSubjects: f.path.length, complete: index + 1 === f.path.length,
      });
      expect(collect).toHaveBeenCalledTimes(1); expect(point).toHaveBeenCalledTimes(f.path.length);
      const result = finishRecordedPhaseArcCollection(handle);
      if (result.kind !== "arc") throw new Error("expected complete arc");
      assertPhaseArc(result.arc);
      expect(collect).toHaveBeenCalledTimes(1); expect(point).toHaveBeenCalledTimes(f.path.length);
      expect(() => finishRecordedPhaseArcCollection(handle)).toThrow(/retired/);
    } finally { collect.mockRestore(); point.mockRestore(); }
  });

  it.each([false, true])("retains complete original inherited arc bytes: black=%s", black => {
    const original = recordedComparisonFixture(black), f = fixture(original.run, original.peer);
    const expected = compilePhaseArc(f.image.run, original.peer, dependencies);
    const actual = drain(beginRecordedPhaseArcCollection(f.boundary, dependencies), f.path.length);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
    if (actual.kind !== "arc") throw new Error("expected complete arc");
    expect(actual.arc.points.map(point => point.position.payload.nodeId)).toEqual(f.path.map(node => node.id));
  });

  it.each([1, 2, 32])("keeps a complete over32-node repeated path across real yields with groups=%s", async limit => {
    const moves = ["g1f3", "g8f6", "f3g1", "f6g8", "e2e4", "e7e5", "g1f3", "b8c6",
      "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6",
      "c2c3", "e8g8", "h2h3", "c6b8", "d2d4", "b8d7", "b1d2", "c7c5", "d4d5", "d8c7",
      "d2f1", "f8e8", "f1g3", "g7g6", "a2a4", "b5b4", "c3b4", "c5b4"];
    const f = fixture(play(importedRun(`phase-arc-long-${limit}`), moves));
    const expected = compilePhaseArc(f.image.run, f.image.request.branchId, dependencies);
    const handle = beginRecordedPhaseArcCollection(f.boundary, dependencies), seen: string[] = [];
    expect(advanceRecordedPhaseArcCollection(handle).stage).toBe("path");
    await new Promise<void>(done => setTimeout(done, 0));
    for (let start = 0; start < f.path.length; start += limit) {
      for (let index = start; index < Math.min(start + limit, f.path.length); index++) {
        seen.push(advanceRecordedPhaseArcCollection(handle).nodeId!);
        await new Promise<void>(done => setTimeout(done, 0));
      }
      if (seen.length !== f.path.length) expect(() => finishRecordedPhaseArcCollection(handle)).toThrow(/incomplete/);
    }
    expect(seen).toEqual(f.path.map(node => node.id)); expect(seen).toHaveLength(37);
    expect(JSON.stringify(finishRecordedPhaseArcCollection(handle))).toBe(JSON.stringify(expected));
  });

  it.each(["before", "path", "point", "finish"] as const)("refuses actual storage mutation at the %s boundary and retires work", stage => {
    const run = play(importedRun(`phase-arc-stale-${stage}`), ["e2e4"]), f = fixture(run);
    const handle = beginRecordedPhaseArcCollection(f.boundary, dependencies);
    const mutate = () => f.setRun(runtime.rewind(run, f.path[0]!.id, REVIEW_AT).run);
    const originalPath = runtime.recordedSemanticPath, originalPoint = runtime.phaseReadingEvidence;
    const path = vi.spyOn(runtime, "recordedSemanticPath").mockImplementation((...args) => {
      const result = originalPath(...args); if (stage === "path") mutate(); return result;
    });
    const point = vi.spyOn(runtime, "phaseReadingEvidence").mockImplementation((...args) => {
      const result = originalPoint(...args); if (stage === "point") mutate(); return result;
    });
    try {
      if (stage === "finish") {
        advanceRecordedPhaseArcCollection(handle);
        for (const _node of f.path) advanceRecordedPhaseArcCollection(handle);
        mutate(); expect(() => finishRecordedPhaseArcCollection(handle)).toThrow(/no longer/);
      } else {
        if (stage === "before") mutate();
        if (stage === "point") advanceRecordedPhaseArcCollection(handle);
        expect(() => advanceRecordedPhaseArcCollection(handle)).toThrow(/no longer/);
      }
      expect(cancelRecordedPhaseArcCollection(handle)).toBe(false);
    } finally { path.mockRestore(); point.mockRestore(); }
  });

  it("rejects a genuine semantic path from another original branch", () => {
    const original = recordedComparisonFixture(), f = fixture(original.run, original.peer);
    const handle = beginRecordedPhaseArcCollection(f.boundary, dependencies), collectOriginal = runtime.recordedSemanticPath;
    const collect = vi.spyOn(runtime, "recordedSemanticPath").mockImplementation(run => collectOriginal(run, original.main));
    try { expect(() => advanceRecordedPhaseArcCollection(handle)).toThrow(/another original branch/); }
    finally { collect.mockRestore(); }
    expect(cancelRecordedPhaseArcCollection(handle)).toBe(false);
  });

  it.each(["sync", "step"] as const)("rejects a genuine semantic refusal from a different branch: %s", mode => {
    const f = fixture(importedRun("phase-arc-refused")), original = runtime.recordedSemanticPath;
    const refusal = original(f.image.run, "missing-original-branch");
    const collect = vi.spyOn(runtime, "recordedSemanticPath").mockReturnValue(refusal);
    try {
      if (mode === "step") {
        const handle = beginRecordedPhaseArcCollection(f.boundary, dependencies);
        expect(() => advanceRecordedPhaseArcCollection(handle)).toThrow(/branch/);
        expect(cancelRecordedPhaseArcCollection(handle)).toBe(false);
      } else expect(() => compilePhaseArc(f.image.run, f.image.request.branchId, dependencies)).toThrow(/branch/);
    } finally { collect.mockRestore(); }
  });

  it.each([0, 1, 2])("cancels only the exact original work after %s steps", steps => {
    const f = fixture(play(importedRun(`phase-arc-cancel-${steps}`), ["e2e4"]));
    const handle = beginRecordedPhaseArcCollection(f.boundary, dependencies), other = beginRecordedPhaseArcCollection(f.boundary, dependencies);
    expect(() => advanceRecordedPhaseArcCollection({ ...handle })).toThrow(/retired/);
    for (let index = 0; index < steps; index++) advanceRecordedPhaseArcCollection(handle);
    expect(cancelRecordedPhaseArcCollection(handle)).toBe(true); expect(cancelRecordedPhaseArcCollection(handle)).toBe(false);
    expect(() => finishRecordedPhaseArcCollection(handle)).toThrow(/retired/);
    expect(drain(other, f.path.length).kind).toBe("arc");
  });

  it("refuses a cloned boundary or a deliberately shorter original prefix", () => {
    const run = play(importedRun("phase-arc-short"), ["e2e4", "e7e5"]), f = fixture(run);
    expect(() => beginRecordedPhaseArcCollection({ ...f.boundary }, dependencies)).toThrow(/not issued/);
    const shorter = fixture(run, run.activeCursor.branchId, f.path[1]!.id);
    expect(() => beginRecordedPhaseArcCollection(shorter.boundary, dependencies)).toThrow(/complete original/);
  });

  it("detaches mutable availability and live requests while retaining genuine local-domain identity", async () => {
    const f = fixture(importedRun("phase-arc-live")), root = f.path[0]!;
    const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }),
      maxActive: 1, maxQueued: 4, maxRetainedEntries: 8, maxRetainedWeight: 64, retentionTtlMs: 1_000,
      monotonicNowMs: () => performance.now(), wallNow: () => REVIEW_AT });
    const request = { rules: "chess" as const, variant: "standard" as const, fen: root.fen, timeoutMs: 1_000 };
    const result = await scheduler.get({ operation: "syzygy.position@1", request }, { id: "test", budgetMs: 5_000 }, new AbortController().signal);
    expect(result.kind).toBe("local_domain_result");
    const unavailable = { kind: "unavailable" as const, reason: "artifact_missing" as const };
    const live = new Map([[root.id, { request, result }]]), input = { ...dependencies, opening: unavailable, live };
    const expected = compilePhaseArc(f.image.run, f.image.request.branchId, input);
    const handle = beginRecordedPhaseArcCollection(f.boundary, input);
    request.fen = "invalid-after-capture"; live.clear();
    Object.assign(unavailable, { reason: "digest_mismatch" });
    const actual = drain(handle, 1);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
    if (actual.kind !== "arc" || actual.arc.points[0]!.tablebase.live.kind !== "local_domain_result") throw new Error("lost genuine local-domain result");
    expect(actual.arc.points[0]!.tablebase.live.result).toBe(result);
  });

  it.each(["success", "source_failure"] as const)("captures live %s wrappers without changing original provider authority", async kind => {
    const fen = "8/8/8/4k3/8/3PK3/8/1r2R3 w - - 0 1", f = fixture(importedRun(`phase-arc-live-${kind}`, "white", fen));
    const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null,
      tablebaseFetch: kind === "success" ? async () => new Response(JSON.stringify(syzygyBody(fen))) : null,
      explorerFetch: null, explorerToken: null }), maxActive: 1, maxQueued: 4, maxRetainedEntries: 8,
      maxRetainedWeight: 64, retentionTtlMs: 1_000, monotonicNowMs: () => performance.now(), wallNow: () => REVIEW_AT });
    const request = { rules: "chess" as const, variant: "standard" as const, fen, timeoutMs: 1_000 };
    const original = await scheduler.get({ operation: "syzygy.position@1", request }, { id: "test", budgetMs: 5_000 }, new AbortController().signal);
    expect(original.kind).toBe(kind);
    const result = { ...original }, live = new Map([[f.path[0]!.id, { request, result }]]), input = { ...dependencies, live };
    // Capture the synchronous oracle before mutating the caller's wrapper. Its live result is
    // the original object; retaining it here would mutate the expected answer as well.
    const expected = JSON.stringify(compilePhaseArc(f.image.run, f.image.request.branchId, input));
    const handle = beginRecordedPhaseArcCollection(f.boundary, input);
    request.fen = "invalid-after-capture"; live.clear();
    Object.assign(result, { normalizedRequestDigest: "changed-after-capture" });
    const actual = drain(handle, 1);
    expect(JSON.stringify(actual)).toBe(expected);
    if (original.kind === "success") {
      if (actual.kind !== "arc" || actual.arc.points[0]!.tablebase.live.kind !== "success") throw new Error("lost original provider delivery");
      expect(actual.arc.points[0]!.tablebase.live.result.delivery).toBe(original.delivery);
    }
  });
});
