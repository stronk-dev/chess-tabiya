// rfc/concept-registry.md §4 — migration 28 over real file-backed SQLite (criteria 6, 7, 13–16,
// 20–22, 25–28) and the known returns [[D2962]]–[[D2965]], including the prior-release upgrade.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  compileConceptRegistry,
  conceptRegistryDigest,
  conceptRegistryHeadBytes,
  conceptRegistryRevisionBytes,
  createRun,
  type CompiledConceptRegistry,
  type DrillRun,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CONCEPT_MIGRATION_TABLES,
  migrateAttemptConcepts,
  packArtifactDigest,
  type ConceptMigrationAuthority,
  type ConceptMigrationFaultPoint,
  type ConceptMigrationRepository,
  type PackArtifact,
} from "./concept-migration.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { SQLiteRunStorage, STORAGE_VERSION, type StorageMigrationLog } from "./storage.js";

const AT = "2026-09-24T10:00:00.000Z";
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const directories: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function registryOf(...revisions: readonly (readonly { readonly id: string; readonly label: string; readonly status: "active" | "retired" }[])[]): CompiledConceptRegistry {
  const files: Record<string, string> = {};
  let previous: `sha256:${string}` | null = null;
  for (const entries of revisions) {
    const bytes = conceptRegistryRevisionBytes(previous, entries);
    previous = conceptRegistryDigest(bytes);
    files[`${previous.slice("sha256:".length)}.json`] = bytes;
  }
  return compileConceptRegistry(conceptRegistryHeadBytes(previous!), files);
}

const ENTRIES = [
  { id: "break-timing", label: "Break timing", status: "active" as const },
  { id: "direct-opposition", label: "Direct opposition", status: "active" as const },
  { id: "outside-passer", label: "Outside passer", status: "active" as const },
];
const REGISTRY = registryOf(ENTRIES);

function pack(id: string, concepts: readonly string[]): PackArtifact {
  const document = { id, version: "1.0.0", concepts } as unknown as DrillPackDefinition;
  return Object.freeze({ digest: packArtifactDigest(document), document });
}
const PACK_A = pack("pack-a", ["break-timing", "outside-passer"]);
const PACK_B = pack("pack-b", ["break-timing"]);
const PACK_C = pack("pack-c", ["break-timing"]); // never installed
const PACK_D = pack("pack-d", ["mystery-idea"]); // installed, unregistered id
const BUILT_IN = [PACK_A, PACK_B, PACK_D];

function run(id: string, artifact: PackArtifact): DrillRun {
  return createRun({
    id, packId: artifact.document.id, packDigest: artifact.digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: START_FEN, seed: 3, createdAt: AT,
  });
}

function authority(overrides: Partial<ConceptMigrationAuthority> = {}): ConceptMigrationAuthority {
  return { registry: REGISTRY, builtInArtifacts: BUILT_IN, validateStoredPack: () => ({ valid: true, issues: [] }), ...overrides };
}

function raw(path: string): DatabaseSync {
  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON");
  return database;
}

const V27_ATTEMPT_CONCEPTS = `
  CREATE TABLE attempt_concepts (
    run_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    pack_id TEXT NOT NULL,
    concept_key TEXT NOT NULL,
    label TEXT NOT NULL,
    PRIMARY KEY (run_id, branch_id, concept_key),
    FOREIGN KEY (run_id, branch_id) REFERENCES attempts(run_id, branch_id) ON DELETE CASCADE
  ) STRICT;
  CREATE INDEX attempt_concepts_key ON attempt_concepts(concept_key);
`;

type LegacyRow = readonly [runId: string, packId: string, key: string, label: string];

/**
 * A prior-release (storage 27) database: real runs and attempts written by the current code, then
 * migration 28's objects removed and the exact migration-6 `attempt_concepts` restored with legacy
 * pack-scoped rows.
 */
