import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import * as model from "../d2709-concept-registry-second-author-repair/model.mjs";

const {
  LIVE_CONSUMER_PATHS,
  RevisionCatalogue,
  assertConsumerClosureFromRepository,
  canonicalPackProjection,
  canonicalRunSnapshot,
  digestBytes,
  migrateLegacyConceptBatch,
  revisionBytes,
} = model;

const reviewed = (file) => execFileSync("git", ["show", `da3fde393220f1d36241f6e19399038b86ae2da9:${file}`], { encoding: "utf8" });
const source = reviewed("tools/d2709-concept-registry-second-author-repair/model.mjs");
const storage = reviewed("apps/server/src/storage.ts");
const rfc = reviewed("rfc/concept-registry.md").replace(/\s+/gu, " ");

function catalogue(label = "Fork") {
  const registry = new RevisionCatalogue();
  registry.publish(revisionBytes(null, [{ id: "fork", label, status: "active" }]));
  return registry;
}

function modelDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE drill_runs (id TEXT PRIMARY KEY, snapshot_json TEXT NOT NULL);
    CREATE TABLE attempts (run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, pack_digest TEXT NOT NULL, PRIMARY KEY(run_id,branch_id));
    CREATE TABLE attempt_concepts (row_id INTEGER PRIMARY KEY, run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, concept_key TEXT NOT NULL, label TEXT NOT NULL);
    CREATE TABLE installed_pack_artifacts (pack_id TEXT NOT NULL, digest TEXT NOT NULL, projection_json TEXT NOT NULL, PRIMARY KEY(pack_id,digest));
    CREATE TABLE registered_attempt_concepts (source_row_id INTEGER UNIQUE NOT NULL, run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, pack_digest TEXT NOT NULL, concept_key TEXT NOT NULL, concept_ref_json TEXT NOT NULL, historical_label TEXT NOT NULL, UNIQUE(run_id,branch_id,concept_key));
    CREATE TABLE attempt_concept_legacy (source_row_id INTEGER UNIQUE NOT NULL, run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, raw_key TEXT NOT NULL, stored_label TEXT NOT NULL, reason TEXT NOT NULL);
    CREATE TABLE concept_migration_receipts (version INTEGER PRIMARY KEY, input_digest TEXT NOT NULL, receipt_json TEXT NOT NULL);
  `);
  return database;
}

function seed(database, { artifactBytes, packDigest, snapshotBytes } = {}) {
  const bytes = artifactBytes ?? canonicalPackProjection("pack-a", ["fork"]);
  const digest = packDigest ?? digestBytes(bytes);
  database.prepare("INSERT INTO installed_pack_artifacts VALUES (?,?,?)").run("pack-a", digest, bytes);
  database.prepare("INSERT INTO attempts VALUES (?,?,?,?)").run("run-1", "branch-1", "pack-a", digest);
  database.prepare("INSERT INTO drill_runs VALUES (?,?)").run("run-1", snapshotBytes ?? canonicalRunSnapshot("run-1", "pack-a", digest, ["branch-1"]));
  database.prepare("INSERT INTO attempt_concepts VALUES (?,?,?,?,?,?)").run(1, "run-1", "branch-1", "pack-a", "pack:pack-a#fork", "legacy Fork");
  return digest;
}

test("D2878 the repair migrates an invented SQL key and invented run snapshot", () => {
  assert.match(storage, /PRIMARY KEY \(run_id, branch_id, concept_key\)/u);
  assert.doesNotMatch(storage, /attempt_concepts \([\s\S]{0,500}row_id/u);
  assert.match(source, /SELECT c\.row_id/u);

  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE drill_runs (id TEXT PRIMARY KEY, snapshot_json TEXT NOT NULL);
    CREATE TABLE attempts (run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT, pack_digest TEXT, PRIMARY KEY(run_id,branch_id));
    CREATE TABLE attempt_concepts (run_id TEXT NOT NULL, branch_id TEXT NOT NULL, pack_id TEXT NOT NULL, concept_key TEXT NOT NULL, label TEXT NOT NULL, PRIMARY KEY(run_id,branch_id,concept_key));
    CREATE TABLE concept_migration_receipts (version INTEGER PRIMARY KEY, input_digest TEXT NOT NULL, receipt_json TEXT NOT NULL);
  `);
  assert.throws(() => migrateLegacyConceptBatch(database, catalogue()), /no such column: c\.row_id/u);

  const shaped = modelDatabase();
  const projection = canonicalPackProjection("pack-a", ["fork"]);
  const digest = digestBytes(projection);
  seed(shaped, {
    artifactBytes: projection,
    packDigest: digest,
    snapshotBytes: JSON.stringify({
      schemaVersion: "0.17", id: "run-1", sessionKind: "pack", packId: "pack-a",
      packDigest: digest, sessionDigest: digest, start: {}, feedbackPolicy: "segment_end",
      opponentPolicy: {}, policyConfig: {}, nodes: [], branches: [], events: [], activeCursor: {},
    }),
  });
  migrateLegacyConceptBatch(shaped, catalogue());
  assert.equal(shaped.prepare("SELECT reason FROM attempt_concept_legacy").get().reason, "run_snapshot_invalid");
  assert.match(rfc, /runtime's exact replay\/parser/u);
});

