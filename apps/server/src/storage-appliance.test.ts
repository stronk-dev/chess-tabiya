// rfc/storage-backup-recovery.md criteria 5, 7, 8, 10, 15 and rfc/safe-deployment-profiles.md
// criteria 1–2 at the process boundary: the bundled `main.js` (with its real longitudinal worker
// thread) and the bundled `storage-admin.js` CLI run as separate OS processes against one file
// database. Backup → loss → restore → boot proves stable identities through a restarted server,
// the live server excludes maintenance, and a newer database never reaches an HTTP listener.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { buildSync } from "esbuild";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

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

async function ready(state: Appliance, server: Running): Promise<void> {
  const deadline = Date.now() + 90_000;
  let exited = false;
  void server.exited.then(() => { exited = true; });
  while (Date.now() < deadline) {
    if (exited) throw new Error(`server exited before readiness:\n${server.output()}`);
    try {
      const response = await fetch(`${state.origin}/readyz`);
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

describe("appliance process boundary", { timeout: 240_000 }, () => {
  it("backup → loss → fresh restore → boot with the worker running keeps every identity", async () => {
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
