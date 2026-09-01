// Disposable fourth author contract for D2498-D2501. It validates RFC bytes, not a production engine.
import assert from "node:assert/strict";
import { basename } from "node:path";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateCatalogue } from "../d2488-shared-resource-bootstrap-third-author-repair/model.mjs";
import { parseCanonicalResource, resolveStructuralSelector } from "./model.mjs";

const read = (path) => readFileSync(path, "utf8");
const bootstrap = read("rfc/shared-resource-register-bootstrap.md");

function descriptorSource(rfcPath, requireDeclaringOwner = true) {
  const rfc = read(rfcPath);
  const source = rfc.match(/```tabiya-resource-descriptor-source\n([^\n]+)\n```/u)?.[1];
  assert.ok(source, `${rfcPath} has no descriptor source`);
  const catalogue = validateCatalogue(JSON.parse(read(source)));
  const introducedBy = basename(rfcPath);
  if (requireDeclaringOwner) {
    assert.ok(catalogue.resources.every((resource) => resource.introducedBy === introducedBy));
  }
  const roots = rfc.match(/```tabiya-resource-roots\n([\s\S]*?)\n```/u)?.[1]
    .split("\n").map((line) => line.split(" | ")[0]);
  assert.deepEqual(roots.sort(), catalogue.resources.map((resource) => resource.id).sort());
  return catalogue;
}

test("D2498: the adopted assistance version selectors use the closed slash grammar and resolve", () => {
  const catalogue = descriptorSource("rfc/assistance-config-register.md");
  const assistance = catalogue.resources.find((resource) => resource.id === "assistance-config");
  const workflow = catalogue.resources.find((resource) => resource.id === "workflow-preference");
  const assistanceSource = read("packages/runtime/src/assistance.ts");
  const preferenceSource = read("apps/web/src/lib/assistance-preference.ts");
  assert.equal(resolveStructuralSelector(assistanceSource, assistance.projection.versionSelector), 4);
  assert.equal(resolveStructuralSelector(preferenceSource, workflow.projection.versionSelector), 1);
  assert.throws(() => resolveStructuralSelector(assistanceSource,
    "packages/runtime/src/assistance.ts#interface:AssistanceConfig.member:version.literal"), /dotted/u);
  assert.throws(() => resolveStructuralSelector(preferenceSource,
    "apps/web/src/lib/assistance-preference.ts#function:loadWorkflowPreset/object:version/literal"), /resolved 0 times/u);
});

test("D2499: every bootstrap and follow-on process RFC authorizes complete descriptor bytes", () => {
  const bootstrapSeed = descriptorSource("rfc/shared-resource-register-bootstrap.md", false);
  assert.equal(bootstrapSeed.resources.length, 10);
  assert.deepEqual([...new Set(bootstrapSeed.resources.map((resource) => resource.introducedBy))].sort(),
    ["shared-resource-register-bootstrap.md", "shared-resource-registers.md"]);
  assert.equal(descriptorSource("rfc/assistance-config-register.md").resources.length, 5);
  assert.equal(descriptorSource("rfc/semantic-convention-register.md").resources.length, 1);
  assert.equal(descriptorSource("rfc/provider-protocol-register.md").resources.length, 1);
  assert.match(bootstrap, /requires canonical equality between the source file's rows and the rows appended/u);
  assert.match(bootstrap, /`introducedBy`\s+must equal that declaring RFC's basename/u);
});

test("D2500: TypeScript and migration graphs have one exact node/edge/signature image", () => {
  for (const token of [
    "interface SyntaxTreeV1", "interface ContractNodeV1", "interface ContractEdgeV1",
    "interface TypeScriptGraphV1", "readonly resolvedSignature: SyntaxTreeV1 | null",
    "readonly overloads: readonly SyntaxTreeV1[]", "edges sort by the canonical bytes",
    "Every edge endpoint must name a retained node", "applyGraph` is the exact `TypeScriptGraphV1",
  ]) assert.ok(bootstrap.includes(token), `missing graph contract: ${token}`);
});

test("D2501: canonical resources are statically parsed and reject executable or open shapes", () => {
  assert.match(bootstrap, /never imports,\s+bundles or executes the target module/u);
  const positive = `export const RESOURCE = Object.freeze({ id: "provider-protocol", version: 1, payload: Object.freeze({ rows: ["a"] }), digest: "sha256:abc" } as const);`;
  assert.deepEqual(parseCanonicalResource(positive, "RESOURCE"), {
    id: "provider-protocol", version: 1, payload: { rows: ["a"] }, digest: "sha256:abc",
  });
  for (const source of [
    `export const RESOURCE = makeResource({ id: "x" });`,
    `export const RESOURCE = { id: "x", version: 1, payload: other, digest: "sha256:x" };`,
    `export const RESOURCE = { id: "x", version: 1, payload: { ...other }, digest: "sha256:x" };`,
    `export const RESOURCE = { id: "x", version: 1, get payload() { return {}; }, digest: "sha256:x" };`,
  ]) assert.throws(() => parseCanonicalResource(source, "RESOURCE"));
});
