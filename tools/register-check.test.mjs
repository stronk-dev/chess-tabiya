import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  checkC1,
  checkC2,
  checkC3,
  checkC4,
  checkC5,
  checkC6,
  checkC7,
  checkC8,
  deriveTree,
  derivedOutput,
  loadResourceCatalogue,
  locateClaimBlocks,
  parseActiveRfcRows,
  parseResourceCatalogue,
  readSchemaFiles,
} from "./register-check.mjs";
import * as registerCheck from "./register-check.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seed = () => JSON.parse(fs.readFileSync(path.join(repoRoot, "rfc/shared-resource-registers.json"), "utf8"));
const catalogue = loadResourceCatalogue(repoRoot);

const tree = {
  "pack-schema": { head: "1.2" },
  "run-schema": { head: "1.0" },
  "shape-entry-schema": { head: "0.3" },
  "principle-entry-schema": { head: "0.1" },
  "campaign-schema": { head: "1" },
  "concept-registry-schema": { head: "1" },
  migration: { head: 4 },
  "evidence-kinds": { members: ["alpha", "beta"] },
  "provider-protocol": { members: ["gamma"] },
  "semantic-conventions": { members: ["space_v1"] },
  "assistance-config": { members: ["assistance_config_v4"] },
  "workflow-preference": { members: ["workflow_preference_v1", "workflow_preference_v2"] },
  "import-source-protocol": { members: ["request_pgn", "source_pgn_paste"] },
};

const declaration = (body = "none") => `# RFC: fixture

\`\`\`tabiya-claims
${body}
\`\`\`

## Summary
fixture
`;

const claim = (overrides = {}) => ({
  rfc: "one.md",
  resource: "pack-schema",
  claim: "lane 1.3",
  changes: "$defs/example",
  ...overrides,
});

const registers = () => Object.entries(tree).map(([resource, value]) => ({
  resource,
  head: String(value.members !== undefined ? value.members.length : value.head),
  body: "",
  headCount: 1,
  digest: resource === "pack-schema" ? "aaaaaaaaaaaa" : resource === "campaign-schema" ? "bbbbbbbbbbbb" : null,
  landed: value.members !== undefined
    ? value.members.map((member) => ({ key: member, text: `${member} | seed | pre-register` }))
    : [{ key: String(value.head), text: `${value.head} | seed | landed` }],
  claims: [],
}));

test("shared active-table parser ignores non-RFC rows", () => {
  const markdown = `## Active
| RFC | Status |
|---|---|
| \`one.md\` | draft |
| prose | ignored |

## Archive
`;
  assert.deepEqual(parseActiveRfcRows(markdown), ["one.md"]);
});

test("C1 passes a ruled declaration and ignores a nested example", () => {
  const markdown = declaration("pack-schema | lane 1.3 | $defs/example") + `
\`\`\`\`
\`\`\`tabiya-claims
not | a | declaration
\`\`\`
\`\`\`\`
`;
  assert.equal(locateClaimBlocks(markdown).length, 1);
  assert.deepEqual(checkC1({ "one.md": markdown }, catalogue).errors, []);
});

test("C1 fails a staged-in-body declaration", () => {
  const markdown = `# RFC: fixture

## Summary

\`\`\`tabiya-claims
none
\`\`\`
`;
  assert.match(checkC1({ "one.md": markdown }, catalogue).errors[0], /not in the metadata preamble/);
});

test("C1 fails a declaration placed after the metadata rule", () => {
  const markdown = `# RFC: fixture

---

\`\`\`tabiya-claims
none
\`\`\`

## Summary
`;
  assert.match(checkC1({ "one.md": markdown }, catalogue).errors[0], /not in the metadata preamble/);
});

test("C2 passes a lane above head and fails one at head", () => {
  assert.deepEqual(checkC2([claim()], tree, catalogue), []);
  assert.match(checkC2([claim({ claim: "lane 1.2" })], tree, catalogue)[0], /not above tree head/);
});

