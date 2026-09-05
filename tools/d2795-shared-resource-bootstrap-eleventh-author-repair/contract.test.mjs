import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertTypeScriptGraphV5,
  createArtifactClosedRepositoryProjector,
} from "./model.mjs";

const INTEGRITY = "sha512-FixtureIntegrityForExactPackageIdentity000000000000000000000000000000000000000000000000000000000000000=";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource, dependencySource) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-eleventh-author-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "tsconfig.base.json"), JSON.stringify({ compilerOptions: { module: "ESNext", moduleResolution: "Bundler", noEmit: true, strict: true, target: "ES2022" } }));
  writeFileSync(path.join(root, "pnpm-lock.yaml"), ["lockfileVersion: '9.0'", "packages:", "  fake-package@1.0.0:", `    resolution: {integrity: ${INTEGRITY}}`].join("\n"));
  writeFileSync(path.join(root, "src/contract.ts"), contractSource);
  if (dependencySource !== undefined) {
    mkdirSync(path.join(root, "node_modules/fake-package"), { recursive: true });
    writeFileSync(path.join(root, "node_modules/fake-package/package.json"), JSON.stringify({ name: "fake-package", version: "1.0.0", types: "index.d.ts" }));
    writeFileSync(path.join(root, "node_modules/fake-package/index.d.ts"), dependencySource);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "tsconfig.base.json", "pnpm-lock.yaml", "src/contract.ts"]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]) };
}

function descriptor(root = "src/contract.ts#interface:Contract") {
  return {
    id: "fixture-contract", lifecycle: "sequential", claimMode: "whole_projection", introduction: "existing",
    introducedBy: "shared-resource-register-bootstrap.md",
    projection: { adapter: "typescript_contract@1", versionSelector: "src/contract.ts#interface:Contract/member:version/literal", programConfig: "tsconfig.base.json", roots: [root], repositoryEdges: "transitive", externalEdges: "resolved_signature" },
  };
}

test("D2795 exact declaration-artifact identity covers transitive external sibling meaning", () => {
  const fixture = repository('import type { External } from "fake-package";\nexport interface Contract { readonly version: 1; readonly external: External }', "export interface Nested { readonly value: string }\nexport interface External { readonly nested: Nested }");
  const project = createArtifactClosedRepositoryProjector(fixture.root);
  const before = project(descriptor(), fixture.commit);
  writeFileSync(path.join(fixture.root, "node_modules/fake-package/index.d.ts"), "export interface Nested { readonly value: number }\nexport interface External { readonly nested: Nested }");
  const after = project(descriptor(), fixture.commit);
  assert.notEqual(after.digest, before.digest);
  assert.notEqual(after.semantic.nodes.find((node) => node.origin === "external_package").dependencyIdentity.sourceDigest,
    before.semantic.nodes.find((node) => node.origin === "external_package").dependencyIdentity.sourceDigest);
});

test("D2796 any-based property resolution fails before publication", () => {
  const fixture = repository("declare const unsafe: any;\nexport interface Contract { readonly version: 1 }\nexport function run() { return unsafe.secret; }");
  assert.throws(() => createArtifactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit), /resolution:any-member/u);
});

test("D2797 construct relations retain constructor signatures", () => {
  const fixture = repository("class Maker { constructor(value: string); constructor(value: number); constructor(readonly value: string | number) {} }\nexport interface Contract { readonly version: 1 }\nexport function run() { return new Maker('ok'); }");
  const projected = createArtifactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  const edge = projected.semantic.edges.find((candidate) => candidate.kind === "construct");
  assert.ok(edge);
  assert.equal(edge.overloads.length, 3);
});

test("D2798 global eval is refused while a shadowed local binding remains representable", () => {
  const globalFixture = repository("export interface Contract { readonly version: 1 }\nexport function run() { return eval('1 + 1'); }");
  assert.throws(() => createArtifactClosedRepositoryProjector(globalFixture.root)(descriptor("src/contract.ts#function:run"), globalFixture.commit), /resolution:eval/u);
  const localFixture = repository("const local = { eval(value: string) { return value; } };\nexport interface Contract { readonly version: 1 }\nexport function run() { return local.eval('safe'); }");
  assert.equal(createArtifactClosedRepositoryProjector(localFixture.root)(descriptor("src/contract.ts#function:run"), localFixture.commit).identity.version, 1);
});

test("D2799 graph assertion refuses a changed declaration tree under an old artifact digest", () => {
  const fixture = repository('import type { External } from "fake-package";\nexport interface Contract { readonly version: 1; readonly external: External }', "export interface External { readonly value: string }");
  const projected = createArtifactClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  assert.equal(assertTypeScriptGraphV5(projected.semantic, projected.resolvedSelectors, projected.semantic.program), true);
  const crossed = structuredClone(projected.semantic);
  crossed.nodes.find((node) => node.origin === "external_package").tree = { kind: "InterfaceDeclaration", text: null, children: [] };
  assert.throws(() => assertTypeScriptGraphV5(crossed, projected.resolvedSelectors, projected.semantic.program), /graph:authority/u);
});

test("D2800 graph assertion refuses a compiler-unrelated resolved-signature tree", () => {
  const fixture = repository("function local(value: string) { return value; }\nexport interface Contract { readonly version: 1 }\nexport function run() { return local('ok'); }");
  const projected = createArtifactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  const crossed = structuredClone(projected.semantic);
  crossed.edges.find((edge) => edge.kind === "call").resolvedSignature = { kind: "Identifier", text: "attacker", children: [] };
  assert.throws(() => assertTypeScriptGraphV5(crossed, projected.resolvedSelectors, projected.semantic.program), /graph:authority/u);
});

test("D2801 enriched canonicalization represents an ordinary repository-local function call", () => {
  const fixture = repository("function dependency(value: string): string { return value; }\nexport interface Contract { readonly version: 1 }\nexport function run() { return dependency('ok'); }");
  const projected = createArtifactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  assert.equal(projected.identity.version, 1);
  assert.equal(assertTypeScriptGraphV5(projected.semantic, projected.resolvedSelectors, projected.semantic.program), true);
});
