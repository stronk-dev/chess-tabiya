import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Worker } from "node:worker_threads";
import { afterEach, expect, it } from "vitest";
import { observeMainSqliteWrites } from "./sqlite-read-guard.js";

const databases: DatabaseSync[] = [];
let guard: ReturnType<typeof observeMainSqliteWrites> | undefined;
afterEach(() => { try { for (const db of databases.splice(0)) if (db.isOpen) db.close(); } finally { guard?.restore(); guard = undefined; } });
function fixture() {
  guard = observeMainSqliteWrites();
  const db = new DatabaseSync(":memory:"); databases.push(db);
  db.exec("CREATE TABLE witness(id INTEGER PRIMARY KEY, value TEXT); INSERT INTO witness VALUES(1,'original')");
  return db;
}

it("detects a cached same-cardinality UPDATE without changing how SQL executes", () => {
  const db = fixture(), cached = db.prepare("UPDATE witness SET value='changed' WHERE id=1");
  const before = guard!.snapshot(), count = db.prepare("SELECT count(*) AS n FROM witness").get();
  cached.run();
  expect(db.prepare("SELECT count(*) AS n FROM witness").get()).toEqual(count);
  expect(() => guard!.assertUnchanged(before)).toThrow(/Read sequence changed/);
});

it("detects rolled-back DML activity even though final row values are unchanged", () => {
  const db = fixture(), before = guard!.snapshot();
  db.exec("BEGIN; UPDATE witness SET value='rolled back'; ROLLBACK");
  expect(db.prepare("SELECT value FROM witness").get()).toEqual({ value: "original" });
  expect(() => guard!.assertUnchanged(before)).toThrow(/Read sequence changed/);
});

it.each(["close", "dispose"])("retains a transient connection's changes through %s", mode => {
  fixture(); const before = guard!.snapshot();
  const transient = new DatabaseSync(":memory:"); databases.push(transient);
  transient.exec("CREATE TABLE transient(value TEXT); INSERT INTO transient VALUES('written')");
  if (mode === "close") transient.close(); else transient[Symbol.dispose]();
  expect(() => guard!.assertUnchanged(before)).toThrow(/Read sequence changed/);
});

it("detects a main-schema change even with no row DML", () => {
  const db = fixture(), before = guard!.snapshot();
  db.exec("CREATE TABLE empty_schema_witness(value TEXT)");
  expect(() => guard!.assertUnchanged(before)).toThrow(/Read sequence changed/);
});

it("accepts new read-only connections and refuses an unobserved close rather than skipping it", () => {
  fixture(); const before = guard!.snapshot();
  const transient = new DatabaseSync(":memory:"); databases.push(transient);
  transient.prepare("SELECT 1").get(); transient.close(); guard!.assertUnchanged(before);
  // A deliberately bypassed close must fail sampling, never silently disappear from the proof.
  const db = databases[0]!;
  guard!.restore(); db.close();
  expect(() => guard!.snapshot()).toThrow(/closed without a final sample/);
});

it("sees actual Worker row changes while keeping main-process DML counters unchanged", async () => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-sqlite-read-guard-"));
  guard = observeMainSqliteWrites();
  const path = join(directory, "worker.sqlite"), db = new DatabaseSync(path); databases.push(db);
  db.exec("CREATE TABLE witness(value TEXT); INSERT INTO witness VALUES('original')");
  const before = guard.snapshot();
  const worker = new Worker(`const {workerData}=require('node:worker_threads');
    const {DatabaseSync}=require('node:sqlite'); const db=new DatabaseSync(workerData);
    db.prepare("UPDATE witness SET value='worker'").run(); db.close();`, { eval: true, workerData: path });
  try {
    expect((await once(worker, "exit"))[0]).toBe(0);
    expect(db.prepare("SELECT value FROM witness").get()).toEqual({ value: "worker" });
    guard.assertUnchanged(before);
  } finally { await worker.terminate(); db.close(); rmSync(directory, { recursive: true, force: true }); }
});

it("refuses a reopened object even when its reset counters match the old connection exactly", () => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-sqlite-reopen-"));
  guard = observeMainSqliteWrites();
  const db = new DatabaseSync(join(directory, "reopen.sqlite")); databases.push(db);
  try {
    db.exec("CREATE TABLE witness(value TEXT); INSERT INTO witness VALUES('original')");
    const before = guard.snapshot();
    expect(db.prepare("SELECT total_changes() AS n").get()).toEqual({ n: 1 });
    db.close(); db.open();
    db.exec("UPDATE witness SET value='changed'");
    expect(db.prepare("SELECT total_changes() AS n").get()).toEqual({ n: 1 });
    expect(db.prepare("SELECT value FROM witness").get()).toEqual({ value: "changed" });
    expect(() => guard!.assertUnchanged(before)).toThrow(/object reopened/);
  } finally { db.close(); rmSync(directory, { recursive: true, force: true }); }
});
