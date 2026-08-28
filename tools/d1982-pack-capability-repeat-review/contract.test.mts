// DISPOSABLE review harness — D1982-D1992. Not production code.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const requireFromSchema = createRequire(new URL("../../packages/schema/package.json", import.meta.url));
const Ajv2020 = requireFromSchema("ajv/dist/2020.js").default as typeof import("../../packages/schema/node_modules/ajv/dist/2020.js").default;

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const evidenceContract = read("packages/runtime/src/evidence-contract.ts");
const capabilities = read("apps/server/src/capabilities.ts");
const dispositions = read("packages/schema/src/drill-pack/dispositions.ts");

test("D1982: the stated lowercase namespace rejects normative ids", () => {
  assert.match(rfc, /id: string;\s+\/\/ dotted, lowercase/);
  assert.match(rfc, /`structuralFeature\.outpost`/);
  assert.match(rfc, /`error\.SIMULATE_BUDGET_EXCEEDED`/);
  assert.equal("structuralFeature.outpost" === "structuralFeature.outpost".toLowerCase(), false);
  assert.equal("error.SIMULATE_BUDGET_EXCEEDED" === "error.SIMULATE_BUDGET_EXCEEDED".toLowerCase(), false);
  assert.doesNotMatch(rfc, /CAPABILITY_ID_PATTERN|capability id regex/i);
});

test("D1983: integer CapabilityId cannot round-trip resolved semver", () => {
  assert.match(rfc, /readonly version: number;\s+\/\/ integer >= 1/);
  assert.match(rfc, /capability version is the entry's structured semver/);
  const shape = JSON.parse(read("content/shapes/maroczy-bind.json")) as { version: unknown };
  assert.equal(shape.version, "0.1.3");
  assert.equal(Number.isInteger(shape.version), false);
  assert.match(read("schemas/shape_entry.schema.json"), /"version": \{ "\$ref": "#\/\$defs\/semver" \}/);
  assert.match(read("schemas/principle_entry.schema.json"), /"version": \{ "\$ref": "#\/\$defs\/semver" \}/);
});

test("D1984: the full applicability authority is absent", () => {
  assert.match(rfc, /`CAPABILITY_APPLICABILITY` is the single checked mapping/);
  assert.match(rfc, /The minimum executable fixture includes:/);
  assert.doesNotMatch(rfc, /export const CAPABILITY_APPLICABILITY/);
  const checkpoint = read("tools/d1620-pack-capability-closure/capability-closure.test.ts");
  assert.match(checkpoint, /const REQUIREMENT_RULES/);
  assert.equal((checkpoint.match(/capability: "/g) ?? []).length, 4);
  assert.doesNotMatch(checkpoint, /RFC 6901|~0|~1/);
});

test("D1985: F1 projections lack F3's mandatory sites and semantics digest", () => {
  const projection = evidenceContract.slice(
    evidenceContract.indexOf("export interface ProjectionDeclaration"),
    evidenceContract.indexOf("export interface ProducerDeclaration"),
  );
  assert.doesNotMatch(projection, /CapabilitySite|sites:/);
  assert.doesNotMatch(projection, /semanticsDigest/);
  assert.match(rfc, /readonly sites: readonly CapabilitySite\[\];\s+\/\/ exact AST sites, >= 1/);
  assert.match(rfc, /F1 projections\.\*\* Core projections are absorbed .* by structured/s);
});

test("D1986: shipped refused rows have no ruledBy authority", () => {
  assert.equal((capabilities.match(/disposition: "refused"/g) ?? []).length, 17);
  assert.equal((dispositions.match(/disposition: "refused"/g) ?? []).length, 3);
  assert.doesNotMatch(capabilities, /ruledBy/);
  assert.doesNotMatch(dispositions, /ruledBy/);
  assert.match(rfc, /Every `refused` carries `ruledBy`/);
  assert.doesNotMatch(rfc, /CAPABILITY_REFUSAL_RULINGS|FORMAT_REFUSAL_RULINGS/);
});

test("D1987: required annotations fail the current strict AJV contract", () => {
  assert.match(rfc, /`x-tabiya-capability` or\s+`x-tabiya-capability-excluded`/);
  assert.match(read("packages/schema/src/drill-pack.test.ts"), /new Ajv2020\(\{ allErrors: true, strict: true \}\)/);
  assert.match(read("apps/server/src/pack-validation.ts"), /new Ajv2020\(\{ allErrors: true, strict: true \}\)/);
  const ajv = new Ajv2020({ strict: true });
  assert.throws(
    () => ajv.compile({ type: "string", "x-tabiya-capability": { sourceIdentity: "/x:a" } }),
    /unknown keyword: "x-tabiya-capability"/,
  );
});

test("D1988: F3 imports behavior from the draft that waits on F3", () => {
  const anchors = read("rfc/claim-semantic-anchors.md");
  assert.match(anchors, /Status:\*\* draft/);
  assert.match(anchors, /must land or provide its final declaration syntax\s+before this RFC can be accepted/);
  const dependencies = rfc.slice(rfc.indexOf("- **Depends on:**"), rfc.indexOf("## Summary"));
  assert.doesNotMatch(dependencies, /claim-semantic-anchors/);
  assert.match(rfc, /criterion 15/);
  assert.match(rfc, /CLAIM_BINDING_VERSION_UNSUPPORTED/);
});

test("D1989: declared site grammar cannot name inline and property roots", () => {
  const siteType = rfc.slice(rfc.indexOf("export type CapabilitySite"), rfc.indexOf("`module` is a repository-relative"));
  assert.match(siteType, /kind: "symbol"/);
  assert.match(siteType, /kind: "discriminant_arm"/);
  assert.doesNotMatch(siteType, /property_access|call_argument|numeric_literal|expression/);
  assert.match(rfc, /`GRADE_CONVENTION\.constants`/);
  assert.match(rfc, /rules-guard material threshold/);
  assert.match(rfc, /practical-resistance candidate limit/);
  assert.match(read("apps/server/src/opponent-selector.ts"), /\.slice\(0, 4\)/);
});

test("D1990: declaration and criteria disagree on semantic disposition", () => {
  assert.match(rfc, /readonly disposition: CapabilityDisposition;/);
  assert.match(rfc, /export type SemanticDisposition =/);
  assert.doesNotMatch(rfc, /export type CapabilityDisposition\s*=/);
  assert.match(rfc, /disposition: "reached"/);
  assert.match(rfc, /successor resolves to a `reached` declaration/);
  const semanticType = rfc.slice(rfc.indexOf("export type SemanticDisposition"), rfc.indexOf("export type DeploymentReachability"));
  assert.doesNotMatch(semanticType, /"reached"/);
});

test("D1991: generated resolved capabilities omit embedded semantic dependencies", () => {
  const shape = read("content/shapes/maroczy-bind.json");
  assert.match(shape, /"kind": "outpost"/);
  const resolvedSection = rfc.slice(rfc.indexOf("#### §2.6"), rfc.indexOf("#### §2.7"));
  assert.match(resolvedSection, /canonical content digest/);
  assert.doesNotMatch(resolvedSection, /dependsOn|dependency|dependencies/);
});

test("D1992: required arrays have no duplicate or ordering contract", () => {
  const requirementSection = rfc.slice(rfc.indexOf("#### §4.1"), rfc.indexOf("#### §4.2"));
  assert.match(requirementSection, /closed object of exactly `id` and `version`/);
  assert.doesNotMatch(requirementSection, /uniqueItems|duplicate|lexicographic|canonical order/);
  assert.match(rfc, /authored `requires` array\s+must set-equal/);
});
