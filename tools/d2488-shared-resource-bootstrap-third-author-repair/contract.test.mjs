import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveSelectorPopulation, selectorsFor, validateCatalogue, validateDescriptor } from "./model.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");
const catalogue = JSON.parse(read("planning/shared-resource-register-bootstrap/initial-catalogue.v1.json"));

test("D2488/D2489: the closed projection union and literal ten-descriptor seed agree", () => {
  assert.doesNotThrow(() => validateCatalogue(catalogue));
  assert.equal(catalogue.resources.length, 10);
  const adapters = new Set(catalogue.resources.map((resource) => resource.projection.adapter));
  assert.deepEqual([...adapters].sort(), ["canonical_resource@1", "json_schema_id@1", "literal_string_tuple@1", "migration_sequence@1"]);
  for (const adapter of ["literal_string_union@1", "typescript_contract@1", "versioned_declarations@1"]) {
    assert.ok(rfc.includes(`readonly adapter: "${adapter}"`), `projection union omits ${adapter}`);
  }
  const metadata = rfc.match(/```tabiya-resource-roots\n([\s\S]*?)\n```/u)?.[1]?.split("\n") ?? [];
  assert.equal(metadata.length, 10);
  assert.deepEqual(metadata.map((row) => row.split(" | ")[0]), catalogue.resources.map((resource) => resource.id));
});

test("D2488: unknown keys and incompatible lifecycle/adapter/claim-mode tuples fail", () => {
  const base = catalogue.resources[0];
  assert.throws(() => validateDescriptor({ ...base, surprise: true }), /keys differ/u);
  assert.throws(() => validateDescriptor({ ...base, lifecycle: "member_set" }), /incompatible lifecycle adapter/u);
  assert.throws(() => validateDescriptor({ ...base, claimMode: "members" }), /incompatible claim mode/u);
});

test("D2489: every selector in the seed is unique and every existing schema identity is live", () => {
  const selectors = catalogue.resources.flatMap((resource) => selectorsFor(resource.projection));
  assert.equal(new Set(selectors).size, selectors.length);
  for (const resource of catalogue.resources.filter((entry) => entry.introduction === "existing" && entry.projection.adapter === "json_schema_id@1")) {
    const schema = JSON.parse(read(resource.projection.schemaSelector.split("#")[0]));
    assert.match(schema.$id, new RegExp(`:${resource.id === "pack-schema" ? "drill-pack" : resource.id === "run-schema" ? "drill-run" : resource.id.replace("-schema", "")}:`));
  }
});

test("D2490: selector outcomes retain absent, partial, invalid and landed as four distinct states", () => {
  const descriptor = catalogue.resources.find((resource) => resource.id === "pack-schema");
  const selectors = selectorsFor(descriptor.projection);
  assert.equal(resolveSelectorPopulation(descriptor, []).state, "absent");
  assert.equal(resolveSelectorPopulation(descriptor, [selectors[0]]).state, "partial");
  assert.equal(resolveSelectorPopulation(descriptor, selectors, { ok: false, diagnostics: ["mismatch"] }).state, "invalid");
  assert.equal(resolveSelectorPopulation(descriptor, selectors, { ok: true, value: { digest: "sha256:x" } }).state, "landed");
});

test("D2491: TypeScript graph boundaries close repository, builtin, standard-lib and package edges", () => {
  for (const token of [
    "repositoryEdges: \"transitive\"",
    "externalEdges: \"resolved_signature\"",
    "node_builtin",
    "typescript_lib",
    "external_package",
    "@types/node",
    "pnpm-lock.yaml",
    "overload",
    "re-export",
    "dynamic `import()`",
  ]) assert.ok(rfc.includes(token), `missing TypeScript boundary ${token}`);
});

test("D2492: every pre-canonical adapter image is literal and no undefined normal form remains", () => {
  for (const token of [
    "There is no separately “normalized SQL” text",
    "identity and semantic are the ASCII-sorted member set",
    "recursively canonical JSON object literal",
  ]) assert.ok(rfc.includes(token), `missing semantic image rule ${token}`);
  assert.match(rfc, /complete\s+parsed objects/u);
  assert.doesNotMatch(rfc, /semantic retains the normalized union declaration/u);
  assert.doesNotMatch(rfc, /semantic is the complete declaration image/u);
});

test("D2493: README bytes remain human-authored and only checked", () => {
  assert.match(rfc, /`rfc\/README\.md` is \*\*not generated\*\*/u);
  assert.match(rfc, /No tool\s+rewrites, deletes or owns/u);
  assert.match(rfc, /checked README\/catalogue bijection/u);
  assert.doesNotMatch(rfc, /`rfc\/README\.md` renders/u);
});

test("D2494: bounded author review precedes implementation; sixteen families gate implementation", () => {
  const order = rfc.slice(rfc.indexOf("## 8. Implementation boundary and order"), rfc.indexOf("## Historical finding routing"));
  assert.match(order, /fresh independent buildability review executes the author-repair contract/u);
  assert.match(order, /only after acceptance, implement/u);
  assert.match(order, /all sixteen fixture families/u);
  assert.match(order, /does not pretend the unimplemented\s+engine already executes/u);
});
