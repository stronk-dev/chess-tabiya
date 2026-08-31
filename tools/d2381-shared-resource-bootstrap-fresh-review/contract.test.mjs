import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");
const checker = readFileSync("tools/register-check.mjs", "utf8");

test("D2381: the proposed em-dash rows survive the shipped table filters", () => {
  assert.match(rfc, /\| — \| — \| no product artifact exists \|/u);
  assert.match(rfc, /\| — \| — \| none until the process RFC lands \|/u);
  assert.match(checker, /!\/\^\(version\|member\|migration\)\$\/i\.test/u);
  assert.match(checker, /cells\[0\] !== "claim"/u);
  assert.doesNotMatch("—", /^(version|member|migration)$/iu);
  assert.notEqual("—", "claim");
});

test("D2382: resource-specific semantics survive outside the two lists being deleted", () => {
  assert.match(rfc, /`RESOURCE_NAMES` and `SCHEMA_SLUGS` are deleted as independent authority/u);
  assert.match(checker, /resource\.endsWith\("-schema"\)/u);
  assert.match(checker, /resource === "migration"/u);
  assert.match(checker, /resource === "evidence-kinds"/u);
});

test("D2383: the normative catalogue publishes only the two new schema rows", () => {
  const catalogueStart = rfc.indexOf("| resource | kind | tree authority | version authority |");
  const catalogue = rfc.slice(catalogueStart, rfc.indexOf("```", catalogueStart));
  const rows = catalogue.split("\n").filter((line) => /^\| [a-z]/u.test(line));
  assert.equal(rows.length, 3); // header + two data rows
  assert.match(catalogue, /release-manifest-schema/u);
  assert.match(catalogue, /concept-registry-schema/u);
  assert.doesNotMatch(catalogue, /\| migration \|/u);
  assert.doesNotMatch(catalogue, /\| evidence-kinds \|/u);
});

test("D2384: lifecycle claims temporal guarantees without naming a preimage source", () => {
  const specification = rfc.slice(rfc.indexOf("## Summary"), rfc.indexOf("## Changelog"));
  assert.match(specification, /enters the governance graph in two commits/u);
  assert.match(specification, /once non-absent, the resource can never return to `absent`/u);
  assert.doesNotMatch(specification, /HEAD\^|merge-base|first parent|base image|preimage authority/u);
});
