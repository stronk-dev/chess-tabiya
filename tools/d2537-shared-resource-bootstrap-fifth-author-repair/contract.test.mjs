// Disposable fifth author-repair contract for D2537-D2541. It validates RFC bytes only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { parseCanonicalResource } from "../d2498-shared-resource-bootstrap-fourth-author-repair/model.mjs";
import { validateCatalogue } from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";
import {
  buildProgramIdentity,
  migrationApplyRoot,
  projectCanonicalResource,
  projectTypeScriptContract,
  retainedRepositoryNodeIds,
  selectorRoot,
} from "./model.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/shared-resource-register-bootstrap.md");

test("D2537: canonical resources validate their exact digest and closed literal grammar", () => {
  const value = { id: "provider-protocol", version: 1, payload: { rows: ["a"] } };
  const digest = sharedResourceDigest(value);
  assert.deepEqual(parseCanonicalResource(
    `export const RESOURCE = { id: "provider-protocol", version: 1, payload: { rows: ["a"] }, digest: "${digest}" };`,
    "RESOURCE",
  ), { ...value, digest });
  for (const source of [
    `export const RESOURCE = { id: "provider-protocol", version: 1, payload: {}, digest: "sha256:${"0".repeat(64)}" };`,
    "export const RESOURCE = { id: `provider-protocol`, version: 1, payload: {}, digest: `sha256:x` };",
    `export const RESOURCE = { id: "provider-protocol", version: 0x1, payload: {}, digest: "sha256:x" };`,
    `export const RESOURCE = { id: "provider-protocol", version: 1, payload: { zero: -0 }, digest: "sha256:x" };`,
  ]) assert.throws(() => parseCanonicalResource(source, "RESOURCE"));
});

test("D2538: retained-only ordinals ignore unrelated declarations but retained changes remain visible", () => {
  const base = `export interface Contract { value: string }\nfunction helper() { return 1 }`;
  const prefixed = `interface Unrelated { ignored: number }\n${base}`;
  assert.deepEqual(retainedRepositoryNodeIds("contract.ts", base, ["Contract", "helper"]),
    retainedRepositoryNodeIds("contract.ts", prefixed, ["Contract", "helper"]));
  assert.notDeepEqual(retainedRepositoryNodeIds("contract.ts", base, ["Contract", "helper"]),
    retainedRepositoryNodeIds("contract.ts", base, ["helper"]));
  assert.match(rfc, /ordinal \*\*among retained repository declarations in that path\*\*/u);
});

test("D2539: descriptors and graph semantics carry one canonical compiler-program identity", () => {
  const assistance = validateCatalogue(JSON.parse(read("planning/assistance-config-register/catalogue-additions.v1.json")));
  const graphResources = assistance.resources.filter((resource) => resource.projection.adapter === "typescript_contract@1");
  assert.equal(graphResources.length, 2);
  assert.ok(graphResources.every((resource) => resource.projection.programConfig === "tsconfig.base.json"));
  const migration = validateCatalogue(JSON.parse(read("planning/shared-resource-register-bootstrap/initial-catalogue.v1.json")))
    .resources.find((resource) => resource.id === "migration");
  assert.equal(migration.projection.programConfig, "tsconfig.base.json");

  const identity = buildProgramIdentity({
    configText: read("tsconfig.base.json"),
    rootNames: ["packages/runtime/src/assistance.ts", "apps/web/src/lib/assistance-preference.ts"],
    compilerVersion: "5.9.2",
    compilerIntegrity: "sha512:pinned",
  });
  assert.deepEqual(identity.rootNames, ["apps/web/src/lib/assistance-preference.ts", "packages/runtime/src/assistance.ts"]);
  assert.deepEqual(identity.compilerOptions.types, []);
  assert.equal(identity.configPath, "tsconfig.base.json");
  assert.match(rfc, /One `ts\.createProgram` is created at repository\s+root/u);
});

test("D2540: selector and migration callback roots are distinct complete values", () => {
  assert.deepEqual(selectorRoot("a.ts#export:A", "a.ts\u00000"),
    { kind: "selector", selector: "a.ts#export:A", node: "a.ts\u00000" });
  assert.deepEqual(migrationApplyRoot("storage.ts#local:migrations", 7, "storage.ts\u00002"), {
    kind: "migration_apply", sequenceSelector: "storage.ts#local:migrations", version: 7,
    property: "apply", node: "storage.ts\u00002",
  });
  assert.throws(() => migrationApplyRoot("storage.ts#local:migrations", 0, "storage.ts\u00002"));
  assert.match(rfc, /type ContractRootV1/u);
});

test("D2541: canonical and TypeScript adapters produce exact complete projections", () => {
  const resource = { id: "provider-protocol", version: 1, payload: { rows: ["a"] } };
  const digest = sharedResourceDigest(resource);
  assert.deepEqual(projectCanonicalResource("resource.ts#export:RESOURCE", { ...resource, digest }), {
    identity: { version: 1 }, semantic: { rows: ["a"] }, digest,
    resolvedSelectors: ["resource.ts#export:RESOURCE"],
  });
  const graph = { program: { configPath: "tsconfig.base.json" }, roots: [], nodes: [], edges: [] };
  const projected = projectTypeScriptContract({
    version: 4,
    graph,
    roots: ["assistance.ts#interface:AssistanceConfig"],
    versionSelector: "assistance.ts#interface:AssistanceConfig/member:version/literal",
  });
  assert.deepEqual(projected.identity, { version: 4 });
  assert.equal(projected.semantic, graph);
  assert.equal(projected.digest, sharedResourceDigest({ adapter: "typescript_contract@1", version: 4, graph }));
  assert.deepEqual(projected.resolvedSelectors, [
    "assistance.ts#interface:AssistanceConfig",
    "assistance.ts#interface:AssistanceConfig/member:version/literal",
  ]);
});
