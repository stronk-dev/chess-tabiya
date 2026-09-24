// rfc/longitudinal-store.md §F criteria 14, 16, 27, 29 — the production-composed file-backed worker:
// `createApplication` reconciles and awaits a real `worker_threads` executor, `/healthz` reports the
// closed readiness projection, `close()` drains, and the operator doors reach the same dependencies.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildSync } from "esbuild";
import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { parseLongitudinalReadQuery } from "./longitudinal-contract.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { LONGITUDINAL_WORKER_DEFAULTS, fileBackedDatabaseIdentity, validateLongitudinalWorkerConfig } from "./longitudinal-worker-config.js";
import { LONGITUDINAL_DRAIN_GRACE_MS, LongitudinalProjectionWorker } from "./longitudinal-worker.js";
import { AT, importedRun, learner, play, positionRun } from "./longitudinal-test-fixtures.js";
import { parsePgnMainline } from "./pgn-import.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const directories: string[] = [];
let application: ChessTabiyaApplication | undefined;

// Detach before awaiting: a late teardown must never close or delete the next test's database (D3300).
afterEach(async () => {
  const closing = application;
  const removing = directories.splice(0);
  application = undefined;
  try {
    await closing?.close();
  } finally {
    for (const directory of removing) rmSync(directory, { recursive: true, force: true });
  }
});

function temp(): string {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-longitudinal-worker-"));
  directories.push(directory);
  return directory;
}

