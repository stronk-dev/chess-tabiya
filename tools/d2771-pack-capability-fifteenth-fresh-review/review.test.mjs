import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  batchRequestDigest,
  jobRequestDigest,
  parseEvidenceBatchRequest,
  parseRunSnapshot,
} from "../d2587-pack-capability-twelfth-author-repair/model.mjs";
import {
  acquireRunLease,
  applyStoredEvidenceAndConsumeJob,
  loadJobLease,
  settleEvidenceJob,
} from "../d2742-pack-capability-fourteenth-author-repair/model.mjs";

const rfc = readFileSync("rfc/pack-capability-contract.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n### §6\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

function objectiveRequest() {
  return {
    runId: "run-a",
    packId: "pack-a",
    packDigest: "sha256:pack",
    nodeId: "node-a",
    fen,
    objectiveState: "active",
    evidenceRefs: [],
    policyConfig: {
      seedMode: "fixed",
      locus: {
        executedAt: "server",
        engineIds: [{ id: "stockfish", version: "18" }],
        modelIds: [],
      },
    },
  };
}

function request(objective = null) {
  return {
    schema: "evidence_job_request@1",
    runId: "run-a",
    nodeId: "node-a",
    fen,
    kind: "eval",
    depth: 12,
    movetime: null,
    multiPv: null,
    timeoutMs: null,
    objectiveRequest: objective,
  };
}

function success(lease, objectiveProposal = null) {
  return {
    kind: "success",
    payload: {
      kind: "eval",
      source: "engine_validated",
      values: { cp: 10 },
    },
    objectiveProposal,
    acquisition: {
      operation: "stockfish.position_evaluation@1",
      provider: "stockfish",
      endpoint: "uci:stockfish",
      requestedIdentity: { id: "stockfish", version: "18" },
      actualIdentity: { id: "stockfish", version: "18" },
      generation: lease.generation,
      requestedAt: "2026-09-05T20:00:00.000Z",
      retrievedAt: "2026-09-05T20:00:01.000Z",
      normalizedRequestDigest: lease.requestDigest,
      responseDigest: `sha256:${"b".repeat(64)}`,
    },
  };
}

function database({ objective = false } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("CREATE TABLE evidence_run_images (run_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,run_json TEXT NOT NULL) STRICT;");
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  const run = parseRunSnapshot({
    runId: "run-a",
    revision: 4,
    feedbackPolicy: "attempt_end",
    nodes: [{ id: "node-a", fen }],
    events: [],
  });
  db.prepare("INSERT INTO evidence_run_images(run_id,revision,run_json) VALUES (?,?,?)")
    .run("run-a", 4, JSON.stringify(run));
  const batch = parseEvidenceBatchRequest({
    schema: "evidence_batch_request@1",
    runId: "run-a",
    origin: "explicit_analysis",
    jobs: [request(objective ? objectiveRequest() : null)],
  });
  const job = batch.jobs[0];
  db.prepare("INSERT INTO evidence_job_batches (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at) VALUES (?,?,?,?,?,?,?,?)")
    .run("batch-a", "run-a", "explicit_analysis", "key", JSON.stringify(batch), batchRequestDigest(batch), 1, "2026-09-05T19:59:00.000Z");
  db.prepare("INSERT INTO evidence_jobs (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,job_request_digest,request_json,state,attempt_count,admitted_at,lease_owner,lease_expires_at,lease_generation) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run("job-a", "batch-a", 0, "run-a", "node-a", "explicit_analysis", "runtime.analysis", "evidence.stockfish_analysis", jobRequestDigest(job), JSON.stringify(job), "running", 1, "2026-09-05T19:59:00.000Z", "worker-a", "2026-09-05T20:30:00.000Z", 7);
  return db;
}

function consume(db, settlement = undefined) {
  const jobLease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  settleEvidenceJob(db, { lease: jobLease, settlement: settlement ?? success(jobLease) });
  return applyStoredEvidenceAndConsumeJob(db, {
    runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }),
    jobId: "job-a",
  });
}

test("D2771/D2775 consumed replay accepts an impossible partial durable row", () => {
  const db = database();
  consume(db);
  db.prepare("UPDATE evidence_jobs SET result_seq=NULL,settled_at=NULL,consumed_at=NULL,lease_owner='resurrected',lease_expires_at='2099-01-01T00:00:00.000Z' WHERE id='job-a'").run();
  const replay = applyStoredEvidenceAndConsumeJob(db, {
    runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }),
    jobId: "job-a",
  });
  assert.equal(replay.replay, true);
  db.close();
});

test("D2772 an expired durable lease still settles", () => {
  const db = database();
  db.prepare("UPDATE evidence_jobs SET lease_expires_at='2000-01-01T00:00:00.000Z' WHERE id='job-a'").run();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  assert.equal(settleEvidenceJob(db, { lease, settlement: success(lease) }), 1);
  db.close();
});

test("D2773 arbitrary values and crossed provider identity settle as evidence", () => {
  const db = database();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const forged = success(lease);
  forged.payload.values = { invented: "chess truth" };
  forged.acquisition.endpoint = "https://attacker.invalid/evidence";
  forged.acquisition.actualIdentity = { id: "attacker", version: "999" };
  forged.acquisition.responseDigest = `sha256:${"f".repeat(64)}`;
  assert.equal(settleEvidenceJob(db, { lease, settlement: forged }), 1);
  assert.match(db.prepare("SELECT settlement_json FROM evidence_jobs WHERE id='job-a'").get().settlement_json, /invented/u);
  db.close();
});

test("D2774 objective application crosses state and admits unrelated evidence refs", () => {
  const db = database({ objective: true });
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const forged = success(lease, {
    nodeId: "node-a",
    from: "failed",
    to: "achieved",
    evidenceRefs: ["engine:job-a", "attacker:claim"],
  });
  settleEvidenceJob(db, { lease, settlement: forged });
  const applied = applyStoredEvidenceAndConsumeJob(db, {
    runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }),
    jobId: "job-a",
  });
  const event = applied.afterRun.events.find((candidate) => candidate.type === "objective.state_changed");
  assert.equal(event.data.from, "failed");
  assert.deepEqual(event.data.evidenceRefs, ["engine:job-a", "attacker:claim"]);
  db.close();
});

test("D2776 coordinated run-image and receipt rewrite passes replay", () => {
  const db = database();
  consume(db);
  const image = db.prepare("SELECT run_json FROM evidence_run_images WHERE run_id='run-a'").get();
  const run = JSON.parse(image.run_json);
  run.revision = 900;
  const job = db.prepare("SELECT application_receipt_json FROM evidence_jobs WHERE id='job-a'").get();
  const receipt = JSON.parse(job.application_receipt_json);
  receipt.fromRevision = 899;
  receipt.toRevision = 900;
  db.prepare("UPDATE evidence_run_images SET revision=900,run_json=? WHERE run_id='run-a'").run(JSON.stringify(run));
  db.prepare("UPDATE evidence_jobs SET application_receipt_json=? WHERE id='job-a'").run(JSON.stringify(receipt));
  const replay = applyStoredEvidenceAndConsumeJob(db, {
    runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }),
    jobId: "job-a",
  });
  assert.equal(replay.replay, true);
  assert.equal(replay.receipt.fromRevision, 899);
  db.close();
});

test("D2777 settlement and consumption persist the literal word now", () => {
  const db = database();
  consume(db);
  const row = db.prepare("SELECT settled_at,consumed_at FROM evidence_jobs WHERE id='job-a'").get();
  assert.equal(row.settled_at, "now");
  assert.equal(row.consumed_at, "now");
  db.close();
});
