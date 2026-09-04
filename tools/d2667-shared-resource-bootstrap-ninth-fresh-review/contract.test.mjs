import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertTypeScriptGraphV2,
  createRepositoryProjector,
} from "../d2645-shared-resource-bootstrap-eighth-author-repair/model.mjs";

function git(repository, args) {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-ninth-review-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "tsconfig.base.json"), JSON.stringify({
    compilerOptions: { module: "ESNext", moduleResolution: "Bundler", noEmit: true, strict: true, target: "ES2022" },
  }));
  writeFileSync(path.join(root, "src/contract.ts"), contractSource);
  git(root, ["init", "--quiet"]);
  git(root, ["add", "tsconfig.base.json", "src/contract.ts"]);
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

test("D2667 a committed root can import mutable untracked repository source", () => {
  const fixture = repository([
    'import type { Ghost } from "./ghost";',
    "export interface Contract { readonly version: 1; readonly ghost: Ghost }",
  ].join("\n"));
  writeFileSync(path.join(fixture.root, "src/ghost.ts"), "export interface Ghost { readonly value: string }");
  const project = createRepositoryProjector(fixture.root);
  const first = project(descriptor(), fixture.commit);
  writeFileSync(path.join(fixture.root, "src/ghost.ts"), "export interface Ghost { readonly value: number }");
  const second = project(descriptor(), fixture.commit);
  assert.notEqual(first.digest, second.digest);
  assert.ok(first.semantic.nodes.some((node) => node.id.startsWith("src/ghost.ts\0")));
});

test("D2668 importer-visible node_modules is misclassified as mutable repository source", () => {
  const fixture = repository([
    'import type { External } from "fake-package";',
    "export interface Contract { readonly version: 1; readonly external: External }",
  ].join("\n"));
  mkdirSync(path.join(fixture.root, "node_modules/fake-package"), { recursive: true });
  writeFileSync(path.join(fixture.root, "node_modules/fake-package/package.json"), JSON.stringify({ name: "fake-package", version: "1.0.0", types: "index.d.ts" }));
  writeFileSync(path.join(fixture.root, "node_modules/fake-package/index.d.ts"), "export interface External { readonly one: string }");
  const project = createRepositoryProjector(fixture.root);
  const first = project(descriptor(), fixture.commit);
  const external = first.semantic.nodes.find((node) => node.id.includes("node_modules/fake-package"));
  assert.ok(external);
  assert.equal(external.origin, "repository");
  assert.equal(external.dependencyIdentity, null);
  writeFileSync(path.join(fixture.root, "node_modules/fake-package/index.d.ts"), "export interface External { readonly two: number }");
  assert.notEqual(project(descriptor(), fixture.commit).digest, first.digest);
});

test("D2669 TypeScript library node ids retain a machine-absolute installation path", () => {
  const fixture = repository("export interface Contract { readonly version: 1; readonly key: PropertyKey }");
  const projection = createRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const library = projection.semantic.nodes.find((node) => node.origin === "typescript_lib");
  assert.ok(library);
  assert.match(library.id, /[/\\]node_modules[/\\]typescript[/\\]lib[/\\]/u);
  assert.ok(path.isAbsolute(library.id.split("\0")[1]));
});

test("D2670 an ordinary merged TypeScript library symbol makes the graph orphan itself", () => {
  const fixture = repository("export interface Contract { readonly version: 1; readonly ready: Promise<string> }");
  assert.throws(() => createRepositoryProjector(fixture.root)(descriptor(), fixture.commit), /graph:orphan/u);
});

test("D2671 property access traversal drops the receiver declaration", () => {
  const fixture = repository([
    "const holder = { run(value: string): string { return value; } };",
    "export interface Contract { readonly version: 1; readonly call: typeof call }",
    "export function call(value: string): string { return holder.run(value); }",
  ].join("\n"));
  const projected = createRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:call"), fixture.commit);
  assert.ok(projected.semantic.edges.some((edge) => edge.kind === "property_reference"));
  assert.equal(projected.semantic.nodes.some((node) => node.exportedName === "holder"), false);
  assert.equal(projected.semantic.edges.some((edge) => edge.exportPath.includes("holder")), false);
});

test("D2672 graph assertion accepts malformed syntax and edge payload fields", () => {
  const fixture = repository([
    "export interface Dependency { readonly value: string }",
    "export interface Contract { readonly version: 1; readonly dependency: Dependency }",
  ].join("\n"));
  const projection = createRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const crossed = structuredClone(projection.semantic);
  crossed.nodes[0].tree = "not-a-syntax-tree";
  crossed.edges[0].exportPath = "not-an-array";
  crossed.edges[0].resolvedSignature = 42;
  crossed.edges[0].overloads = "not-an-array";
  assert.doesNotThrow(() => assertTypeScriptGraphV2(crossed, projection.resolvedSelectors, projection.semantic.program));
});

test("the reviewed RFC promises all six boundaries the executable model violates", () => {
  const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");
  assert.match(rfc, /repository paths are read from that Git tree, never from caller text or a\s+mutable working tree/u);
  assert.match(rfc, /external packages resolve to\s+the unique importer-visible lockfile instance/u);
  assert.match(rfc, /normalized lib filename and\s+export path in `id`/u);
  assert.match(rfc, /root and edge endpoint\s+membership/u);
  assert.match(rfc, /every compiler-symbol reference in type positions, initializers, property access/u);
  assert.match(rfc, /exact keys and canonical scalar domains for graph,\s+program, roots, nodes, syntax trees, edges and dependency identities/u);
});
