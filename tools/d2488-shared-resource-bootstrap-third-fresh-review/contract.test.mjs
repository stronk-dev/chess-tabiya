// Disposable third fresh independent process/buildability review — D2488-D2494.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(file, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");
const parent = read("rfc/archive/shared-resource-registers.md");
const authorModel = read("tools/d2442-shared-resource-bootstrap-second-author-repair/model.mjs");

function section(startHeading, endHeading) {
  const start = rfc.indexOf(startHeading);
  const end = rfc.indexOf(endHeading, start + startHeading.length);
  assert.notEqual(start, -1, `missing ${startHeading}`);
  assert.notEqual(end, -1, `missing ${endHeading}`);
  return rfc.slice(start, end);
}

test("D2488: SharedResourceProjectionV1 is referenced but has no implementable shape", () => {
  assert.equal(rfc.match(/SharedResourceProjectionV1/gu)?.length, 1);
  assert.doesNotMatch(rfc, /(?:interface|type)\s+SharedResourceProjectionV1\b/u);
  assert.match(rfc, /Adapter configuration is data within the catalogue projection/u);
});

test("D2489: the exact initial population omits seven complete descriptor images", () => {
  const catalogue = section("## 1. One machine-readable catalogue", "## 2. Closed projection adapters");
  const roots = rfc.match(/```tabiya-resource-roots\n([\s\S]*?)\n```/u)?.[1]?.trim().split("\n") ?? [];
  assert.equal(roots.length, 3);
  for (const id of ["campaign-schema", "evidence-kinds", "migration", "pack-schema", "principle-entry-schema", "run-schema", "shape-entry-schema"]) {
    assert.ok(catalogue.includes("| `" + id + "` |"), `missing catalogue summary row ${id}`);
    assert.equal(roots.some((line) => line.startsWith(`${id} |`)), false);
  }
  assert.doesNotMatch(catalogue, /campaign-schema[^\n]*(?:introducedBy|claimMode|schemas\/)/u);
});

test("D2490: partial is normative but absent from ProjectedResource.state", () => {
  assert.match(rfc, /readonly state: "absent" \| "landed"/u);
  assert.match(rfc, /state is `partial`, never `absent`/u);
  assert.doesNotMatch(rfc, /(?:interface|type)\s+(?:Selector|Projection|Resolution)[A-Za-z]*Result[\s\S]{0,240}"partial"/u);
});

test("D2491: TypeScript closure has no closed external or builtin edge boundary", () => {
  const adapters = section("## 2. Closed projection adapters", "### 2.1 One canonical byte authority");
  assert.match(adapters, /called functions\/methods and referenced constants within the\s+repository/u);
  assert.match(adapters, /unclassified repository edge fails/u);
  assert.doesNotMatch(adapters, /external (?:edge|module|package|library)|builtin (?:edge|module)|node:|standard library/u);
});

test("D2492: three semantic images name normalization without defining it", () => {
  const adapters = section("## 2. Closed projection adapters", "### 2.1 One canonical byte authority");
  for (const phrase of ["normalized SQL body", "normalized union declaration", "complete declaration image"]) {
    assert.ok(adapters.includes(phrase), `missing review anchor ${phrase}`);
  }
  for (const adapter of ["migration_sequence@1", "literal_string_union@1", "versioned_declarations@1"]) {
    assert.equal(authorModel.includes(adapter), false, `author model unexpectedly implements ${adapter}`);
  }
});

test("D2493: README generation contradicts the parent boundary without a generated region", () => {
  assert.match(parent, /Why not generate `rfc\/README\.md`[\s\S]*?Check, do not generate/u);
  assert.match(rfc, /`rfc\/README\.md` renders its\s+human-readable catalogue and register sections/u);
  assert.doesNotMatch(rfc, /BEGIN GENERATED|END GENERATED|generated region|preserve[^\n]*non-derived bytes/u);
});

test("D2494: review is required to execute an implementation matrix the author model does not provide", () => {
  const order = section("## 8. Implementation boundary and order", "## Historical finding routing");
  assert.match(order, /fresh independent buildability review executes the sixteen fixture families/u);
  assert.match(order, /implement the generic catalogue\/projection\/lifecycle\/transition engine/u);
  assert.ok(order.indexOf("fresh independent") < order.indexOf("implement the generic"));
  for (const missing of [
    "json_schema_id@1", "migration_sequence@1", "literal_string_tuple@1",
    "literal_string_union@1", "typescript_contract@1", "versioned_declarations@1",
  ]) assert.equal(authorModel.includes(missing), false, `author model unexpectedly implements ${missing}`);
});
