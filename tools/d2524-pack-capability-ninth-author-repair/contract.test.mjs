// DISPOSABLE ninth author contract. It validates requirements bytes, not production behavior.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/pack-capability-contract.md", "utf8");
const authority = JSON.parse(readFileSync(
  "tools/d2524-pack-capability-ninth-author-repair/admission-authority.json",
  "utf8",
));

function blankState() {
  return { runs: new Map(), batches: new Map(), jobs: new Map() };
}

function transaction(state, operation) {
  const draft = structuredClone(state);
  const value = operation(draft);
  state.runs = draft.runs;
  state.batches = draft.batches;
  state.jobs = draft.jobs;
  return value;
}

function admitBatch(state, input, failAtOrdinal = null) {
  const scope = `${input.runId}\0${input.origin}\0${input.key}`;
  const existing = state.batches.get(scope);
  if (existing !== undefined) {
    if (existing.requestDigest !== input.requestDigest) throw new Error("IDEMPOTENCY_CONFLICT");
    return existing;
  }
  return transaction(state, (draft) => {
    const jobs = input.jobs.map((job, ordinal) => {
      if (ordinal === failAtOrdinal) throw new Error("FAULT");
      const stored = { ...job, id: `persisted-${input.key}-${ordinal}`, ordinal };
      draft.jobs.set(stored.id, stored);
      return stored;
    });
    const batch = { requestDigest: input.requestDigest, jobs };
    draft.batches.set(scope, batch);
    return batch;
  });
}

test("D2524: the settled result preserves proposal value or explicit absence", () => {
  assert.match(rfc, /objectiveProposal: ObjectiveEvidenceProposal \| null/u);
  assert.match(rfc, /settlement_json TEXT/u);
  assert.match(rfc, /same validated settled\s+bytes/u);
});

test("D2525: provider unavailability retains availability without inventing failure", () => {
  assert.match(rfc, /failure\?: ProviderFailureReceipt/u);
  assert.match(rfc, /never synthesizes a failure\s+receipt/u);
  assert.match(rfc, /retry_basis_json/u);
});

test("D2526: move and enrichment admission share one rollback boundary", () => {
  const state = blankState();
  state.runs.set("run-1", { head: "old" });
  assert.throws(() => transaction(state, (draft) => {
    draft.runs.set("run-1", { head: "new" });
    admitBatch(draft, { runId: "run-1", origin: "run_enrichment", key: "run_enrichment@1:node-2", requestDigest: "r1", jobs: [{ nodeId: "node-2" }] }, 0);
  }), /FAULT/u);
  assert.deepEqual(state.runs.get("run-1"), { head: "old" });
  assert.equal(state.jobs.size, 0);
  assert.match(rfc, /commitRunMutationWithEvidence/u);
});

test("D2527: a 1-16 job analysis batch is all-or-none", () => {
  const state = blankState();
  assert.throws(() => admitBatch(state, {
    runId: "run-1", origin: "explicit_analysis", key: "request-1", requestDigest: "batch-a",
    jobs: [{ nodeId: "n1" }, { nodeId: "n2" }, { nodeId: "n3" }],
  }, 1), /FAULT/u);
  assert.equal(state.batches.size, 0);
  assert.equal(state.jobs.size, 0);
  assert.match(rfc, /all 1–16 jobs in one transaction/u);
});

test("D2528: replay returns stored ids and a crossed digest conflicts", () => {
  assert.equal(authority.jobId.constructor, "crypto.randomUUID");
  assert.deepEqual(authority.origins.map((row) => row.origin), [
    "explicit_analysis", "story_completion", "run_enrichment",
  ]);
  assert.deepEqual(authority.runMutationAdmission, {
    minimumBatches: 0,
    maximumBatches: 8,
    grain: "one run_enrichment batch per newly committed eligible node",
  });
  const state = blankState();
  const input = { runId: "run-1", origin: "explicit_analysis", key: "request-1", requestDigest: "batch-a", jobs: [{ nodeId: "n1" }] };
  const first = admitBatch(state, input);
  const replay = admitBatch(state, input);
  assert.equal(replay.jobs[0].id, first.jobs[0].id);
  assert.throws(() => admitBatch(state, { ...input, requestDigest: "batch-b" }), /IDEMPOTENCY_CONFLICT/u);
});

test("D2529: a failed rewind transaction preserves both old run and jobs", () => {
  const state = blankState();
  state.runs.set("run-1", { head: "node-2" });
  state.jobs.set("job-1", { nodeId: "node-2", state: "admitted" });
  assert.throws(() => transaction(state, (draft) => {
    draft.jobs.set("job-1", { nodeId: "node-2", state: "cancelled" });
    throw new Error("SAVE_FAULT");
  }), /SAVE_FAULT/u);
  assert.deepEqual(state.runs.get("run-1"), { head: "node-2" });
  assert.deepEqual(state.jobs.get("job-1"), { nodeId: "node-2", state: "admitted" });
  assert.match(rfc, /commitRewindWithEvidenceCancellation/u);
});