test("C3 passes a declaration/register bijection", () => {
  const item = claim();
  const rows = registers();
  rows.find((row) => row.resource === item.resource).claims.push(item);
  assert.deepEqual(checkC3([item], rows, catalogue), []);
});

test("C3 fails two live documents claiming one lane", () => {
  const first = claim();
  const second = claim({ rfc: "two.md", changes: "$defs/other" });
  const rows = registers();
  rows.find((row) => row.resource === first.resource).claims.push(first, second);
  assert.match(checkC3([first, second], rows, catalogue).join("\n"), /collision/);
});

test("C4 passes complete landed heads and fails a missing member", () => {
  assert.deepEqual(checkC4(tree, registers(), catalogue), []);
  const rows = registers();
  rows.find((row) => row.resource === "evidence-kinds").landed.pop();
  assert.match(checkC4(tree, rows, catalogue)[0], /has no landed row/);
});

test("C4 fails a landed lane still advertised as held", () => {
  const rows = registers();
  rows[0].landed[0].text += " claimed and held";
  assert.match(checkC4(tree, rows, catalogue)[0], /still advertises/);
});

test("C5 passes positional migrations and fails a bare integer", () => {
  assert.deepEqual(checkC5([claim({ resource: "migration", claim: "position next" })], catalogue), []);
  assert.match(checkC5([claim({ resource: "migration", claim: "24" })], catalogue)[0], /bare integer/);
});

test("C6 passes tree-derived heads and fails a stale head", () => {
  assert.deepEqual(checkC6(tree, registers(), catalogue), []);
  const rows = registers();
  rows[0].head = "1.1";
  assert.match(checkC6(tree, rows, catalogue)[0], /disagrees with tree/);
});

test("C6 fails a hand-written next-free value", () => {
  const rows = registers();
  rows[0].body = "| — | next free 1.3 |";
  assert.match(checkC6(tree, rows, catalogue)[0], /hand-written next-free/);
});

const schemaFiles = () => [
  { filename: "drill_pack.schema.json", id: "urn:chess-tabiya:schema:drill-pack:0.28", slug: "drill-pack", version: "0.28", digest: "aaaaaaaaaaaa" },
  { filename: "drill_run.schema.json", id: "urn:chess-tabiya:schema:drill-run:0.17", slug: "drill-run", version: "0.17" },
  { filename: "shape_entry.schema.json", id: "urn:chess-tabiya:schema:shape-entry:0.3", slug: "shape-entry", version: "0.3" },
  { filename: "principle_entry.schema.json", id: "urn:chess-tabiya:schema:principle-entry:0.1", slug: "principle-entry", version: "0.1" },
  { filename: "campaign.schema.json", id: "urn:chess-tabiya:schema:campaign:1", slug: "campaign", version: "1", digest: "bbbbbbbbbbbb" },
  { filename: "concept_registry.schema.json", id: "urn:chess-tabiya:schema:concept-registry:1", slug: "concept-registry", version: "1" },
];

test("C7 accepts the schemas on disk today", () => {
  assert.deepEqual(checkC7(schemaFiles(), catalogue), []);
});

test("C7 refuses a versioned schema with no register resource", () => {
  const extra = { filename: "arena.schema.json", id: "urn:chess-tabiya:schema:arena:0.1", slug: "arena", version: "0.1" };
  assert.deepEqual(checkC7([...schemaFiles(), extra], catalogue), [
    "C7 arena.schema.json: schema slug arena has no register resource",
  ]);
});

test("C7 refuses a schema whose $id is not a versioned tabiya urn", () => {
  const loose = { filename: "loose.schema.json", id: "https://example.test/loose.json", slug: null, version: null };
  assert.deepEqual(checkC7([...schemaFiles(), loose], catalogue), [
    'C7 loose.schema.json: $id "https://example.test/loose.json" is not a versioned urn:chess-tabiya:schema id',
  ]);
});