async function listen(app: ChessTabiyaApplication): Promise<string> {
  await new Promise<void>((resolveListen, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolveListen); });
  return `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
}

async function until<T>(read: () => T | undefined, timeoutMs = 60_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = read();
    if (value !== undefined) return value;
    if (Date.now() > deadline) throw new Error("condition not reached");
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
}

function fakeThread(directory: string, body: string): URL {
  const path = join(directory, "fake-thread.mjs");
  writeFileSync(path, `import { parentPort, workerData } from "node:worker_threads";\n${body}\n`);
  return pathToFileURL(path);
}

describe("criteria 16, 29 — the production-composed file-backed worker", { timeout: 120_000 }, () => {
  it("reconciles before readiness, projects imported games off the event loop, reports ready and drains", async () => {
    const directory = temp();
    const databasePath = join(directory, "app.sqlite");
    // An old database: runs exist before the worker-bearing application first starts.
    const seed = new SQLiteRunStorage(databasePath, { onMigration: () => {} });
    const owner = learner(seed, "owner");
    seed.create(play(positionRun("preexisting"), "e2e4"), owner);
    const raw = new DatabaseSync(databasePath);
    raw.exec("DELETE FROM learner_observation_jobs");
    raw.close();
    seed.close();

    application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    expect(application.startupReceipt).toMatchObject({ storageVersion: STORAGE_VERSION, databasePath, longitudinal: { scanned: 1, created: 1 } });
    const origin = await listen(application);
    const health = await fetch(`${origin}/healthz`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: "ok", engineMode: "mock", longitudinal: { status: "ready" }, providers: expect.any(Array) });

    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "importer", password: "importer-password-long" }) });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const imported = await fetch(`${origin}/runs/import`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie, "x-writer-id": "writer-importer" },
      body: JSON.stringify({ id: "imported-game", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3, source: { kind: "pgn", pgn: "1. e4 e5 2. Nf3 *" } }),
    });
    expect(imported.status).toBe(201);
    const inspection = new DatabaseSync(databasePath);
    const learnerId = String((inspection.prepare("SELECT id FROM learners WHERE handle = 'importer'").get() as { id: string }).id);
    inspection.close();
    const read = await until(() => {
      const result = application!.longitudinal.read(learnerId, parseLongitudinalReadQuery({ learnerId, derivationRev: 1, through: { kind: "all_complete" }, filter: {} }));
      return result.kind === "complete" ? result : undefined;
    });
    expect(read.cuts.map((cut) => cut.runId)).toEqual(["imported-game"]);
    expect(read.denominators.map((row) => [row.decisionClass, row.decisions])).toEqual([["game", 2]]);
    expect(read.observations.length).toBeGreaterThan(0);
    const preexisting = await until(() => {
      const result = application!.longitudinal.read("owner", parseLongitudinalReadQuery({ learnerId: "owner", derivationRev: 1, through: { kind: "all_complete" }, filter: {} }));
      return result.kind === "complete" ? result : undefined;
    });
    expect(preexisting.cuts).toEqual([{ kind: "complete", runId: "preexisting", requestedSeq: 2, completedSeq: 2, derivedRev: 1 }]);
    // Worker totals cross the thread boundary in their own message, which may trail the published
    // rows the reads above already observe; wait for it rather than racing it.
    const totals = await until(() => {
      const progress = application!.longitudinal.progress();
      return progress !== undefined && progress.completed >= 2 ? progress : undefined;
    });
    expect(totals.completed).toBeGreaterThanOrEqual(2);

    const closing = application;
    application = undefined;
    await closing.close();
    expect(closing.longitudinal.health()).toEqual({ status: "draining" });
    const after = new DatabaseSync(databasePath);
    expect(after.prepare("SELECT state, count(*) AS n FROM learner_observation_jobs GROUP BY state").all()).toEqual([{ state: "complete", n: 2 }]);
    after.close();

    // Rerun: startup reconciliation is idempotent across restart.
    application = await createApplication({ engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    expect(application.startupReceipt.longitudinal).toMatchObject({ scanned: 2, created: 0, advanced: 0, revisionReset: 0 });
  });

  it("degrades /healthz to 503 on unexpected thread exit and never lets the main process renew", async () => {
    const directory = temp();
    const entry = fakeThread(directory, `parentPort.postMessage({ type: "ready", databasePath: workerData.databasePath, workerId: workerData.workerId }); setTimeout(() => process.exit(3), 50);`);
    application = await createApplication({ engineMode: "mock", cookieSecure: false, databasePath: join(directory, "exit.sqlite"), longitudinalWorkerEntry: entry });
    const origin = await listen(application);
    await until(() => application!.longitudinal.health().status === "degraded" ? true : undefined, 10_000);
    const health = await fetch(`${origin}/healthz`);
    expect(health.status).toBe(503);
    expect(await health.json()).toEqual({ status: "degraded", engineMode: "mock", longitudinal: { status: "degraded", reason: "worker_exited" }, providers: expect.any(Array) });
  });

  it("fails before readiness on a missing artifact, a disagreeing database path or a :memory: identity", async () => {
    const directory = temp();
    await expect(createApplication({ engineMode: "mock", cookieSecure: false, databasePath: join(directory, "missing.sqlite"), longitudinalWorkerEntry: pathToFileURL(join(directory, "absent-thread.js")) }))
      .rejects.toMatchObject({ name: "LongitudinalWorkerStartError", reason: "worker_start_failed" });
    const wrongPath = fakeThread(directory, `parentPort.postMessage({ type: "ready", databasePath: "/somewhere/else.sqlite", workerId: workerData.workerId });`);
    await expect(createApplication({ engineMode: "mock", cookieSecure: false, databasePath: join(directory, "wrong.sqlite"), longitudinalWorkerEntry: wrongPath }))
      .rejects.toMatchObject({ reason: "worker_protocol_invalid" });
    await expect(createApplication({ engineMode: "mock", cookieSecure: false, databasePath: ":memory:" })).rejects.toThrow(/DATABASE_IDENTITY_INVALID/u);
    expect(() => fileBackedDatabaseIdentity("file:app.sqlite")).toThrow(/IDENTITY_INVALID/u);
    expect(fileBackedDatabaseIdentity("relative/app.sqlite").absolutePath).toBe(resolve(process.cwd(), "relative/app.sqlite"));
    expect(() => validateLongitudinalWorkerConfig({ ...LONGITUDINAL_WORKER_DEFAULTS, workerHeartbeatMs: 50_000 })).toThrow(/OPTIONS_INVALID/u);
    expect(() => validateLongitudinalWorkerConfig({ ...LONGITUDINAL_WORKER_DEFAULTS, workerConcurrency: 5 })).toThrow(/OPTIONS_INVALID/u);
    expect(() => validateLongitudinalWorkerConfig({ ...LONGITUDINAL_WORKER_DEFAULTS, extra: 1 })).toThrow(/OPTIONS_INVALID/u);
  });

  it("keeps the in-memory composition test-only: no worker, disabled_test, unreachable from main.ts", async () => {
    application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
    const origin = await listen(application);
    const health = await fetch(`${origin}/healthz`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: "ok", engineMode: "mock", longitudinal: { status: "disabled_test" }, providers: expect.any(Array) });
    expect(application.longitudinal.progress()).toBeUndefined();
    const main = readFileSync(join(HERE, "main.ts"), "utf8");
    for (const forbidden of ["in-memory-test-application", "composeApplication", ":memory:", "longitudinal-test-support"]) expect(main).not.toContain(forbidden);
  });

  it("bounds close() by the drain grace mid-projection and completes the abandoned job after restart (D3300)", async () => {
    const directory = temp();
    const databasePath = join(directory, "drain.sqlite");
    // The longest game in the fixed corpus, queued three times: projections are in flight for many
    // seconds, far longer than the grace, so waiting for the in-flight batch cannot pass.
    const games = readFileSync(new URL("../../../tools/r2-selection-harness/imported-sample.pgn", import.meta.url), "utf8").split(/\n(?=\[Event )/u);
    const moves = games.map((game) => { try { return parsePgnMainline(game, { requireMoves: true }).moves.map((move) => move.uci); } catch { return []; } })
      .reduce((longest, candidate) => candidate.length > longest.length ? candidate : longest, [] as string[]);
    expect(moves.length).toBeGreaterThanOrEqual(120);
    const seed = new SQLiteRunStorage(databasePath, { onMigration: () => {} });
    const owner = learner(seed, "drain");
    for (const id of ["long-1", "long-2", "long-3"]) {
      seed.createImportedRun(importedRun(id, moves), owner, id, {
        runId: id, sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"e".repeat(64)}`, headers: {}, result: "*",
        pgn: "fixed corpus", licenceNote: "fixture", importedAt: AT,
      } as never);
    }
    seed.close();
    const jobs = (): readonly { run_id: string; state: string }[] => {
      const database = new DatabaseSync(databasePath, { readOnly: true });
      try { return database.prepare("SELECT run_id, state FROM learner_observation_jobs ORDER BY run_id").all() as { run_id: string; state: string }[]; } finally { database.close(); }
    };

    application = await createApplication({ engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    const inFlight = await until(() => jobs().find((job) => job.state === "running")?.run_id, 30_000);
    const closing = application;
    application = undefined;
    const started = performance.now();
    await closing.close();
    const closeMs = performance.now() - started;
    expect(closeMs).toBeLessThan(LONGITUDINAL_DRAIN_GRACE_MS);
    // The thread handed the claim back at a decision checkpoint rather than finishing it.
    expect(closing.longitudinal.progress()).toMatchObject({ abandoned: 1 });
    expect(jobs().find((job) => job.run_id === inFlight)?.state).toBe("running");

    // Restart on the same file: the abandoned lease is re-leased at once and every job completes.
    application = await createApplication({ engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    await until(() => jobs().every((job) => job.state === "complete") ? true : undefined, 110_000);
    expect(jobs()).toEqual([{ run_id: "long-1", state: "complete" }, { run_id: "long-2", state: "complete" }, { run_id: "long-3", state: "complete" }]);
  }, 180_000);

  it("supervises the real thread: crash marks degraded; drain waits and closes", async () => {
    const directory = temp();
    const path = join(directory, "supervised.sqlite");
    new SQLiteRunStorage(path, { onMigration: () => {} }).close();
    const crashed = await LongitudinalProjectionWorker.start({ database: fileBackedDatabaseIdentity(path), storageVersion: STORAGE_VERSION, config: LONGITUDINAL_WORKER_DEFAULTS, threadUrl: longitudinalThreadEntryForTests() });
    expect(crashed.status()).toEqual({ status: "ready" });
    await crashed.terminateForTest();
    await until(() => crashed.status().status === "degraded" ? true : undefined, 5_000);
    expect(crashed.status()).toEqual({ status: "degraded", reason: "worker_exited" });
    const drained = await LongitudinalProjectionWorker.start({ database: fileBackedDatabaseIdentity(path), storageVersion: STORAGE_VERSION, config: LONGITUDINAL_WORKER_DEFAULTS, threadUrl: longitudinalThreadEntryForTests() });
    await drained.drain();
    expect(drained.status()).toEqual({ status: "draining" });
    // A version-mismatched database is refused by the thread before ready.
    const stale = join(directory, "stale.sqlite");
    const database = new DatabaseSync(stale);
    database.exec("PRAGMA user_version = 25");
    database.close();
    await expect(LongitudinalProjectionWorker.start({ database: fileBackedDatabaseIdentity(stale), storageVersion: STORAGE_VERSION, config: LONGITUDINAL_WORKER_DEFAULTS, threadUrl: longitudinalThreadEntryForTests() }))
      .rejects.toMatchObject({ reason: "worker_start_failed" });
  });
});

