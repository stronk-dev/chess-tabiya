import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compileValidatedDescriptor,
  createSiteBoundRepositoryProjector,
} from "./model.mjs";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-fourteenth-repair-"));
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

function project(contractSource) {
  const fixture = repository(contractSource);
  const admitted = compileValidatedDescriptor({ schemaVersion: 1, resources: [descriptor()] }, "fixture-contract");
  return createSiteBoundRepositoryProjector(fixture.root)(admitted, fixture.commit);
}

test("D2854 a statically spelled read retains its declared index-signature authority", () => {
  const projected = project([
    "export interface Contract { readonly version: 1 }",
    "export function run(value: unknown): boolean {",
    "  if (value === null || typeof value !== 'object') return false;",
    "  const item = value as Record<string, unknown>;",
    "  return item.version === 4;",
    "}",
  ].join("\n"));
  const edge = projected.semantic.edges.find((candidate) =>
    candidate.kind === "property_reference" && candidate.exportPath.at(-1) === "version");
  assert.ok(edge);
  assert.ok(projected.semantic.nodes.some((node) => node.id === edge.to));
});

test("D2855 finite keys retain every exact property while open indexes remain refused", () => {
  const projected = project([
    "export interface Contract { readonly version: 1 }",
    "type Key = 'pack' | 'match';",
    "const defaults: Readonly<Record<Key, number>> = { pack: 1, match: 2 };",
    "export function run(key: Key): number { return defaults[key]; }",
  ].join("\n"));
  const targets = projected.semantic.edges
    .filter((edge) => edge.kind === "property_reference")
    .map((edge) => edge.exportPath.at(-1));
  assert.ok(targets.includes("pack"));
  assert.ok(targets.includes("match"));

  assert.throws(() => project([
    "export interface Contract { readonly version: 1 }",
    "const values: Record<string, number> = {};",
    "export function run(key: string): number | undefined { return values[key]; }",
  ].join("\n")), /resolution:broad-index/u);
});

test("D2856 optional interface calls retain the selected method overload authority", () => {
  const projected = project([
    "export interface Contract { readonly version: 1 }",
    "interface Storage { setItem(key: string, value: string): void }",
    "export function run(storage?: Storage): void { storage?.setItem('key', 'value'); }",
  ].join("\n"));
  const call = projected.semantic.edges.find((edge) => edge.kind === "call" && edge.exportPath.at(-1) === "setItem");
  assert.ok(call);
  assert.equal(call.overloads.length, 1);
});

test("the literal assistance and workflow descriptor candidates project at committed HEAD", () => {
  const catalogue = JSON.parse(readFileSync("planning/assistance-config-register/catalogue-additions.v1.json", "utf8"));
  const projector = createSiteBoundRepositoryProjector(process.cwd());
  for (const id of ["assistance-config", "workflow-preference"]) {
    const admitted = compileValidatedDescriptor(catalogue, id);
    const projected = projector(admitted, "HEAD");
    assert.ok(projected.semantic.nodes.length > 0, id);
    assert.ok(projected.semantic.edges.length > 0, id);
  }
});
