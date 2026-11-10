// D4200: genuine predecessor output and actual startup migration/rebuild.
// Fixed genuine schema35/revision9 data remains readable without any ignored old executable.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApplication } from "./application.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";
import { parseLongitudinalReadQuery } from "./longitudinal-contract.js";
import { projectObservations } from "./longitudinal-projector.js";
import { LongitudinalStore } from "./longitudinal-store.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { LongitudinalProjectionWorker } from "./longitudinal-worker.js";
import { SQLiteRunStorage } from "./storage.js";

const prior = JSON.parse(readFileSync(new URL("./fixtures/longitudinal-predecessor-rev9.json", import.meta.url), "utf8")) as {
  sourceCommit: string; schemaVersion: number; derivationRevision: number; owner: string;
  schema: { type: string; name: string; sql: string }[];
  tables: { name: string; rows: Record<string, SQLInputValue>[] }[];
  counts: Record<string, number>;
};
const families = ["learner_observation_denominators", "learner_observations", "learner_structure_stats",
  "learner_game_facts", "learner_choice_facts", "learner_subject_observations"] as const;
const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
let directory: string, db: DatabaseSync;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "tabiya-revision9-fixture-"));
  db = new DatabaseSync(join(directory, "history.sqlite"));
  db.exec("PRAGMA foreign_keys=OFF; BEGIN");
  for (const item of prior.schema.filter(row => row.type === "table")) db.exec(item.sql);
  for (const table of prior.tables) {
    if (table.rows.length === 0) continue;
    const columns = Object.keys(table.rows[0]!);
    const insert = db.prepare(`INSERT INTO ${quote(table.name)} (${columns.map(quote).join(",")}) VALUES (${columns.map(() => "?").join(",")})`);
    for (const row of table.rows) insert.run(...columns.map(column => row[column]!));
  }
  for (const item of prior.schema.filter(row => row.type !== "table")) db.exec(item.sql);
  db.exec("PRAGMA user_version=35; COMMIT; PRAGMA foreign_keys=ON");
});
afterEach(() => { try { db?.close(); } finally { if (directory !== undefined) rmSync(directory, { recursive: true, force: true }); } });

it("restores actual predecessor publication for both native colors and imports across all six old families", () => {
  expect(prior.schemaVersion).toBe(35); expect(prior.derivationRevision).toBe(9);
  expect(prior.sourceCommit).toBe("ce675044b1b74e66b24f736b30e2f34060cba918");
  expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 35 });
  expect(db.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
  expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  expect(Object.keys(prior.counts).sort()).toEqual([...families].sort());
  for (const table of families) {
    expect(Number(db.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n), table).toBe(prior.counts[table]);
    expect(prior.counts[table], table).toBeGreaterThan(0);
    expect(db.prepare(`SELECT DISTINCT derived_rev FROM ${table}`).all()).toEqual([{ derived_rev: 9 }]);
  }
  expect(db.prepare("SELECT run_id FROM learner_observation_jobs ORDER BY run_id").all()).toEqual([
    { run_id: "genuine9-imported" }, { run_id: "genuine9-native-black" }, { run_id: "genuine9-native-white" },
    { run_id: "genuine9-required-risk" }, { run_id: "genuine9-unrelated-abstention" },
  ]);
  expect(db.prepare("SELECT DISTINCT state,derived_rev,requested_seq=completed_seq AS complete FROM learner_observation_jobs").all())
    .toEqual([{ state: "complete", derived_rev: 9, complete: 1 }]);
  expect(db.prepare("SELECT 1 FROM sqlite_master WHERE name='learner_subject_evaluations'").get()).toBeUndefined();
  expect(db.prepare("SELECT DISTINCT source_kind FROM learner_subject_observations ORDER BY source_kind").all())
    .toEqual([{ source_kind: "condition_relation" }, { source_kind: "native_incidence" }]);
});

it("keeps the real whole-decision suppression controls in saved source data for the successor to repair", () => {
  for (const [runId, rootFen] of [
    ["genuine9-unrelated-abstention", "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1"],
    ["genuine9-required-risk", "7k/8/8/8/8/8/8/r6K w - - 0 1"],
  ]) {
    const run = JSON.parse(String(db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(runId!)!.snapshot_json)) as { nodes: { parentId: string | null; fen: string }[] };
    expect(run.nodes.find(node => node.parentId === null)!.fen).toBe(rootFen);
    expect(db.prepare("SELECT sum(decisions) AS n FROM learner_observation_denominators WHERE run_id=?").get(runId!)).toEqual({ n: 1 });
    expect(db.prepare("SELECT count(*) AS n FROM learner_subject_observations WHERE run_id=?").get(runId!)).toEqual({ n: 0 });
    expect(db.prepare("SELECT count(*) AS n FROM learner_observations WHERE run_id=?").get(runId!)).toEqual({ n: 0 });
    expect(db.prepare("SELECT count(*) AS n FROM imported_games WHERE run_id=?").get(runId!)).toEqual({ n: 1 });
  }
});