function priorRelease(rows: readonly LegacyRow[], runs: readonly (readonly [string, PackArtifact])[] = [["r1", PACK_A], ["r2", PACK_B], ["r3", PACK_C], ["r4", PACK_D]]): string {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-concept-migration-"));
  directories.push(directory);
  const path = join(directory, "store.sqlite");
  const storage = new SQLiteRunStorage(path, { onMigration: () => {} });
  storage.createLearner({ id: "owner", handle: "owner", passwordHash: "!", createdAt: AT });
  for (const [id, artifact] of runs) storage.create(run(id, artifact), { writerId: "writer", learnerId: "owner" }, id);
  storage.close();
  const database = raw(path);
  const insertAttempt = database.prepare(`INSERT INTO attempts (run_id, branch_id, learner_id, session_kind, pack_id, pack_digest, root_key, root_node_id,
    root_transpose_key, branch_label, branch_intent, branch_seed, attempt_no, countable, graded, objective_state, verdict, result, user_ply_count,
    checkpoint_ids, origin, schedule_id, root_due_at_start, derived_from_run_id, started_at, ended_at)
    VALUES (?, 'main', 'owner', 'pack', ?, ?, ?, 'n0', 't0', 'Main', NULL, 3, 1, 1, 0, 'active', 'open', NULL, 1, '[]', 'fresh', NULL, NULL, NULL, ?, ?)`);
  for (const [id, artifact] of runs) insertAttempt.run(id, artifact.document.id, artifact.digest, `pack|${artifact.document.id}|t0`, AT, AT);
  database.exec("DROP TABLE attempt_concepts; DROP TABLE attempt_concept_legacy; DROP TABLE concept_registry_migration;");
  database.exec(V27_ATTEMPT_CONCEPTS);
  const insert = database.prepare("INSERT INTO attempt_concepts (run_id, branch_id, pack_id, concept_key, label) VALUES (?, 'main', ?, ?, ?)");
  for (const [runId, packId, key, label] of rows) insert.run(runId, packId, key, label);
  database.exec("PRAGMA user_version = 27");
  database.close();
  return path;
}

const LEGACY: readonly LegacyRow[] = [
  ["r1", "pack-a", "pack:pack-a#break-timing", "break-timing"],
  ["r1", "pack-a", "pack:pack-a#outside-passer", "outside-passer"],
  ["r1", "pack-a", "pack:pack-a#direct-opposition", "direct-opposition"], // registered, absent from pack A
  ["r1", "pack-a", "garbage", "garbage"], // malformed
  ["r2", "pack-b", "pack:pack-b#break-timing", "break-timing"],
  ["r2", "pack-a", "pack:pack-a#break-timing", "break-timing"], // attempt is pack B
  ["r3", "pack-c", "pack:pack-c#break-timing", "break-timing"], // artifact never installed
  ["r4", "pack-d", "pack:pack-d#mystery-idea", "mystery-idea"], // unregistered id
];

function table(path: string, sql: string): readonly Record<string, unknown>[] {
  const database = raw(path);
  try { return database.prepare(sql).all() as readonly Record<string, unknown>[]; } finally { database.close(); }
}
const version = (path: string): number => Number(table(path, "PRAGMA user_version")[0]!.user_version);

