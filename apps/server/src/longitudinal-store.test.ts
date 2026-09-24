// rfc/longitudinal-store.md §F — durable store acceptance over real file-backed SQLite (criteria 1,
// 5, 6, 7, 8, 11, 13, 14, 20–26, 31). Worker-thread reach and packaging live in
// longitudinal-worker.test.ts.
import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { parseLongitudinalReadQuery, type LongitudinalReadQuery } from "./longitudinal-contract.js";
import { assertLongitudinalMutationCensus, compileLongitudinalMutationCensus } from "./longitudinal-mutation-census.js";
import { projectObservations } from "./longitudinal-projector.js";
import { LONGITUDINAL_INDEXES, LONGITUDINAL_SOURCE_MUTATION_OPERATIONS, LONGITUDINAL_TABLES, LongitudinalStore, type LongitudinalClaim } from "./longitudinal-store.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { AT, FIXTURE_DEPENDENCIES, fileFixture, importedRun, learner, packRun, play, positionRun, predict, type FileFixture } from "./longitudinal-test-fixtures.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const fixtures: FileFixture[] = [];
const extraStores: LongitudinalStore[] = [];
afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    try { fixture.storage.close(); } catch { /* already closed */ }
    rmSync(dirname(fixture.path), { recursive: true, force: true });
  }
  extraStores.splice(0);
});

function fixture(): FileFixture {
  const value = fileFixture();
  fixtures.push(value);
  return value;
}

const FAST = { project: (image: Parameters<typeof projectObservations>[0], checkpoint: () => void) => projectObservations(image, { checkpoint, dependencies: FIXTURE_DEPENDENCIES }) };

function query(learnerId: string, through: LongitudinalReadQuery["through"] = { kind: "all_complete" }, filter: LongitudinalReadQuery["filter"] = {}) {
  return parseLongitudinalReadQuery({ learnerId, derivationRev: 1, through, filter });
}

function raw(path: string): DatabaseSync {
  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON");
  return database;
}

function jobRow(path: string, runId: string): Record<string, unknown> | undefined {
  const database = raw(path);
  try { return database.prepare("SELECT * FROM learner_observation_jobs WHERE run_id = ?").get(runId) as Record<string, unknown> | undefined; }
  finally { database.close(); }
}

