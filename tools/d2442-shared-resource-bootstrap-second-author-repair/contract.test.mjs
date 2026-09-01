import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  assertAdoption,
  assertCanonicalResource,
  canonicalSharedResourceBytes,
  projectCanonicalResource,
  selectorState,
  sharedResourceDigest,
  validateSelectorPopulation,
} from "./model.mjs";

test("canonical bytes are key-order independent and array-order sensitive", () => {
  const left = { resolver: "exact", rows: [{ id: "b", value: 2 }, { id: "a", value: 1 }] };
  const right = { rows: [{ value: 2, id: "b" }, { value: 1, id: "a" }], resolver: "exact" };
  assert.deepEqual(canonicalSharedResourceBytes(left), canonicalSharedResourceBytes(right));
  assert.equal(sharedResourceDigest(left), sharedResourceDigest(right));
  assert.notEqual(sharedResourceDigest(left), sharedResourceDigest({ ...left, rows: [...left.rows].reverse() }));
});

test("all semantic payload fields, including policy, move the resource digest", () => {
  const base = { rows: [{ id: "engine", label: "Engine" }], resolver: "by_source_id", missingReceiptField: "refuse" };
  assert.notEqual(sharedResourceDigest(base), sharedResourceDigest({ ...base, resolver: "by_projection" }));
  assert.notEqual(sharedResourceDigest(base), sharedResourceDigest({ ...base, missingReceiptField: "omit" }));
});

test("unsupported canonical values fail closed", () => {
  for (const value of [1.5, -0, undefined, 1n, () => {}, new Date(0), new Map(), [, 1]]) {
    assert.throws(() => canonicalSharedResourceBytes(value));
  }
  assert.throws(() => canonicalSharedResourceBytes("\ud800"));
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalSharedResourceBytes(cyclic));
});

test("absence is selector-level, paths may repeat, and partial roots fail distinctly", () => {
  const selectors = ["packages/runtime/src/shared.ts#export:A", "packages/runtime/src/shared.ts#export:A.version"];
  assert.equal(selectorState(selectors, []), "absent");
  assert.equal(selectorState(selectors, [selectors[0]]), "partial");
  assert.equal(selectorState(selectors, selectors), "landed");
  assert.doesNotThrow(() => validateSelectorPopulation([
    { selectors: [selectors[0]] },
    { selectors: ["packages/runtime/src/shared.ts#export:B"] },
  ]));
  assert.throws(() => validateSelectorPopulation([{ selectors: [selectors[0]] }, { selectors: [selectors[0]] }]));
});

test("adoption pins current bytes without inventing history or accepting a product change", () => {
  const base = {
    registered: false,
    selectorState: "landed",
    projectedDigest: "sha256:current",
  };
  assert.doesNotThrow(() => assertAdoption({
    before: base,
    after: {
      introduction: "adopted",
      selectorState: "landed",
      projectedDigest: "sha256:current",
      head: 4,
      liveClaims: 0,
      landedRows: ["adopted@4"],
    },
  }));
  assert.throws(() => assertAdoption({
    before: base,
    after: {
      introduction: "adopted",
      selectorState: "landed",
      projectedDigest: "sha256:changed",
      head: 4,
      liveClaims: 0,
      landedRows: ["adopted@4"],
    },
  }), /changed product projection/);
  assert.throws(() => assertAdoption({
    before: base,
    after: {
      introduction: "adopted",
      selectorState: "landed",
      projectedDigest: "sha256:current",
      head: 4,
      liveClaims: 0,
      landedRows: ["1", "2", "3", "adopted@4"],
    },
  }), /one current baseline/);
});

test("canonical resources are atomic and seal their complete payload", () => {
  const payload = { rows: [], resolver: "by_source_id", missingReceiptField: "refuse" };
  const complete = {
    id: "source-attribution-registry",
    version: 1,
    payload,
    digest: sharedResourceDigest({ id: "source-attribution-registry", version: 1, payload }),
  };
  assert.doesNotThrow(() => assertCanonicalResource("source-attribution-registry", complete));
  assert.throws(() => assertCanonicalResource("source-attribution-registry", { ...complete, digest: undefined }));
  assert.throws(() => assertCanonicalResource("source-attribution-registry", {
    ...complete,
    resolver: complete.payload.resolver,
  }));
});

test("adapter behavior is independent of resource id", () => {
  for (const id of ["source-attribution-registry", "synthetic-second-resource"]) {
    const descriptor = { id, adapter: "canonical_resource@1" };
    const payload = { rows: [], policy: "closed" };
    const value = { id, version: 1, payload, digest: sharedResourceDigest({ id, version: 1, payload }) };
    assert.equal(projectCanonicalResource(descriptor, value).identity.version, 1);
  }
});

test("the repaired RFC declares one engine, adoption, exact canonical bytes and downstream rebases", () => {
  const rfc = fs.readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");
  for (const required of [
    "[[D2442]]",
    "[[D2443]]",
    "[[D2444]]",
    "[[D2465]]",
    "[[D2466]]",
    "canonicalSharedResourceBytes",
    "unregistered -> adopted",
    "versioned_declarations@1",
    "resource-scoped",
  ]) assert.ok(rfc.includes(required), "missing " + required);
  assert.match(rfc, /no longer add C9, C10 or C11/);
  assert.match(rfc, /Fresh independent review is required; no\s+implementation is authorized/);
});
