// Accepted profile-choice-facts: genuine fifth-family persistence/lifecycle, not source-only proof.
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { rmSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SQLiteRunStorage } from "./storage.js";
import { LongitudinalStore } from "./longitudinal-store.js";
import { parseLongitudinalReadQuery } from "./longitudinal-contract.js";
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import { projectObservations } from "./longitudinal-projector.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { parseLongitudinalChoiceFactRow } from "./profile-choice-facts-contract.js";
import { serializeAccountBundle } from "./account-data.js";
import { readPortableAccountBundle, planAccountRestore } from "./account-import.js";
import { AT, FIXTURE_DEPENDENCIES, fileFixture, learner, play, positionRun, type FileFixture } from "./longitudinal-test-fixtures.js";

const fixtures: FileFixture[] = [], databases: DatabaseSync[] = [];
afterEach(() => {
  vi.restoreAllMocks(); for (const db of databases.splice(0)) db.close();
  for (const f of fixtures.splice(0)) { f.storage.close(); rmSync(dirname(f.path), { recursive: true, force: true }); }
});
function fixture() {
  const f = fileFixture("tabiya-choice-store-"); fixtures.push(f);
  const lease = learner(f.storage, "choice-store-owner"), run = play(positionRun("choice-store"), "e2e4", "e7e5", "d1e2", "d8e7");
  f.storage.create(run, lease);
  const db = new DatabaseSync(f.path); db.exec("PRAGMA foreign_keys=ON"); databases.push(db);
  return { ...f, lease, run, db, store: new LongitudinalStore(db, { now: () => f.clock.now }) };
}
const project = (image: Parameters<typeof projectObservations>[0], checkpoint: () => void, gameSource: import("./profile-game-source.js").ProfileGameSource) =>
  projectObservations(image, { checkpoint, gameSource, dependencies: FIXTURE_DEPENDENCIES });
const batch = (f: ReturnType<typeof fixture>) => runLongitudinalBatch(f.store, LONGITUDINAL_WORKER_DEFAULTS, "choice-store-worker", { project });
function source(f: ReturnType<typeof fixture>) {
  const claim = f.store.claimBatch({ workerId: "choice-publisher", scanLimit: 1, slots: 1, leaseMs: 60_000 })[0]!;
  const image = f.store.claimSourceImage(claim)!, scope = f.store.openClaimedGameSource(claim, image);
  return { claim, image, scope, projection: project(image, () => {}, scope) };
}
function query(f: ReturnType<typeof fixture>, include = true, filter = {}) {
  return parseLongitudinalReadQuery({ learnerId: f.lease.learnerId, derivationRev: OBSERVATION_DERIVATION_REV,
    through: { kind: "all_complete" }, filter, ...(include ? { includeChoiceFacts: true } : {}) });
}
function read(f: ReturnType<typeof fixture>, include = true, filter = {}) {
  const result = f.store.readSnapshot(f.lease.learnerId, query(f, include, filter));
  if (result.kind !== "complete") throw Error("Expected complete snapshot"); return result;
}

