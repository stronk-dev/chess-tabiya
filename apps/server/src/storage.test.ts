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
      .run(legacyRun.id, JSON.stringify(legacyRun), "legacy-writer", createdAt);
    fixture.close();

    const firstLog: StorageMigrationLog[] = [];
    const upgraded = new SQLiteRunStorage(filename, {
      onMigration: (entry) => firstLog.push(entry),
    });
    expect(firstLog).toEqual([
      { version: 1, name: "add and backfill run summaries" },
    ]);
    expect(upgraded.list(10, 0)).toEqual([
      {
        id: "legacy-run",
        title: "legacy-pack",
        packId: "legacy-pack",
        updatedAt: createdAt,
        objectiveState: "active",
        branchCount: 1,
        activeWriterId: "legacy-writer",
      },
    ]);
    upgraded.close();

    const secondLog: StorageMigrationLog[] = [];
    const reopened = new SQLiteRunStorage(filename, {
      onMigration: (entry) => secondLog.push(entry),
    });
    expect(secondLog).toEqual([]);
    expect(reopened.list(10, 0)).toHaveLength(1);
    reopened.close();

    const inspection = new DatabaseSync(filename);
    expect(
      (inspection.prepare("PRAGMA user_version").get() as { user_version: number })
        .user_version,
    ).toBe(1);
    inspection.close();
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
        activeWriterId: "writer-a",
      }),
    ]);
    expect(storage.list(1, 1)).toEqual([
      expect.objectContaining({
        id: "run-b",
        title: "Historical B",
        activeWriterId: "writer-b",
      }),
    ]);
    storage.close();
  });
});
