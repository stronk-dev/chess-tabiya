// rfc/storage-backup-recovery.md criteria 5, 7, 8, 10, 15 and rfc/safe-deployment-profiles.md
// criteria 1–2 at the process boundary: the bundled `main.js` (with its real longitudinal worker
// thread) and the bundled `storage-admin.js` CLI run as separate OS processes against one file
// database. Backup → loss → restore → boot proves stable identities through a restarted server,
// the live server excludes maintenance, and a newer database never reaches an HTTP listener.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { buildSync } from "esbuild";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { catalogEntryFor, createRun, runEventHeadDigest, type DrillRun } from "@chess-tabiya/runtime";
import { RATED_OPPONENT_CALIBRATION } from "@chess-tabiya/runtime/rating";

import { ACCOUNT_DATA_INVENTORY } from "./account-data.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
let dist: string;
const directories: string[] = [];
const children: ChildProcess[] = [];

beforeAll(() => {
  // The bundle must sit three directories below the repository root, exactly like
  // `apps/server/dist/`, because runtime content resolves `../../../content/` from the bundle.
  mkdirSync(join(ROOT, ".cache", "appliance-dist"), { recursive: true });
  dist = mkdtempSync(join(ROOT, ".cache", "appliance-dist", "run-"));
  const bundle = (entry: string, out: string) => buildSync({ entryPoints: [join(HERE, entry)], bundle: true, platform: "node", format: "esm", external: ["typescript"], outfile: join(dist, out), logLevel: "silent" });
  bundle("main.ts", "main.js");
  bundle("longitudinal-worker-thread.ts", "longitudinal-worker-thread.js");
  bundle("storage-admin-cli.ts", "storage-admin.js");
}, 120_000);

afterAll(() => {
  rmSync(dist, { recursive: true, force: true });
});

afterEach(async () => {
  for (const child of children.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await new Promise((done) => child.once("exit", done));
    }
  }
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

async function freePort(): Promise<number> {
  return new Promise((done, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => done(typeof address === "object" && address !== null ? address.port : 0));
    });
  });
}

interface Appliance {
  readonly directory: string;
  readonly database: string;
  readonly backups: string;
  readonly port: number;
  readonly origin: string;
}

async function appliance(): Promise<Appliance> {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-appliance-"));
  directories.push(directory);
  mkdirSync(join(directory, "static"));
  writeFileSync(join(directory, "static", "index.html"), "<!doctype html><title>Tabiya</title>");
  const port = await freePort();
  return { directory, database: join(directory, "data", "chess-tabiya.sqlite"), backups: join(directory, "backups"), port, origin: `http://127.0.0.1:${port}` };
}

function serverEnv(state: Appliance, extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR };
  Object.assign(env, {
    TABIYA_DEPLOYMENT_PROFILE: "local",
    PORT: String(state.port),
    DATABASE_PATH: state.database,
    ENGINE_MODE: "mock",
    STATIC_DIRECTORY: join(state.directory, "static"),
    TABIYA_APPLICATION_REVISION: "0123456789abcdef0123456789abcdef01234567",
    ...extra,
  });
  for (const [key, value] of Object.entries(env)) if (value === undefined) delete env[key];
  return env;
}

interface Running {
  readonly child: ChildProcess;
  readonly output: () => string;
  readonly exited: Promise<number | null>;
}

