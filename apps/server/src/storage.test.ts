import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { createRun, fork } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { SQLiteRunStorage, type StorageMigrationLog } from "./storage.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const createdAt = "2026-08-11T10:00:00.000Z";

function run(id: string, packId = "legacy-pack") {
  return createRun({
    id,
    packId,
    packDigest: `sha256:${"7".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: INITIAL_FEN,
    seed: 11,
    createdAt,
  });
}

describe("SQLite run-storage migrations and summaries", () => {
  const directories: string[] = [];

  afterEach(() => {
    for (const directory of directories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("upgrades and backfills a legacy fixture once, then skips on reopen", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-migration-"));
    directories.push(directory);
    const filename = join(directory, "legacy.sqlite");
    const legacyRun = run("legacy-run");
    const fixture = new DatabaseSync(filename);
    fixture.exec(`
      CREATE TABLE drill_runs (
        id TEXT PRIMARY KEY,
        snapshot_json TEXT NOT NULL,
        active_writer_id TEXT NOT NULL CHECK (length(active_writer_id) > 0),
        updated_at TEXT NOT NULL
      ) STRICT
    `);
    fixture
      .prepare(
        `INSERT INTO drill_runs (id, snapshot_json, active_writer_id, updated_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(
        legacyRun.id,
        JSON.stringify({ ...legacyRun, schemaVersion: "0.4" }),
        "legacy-writer",
        createdAt,
      );
    fixture.close();

    const firstLog: StorageMigrationLog[] = [];
    const upgraded = new SQLiteRunStorage(filename, {
      onMigration: (entry) => firstLog.push(entry),
    });
    expect(firstLog).toEqual([
      { version: 1, name: "add and backfill run summaries" },
      { version: 2, name: "learner identity and run grants" },
      { version: 3, name: "quarantine pre-0.5 run snapshots" },
      { version: 4, name: "upgrade v0.5 run snapshots to v0.6" },
    ]);
    expect(upgraded.list(10, 0)).toEqual([]);
    expect(upgraded.read("legacy-run")).toBeUndefined();
    upgraded.close();

    const secondLog: StorageMigrationLog[] = [];
    const reopened = new SQLiteRunStorage(filename, {
      onMigration: (entry) => secondLog.push(entry),
    });
    expect(secondLog).toEqual([]);
    expect(reopened.list(10, 0)).toHaveLength(0);
    reopened.close();

    const inspection = new DatabaseSync(filename);
    expect(
      (inspection.prepare("PRAGMA user_version").get() as { user_version: number })
        .user_version,
    ).toBe(4);
    inspection.close();
  });

  it("keeps ordinary v0.5 runs readable while quarantining pre-producer outcomes", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-v06-"));
    directories.push(directory);
    const filename = join(directory, "runs.sqlite");
    const initial = new SQLiteRunStorage(filename, { onMigration: () => {} });
    const ordinary = run("ordinary-v05");
    const forged = run("forged-v05");
    initial.create(ordinary, "writer-ordinary", "Ordinary");
    initial.create(forged, "writer-forged", "Forged");
    initial.close();

    const fixture = new DatabaseSync(filename);
    const downgrade = fixture.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.5' WHERE id = ?",
    );
    downgrade.run(JSON.stringify({ ...ordinary, schemaVersion: "0.5" }), ordinary.id);
    downgrade.run(
      JSON.stringify({
        ...forged,
        schemaVersion: "0.5",
        events: [
          ...forged.events,
          {
            seq: forged.events.length + 1,
            type: "outcome.reached",
            at: createdAt,
            data: { nodeId: forged.activeCursor.nodeId, outcome: "anything" },
          },
        ],
      }),
      forged.id,
    );
    fixture.exec("PRAGMA user_version = 3");
    fixture.close();

    const migrations: StorageMigrationLog[] = [];
    const upgraded = new SQLiteRunStorage(filename, {
      onMigration: (entry) => migrations.push(entry),
    });
    expect(migrations).toEqual([
      { version: 4, name: "upgrade v0.5 run snapshots to v0.6" },
    ]);
    expect(upgraded.read(ordinary.id)?.run.schemaVersion).toBe("0.6");
    expect(upgraded.list(10, 0).map((entry) => entry.id)).toEqual([ordinary.id]);
    expect(upgraded.read(forged.id)).toBeUndefined();
    upgraded.close();
  });

  it("lists captured titles and pages only denormalized rows", () => {
    let tick = 0;
    const storage = new SQLiteRunStorage(":memory:", {
      now: () => `2026-08-11T10:00:0${tick++}.000Z`,
      onMigration: () => {},
    });
    const runA = run("run-a", "pack-a");
    storage.create(runA, "writer-a", "Historical A");
    storage.create(run("run-b", "pack-b"), "writer-b", "Historical B");

    const branched = fork(runA, runA.activeCursor.nodeId, {
      at: "2026-08-11T10:01:00.000Z",
    }).run;
    storage.save(branched, "writer-a");

    expect(storage.list(1, 0)).toEqual([
      expect.objectContaining({
        id: "run-a",
        title: "Historical A",
        branchCount: 2,
        viewerRole: "host",
        leaseHeldBy: { learnerId: "__legacy", handle: "__legacy" },
      }),
    ]);
    expect(storage.list(1, 1)).toEqual([
      expect.objectContaining({
        id: "run-b",
        title: "Historical B",
        viewerRole: "host",
        leaseHeldBy: { learnerId: "__legacy", handle: "__legacy" },
      }),
    ]);
    storage.close();
  });

  it("does not create the legacy sentinel in a fresh database", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    expect(storage.learnerById("__legacy")).toBeUndefined();
    storage.close();
  });
});
