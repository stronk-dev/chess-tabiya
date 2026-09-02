// DISPOSABLE fresh-review falsifier. It tests the returned author contract, not production behavior.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const queue = read("apps/server/src/evidence-queue.ts");
const service = read("apps/server/src/service.ts");
const runtime = read("packages/runtime/src/runtime.ts");
const provider = read("rfc/provider-health-degradation.md");
const rfc = read("rfc/pack-capability-contract.md");

function slice(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker: ${end}`);
  return source.slice(from, to);
}

const durableSection = slice(
  rfc,
  "#### §5.2 Queued evidence is admission plus durable settlement",
  "### §6. The migration planner",
);

test("D2524: the durable row omits a production staged-result field", () => {
  assert.match(queue, /readonly objectiveProposal\?: ObjectiveEvidenceProposal/u);
  assert.match(queue, /objectiveProposal = await this\.#upgrader\.evaluate/u);
  assert.match(service, /staged\.objectiveProposal === undefined/u);
  assert.doesNotMatch(durableSection, /objective_proposal_json|objectiveProposal/u);
});

test("D2525: provider unavailable without a fresh failure cannot inhabit F3 settlement", () => {
  const providerResult = slice(
    provider,
    "type ProviderOperationResult<",
    "The receipt describes acquisition",
  );
  assert.match(providerResult, /readonly failure\?: ProviderFailureReceipt/u);
  assert.match(durableSection, /`settled_unavailable` requires a provider\s+failure/u);
  assert.match(durableSection, /`retry_wait` requires failure plus `next_attempt_at`/u);
  assert.doesNotMatch(durableSection, /availability_json|availability_snapshot|cached_exact_only/u);
});

test("D2526: automatic enrichment admission follows the committed run write", () => {
  const firstMove = slice(service, "  move(\n", "  opponentPly(\n");
  const secondMove = slice(service, "  opponentPly(\n", "  rewind(\n");
  for (const operation of [firstMove, secondMove]) {
    const save = operation.indexOf("this.#storage.save(");
    const enqueue = operation.indexOf("this.#enqueueMoveEvidence(");
    assert.ok(save >= 0 && enqueue > save, "run commit must precede the current enqueue call");
  }
  assert.doesNotMatch(durableSection, /outbox|same transaction as the run (?:event|mutation)|reconciliation scan/u);
});

test("D2527: one HTTP analysis request is a non-atomic 1-16 job loop", () => {
  const analysis = slice(service, "  analysis(\n", "  recordPrediction(\n");
  assert.match(analysis, /input\.nodeIds\.length < 1 \|\| input\.nodeIds\.length > 16/u);
  assert.match(analysis, /input\.nodeIds\.map\(\(nodeId\) => this\.enqueueEvidence/u);
  assert.match(durableSection, /A configured capability inserts `admitted`/u);
  assert.doesNotMatch(durableSection, /analysis batch|batch_id|all 1–16|all 1-16/u);
});

test("D2528: request digest is not a durable dedupe identity", () => {
  const ddl = slice(durableSection, "CREATE TABLE evidence_jobs", ") STRICT;");
  assert.match(ddl, /request_digest TEXT NOT NULL/u);
  assert.match(ddl, /id TEXT PRIMARY KEY/u);
  assert.match(ddl, /UNIQUE \(run_id, result_seq\)/u);
  assert.doesNotMatch(ddl, /idempotency|batch_id|UNIQUE \([^\n]*request_digest/u);
  assert.match(queue, /id: `evidence-job-\$\{\+\+this\.#jobCounter\}`/u);
});

test("D2529: rewind cancels jobs before the run save can commit", () => {
  const rewindRuntime = slice(runtime, "export function rewind(\n", "export function rewindToCheckpoint(");
  const rewindService = slice(service, "  rewind(\n", "  fork(\n");
  assert.ok(
    rewindRuntime.indexOf("jobObserver?.onRewound(") > rewindRuntime.indexOf("const next = appendEvents("),
  );
  assert.ok(rewindService.indexOf("rewind(") < rewindService.indexOf("this.#storage.save("));
  assert.doesNotMatch(durableSection, /rewind event and (?:matching )?job cancellations? in one transaction/u);
});
