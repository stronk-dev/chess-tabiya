// DISPOSABLE positive author contract for D2340-D2342. No production evidence is implemented.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const bounded = readFileSync("rfc/bounded-policy-targets.md", "utf8");
const validation = readFileSync("rfc/semantic-validation-authority.md", "utf8");
const fixture = readFileSync("tools/d2202-bounded-target-third-author-repair/protocol.typecheck.ts", "utf8");
const proposed = readFileSync("tools/d2202-bounded-target-third-author-repair/protocol.proposed.ts", "utf8");

test("D2340 admits two explicit reading roots without laundering value receipts", () => {
  assert.match(validation, /SEMANTIC_READING_VALIDATION_ROOTS/u);
  for (const id of ["derived.bounded_target.named_material_target@1", "derived.bounded_target.bounded_return@1"]) assert.match(validation, new RegExp(id.replaceAll(".", "\\."), "u"));
  assert.match(bounded, /value-factory receipt is a\s+necessary construction conjunct, never semantic validation/u);
});
test("D2341 compiles one imported proposed protocol rather than local lookalikes", () => {
  assert.match(fixture, /^import type .* from "\.\/protocol\.proposed\.js";/mu);
  assert.doesNotMatch(fixture, /^type (?:Immediate|Candidate|Result)\s*=/mu);
  for (const value of ['cause: "preserved"', '"target_moved"', '"capture_illegal"']) assert.match(proposed, new RegExp(value, "u"));
  assert.doesNotMatch(proposed, /"attacker_moved"|cause: null/u);
});
test("D2342 exports factories internally and refuses every public/application route", () => {
  for (const name of ["makeNamedMaterialTargetEvidence", "makeBoundedTargetImmediateEvidence", "makeBoundedTargetReturnEvidence"]) assert.match(bounded, new RegExp(`export declare function ${name}\\(`, "u"));
  assert.match(bounded, /packages\/runtime\/src\/internal\/bounded-target-factories\.ts/u);
  assert.match(bounded, /sole non-test importer/u);
  assert.match(bounded, /absent from the runtime barrel/u);
});
