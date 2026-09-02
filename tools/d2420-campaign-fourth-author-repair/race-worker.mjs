import { DatabaseSync } from "node:sqlite";
import { parentPort, workerData } from "node:worker_threads";

const gate = new Int32Array(workerData.gate);
Atomics.wait(gate, 0, 0);
const database = new DatabaseSync(workerData.filename);
database.exec("PRAGMA busy_timeout=5000");
let result;
for (let attempt = 0; attempt < 200; attempt += 1) {
  try {
    database.exec("BEGIN IMMEDIATE");
    database.prepare(`INSERT INTO campaign_runs
      (id, learner_id, campaign_id, campaign_version, campaign_document_digest,
       campaign_document, status, active_encounter_run_id, created_at)
      VALUES (?, 'learner', 'campaign', 1, 'sha256:doc', '{}', 'active', NULL, '2026-09-02')`).run(workerData.runId);
    database.exec("COMMIT");
    result = "committed";
    break;
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch { /* no open transaction */ }
    if (String(error).includes("UNIQUE constraint failed")) { result = "active_exists"; break; }
    if (!String(error).includes("database is locked")) { result = `error:${String(error)}`; break; }
    Atomics.wait(gate, 1, 0, 10);
  }
}
database.close();
parentPort.postMessage(result ?? "error:retry_exhausted");
