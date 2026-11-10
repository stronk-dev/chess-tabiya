// Accepted profile-choice-facts §1: actual SQLite claims and source factories, no fake owner.
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { rmSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appendOpponentPly, commitMove, type DrillRun } from "@chess-tabiya/runtime";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute, originalRecordedStyleValueInput } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { isFoundationRecordedDecision, readFoundationRecordedDecision, readFoundationClaimedChoiceDecision } from "../../../packages/runtime/src/recorded-foundation-source.js";
import { RECORDED_FOUNDATION_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-foundation-source-authority.js";
import { readProfileGameSource, selectProfileChoiceDecision } from "./profile-game-source.js";
import { LongitudinalStore } from "./longitudinal-store.js";
import { RunService } from "./service.js";
import { LiveSessionService } from "./live-session.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { consumeProfileChoiceFacts } from "./profile-choice-facts.js";
import { parseLongitudinalChoiceFactRow } from "./profile-choice-facts-contract.js";
import { readProfileChoiceFactOwner } from "./profile-choice-facts-authority.js";
import { collectProfileChoicePopulation, preflightProfileChoiceFacts } from "../../../packages/runtime/src/internal/profile-choice-facts.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { decisionTraitPopulation } from "../../../packages/runtime/src/style-atoms.js";
import * as bindingExecution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as valueRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { projectObservations } from "./longitudinal-projector.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { AT, FIXTURE_DEPENDENCIES, fileFixture, learner, play, positionRun, type FileFixture } from "./longitudinal-test-fixtures.js";

const fixtures: FileFixture[] = [], databases: DatabaseSync[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const db of databases.splice(0)) db.close();
  for (const f of fixtures.splice(0)) { f.storage.close(); rmSync(dirname(f.path), { recursive: true, force: true }); }
});

