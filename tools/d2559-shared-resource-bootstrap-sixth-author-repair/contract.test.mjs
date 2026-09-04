// Sixth author-repair contract for D2559-D2562. It validates contract bytes only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import { parseCanonicalResource } from "../d2498-shared-resource-bootstrap-fourth-author-repair/model.mjs";
import {
  projectCanonicalResource,
  projectTypeScriptContract,
  retainedRepositoryNodeIds,
  selectorRoot,
} from "../d2537-shared-resource-bootstrap-fifth-author-repair/model.mjs";

const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");

function resource(id, payload) {
  const value = { id, version: 1, payload };
  const digest = sharedResourceDigest(value);
  return {
    ...value,
    digest,
    source: `export const RESOURCE = { id: ${JSON.stringify(id)}, version: 1, payload: ${JSON.stringify(payload)}, digest: ${JSON.stringify(digest)} };`,
  };
}

test("D2559: canonical identity is bound to the catalogue descriptor", () => {
  const exact = resource("provider-protocol", { rows: [] });
  assert.equal(parseCanonicalResource(exact.source, "RESOURCE", "provider-protocol").id, "provider-protocol");
  assert.throws(() => parseCanonicalResource(exact.source, "RESOURCE", "assistance-exchange"), /identity/u);
  assert.throws(() => projectCanonicalResource(
    "assistance-exchange",
    "packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE",
    exact,
  ), /descriptor/u);
});

test("D2560: canonical-resource payload is a plain semantic object", () => {
  for (const payload of [[], "scalar", null]) {
    const candidate = resource("provider-protocol", payload);
    assert.throws(() => parseCanonicalResource(candidate.source, "RESOURCE", "provider-protocol"), /payload object/u);
    assert.throws(() => projectCanonicalResource("provider-protocol", "resource.ts#export:RESOURCE", candidate), /payload object/u);
  }
});

test("D2561: every selected TypeScript root is exact and retained", () => {
  const root = "contract.ts#interface:Contract";
  const version = "contract.ts#interface:Contract/member:version/literal";
  const graph = {
    program: { configPath: "tsconfig.base.json", rootNames: ["contract.ts"] },
    roots: [selectorRoot(root, "contract.ts\u00000"), selectorRoot(version, "contract.ts\u00001")],
    nodes: [{ id: "contract.ts\u00000" }, { id: "contract.ts\u00001" }],
    edges: [],
  };
  const exact = projectTypeScriptContract({ version: 4, graph, roots: [root], versionSelector: version });
  assert.deepEqual(exact.resolvedSelectors, [root, version]);
  for (const invalid of [
    { ...graph, roots: [] },
    { ...graph, roots: [...graph.roots, selectorRoot("contract.ts#type:Extra", "contract.ts\u00002")] },
    { ...graph, roots: [selectorRoot(root, "missing"), graph.roots[1]] },
    { ...graph, program: { ...graph.program, rootNames: ["other.ts"] } },
  ]) assert.throws(() => projectTypeScriptContract({ version: 4, graph: invalid, roots: [root], versionSelector: version }));
});

test("D2562: retained overload declarations keep distinct ordered identities", () => {
  const overloads = [
    "export function choose(value: string): string;",
    "export function choose(value: number): number;",
    "export function choose(value: string | number): string | number { return value; }",
  ].join("\n");
  assert.deepEqual(retainedRepositoryNodeIds("contract.ts", overloads, ["choose"]), [
    { name: "choose", id: "contract.ts\u00000" },
    { name: "choose", id: "contract.ts\u00001" },
    { name: "choose", id: "contract.ts\u00002" },
  ]);
  const prefixed = `interface Unrelated { ignored: number }\n${overloads}`;
  assert.deepEqual(retainedRepositoryNodeIds("contract.ts", prefixed, ["choose"]),
    retainedRepositoryNodeIds("contract.ts", overloads, ["choose"]));
  assert.match(rfc, /every retained declaration, including same-name overload signatures/u);
});