test("C7 refuses a register resource whose schema left the tree", () => {
  const without = schemaFiles().filter((file) => file.slug !== "campaign");
  assert.deepEqual(checkC7(without, catalogue), ["C7 campaign-schema: no schema on disk carries slug campaign"]);
});

test("C2 refuses a lane versioned to a different depth than its head", () => {
  const errors = checkC2([claim({ resource: "campaign-schema", claim: "lane 1.1" })], tree, catalogue);
  assert.deepEqual(errors, ["C2 one.md: campaign-schema lane 1.1 has 2 version part(s); head 1 has 1"]);
});

test("C2 accepts a bare major lane on a bare major head", () => {
  assert.deepEqual(checkC2([claim({ resource: "campaign-schema", claim: "lane 2" })], tree, catalogue), []);
});

test("C8 passes when register digests match the schemas on disk", () => {
  const files = schemaFiles().filter((file) => ["drill-pack", "campaign"].includes(file.slug));
  assert.deepEqual(checkC8(files, registers(), [], catalogue), []);
});

test("C8 refuses an undeclared schema edit", () => {
  const files = [{ ...schemaFiles().find((file) => file.slug === "campaign"), digest: "cccccccccccc" }];
  assert.deepEqual(checkC8(files, registers(), [], catalogue), [
    "C8 campaign-schema: campaign.schema.json changed since the register was reconciled (register bbbbbbbbbbbb, disk cccccccccccc) and no live claim declares it",
  ]);
});

test("C8 allows an edit that a live claim declares", () => {
  const files = [{ ...schemaFiles().find((file) => file.slug === "campaign"), digest: "cccccccccccc" }];
  assert.deepEqual(checkC8(files, registers(), [claim({ resource: "campaign-schema", claim: "lane 2" })], catalogue), []);
});

test("C8 refuses a register that records no digest", () => {
  const files = [schemaFiles().find((file) => file.slug === "drill-run")];
  assert.deepEqual(checkC8(files, registers(), [], catalogue), [
    "C8 run-schema: register records no schema digest for drill_run.schema.json",
  ]);
});

// shared-resource-register-bootstrap §7 — the catalogue is the sole resource inventory.

const schemaDigest = (text) => crypto.createHash("sha256").update(text).digest("hex").slice(0, 12);

function syntheticRepository({ extraSchema = true, extraRow = true, extraRegister = true, mutate } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "register-check-"));
  const write = (relative, text) => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), text);
  };
  const schemas = { "base.schema.json": '{"$id":"urn:chess-tabiya:schema:base:0.1"}\n' };
  if (extraSchema) schemas["schema2.schema.json"] = '{"$id":"urn:chess-tabiya:schema:schema2:0.4"}\n';
  for (const [name, text] of Object.entries(schemas)) write(`schemas/${name}`, text);
  write("packages/schema/src/index.ts", 'export const BASE_SCHEMA_VERSION = "0.1";\n');
  write("apps/server/src/storage.ts", "export const STORAGE_VERSION = 2;\nconst m = [{ version: 1, name: \"a\" }, { version: 2, name: \"b\" }];\n");
  write("apps/server/src/kinds.ts", 'export const KINDS = [\n  "alpha",\n  "beta",\n] as const;\n');
  const resources = [
    { id: "base-schema", claimKind: "schema_lane", source: { kind: "json_schema", schemaSlug: "base", versionExport: "BASE_SCHEMA_VERSION" } },
    { id: "kinds", claimKind: "members", source: { kind: "string_tuple", path: "apps/server/src/kinds.ts", exportName: "KINDS" } },
    { id: "migration", claimKind: "migration_position", source: { kind: "storage_migrations", path: "apps/server/src/storage.ts", headExport: "STORAGE_VERSION" } },
  ];
  if (extraRow) resources.push({ id: "schema2-lane", claimKind: "schema_lane", source: { kind: "json_schema", schemaSlug: "schema2", versionExport: null } });
  resources.sort((left, right) => (left.id < right.id ? -1 : 1));
  const catalogueValue = { schemaVersion: 1, resources };
  mutate?.(catalogueValue, write);
  write("rfc/shared-resource-registers.json", JSON.stringify(catalogueValue));
  const lane = (id, head, file) => `## ${id} register\n\n<!-- register: ${id} head=${head} -->\n<!-- schema-digest: ${id} ${schemaDigest(schemas[file] ?? "absent")} -->\n\n### Landed\n\n| version | owner |\n|---|---|\n| ${head} | seed |\n\n### Live claims\n\n| claim | RFC | changes |\n|---|---|---|\n\n`;
  let readme = "# RFCs\n\n## Active\n\n| RFC | Status |\n|---|---|\n\n";
  readme += lane("base-schema", "0.1", "base.schema.json");
  if (extraRegister) readme += lane("schema2-lane", "0.4", "schema2.schema.json");
  readme += "## kinds register\n\n<!-- register: kinds members=2 -->\n\n### Landed\n\n| member | owner |\n|---|---|\n| alpha | seed |\n| beta | seed |\n\n";
  readme += "## migration register\n\n<!-- register: migration head=2 -->\n\n### Landed\n\n| migration | owner |\n|---|---|\n| 2 | seed |\n\n## Archive\n";
  write("rfc/README.md", readme);
  return root;
}

