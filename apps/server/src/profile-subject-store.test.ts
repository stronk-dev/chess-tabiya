// Genuine six-family SQLite publication/read/rebuild; source proofs are never caller-issued.
import { DatabaseSync } from "node:sqlite";
import { rmSync } from "node:fs";
import { dirname } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { LongitudinalStore } from "./longitudinal-store.js";
import { decisionPopulation, projectObservations } from "./longitudinal-projector.js";
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import { parseLongitudinalReadQuery } from "./longitudinal-contract.js";
import { subjectObservationKey } from "./profile-subject-facts-contract.js";
import { AT, fileFixture, learner, play, positionRun, type FileFixture } from "./longitudinal-test-fixtures.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";
import * as candidate from "../../../packages/runtime/src/candidate-population.js";
import { serializeAccountBundle } from "./account-data.js";
import { readPortableAccountBundle, planAccountRestore } from "./account-import.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
const capture = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
const fixtures: FileFixture[] = [], dbs: DatabaseSync[] = [], reopened: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const d of dbs.splice(0)) d.close(); for (const d of reopened.splice(0)) d.close(); for (const f of fixtures.splice(0)) { f.storage.close(); rmSync(dirname(f.path), { recursive: true, force: true }); } });
function fixture(id = "subject-store", fen = capture, uci = "c4d5") {
  const f = fileFixture("tabiya-subject-store-"); fixtures.push(f);
  const lease = learner(f.storage, "subject-store-owner"), run = play(positionRun(id, fen), uci);
  f.storage.create(run, lease);
  const db = new DatabaseSync(f.path); db.exec("PRAGMA foreign_keys=ON"); dbs.push(db);
  const store = new LongitudinalStore(db, { now: () => f.clock.now });
  return { ...f, lease, run, db, store };
}
function acquire(f: ReturnType<typeof fixture>) {
  const claim = f.store.claimBatch({ workerId: "subject-store-worker", scanLimit: 1, slots: 1, leaseMs: 60_000 })[0]!;
  const image = f.store.claimSourceImage(claim)!, scope = f.store.openClaimedGameSource(claim, image);
  const projection = projectObservations(image, { gameSource: scope });
  return { claim, image, scope, projection };
}
function query(f: ReturnType<typeof fixture>, extra: Record<string, unknown> = {}) {
  return parseLongitudinalReadQuery({ learnerId: f.lease.learnerId, derivationRev: OBSERVATION_DERIVATION_REV,
    through: { kind: "runs", cuts: [{ runId: f.run.id, requestedSeq: f.run.events.length }] }, filter: {}, ...extra });
}
const n = (f: ReturnType<typeof fixture>, table: string) => Number(f.db.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n);
const families = ["learner_observation_denominators", "learner_observations", "learner_structure_stats", "learner_game_facts", "learner_choice_facts", "learner_subject_observations"] as const;

