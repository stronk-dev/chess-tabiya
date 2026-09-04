import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/review-evidence-compiler.md", "utf8");
const presentation = readFileSync("rfc/evidence-presentation.md", "utf8");
const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const digest = (value) => createHash("sha256").update(canonical(value)).digest("hex");

test("D2635 publishes one callable input and aggregate packet authority", () => {
  const source = execution.sourceContracts.find((row) => row.id === "review_evidence_packet@1");
  assert.ok(source);
  assert.equal(source.input, "ReviewEvidenceInput");
  assert.equal(source.operation.callable, "compileReviewEvidence(input)");
  assert.equal(source.assertion.callable, "assertReviewEvidencePacket(value)");
  assert.match(source.seal, /createReviewEvidencePacket/u);
  assert.match(rfc, /interface ReviewEvidenceInput \{/u);
  assert.match(rfc, /type ReviewPacketDeclaredEvidence = \{/u);
  assert.match(rfc, /private-sealed exact\s+adapter output/u);
  assert.match(rfc, /createReviewEvidencePacket/u);
  assert.match(rfc, /assertReviewEvidencePacket\(value\)/u);
  assert.match(rfc, /reviewPacketSourcePlan\(subject\)/u);
  assert.match(rfc, /sources` must be set-equal to that plan/u);
  assert.doesNotMatch(rfc, /items: readonly DeclaredEvidence<unknown>\[\]/u);
});

const unavailabilityReasons = [
  "provider_failed",
  "retry_exhausted",
  "attempt_history_capacity",
];

function foldReviewFamilyState(states) {
  const result = {
    nodeCount: states.length,
    availableNodeCount: 0,
    itemCount: 0,
    honestEmptyNodeCount: 0,
    notRequestedNodeCount: 0,
    progress: { notYetScheduledNodeCount: 0, pendingNodeCount: 0, pendingJobCount: 0, retryingJobCount: 0 },
    unavailable: [],
  };
  const unavailable = new Map();
  for (const state of states) {
    if (state.kind === "available") {
      assert.ok(Number.isSafeInteger(state.itemCount) && state.itemCount > 0);
      result.availableNodeCount += 1;
      result.itemCount += state.itemCount;
    } else if (state.kind === "honest_empty") result.honestEmptyNodeCount += 1;
    else if (state.kind === "not_requested") result.notRequestedNodeCount += 1;
    else if (state.kind === "not_yet_scheduled") {
      result.progress.notYetScheduledNodeCount += 1;
    } else if (state.kind === "pending") {
      assert.ok(Number.isSafeInteger(state.jobCount) && state.jobCount > 0);
      assert.ok(Number.isSafeInteger(state.retrying) && state.retrying >= 0 && state.retrying <= state.jobCount);
      result.progress.pendingNodeCount += 1;
      result.progress.pendingJobCount += state.jobCount;
      result.progress.retryingJobCount += state.retrying;
    } else if (state.kind === "unavailable") {
      assert.ok(unavailabilityReasons.includes(state.reason));
      unavailable.set(state.reason, (unavailable.get(state.reason) ?? 0) + 1);
    } else assert.fail(`unknown state ${state.kind}`);
  }
  result.unavailable = [...unavailable].sort(([left], [right]) => left.localeCompare(right))
    .map(([reason, nodeCount]) => ({ reason, nodeCount }));
  return Object.freeze(result);
}

function foldReviewCompletion(families) {
  const progress = Object.values(families).reduce((sum, family) => ({
    pendingNodeCount: sum.pendingNodeCount + family.progress.pendingNodeCount,
    pendingJobCount: sum.pendingJobCount + family.progress.pendingJobCount,
    retryingJobCount: sum.retryingJobCount + family.progress.retryingJobCount,
    notYetScheduledNodeCount: sum.notYetScheduledNodeCount + family.progress.notYetScheduledNodeCount,
  }), { pendingNodeCount: 0, pendingJobCount: 0, retryingJobCount: 0, notYetScheduledNodeCount: 0 });
  const unavailableFamilies = Object.entries(families)
    .filter(([, family]) => family.unavailable.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([family, value]) => ({ family, reasons: value.unavailable }));
  return Object.freeze({
    progress: Object.values(progress).every((value) => value === 0) ? { kind: "settled" } : { kind: "progressive", ...progress },
    degradation: unavailableFamilies.length === 0 ? { kind: "healthy" } : { kind: "degraded", unavailableFamilies },
  });
}

test("D2631 mixed progress and degradation survive one total order-independent fold", () => {
  const states = [
    { kind: "available", itemCount: 2 },
    { kind: "not_yet_scheduled" },
    { kind: "pending", jobCount: 2, retrying: 1 },
    { kind: "unavailable", reason: "provider_failed" },
  ];
  const forward = foldReviewFamilyState(states);
  const reverse = foldReviewFamilyState([...states].reverse());
  assert.deepEqual(forward, reverse);
  assert.deepEqual(foldReviewCompletion({ engine_eval: forward }), {
    progress: { kind: "progressive", pendingNodeCount: 1, pendingJobCount: 2, retryingJobCount: 1, notYetScheduledNodeCount: 1 },
    degradation: { kind: "degraded", unavailableFamilies: [{ family: "engine_eval", reasons: [{ reason: "provider_failed", nodeCount: 1 }] }] },
  });
  assert.throws(() => foldReviewFamilyState([{ kind: "available", itemCount: 0 }]));
  assert.throws(() => foldReviewFamilyState([{ kind: "pending", jobCount: 1, retrying: 2 }]));
  assert.match(rfc, /foldReviewFamilyState\(nodes\)/u);
  assert.match(rfc, /progressive and degraded at the same time/u);
});

test("D2632 Review terminates in the sealed presentation authority, not raw prose arrays", () => {
  assert.match(presentation, /PresentedEvidenceItem/u);
  assert.match(presentation, /serializePresentedEvidence/u);
  assert.match(rfc, /evidence-presentation\.md/u);
  assert.match(rfc, /components: readonly PresentedEvidenceItem\[\]/u);
  assert.match(rfc, /presentation: PresentationReceipt/u);
  assert.match(rfc, /title: PresentationReceipt/u);
  assert.doesNotMatch(rfc, /readonly sentences: readonly string\[\]/u);
  assert.doesNotMatch(rfc, /readonly sourceLabels: readonly string\[\]/u);
  assert.match(rfc, /projectPublicReviewStory\(receipt\)/u);
});

const subjectAuthority = new WeakSet();
function subject(fields) {
  const value = Object.freeze({ ...fields, subjectDigest: digest(fields) });
  subjectAuthority.add(value);
  return value;
}
function packet(boundSubject) {
  assert.ok(subjectAuthority.has(boundSubject));
  const value = Object.freeze({ subject: boundSubject, packetDigest: digest({ subjectDigest: boundSubject.subjectDigest }) });
  return value;
}
function render(boundPacket, expectedSubject) {
  assert.strictEqual(boundPacket.subject, expectedSubject);
  assert.equal(boundPacket.packetDigest, digest({ subjectDigest: expectedSubject.subjectDigest }));
}

test("D2633 packet and renderer share one sealed recorded-prefix subject", () => {
  const first = subject({ runId: "r", branchId: "b", eventHead: { seq: 8, digest: "h8" }, learnerSide: "white", outcome: "win" });
  const changedHead = subject({ runId: "r", branchId: "b", eventHead: { seq: 9, digest: "h9" }, learnerSide: "white", outcome: "win" });
  const changedSide = subject({ runId: "r", branchId: "b", eventHead: { seq: 8, digest: "h8" }, learnerSide: "black", outcome: "win" });
  const value = packet(first);
  render(value, first);
  assert.throws(() => render(value, changedHead));
  assert.throws(() => render(value, changedSide));
  assert.match(rfc, /authorizeReviewRecordedPrefix\(input: ReviewPrefixAuthorizationInput\)/u);
  assert.match(rfc, /renderReviewStoryReceipt\(packet\)/u);
  assert.doesNotMatch(rfc, /renderReviewStoryReceipt\(packet, context\)/u);
});

class ReviewAttemptOutcomeStore {
  #values = new Map();
  constructor(maxTerminalAttemptOutcomes) {
    assert.ok(Number.isSafeInteger(maxTerminalAttemptOutcomes) && maxTerminalAttemptOutcomes > 0);
    this.max = maxTerminalAttemptOutcomes;
  }
  get size() { return this.#values.size; }
  get(key) { return this.#values.get(key); }
  reserve(key) {
    if (this.#values.has(key)) return { kind: "existing", value: this.#values.get(key) };
    if (this.#values.size === this.max) return Object.freeze({ kind: "attempt_history_capacity" });
    this.#values.set(key, Object.freeze({ kind: "reserved", attempts: 0 }));
    return Object.freeze({ kind: "reserved" });
  }
  resolve(key, value) {
    assert.equal(this.#values.get(key)?.kind, "reserved");
    this.#values.set(key, Object.freeze(value));
    return this.#values.get(key);
  }
}

test("D2634 branch LRU churn cannot forget exhaustion and terminal memory stays bounded", () => {
  const store = new ReviewAttemptOutcomeStore(2);
  let providerCalls = 0;
  const ensure = (key) => {
    const retained = store.get(key);
    if (retained !== undefined) return retained;
    const reservation = store.reserve(key);
    if (reservation.kind === "attempt_history_capacity") return reservation;
    providerCalls += 1;
    return store.resolve(key, { kind: "retry_exhausted", attempts: 2 });
  };
  assert.equal(ensure("request-a").kind, "retry_exhausted");
  const coordinators = new Map();
  for (let branch = 0; branch < 8; branch += 1) {
    coordinators.set(`branch-${branch}`, true);
    if (coordinators.size > 2) coordinators.delete(coordinators.keys().next().value);
  }
  assert.equal(ensure("request-a").kind, "retry_exhausted");
  assert.equal(providerCalls, 1);
  assert.equal(ensure("request-b").kind, "retry_exhausted");
  assert.equal(ensure("request-c").kind, "attempt_history_capacity");
  assert.equal(providerCalls, 2);
  assert.equal(store.size, 2);
  const restarted = new ReviewAttemptOutcomeStore(2);
  assert.equal(restarted.get("request-a"), undefined);
  assert.match(rfc, /class|ReviewAttemptOutcomeStore/u);
  assert.match(rfc, /does\s+not evict or expire individual terminal entries/u);
  assert.match(rfc, /reserve\(requestKey\)[\s\S]*before/u);
  assert.match(rfc, /attempt_history_capacity/u);
});
