// longitudinal-store §C: failed startup owns its real worker until termination completes.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate as nextTurn } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";

import { afterEach, expect, it, vi } from "vitest";

import { createApplication } from "./application.js";
import { CampaignRegistry } from "./campaign-registry.js";
import { fileBackedDatabaseIdentity, LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { LongitudinalProjectionWorker } from "./longitudinal-worker.js";
import { PackRegistry } from "./pack-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { ShapeRegistry } from "./shape-registry.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";
import { TrainingSetRegistry } from "./training-set-registry.js";

const directories: string[] = [];
const workers = new Set<Worker>();
const pending = new Set<Promise<unknown>>();
const releases: (() => void)[] = [];
const terminate = Worker.prototype.terminate;

afterEach(async () => {
  for (const release of releases.splice(0)) release();
  vi.restoreAllMocks();
  await Promise.all([...workers].map(worker => terminate.call(worker)));
  workers.clear();
  await Promise.allSettled([...pending]);
  pending.clear();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function owned<T>(promise: Promise<T>): Promise<T> {
  pending.add(promise);
  return promise;
}

function fixture(body: string) {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-worker-start-"));
  directories.push(directory);
  const entry = join(directory, "thread.mjs");
  writeFileSync(entry, `import { parentPort, workerData } from "node:worker_threads";\n${body}\nsetInterval(() => {}, 1000);\n`);
  const databasePath = join(directory, "app.sqlite");
  return { databasePath, threadUrl: pathToFileURL(entry), database: fileBackedDatabaseIdentity(databasePath) };
}

function heldTermination() {
  const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(done => { resolve = done; });
    return { promise, resolve };
  };
  const entered = deferred();
  const release = deferred();
  releases.push(() => release.resolve());
  const calls = vi.spyOn(Worker.prototype, "terminate").mockImplementation(async function (this: Worker) {
    workers.add(this);
    entered.resolve();
    const code = await terminate.call(this);
    await release.promise;
    return code;
  });
  return { entered: entered.promise, release: () => release.resolve(), calls };
}

it.each([
  ["wrong database", 'parentPort.postMessage({ type: "ready", databasePath: "/wrong.sqlite", workerId: workerData.workerId });', "unexpected first message or database path disagreement"],
  ["invalid frame", 'parentPort.postMessage({ type: "ready", databasePath: workerData.databasePath, workerId: workerData.workerId, extra: true });', "unexpected first message or database path disagreement"],
  ["reported refusal", 'parentPort.postMessage({ type: "error", code: "worker_protocol_invalid", message: "refused exact worker input" });', "refused exact worker input"],
  ["ready after refusal", 'parentPort.postMessage({ type: "error", code: "worker_protocol_invalid", message: "first refusal" }); parentPort.postMessage({ type: "ready", databasePath: workerData.databasePath, workerId: workerData.workerId });', "first refusal"],
])("awaits real worker termination before rejecting %s", async (_label, body, message) => {
  const input = fixture(body);
  const held = heldTermination();
  let settled = false;
  const result = owned(LongitudinalProjectionWorker.start({ ...input, storageVersion: STORAGE_VERSION, config: LONGITUDINAL_WORKER_DEFAULTS })
    .then(value => { settled = true; return value; }, error => { settled = true; return error; }));
  await held.entered;
  await nextTurn();
  expect(settled).toBe(false);
  held.release();
  expect(await result).toMatchObject({ name: "LongitudinalWorkerStartError", reason: "worker_protocol_invalid", message });
  expect(held.calls).toHaveBeenCalledTimes(1);
});

it("awaits termination on the existing startup deadline without exposing readiness", async () => {
  const input = fixture("");
  const held = heldTermination();
  let settled = false;
  const result = owned(LongitudinalProjectionWorker.start({ ...input, storageVersion: STORAGE_VERSION, config: LONGITUDINAL_WORKER_DEFAULTS, startTimeoutMs: 10 })
    .catch(error => { settled = true; return error; }));
  await held.entered;
  await nextTurn();
  expect(settled).toBe(false);
  held.release();
  expect(await result).toMatchObject({ reason: "worker_start_failed", message: "longitudinal worker did not report ready" });
  expect(held.calls).toHaveBeenCalledTimes(1);
});

it("finishes worker termination before actual application cleanup closes its database", async () => {
  // This is a startup resource control, not an installed-content test. Keep real application,
  // SQLite and worker composition while constructing explicit empty validated catalogues.
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(ShapeRegistry, "loadDefault").mockResolvedValue(new ShapeRegistry());
  vi.spyOn(PrincipleRegistry, "loadDefault").mockResolvedValue(new PrincipleRegistry());
  vi.spyOn(PackRegistry, "loadDefault").mockImplementation(options => PackRegistry.fromDocuments([], options));
  vi.spyOn(TrainingSetRegistry, "loadDefault").mockImplementation(packs => TrainingSetRegistry.fromDocuments([], packs));
  vi.spyOn(CampaignRegistry, "loadDefault").mockImplementation(packs => CampaignRegistry.fromDocuments([], packs));
  const input = fixture('parentPort.postMessage({ type: "error", code: "worker_protocol_invalid", message: "startup refusal" });');
  const held = heldTermination();
  const order: string[] = [];
  const close = SQLiteRunStorage.prototype.close;
  vi.spyOn(SQLiteRunStorage.prototype, "close").mockImplementation(function (this: SQLiteRunStorage) {
    order.push("database closed");
    return close.call(this);
  });
  const result = owned(createApplication({ engineMode: "mock", cookieSecure: false, databasePath: input.databasePath, longitudinalWorkerEntry: input.threadUrl })
    .catch(error => error));
  await held.entered;
  await nextTurn();
  expect(order).toEqual([]);
  order.push("termination released");
  held.release();
  expect(await result).toMatchObject({ reason: "worker_protocol_invalid", message: "startup refusal" });
  expect(order).toEqual(["termination released", "database closed"]);
  expect(held.calls).toHaveBeenCalledTimes(1);
  // The same real SQLite database can be opened immediately after the rejected application.
  const reopened = new SQLiteRunStorage(input.databasePath, { onMigration: () => {} });
  expect(reopened.list(1, 0)).toEqual([]);
  reopened.close();
});