// D4205: real source/store/rebuild/migration/account integration keeps its complete workload.
// Its correctness budget is 30s; dedicated latency/performance gates remain separate and unchanged.
describe("actual complete-cut choice family", { timeout: 30_000 }, () => {
  it("opt-in reads the whole document; decision filters do not truncate it; omitted lane never reads its table", () => {
    const f = fixture(); expect(batch(f).completed).toBe(1);
    const all = read(f);
    expect(all.choiceFacts).toHaveLength(1);
    expect(all.choiceFacts[0]).toMatchObject({ kind: "available", row: { cohort: { kind: "eligible", decisions: Array.from({ length: 4 }, () => ({})) } } });
    const filtered = read(f, true, { phases: ["endgame"], decisionClasses: ["predicted"], projections: [{ id: "rules.structural.event.king_zone", version: 1 }] });
    expect(filtered.choiceFacts).toEqual(all.choiceFacts); expect(filtered.denominators).toEqual([]);
    expect(read(f, true, { sessionKinds: ["imported"] }).choiceFacts).toEqual([]);
    const prepare = vi.spyOn(f.db, "prepare");
    expect(read(f, false).choiceFacts).toEqual([]);
    expect(prepare.mock.calls.some(([sql]) => sql.includes("learner_choice_facts"))).toBe(false);
  });

  it("missing/invalid/wrong-cut rows stay local unavailable without damaging older observation families", () => {
    const f = fixture(); batch(f);
    const original = f.store.storedProjection(f.run.id), observations = read(f).observations;
    f.db.prepare("UPDATE learner_choice_facts SET completed_seq=completed_seq+1 WHERE run_id=?").run(f.run.id);
    expect(read(f).choiceFacts).toMatchObject([{ kind: "unavailable", reason: "choice_facts_invalid" }]);
    expect(read(f).observations).toEqual(observations);
    f.db.prepare("UPDATE learner_choice_facts SET completed_seq=completed_seq-1,cohort_json=json_set(cohort_json,'$.decisions[0].result.counts.centerPawn',999) WHERE run_id=?").run(f.run.id);
    expect(read(f).choiceFacts).toMatchObject([{ kind: "unavailable", reason: "choice_facts_invalid" }]);
    f.db.prepare("DELETE FROM learner_choice_facts WHERE run_id=?").run(f.run.id);
    expect(read(f).choiceFacts).toMatchObject([{ kind: "unavailable", reason: "choice_facts_missing" }]);
    expect(f.store.storedProjection(f.run.id).gameFacts).toEqual(original.gameFacts);
    expect(read(f).observations).toEqual(observations);
  });

  it("publication rejects empty/duplicate/copied and original foreign-owner-family rows", () => {
    const f = fixture(), s = source(f), other = fixture(), t = source(other);
    for (const choiceFacts of [[], [s.projection.choiceFacts[0]!, s.projection.choiceFacts[0]!]])
      expect(() => f.store.publish(s.claim, { ...s.projection, choiceFacts: Object.freeze(choiceFacts) })).toThrow(/CHOICE_ROW_CARDINALITY/u);
    expect(() => f.store.publish(s.claim, { ...s.projection, choiceFacts: Object.freeze([parseLongitudinalChoiceFactRow(s.projection.choiceFacts[0])]) })).toThrow(/CHOICE_ROW_OWNER_INVALID/u);
    expect(() => f.store.publish(s.claim, { ...s.projection, choiceFacts: t.projection.choiceFacts })).toThrow(/CHOICE_ROW_OWNER_INVALID/u);
    expect(f.store.job(f.run.id)).toMatchObject({ state: "running", completedSeq: 0 });
    expect(f.store.storedProjection(f.run.id).choiceFacts).toEqual([]);
  });

  it("a late choice insert failure rolls back replacement families after a source advance cleared the stale cut", () => {
    const f = fixture(); batch(f);
    f.run = play(f.run, "e2d1"); f.storage.save(f.run, f.lease);
    const old = f.store.storedProjection(f.run.id);
    expect(Object.values(old).every(rows => rows.length === 0)).toBe(true);
    const s = source(f);
    f.db.exec("CREATE TRIGGER refuse_choice_insert BEFORE INSERT ON learner_choice_facts BEGIN SELECT RAISE(ABORT,'controlled choice insertion failure'); END");
    expect(() => f.store.publish(s.claim, s.projection)).toThrow(/choice insertion failure/u);
    expect(f.store.storedProjection(f.run.id)).toEqual(old);
    expect(f.store.job(f.run.id)).toMatchObject({ state: "running", completedSeq: 0 });
    f.db.exec("DROP TRIGGER refuse_choice_insert");
    expect(f.store.publish(s.claim, s.projection)).toBe("published");
    expect(read(f).choiceFacts).toMatchObject([{ kind: "available", row: { completedSeq: f.run.events.length } }]);
  });

  it("real rebuild detects and repairs invalid/missing choice rows under the same full-family transaction", () => {
    const f = fixture(); batch(f); const expected = f.store.storedProjection(f.run.id);
    f.db.prepare("UPDATE learner_choice_facts SET cohort_json=json_set(cohort_json,'$.decisions[0].result.counts.centerPawn',999) WHERE run_id=?").run(f.run.id);
    const options = { project: (image: Parameters<typeof projectObservations>[0], { gameSource }: { gameSource: import("./profile-game-source.js").ProfileGameSource }) => project(image, () => {}, gameSource) };
    const report = f.store.rebuild({ ...options, write: false });
    expect(report.mismatches).toEqual(expect.arrayContaining([expect.objectContaining({ table: "learner_choice_facts", kind: "changed" }), expect.objectContaining({ table: "learner_choice_facts", kind: "missing" })]));
    expect(f.store.rebuild({ ...options, write: true }).repaired).toBe(1);
    expect(f.store.storedProjection(f.run.id)).toEqual(expected);
    expect(f.store.rebuild({ ...options, write: false }).mismatches).toEqual([]);
  });

  it("source movement during repair clears the stale cut and refuses the old expected projection", () => {
    const f = fixture(); batch(f);
    f.db.prepare("UPDATE learner_choice_facts SET cohort_json=json_set(cohort_json,'$.decisions[0].result.counts.centerPawn',999) WHERE run_id=?").run(f.run.id);
    const before = f.db.prepare("SELECT * FROM learner_choice_facts WHERE run_id=?").get(f.run.id);
    expect(() => f.store.rebuild({ write: true, project: (image, { gameSource }) => {
      const expected = project(image, () => {}, gameSource);
      f.run = play(f.run, "e2d1"); f.storage.save(f.run, f.lease); return expected;
    } })).toThrow(/SOURCE_MOVED/u);
    expect(f.db.prepare("SELECT * FROM learner_choice_facts WHERE run_id=?").get(f.run.id)).toBeUndefined();
    expect(f.store.job(f.run.id)).toMatchObject({ state: "pending", completedSeq: 0 });
  });

  it("upgrades a real schema33/revision7-shaped predecessor and rederives without rewriting play", () => {
    const f = fixture(); batch(f);
    const before = f.db.prepare("SELECT snapshot_json,summary_json FROM drill_runs WHERE id=?").get(f.run.id);
    f.db.exec("DROP TABLE learner_subject_observations; DROP TABLE learner_choice_facts; UPDATE learner_observation_denominators SET derived_rev=7; UPDATE learner_observations SET derived_rev=7; UPDATE learner_structure_stats SET derived_rev=7; UPDATE learner_game_facts SET derived_rev=7; UPDATE learner_observation_jobs SET derived_rev=7; PRAGMA user_version=33");
    const migrations: number[] = [], upgraded = new SQLiteRunStorage(f.path, { onMigration: entry => migrations.push(entry.version) });
    try {
      expect(migrations).toEqual([34, 35]);
      expect(f.db.prepare("SELECT snapshot_json,summary_json FROM drill_runs WHERE id=?").get(f.run.id)).toEqual(before);
      expect(upgraded.reconcileLongitudinalJobs().revisionReset).toBe(1);
      expect(batch(f).completed).toBe(1);
      expect(read(f).choiceFacts).toMatchObject([{ kind: "available", row: { derivedRev: OBSERVATION_DERIVATION_REV, cohort: { kind: "eligible" } } }]);
    } finally { upgraded.close(); }
  });

  it("strict migration refuses a conflicting future object without stamping the predecessor", () => {
    const f = fixture(), before = f.db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(f.run.id);
    f.db.exec("DROP TABLE learner_choice_facts; PRAGMA user_version=33; CREATE VIEW learner_choice_facts AS SELECT 1 AS conflicting_future_object");
    expect(() => new SQLiteRunStorage(f.path, { onMigration: () => {} })).toThrow(/migrate/u);
    expect(f.db.prepare("PRAGMA user_version").get()).toMatchObject({ user_version: 33 });
    expect(f.db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(f.run.id)).toEqual(before);
  });

  it("exports/deletes the actual private class and ignores supplied derived choice contents on restore", () => {
    const f = fixture(); batch(f);
    const wire = JSON.parse(new TextDecoder().decode(serializeAccountBundle(f.storage.accountBundle(f.lease.learnerId)).bytes));
    const supplied = wire.behavioralProfiles.value.filter((record: { table: string }) => record.table === "learner_choice_facts");
    expect(supplied).toHaveLength(1);
    supplied[0].record.cohort_json = JSON.stringify({ kind: "ineligible", reason: "not_standard_start" });
    const target = fixture(), restored = learner(target.storage, "restored-choice-owner");
    // Clear the target fixture's owner/run before restoring into a different actual owner.
    target.storage.deleteLearner(target.lease.learnerId, AT);
    expect(target.storage.restoreAccountBundle(restored.learnerId, planAccountRestore(readPortableAccountBundle(wire)), { commit: true, at: AT })).toEqual([]);
    expect(target.db.prepare("SELECT * FROM learner_choice_facts WHERE run_id=?").get(f.run.id)).toBeUndefined();
    expect(batch(target).failed).toBe(0);
    expect(target.store.storedProjection(f.run.id).choiceFacts).toMatchObject([{ learnerId: restored.learnerId, cohort: { kind: "eligible", decisions: Array.from({ length: 4 }, () => ({ result: { kind: "available" } })) } }]);
    expect(target.storage.foreignKeyViolationCount()).toBe(0);
    f.storage.deleteLearner(f.lease.learnerId, AT);
    expect(f.db.prepare("SELECT count(*) AS n FROM learner_choice_facts").get()).toMatchObject({ n: 0 });
  });
});
