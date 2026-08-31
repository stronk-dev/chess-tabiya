import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");

function normativeCatalogue() {
  const start = rfc.indexOf("| resource | kind | tree authority | version authority |");
  assert.notEqual(start, -1);
  return rfc.slice(start, rfc.indexOf("```", start));
}

test("D2381 repair: absent registers are literally rowless", () => {
  const image = rfc.slice(rfc.indexOf("## Release-manifest-schema-version register"), rfc.indexOf("```", rfc.indexOf("## Release-manifest-schema-version register")));
  assert.doesNotMatch(image, /\| — \|/u);
  assert.match(rfc, /Header-only tables are the sole empty representation/u);
});

test("D2382 repair: kind closes the semantic algebra without resource-name dispatch", () => {
  assert.match(rfc, /Kind, rather than resource name, selects all semantics/u);
  for (const kind of ["schema", "migration", "closed_vocabulary", "versioned_registry"]) {
    assert.match(rfc, new RegExp("- `" + kind + "`:"));
  }
  assert.match(rfc, /no branch on `migration`, `evidence-kinds`, `source-attribution-registry`, or a[\s\S]*?`-schema` resource-name suffix/u);
  assert.match(rfc, /second synthetic resource of every kind/u);
});

test("D2383/D2401 repair: catalogue is the exact ten-row normative population", () => {
  const catalogue = normativeCatalogue();
  const dataRows = catalogue.split("\n").filter((line) => /^\| [a-z]/u.test(line)).slice(1);
  assert.equal(dataRows.length, 10);
  for (const resource of [
    "pack-schema", "run-schema", "shape-entry-schema", "principle-entry-schema",
    "campaign-schema", "migration", "evidence-kinds", "release-manifest-schema",
    "concept-registry-schema", "source-attribution-registry",
  ]) assert.match(catalogue, new RegExp(`\\| ${resource.replaceAll("-", "\\-")} \\|`));
  assert.match(catalogue, /campaign\.schema\.json[^\n]+\| none \|/u);
  assert.match(catalogue, /SqliteStorage\.#migrate\/local:migrations\[\]\.version/u);
  assert.match(catalogue, /export:EVIDENCE_KINDS\[\]/u);
});

test("D2384 repair: staged and CI history share exact transition authority", () => {
  assert.match(rfc, /assertSharedResourceTransition\(beforeTree, afterTree, changedPaths\)/u);
  assert.match(rfc, /committed `HEAD` as[\s\S]*?staged index/u);
  assert.match(rfc, /required `REGISTER_BASE_SHA`/u);
  assert.match(rfc, /git rev-list --reverse --first-parent REGISTER_BASE_SHA\.\.HEAD/u);
  assert.match(rfc, /A merge commit is checked against its first parent/u);
  assert.match(rfc, /`unregistered -> absent`[\s\S]*?`absent -> first claim`[\s\S]*?`first claim -> landed 1`[\s\S]*?`landed -> landed`/u);
  assert.match(rfc, /introduction plus[\s\S]*?first claim in one commit/u);
  assert.match(rfc, /hidden earlier bad commit/u);
  assert.match(rfc, /second[\s-]parent alone/u);
});

test("the introducing roots are a closed machine-readable set", () => {
  const match = rfc.match(/```tabiya-resource-roots\n([\s\S]*?)\n```/u);
  assert.ok(match);
  const rows = match[1].split("\n");
  assert.equal(rows.length, 3);
  assert.match(rows[0], /^release-manifest-schema \| schema \|/u);
  assert.match(rows[1], /^concept-registry-schema \| schema \|/u);
  assert.match(rows[2], /^source-attribution-registry \| versioned_registry \|/u);
});

test("D2401 extension: versioned registry owns a complete generic lane and product handoff", () => {
  assert.match(rfc, /- `versioned_registry`:[\s\S]*?`id,version,digest,rows`/u);
  assert.match(rfc, /`digest` equals `sha256\(canonical\(rows\)\)`/u);
  assert.match(rfc, /source-attribution-registry \| first lane 1 \| SOURCE_ATTRIBUTION_REGISTRY_RESOURCE/u);
  assert.match(rfc, /disposable author[\s\S]*?not a current tree authority/u);
});
