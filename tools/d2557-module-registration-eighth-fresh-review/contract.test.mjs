// DISPOSABLE eighth fresh-review falsifier. It reviews contract artifacts against live authority.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const moduleRfc = read("rfc/module-registration.md");
const providerRfc = read("rfc/provider-exchange-and-execution.md");
const semanticSource = read("packages/runtime/src/semantic-evidence.ts");
const catalogueSource = read("packages/runtime/src/evidence-catalog.ts");
const authorContract = read("tools/d2530-module-registration-eighth-author-repair/contract.test.mjs");
const routeReceipt = JSON.parse(read("planning/evidence-foundation-ux/evidence-value-authority-route-map.json"));

const source = (id) => execution.sourceContracts.find((row) => row.id === id);
const projection = (id) => execution.rows.find((row) => row.projection.id === id);
const refKey = (value) => `${value.id}@${value.version}`;
const pairKey = (row) => `${refKey(row.consumer)}\0${refKey(row.projection)}`;

test("D2530 uses one injected provider application and operation-correlated factory", () => {
  const provider = source("provider_evidence_packet@1");
  assert.equal(provider.operation.callable, "application.scheduler.get(request, scope, signal)");
  assert.equal(provider.operation.successPipeline[1], "application.sourceFactories[request.operation].make(result.delivery)");
  assert.match(providerRfc, /readonly sourceFactories: ProviderSourceFactories/u);
  assert.doesNotMatch(JSON.stringify(provider.operation), /ProviderSourceFactories\[/u);
});

test("D2531 catalogue gates name exact producer and projection pairs", () => {
  const authorities = source("catalogue_evidence_packet@1").inputAuthorities;
  assert.equal(refKey(authorities.position.producer), "run.record@1");
  assert.equal(refKey(authorities.position.projection), "run.record.position@1");
  assert.deepEqual(Object.keys(authorities.applicabilityByRequestedProjection).sort(), [
    "pack.authored.claim@1",
    "theory.opening.current_endpoint@1",
    "theory.shapes.firing@1",
  ]);
  const opening = authorities.applicabilityByRequestedProjection["theory.opening.current_endpoint@1"];
  const claim = authorities.applicabilityByRequestedProjection["pack.authored.claim@1"];
  assert.notDeepEqual(opening, claim);
});

test("D2532 eval delta is one consecutive recorded edge, not a branch pair", () => {
  const row = projection("derived.compare.eval_delta");
  assert.equal(row.subjectKind, "edge");
  assert.equal(row.subjectAuthority.occurrenceView, "recorded_edge");
  assert.equal(row.derivation.join.rule, "same_edge_context");
  assert.deepEqual(row.derivation.occurrenceContract.equality.slice(0, 2), [
    "same_recorded_branch",
    "consecutive_trail_order",
  ]);
});

test("D2533 deflection alternatives are set-equal before checking live authority", () => {
  const derivation = projection("derived.tactic.deflection_observed").derivation;
  const common = derivation.commonInputs.map(refKey);
  const alternatives = Object.fromEntries(derivation.alternatives.map((row) => [row.discriminator, row.inputs.map(refKey)]));
  assert.deepEqual(alternatives.bait_capture, common);
  assert.deepEqual(new Set(alternatives.check_induced), new Set([...common, "rules.tactic.event.check@1"]));
  assert.deepEqual(
    new Set(derivation.inputBindings.map((row) => refKey(row.projection))),
    new Set(alternatives.check_induced),
  );
});

test("D2534 all row pointers join the exact required module/projection keys", () => {
  const required = new Set(bindings.exactOperationResolution.requiredPairKeys);
  const pointers = bindings.rows.map((row) => row.timingRequirement.resolutionOwner.pair);
  assert.equal(pointers.length, 205);
  assert.equal(new Set(pointers).size, 205);
  assert.deepEqual(new Set(pointers), required);
  assert.ok(bindings.rows.every((row) => row.timingRequirement.resolutionOwner.pair === pairKey(row)));
});

test("D2535 final resolution requires constructor identity", () => {
  assert.match(moduleRfc, /WeakSet<ModuleExactOperationResolutionReceipt>/u);
  assert.match(moduleRfc, /assertModuleExactOperationResolutionReceipt/u);
  assert.match(moduleRfc, /final F1 emitter must\s+call `assertModuleExactOperationResolutionReceipt`/u);
});

test("D2557 reproduces the stale missing-check blocker against live production", () => {
  const deflection = projection("derived.tactic.deflection_observed");
  assert.equal(deflection.derivation.upstreamAuthority.status, "blocked_upstream_derivation_authority");
  assert.equal(refKey(deflection.derivation.upstreamAuthority.missingProjection), "rules.tactic.event.check@1");
  assert.equal(deflection.status, "awaiting_upstream_sealed_operation");

  assert.match(catalogueSource, /projection\("derived\.tactic", "derived\.tactic\.deflection_observed"[\s\S]*?derivation: \{ anyOf:/u);
  assert.match(catalogueSource, /ref\("rules\.tactic\.event\.check"\)/u);
  assert.match(semanticSource, /export function checkSemanticEvent\(/u);
  assert.match(semanticSource, /export function deflectionObservedInduction\(/u);
  assert.match(semanticSource, /assertSemanticEvidenceEvent\(PRIMARY_EVIDENCE_MANIFEST, checkEvidence\)/u);
  assert.ok(routeReceipt.routes.some((route) => route.currentProducerOperations.includes(
    "packages/runtime/src/semantic-evidence.ts#checkSemanticEvent",
  )));

  assert.match(authorContract, /keeps the missing check authority blocked/u);
  assert.match(authorContract, /upstreamAuthority\.status, "blocked_upstream_derivation_authority"/u);
  assert.equal(deflection.derivation.operationRequirement.status, "awaiting_upstream_occurrence_receipt");
});
