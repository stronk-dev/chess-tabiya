import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bounded = readFileSync("rfc/bounded-policy-targets.md", "utf8");
const valueAuthority = readFileSync("rfc/evidence-value-authority.md", "utf8");
const proposed = readFileSync("tools/d2202-bounded-target-third-author-repair/protocol.proposed.ts", "utf8");
const routeMap = JSON.parse(readFileSync("planning/evidence-foundation-ux/evidence-value-authority-route-map.json", "utf8"));

test("D2628 the imported protocol image omits normative public structure", () => {
  assert.match(bounded, /export interface BoundedTargetBatchRequest/u);
  assert.doesNotMatch(proposed, /interface BoundedTargetBatchRequest/u);
  assert.match(bounded, /export interface TargetDerivation \{\s+readonly target:/u);
  assert.match(proposed, /interface TargetDerivation \{ readonly candidates:/u);
  assert.doesNotMatch(proposed, /readonly target:/u);
  assert.match(bounded, /readonly projection: \{ readonly id: Id; readonly version: 1 \}/u);
  assert.match(proposed, /projection: "derived\.bounded_target\.immediate"/u);
  for (const publicName of [
    "BoundedTargetServiceLimits",
    "BoundedTargetServiceOptions",
    "BoundedTargetBackgroundService",
    "NamedMaterialTargetFactoryResult",
    "BoundedTargetImmediateFactoryResult",
  ]) assert.doesNotMatch(proposed, new RegExp(`(?:interface|type|class) ${publicName}\\b`, "u"));
});

test("D2629 sole-import policy leaves the service without a typed factory dispatch", () => {
  assert.match(bounded, /central route registry to be their sole non-test importer/u);
  assert.match(bounded, /`packages\/runtime\/src\/bounded-target\.ts`/u);
  assert.match(bounded, /`packages\/runtime\/src\/internal\/bounded-target-factories\.ts`/u);
  assert.doesNotMatch(bounded, /(?:invoke|dispatch)BoundedTarget(?:Evidence|Factory|Route)/u);
  assert.doesNotMatch(valueAuthority, /(?:invoke|dispatch)BoundedTarget(?:Evidence|Factory|Route)/u);
});

test("D2630 the bounded draft conflicts with the exact registered threat factory", () => {
  const route = routeMap.routes.find((row) => row.currentProjection === "rules.tactic.consequence.threat@1");
  assert.ok(route);
  assert.equal(route.targetProfiles[0].factorySymbol, "createRulesTacticConsequenceThreatV1Evidence");
  assert.match(bounded, /export function declareThreatEvidence\(sourceFen: string\)/u);
  assert.match(valueAuthority, /neither document may introduce a compatibility alias/u);
  assert.notEqual(route.targetProfiles[0].factorySymbol, "declareThreatEvidence");
});