test("§7.1 the exact seven-row seed parses, sorted and unique", () => {
  const ids = catalogue.resources.map(({ id }) => id);
  const seven = [
    "campaign-schema", "evidence-kinds", "migration", "pack-schema",
    "principle-entry-schema", "run-schema", "shape-entry-schema",
  ];
  // The reviewed seed's seven rows survive unchanged; every row added since is one data row from a
  // later RFC (§1 extension property): provider-protocol-register.md adds `provider-protocol`, and
  // concept-registry.md adds `concept-registry-schema` through the existing json_schema reader, and
  // semantic-convention-register.md adds `semantic-conventions` and assistance-config-register.md adds
  // `assistance-config` and `workflow-preference`, all through the string_tuple reader.
  const reviewedSeed = JSON.parse(fs.readFileSync(path.join(repoRoot, "planning/shared-resource-register-bootstrap/collision-catalogue.v1.json"), "utf8"));
  assert.deepEqual(reviewedSeed.resources.map(({ id }) => id), seven);
  assert.deepEqual(seed().resources.filter(({ id }) => seven.includes(id)), reviewedSeed.resources);
  assert.deepEqual(ids, [...seven, "provider-protocol", "concept-registry-schema", "semantic-conventions", "assistance-config", "workflow-preference", "import-source-protocol"].sort());
  // import-source-protocol-register.md adds `import-source-protocol` through the string_tuple reader.
  assert.deepEqual(seed().resources.find(({ id }) => id === "import-source-protocol"), {
    id: "import-source-protocol",
    claimKind: "members",
    source: { kind: "string_tuple", path: "packages/runtime/src/import-source-protocol.ts", exportName: "IMPORT_SOURCE_PROTOCOL_MEMBERS" },
  });
  assert.deepEqual(seed().resources.find(({ id }) => id === "semantic-conventions"), {
    id: "semantic-conventions",
    claimKind: "members",
    source: { kind: "string_tuple", path: "packages/runtime/src/evidence-conventions.ts", exportName: "SEMANTIC_CONVENTION_MEMBERS" },
  });
  assert.deepEqual(seed().resources.find(({ id }) => id === "concept-registry-schema"), {
    id: "concept-registry-schema",
    claimKind: "schema_lane",
    source: { kind: "json_schema", schemaSlug: "concept-registry", versionExport: "CONCEPT_REGISTRY_SCHEMA_LANE" },
  });
  assert.deepEqual(seed().resources.find(({ id }) => id === "provider-protocol"), {
    id: "provider-protocol",
    claimKind: "members",
    source: { kind: "string_tuple", path: "packages/runtime/src/provider-protocol.ts", exportName: "PROVIDER_PROTOCOL_MEMBERS" },
  });
});

