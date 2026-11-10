// D4181/A.2.6: genuine schema34/revision8 output through the real startup and worker.
// Only installed pack acquisition is replaced; this does not prove default-content release.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";
import { parseLongitudinalReadQuery } from "./longitudinal-contract.js";
import { projectObservations } from "./longitudinal-projector.js";
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import { LONGITUDINAL_TABLES, LongitudinalStore } from "./longitudinal-store.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { LongitudinalProjectionWorker } from "./longitudinal-worker.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";

interface HistoricalFixture {
  schemaVersion: number;
  derivationRevision: number;
  sourceBundleSha256: string;
  schema: { type: string; name: string; sql: string }[];
  tables: { name: string; rows: Record<string, SQLInputValue>[] }[];
  counts: Record<string, number>;
}
const prior = JSON.parse(readFileSync(new URL("./fixtures/longitudinal-predecessor-rev8.json", import.meta.url), "utf8")) as HistoricalFixture;
const owner = "research-profile-owner";
const families = LONGITUDINAL_TABLES.filter(table => table !== "learner_observation_jobs");
const priorFamilies = families.filter(table => table !== "learner_subject_observations" && table !== "learner_subject_evaluations");
const directories: string[] = [], databases: DatabaseSync[] = [], stores: SQLiteRunStorage[] = [];
let application: ChessTabiyaApplication | undefined;
const quoted = (name: string) => `"${name.replaceAll('"', '""')}"`;
beforeEach(() => installEmptyApplicationCatalogues());
afterEach(async () => {
  const closing = application; application = undefined;
  try { await closing?.close(); }
  finally {
    vi.restoreAllMocks();
    for (const store of stores.splice(0)) store.close();
    for (const db of databases.splice(0)) db.close();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  }
});

