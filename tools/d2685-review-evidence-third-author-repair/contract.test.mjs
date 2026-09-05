import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const REVIEW_SOURCE_FAMILIES = Object.freeze([
  "engine_eval",
  "engine_wdl",
  "tablebase",
  "semantic",
  "opening",
  "human_model",
  "human_corpus",
  "authored",
  "recorded",
]);

const REVIEW_SOURCE_ADAPTERS = Object.freeze(REVIEW_SOURCE_FAMILIES.map((family) => Object.freeze({
  id: `review.${family}@1`,
  family,
})));

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const digest = (value) => createHash("sha256").update(canonical(value)).digest("hex");

function assertExactKeys(value, keys, label) {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} keys`);
}

function copyAndFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(copyAndFreeze));
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyAndFreeze(item)])));
  }
  return value;
}

function assertDeepFrozen(value) {
  if (value === null || typeof value !== "object") return;
  assert.ok(Object.isFrozen(value));
  for (const item of Object.values(value)) assertDeepFrozen(item);
}

const prefixAuthority = new WeakSet();

function authorizeReviewRecordedPrefix(input) {
  assertExactKeys(
    input,
    ["runId", "branchId", "eventHead", "tipNodeId", "pathNodeIds", "learnerSide", "outcome"],
    "prefix input",
  );
  assertExactKeys(input.eventHead, ["seq", "digest"], "event head");
  assert.ok(Number.isSafeInteger(input.eventHead.seq) && input.eventHead.seq >= 0);
  assert.ok(typeof input.eventHead.digest === "string" && input.eventHead.digest.length > 0);
  assert.ok(Array.isArray(input.pathNodeIds) && input.pathNodeIds.length > 0);
  assert.equal(new Set(input.pathNodeIds).size, input.pathNodeIds.length);
  assert.ok(input.pathNodeIds.every((nodeId) => typeof nodeId === "string" && nodeId.length > 0));
  assert.equal(input.tipNodeId, input.pathNodeIds.at(-1));
  assert.ok(input.learnerSide === "white" || input.learnerSide === "black");

  const fields = copyAndFreeze({
    protocol: "review-recorded-prefix@1",
    ...input,
  });
  const result = copyAndFreeze({ ...fields, subjectDigest: digest(fields) });
  prefixAuthority.add(result);
  return result;
}

function assertReviewRecordedPrefixReceipt(value) {
  assert.ok(prefixAuthority.has(value), "prefix was not issued by its authority");
  assertExactKeys(
    value,
    ["protocol", "runId", "branchId", "eventHead", "tipNodeId", "pathNodeIds", "learnerSide", "outcome", "subjectDigest"],
    "prefix receipt",
  );
  const { subjectDigest, ...fields } = value;
  assert.equal(subjectDigest, digest(fields));
  assertDeepFrozen(value);
  return value;
}

function reviewPacketSourcePlan(subject) {
  assertReviewRecordedPrefixReceipt(subject);
  return Object.freeze(subject.pathNodeIds.flatMap((nodeId) => REVIEW_SOURCE_ADAPTERS.map((adapter) => Object.freeze({
    invocationId: `${adapter.id}\u0000${nodeId}`,
    adapterId: adapter.id,
    family: adapter.family,
    nodeId,
    subjectDigest: subject.subjectDigest,
    subject,
  }))));
}

const sourceResultAuthority = new WeakSet();

function createReviewSourceResult(planRow, state) {
  assertExactKeys(planRow, ["invocationId", "adapterId", "family", "nodeId", "subjectDigest", "subject"], "plan row");
  assertReviewRecordedPrefixReceipt(planRow.subject);
  assert.equal(planRow.subjectDigest, planRow.subject.subjectDigest);
  const adapter = REVIEW_SOURCE_ADAPTERS.find((candidate) => candidate.id === planRow.adapterId);
  assert.ok(adapter && adapter.family === planRow.family);
  assert.ok(state.kind === "available" || state.kind === "honest_empty" || state.kind === "unavailable");
  if (state.kind === "available") {
    assertExactKeys(state, ["kind", "evidenceDigest"], "available source result");
    assert.ok(typeof state.evidenceDigest === "string" && state.evidenceDigest.length > 0);
  }
  if (state.kind === "honest_empty") {
    assertExactKeys(state, ["kind", "reason"], "empty source result");
    assert.ok(state.reason === "no_observation" || state.reason === "outside_domain");
  }
  if (state.kind === "unavailable") {
    assertExactKeys(state, ["kind", "reason"], "unavailable source result");
    assert.ok(state.reason === "provider_off" || state.reason === "provider_failed");
  }
  const result = Object.freeze({ ...planRow, state: copyAndFreeze(state) });
  sourceResultAuthority.add(result);
  return result;
}

function foldReviewFamilyState(pathNodeIds, nodeStates) {
  assert.ok(Array.isArray(pathNodeIds) && pathNodeIds.length > 0);
  assert.equal(new Set(pathNodeIds).size, pathNodeIds.length);
  assert.equal(nodeStates.length, pathNodeIds.length);
  const expected = new Set(pathNodeIds);
  const actual = new Set();
  const aggregate = {
    nodeCount: pathNodeIds.length,
    availableNodeCount: 0,
    itemCount: 0,
    honestEmptyNodeCount: 0,
    notRequestedNodeCount: 0,
    progress: { notYetScheduledNodeCount: 0, pendingNodeCount: 0, pendingJobCount: 0, retryingJobCount: 0 },
    unavailable: [],
  };
  const unavailable = new Map();

  for (const row of nodeStates) {
    assertExactKeys(row, ["nodeId", "state"], "node-family row");
    assert.ok(expected.has(row.nodeId), `foreign node ${row.nodeId}`);
    assert.ok(!actual.has(row.nodeId), `duplicate node ${row.nodeId}`);
    actual.add(row.nodeId);
    const state = row.state;
    if (state.kind === "available") {
      assert.ok(Number.isSafeInteger(state.itemCount) && state.itemCount > 0);
      aggregate.availableNodeCount += 1;
      aggregate.itemCount += state.itemCount;
    } else if (state.kind === "honest_empty") {
      aggregate.honestEmptyNodeCount += 1;
    } else if (state.kind === "not_requested") {
      aggregate.notRequestedNodeCount += 1;
    } else if (state.kind === "not_yet_scheduled") {
      aggregate.progress.notYetScheduledNodeCount += 1;
    } else if (state.kind === "pending") {
      assert.ok(Number.isSafeInteger(state.jobCount) && state.jobCount > 0);
      assert.ok(Number.isSafeInteger(state.retrying) && state.retrying >= 0 && state.retrying <= state.jobCount);
      aggregate.progress.pendingNodeCount += 1;
      aggregate.progress.pendingJobCount += state.jobCount;
      aggregate.progress.retryingJobCount += state.retrying;
    } else if (state.kind === "unavailable") {
      unavailable.set(state.reason, (unavailable.get(state.reason) ?? 0) + 1);
    } else {
      assert.fail(`unknown family state ${state.kind}`);
    }
  }
  assert.deepEqual([...actual].sort(), [...expected].sort());
  aggregate.unavailable = [...unavailable]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([reason, nodeCount]) => ({ reason, nodeCount }));
  return copyAndFreeze(aggregate);
}

function foldReviewCompletion(families) {
  assertExactKeys(families, REVIEW_SOURCE_FAMILIES, "review family record");
  const progressCounts = {
    pendingNodeCount: 0,
    pendingJobCount: 0,
    retryingJobCount: 0,
    notYetScheduledNodeCount: 0,
  };
  const unavailableFamilies = [];
  for (const family of REVIEW_SOURCE_FAMILIES) {
    const value = families[family];
    for (const key of Object.keys(progressCounts)) progressCounts[key] += value.progress[key];
    if (value.unavailable.length > 0) unavailableFamilies.push({ family, reasons: value.unavailable });
  }
  return copyAndFreeze({
    progress: Object.values(progressCounts).every((count) => count === 0)
      ? { kind: "settled" }
      : { kind: "progressive", ...progressCounts },
    degradation: unavailableFamilies.length === 0
      ? { kind: "healthy" }
      : { kind: "degraded", unavailableFamilies },
  });
}

const packetAuthority = new WeakSet();

function createReviewEvidencePacket(fields) {
  assertReviewRecordedPrefixReceipt(fields.subject);
  const retained = Object.freeze({
    subject: fields.subject,
    manifestDigest: fields.manifestDigest,
    nodes: copyAndFreeze(fields.nodes),
    families: copyAndFreeze(fields.families),
  });
  const packet = Object.freeze({ ...retained, packetDigest: digest(retained) });
  packetAuthority.add(packet);
  return packet;
}

function assertReviewEvidencePacket(value) {
  assert.ok(packetAuthority.has(value), "packet was not issued by its authority");
  assertReviewRecordedPrefixReceipt(value.subject);
  const { packetDigest, ...fields } = value;
  assert.equal(packetDigest, digest(fields));
  assertDeepFrozen(value);
  return value;
}

function compileReviewEvidence(input) {
  assertExactKeys(input, ["subject", "sources"], "compiler input");
  const subject = assertReviewRecordedPrefixReceipt(input.subject);
  const plan = reviewPacketSourcePlan(subject);
  assert.equal(input.sources.length, plan.length);
  const expected = new Map(plan.map((row) => [row.invocationId, row]));
  const actual = new Map();
  for (const source of input.sources) {
    assert.ok(sourceResultAuthority.has(source), "source result was not issued by its adapter");
    assert.ok(!actual.has(source.invocationId), `duplicate source ${source.invocationId}`);
    const planned = expected.get(source.invocationId);
    assert.ok(planned, `extra source ${source.invocationId}`);
    for (const key of ["adapterId", "family", "nodeId", "subjectDigest"]) assert.equal(source[key], planned[key]);
    assert.strictEqual(source.subject, subject, "source result belongs to another prefix authority");
    actual.set(source.invocationId, source);
  }
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());

  const nodes = subject.pathNodeIds.map((nodeId) => {
    const families = Object.fromEntries(REVIEW_SOURCE_FAMILIES.map((family) => {
      const source = [...actual.values()].find((row) => row.nodeId === nodeId && row.family === family);
      assert.ok(source);
      const state = source.state.kind === "available"
        ? { kind: "available", itemCount: 1 }
        : source.state;
      return [family, state];
    }));
    return copyAndFreeze({ nodeId, families });
  });
  const families = Object.fromEntries(REVIEW_SOURCE_FAMILIES.map((family) => [family, foldReviewFamilyState(
    subject.pathNodeIds,
    nodes.map((node) => ({ nodeId: node.nodeId, state: node.families[family] })),
  )]));
  foldReviewCompletion(families);
  return createReviewEvidencePacket({
    subject,
    manifestDigest: digest(REVIEW_SOURCE_ADAPTERS),
    nodes,
    families,
  });
}

class ReviewAttemptOutcomeStore {
  #entries = new Map();

  constructor(maxOutcomes) {
    assert.ok(Number.isSafeInteger(maxOutcomes) && maxOutcomes > 0);
    this.maxOutcomes = maxOutcomes;
  }

  acquire(key) {
    const existing = this.#entries.get(key);
    if (existing) {
      if (existing.kind === "pending") return Object.freeze({ kind: "subscriber", completion: existing.completion });
      return Object.freeze({ kind: "existing", completion: Promise.resolve(existing.outcome) });
    }
    if (this.#entries.size >= this.maxOutcomes) {
      return Object.freeze({ kind: "capacity", completion: Promise.resolve(Object.freeze({ kind: "attempt_history_capacity" })) });
    }
    let settlePromise;
    const completion = new Promise((resolve) => { settlePromise = resolve; });
    const entry = { kind: "pending", completion };
    this.#entries.set(key, entry);
    const settle = (outcome) => {
      assert.strictEqual(this.#entries.get(key), entry, "reservation already settled");
      const sealed = copyAndFreeze(outcome);
      this.#entries.set(key, { kind: "terminal", outcome: sealed });
      settlePromise(sealed);
    };
    return Object.freeze({ kind: "owner", completion, settle });
  }
}

const presentedAuthority = new WeakSet();
const parsedPresentationAuthority = new WeakSet();
const parsedStoryAuthority = new WeakSet();
const PRESENTATION_TUPLE = Object.freeze({
  adapterId: "review.fact_statement@1",
  projection: "derived.review.eval_point@1",
  consumer: "review.story@1",
  component: "fact_statement",
});

function createPresentedEvidence(packet, nodeId) {
  assertReviewEvidencePacket(packet);
  assert.ok(packet.subject.pathNodeIds.includes(nodeId));
  const fields = copyAndFreeze({
    ...PRESENTATION_TUPLE,
    operand: { nodeId, subjectDigest: packet.subject.subjectDigest },
    evidenceDigest: digest({ packetDigest: packet.packetDigest, nodeId }),
  });
  presentedAuthority.add(fields);
  return fields;
}

function serializePresentedEvidence(item) {
  assert.ok(presentedAuthority.has(item), "component was not issued by its adapter");
  const fields = copyAndFreeze({ schemaVersion: 1, ...item });
  return copyAndFreeze({ ...fields, receiptDigest: digest(fields) });
}

function parsePresentationReceipt(value) {
  assertExactKeys(
    value,
    ["schemaVersion", "adapterId", "projection", "consumer", "component", "operand", "evidenceDigest", "receiptDigest"],
    "presentation receipt",
  );
  for (const [key, expected] of Object.entries(PRESENTATION_TUPLE)) assert.equal(value[key], expected);
  assertExactKeys(value.operand, ["nodeId", "subjectDigest"], "presentation operand");
  const { receiptDigest, ...fields } = value;
  assert.equal(receiptDigest, digest(fields));
  const parsed = copyAndFreeze(value);
  parsedPresentationAuthority.add(parsed);
  return parsed;
}

function renderReviewStoryReceipt(packet) {
  assertReviewEvidencePacket(packet);
  const moments = packet.nodes.map((node) => ({
    nodeId: node.nodeId,
    presentation: serializePresentedEvidence(createPresentedEvidence(packet, node.nodeId)),
  }));
  const fields = copyAndFreeze({
    protocol: "review-story@1",
    subjectDigest: packet.subject.subjectDigest,
    packetDigest: packet.packetDigest,
    moments,
  });
  return copyAndFreeze({ ...fields, storyDigest: digest(fields) });
}

function parseReviewStoryReceipt(value) {
  assertExactKeys(value, ["protocol", "subjectDigest", "packetDigest", "moments", "storyDigest"], "story receipt");
  assert.equal(value.protocol, "review-story@1");
  const { storyDigest, ...fields } = value;
  assert.equal(storyDigest, digest(fields));
  const nodeIds = new Set();
  for (const moment of value.moments) {
    assertExactKeys(moment, ["nodeId", "presentation"], "story moment");
    assert.ok(!nodeIds.has(moment.nodeId));
    nodeIds.add(moment.nodeId);
    const parsed = parsePresentationReceipt(moment.presentation);
    assert.equal(parsed.operand.nodeId, moment.nodeId);
    assert.equal(parsed.operand.subjectDigest, value.subjectDigest);
  }
  const parsed = copyAndFreeze(value);
  parsedStoryAuthority.add(parsed);
  return parsed;
}

function projectPublicReviewStory(story) {
  assert.ok(parsedStoryAuthority.has(story), "story must cross the client parser first");
  return copyAndFreeze({
    protocol: "public-review-story@1",
    moments: story.moments.map(({ nodeId, presentation }) => ({ nodeId, presentation })),
  });
}

function fixtureSubject() {
  return authorizeReviewRecordedPrefix({
    runId: "run-1",
    branchId: "branch-1",
    eventHead: { seq: 4, digest: "event-4" },
    tipNodeId: "n2",
    pathNodeIds: ["n1", "n2"],
    learnerSide: "white",
    outcome: { kind: "unfinished" },
  });
}

function fixtureSources(subject) {
  return reviewPacketSourcePlan(subject).map((row) => createReviewSourceResult(
    row,
    row.family === "engine_eval"
      ? { kind: "available", evidenceDigest: digest(row) }
      : { kind: "honest_empty", reason: "no_observation" },
  ));
}

test("D2685/D2686 exact deep prefix and aggregate authorities reject equal rebuilds", () => {
  const mutableHead = { seq: 4, digest: "event-4" };
  const input = {
    runId: "run-1", branchId: "branch-1", eventHead: mutableHead,
    tipNodeId: "n2", pathNodeIds: ["n1", "n2"], learnerSide: "white", outcome: { kind: "unfinished" },
  };
  const subject = authorizeReviewRecordedPrefix(input);
  mutableHead.seq = 99;
  input.pathNodeIds[0] = "crossed";
  assert.equal(subject.eventHead.seq, 4);
  assert.deepEqual(subject.pathNodeIds, ["n1", "n2"]);
  assertReviewRecordedPrefixReceipt(subject);
  const packet = compileReviewEvidence({ subject, sources: fixtureSources(subject) });
  assertReviewEvidencePacket(packet);
  assert.throws(() => assertReviewRecordedPrefixReceipt({ ...subject }));
  assert.throws(() => assertReviewEvidencePacket({ ...packet }));
  assert.throws(() => assertReviewEvidencePacket(JSON.parse(JSON.stringify(packet))));
});

test("D2687/D2688 folds exact path and closed family populations", () => {
  const path = ["n1", "n2"];
  const rows = [
    { nodeId: "n1", state: { kind: "available", itemCount: 1 } },
    { nodeId: "n2", state: { kind: "unavailable", reason: "provider_failed" } },
  ];
  assert.deepEqual(foldReviewFamilyState(path, rows), foldReviewFamilyState(path, [...rows].reverse()));
  assert.throws(() => foldReviewFamilyState(path, [rows[0], rows[0]]), /duplicate node/u);
  assert.throws(() => foldReviewFamilyState(path, [rows[0]]));
  assert.throws(() => foldReviewFamilyState(path, [rows[0], { ...rows[1], nodeId: "foreign" }]), /foreign node/u);
  const complete = Object.fromEntries(REVIEW_SOURCE_FAMILIES.map((family) => [family, foldReviewFamilyState(path, rows)]));
  assert.equal(foldReviewCompletion(complete).degradation.kind, "degraded");
  assert.throws(() => foldReviewCompletion({}));
  const { recorded: _removed, ...partial } = complete;
  assert.throws(() => foldReviewCompletion(partial));
});

test("D2689 concurrent callers receive one coalesced terminal outcome", async () => {
  const store = new ReviewAttemptOutcomeStore(1);
  const owner = store.acquire("request-1");
  const subscriber = store.acquire("request-1");
  assert.equal(owner.kind, "owner");
  assert.equal(subscriber.kind, "subscriber");
  assert.strictEqual(owner.completion, subscriber.completion);
  owner.settle({ kind: "retry_exhausted", attempts: 2 });
  assert.deepEqual(await owner.completion, { kind: "retry_exhausted", attempts: 2 });
  assert.deepEqual(await subscriber.completion, { kind: "retry_exhausted", attempts: 2 });
  const retained = store.acquire("request-1");
  assert.equal(retained.kind, "existing");
  assert.deepEqual(await retained.completion, { kind: "retry_exhausted", attempts: 2 });
  assert.equal(store.acquire("request-2").kind, "capacity");
});

test("D2690 sealed presentation executes component to wire to parser to public projection", () => {
  const subject = fixtureSubject();
  const packet = compileReviewEvidence({ subject, sources: fixtureSources(subject) });
  const wire = renderReviewStoryReceipt(packet);
  const parsed = parseReviewStoryReceipt(JSON.parse(JSON.stringify(wire)));
  const projected = projectPublicReviewStory(parsed);
  assert.equal(projected.moments.length, 2);
  assert.throws(() => serializePresentedEvidence({ ...createPresentedEvidence(packet, "n1") }));
  assert.throws(() => parsePresentationReceipt({ ...wire.moments[0].presentation, extra: true }));
  assert.throws(() => parsePresentationReceipt({ ...wire.moments[0].presentation, component: "magnitude" }));
  const crossed = structuredClone(wire);
  crossed.moments[0].presentation = wire.moments[1].presentation;
  crossed.storyDigest = digest({
    protocol: crossed.protocol,
    subjectDigest: crossed.subjectDigest,
    packetDigest: crossed.packetDigest,
    moments: crossed.moments,
  });
  assert.throws(() => parseReviewStoryReceipt(crossed));
  assert.throws(() => projectPublicReviewStory(wire));
});

test("D2691 source-plan/compiler/assertion execute exact set equality", () => {
  const subject = fixtureSubject();
  const sources = fixtureSources(subject);
  const packet = compileReviewEvidence({ subject, sources: [...sources].reverse() });
  assertReviewEvidencePacket(packet);
  assert.throws(() => compileReviewEvidence({ subject, sources: sources.slice(1) }));
  assert.throws(() => compileReviewEvidence({ subject, sources: [...sources, sources[0]] }));
  const other = fixtureSubject();
  const crossed = fixtureSources(other);
  assert.throws(() => compileReviewEvidence({ subject, sources: crossed }));
  const plan = reviewPacketSourcePlan(subject);
  const wrongNode = createReviewSourceResult({ ...plan[0], nodeId: "foreign" }, { kind: "honest_empty", reason: "no_observation" });
  assert.throws(() => compileReviewEvidence({ subject, sources: [wrongNode, ...sources.slice(1)] }));
});

test("D2692 live execution image and ordinary verification retain the repaired ABI", () => {
  const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));
  const source = execution.sourceContracts.find((row) => row.id === "review_evidence_packet@1");
  assert.ok(source);
  assert.equal(source.input, "ReviewEvidenceInput");
  assert.equal(source.operation.callable, "compileReviewEvidence(input)");
  assert.equal(source.assertion.callable, "assertReviewEvidencePacket(value)");
  assert.equal(source.assertion.appliesTo, "ReviewEvidencePacket");
  assert.match(source.seal, /private aggregate authority/u);
  const makefile = readFileSync("Makefile", "utf8");
  const verifyLine = makefile.split("\n").find((line) => line.startsWith("verify-governance:"));
  assert.match(verifyLine, /review-evidence-third-author-repair/u);
});
