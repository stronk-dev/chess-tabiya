// Disposable fresh-review reproducer for D2563-D2569. It detects gaps; it is not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  applicationReceipt,
  batchRequestDigest,
  jobRequestDigest,
  rewindState,
} from "../d2542-pack-capability-tenth-author-repair/model.mjs";

const read = (path) => readFileSync(path, "utf8");
// Repointed 2026-09-06: the durable evidence-job model, the operation census and criteria
// 20-30 were cut out of rfc/pack-capability-contract.md byte-for-byte into the successor
// draft; the review narrative moved to review-history.md. This reproducer asserts nothing
// new -- it reads the same bytes in their new homes.
const rfc = read("planning/pack-capability-contract/evidence-job-durability.md") + read("planning/pack-capability-contract/review-history.md");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const protocol = read("tools/d2524-pack-capability-ninth-author-repair/protocol.typecheck.ts");
const tenthTest = read("tools/d2542-pack-capability-tenth-author-repair/contract.test.mjs");
const concurrentWorker = read("tools/d2542-pack-capability-tenth-author-repair/concurrent-worker.mjs");

function jobRequest(runId = "run-a", extra = {}) {
  return {
    schema: "evidence_job_request@1",
    runId,
    nodeId: "node-a",
    fen: "8/8/8/8/8/8/8/K6k w - - 0 1",
    kind: "eval",
    depth: null,
    movetime: 100,
    multiPv: null,
    timeoutMs: null,
    objectiveRequest: null,
    ...extra,
  };
}

test("D2563: the retained running protocol omits its generation-bound receipt", () => {
  const running = protocol.match(/state: "running";([^}]+)\}/u)?.[1] ?? "";
  assert.match(running, /leaseOwner: string/u);
  assert.doesNotMatch(running, /leaseGeneration|jobRequestDigest/u);
});

test("D2564: the retained consumed protocol omits its application receipt", () => {
  const consumed = protocol.match(/state: "consumed";([\s\S]*?)\n    \}>/u)?.[1] ?? "";
  assert.match(consumed, /consumedAt: string/u);
  assert.doesNotMatch(consumed, /applicationReceipt/u);
});

test("D2565: malformed and extra-key requests still receive authoritative digests", () => {
  const valid = jobRequest();
  const extra = jobRequest("run-a", { undeclared: true });
  const wrongSchema = jobRequest("run-a", { schema: "not-evidence-v1" });
  assert.match(jobRequestDigest(extra), /^sha256:[0-9a-f]{64}$/u);
  assert.match(jobRequestDigest(wrongSchema), /^sha256:[0-9a-f]{64}$/u);
  assert.notEqual(jobRequestDigest(valid), jobRequestDigest(extra));
  assert.match(protocol, /jobs: readonly \[unknown, \.\.\.unknown\[\]\]/u);
});

test("D2566: SQL accepts canonical request bytes whose run and origin cross their columns", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a'),('run-b')");
  const crossedJob = jobRequest("run-b");
  const crossedBatch = {
    schema: "evidence_batch_request@1",
    runId: "run-b",
    origin: "story_completion",
    jobs: [crossedJob],
  };
  db.prepare(`INSERT INTO evidence_job_batches
    (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(
      "batch-a", "run-a", "explicit_analysis", "key-a", JSON.stringify(crossedBatch),
      batchRequestDigest(crossedBatch), 1, "2026-09-04T12:00:00Z",
    );
  assert.doesNotThrow(() => db.prepare(`INSERT INTO evidence_jobs
    (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
     job_request_digest,request_json,state,attempt_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      "job-a", "batch-a", 0, "run-a", "node-a", "explicit_analysis", "runtime.analysis",
      "evidence.stockfish_analysis", jobRequestDigest(crossedJob), JSON.stringify(crossedJob),
      "admitted", 0, "2026-09-04T12:00:00Z",
    ));
  db.close();
});

test("D2567: the rewind model cannot represent lease or settlement mutations", () => {
  assert.equal(rewindState("running"), "cancelled");
  assert.equal(typeof rewindState("settled_success"), "string");
  assert.doesNotMatch(rewindState.toString(), /lease|generation|settlement|superseded/u);
});

test("D2568: crossed receipt revisions and unrelated events are accepted", () => {
  const receipt = applicationReceipt({
    jobId: "job-a",
    runId: "run-a",
    nodeId: "node-a",
    fromRevision: 9,
    toRevision: 8,
    events: [{ seq: 7, runId: "run-b", nodeId: "node-z", type: "unrelated.event" }],
  });
  assert.deepEqual([receipt.fromRevision, receipt.toRevision], [9, 8]);
  assert.deepEqual([receipt.firstEventSeq, receipt.lastEventSeq], [7, 7]);
});

test("D2569: the concurrent gate uses fixed ids instead of either UUID constructor", () => {
  assert.match(tenthTest, /launch\("batch-a"\), launch\("batch-b"\)/u);
  assert.doesNotMatch(concurrentWorker, /randomUUID/u);
  assert.match(concurrentWorker, /`job-\$\{workerData\.candidate\}`/u);
});
