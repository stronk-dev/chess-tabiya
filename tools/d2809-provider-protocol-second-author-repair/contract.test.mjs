import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import ts from "typescript";

import { validateCatalogue } from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/provider-protocol-register.md");
const bootstrap = read("rfc/shared-resource-register-bootstrap.md");
const makefile = read("Makefile");
const descriptor = validateCatalogue(JSON.parse(read("planning/provider-protocol-register/catalogue-additions.v1.json"))).resources[0];
const prose = rfc.replace(/\s+/gu, " ");

function diagnostics(source) {
  const fileName = "provider-relations.ts";
  const options = { noEmit: true, strict: true, target: ts.ScriptTarget.ES2022 };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name, target) => name === fileName ? ts.createSourceFile(name, source, target, true) : undefined;
  host.fileExists = (name) => name === fileName;
  host.readFile = (name) => name === fileName ? source : undefined;
  host.getDefaultLibFileName = () => "lib.d.ts";
  host.writeFile = () => {};
  const program = ts.createProgram([fileName], options, host);
  return ts.getPreEmitDiagnostics(program).filter((item) => item.file?.fileName === fileName);
}

test("D2809 historical reviews are revision-pinned and the maintained repair is verify-owned", () => {
  const first = read("tools/d2455-provider-protocol-fresh-review/contract.test.mjs");
  const second = read("tools/d2809-provider-protocol-second-fresh-review/review.test.mjs");
  assert.match(first, /f5d26ff2\^:rfc\/provider-protocol-register\.md/u);
  assert.match(second, /629d6c18/u);
  assert.match(makefile, /verify-governance:[^\n]*provider-protocol-second-author-repair/u);
});

test("D2810 README is human-owned and mechanically checked exactly as the generic parent requires", () => {
  assert.doesNotMatch(prose, /generated README register/u);
  assert.match(prose, /human-owned, mechanically checked README register/u);
  assert.match(bootstrap, /`rfc\/README\.md` is \*\*not generated\*\*/u);
});

test("D2811 the operation relation is a compilable complete mapped type", () => {
  const relation = rfc.match(/type ProviderProtocolTypeRelations = \{[\s\S]*?\n\};/u)?.[0];
  assert.ok(relation);
  const source = `type ProviderOperationId = "a" | "b";\n${relation}\nconst valid: ProviderProtocolTypeRelations = {a:{request:null,result:null,localResult:null},b:{request:null,result:null,localResult:null}};`;
  assert.deepEqual(diagnostics(source).map((item) => item.code), []);
  const missing = `type ProviderOperationId = "a" | "b";\n${relation}\nconst invalid: ProviderProtocolTypeRelations = {a:{request:null,result:null,localResult:null}};`;
  assert.ok(diagnostics(missing).some((item) => item.code === 2741));
});

test("D2812/D2813 process scope has no invented hook and product closure has an exact future owner", () => {
  assert.doesNotMatch(prose, /validation hooks attached to the descriptor|projection hook protocol/u);
  assert.match(prose, /provider-exchange-and-execution\.md` owns its exact obligation parser, consumer-root population and able-to-fail validator/u);
  assert.match(prose, /not an acceptance criterion of this process RFC/u);
  assert.doesNotMatch(bootstrap, /validation hooks attached|projection hook protocol|hook registry/u);
  assert.doesNotMatch(JSON.stringify(descriptor), /hook/u);
});

test("D2814 the canonical-resource routing summary has no separate version selector", () => {
  const routing = rfc.match(/```tabiya-resource-roots\n([^\n]+)\n```/u)?.[1]?.split(" | ");
  assert.equal(descriptor.projection.adapter, "canonical_resource@1");
  assert.deepEqual(Object.keys(descriptor.projection).sort(), ["adapter", "rootSelector"]);
  assert.equal(routing?.[2], descriptor.projection.rootSelector);
  assert.equal(routing?.[3], "none");
});
