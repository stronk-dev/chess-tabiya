// rfc/longitudinal-store.md §C — the sole semantic executor. Runs in a `node:worker_threads` thread
// with its own connection to the exact canonical SQLite file. It posts only closed progress/result/
// error messages; chess-derived rows never cross to the HTTP process.
import { parentPort, threadId, workerData } from "node:worker_threads";

import { LongitudinalStore } from "./longitudinal-store.js";
import { runLongitudinalBatch } from "./longitudinal-worker-core.js";
import {
  fileBackedDatabaseIdentity,
  openLongitudinalDatabase,
  validateLongitudinalWorkerConfig,
} from "./longitudinal-worker-config.js";
import type { LongitudinalThreadMessage, LongitudinalThreadWorkerData } from "./longitudinal-worker-protocol.js";

function post(message: LongitudinalThreadMessage): void {
  parentPort?.postMessage(message);
}

function start(): void {
  if (parentPort === null) throw new Error("longitudinal-worker-thread must run inside worker_threads");
  const data = workerData as LongitudinalThreadWorkerData;
  if (data === null || typeof data !== "object" || typeof data.databasePath !== "string" || typeof data.storageVersion !== "number" || typeof data.workerId !== "string"
    || !(data.drainSignal instanceof SharedArrayBuffer) || data.drainSignal.byteLength < Int32Array.BYTES_PER_ELEMENT) {
    post({ type: "error", code: "worker_protocol_invalid", message: "workerData is not the closed longitudinal shape" });
    return;
  }
  const config = validateLongitudinalWorkerConfig(data.config);
  const identity = fileBackedDatabaseIdentity(data.databasePath);
  if (identity.absolutePath !== data.databasePath) {
    post({ type: "error", code: "worker_protocol_invalid", message: "database path is not canonical" });
    return;
  }
  const database = openLongitudinalDatabase(identity, data.storageVersion);
  const store = new LongitudinalStore(database);
  const workerId = `${data.workerId}:thread-${threadId}`;
  // The supervisor's drain request, visible mid-projection (the `drain` message is not: a projection
  // never yields this thread's event loop). [[D3300]]
  const drainCell = new Int32Array(data.drainSignal, 0, 1);
  const drainRequested = (): boolean => Atomics.load(drainCell, 0) !== 0;
  let draining = false;
  let timer: NodeJS.Timeout | undefined;
  let scheduled = false;

  const finish = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    database.close();
    post({ type: "drained" });
    parentPort!.close();
  };

  const tick = (): void => {
    scheduled = false;
    timer = undefined;
    if (draining || drainRequested()) { finish(); return; }
    let claimed = 0;
    try {
      const receipt = runLongitudinalBatch(store, config, workerId, { drainRequested });
      claimed = receipt.claimed;
      if (receipt.claimed > 0) post({ type: "progress", ...receipt });
    } catch (error) {
      post({ type: "error", code: "worker_batch_failed", message: error instanceof Error ? error.message : String(error) });
    }
    if (draining || drainRequested()) { finish(); return; }
    schedule(claimed > 0 ? 0 : config.workerPollMs);
  };

  const schedule = (delay: number): void => {
    if (scheduled && delay > 0) return;
    if (timer !== undefined) clearTimeout(timer);
    scheduled = true;
    timer = setTimeout(tick, delay);
  };

  parentPort.on("message", (message: unknown) => {
    const type = message !== null && typeof message === "object" ? (message as { readonly type?: unknown }).type : undefined;
    if (type === "wake") {
      if (!draining) schedule(0);
    } else if (type === "drain") {
      draining = true;
      schedule(0);
    } else {
      post({ type: "error", code: "worker_protocol_invalid", message: "unknown supervisor message" });
    }
  });
  post({ type: "ready", databasePath: identity.absolutePath, workerId });
  schedule(0);
}

start();
