import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertTypeScriptGraphV4,
  createExactClosedRepositoryProjector,
} from "./model.mjs";

const INTEGRITY = "sha512-FixtureIntegrityForExactPackageIdentity000000000000000000000000000000000000000000000000000000000000000=";

function git(repositoryRoot, args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

function repository(contractSource, { configText, dependency = false, extraFiles = {} } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-bootstrap-tenth-author-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "tsconfig.base.json"), configText ?? JSON.stringify({
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
  if (dependency) {
    mkdirSync(path.join(root, "node_modules/fake-package"), { recursive: true });
    writeFileSync(path.join(root, "node_modules/fake-package/package.json"), JSON.stringify({ name: "fake-package", version: "1.0.0", types: "index.d.ts" }));
    writeFileSync(path.join(root, "node_modules/fake-package/index.d.ts"), "export interface External { readonly value: string }");
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

test("D2701 duplicate compiler-config keys fail before program construction", () => {
  const fixture = repository("export interface Contract { readonly version: 1 }", {
    configText: '{"compilerOptions":{"strict":false},"compilerOptions":{"module":"ESNext","moduleResolution":"Bundler","strict":true,"target":"ES2022"}}',
  });
  assert.throws(() => createExactClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit), /program:config-duplicate-key/u);
});

test("D2702 exact dependency source identity changes with the declaration bytes", () => {
  const fixture = repository(['import type { External } from "fake-package";', "export interface Contract { readonly version: 1; readonly external: External }"].join("\n"), { dependency: true });
  const project = createExactClosedRepositoryProjector(fixture.root);
  const before = project(descriptor(), fixture.commit);
  writeFileSync(path.join(fixture.root, "node_modules/fake-package/index.d.ts"), "export interface External { readonly value: number }");
  const after = project(descriptor(), fixture.commit);
  const beforeIdentity = before.semantic.nodes.find((node) => node.origin === "external_package").dependencyIdentity;
  const afterIdentity = after.semantic.nodes.find((node) => node.origin === "external_package").dependencyIdentity;
  assert.notEqual(afterIdentity.sourceDigest, beforeIdentity.sourceDigest);
  assert.notEqual(after.digest, before.digest);
});

test("D2703 origin and dependency identities cannot cross", () => {
  const fixture = repository(['import type { External } from "fake-package";', "export interface Contract { readonly version: 1; readonly external: External }"].join("\n"), { dependency: true });
  const projected = createExactClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const crossed = structuredClone(projected.semantic);
  crossed.nodes.find((node) => node.origin === "external_package").origin = "typescript_lib";
  assert.throws(() => assertTypeScriptGraphV4(crossed, projected.resolvedSelectors, projected.semantic.program), /dependency:typescript-origin/u);
});

test("D2704 duplicate descriptor roots fail before compilation", () => {
  const fixture = repository("export interface Contract { readonly version: 1 }");
  const version = "src/contract.ts#interface:Contract/member:version/literal";
  assert.throws(() => createExactClosedRepositoryProjector(fixture.root)(descriptor(version), fixture.commit), /descriptor:duplicate-root/u);
});

test("D2705 non-call edges cannot carry signature or overload arms", () => {
  const fixture = repository(["export interface Dependency { readonly value: string }", "export interface Contract { readonly version: 1; readonly dependency: Dependency }"].join("\n"));
  const projected = createExactClosedRepositoryProjector(fixture.root)(descriptor(), fixture.commit);
  const crossed = structuredClone(projected.semantic);
  const edge = crossed.edges.find((candidate) => candidate.kind === "type_reference");
  edge.resolvedSignature = structuredClone(crossed.nodes[0].tree);
  assert.throws(() => assertTypeScriptGraphV4(crossed, projected.resolvedSelectors, projected.semantic.program), /graph:non-call-arm/u);
});

test("D2706 unresolved any calls fail closed", () => {
  const fixture = repository(["declare const unsafe: any;", "export interface Contract { readonly version: 1 }", "export function run() { return unsafe(); }"].join("\n"));
  assert.throws(() => createExactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit), /resolution:unresolved-signature/u);
});

test("D2707 dynamic imports fail before publication", () => {
  const fixture = repository(["export interface Contract { readonly version: 1 }", 'export async function run() { return import("./dependency"); }'].join("\n"), { extraFiles: { "src/dependency.ts": "export const dependency = 1;" } });
  assert.throws(() => createExactClosedRepositoryProjector(fixture.root)(descriptor("src/contract.ts#function:run"), fixture.commit), /resolution:dynamic-import/u);
});

test("D2708 broad index lookup fails while a literal computed key remains representable", () => {
  const broad = repository(["declare const byName: Record<string, () => string>;", "export interface Contract { readonly version: 1 }", "export function run(key: string): string { return byName[key](); }"].join("\n"));
  assert.throws(() => createExactClosedRepositoryProjector(broad.root)(descriptor("src/contract.ts#function:run"), broad.commit), /resolution:broad-index/u);
  const literal = repository(["const byName = { fixed: (): string => 'ok' };", "export interface Contract { readonly version: 1 }", "export function run(): string { return byName['fixed'](); }"].join("\n"));
  assert.equal(createExactClosedRepositoryProjector(literal.root)(descriptor("src/contract.ts#function:run"), literal.commit).identity.version, 1);
});
