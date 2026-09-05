import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertTypeScriptGraphV3,
  createClosedRepositoryProjector,
} from "../d2667-shared-resource-bootstrap-ninth-author-repair/model.mjs";

const INTEGRITY = "sha512-FixtureIntegrityForExactPackageIdentity000000000000000000000000000000000000000000000000000000000000000=";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource, { configText, dependency = false, extraFiles = {} } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-tenth-review-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "tsconfig.base.json"), configText ?? JSON.stringify({
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
  for (const [relativePath, source] of Object.entries(extraFiles)) {
    const absolute = path.join(root, relativePath);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, source);
  }
  if (dependency) {
    mkdirSync(path.join(root, "node_modules/fake-package"), { recursive: true });
    writeFileSync(path.join(root, "node_modules/fake-package/package.json"), JSON.stringify({
      name: "fake-package",
      version: "1.0.0",
      types: "index.d.ts",
    }));
    writeFileSync(path.join(root, "node_modules/fake-package/index.d.ts"),
      "export interface External { readonly value: string }");
  }
  git(root, ["init", "--quiet"]);
  const committed = ["tsconfig.base.json", "pnpm-lock.yaml", "src/contract.ts", ...Object.keys(extraFiles)];
  git(root, ["add", ...committed]);
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

test("D2701 duplicate compiler-config keys are silently accepted", () => {
  const fixture = repository("export interface Contract { readonly version: 1 }", {
    configText: '{"compilerOptions":{"strict":false},"compilerOptions":{"module":"ESNext","moduleResolution":"Bundler","strict":true,"target":"ES2022"}}',
  });
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  assert.equal(projected.identity.version, 1);
});

test("D2702 mutable package declarations move one commit projection under the same lock identity", () => {
  const fixture = repository([
    'import type { External } from "fake-package";',
    "export interface Contract { readonly version: 1; readonly external: External }",
  ].join("\n"), { dependency: true });
  const project = createClosedRepositoryProjector(fixture.root);
  const before = project(descriptor(), fixture.commit);
  writeFileSync(path.join(fixture.root, "node_modules/fake-package/index.d.ts"),
    "export interface External { readonly value: number }");
  const after = project(descriptor(), fixture.commit);
  const beforeDependency = before.semantic.nodes.find((node) => node.origin === "external_package").dependencyIdentity;
  const afterDependency = after.semantic.nodes.find((node) => node.origin === "external_package").dependencyIdentity;
  assert.deepEqual(afterDependency, beforeDependency);
  assert.notEqual(after.digest, before.digest);
});

test("D2703 graph validation accepts an impossible origin/dependency pairing", () => {
  const fixture = repository([
    'import type { External } from "fake-package";',
    "export interface Contract { readonly version: 1; readonly external: External }",
  ].join("\n"), { dependency: true });
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const crossed = structuredClone(projected.semantic);
  crossed.nodes.find((node) => node.origin === "external_package").origin = "typescript_lib";
  assert.equal(assertTypeScriptGraphV3(crossed, projected.resolvedSelectors, projected.semantic.program), true);
});

test("D2704 duplicate selector roots survive canonical graph validation", () => {
  const fixture = repository("export interface Contract { readonly version: 1 }");
  const versionSelector = "src/contract.ts#interface:Contract/member:version/literal";
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(versionSelector), fixture.commit);
  assert.equal(projected.semantic.roots.length, 2);
  assert.deepEqual(projected.semantic.roots[0], projected.semantic.roots[1]);
});

test("D2705 signature and overload payloads are accepted on a non-call edge", () => {
  const fixture = repository([
    "export interface Dependency { readonly value: string }",
    "export interface Contract { readonly version: 1; readonly dependency: Dependency }",
  ].join("\n"));
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const crossed = structuredClone(projected.semantic);
  const edge = crossed.edges.find((candidate) => candidate.kind === "type_reference");
  const tree = structuredClone(crossed.nodes[0].tree);
  edge.resolvedSignature = tree;
  edge.overloads = [structuredClone(tree)];
  assert.equal(assertTypeScriptGraphV3(crossed, projected.resolvedSelectors, projected.semantic.program), true);
});

test("D2706 an any-based call is admitted despite the explicit RFC refusal", () => {
  const fixture = repository([
    "declare const unsafe: any;",
    "export interface Contract { readonly version: 1 }",
    "export function run(): unknown { return unsafe(); }",
  ].join("\n"));
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  assert.equal(projected.identity.version, 1);
});

test("D2707 dynamic import is admitted and its referenced module disappears from the graph", () => {
  const fixture = repository([
    "export interface Contract { readonly version: 1 }",
    'export async function run() { return import("./dependency"); }',
  ].join("\n"), { extraFiles: { "src/dependency.ts": "export const dependency = 1;" } });
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  assert.equal(projected.semantic.nodes.some((node) => node.id.includes("src/dependency.ts")), false);
});

test("D2708 broad index-signature lookup is admitted despite the explicit RFC refusal", () => {
  const fixture = repository([
    "declare const byName: Record<string, () => string>;",
    "export interface Contract { readonly version: 1 }",
    "export function run(key: string): string { return byName[key](); }",
  ].join("\n"));
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit);
  assert.equal(projected.identity.version, 1);
});
