// Actual RunService/storage/access source boundary. Synthetic scores are not chess qualification.
import { afterEach, describe, expect, it, vi } from "vitest";
import { commitMove, revealFeedback } from "../../../packages/runtime/src/runtime.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as reviewSources from "../../../packages/runtime/src/review-evidence.js";
import { recordedGradeFixture } from "../../../packages/runtime/src/testing/recorded-grade-fixture.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { parsePresentationReceipt, presentedSentence } from "../../../packages/runtime/src/presentation-contract.js";
import { readRecordedSequenceWindow } from "../../../packages/runtime/src/recorded-sequence-window.js";
import { RecordedGradeSourceOwner } from "./recorded-grade-sources.js";
import { attachDelivery, evaluationDelivery } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import * as attachments from "../../../packages/runtime/src/internal/recorded-engine-attachments.js";
import { RecordedEngineEndpointOwner } from "./recorded-engine-endpoints.js";
import * as evidenceContract from "../../../packages/runtime/src/evidence-contract.js";
import { applyObjectiveEvidenceProposal } from "../../../packages/runtime/src/objective.js";

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

function objectiveFixture(black = false, asReader = false) {
  const f = fixture(black), at = "2026-11-12T00:00:00.000Z";
  let run = f.run;
  for (const nodeId of [f.child.id, run.nodes[0]!.id, run.nodes[0]!.id]) {
    const node = run.nodes.find(node => node.id === nodeId)!;
    run = applyObjectiveEvidenceProposal(run, { nodeId, from: node.objectiveState,
      to: node.objectiveState === "active" ? "preserved" : "active", evidenceRefs: ["recorded:test-witness"] }, at).run;
  }
  f.storage.save(run, f.lease);
  let principal = f.principal;
  if (asReader) {
    principal = { learnerId: "objective-reader", handle: "objective-reader" };
    f.storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
    f.storage.grantRole(run.id, principal.learnerId, "spectator", f.lease, at);
  }
  const query = { ...f.query, decisionDigest: moduleDecisionStamp(run).digest };
  const capture = f.service.beginGradeRecordedContext(run.id, principal, null, query, f.controller.signal);
  return { ...f, principal, run, query, capture };
}
describe("sole service-owned recorded grade issuer", () => {
  it.each([false, true])("keeps the original %s-side objective proof through workflow promotion without recollection", black => {
    const f = objectiveFixture(black), boundary = f.service.readGradePreparation(f.capture).boundary;
    const expected = reviewSources.collectRecordedReviewObjectives(boundary);
    const work = f.service.beginCapturedReviewObjectiveSource(f.capture), mint = vi.spyOn(evidenceContract, "declareEvidence");
    try {
      expect(() => f.service.finishReviewObjectiveSource(work)).toThrow(/incomplete/);
      for (const [index, node] of f.run.nodes.entries()) {
        f.service.advanceGradeRecordedContext(f.capture);
        expect(f.service.advanceReviewObjectiveSource(work)).toEqual({ nodeId: node.id,
          completedSubjects: index + 1, totalSubjects: f.run.nodes.length, complete: index + 1 === f.run.nodes.length });
      }
      const context = f.service.finishGradeRecordedContext(f.capture);
      mint.mockClear();
      const actual = f.service.finishReviewObjectiveSource(work);
      expect(actual.boundary).toBe(boundary); expect(actual.items).toEqual(expected.items);
      expect(actual.items.map(item => evidenceContract.evidenceValueReceipt(item.evidence)))
        .toEqual(expected.items.map(item => evidenceContract.evidenceValueReceipt(item.evidence)));
      expect(mint).not.toHaveBeenCalled();
      expect(f.service.readGradeRecordedContext(context).boundary).toBe(boundary);
      expect(f.service.cancelReviewObjectiveSource(work)).toBe(false);
    } finally { mint.mockRestore(); }
  });

  it("refuses objective acquisition before its actual endpoint and retires foreign/cancelled work", () => {
    const f = objectiveFixture(), work = f.service.beginCapturedReviewObjectiveSource(f.capture);
    const mint = vi.spyOn(evidenceContract, "declareEvidence");
    try {
      expect(() => f.service.advanceReviewObjectiveSource({ ...work })).toThrow(/foreign/);
      expect(() => f.service.advanceReviewObjectiveSource(work)).toThrow(/not been acquired/);
      expect(mint).not.toHaveBeenCalled();
      expect(f.service.cancelReviewObjectiveSource(work)).toBe(false);
      expect(() => f.service.finishReviewObjectiveSource(work)).toThrow(/retired/);
    } finally { mint.mockRestore(); f.service.cancelGradeRecordedContext(f.capture); }
  });

  it.each(["cancel", "grant", "storage", "reentrant"] as const)("rechecks the actual workflow when objective minting triggers %s", fault => {
    const f = objectiveFixture(false, fault === "grant"), work = f.service.beginCapturedReviewObjectiveSource(f.capture);
    f.service.advanceGradeRecordedContext(f.capture);
    const original = evidenceContract.declareEvidence;
    let mutated = false;
    const mint = vi.spyOn(evidenceContract, "declareEvidence").mockImplementation((...args) => {
      if (args[1].id === "run.record.objective_transition" && !mutated) {
        mutated = true;
        if (fault === "cancel") f.controller.abort();
        else if (fault === "grant") f.storage.revokeGrant(f.run.id, f.principal.learnerId, f.lease);
        else if (fault === "storage") f.storage.save(commitMove(f.run, "e7e5", { at: "2026-11-12T00:00:00.000Z" }).run, f.lease);
        else expect(() => f.service.advanceReviewObjectiveSource(work)).toThrow(/already advancing/);
      }
      return original(...args);
    });
    try {
      if (fault === "reentrant") expect(f.service.advanceReviewObjectiveSource(work).complete).toBe(false);
      else {
        if (fault === "grant") {
          expect(() => f.service.advanceReviewObjectiveSource(work)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
          expect(f.storage.runRole(f.run.id, f.principal.learnerId)).toBeUndefined();
        } else expect(() => f.service.advanceReviewObjectiveSource(work)).toThrow();
        expect(() => f.service.finishReviewObjectiveSource(work)).toThrow(/retired/);
        expect(f.service.cancelReviewObjectiveSource(work)).toBe(false);
      }
    } finally { mint.mockRestore(); f.service.cancelReviewObjectiveSource(work); f.service.cancelGradeRecordedContext(f.capture); }
  });

  it.each(["kind", "delivery"] as const)("rejects a provider %s accessor before normalizing an acquired modern row", property => {
    const f = fixture(), prepare = f.service.beginGradeRecordedContext(f.run.id, f.principal, null, f.query, f.controller.signal);
    const population = f.service.beginCapturedReviewSourcePopulation(prepare, { shapes: [] });
    f.service.advanceGradeRecordedContext(prepare);
    const node = f.run.nodes[0]!, valid = reviewSources.reviewDurableEngineStates(f.run, [node]).get(node.id)!;
    if (valid.kind !== "delivered") throw new Error("Expected the original recorded modern delivery");
    const getter = vi.fn(() => property === "kind" ? "delivered" : valid.delivery);
    const state = property === "kind" ? { delivery: valid.delivery } : { kind: "delivered" };
    Object.defineProperty(state, property, { enumerable: true, get: getter });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      expect(() => f.service.advanceReviewSourcePopulation(population, { nodeId: node.id, state: state as never })).toThrow();
      expect(getter).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
      expect(f.service.cancelReviewSourcePopulation(population)).toBe(false);
    } finally { dispatch.mockRestore(); f.service.cancelGradeRecordedContext(prepare); }
  });

  it.each([false, true])("keeps an early %s-side grade and its receipt identical through full context completion", black => {
    const f = fixture(black);
    let run = commitMove(f.run, black ? "g1f3" : "e7e5", { at: "2026-11-12T00:00:00.000Z" }).run;
    run = revealFeedback(run, "2026-11-12T00:00:00.000Z").run;
    f.storage.save(run, f.lease);
    const query = { ...f.query, throughNodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(run).digest };
    const baseline = f.service.resolveGradeRecordedContext(run.id, f.principal, null, query, f.controller.signal);
    const baselineSource = f.service.resolveGradeMoveSource(baseline, { nodeId: f.child.id, signal: f.controller.signal });
    const expected = JSON.stringify(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: baselineSource }));
    const selected = vi.spyOn(RecordedEngineEndpointOwner.prototype, "advanceCapture");
    try {
      const work = f.service.beginGradeRecordedContext(run.id, f.principal, null, query, f.controller.signal);
      const metadata = f.service.readGradePreparation(work);
      expect(metadata.permission.assistance).toBeNull(); expect(metadata.permission.timing).toBe("review");
      expect(selected).not.toHaveBeenCalled();
      expect(() => f.service.resolveCapturedGradeMoveSource(work, { nodeId: f.child.id, signal: f.controller.signal })).toThrow(/not been acquired/);
      expect(selected).not.toHaveBeenCalled();
      f.service.advanceGradeRecordedContext(work); f.service.advanceGradeRecordedContext(work);
      const early = f.service.resolveCapturedGradeMoveSource(work, { nodeId: f.child.id, signal: f.controller.signal });
      const value = f.service.readGradeMoveSource(early);
      expect(value.authority.permission).toStrictEqual(metadata.permission);
      expect(JSON.stringify(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: early }))).toBe(expected);
      expect(selected).toHaveBeenCalledTimes(2);
      expect(() => f.service.resolveCapturedGradeMoveSource(work, { nodeId: run.activeCursor.nodeId, signal: f.controller.signal })).toThrow(/not been acquired/);
      expect(() => f.service.finishGradeRecordedContext(work)).toThrow(/incomplete/);
      expect(() => f.service.readGradeRecordedContext(work as never)).toThrow(/foreign/);
      expect(() => f.service.resolveCapturedGradeMoveSource(work, { nodeId: f.child.id, signal: new AbortController().signal })).toThrow(/cancellation/);
      expect(() => f.service.resolveCapturedGradeMoveSource({ ...work }, { nodeId: f.child.id, signal: f.controller.signal })).toThrow(/foreign/);
      expect(selected).toHaveBeenCalledTimes(2);
      expect(f.service.advanceGradeRecordedContext(work).complete).toBe(true);
      const context = f.service.finishGradeRecordedContext(work);
      expect(f.service.readGradeRecordedContext(context).permission).toBe(metadata.permission);
      expect(f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal })).toBe(early);
      expect(f.service.readGradeMoveSource(early)).toBe(value);
      expect(JSON.stringify(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: early }))).toBe(expected);
      expect(() => f.service.readGradePreparation(work)).toThrow(/retired/);
      expect(f.service.cancelGradeRecordedContext(work)).toBe(false);
      f.controller.abort();
      expect(() => f.service.readGradeMoveSource(early)).toThrow(expect.objectContaining({ name: "AbortError" }));
    } finally { selected.mockRestore(); }
  });

  it.each(["cancel", "grant", "storage"] as const)("retires an early grade on actual %s changes before completion", fault => {
    const f = fixture(), reader = { learnerId: "early-grade-reader", handle: "early-grade-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: "2026-11-12T00:00:00.000Z" });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, "2026-11-12T00:00:00.000Z");
    const work = f.service.beginGradeRecordedContext(f.run.id, reader, null, f.query, f.controller.signal);
    while (!f.service.advanceGradeRecordedContext(work).complete) { /* original selections */ }
    const early = f.service.resolveCapturedGradeMoveSource(work, { nodeId: f.child.id, signal: f.controller.signal });
    if (fault === "cancel") expect(f.service.cancelGradeRecordedContext(work)).toBe(true);
    else if (fault === "grant") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    else f.storage.save(commitMove(f.run, "e7e5", { at: "2026-11-12T00:00:00.000Z" }).run, f.lease);
    expect(() => f.service.readGradeMoveSource(early)).toThrow();
    expect(() => f.service.finishGradeRecordedContext(work)).toThrow();
    expect(f.service.cancelGradeRecordedContext(work)).toBe(false);
  });

  it("cannot resurrect an early grade when its genuine endpoint finisher cancels the caller", () => {
    const f = fixture(), work = f.service.beginGradeRecordedContext(f.run.id, f.principal, null, f.query, f.controller.signal);
    while (!f.service.advanceGradeRecordedContext(work).complete) { /* original selections */ }
    const early = f.service.resolveCapturedGradeMoveSource(work, { nodeId: f.child.id, signal: f.controller.signal });
    const original = RecordedEngineEndpointOwner.prototype.finishCapture;
    const finish = vi.spyOn(RecordedEngineEndpointOwner.prototype, "finishCapture").mockImplementation(function(this: RecordedEngineEndpointOwner, handle) {
      const result = original.call(this, handle); expect(f.service.cancelGradeRecordedContext(work)).toBe(true); return result;
    });
    try {
      expect(() => f.service.finishGradeRecordedContext(work)).toThrow(/retired|promoted/);
      expect(() => f.service.readGradeMoveSource(early)).toThrow(/retired/);
      expect(f.service.cancelGradeRecordedContext(work)).toBe(false);
    } finally { finish.mockRestore(); }
  });

  it.each([false, true])("captures the actual %s-side context in original stages before grading", black => {
    const f = fixture(black), expectedContext = f.resolve();
    const expectedSource = f.service.resolveGradeMoveSource(expectedContext, { nodeId: f.child.id, signal: f.controller.signal });
    const expected = JSON.stringify(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: expectedSource }));
    const collect = vi.spyOn(attachments, "collectRecordedEngineAttachments");
    try {
      const work = f.service.beginGradeRecordedContext(f.run.id, f.principal, null, f.query, f.controller.signal);
      expect(collect).not.toHaveBeenCalled();
      expect(() => f.service.readGradeRecordedContext(work as never)).toThrow(/foreign/);
      expect(() => f.service.finishGradeRecordedContext(work)).toThrow(/incomplete/);
      for (const [index, node] of f.run.nodes.entries()) expect(f.service.advanceGradeRecordedContext(work)).toEqual({
        stage: "endpoint", nodeId: node.id, completedSubjects: index + 1, totalSubjects: f.run.nodes.length, complete: index + 1 === f.run.nodes.length,
      });
      const context = f.service.finishGradeRecordedContext(work), value = f.service.resolveGradeMoveSource(context, { nodeId: f.child.id, signal: f.controller.signal });
      expect(JSON.stringify(invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: value }))).toBe(expected);
      expect(f.service.readGradeMoveSource(value).authority.permission.assistance).toBeNull();
      expect(collect).not.toHaveBeenCalled();
      expect(f.service.cancelGradeRecordedContext(work)).toBe(false);
    } finally { collect.mockRestore(); }
  });

  it.each(["before", "attachments", "finish"] as const)("rechecks actual revoked grants at context %s", stage => {
    const f = fixture(), reader = { learnerId: "context-capture-reader", handle: "context-capture-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: "2026-11-12T00:00:00.000Z" });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, "2026-11-12T00:00:00.000Z");
    const handle = f.service.beginGradeRecordedContext(f.run.id, reader, null, f.query, f.controller.signal);
    const revoke = () => f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    if (stage === "finish") {
      while (!f.service.advanceGradeRecordedContext(handle).complete) { /* original complete work */ }
      const original = RecordedEngineEndpointOwner.prototype.finishCapture;
      const finish = vi.spyOn(RecordedEngineEndpointOwner.prototype, "finishCapture").mockImplementation(function(this: RecordedEngineEndpointOwner, work) {
        const source = original.call(this, work); revoke(); return source;
      });
      try { expect(() => f.service.finishGradeRecordedContext(handle)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" })); }
      finally { finish.mockRestore(); }
    } else {
      const original = attachments.advanceRecordedEngineAttachmentCollection;
      const collect = vi.spyOn(attachments, "advanceRecordedEngineAttachmentCollection").mockImplementation((...args) => {
        const result = original(...args); if (stage === "attachments") revoke(); return result;
      });
      try { if (stage === "before") revoke(); expect(() => f.service.advanceGradeRecordedContext(handle)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" })); }
      finally { collect.mockRestore(); }
    }
    expect(f.service.cancelGradeRecordedContext(handle)).toBe(false);
  });

  it("retires cancelled/aborted context work and refuses another actual service owner", () => {
    const f = fixture(), other = fixture(true);
    const handle = f.service.beginGradeRecordedContext(f.run.id, f.principal, null, f.query, f.controller.signal);
    expect(() => other.service.advanceGradeRecordedContext(handle)).toThrow(/foreign/);
    expect(other.service.cancelGradeRecordedContext(handle)).toBe(false);
    expect(() => f.service.advanceGradeRecordedContext({ ...handle })).toThrow(/foreign/);
    f.controller.abort();
    expect(() => f.service.advanceGradeRecordedContext(handle)).toThrow(expect.objectContaining({ name: "AbortError" }));
    expect(f.service.cancelGradeRecordedContext(handle)).toBe(false);
    const own = other.service.beginGradeRecordedContext(other.run.id, other.principal, null, other.query, other.controller.signal);
    expect(other.service.cancelGradeRecordedContext(own)).toBe(true);
    expect(() => other.service.finishGradeRecordedContext(own)).toThrow(/retired/);
  });

  it("refuses a genuine endpoint source retained from another original context boundary", () => {
    const f = fixture(), original = RecordedEngineEndpointOwner.prototype.finishCapture;
    let retained: ReturnType<RecordedEngineEndpointOwner["finishCapture"]> | undefined;
    const finish = vi.spyOn(RecordedEngineEndpointOwner.prototype, "finishCapture").mockImplementation(function(this: RecordedEngineEndpointOwner, work) {
      const source = original.call(this, work); return retained ??= source;
    });
    try {
      f.resolve(); // genuine prior source, from this same actual service/endpoint owner
      const handle = f.service.beginGradeRecordedContext(f.run.id, f.principal, null, f.query, f.controller.signal);
      while (!f.service.advanceGradeRecordedContext(handle).complete) { /* complete the new original boundary */ }
      expect(() => f.service.finishGradeRecordedContext(handle)).toThrow(/original context boundary/);
      expect(f.service.cancelGradeRecordedContext(handle)).toBe(false);
    } finally { finish.mockRestore(); }
  });

  it.each([1, 2, 32])("preserves every original long-line grade source across real-yield groups=%s", async limit => {
    const f = fixture(false, { before: null, after: null });
    let run = f.run;
    const moves = ["e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7",
      "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8", "h2h3", "c6b8", "d2d4", "b8d7",
      "b1d2", "c7c5", "d4d5", "d8c7", "d2f1", "f8e8", "f1g3", "g7g6", "a2a4", "b5b4", "c3b4", "c5b4"];
    for (const move of moves) run = commitMove(run, move, { at: "2026-11-12T00:00:00.000Z" }).run;
    run = revealFeedback(run, "2026-11-12T00:00:00.000Z").run; f.storage.save(run, f.lease);
    const query = { ...f.query, throughNodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(run).digest };
    const baseline = f.service.resolveGradeRecordedContext(run.id, f.principal, null, query, f.controller.signal);
    const image = (context: typeof baseline) => run.nodes.slice(1).map(node => {
      const source = f.service.resolveGradeMoveSource(context, { nodeId: node.id, signal: f.controller.signal });
      const row = f.service.readGradeMoveSource(source); return { edge: row.edge.payload, state: row.state, context: row.context };
    });
    const expected = JSON.stringify(image(baseline));
    const handle = f.service.beginGradeRecordedContext(run.id, f.principal, null, query, f.controller.signal);
    const seen: string[] = [];
    for (let start = 0; start < run.nodes.length; start += limit) {
      for (let index = start; index < Math.min(start + limit, run.nodes.length); index++) {
        seen.push(f.service.advanceGradeRecordedContext(handle).nodeId!);
        await new Promise<void>(done => setTimeout(done, 0));
      }
      if (seen.length !== run.nodes.length) expect(() => f.service.finishGradeRecordedContext(handle)).toThrow(/incomplete/);
    }
    const context = f.service.finishGradeRecordedContext(handle);
    expect(seen).toEqual(run.nodes.map(node => node.id)); expect(seen.length).toBeGreaterThan(32);
    expect(JSON.stringify(image(context))).toBe(expected);
  });

  it.each([false, true])("steps the actual Review population with the original normalized sources: black=%s", async black => {
    const f = fixture(black), capture = vi.spyOn(RecordedGradeSourceOwner.prototype, "reviewPopulation");
    try {
      let modern = f.run;
      for (const [index, node] of f.run.nodes.entries()) modern = attachDelivery(modern, node.id, evaluationDelivery(node.fen, index === 0 ? "cp 20" : "cp -300"));
      f.storage.save(modern, f.lease);
      await f.service.review(f.run.id, f.principal);
      expect(capture).toHaveBeenCalledTimes(1);
      const [context, input] = capture.mock.calls[0]!;
      const expected = capture.mock.results[0]!.value;
      const handle = f.service.beginReviewSourcePopulation(context, input);
      expect(() => f.service.finishReviewSourcePopulation(handle)).toThrow(/incomplete/);
      for (let index = 0; index < f.run.nodes.length; index++) {
        const progress = f.service.advanceReviewSourcePopulation(handle);
        expect(progress.completedSubjects).toBe(index + 1);
        expect(progress.complete).toBe(index + 1 === f.run.nodes.length);
      }
      const actual = f.service.finishReviewSourcePopulation(handle);
      expect(JSON.stringify(reviewSources.readRecordedReviewSourcePopulation(actual).results))
        .toBe(JSON.stringify(reviewSources.readRecordedReviewSourcePopulation(expected).results));
      expect(reviewSources.readRecordedLastLevelPopulation(reviewSources.readRecordedReviewSourcePopulation(actual).lastLevelPopulation).rows
        .every(row => row.provider?.kind === "delivered" && row.state.kind === "available")).toBe(true);
      const changed = new Map(input.engine), root = f.run.nodes[0]!;
      changed.set(root.id, { kind: "delivered", delivery: invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(root.fen, "cp 999") }) });
      expect(() => f.service.beginReviewSourcePopulation(context, { ...input, engine: changed })).toThrow(/changed its original modern attachment/);
      expect(f.service.cancelReviewSourcePopulation(handle)).toBe(false);
      expect(() => f.service.finishReviewSourcePopulation(handle)).toThrow(/foreign or retired/);
    } finally { capture.mockRestore(); }
  });

  it.each(["before", "during", "finish"] as const)("rechecks real revoked access at the %s collection boundary", phase => {
    const f = fixture(false, { before: null, after: null }), reader = { learnerId: "collection-reader", handle: "collection-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: "2026-11-12T00:00:00.000Z" });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, "2026-11-12T00:00:00.000Z");
    const context = f.service.resolveGradeRecordedContext(f.run.id, reader, null, f.query, f.controller.signal);
    const handle = f.service.beginReviewSourcePopulation(context, { engine: new Map(), shapes: [] });
    if (phase === "before") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    if (phase === "finish") {
      for (let index = 0; index < f.run.nodes.length; index++) f.service.advanceReviewSourcePopulation(handle);
      const original = reviewSources.finishRecordedReviewSourceCollection;
      const finish = vi.spyOn(reviewSources, "finishRecordedReviewSourceCollection").mockImplementation(input => {
        const population = original(input); f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease); return population;
      });
      try { expect(() => f.service.finishReviewSourcePopulation(handle)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" })); }
      finally { finish.mockRestore(); }
    } else {
      const original = routes.invokeEvidenceValueRoute;
      let revoked = false;
      const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((...args: Parameters<typeof original>) => {
        const result = original(...args);
        if (phase === "during" && !revoked) { f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease); revoked = true; }
        return result;
      }) as typeof original);
      try { expect(() => f.service.advanceReviewSourcePopulation(handle)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" })); }
      finally { dispatch.mockRestore(); }
    }
    expect(f.service.cancelReviewSourcePopulation(handle)).toBe(false);
  });

  it("retires aborted or cancelled work without crossing another actual service owner", () => {
    const f = fixture(false, { before: null, after: null }), other = fixture(true, { before: null, after: null });
    const handle = f.service.beginReviewSourcePopulation(f.resolve(), { engine: new Map(), shapes: [] });
    expect(() => other.service.advanceReviewSourcePopulation(handle)).toThrow(/foreign or retired/);
    expect(other.service.cancelReviewSourcePopulation(handle)).toBe(false);
    expect(() => f.service.advanceReviewSourcePopulation({ ...handle })).toThrow(/foreign or retired/);
    f.controller.abort();
    expect(() => f.service.advanceReviewSourcePopulation(handle)).toThrow(expect.objectContaining({ name: "AbortError" }));
    expect(f.service.cancelReviewSourcePopulation(handle)).toBe(false);
    const current = other.service.beginReviewSourcePopulation(other.resolve(), { engine: new Map(), shapes: [] });
    other.service.advanceReviewSourcePopulation(current);
    expect(other.service.cancelReviewSourcePopulation(current)).toBe(true);
    expect(other.service.cancelReviewSourcePopulation(current)).toBe(false);
  });

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
