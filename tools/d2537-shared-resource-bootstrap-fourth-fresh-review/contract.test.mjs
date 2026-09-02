// Disposable fresh-review instrument for D2537-D2541. It observes the returned contract;
// green means every named blocker is reproducible, not that the RFC is accepted.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { parseCanonicalResource } from "../d2498-shared-resource-bootstrap-fourth-author-repair/model.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");
const assistanceDescriptors = JSON.parse(read("planning/assistance-config-register/catalogue-additions.v1.json"));

test("D2537: the claimed closed canonical parser admits unverified and forbidden literal images", () => {
  const arbitraryDigest = `export const RESOURCE = { id: "provider-protocol", version: 1, payload: {}, digest: "sha256:not-a-digest" };`;
  assert.equal(parseCanonicalResource(arbitraryDigest, "RESOURCE").digest, "sha256:not-a-digest");

  const template = "export const RESOURCE = { id: `provider-protocol`, version: 1, payload: {}, digest: `sha256:x` };";
  assert.equal(parseCanonicalResource(template, "RESOURCE").id, "provider-protocol");

  const hexadecimal = `export const RESOURCE = { id: "provider-protocol", version: 0x1, payload: {}, digest: "sha256:x" };`;
  assert.equal(parseCanonicalResource(hexadecimal, "RESOURCE").version, 1);
});

function declarationOrdinal(sourceText, declarationName) {
  const source = ts.createSourceFile("contract.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations = [];
  const visit = (node) => {
    if (ts.isDeclaration(node)) declarations.push(node);
    node.forEachChild(visit);
  };
  visit(source);
  const ordinal = declarations.findIndex((node) => node.name && ts.isIdentifier(node.name) && node.name.text === declarationName);
  assert.notEqual(ordinal, -1);
  return `contract.ts\0${ordinal}`;
}

test("D2538: a declaration outside the selected graph changes repository node identity", () => {
  const retained = `export interface Contract { value: string }`;
  const withUnrelatedPrefix = `interface Unrelated { ignored: number }\n${retained}`;
  assert.notEqual(declarationOrdinal(retained, "Contract"), declarationOrdinal(withUnrelatedPrefix, "Contract"));
  assert.match(rfc, /zero-based preorder\s+ordinal among AST declarations/u);
});

test("D2539: the cross-project TypeScript graph has no canonical compiler-program authority", () => {
  const assistance = assistanceDescriptors.resources.find((resource) => resource.id === "assistance-config");
  assert.ok(assistance.projection.roots.some((root) => root.startsWith("apps/web/")));
  assert.ok(assistance.projection.roots.some((root) => root.startsWith("packages/runtime/")));
  assert.doesNotMatch(rfc, /(?:rootConfig|tsconfigPath|compilerOptions|projectReferences|moduleResolutionHost)/u);
  assert.ok(read("apps/web/tsconfig.json"));
  assert.ok(read("packages/runtime/tsconfig.json"));
});

test("D2540: migration callbacks cannot inhabit the graph's selector-string root field", () => {
  assert.match(rfc, /migration callback as its sole root/u);
  assert.match(rfc, /Roots are ASCII-sorted unique\s+selector strings/u);
  const migration = JSON.parse(read("planning/shared-resource-register-bootstrap/initial-catalogue.v1.json"))
    .resources.find((resource) => resource.id === "migration");
  assert.equal(migration.projection.sequenceSelector,
    "apps/server/src/storage.ts#class:SQLiteRunStorage/private-method:migrate/local:migrations");
  assert.doesNotMatch(migration.projection.sequenceSelector, /(?:entry|element|apply|callback):/u);
  assert.doesNotMatch(rfc, /(?:entry|element|callback):<name>/u);
});

test("D2541: canonical and TypeScript adapters omit exact four-field projected images", () => {
  const canonicalSection = rfc.match(/5\. `canonical_resource@1`([\s\S]*?)\n6\. `typescript_contract@1`/u)?.[1] ?? "";
  const typescriptSection = rfc.match(/6\. `typescript_contract@1`([\s\S]*?)\n7\. `versioned_declarations@1`/u)?.[1] ?? "";
  for (const section of [canonicalSection, typescriptSection]) {
    assert.ok(section.length > 0);
    assert.doesNotMatch(section, /identity is/u);
    assert.doesNotMatch(section, /projection digest is/u);
  }
  assert.match(canonicalSection, /literal `digest` equals/u);
  assert.match(typescriptSection, /positive safe-integer literal version selector/u);
});
