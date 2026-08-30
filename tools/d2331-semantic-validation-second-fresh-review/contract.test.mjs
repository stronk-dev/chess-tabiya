// DISPOSABLE second fresh independent review harness — D2331-D2333. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/semantic-validation-authority.md", "utf8");

test("D2331: operation and case identities carry both an @1 suffix and version 1", () => {
  const operationIds = rfc.slice(
    rfc.indexOf("type SemanticValidationOperationId"),
    rfc.indexOf("interface SemanticEdgeInput"),
  );
  assert.match(operationIds, /"runtime\.semantic\.local_edge@1"/u);
  assert.match(
    rfc,
    /type SemanticValidationOperationRef[\s\S]*?readonly id: K; readonly version: 1/u,
  );
  assert.match(rfc, /Case ids are[\s\S]*?`castled\.standard-white\.positive@1`/u);
  assert.match(
    rfc,
    /type SemanticValidationCaseFor[\s\S]*?readonly id: string;[\s\S]*?readonly version: 1/u,
  );

  const shipped = readFileSync("packages/runtime/src/evidence-contract.ts", "utf8");
  assert.match(
    shipped,
    /interface VersionedEvidenceId \{ readonly id: string; readonly version: number \}/u,
  );
});

test("D2332: present profile cells require a case ref that excludes population and external arms", () => {
  const cells = rfc.slice(
    rfc.indexOf("type SemanticValidationCell"),
    rfc.indexOf("interface SemanticValidationProfile"),
  );
  assert.match(
    cells,
    /disposition: "present"; readonly cases: readonly SemanticValidationCaseRef\[\]/u,
  );

  const refs = rfc.slice(
    rfc.indexOf("interface SemanticValidationCaseRef"),
    rfc.indexOf("type SemanticValidationExpectation"),
  );
  assert.match(
    refs,
    /Exclude<SemanticValidationArm, "imported_population" \| "external_label">/u,
  );
  assert.match(rfc, /interface SemanticPopulationReceipt/u);
  assert.doesNotMatch(cells, /SemanticPopulationReceipt|external_disagreement/u);
});

test("D2333: rules-oracle authority stores digests but no executable witness or result binding", () => {
  const authority = rfc.slice(
    rfc.indexOf('readonly kind: "rules_oracle"'),
    rfc.indexOf('readonly kind: "cited_proposition"'),
  );
  assert.match(authority, /readonly oracle: SemanticValidationOracleId/u);
  assert.match(authority, /readonly witnessSha256: string/u);
  assert.match(authority, /readonly resultSha256: string/u);
  assert.doesNotMatch(authority, /readonly witness(?:Ref|Value|Input)\b/u);
  assert.doesNotMatch(authority, /readonly result(?:Value|Expectation)\b/u);
  assert.doesNotMatch(rfc, /type SemanticValidationOracle(?:Request|Result)\b/u);
});
