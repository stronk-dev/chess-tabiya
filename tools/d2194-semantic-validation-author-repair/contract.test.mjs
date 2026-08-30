// DISPOSABLE positive author contract for D2194-D2197. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/semantic-validation-authority.md");
const valueAuthority = read("rfc/evidence-value-authority.md");

const operationKinds = new Map([
  ["runtime.semantic.local_edge@1", "edge"],
  ["runtime.semantic.structural_edge@1", "edge"],
  ["runtime.semantic.transition_edge@1", "edge"],
  ["runtime.semantic.breadth_edge@1", "edge"],
  ["runtime.semantic.duty_edge@1", "edge"],
  ["runtime.semantic.recorded_path@1", "recorded_path"],
  ["runtime.semantic.recorded_sequence@1", "recorded_sequence"],
  ["runtime.semantic.complete_alternatives@1", "complete_alternatives"],
]);

const validateInput = (operation, input) => {
  assert.equal(input.kind, operationKinds.get(operation), "operation/input grain mismatch");
  if (input.kind === "recorded_path") assert.ok(input.edges.length > 0, "path must be non-empty");
  if (input.kind === "recorded_sequence") {
    assert.ok([2, 3, 4, 5].includes(input.horizon), "closed sequence horizon");
    assert.equal(input.path.kind, "recorded_path");
  }
  if (input.kind === "complete_alternatives") {
    assert.ok(input.alternatives.some((edge) => edge.moveUci === input.played.moveUci), "played move must be in exact legal set");
  }
};

test("D2194: operation protocol is closed, distributive and crosses wrong grains", () => {
  for (const symbol of [
    "SemanticValidationOperationInputMap",
    "SemanticValidationOperationResultMap",
    "SemanticValidationOperationRef",
    "SemanticValidationOperationInput",
    "SemanticValidationCaseRef",
    "SemanticValidationCaseFor",
  ]) assert.match(rfc, new RegExp(`(?:interface|type) ${symbol}\\b`, "u"));
  for (const operation of operationKinds.keys()) assert.match(rfc, new RegExp(operation.replaceAll(".", "\\."), "u"));

  const edge = { kind: "edge", beforeFen: "before", moveUci: "e2e4", afterFen: "after" };
  assert.doesNotThrow(() => validateInput("runtime.semantic.local_edge@1", edge));
  assert.throws(() => validateInput("runtime.semantic.recorded_path@1", edge), /grain mismatch/u);
  assert.throws(() => validateInput("runtime.semantic.recorded_path@1", { kind: "recorded_path", edges: [] }), /non-empty/u);
  assert.throws(
    () => validateInput("runtime.semantic.recorded_sequence@1", { kind: "recorded_sequence", path: { kind: "recorded_path" }, horizon: 8 }),
    /closed sequence horizon/u,
  );
  assert.throws(
    () => validateInput("runtime.semantic.complete_alternatives@1", { kind: "complete_alternatives", played: edge, alternatives: [] }),
    /played move/u,
  );
});

test("D2194: exact case refs reject stale event, arm and version identity", () => {
  const row = { id: "case", version: 1, event: { id: "event", version: 1 }, arm: "positive" };
  const resolve = (ref) => assert.deepEqual(ref, row);
  assert.doesNotThrow(() => resolve({ ...row }));
  assert.throws(() => resolve({ ...row, version: 2 }));
  assert.throws(() => resolve({ ...row, arm: "orientation" }));
  assert.throws(() => resolve({ ...row, event: { id: "other", version: 1 } }));
  assert.match(rfc, /SEMANTIC_VALIDATION_CASE_REF_STALE/u);
});

test("D2195: admission is profile verdict AND exact sole-factory receipt", () => {
  for (const field of ["projection", "factory", "inputDigest", "payloadDigest", "sourceDigests"]) {
    assert.match(valueAuthority, new RegExp(`readonly ${field}:`, "u"));
    assert.match(rfc, new RegExp(`readonly ${field}:`, "u"));
  }
  assert.match(rfc, /eventProfile\(event\.projection\)\.verdict === "passed"/u);
  assert.match(rfc, /event_value_unverified/u);
  assert.match(rfc, /SEMANTIC_VALIDATION_VALUE_AUTHORITY_MISSING/u);

  const admit = ({ verdict, projection, factory, soleFactory, payloadDigest, actualDigest }) =>
    verdict === "passed" && factory === soleFactory && payloadDigest === actualDigest && projection === "event@1";
  const valid = { verdict: "passed", projection: "event@1", factory: "eventFactory", soleFactory: "eventFactory", payloadDigest: "a", actualDigest: "a" };
  assert.equal(admit(valid), true);
  assert.equal(admit({ ...valid, factory: "callerAdapter" }), false);
  assert.equal(admit({ ...valid, payloadDigest: "b" }), false);
  assert.equal(admit({ ...valid, verdict: "required" }), false);
});

test("D2196: every expectation has a non-LLM authority and Codex owns mechanics", () => {
  for (const kind of ["existing_assertion", "rules_oracle", "cited_proposition", "owner_authored"]) {
    assert.match(rfc, new RegExp(`kind: "${kind}"`, "u"));
  }
  assert.match(rfc, /Codex cannot create or amend that receipt/u);
  assert.match(rfc, /Building a runner is not authority to fill them/u);
  assert.match(rfc, /\| D4 \|[\s\S]*?\| codex,/u);
  assert.match(rfc, /\| D5 \|[\s\S]*?never Codex's unsupported judgement[\s\S]*?\| OWNER \|/u);
  assert.doesNotMatch(rfc, /\| D4 \| Complete all still-required[\s\S]*?\| codex/u);
});

const canonical = (value) => JSON.stringify(value, Object.keys(value).sort());
const pairMirrors = (source, partner) => {
  assert.ok(source.length > 0 && partner.length > 0, "MIRROR_EMPTY");
  assert.equal(source.length, partner.length, "MIRROR_MISMATCH");
  const sourceKeys = source.map(canonical);
  const partnerKeys = partner.map(canonical);
  assert.equal(new Set(sourceKeys).size, sourceKeys.length, "MIRROR_AMBIGUOUS");
  assert.equal(new Set(partnerKeys).size, partnerKeys.length, "MIRROR_AMBIGUOUS");
  assert.deepEqual(sourceKeys.toSorted(), partnerKeys.toSorted(), "MIRROR_UNMATCHED");
};

test("D2197: mirror pairing is non-empty, unique, exact and order-independent", () => {
  const a = { projection: "event@1", sign: "gained", operands: { subject: "b1", target: "c3" } };
  const b = { projection: "event@1", sign: "lost", operands: { subject: "g8", target: "f6" } };
  assert.throws(() => pairMirrors([], []), /MIRROR_EMPTY/u);
  assert.throws(() => pairMirrors([a], []), /MIRROR_EMPTY/u);
  assert.throws(() => pairMirrors([a, a], [a, a]), /MIRROR_AMBIGUOUS/u);
  assert.doesNotThrow(() => pairMirrors([a, b], [b, a]));
  assert.throws(() => pairMirrors([a], [b]), /MIRROR_UNMATCHED/u);
  assert.match(rfc, /SEMANTIC_VALIDATION_MIRROR_EMPTY/u);
  assert.match(rfc, /SEMANTIC_VALIDATION_MIRROR_AMBIGUOUS/u);
  assert.match(rfc, /canonical target-event multisets/u);
});