describe("same-cut subject storage adoption", () => {
  it("uses exactly one complete population and publishes/reads all six families at revision9", () => {
    const f = fixture(), compile = vi.spyOn(candidate, "compileCandidatePopulation"), s = acquire(f);
    expect(STORAGE_VERSION).toBe(35); expect(OBSERVATION_DERIVATION_REV).toBe(9);
    expect(compile).toHaveBeenCalledTimes(1);
    expect(s.projection.denominators).toMatchObject([{ decisions: 1, derivedRev: 9 }]);
    expect(s.projection.subjectObservations.length).toBeGreaterThan(0);
    expect(f.store.publish(s.claim, s.projection)).toBe("published");
    expect(f.store.job(f.run.id)).toMatchObject({ state: "complete", derivedRev: 9, completedSeq: f.run.events.length });
    const stored = f.store.storedProjection(f.run.id);
    expect(stored).toEqual(s.projection);
    const ordinary = f.store.readSnapshot(f.lease.learnerId!, query(f));
    expect(ordinary.kind === "complete" ? ordinary.subjectObservations : undefined).toEqual([]);
    const withSubjects = f.store.readSnapshot(f.lease.learnerId!, query(f, { includeSubjectObservations: true }));
    expect(withSubjects.kind).toBe("complete");
    if (withSubjects.kind !== "complete") throw Error("Expected complete cut");
    expect(withSubjects.subjectObservations).toEqual(s.projection.subjectObservations);
    expect(withSubjects.subjectObservations[0]).not.toBe(s.projection.subjectObservations[0]);
    expect(compile).toHaveBeenCalledTimes(1); // Saved read/source-domain join does not collect alternatives.
  });
  it("preserves the fixed34 complete-root prevalence arithmetic without a second production census", () => {
    const f = fixture(), s = acquire(f), old = decisionPopulation(capture, "c4d5");
    expect(old.kind).toBe("available"); if (old.kind !== "available") throw Error(old.reason);
    expect(old.memberships.size).toBe(s.projection.observations.length);
    for (const r of s.projection.observations) expect(old.memberships.get(`${r.projectionId}\0${r.projectionVersion}\0${r.semanticSign}\0${r.sourceSign}`))
      .toEqual({ opportunity: true, occurred: r.occurred === 1, share: r.alternativeShareSum });
  });
  it("applies exact OR subject filters while aggregate filters stay in their own lane", () => {
    const f = fixture(), s = acquire(f); f.store.publish(s.claim, s.projection);
    const rows = s.projection.subjectObservations, selected = rows.filter(r => r.sourceKind === "condition_relation" && r.projectionId === "derived.semantic_avoidance.doubled_pawn");
    expect(selected.length).toBeGreaterThan(0);
    const makeFilter = (r: typeof rows[number]) => ({ sourceKind: r.sourceKind, projection: { id: r.projectionId, version: r.projectionVersion }, subject: r.subject, parameters: r.parameters,
      actor: r.actor, ...(r.sourceKind === "condition_relation" ? { relation: r.relation } : { sign: r.sign }) });
    const result = f.store.readSnapshot(f.lease.learnerId!, query(f, { includeSubjectObservations: true, subjectFilters: selected.map(makeFilter),
      filter: { projections: [{ id: "rules.structural.event.king_zone", version: 1 }] } }));
    expect(result.kind === "complete" ? result.subjectObservations : []).toEqual(selected);
    const negative = f.store.readSnapshot(f.lease.learnerId!, query(f, { includeSubjectObservations: true,
      subjectFilters: [{ ...makeFilter(selected[0]!), actor: "black" }] }));
    expect(negative.kind === "complete" ? negative.subjectObservations : undefined).toEqual([]);
    expect(() => parseLongitudinalReadQuery({ ...query(f), subjectFilters: [makeFilter(selected[0]!)] })).toThrow();
    expect(() => query(f, { includeSubjectObservations: true, subjectFilters: [{ ...makeFilter(selected[0]!), sign: "gained" }] })).toThrow();
    expect(() => query(f, { includeSubjectObservations: true, subjectFilters: [{ ...makeFilter(selected[0]!), parameters: { invented: true } }] })).toThrow();
  });
  it("refuses substituted subject lists and forged denominator/prevalence rows before any write", () => {
    const f = fixture(), s = acquire(f), rows = s.projection.subjectObservations;
    for (const subjectObservations of [Object.freeze([...rows]), Object.freeze(rows.slice(1)), Object.freeze([...rows].reverse()), Object.freeze([...rows, rows[0]!])]) {
      expect(() => f.store.publish(s.claim, { ...s.projection, subjectObservations })).toThrow(/SUBJECT_ROW_OWNER_INVALID/u);
    }
    expect(() => f.store.publish(s.claim, { ...s.projection, denominators: Object.freeze([]) })).toThrow(/REDUCTION_MISMATCH/u);
    expect(() => f.store.publish(s.claim, { ...s.projection, denominators: Object.freeze(s.projection.denominators.map(r => Object.freeze({ ...r, decisions: r.decisions + 1 }))) })).toThrow(/REDUCTION_MISMATCH/u);
    expect(s.projection.observations.length).toBeGreaterThan(0);
    expect(() => f.store.publish(s.claim, { ...s.projection, observations: Object.freeze(s.projection.observations.slice(1)) })).toThrow(/REDUCTION_MISMATCH/u);
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(f.store.job(f.run.id)?.state).toBe("running");
    expect(f.store.publish(s.claim, s.projection)).toBe("published");
  });
  it.each([
    ["forced", "7k/8/8/8/8/8/6q1/7K w - - 0 1", "h1g2"],
    ["unavailable", "r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "e1f1"],
  ])("authentic empty %s subjects do not authorize changed or absent denominators", (name, fen, uci) => {
    const f = fixture(`subject-${name}`, fen, uci), s = acquire(f);
    expect(s.projection.subjectObservations).toEqual([]); expect(s.projection.observations).toEqual([]);
    expect(s.projection.denominators).toMatchObject([{ decisions: 1 }]);
    expect(() => f.store.publish(s.claim, { ...s.projection, denominators: Object.freeze([]) })).toThrow(/REDUCTION_MISMATCH/u);
    expect(() => f.store.publish(s.claim, { ...s.projection, denominators: Object.freeze(s.projection.denominators.map(r => Object.freeze({ ...r, decisions: 2 }))) })).toThrow(/REDUCTION_MISMATCH/u);
    expect(f.store.publish(s.claim, s.projection)).toBe("published");
  });
  it("D4182 refuses an executable envelope before a checked denominator can be swapped at insertion", () => {
    const f = fixture(), s = acquire(f), forged = { ...s.projection };
    let reads = 0;
    const wrong = Object.freeze(s.projection.denominators.map(r => Object.freeze({ ...r, decisions: r.decisions + 1 })));
    Object.defineProperty(forged, "denominators", { enumerable: true, get: () => ++reads <= 2 ? s.projection.denominators : wrong });
    expect(() => f.store.publish(s.claim, forged)).toThrow(/PROJECTION_IMAGE_INVALID/u);
    expect(reads).toBe(0);
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it("D4182 refuses a frozen-array proxy that changes its inherited iterator after checking", () => {
    const f = fixture(), s = acquire(f);
    let iterations = 0;
    const wrong = Object.freeze(s.projection.denominators.map(r => Object.freeze({ ...r, decisions: r.decisions + 1 })));
    const denominators = new Proxy(s.projection.denominators, { get(target, key, receiver) {
      if (key === Symbol.iterator) {
        const selected = ++iterations === 1 ? target : wrong;
        return selected[Symbol.iterator].bind(selected);
      }
      return Reflect.get(target, key, receiver);
    } });
    expect(Object.isFrozen(denominators)).toBe(true);
    expect(() => f.store.publish(s.claim, { ...s.projection, denominators })).toThrow(/PROJECTION_IMAGE_INVALID/u);
    expect(iterations).toBe(0);
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it("D4182 rejects nested row proxies and rebuild envelopes without executing their traps", () => {
    const f = fixture(), s = acquire(f); let gets = 0;
    const row = new Proxy(s.projection.denominators[0]!, { get(target, key, receiver) { gets++; return Reflect.get(target, key, receiver); } });
    expect(() => f.store.publish(s.claim, { ...s.projection, denominators: Object.freeze([row]) })).toThrow(/PROJECTION_IMAGE_INVALID/u);
    expect(gets).toBe(0);
    f.store.publish(s.claim, s.projection);
    expect(() => f.store.rebuild({ write: true, project: (image, { gameSource }) => {
      const p = projectObservations(image, { gameSource }), changed = { ...p };
      Object.defineProperty(changed, "subjectObservations", { enumerable: true, get: () => { gets++; return p.subjectObservations; } });
      return changed;
    } })).toThrow(/PROJECTION_IMAGE_INVALID/u);
    expect(gets).toBe(0);
    expect(f.store.storedProjection(f.run.id)).toEqual(s.projection);
  });
  it("rolls back all six families when subject insertion fails late", () => {
    const f = fixture(), s = acquire(f);
    f.db.exec("CREATE TRIGGER refuse_subject BEFORE INSERT ON learner_subject_observations BEGIN SELECT RAISE(ABORT,'controlled subject insertion'); END;");
    expect(() => f.store.publish(s.claim, s.projection)).toThrow("controlled subject insertion");
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]); expect(f.store.job(f.run.id)?.state).toBe("running");
    f.db.exec("DROP TRIGGER refuse_subject"); expect(f.store.publish(s.claim, s.projection)).toBe("published");
  });
  it("joins decoded rows to their original decision actor, without treating SQL bytes as original proof", () => {
    const f = fixture(), s = acquire(f); f.store.publish(s.claim, s.projection);
    f.db.exec("UPDATE learner_subject_observations SET actor='black' WHERE rowid=(SELECT MIN(rowid) FROM learner_subject_observations)");
    expect(() => f.store.readSnapshot(f.lease.learnerId!, query(f, { includeSubjectObservations: true }))).toThrow(/SOURCE_JOIN_INVALID/u);
    const compared = f.store.rebuild({ write: false, project: (image, { gameSource }) => projectObservations(image, { gameSource }) });
    expect(compared.mismatches.some(m => m.table === "learner_subject_observations")).toBe(true);
    expect(f.store.rebuild({ write: true, project: (image, { gameSource }) => projectObservations(image, { gameSource }) }).repaired).toBe(1);
    const repaired = f.store.readSnapshot(f.lease.learnerId!, query(f, { includeSubjectObservations: true }));
    expect(repaired.kind === "complete" ? repaired.subjectObservations : []).toEqual(s.projection.subjectObservations);
  });
  it("rebuild rejects copied subject arrays and repairs missing rows under a fresh original scope", () => {
    const f = fixture(), s = acquire(f); f.store.publish(s.claim, s.projection);
    expect(() => f.store.rebuild({ write: true, project: (image, { gameSource }) => {
      const p = projectObservations(image, { gameSource }); return { ...p, subjectObservations: Object.freeze([...p.subjectObservations]) };
    } })).toThrow(/SUBJECT_ROW_OWNER_INVALID/u);
    const key = subjectObservationKey(s.projection.subjectObservations[0]!);
    f.db.exec("DELETE FROM learner_subject_observations WHERE rowid=(SELECT MIN(rowid) FROM learner_subject_observations)");
    expect(f.store.rebuild({ write: true, project: (image, { gameSource }) => projectObservations(image, { gameSource }) }).repaired).toBe(1);
    expect(f.store.storedProjection(f.run.id).subjectObservations.map(subjectObservationKey)).toContain(key);
  });
  it("source advancement clears all six families and old claims cannot republish", () => {
    const f = fixture(), s = acquire(f); f.store.publish(s.claim, s.projection);
    const advanced = play(f.run, "h8g8"); f.storage.save(advanced, f.lease);
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(f.store.job(f.run.id)).toMatchObject({ state: "pending", derivedRev: 9, completedSeq: 0 });
    expect(f.store.publish(s.claim, s.projection)).toBe("publication_conflict");
    expect(JSON.parse(String(f.db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(f.run.id)!.snapshot_json)).events).toEqual(advanced.events);
  });
  it("reopening plus startup reconciliation queues and removes an old revision rather than retagging any stored counts", () => {
    const f = fixture(), s = acquire(f); f.store.publish(s.claim, s.projection);
    for (const table of families) f.db.exec(`UPDATE ${table} SET derived_rev=8`);
    f.db.exec("UPDATE learner_observation_jobs SET derived_rev=8");
    const opened = f.reopen(); reopened.push(opened);
    expect(opened.reconcileLongitudinalJobs().revisionReset).toBe(1);
    expect(opened.longitudinalJob(f.run.id)).toMatchObject({ state: "pending", derivedRev: 9, completedSeq: 0 });
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]);
    const next = acquire(f); expect(next.claim.derivedRev).toBe(9);
    expect(f.store.publish(next.claim, next.projection)).toBe("published");
    expect(canonicalizeJson(f.store.storedProjection(f.run.id))).toBe(canonicalizeJson(s.projection));
  });
  it("migrates a schema34/revision8-shaped saved prefix and rederives without rewriting play", () => {
    // Deliberately shaped schema/revision predecessor: proves migration/reset and saved-run
    // preservation, not parity with genuinely executed revision8 output.
    const f = fixture(), s = acquire(f); f.store.publish(s.claim, s.projection);
    const before = f.db.prepare("SELECT snapshot_json,summary_json FROM drill_runs WHERE id=?").get(f.run.id);
    f.db.exec("DROP TABLE learner_subject_observations");
    for (const table of families.filter(t => t !== "learner_subject_observations")) f.db.exec(`UPDATE ${table} SET derived_rev=8`);
    f.db.exec("UPDATE learner_observation_jobs SET derived_rev=8; PRAGMA user_version=34");
    const migrations: number[] = [], upgraded = new SQLiteRunStorage(f.path, { onMigration: m => migrations.push(m.version), longitudinalNow: () => f.clock.now }); reopened.push(upgraded);
    expect(migrations).toEqual([35]);
    expect(f.db.prepare("SELECT snapshot_json,summary_json FROM drill_runs WHERE id=?").get(f.run.id)).toEqual(before);
    expect(upgraded.reconcileLongitudinalJobs().revisionReset).toBe(1);
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]);
    const next = acquire(f); expect(f.store.publish(next.claim, next.projection)).toBe("published");
    expect(next.projection.subjectObservations).toEqual(s.projection.subjectObservations);
    expect(f.db.prepare("SELECT snapshot_json,summary_json FROM drill_runs WHERE id=?").get(f.run.id)).toEqual(before);
  });
  it("rejects a conflicting migration35 object without stamping or rewriting the predecessor", () => {
    const f = fixture(), before = f.db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(f.run.id);
    f.db.exec("DROP TABLE learner_subject_observations; PRAGMA user_version=34; CREATE VIEW learner_subject_observations AS SELECT 1 AS conflict");
    expect(() => new SQLiteRunStorage(f.path, { onMigration: () => {} })).toThrow(/migrate/u);
    expect(f.db.prepare("PRAGMA user_version").get()).toMatchObject({ user_version: 34 });
    expect(f.db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(f.run.id)).toEqual(before);
  });
  it("rejects impossible native-positive lifecycle rows but preserves genuine false subjects", () => {
    const f = fixture("subject-ray-read", "8/8/7k/3r4/2P3B1/8/8/7K w - - 0 1", "c4d5"), s = acquire(f);
    const lost = s.projection.subjectObservations.find(r => r.sourceKind === "native_incidence" && r.subject.kind === "physical_slider" && r.subject.root.square === "d5" && r.occurred && r.sign === "lost")!;
    expect(lost).toBeDefined();
    expect(s.projection.subjectObservations.some(r => r.sourceKind === "native_incidence" && r.subject.kind === "physical_slider" && r.subject.root.square === "d5" && !r.occurred && r.sign === "membership_changed")).toBe(true);
    expect(f.store.publish(s.claim, s.projection)).toBe("published");
    expect(() => f.store.readSnapshot(f.lease.learnerId!, query(f, { includeSubjectObservations: true }))).not.toThrow();
    f.db.prepare("DELETE FROM learner_subject_observations WHERE projection_id=? AND subject_json=? AND sign='membership_changed'").run(lost.projectionId, canonicalizeJson(lost.subject));
    f.db.prepare("UPDATE learner_subject_observations SET sign='membership_changed',tested_key='sign:membership_changed' WHERE projection_id=? AND subject_json=? AND sign='lost' AND occurred=1")
      .run(lost.projectionId, canonicalizeJson(lost.subject));
    expect(() => f.store.readSnapshot(f.lease.learnerId!, query(f, { includeSubjectObservations: true }))).toThrow(/SOURCE_JOIN_INVALID/u);
    const g = fixture("subject-backward-read", "7k/2p5/2p5/1P6/3P4/8/8/7K w - - 0 1", "b5c6"), t = acquire(g);
    const captured = t.projection.subjectObservations.find(r => r.sourceKind === "native_incidence" && r.subject.kind === "backward_pawn" && r.subject.rootSquare === "c6" && r.occurred && r.sign === "lost")!;
    expect(captured).toBeDefined(); g.store.publish(t.claim, t.projection);
    expect(() => g.store.readSnapshot(g.lease.learnerId!, query(g, { includeSubjectObservations: true }))).not.toThrow();
    g.db.prepare("DELETE FROM learner_subject_observations WHERE projection_id=? AND subject_json=? AND sign='gained'").run(captured.projectionId, canonicalizeJson(captured.subject));
    g.db.prepare("UPDATE learner_subject_observations SET sign='gained',tested_key='sign:gained' WHERE projection_id=? AND subject_json=? AND sign='lost' AND occurred=1")
      .run(captured.projectionId, canonicalizeJson(captured.subject));
    expect(() => g.store.readSnapshot(g.lease.learnerId!, query(g, { includeSubjectObservations: true }))).toThrow(/SOURCE_JOIN_INVALID/u);
  });
  it("exports/deletes the actual subject class and rederives rather than restoring supplied counts", () => {
    const f = fixture(), s = acquire(f); f.store.publish(s.claim, s.projection);
    const wire = JSON.parse(new TextDecoder().decode(serializeAccountBundle(f.storage.accountBundle(f.lease.learnerId)).bytes));
    const subjects = wire.behavioralProfiles.value.filter((r: { table: string }) => r.table === "learner_subject_observations");
    expect(subjects).toHaveLength(s.projection.subjectObservations.length);
    for (const r of subjects) r.record.matching_alternatives = 999999;
    const target = fixture("subject-restore-target"), restored = learner(target.storage, "restored-subject-owner");
    target.storage.deleteLearner(target.lease.learnerId, AT);
    expect(target.storage.restoreAccountBundle(restored.learnerId, planAccountRestore(readPortableAccountBundle(wire)), { commit: true, at: AT })).toEqual([]);
    expect(n(target, "learner_subject_observations")).toBe(0);
    const batch = runLongitudinalBatch(target.store, LONGITUDINAL_WORKER_DEFAULTS, "subject-restore-worker");
    expect(batch.completed).toBe(1); expect(batch.failed).toBe(0);
    const actual = target.store.storedProjection(f.run.id).subjectObservations;
    expect(actual).toHaveLength(s.projection.subjectObservations.length);
    expect(actual.every(r => r.learnerId === restored.learnerId && r.matchingAlternatives < 999999)).toBe(true);
    expect(target.storage.foreignKeyViolationCount()).toBe(0);
    f.storage.deleteLearner(f.lease.learnerId, AT);
    expect(families.map(t => n(f, t))).toEqual([0, 0, 0, 0, 0, 0]);
  });

});
