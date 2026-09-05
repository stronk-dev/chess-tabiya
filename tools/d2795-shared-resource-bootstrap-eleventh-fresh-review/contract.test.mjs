import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertTypeScriptGraphV4,
  createExactClosedRepositoryProjector,
} from "../d2701-shared-resource-bootstrap-tenth-author-repair/model.mjs";

const INTEGRITY = "sha512-FixtureIntegrityForExactPackageIdentity000000000000000000000000000000000000000000000000000000000000000=";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource, { dependencySource, extraFiles = {} } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-eleventh-review-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "tsconfig.base.json"), JSON.stringify({
    compilerOptions: { module: "ESNext", moduleResolution: "Bundler", noEmit: true, strict: true, target: "ES2022" },
  }));
  writeFileSync(path.join(root, "pnpm-lock.yaml"), [
    "lockfileVersion: '9.0'", "packages:", "  fake-package@1.0.0:",
    `    resolution: {integrity: ${INTEGRITY}}`,
  ].join("\n"));
  writeFileSync(path.join(root, "src/contract.ts"), contractSource);
  for (const [relativePath, source] of Object.entries(extraFiles)) {
    const absolute = path.join(root, relativePath);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, source);
  }
  if (dependencySource !== undefined) {
    mkdirSync(path.join(root, "node_modules/fake-package"), { recursive: true });
    writeFileSync(path.join(root, "node_modules/fake-package/package.json"), JSON.stringify({ name: "fake-package", version: "1.0.0", types: "index.d.ts" }));
    writeFileSync(path.join(root, "node_modules/fake-package/index.d.ts"), dependencySource);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "tsconfig.base.json", "pnpm-lock.yaml", "src/contract.ts", ...Object.keys(extraFiles)]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]) };
}

function descriptor(root = "src/contract.ts#interface:Contract") {
  return {
    id: "fixture-contract", lifecycle: "sequential", claimMode: "whole_projection",
    introduction: "existing", introducedBy: "shared-resource-register-bootstrap.md",
    projection: {
      adapter: "typescript_contract@1",
      versionSelector: "src/contract.ts#interface:Contract/member:version/literal",
      programConfig: "tsconfig.base.json", roots: [root], repositoryEdges: "transitive",
      externalEdges: "resolved_signature",
    },
  };
}

test("D2795 transitive external meaning changes under an unchanged graph and dependency identity", () => {
  const contract = ['import type { External } from "fake-package";', "export interface Contract { readonly version: 1; readonly external: External }"].join("\n");
  const fixture = repository(contract, { dependencySource: "export interface Nested { readonly value: string }\nexport interface External { readonly nested: Nested }" });
  const project = createExactClosedRepositoryProjector(fixture.root);
  const before = project(descriptor(), fixture.commit);
  writeFileSync(path.join(fixture.root, "node_modules/fake-package/index.d.ts"), "export interface Nested { readonly value: number }\nexport interface External { readonly nested: Nested }");
  const after = project(descriptor(), fixture.commit);
  assert.equal(before.semantic.nodes.some((node) => node.exportedName === "Nested"), false);
  assert.equal(after.digest, before.digest);
  assert.deepEqual(after.semantic.nodes.find((node) => node.exportedName === "External").dependencyIdentity,
    before.semantic.nodes.find((node) => node.exportedName === "External").dependencyIdentity);
});

test("D2796 an any-based property resolution publishes with no edge for the selected member", () => {
  const fixture = repository([
    "declare const unsafe: any;", "export interface Contract { readonly version: 1 }",
    "export function run() { return unsafe.secret; }",
  ].join("\n"));
  const projected = createExactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  assert.equal(projected.identity.version, 1);
  assert.equal(projected.semantic.edges.some((edge) => edge.exportPath.includes("secret")), false);
});

test("D2797 a valid constructor call is unrepresentable because construct edges enumerate call signatures", () => {
  const fixture = repository([
    "class Maker { constructor(readonly value: string) {} }", "export interface Contract { readonly version: 1 }",
    "export function run() { return new Maker('ok'); }",
  ].join("\n"));
  assert.throws(() => createExactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit), /graph:call-arm/u);
});

test("D2798 the explicitly refused global eval call publishes as an ordinary library call", () => {
  const fixture = repository(["export interface Contract { readonly version: 1 }", "export function run() { return eval('1 + 1'); }"].join("\n"));
  const projected = createExactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  assert.equal(projected.identity.version, 1);
  assert.equal(projected.semantic.edges.some((edge) => edge.kind === "call"), true);
});

test("D2799 graph assertion does not bind an external declaration tree to its sourceDigest", () => {
  const fixture = repository(['import type { External } from "fake-package";', "export interface Contract { readonly version: 1; readonly external: External }"].join("\n"), {
    dependencySource: "export interface External { readonly value: string }",
  });
  const projected = createExactClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const crossed = structuredClone(projected.semantic);
  crossed.nodes.find((node) => node.origin === "external_package").tree = { kind: "InterfaceDeclaration", text: null, children: [] };
  assert.equal(assertTypeScriptGraphV4(crossed, projected.resolvedSelectors, projected.semantic.program), true);
});

test("D2800 graph assertion accepts a compiler-unrelated resolved signature", () => {
  const fixture = repository([
    "export interface Contract { readonly version: 1 }",
    "export function run() { return eval('1 + 1'); }",
  ].join("\n"));
  const projected = createExactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  const crossed = structuredClone(projected.semantic);
  crossed.edges.find((edge) => edge.kind === "call").resolvedSignature = { kind: "Identifier", text: "attacker", children: [] };
  crossed.edges.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  assert.equal(assertTypeScriptGraphV4(crossed, projected.resolvedSelectors, projected.semantic.program), true);
});

test("D2801 an ordinary repository-local function call is rejected by the enriched graph assertion", () => {
  const fixture = repository([
    "function dependency(value: string): string { return value; }", "export interface Contract { readonly version: 1 }",
    "export function run() { return dependency('ok'); }",
  ].join("\n"));
  assert.throws(
    () => createExactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit),
    /graph:edge-order/u,
  );
});