test("§7.2 deleting, duplicating, renaming, extra keys and aliases fail", () => {
  const parse = (mutate) => () => {
    const value = seed();
    mutate(value);
    return parseResourceCatalogue(value, { root: repoRoot });
  };
  assert.throws(parse((value) => { value.resources = []; }), /non-empty/);
  assert.throws(parse((value) => { value.resources.splice(1, 0, structuredClone(value.resources[1])); }), /already claimed|duplicate/);
  assert.throws(parse((value) => { value.resources[0].id = "Campaign"; }), /malformed id/);
  assert.throws(parse((value) => { value.resources[0].id = "zzz-schema"; }), /ASCII-sorted/);
  assert.throws(parse((value) => { value.resources[0].extra = true; }), /keys must be exactly/);
  assert.throws(parse((value) => { value.resources[0].source.extra = true; }), /source keys/);
  assert.throws(parse((value) => { value.extra = true; }), /envelope/);
  assert.throws(parse((value) => { value.schemaVersion = 2; }), /schemaVersion/);
  assert.throws(parse((value) => { value.resources.find(({ id }) => id === "campaign-schema").claimKind = "members"; }), /requires source/);
  // Alias: a second id naming pack-schema's slug.
  assert.throws(parse((value) => {
    value.resources.push({ id: "zz-alias", claimKind: "schema_lane", source: { kind: "json_schema", schemaSlug: "drill-pack", versionExport: null } });
  }), /already claimed by pack-schema/);
});

test("§7.3 duplicate slugs and normalized or symlinked path/export identities fail", () => {
  const root = syntheticRepository();
  fs.symlinkSync(path.join(root, "apps/server/src/kinds.ts"), path.join(root, "apps/server/src/kinds-link.ts"));
  const value = JSON.parse(fs.readFileSync(path.join(root, "rfc/shared-resource-registers.json"), "utf8"));
  const withRow = (row) => ({ ...value, resources: [...value.resources, row].sort((l, r) => (l.id < r.id ? -1 : 1)) });
  assert.throws(() => parseResourceCatalogue(withRow({ id: "zz-link", claimKind: "members", source: { kind: "string_tuple", path: "apps/server/src/kinds-link.ts", exportName: "KINDS" } }), { root }), /already claimed by kinds/);
  assert.throws(() => parseResourceCatalogue(withRow({ id: "zz-dot", claimKind: "members", source: { kind: "string_tuple", path: "apps/server/./src/kinds.ts", exportName: "KINDS" } }), { root }), /already claimed by kinds/);
  assert.throws(() => parseResourceCatalogue(withRow({ id: "zz-up", claimKind: "members", source: { kind: "string_tuple", path: "../outside.ts", exportName: "KINDS" } }), { root }), /without \.\./);
  assert.throws(() => parseResourceCatalogue(withRow({ id: "zz-abs", claimKind: "members", source: { kind: "string_tuple", path: "/etc/hosts", exportName: "KINDS" } }), { root }), /repository-relative/);
  assert.throws(() => parseResourceCatalogue(withRow({ id: "zz-dir", claimKind: "members", source: { kind: "string_tuple", path: "apps/server", exportName: "KINDS" } }), { root }), /regular file/);
  assert.throws(() => parseResourceCatalogue(withRow({ id: "zz-bad", claimKind: "members", source: { kind: "string_tuple", path: "apps/server/src/kinds.ts", exportName: "not-an-id" } }), { root }), /JavaScript identifier/);
});