describe("criteria 7, 13, 14 — the migration partitions every legacy row, atomically", () => {
  it("upgrades a prior-release database: registered global keys, a closed-reason quarantine and one receipt", () => {
    const path = priorRelease(LEGACY);
    const before = table(path, "SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name");
    const log: StorageMigrationLog[] = [];
    const storage = new SQLiteRunStorage(path, { onMigration: (entry) => log.push(entry), concepts: authority() });
    expect(STORAGE_VERSION).toBe(28);
    expect(log).toEqual([{ version: 28, name: "registered global concept identities and the legacy concept quarantine" }]);
    const receipt = storage.conceptMigrationReceipt;
    storage.close();
    expect(version(path)).toBe(28);

    // Prior-release schema diff: exactly the rebuilt attempt_concepts plus two new tables.
    const after = table(path, "SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name");
    const changed = after.filter((row) => before.find((prior) => prior.name === row.name)?.sql !== row.sql).map((row) => `${String(row.type)}:${String(row.name)}`).sort();
    expect(changed).toEqual(["table:attempt_concept_legacy", "table:attempt_concepts", "table:concept_registry_migration"]);
    expect(after.map((row) => row.name).filter((name) => !before.some((prior) => prior.name === name)).sort()).toEqual(["attempt_concept_legacy", "concept_registry_migration"]);
    expect(CONCEPT_MIGRATION_TABLES).toEqual(["attempt_concepts", "attempt_concept_legacy", "concept_registry_migration"]);

    const registered = table(path, "SELECT run_id, pack_id, pack_digest, concept_key, concept_id, registry_digest, label FROM attempt_concepts ORDER BY run_id, concept_key");
    expect(registered).toEqual([
      { run_id: "r1", pack_id: "pack-a", pack_digest: PACK_A.digest, concept_key: "concept:break-timing@1", concept_id: "break-timing", registry_digest: REGISTRY.digest, label: "Break timing" },
      { run_id: "r1", pack_id: "pack-a", pack_digest: PACK_A.digest, concept_key: "concept:outside-passer@1", concept_id: "outside-passer", registry_digest: REGISTRY.digest, label: "Outside passer" },
      { run_id: "r2", pack_id: "pack-b", pack_digest: PACK_B.digest, concept_key: "concept:break-timing@1", concept_id: "break-timing", registry_digest: REGISTRY.digest, label: "Break timing" },
    ]);
    const quarantined = table(path, "SELECT run_id, raw_key, reason FROM attempt_concept_legacy ORDER BY run_id, raw_key");
    expect(quarantined).toEqual([
      { run_id: "r1", raw_key: "garbage", reason: "malformed_legacy_key" },
      { run_id: "r1", raw_key: "pack:pack-a#direct-opposition", reason: "concept_absent_from_pack" },
      { run_id: "r2", raw_key: "pack:pack-a#break-timing", reason: "pack_mismatch" },
      { run_id: "r3", raw_key: "pack:pack-c#break-timing", reason: "artifact_unavailable" },
      { run_id: "r4", raw_key: "pack:pack-d#mystery-idea", reason: "unknown_concept" },
    ]);
    // Criterion 6: one global key, distinct pack occurrences.
    expect(new Set(registered.filter((row) => row.concept_id === "break-timing").map((row) => row.concept_key)).size).toBe(1);
    expect(registered.filter((row) => row.concept_id === "break-timing").map((row) => row.pack_digest)).toEqual([PACK_A.digest, PACK_B.digest]);
    // Lossless disjoint partition, recorded in the receipt.
    expect(receipt.input.rows).toBe(LEGACY.length);
    expect(receipt.registered.rows + receipt.quarantined.rows).toBe(LEGACY.length);
    expect(receipt.registry.digest).toBe(REGISTRY.digest);
    expect(receipt.quarantined.byReason).toEqual({ malformed_legacy_key: 1, pack_mismatch: 1, artifact_unavailable: 1, artifact_invalid: 0, concept_absent_from_pack: 1, unknown_concept: 1, unregistered_at_projection: 0 });
  });

  it("writes a zero-row receipt on a fresh database", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    expect(storage.conceptMigrationReceipt).toMatchObject({ storageVersion: 28, input: { rows: 0 }, registered: { rows: 0 }, quarantined: { rows: 0 } });
    storage.close();
  });

  it("refuses a legacy population without the build's artifact inventory instead of quarantining it all", () => {
    const path = priorRelease(LEGACY);
    expect(() => new SQLiteRunStorage(path, { onMigration: () => {}, concepts: { registry: REGISTRY } })).toThrow(/Could not migrate run storage/u);
    expect(version(path)).toBe(27);
    expect(table(path, "SELECT count(*) AS n FROM attempt_concepts")[0]!.n).toBe(LEGACY.length);
  });
});