test("D2879 the installed-artifact fixture substitutes a reduced projection for the full pack digest", () => {
  assert.match(storage, /registered_packs \([\s\S]*?digest TEXT NOT NULL UNIQUE,[\s\S]*?document_json TEXT NOT NULL/u);
  assert.match(source, /installed_pack_artifacts[\s\S]*?projection_json/u);
  const database = modelDatabase();
  const projection = canonicalPackProjection("pack-a", ["fork"]);
  const fullPackBytes = JSON.stringify({ id: "pack-a", concepts: ["fork"], version: "0.2", start: { fen: "irrelevant" } });
  const fullPackDigest = digestBytes(fullPackBytes);
  seed(database, { artifactBytes: projection, packDigest: fullPackDigest });
  migrateLegacyConceptBatch(database, catalogue());
  assert.equal(database.prepare("SELECT reason FROM attempt_concept_legacy").get().reason, "pack_artifact_invalid");
});

test("D2880 the alleged one transaction reads its receipt and population before BEGIN IMMEDIATE", () => {
  const operation = source.slice(source.indexOf("export function migrateLegacyConceptBatch"), source.indexOf("function git("));
  assert.ok(operation.indexOf("const existing") < operation.indexOf('database.exec("BEGIN IMMEDIATE")'));
  assert.ok(operation.indexOf("const rows = migrationInput") < operation.indexOf('database.exec("BEGIN IMMEDIATE")'));
  assert.match(rfc, /It starts `BEGIN IMMEDIATE`, reads `attempt_concepts`/u);
});

test("D2881 restart trusts stale receipt bytes without revalidating registry, artifacts or outputs", () => {
  const database = modelDatabase();
  seed(database);
  const firstRegistry = catalogue("Fork");
  const first = migrateLegacyConceptBatch(database, firstRegistry);
  database.exec("DELETE FROM registered_attempt_concepts");
  database.exec("UPDATE installed_pack_artifacts SET projection_json='{}'");
  const secondRegistry = catalogue("Tactical fork");
  const restarted = migrateLegacyConceptBatch(database, secondRegistry);
  assert.deepEqual(restarted, first);
  assert.notEqual(first.registryDigest, secondRegistry.currentDigest);
  assert.equal(database.prepare("SELECT count(*) AS count FROM registered_attempt_concepts").get().count, 0);
});

test("D2882 no compiler opens current.json and walks immutable revision files", () => {
  assert.equal(model.compileConceptRegistry, undefined);
  assert.doesNotMatch(source, /current\.json|revisions\//u);
  assert.doesNotMatch(source, /missing-revision|revision-cycle|misnamed-revision/u);
  assert.match(rfc, /compileConceptRegistry\(headBytes, revisionFiles\)/u);
});

function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

test("D2883 dead imports satisfy the consumer closure without any consumer operation", () => {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-dead-consumers-"));
  for (const file of ["packages/runtime/src/concepts.ts", ...LIVE_CONSUMER_PATHS]) {
    const absolute = path.join(root, file);
    mkdirSync(path.dirname(absolute), { recursive: true });
    const bytes = file === "packages/runtime/src/concepts.ts"
      ? "export const registry = 1;\n"
      : 'import { registry } from "@chess-tabiya/runtime/concepts";\nvoid registry;\n';
    writeFileSync(absolute, bytes);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  const receipt = assertConsumerClosureFromRepository(root, git(root, ["rev-parse", "HEAD"]));
  assert.deepEqual(receipt.live, [...LIVE_CONSUMER_PATHS].sort());
  assert.doesNotMatch(source, /findReferences|resolveModuleName|TypeChecker|getSymbolAtLocation/u);
});

test("D2884 locale lowercasing accepts labels that Unicode case folding identifies", () => {
  const registry = new RevisionCatalogue();
  assert.doesNotThrow(() => registry.publish(revisionBytes(null, [
    { id: "sharp-s", label: "Straße", status: "active" },
    { id: "double-s", label: "STRASSE", status: "active" },
  ])));
  assert.match(rfc, /case-folded labels are unique/u);
});