test("§7.4 and §7.6 a digit-bearing already-present schema is one catalogue row, no checker edit", () => {
  const result = registerCheck.auditRepository(syntheticRepository());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.tree["schema2-lane"], { head: "0.4" });
  assert.match(derivedOutput(result).join("\n"), /schema2-lane: head 0\.4; next free 0\.5/);
});

test("§7.5 neither former code inventory exists", () => {
  assert.equal("RESOURCE_NAMES" in registerCheck, false);
  assert.equal("SCHEMA_SLUGS" in registerCheck, false);
  const source = fs.readFileSync(path.join(repoRoot, "tools/register-check.mjs"), "utf8");
  assert.doesNotMatch(source, /RESOURCE_NAMES|SCHEMA_SLUGS/);
  for (const { id } of catalogue.resources) assert.doesNotMatch(source, new RegExp(`"${id}"`));
});

test("§7.7 the synthetic schema without its row, or its row without the schema, fails C7", () => {
  const noRow = registerCheck.auditRepository(syntheticRepository({ extraRow: false, extraRegister: false }));
  assert.ok(noRow.errors.includes("C7 schema2.schema.json: schema slug schema2 has no register resource"), noRow.errors.join("\n"));
  const noSchema = registerCheck.auditRepository(syntheticRepository({ extraSchema: false }));
  assert.ok(noSchema.errors.includes("C7 schema2-lane: no schema on disk carries slug schema2"), noSchema.errors.join("\n"));
});

test("§7.8 an unknown claim resource fails even with a same-named README section", () => {
  const block = { lines: ["ghost-schema | lane 1 | $defs/x"] };
  assert.throws(() => registerCheck.parseClaimBlock(block, "one.md", catalogue), /unknown resource ghost-schema/);
  const rows = registers();
  rows.push({ ...rows[0], resource: "ghost-schema" });
  assert.match(checkC6(tree, rows, catalogue).join("\n"), /ghost-schema: register section names a resource absent from the catalogue/);
});

test("§7.9 two RFCs claiming one synthetic lane collide; a leading-zero lane is refused", () => {
  const synthetic = loadResourceCatalogue(syntheticRepository());
  const one = { rfc: "one.md", resource: "schema2-lane", claim: "lane 0.5", changes: "a" };
  const two = { ...one, rfc: "two.md", changes: "b" };
  assert.match(checkC3([one, two], [], synthetic).join("\n"), /collision: one\.md and two\.md both claim schema2-lane\|lane 0\.5/);
  assert.throws(() => registerCheck.parseClaimBlock({ lines: ["schema2-lane | lane 0.05 | a"] }, "one.md", synthetic), /invalid schema claim/);
});

test("§7.10 a missing or extra register section fails set equality", () => {
  const missing = registerCheck.auditRepository(syntheticRepository({ extraRegister: false }));
  assert.ok(missing.errors.includes("C6 schema2-lane: expected exactly one register section, found 0"), missing.errors.join("\n"));
  const extra = registerCheck.auditRepository(syntheticRepository({ extraRow: false }));
  assert.match(extra.errors.join("\n"), /C6 schema2-lane: register section names a resource absent from the catalogue/);
});

test("§7.11 two schema files with one slug fail before tree derivation", () => {
  const root = syntheticRepository();
  fs.writeFileSync(path.join(root, "schemas/copy.schema.json"), '{"$id":"urn:chess-tabiya:schema:base:0.2"}\n');
  assert.throws(() => readSchemaFiles(root), /schema slug base is carried by both/);
  assert.throws(() => registerCheck.auditRepository(root), /schema slug base/);
});

