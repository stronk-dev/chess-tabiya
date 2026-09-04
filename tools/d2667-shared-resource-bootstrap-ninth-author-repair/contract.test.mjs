import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertTypeScriptGraphV3,
  createClosedRepositoryProjector,
} from "./model.mjs";

function git(repository, args) {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource, { dependency = false } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-ninth-author-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "tsconfig.base.json"), JSON.stringify({
    compilerOptions: { module: "ESNext", moduleResolution: "Bundler", noEmit: true, strict: true, target: "ES2022" },
  }));
  writeFileSync(path.join(root, "pnpm-lock.yaml"), [
    "lockfileVersion: '9.0'",
    "packages:",
    "  fake-package@1.0.0:",
    "    resolution: {integrity: sha512-FixtureIntegrityForExactPackageIdentity000000000000000000000000000000000000000000000000000000000000000=}",
  ].join("\n"));
  writeFileSync(path.join(root, "src/contract.ts"), contractSource);
  if (dependency) {
    mkdirSync(path.join(root, "node_modules/fake-package"), { recursive: true });
    writeFileSync(path.join(root, "node_modules/fake-package/package.json"), JSON.stringify({ name: "fake-package", version: "1.0.0", types: "index.d.ts" }));
    writeFileSync(path.join(root, "node_modules/fake-package/index.d.ts"), "export interface External { readonly value: string }");
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "tsconfig.base.json", "pnpm-lock.yaml", "src/contract.ts"]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]) };
}

function descriptor(rootSelector = "src/contract.ts#interface:Contract") {
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
      roots: [rootSelector],
      repositoryEdges: "transitive",
      externalEdges: "resolved_signature",
    },
  };
}

test("D2667 repository resolution is closed over the selected commit", () => {
  const fixture = repository([
    'import type { Ghost } from "./ghost";',
    "export interface Contract { readonly version: 1; readonly ghost: Ghost }",
  ].join("\n"));
  writeFileSync(path.join(fixture.root, "src/ghost.ts"), "export interface Ghost { readonly value: string }");
  const project = createClosedRepositoryProjector(fixture.root);
  assert.throws(() => project(descriptor(), fixture.commit), /program:diagnostic:2307/u);
  writeFileSync(path.join(fixture.root, "src/ghost.ts"), "export interface Ghost { readonly changed: number }");
  assert.throws(() => project(descriptor(), fixture.commit), /program:diagnostic:2307/u);
});

test("D2668 importer-visible packages carry their unique lockfile identity", () => {
  const fixture = repository([
    'import type { External } from "fake-package";',
    "export interface Contract { readonly version: 1; readonly external: External }",
  ].join("\n"), { dependency: true });
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const external = projected.semantic.nodes.find((node) => node.origin === "external_package");
  assert.ok(external);
  assert.deepEqual(external.dependencyIdentity, {
    integrity: "sha512-FixtureIntegrityForExactPackageIdentity000000000000000000000000000000000000000000000000000000000000000=",
    package: "fake-package",
    version: "1.0.0",
  });
  assert.doesNotMatch(external.id, new RegExp(fixture.root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));

  writeFileSync(path.join(fixture.root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\npackages: {}\n");
  assert.deepEqual(createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit).semantic, projected.semantic,
    "working-tree lockfile edits cannot move the selected-commit projection");
});

test("D2669 TypeScript library identities are portable normalized names", () => {
  const fixture = repository("export interface Contract { readonly version: 1; readonly key: PropertyKey }");
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const libraries = projected.semantic.nodes.filter((node) => node.origin === "typescript_lib");
  assert.ok(libraries.length > 0);
  for (const library of libraries) {
    assert.match(library.id, /^typescript_lib\0lib\..*\.d\.ts\0/u);
    assert.doesNotMatch(library.id, /[/\\]node_modules[/\\]typescript[/\\]lib/u);
    assert.equal(path.isAbsolute(library.id.split("\0")[1]), false);
  }
});

test("D2670 every retained merged library declaration remains reachable", () => {
  const fixture = repository("export interface Contract { readonly version: 1; readonly ready: Promise<string> }");
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const promiseNodes = projected.semantic.nodes.filter((node) => node.origin === "typescript_lib" && node.exportedName === "Promise");
  assert.ok(promiseNodes.length > 1);
  for (const node of promiseNodes) assert.ok(projected.semantic.edges.some((edge) => edge.to === node.id));
  assert.equal(assertTypeScriptGraphV3(projected.semantic, projected.resolvedSelectors, projected.semantic.program), true);
});

test("D2671 property receiver declarations and initializers are retained", () => {
  const fixture = repository([
    "const holder = { run(value: string): string { return value; } };",
    "export interface Contract { readonly version: 1; readonly call: typeof call }",
    "export function call(value: string): string { return holder.run(value); }",
  ].join("\n"));
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:call"), fixture.commit);
  assert.ok(projected.semantic.nodes.some((node) => node.exportedName === "holder"));
  assert.ok(projected.semantic.edges.some((edge) => edge.kind === "value_reference" && edge.exportPath.includes("holder")));
  assert.ok(projected.semantic.edges.some((edge) => edge.kind === "property_reference" && edge.exportPath.includes("run")));
});

test("D2672 nested graph ABI is recursively fail-closed", () => {
  const fixture = repository([
    "export interface Dependency { readonly value: string }",
    "export interface Contract { readonly version: 1; readonly dependency: Dependency; readonly key: PropertyKey }",
  ].join("\n"));
  const projected = createClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const mutations = [
    (graph) => { graph.nodes[0].tree = "not-a-tree"; },
    (graph) => { graph.edges[0].exportPath = "not-an-array"; },
    (graph) => { graph.edges[0].resolvedSignature = 42; },
    (graph) => { graph.edges[0].overloads = "not-an-array"; },
    (graph) => { graph.nodes.find((node) => node.origin !== "repository").dependencyIdentity.integrity = null; },
  ];
  for (const mutate of mutations) {
    const crossed = structuredClone(projected.semantic);
    mutate(crossed);
    assert.throws(() => assertTypeScriptGraphV3(crossed, projected.resolvedSelectors, projected.semantic.program));
  }
});

test("the author repair closes each returned boundary without weakening the RFC", () => {
  const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");
  for (const id of ["D2667", "D2668", "D2669", "D2670", "D2671", "D2672"]) assert.match(rfc, new RegExp(`\\[\\[${id}\\]\\]`, "u"));
  assert.match(rfc, /another (?:genuinely )?fresh (?:independent )?review/u);
});
