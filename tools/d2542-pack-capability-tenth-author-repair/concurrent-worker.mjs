import { parentPort, workerData } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";

const gate = new Int32Array(workerData.gate);
Atomics.add(gate, 1, 1);
Atomics.notify(gate, 1);
Atomics.wait(gate, 0, 0);

const database = new DatabaseSync(workerData.path);
database.exec("PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
try {
  const existing = database.prepare(`SELECT id, request_digest FROM evidence_job_batches
    WHERE run_id=? AND origin=? AND idempotency_key=?`).get("run-a", "explicit_analysis", "key-a");
  if (existing !== undefined) {
    if (existing.request_digest !== workerData.digest) throw new Error("IDEMPOTENCY_CONFLICT");
    database.exec("COMMIT");
    parentPort.postMessage({ id: existing.id, winner: false });
  } else {
    database.prepare(`INSERT INTO evidence_job_batches
      (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(workerData.candidate, "run-a", "explicit_analysis", "key-a",
        workerData.request, workerData.digest, 1, "2026-09-02T12:00:00Z");
    database.prepare(`INSERT INTO evidence_jobs
      (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
       job_request_digest,request_json,state,attempt_count,admitted_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(`job-${workerData.candidate}`, workerData.candidate, 0,
        "run-a", "node-a", "explicit_analysis", "runtime.analysis", "evidence.stockfish_analysis",
        workerData.jobDigest, workerData.jobRequest, "admitted", 0, "2026-09-02T12:00:00Z");
    database.exec("COMMIT");
    parentPort.postMessage({ id: workerData.candidate, winner: true });
  }
} catch (error) {
  try { database.exec("ROLLBACK"); } catch { /* retain primary error */ }
  throw error;
} finally {
  database.close();
}