function restore() {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-genuine-rev8-")); directories.push(directory);
  const path = join(directory, "history.sqlite"), db = new DatabaseSync(path); databases.push(db);
  // A SQL dump follows schema creation order, not foreign-key parent order. Restore the
  // complete original image, then re-enable and check every FK before application startup.
  db.exec("PRAGMA foreign_keys=OFF; BEGIN");
  for (const entry of prior.schema.filter(row => row.type === "table")) db.exec(entry.sql);
  for (const table of prior.tables) for (const row of table.rows) {
    const columns = Object.keys(row);
    db.prepare(`INSERT INTO ${quoted(table.name)} (${columns.map(quoted).join(",")}) VALUES (${columns.map(() => "?").join(",")})`)
      .run(...columns.map(column => row[column]!));
  }
  for (const entry of prior.schema.filter(row => row.type !== "table")) db.exec(entry.sql);
  db.exec(`PRAGMA user_version=${prior.schemaVersion}; COMMIT; PRAGMA foreign_keys=ON`);
  expect(db.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
  expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  return { path, db };
}
function count(db: DatabaseSync, table: string) {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${quoted(table)}`).get()!.n);
}
function protectedRows(db: DatabaseSync) {
  return Object.fromEntries(prior.tables.filter(table => !LONGITUDINAL_TABLES.some(name => name === table.name))
    .map(table => [table.name, db.prepare(`SELECT * FROM ${quoted(table.name)} ORDER BY rowid`).all()]));
}
function allFamilies(db: DatabaseSync) {
  return Object.fromEntries(families.map(table => [table, db.prepare(`SELECT * FROM ${quoted(table)} ORDER BY rowid`).all()]));
}
function query() {
  return parseLongitudinalReadQuery({ learnerId: owner, derivationRev: OBSERVATION_DERIVATION_REV,
    through: { kind: "all_complete" }, filter: {} });
}
async function complete(app: ChessTabiyaApplication) {
  const deadline = Date.now() + 10_000;
  for (;;) {
    const result = app.longitudinal.read(owner, query());
    if (result.cuts.some(cut => cut.kind === "failed")) throw Error("Actual migration worker failed");
    if (result.kind === "complete" && (app.longitudinal.progress()?.completed ?? 0) >= 3) return result;
    if (Date.now() > deadline) throw Error(`Migration worker did not finish: ${JSON.stringify({ result, progress: app.longitudinal.progress() })}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Like the existing real-thread startup suite, this is a multi-game migration/rebuild
// journey, not a single HTTP request latency budget. Its worker wait is separately bounded.
describe("D4181 actual revision-eight saved-history upgrade", { timeout: 120_000 }, () => {
  it("retains original old schema and all five populated outputs, including both native sides and import", () => {
    expect(prior.schemaVersion).toBe(34); expect(prior.derivationRevision).toBe(8);
    expect(prior.sourceBundleSha256).toBe("4ef251804f2b2e9342455822a7c75aa9a2900e0845d17f9f3d31fde4e476df77");
    expect(prior.schema.some(row => row.name === "learner_subject_observations")).toBe(false);
    const { db } = restore();
    for (const table of priorFamilies) {
      expect(count(db, table), table).toBe(prior.counts[table]);
      expect(count(db, table), table).toBeGreaterThan(0);
      expect(db.prepare(`SELECT DISTINCT derived_rev FROM ${quoted(table)}`).all()).toEqual([{ derived_rev: 8 }]);
    }
    expect(db.prepare("SELECT id FROM drill_runs ORDER BY id").all()).toEqual([
      { id: "genuine8-imported" }, { id: "genuine8-native-black" }, { id: "genuine8-native-white" },
    ]);
    expect(db.prepare("SELECT DISTINCT state,derived_rev FROM learner_observation_jobs").all())
      .toEqual([{ state: "complete", derived_rev: 8 }]);
  });

  it("invalidates before real worker startup, publishes all seven families, and survives reopen and complete rebuild", async () => {
    const { path, db } = restore(), before = protectedRows(db);
    const heads = db.prepare("SELECT run_id,requested_seq,claim_generation FROM learner_observation_jobs ORDER BY run_id").all();
    const realStart = LongitudinalProjectionWorker.start.bind(LongitudinalProjectionWorker);
    let release!: () => void, entered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const starting = new Promise<void>(resolve => { entered = resolve; });
    const start = vi.spyOn(LongitudinalProjectionWorker, "start").mockImplementation(async input => {
      entered(); await held; return realStart(input);
    });
    const boot = createApplication({ development: true, engineMode: "mock", cookieSecure: false, databasePath: path,
      longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    void boot.catch(() => {});
    try {
      await Promise.race([starting, boot.then(() => { throw Error("Expected held worker startup"); })]);
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: STORAGE_VERSION });
      for (const table of families) expect(count(db, table), table).toBe(0);
      expect(db.prepare("SELECT DISTINCT derived_rev,state,completed_seq FROM learner_observation_jobs").all())
        .toEqual([{ derived_rev: 10, state: "pending", completed_seq: 0 }]);
      expect(db.prepare("SELECT run_id,requested_seq,claim_generation-1 AS claim_generation FROM learner_observation_jobs ORDER BY run_id").all()).toEqual(heads);
      expect(new LongitudinalStore(db).readSnapshot(owner, query()).kind).toBe("incomplete");
      expect(protectedRows(db)).toEqual(before);
    } finally { release(); application = await boot; start.mockRestore(); }
    expect(application.startupReceipt.longitudinal).toMatchObject({ revisionReset: 3 });
    const snapshot = await complete(application);
    expect(snapshot.cuts).toHaveLength(3);
    for (const table of families) {
      expect(count(db, table), table).toBeGreaterThan(0);
      expect(db.prepare(`SELECT DISTINCT derived_rev FROM ${quoted(table)}`).all()).toEqual([{ derived_rev: 10 }]);
    }
    const originalFamilies = allFamilies(db);
    const closing = application; application = undefined; await closing.close();
    const reopened = new SQLiteRunStorage(path, { onMigration: () => {} }); stores.push(reopened);
    expect(reopened.readLongitudinalSnapshot(owner, query())).toEqual(snapshot);
    expect(allFamilies(db)).toEqual(originalFamilies);
    const operator = new LongitudinalStore(db);
    const clean = operator.rebuild({ write: false, project: projectObservations });
    expect(clean.checked).toBe(3); expect(clean.mismatches).toEqual([]);
    expect(clean.skipped.revision_mismatch).toEqual([]);
    // Omit one real row from EVERY family at once. A check covering only the old aggregate
    // table would miss GAME/choice/subjects; require each name in the actual rebuild report.
    for (const table of families) db.exec(`DELETE FROM ${quoted(table)} WHERE rowid=(SELECT MIN(rowid) FROM ${quoted(table)})`);
    const damaged = operator.rebuild({ write: false, project: projectObservations });
    expect(new Set(damaged.mismatches.map(row => row.table))).toEqual(new Set(families));
    expect(operator.rebuild({ write: true, project: projectObservations }).repaired).toBeGreaterThan(0);
    expect(operator.rebuild({ write: false, project: projectObservations }).mismatches).toEqual([]);
    expect(reopened.readLongitudinalSnapshot(owner, query())).toEqual(snapshot);
    // Publication may reallocate rowids, so compare complete SQL records canonically.
    const canonical = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value)
      .map(([table, rows]) => [table, (rows as object[]).map(row => JSON.stringify(row)).sort()]));
    expect(canonical(allFamilies(db))).toEqual(canonical(originalFamilies));
    expect(protectedRows(db)).toEqual(before);
  });
});
