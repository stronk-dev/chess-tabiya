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
      { version: 12, name: "imported games and run schema" },
      { version: 13, name: "public story tokens and run derivations" },
      { version: 14, name: "native matches and session join tokens" },
      { version: 15, name: "learner repertoires, scans, and gap-run links" },
      { version: 16, name: "immediate guard run schema" },
      { version: 17, name: "stated reasoning run schema" },
      { version: 18, name: "perfect tablebase run schema" },
      { version: 19, name: "practical resistance run schema" },
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
    ).toBe(19);
    inspection.close();
  });

  it("rebuilds migration-13 live tables without losing story tokens or retargeting child foreign keys",()=>{
    const directory=mkdtempSync(join(tmpdir(),"tabiya-storage-social-"));directories.push(directory);const filename=join(directory,"social.sqlite");
    const initial=new SQLiteRunStorage(filename,{onMigration:()=>{}}),host=initial.createLearner({id:"host",handle:"host",passwordHash:"!",createdAt});const value=run("social-old");initial.create(value,{writerId:"writer",learnerId:host.id},"Old live run");
    const session=initial.createLiveSession({id:"session-old",runId:value.id,kind:"academy",title:"Old class",boardControl:"host_directed",createdBy:host.id,at:createdAt});
    initial.createPublicToken({id:"story-old",tokenHash:"hash-old",scope:"story_read",runId:value.id,branchId:value.branches[0]!.id,createdBy:host.id,createdAt,revokedAt:null});initial.close();

    const fixture=new DatabaseSync(filename);fixture.exec("PRAGMA foreign_keys=OFF; PRAGMA legacy_alter_table=ON");
    fixture.exec(`
      DROP TABLE match_states;
      ALTER TABLE public_tokens RENAME TO public_tokens_v14;
      DROP INDEX public_tokens_run; DROP INDEX public_tokens_session;
      CREATE TABLE public_tokens (id TEXT PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,scope TEXT NOT NULL CHECK(scope IN ('story_read')),run_id TEXT NOT NULL,branch_id TEXT NOT NULL,created_by TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,created_at TEXT NOT NULL,revoked_at TEXT) STRICT;
      INSERT INTO public_tokens SELECT id,token_hash,scope,run_id,branch_id,created_by,created_at,revoked_at FROM public_tokens_v14; DROP TABLE public_tokens_v14; CREATE INDEX public_tokens_run ON public_tokens(run_id,created_by);
      ALTER TABLE session_journal RENAME TO session_journal_v14;
      CREATE TABLE session_journal (session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,seq INTEGER NOT NULL,at TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('session.opened','member.joined','board.granted','proposal.made','proposal.applied','proposal.declined','vote.opened','vote.closed','vote.applied','leg.imported','session.closed')),actor_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,run_seq INTEGER,payload_json TEXT NOT NULL,PRIMARY KEY(session_id,seq)) STRICT;
      INSERT INTO session_journal SELECT * FROM session_journal_v14; DROP TABLE session_journal_v14;
      ALTER TABLE live_sessions RENAME TO live_sessions_v14;
      CREATE TABLE live_sessions (id TEXT PRIMARY KEY,run_id TEXT NOT NULL UNIQUE REFERENCES drill_runs(id) ON DELETE CASCADE,kind TEXT NOT NULL CHECK(kind IN ('stream','academy','match')),title TEXT NOT NULL,board_control TEXT NOT NULL CHECK(board_control IN ('free_claim','host_directed','rotation')),scheduled_for TEXT,vote_adapter_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,rotation_json TEXT,handoff_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,rotation_cursor INTEGER NOT NULL DEFAULT 0,created_by TEXT NOT NULL REFERENCES learners(id),created_at TEXT NOT NULL,closed_at TEXT) STRICT;
      INSERT INTO live_sessions SELECT * FROM live_sessions_v14; DROP TABLE live_sessions_v14;
      PRAGMA user_version=13;
    `);fixture.close();

    const log:StorageMigrationLog[]=[];const upgraded=new SQLiteRunStorage(filename,{onMigration:(entry)=>log.push(entry)});expect(log).toEqual([{version:14,name:"native matches and session join tokens"},{version:15,name:"learner repertoires, scans, and gap-run links"},{version:16,name:"immediate guard run schema"},{version:17,name:"stated reasoning run schema"},{version:18,name:"perfect tablebase run schema"},{version:19,name:"practical resistance run schema"}]);
    expect(upgraded.liveSession(session.id)?.title).toBe("Old class");expect(upgraded.publicTokenByHash("hash-old")).toMatchObject({scope:"story_read",runId:value.id});upgraded.close();
    const inspection=new DatabaseSync(filename);expect((inspection.prepare("PRAGMA foreign_key_check").all())).toEqual([]);for(const table of ["session_proposals","session_vote_windows","session_invitations","arena_legs"]){const targets=(inspection.prepare(`PRAGMA foreign_key_list(${table})`).all() as readonly Record<string,unknown>[]).map((row)=>row.table);expect(targets).toContain("live_sessions");expect(targets).not.toContain("live_sessions_v14");}expect(String((inspection.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='live_sessions'").get() as {sql:string}).sql)).toContain("'match'");inspection.close();
    const freshFile=join(directory,"fresh.sqlite"),freshStorage=new SQLiteRunStorage(freshFile,{onMigration:()=>{}});freshStorage.close();const upgradedSchema=new DatabaseSync(filename),freshSchema=new DatabaseSync(freshFile);
    for(const table of ["live_sessions","session_journal","public_tokens"]){const sql=(database:DatabaseSync)=>String((database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table) as {sql:string}).sql).replaceAll(/\s+/gu," ").trim();expect(sql(upgradedSchema)).toBe(sql(freshSchema));}
    const tokenTables=(upgradedSchema.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%token%'").all() as unknown as readonly {name:string}[]).map((row)=>row.name);expect(tokenTables).toEqual(["public_tokens"]);upgradedSchema.close();freshSchema.close();
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
      { version: 12, name: "imported games and run schema" },
      { version: 13, name: "public story tokens and run derivations" },
      { version: 14, name: "native matches and session join tokens" },
      { version: 15, name: "learner repertoires, scans, and gap-run links" },
      { version: 16, name: "immediate guard run schema" },
      { version: 17, name: "stated reasoning run schema" },
      { version: 18, name: "perfect tablebase run schema" },
      { version: 19, name: "practical resistance run schema" },
    ]);
    expect(upgraded.read(ordinary.id)?.run.schemaVersion).toBe("0.14");
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
    expect(migrations).toEqual([
      { version: 11, name: "branch groups run schema" },
      { version: 12, name: "imported games and run schema" },
      { version: 13, name: "public story tokens and run derivations" },
      { version: 14, name: "native matches and session join tokens" },
      { version: 15, name: "learner repertoires, scans, and gap-run links" },
      { version: 16, name: "immediate guard run schema" },
      { version: 17, name: "stated reasoning run schema" },
      { version: 18, name: "perfect tablebase run schema" },
      { version: 19, name: "practical resistance run schema" },
    ]);
    expect(upgraded.read(ordinary.id)?.run.schemaVersion).toBe("0.14");
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

  it("upgrades storage 15 run snapshots to 0.11 once and skips on reopen", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-guard-"));
    directories.push(directory);
    const filename = join(directory, "guard.sqlite");
    const initial = new SQLiteRunStorage(filename, { onMigration: () => {} });
    initial.create(run("guard-migration"), "writer", "Guard migration");
    initial.close();

    const fixture = new DatabaseSync(filename);
    const row = fixture.prepare("SELECT snapshot_json FROM drill_runs WHERE id = ?").get("guard-migration") as { snapshot_json: string };
    const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
    fixture.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.10' WHERE id = ?")
      .run(JSON.stringify({ ...snapshot, schemaVersion: "0.10" }), "guard-migration");
    fixture.exec("PRAGMA user_version = 15");
    fixture.close();

    const log: StorageMigrationLog[] = [];
    const upgraded = new SQLiteRunStorage(filename, { onMigration: (entry) => log.push(entry) });
    expect(log).toEqual([{ version: 16, name: "immediate guard run schema" }, { version: 17, name: "stated reasoning run schema" }, { version: 18, name: "perfect tablebase run schema" }, { version: 19, name: "practical resistance run schema" }]);
    expect(upgraded.read("guard-migration")?.run.schemaVersion).toBe("0.14");
    upgraded.close();

    const reopenedLog: StorageMigrationLog[] = [];
    const reopened = new SQLiteRunStorage(filename, { onMigration: (entry) => reopenedLog.push(entry) });
    expect(reopenedLog).toEqual([]);
    reopened.close();
  });

  it("stamps v0.13 snapshots to v0.14 without rewriting selection evidence", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-practical-"));
    directories.push(directory);
    const filename = join(directory, "practical.sqlite");
    const initial = new SQLiteRunStorage(filename, { onMigration: () => {} });
    const selected = appendOpponentPly(run("practical-migration"), {
      moveUci: "e2e4",
      policyModeApplied: "human_common",
      candidates: [{ moveUci: "e2e4", rank: 1, mass: 0.75 }],
      engine: {
        id: "maia",
        name: "Maia",
        version: "1",
        seedHonored: false,
        eloHonored: true,
        eloApplied: 1600,
      },
    }, { at: createdAt }).run;
    initial.create(selected, "writer", "Practical migration");
    initial.close();

    const fixture = new DatabaseSync(filename);
    const before = fixture.prepare("SELECT snapshot_json FROM drill_runs WHERE id = ?")
      .get(selected.id) as { snapshot_json: string };
    const snapshot = JSON.parse(before.snapshot_json) as Record<string, unknown>;
    fixture.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.13' WHERE id = ?")
      .run(JSON.stringify({ ...snapshot, schemaVersion: "0.13" }), selected.id);
    fixture.exec("PRAGMA user_version = 18");
    fixture.close();

    const log: StorageMigrationLog[] = [];
    const upgraded = new SQLiteRunStorage(filename, { onMigration: (entry) => log.push(entry) });
    expect(log).toEqual([{ version: 19, name: "practical resistance run schema" }]);
    const after = upgraded.read(selected.id)!.run;
    expect(after.schemaVersion).toBe("0.14");
    expect(after.events).toEqual(selected.events);
    upgraded.close();
  });
});
