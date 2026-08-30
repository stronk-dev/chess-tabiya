// DISPOSABLE fourth fresh independent review harness — D2334-D2339. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const transition = JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json"));
const applicability = JSON.parse(read("rfc/contracts/pack-capability-applicability-v1.json"));
const author = read("tools/d2152-pack-capability-author-repair/contract.mjs");

test("D2334: the legacy catalogue authority has no path/digest rows and is never recomputed", () => {
  assert.equal(transition.legacy.catalogueDocuments, 92);
  assert.match(transition.legacy.populationSha256, /^[0-9a-f]{64}$/u);
  assert.equal(Object.hasOwn(transition.legacy, "documents"), false);
  assert.equal(Object.hasOwn(transition.legacy, "entries"), false);
  assert.doesNotMatch(author, /populationSha256|catalogueDocuments/u);
});

test("D2335: software-first legacy admission conflicts with the all-92 requires criterion", () => {
  assert.match(rfc, /The software transition\s+lands first without changing those legacy bytes/u);
  assert.match(rfc, /For all 92 packs, `requires` set-equals/u);
  assert.match(rfc, /0\.27 reader accepts an unstamped document/u);
  assert.doesNotMatch(rfc, /criterion 3[^\n]*(?:projected|post-apply|after D560)/u);
});

test("D2336: every unconditional authority row carries a bare string instead of CapabilityId", () => {
  assert.equal(applicability.always.length, 14);
  for (const row of applicability.always) {
    assert.equal(typeof row.capability, "string");
    assert.equal(Object.hasOwn(row, "selector"), false);
  }
  assert.match(rfc, /readonly capability: CapabilityId/u);
  assert.match(author, /always: output\.always/u);
});

test("D2337: the lifecycle fixture proves a declaration shape different from the RFC type", () => {
  const declaration = rfc.slice(
    rfc.indexOf("export interface CapabilityDeclaration"),
    rfc.indexOf("`CapabilityMeaningSource` is closed"),
  );
  assert.match(declaration, /readonly id: string/u);
  assert.match(declaration, /readonly version: CapabilityVersion/u);
  assert.doesNotMatch(declaration, /subjectId/u);

  assert.match(author, /\{ subjectId: "example", id: id1, disposition:/u);
  assert.doesNotMatch(author, /satisfies CapabilityDeclaration|: CapabilityDeclaration/u);
});

test("D2338: packCapabilities has prose fields but no closed shared public row", () => {
  assert.match(rfc, /`GET \/capabilities` gains `packCapabilities`/u);
  assert.match(rfc, /`\{id, version, disposition\}`/u);
  assert.match(rfc, /Each row includes its current deployment reachability/u);
  assert.doesNotMatch(rfc, /interface (?:PackCapability|PublishedCapability|CapabilityResponse)Row/u);
  assert.doesNotMatch(rfc, /apps\/web\/src\/lib\/api\.ts/u);
});

test("D2339: transient admission accepts a caller-authored requiredIds list", () => {
  assert.match(rfc, /requireCapabilities\(operationId, requiredIds\)/u);
  assert.doesNotMatch(rfc, /(?:interface|type|const) (?:OperationCapability|CapabilityOperation)Binding/u);
  assert.doesNotMatch(rfc, /requiredIds (?:is|are) derived internally/u);
});