describe("criteria 15, 20, 21 — one coordinator transaction; every failure rolls back and stays restartable", () => {
  for (const faultPoint of ["after_classification", "after_registered_writes", "after_quarantine_writes", "after_receipt", "duplicate_registered_output"] as const satisfies readonly ConceptMigrationFaultPoint[]) {
    it(`rolls back rebuilt tables, both populations, the receipt and the version stamp at ${faultPoint}`, () => {
      const path = priorRelease(LEGACY);
      const before = table(path, "SELECT * FROM attempt_concepts ORDER BY run_id, concept_key");
      expect(() => new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority({ faultPoint }) })).toThrow(/Could not migrate run storage/u);
      expect(version(path)).toBe(27);
      expect(table(path, "SELECT * FROM attempt_concepts ORDER BY run_id, concept_key")).toEqual(before);
      expect(table(path, "SELECT name FROM sqlite_schema WHERE name IN ('attempt_concept_legacy','concept_registry_migration')")).toEqual([]);
      // The prerequisite version restarts cleanly.
      const restarted = new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority() });
      expect(restarted.conceptMigrationReceipt.input.rows).toBe(LEGACY.length);
      restarted.close();
    });
  }

  it("refuses key collisions before any write reaches the rebuilt table", () => {
    const path = priorRelease(LEGACY);
    let message = "";
    try { new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority({ faultPoint: "duplicate_registered_output" }) }); } catch (error) { message = String((error as { cause?: unknown }).cause); }
    expect(message).toMatch(/CONCEPT_MIGRATION_COLLISION/u);
  });

  it("criterion 26 — the data operation holds a frozen, SQL-free capability and requires an open transaction", () => {
    const repository: ConceptMigrationRepository = {
      transactionActive: () => true, alreadyApplied: () => false, legacyRows: () => [], storedPackArtifacts: () => [],
      replaceConceptTables: () => {}, insertRegistered: () => {}, insertQuarantined: () => {}, writeReceipt: () => {},
    };
    expect(() => migrateAttemptConcepts(repository, authority())).toThrow(/CONCEPT_MIGRATION_CAPABILITY/u);
    expect(() => migrateAttemptConcepts(Object.freeze({ ...repository, transactionActive: () => false }), authority())).toThrow(/CONCEPT_MIGRATION_TRANSACTION/u);
    expect(Object.keys(repository).some((key) => /exec|prepare|begin|commit|rollback|pragma|database/iu.test(key))).toBe(false);
  });
});