describe("operator doors and packaging", { timeout: 120_000 }, () => {
  it("longitudinal-worker-once drains one bounded batch; longitudinal-rebuild compares and repairs", () => {
    const directory = temp();
    const databasePath = join(directory, "operator.sqlite");
    const storage = new SQLiteRunStorage(databasePath, { onMigration: () => {} });
    const owner = learner(storage, "operator");
    storage.create(play(positionRun("one"), "e2e4"), owner);
    storage.create(play(positionRun("two"), "d2d4"), owner);
    storage.close();
    const bundle = (entry: string) => {
      const outfile = join(directory, entry.replace(".ts", ".js"));
      buildSync({ entryPoints: [join(HERE, entry)], bundle: true, platform: "node", format: "esm", external: ["typescript"], outfile, logLevel: "silent" });
      return outfile;
    };
    const once = bundle("longitudinal-worker-once.ts");
    const first = spawnSync(process.execPath, [once, "--database", databasePath], { encoding: "utf8", cwd: ROOT });
    expect(first.status, first.stderr).toBe(0);
    expect(JSON.parse(first.stdout.trim().split("\n").at(-1)!)).toMatchObject({ event: "longitudinal_worker_once", claimed: 1, completed: 1, failed: 0 });
    const database = new DatabaseSync(databasePath);
    expect(database.prepare("SELECT run_id, state FROM learner_observation_jobs ORDER BY run_id").all()).toEqual([{ run_id: "one", state: "complete" }, { run_id: "two", state: "pending" }]);
    database.close();
    const rebuild = bundle("longitudinal-rebuild.ts");
    const clean = spawnSync(process.execPath, [rebuild, "--database", databasePath], { encoding: "utf8", cwd: ROOT });
    expect(clean.status, clean.stderr).toBe(0);
    expect(JSON.parse(clean.stdout)).toMatchObject({ report: { checked: 1, mismatches: [], skipped: { pending: ["two"] } } });
    const tamper = new DatabaseSync(databasePath);
    tamper.exec("UPDATE learner_observation_denominators SET decisions = decisions + 1 WHERE run_id = 'one'");
    tamper.close();
    const red = spawnSync(process.execPath, [rebuild, "--database", databasePath], { encoding: "utf8", cwd: ROOT });
    expect(red.status).toBe(1);
    expect(JSON.parse(red.stdout).report.mismatches).toContainEqual({ runId: "one", table: "learner_observation_denominators", key: "opening/played", kind: "changed" });
    const repaired = spawnSync(process.execPath, [rebuild, "--database", databasePath, "--write"], { encoding: "utf8", cwd: ROOT });
    expect(repaired.status, repaired.stdout).toBe(0);
    expect(JSON.parse(repaired.stdout).after.mismatches).toEqual([]);
  });

  it("builds the worker thread as an explicit server entrypoint referenced by the bundled main", () => {
    const build = (JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8")) as { scripts: { build: string } }).scripts.build;
    expect(build).toContain("src/longitudinal-worker-thread.ts");
    const bundled = buildSync({ entryPoints: [join(HERE, "main.ts")], bundle: true, platform: "node", format: "esm", external: ["typescript"], write: false, logLevel: "silent" });
    expect(bundled.outputFiles[0]!.text).toContain('new URL("./longitudinal-worker-thread.js", import.meta.url)');
  });
});

describe("criterion 14 — reachability boundaries", () => {
  const sources = new Map(readdirSync(HERE).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts")).map((name) => [name, readFileSync(join(HERE, name), "utf8")] as const));
  // Runtime (value) edges only: `import type`/`export type` statements are erased by the bundler.
  const imports = (name: string): readonly string[] => [
    ...[...(sources.get(name) ?? "").matchAll(/(?:^|\n)\s*(?:import|export)(\s+type)?\b[^;]*?from\s+"\.\/([^"]+)\.js"/gu)].filter((match) => match[1] === undefined).map((match) => `${match[2]!}.ts`),
    ...[...(sources.get(name) ?? "").matchAll(/(?:^|\n)\s*import\s+"\.\/([^"]+)\.js"/gu)].map((match) => `${match[1]!}.ts`),
  ];
  const closure = (entry: string): ReadonlySet<string> => {
    const seen = new Set<string>();
    const visit = (name: string): void => {
      if (seen.has(name) || !sources.has(name)) return;
      seen.add(name);
      for (const next of imports(name)) visit(next);
    };
    visit(entry);
    return seen;
  };

  it("keeps the semantic executor out of the HTTP process module graph", () => {
    const http = closure("main.ts");
    for (const forbidden of ["longitudinal-projector.ts", "longitudinal-worker-core.ts", "longitudinal-worker-thread.ts", "in-memory-test-application.ts", "longitudinal-test-support.ts"]) {
      expect(http.has(forbidden), forbidden).toBe(false);
    }
    expect(http.has("longitudinal-worker.ts")).toBe(true);
    expect(closure("longitudinal-worker-thread.ts").has("longitudinal-projector.ts")).toBe(true);
    // Able-to-fail control: a synthetic edge from service.ts to the projector is detected.
    sources.set("service.ts", `${sources.get("service.ts")}\nimport "./longitudinal-projector.js";\nexport {} from "./longitudinal-projector.js";`);
    expect(closure("main.ts").has("longitudinal-projector.ts")).toBe(true);
    sources.set("service.ts", readFileSync(join(HERE, "service.ts"), "utf8"));
  });

  it("isolates the store from renderers, ratings, cohorts, providers and LLM modules in both directions", () => {
    const longitudinal = [...sources.keys()].filter((name) => name.startsWith("longitudinal-") && name !== "longitudinal-test-support.ts" && name !== "longitudinal-test-fixtures.ts");
    const renderers = ["guard.ts", "guard-conditions.ts", "guidance.ts", "feedback-policy.ts", "authored-feedback.ts", "reasoning.ts", "rating-service.ts", "rating-standing.ts", "classroom.ts"].filter((name) => sources.has(name));
    for (const renderer of renderers) {
      const reach = closure(renderer);
      expect(longitudinal.filter((name) => reach.has(name)), renderer).toEqual([]);
    }
    const forbidden = ["external-voice.ts", "external-tts.ts", "maia.ts", "strong-engine.ts", "engine-supervisor.ts", "corpus.ts", "tablebase.ts", "classroom.ts", "guidance.ts"];
    for (const module of longitudinal) {
      if (module === "longitudinal-rebuild.ts" || module === "longitudinal-worker-once.ts") continue;
      const reach = closure(module);
      expect(forbidden.filter((name) => reach.has(name)), module).toEqual([]);
      expect([...reach].filter((name) => name.startsWith("rating")), module).toEqual([]);
    }
    // No production module outside the store/storage/account inventory reads the tables directly.
    const readers = [...sources.entries()].filter(([name, text]) => /learner_observations|learner_observation_denominators|learner_structure_stats|learner_observation_jobs/u.test(text)).map(([name]) => name).sort();
    // account-import.ts names the four tables only to declare them re-derived (never copied) on import.
    expect(readers).toEqual(["account-data.ts", "account-import.ts", "longitudinal-store.ts", "storage.ts"]);
  });
});

void AT;
