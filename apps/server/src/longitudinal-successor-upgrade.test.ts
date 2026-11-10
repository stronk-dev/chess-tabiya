// D4018: actual saved-history upgrade. The import-only application fixture is not default
// content/native release proof (D3928); production startup/store/worker/read paths are unchanged.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { legalAlternativeEdges, localSemanticEventClosure, readBackReplay, type DrillRun } from "@chess-tabiya/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";
import { parseLongitudinalReadQuery } from "./longitudinal-contract.js";
import { decisionPopulation, projectObservations } from "./longitudinal-projector.js";
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import { LongitudinalStore, type LongitudinalProjection } from "./longitudinal-store.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { learner, play, positionRun } from "./longitudinal-test-fixtures.js";
import { LongitudinalProjectionWorker } from "./longitudinal-worker.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

interface PredecessorFixture { name: string; run: DrillRun; projection: LongitudinalProjection }
const prior = JSON.parse(readFileSync(new URL("./fixtures/longitudinal-successor-rev5.json", import.meta.url), "utf8")) as {
  sourceCommit: string; derivationRevision: number; fixtures: PredecessorFixture[];
};
const ownerId = "successor-owner", directories: string[] = [], stores: SQLiteRunStorage[] = [], rawStores: DatabaseSync[] = [];
let application: ChessTabiyaApplication | undefined;
beforeEach(() => { installEmptyApplicationCatalogues(); });
afterEach(async () => {
  const closing = application; application = undefined;
  try { await closing?.close(); }
  finally {
    for (const store of stores.splice(0)) { try { store.close(); } catch { /* already closed for reopen */ } }
    for (const db of rawStores.splice(0)) { try { db.close(); } catch { /* already closed */ } }
    vi.restoreAllMocks();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  }
});
function database() {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-successor-upgrade-")); directories.push(directory);
  const path = join(directory, "history.sqlite"), storage = new SQLiteRunStorage(path, { onMigration: () => {} });
  stores.push(storage);
  return { path, storage };
}
function raw(path: string) { const db = new DatabaseSync(path); rawStores.push(db); return db; }
function query(revision: number = OBSERVATION_DERIVATION_REV, filter: Record<string, unknown> = {}) {
  return parseLongitudinalReadQuery({ learnerId: ownerId, derivationRev: revision, through: { kind: "all_complete" }, filter });
}
const changed = ["derived.material.event.role_asymmetry", "derived.tactic.defender_exposure"];
function protectedRows(db: DatabaseSync) {
  return Object.fromEntries(["drill_runs", "imported_games", "learners", "run_grants", "session_journal", "match_states"].map(table =>
    [table, JSON.stringify(db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all())]));
}
function seedProjection(db: DatabaseSync, value: LongitudinalProjection) {
  const denominator = db.prepare("INSERT INTO learner_observation_denominators (learner_id,run_id,phase,decision_class,decisions,observed_at,derived_rev) VALUES (?,?,?,?,?,?,?)");
  for (const row of value.denominators) denominator.run(row.learnerId, row.runId, row.phase, row.decisionClass, row.decisions, row.observedAt, row.derivedRev);
  const observation = db.prepare("INSERT INTO learner_observations (learner_id,run_id,projection_id,projection_version,semantic_sign,source_sign,phase,decision_class,session_kind,pack_id,opportunities,occurred,alternative_share_sum,occurred_refs,opportunity_refs,observed_at,derived_rev) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const row of value.observations) observation.run(row.learnerId, row.runId, row.projectionId, row.projectionVersion, row.semanticSign, row.sourceSign,
    row.phase, row.decisionClass, row.sessionKind, row.packId, row.opportunities, row.occurred, row.alternativeShareSum,
    JSON.stringify(row.occurredRefs), JSON.stringify(row.opportunityRefs), row.observedAt, row.derivedRev);
  const structure = db.prepare("INSERT INTO learner_structure_stats (learner_id,run_id,root_key,root_node_id,session_kind,pack_id,branch_count,rewound_count,forked_count,group_count,outcome_count,observed_at,derived_rev) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const row of value.structureStats) structure.run(row.learnerId, row.runId, row.rootKey, row.rootNodeId, row.sessionKind, row.packId,
    row.branchCount, row.rewoundCount, row.forkedCount, row.groupCount, row.outcomeCount, row.observedAt, row.derivedRev);
}
async function untilComplete(app: ChessTabiyaApplication, expectedJobs: number) {
  for (;;) {
    const result = app.longitudinal.read(ownerId, query());
    // The durable transaction precedes the worker's completion message. Join both real
    // boundaries rather than assuming their delivery order from a fast local run.
    if (result.kind === "complete" && (app.longitudinal.progress()?.completed ?? 0) >= expectedJobs) return result;
    if (result.cuts.some(cut => cut.kind === "failed")) throw new Error("Actual successor worker failed");
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe("D4018 exact successor history", () => {
  it("starts with actual predecessor outputs, not current observations relabeled revision five", () => {
    expect(prior.sourceCommit).toBe("48a6e0f5175a47e65b48a4fc8823940db0980102");
    expect(prior.derivationRevision).toBe(5);
    expect(prior.fixtures.map(value => value.name)).toEqual(["material-white", "material-black", "exposure-white", "exposure-black", "unavailable-alternative"]);
    for (const value of prior.fixtures) {
      expect(readBackReplay(value.run.events).run).toEqual(value.run);
      expect(value.projection.observations.length).toBeGreaterThan(0);
      expect(value.projection.observations.some(row => changed.includes(row.projectionId) && row.projectionVersion === 1 && row.occurred > 0)).toBe(true);
      expect(value.projection.observations.some(row => !changed.includes(row.projectionId))).toBe(true);
      expect([...value.projection.observations, ...value.projection.denominators, ...value.projection.structureStats].every(row => row.derivedRev === 5)).toBe(true);
    }
  });

  it("reconciles untouched populated revision-five history before real startup-worker/read/reopen", async () => {
    const { path, storage } = database(), owner = learner(storage, ownerId);
    for (const value of prior.fixtures) storage.create(readBackReplay(value.run.events).run, owner);
    // A genuine PGN import is retained alongside the unchanged historical position runs.
    const imported = await new RunService(storage).importGame({ id: "successor-import", side: "white", opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3,
      source: { kind: "pgn", pgn: "[Event \"Preserved import\"]\n[Result \"*\"]\n\n1. e4 e5 *" } }, owner);
    const db = raw(path);
    for (const value of prior.fixtures) {
      seedProjection(db, value.projection);
      db.prepare("UPDATE learner_observation_jobs SET derived_rev=5,state='complete',completed_seq=requested_seq WHERE run_id=?").run(value.run.id);
    }
    const before = protectedRows(db), heads = db.prepare("SELECT run_id,requested_seq,claim_generation FROM learner_observation_jobs WHERE run_id <> ? ORDER BY run_id").all(imported.run.id);
    expect(db.prepare("SELECT DISTINCT projection_version FROM learner_observations WHERE projection_id IN (?,?)").all(...changed)).toEqual([{ projection_version: 1 }]);
    expect(db.prepare("SELECT DISTINCT derived_rev,state FROM learner_observation_jobs WHERE run_id <> ?").all(imported.run.id)).toEqual([{ derived_rev: 5, state: "complete" }]);
    storage.close();
    const entry = longitudinalThreadEntryForTests(), realStart = LongitudinalProjectionWorker.start.bind(LongitudinalProjectionWorker);
    let release!: () => void, entered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), starting = new Promise<void>(resolve => { entered = resolve; });
    const start = vi.spyOn(LongitudinalProjectionWorker, "start").mockImplementation(async input => { entered(); await held; return realStart(input); });
    const boot = createApplication({ development: true, engineMode: "mock", cookieSecure: false, databasePath: path, longitudinalWorkerEntry: entry });
    void boot.catch(() => {}); // Owned and joined below, including assertion failure cleanup.
    try {
      await starting;
      expect(db.prepare("SELECT DISTINCT derived_rev,state,completed_seq FROM learner_observation_jobs WHERE run_id <> ?").all(imported.run.id)).toEqual([{ derived_rev: OBSERVATION_DERIVATION_REV, state: "pending", completed_seq: 0 }]);
      expect(db.prepare("SELECT count(*) AS count FROM learner_observations").get()).toEqual({ count: 0 });
      expect(db.prepare("SELECT run_id,requested_seq,claim_generation-1 AS claim_generation FROM learner_observation_jobs WHERE run_id <> ? ORDER BY run_id").all(imported.run.id)).toEqual(heads);
      // Keep the version pin after the actual reconciliation assertions: omitting the bump
      // must fail at unchanged-head SQL state, not merely at a constant's spelling.
      expect(OBSERVATION_DERIVATION_REV).toBe(10);
      expect(protectedRows(db)).toEqual(before);
      const pendingStore = new LongitudinalStore(db);
      expect(pendingStore.readSnapshot(ownerId, query()).kind).toBe("incomplete");
      expect(pendingStore.readSnapshot(ownerId, query(5)).kind).toBe("incomplete");
    } finally { release(); application = await boot; start.mockRestore(); }
    expect(application.startupReceipt.longitudinal).toMatchObject({ revisionReset: 5 });
    const complete = await untilComplete(application, prior.fixtures.length + 1);
    expect(complete.cuts).toHaveLength(6);
    expect(application.longitudinal.progress()?.completed).toBeGreaterThanOrEqual(6);
    for (const value of prior.fixtures) {
      if (value.name === "unavailable-alternative") {
        const [before, after] = value.run.nodes;
        if (before === undefined || after === undefined || typeof after.moveUci !== "string") throw new Error("Expected original recorded edge");
        const committed = localSemanticEventClosure(before.fen, after.moveUci, after.fen);
        expect(committed.abstentions.some(row => row.projection === "derived.tactic.defender_exposure@2")).toBe(false);
        const checking = legalAlternativeEdges(before.fen, after.moveUci).find(edge => edge.moveUci === "a1a8");
        if (checking === undefined) throw new Error("Expected actual legal checking alternative");
        expect(localSemanticEventClosure(checking.beforeFen, checking.moveUci, checking.afterFen).abstentions).toContainEqual({ projection: "derived.tactic.defender_exposure@2", reason: "invalid_turn_clone" });
        expect(decisionPopulation(before.fen, after.moveUci)).toEqual({ kind: "unavailable", reason: "population_incomplete" });
        expect(complete.denominators).toContainEqual(expect.objectContaining({ runId: value.run.id, decisions: 1, derivedRev: OBSERVATION_DERIVATION_REV }));
        expect(complete.coverage.decisions).toContainEqual(expect.objectContaining({
          runId: value.run.id,
          unavailable: expect.arrayContaining([expect.objectContaining({ projection: { id: "derived.tactic.defender_exposure", version: 2 } })]),
        }));
        const observations = complete.observations.filter(row => row.runId === value.run.id);
        expect(observations.length).toBeGreaterThan(0);
        expect(observations.some(row => row.projectionId === "derived.tactic.defender_exposure" && row.projectionVersion === 2)).toBe(false);
        continue;
      }
      const id = value.name.startsWith("material") ? changed[0]! : changed[1]!;
      expect(complete.observations).toContainEqual(expect.objectContaining({ runId: value.run.id, projectionId: id, projectionVersion: 2, occurred: 1, derivedRev: OBSERVATION_DERIVATION_REV }));
      expect(complete.observations.some(row => row.runId === value.run.id && !changed.includes(row.projectionId))).toBe(true);
    }
    expect(complete.observations.filter(row => changed.includes(row.projectionId)).every(row => row.projectionVersion === 2)).toBe(true);
    for (const id of changed) {
      expect(() => query(OBSERVATION_DERIVATION_REV, { projections: [{ id, version: 1 }] })).toThrow();
      expect(() => query(OBSERVATION_DERIVATION_REV, { projections: [{ id, version: 2 }] })).not.toThrow();
    }
    const closing = application; application = undefined; await closing.close();
    const reopened = new SQLiteRunStorage(path, { onMigration: () => {} }); stores.push(reopened);
    expect(reopened.readLongitudinalSnapshot(ownerId, query())).toEqual(complete);
    expect(protectedRows(db)).toEqual(before);
  });

  // Startup above deliberately exercises the whole mixed historical cohort and real thread.
  // Rebuild has its own independent per-history fixture: one bounded corruption/repair journey
  // per case rather than replaying all six games five more times inside the startup deadline.
  it.each(prior.fixtures)("compares and repairs genuine $name predecessor history without rewriting play", value => {
    const { path, storage } = database(), owner = learner(storage, ownerId);
    storage.create(readBackReplay(value.run.events).run, owner);
    const db = raw(path);
    seedProjection(db, value.projection);
    db.prepare("UPDATE learner_observation_jobs SET derived_rev=5,state='complete',completed_seq=requested_seq WHERE run_id=?").run(value.run.id);
    const before = protectedRows(db);
    expect(storage.reconcileLongitudinalJobs().revisionReset).toBe(1);
    const operator = new LongitudinalStore(db);
    expect(runLongitudinalBatch(operator, LONGITUDINAL_WORKER_DEFAULTS, "successor-rebuild")).toMatchObject({ completed: 1, failed: 0, conflicts: 0 });
    const complete = storage.readLongitudinalSnapshot(ownerId, query());
    expect(complete.kind).toBe("complete");
    const clean = operator.rebuild({ write: false, project: projectObservations });
    expect(clean.checked).toBe(1); expect(clean.mismatches).toEqual([]); expect(clean.skipped.revision_mismatch).toEqual([]);
    const target = value.run.id;
    db.prepare("UPDATE learner_observation_denominators SET decisions=decisions+1 WHERE run_id=?").run(target);
    expect(operator.rebuild({ write: false, project: projectObservations }).mismatches).toContainEqual(expect.objectContaining({ runId: target, table: "learner_observation_denominators", kind: "changed" }));
    expect(operator.rebuild({ write: true, project: projectObservations }).repaired).toBe(1);
    expect(operator.rebuild({ write: false, project: projectObservations }).mismatches).toEqual([]);
    expect(storage.readLongitudinalSnapshot(ownerId, query())).toEqual(complete);
    expect(protectedRows(db)).toEqual(before);
  });

  it("fences an original current-store claim across a same-head revision reset (not a serialized revision-five claim)", () => {
    const { path, storage } = database(), owner = learner(storage, ownerId), run = play(positionRun("successor-claim"), "e2e4");
    storage.create(run, owner);
    const db = raw(path), store = new LongitudinalStore(db);
    const [claim] = store.claimBatch({ workerId: "pre-reset-current-owner", scanLimit: 1, slots: 1, leaseMs: 60_000 });
    if (claim === undefined) throw new Error("Expected actual original store claim");
    expect(claim.derivedRev).toBe(OBSERVATION_DERIVATION_REV);
    const source = store.claimSourceImage(claim)!;
    const projection = projectObservations(source);
    db.prepare("UPDATE learner_observation_jobs SET derived_rev=5 WHERE run_id=?").run(run.id);
    expect(store.reconcile().revisionReset).toBe(1);
    expect(db.prepare("SELECT requested_seq,claim_generation,state FROM learner_observation_jobs WHERE run_id=?").get(run.id)).toEqual({ requested_seq: run.events.length, claim_generation: claim.generation + 1, state: "pending" });
    expect(store.claimSourceImage(claim)).toBeUndefined();
    expect(store.publish(claim, projection)).toBe("publication_conflict");
    expect(storage.read(run.id)!.run).toEqual(run);
    expect(db.prepare("SELECT count(*) AS count FROM learner_observations").get()).toEqual({ count: 0 });
  });
});
