import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import {
  LIVE_CONSUMER_PATHS,
  RevisionCatalogue,
  assertConsumerClosureFromRepository,
  canonicalPackProjection,
  canonicalRunSnapshot,
  digestBytes,
  migrateLegacyConceptBatch,
  parseConceptRef,
  revisionBytes,
} from "./model.mjs";

function catalogue() {
  const registry = new RevisionCatalogue();
  const head = registry.publish(revisionBytes(null, [
    { id: "fork", label: "Fork", status: "active" },
    { id: "pin", label: "Pin", status: "active" },
  ]));
  return { registry, head };
}

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE drill_runs (id TEXT PRIMARY KEY, snapshot_json TEXT NOT NULL);
    CREATE TABLE attempts (run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, pack_digest TEXT NOT NULL, PRIMARY KEY(run_id,branch_id));
    CREATE TABLE attempt_concepts (row_id INTEGER PRIMARY KEY, run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, concept_key TEXT NOT NULL, label TEXT NOT NULL);
    CREATE TABLE installed_pack_artifacts (pack_id TEXT NOT NULL, digest TEXT NOT NULL, projection_json TEXT NOT NULL, PRIMARY KEY(pack_id,digest));
    CREATE TABLE registered_attempt_concepts (source_row_id INTEGER UNIQUE NOT NULL, run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, pack_digest TEXT NOT NULL, concept_key TEXT NOT NULL, concept_ref_json TEXT NOT NULL, historical_label TEXT NOT NULL, UNIQUE(run_id,branch_id,concept_key));
    CREATE TABLE attempt_concept_legacy (source_row_id INTEGER UNIQUE NOT NULL, run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, raw_key TEXT NOT NULL, stored_label TEXT NOT NULL, reason TEXT NOT NULL);
    CREATE TABLE concept_migration_receipts (version INTEGER PRIMARY KEY, input_digest TEXT NOT NULL, receipt_json TEXT NOT NULL);
  `);
  return db;
}

function install(db, { rowId = 1, conceptKey = "pack:pack-a#fork", concepts = ["fork"], projectionBytes, snapshotBytes } = {}) {
  const bytes = projectionBytes ?? canonicalPackProjection("pack-a", concepts);
  const packDigest = digestBytes(bytes);
  db.prepare("INSERT INTO installed_pack_artifacts VALUES (?,?,?)").run("pack-a", packDigest, bytes);
  db.prepare("INSERT INTO attempts VALUES (?,?,?,?)").run("run-1", "branch-1", "pack-a", packDigest);
  db.prepare("INSERT INTO drill_runs VALUES (?,?)").run("run-1", snapshotBytes ?? canonicalRunSnapshot("run-1", "pack-a", packDigest, ["branch-1"]));
  db.prepare("INSERT INTO attempt_concepts VALUES (?,?,?,?,?,?)").run(rowId, "run-1", "branch-1", "pack-a", conceptKey, "legacy label");
  return { packDigest };
}

test("D2709 revision publication rejects duplicate, extra and noncanonical bytes", () => {
  assert.throws(() => new RevisionCatalogue().publish('{"schemaVersion":0,"schemaVersion":1,"previousDigest":null,"entries":[]}'), /duplicate-key/u);
  assert.throws(() => new RevisionCatalogue().publish('{"entries":[],"extra":true,"previousDigest":null,"schemaVersion":1}'), /keys/u);
  assert.throws(() => new RevisionCatalogue().publish('{ "entries": [], "previousDigest": null, "schemaVersion": 1 }'), /noncanonical/u);
});

test("D2710 IDs and labels obey UTF-8 byte and Unicode-scalar bounds", () => {
  assert.throws(() => new RevisionCatalogue().publish(revisionBytes(null, [{ id: "a".repeat(81), label: "Fork", status: "active" }])), /bytes/u);
  assert.throws(() => new RevisionCatalogue().publish(revisionBytes(null, [{ id: "fork", label: "é".repeat(51), status: "active" }])), /bytes/u);
  assert.throws(() => new RevisionCatalogue().publish(revisionBytes(null, [{ id: "fork", label: "\ud800", status: "active" }])), /unicode-scalar/u);
});

test("D2711 refs are exact parsed copies and recursively immutable", () => {
  const { registry, head } = catalogue();
  const input = { id: "fork", registrySchemaVersion: 1, registryDigest: head.digest };
  const resolved = registry.resolve(input);
  input.id = "pin";
  assert.equal(resolved.ref.id, "fork");
  assert.ok(Object.isFrozen(resolved.ref));
  assert.throws(() => parseConceptRef({ ...input, extra: true }), /keys/u);
  assert.throws(() => parseConceptRef({ id: "fork", registrySchemaVersion: 1, registryDigest: "not-a-digest" }), /digest/u);
});

test("D2712 migration resolves exact digest through installed inventory and accepts no caller artifact", () => {
  const db = database();
  const { registry } = catalogue();
  const { packDigest } = install(db);
  db.prepare("UPDATE installed_pack_artifacts SET projection_json=? WHERE pack_id='pack-a'").run(canonicalPackProjection("pack-a", ["fork", "pin"]));
  const receipt = migrateLegacyConceptBatch(db, registry);
  assert.deepEqual(receipt.registeredRowIds, []);
  assert.deepEqual(receipt.quarantinedRowIds, [1]);
  assert.equal(db.prepare("SELECT reason FROM attempt_concept_legacy").get().reason, "pack_artifact_invalid");
  assert.equal(typeof packDigest, "string");
  assert.equal(migrateLegacyConceptBatch.length, 2);
});

test("D2713 migration reads and parses stored attempt/run occurrence authority", () => {
  const db = database();
  const { registry } = catalogue();
  const { packDigest } = install(db, { snapshotBytes: canonicalRunSnapshot("run-1", "pack-a", "sha256:" + "0".repeat(64), ["branch-1"]) });
  const receipt = migrateLegacyConceptBatch(db, registry);
  assert.deepEqual(receipt.registeredRowIds, []);
  assert.equal(db.prepare("SELECT reason FROM attempt_concept_legacy").get().reason, "occurrence_mismatch");
  assert.equal(typeof packDigest, "string");
});

test("D2714 malformed pack populations cannot enter the installed-artifact join", () => {
  const db = database();
  const { registry } = catalogue();
  install(db, { projectionBytes: '{"concepts":["fork","fork"],"id":"pack-a"}' });
  const receipt = migrateLegacyConceptBatch(db, registry);
  assert.deepEqual(receipt.quarantinedRowIds, [1]);
  assert.equal(db.prepare("SELECT reason FROM attempt_concept_legacy").get().reason, "pack_artifact_invalid");
});

test("D2715 one transaction emits a lossless partition, rolls back and restarts exactly", () => {
  const failed = database();
  const { registry } = catalogue();
  install(failed);
  assert.throws(() => migrateLegacyConceptBatch(failed, registry, { failAfterWrites: 1 }), /injected-write-failure/u);
  assert.equal(failed.prepare("SELECT count(*) AS count FROM registered_attempt_concepts").get().count, 0);
  assert.equal(failed.prepare("SELECT count(*) AS count FROM concept_migration_receipts").get().count, 0);
  const receipt = migrateLegacyConceptBatch(failed, registry);
  assert.deepEqual(receipt.inputRowIds, [1]);
  assert.deepEqual(receipt.registeredRowIds, [1]);
  assert.deepEqual(receipt.quarantinedRowIds, []);
  assert.deepEqual(migrateLegacyConceptBatch(failed, registry), receipt);

  const collision = database();
  install(collision);
  collision.prepare("INSERT INTO attempt_concepts VALUES (?,?,?,?,?,?)").run(2, "run-1", "branch-1", "pack-a", "pack:pack-a#fork", "second legacy label");
  assert.throws(() => migrateLegacyConceptBatch(collision, registry), /key-collision/u);
  assert.equal(collision.prepare("SELECT count(*) AS count FROM registered_attempt_concepts").get().count, 0);

  failed.prepare("INSERT INTO attempt_concepts VALUES (?,?,?,?,?,?)").run(2, "run-1", "branch-1", "pack-a", "pack:pack-a#pin", "new row");
  assert.throws(() => migrateLegacyConceptBatch(failed, registry), /restart-input-changed/u);
});

function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

function repository({ missing, duplicate, local } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-consumers-"));
  for (const file of ["packages/runtime/src/concepts.ts", ...LIVE_CONSUMER_PATHS]) {
    if (file === missing) continue;
    const absolute = path.join(root, file);
    mkdirSync(path.dirname(absolute), { recursive: true });
    const importLine = file === "packages/runtime/src/concepts.ts" ? "export const registry = 1;" : 'import { registry } from "@chess-tabiya/runtime/concepts";';
    writeFileSync(absolute, `${importLine}${file === duplicate ? `\n${importLine}` : ""}${file === local ? "\nclass PackScopedConceptResolver {}" : ""}\nvoid registry;\n`);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]) };
}

test("D2716 consumer closure is derived from one committed import graph", () => {
  const good = repository();
  const receipt = assertConsumerClosureFromRepository(good.root, good.commit);
  assert.deepEqual(receipt.live, [...LIVE_CONSUMER_PATHS].sort());
  assert.equal(receipt.repositoryCommit, good.commit);
  const missing = repository({ missing: LIVE_CONSUMER_PATHS[0] });
  assert.throws(() => assertConsumerClosureFromRepository(missing.root, missing.commit), /closure/u);
  const duplicate = repository({ duplicate: LIVE_CONSUMER_PATHS[1] });
  assert.throws(() => assertConsumerClosureFromRepository(duplicate.root, duplicate.commit), /duplicate-import/u);
  const local = repository({ local: LIVE_CONSUMER_PATHS[2] });
  assert.throws(() => assertConsumerClosureFromRepository(local.root, local.commit), /local-authority/u);
});
