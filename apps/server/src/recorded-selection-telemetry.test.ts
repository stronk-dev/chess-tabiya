// Synthetic telemetry and chess positions exercise persistence, not model quality or chess truth.
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { appendEvents, appendOpponentPly, attachEvidence, commitMove, createRun, readBackReplay, type DrillRun, type OpponentSelection } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";
import { IdentityService } from "./identity.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { upgradeV018RecordedSelection } from "./migrations/recorded-selection-telemetry.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-11-01T12:00:00.000Z";
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const engine = { id: "synthetic-maia", name: "Synthetic recorded model", version: "fixture", seedHonored: false };
function run(id: string): DrillRun {
  return createRun({ id, session: { kind: "position", start: { fen: FEN, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig, seed: 7, createdAt: at });
}
const cleanups: (() => void | Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
function file() {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-empty-telemetry-"));
  cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, "runs.sqlite");
}
async function predecessor(filename: string) {
  const storage = new SQLiteRunStorage(filename, { onMigration: () => {} });
  storage.createLearner({ id: "migration-owner", handle: "migration-owner", passwordHash: "!", createdAt: at });
  for (const [id, candidates] of [["a-absent", undefined], ["b-present", [{ moveUci: "e2e4", rank: 1, mass: 1 }]], ["z-last", undefined]] as const) {
    const selection: OpponentSelection = { moveUci: "e2e4", policyModeApplied: "human_common", engine,
      ...(candidates === undefined ? {} : { candidates }) };
    let played = appendOpponentPly(run(id), selection, { at }).run;
    if (id === "b-present") played = attachEvidence(played, played.activeCursor.nodeId, ["synthetic-eval"],
      { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }, at).run;
    storage.create(played, { writerId: `writer-${id}`, learnerId: "migration-owner" }, id);
  }
  await new RunService(storage).importGame({ id: "c-imported", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3,
    source: { kind: "pgn", pgn: "[Result \"*\"]\n\n1. e4 e5 *" }, createdAt: at }, { writerId: "import-writer", learnerId: "migration-owner" });
  storage.close();
  const database = new DatabaseSync(filename);
  database.exec("UPDATE drill_runs SET schema_version='0.18', snapshot_json=json_set(snapshot_json,'$.schemaVersion','0.18'); ALTER TABLE imported_games DROP COLUMN clock_document_json; DROP TABLE learner_subject_observations; DROP TABLE learner_choice_facts; DROP TABLE learner_game_facts; PRAGMA user_version=30");
  return database;
}
const snapshots = (database: DatabaseSync) => database.prepare("SELECT * FROM drill_runs ORDER BY id").all();

describe("recorded empty telemetry migration31", () => {
  it("preserves non-stamp snapshots, events and row metadata, stays visible and runs once", async () => {
    const filename = file(), fixture = await predecessor(filename), before = snapshots(fixture);
    const imports = fixture.prepare("SELECT * FROM imported_games ORDER BY run_id").all();
    const grants = fixture.prepare("SELECT * FROM run_grants ORDER BY run_id,learner_id").all();
    fixture.close();
    const migrations: number[] = [];
    const storage = new SQLiteRunStorage(filename, { onMigration: entry => migrations.push(entry.version) });
    expect(migrations).toEqual([31, 32, 33, 34, 35]);
    expect(storage.list("migration-owner", 10, 0)).toHaveLength(4);
    expect(storage.runCount("migration-owner")).toBe(4);
    for (const row of before) expect(storage.read(String(row.id))!.run.schemaVersion).toBe("0.19");
    storage.close();
    const raw = new DatabaseSync(filename), after = snapshots(raw);
    expect(after).toEqual(before.map(row => ({ ...row, schema_version: "0.19",
      snapshot_json: JSON.stringify({ ...JSON.parse(String(row.snapshot_json)), schemaVersion: "0.19" }) })));
    expect(raw.prepare("SELECT * FROM imported_games ORDER BY run_id").all()).toEqual(imports.map(row => ({ ...row, clock_document_json: null })));
    expect(raw.prepare("SELECT * FROM run_grants ORDER BY run_id,learner_id").all()).toEqual(grants);
    raw.close();
    const reopened = new SQLiteRunStorage(filename, { onMigration: entry => migrations.push(entry.version) });
    expect(migrations).toEqual([31, 32, 33, 34, 35]);
    expect(reopened.read("a-absent")!.run.events).toEqual(JSON.parse(String(before[0]!.snapshot_json)).events);
    const prior = reopened.read("b-present")!.run;
    reopened.save(commitMove(prior, "e7e5", { at }).run, { writerId: "writer-b-present", learnerId: "migration-owner" });
    expect(reopened.read("b-present")!.run.events.slice(0, prior.events.length)).toEqual(prior.events);
    expect(reopened.read("b-present")!.run.nodes.at(-1)!.moveUci).toBe("e7e5");
    reopened.close();
  });

  it.each(["invalid-json", "null", "stamp", "id", "event", "replay"])("rolls back the whole migration on targeted %s corruption", async kind => {
    const filename = file(), fixture = await predecessor(filename);
    const row = fixture.prepare("SELECT snapshot_json FROM drill_runs WHERE id='z-last'").get()!;
    const snapshot = JSON.parse(String(row.snapshot_json));
    let encoded: string;
    if (kind === "invalid-json") encoded = "{";
    else if (kind === "null") encoded = "null";
    else {
      if (kind === "stamp") snapshot.schemaVersion = "0.17";
      if (kind === "id") snapshot.id = "crossed-run";
      if (kind === "event") snapshot.events[0].seq = 2;
      if (kind === "replay") snapshot.nodes[0].fen = "8/8/8/8/8/4k3/8/4K3 w - - 0 1";
      encoded = JSON.stringify(snapshot);
    }
    fixture.prepare("UPDATE drill_runs SET snapshot_json=? WHERE id='z-last'").run(encoded);
    const before = snapshots(fixture); fixture.close();
    expect(() => new SQLiteRunStorage(filename, { onMigration: () => {} })).toThrow(/migrate/i);
    const raw = new DatabaseSync(filename);
    expect(raw.prepare("PRAGMA user_version").get()).toMatchObject({ user_version: 30 });
    expect(snapshots(raw)).toEqual(before); raw.close();
  });

  it("traverses the actual frozen migration and a later stamp step with a later-version replay", async () => {
    const database = await predecessor(file()), before = snapshots(database);
    database.exec("BEGIN IMMEDIATE");
    upgradeV018RecordedSelection(database, events => ({ run: { ...readBackReplay(events).run, schemaVersion: "0.20" } }));
    database.exec("PRAGMA user_version=31");
    expect(snapshots(database).every(row => row.schema_version === "0.19")).toBe(true);
    // Disposable successor stamp, not an implementation of recorded-clocks or a new app reader.
    database.exec("UPDATE drill_runs SET schema_version='0.20', snapshot_json=json_set(snapshot_json,'$.schemaVersion','0.20'); PRAGMA user_version=32; COMMIT");
    for (const [index, row] of snapshots(database).entries()) {
      expect(row.schema_version).toBe("0.20");
      expect({ ...JSON.parse(String(row.snapshot_json)), schemaVersion: "0.18" }).toEqual(JSON.parse(String(before[index]!.snapshot_json)));
    }
    database.close();
  });

  it("replays an actual empty prediction with zero count and null mass/rank", () => {
    const initial = run("empty-prediction");
    const predicted = appendEvents(initial, [{ type: "prediction.recorded", at, data: { nodeId: initial.activeCursor.nodeId,
      checkpointId: "prediction", predictedUci: "e2e4", predictedMass: null, predictedRank: null, candidateCount: 0,
      distribution: { moveUci: "e2e4", policyModeApplied: "human_common", candidates: [], engine } } }]);
    expect(readBackReplay(predicted.events).run).toEqual(predicted);
    for (const change of [{ candidateCount: 1 }, { predictedMass: 0 }, { predictedRank: 1 }]) {
      const invalid = predicted.events.map(event => event.type === "prediction.recorded" ? { ...event, data: { ...event.data, ...change } } : event);
      expect(() => readBackReplay(invalid)).toThrow(/distribution/);
    }
  });
});

describe("authenticated existing REST selection writes", () => {
  it("persists human empty and absent telemetry; refuses other-policy empties, invalid moves, wrong writers and forged bot envelopes", async () => {
    const filename = file(), storage = new SQLiteRunStorage(filename, { onMigration: () => {} });
    const queue = new EvidenceJobQueue({ async execute(job) { return { kind: job.kind, source: "engine_validated", values: { centipawns: 0 } }; } });
    const service = new RunService(storage, { evidenceQueue: queue });
    const identity = new IdentityService(storage, { cookieSecure: false, derive: async (password, salt) => createHash("sha256").update(salt).update(password).digest() });
    const handler = createRestHandler(service, undefined, undefined, identity);
    cleanups.push(async () => { await queue.close(); storage.close(); });
    const auth = await identity.register({ handle: "telemetry-owner", password: "correct horse battery staple" });
    const cookie = auth.cookie.split(";", 1)[0]!;
    const request = (path: string, body: unknown, writer = "writer") => handler(new Request(`http://tabiya.test${path}`, {
      method: "POST", headers: { cookie, "x-writer-id": writer, "content-type": "application/json" }, body: JSON.stringify(body),
    }));
    const create = async (id: string) => {
      const response = await request("/runs", { id, session: { kind: "position", start: { fen: FEN, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig, seed: 7 });
      expect(response.status, await response.clone().text()).toBe(201);
    };
    await create("empty-write");
    const base = { moveUci: "e2e4", policyModeApplied: "human_common", candidates: [], engine };
    const bad = [
      { ...base, policyModeApplied: "strong_engine" }, { ...base, policyModeApplied: "enumerated" },
      { ...base, moveUci: "e2e5" }, { ...base, candidates: null }, { ...base, candidates: [{}] },
      { ...base, engine: {} }, { ...base, policy: { forged: true } },
    ];
    const before = storage.read("empty-write")!.run.events;
    for (const selection of bad) {
      const response = await request("/runs/empty-write/moves", { selection });
      expect(response.status, await response.clone().text()).toBeGreaterThanOrEqual(400); await response.text();
      expect(storage.read("empty-write")!.run.events).toEqual(before);
    }
    const denied = await request("/runs/empty-write/moves", { selection: base }, "wrong-writer");
    expect(denied.status).toBeGreaterThanOrEqual(400); await denied.text();
    const moved = await request("/runs/empty-write/moves", { selection: base });
    expect(moved.status, await moved.clone().text()).toBe(200); await moved.text();
    await create("absent-write");
    const { candidates: _candidates, ...absent } = base;
    const second = await request("/runs/absent-write/moves", { selection: absent });
    expect(second.status, await second.clone().text()).toBe(200); await second.text();
    await queue.close();
    const exported = await request("/auth/export", { password: "correct horse battery staple" });
    expect(exported.status, await exported.clone().text()).toBe(200);
    const bundle: unknown = await exported.json();
    const target = new SQLiteRunStorage(file(), { onMigration: () => {} });
    cleanups.push(() => target.close());
    const targetIdentity = new IdentityService(target, { cookieSecure: false, derive: async (password, salt) => createHash("sha256").update(salt).update(password).digest() });
    const targetHandler = createRestHandler(new RunService(target), undefined, undefined, targetIdentity);
    const recipient = await targetIdentity.register({ handle: "telemetry-recipient", password: "correct horse battery staple" });
    const restored = await targetHandler(new Request("http://tabiya.test/auth/import", { method: "POST",
      headers: { cookie: recipient.cookie.split(";", 1)[0]!, "content-type": "application/json" }, body: JSON.stringify({ bundle, password: "correct horse battery staple" }) }));
    expect(restored.status, await restored.clone().text()).toBe(201); await restored.text();
    const owned = target.accountBundle(recipient.learner.id).ownedRuns.value;
    expect(owned).toHaveLength(2);
    const restoredSelections = owned.map(item => {
      expect(item.snapshot.kind).toBe("parsed");
      if (item.snapshot.kind !== "parsed") throw new Error("Expected restored replayable run");
      return item.snapshot.value.events.find(event => event.type === "opponent.move_selected")!;
    });
    expect(restoredSelections.map(event => Object.hasOwn(event.data.selection, "candidates")).sort()).toEqual([false, true]);
    expect(restoredSelections.find(event => Object.hasOwn(event.data.selection, "candidates"))!.data.selection.candidates).toEqual([]);
    const raw = new DatabaseSync(filename);
    for (const [id, present] of [["empty-write", true], ["absent-write", false]] as const) {
      const snapshot = JSON.parse(String(raw.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(id)!.snapshot_json));
      const event = snapshot.events.find((event: { type: string }) => event.type === "opponent.move_selected");
      expect(Object.hasOwn(event.data.selection, "candidates")).toBe(present);
      if (present) expect(event.data.selection.candidates).toEqual([]);
      expect(snapshot.nodes.at(-1).moveUci).toBe("e2e4");
    }
    raw.close();
    const reopened = new SQLiteRunStorage(filename, { onMigration: () => {} });
    expect(reopened.read("empty-write")!.run.events.some(event => event.type === "opponent.move_selected" && event.data.selection.candidates?.length === 0)).toBe(true);
    reopened.close();
  });
});