describe("exact four-source choice consumer and closed row", () => {
  it("retains every original primary owner decision and exact legacy math", () => {
    const f = fixture(), s = acquire(f);
    const row = consumeProfileChoiceFacts(s.image, { gameSource: s.scope, derivedRev: s.claim.derivedRev });
    expect(readProfileChoiceFactOwner(row)).toEqual({ image: s.image, scope: s.scope });
    expect(() => readProfileChoiceFactOwner(parseLongitudinalChoiceFactRow(row))).toThrow(/OWNER_INVALID/u);
    expect(row.cohort.kind).toBe("eligible");
    if (row.cohort.kind !== "eligible") throw Error("expected complete choices");
    expect(row.cohort.decisions).toHaveLength(4);
    for (const value of row.cohort.decisions) {
      if (value.result.kind !== "available") throw Error(value.result.reason);
      const old = decisionTraitPopulation(value.beforeFen, value.moveUci)!;
      expect(value.result.legalUcis).toEqual(old.legalUcis);
      expect(value.result.chosen).toEqual(old.played);
      for (const key of ["pawn", "centerPawn", "queen"] as const) expect(value.result.counts[key] / value.result.legalUcis.length).toBe(old.share[key]);
    }
  });

  it("absent context keeps all original decision metadata and reports unknown instead of zero", () => {
    const f = fixture(), s = acquire(f);
    const row = consumeProfileChoiceFacts(s.image, { derivedRev: s.claim.derivedRev });
    expect(row.cohort).toMatchObject({ kind: "eligible", decisions: Array.from({ length: 4 }, () => ({ result: { kind: "unavailable", reason: "source_context_unavailable" } })) });
    expect(() => consumeProfileChoiceFacts({ ...s.image }, { gameSource: s.scope, derivedRev: s.claim.derivedRev })).toThrow(/original image/u);
    expect(() => consumeProfileChoiceFacts(s.image, { gameSource: s.scope, derivedRev: s.claim.derivedRev + 1 })).toThrow(/revision/u);
  });

  it.each([0, 1, 2, 3])("refuses a crossed binding at source index%i before any factory", index => {
    const bindings = PRIMARY_EVIDENCE_MANIFEST.bindings.map(binding => binding.consumer.id === "profile.choice_facts"
      && binding.adapter.id === `adapter.profile.choice_facts.${index + 1}` ? { ...binding, forms: ["panel" as const] } : binding);
    const spy = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute");
    expect(() => preflightProfileChoiceFacts({ ...PRIMARY_EVIDENCE_MANIFEST, bindings })).toThrow();
    expect(spy).not.toHaveBeenCalled();
  });

  it("the actual consumer preflights its complete machine binding before collecting", () => {
    const f = fixture(), s = acquire(f), spy = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute");
    vi.spyOn(bindingExecution, "compileEvidenceConsumerExecution").mockImplementation(() => { throw Error("controlled missing machine binding"); });
    expect(() => consumeProfileChoiceFacts(s.image, { gameSource: s.scope, derivedRev: s.claim.derivedRev })).toThrow(/machine binding/u);
    expect(spy).not.toHaveBeenCalled();
  });

  it("parser refuses inconsistent counts, guessed flags, aliases and executable arrays", () => {
    const f = fixture(), s = acquire(f), row = consumeProfileChoiceFacts(s.image, { gameSource: s.scope, derivedRev: s.claim.derivedRev });
    if (row.cohort.kind !== "eligible") throw Error("expected choices");
    const fresh = () => JSON.parse(JSON.stringify(row));
    for (const mutate of [
      (r: ReturnType<typeof fresh>) => { r.cohort.decisions[0].result.counts.pawn = 999; },
      (r: ReturnType<typeof fresh>) => { r.cohort.decisions[0].result.counts.centerPawn = r.cohort.decisions[0].result.counts.pawn + 1; },
      (r: ReturnType<typeof fresh>) => { r.cohort.decisions[0].result.chosen.queen = true; },
      (r: ReturnType<typeof fresh>) => { r.cohort.decisions[0].result.legalUcis.push("e2e4"); },
      (r: ReturnType<typeof fresh>) => { r.cohort.decisions[0].result = { kind: "unavailable", reason: "source_unavailable" }; },
      (r: ReturnType<typeof fresh>) => { r.cohort.decisions[0].ref.sourcePly = r.cohort.decisions[1].ref.sourcePly; },
    ]) { const changed = fresh(); mutate(changed); expect(() => parseLongitudinalChoiceFactRow(changed)).toThrow(/CHOICE_ROW_INVALID/u); }
    const changed = fresh(), getter = vi.fn(() => "e2e4");
    Object.defineProperty(changed.cohort.decisions[0].result.legalUcis, "0", { get: getter });
    expect(() => parseLongitudinalChoiceFactRow(changed)).toThrow(/CHOICE_ROW_INVALID/u); expect(getter).not.toHaveBeenCalled();
  });

  it.each([
    ["7k/8/8/8/8/P7/8/7K w - - 0 1", "a3a4", 4, 1],
    ["7k/8/8/8/8/P7/8/6K1 w - - 0 1", "a3a4", 6, 1],
    ["7k/8/8/8/8/8/6q1/7K w - - 0 1", "h1g2", 1, 0],
    ["rr5k/8/8/8/8/8/2Q5/K7 w - - 0 1", "c2a2", 2, 0],
  ] as const)("actual original worker decision retains the complete set: %s", (fen, moveUci, n, pawn) => {
    const f = fixture(play(positionRun("choice-population", fen), moveUci)), s = acquire(f);
    const value = collectProfileChoicePopulation(s.choice(0));
    expect(value.legalUcis).toHaveLength(n); expect(value.counts.pawn).toBe(pawn);
    const old = decisionTraitPopulation(fen, moveUci)!;
    expect(value.chosen).toEqual(old.played);
    for (const key of ["pawn", "centerPawn", "queen"] as const) expect(value.counts[key] / n).toBe(old.share[key]);
  });
});
function fixture(run = play(positionRun("choice-source"), "e2e4", "e7e5", "d1e2", "d8e7")) {
  const f = fileFixture("tabiya-choice-source-"); fixtures.push(f);
  const lease = learner(f.storage, "choice-source-owner"); f.storage.create(run, lease);
  const db = new DatabaseSync(f.path); db.exec("PRAGMA foreign_keys=ON"); databases.push(db);
  return { ...f, lease, db, run, store: new LongitudinalStore(db, { now: () => f.clock.now }) };
}
function acquire(f: ReturnType<typeof fixture>) {
  const claim = f.store.claimBatch({ workerId: "choice-source-worker", scanLimit: 1, slots: 1, leaseMs: 60_000 })[0]!;
  const image = f.store.claimSourceImage(claim)!;
  const scope = f.store.openClaimedGameSource(claim, image);
  const ref = (beforeIndex: number) => {
    const member = readProfileGameSource(scope).path[beforeIndex + 1]!;
    return { kind: "move" as const, nodeId: member.nodeId, eventSeq: member.creation.seq };
  };
  const choice = (beforeIndex: number) => {
    const result = selectProfileChoiceDecision(scope, ref(beforeIndex));
    if (result.kind !== "available") throw new Error(result.reason);
    return result.decision;
  };
  return { claim, image, scope, ref, choice };
}
function role(fen: string, moveUci: string) {
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
  const result = invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci });
  if (result.kind !== "available") throw new Error(result.reason); return result.value;
}
function queen(decision: ReturnType<ReturnType<typeof acquire>["choice"]>, candidate: ReturnType<typeof role>) {
  const result = invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate });
  if (result.kind !== "available") throw new Error(result.reason); return result.value;
}

