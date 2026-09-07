// DISPOSABLE fresh independent review harness — D3116-D3119.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { checkC3, compareVersions } from "../register-check.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");
const checker = read("tools/register-check.mjs");
const seed = JSON.parse(read(
  "planning/shared-resource-register-bootstrap/collision-catalogue.v1.json",
));

const exactKeys = (value, expected) => {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
};

function explicitCatalogueAdmission(resources) {
  const errors = [];
  const ids = resources.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) errors.push("duplicate id");
  if (ids.some((id) => !/^[a-z][a-z0-9-]*$/.test(id))) errors.push("invalid id");
  const schemaSlugs = resources
    .filter(({ source }) => source.kind === "json_schema")
    .map(({ source }) => source.schemaSlug);
  if (new Set(schemaSlugs).size !== schemaSlugs.length) errors.push("duplicate schema slug");
  for (const row of resources) {
    exactKeys(row, ["id", "claimKind", "source"]);
    const expectedKind = {
      schema_lane: "json_schema",
      migration_position: "storage_migrations",
      members: "string_tuple",
    }[row.claimKind];
    if (row.source.kind !== expectedKind) errors.push("kind mismatch");
  }
  return errors;
}

const sourceIdentity = ({ source }) => {
  if (source.kind === "json_schema") return `schema:${source.schemaSlug}`;
  return `${source.kind}:${source.path}:${source.exportName ?? source.headExport}`;
};

test("D3116 two catalogue ids can alias one tuple authority and evade resource collision", () => {
  const evidenceKinds = seed.resources.find(({ id }) => id === "evidence-kinds");
  const aliased = [...seed.resources, { ...evidenceKinds, id: "evidence-kinds-shadow" }]
    .sort((left, right) => left.id.localeCompare(right.id));

  assert.deepEqual(explicitCatalogueAdmission(aliased), []);
  const identities = aliased.map(sourceIdentity);
  assert.notEqual(new Set(identities).size, identities.length);
});

test("D3117 equivalent schema lanes retain different collision keys", () => {
  const claims = [
    { rfc: "one.md", resource: "pack-schema", claim: "lane 0.29", changes: "$defs/one" },
    { rfc: "two.md", resource: "pack-schema", claim: "lane 00.29", changes: "$defs/two" },
  ];
  const register = [{ resource: "pack-schema", claims, landed: [], head: "0.28", headCount: 1, body: "" }];

  assert.equal(compareVersions("0.29", "00.29"), 0);
  assert.equal(checkC3(claims, register).some((error) => error.includes("C3 collision")), false);
});

test("D3118 the admitted id grammar is wider than the retained register marker reader", () => {
  assert.match(rfc, /\^\[a-z\]\[a-z0-9-\]\*\$/u);
  const marker = "<!-- register: schema2 head=0.1 -->";
  const retainedReader = /<!-- register: ([a-z-]+) (?:head|members)=([^ ]+) -->/g;

  assert.equal(/^[a-z][a-z0-9-]*$/.test("schema2"), true);
  assert.equal(retainedReader.exec(marker), null);
  assert.match(checker, /register: \(\[a-z-\]\+\)/u);
});

test("D3119 the reviewed author equality image ignores every live versionExport binding", () => {
  const mutated = structuredClone(seed);
  const pack = mutated.resources.find(({ id }) => id === "pack-schema");
  pack.source.versionExport = "NO_SUCH_VERSION_EXPORT";

  const ids = (value) => value.resources.map(({ id }) => id);
  const slugs = (value) => value.resources
    .filter(({ source }) => source.kind === "json_schema")
    .map(({ id, source }) => ({ id, slug: source.schemaSlug }));

  assert.deepEqual(ids(mutated), ids(seed));
  assert.deepEqual(slugs(mutated), slugs(seed));
  assert.doesNotMatch(read("packages/schema/src/index.ts"), /NO_SUCH_VERSION_EXPORT/u);
  // This is the reviewed pre-repair equality projection: id + slug only.
  const reviewedImage = (value) => value.resources
    .filter(({ source }) => source.kind === "json_schema")
    .map(({ id, source }) => ({ id, slug: source.schemaSlug }));
  assert.deepEqual(reviewedImage(mutated), reviewedImage(seed));
});
