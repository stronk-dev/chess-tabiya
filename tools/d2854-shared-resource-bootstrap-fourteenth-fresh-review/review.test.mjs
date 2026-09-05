import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compileValidatedDescriptor,
  createSiteBoundRepositoryProjector,
} from "../d2843-shared-resource-bootstrap-thirteenth-author-repair/model.mjs";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-fourteenth-review-"));
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
  return () => createSiteBoundRepositoryProjector(fixture.root)(admitted, fixture.commit);
}

test("D2854 an adopted Record property read cannot enter the supposedly compatible graph", () => {
  const run = project([
    "export interface Contract { readonly version: 1 }",
    "export function run(value: unknown): boolean {",
    "  if (value === null || typeof value !== 'object') return false;",
    "  const item = value as Record<string, unknown>;",
    "  return item.version === 4;",
    "}",
  ].join("\n"));
  assert.throws(run, /resolution:any-member/u);
});

test("D2855 a finite union lookup in a closed record is rejected as a broad index", () => {
  const run = project([
    "export interface Contract { readonly version: 1 }",
    "type Key = 'pack' | 'match';",
    "const defaults: Readonly<Record<Key, number>> = { pack: 1, match: 2 };",
    "export function run(key: Key): number { return defaults[key]; }",
  ].join("\n"));
  assert.throws(run, /resolution:broad-index/u);
});

test("D2856 an optional call through an exact interface method has no admitted overload arm", () => {
  const run = project([
    "export interface Contract { readonly version: 1 }",
    "interface Storage { setItem(key: string, value: string): void }",
    "export function run(storage?: Storage): void { storage?.setItem('key', 'value'); }",
  ].join("\n"));
  assert.throws(run, /resolution:overloads/u);
});
