// DISPOSABLE sixth fresh independent buildability review — D2450-D2454.
// This reproduces process-contract blockers; it does not implement any register or product bytes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const intent = read("rfc/intent-presets.md");
const bootstrap = read("rfc/shared-resource-register-bootstrap.md");

function between(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return text.slice(from, to);
}

test("D2450 workflow-v2 omits authority nodes that its own before/after graph moves", () => {
  const workflow = between(rfc, "Its historical head-1 grammar is exactly:", "`assistance-permission` uses");
  const transition = between(workflow, "Workflow-v2 is the first strict grammar", "Its tree stores");
  assert.match(workflow, /packages\/runtime\/src\/presets\.ts#WORKFLOW_CONTEXT_POLICIES/u);
  assert.match(workflow, /packages\/runtime\/src\/presets\.ts#workflowContextPolicy/u);
  assert.match(intent, /interface ContextContract[\s\S]*readonly configClamp:/u);
  assert.match(intent, /beside `WORKFLOW_CONTEXT_POLICIES`, whose `configClamp` field it reads/u);
  assert.doesNotMatch(transition, /WORKFLOW_CONTEXT_POLICIES|workflowContextPolicy/u);
  assert.match(rfc, /bodyDigest:[\s\S]*canonical semantic subtree/u);
});

test("D2451 permission transition omits the clamp type and pointwise composition authority", () => {
  const permission = between(rfc, "The exact `legal` transition population is:", "`assistance-exchange` adds");
  assert.match(rfc, /every semantic operation that returns, clamps or compiles it/u);
  assert.match(intent, /export type ConfigClamp/u);
  assert.match(intent, /return pointwiseMin\(accessPermission\(context\), contextClamp\(context\.workflowContext\)\)/u);
  assert.doesNotMatch(permission, /ConfigClamp|pointwiseMin/u);
});

test("D2452 exchange defines no landed authority graph or contract-digest image", () => {
  const exchange = between(rfc, "`assistance-exchange` adds one new claim form:", "README gains three register sections");
  assert.match(exchange, /type NumericResourceTreeState/u);
  assert.match(exchange, /contractDigest: string/u);
  assert.doesNotMatch(exchange, /authorityNodes|authorityEdges|canonical JSON|digest image|bodyDigest/u);
  assert.match(exchange, /The exact first-lane exchange transition is:/u);
});

test("D2453 permission semantic drift has no claim grammar", () => {
  assert.match(rfc, /return-site or package-export changes move them/u);
  assert.match(rfc, /assistance-permission \| members legal \|/u);
  assert.doesNotMatch(rfc, /assistance-permission \| lane|assistance-permission \| next/u);
});

test("D2454 active process RFCs require incompatible register authorities", () => {
  assert.match(rfc, /`RESOURCE_NAMES` gains all three literal names/u);
  assert.match(rfc, /adds the literal canonical resource `assistance-config` to\s+`RESOURCE_NAMES`/u);
  assert.match(bootstrap, /`RESOURCE_NAMES` and `SCHEMA_SLUGS` are deleted as independent authority/u);
  assert.doesNotMatch(rfc, /Depends on:[^\n]*shared-resource-register-bootstrap/u);
  assert.doesNotMatch(bootstrap, /Depends on:[^\n]*assistance-config-register/u);
});
