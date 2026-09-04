// Disposable eighth fresh-review falsifiers for D2645-D2649. Not production behavior.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { sharedResourceDigest } from "../d2442-shared-resource-bootstrap-second-author-repair/model.mjs";
import {
  deepSealCanonical,
  projectConstructedTypeScriptContract,
  retainExportSymbolDeclarations,
} from "../d2593-shared-resource-bootstrap-seventh-author-repair/model.mjs";

test("D2645 the constructed graph omits a referenced repository declaration and every edge", () => {
  const sourceText = [
    "interface Dependency { readonly value: string }",
    "export interface Contract { readonly version: 4; readonly dependency: Dependency }",
  ].join("\n");
  const projected = projectConstructedTypeScriptContract({
    version: 4,
    path: "contract.ts",
    sourceText,
    roots: ["contract.ts#interface:Contract"],
    versionSelector: "contract.ts#interface:Contract/member:version/literal",
  });
  assert.equal(projected.semantic.nodes.some((node) => node.exportedName === "Dependency"), false);
  assert.equal(projected.semantic.edges.length, 0);
  assert.match(JSON.stringify(projected.semantic.nodes), /Contract/u);
});

test("D2646 caller source bytes receive a fabricated program/config identity", () => {
  const projected = projectConstructedTypeScriptContract({
    version: 4,
    path: "not-present-in-repository.ts",
    sourceText: "export interface Contract { readonly version: 4 }",
    roots: ["not-present-in-repository.ts#interface:Contract"],
    versionSelector: "not-present-in-repository.ts#interface:Contract/member:version/literal",
  });
  const actualConfig = JSON.parse(readFileSync("tsconfig.base.json", "utf8"));
  assert.equal(projected.semantic.program.compilerIntegrity, "sha512:author-fixture");
  assert.notEqual(projected.semantic.program.configDigest, sharedResourceDigest(actualConfig));
  assert.deepEqual(projected.semantic.program.compilerOptions, {});
});

test("D2647 re-export retention keeps the alias declaration rather than the target symbol", () => {
  const retained = retainExportSymbolDeclarations(
    "function base(value) { return value; } export { base as choose };",
    "choose",
  );
  assert.equal(retained.length, 1);
  assert.equal(retained[0].kind, "ExportSpecifier");
  assert.notEqual(retained[0].kind, "FunctionDeclaration");
});

test("D2648 deep sealing accepts forbidden canonical scalars", () => {
  assert.doesNotThrow(() => deepSealCanonical({ value: 1.5 }));
  assert.doesNotThrow(() => deepSealCanonical({ value: Number.MAX_SAFE_INTEGER + 1 }));
  assert.doesNotThrow(() => deepSealCanonical({ value: "\ud800" }));
});

test("D2649 an exported overload set cannot resolve as a function root", () => {
  const sourceText = [
    "export interface Version { readonly value: 4 }",
    "export function choose(value: string): string;",
    "export function choose(value: number): number;",
    "export function choose(value: string | number): string | number { return value; }",
  ].join("\n");
  assert.throws(() => projectConstructedTypeScriptContract({
    version: 4,
    path: "contract.ts",
    sourceText,
    roots: ["contract.ts#function:choose"],
    versionSelector: "contract.ts#interface:Version/member:value/literal",
  }), /selector:root-count:3/u);
});
