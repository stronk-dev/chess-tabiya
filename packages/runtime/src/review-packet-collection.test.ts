import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import * as routes from "./internal/evidence-value-routes.js";
import * as semantic from "./recorded-semantic-path.js";
import {
  advanceReviewPacketCollection, assertReviewEvidencePacket, assertReviewRecordedPrefixReceipt,
  beginRecordedReviewSourceCollection, beginReviewPacketCollection, cancelRecordedReviewSourceCollection,
  cancelReviewPacketCollection, compileReviewPacketForSubject, createReviewPrefixAuthority,
  finishReviewPacketCollection, reviewPacketSourcePlan, reviewSubjectPath,
  type ReviewPacketCollection, type ReviewProviderNodeState,
} from "./review-evidence.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import { rewind } from "./runtime.js";
import { reviewStoryMoments } from "./story.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import { evaluationDelivery, importedRun, importRecord, play, REVIEW_AT } from "./testing/review-evidence-fixture.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import type { DrillRun } from "./types.js";

function fixture(initial: DrillRun, branchId = initial.activeCursor.branchId) {
  let run = initial;
  const path = branchPath(run, branchId), record = initial.sessionKind === "imported" ? importRecord(initial, "*") : undefined;
  const storage = { loadRun: () => run, loadImportRecord: () => record };
  const authorize = createReviewPrefixAuthority(storage);
  const engine = new Map<string, ReviewProviderNodeState>(), shapes: ShapeTriggerSource[] = [];
  return { path, storage, engine, shapes, context: { engine, shapes }, setRun: (value: DrillRun) => { run = value; },
    subject: () => authorize({ runId: run.id, branchId }),
    deliver: (index: number, score: string) => {
      const delivery = routes.invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(path[index]!.fen, score) });
      engine.set(path[index]!.id, { kind: "delivered", delivery }); return delivery;
    } };
}
function drain(handle: ReviewPacketCollection, count: number) {
  for (let index = 0; index < count; index++) expect(advanceReviewPacketCollection(handle))
    .toMatchObject({ completedSubjects: index + 1, totalSubjects: count, complete: index + 1 === count });
  return finishReviewPacketCollection(handle);
}

