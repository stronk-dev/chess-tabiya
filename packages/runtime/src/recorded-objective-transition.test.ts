// Accepted module-registration §4.10a / D3927: recorded facts, not new objective assessment.
import { describe, expect, it } from "vitest";
import { evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { assertRecordedReviewResultInvocation, invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "./recorded-review-boundary.js";
import { applyObjectiveEvidenceProposal } from "./objective.js";
import { commitMove, createRun, fork } from "./runtime.js";
import type { DrillRun, ObjectiveState } from "./types.js";

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
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
  const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId });
  return { owner, boundary, replace: (next: DrillRun) => { run = next; } };
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