it("upgrades five genuine revision 9 jobs before the worker, then rebuilds all seven families", async () => {
  installEmptyApplicationCatalogues();
  const path = join(directory, "history.sqlite");
  const derived = [...families, "learner_subject_evaluations"];
  const preserved = prior.tables.filter(table => !derived.includes(table.name) && table.name !== "learner_observation_jobs");
  const protectedRows = () => preserved.map(table => db.prepare(`SELECT * FROM ${quote(table.name)} ORDER BY rowid`).all());
  const before = protectedRows();
  const heads = db.prepare("SELECT run_id,requested_seq,claim_generation FROM learner_observation_jobs ORDER BY run_id").all();
  const query = parseLongitudinalReadQuery({
    learnerId: prior.owner,
    derivationRev: 10,
    through: { kind: "all_complete" },
    filter: {},
    includeSubjectObservations: true,
  });
  const realStart = LongitudinalProjectionWorker.start.bind(LongitudinalProjectionWorker);
  let release!: () => void;
  let entered!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const starting = new Promise<void>(resolve => { entered = resolve; });
  const start = vi.spyOn(LongitudinalProjectionWorker, "start").mockImplementation(async input => {
    entered();
    await held;
    return realStart(input);
  });
  const boot = createApplication({ development: true, engineMode: "mock", cookieSecure: false,
    databasePath: path, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
  void boot.catch(() => {});
  let closed = false;
  try {
    await Promise.race([starting, boot.then(() => { throw Error("Expected held worker startup"); })]);
    expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 36 });
    for (const table of derived) {
      expect(db.prepare(`SELECT count(*) AS n FROM ${quote(table)}`).get(), table).toEqual({ n: 0 });
    }
    expect(db.prepare("SELECT DISTINCT derived_rev,state,completed_seq FROM learner_observation_jobs").all())
      .toEqual([{ derived_rev: 10, state: "pending", completed_seq: 0 }]);
    expect(db.prepare("SELECT run_id,requested_seq,claim_generation-1 AS claim_generation FROM learner_observation_jobs ORDER BY run_id").all())
      .toEqual(heads);
    expect(protectedRows()).toEqual(before);
    release();
    const app = await boot;
    expect(app.startupReceipt.longitudinal).toMatchObject({ revisionReset: 5 });
    const deadline = Date.now() + 30_000;
    let snapshot = app.longitudinal.read(prior.owner, query);
    while (snapshot.kind !== "complete") {
      if (snapshot.cuts.some(cut => cut.kind === "failed") || Date.now() >= deadline) {
        throw new Error(`Upgrade worker did not complete: ${JSON.stringify(snapshot.cuts)}`);
      }
      await new Promise(resolve => setTimeout(resolve, 20));
      snapshot = app.longitudinal.read(prior.owner, query);
    }
    expect(snapshot.cuts).toHaveLength(5);
    expect(snapshot.coverage.sources).toHaveLength(54);
    for (const table of derived) {
      expect(db.prepare(`SELECT DISTINCT derived_rev FROM ${quote(table)}`).all(), table).toEqual([{ derived_rev: 10 }]);
    }
    for (const [runId, legalAlternatives, projection] of [
      ["genuine9-unrelated-abstention", 11, { id: "derived.tactic.defender_exposure", version: 2 }],
      ["genuine9-required-risk", 1, { id: "derived.semantic_avoidance.loose_piece", version: 2 }],
    ] as const) {
      expect(snapshot.coverage.decisions).toContainEqual(expect.objectContaining({
        runId, legalAlternatives, unavailable: expect.arrayContaining([expect.objectContaining({ projection })]),
      }));
      expect(snapshot.subjectObservations.some(row => row.runId === runId && row.projectionId !== projection.id)).toBe(true);
      expect(snapshot.subjectObservations.some(row => row.runId === runId && row.projectionId === projection.id &&
        row.projectionVersion === projection.version)).toBe(false);
    }
    await app.close();
    closed = true;
    const reopened = new SQLiteRunStorage(path, { onMigration: () => {} });
    try {
      expect(reopened.readLongitudinalSnapshot(prior.owner, query)).toEqual(snapshot);
      const operator = new LongitudinalStore(db);
      expect(operator.rebuild({ write: false, project: projectObservations })).toMatchObject({ checked: 5, mismatches: [] });
      db.exec("DELETE FROM learner_subject_evaluations WHERE run_id='genuine9-unrelated-abstention'");
      expect(operator.rebuild({ write: true, project: projectObservations }).repaired).toBe(1);
      expect(reopened.readLongitudinalSnapshot(prior.owner, query)).toEqual(snapshot);
      expect(protectedRows()).toEqual(before);
      expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    } finally { reopened.close(); }
  } finally {
    release();
    start.mockRestore();
    if (!closed) await (await boot.catch(() => undefined))?.close();
  }
}, 120_000);

it("rolls back migration 36 when its cohort index name is already occupied", () => {
  const path = join(directory, "history.sqlite");
  db.exec("CREATE INDEX learner_subject_evaluations_cohort ON learners(id)");
  const before = db.prepare("SELECT type,name,sql FROM sqlite_schema ORDER BY name").all();
  const heads = db.prepare("SELECT * FROM learner_observation_jobs ORDER BY run_id").all();
  expect(() => new SQLiteRunStorage(path, { onMigration: () => {} })).toThrow("Could not migrate run storage");
  expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 35 });
  expect(db.prepare("SELECT type,name,sql FROM sqlite_schema ORDER BY name").all()).toEqual(before);
  expect(db.prepare("SELECT * FROM learner_observation_jobs ORDER BY run_id").all()).toEqual(heads);
  db.exec("DROP INDEX learner_subject_evaluations_cohort");
  new SQLiteRunStorage(path, { onMigration: () => {} }).close();
  expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 36 });
});
