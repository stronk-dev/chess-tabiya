import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const authorSource = readFileSync(
  "tools/d2631-review-evidence-second-author-repair/contract.test.mjs",
  "utf8",
);
const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const digest = (value) => createHash("sha256").update(canonical(value)).digest("hex");

function sourceBetween(start, end) {
  const begin = authorSource.indexOf(start);
  const finish = authorSource.indexOf(end, begin);
  assert.ok(begin >= 0 && finish > begin);
  return authorSource.slice(begin, finish);
}

const subjectCode = sourceBetween("const subjectAuthority", 'test("D2633');
const subjectModel = new Function(
  "assert",
  "digest",
  `${subjectCode}; return { subject, packet, render };`,
)(assert, digest);

const foldCode = sourceBetween("const unavailabilityReasons", 'test("D2631');
const folds = new Function(
  "assert",
  `${foldCode}; return { foldReviewFamilyState, foldReviewCompletion };`,
)(assert);

const storeCode = sourceBetween("class ReviewAttemptOutcomeStore", 'test("D2634');
const ReviewAttemptOutcomeStore = new Function(
  "assert",
  `${storeCode}; return ReviewAttemptOutcomeStore;`,
)(assert);

test("D2685 the advertised aggregate packet seal accepts a forged equal wrapper", () => {
  const subject = subjectModel.subject({
    runId: "r", branchId: "b", eventHead: { seq: 8, digest: "h8" }, learnerSide: "white", outcome: "win",
  });
  const packet = subjectModel.packet(subject);
  const forged = Object.freeze({ subject, packetDigest: packet.packetDigest });
  assert.doesNotThrow(() => subjectModel.render(forged, subject));
  assert.notStrictEqual(forged, packet);
});

test("D2686 nested recorded-prefix authority mutates behind the shallow seal", () => {
  const eventHead = { seq: 8, digest: "h8" };
  const fields = { runId: "r", branchId: "b", eventHead, learnerSide: "white", outcome: "win" };
  const subject = subjectModel.subject(fields);
  const packet = subjectModel.packet(subject);
  eventHead.seq = 99;
  assert.notEqual(subject.subjectDigest, digest(fields));
  assert.doesNotThrow(() => subjectModel.render(packet, subject));
});

test("D2687 the family fold cannot detect duplicate or omitted path nodes", () => {
  const duplicated = folds.foldReviewFamilyState([
    { kind: "available", itemCount: 1 },
    { kind: "available", itemCount: 1 },
  ]);
  assert.deepEqual(duplicated, {
    nodeCount: 2,
    availableNodeCount: 2,
    itemCount: 2,
    honestEmptyNodeCount: 0,
    notRequestedNodeCount: 0,
    progress: { notYetScheduledNodeCount: 0, pendingNodeCount: 0, pendingJobCount: 0, retryingJobCount: 0 },
    unavailable: [],
  });
  assert.doesNotMatch(foldCode, /nodeId|pathNodeIds/u);
});

test("D2688 completion calls an empty or partial family record healthy and settled", () => {
  assert.deepEqual(folds.foldReviewCompletion({}), {
    progress: { kind: "settled" },
    degradation: { kind: "healthy" },
  });
  assert.doesNotMatch(foldCode, /ReviewSourceFamily|SOURCE_FAMIL/u);
});

test("D2689 a concurrent reader receives the internal reservation as an outcome", () => {
  const store = new ReviewAttemptOutcomeStore(2);
  assert.deepEqual(store.reserve("same"), { kind: "reserved" });
  assert.deepEqual(store.reserve("same"), {
    kind: "existing",
    value: { kind: "reserved", attempts: 0 },
  });
  assert.doesNotMatch(storeCode, /Promise|waiter|subscriber|singleFlight/u);
});

test("D2690 presentation integration is prose matching, not a sealed round trip", () => {
  const block = sourceBetween('test("D2632', "const subjectAuthority");
  assert.match(block, /assert\.match\(presentation/u);
  assert.doesNotMatch(block, /serializePresentedEvidence\(|parsePresentedEvidence\(|createPresented/u);
});

test("D2691 source-plan set equality is never executed by the author contract", () => {
  const block = sourceBetween('test("D2635', "const unavailabilityReasons");
  assert.match(block, /assert\.match\(rfc/u);
  const executableLines = block.split("\n").filter((line) => (
    !line.includes("assert.match") && !line.includes("assert.equal")
  )).join("\n");
  assert.doesNotMatch(executableLines, /reviewPacketSourcePlan\(|compileReviewEvidence\(|assertReviewEvidencePacket\(/u);
});

test("D2692 the advertised second-author target is red at the live module contract", () => {
  const source = execution.sourceContracts.find((row) => row.id === "review_evidence_packet@1");
  assert.ok(source);
  assert.equal(source.input, null);
  assert.equal(source.operation.callable, "compileReviewEvidence(input)");
  assert.equal(source.assertion, null);
  assert.match(source.seal, /neither a callable input type nor aggregate runtime seal/u);
});
