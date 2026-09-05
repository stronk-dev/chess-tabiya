import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compileValidatedDescriptor,
  createSiteBoundRepositoryProjector,
} from "../d2854-shared-resource-bootstrap-fourteenth-author-repair/model.mjs";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-fifteenth-review-"));
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
  writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\npackages:\n");
  writeFileSync(path.join(root, "src/contract.ts"), contractSource);
  git(root, ["init", "--quiet"]);
  git(root, ["add", "tsconfig.base.json", "pnpm-lock.yaml", "src/contract.ts"]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]) };
}

function descriptor(root = "src/contract.ts#function:run") {
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

function project(source) {
  const fixture = repository(source);
  const admitted = compileValidatedDescriptor({ schemaVersion: 1, resources: [descriptor()] }, "fixture-contract");
  return createSiteBoundRepositoryProjector(fixture.root)(admitted, fixture.commit);
}

test("the literal assistance and workflow candidates project every declared root", () => {
  const catalogue = JSON.parse(readFileSync("planning/assistance-config-register/catalogue-additions.v1.json", "utf8"));
  const projector = createSiteBoundRepositoryProjector(process.cwd());
  for (const id of ["assistance-config", "workflow-preference"]) {
    const descriptorImage = catalogue.resources.find((candidate) => candidate.id === id);
    assert.ok(descriptorImage);
    const result = projector(compileValidatedDescriptor(catalogue, id), "HEAD");
    assert.equal(result.resolvedSelectors.length, descriptorImage.projection.roots.length + 1);
    assert.ok(result.semantic.nodes.length > 0);
    assert.ok(result.semantic.edges.length > 0);
  }
});

test("checked index reads retain authority while unknown and open receivers fail closed", () => {
  const checked = project([
    "export interface Contract { readonly version: 1 }",
    "export function run(value: unknown): unknown {",
    "  if (value === null || typeof value !== 'object') return undefined;",
    "  const item = value as Record<string, unknown>;",
    "  return item.version;",
    "}",
  ].join("\n"));
  const edge = checked.semantic.edges.find((candidate) =>
    candidate.kind === "property_reference" && candidate.exportPath.at(-1) === "version");
  assert.ok(edge);
  assert.ok(checked.semantic.nodes.some((node) => node.id === edge.to));

  assert.throws(() => project([
    "export interface Contract { readonly version: 1 }",
    "export function run(value: unknown): unknown { return value.missing; }",
  ].join("\n")), /program:diagnostic|resolution:any-member/u);

  assert.throws(() => project([
    "export interface Contract { readonly version: 1 }",
    "export function run(values: Record<string, number>, key: string): number { return values[key]; }",
  ].join("\n")), /resolution:broad-index/u);
});

test("finite literal keys retain the complete target set and reject an incomplete receiver", () => {
  const result = project([
    "export interface Contract { readonly version: 1 }",
    "type Key = 'pack' | 'match';",
    "const values: Readonly<Record<Key, number>> = { pack: 1, match: 2 };",
    "export function run(key: Key): number { return values[key]; }",
  ].join("\n"));
  const targets = result.semantic.edges
    .filter((edge) => edge.kind === "property_reference")
    .map((edge) => edge.exportPath.at(-1));
  assert.ok(targets.includes("pack"));
  assert.ok(targets.includes("match"));

  assert.throws(() => project([
    "export interface Contract { readonly version: 1 }",
    "type Key = 'pack' | 'missing';",
    "const values = { pack: 1 } as const;",
    "export function run(key: Key): number { return values[key]; }",
  ].join("\n")), /program:diagnostic/u);
});

test("optional calls retain the selected method and every declared overload", () => {
  const result = project([
    "export interface Contract { readonly version: 1 }",
    "interface Storage {",
    "  setItem(key: string, value: string): void;",
    "  setItem(key: number, value: string): void;",
    "}",
    "export function run(storage?: Storage): void { storage?.setItem('key', 'value'); }",
  ].join("\n"));
  const edge = result.semantic.edges.find((candidate) =>
    candidate.kind === "call" && candidate.exportPath.at(-1) === "setItem");
  assert.ok(edge);
  assert.equal(edge.overloads.length, 2);
  assert.ok(result.semantic.nodes.some((node) => node.id === edge.to));
});
