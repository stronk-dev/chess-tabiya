import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import {
  assertTypeScriptGraphV6,
  canonicalDeclarationArtifact,
  compileValidatedDescriptor,
  createSiteBoundRepositoryProjector,
} from "./model.mjs";

const INTEGRITY = "sha512-FixtureIntegrityForExactPackageIdentity000000000000000000000000000000000000000000000000000000000000000=";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource, { dependencyFiles = {} } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-twelfth-review-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "tsconfig.base.json"), JSON.stringify({
    compilerOptions: {
      module: "ESNext",
      moduleResolution: "Bundler",
      noEmit: true,
      strict: true,
      target: "ES2022",
    },
  }));
  writeFileSync(path.join(root, "pnpm-lock.yaml"), [
    "lockfileVersion: '9.0'",
    "packages:",
    "  fake-package@1.0.0:",
    `    resolution: {integrity: ${INTEGRITY}}`,
  ].join("\n"));
  writeFileSync(path.join(root, "src/contract.ts"), contractSource);
  if (Object.keys(dependencyFiles).length > 0) {
    const packageRoot = path.join(root, "node_modules/fake-package");
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({
      name: "fake-package",
      version: "1.0.0",
      types: "index.d.ts",
    }));
    for (const [name, source] of Object.entries(dependencyFiles)) {
      writeFileSync(path.join(packageRoot, name), source);
    }
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "tsconfig.base.json", "pnpm-lock.yaml", "src/contract.ts"]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]) };
}

function descriptor(root = "src/contract.ts#interface:Contract") {
  return {
    id: "fixture-contract",
    lifecycle: "sequential",
    claimMode: "whole_projection",
    introduction: "existing",
    introducedBy: "shared-resource-register-bootstrap.md",
    projection: {
      adapter: "typescript_contract@1",
      versionSelector: "src/contract.ts#interface:Contract/member:version/literal",
      programConfig: "tsconfig.base.json",
      roots: [root],
      repositoryEdges: "transitive",
      externalEdges: "resolved_signature",
    },
  };
}

function admittedDescriptor(root = "src/contract.ts#interface:Contract") {
  return compileValidatedDescriptor({ schemaVersion: 1, resources: [descriptor(root)] }, "fixture-contract");
}

test("control: a direct unresolved any call remains closed", () => {
  const fixture = repository([
    "declare const unsafe: any;",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return unsafe(); }",
  ].join("\n"));
  assert.throws(
    () => createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor("src/contract.ts#function:run"), fixture.commit),
    /resolution:(?:any-call|unresolved-signature)/u,
  );
});

test("D2828 one legitimate same-name property edge masks a separate unresolved any access", () => {
  const fixture = repository([
    "const safe = { secret: 'grounded' };",
    "declare const unsafe: any;",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return [safe.secret, unsafe.secret]; }",
  ].join("\n"));
  assert.throws(
    () => createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor("src/contract.ts#function:run"), fixture.commit),
    /resolution:any-member/u,
  );
});

test("D2829 aliasing the global eval intrinsic bypasses the direct-call refusal", () => {
  const fixture = repository([
    "const execute = eval;",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return execute('1 + 1'); }",
  ].join("\n"));
  assert.throws(
    () => createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor("src/contract.ts#function:run"), fixture.commit),
    /resolution:eval/u,
  );
});

test("D2830 construct-signature interfaces collapse the complete overload set to the selected signature", () => {
  const fixture = repository([
    "interface Product { readonly value: string | number }",
    "interface Maker { new(value: string): Product; new(value: number): Product }",
    "declare const Maker: Maker;",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return new Maker('ok'); }",
  ].join("\n"));
  const projected = createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor("src/contract.ts#function:run"), fixture.commit);
  const edge = projected.semantic.edges.find((candidate) => candidate.kind === "construct");
  assert.ok(edge);
  assert.equal(edge.overloads.length, 2);
});

test("D2831 the public projector accepts an unvalidated incompatible descriptor", () => {
  const fixture = repository("export interface Contract { readonly version: 1 }");
  const crossed = descriptor();
  crossed.lifecycle = "member_set";
  crossed.claimMode = "members";
  crossed.projection.adapter = "invented_adapter@9";
  assert.throws(() => compileValidatedDescriptor({ schemaVersion: 1, resources: [crossed] }, "fixture-contract"), /unknown adapter/u);
  const valid = admittedDescriptor();
  assert.throws(() => createSiteBoundRepositoryProjector(fixture.root)({ ...valid }, fixture.commit), /descriptor:authority/u);
});

