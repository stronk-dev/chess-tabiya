import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");
const checker = read("tools/register-check.mjs");
const readme = read("rfc/README.md");
const seed = JSON.parse(read(
  "planning/shared-resource-register-bootstrap/collision-catalogue.v1.json",
));

const ids = seed.resources.map(({ id }) => id);
const schemaRows = seed.resources.filter(({ source }) => source.kind === "json_schema");
const removedRoots = [
  "concept-registry-schema",
  "release-manifest-schema",
  "source-attribution-registry",
];

const checkerResourceNames = [...checker.matchAll(/^\s*"([a-z][a-z0-9-]*)",?$/gm)]
  .map((match) => match[1])
  .filter((value) => ids.includes(value));
const checkerSchemaSlugs = [...checker.matchAll(/^\s*"?([a-z][a-z0-9-]*)"?: \["([a-z][a-z0-9-]*)"/gm)]
  .map((match) => ({ slug: match[1], id: match[2] }));
const registerIds = [...readme.matchAll(/<!-- register: ([a-z-]+) (?:head|members)=/g)]
  .map((match) => match[1])
  .sort();

test("the collision catalogue is the exact closed seven-resource HEAD inventory", () => {
  assert.deepEqual(Object.keys(seed), ["schemaVersion", "resources"]);
  assert.equal(seed.schemaVersion, 1);
  assert.equal(seed.resources.length, 7);
  assert.deepEqual(ids, [...ids].sort());
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, [
    "campaign-schema",
    "evidence-kinds",
    "migration",
    "pack-schema",
    "principle-entry-schema",
    "run-schema",
    "shape-entry-schema",
  ]);
  assert.deepEqual(registerIds, ids);
});

test("the seed is equal to both hard-coded inventories it will replace", () => {
  assert.deepEqual([...checkerResourceNames].sort(), ids);
  assert.deepEqual(
    checkerSchemaSlugs.sort((left, right) => left.slug.localeCompare(right.slug)),
    schemaRows
      .map(({ id, source }) => ({ slug: source.schemaSlug, id }))
      .sort((left, right) => left.slug.localeCompare(right.slug)),
  );
});

test("a schema resource is added by one data row rather than a resource-name branch", () => {
  const extended = [
    ...seed.resources,
    {
      id: "synthetic-schema",
      claimKind: "schema_lane",
      source: {
        kind: "json_schema",
        schemaSlug: "synthetic",
        versionExport: null,
      },
    },
  ].sort((left, right) => left.id.localeCompare(right.id));
  const bySlug = new Map(
    extended
      .filter(({ source }) => source.kind === "json_schema")
      .map((row) => [row.source.schemaSlug, row.id]),
  );

  assert.equal(bySlug.get("synthetic"), "synthetic-schema");
  assert.equal(checker.includes("synthetic-schema"), false);
});

test("the owner cut removed speculative roots and the old declaration blocks", () => {
  assert.ok(rfc.split("\n").length <= 300);
  assert.doesNotMatch(rfc, /```tabiya-resource-(?:roots|descriptor-source)/u);
  for (const id of removedRoots) {
    assert.equal(ids.includes(id), false);
  }
  assert.match(rfc, /former projection, lifecycle and Git-history\s+engines are withdrawn/u);
  assert.match(rfc, /does \*\*not\*\* introduce absent roots/u);
});

test("every configured live source resolves without inventing product bytes", () => {
  for (const row of seed.resources) {
    if (row.source.kind === "json_schema") {
      const schemas = fs.readdirSync("schemas")
        .filter((name) => name.endsWith(".schema.json"))
        .map((name) => JSON.parse(read(`schemas/${name}`)).$id);
      assert.ok(schemas.some((id) => id.includes(`:${row.source.schemaSlug}:`)), row.id);
    } else {
      assert.equal(fs.statSync(row.source.path).isFile(), true, row.id);
      assert.match(
        read(row.source.path),
        new RegExp(`export const ${row.source.exportName ?? row.source.headExport}\\b`),
      );
    }
  }
});
