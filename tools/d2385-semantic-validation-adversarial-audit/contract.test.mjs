import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/semantic-validation-authority.md", "utf8");
const model = readFileSync("tools/d2331-semantic-validation-third-author-repair/model.ts", "utf8");

test("D2385: reading roots are fed into declarations and results typed only for events", () => {
  assert.match(rfc, /explicit `SEMANTIC_READING_VALIDATION_ROOTS`/u);
  assert.match(rfc, /derived\.bounded_target\.named_material_target@1/u);
  assert.match(rfc, /SemanticEventDeclaration\.projection/u);
  assert.match(rfc, /readonly events: readonly SemanticEvidenceEvent<unknown>\[\]/u);
  assert.match(rfc, /eventProfile\(event\.projection\)/u);
  assert.doesNotMatch(rfc, /SemanticValidationObservationResult/u);
});

test("D2386: root/case population is specified as both set-equal and a subset", () => {
  const roots = rfc.slice(rfc.indexOf("The compiler then asserts set equality"), rfc.indexOf("The existing `SEMANTIC_EVENT_PROJECTION_IDS", rfc.indexOf("The compiler then asserts set equality")));
  assert.match(roots, /set equality, independently and in both directions/u);
  assert.match(roots, /every validation case's event reference/u);
  assert.match(roots, /Cases may be a subset/u);
});

test("D2387: event-agnostic oracle requests directly manufacture event expectations", () => {
  assert.match(rfc, /SemanticValidationOracleResultMap[\s\S]*?readonly expectation: SemanticValidationExpectation/u);
  assert.match(model, /const result = input\.run\(input\.witness\.request\)/u);
  assert.doesNotMatch(model, /input\.witness\.event[^\n]+input\.run/u);
  assert.match(model, /result\.expectation[^\n]+input\.expectation/u);
});

test("D2388: owner-authored authority is a free string with no declared store", () => {
  assert.match(rfc, /readonly kind: "owner_authored";[\s\S]*?readonly receipt: string;/u);
  assert.doesNotMatch(rfc, /interface SemanticValidationOwner(?:Receipt|AuthorityStore)/u);
  assert.doesNotMatch(rfc, /content\/[a-z0-9_./-]+owner[^\s`]*/u);
});
