import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compileValidatedDescriptor,
  createSiteBoundRepositoryProjector,
} from "../d2828-shared-resource-bootstrap-twelfth-author-repair/model.mjs";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-thirteenth-review-"));
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

function admittedDescriptor(root = "src/contract.ts#function:run") {
  return compileValidatedDescriptor({ schemaVersion: 1, resources: [descriptor(root)] }, "fixture-contract");
}

function utf8Compare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

test("D2843 literal element access is accepted but its exact property declaration disappears", () => {
  const fixture = repository([
    "const safe = { secret: 'grounded' };",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return safe['secret']; }",
  ].join("\n"));
  const projected = createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor(), fixture.commit);
  assert.equal(projected.semantic.edges.some((edge) =>
    edge.kind === "property_reference" && edge.exportPath.at(-1) === "secret"), false);
  assert.equal(projected.semantic.nodes.some((node) => node.exportedName === "secret"), false);
});

test("D2844 emitted graph sets do not use the repair's claimed UTF-8 byte comparator", () => {
  const fixture = repository([
    "function Ａ() { return 1; }",
    "function 𐀀() { return 2; }",
    "export interface Contract { readonly version: 1 }",
    "export function run() { return [Ａ(), 𐀀()]; }",
  ].join("\n"));
  const projected = createSiteBoundRepositoryProjector(fixture.root)(admittedDescriptor(), fixture.commit);
  const dependencyIds = projected.semantic.nodes
    .filter((node) => node.exportedName === "Ａ" || node.exportedName === "𐀀")
    .map((node) => node.id);
  assert.equal(dependencyIds.length, 2);
  assert.notDeepEqual(dependencyIds, [...dependencyIds].sort(utf8Compare));

  const callEdges = projected.semantic.edges
    .filter((edge) => edge.kind === "call" && (edge.exportPath[0] === "Ａ" || edge.exportPath[0] === "𐀀"));
  const serialized = callEdges.map((edge) => JSON.stringify(edge));
  assert.equal(serialized.length, 2);
  assert.notDeepEqual(serialized, [...serialized].sort(utf8Compare));
});

test("D2845 catalogue admission and projection use incompatible identifier grammars", () => {
  const fixture = repository([
    "export interface Contract { readonly version: 1 }",
    "export function é() { return 1; }",
  ].join("\n"));
  const admitted = admittedDescriptor("src/contract.ts#function:é");
  assert.throws(
    () => createSiteBoundRepositoryProjector(fixture.root)(admitted, fixture.commit),
    /selector:root/u,
  );
});