function count(path: string, table: string, where = "1=1", ...parameters: string[]): number {
  const database = raw(path);
  try { return Number((database.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${where}`).get(...parameters) as { n: number }).n); }
  finally { database.close(); }
}

function drain(store: LongitudinalStore): number {
  let completed = 0;
  for (;;) {
    const receipt = runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "test-worker", FAST);
    completed += receipt.completed;
    if (receipt.claimed === 0) return completed;
  }
}

describe("criterion 1 — additive migration with a prior-release upgrade", () => {
  it("adds exactly four tables, six indexes and two run columns, reads legacy defaults and backfills nothing", () => {
    const { path, storage } = fixture();
    const owner = learner(storage, "historic");
    storage.create(play(positionRun("historic-run"), "e2e4"), owner, "Historic");
    storage.close();

    // Reconstruct the exact prior-release (storage 25) schema: drop migration 26's objects and
    // rebuild drill_runs from its own DDL without the two longitudinal columns.
    const prior = raw(path);
    prior.exec("PRAGMA foreign_keys = OFF");
    prior.exec("PRAGMA legacy_alter_table = ON");
    for (const table of LONGITUDINAL_TABLES) prior.exec(`DROP TABLE ${table}`);
    prior.exec("DROP INDEX drill_runs_longitudinal_owner");
    const ddl = String((prior.prepare("SELECT sql FROM sqlite_schema WHERE name='drill_runs'").get() as { sql: string }).sql);
    const stripped = ddl
      .replace(/,\s*longitudinal_profile_disposition TEXT NOT NULL[\s\S]*?\('profileable','account_deleted'\)\)/u, "")
      .replace(/,\s*longitudinal_structure_attribution TEXT NOT NULL[\s\S]*?'unattributable_legacy'\)\)/u, "");
    expect(stripped).not.toContain("longitudinal");
    const columns = (prior.prepare("PRAGMA table_info(drill_runs)").all() as { name: string }[]).map((column) => column.name).filter((name) => !name.startsWith("longitudinal_"));
    prior.exec(`ALTER TABLE drill_runs RENAME TO drill_runs_v26; ${stripped.replace("CREATE TABLE drill_runs", "CREATE TABLE drill_runs")};
      INSERT INTO drill_runs (${columns.join(",")}) SELECT ${columns.join(",")} FROM drill_runs_v26; DROP TABLE drill_runs_v26;`);
    prior.exec("PRAGMA user_version = 25");
    const before = prior.prepare("SELECT type, name, tbl_name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all() as { type: string; name: string; sql: string | null }[];
    const beforeRuns = prior.prepare("SELECT * FROM drill_runs ORDER BY id").all();
    const beforeColumns = (prior.prepare("PRAGMA table_info(drill_runs)").all() as { name: string }[]).map((column) => column.name);
    prior.close();

    const log: { version: number; name: string }[] = [];
    const upgraded = new SQLiteRunStorage(path, { onMigration: (entry) => log.push(entry) });
    expect(STORAGE_VERSION).toBe(27);
    expect(log).toEqual([{ version: 26, name: "longitudinal observation ledger, structure stats, and projection jobs" }, { version: 27, name: "durable evidence job batches, jobs, result sequences and application transitions" }]);
    upgraded.close();

    const after = raw(path);
    const afterSchema = after.prepare("SELECT type, name, tbl_name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all() as { type: string; name: string; sql: string | null }[];
    const added = afterSchema.filter((row) => !before.some((prior) => prior.name === row.name)).map((row) => `${row.type}:${row.name}`).sort();
    expect(added).toEqual([...LONGITUDINAL_TABLES.map((name) => `table:${name}`), ...LONGITUDINAL_INDEXES.map((name) => `index:${name}`)].sort());
    for (const prior of before) {
      const current = afterSchema.find((row) => row.name === prior.name);
      if (prior.name === "drill_runs") continue;
      expect(current?.sql, prior.name).toBe(prior.sql);
    }
    const afterColumns = (after.prepare("PRAGMA table_info(drill_runs)").all() as { name: string }[]).map((column) => column.name);
    expect(afterColumns).toEqual([...beforeColumns, "longitudinal_profile_disposition", "longitudinal_structure_attribution"]);
    const afterRuns = after.prepare("SELECT * FROM drill_runs ORDER BY id").all() as Record<string, unknown>[];
    expect(afterRuns.map((row) => { const { longitudinal_profile_disposition: _d, longitudinal_structure_attribution: _a, ...rest } = row; return rest; })).toEqual(beforeRuns);
    expect(afterRuns.map((row) => [row.longitudinal_profile_disposition, row.longitudinal_structure_attribution])).toEqual([["profileable", "unattributable_legacy"]]);
    expect(count(path, "learner_observation_jobs")).toBe(0);
    after.close();

    // New runs explicitly enter single_player; the pre-migration run stays legacy.
    const reopened = new SQLiteRunStorage(path, { onMigration: () => {} });
    reopened.create(positionRun("new-run"), owner, "New");
    const attribution = raw(path);
    expect(attribution.prepare("SELECT id, longitudinal_structure_attribution AS a FROM drill_runs ORDER BY id").all()).toEqual([
      { id: "historic-run", a: "unattributable_legacy" }, { id: "new-run", a: "single_player" },
    ]);
    attribution.close();
    reopened.close();
  });
});

describe("criteria 6, 31 — the eleven source mutations commit watermark and source together", () => {
  const storageSource = readFileSync(join(HERE, "storage.ts"), "utf8");

  it("compiles exactly the normative 11-row register from the TypeScript AST", () => {
    const compiled = compileLongitudinalMutationCensus(storageSource);
    assertLongitudinalMutationCensus(compiled);
    expect(compiled).toHaveLength(LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.length);
  });

  it("fails on missing, surplus, duplicate, renamed, wrong-effect, comment/string and outside-transaction descriptors", () => {
    const call = 'this.#upsertLongitudinalWatermark({ symbol: "SQLiteRunStorage#save", effect: "conditional" }, [run.id]);';
    expect(storageSource).toContain(call);
    const mutate = (from: string, to: string) => storageSource.replace(from, to);
    const cases: readonly [string, string, RegExp][] = [
      ["missing", mutate(call, ""), /missing SQLiteRunStorage#save/u],
      ["comment", mutate(call, `// ${call}`), /missing SQLiteRunStorage#save/u],
      ["string", mutate(call, `void ${JSON.stringify(call)};`), /missing SQLiteRunStorage#save/u],
      ["wrong effect", mutate(call, call.replace('"conditional"', '"always"')), /MISMATCH/u],
      ["renamed", mutate(call, call.replace("SQLiteRunStorage#save", "SQLiteRunStorage#persist")), /WRONG_METHOD/u],
      ["duplicate", mutate(call, `${call}${call}`), /DUPLICATE/u],
      ["outside transaction", mutate(call, "").replace("  save(input: DrillRun | RunSaveTransition, leaseInput: LeaseHolder | string): void {\n    const lease = this.#lease(leaseInput);", `  save(input: DrillRun | RunSaveTransition, leaseInput: LeaseHolder | string): void {\n    const lease = this.#lease(leaseInput);\n    ${call}`), /OUTSIDE_TRANSACTION/u],
    ];
    for (const [, source, error] of cases) {
      expect(() => assertLongitudinalMutationCensus(compileLongitudinalMutationCensus(source))).toThrow(error);
    }
    const surplus = storageSource.replace("  revokeGrant(runId: string, learnerId: string, actor: LeaseHolder): void {\n    let transferred = false;\n    try {\n      this.#database.exec(\"BEGIN IMMEDIATE\");",
      "  revokeGrant(runId: string, learnerId: string, actor: LeaseHolder): void {\n    let transferred = false;\n    try {\n      this.#database.exec(\"BEGIN IMMEDIATE\");\n      this.#upsertLongitudinalWatermark({ symbol: \"SQLiteRunStorage#revokeGrant\", effect: \"conditional\" }, [runId]);");
    expect(surplus).not.toBe(storageSource);
    expect(() => assertLongitudinalMutationCensus(compileLongitudinalMutationCensus(surplus))).toThrow(/surplus SQLiteRunStorage#revokeGrant/u);
  });

  it("rolls the watermark back with the run bytes for create and save, and vice versa", () => {
    const { path, storage } = fixture();
    const owner = learner(storage, "writer");
    const trigger = raw(path);
    trigger.exec("CREATE TRIGGER fail_job_insert BEFORE INSERT ON learner_observation_jobs BEGIN SELECT RAISE(ABORT, 'injected'); END;");
    expect(() => storage.create(positionRun("rolled-back"), owner)).toThrow(/Could not create run/u);
    expect(count(path, "drill_runs", "id = ?", "rolled-back")).toBe(0);
    trigger.exec("DROP TRIGGER fail_job_insert");
    const run = positionRun("saved");
    storage.create(run, owner);
    const created = jobRow(path, "saved");
    expect(created).toMatchObject({ requested_seq: 1, state: "pending", claim_generation: 0 });
    trigger.exec("CREATE TRIGGER fail_job_update BEFORE UPDATE ON learner_observation_jobs BEGIN SELECT RAISE(ABORT, 'injected'); END;");
    const advanced = play(run, "e2e4");
    expect(() => storage.save(advanced, owner)).toThrow(/Could not save run/u);
    storage.clearSnapshotCache();
    expect(storage.read("saved")?.run.events).toHaveLength(1);
    expect(jobRow(path, "saved")).toEqual(created);
    trigger.exec("DROP TRIGGER fail_job_update");
    storage.save(advanced, owner);
    expect(jobRow(path, "saved")).toMatchObject({ requested_seq: 2, state: "pending", claim_generation: 1 });
    trigger.close();
  });

  it("covers all seven run writers, is idempotent for byte-identical saves and tracks only the stored head", () => {
    const { path, storage } = fixture();
    const owner = learner(storage, "seven");
    const run = play(positionRun("native"), "e2e4");
    storage.create(run, owner);
    storage.createRatedRun(positionRun("rated"), owner, "Rated", {
      runId: "rated", learnerId: owner.learnerId, calibrationId: "fixture-calibration", opponentBand: 1500, opponentRating: 1500, opponentRd: 50,
      learnerSide: "white", startPieceCount: 32, engineIdentityDigest: `sha256:${"e".repeat(64)}`, state: "open", startedAt: AT,
    } as never);
    storage.createImportedRun(importedRun("imported", ["e2e4", "e7e5"]), owner, "Imported", {
      runId: "imported", sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"b".repeat(64)}`, headers: {}, result: "*", pgn: "1. e4 e5 *", licenceNote: "fixture", importedAt: AT,
    } as never);
    storage.createDerivedRun(positionRun("derived"), owner, "Derived", { derivedRunId: "derived", sourceRunId: "native", sourceBranchId: run.branches[0]!.id, sourceNodeId: run.nodes[0]!.id, kind: "flip_sides", createdAt: AT });
    const repertoire = { id: "rep", ownerLearnerId: owner.learnerId, name: "Rep", side: "white", rootFen: run.nodes[0]!.fen, targetElo: 1500, coverageDenominator: 100, sourceKind: "pgn_paste", sourceUrl: null, originalPgn: "1. e4 *", licenceNote: "fixture", digest: "d", createdAt: AT, updatedAt: AT } as never;
    storage.createRepertoire(repertoire, []);
    storage.createRepertoireGapRun(positionRun("gap"), owner, "Gap", { runId: "gap", repertoireId: "rep", gapKey: "k", createdAt: AT });
    for (const id of ["native", "rated", "imported", "derived", "gap"]) expect(jobRow(path, id)?.state, id).toBe("pending");
    const before = jobRow(path, "native");
    storage.save(run, owner);
    expect(jobRow(path, "native")).toEqual(before);
    storage.save(play(run, "e7e5"), owner);
    expect(jobRow(path, "native")).toMatchObject({ requested_seq: 3, state: "pending" });
    // No caller operand chooses the cut: a stale full-snapshot overwrite is a changed source whose
    // exact stored head is re-requested, fencing every claim over the longer log.
    const store = new LongitudinalStore(new DatabaseSync(path));
    const [claim] = store.claimBatch({ workerId: "w", scanLimit: 32, slots: 32, leaseMs: 60_000 }).filter((candidate) => candidate.runId === "native");
    expect(claim?.claimedRequestedSeq).toBe(3);
    storage.save(run, owner);
    expect(jobRow(path, "native")).toMatchObject({ requested_seq: 2, state: "pending", completed_seq: 0 });
    expect(store.publish(claim!, { denominators: [], observations: [], structureStats: [] })).toBe("publication_conflict");
  });

  it("taints same-head collaboration monotonically and invalidates a complete job in the same transaction", () => {
    const { path, storage, workerStore } = fixture();
    const owner = learner(storage, "host");
    const guest = learner(storage, "guest");
    const run = play(positionRun("collab"), "e2e4");
    storage.create(run, owner);
    const store = workerStore();
    expect(drain(store)).toBe(1);
    const complete = jobRow(path, "collab");
    expect(complete).toMatchObject({ state: "complete", completed_seq: 2 });
    storage.grantRole("collab", guest.learnerId, "spectator", owner, AT);
    expect(jobRow(path, "collab")).toEqual(complete);
    storage.grantRole("collab", guest.learnerId, "participant", owner, AT);
    const tainted = jobRow(path, "collab")!;
    expect(tainted).toMatchObject({ state: "pending", requested_seq: 2, completed_seq: 0, claim_generation: Number(complete!.claim_generation) + 1 });
    expect(tainted.requested_source_digest).not.toBe(complete!.requested_source_digest);
    storage.revokeGrant("collab", guest.learnerId, owner);
    const attribution = raw(path);
    expect((attribution.prepare("SELECT longitudinal_structure_attribution AS a FROM drill_runs WHERE id='collab'").get() as { a: string }).a).toBe("unattributable_shared");
    attribution.close();
    expect(jobRow(path, "collab")).toEqual(tainted);
  });
});

describe("criteria 5, 23 — owner attribution and run-owner provenance", () => {
  it("attributes live-session commits by durable holder and emits structure only for single_player", () => {
    const { path, storage, workerStore } = fixture();
    const owner = learner(storage, "owner");
    const guest = learner(storage, "guest");
    let run = positionRun("live");
    storage.create(run, owner);
    storage.createLiveSession({ id: "session", runId: "live", kind: "academy", title: "Class", boardControl: "free_claim", createdBy: owner.learnerId, at: AT });
    run = play(run, "e2e4");
    storage.save(run, owner);
    storage.grantRole("live", guest.learnerId, "participant", owner, AT);
    storage.claimLease("live", guest);
    run = play(run, "e7e5");
    storage.save(run, guest);
    run = predict(run, run.nodes[0]!.id, "shared-prediction", "d2d4");
    storage.save(run, guest);
    const image = storage.longitudinalSourceImageV4("live", run.events.length);
    expect(image.structureAttribution).toBe("unattributable_shared");
    expect(image.moveAuthorship.map((row) => row.learnerId)).toEqual(["owner", "guest"]);
    const store = workerStore();
    drain(store);
    const read = storage.readLongitudinalSnapshot("owner", query("owner"));
    expect(read.kind).toBe("complete");
    if (read.kind !== "complete") return;
    expect(read.denominators.map((row) => [row.decisionClass, row.decisions])).toEqual([["played", 1]]);
    expect(read.structureStats).toEqual([]);
    expect(count(path, "learner_observation_denominators", "learner_id = ?", "guest")).toBe(0);

    // The identical private history (no journal) admits the prediction and emits structure.
    let solo = positionRun("solo");
    storage.create(solo, owner);
    solo = predict(play(solo, "e2e4"), solo.nodes[0]!.id, "solo-prediction", "d2d4");
    storage.save(solo, owner);
    drain(store);
    const soloRead = storage.readLongitudinalSnapshot("owner", query("owner", { kind: "runs", cuts: [{ runId: "solo", requestedSeq: solo.events.length }] }));
    expect(soloRead.kind === "complete" ? soloRead.denominators.map((row) => row.decisionClass).sort() : []).toEqual(["played", "predicted"]);
    expect(soloRead.kind === "complete" ? soloRead.structureStats : []).toHaveLength(1);
  });

  it("rejects crossed child rows, restricts owner updates and fences an old-owner claim", () => {
    const { path, storage, workerStore } = fixture();
    const a = learner(storage, "a");
    const b = learner(storage, "b");
    storage.create(play(positionRun("run-a"), "e2e4"), a);
    storage.create(play(positionRun("run-b"), "e2e4"), b);
    const database = raw(path);
    expect(() => database.prepare("INSERT INTO learner_observation_denominators VALUES ('b','run-a','opening','played',1,?,1)").run(AT)).toThrow(/FOREIGN KEY/u);
    expect(() => database.prepare("INSERT INTO learner_observation_jobs (run_id,learner_id,requested_seq,requested_source_digest,derived_rev,state,updated_at) VALUES ('run-x','b',1,?,1,'pending',?)").run(`sha256:${"0".repeat(64)}`, AT)).toThrow(/FOREIGN KEY/u);
    expect(() => database.prepare("UPDATE drill_runs SET owner_learner_id='b' WHERE id='run-a'").run()).toThrow(/FOREIGN KEY/u);
    database.close();
    // A shared run removed by its owner: suppression precedes reassignment and fences the claim.
    const store = workerStore();
    const guest = learner(storage, "guest");
    storage.grantRole("run-a", guest.learnerId, "participant", a, AT);
    const claims = store.claimBatch({ workerId: "old", scanLimit: 4, slots: 4, leaseMs: 60_000 });
    const claim = claims.find((candidate) => candidate.runId === "run-a")!;
    const preview = storage.deletionPreview("a", { kind: "run", runId: "run-a" }, AT);
    storage.deleteOwnedRun("a", "run-a", AT, preview.digest);
    expect(store.renew(claim, 60_000)).toBeUndefined();
    expect(store.publish(claim, { denominators: [], observations: [], structureStats: [] })).toBe("publication_conflict");
    expect(count(path, "learner_observation_jobs", "run_id = 'run-a'")).toBe(0);
  });
});

describe("criteria 7, 20, 24, 25 — exclusive, recoverable, bounded claims", () => {
  function prepared(): { fixture: FileFixture; store: LongitudinalStore; owner: ReturnType<typeof learner>; run: ReturnType<typeof positionRun> } {
    const value = fixture();
    const owner = learner(value.storage, "o");
    const run = play(positionRun("job"), "e2e4", "e7e5");
    value.storage.create(run, owner);
    return { fixture: value, store: value.workerStore(), owner, run };
  }

  it("yields one claim to two simultaneous claimers and fences an expired generation", () => {
    const { fixture: { clock, workerStore }, store } = prepared();
    const rival = workerStore();
    const [first] = store.claimBatch({ workerId: "a", scanLimit: 4, slots: 1, leaseMs: 60_000 });
    expect(first).toBeDefined();
    expect(rival.claimBatch({ workerId: "b", scanLimit: 4, slots: 1, leaseMs: 60_000 })).toEqual([]);
    clock.now += 60_000;
    const [second] = rival.claimBatch({ workerId: "b", scanLimit: 4, slots: 1, leaseMs: 60_000 });
    expect(second?.generation).toBe(first!.generation + 1);
    expect(store.renew(first!, 60_000)).toBeUndefined();
    expect(store.fail(first!, "derivation_failed")).toBe(false);
    expect(store.publish(first!, { denominators: [], observations: [], structureStats: [] })).toBe("publication_conflict");
    expect(() => rival.renew(first!, 60_000)).toThrow(/WRONG_STORE/u);
    expect(() => store.claimBatch({ workerId: "", scanLimit: 1, slots: 1, leaseMs: 60_000 })).toThrow(/WORKER_ID_INVALID/u);
  });

  it("recovers crash-before-publish after expiry and observes crash-after-publish atomically", () => {
    const { fixture: { path, clock }, store } = prepared();
    store.claimBatch({ workerId: "crashed", scanLimit: 1, slots: 1, leaseMs: 60_000 });
    expect(runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "w", FAST).claimed).toBe(0);
    clock.now += 60_001;
    expect(runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "w", FAST)).toMatchObject({ claimed: 1, completed: 1 });
    expect(jobRow(path, "job")).toMatchObject({ state: "complete", completed_seq: 3, claim_token: null });
    expect(count(path, "learner_observation_denominators", "run_id='job'")).toBeGreaterThan(0);
  });

  it("renews a derivation across the former 30-second boundary; a timer-only heartbeat loses the lease", () => {
    const { fixture: { path, clock }, store } = prepared();
    const config = { ...LONGITUDINAL_WORKER_DEFAULTS, workerLeaseMs: 60_000, workerHeartbeatMs: 10_000 };
    let monotonic = 0;
    const slow = runLongitudinalBatch(store, config, "slow", {
      monotonicNow: () => monotonic,
      project: (image, checkpoint) => {
        for (let step = 0; step < 6; step += 1) { clock.now += 15_000; monotonic += 15_000; checkpoint(); }
        return projectObservations(image, { dependencies: FIXTURE_DEPENDENCIES });
      },
    });
    expect(slow).toMatchObject({ claimed: 1, completed: 1 });
    expect(slow.renewals).toBeGreaterThanOrEqual(3);
    expect(jobRow(path, "job")?.state).toBe("complete");

    const { store: second, fixture: other } = prepared();
    const timerOnly = runLongitudinalBatch(second, config, "timer", {
      project: (image) => { other.clock.now += 90_000; return projectObservations(image, { dependencies: FIXTURE_DEPENDENCIES }); },
    });
    expect(timerOnly).toMatchObject({ claimed: 1, completed: 0, conflicts: 1 });
    expect(jobRow(other.path, "job")?.state).toBe("running");
  });

  it("claims only the executable slot from a four-row oldest-first scan", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    for (const id of ["r1", "r2", "r3", "r4"]) { value.storage.create(positionRun(id), owner); value.clock.now += 1_000; }
    const store = value.workerStore();
    const claims = store.claimBatch({ workerId: "w", scanLimit: 4, slots: 1, leaseMs: 60_000 });
    expect(claims.map((claim) => claim.runId)).toEqual(["r1"]);
    expect(["r2", "r3", "r4"].map((id) => jobRow(value.path, id)?.state)).toEqual(["pending", "pending", "pending"]);
  });

  it("backs off exactly, quarantines at 1/3/5 attempts, survives polls/restart and reopens only on source change", () => {
    const { fixture: { path, clock, storage, reopen }, store, owner, run } = prepared();
    const fail = (code: "derivation_failed" | "publication_conflict" | "snapshot_invalid"): LongitudinalClaim => {
      const [claim] = store.claimBatch({ workerId: "w", scanLimit: 1, slots: 1, leaseMs: 60_000 });
      expect(claim).toBeDefined();
      expect(store.fail(claim!, code)).toBe(true);
      return claim!;
    };
    const start = clock.now;
    fail("derivation_failed");
    expect(jobRow(path, "job")).toMatchObject({ state: "retry_wait", retry_count: 1, failure_code: "derivation_failed", next_attempt_at: new Date(start + 5_000).toISOString() });
    expect(store.claimBatch({ workerId: "w", scanLimit: 1, slots: 1, leaseMs: 60_000 })).toEqual([]);
    clock.now = start + 5_000;
    fail("derivation_failed");
    expect(jobRow(path, "job")).toMatchObject({ retry_count: 2, next_attempt_at: new Date(start + 15_000).toISOString() });
    clock.now = start + 15_000;
    fail("derivation_failed");
    expect(jobRow(path, "job")).toMatchObject({ state: "quarantined", retry_count: 3, failure_code: "derivation_failed", next_attempt_at: null });
    clock.now += 10_000_000;
    expect(store.claimBatch({ workerId: "w", scanLimit: 4, slots: 1, leaseMs: 60_000 })).toEqual([]);
    storage.close();
    const restarted = reopen();
    restarted.reconcileLongitudinalJobs();
    expect(jobRow(path, "job")?.state).toBe("quarantined");
    restarted.save(run, owner);
    expect(jobRow(path, "job")?.state).toBe("quarantined");
    restarted.save(play(run, "g1f3"), owner);
    expect(jobRow(path, "job")).toMatchObject({ state: "pending", retry_count: 0, failure_code: null });
    // publication_conflict: 5/10/20/40 s then quarantine at five attempts; snapshot_invalid at one.
    const base = clock.now;
    const delays = [5_000, 10_000, 20_000, 40_000];
    let at = base;
    for (const delay of delays) {
      clock.now = at;
      fail("publication_conflict");
      expect(jobRow(path, "job")?.next_attempt_at).toBe(new Date(at + delay).toISOString());
      at += delay;
    }
    clock.now = at;
    fail("publication_conflict");
    expect(jobRow(path, "job")).toMatchObject({ state: "quarantined", retry_count: 5 });
    restarted.save(play(run, "g1f3", "b8c6"), owner);
    fail("snapshot_invalid");
    expect(jobRow(path, "job")).toMatchObject({ state: "quarantined", retry_count: 1, failure_code: "snapshot_invalid" });
    expect(() => store.fail({} as LongitudinalClaim, "unknown" as never)).toThrow();
    const database = raw(path);
    expect(() => database.prepare("UPDATE learner_observation_jobs SET failure_code='unknown' WHERE run_id='job'").run()).toThrow(/CHECK/u);
    database.close();
    restarted.close();
  });

  it("resets complete, running, retry_wait and quarantined through one exact pending image", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    const store = value.workerStore();
    const shapes: Record<string, (runId: string) => void> = {
      complete: () => drain(store),
      running: () => { store.claimBatch({ workerId: "w", scanLimit: 1, slots: 1, leaseMs: 60_000 }); },
      retry_wait: () => { const [claim] = store.claimBatch({ workerId: "w", scanLimit: 1, slots: 1, leaseMs: 60_000 }); store.fail(claim!, "derivation_failed"); },
      quarantined: () => { const [claim] = store.claimBatch({ workerId: "w", scanLimit: 1, slots: 1, leaseMs: 60_000 }); store.fail(claim!, "snapshot_invalid"); },
    };
    for (const [state, arrange] of Object.entries(shapes)) {
      const run = play(positionRun(`reset-${state}`), "e2e4");
      value.storage.create(run, owner);
      arrange(run.id);
      const prior = jobRow(value.path, run.id)!;
      expect(prior.state).toBe(state);
      value.clock.now += 1_000;
      const advanced = play(run, "e7e5");
      value.storage.save(advanced, owner);
      const image = value.storage.longitudinalSourceImageV4(run.id, 3);
      expect(jobRow(value.path, run.id)).toEqual({
        run_id: run.id, learner_id: "o", requested_seq: 3, requested_source_digest: value.storage.longitudinalSourceDigestV4(image),
        completed_seq: 0, derived_rev: 1, state: "pending", claim_generation: Number(prior.claim_generation) + 1,
        claimed_requested_seq: null, claimed_source_digest: null, claim_token: null, claimed_by: null, lease_expires_at: null,
        retry_count: 0, next_attempt_at: null, failure_code: null, updated_at: new Date(value.clock.now).toISOString(),
      });
      drain(store);
    }
  });

  it("replaces a wrong revision atomically: old rows gone, one pending current job, idempotent rerun", () => {
    const { fixture: { path, storage }, store } = prepared();
    drain(store);
    expect(count(path, "learner_observation_denominators", "run_id='job'")).toBeGreaterThan(0);
    const database = raw(path);
    database.exec("UPDATE learner_observation_denominators SET derived_rev=7; UPDATE learner_observations SET derived_rev=7; UPDATE learner_structure_stats SET derived_rev=7; UPDATE learner_observation_jobs SET derived_rev=7");
    database.close();
    const [stale] = store.claimBatch({ workerId: "w", scanLimit: 1, slots: 1, leaseMs: 60_000 });
    expect(stale).toBeUndefined();
    const receipt = storage.reconcileLongitudinalJobs();
    expect(receipt).toMatchObject({ revisionReset: 1, created: 0 });
    expect(count(path, "learner_observation_denominators", "run_id='job'")).toBe(0);
    expect(jobRow(path, "job")).toMatchObject({ derived_rev: 1, state: "pending", completed_seq: 0 });
    expect(storage.reconcileLongitudinalJobs()).toMatchObject({ revisionReset: 0, created: 0, advanced: 0 });
  });
});

describe("criterion 8 — exact prefix and publication CAS", () => {
  it("refuses a stale N claimant after M arrives and quarantines corrupt bytes as snapshot_invalid", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    const run = play(positionRun("cut"), "e2e4");
    value.storage.create(run, owner);
    const store = value.workerStore();
    const [claim] = store.claimBatch({ workerId: "w", scanLimit: 1, slots: 1, leaseMs: 60_000 });
    const image = store.claimSourceImage(claim!)!;
    expect(image.runPrefix.events).toHaveLength(2);
    const projection = projectObservations(image, { dependencies: FIXTURE_DEPENDENCIES });
    value.storage.save(play(run, "e7e5"), owner);
    expect(store.claimSourceImage(claim!)).toBeUndefined();
    expect(store.publish(claim!, projection)).toBe("publication_conflict");
    expect(count(value.path, "learner_observation_denominators", "run_id='cut'")).toBe(0);
    expect(jobRow(value.path, "cut")).toMatchObject({ state: "pending", requested_seq: 3 });
    drain(store);
    expect(jobRow(value.path, "cut")).toMatchObject({ state: "complete", completed_seq: 3 });

    // Bytes rewritten outside every writer: the worker re-derives the watermark (fencing itself).
    value.storage.save(play(run, "e7e5", "g1f3"), owner);
    const database = raw(value.path);
    const snapshot = JSON.parse(String((database.prepare("SELECT snapshot_json FROM drill_runs WHERE id='cut'").get() as { snapshot_json: string }).snapshot_json)) as { events: { seq: number }[] };
    snapshot.events[2]!.seq = 9;
    database.prepare("UPDATE drill_runs SET snapshot_json=? WHERE id='cut'").run(JSON.stringify(snapshot));
    database.close();
    const receipt = runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "w", FAST);
    expect(receipt).toMatchObject({ claimed: 1, failed: 1 });
    expect(jobRow(value.path, "cut")).toMatchObject({ state: "quarantined", failure_code: "snapshot_invalid", retry_count: 1 });
  });
});

describe("criteria 13, 21, 26 — read honesty, eligible history and per-cut grain", () => {
  it("serves N → M-pending → M-complete as cut_superseded for N and never M rows under N", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    const run = play(positionRun("race"), "e2e4");
    value.storage.create(run, owner);
    const store = value.workerStore();
    drain(store);
    const n = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "runs", cuts: [{ runId: "race", requestedSeq: 2 }] }));
    expect(n.kind).toBe("complete");
    value.storage.save(play(run, "e7e5"), owner);
    const nPending = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "runs", cuts: [{ runId: "race", requestedSeq: 2 }] }));
    expect(nPending).toEqual({ kind: "incomplete", cuts: [{ kind: "unavailable", runId: "race", requestedSeq: 2, reason: "cut_superseded" }] });
    expect(value.storage.readLongitudinalSnapshot("o", query("o", { kind: "runs", cuts: [{ runId: "race", requestedSeq: 3 }] }))).toMatchObject({ kind: "incomplete", cuts: [{ kind: "pending", runId: "race", requestedSeq: 3, completedSeq: 0 }] });
    drain(store);
    expect(value.storage.readLongitudinalSnapshot("o", query("o", { kind: "runs", cuts: [{ runId: "race", requestedSeq: 2 }] })).kind).toBe("incomplete");
    const m = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "runs", cuts: [{ runId: "race", requestedSeq: 3 }] }));
    expect(m.kind === "complete" ? m.denominators[0]?.decisions : -1).toBe(2);
    expect(() => value.storage.readLongitudinalSnapshot("someone-else", query("o"))).toThrow(/ACTOR_MISMATCH/u);
    expect(() => value.storage.readLongitudinalSnapshot("o", { ...query("o") })).toThrow(/UNPARSED/u);
  });

  it("fixes the eligible census: jobless, complete, suppressed, deleted and later-created runs", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    value.storage.create(play(positionRun("complete"), "e2e4"), owner);
    drain(value.workerStore());
    const database = raw(value.path);
    database.exec("DELETE FROM learner_observation_jobs WHERE run_id='complete'");
    database.close();
    expect(value.storage.readLongitudinalSnapshot("o", query("o"))).toEqual({ kind: "incomplete", cuts: [{ kind: "unavailable", runId: "complete", requestedSeq: 2, reason: "not_requested" }] });
    value.storage.reconcileLongitudinalJobs();
    drain(value.workerStore());
    expect(value.storage.readLongitudinalSnapshot("o", query("o")).kind).toBe("complete");
    value.storage.create(positionRun("later"), owner);
    const next = value.storage.readLongitudinalSnapshot("o", query("o"));
    expect(next.kind === "incomplete" ? next.cuts.map((cut) => [cut.runId, cut.kind]) : []).toEqual([["complete", "complete"], ["later", "pending"]]);
  });

  it("keeps two quarantines, two retry deadlines and four unavailable causes on their own runs", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    const other = learner(value.storage, "x");
    const ids = ["q-snap", "q-derive", "retry-a", "retry-b", "superseded", "revision", "not-mine", "unknown"];
    for (const id of ids.slice(0, 6)) { value.storage.create(play(positionRun(id), "e2e4"), owner); value.clock.now += 1; }
    value.storage.create(positionRun("not-mine"), other);
    // Arrange each durable state directly; the lifecycle transitions themselves are crossed above.
    const database = raw(value.path);
    const set = (id: string, sql: string, ...parameters: (string | number)[]) => database.prepare(`UPDATE learner_observation_jobs SET ${sql} WHERE run_id=?`).run(...parameters, id);
    set("q-snap", "state='quarantined', failure_code='snapshot_invalid', retry_count=1");
    set("q-derive", "state='quarantined', failure_code='derivation_failed', retry_count=3");
    set("retry-a", "state='retry_wait', failure_code='derivation_failed', retry_count=1, next_attempt_at=?", "2026-09-24T11:00:00.000Z");
    set("retry-b", "state='retry_wait', failure_code='publication_conflict', retry_count=2, next_attempt_at=?", "2026-09-24T12:00:00.000Z");
    set("revision", "derived_rev=2");
    database.close();
    const cuts = [...ids.map((runId) => ({ runId, requestedSeq: runId === "superseded" ? 1 : runId === "not-mine" ? 1 : 2 }))];
    const read = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "runs", cuts }));
    expect(read).toEqual({ kind: "incomplete", cuts: [
      { kind: "unavailable", runId: "not-mine", requestedSeq: 1, reason: "not_requested" },
      { kind: "failed", runId: "q-derive", requestedSeq: 2, completedSeq: 0, derivedRev: 1, failureCode: "derivation_failed", attempts: 3 },
      { kind: "failed", runId: "q-snap", requestedSeq: 2, completedSeq: 0, derivedRev: 1, failureCode: "snapshot_invalid", attempts: 1 },
      { kind: "pending", runId: "retry-a", requestedSeq: 2, completedSeq: 0, derivedRev: 1, retryAt: "2026-09-24T11:00:00.000Z" },
      { kind: "pending", runId: "retry-b", requestedSeq: 2, completedSeq: 0, derivedRev: 1, retryAt: "2026-09-24T12:00:00.000Z" },
      { kind: "unavailable", runId: "revision", requestedSeq: 2, reason: "revision_mismatch" },
      { kind: "unavailable", runId: "superseded", requestedSeq: 1, reason: "cut_superseded" },
      { kind: "unavailable", runId: "unknown", requestedSeq: 2, reason: "not_requested" },
    ] });
    expect("failureCode" in read).toBe(false);
  });

  it("filters rows by phase, class, projection and session kind without widening", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    value.storage.create(play(packRun("pack-run"), "e2e4"), owner);
    value.storage.create(importedRun("imported-run", ["e2e4", "e7e5", "d2d4"]), owner, "Imported");
    drain(value.workerStore());
    const games = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "all_complete" }, { decisionClasses: ["game"] }));
    expect(games.kind === "complete" ? new Set(games.observations.map((row) => row.runId)) : null).toEqual(new Set(["imported-run"]));
    const played = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "all_complete" }, { decisionClasses: ["played"] }));
    expect(played.kind === "complete" ? played.observations.every((row) => row.decisionClass === "played" && row.runId === "pack-run") : false).toBe(true);
    const packs = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "all_complete" }, { packIds: ["fixture-pack"] }));
    expect(packs.kind === "complete" ? [...new Set([...packs.denominators, ...packs.observations].map((row) => row.runId))] : []).toEqual(["pack-run"]);
    const family = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "all_complete" }, { projections: [{ id: "derived.semantic_avoidance.open_file", version: 1 }] }));
    expect(family.kind === "complete" ? family.observations.every((row) => row.projectionId === "derived.semantic_avoidance.open_file") && family.observations.length > 0 : false).toBe(true);
  });
});

describe("criterion 11 — authoritative rebuild equality", () => {
  it("names count, ref-element and missing-run tampering and repairs to equality", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    value.storage.create(play(positionRun("tamper"), "e2e4", "e7e5", "d2d4"), owner);
    value.storage.create(play(positionRun("wiped"), "e2e4"), owner);
    const store = value.workerStore();
    drain(store);
    const project = (image: Parameters<typeof projectObservations>[0]) => projectObservations(image, { dependencies: FIXTURE_DEPENDENCIES });
    expect(store.rebuild({ write: false, project }).mismatches).toEqual([]);
    const database = raw(value.path);
    const target = database.prepare("SELECT projection_id, semantic_sign, source_sign, phase, decision_class, opportunity_refs FROM learner_observations WHERE run_id='tamper' ORDER BY projection_id LIMIT 1").get() as Record<string, string>;
    database.prepare("UPDATE learner_observation_denominators SET decisions = decisions + 1 WHERE run_id='tamper'").run();
    const refs = JSON.parse(target.opportunity_refs!) as { nodeId: string }[];
    refs[0]!.nodeId = "forged-node";
    database.prepare("UPDATE learner_observations SET opportunity_refs=? WHERE run_id='tamper' AND projection_id=? AND semantic_sign=? AND source_sign=?").run(JSON.stringify(refs), target.projection_id!, target.semantic_sign!, target.source_sign!);
    database.exec("DELETE FROM learner_observations WHERE run_id='wiped'; DELETE FROM learner_observation_denominators WHERE run_id='wiped'; DELETE FROM learner_structure_stats WHERE run_id='wiped'");
    database.close();
    const report = store.rebuild({ write: false, project });
    const named = report.mismatches.map((row) => `${row.runId}:${row.table}:${row.kind}`);
    expect(named).toContain("tamper:learner_observation_denominators:changed");
    expect(named).toContain("tamper:learner_observations:changed");
    expect(named).toContain("wiped:learner_observation_denominators:missing");
    expect(named).toContain("wiped:learner_structure_stats:missing");
    expect(report.mismatches.some((row) => row.runId === "tamper" && row.key.startsWith(target.projection_id!))).toBe(true);
    const repaired = store.rebuild({ write: true, project });
    expect(repaired.repaired).toBe(2);
    expect(store.rebuild({ write: false, project }).mismatches).toEqual([]);
  });
});

describe("criteria 14, 22 — privacy, deletion and upgrade population", () => {
  it("deletes private rows with the learner, suppresses the retained shared run, and rebuild recreates nothing", () => {
    const value = fixture();
    const owner = learner(value.storage, "leaving");
    const guest = learner(value.storage, "guest");
    value.storage.create(play(positionRun("private"), "e2e4"), owner);
    value.storage.create(play(positionRun("shared"), "e2e4"), owner);
    value.storage.grantRole("shared", guest.learnerId, "participant", owner, AT);
    const store = value.workerStore();
    drain(store);
    const bundle = value.storage.accountBundle("leaving");
    const tables = new Set(bundle.behavioralProfiles.value.map((record) => record.table));
    for (const table of LONGITUDINAL_TABLES) expect(tables.has(table as never), table).toBe(true);
    const preview = value.storage.deletionPreview("leaving", { kind: "account" }, AT);
    expect(preview.hardDelete.find((effect) => effect.kind === "behavioral_profile")?.objectIds.some((id) => id.startsWith("longitudinal-job:"))).toBe(true);
    value.storage.deleteLearner("leaving", AT, preview.digest);
    for (const table of LONGITUDINAL_TABLES) expect(count(value.path, table), table).toBe(0);
    const retained = raw(value.path);
    expect(retained.prepare("SELECT owner_learner_id AS o, longitudinal_profile_disposition AS d FROM drill_runs WHERE id='shared'").get()).toEqual({ o: "__legacy", d: "account_deleted" });
    retained.close();
    value.storage.reconcileLongitudinalJobs();
    drain(store);
    expect(store.rebuild({ write: true, project: (image) => projectObservations(image, { dependencies: FIXTURE_DEPENDENCIES }) }).mismatches).toEqual([]);
    for (const table of LONGITUDINAL_TABLES) expect(count(value.path, table, "learner_id IN ('leaving','__legacy')"), table).toBe(0);
    expect(value.storage.read("shared")).toBeDefined();
  });

  it("previews and cascades one run's rows on per-run deletion while other runs stay intact", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    value.storage.create(play(positionRun("gone"), "e2e4"), owner);
    value.storage.create(play(positionRun("kept"), "e2e4"), owner);
    drain(value.workerStore());
    const preview = value.storage.deletionPreview("o", { kind: "run", runId: "gone" }, AT);
    expect(preview.hardDelete.find((effect) => effect.kind === "behavioral_profile")?.objectIds).toContain("longitudinal-job:gone");
    value.storage.deleteOwnedRun("o", "gone", AT, preview.digest);
    expect(count(value.path, "learner_observation_jobs", "run_id='gone'")).toBe(0);
    expect(count(value.path, "learner_observation_denominators", "run_id='gone'")).toBe(0);
    expect(count(value.path, "learner_observation_denominators", "run_id='kept'")).toBeGreaterThan(0);
  });

  it("queues untouched native, imported and active shared runs on first upgraded start, idempotently", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    const guest = learner(value.storage, "g");
    value.storage.create(play(positionRun("native"), "e2e4"), owner);
    value.storage.createImportedRun(importedRun("imported", ["e2e4", "e7e5"]), owner, "Imported", { runId: "imported", sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"b".repeat(64)}`, headers: {}, result: "*", pgn: "1. e4 e5 *", licenceNote: "fixture", importedAt: AT } as never);
    value.storage.create(play(positionRun("shared"), "e2e4"), owner);
    value.storage.createLiveSession({ id: "live", runId: "shared", kind: "academy", title: "Live", boardControl: "free_claim", createdBy: owner.learnerId, at: AT });
    value.storage.grantRole("shared", guest.learnerId, "participant", owner, AT);
    value.storage.create(play(positionRun("suppressed"), "e2e4"), owner);
    const database = raw(value.path);
    // Simulate a database upgraded from storage 25: no jobs, legacy attribution, one suppressed run.
    database.exec("DELETE FROM learner_observation_jobs; UPDATE drill_runs SET longitudinal_structure_attribution='unattributable_legacy' WHERE id<>'shared'; UPDATE drill_runs SET longitudinal_profile_disposition='account_deleted' WHERE id='suppressed'");
    database.exec("CREATE TRIGGER fail_imported BEFORE INSERT ON learner_observation_jobs WHEN NEW.run_id='shared' BEGIN SELECT RAISE(ABORT,'injected'); END;");
    expect(() => value.storage.reconcileLongitudinalJobs(1)).toThrow(/injected/u);
    const partial = count(value.path, "learner_observation_jobs");
    database.exec("DROP TRIGGER fail_imported");
    database.close();
    expect(partial).toBeLessThan(3);
    const receipt = value.storage.reconcileLongitudinalJobs();
    expect(receipt).toMatchObject({ scanned: 4, created: 3 - partial, suppressed: 1 });
    expect(["imported", "native", "shared"].map((id) => jobRow(value.path, id)?.state)).toEqual(["pending", "pending", "pending"]);
    expect(jobRow(value.path, "suppressed")).toBeUndefined();
    const again = value.storage.reconcileLongitudinalJobs();
    expect(again).toMatchObject({ created: 0, advanced: 0, revisionReset: 0, digest: receipt.digest });
    // Legacy journal-less decisions are admitted; legacy never emits structure rows.
    const legacy = value.storage.longitudinalSourceImageV4("native", 2);
    expect(legacy.structureAttribution).toBe("unattributable_legacy");
    expect(legacy.moveAuthorship.map((row) => row.learnerId)).toEqual(["o"]);
  });
});

