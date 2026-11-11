import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { moduleReviewPrefixPage, planModuleReviewPrefix, type ModuleReviewCursor } from "./module-review-prefix.js";
import { createRecordedReviewBoundarySourceOwner, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import { commitMove, fork, rewind } from "./runtime.js";
import * as structure from "./structure.js";
import * as semanticPath from "./recorded-semantic-path.js";
import { importedRun, play, REVIEW_AT } from "./testing/review-evidence-fixture.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import type { DrillRun } from "./types.js";

function source(initial: DrillRun, branchId = initial.activeCursor.branchId) {
  let run = initial;
  const mainline = branchPath(initial, initial.branches[0]!.id);
  const record = initial.sessionKind !== "imported" ? undefined : {
    runId: initial.id, result: "*" as const,
    movetextDigest: `sha256:${createHash("sha256").update(canonicalizeJson({
      rootFen: mainline[0]!.fen, uci: mainline.slice(1).map(node => node.moveUci),
    })).digest("hex")}`,
  };
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => record });
  const path = branchPath(run, branchId);
  return { owner, path, setRun: (next: DrillRun) => { run = next; },
    boundary: owner.resolve({ runId: run.id, branchId, throughNodeId: path.at(-1)!.id }) };
}

describe("whole-prefix module Review metadata planning", () => {
  it("plans a real root without invoking semantic collectors or modifying storage", () => {
    const run = importedRun("review-plan-root"), before = JSON.stringify(run);
    const collector = vi.spyOn(structure, "structuralReading");
    const semantic = vi.spyOn(semanticPath, "recordedSemanticPath");
    try {
      const plan = planModuleReviewPrefix(source(run).boundary);
      expect(plan.subjects).toHaveLength(1);
      expect(plan.subjects[0]!.fromNodeId).toBeNull();
      expect(plan.subjects[0]!.creationEventSeq).toBe(run.events[0]!.seq);
      expect(moduleReviewPrefixPage(plan, undefined, 32)).toEqual({ subjects: plan.subjects, nextCursor: null, complete: true });
      expect(collector).not.toHaveBeenCalled(); expect(semantic).not.toHaveBeenCalled();
      expect(JSON.stringify(run)).toBe(before);
    } finally { collector.mockRestore(); semantic.mockRestore(); }
  });

  it.each([false, true])("preserves inherited node identity and actual nonconsecutive creation sequences: black=%s", black => {
    const fixture = recordedComparisonFixture(black), stored = source(fixture.run, fixture.peer);
    const plan = planModuleReviewPrefix(stored.boundary);
    expect(plan.subjects.map(subject => subject.nodeId)).toEqual(fixture.peerPath.map(node => node.id));
    for (const [index, subject] of plan.subjects.entries()) {
      const node = fixture.peerPath[index]!;
      const event = fixture.run.events.find(event => event.type === "run.started"
        ? event.data.rootNode.id === node.id : event.type === "move.committed" && event.data.node.id === node.id)!;
      expect(subject).toEqual({ id: JSON.stringify([fixture.peer, node.id, event.seq]), nodeId: node.id,
        fromNodeId: index === 0 ? null : fixture.peerPath[index - 1]!.id,
        sourceBranchId: node.branchId, creationEventSeq: event.seq,
        cursor: { afterEventSeq: event.seq, afterBranchId: fixture.peer, afterNodeId: node.id } });
    }
    expect(plan.subjects.some(subject => subject.sourceBranchId !== fixture.peer)).toBe(true);
    expect(plan.subjects.at(-1)!.creationEventSeq).toBeGreaterThan(plan.subjects.length);
    expect(plan.eventHeadSeq).toBe(fixture.run.events.at(-1)!.seq);
  });

  it("independently reproduces the exact prefix digest without job identity or focus", () => {
    const fixture = recordedComparisonFixture(), stored = source(fixture.run, fixture.main);
    const plan = planModuleReviewPrefix(stored.boundary);
    const orderedSubjectIds = fixture.mainPath.map(node => {
      const event = fixture.run.events.find(event => event.type === "run.started"
        ? event.data.rootNode.id === node.id : event.type === "move.committed" && event.data.node.id === node.id)!;
      return JSON.stringify([fixture.main, node.id, event.seq]);
    });
    const bytes = canonicalizeJson({ runId: fixture.run.id, eventHeadSeq: fixture.run.events.at(-1)!.seq, orderedSubjectIds });
    expect(plan.prefixDigest).toBe(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);
    expect(planModuleReviewPrefix(stored.boundary)).toEqual(plan);
    expect(Object.isFrozen(plan)).toBe(true); expect(Object.isFrozen(plan.subjects[0]!.cursor)).toBe(true);
  });

  it.each([1, 2, 32])("covers an over32-entry recorded path exactly once at limit=%s", limit => {
    // One repeated position, then a legal Ruy Lopez line; threefold is a real terminal
    // boundary and must not be bypassed merely to manufacture a long fixture.
    const moves = ["g1f3", "g8f6", "f3g1", "f6g8",
      "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6",
      "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8",
      "h2h3", "c6b8", "d2d4", "b8d7", "b1d2", "c7c5", "d4d5", "d8c7",
      "d2f1", "f8e8", "f1g3", "g7g6", "a2a4", "b5b4", "c3b4", "c5b4"];
    const run = play(importedRun("review-long-repeated"), moves), stored = source(run);
    const plan = planModuleReviewPrefix(stored.boundary), seen: string[] = [];
    let cursor: ModuleReviewCursor | undefined;
    for (let pageIndex = 0; pageIndex < plan.subjects.length; pageIndex++) {
      const page = moduleReviewPrefixPage(plan, cursor, limit);
      expect(page.subjects.length).toBeGreaterThan(0); expect(page.subjects.length).toBeLessThanOrEqual(limit);
      seen.push(...page.subjects.map(subject => subject.nodeId));
      if (page.complete) { expect(page.nextCursor).toBeNull(); break; }
      cursor = page.nextCursor!;
    }
    expect(seen).toEqual(stored.path.map(node => node.id)); expect(new Set(seen).size).toBe(37);
    expect(new Set(plan.orderedSubjectIds).size).toBe(37);
    expect(stored.path[0]!.fen.split(" ").slice(0, 4)).toEqual(stored.path[4]!.fen.split(" ").slice(0, 4));
  });

  it("refuses a genuine narrowed boundary and a forged boundary", () => {
    const run = play(importedRun("review-narrow"), ["e2e4", "e7e5"]), stored = source(run);
    const narrow = stored.owner.resolve({ runId: run.id, branchId: run.activeCursor.branchId, throughNodeId: stored.path[1]!.id });
    expect(() => planModuleReviewPrefix(narrow)).toThrow(/complete original branch/);
    expect(() => planModuleReviewPrefix({} as RecordedReviewBoundary)).toThrow(/source owner/);
  });

  it("does not merge equal full FENs recorded at distinct branch nodes", () => {
    let run = play(importedRun("review-equal-fen"), ["e2e4", "e7e5", "g1f3"]);
    const main = run.activeCursor.branchId, mainPath = branchPath(run, main);
    run = fork(rewind(run, mainPath[1]!.id, REVIEW_AT).run, mainPath[1]!.id, { at: REVIEW_AT }).run;
    run = play(run, ["e7e5", "g1f3"]);
    const other = run.activeCursor.branchId, otherPath = branchPath(run, other);
    expect(otherPath.at(-1)!.fen).toBe(mainPath.at(-1)!.fen);
    expect(otherPath.at(-1)!.id).not.toBe(mainPath.at(-1)!.id);
    const left = planModuleReviewPrefix(source(run, main).boundary);
    const right = planModuleReviewPrefix(source(run, other).boundary);
    expect(left.subjects.at(-1)!.id).not.toBe(right.subjects.at(-1)!.id);
    expect(left.prefixDigest).not.toBe(right.prefixDigest);
    expect(left.subjects[0]!.nodeId).toBe(right.subjects[0]!.nodeId);
    expect(left.subjects[0]!.id).not.toBe(right.subjects[0]!.id);
  });

  it("refuses a storage boundary after actual rewind or a new recorded move", () => {
    const run = play(importedRun("review-stale"), ["e2e4", "e7e5"]), stored = source(run);
    stored.setRun(rewind(run, stored.path[0]!.id, REVIEW_AT).run);
    expect(() => planModuleReviewPrefix(stored.boundary)).toThrow(/no longer/);
    stored.setRun(commitMove(run, "g1f3", { at: REVIEW_AT }).run);
    expect(() => planModuleReviewPrefix(stored.boundary)).toThrow(/no longer/);
  });

  it.each([0, -1, 33, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("refuses invalid page limit %s", limit => {
    const plan = planModuleReviewPrefix(source(importedRun("review-limit")).boundary);
    expect(() => moduleReviewPrefixPage(plan, undefined, limit)).toThrow(/integer from 1 to 32/);
  });

  it("matches every cursor field and refuses a completed-prefix continuation", () => {
    const run = play(importedRun("review-cursor"), ["e2e4", "e7e5"]);
    const plan = planModuleReviewPrefix(source(run).boundary), cursor = plan.subjects[0]!.cursor;
    for (const changed of [{ ...cursor, afterEventSeq: cursor.afterEventSeq + 1 },
      { ...cursor, afterBranchId: "foreign" }, { ...cursor, afterNodeId: plan.subjects[1]!.nodeId }]) {
      expect(() => moduleReviewPrefixPage(plan, changed, 1)).toThrow(/cursor does not address/);
    }
    expect(() => moduleReviewPrefixPage(plan, plan.subjects.at(-1)!.cursor, 1)).toThrow(/no continuation/);
    expect(moduleReviewPrefixPage(plan, cursor, 1).subjects.map(subject => subject.nodeId)).toEqual([plan.subjects[1]!.nodeId]);
  });
});
