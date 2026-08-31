// DISPOSABLE fifth fresh independent review harness — D2432-D2435.
// These tests reproduce buildability defects in the requirements-only module plan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const fixture = read("tools/d2120-module-registration-author-contract/module-plan-fixture.ts");
const candidateRfc = read("rfc/shared-candidate-evidence-packet.md");
const reviewRfc = read("rfc/review-evidence-compiler.md");
const providerRfc = read("rfc/provider-exchange-and-execution.md");

const executionById = new Map(execution.rows.map((row) => [row.projection.id, row]));

test("D2432 multi-edge tactic requirements collapse every occurrence onto one edge", () => {
  const observed = [
    "derived.tactic.deflection_observed",
    "derived.tactic.attraction_observed",
    "derived.tactic.line_blocker_clearance_observed",
    "derived.tactic.square_clearance_observed",
    "derived.tactic.interference_observed",
    "derived.tactic.check_zwischenzug_observed",
    "derived.tactic.overload_exploitation_observed",
  ];
  for (const id of observed) {
    const row = executionById.get(id);
    assert.equal(row.subjectKind, "edge");
    assert.equal(row.derivation.join.rule, "same_edge_context");
    assert.ok(row.derivation.inputBindings.every((binding) => binding.relation === "same_edge"));
    assert.ok(row.derivation.inputBindings.every((binding) =>
      !("edgeOffset" in binding) && !("occurrenceRole" in binding) && !("window" in binding)));
  }
});

test("D2433 the candidate packet has child rows but module requirements have no root/child selector", () => {
  assert.match(candidateRfc, /readonly candidates: readonly CandidateEventRow\[\]/u);
  assert.match(candidateRfc, /readonly moveUci: string/u);
  assert.match(candidateRfc, /readonly afterFen: string/u);
  const source = execution.sourceContracts.find((row) => row.id === "candidate_population@1");
  assert.equal(source.extract, "projection-keyed admitted items");
  assert.ok(!("locator" in source) && !("rootProjection" in source) && !("candidateProjection" in source));
  const rows = execution.rows.filter((row) => row.acquisition === "candidate_population@1");
  assert.equal(rows.length, 81);
  assert.ok(rows.every((row) => !("locator" in row.subjectAuthority) && !("candidateMove" in row.subjectAuthority)));
  assert.ok(bindings.rows.some((row) => row.consumer.id === "module.sight_on_request" && row.projection.id === "rules.structural.reading.backward_pawn"));
});

test("D2434 endpoint relations retain neither operand role nor required cardinality", () => {
  const compare = executionById.get("derived.compare.eval_delta");
  assert.deepEqual(compare.derivation.inputs, [{ id: "live.stockfish.eval", version: 1 }]);
  assert.deepEqual(compare.derivation.inputBindings, [{
    projection: { id: "live.stockfish.eval", version: 1 },
    sourceSubjectKind: "position",
    relation: "branch_pair_position_endpoints",
  }]);
  const grade = executionById.get("derived.grade.move_quality");
  assert.ok(grade.derivation.inputBindings.every((binding) =>
    binding.relation === "edge_position_endpoints" && !("endpoint" in binding) && !("cardinality" in binding)));
});

test("D2435 all five claimed upstream invocation symbols are local inventions", () => {
  const authorities = `${candidateRfc}\n${reviewRfc}\n${providerRfc}`;
  const invokes = execution.sourceContracts.map((row) => row.invoke);
  assert.deepEqual(invokes, [
    "collectCandidatePopulation",
    "compileRecordedSemanticPath",
    "compileReviewEvidencePacket",
    "resolveCatalogueEvidence",
    "requestProviderEvidence",
  ]);
  for (const invoke of invokes) assert.doesNotMatch(authorities, new RegExp(`\\b${invoke}\\b`, "u"));
  assert.match(candidateRfc, /createCandidatePopulationService/u);
  assert.match(reviewRfc, /compileReviewEvidence/u);
  assert.match(providerRfc, /ProviderExchangeScheduler/u);
  assert.match(fixture, /export const AUTHOR_ADDITIONAL_SUBJECT_VIEWS/u);
});