describe("criteria 3, 18, 28 — SQL constraints, four-way phase through storage, store-scoped source authority", () => {
  it("refuses denominator-free, crossed and ref-cardinality-violating rows in SQLite itself", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    value.storage.create(play(positionRun("sql"), "e2e4"), owner);
    const database = raw(value.path);
    database.prepare("INSERT INTO learner_observation_denominators VALUES ('o','sql','opening','played',1,?,1)").run(AT);
    const insert = (opportunities: number, occurred: number, share: number, occurredRefs: unknown[], opportunityRefs: unknown[], phase = "opening") => database.prepare(`INSERT INTO learner_observations
      (learner_id,run_id,projection_id,projection_version,semantic_sign,source_sign,phase,decision_class,session_kind,pack_id,opportunities,occurred,alternative_share_sum,occurred_refs,opportunity_refs,observed_at,derived_rev)
      VALUES ('o','sql','rules.structural.event.open_file',1,'gained','gained',?,'played','position',NULL,?,?,?,?,?,?,1)`).run(phase, opportunities, occurred, share, JSON.stringify(occurredRefs), JSON.stringify(opportunityRefs), AT);
    const ref = { kind: "move", nodeId: "n", eventSeq: 2 };
    expect(() => insert(0, 0, 0, [], [])).toThrow(/CHECK/u);
    expect(() => insert(1, 2, 0, [ref, ref], [ref])).toThrow(/CHECK/u);
    expect(() => insert(1, 1, 1.5, [ref], [ref])).toThrow(/CHECK/u);
    expect(() => insert(1, 1, 0.5, [], [ref])).toThrow(/CHECK/u);
    expect(() => insert(1, 1, 0.5, [ref], [ref], "late")).toThrow(/CHECK/u);
    expect(() => insert(1, 1, 0.5, [ref], [ref], "endgame")).toThrow(/FOREIGN KEY/u);
    insert(1, 1, 0.5, [ref], [ref]);
    expect(() => database.prepare("UPDATE learner_observation_jobs SET claim_token='t' WHERE run_id='sql'").run()).toThrow(/CHECK/u);
    expect(() => database.prepare("UPDATE learner_observation_jobs SET completed_seq=1 WHERE run_id='sql'").run()).toThrow(/CHECK/u);
    expect(() => database.prepare("UPDATE learner_observation_jobs SET updated_at='yesterday' WHERE run_id='sql'").run()).toThrow(/CHECK/u);
    expect(() => database.prepare("UPDATE learner_observation_jobs SET state='retry_wait', failure_code='snapshot_invalid', retry_count=1, next_attempt_at=? WHERE run_id='sql'").run(AT)).toThrow(/CHECK/u);
    expect(() => database.prepare("UPDATE learner_observation_jobs SET state='quarantined', failure_code='derivation_failed', retry_count=2 WHERE run_id='sql'").run()).toThrow(/CHECK/u);
    expect(() => database.prepare("UPDATE learner_observation_jobs SET state='running', claimed_requested_seq=1, claimed_source_digest=requested_source_digest, claim_token='t', claimed_by='', lease_expires_at=? WHERE run_id='sql'").run(AT)).toThrow(/CHECK/u);
    database.close();
  });

  it("carries opening, middlegame, endgame and unclear through both tables and the typed phase filter", () => {
    const value = fixture();
    const owner = learner(value.storage, "o");
    const phases = [
      ["opening", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e4"],
      ["middlegame", "r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 1", "a2a3"],
      ["endgame", "8/5k2/8/8/8/8/5K2/4R3 w - - 0 1", "e1e2"],
      ["unclear", "4k3/8/8/8/8/8/8/3QK2R w K - 0 1", "d1d2"],
    ] as const;
    for (const [phase, fen, move] of phases) value.storage.create(play(positionRun(`phase-${phase}`, fen), move), owner);
    drain(value.workerStore());
    for (const [phase] of phases) {
      const read = value.storage.readLongitudinalSnapshot("o", query("o", { kind: "all_complete" }, { phases: [phase] }));
      expect(read.kind === "complete" ? [...new Set(read.denominators.map((row) => `${row.runId}:${row.phase}`))] : [], phase).toEqual([`phase-${phase}:${phase}`]);
    }
  });

  it("scopes source digest authority to one store while equal content keeps an equal digest", () => {
    const first = fixture();
    const second = fixture();
    for (const value of [first, second]) {
      const owner = learner(value.storage, "o");
      value.storage.create(play(positionRun("same"), "e2e4"), owner);
    }
    const image = first.storage.longitudinalSourceImageV4("same", 2);
    const twin = second.storage.longitudinalSourceImageV4("same", 2);
    expect(first.storage.longitudinalSourceDigestV4(image)).toBe(second.storage.longitudinalSourceDigestV4(twin));
    expect(() => second.storage.longitudinalSourceDigestV4(image)).toThrow(/WRONG_STORE/u);
    expect(() => first.storage.longitudinalSourceDigestV4({ ...image })).toThrow(/WRONG_STORE/u);
    expect(jobRow(first.path, "same")?.requested_source_digest).toBe(first.storage.longitudinalSourceDigestV4(image));
  });
});
