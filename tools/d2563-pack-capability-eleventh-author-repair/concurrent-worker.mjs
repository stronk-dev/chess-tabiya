import { randomUUID } from "node:crypto";
import { parentPort, workerData } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";
import { batchRequestDigest, jobRequestDigest, parseEvidenceBatchRequest } from "./model.mjs";

const gate = new Int32Array(workerData.gate);
Atomics.add(gate, 1, 1);
Atomics.notify(gate, 1);
Atomics.wait(gate, 0, 0);

const request = parseEvidenceBatchRequest(JSON.parse(workerData.request));
const digest = batchRequestDigest(request);
const database = new DatabaseSync(workerData.path);
database.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
try {
  const existing = database.prepare(`SELECT id, request_digest FROM evidence_job_batches
    WHERE run_id=? AND origin=? AND idempotency_key=?`).get(request.runId, request.origin, workerData.key);
  if (existing !== undefined) {
    if (existing.request_digest !== digest) throw new Error("IDEMPOTENCY_CONFLICT");
    const jobs = database.prepare("SELECT id FROM evidence_jobs WHERE batch_id=? ORDER BY batch_ordinal").all(existing.id);
    database.exec("COMMIT");
    parentPort.postMessage({ id: existing.id, jobIds: jobs.map((row) => row.id), winner: false, constructedIds: 0 });
  } else {
    const batchId = randomUUID();
    const jobIds = request.jobs.map(() => randomUUID());
    database.prepare(`INSERT INTO evidence_job_batches
      (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(batchId, request.runId, request.origin, workerData.key,
        JSON.stringify(request), digest, request.jobs.length, "2026-09-04T12:00:00Z");
    request.jobs.forEach((job, ordinal) => {
      database.prepare(`INSERT INTO evidence_jobs
        (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
         job_request_digest,request_json,state,attempt_count,admitted_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(jobIds[ordinal], batchId, ordinal, request.runId,
          job.nodeId, request.origin, "runtime.analysis",
          job.kind === "tablebase" ? "evidence.tablebase_probe" : "evidence.stockfish_analysis",
          jobRequestDigest(job), JSON.stringify(job), "admitted", 0, "2026-09-04T12:00:00Z");
    });
    database.exec("COMMIT");
    parentPort.postMessage({ id: batchId, jobIds, winner: true, constructedIds: 1 + jobIds.length });
  }
} catch (error) {
  try { database.exec("ROLLBACK"); } catch { /* retain primary error */ }
  throw error;
} finally {
  database.close();
}
