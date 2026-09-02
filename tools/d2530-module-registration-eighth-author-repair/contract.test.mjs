// DISPOSABLE eighth author-repair contract — D2530-D2535. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const moduleRfc = read("rfc/module-registration.md");

const source = (id) => execution.sourceContracts.find((row) => row.id === id);
const projection = (id) => execution.rows.find((row) => row.projection.id === id);
const key = (value) => `${value.id}@${value.version}`;

test("D2530 calls the injected provider application and keeps the operation arm correlated", () => {
  const provider = source("provider_evidence_packet@1");
  assert.equal(provider.operation.callable, "application.scheduler.get(request, scope, signal)");
  assert.deepEqual(provider.operation.successPipeline, [
    "assertProviderDelivery(request.operation, result.delivery)",
    "application.sourceFactories[request.operation].make(result.delivery)",
  ]);
  assert.doesNotMatch(JSON.stringify(provider.operation), /ProviderSourceFactories\[/u);
  assert.match(moduleRfc, /one `ProviderTraversalApplication` value/u);
});

test("D2531 fixes the catalogue position and all requested applicability authorities", () => {
  const authorities = source("catalogue_evidence_packet@1").inputAuthorities;
  assert.deepEqual(authorities.position, {
    producer: { id: "run.record", version: 1 },
    projection: { id: "run.record.position", version: 1 },
  });
  assert.deepEqual(authorities.applicabilityByRequestedProjection, {
    "pack.authored.claim@1": {
      producer: { id: "pack.authored", version: 1 },
      projection: { id: "pack.authored.claim_delivery", version: 1 },
    },
    "theory.opening.current_endpoint@1": {
      producer: { id: "theory.opening.runtime", version: 1 },
      projection: { id: "theory.opening.catalogue_membership", version: 1 },
    },
    "theory.shapes.firing@1": {
      producer: { id: "theory.shapes", version: 1 },
      projection: { id: "theory.shapes.firing", version: 1 },
    },
  });
  const accepts = (requested, evidence) => {
    const expected = authorities.applicabilityByRequestedProjection[requested];
    return expected !== undefined && key(expected.producer) === key(evidence.producer)
      && key(expected.projection) === key(evidence.projection);
  };
  const opening = authorities.applicabilityByRequestedProjection["theory.opening.current_endpoint@1"];
  assert.equal(accepts("theory.opening.current_endpoint@1", opening), true);
  assert.equal(accepts("pack.authored.claim@1", opening), false);
  assert.match(moduleRfc, /Crossed gates, duplicate gates/u);
});

test("D2532 gives eval delta one edge-grained same-branch transition authority", () => {
  const row = projection("derived.compare.eval_delta");
  assert.equal(row.subjectKind, "edge");
  assert.deepEqual(row.subjectAuthority, {
    subjectKind: "edge",
    acquisition: "review_evidence_packet@1",
    occurrenceView: "recorded_edge",
    adapter: "identity",
  });
  assert.equal(row.derivation.join.rule, "same_edge_context");
  assert.deepEqual(row.derivation.occurrenceContract.equality.slice(0, 2), [
    "same_recorded_branch", "consecutive_trail_order",
  ]);
});

test("D2533 makes deflection alternatives set-equal and keeps the missing check authority blocked", () => {
  const derivation = projection("derived.tactic.deflection_observed").derivation;
  assert.equal(derivation.kind, "alternatives");
  assert.deepEqual(derivation.commonInputs.map(key), [
    "run.record.move@1",
    "rules.tactic.reading.defender_duty_set@1",
    "rules.transition.event.capture@1",
    "rules.exchange.predicate.legal_exchange@1",
  ]);
  const byArm = Object.fromEntries(derivation.alternatives.map((arm) => [arm.discriminator, arm.inputs.map(key)]));
  assert.deepEqual(byArm.bait_capture, derivation.commonInputs.map(key));
  assert.deepEqual(new Set(byArm.check_induced), new Set([...derivation.commonInputs.map(key), "rules.tactic.event.check@1"]));
  assert.equal(derivation.upstreamAuthority.status, "blocked_upstream_derivation_authority");
  assert.equal(derivation.upstreamAuthority.missingProjection.id, "rules.tactic.event.check");
  assert.deepEqual(new Set(derivation.inputBindings.map((binding) => key(binding.projection))), new Set(byArm.check_induced));
});

test("D2534 joins all 205 row pointers to the exact required pair set", () => {
  const required = new Set(bindings.exactOperationResolution.requiredPairKeys);
  const pointers = bindings.rows.map((row) => row.timingRequirement.resolutionOwner.pair);
  assert.equal(pointers.length, 205);
  assert.equal(new Set(pointers).size, 205);
  assert.deepEqual([...pointers].sort(), [...required].sort());
  assert.ok(pointers.every((pointer) => pointer.startsWith("module.")));
});

test("D2535 requires constructor identity for the final resolution receipt", () => {
  const receipts = new WeakSet();
  const seal = (value) => {
    const receipt = Object.freeze({ ...value, projections: Object.freeze(value.projections), pairs: Object.freeze(value.pairs) });
    receipts.add(receipt);
    return receipt;
  };
  const assertReceipt = (value) => {
    if (!receipts.has(value)) throw new TypeError("unsealed module resolution receipt");
  };
  const receipt = seal({ projections: [], pairs: [] });
  assert.doesNotThrow(() => assertReceipt(receipt));
  assert.throws(() => assertReceipt({ ...receipt }), /unsealed/u);
  assert.throws(() => assertReceipt(JSON.parse(JSON.stringify(receipt))), /unsealed/u);
  assert.match(moduleRfc, /WeakSet<ModuleExactOperationResolutionReceipt>/u);
  assert.match(moduleRfc, /assertModuleExactOperationResolutionReceipt/u);
  assert.match(moduleRfc, /final F1 emitter must\s+call `assertModuleExactOperationResolutionReceipt`/u);
});
