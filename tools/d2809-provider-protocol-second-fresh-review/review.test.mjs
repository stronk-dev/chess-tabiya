import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import ts from "typescript";

import { validateCatalogue } from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";

const read = (path) => readFileSync(path, "utf8");
const reviewed = (path) => execFileSync("git", ["show", `629d6c18:${path}`], { encoding: "utf8" });
const rfc = reviewed("rfc/provider-protocol-register.md");
const bootstrap = reviewed("rfc/shared-resource-register-bootstrap.md");
const makefile = reviewed("Makefile");
const descriptor = validateCatalogue(JSON.parse(reviewed("planning/provider-protocol-register/catalogue-additions.v1.json"))).resources[0];

test("D2809 the maintained review target still executes only the superseded first review", () => {
  assert.match(makefile, /provider-protocol-fresh-review:\n\tnode --test tools\/d2455-provider-protocol-fresh-review\/contract\.test\.mjs/u);
  assert.match(rfc, /seventeen population fixtures/u);
  assert.doesNotMatch(makefile, /provider-protocol-current-author-repair/u);
});

test("D2810 README ownership contradicts the generic parent", () => {
  assert.match(rfc, /generated README register/u);
  assert.match(bootstrap, /`rfc\/README\.md` is \*\*not generated\*\*/u);
});

test("D2811 the normative type-relation interface produces TS1337", () => {
  const source = rfc.match(/interface ProviderProtocolTypeRelations \{[\s\S]*?\n\}/u)?.[0];
  assert.ok(source);
  const fileName = "provider-relations.ts";
  const text = `type ProviderOperationId = "a" | "b";\n${source}`;
  const options = { noEmit: true, strict: true, target: ts.ScriptTarget.ES2022 };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name, target) => name === fileName ? ts.createSourceFile(name, text, target, true) : undefined;
  host.fileExists = (name) => name === fileName;
  host.readFile = (name) => name === fileName ? text : undefined;
  host.getDefaultLibFileName = () => "lib.d.ts";
  host.writeFile = () => {};
  const program = ts.createProgram([fileName], options, host);
  const codes = ts.getPreEmitDiagnostics(program).filter((item) => item.file?.fileName === fileName).map((item) => item.code);
  assert.ok(codes.includes(1337), `expected TS1337; received ${codes.join(",")}`);
});

test("D2812/D2813 copied-consumer closure depends on a nonexistent generic hook protocol", () => {
  assert.match(rfc, /copied operation\/domain union, array or\s+switch vocabulary fails/u);
  assert.match(rfc, /validation hooks attached to the descriptor/u);
  assert.doesNotMatch(bootstrap, /validation hooks attached|projection hook protocol|hook registry/u);
  assert.deepEqual(Object.keys(descriptor).sort(), ["claimMode", "id", "introducedBy", "introduction", "lifecycle", "projection"]);
  assert.doesNotMatch(JSON.stringify(descriptor), /hook/u);
});

test("D2814 canonical-resource routing invents a separate version selector", () => {
  assert.equal(descriptor.projection.adapter, "canonical_resource@1");
  assert.deepEqual(Object.keys(descriptor.projection).sort(), ["adapter", "rootSelector"]);
  const routing = rfc.match(/```tabiya-resource-roots\n([^\n]+)\n```/u)?.[1]?.split(" | ");
  assert.ok(routing);
  assert.equal(routing[3], "packages/runtime/src/provider-protocol.ts#export:PROVIDER_PROTOCOL_RESOURCE.version");
  const canonicalParent = bootstrap.match(/source-attribution-registry \| sequential\/canonical_resource@1\/absent \|[^\n]+/u)?.[0]?.split(" | ");
  assert.equal(canonicalParent?.[3], "none");
});