describe("original claimed choice decisions", () => {
  it.each([2, 3])("proves the actual owner MOVE at rooted index%i independently of configured board color", index => {
    const f = fixture(), s = acquire(f), decision = s.choice(index);
    const data = readFoundationClaimedChoiceDecision(decision), before = f.run.nodes[index]!, after = f.run.nodes[index + 1]!;
    expect(data.authority).toMatchObject({ ownerLearnerId: f.lease.learnerId, derivedRev: s.claim.derivedRev,
      sourceDigest: s.claim.claimedSourceDigest, selected: { nodeId: before.id, sourcePly: index },
      after: { nodeId: after.id, sourcePly: index + 1 }, eventSeq: s.ref(index).eventSeq, moveUci: after.moveUci });
    const values = queen(decision, role(before.fen, after.moveUci!));
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ runId: f.run.id, beforeNodeId: before.id, sourcePly: index,
      turn: index === 2 ? "white" : "black", moveUci: after.moveUci });
    const original = originalRecordedStyleValueInput(values[0]!);
    expect(original.kind).toBe("candidate");
    if (original.kind === "candidate") expect(original.decision).toBe(decision);
  });

  it("takes the original BEFORE index15/16, not FEN move count or generic phase", () => {
    const line = ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "d2d3", "d7d6",
      "b1c3", "g8f6", "a2a3", "a7a6", "h2h3", "h7h6", "d1e2", "d8e7", "e2d1"];
    const f = fixture(play(positionRun("choice-boundary"), ...line)), s = acquire(f);
    for (const index of [15, 16]) {
      const before = f.run.nodes[index]!, after = f.run.nodes[index + 1]!;
      const values = queen(s.choice(index), role(before.fen, after.moveUci!));
      expect(values).toHaveLength(index === 15 ? 1 : 0);
      if (index === 15) expect(values[0]!.payload.sourcePly).toBe(15);
    }
  });

  it("retains genuine nonqueen empty outcomes without inventing unavailable", () => {
    const f = fixture(), s = acquire(f);
    expect(queen(s.choice(0), role(f.run.nodes[0]!.fen, "e2e4"))).toEqual([]);
  });

  it("permits an actual offered queen alternative without claiming it was the chosen move", () => {
    const f = fixture(), s = acquire(f), candidate = role(f.run.nodes[2]!.fen, "d1h5");
    expect(queen(s.choice(2), candidate)[0]!.payload.moveUci).toBe("d1h5");
    expect(readFoundationClaimedChoiceDecision(s.choice(2)).authority.moveUci).toBe("d1e2");
  });

  it("hashes actual worker context rather than an opaque empty handle", () => {
    const f = fixture(), a = acquire(f), g = fixture(play(positionRun("choice-other"), "e2e4", "e7e5", "d1e2", "d8e7")), b = acquire(g);
    const candidate = role(f.run.nodes[2]!.fen, "d1e2");
    const left = queen(a.choice(2), candidate)[0]!, right = queen(b.choice(2), candidate)[0]!;
    expect(left.payload.runId).not.toBe(right.payload.runId);
    expect(evidenceValueReceipt(left).inputDigest).not.toBe(evidenceValueReceipt(right).inputDigest);
  });

  it("keeps copied/foreign/retired handles out of factories and all live readers", () => {
    const f = fixture(), s = acquire(f), decision = s.choice(2), candidate = role(f.run.nodes[2]!.fen, "d1e2");
    const value = queen(decision, candidate)[0]!;
    expect(isFoundationRecordedDecision(decision)).toBe(false);
    expect(() => readFoundationRecordedDecision(decision as never)).toThrow();
    expect(() => RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueDecision(readProfileGameSource(s.scope).prefix, f.run.nodes[2]!.id)).toThrow(/cannot issue live/u);
    expect(() => RECORDED_FOUNDATION_SOURCE_AUTHORITY.issueOccurrenceContext(decision as never, { kind: "candidate" }, "learner", () => {})).toThrow();
    expect(() => queen({ ...decision } as typeof decision, candidate)).toThrow();
    expect(() => selectProfileChoiceDecision({ ...s.scope }, s.ref(2))).toThrow();
    expect(() => selectProfileChoiceDecision(s.scope, { ...s.ref(2), eventSeq: s.ref(3).eventSeq })).toThrow();
    expect(() => queen(decision, role(f.run.nodes[0]!.fen, "e2e4"))).toThrow();
    f.store.closeGameSource(s.scope);
    expect(() => queen(decision, candidate)).toThrow();
    expect(() => originalRecordedStyleValueInput(value)).toThrow();
  });

  it("survives actual renewal and sticks retired after observed abandonment", () => {
    const f = fixture(), s = acquire(f), decision = s.choice(2), candidate = role(f.run.nodes[2]!.fen, "d1e2");
    f.clock.now += 1_000;
    const renewed = f.store.renew(s.claim, 60_000)!;
    expect(queen(decision, candidate)).toHaveLength(1);
    expect(f.store.abandon(renewed)).toBe(true);
    expect(() => readFoundationClaimedChoiceDecision(decision)).toThrow();
    expect(() => readFoundationClaimedChoiceDecision(decision)).toThrow(/retired/u);
  });

  it("does not promote the actual academy owner-teacher MOVE into learner role", () => {
    const initial = positionRun("choice-academy"), f = fixture(initial);
    f.storage.createClassroom({ id: "choice-class", ownerLearnerId: f.lease.learnerId, name: "Actual teacher", createdAt: AT, archivedAt: null });
    const principal = { learnerId: f.lease.learnerId, handle: f.lease.learnerId };
    new LiveSessionService(f.storage, { runService: new RunService(f.storage), now: () => AT }).create(principal,
      { runId: initial.id, kind: "academy", title: "Teacher demonstration", classroomId: "choice-class" });
    f.run = play(initial, "e2e4"); f.storage.save(f.run, f.lease);
    const s = acquire(f);
    expect(normativeDecisions(s.image, f.run)).toContainEqual(expect.objectContaining({ decisionClass: "played", ref: s.ref(0) }));
    expect(s.image.structureAttribution).not.toBe("single_player");
    expect(selectProfileChoiceDecision(s.scope, s.ref(0))).toEqual({ kind: "unavailable", reason: "role_unavailable" });
  });

  it("rejects opponent actions even though their primary edge is otherwise genuine", () => {
    let run: DrillRun = commitMove(positionRun("choice-opponent"), "e2e4", { at: AT }).run;
    run = appendOpponentPly(run, { moveUci: "e7e5", policyModeApplied: "enumerated",
      engine: { id: "scripted", name: "Scripted test", version: "1", seedHonored: true } }, { at: AT }).run;
    const f = fixture(run), s = acquire(f);
    expect(() => selectProfileChoiceDecision(s.scope, s.ref(1))).toThrow(/owner decision/u);
  });

  it("actual completion and rebuild keep stable source identity but retire each original invocation", () => {
    const f = fixture();
    const candidate = role(f.run.nodes[2]!.fen, "d1e2");
    let original: ReturnType<typeof queen>[number] | undefined, rebuilt: typeof original;
    const issue = (scope: Parameters<typeof selectProfileChoiceDecision>[0]) => {
      const member = readProfileGameSource(scope).path[3]!;
      const result = selectProfileChoiceDecision(scope, { kind: "move", nodeId: member.nodeId, eventSeq: member.creation.seq });
      if (result.kind !== "available") throw Error(result.reason);
      return queen(result.decision, candidate)[0]!;
    };
    const result = runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "actual-choice-worker", {
      project: (image, checkpoint, gameSource) => {
        original = issue(gameSource);
        return projectObservations(image, { checkpoint, gameSource, dependencies: FIXTURE_DEPENDENCIES });
      },
    });
    expect(result.completed).toBe(1); expect(original).toBeDefined();
    expect(() => originalRecordedStyleValueInput(original!)).toThrow();
    const report = f.store.rebuild({ write: false, project: (image, { gameSource }) => {
      rebuilt = issue(gameSource);
      return projectObservations(image, { gameSource, dependencies: FIXTURE_DEPENDENCIES });
    } });
    expect(report.checked).toBe(1); expect(report.mismatches).toEqual([]);
    expect(rebuilt!.payload).toEqual(original!.payload);
    expect(evidenceValueReceipt(rebuilt!).inputDigest).toBe(evidenceValueReceipt(original!).inputDigest);
    expect(() => originalRecordedStyleValueInput(rebuilt!)).toThrow();
  });

  for (const outcome of ["failure", "drain"] as const) it(`the actual worker retires choice evidence after ${outcome}`, () => {
    const f = fixture(); let captured: ReturnType<typeof queen>[number] | undefined, drain = false;
    const result = runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, `choice-${outcome}`, {
      drainRequested: () => drain,
      project: (_image, checkpoint, scope) => {
        const member = readProfileGameSource(scope).path[3]!;
        const selected = selectProfileChoiceDecision(scope, { kind: "move", nodeId: member.nodeId, eventSeq: member.creation.seq });
        if (selected.kind !== "available") throw Error(selected.reason);
        captured = queen(selected.decision, role(f.run.nodes[2]!.fen, "d1e2"))[0]!;
        if (outcome === "failure") throw Error("controlled source worker failure");
        drain = true; checkpoint(); throw Error("unreachable after drain");
      },
    });
    expect(outcome === "failure" ? result.failed : result.abandoned).toBe(1);
    expect(captured).toBeDefined();
    expect(() => originalRecordedStyleValueInput(captured!)).toThrow();
  });
});