describe("genuine full Review packet cooperative collection", () => {
  it("D4253 cached semantic reads do not multiply complete storage checks by family and node", () => {
    const reads = (moves: readonly string[]) => {
      const run = play(importedRun("packet-semantic-read-cost"), moves), loadRun = vi.fn(() => run);
      const subject = createReviewPrefixAuthority({ loadRun, loadImportRecord: () => importRecord(run, "*") })({ runId: run.id, branchId: run.activeCursor.branchId });
      loadRun.mockClear();
      compileReviewPacketForSubject(subject, { engine: new Map(), shapes: [] });
      return loadRun.mock.calls.length;
    };
    const rootReads = reads([]), longerReads = reads(["e2e4", "e7e5", "g1f3", "b8c6"]);
    expect(rootReads).toBeGreaterThan(0);
    expect(longerReads).toBe(rootReads);
  });

  it.each(["sync", "step"] as const)("retains the original whole image when a storage adapter later mutates its issued object: %s", mode => {
    const original = play(importedRun("packet-borrowed-storage"), ["e2e4", "e7e5"]);
    let borrowed: DrillRun | undefined;
    const authorize = createReviewPrefixAuthority({
      loadRun: () => { borrowed = structuredClone(original); return borrowed; },
      loadImportRecord: () => importRecord(original, "*"),
    });
    const subject = authorize({ runId: original.id, branchId: original.activeCursor.branchId }), issuedInput = borrowed!;
    const expected = compileReviewPacketForSubject(fixture(original).subject(), { engine: new Map(), shapes: [] });
    Object.assign(issuedInput.nodes[1]!, { fen: original.nodes[0]!.fen });
    // Current storage still returns the complete original game, not the borrowed object's mutation.
    assertReviewRecordedPrefixReceipt(subject);
    const packet = mode === "step"
      ? drain(beginReviewPacketCollection(subject, { engine: new Map(), shapes: [] }), original.nodes.length)
      : compileReviewPacketForSubject(subject, { engine: new Map(), shapes: [] });
    expect(JSON.stringify(packet)).toBe(JSON.stringify(expected));
    expect(JSON.stringify(original)).not.toBe(JSON.stringify(issuedInput));
  });

  it("ordinary currentness reads do not clone the captured game or run semantic collectors", () => {
    const f = fixture(play(importedRun("packet-currentness"), ["e2e4"])), subject = f.subject();
    const clone = vi.spyOn(globalThis, "structuredClone"), collect = vi.spyOn(semantic, "recordedSemanticPath");
    try {
      for (let index = 0; index < 4; index++) { assertReviewRecordedPrefixReceipt(subject); reviewSubjectPath(subject); }
      expect(clone).not.toHaveBeenCalled(); expect(collect).not.toHaveBeenCalled();
    } finally { clone.mockRestore(); collect.mockRestore(); }
  });

  it("issuance, plan and begin are metadata-only; original semantic collection is memoized on execution", () => {
    const f = fixture(play(importedRun("packet-lazy"), ["e2e4", "e7e5"]));
    const collect = vi.spyOn(semantic, "recordedSemanticPath");
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const subject = f.subject(); assertReviewRecordedPrefixReceipt(subject); reviewSubjectPath(subject);
      const plan = reviewPacketSourcePlan(subject, { windowNodes: 1 }); expect(plan.length).toBeGreaterThan(0);
      const handle = beginReviewPacketCollection(subject, f.context);
      expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
      expect(() => finishReviewPacketCollection(handle)).toThrow(/incomplete/);
      expect(() => assertReviewEvidencePacket(handle)).toThrow(/not constructed/);
      const first = advanceReviewPacketCollection(handle);
      expect(first).toEqual({ nodeId: f.path[0]!.id, completedSubjects: 1, totalSubjects: 3, complete: false });
      expect(collect).toHaveBeenCalledTimes(1);
      advanceReviewPacketCollection(handle); advanceReviewPacketCollection(handle);
      const packet = finishReviewPacketCollection(handle), calls = dispatch.mock.calls.length;
      assertReviewEvidencePacket(packet); expect(dispatch).toHaveBeenCalledTimes(calls);
      reviewStoryMoments(packet);
      expect(collect).toHaveBeenCalledTimes(1);
      expect(dispatch.mock.calls.slice(calls).map(([ref]) => ref)).toEqual(["derived.story.rank@2", "derived.story.title@2"]);
      expect(() => finishReviewPacketCollection(handle)).toThrow(/retired/);
    } finally { collect.mockRestore(); dispatch.mockRestore(); }
  });

  it.each([false, true])("preserves complete packet and Story bytes with inherited mirrored branches: black=%s", black => {
    const original = recordedComparisonFixture(black), f = fixture(original.run, original.peer);
    f.deliver(0, "cp 20"); f.deliver(1, "cp -30");
    f.engine.set(f.path[2]!.id, { kind: "pending", jobCount: 2, retrying: 1 });
    f.engine.set(f.path[3]!.id, { kind: "not_yet_scheduled" });
    f.shapes.push({ id: "recorded-square", trigger: { kind: "pieceOnSquare", square: black ? "e5" : "e4", piece: { color: black ? "black" : "white", role: "pawn" } } });
    const expected = compileReviewPacketForSubject(f.subject(), f.context);
    const packet = drain(beginReviewPacketCollection(f.subject(), f.context), f.path.length);
    expect(JSON.stringify(packet)).toBe(JSON.stringify(expected));
    expect(JSON.stringify(reviewStoryMoments(packet))).toBe(JSON.stringify(reviewStoryMoments(expected)));
    expect(packet.completion.progress.kind).toBe("progressive");
    expect(packet.nodes.map(node => node.nodeId)).toEqual(f.path.map(node => node.id));
  });

  it.each([1, 2, 32])("retains complete over32-subject packet bytes across real yields at page size %s", async limit => {
    const moves = ["g1f3", "g8f6", "f3g1", "f6g8",
      "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6",
      "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8",
      "h2h3", "c6b8", "d2d4", "b8d7", "b1d2", "c7c5", "d4d5", "d8c7",
      "d2f1", "f8e8", "f1g3", "g7g6", "a2a4", "b5b4", "c3b4", "c5b4"];
    const f = fixture(play(importedRun(`packet-long-${limit}`), moves));
    const expected = compileReviewPacketForSubject(f.subject(), f.context);
    const handle = beginReviewPacketCollection(f.subject(), f.context), seen: string[] = [];
    for (let start = 0; start < f.path.length; start += limit) {
      for (let index = start; index < Math.min(start + limit, f.path.length); index++) {
        seen.push(advanceReviewPacketCollection(handle).nodeId);
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
      if (seen.length < f.path.length) expect(() => finishReviewPacketCollection(handle)).toThrow(/incomplete/);
    }
    const actual = finishReviewPacketCollection(handle);
    expect(seen).toEqual(f.path.map(node => node.id)); expect(seen).toHaveLength(37);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  });

  it("rejects stale authority before the first semantic source executes", () => {
    const initial = play(importedRun("packet-stale-before"), ["e2e4"]), f = fixture(initial);
    const handle = beginReviewPacketCollection(f.subject(), f.context);
    f.setRun(rewind(initial, f.path[0]!.id, REVIEW_AT).run);
    const collect = vi.spyOn(semantic, "recordedSemanticPath");
    try { expect(() => advanceReviewPacketCollection(handle)).toThrow(/no longer/); expect(collect).not.toHaveBeenCalled(); }
    finally { collect.mockRestore(); }
    expect(cancelReviewPacketCollection(handle)).toBe(false);
  });

  it("rechecks actual authority after semantic collection and retires a changed frame", () => {
    const initial = play(importedRun("packet-stale-during"), ["e2e4"]), f = fixture(initial);
    const handle = beginReviewPacketCollection(f.subject(), f.context), original = semantic.recordedSemanticPath;
    const collect = vi.spyOn(semantic, "recordedSemanticPath").mockImplementation((...args) => {
      const result = original(...args); f.setRun(rewind(initial, f.path[0]!.id, REVIEW_AT).run); return result;
    });
    try { expect(() => advanceReviewPacketCollection(handle)).toThrow(/no longer/); }
    finally { collect.mockRestore(); }
    expect(() => finishReviewPacketCollection(handle)).toThrow(/retired/);
  });

  it("rejects a genuine semantic result from a different original branch", () => {
    const original = recordedComparisonFixture(), f = fixture(original.run, original.peer);
    const handle = beginReviewPacketCollection(f.subject(), f.context), collectOriginal = semantic.recordedSemanticPath;
    const collect = vi.spyOn(semantic, "recordedSemanticPath").mockImplementation(run => collectOriginal(run, original.main));
    try { expect(() => advanceReviewPacketCollection(handle)).toThrow(/recorded semantic path belongs to another branch/); }
    finally { collect.mockRestore(); }
    expect(cancelReviewPacketCollection(handle)).toBe(false);
  });

  it("rejects a genuine refused semantic result from a different branch", () => {
    const f = fixture(play(importedRun("packet-semantic-refusal"), ["e2e4"]));
    const handle = beginReviewPacketCollection(f.subject(), f.context), collectOriginal = semantic.recordedSemanticPath;
    const collect = vi.spyOn(semantic, "recordedSemanticPath").mockImplementation(run => collectOriginal(run, "missing-original-branch"));
    try {
      expect(() => advanceReviewPacketCollection(handle)).toThrow(/branch/);
      expect(cancelReviewPacketCollection(handle)).toBe(false);
      expect(collect).toHaveBeenCalledTimes(1);
    } finally { collect.mockRestore(); }
  });

  it("revalidates completed work at final publication and retires stale source results", () => {
    const initial = importedRun("packet-final-stale"), f = fixture(initial);
    const handle = beginReviewPacketCollection(f.subject(), f.context);
    advanceReviewPacketCollection(handle);
    f.setRun(rewind(initial, f.path[0]!.id, REVIEW_AT).run);
    expect(() => finishReviewPacketCollection(handle)).toThrow(/no longer/);
    expect(cancelReviewPacketCollection(handle)).toBe(false);
  });

  it("detaches mutable context while keeping genuine delivery identities", () => {
    const f = fixture(play(importedRun("packet-capture"), ["e2e4", "e7e5"]));
    f.deliver(0, "cp 20"); f.deliver(1, "cp -30");
    const pending = { kind: "pending" as const, jobCount: 1, retrying: 0 };
    f.engine.set(f.path[2]!.id, pending);
    const trigger = { kind: "pieceOnSquare" as const, square: "e4" as const, piece: { color: "white" as const, role: "pawn" as const } };
    f.shapes.push({ id: "kept", trigger });
    const expected = compileReviewPacketForSubject(f.subject(), f.context);
    const handle = beginReviewPacketCollection(f.subject(), f.context);
    pending.jobCount = 99; f.engine.clear(); f.shapes.length = 0;
    (trigger as { square: string }).square = "a1";
    expect(JSON.stringify(drain(handle, f.path.length))).toBe(JSON.stringify(expected));
  });

  it.each([0, 1])("cancel retires only its original unstarted/partial frame: steps=%s", steps => {
    const f = fixture(play(importedRun(`packet-cancel-${steps}`), ["e2e4"]));
    const first = beginReviewPacketCollection(f.subject(), f.context), other = beginReviewPacketCollection(f.subject(), f.context);
    for (let i = 0; i < steps; i++) advanceReviewPacketCollection(first);
    expect(cancelReviewPacketCollection(first)).toBe(true); expect(cancelReviewPacketCollection(first)).toBe(false);
    expect(() => advanceReviewPacketCollection(first)).toThrow(/retired/);
    expect(() => finishReviewPacketCollection(first)).toThrow(/retired/);
    assertReviewEvidencePacket(drain(other, f.path.length));
  });

  it("source failure retires work and incomplete handles never become complete packets", () => {
    const f = fixture(importedRun("packet-failure")), handle = beginReviewPacketCollection(f.subject(), f.context);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(() => { throw new TypeError("actual source failure"); });
    try { expect(() => advanceReviewPacketCollection(handle)).toThrow(/actual source failure/); }
    finally { dispatch.mockRestore(); }
    expect(cancelReviewPacketCollection(handle)).toBe(false);
    expect(() => finishReviewPacketCollection(handle)).toThrow(/retired/);
  });

  it("rejects cloned subjects/handles and the other genuine twelve-source collection authority", () => {
    const original = recordedComparisonFixture(), f = fixture(original.run, original.peer), subject = f.subject();
    const handle = beginReviewPacketCollection(subject, f.context);
    expect(() => beginReviewPacketCollection({ ...subject }, f.context)).toThrow(/not issued/);
    expect(() => advanceReviewPacketCollection({ ...handle } as ReviewPacketCollection)).toThrow(/retired/);
    const boundary = createRecordedReviewBoundarySourceOwner(f.storage).resolve({ runId: original.run.id, branchId: original.peer, throughNodeId: f.path.at(-1)!.id });
    const recorded = beginRecordedReviewSourceCollection({ boundary, context: f.context });
    expect(() => finishReviewPacketCollection(recorded as never)).toThrow(/retired/);
    expect(() => finishReviewPacketCollection(subject as never)).toThrow(/retired/);
    expect(cancelRecordedReviewSourceCollection(recorded)).toBe(true); expect(cancelReviewPacketCollection(handle)).toBe(true);
  });
});
