// Disposable seventh fresh-review falsifiers for D2593-D2597. Not production behavior.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { validateCatalogue } from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";
import {
  parseCanonicalResource,
  resolveStructuralSelector,
} from "../d2498-shared-resource-bootstrap-fourth-author-repair/model.mjs";
import {
  projectCanonicalResource,
  projectTypeScriptContract,
  retainedRepositoryNodeIds,
  selectorRoot,
} from "../d2537-shared-resource-bootstrap-fifth-author-repair/model.mjs";

function resourceSource(id, payload, prefix = "") {
  const value = { id, version: 1, payload };
  const digest = sharedResourceDigest(value);
  return {
    digest,
    source: `${prefix}export const RESOURCE = Object.freeze({ id: ${JSON.stringify(id)}, version: 1, payload: ${JSON.stringify(payload)}, digest: ${JSON.stringify(digest)} });`,
  };
}

function graph() {
  const root = "contract.ts#interface:Contract";
  const versionSelector = "contract.ts#interface:Contract/member:version/literal";
  return {
    root,
    versionSelector,
    value: {
      program: { configPath: "tsconfig.base.json", rootNames: ["contract.ts"] },
      roots: [selectorRoot(root, "contract.ts\u00000"), selectorRoot(versionSelector, "contract.ts\u00001")],
      nodes: [{ id: "contract.ts\u00000" }, { id: "contract.ts\u00001" }],
      edges: [],
    },
  };
}

test("D2593: incomplete, duplicate and dangling TypeScript graph bytes are digested", () => {
  const candidate = graph();
  candidate.value.nodes.push({ id: "contract.ts\u00000", malformed: true });
  candidate.value.edges.push({ from: "missing-a", to: "missing-b", kind: "invented" });
  const projected = projectTypeScriptContract({
    version: 4,
    graph: candidate.value,
    roots: [candidate.root],
    versionSelector: candidate.versionSelector,
  });
  assert.match(projected.digest, /^sha256:[0-9a-f]{64}$/u);
  for (const required of ["compilerPackage", "compilerVersion", "compilerIntegrity", "configDigest", "compilerOptions"]) {
    assert.equal(Object.hasOwn(projected.semantic.program, required), false);
  }
  assert.equal(projected.semantic.nodes.filter((node) => node.id === "contract.ts\u00000").length, 2);
  assert.equal(projected.semantic.edges[0].from, "missing-a");
});

test("D2594: invalid selector paths/segments pass while a valid seed export cannot resolve", () => {
  const descriptor = (rootSelector) => ({
    id: "synthetic-resource",
    lifecycle: "sequential",
    projection: { adapter: "canonical_resource@1", rootSelector },
    claimMode: "whole_projection",
    introducedBy: "synthetic-process.md",
    introduction: "absent",
  });
  for (const selector of [
    "https://example.com/resource.ts#export:RESOURCE",
    "packages\\runtime\\resource.ts#export:RESOURCE",
    "resource.ts#function:root/export:OTHER",
  ]) {
    assert.equal(validateCatalogue({ schemaVersion: 1, resources: [descriptor(selector)] }).resources.length, 1);
  }

  const seed = JSON.parse(readFileSync("planning/shared-resource-register-bootstrap/initial-catalogue.v1.json", "utf8"));
  const evidence = seed.resources.find((entry) => entry.id === "evidence-kinds");
  const source = readFileSync("apps/server/src/sourcing/types.ts", "utf8");
  assert.throws(
    () => resolveStructuralSelector(source, evidence.projection.rootSelector),
    /root resolved 0 times/u,
  );
});

test("D2595: a shadowed Object.freeze creates different certified and runtime resources", async () => {
  const shadow = `const Object = { freeze(_value) { return { id: "provider-protocol", version: 1, payload: { rows: ["runtime"] }, digest: "sha256:runtime" }; } };\n`;
  const candidate = resourceSource("provider-protocol", { rows: ["certified"] }, shadow);
  const parsed = parseCanonicalResource(candidate.source, "RESOURCE", "provider-protocol");
  assert.deepEqual(parsed.payload, { rows: ["certified"] });
  const url = `data:text/javascript;base64,${Buffer.from(candidate.source).toString("base64")}`;
  const runtime = (await import(url)).RESOURCE;
  assert.deepEqual(runtime.payload, { rows: ["runtime"] });
  assert.notEqual(runtime.digest, parsed.digest);
});

test("D2596: an unrelated same-name declaration enters and renumbers the retained graph", () => {
  const retained = [
    "export function choose(value: string): string;",
    "export function choose(value: number): number;",
    "export function choose(value: string | number): string | number { return value; }",
  ].join("\n");
  const base = retainedRepositoryNodeIds("contract.ts", retained, ["choose"]);
  const crossed = retainedRepositoryNodeIds(
    "contract.ts",
    `function unrelated() { function choose(value: boolean): boolean { return value; } return choose(true); }\n${retained}`,
    ["choose"],
  );
  assert.equal(base.length, 3);
  assert.equal(crossed.length, 4);
  assert.deepEqual(base.map((entry) => entry.id), ["contract.ts\u00000", "contract.ts\u00001", "contract.ts\u00002"]);
  assert.deepEqual(crossed.slice(1).map((entry) => entry.id), ["contract.ts\u00001", "contract.ts\u00002", "contract.ts\u00003"]);
});

test("D2597: canonical and TypeScript projection semantics mutate behind fixed digests", () => {
  const candidate = resourceSource("provider-protocol", { rows: ["a"] });
  const parsed = parseCanonicalResource(candidate.source, "RESOURCE", "provider-protocol");
  const canonical = projectCanonicalResource(
    "provider-protocol",
    "resource.ts#export:RESOURCE",
    parsed,
  );
  const canonicalDigest = canonical.digest;
  canonical.semantic.rows.push("b");
  assert.equal(canonical.digest, canonicalDigest);
  assert.notEqual(
    canonical.digest,
    sharedResourceDigest({ id: "provider-protocol", version: 1, payload: canonical.semantic }),
  );

  const candidateGraph = graph();
  const projected = projectTypeScriptContract({
    version: 4,
    graph: candidateGraph.value,
    roots: [candidateGraph.root],
    versionSelector: candidateGraph.versionSelector,
  });
  const graphDigest = projected.digest;
  projected.semantic.nodes.push({ id: "contract.ts\u00002" });
  assert.equal(projected.digest, graphDigest);
  assert.notEqual(
    projected.digest,
    sharedResourceDigest({ adapter: "typescript_contract@1", version: 4, graph: projected.semantic }),
  );
});
