import assert from "node:assert/strict";
import test from "node:test";

import {
  checkC1,
  checkC2,
  checkC3,
  checkC4,
  checkC5,
  checkC6,
  checkC7,
  checkC8,
  locateClaimBlocks,
  parseActiveRfcRows,
} from "./register-check.mjs";

const tree = {
  "pack-schema": { head: "1.2" },
  "run-schema": { head: "1.0" },
  "shape-entry-schema": { head: "0.3" },
  "principle-entry-schema": { head: "0.1" },
  "campaign-schema": { head: "1" },
  migration: { head: 4 },
  "evidence-kinds": { members: ["alpha", "beta"] },
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
  head: String(resource === "evidence-kinds" ? value.members.length : value.head),
  body: "",
  headCount: 1,
  digest: resource === "pack-schema" ? "aaaaaaaaaaaa" : resource === "campaign-schema" ? "bbbbbbbbbbbb" : null,
  landed: resource === "evidence-kinds"
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
  assert.deepEqual(checkC1({ "one.md": markdown }).errors, []);
});

test("C1 fails a staged-in-body declaration", () => {
  const markdown = `# RFC: fixture

## Summary

\`\`\`tabiya-claims
none
\`\`\`
`;
  assert.match(checkC1({ "one.md": markdown }).errors[0], /not in the metadata preamble/);
});

test("C1 fails a declaration placed after the metadata rule", () => {
  const markdown = `# RFC: fixture

---

\`\`\`tabiya-claims
none
\`\`\`

## Summary
`;
  assert.match(checkC1({ "one.md": markdown }).errors[0], /not in the metadata preamble/);
});

test("C2 passes a lane above head and fails one at head", () => {
  assert.deepEqual(checkC2([claim()], tree), []);
  assert.match(checkC2([claim({ claim: "lane 1.2" })], tree)[0], /not above tree head/);
});

test("C3 passes a declaration/register bijection", () => {
  const item = claim();
  const rows = registers();
  rows.find((row) => row.resource === item.resource).claims.push(item);
  assert.deepEqual(checkC3([item], rows), []);
});

test("C3 fails two live documents claiming one lane", () => {
  const first = claim();
  const second = claim({ rfc: "two.md", changes: "$defs/other" });
  const rows = registers();
  rows.find((row) => row.resource === first.resource).claims.push(first, second);
  assert.match(checkC3([first, second], rows).join("\n"), /collision/);
});

test("C4 passes complete landed heads and fails a missing member", () => {
  assert.deepEqual(checkC4(tree, registers()), []);
  const rows = registers();
  rows.find((row) => row.resource === "evidence-kinds").landed.pop();
  assert.match(checkC4(tree, rows)[0], /has no landed row/);
});

test("C4 fails a landed lane still advertised as held", () => {
  const rows = registers();
  rows[0].landed[0].text += " claimed and held";
  assert.match(checkC4(tree, rows)[0], /still advertises/);
});

test("C5 passes positional migrations and fails a bare integer", () => {
  assert.deepEqual(checkC5([claim({ resource: "migration", claim: "position next" })]), []);
  assert.match(checkC5([claim({ resource: "migration", claim: "24" })])[0], /bare integer/);
});

test("C6 passes tree-derived heads and fails a stale head", () => {
  assert.deepEqual(checkC6(tree, registers()), []);
  const rows = registers();
  rows[0].head = "1.1";
  assert.match(checkC6(tree, rows)[0], /disagrees with tree/);
});

test("C6 fails a hand-written next-free value", () => {
  const rows = registers();
  rows[0].body = "| — | next free 1.3 |";
  assert.match(checkC6(tree, rows)[0], /hand-written next-free/);
});

const schemaFiles = () => [
  { filename: "drill_pack.schema.json", id: "urn:chess-tabiya:schema:drill-pack:0.27", slug: "drill-pack", version: "0.27", digest: "aaaaaaaaaaaa" },
  { filename: "drill_run.schema.json", id: "urn:chess-tabiya:schema:drill-run:0.17", slug: "drill-run", version: "0.17" },
  { filename: "shape_entry.schema.json", id: "urn:chess-tabiya:schema:shape-entry:0.3", slug: "shape-entry", version: "0.3" },
  { filename: "principle_entry.schema.json", id: "urn:chess-tabiya:schema:principle-entry:0.1", slug: "principle-entry", version: "0.1" },
  { filename: "campaign.schema.json", id: "urn:chess-tabiya:schema:campaign:1", slug: "campaign", version: "1", digest: "bbbbbbbbbbbb" },
];

test("C7 accepts the schemas on disk today", () => {
  assert.deepEqual(checkC7(schemaFiles()), []);
});

test("C7 refuses a versioned schema with no register resource", () => {
  const extra = { filename: "arena.schema.json", id: "urn:chess-tabiya:schema:arena:0.1", slug: "arena", version: "0.1" };
  assert.deepEqual(checkC7([...schemaFiles(), extra]), [
    "C7 arena.schema.json: schema slug arena has no register resource",
  ]);
});

test("C7 refuses a schema whose $id is not a versioned tabiya urn", () => {
  const loose = { filename: "loose.schema.json", id: "https://example.test/loose.json", slug: null, version: null };
  assert.deepEqual(checkC7([...schemaFiles(), loose]), [
    'C7 loose.schema.json: $id "https://example.test/loose.json" is not a versioned urn:chess-tabiya:schema id',
  ]);
});

test("C7 refuses a register resource whose schema left the tree", () => {
  const without = schemaFiles().filter((file) => file.slug !== "campaign");
  assert.deepEqual(checkC7(without), ["C7 campaign-schema: no schema on disk carries slug campaign"]);
});

test("C2 refuses a lane versioned to a different depth than its head", () => {
  const errors = checkC2([claim({ resource: "campaign-schema", claim: "lane 1.1" })], tree);
  assert.deepEqual(errors, ["C2 one.md: campaign-schema lane 1.1 has 2 version part(s); head 1 has 1"]);
});

test("C2 accepts a bare major lane on a bare major head", () => {
  assert.deepEqual(checkC2([claim({ resource: "campaign-schema", claim: "lane 2" })], tree), []);
});

test("C8 passes when register digests match the schemas on disk", () => {
  const files = schemaFiles().filter((file) => ["drill-pack", "campaign"].includes(file.slug));
  assert.deepEqual(checkC8(files, registers(), []), []);
});

test("C8 refuses an undeclared schema edit", () => {
  const files = [{ ...schemaFiles().find((file) => file.slug === "campaign"), digest: "cccccccccccc" }];
  assert.deepEqual(checkC8(files, registers(), []), [
    "C8 campaign-schema: campaign.schema.json changed since the register was reconciled (register bbbbbbbbbbbb, disk cccccccccccc) and no live claim declares it",
  ]);
});

test("C8 allows an edit that a live claim declares", () => {
  const files = [{ ...schemaFiles().find((file) => file.slug === "campaign"), digest: "cccccccccccc" }];
  assert.deepEqual(checkC8(files, registers(), [claim({ resource: "campaign-schema", claim: "lane 2" })]), []);
});

test("C8 refuses a register that records no digest", () => {
  const files = [schemaFiles().find((file) => file.slug === "drill-run")];
  assert.deepEqual(checkC8(files, registers(), []), [
    "C8 run-schema: register records no schema digest for drill_run.schema.json",
  ]);
});
