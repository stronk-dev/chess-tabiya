// DISPOSABLE ninth author-repair contract for D2557. No module implementation is authorized.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const semanticSource = read("packages/runtime/src/semantic-evidence.ts");
const runtimeBarrel = read("packages/runtime/src/index.ts");
const rfc = read("rfc/module-registration.md");

const deflection = execution.rows.find((row) => row.projection.id === "derived.tactic.deflection_observed");

test("D2557 binds the exact live selector, constructor and emitter", () => {
  assert.deepEqual(deflection.derivation.upstreamAuthority, {
    owner: "rfc/semantic-collectors.md",
    projection: { id: "rules.tactic.event.check", version: 1 },
    inductionSelector: "deflectionObservedInduction(anchors)",
    eventConstructor: "checkSemanticEvent(beforeFen, moveUci, afterFen)",
    requiredEmitter: "deflectionObservedSemanticEvent(..., checkEvidence?)",
    status: "implemented_exact_derivation_authority",
  });
  assert.match(semanticSource, /export function deflectionObservedInduction\(/u);
  assert.match(semanticSource, /export function checkSemanticEvent\(/u);
  assert.match(semanticSource, /export function deflectionObservedSemanticEvent\(/u);
  assert.match(runtimeBarrel, /\bcheckSemanticEvent,/u);
  assert.match(runtimeBarrel, /\bdeflectionObservedInduction,/u);
});

test("D2557 preserves the genuinely unavailable recorded-path occurrence operation", () => {
  assert.equal(deflection.derivation.operationRequirement.callable, "recordedSemanticPath(run, branchId)");
  assert.equal(deflection.derivation.operationRequirement.status, "awaiting_upstream_occurrence_receipt");
  assert.equal(deflection.status, "awaiting_upstream_sealed_operation");
  assert.doesNotMatch(JSON.stringify(deflection.derivation.upstreamAuthority), /missingProjection|blocked_upstream_derivation_authority/u);
  assert.match(rfc, /(?:preserv|retain)(?:e|ing)[\s\S]{0,180}`awaiting_upstream_occurrence_receipt`/u);
});