test("D2832 final edge canonicalization rejects a valid case-distinct call graph", () => {
  const fixture = repository([
    "function A() { return 1; }",
    "function a() { return 2; }",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return [A(), a()]; }",
  ].join("\n"));
  const projected = createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor("src/contract.ts#function:run"), fixture.commit);
  assert.equal(projected.semantic.edges.filter((edge) => edge.kind === "call").length, 2);
});

test("D2833 nested class constructors are misfiled as overloads of the constructed outer class", () => {
  const fixture = repository([
    "class Maker {",
    "  constructor(readonly value: string) {}",
    "  method() { class Inner { constructor(readonly nested: number) {} }; return Inner; }",
    "}",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return new Maker('ok'); }",
  ].join("\n"));
  const projected = createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor("src/contract.ts#function:run"), fixture.commit);
  const edge = projected.semantic.edges.find((candidate) => candidate.kind === "construct");
  assert.ok(edge);
  assert.equal(edge.overloads.length, 1);
});

test("D2834 dependency artifact identity uses locale collation instead of canonical byte order", () => {
  const fixture = repository([
    'import type { External } from "fake-package";',
    "export interface Contract { readonly version: 1; readonly external: External }",
  ].join("\n"), {
    dependencyFiles: {
      "index.d.ts": "export interface External { readonly value: string }",
      "Z.d.ts": "export interface Upper { readonly value: string }",
      "a.d.ts": "export interface Lower { readonly value: string }",
    },
  });
  const projected = createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor(), fixture.commit);
  const packageRoot = path.join(fixture.root, "node_modules/fake-package");
  const names = ["Z.d.ts", "a.d.ts", "index.d.ts", "package.json"];
  const asciiFiles = names.sort().map((name) => ({
    path: name,
    bytes: readFileSync(path.join(packageRoot, name)).toString("base64"),
  }));
  const expected = sharedResourceDigest({ declarationArtifact: asciiFiles });
  const artifact = canonicalDeclarationArtifact(packageRoot);
  assert.deepEqual(artifact, asciiFiles);
  const node = projected.semantic.nodes.find((candidate) => candidate.origin === "external_package" && candidate.dependencyIdentity.package === "fake-package");
  assert.ok(node);
  assert.equal(node.dependencyIdentity.sourceDigest, expected);
});

test("relation occurrences retain distinct compiler-issued syntax-site paths", () => {
  const fixture = repository([
    "const safe = { secret: 'grounded' };",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return [safe.secret, safe.secret]; }",
  ].join("\n"));
  const projected = createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor("src/contract.ts#function:run"), fixture.commit);
  const edges = projected.semantic.edges.filter((edge) => edge.kind === "property_reference" && edge.exportPath.at(-1) === "secret");
  assert.equal(edges.length, 2);
  assert.notDeepEqual(edges[0].sitePath, edges[1].sitePath);
  assert.equal(assertTypeScriptGraphV6(projected.semantic, projected.resolvedSelectors, projected.semantic.program), true);
  assert.throws(
    () => assertTypeScriptGraphV6(structuredClone(projected.semantic), projected.resolvedSelectors, projected.semantic.program),
    /graph:authority/u,
  );
});

test("global eval authority is refused through Function.prototype.call while a local eval method remains legal", () => {
  const globalFixture = repository([
    "export interface Contract { readonly version: 1 }",
    "export function run() { return eval.call(undefined, '1 + 1'); }",
  ].join("\n"));
  assert.throws(
    () => createSiteBoundRepositoryProjector(globalFixture.root)(admittedDescriptor("src/contract.ts#function:run"), globalFixture.commit),
    /resolution:eval/u,
  );

  const localFixture = repository([
    "const local = { eval(value: string) { return value; } };",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return local.eval.call(local, 'safe'); }",
  ].join("\n"));
  const projected = createSiteBoundRepositoryProjector(localFixture.root)(admittedDescriptor("src/contract.ts#function:run"), localFixture.commit);
  assert.equal(projected.identity.version, 1);
});
