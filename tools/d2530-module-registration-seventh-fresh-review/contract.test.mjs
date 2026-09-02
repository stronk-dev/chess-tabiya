// DISPOSABLE fresh-review falsifier. It tests the returned author contract, not production behavior.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const moduleRfc = read("rfc/module-registration.md");
const providerRfc = read("rfc/provider-exchange-and-execution.md");

const source = (id) => execution.sourceContracts.find((row) => row.id === id);
const projection = (id) => execution.rows.find((row) => row.projection.id === id);
const key = (row) => `${row.consumer.id}@${row.consumer.version}\0${row.projection.id}@${row.projection.version}`;

test("D2530: provider pipeline names a type instead of the injected runtime value", () => {
  const pipeline = source("provider_evidence_packet@1").operation.successPipeline;
  assert.equal(pipeline[1], "ProviderSourceFactories[request.operation].make(result.delivery)");
  assert.match(providerRfc, /type ProviderSourceFactories =/u);
  assert.match(providerRfc, /readonly sourceFactories: ProviderSourceFactories/u);
  assert.doesNotMatch(providerRfc, /(?:const|let|class) ProviderSourceFactories\b/u);
});

test("D2531: catalogue gate inputs have no exact producer/projection authorities", () => {
  const catalogue = source("catalogue_evidence_packet@1");
  assert.equal(catalogue.input, "CatalogueEvidencePoolRequest");
  assert.doesNotMatch(JSON.stringify(catalogue), /positionProjection|applicabilityProjection|inputAuthorities/u);
  const request = moduleRfc.slice(
    moduleRfc.indexOf("interface CatalogueEvidencePoolRequest"),
    moduleRfc.indexOf("interface CatalogueEvidencePoolReceipt"),
  );
  assert.match(request, /DeclaredEvidence<CanonicalPositionIdentity>/u);
  assert.match(request, /DeclaredEvidence<TheoryApplicabilityIdentity>/u);
  assert.doesNotMatch(request, /producer:|projection:/u);
});

test("D2532: same-branch eval delta remains wrapped in cross-branch subject authority", () => {
  const row = projection("derived.compare.eval_delta");
  assert.equal(row.subjectKind, "branch_pair");
  assert.equal(row.subjectAuthority.occurrenceView, "recorded_branch_pair");
  assert.equal(row.derivation.join.rule, "declared_branch_pair");
  assert.deepEqual(row.derivation.occurrenceContract.equality.slice(0, 2), [
    "same_recorded_branch", "consecutive_trail_order",
  ]);
});

test("D2533: deflection check arm reaches outside the declared input closure", () => {
  const row = projection("derived.tactic.deflection_observed");
  const checkId = "rules.tactic.event.check";
  const checkArm = row.derivation.occurrenceContract.alternatives.find((arm) => arm.discriminator === "check_induced");
  assert.ok(checkArm.operands.some((operand) => operand.projection === checkId));
  assert.ok(!row.derivation.inputs.some((input) => input.id === checkId));
  assert.ok(!row.derivation.inputBindings.some((input) => input.projection.id === checkId));
  assert.equal(row.derivation.kind, "all");
});

test("D2534: all timing-resolution pointers miss the required pair identity", () => {
  const required = new Set(bindings.exactOperationResolution.requiredPairKeys);
  const mismatches = bindings.rows.filter((row) =>
    row.timingRequirement.resolutionOwner.pair !== key(row) ||
    !required.has(row.timingRequirement.resolutionOwner.pair));
  assert.equal(mismatches.length, 205);
  assert.match(mismatches[0].timingRequirement.resolutionOwner.pair, /^blunder_prevention@1\0/u);
  assert.match(key(mismatches[0]), /^module\.blunder_prevention@1\0/u);
});

test("D2535: the final resolution receipt has no runtime seal or assertion", () => {
  assert.match(moduleRfc, /interface ModuleExactOperationResolutionReceipt/u);
  assert.match(moduleRfc, /sole legal input to final F1 binding\s+emission/u);
  assert.doesNotMatch(moduleRfc, /assertModuleExactOperationResolutionReceipt/u);
  assert.doesNotMatch(moduleRfc, /WeakSet<ModuleExactOperationResolutionReceipt>/u);
  assert.doesNotMatch(moduleRfc, /unique symbol[^\n]*ModuleExactOperationResolutionReceipt/u);
});
