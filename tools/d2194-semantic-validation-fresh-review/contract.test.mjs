// DISPOSABLE fresh independent review harness — D2194-D2197. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/semantic-validation-authority.md");

test("D2194: case and operation references depend on undefined input/ref types", () => {
  for (const symbol of ["SemanticValidationOperationInput", "SemanticValidationOperationRef", "SemanticValidationCaseRef"]) {
    assert.match(rfc, new RegExp(symbol, "u"));
    assert.doesNotMatch(rfc, new RegExp(`(?:interface|type) ${symbol}\\b`, "u"));
  }
  assert.doesNotMatch(rfc, /type SemanticValidationOperationInputMap/u);
  assert.doesNotMatch(rfc, /type SemanticValidationOperationResultMap/u);
});

test("D2195: learner validation is projection-wide and does not require value-route authority", () => {
  assert.match(rfc, /readonly semanticValidation: "required" \| "research_only"/u);
  assert.match(rfc, /event's generated verdict is `passed`/u);
  assert.doesNotMatch(rfc, /evidence-value-authority/u);
  assert.doesNotMatch(rfc, /mintRoute|valueAuthorityReceipt|factoryReceipt/u);
  const event = read("packages/runtime/src/semantic-evidence.ts");
  assert.match(event, /readonly evidence: DeclaredEvidence<T>/u);
  const routeResearch = read("design/research/evidence-mint-route-closure.md");
  assert.match(routeResearch, /191 mint routes over 187 distinct projections/u);
});

test("D2196: missing chess expectations are assigned to codex without an independent authority field", () => {
  const caseShape = rfc.slice(rfc.indexOf("interface SemanticValidationCase"), rfc.indexOf("### 4.2 Closed operation results"));
  assert.doesNotMatch(caseShape, /provenance|authorityRef|oracle|sourceCitation/u);
  assert.match(read("design/research/semantic-validation-migration-matrix.md"), /28 missing emitter positives and 44 missing semantic negatives/u);
  assert.match(rfc, /\| D4 \| Complete all still-required positive, semantic-negative and orientation cells after Slice A \| codex/u);
  assert.match(read("AGENTS.md"), /No LLM-manufactured chess truth/u);
});

test("D2197: a mirror expectation has no nonzero target or event-level pairing rule", () => {
  const expectation = rfc.slice(rfc.indexOf("type SemanticValidationExpectation"), rfc.indexOf("type SemanticValidationUnavailableReason"));
  const mirror = expectation.slice(expectation.indexOf('readonly kind: "mirrors"'));
  assert.doesNotMatch(mirror, /minimum|nonEmpty|eventPair|targetCount/u);
  assert.match(rfc, /Every scalar operand leaf on both target events is covered exactly once/u);
  assert.doesNotMatch(rfc, /both mirror operations must emit|zero[ -]target mirror|canonical event multiset/u);
});
