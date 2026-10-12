import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { assertRestoredStorageRows, readStorageRows, verifyRestoredWorkflows } from "./storage-population.mjs";

test("population comparison reads exact real rows, not just nonempty table counts", async t => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-population-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const database = join(directory, "database.sqlite");
  const db = new DatabaseSync(database);
  t.after(() => db.close());
  db.exec("CREATE TABLE accounts(id TEXT PRIMARY KEY, label TEXT); CREATE TABLE runs(id TEXT PRIMARY KEY); INSERT INTO accounts VALUES('learner', 'Original'); INSERT INTO runs VALUES('game');");
  const rows = await readStorageRows(database);
  const fixture = { rows, tables: [{ store: "accounts", dataClass: "identity" }, { store: "runs", dataClass: "play" }], nonemptyFamilies: ["accounts", "runs"] };
  assertRestoredStorageRows(await readStorageRows(database), fixture);
  db.exec("UPDATE accounts SET label='Wrong' WHERE id='learner'");
  const changedRows = await readStorageRows(database);
  assert.throws(() => assertRestoredStorageRows(changedRows, fixture));
  assert.throws(() => assertRestoredStorageRows({ accounts: rows.accounts }, fixture));
  assert.throws(() => assertRestoredStorageRows({ ...rows, untracked: [] }, fixture));
  assert.throws(() => assertRestoredStorageRows(rows, { ...fixture, tables: fixture.tables.slice(0, 1) }));
  assert.throws(() => assertRestoredStorageRows({ ...rows, runs: [] }, { ...fixture, rows: { ...rows, runs: [] } }));
  assert.throws(() => assertRestoredStorageRows(rows, { ...fixture, nonemptyFamilies: [...fixture.nonemptyFamilies, "absent"] }));
});

test("standalone bundle row read leaves its immutable bytes and directory untouched", async t => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-bundle-read-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const database = join(directory, "database.sqlite");
  const db = new DatabaseSync(database);
  db.exec("PRAGMA journal_mode=WAL; CREATE TABLE accounts(id TEXT); INSERT INTO accounts VALUES('original');");
  db.close();
  const bytes = readFileSync(database), files = readdirSync(directory);
  assert.deepEqual(await readStorageRows(database, true), { accounts: [{ id: "original" }] });
  assert.deepEqual(readFileSync(database), bytes);
  assert.deepEqual(readdirSync(directory), files);
});

test("image workflow verification refuses a wrong restored identity before any mutation", async () => {
  const calls = [];
  const fixture = { accounts: { keeper: { learner: { id: "original" } } } };
  await assert.rejects(verifyRestoredWorkflows(async (...args) => {
    calls.push(args); return { learner: { id: "replacement" } };
  }, fixture, { continuePlay: true }));
  assert.deepEqual(calls, [["keeper", "/auth/session"]]);
});
