// Accepted module-registration §4.10a / D3927: recorded facts, not new objective assessment.
import { describe, expect, it, vi } from "vitest";
import * as contract from "./evidence-contract.js";
import { evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { assertRecordedReviewResultInvocation, invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "./recorded-review-boundary.js";
import { applyObjectiveEvidenceProposal } from "./objective.js";
import { commitMove, createRun, fork } from "./runtime.js";
import type { DrillRun, ObjectiveState } from "./types.js";
import { beginRecordedReviewObjectiveCollection, advanceRecordedReviewObjectiveCollection,
  finishRecordedReviewObjectiveCollection, cancelRecordedReviewObjectiveCollection,
  type RecordedReviewObjectiveCollection } from "./review-evidence.js";

const ROUTE = "run.record.objective_transition@2";
const AT = "2026-11-02T00:00:00.000Z";
function start(side: "white" | "black" = "white") {
  return createRun({ id: `objective-${side}`, session: { kind: "position", start: { side,
    fen: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${side === "white" ? "w" : "b"} KQkq - 0 1` },
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: AT });
}
function record(run: DrillRun, nodeId = run.activeCursor.nodeId, to?: ObjectiveState, reference = "recorded:witness") {
  const node = run.nodes.find(item => item.id === nodeId)!;
  return applyObjectiveEvidenceProposal(run, { nodeId, from: node.objectiveState,
    to: to ?? (node.objectiveState === "active" ? "preserved" : "active"), evidenceRefs: [reference] }, AT).run;
}
function stored(initial: DrillRun, branchId = initial.activeCursor.branchId, throughNodeId = initial.activeCursor.nodeId) {
  let run = initial;
  let beforeRead: (() => void) | undefined;
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => { beforeRead?.(); return run; }, loadImportRecord: () => undefined });
  const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId });
  return { owner, boundary, replace: (next: DrillRun) => { run = next; }, duringRead: (hook: () => void) => { beforeRead = hook; } };
}

describe("single-line recorded objective source", () => {
  it.each(["white", "black"] as const)("retains %s's repeated original occurrences and complete invocation identity", side => {
    let run = commitMove(start(side), side === "white" ? "e2e4" : "e7e5", { at: AT }).run;
    run = record(record(record(run)));
    const f = stored(run), result = invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary });
    expect(run.branches).toHaveLength(1);
    expect(result).toHaveLength(3);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.every(item => Object.isFrozen(item))).toBe(true);
    expect(result.map(item => item.evidence.payload)).toEqual([
      { context: "review", from: "active", to: "preserved" },
      { context: "review", from: "preserved", to: "active" },
      { context: "review", from: "active", to: "preserved" },
    ]);
    const source = readRecordedReviewBoundary(f.boundary);
    const originals = source.run.events.flatMap((event, eventOrdinal) => event.type === "objective.state_changed" ? [{ event, eventOrdinal }] : []);
    for (const [index, item] of result.entries()) {
      expect(Object.keys(item).sort()).toEqual(["evidence", "nodeId", "plyOffset"]);
      expect(item.nodeId).toBe(run.activeCursor.nodeId); expect(item.plyOffset).toBe(1);
      const original = originals[index]!;
      expect(evidenceValueReceipt(item.evidence)).toMatchObject({ factory: "createRunRecordObjectiveTransitionV2Evidence",
        inputDigest: evidenceDigest({ recordedReview: source, eventOrdinal: original.eventOrdinal, event: original.event }), sourceDigests: [],
      });
    }
    expect(evidenceValueReceipt(result[0]!.evidence).payloadDigest).toBe(evidenceValueReceipt(result[2]!.evidence).payloadDigest);
    expect(evidenceValueReceipt(result[0]!.evidence).inputDigest).not.toBe(evidenceValueReceipt(result[2]!.evidence).inputDigest);
    expect(() => assertRecordedReviewResultInvocation(result, ROUTE, f.boundary)).not.toThrow();
    for (const copied of [[...result], Object.freeze([...result]), Object.freeze([...result].reverse()), Object.freeze([result[0]!, result[0]!, result[2]!]), Object.freeze([])]) {
      expect(() => assertRecordedReviewResultInvocation(copied, ROUTE, f.boundary)).toThrow();
    }
    const other = stored(run);
    expect(() => assertRecordedReviewResultInvocation(result, ROUTE, other.boundary)).toThrow();
    expect(() => assertRecordedReviewResultInvocation(result, "run.record.objective_transition@1", f.boundary)).toThrow();
  });

  it("keeps genuine root events at ply0 and authenticates successful empty populations", () => {
    const empty = stored(start()), emptyResult = invokeEvidenceValueRoute(ROUTE, { recordedReview: empty.boundary });
    expect(emptyResult).toEqual([]);
    expect(() => assertRecordedReviewResultInvocation(emptyResult, ROUTE, empty.boundary)).not.toThrow();
    expect(() => assertRecordedReviewResultInvocation(Object.freeze([]), ROUTE, empty.boundary)).toThrow();
    const root = record(start()), f = stored(root), result = invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ nodeId: root.nodes[0]!.id, plyOffset: 0 });
  });

  it("uses original order and on-path membership, not creating branch, final snapshots or endpoint event time", () => {
    let run = record(start()), root = run.nodes[0]!.id;
    run = record(commitMove(run, "e2e4", { at: AT }).run);
    const shared = run.activeCursor.nodeId;
    run = record(commitMove(run, "e7e5", { at: AT }).run);
    const beyond = run.activeCursor.nodeId;
    run = fork(run, shared, { label: "retry", at: AT }).run;
    const retryBranch = run.activeCursor.branchId;
    run = record(commitMove(run, "c7c5", { at: AT }).run);
    const retryTip = run.activeCursor.nodeId;
    run = record(run, shared); // Genuine later evidence update to an inherited prefix node.
    run = record(run, root);
    const f = stored(run), result = invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary });
    expect(result.map(item => [item.nodeId, item.plyOffset])).toEqual([[root, 0], [shared, 1], [retryTip, 2], [shared, 1], [root, 0]]);
    expect(result.some(item => item.nodeId === beyond)).toBe(false);
    const prefix = stored(run, retryBranch, shared), prefixResult = invokeEvidenceValueRoute(ROUTE, { recordedReview: prefix.boundary });
    expect(prefixResult.map(item => item.nodeId)).toEqual([root, shared, shared, root]);
  });

  it("binds original evidenceRefs without claiming they prove the objective judgement", () => {
    const first = stored(record(start(), undefined, "preserved", "original:first"));
    const second = stored(record(start(), undefined, "preserved", "original:second"));
    const a = invokeEvidenceValueRoute(ROUTE, { recordedReview: first.boundary })[0]!.evidence;
    const b = invokeEvidenceValueRoute(ROUTE, { recordedReview: second.boundary })[0]!.evidence;
    expect(a.payload).toEqual(b.payload);
    expect(evidenceValueReceipt(a).inputDigest).not.toBe(evidenceValueReceipt(b).inputDigest);
    expect(Object.keys(a.payload).sort()).toEqual(["context", "from", "to"]);
  });

  it("refuses forged/copied boundaries and caller run, result or event overrides", () => {
    const run = record(start()), f = stored(run);
    for (const recordedReview of [{}, { ...f.boundary }, run]) {
      expect(() => invokeEvidenceValueRoute(ROUTE, { recordedReview } as never)).toThrow();
    }
    for (const extra of [{ events: [] }, { run }, { from: "active" }, { result: [] }, { verified: true }]) {
      expect(() => invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary, ...extra } as never)).toThrow();
    }
  });

  it("rechecks stale storage before construction and retained result admission", () => {
    const run = record(start()), f = stored(run), result = invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary });
    f.replace(record(run));
    expect(() => invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary })).toThrow(/no longer/u);
    expect(() => assertRecordedReviewResultInvocation(result, ROUTE, f.boundary)).toThrow(/no longer/u);
  });

  it("validates the whole stored replay before filtering to an otherwise valid root prefix", () => {
    const run = record(commitMove(start(), "e2e4", { at: AT }).run);
    const malformed = structuredClone(run);
    Object.assign(malformed.nodes[1]!, { fen: "malformed-off-prefix" });
    expect(() => stored(malformed, run.activeCursor.branchId, run.nodes[0]!.id)).toThrow();
    const inconsistent = structuredClone(run); Object.assign(inconsistent.nodes[1]!, { objectiveState: "failed" });
    expect(() => stored(inconsistent)).toThrow();
  });
});

describe("cooperative original objective acquisition", () => {
  it.each([1, 2, 32])("preserves all37 subjects and original events across real scheduling groups=%s", async limit => {
    let run = record(start());
    const moves = ["g1f3", "g8f6", "f3g1", "f6g8",
      "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6",
      "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8",
      "h2h3", "c6b8", "d2d4", "b8d7", "b1d2", "c7c5", "d4d5", "d8c7",
      "d2f1", "f8e8", "f1g3", "g7g6", "a2a4", "b5b4", "c3b4", "c5b4"];
    for (const [index, move] of moves.entries()) {
      run = record(commitMove(run, move, { at: AT }).run);
      if (index % 7 === 0) run = record(run, run.nodes[0]!.id);
    }
    const f = stored(run), expected = invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary });
    const handle = beginRecordedReviewObjectiveCollection(f.boundary), seen: string[] = [];
    for (let start = 0; start < run.nodes.length; start += limit) {
      for (let index = start; index < Math.min(start + limit, run.nodes.length); index++) seen.push(advanceRecordedReviewObjectiveCollection(handle).nodeId);
      if (seen.length < run.nodes.length) expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow(/incomplete/);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    expect(seen).toEqual(run.nodes.map(node => node.id));
    const actual = finishRecordedReviewObjectiveCollection(handle);
    expect(actual.items).toEqual(expected);
    expect(actual.items.map(item => evidenceValueReceipt(item.evidence))).toEqual(expected.map(item => evidenceValueReceipt(item.evidence)));
  });

  it.each(["white", "black"] as const)("acquires only the current %s subject and finishes in original event order without recollection", side => {
    let run = record(start(side)), root = run.nodes[0]!.id;
    run = record(commitMove(run, side === "white" ? "e2e4" : "e7e5", { at: AT }).run);
    const shared = run.activeCursor.nodeId;
    run = record(commitMove(run, side === "white" ? "e7e5" : "e2e4", { at: AT }).run);
    const beyond = run.activeCursor.nodeId;
    run = fork(run, shared, { label: "retry", at: AT }).run;
    run = record(commitMove(run, side === "white" ? "c7c5" : "c2c4", { at: AT }).run);
    run = record(record(run, shared), root); // Original event order differs from node-major work.
    run = record(record(run, root), root); // Equal payloads still have distinct original ordinals.
    const f = stored(run), expected = invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary });
    const image = readRecordedReviewBoundary(f.boundary);
    const mint = vi.spyOn(contract, "declareEvidence");
    try {
      const handle = beginRecordedReviewObjectiveCollection(f.boundary);
      expect(mint).not.toHaveBeenCalled();
      expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow(/incomplete/);
      for (const [index, entry] of image.path.entries()) {
        const originals = image.run.events.flatMap((event, eventOrdinal) => event.type === "objective.state_changed" && event.data.nodeId === entry.node.id ? [{ event, eventOrdinal }] : []);
        mint.mockClear();
        expect(advanceRecordedReviewObjectiveCollection(handle)).toEqual({ nodeId: entry.node.id,
          completedSubjects: index + 1, totalSubjects: image.path.length, complete: index + 1 === image.path.length });
        expect(mint.mock.calls.map(([, , , authority]) => authority.inputDigest)).toEqual(originals.map(original =>
          evidenceDigest({ recordedReview: image, eventOrdinal: original.eventOrdinal, event: original.event })));
      }
      mint.mockClear();
      const actual = finishRecordedReviewObjectiveCollection(handle);
      expect(actual.boundary).toBe(f.boundary);
      expect(actual.items).toEqual(expected);
      expect(actual.items.map(item => evidenceValueReceipt(item.evidence))).toEqual(expected.map(item => evidenceValueReceipt(item.evidence)));
      expect(actual.items.some(item => item.nodeId === beyond)).toBe(false);
      expect(() => assertRecordedReviewResultInvocation(actual.items, ROUTE, f.boundary)).not.toThrow();
      expect(mint).not.toHaveBeenCalled();
      expect(cancelRecordedReviewObjectiveCollection(handle)).toBe(false);
      expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow(/retired/);
    } finally { mint.mockRestore(); }
  });

  it.each([false, true])("advances every subject including genuine empty root/rows: root-only=%s", rootOnly => {
    const run = rootOnly ? start() : commitMove(start(), "e2e4", { at: AT }).run;
    const f = stored(run), handle = beginRecordedReviewObjectiveCollection(f.boundary);
    for (const entry of readRecordedReviewBoundary(f.boundary).path) expect(advanceRecordedReviewObjectiveCollection(handle).nodeId).toBe(entry.node.id);
    expect(() => advanceRecordedReviewObjectiveCollection(handle)).toThrow(/no remaining/);
    const result = finishRecordedReviewObjectiveCollection(handle);
    expect(result.items).toEqual([]);
    expect(() => assertRecordedReviewResultInvocation(result.items, ROUTE, f.boundary)).not.toThrow();
    expect(() => assertRecordedReviewResultInvocation(Object.freeze([]), ROUTE, f.boundary)).toThrow();
  });

  it("keeps equal-FEN sibling occurrences separate on the actual inherited branch", () => {
    let run = record(commitMove(record(start()), "e2e4", { at: AT }).run);
    const shared = run.activeCursor.nodeId;
    run = record(commitMove(run, "e7e5", { at: AT }).run);
    const sibling = run.nodes.find(node => node.id === run.activeCursor.nodeId)!;
    run = fork(run, shared, { at: AT }).run;
    run = record(commitMove(run, "e7e5", { at: AT }).run);
    const tip = run.nodes.find(node => node.id === run.activeCursor.nodeId)!;
    expect(tip.fen).toBe(sibling.fen); expect(tip.id).not.toBe(sibling.id);
    const f = stored(run), handle = beginRecordedReviewObjectiveCollection(f.boundary);
    const subjects = readRecordedReviewBoundary(f.boundary).path.map(() => advanceRecordedReviewObjectiveCollection(handle).nodeId);
    expect(subjects).toEqual([run.nodes[0]!.id, shared, tip.id]);
    const actual = finishRecordedReviewObjectiveCollection(handle);
    expect(actual.items.some(item => item.nodeId === sibling.id)).toBe(false);
    expect(actual.items).toEqual(invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary }));
  });

  it("refuses a shorter job prefix without changing the synchronous factory's valid scopes", () => {
    const run = record(commitMove(record(start()), "e2e4", { at: AT }).run);
    const f = stored(run, run.activeCursor.branchId, run.nodes[0]!.id);
    expect(invokeEvidenceValueRoute(ROUTE, { recordedReview: f.boundary })).toHaveLength(1);
    expect(() => beginRecordedReviewObjectiveCollection(f.boundary)).toThrow(/complete original branch/);
  });

  it.each([0, 1])("retires cancelled work and refuses copied/foreign handles: steps=%s", steps => {
    const f = stored(record(commitMove(record(start()), "e2e4", { at: AT }).run));
    const handle = beginRecordedReviewObjectiveCollection(f.boundary);
    for (let i = 0; i < steps; i++) advanceRecordedReviewObjectiveCollection(handle);
    for (const copy of [{}, { ...handle }]) {
      expect(() => advanceRecordedReviewObjectiveCollection(copy as RecordedReviewObjectiveCollection)).toThrow(/foreign/);
      expect(() => finishRecordedReviewObjectiveCollection(copy as RecordedReviewObjectiveCollection)).toThrow(/foreign/);
    }
    expect(cancelRecordedReviewObjectiveCollection(handle)).toBe(true);
    expect(cancelRecordedReviewObjectiveCollection(handle)).toBe(false);
    expect(() => advanceRecordedReviewObjectiveCollection(handle)).toThrow(/retired/);
    expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow(/retired/);
  });

  it.each(["cancel", "storage", "throw", "reentrant"] as const)("checks original lifetime during the actual mint: %s", fault => {
    const run = record(record(start())), f = stored(run), handle = beginRecordedReviewObjectiveCollection(f.boundary);
    const original = contract.declareEvidence;
    const mint = vi.spyOn(contract, "declareEvidence").mockImplementation((...args) => {
      if (fault === "cancel") cancelRecordedReviewObjectiveCollection(handle);
      else if (fault === "storage") f.replace(record(run));
      else if (fault === "throw") throw new TypeError("original mint failed");
      else expect(() => advanceRecordedReviewObjectiveCollection(handle)).toThrow(/already advancing/);
      return original(...args);
    });
    try {
      if (fault === "reentrant") {
        expect(advanceRecordedReviewObjectiveCollection(handle).complete).toBe(true);
        expect(finishRecordedReviewObjectiveCollection(handle).items).toHaveLength(2);
      } else {
        expect(() => advanceRecordedReviewObjectiveCollection(handle)).toThrow();
        expect(mint).toHaveBeenCalledTimes(1);
        expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow(/retired/);
        expect(cancelRecordedReviewObjectiveCollection(handle)).toBe(false);
      }
    } finally { mint.mockRestore(); }
  });

  it.each(["cancel", "storage", "reentrant"] as const)("checks original lifetime during the complete invocation proof: %s", fault => {
    const run = record(start()), f = stored(run), handle = beginRecordedReviewObjectiveCollection(f.boundary);
    advanceRecordedReviewObjectiveCollection(handle);
    let reads = 0;
    f.duringRead(() => {
      // First read is the finisher's entry guard; second is its original complete-array proof.
      if (++reads !== 2) return;
      if (fault === "cancel") expect(cancelRecordedReviewObjectiveCollection(handle)).toBe(true);
      else if (fault === "storage") f.replace(record(run));
      else expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow(/already advancing or finishing/);
    });
    const mint = vi.spyOn(contract, "declareEvidence");
    try {
      if (fault === "reentrant") expect(finishRecordedReviewObjectiveCollection(handle).items).toHaveLength(1);
      else expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow();
      expect(reads).toBeGreaterThanOrEqual(2);
      expect(mint).not.toHaveBeenCalled();
      expect(cancelRecordedReviewObjectiveCollection(handle)).toBe(false);
      expect(() => finishRecordedReviewObjectiveCollection(handle)).toThrow(/retired/);
    } finally { mint.mockRestore(); }
  });
});
