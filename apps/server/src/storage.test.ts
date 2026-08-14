import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { appendOpponentPly, createRun, fork, readBackReplay, resistanceOnPath } from "@chess-tabiya/runtime";
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
      { version: 5, name: "record policyModeApplied as unknown on v0.6 selections" },
      { version: 6, name: "attempt records, concept tags, schedules, and history stats" },
      { version: 7, name: "pack studio drafts and registered versions" },
      { version: 8, name: "branch origin and prediction event run schema" },
      { version: 9, name: "live sessions, journal, proposals, votes, invitations, and arena legs" },
      { version: 10, name: "shape studio drafts and registered versions" },
      { version: 11, name: "branch groups run schema" },
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
    ).toBe(11);
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
      { version: 5, name: "record policyModeApplied as unknown on v0.6 selections" },
      { version: 6, name: "attempt records, concept tags, schedules, and history stats" },
      { version: 7, name: "pack studio drafts and registered versions" },
      { version: 8, name: "branch origin and prediction event run schema" },
      { version: 9, name: "live sessions, journal, proposals, votes, invitations, and arena legs" },
      { version: 10, name: "shape studio drafts and registered versions" },
      { version: 11, name: "branch groups run schema" },
    ]);
    expect(upgraded.read(ordinary.id)?.run.schemaVersion).toBe("0.9");
    expect(upgraded.list(10, 0).map((entry) => entry.id)).toEqual([ordinary.id]);
    expect(upgraded.read(forged.id)).toBeUndefined();
    upgraded.close();
  });

  it("migrates every v0.6 selection to unknown without inferring its requested mode", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-v07-"));
    directories.push(directory);
    const filename = join(directory, "runs.sqlite");
    const initial = new SQLiteRunStorage(filename, { onMigration: () => {} });
    const ids = ["human_common", "strong_engine", "theory_strict"] as const;
    for (const mode of ids) {
      const base = run(`v06-${mode}`);
      const played = appendOpponentPly(base, {
        moveUci: "e2e4",
        policyModeApplied: mode,
        engine: { id: "fixture", name: "Fixture", version: "1", seedHonored: true },
      }, { at: createdAt }).run;
      initial.create(played, `writer-${mode}`, mode);
    }
    initial.close();

    const fixture = new DatabaseSync(filename);
    const rows = fixture.prepare("SELECT id, snapshot_json FROM drill_runs").all() as Array<{ id: string; snapshot_json: string }>;
    const update = fixture.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.6' WHERE id = ?");
    for (const row of rows) {
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown> & { events: Array<Record<string, unknown>> };
      const events = snapshot.events.map((event) => {
        if (event.type !== "opponent.move_selected") return event;
        const data = event.data as Record<string, unknown>;
        const selection = data.selection as Record<string, unknown>;
        const { policyModeApplied: _discarded, ...legacySelection } = selection;
        return { ...event, data: { ...data, selection: legacySelection } };
      });
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.6", events }), row.id);
    }
    fixture.exec("PRAGMA user_version = 4");
    fixture.close();

    const migrated = new SQLiteRunStorage(filename, { onMigration: () => {} });
    const modes = new Set<string>();
    for (const mode of ids) {
      const stored = migrated.read(`v06-${mode}`)!.run;
      const replay = readBackReplay(stored.events);
      modes.add(replay.opponentMoves[0]!.policyModeApplied);
      expect(resistanceOnPath(stored, stored.activeCursor.nodeId)).toMatchObject({
        applied: [],
        unknownPlyCount: 1,
      });
    }
    expect(modes).toEqual(new Set(["unknown"]));
    migrated.close();
  });

  it("stamps v0.8 runs to v0.9 with frozen literals and leaves quarantined rows untouched", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-v09-"));
    directories.push(directory);
    const filename = join(directory, "runs.sqlite");
    const initial = new SQLiteRunStorage(filename, { onMigration: () => {} });
    const ordinary = run("ordinary-v08");
    const quarantined = run("quarantined-v08");
    initial.create(ordinary, "writer-ordinary", "Ordinary");
    initial.create(quarantined, "writer-quarantined", "Quarantined");
    initial.close();

    const fixture = new DatabaseSync(filename);
    const rows = fixture.prepare("SELECT id, snapshot_json FROM drill_runs").all() as Array<{ id: string; snapshot_json: string }>;
    const downgrade = fixture.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = ? WHERE id = ?");
    for (const row of rows) {
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      const schemaVersion = row.id === quarantined.id ? "quarantined:pre-0.5" : "0.8";
      downgrade.run(JSON.stringify({ ...snapshot, schemaVersion: "0.8" }), schemaVersion, row.id);
    }
    fixture.exec("PRAGMA user_version = 10");
    fixture.close();

    const migrations: StorageMigrationLog[] = [];
    const upgraded = new SQLiteRunStorage(filename, { onMigration: (entry) => migrations.push(entry) });
    expect(migrations).toEqual([{ version: 11, name: "branch groups run schema" }]);
    expect(upgraded.read(ordinary.id)?.run.schemaVersion).toBe("0.9");
    expect(upgraded.read(quarantined.id)).toBeUndefined();
    upgraded.close();

    const inspection = new DatabaseSync(filename);
    expect(inspection.prepare("SELECT schema_version FROM drill_runs WHERE id = ?").get(quarantined.id)).toEqual({ schema_version: "quarantined:pre-0.5" });
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
