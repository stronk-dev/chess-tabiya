import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { createRun } from "@chess-tabiya/runtime";
import { describe, expect, test } from "vitest";

import { PackRegistry } from "../../apps/server/src/pack-registry.js";
import {
  CONSUMER_OPERATIONS,
  assertConsumerOperationsFromRepository,
  compileConceptRegistry,
  digestBytes,
  headBytes,
  migrateLegacyConceptBatch,
  revisionBytes,
} from "./model.js";

function registry(label = "Fork") {
  const revision = revisionBytes(null, [{ id: "fork", label, status: "active" }]);
  const digest = digestBytes(revision);
  return compileConceptRegistry(headBytes(digest), { [`${digest.slice(7)}.json`]: revision });
}

async function packRegistry() {
  const fixture = JSON.parse(readFileSync("schemas/drill_pack.example.json", "utf8")) as Record<string, unknown>;
  const document = structuredClone(fixture);
  document.id = "pack-a";
  document.concepts = ["fork"];
  return PackRegistry.fromDocuments([{ source: "fixture", value: document }]);
}

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE drill_runs (id TEXT PRIMARY KEY,snapshot_json TEXT NOT NULL);
    CREATE TABLE attempts (run_id TEXT NOT NULL,branch_id TEXT NOT NULL,pack_id TEXT,pack_digest TEXT,PRIMARY KEY(run_id,branch_id));
    CREATE TABLE attempt_concepts (
      run_id TEXT NOT NULL,branch_id TEXT NOT NULL,pack_id TEXT NOT NULL,concept_key TEXT NOT NULL,label TEXT NOT NULL,
      PRIMARY KEY(run_id,branch_id,concept_key)
    ) STRICT;
    CREATE TABLE registered_attempt_concepts (
      source_run_id TEXT NOT NULL,source_branch_id TEXT NOT NULL,source_concept_key TEXT NOT NULL,
      run_id TEXT NOT NULL,branch_id TEXT NOT NULL,pack_id TEXT NOT NULL,pack_digest TEXT NOT NULL,
      concept_key TEXT NOT NULL,concept_ref_json TEXT NOT NULL,historical_label TEXT NOT NULL,
      PRIMARY KEY(source_run_id,source_branch_id,source_concept_key),UNIQUE(run_id,branch_id,concept_key)
    ) STRICT;
    CREATE TABLE attempt_concept_legacy (
      source_run_id TEXT NOT NULL,source_branch_id TEXT NOT NULL,source_concept_key TEXT NOT NULL,
      run_id TEXT NOT NULL,branch_id TEXT NOT NULL,pack_id TEXT NOT NULL,raw_key TEXT NOT NULL,stored_label TEXT NOT NULL,reason TEXT NOT NULL,
      PRIMARY KEY(source_run_id,source_branch_id,source_concept_key)
    ) STRICT;
    CREATE TABLE concept_migration_receipts (
      version INTEGER PRIMARY KEY,input_digest TEXT NOT NULL,registry_digest TEXT NOT NULL,artifact_digest TEXT NOT NULL,receipt_json TEXT NOT NULL
    ) STRICT;
  `);
  return db;
}

async function seed(db: DatabaseSync, packs: PackRegistry) {
  const pack = packs.required("pack-a");
  const run = createRun({
    id: "run-1",
    packId: pack.document.id,
    packDigest: pack.digest,
    startFen: pack.document.start.fen,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: "2026-09-06T00:00:00.000Z",
  });
  const branchId = run.branches[0]!.id;
  db.prepare("INSERT INTO drill_runs VALUES (?,?)").run(run.id, JSON.stringify(run));
  db.prepare("INSERT INTO attempts VALUES (?,?,?,?)").run(run.id, branchId, pack.document.id, pack.digest);
  db.prepare("INSERT INTO attempt_concepts VALUES (?,?,?,?,?)").run(run.id, branchId, pack.document.id, "pack:pack-a#fork", "legacy Fork");
  return { run, branchId, pack };
}

describe("concept registry third author repair", () => {
  test("D2882 compiles the exact canonical head and complete immutable revision chain", () => {
    expect(readFileSync("tools/d2878-concept-registry-third-fresh-review/review.test.mjs", "utf8")).toMatch(/da3fde393220f1d36241f6e19399038b86ae2da9:\$\{file\}/u);
    const first = revisionBytes(null, [{ id: "fork", label: "Fork", status: "active" }]);
    const firstDigest = digestBytes(first);
    const second = revisionBytes(firstDigest, [{ id: "fork", label: "Tactical fork", status: "retired" }]);
    const secondDigest = digestBytes(second);
    const files = { [`${firstDigest.slice(7)}.json`]: first, [`${secondDigest.slice(7)}.json`]: second };
    const compiled = compileConceptRegistry(headBytes(secondDigest), files);
    expect(compiled.currentRef("fork")).toMatchObject({ label: "Tactical fork", status: "retired" });
    expect(compiled.resolve({ id: "fork", registrySchemaVersion: 1, registryDigest: firstDigest })).toMatchObject({ kind: "resolved", label: "Fork", status: "active" });
    expect(compiled.resolve({ id: "fork", registrySchemaVersion: 1, registryDigest: `sha256:${"0".repeat(64)}` })).toMatchObject({ kind: "registry_revision_unavailable" });
    expect(() => compileConceptRegistry(headBytes(secondDigest), { [`${secondDigest.slice(7)}.json`]: second })).toThrow(/missing-revision/);
    expect(() => compileConceptRegistry(headBytes(secondDigest), { ...files, [`${"0".repeat(64)}.json`]: first })).toThrow(/orphan-revision/);
    expect(() => compileConceptRegistry(headBytes(secondDigest), { ...files, [`${secondDigest.slice(7)}.json`]: first })).toThrow(/misnamed-revision/);
  });

  test("D2884 uses one portable collision key rather than locale lowercase", () => {
    const bytes = revisionBytes(null, [
      { id: "double-s", label: "STRASSE", status: "active" },
      { id: "sharp-s", label: "Straße", status: "active" },
    ]);
    const digest = digestBytes(bytes);
    expect(() => compileConceptRegistry(headBytes(digest), { [`${digest.slice(7)}.json`]: bytes })).toThrow(/duplicate-identity/);
    const greek = revisionBytes(null, [
      { id: "normal-sigma", label: "οσ", status: "active" },
      { id: "terminal-sigma", label: "ος", status: "active" },
    ]);
    const greekDigest = digestBytes(greek);
    expect(() => compileConceptRegistry(headBytes(greekDigest), { [`${greekDigest.slice(7)}.json`]: greek })).toThrow(/duplicate-identity/);
  });

  test("D2878-D2880 migration reads real compound keys, runtime replay and full PackRegistry artifacts inside BEGIN IMMEDIATE", async () => {
    const packs = await packRegistry();
    const db = database();
    const { branchId, pack } = await seed(db, packs);
    let inside = false;
    const receipt = migrateLegacyConceptBatch(db, registry(), packs, {
      afterBegin: () => {
        expect(() => db.exec("BEGIN IMMEDIATE")).toThrow();
        inside = true;
      },
    });
    expect(inside).toBe(true);
    expect(receipt.registeredKeys).toEqual([JSON.stringify(["run-1", branchId, "pack:pack-a#fork"])]);
    expect(db.prepare("SELECT pack_digest,concept_key FROM registered_attempt_concepts").get()).toEqual({ pack_digest: pack.digest, concept_key: "concept:fork@1" });
    expect(readFileSync("apps/server/src/storage.ts", "utf8")).toMatch(/PRIMARY KEY \(run_id, branch_id, concept_key\)/u);
    expect(readFileSync("tools/d2878-concept-registry-third-author-repair/model.ts", "utf8")).not.toMatch(/c\.row_id|projection_json/u);
  });

  test("D2881 restart revalidates registry, artifact, output partition and receipt bytes", async () => {
    const packs = await packRegistry();
    const removed = database();
    await seed(removed, packs);
    migrateLegacyConceptBatch(removed, registry(), packs);
    removed.exec("DELETE FROM registered_attempt_concepts");
    expect(() => migrateLegacyConceptBatch(removed, registry(), packs)).toThrow(/restart-registered-changed/);

    const changedRegistry = database();
    await seed(changedRegistry, packs);
    migrateLegacyConceptBatch(changedRegistry, registry(), packs);
    expect(() => migrateLegacyConceptBatch(changedRegistry, registry("Tactical fork"), packs)).toThrow(/restart-preimage-changed/);

    const changedArtifact = database();
    await seed(changedArtifact, packs);
    migrateLegacyConceptBatch(changedArtifact, registry(), packs);
    const emptyPacks = await PackRegistry.fromDocuments([]);
    expect(() => migrateLegacyConceptBatch(changedArtifact, registry(), emptyPacks)).toThrow(/restart-preimage-changed/);

    const corruptedReceipt = database();
    await seed(corruptedReceipt, packs);
    migrateLegacyConceptBatch(corruptedReceipt, registry(), packs);
    corruptedReceipt.exec("UPDATE concept_migration_receipts SET receipt_json='{}'");
    expect(() => migrateLegacyConceptBatch(corruptedReceipt, registry(), packs)).toThrow(/migration-receipt:keys/);
  });

  test("D2880 current storage writes and receipt roll back together", async () => {
    const packs = await packRegistry();
    const db = database();
    await seed(db, packs);
    expect(() => migrateLegacyConceptBatch(db, registry(), packs, { failAfterWrites: 1 })).toThrow(/injected-write-failure/);
    expect(db.prepare("SELECT count(*) AS count FROM registered_attempt_concepts").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT count(*) AS count FROM attempt_concept_legacy").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT count(*) AS count FROM concept_migration_receipts").get()).toEqual({ count: 0 });
  });

  test("D2878 invalid real run replay is quarantined instead of accepted by a private snapshot shape", async () => {
    const packs = await packRegistry();
    const db = database();
    await seed(db, packs);
    db.exec("UPDATE drill_runs SET snapshot_json='{\"events\":[]}'");
    const receipt = migrateLegacyConceptBatch(db, registry(), packs);
    expect(receipt.quarantinedKeys).toHaveLength(1);
    expect(db.prepare("SELECT reason FROM attempt_concept_legacy").get()).toEqual({ reason: "run_snapshot_invalid" });
  });

  test("D2883 operation closure rejects dead imports and follows a barrel alias", () => {
    const dead = repository(false);
    expect(() => assertConsumerOperationsFromRepository(dead.root, dead.commit)).toThrow(/operation-closure/);
    const live = repository(true);
    const receipt = assertConsumerOperationsFromRepository(live.root, live.commit);
    expect(receipt.operations).toHaveLength(Object.keys(CONSUMER_OPERATIONS).length);
  });
});

function repository(live: boolean) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-operation-closure-"));
  const operations = Object.values(CONSUMER_OPERATIONS);
  write(root, "packages/runtime/src/concepts.ts", operations.map((name) => `export function ${name}() { return true; }`).join("\n"));
  write(root, "packages/runtime/src/index.ts", `export { ${operations.join(", ")} } from "./concepts.js";\n`);
  for (const [file, operation] of Object.entries(CONSUMER_OPERATIONS)) {
    const specifier = file === "apps/web/src/lib/client.ts" ? "@chess-tabiya/runtime" : "@chess-tabiya/runtime/concepts";
    write(root, file, `import { ${operation} as operation } from "${specifier}";\n${live ? "operation();" : "void operation;"}\n`);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]).trim() };
}

function write(root: string, file: string, bytes: string) {
  const absolute = path.join(root, file);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes);
}

function git(root: string, args: readonly string[]) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}
