// DISPOSABLE author-repair contract for D2039-D2043. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/semantic-validation-authority.md");
const semanticEvidence = read("packages/runtime/src/semantic-evidence.ts");
const candidateEvidence = read("apps/server/src/candidate-evidence.ts");

test("D2039: population input, provenance and all three traversals are closed", () => {
  assert.match(rfc, /tools\/r2-selection-harness\/imported-sample\.pgn/u);
  assert.match(rfc, /tools\/r2-selection-harness\/fixture\.json/u);
  assert.match(rfc, /CC0-1\.0/u);
  assert.match(rfc, /`sampled_edges`/u);
  assert.match(rfc, /`recorded_paths`/u);
  assert.match(rfc, /`complete_alternatives`/u);
  assert.match(rfc, /SEMANTIC_VALIDATION_POPULATION_INCOMPLETE/u);
  assert.match(rfc, /No case, profile or implementer supplies a population path or subset/u);
});

test("D2040: unavailable is distinct from completed-empty and reasons are closed", () => {
  assert.match(semanticEvidence, /loosePieceSemanticEvents\([\s\S]*?\[\] \| undefined/u);
  assert.match(semanticEvidence, /loosePieceSemanticEvents\([^)]*\) \?\? \[\]/u);
  assert.match(rfc, /type SemanticValidationOperationResult[\s\S]*?kind: "completed"[\s\S]*?kind: "unavailable"/u);
  assert.match(rfc, /type SemanticValidationUnavailableReason[\s\S]*?source_predicate_unavailable/u);
  assert.match(rfc, /never by inspecting an empty event array or catching an error/u);
  assert.match(rfc, /cannot confer a passing\s+learner-eligibility verdict/u);
});

test("D2041: mirror comparison is a total typed leaf walk", () => {
  assert.doesNotMatch(rfc, /operandMap: Readonly<Record<string, string>>/u);
  assert.match(rfc, /interface SemanticMirrorOperandRule/u);
  assert.match(rfc, /"square"[\s\S]*?"color"[\s\S]*?"signed_file_delta"[\s\S]*?"signed_rank_delta"/u);
  assert.match(rfc, /Every scalar operand leaf on both target events is covered exactly once/u);
  assert.match(rfc, /unmatched leaf[\s\S]*?unresolved wildcard/u);
  assert.match(rfc, /SEMANTIC_VALIDATION_ORIENTATION_SCHEMA/u);
});

test("D2042: the current source really composes internal emitters through localSemanticEvents", () => {
  for (const operation of [
    "structuralSemanticEvents",
    "transitionSemanticEvents",
    "breadthSemanticEvents",
    "semanticDutyEvents",
  ]) {
    assert.match(semanticEvidence, new RegExp(`localSemanticEvents\\([\\s\\S]*?${operation}\\(`, "u"));
  }
  assert.match(candidateEvidence, /const events = localSemanticEvents\(beforeFen, moveUci, afterFen\)/u);
});

test("D2042: internal operation validation requires exact application retention", () => {
  assert.match(rfc, /type SemanticValidationApplicationReach/u);
  assert.match(rfc, /kind: "exact_projection_multiset"/u);
  assert.match(rfc, /runner invokes both and proves the canonical\s+multiset/u);
  assert.match(rfc, /a symbol merely exported from\s+`packages\/runtime` is not an application caller/u);
  assert.match(rfc, /Replacing, filtering or erasing one child event/u);
});

test("D2043: landing cardinality follows live roots and owns the held event transition", () => {
  const criterionOne = rfc.match(/## 9\. Acceptance criteria[\s\S]*?\n2\./u)?.[0] ?? "";
  assert.match(criterionOne, /set-equal to the\s+declarations, profiles and generated verdicts/u);
  assert.match(criterionOne, /no landing criterion hard-codes\s+that cardinality/u);
  assert.doesNotMatch(criterionOne, /set-equal to 67/u);
  assert.match(rfc, /derived\.pawn\.promotion_race_tablebase@1/u);
  assert.match(rfc, /must add its profile,[\s\S]*?explicit required verdict atomically/u);
});