function startServer(state: Appliance, extra: Record<string, string | undefined> = {}): Running {
  const child = spawn(process.execPath, [join(dist, "main.js")], { cwd: ROOT, env: serverEnv(state, extra), stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let output = "";
  child.stdout!.on("data", (chunk) => { output += String(chunk); });
  child.stderr!.on("data", (chunk) => { output += String(chunk); });
  const exited = new Promise<number | null>((done) => child.once("exit", (code) => done(code)));
  return { child, output: () => output, exited };
}

async function ready(state: Appliance, server: Running, probe = "/readyz"): Promise<void> {
  const deadline = Date.now() + 90_000;
  let exited = false;
  void server.exited.then(() => { exited = true; });
  while (Date.now() < deadline) {
    if (exited) throw new Error(`server exited before readiness:\n${server.output()}`);
    try {
      const response = await fetch(`${state.origin}${probe}`);
      if (response.status === 200) return;
    } catch { /* not listening yet */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`server never became ready:\n${server.output()}`);
}

async function stop(server: Running): Promise<void> {
  server.child.kill("SIGTERM");
  await server.exited;
}

function admin(state: Appliance, args: readonly string[]): { readonly status: number | null; readonly receipt: Record<string, unknown>; readonly stdout: string } {
  const result = spawnSync(process.execPath, [join(dist, "storage-admin.js"), ...args, "--database", state.database, "--backup-root", state.backups], { cwd: ROOT, env: serverEnv(state), encoding: "utf8" });
  const lines = result.stdout.split("\n");
  // Stdout is a protocol: exactly one canonical JSON value followed by one newline.
  expect(lines, result.stderr).toHaveLength(2);
  expect(lines[1]).toBe("");
  return { status: result.status, receipt: JSON.parse(lines[0]!) as Record<string, unknown>, stdout: result.stdout };
}

const writeHeaders = (state: Appliance, cookie?: string) => ({ "content-type": "application/json", origin: state.origin, ...(cookie === undefined ? {} : { cookie }) });

/** Independent read of all persisted rows, not the backup manifest's counts or export projection. */
function storedRows(database: string): Record<string, readonly object[]> {
  const db = new DatabaseSync(database, { readOnly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    return Object.fromEntries(tables.map(({ name }) => {
      const table = String(name);
      expect(table).toMatch(/^[a-z_]+$/u);
      const rows = db.prepare(`SELECT * FROM "${table}"`).all();
      rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      return [table, rows];
    }));
  } finally { db.close(); }
}

describe("appliance process boundary", { timeout: 240_000 }, () => {
  it("refuses readiness while the actual web shell is missing and recovers on restoration", async () => {
    const state = await appliance();
    const index = join(state.directory, "static", "index.html");
    const retained = join(state.directory, "retained-index.html");
    renameSync(index, retained);
    const server = startServer(state);
    await ready(state, server, "/healthz");
    expect(await (await fetch(`${state.origin}/healthz`)).json()).toMatchObject({ status: "ok", longitudinal: { status: "ready" } });
    const missing = await fetch(`${state.origin}/`);
    expect(missing.status).toBe(503);
    expect(await missing.json()).toMatchObject({ error: { code: "STATIC_NOT_BUILT" } });
    const refused = await fetch(`${state.origin}/readyz`);
    expect(refused.status).toBe(503);
    expect(refused.headers.get("cache-control")).toBe("no-store");
    expect(await refused.json()).toEqual({ status: "unready" });
    renameSync(retained, index);
    expect((await fetch(`${state.origin}/`)).status).toBe(200);
    await ready(state, server);
    expect(await (await fetch(`${state.origin}/readyz`)).text()).toBe(`{"representativeData":"ok","status":"ready","storageVersion":${STORAGE_VERSION}}`);
    await stop(server);
  });

  it("does not retain ready when the live shell becomes an unreadable directory", async () => {
    const state = await appliance();
    const server = startServer(state);
    await ready(state, server);
    const index = join(state.directory, "static", "index.html");
    const retained = join(state.directory, "retained-index.html");
    renameSync(index, retained);
    mkdirSync(index);
    expect((await fetch(`${state.origin}/`)).status).toBe(503);
    expect((await fetch(`${state.origin}/readyz`)).status).toBe(503);
    expect((await fetch(`${state.origin}/healthz`)).status).toBe(200);
    rmdirSync(index);
    renameSync(retained, index);
    expect((await fetch(`${state.origin}/`)).status).toBe(200);
    expect((await fetch(`${state.origin}/readyz`)).status).toBe(200);
    await stop(server);
  });

  it("backup → loss → fresh restore → boot keeps a learner and imported-game identity", async () => {
    const state = await appliance();
    const first = startServer(state);
    await ready(state, first);
    expect(first.output()).toContain("\"action\":\"fresh\"");
    const health = await (await fetch(`${state.origin}/healthz`)).json();
    expect(health).toMatchObject({ status: "ok", engineMode: "mock", longitudinal: { status: "ready" } });
    expect(Object.keys(health).sort()).toEqual(["engineMode", "longitudinal", "providers", "status"]);
    expect(await (await fetch(`${state.origin}/readyz`)).text()).toBe(`{"representativeData":"ok","status":"ready","storageVersion":${STORAGE_VERSION}}`);

    const registered = await fetch(`${state.origin}/auth/register`, { method: "POST", headers: writeHeaders(state), body: JSON.stringify({ handle: "keeper", password: "keeper-password-long" }) });
    expect(registered.status).toBe(201);
    const setCookie = registered.headers.get("set-cookie")!;
    // Local profile: HTTP loopback, host-only, HttpOnly, Strict, never Secure.
    expect(setCookie).toMatch(/^tabiya_session=[^;]+; HttpOnly; SameSite=Strict; Path=\/; Max-Age=\d+$/u);
    const cookie = setCookie.split(";", 1)[0]!;
    const imported = await fetch(`${state.origin}/runs/import`, {
      method: "POST",
      headers: { ...writeHeaders(state, cookie), "x-writer-id": "writer-keeper" },
      body: JSON.stringify({ id: "kept-game", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3, source: { kind: "pgn", pgn: "1. e4 e5 2. Nf3 *" } }),
    });
    expect(imported.status).toBe(201);
    // The transport boundary refuses a cross-origin write before routing.
    const forged = await fetch(`${state.origin}/auth/login`, { method: "POST", headers: { "content-type": "application/json", origin: "http://evil.example" }, body: JSON.stringify({ handle: "keeper", password: "keeper-password-long" }) });
    expect(forged.status).toBe(403);

    // A live server holds the storage lock: maintenance refuses before opening SQLite.
    const locked = admin(state, ["backup"]);
    expect(locked.status).toBe(2);
    expect(locked.receipt).toMatchObject({ operation: "backup", result: "refused", code: "MAINTENANCE_LOCKED" });

    await stop(first);
    const backedUp = admin(state, ["backup"]);
    expect(backedUp.status, backedUp.stdout).toBe(0);
    expect(backedUp.receipt).toMatchObject({ operation: "backup", result: "succeeded", reason: "manual", applicationRevision: "0123456789abcdef0123456789abcdef01234567", checks: ["digest", "integrity", "foreign_keys", "inventory", "compatibility"] });
    const bundle = join(state.backups, String(backedUp.receipt.backupId));
    const verified = admin(state, ["verify", bundle]);
    expect(verified.receipt).toMatchObject({ result: "succeeded", compatibility: "current" });

    // Media loss: the database triplet is gone.
    for (const entry of readdirSync(dirname(state.database))) if (entry.startsWith("chess-tabiya.sqlite")) rmSync(join(dirname(state.database), entry));
    const restored = admin(state, ["restore", bundle]);
    expect(restored.status, restored.stdout).toBe(0);
    expect(restored.receipt).toMatchObject({ operation: "restore", result: "succeeded", migration: "not_required", preRestoreBackupId: null });

    const second = startServer(state);
    await ready(state, second);
    expect(second.output()).toContain("\"action\":\"current\"");
    const login = await fetch(`${state.origin}/auth/login`, { method: "POST", headers: writeHeaders(state), body: JSON.stringify({ handle: "keeper", password: "keeper-password-long" }) });
    expect(login.status).toBe(200);
    const again = login.headers.get("set-cookie")!.split(";", 1)[0]!;
    const runs = await (await fetch(`${state.origin}/runs`, { headers: { cookie: again } })).json() as { runs: { id: string }[] };
    expect(runs.runs.map((run) => run.id)).toContain("kept-game");
    expect(await (await fetch(`${state.origin}/healthz`)).json()).toMatchObject({ status: "ok", longitudinal: { status: "ready" } });
    await stop(second);
  });

  it("D608: restores nonempty application classes to a new data directory and continues real workflows", async () => {
    const state = await appliance();
    const fixtureEnv = {
      NODE_ENV: "development",
      DRAFT_PACK_FILES: [join(ROOT, "content/drafts/line-boundary.browser.json"), join(ROOT, "schemas/fixtures/drill-pack/campaign-boss.browser.json")].join(","),
      DRAFT_CAMPAIGN_FILES: join(ROOT, "tests/browser/fixtures/campaign.browser.json"),
    };
    const first = startServer(state, fixtureEnv);
    await ready(state, first);
    async function register(handle: string) {
      const response = await fetch(`${state.origin}/auth/register`, { method: "POST", headers: writeHeaders(state), body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
      expect(response.status, await response.clone().text()).toBe(201);
      return { cookie: response.headers.get("set-cookie")!.split(";", 1)[0]!, learner: (await response.json() as { learner: { id: string } }).learner };
    }
    const keeper = await register("recovery_keeper");
    const pupil = await register("recovery_pupil");
    const outsider = await register("recovery_outsider");
    async function call(target: Appliance, cookie: string, method: string, path: string, body?: unknown, status = 200) {
      const response = await fetch(`${target.origin}${path}`, { method, headers: { ...writeHeaders(target, cookie), "x-writer-id": "writer-recovery" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      expect(response.status, `${method} ${path}: ${await response.clone().text()}`).toBe(status);
      return await response.json() as Record<string, any>;
    }
    const owner = (method: string, path: string, body?: unknown, status = 200) => call(state, keeper.cookie, method, path, body, status);
    const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
    const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    await owner("POST", "/runs/import", { id: "recovery-import", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig, seed: 3, source: { kind: "pgn", pgn: "1. e4 e5 2. Nf3 *" } }, 201);
    const played = (await owner("POST", "/runs", { id: "recovery-branches", session: { kind: "position", start: { fen: initialFen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig, seed: 4 }, 201)).run as DrillRun;
    await owner("POST", `/runs/${played.id}/moves`, { uci: "e2e4" });
    await owner("POST", `/runs/${played.id}/rewind`, { nodeId: played.nodes[0]!.id });
    const forked = (await owner("POST", `/runs/${played.id}/fork`, { nodeId: played.nodes[0]!.id, label: "Queen pawn retry" })).run as DrillRun;
    await owner("POST", `/runs/${played.id}/moves`, { uci: "d2d4" });
    await owner("PUT", `/runs/${played.id}/marks`, { nodeId: played.nodes[0]!.id, branchId: forked.activeCursor.branchId, scope: "position", shapes: [{ brush: "blue", orig: "d2", dest: "d4" }] });
    await owner("POST", `/runs/${played.id}/schedule`, { nodeId: played.nodes[0]!.id, kind: "blocked" }, 201);
    const repertoire = (await owner("POST", "/repertoires", { name: "Recovered repertoire", side: "white", targetElo: 1500, coverageDenominator: 100, source: { kind: "pgn", pgn: "1. e4 e5 2. Nf3 *" } }, 201)).repertoire;

    // Existing schema content is copied for storage/authoring, never endorsed as official theory.
    const document = JSON.parse(readFileSync(join(ROOT, "schemas/drill_pack.example.json"), "utf8"));
    document.id = "recovery-community-pack";
    document.version = "1.0.0";
    document.provenance = { reviewStatus: "draft", sources: ["schemas/drill_pack.example.json; recovery fixture, not chess review"], corpusEvidence: { state: "abstained", reason: "source_unavailable", detail: "Storage recovery fixture has no corpus judgement." } };
    const draft = (await owner("POST", "/packs/drafts", { document }, 201)).draft;
    expect(draft.validation.valid).toBe(true);
    const playtest = (await owner("POST", `/packs/drafts/${draft.id}/playtest`, {}, 201)).run as DrillRun;
    await owner("POST", `/packs/drafts/${draft.id}/register`, {}, 201);
    const shapeDocument = structuredClone(await owner("GET", "/shapes/carlsbad"));
    delete shapeDocument.channel;
    delete shapeDocument.publisherHandle;
    delete shapeDocument.digest;
    shapeDocument.id = "recovery-community-shape";
    shapeDocument.version = "1.0.0";
    const shapeDraft = (await owner("POST", "/shapes/drafts", { document: shapeDocument }, 201)).draft;
    expect(shapeDraft.validation.valid).toBe(true);
    await owner("POST", `/shapes/drafts/${shapeDraft.id}/register`, {}, 201);

    const classroom = (await owner("POST", "/classrooms", { name: "Recovered study group" }, 201)).classroom;
    await owner("POST", `/classrooms/${classroom.id}/members`, { op: "invite", handle: "recovery_pupil", role: "learner" }, 201);
    await call(state, pupil.cookie, "POST", `/classrooms/${classroom.id}/members`, { op: "accept" });
    const assignment = (await owner("POST", `/classrooms/${classroom.id}/assignments`, { packId: document.id, note: "Retain my submitted branch" }, 201)).assignment;
    const submitted = (await call(state, pupil.cookie, "POST", "/runs", { id: "recovery-submission", session: { kind: "pack", packId: document.id }, policyConfig, seed: 8 }, 201)).run as DrillRun;
    await call(state, pupil.cookie, "POST", `/assignments/${assignment.id}/submissions`, { runId: submitted.id }, 201);
    const session = (await owner("POST", "/sessions", { runId: played.id, kind: "stream", title: "Recovered rehearsal", boardControl: "host_directed" }, 201)).session;
    await owner("POST", `/cohorts/${classroom.id}/standing`, { op: "open", windowFrom: "2026-01-01T00:00:00.000Z" }, 201);
    await call(state, pupil.cookie, "POST", `/cohorts/${classroom.id}/standing`, { op: "publish" }, 201);

    const bot = (await owner("POST", "/runs", { id: "recovery-bot", session: { kind: "position", start: { fen: initialFen, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", profile: catalogEntryFor("human-baseline.1400@1")!.reference } }, policyConfig, seed: 9 }, 201)).run as DrillRun;
    const botRequest = { requestId: "botreq_recoveryxxxxxxxx", expectedNodeId: bot.activeCursor.nodeId, expectedBranchId: bot.activeCursor.branchId, expectedEventHeadDigest: runEventHeadDigest(bot) };
    const botReply = await owner("POST", `/runs/${bot.id}/opponent-ply`, botRequest);
    expect(botReply.result.kind).toBe("committed");

    const createdCampaign = await owner("POST", "/campaigns/browser-fixture-campaign/runs", { campaignVersion: 1, commandId: "recovery-campaign-create" }, 201);
    const campaignId = createdCampaign.result.campaignRunId as string;
    const started = await owner("POST", `/campaign-runs/${campaignId}/nodes/f1-b/start`, { expectedRevision: 1, commandId: "recovery-campaign-start" }, 201);
    const encounterId = started.result.response.playRunId as string;
    await owner("POST", `/runs/${encounterId}/moves`, { uci: "c1e3" });
    const encounter = (await owner("POST", `/runs/${encounterId}/moves`, { uci: "e7e6", actor: "system" })).run as DrillRun;
    await owner("POST", `/runs/${encounterId}/fork`, { nodeId: encounter.activeCursor.nodeId, campaignCommand: { commandId: "recovery-campaign-fork", expectedCampaignRevision: 2, expectedPlayRevision: encounter.events.at(-1)!.seq } });
    const submitCommand = { runId: encounterId, expectedRevision: 3, commandId: "recovery-campaign-submit" };
    const campaignSubmitted = await owner("POST", `/campaign-runs/${campaignId}/nodes/f1-b/submit`, submitCommand);

    const paths = ["/runs/recovery-import/events", `/runs/${played.id}/events`, `/runs/${played.id}/marks`, `/runs/${playtest.id}/events`, `/runs/${submitted.id}/events`, `/runs/${bot.id}/events`, "/progress", `/repertoires/${repertoire.id}`, `/packs/drafts/${draft.id}`, `/packs/${document.id}`, `/shapes/drafts/${shapeDraft.id}`, `/shapes/${shapeDocument.id}`, `/classrooms/${classroom.id}`, "/assignments", `/sessions/${session.id}`, `/campaign-runs/${campaignId}`];
    const beforeReads = new Map<string, Record<string, any>>();
    for (const path of paths) beforeReads.set(path, await owner("GET", path));
    // Shutdown drains/abandons an in-flight claim; it does not promise to finish the backlog.
    // Wait on actual persisted jobs for BOTH owners instead of assuming readiness means caught up.
    await expect.poll(async () => {
      const exports = await Promise.all([keeper, pupil].map(account => call(state, account.cookie, "POST", "/auth/export", { password: account === keeper ? "recovery_keeper-password-long" : "recovery_pupil-password-long" })));
      return exports.every(bundle => {
        const jobs = bundle.behavioralProfiles.value.filter((value: { table: string }) => value.table === "learner_observation_jobs");
        return jobs.length > 0 && jobs.every((value: { record: { state: string; requested_seq: number; completed_seq: number } }) => value.record.state === "complete" && value.record.requested_seq === value.record.completed_seq);
      });
    }, { timeout: 90_000, interval: 200 }).toBe(true);
    await stop(first);

    // Historical rated storage must survive even when the current mock provider cannot admit
    // new calibrated games. Use the real transactional storage API, not fabricated SQL rows,
    // engine claims or a manufactured win. This empty game is explicitly abandoned/voided.
    const history = new SQLiteRunStorage(state.database, { onMigration: () => {} });
    const at = "2026-09-24T12:00:00.000Z";
    const rated = createRun({ id: "recovery-historical-rated", session: { kind: "position", start: { fen: initialFen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1400 } }, sessionDigest: "sha256:" + "a".repeat(64), policyConfig, seed: 10, createdAt: at });
    const rung = RATED_OPPONENT_CALIBRATION.rungs.find(value => value.band === 1400)!;
    history.createRatedRun(rated, { learnerId: keeper.learner.id, writerId: "writer-recovery" }, "Historical recovery fixture", { runId: rated.id, learnerId: keeper.learner.id, calibrationId: RATED_OPPONENT_CALIBRATION.id, opponentBand: rung.band, opponentRating: rung.rating, opponentRd: rung.rd, learnerSide: "white", startPieceCount: 32, engineIdentityDigest: RATED_OPPONENT_CALIBRATION.engine.containerDigest, state: "open", startedAt: at });
    history.voidRatedGame(rated.id, "abandoned", "2026-09-24T12:01:00.000Z");
    const historicalGames = history.ratedGames(keeper.learner.id);
    const historicalPeriods = history.ratingPeriods(keeper.learner.id);
    history.close();
    const before = storedRows(state.database);
    expect(Object.keys(before).sort()).toEqual(ACCOUNT_DATA_INVENTORY.filter(entry => entry.kind === "table").map(entry => entry.store).sort());
    const classes = ACCOUNT_DATA_INVENTORY.filter(entry => entry.kind === "table");
    for (const dataClass of new Set(classes.map(entry => entry.dataClass))) {
      expect(classes.filter(entry => entry.dataClass === dataClass).some(entry => before[entry.store]!.length > 0), `${dataClass} must be nonempty before backup`).toBe(true);
    }
    // Name the critical families as well: one populated class cannot cover an empty sibling.
    const nonemptyFamilies = [
      "attempts", "schedules", "repertoire_moves", "pack_drafts", "playtest_documents",
      "registered_packs", "shape_drafts", "registered_shapes", "run_marks", "classrooms",
      "classroom_members", "assignments", "assignment_submissions", "run_grants", "live_sessions",
      "session_journal", "learner_ratings", "rated_games", "rating_periods", "cohort_standings",
      "standing_members", "campaign_runs", "campaign_run_creations", "campaign_events",
      "campaign_mutation_commands", "learner_observations", "learner_observation_denominators",
      "learner_structure_stats",
    ];
    for (const table of nonemptyFamilies) expect(before[table], table).not.toHaveLength(0);
    const backedUp = admin(state, ["backup"]);
    expect(backedUp.status, backedUp.stdout).toBe(0);
    const bundle = join(state.backups, String(backedUp.receipt.backupId));
    expect(admin(state, ["verify", bundle]).receipt).toMatchObject({ result: "succeeded", compatibility: "current" });
    // Complete media loss, followed by a DIFFERENT initially empty data directory.
    for (const entry of readdirSync(dirname(state.database))) if (entry.startsWith("chess-tabiya.sqlite")) rmSync(join(dirname(state.database), entry));
    expect(existsSync(state.database)).toBe(false);
    const destination = { ...await appliance(), backups: state.backups };
    expect(existsSync(destination.database)).toBe(false);
    const restored = admin(destination, ["restore", bundle]);
    expect(restored.status, restored.stdout).toBe(0);
    expect(restored.receipt).toMatchObject({ operation: "restore", result: "succeeded", migration: "not_required", preRestoreBackupId: null });
    expect(storedRows(destination.database)).toEqual(before);
    const second = startServer(destination, fixtureEnv);
    await ready(destination, second);
    // Original credentials and session authority survive; no recreated accounts or ids.
    expect((await call(destination, keeper.cookie, "GET", "/auth/session")).learner.id).toBe(keeper.learner.id);
    expect((await call(destination, pupil.cookie, "GET", "/auth/session")).learner.id).toBe(pupil.learner.id);
    for (const path of paths) expect(await call(destination, keeper.cookie, "GET", path), path).toEqual(beforeReads.get(path));
    const ratingHistory = await call(destination, keeper.cookie, "GET", "/rating/history");
    expect(ratingHistory).toEqual({ games: historicalGames, periods: historicalPeriods });
    expect((await call(destination, keeper.cookie, "GET", "/rating")).rating).not.toBeNull();
    const exported = await call(destination, keeper.cookie, "POST", "/auth/export", { password: "recovery_keeper-password-long" });
    for (const section of ["ownedRuns", "sharedAccess", "progress", "marks", "repertoires", "drafts", "publications", "liveAndSocial", "behavioralProfiles"]) expect(exported[section].value, section).not.toHaveLength(0);
    await call(destination, outsider.cookie, "GET", `/runs/${submitted.id}/events`, undefined, 404);
    await call(destination, outsider.cookie, "GET", `/packs/drafts/${draft.id}`, undefined, 404);
    const replayed = await call(destination, keeper.cookie, "POST", `/runs/${bot.id}/opponent-ply`, botRequest);
    expect(replayed.result.kind).toBe("replayed_idempotent");
    expect(await call(destination, keeper.cookie, "GET", `/runs/${bot.id}/events`)).toEqual(beforeReads.get(`/runs/${bot.id}/events`));
    const continued = await call(destination, keeper.cookie, "POST", `/runs/${bot.id}/moves`, { uci: "c7c5" });
    expect(continued.run.events.length).toBeGreaterThan(botReply.run.events.length);
    const restoredCampaign = await call(destination, keeper.cookie, "GET", `/campaign-runs/${campaignId}`);
    const submitReplay = await call(destination, keeper.cookie, "POST", `/campaign-runs/${campaignId}/nodes/f1-b/submit`, submitCommand);
    expect(submitReplay.result).toEqual(campaignSubmitted.result);
    expect(await call(destination, keeper.cookie, "GET", `/campaign-runs/${campaignId}`)).toEqual(restoredCampaign);
    await call(destination, keeper.cookie, "POST", `/campaign-runs/${campaignId}/nodes/f2-a/start`, { expectedRevision: restoredCampaign.campaignRun.revision, commandId: "recovery-campaign-continue" }, 201);
    await stop(second);
  });

  it("upgrades a prior-release database on start behind a pre-upgrade bundle, and refuses a newer one before listening", async () => {
    const state = await appliance();
    mkdirSync(dirname(state.database), { recursive: true });
    SQLiteRunStorage.materializeStorageVersion(state.database, STORAGE_VERSION - 1);
    const seed = new DatabaseSync(state.database);
    seed.exec("INSERT INTO learners (id, handle, password_hash, created_at) VALUES ('prior', 'prior', '!', '2026-09-01T00:00:00.000Z')");
    seed.close();
    const upgraded = startServer(state, { TABIYA_BACKUP_ROOT: state.backups });
    await ready(state, upgraded);
    expect(upgraded.output()).toContain("\"action\":\"upgraded\"");
    await stop(upgraded);
    const bundles = readdirSync(state.backups);
    expect(bundles).toHaveLength(1);
    expect(admin(state, ["verify", join(state.backups, bundles[0]!)]).receipt).toMatchObject({ result: "succeeded", compatibility: "upgradeable", sourceStorageVersion: STORAGE_VERSION - 1 });

    // Roll back to the prior release's bytes; this image then upgrades them again on its next start.
    const rolledBack = admin(state, ["rollback", join(state.backups, bundles[0]!), "--confirm-database", state.database]);
    expect(rolledBack.status, rolledBack.stdout).toBe(0);
    expect(rolledBack.receipt).toMatchObject({ operation: "rollback", targetStorageVersion: STORAGE_VERSION - 1 });

    const future = new DatabaseSync(state.database);
    future.exec(`PRAGMA user_version = ${STORAGE_VERSION + 1}`);
    future.close();
    const refused = startServer(state);
    expect(await refused.exited).toBe(2);
    expect(refused.output()).toContain("STORAGE_NEWER_THAN_APPLICATION");
    expect(refused.output()).not.toContain("listening");
    await expect(fetch(`${state.origin}/healthz`)).rejects.toThrow();
  });

  it("refuses to start outside development without an explicit deployment profile", async () => {
    const state = await appliance();
    const server = startServer(state, { TABIYA_DEPLOYMENT_PROFILE: undefined });
    expect(await server.exited).not.toBe(0);
    expect(server.output()).toContain("PROFILE_REQUIRED");
    const hybrid = startServer(state, { TABIYA_COOKIE_SECURE: "true" });
    expect(await hybrid.exited).not.toBe(0);
    expect(hybrid.output()).toContain("PROFILE_HYBRID_REFUSED");
  });

  it("binds the local profile to loopback only", async () => {
    const state = await appliance();
    const server = startServer(state);
    await ready(state, server);
    expect(server.output()).toContain(`listening on 127.0.0.1:${state.port}`);
    const lan = Object.values(networkInterfaces()).flat().find((address) => address !== undefined && address.family === "IPv4" && !address.internal);
    if (lan !== undefined) await expect(fetch(`http://${lan.address}:${state.port}/readyz`)).rejects.toThrow();
    await stop(server);
  });
});