describe("criteria 16, 28 — restart is a distinct path that re-verifies the receipt and the store", () => {
  function migrated(): string {
    const path = priorRelease(LEGACY);
    new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority() }).close();
    return path;
  }

  it("reopens without re-running and returns the same verified receipt", () => {
    const path = migrated();
    const log: StorageMigrationLog[] = [];
    const storage = new SQLiteRunStorage(path, { onMigration: (entry) => log.push(entry), concepts: authority() });
    expect(log).toEqual([]);
    expect(storage.conceptMigrationReceipt.input.rows).toBe(LEGACY.length);
    storage.close();
  });

  it("admits a later registry revision whose history contains the migrated one", () => {
    const path = migrated();
    const later = registryOf(ENTRIES, [...ENTRIES, { id: "zugzwang", label: "Zugzwang", status: "active" }]);
    new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority({ registry: later }) }).close();
  });

  const refusals: readonly (readonly [string, (path: string) => void, ConceptMigrationAuthority?])[] = [
    ["a malformed receipt", (path) => { const d = raw(path); d.exec("UPDATE concept_registry_migration SET receipt_json = receipt_json || ' '"); d.close(); }],
    ["a receipt whose digest no longer matches", (path) => { const d = raw(path); d.exec(`UPDATE concept_registry_migration SET receipt_digest = 'sha256:${"0".repeat(64)}'`); d.close(); }],
    ["a missing receipt (mixed-version database)", (path) => { const d = raw(path); d.exec("DELETE FROM concept_registry_migration"); d.close(); }],
    ["a row naming a revision the installed registry lacks", (path) => { const d = raw(path); d.exec(`UPDATE attempt_concepts SET registry_digest = 'sha256:${"9".repeat(64)}' WHERE run_id = 'r2'`); d.close(); }],
    ["a row naming an id absent from its revision", (path) => { const d = raw(path); d.exec("PRAGMA ignore_check_constraints = ON"); d.exec("UPDATE attempt_concepts SET concept_id = 'zugzwang', concept_key = 'concept:zugzwang@1' WHERE run_id = 'r2'"); d.close(); }],
    ["a replaced registry whose history omits the migrated revision", () => {}, authority({ registry: registryOf([{ id: "break-timing", label: "Break timing", status: "active" }]) })],
  ];
  for (const [label, tamper, override] of refusals) {
    it(`refuses readiness on ${label} and closes the database`, () => {
      const path = migrated();
      tamper(path);
      const close = vi.spyOn(DatabaseSync.prototype, "close");
      expect(() => new SQLiteRunStorage(path, { onMigration: () => {}, concepts: override ?? authority() })).toThrow(/Could not verify the concept registry migration/u);
      expect(close).toHaveBeenCalledTimes(1);
    });
  }
});

