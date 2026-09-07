import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
const checkerSchemaSlugs = [...checker.matchAll(/^\s*"?([a-z][a-z0-9-]*)"?: \["([a-z][a-z0-9-]*)", (null|"([A-Z][A-Z0-9_]*)")\],?$/gm)]
  .map((match) => ({ slug: match[1], id: match[2], versionExport: match[3] === "null" ? null : match[4] }));
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
      .map(({ id, source }) => ({ slug: source.schemaSlug, id, versionExport: source.versionExport }))
      .sort((left, right) => left.slug.localeCompare(right.slug)),
  );
});

test("the seed demonstrates the data-row shape without claiming an executed extension", () => {
  const extended = [
    ...seed.resources,
    {
      id: "synthetic2-schema",
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

  assert.equal(bySlug.get("synthetic"), "synthetic2-schema");
  assert.match(bySlug.get("synthetic"), /\d/u);
  assert.equal(checker.includes("synthetic2-schema"), false);
  assert.match(rfc, /synthetic \*\*already-present\*\* schema/u);
  assert.match(rfc, /implementation contract proves the executable\s+extension property/u);
});

test("the repaired contract closes source aliases, lane spelling and id grammar", () => {
  const sourceIdentity = ({ source }) => source.kind === "json_schema"
    ? `schema:${source.schemaSlug}`
    : `path:${path.relative(process.cwd(), fs.realpathSync(source.path))}:${source.exportName ?? source.headExport}`;
  assert.equal(new Set(seed.resources.map(sourceIdentity)).size, seed.resources.length);
  const crossKindAlias = [
    seed.resources.find(({ id }) => id === "migration"),
    {
      id: "storage-version-members",
      claimKind: "members",
      source: {
        kind: "string_tuple",
        path: "apps/server/src/storage.ts",
        exportName: "STORAGE_VERSION",
      },
    },
  ];
  assert.equal(new Set(crossKindAlias.map(sourceIdentity)).size, 1);
  assert.match(rfc, /canonical source identity/u);
  assert.match(rfc, /no leading-zero component/u);
  assert.match(rfc, /exported claim\/register id pattern/u);
  assert.equal(/^[a-z][a-z0-9-]*$/.test("schema2"), true);
});

test("the owner cut removed speculative roots and the old declaration blocks", () => {
  assert.ok(rfc.split("\n").length <= 300);
  assert.doesNotMatch(rfc, /```tabiya-resource-(?:roots|descriptor-source)/u);
  for (const id of removedRoots) {
    assert.equal(ids.includes(id), false);
  }
  assert.match(rfc, /former projection, lifecycle and Git-history\s+engines are withdrawn/u);
  assert.match(rfc, /does \*\*not\*\* introduce absent roots/u);
  assert.match(rfc, /does not solve\s+\[\[D2363\]\]'s separate absent-source admission deadlock/u);
  assert.doesNotMatch(rfc, /regular tracked\s+file/u);
});

test("every configured live source resolves without inventing product bytes", () => {
  const schemaIndex = read("packages/schema/src/index.ts");
  for (const row of seed.resources) {
    if (row.source.kind === "json_schema") {
      const schemas = fs.readdirSync("schemas")
        .filter((name) => name.endsWith(".schema.json"))
        .map((name) => JSON.parse(read(`schemas/${name}`)).$id)
        .map((id) => /^urn:chess-tabiya:schema:([a-z-]+):([0-9.]+)$/.exec(id))
        .filter(Boolean);
      const schema = schemas.find((match) => match[1] === row.source.schemaSlug);
      assert.ok(schema, row.id);
      if (row.source.versionExport !== null) {
        const escaped = row.source.versionExport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matches = [...schemaIndex.matchAll(new RegExp(`export const ${escaped} = \"([0-9.]+)\"`, "g"))];
        assert.equal(matches.length, 1, row.source.versionExport);
        assert.equal(matches[0][1], schema[2], row.source.versionExport);
      }
    } else {
      assert.equal(fs.statSync(row.source.path).isFile(), true, row.id);
      assert.match(
        read(row.source.path),
        new RegExp(`export const ${row.source.exportName ?? row.source.headExport}\\b`),
      );
    }
  }
  const ownerByItem = new Map([
    ["D2454", "assistance-and-presentation"],
    ["D2455", "release-engineering"],
    ["D2466", "release-engineering"],
  ]);
  for (const [id, owner] of ownerByItem) {
    assert.match(rfc, new RegExp(`\\[\\[${id}\\]\\].*\\[\\[D3034\\]\\].*${owner}.*2026-09-08`, "u"));
  }
  assert.match(rfc, /work-state\s+records do\s+not grow a forbidden date field/u);
});
