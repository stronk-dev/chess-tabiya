// DISPOSABLE sixth author-repair contract — D2432-D2435/D2473. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const fixture = read("tools/d2120-module-registration-author-contract/module-plan-fixture.ts");
const rfc = read("rfc/module-registration.md");
const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (value) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
const byId = new Map(execution.rows.map((row) => [row.projection.id, row]));

test("D2432 seven multi-edge operations retain ordered roles, horizons and output anchors", () => {
  const expected = new Map([
    ["derived.tactic.deflection_observed", [3, 3]],
    ["derived.tactic.attraction_observed", [3, 5]],
    ["derived.tactic.line_blocker_clearance_observed", [3]],
    ["derived.tactic.square_clearance_observed", [3]],
    ["derived.tactic.interference_observed", [3]],
    ["derived.tactic.check_zwischenzug_observed", [4]],
    ["derived.tactic.overload_exploitation_observed", [3]],
  ]);
  for (const [id, horizons] of expected) {
    const derivation = byId.get(id).derivation;
    assert.equal(derivation.occurrenceContract.kind, "ordered_window");
    assert.deepEqual(derivation.occurrenceContract.alternatives.map((arm) => arm.horizon), horizons);
    assert.ok(derivation.occurrenceContract.alternatives.every((arm) => arm.outputEdgeOffset === arm.horizon));
    assert.ok(derivation.occurrenceContract.alternatives.every((arm) => arm.operands.every((operand) =>
      operand.cardinality > 0 && operand.roles.length === operand.cardinality)));
    assert.ok(derivation.inputBindings.every((binding) => binding.relation === "operation_owned_occurrences"));
    assert.equal(derivation.operationRequirement.status, "awaiting_upstream_occurrence_receipt");
  }
});

test("D2433 candidate population publishes exact views and every binding names one locator", () => {
  const source = execution.sourceContracts.find((row) => row.id === "candidate_population@1");
  assert.deepEqual(source.views, ["root_legal_population", "candidate_child_position_by_uci", "candidate_edge_by_uci", "complete_candidate_population"]);
  assert.equal(source.viewAuthority.owner, "module-registration");
  assert.deepEqual(source.forbiddenViews, ["committed_edge", "current_root_projection"]);
  assert.equal(source.operation.callable, "CandidatePopulationService.get(request, signal)");
  const rows = execution.rows.filter((row) => row.acquisition === source.id);
  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => ["candidate_child_position_by_uci", "candidate_edge_by_uci"].includes(row.subjectAuthority.occurrenceView)));
  const pairs = bindings.rows.filter((row) => row.occurrenceRequirement.source === source.id);
  assert.ok(pairs.length > 0);
  assert.ok(pairs.every((row) => row.occurrenceRequirement.selector.kind === "canonical_candidate_uci"));
  assert.ok(pairs.every((row) => row.occurrenceRequirement.selector.committedEdgeForbidden === true));
  assert.ok(pairs.every((row) => row.occurrenceRequirement.exactProjectionOperation === null));
});

test("D2434 signed deltas require ordered endpoints and equality joins", () => {
  const compare = byId.get("derived.compare.eval_delta").derivation.occurrenceContract;
  assert.deepEqual(compare.alternatives[0].operands[0].endpointRoles, ["before", "after"]);
  assert.equal(compare.alternatives[0].operands[0].cardinality, 2);
  assert.deepEqual(compare.equality, ["same_recorded_branch", "consecutive_trail_order", "same_engine_id", "same_search_limit", "same_score_domain"]);
  const grade = byId.get("derived.grade.move_quality").derivation.occurrenceContract;
  assert.deepEqual(grade.alternatives.map((arm) => arm.operands[0].projection), ["recorded.engine.eval", "live.stockfish.eval"]);
  assert.ok(grade.alternatives.every((arm) => arm.operands[0].cardinality === 2));
  assert.ok(grade.alternatives.every((arm) => arm.operands[0].endpointRoles.join("/") === "before/after"));
  assert.equal(grade.status, "upstream_same_lane_anyof_verified");
  assert.equal(byId.get("derived.grade.move_quality").derivation.kind, "any");
  assert.deepEqual(byId.get("derived.grade.move_quality").derivation.alternatives, [
    [{ id: "recorded.engine.eval", version: 1 }],
    [{ id: "live.stockfish.eval", version: 1 }],
  ]);
});

test("D2435 source contracts name exact owner operations and no rejected view authority survives", () => {
  assert.deepEqual(execution.sourceContracts.map((row) => row.operation.callable), [
    "CandidatePopulationService.get(request, signal)",
    "compileRecordedSemanticPath(input)",
    "compileReviewEvidence(input)",
    "compileCatalogueEvidencePool(input)",
    "application.scheduler.get(request, scope, signal)",
  ]);
  assert.equal(execution.sourceContracts.find((row) => row.id === "recorded_semantic_path@1").assertion, null);
  assert.equal(execution.sourceContracts.find((row) => row.id === "review_evidence_packet@1").input, null);
  assert.deepEqual(execution.sourceContracts.find((row) => row.id === "provider_evidence_packet@1").operation.successPipeline, [
    "assertProviderDelivery(request.operation, result.delivery)",
    "application.sourceFactories[request.operation].make(result.delivery)",
  ]);
  assert.doesNotMatch(fixture, /AUTHOR_ADDITIONAL_SUBJECT_VIEWS/u);
  assert.match(rfc, /compileCatalogueEvidencePool/u);
});

test("requirements remain sealed, dependency-blocked and non-executable", () => {
  for (const artifact of [execution, bindings]) {
    const { digest: sealed, ...body } = artifact;
    assert.equal(sealed, digest(body));
    assert.equal(artifact.completionClaim, "requirements_only");
  }
  assert.equal(execution.rows.length, 117);
  assert.equal(bindings.rows.length, 205);
  assert.ok(execution.rows.every((row) => !Object.hasOwn(row, "operation")));
  assert.ok(bindings.rows.every((row) => row.status === "blocked_dependencies"));
});