describe("criteria 22, 27 and [[D2962]], [[D2963]] — the sealed artifact snapshot and private registry authority", () => {
  it("hashes the artifact population independently of loader order", () => {
    const first = new SQLiteRunStorage(priorRelease(LEGACY), { onMigration: () => {}, concepts: authority() });
    const second = new SQLiteRunStorage(priorRelease(LEGACY), { onMigration: () => {}, concepts: authority({ builtInArtifacts: [...BUILT_IN].reverse() }) });
    expect(second.conceptMigrationReceipt.artifacts).toEqual(first.conceptMigrationReceipt.artifacts);
    first.close();
    second.close();
  });

  it("refuses a digest-bearing registry lookalike", () => {
    const path = priorRelease(LEGACY);
    const fake = { digest: REGISTRY.digest, schemaVersion: 1, revisions: [REGISTRY.digest], get: REGISTRY.get, has: REGISTRY.has } as unknown as CompiledConceptRegistry;
    expect(() => new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority({ registry: fake }) })).toThrow(/Could not migrate run storage/u);
    expect(version(path)).toBe(27);
  });

  it("refuses a built-in artifact whose complete document does not hash to its claimed digest", () => {
    const path = priorRelease(LEGACY);
    const forged = { digest: PACK_B.digest, document: PACK_A.document };
    expect(() => new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority({ builtInArtifacts: [PACK_A, forged, PACK_D] }) })).toThrow(/Could not migrate run storage/u);
    expect(version(path)).toBe(27);
  });

  it("recomputes stored registered-pack digests, refuses a mismatch and quarantines a validator-invalid document", () => {
    const stored = pack("community-pack", ["outside-passer"]);
    const path = priorRelease([["r5", "community-pack", "pack:community-pack#outside-passer", "outside-passer"]], [["r5", stored]]);
    const database = raw(path);
    database.prepare("INSERT INTO pack_drafts (id, pack_id, owner_learner_id, document_json, digest, state, seed_kind, seed_ref, created_at, updated_at) VALUES ('d1', 'community-pack', 'owner', ?, ?, 'registered', 'blank', NULL, ?, ?)").run(JSON.stringify(stored.document), stored.digest, AT, AT);
    database.prepare("INSERT INTO registered_packs (pack_id, version, digest, document_json, publisher_handle, publisher_learner_id, draft_id, registered_at) VALUES ('community-pack', '1.0.0', ?, ?, 'owner', 'owner', 'd1', ?)").run(stored.digest, JSON.stringify(stored.document), AT);
    database.close();

    // Invalid under the shipped validator: its rows are quarantined, never registered.
    const invalid = new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority({ validateStoredPack: () => ({ valid: false, issues: [{ severity: "error", source: "schema", code: "PACK_SCHEMA", path: "/", message: "invalid" }] }) }) });
    invalid.close();
    expect(table(path, "SELECT reason FROM attempt_concept_legacy")).toEqual([{ reason: "artifact_invalid" }]);

    // A valid stored document vouches for its occurrence.
    const valid = priorRelease([["r5", "community-pack", "pack:community-pack#outside-passer", "outside-passer"]], [["r5", stored]]);
    const second = raw(valid);
    second.prepare("INSERT INTO pack_drafts (id, pack_id, owner_learner_id, document_json, digest, state, seed_kind, seed_ref, created_at, updated_at) VALUES ('d1', 'community-pack', 'owner', ?, ?, 'registered', 'blank', NULL, ?, ?)").run(JSON.stringify(stored.document), stored.digest, AT, AT);
    second.prepare("INSERT INTO registered_packs (pack_id, version, digest, document_json, publisher_handle, publisher_learner_id, draft_id, registered_at) VALUES ('community-pack', '1.0.0', ?, ?, 'owner', 'owner', 'd1', ?)").run(stored.digest, JSON.stringify(stored.document), AT);
    second.close();
    new SQLiteRunStorage(valid, { onMigration: () => {}, concepts: authority() }).close();
    expect(table(valid, "SELECT concept_key, pack_digest FROM attempt_concepts")).toEqual([{ concept_key: "concept:outside-passer@1", pack_digest: stored.digest }]);

    // A stored row whose bytes were changed after registration fails closed.
    const tampered = priorRelease([["r5", "community-pack", "pack:community-pack#outside-passer", "outside-passer"]], [["r5", stored]]);
    const third = raw(tampered);
    third.prepare("INSERT INTO pack_drafts (id, pack_id, owner_learner_id, document_json, digest, state, seed_kind, seed_ref, created_at, updated_at) VALUES ('d1', 'community-pack', 'owner', ?, ?, 'registered', 'blank', NULL, ?, ?)").run(JSON.stringify(stored.document), stored.digest, AT, AT);
    third.prepare("INSERT INTO registered_packs (pack_id, version, digest, document_json, publisher_handle, publisher_learner_id, draft_id, registered_at) VALUES ('community-pack', '1.0.0', ?, ?, 'owner', 'owner', 'd1', ?)").run(stored.digest, JSON.stringify({ ...stored.document, concepts: ["break-timing"] }), AT);
    third.close();
    expect(() => new SQLiteRunStorage(tampered, { onMigration: () => {}, concepts: authority() })).toThrow(/Could not migrate run storage/u);
    expect(version(tampered)).toBe(27);
  });
});

describe("[[D2964]], [[D2965]] — no half-composed authority survives a refused startup", () => {
  it("closes the database when the storage coordinator refuses", () => {
    const path = priorRelease(LEGACY);
    const close = vi.spyOn(DatabaseSync.prototype, "close");
    expect(() => new SQLiteRunStorage(path, { onMigration: () => {}, concepts: authority({ faultPoint: "after_receipt" }) })).toThrow();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("closes storage when composition fails after the coordinator committed", async () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-concept-compose-"));
    directories.push(directory);
    const invalid = join(directory, "register.json");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(invalid, "{ not json");
    const close = vi.spyOn(SQLiteRunStorage.prototype, "close");
    await expect(createInMemoryTestApplication({ valenceRegisterPath: invalid })).rejects.toThrow();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
