// Fresh-review instrument for D2559-D2562. Green reproduces blockers; it is not acceptance.
import assert from "node:assert/strict";
import test from "node:test";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { parseCanonicalResource } from "../d2498-shared-resource-bootstrap-fourth-author-repair/model.mjs";
import {
  projectCanonicalResource,
  projectTypeScriptContract,
  retainedRepositoryNodeIds,
} from "../d2537-shared-resource-bootstrap-fifth-author-repair/model.mjs";

function canonicalSource(id, payload) {
  const value = { id, version: 1, payload };
  const digest = sharedResourceDigest(value);
  return {
    digest,
    source: `export const RESOURCE = { id: ${JSON.stringify(id)}, version: 1, payload: ${JSON.stringify(payload)}, digest: ${JSON.stringify(digest)} };`,
  };
}

test("D2559: canonical resource identity is self-validated rather than descriptor-bound", () => {
  const crossed = canonicalSource("assistance-exchange", { rows: [] });
  const parsed = parseCanonicalResource(crossed.source, "RESOURCE");
  const projected = projectCanonicalResource(
    "packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE",
    parsed,
  );
  assert.equal(parsed.id, "assistance-exchange");
  assert.equal(projected.identity.version, 1);
  assert.equal(projected.digest, crossed.digest);
  assert.equal(Object.hasOwn(projected.identity, "id"), false);
});

test("D2560: canonical-resource payload accepts non-object semantic roots", () => {
  for (const payload of [[], "scalar", null]) {
    const candidate = canonicalSource("provider-protocol", payload);
    const parsed = parseCanonicalResource(candidate.source, "RESOURCE");
    assert.deepEqual(parsed.payload, payload);
    assert.equal(projectCanonicalResource("resource.ts#export:RESOURCE", parsed).digest, candidate.digest);
  }
});

test("D2561: TypeScript projection accepts selectors beside an empty unrelated graph", () => {
  const graph = {
    program: { configPath: "tsconfig.base.json" },
    roots: [],
    nodes: [],
    edges: [],
  };
  const projected = projectTypeScriptContract({
    version: 4,
    graph,
    roots: ["packages/runtime/src/assistance.ts#interface:AssistanceConfig"],
    versionSelector: "packages/runtime/src/assistance.ts#interface:AssistanceConfig/member:version/literal",
  });
  assert.equal(projected.semantic.roots.length, 0);
  assert.equal(projected.resolvedSelectors.length, 2);
  assert.equal(projected.identity.version, 4);
});

test("D2562: retained declaration ids collapse overloads with the same name", () => {
  const source = [
    "export function choose(value: string): string;",
    "export function choose(value: number): number;",
    "export function choose(value: string | number): string | number { return value; }",
  ].join("\n");
  const ids = retainedRepositoryNodeIds("contract.ts", source, ["choose"]);
  assert.deepEqual(Object.keys(ids), ["choose"]);
  assert.equal(ids.choose, "contract.ts\u00002");
});
