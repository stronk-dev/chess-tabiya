import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import {
  assertGlobalIntrinsicFreeze,
  assertTypeScriptGraph,
  deepSealCanonical,
  parseStructuralSelector,
  projectCanonicalResourceDeep,
  projectConstructedTypeScriptContract,
  resolveSourceSelector,
  retainExportSymbolDeclarations,
} from "./model.mjs";

const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");

function resourceSource(id, payload, prefix = "") {
  const value = { id, version: 1, payload };
  const digest = sharedResourceDigest(value);
  return `${prefix}export const RESOURCE = Object.freeze({ id: ${JSON.stringify(id)}, version: 1, payload: ${JSON.stringify(payload)}, digest: ${JSON.stringify(digest)} });`;
}

test("D2593 TypeScript projection constructs and validates its graph instead of accepting one", () => {
  const sourceText = "export interface Contract { readonly version: 4; readonly value: string }";
  const root = "contract.ts#interface:Contract";
  const versionSelector = "contract.ts#interface:Contract/member:version/literal";
  const projected = projectConstructedTypeScriptContract({ version: 4, path: "contract.ts", sourceText, roots: [root], versionSelector });
  assert.equal(projected.semantic.program.compilerPackage, "typescript");
  assert.equal(projected.semantic.nodes.length, 2);
  assert.match(projected.digest, /^sha256:[0-9a-f]{64}$/u);
  assert.throws(
    () => projectConstructedTypeScriptContract({ version: 4, path: "contract.ts", sourceText, roots: [root], versionSelector, graph: {} }),
    /typescript-options:keys/u,
  );

  const invalid = {
    program: { compilerPackage: "typescript", compilerVersion: "x", compilerIntegrity: "sha512:x", configPath: "tsconfig.base.json", configDigest: "sha256:x", rootNames: ["contract.ts"], compilerOptions: {} },
    roots: [{ kind: "selector", selector: root, node: "contract.ts\0a" }],
    nodes: [{ id: "contract.ts\0a", origin: "repository", exportedName: "Contract", tree: { kind: "InterfaceDeclaration", text: null, children: [] }, dependencyIdentity: null }],
    edges: [{ from: "contract.ts\0a", to: "missing", kind: "invented", exportPath: [], resolvedSignature: null, overloads: [] }],
  };
  assert.throws(() => assertTypeScriptGraph(invalid, [root]), /graph:/u);
});

function descriptors(path) {
  return JSON.parse(readFileSync(path, "utf8")).resources;
}

function projectionSelectors(projection) {
  return Object.entries(projection)
    .filter(([key, value]) => key.endsWith("Selector") && typeof value === "string")
    .map(([, value]) => value)
    .concat(Array.isArray(projection.roots) ? projection.roots : []);
}

test("D2594 one selector grammar admits and resolves seed plus follow-on descriptors", () => {
  const all = [
    ...descriptors("planning/shared-resource-register-bootstrap/initial-catalogue.v1.json"),
    ...descriptors("planning/assistance-config-register/catalogue-additions.v1.json"),
    ...descriptors("planning/semantic-convention-register/catalogue-additions.v1.json"),
    ...descriptors("planning/provider-protocol-register/catalogue-additions.v1.json"),
  ];
  let resolved = 0;
  for (const descriptor of all) {
    for (const selector of projectionSelectors(descriptor.projection)) {
      const parsed = parseStructuralSelector(selector);
      assert.equal(parsed.canonical, selector);
      if (descriptor.introduction !== "absent") {
        assert.equal(existsSync(parsed.path), true, `${descriptor.id}:${parsed.path}`);
        assert.doesNotThrow(() => resolveSourceSelector(readFileSync(parsed.path, "utf8"), parsed), `${descriptor.id}:${selector}`);
        resolved += 1;
      }
    }
  }
  assert.ok(resolved >= 20);
  for (const invalid of [
    "https://example.com/a.ts#export:X",
    "packages\\runtime\\a.ts#export:X",
    "../a.ts#export:X",
    "a.ts#function:f/export:X",
    "a.ts#interface:I/member:x/literal/member:y",
    "a.ts#$id/member:x",
  ]) assert.throws(() => parseStructuralSelector(invalid), /selector:/u);
  const evidence = parseStructuralSelector("apps/server/src/sourcing/types.ts#export:EVIDENCE_KINDS");
  assert.doesNotThrow(() => resolveSourceSelector(readFileSync(evidence.path, "utf8"), evidence));
});

test("D2595 canonical Object.freeze is the global intrinsic, never a same-spelling binding", () => {
  const exact = resourceSource("provider-protocol", { rows: ["certified"] });
  assert.equal(assertGlobalIntrinsicFreeze(exact), 1);
  assert.doesNotThrow(() => projectCanonicalResourceDeep(exact, "RESOURCE", "provider-protocol", "resource.ts#export:RESOURCE"));
  for (const prefix of [
    "const Object = { freeze(value) { return value; } };\n",
  ]) {
    const crossed = resourceSource("provider-protocol", { rows: ["certified"] }, prefix);
    assert.throws(() => projectCanonicalResourceDeep(crossed, "RESOURCE", "provider-protocol", "resource.ts#export:RESOURCE"), /shadowed-object-freeze/u);
  }
  assert.throws(
    () => assertGlobalIntrinsicFreeze("export function build(Object) { return Object.freeze({}); }"),
    /shadowed-object-freeze/u,
  );
  assert.throws(
    () => assertGlobalIntrinsicFreeze('import Object from "./shadow"; export const RESOURCE = Object.freeze({});'),
    /shadowed-object-freeze/u,
  );
  assert.match(rfc, /global `ObjectConstructor` symbol/u);
});

test("D2596 exact export symbol retains overloads but ignores nested same-spelling declarations", () => {
  const overloads = [
    "export function choose(value: string): string;",
    "export function choose(value: number): number;",
    "export function choose(value: string | number): string | number { return value; }",
  ].join("\n");
  const base = retainExportSymbolDeclarations(overloads, "choose");
  const crossed = retainExportSymbolDeclarations(`function unrelated() { function choose(value: boolean) { return value; } return choose(true); }\n${overloads}`, "choose");
  assert.equal(base.length, 3);
  assert.equal(crossed.length, 3);
  assert.deepEqual(crossed.map((node) => node.id), base.map((node) => node.id));
  assert.ok(base.every((node) => node.symbol === base[0].symbol));
});

test("D2597 projections retain recursively immutable copies under their digests", () => {
  const source = { rows: [{ id: "a", nested: [1] }] };
  const sealed = deepSealCanonical(source);
  source.rows[0].nested.push(2);
  assert.deepEqual(JSON.parse(JSON.stringify(sealed)), { rows: [{ id: "a", nested: [1] }] });
  assert.throws(() => sealed.rows[0].nested.push(3), TypeError);
  assert.throws(() => deepSealCanonical({ get value() { return 1; } }), /accessor/u);
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => deepSealCanonical(cycle), /cycle/u);

  const sourceText = "export interface Contract { readonly version: 4; readonly value: string }";
  const projected = projectConstructedTypeScriptContract({
    version: 4,
    path: "contract.ts",
    sourceText,
    roots: ["contract.ts#interface:Contract"],
    versionSelector: "contract.ts#interface:Contract/member:version/literal",
  });
  assert.throws(() => projected.semantic.nodes.push({}), TypeError);
  assert.equal(
    projected.digest,
    sharedResourceDigest({ adapter: "typescript_contract@1", version: 4, graph: projected.semantic }),
  );
});
