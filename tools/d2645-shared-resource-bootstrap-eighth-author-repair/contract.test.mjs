import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import {
  assertCompiledGraphExact,
  assertTypeScriptGraphV2,
  createRepositoryProjector,
  deepSealCanonicalV2,
} from "./model.mjs";

const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");

function git(repository, args) {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
}

function fixtureRepository() {
  const repository = mkdtempSync(path.join(tmpdir(), "tabiya-shared-resource-"));
  mkdirSync(path.join(repository, "src"));
  writeFileSync(path.join(repository, "tsconfig.base.json"), JSON.stringify({
    compilerOptions: {
      module: "ESNext",
      moduleResolution: "Bundler",
      noEmit: true,
      strict: true,
      target: "ES2022",
    },
  }, null, 2));
  writeFileSync(path.join(repository, "src/dependency.ts"), [
    "export interface Dependency { readonly value: string }",
    "export function unrelated(value: boolean): boolean { return value; }",
  ].join("\n"));
  writeFileSync(path.join(repository, "src/contract.ts"), [
    'import type { Dependency } from "./dependency";',
    "export interface Contract { readonly version: 4; readonly dependency: Dependency }",
    "function base(value: string): string { return value; }",
    "export { base as choose };",
    "export function overloaded(value: string): string;",
    "export function overloaded(value: number): number;",
    "export function overloaded(value: string | number): string | number { return value; }",
  ].join("\n"));
  git(repository, ["init", "--quiet"]);
  git(repository, ["add", "tsconfig.base.json", "src/dependency.ts", "src/contract.ts"]);
  git(repository, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { repository, commit: git(repository, ["rev-parse", "HEAD"]) };
}

function descriptor() {
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
      roots: [
        "src/contract.ts#interface:Contract",
        "src/contract.ts#export:choose",
        "src/contract.ts#function:overloaded",
      ],
      repositoryEdges: "transitive",
      externalEdges: "resolved_signature",
    },
  };
}

function projectionFixture() {
  const fixture = fixtureRepository();
  const project = createRepositoryProjector(fixture.repository);
  return { ...fixture, project, projection: project(descriptor(), fixture.commit) };
}

test("D2645 constructs the referenced declaration and transitive typed edges", () => {
  const { projection } = projectionFixture();
  assert.ok(projection.semantic.nodes.some((node) => node.exportedName === "Dependency"));
  assert.ok(projection.semantic.edges.some((edge) => edge.kind === "type_reference"));
  assert.ok(projection.semantic.edges.length > 0);
  const crossed = structuredClone(projection.semantic);
  crossed.edges = crossed.edges.filter((edge) => edge.kind !== "type_reference");
  assert.throws(() => assertCompiledGraphExact(crossed, projection.semantic), /compiled-mismatch/u);
});

test("D2646 reads committed repository/config bytes and actual compiler identity", () => {
  const { repository, commit, project, projection } = projectionFixture();
  assert.equal(projection.semantic.program.configDigest, sharedResourceDigest(JSON.parse(readFileSync(path.join(repository, "tsconfig.base.json"), "utf8"))));
  assert.match(projection.semantic.program.compilerIntegrity, /^sha512:[0-9a-f]{128}$/u);
  assert.notEqual(projection.semantic.program.compilerIntegrity, "sha512:author-fixture");
  assert.equal(projection.semantic.program.repositoryCommit, commit);
  assert.deepEqual(projection.semantic.program.rootNames, ["src/contract.ts"]);

  writeFileSync(path.join(repository, "src/contract.ts"), "export interface Contract { readonly version: 99 }");
  assert.equal(project(descriptor(), commit).digest, projection.digest, "working-tree bytes must not enter a commit projection");
  assert.throws(() => project(descriptor(), "not-a-revision"), /repository:rev-parse/u);
  assert.throws(() => project({ ...descriptor(), sourceText: "export const forged = true" }, commit), /descriptor:keys/u);
});

test("D2647 resolves a re-export alias to its target declaration and edge", () => {
  const { projection } = projectionFixture();
  const root = projection.semantic.roots.find((item) => item.selector.endsWith("#export:choose"));
  assert.ok(root.nodes.length >= 2, `public alias and target declarations must both be rooted: ${JSON.stringify(root)}`);
  const edge = projection.semantic.edges.find((item) => item.kind === "re_export");
  assert.ok(edge);
  assert.notEqual(edge.from, edge.to);
});

test("D2648 enforces the exact canonical scalar domain before sealing", () => {
  for (const value of [1.5, Number.MAX_SAFE_INTEGER + 1, -0]) {
    assert.throws(() => deepSealCanonicalV2({ value }), /canonical:number/u);
  }
  assert.throws(() => deepSealCanonicalV2({ value: "\ud800" }), /canonical:string-surrogate/u);
  assert.throws(() => deepSealCanonicalV2({ "\udc00": true }), /canonical:object-key/u);
  assert.deepEqual(deepSealCanonicalV2({ value: "\ud83d\ude80", integer: Number.MAX_SAFE_INTEGER }), {
    integer: Number.MAX_SAFE_INTEGER,
    value: "🚀",
  });
});

test("D2649 maps an overload root to every exact declaration deterministically", () => {
  const { projection } = projectionFixture();
  const root = projection.semantic.roots.find((item) => item.selector.endsWith("#function:overloaded"));
  assert.equal(root.nodes.length, 3);
  assert.equal(new Set(root.nodes).size, 3);
  assert.deepEqual(root.nodes, [...root.nodes].sort());
  assert.equal(assertTypeScriptGraphV2(
    projection.semantic,
    projection.resolvedSelectors,
    projection.semantic.program,
  ), true);
  assert.match(rfc, /selector resolves to one exact compiler symbol.*canonically ordered non-empty `nodes`/su);
});
