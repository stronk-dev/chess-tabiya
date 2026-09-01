import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");
const generic = read("rfc/shared-resource-register-bootstrap.md");
const assistance = read("rfc/assistance-config-register.md");
const provider = read("rfc/provider-protocol-register.md");
const semantic = read("rfc/semantic-convention-register.md");

test("one generic engine owns catalogue, projection, lifecycle and time", () => {
  for (const token of [
    "rfc/shared-resource-catalogue.json",
    "assertSharedResourceTransition",
    "canonicalSharedResourceBytes",
    "unregistered -> adopted",
    "R/<resource>/<rule>",
  ]) assert.ok(generic.includes(token), "generic RFC missing " + token);
  for (const adapter of [
    "json_schema_id@1",
    "migration_sequence@1",
    "literal_string_tuple@1",
    "literal_string_union@1",
    "canonical_resource@1",
    "typescript_contract@1",
    "versioned_declarations@1",
  ]) assert.ok(generic.includes(adapter), "generic RFC missing " + adapter);
});

test("assistance adopts live authorities and separates vocabulary from operations", () => {
  assert.ok(assistance.includes("accepted and implemented `rfc/shared-resource-register-bootstrap.md`"));
  assert.ok(assistance.includes("assistance-config | sequential/typescript_contract@1/adopted"));
  assert.ok(assistance.includes("workflow-preference | sequential/typescript_contract@1/adopted"));
  assert.ok(assistance.includes("assistance-permission | member_set/literal_string_union@1/adopted"));
  assert.ok(assistance.includes("assistance-permission-contract | sequential/canonical_resource@1/absent"));
  assert.ok(assistance.includes("assistance-exchange | sequential/canonical_resource@1/absent"));
  assert.ok(assistance.includes("pointwise-min identity and ordered operands"));
  assert.ok(assistance.includes("not add C9"));
});

test("provider uses an atomic runtime image plus an independent accepted population", () => {
  assert.ok(provider.includes("accepted and implemented `rfc/shared-resource-register-bootstrap.md`"));
  assert.ok(provider.includes("PROVIDER_PROTOCOL_RESOURCE"));
  assert.ok(provider.includes("canonical_resource@1/absent"));
  assert.ok(provider.includes("tabiya-provider-obligations"));
  assert.ok(provider.includes("Function/type witnesses do not appear"));
  assert.ok(provider.includes("prior accepted claim/obligation preimage"));
  assert.ok(provider.includes("does not create provider bytes, add C11"));
});

test("semantic conventions retain lineage without assistance or C10 ownership", () => {
  assert.ok(semantic.includes("accepted and implemented `rfc/shared-resource-register-bootstrap.md`"));
  assert.ok(semantic.includes("lineage_set/versioned_declarations@1/absent"));
  assert.ok(semantic.includes("initial-members.json"));
  assert.ok(semantic.includes("semantic-convention-history-check"));
  assert.ok(semantic.includes("depends on the generic engine, not assistance"));
  assert.ok(semantic.includes("adds no C10"));
});

test("all four RFCs remain non-implementable until fresh review", () => {
  for (const [name, source] of Object.entries({ generic, assistance, provider, semantic })) {
    assert.match(source, /Fresh independent review is required|Fresh independent review required|Fresh review is required|Fresh review required/i, name);
    assert.match(source, /implementation is unauthorized|implementation remains unauthorized/i, name);
  }
});

test("cross-RFC order is explicit", () => {
  const receipt = read("planning/shared-resource-register-bootstrap/cross-rfc-reconciliation-2026-09-01.md");
  for (const token of [
    "Required implementation order",
    "Rebase and review the assistance population RFC",
    "semantic-convention and provider population RFCs",
    "[[D2465]]",
    "[[D2466]]",
    "[[D2467]]",
  ]) assert.ok(receipt.includes(token), "reconciliation missing " + token);
});