test("§7.12 missing or mismatched exports and invalid tuples fail", () => {
  const mismatched = syntheticRepository({ mutate: (_value, write) => write("packages/schema/src/index.ts", 'export const BASE_SCHEMA_VERSION = "0.9";\n') });
  assert.throws(() => deriveTree(mismatched), /BASE_SCHEMA_VERSION 0\.9 disagrees/);
  const missing = syntheticRepository({ mutate: (_value, write) => write("packages/schema/src/index.ts", "\n") });
  assert.throws(() => deriveTree(missing), /cannot derive BASE_SCHEMA_VERSION/);
  for (const [body, pattern] of [
    ['"alpha",\n  ...OTHER,', /not a string literal/],
    ['"alpha",\n  "alpha",', /duplicate members/],
    ['"alpha",\n  7,', /not a string literal/],
    ['"alpha",\n  [computed],', /not a string literal|cannot derive/],
  ]) {
    const root = syntheticRepository({ mutate: (_value, write) => write("apps/server/src/kinds.ts", `export const KINDS = [\n  ${body}\n] as const;\n`) });
    assert.throws(() => deriveTree(root), pattern);
  }
  const noTuple = syntheticRepository({ mutate: (_value, write) => write("apps/server/src/kinds.ts", "export const OTHER = [] as const;\n") });
  assert.throws(() => deriveTree(noTuple), /cannot derive literal tuple KINDS/);
});

test("§7.13 caller mutation after admission leaves the admitted image unchanged", () => {
  const value = seed();
  const admitted = parseResourceCatalogue(value, { root: repoRoot });
  const index = value.resources.findIndex(({ id }) => id === "campaign-schema");
  value.resources[index].id = "mutated";
  value.resources[index].source.schemaSlug = "mutated";
  value.resources.pop();
  assert.equal(admitted.resources.length, seed().resources.length);
  assert.equal(admitted.resources[index].id, "campaign-schema");
  assert.equal(admitted.resources[index].source.schemaSlug, "campaign");
  assert.ok(Object.isFrozen(admitted.resources[index].source));
});

test("§7.14 the implementation carries no removed scope or speculative root", () => {
  const source = fs.readFileSync(path.join(repoRoot, "tools/register-check.mjs"), "utf8");
  for (const forbidden of [
    "typescript_contract", "canonical_resource", "versioned_declarations", "adopted",
    "first-parent", "release-manifest", "concept-registry-schema", "source-attribution-registry",
  ]) assert.doesNotMatch(source, new RegExp(forbidden), forbidden);
  assert.doesNotMatch(source, /child_process|git /);
});

// provider-protocol-register.md: the resource enters through the existing string_tuple reader.
test("provider-protocol members: the real source derives, one operation claimed twice collides, dotted ids are refused", () => {
  const real = deriveTree(repoRoot);
  assert.ok(Array.isArray(real["provider-protocol"].members), "the committed tuple is present and derives");
  const body = "provider-protocol | members maia_policy_page_v1 | one operation";
  const first = checkC1({ "one.md": declaration(body) }, catalogue);
  const second = checkC1({ "two.md": declaration(body) }, catalogue);
  assert.deepEqual([...first.errors, ...second.errors], []);
  assert.match(checkC3([...first.claims, ...second.claims], [], catalogue).join("\n"), /collision: one\.md and two\.md both claim provider-protocol\|maia_policy_page_v1/);
  assert.match(checkC1({ "one.md": declaration("provider-protocol | members maia.policy_page@1 | dotted") }, catalogue).errors[0], /invalid member claim/);
  assert.match(checkC1({ "one.md": declaration("provider-protocol | first lane 1 | whole projection") }, catalogue).errors[0], /invalid member claim/);
});

