// Actual SQLite claim + original source + complete factories. No caller collectors/row mint.
import { DatabaseSync } from "node:sqlite";
import { LongitudinalStore } from "./longitudinal-store.js";
import { rmSync } from "node:fs";
import { dirname } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeProfileSubjectFacts, assertProfileSubjectFactOwner } from "./profile-subject-facts.js";
import { selectProfileSubjectDecision } from "./profile-game-source.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { fileFixture, learner, play, positionRun, predict, importedRun, type FileFixture } from "./longitudinal-test-fixtures.js";
import type { DrillRun } from "@chess-tabiya/runtime";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { preflightProfileSubjectFacts } from "../../../packages/runtime/src/internal/profile-subject-facts.js";
import * as candidateSource from "../../../packages/runtime/src/candidate-population.js";
import * as bindingExecution from "../../../packages/runtime/src/evidence-binding-execution.js";
const fixtures: FileFixture[] = [], databases: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const db of databases.splice(0)) db.close(); for (const f of fixtures.splice(0)) { f.storage.close(); rmSync(dirname(f.path), { recursive: true, force: true }); } });
function acquire(run: DrillRun) {
  const f = fileFixture("tabiya-subject-source-"); fixtures.push(f);
  const lease = learner(f.storage, "subject-owner"); f.storage.create(run, lease);
  const db = new DatabaseSync(f.path); db.exec("PRAGMA foreign_keys=ON"); databases.push(db);
  const store = new LongitudinalStore(db, { now: () => f.clock.now });
  const claim = store.claimBatch({ workerId: "subject-worker", scanLimit: 1, slots: 1, leaseMs: 60_000 })[0]!;
  const image = store.claimSourceImage(claim)!, scope = store.openClaimedGameSource(claim, image);
  return { f, store, claim, image, scope, options: { gameSource: scope, derivedRev: claim.derivedRev } };
}
const capture = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
describe("original complete subject machine consumption", () => {
  it("retains true/false per-subject relations under the original owner decision and source cut", () => {
    const run = play(positionRun("subject-capture", capture), "c4d5"), s = acquire(run), checkpoint = vi.fn();
    const collect = vi.spyOn(candidateSource, "compileCandidatePopulation");
    const rows = consumeProfileSubjectFacts(s.image, { ...s.options, checkpoint });
    expect(collect).toHaveBeenCalledTimes(1);
    expect(rows.length).toBeGreaterThan(0);
    const doubled = rows.filter(r => r.projectionId === "derived.semantic_avoidance.doubled_pawn" && r.subject.kind === "doubled_pawn" && r.subject.color === "white" && r.subject.file === "d");
    expect(doubled).toMatchObject([
      { sourceKind: "condition_relation", relation: "false_to_false", occurred: false },
      { sourceKind: "condition_relation", relation: "false_to_true", occurred: true },
    ]);
    const decision = normativeDecisions(s.image, run)[0]!;
    expect(rows.every(r => JSON.stringify(r.decisionRef) === JSON.stringify(decision.ref) && r.actor === "white" && r.phase === decision.phase && r.derivedRev === s.claim.derivedRev)).toBe(true);
    expect(() => assertProfileSubjectFactOwner(rows, s.image, s.scope, s.claim.derivedRev)).not.toThrow();
    for (const copy of [[...rows], rows.slice(1), [...rows].reverse(), rows.map(r => ({ ...r }))]) expect(() => assertProfileSubjectFactOwner(copy, s.image, s.scope, s.claim.derivedRev)).toThrow("OWNER_INVALID");
    expect(Object.isFrozen(rows)).toBe(true); expect(Object.isFrozen(rows[0])).toBe(true);
    expect(checkpoint.mock.calls).toEqual([[0, 1], [1, 1]]);
  });
  it("genuine forced/empty arrays remain source-owned, not copied known-zero successes", () => {
    const s = acquire(play(positionRun("subject-forced", "7k/8/8/8/8/8/6q1/7K w - - 0 1"), "h1g2"));
    const rows = consumeProfileSubjectFacts(s.image, s.options);
    expect(rows).toEqual([]);
    expect(() => assertProfileSubjectFactOwner(rows, s.image, s.scope, s.claim.derivedRev)).not.toThrow();
    expect(() => assertProfileSubjectFactOwner([], s.image, s.scope, s.claim.derivedRev)).toThrow();
    s.store.closeGameSource(s.scope);
    expect(() => assertProfileSubjectFactOwner(rows, s.image, s.scope, s.claim.derivedRev)).toThrow();
  });
  it("keeps a whole genuinely incomplete decision unavailable instead of publishing other family rows", () => {
    const s = acquire(play(positionRun("subject-incomplete", "r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1"), "e1f1"));
    expect(consumeProfileSubjectFacts(s.image, s.options)).toEqual([]);
  });
  it("refuses source/image/revision/decision copies and cross cuts before acquiring a packet", () => {
    const s = acquire(play(positionRun("subject-owner", capture), "h1g1"));
    const spy = vi.spyOn(candidateSource, "compileCandidatePopulation");
    expect(() => consumeProfileSubjectFacts({ ...s.image }, s.options)).toThrow(/original image/u);
    expect(() => consumeProfileSubjectFacts(s.image, { ...s.options, derivedRev: s.claim.derivedRev + 1 })).toThrow(/revision/u);
    expect(() => consumeProfileSubjectFacts(s.image, { ...s.options, gameSource: { ...s.scope } })).toThrow();
    expect(() => selectProfileSubjectDecision(s.scope, { kind: "move", nodeId: "not-original", eventSeq: 2 })).toThrow();
    expect(spy).not.toHaveBeenCalled();
    const rows = consumeProfileSubjectFacts(s.image, s.options);
    const other = acquire(play(positionRun("subject-other", capture), "h1g1"));
    expect(() => assertProfileSubjectFactOwner(rows, other.image, other.scope, other.claim.derivedRev)).toThrow();
  });
  it("uses actual root turn for prediction and imported-game cohorts", () => {
    const predicted = positionRun("subject-prediction", capture, "black");
    const s = acquire(predict(predicted, predicted.nodes[0]!.id, "c", "c4d5"));
    const rows = consumeProfileSubjectFacts(s.image, s.options);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.actor === "white" && r.decisionClass === "predicted" && r.decisionRef.kind === "prediction")).toBe(true);
    const imported = acquire(importedRun("subject-import", ["e2e4", "e7e5"], "black"));
    const gameRows = consumeProfileSubjectFacts(imported.image, imported.options);
    expect(gameRows.length).toBeGreaterThan(0);
    expect(gameRows.every(r => r.actor === "black" && r.decisionClass === "game")).toBe(true);
  });
  it("snapshots the original claim before a callback can switch two genuine same-reference sources", () => {
    const aRun = play(positionRun("same-subject-run", capture), "c4d5");
    const bRun = play(positionRun("same-subject-run", "7k/8/8/3p1p2/2P5/8/3P4/7K w - - 0 1"), "c4d5");
    const a = acquire(aRun), b = acquire(bRun);
    expect(normativeDecisions(a.image, aRun)[0]!.ref).toEqual(normativeDecisions(b.image, bRun)[0]!.ref);
    const expected = consumeProfileSubjectFacts(a.image, a.options), collect = vi.spyOn(candidateSource, "compileCandidatePopulation");
    const mutable = { ...a.options, checkpoint: (completed: number) => { mutable.gameSource = completed === 0 ? b.scope : a.scope; mutable.derivedRev = 999; } };
    const rows = consumeProfileSubjectFacts(a.image, mutable);
    expect(rows).toEqual(expected);
    expect(collect).toHaveBeenCalledTimes(1);
    expect(collect.mock.calls[0]![0].beforeFen).toBe(capture);
    expect(() => assertProfileSubjectFactOwner(rows, a.image, a.scope, a.claim.derivedRev)).not.toThrow();
    expect(() => assertProfileSubjectFactOwner(rows, b.image, b.scope, b.claim.derivedRev)).toThrow();
  });
  it("refuses executable source options without calling their getters", () => {
    const s = acquire(play(positionRun("subject-options", capture), "c4d5"));
    let reads = 0;
    const options = { ...s.options };
    Object.defineProperty(options, "gameSource", { enumerable: true, get: () => { reads++; return s.scope; } });
    expect(() => consumeProfileSubjectFacts(s.image, options)).toThrow(/own-data/u);
    expect(reads).toBe(0);
  });
  it.each(Array.from({ length: 54 }, (_, i) => i + 1))("refuses a wrong binding at index%i before acquisition", index => {
    const bindings = PRIMARY_EVIDENCE_MANIFEST.bindings.map(b => b.adapter.id === `adapter.profile.subject_observations.${index}` ? { ...b, forms: ["panel" as const] } : b);
    expect(() => preflightProfileSubjectFacts({ ...PRIMARY_EVIDENCE_MANIFEST, bindings })).toThrow();
  });
  it("retains one threat-only input and refuses answer relabeling for every other fact source", () => {
    preflightProfileSubjectFacts();
    const bindings = PRIMARY_EVIDENCE_MANIFEST.bindings.filter(b => b.consumer.id === "profile.subject_observations");
    expect(bindings).toHaveLength(54);
    expect(bindings.filter(b => b.answerContent.includes("threat")).map(b => b.projection)).toEqual([{ id: "rules.tactic.event.double_attack", version: 1 }]);
    for (const target of bindings) {
      const changed = PRIMARY_EVIDENCE_MANIFEST.bindings.map(b => b === target ? { ...b, answerContent: [target.projection.id === "rules.tactic.event.double_attack" ? "fact" as const : "threat" as const] } : b);
      expect(() => preflightProfileSubjectFacts({ ...PRIMARY_EVIDENCE_MANIFEST, bindings: changed })).toThrow();
    }
  });
  it("actual reducer preflights its declared machine consumer before acquiring source work", () => {
    const s = acquire(play(positionRun("subject-preflight", capture), "c4d5")), spy = vi.spyOn(candidateSource, "compileCandidatePopulation");
    vi.spyOn(bindingExecution, "compileEvidenceConsumerExecution").mockImplementation(() => { throw Error("controlled missing machine binding"); });
    expect(() => consumeProfileSubjectFacts(s.image, s.options)).toThrow(/machine binding/u);
    expect(spy).not.toHaveBeenCalled();
  });
});
