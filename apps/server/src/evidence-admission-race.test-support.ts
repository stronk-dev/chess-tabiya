// TEST-ONLY worker for the two-connection admission race (rfc/evidence-job-durability.md criterion
// 24). Each thread opens its own SQLite connection to the same file, waits on one shared barrier and
// then calls the one admission operation. Production never imports this module.
import { parentPort, workerData } from "node:worker_threads";

import { SQLiteRunStorage } from "./storage.js";

interface RaceData {
  readonly path: string;
  readonly barrier: SharedArrayBuffer;
  readonly input: { readonly idempotencyKey: string; readonly request: unknown };
}

const data = workerData as RaceData;
const storage = new SQLiteRunStorage(data.path, { onMigration: () => {} });
const flag = new Int32Array(data.barrier);
Atomics.add(flag, 1, 1);
Atomics.wait(flag, 0, 0);
try {
  const batch = storage.admitEvidenceBatch(data.input);
  parentPort?.postMessage({ ok: true, batchId: batch.batchId, jobIds: batch.jobs.map((job) => job.id), constructions: batch.constructions, replayed: batch.replayed });
} catch (error) {
  parentPort?.postMessage({ ok: false, code: (error as { code?: string }).code ?? "UNKNOWN", message: error instanceof Error ? error.message : String(error) });
} finally {
  storage.close();
}