// semantic-convention-register.md ([[D2466]]): the lineage resource enters through the existing
// string_tuple reader. Collision identity is the member (`id_vN`), so two RFCs claiming one next
// version collide while disjoint ids and disjoint versions do not; `@` refs are refused.
test("semantic-conventions members: the real source derives, one next version claimed twice collides, raw refs are refused", () => {
  const real = deriveTree(repoRoot);
  assert.ok(Array.isArray(real["semantic-conventions"].members), "the committed tuple is present and derives");
  const first = checkC1({ "one.md": declaration("semantic-conventions | members space_v2 | successor") }, catalogue);
  const second = checkC1({ "two.md": declaration("semantic-conventions | members space_v2, threat_v2 | successors") }, catalogue);
  const disjoint = checkC1({ "three.md": declaration("semantic-conventions | members threat_v3 | disjoint") }, catalogue);
  assert.deepEqual([...first.errors, ...second.errors, ...disjoint.errors], []);
  const collisions = checkC3([...first.claims, ...second.claims, ...disjoint.claims], [], catalogue).filter((error) => error.startsWith("C3 collision"));
  assert.deepEqual(collisions, ["C3 collision: one.md and two.md both claim semantic-conventions|space_v2"]);
  assert.match(checkC1({ "one.md": declaration("semantic-conventions | members space@2 | raw ref") }, catalogue).errors[0], /invalid member claim/);
  assert.match(checkC1({ "one.md": declaration("semantic-conventions | members defence-duty_v1 | hyphen") }, catalogue).errors[0], /invalid member claim/);
});

// assistance-config-register.md ([[D2454]]): config and workflow versions enter as member tuples, so a
// second claimant of one next version collides and a lane grammar is refused.
test("assistance-config and workflow-preference members: the real sources derive and one next version collides", () => {
  const real = deriveTree(repoRoot);
  assert.deepEqual(real["assistance-config"].members, ["assistance_config_v4"]);
  assert.deepEqual(real["workflow-preference"].members, ["workflow_preference_v1", "workflow_preference_v2"]);
  const first = checkC1({ "hint-distance.md": declaration("assistance-config | members assistance_config_v5 | config v5") }, catalogue);
  const second = checkC1({ "other.md": declaration("assistance-config | members assistance_config_v5 | competing v5") }, catalogue);
  assert.deepEqual([...first.errors, ...second.errors], []);
  assert.match(checkC3([...first.claims, ...second.claims], [], catalogue).join("\n"), /collision: hint-distance\.md and other\.md both claim assistance-config\|assistance_config_v5/);
  assert.match(checkC1({ "one.md": declaration("workflow-preference | lane 2 | whole projection") }, catalogue).errors[0], /invalid member claim/);
});

// import-source-protocol-register.md criteria 2-4, corrected to the implemented members grammar.
test("import-source-protocol members: the seeded tuple derives, live-sources' exact claim passes, and wrong claims fail", () => {
  const real = deriveTree(repoRoot);
  assert.deepEqual(real["import-source-protocol"].members, ["request_lichess", "request_pgn", "source_lichess_url", "source_pgn_paste"]);
  const exact = "import-source-protocol | members request_broadcast, source_lichess_broadcast | broadcast pair";
  const liveSources = checkC1({ "live-sources.md": declaration(exact) }, catalogue);
  assert.deepEqual(liveSources.errors, []);
  const second = checkC1({ "other.md": declaration("import-source-protocol | members source_lichess_broadcast | same member") }, catalogue);
  assert.match(checkC3([...liveSources.claims, ...second.claims], [], catalogue).join("\n"), /collision: live-sources\.md and other\.md both claim import-source-protocol\|source_lichess_broadcast/);
  assert.match(checkC1({ "live-sources.md": declaration("import-source-protocol | first lane 1 | whole projection") }, catalogue).errors[0], /invalid member claim/);
  assert.match(checkC1({ "live-sources.md": declaration("import-source-protocol | members lichess-broadcast | hyphen") }, catalogue).errors[0], /invalid member claim/);
  assert.ok(checkC1({ "live-sources.md": declaration("import-sources-protocol | members request_broadcast | renamed") }, catalogue).errors.length > 0);
  // The committed live-sources.md carries exactly that claim.
  const committed = fs.readFileSync(path.join(repoRoot, "rfc/live-sources.md"), "utf8");
  assert.match(committed, /^import-source-protocol \| members request_broadcast, source_lichess_broadcast \| /m);
});
