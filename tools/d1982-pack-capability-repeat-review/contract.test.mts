// DISPOSABLE author-repair harness — D1982-D1992. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");

test("D1982: one exact compatibility id grammar accepts the inventory and rejects suffixes", () => {
  const patternText = rfc.match(/`CAPABILITY_ID_PATTERN` is\s+`([^`]+)`/u)?.[1];
  assert.ok(patternText);
  const pattern = new RegExp(patternText, "u");
  for (const id of ["structuralFeature.outpost", "error.SIMULATE_BUDGET_EXCEEDED", "assistance:arrows", "shape.maroczy-bind"]) {
    assert.match(id, pattern);
  }
  for (const invalid of ["x@1", "x@v1", "two words", "path/value"]) assert.doesNotMatch(invalid, pattern);
  assert.match(rfc, /New ids use\s+lowercase dotted form by convention/u);
});

test("D1983: the shared version algebra preserves integer and semver without coercion", () => {
  assert.match(rfc, /kind: "integer"; readonly value: number/u);
  assert.match(rfc, /kind: "semver"; readonly value: string/u);
  assert.match(rfc, /No numeric coercion exists\s+between arms/u);
  assert.match(rfc, /<id>@i:<integer>` or `<id>@s:<semver>/u);
  assert.match(rfc, /"value": "0\.1\.3"/u);
});

test("D1984: applicability has a complete generated authority and checked exclusions", () => {
  assert.match(rfc, /packages\/schema\/src\/capability\/applicability\.generated\.ts/u);
  assert.match(rfc, /exactly three independently enumerable sets/u);
  assert.match(rfc, /metadata exclusions/u);
  assert.match(rfc, /\/\$defs\/capabilityRequirement/u);
  assert.match(rfc, /make capability-applicability-check/u);
  assert.match(rfc, /Unknown semantic\s+nodes, a reference cycle or an expression with no applicability row fail generation/u);
});

test("D1985: the F1 bridge uses its own declaration authority instead of fake AST sites", () => {
  assert.match(rfc, /kind: "f1_projection"/u);
  assert.match(rfc, /tabiya\.capability\.f1-projection\.v1/u);
  assert.match(rfc, /complete F1→F3 bridge; no `CapabilitySite` or copied manifest digest is\s+invented/u);
  assert.match(rfc, /semantic\/derivation inputs\s+become typed capability dependencies/u);
});

test("D1986: all twenty legacy refusals have typed destinations and lawful authorities", () => {
  const section = rfc.slice(rfc.indexOf("#### §5a"), rfc.indexOf("#### §5.1"));
  const tableRows = section.split("\n").filter((line) => /^\| (Stockfish|Maia|Glicko-2|Syzygy|Explorer|Supervisor|format) /u.test(line));
  assert.equal(tableRows.length, 20);
  for (const state of ["refused", "refuted", "unmeasured", "pending_decision", "unimplemented", "withdrawn", "active", "deprecated"]) {
    assert.ok(section.includes("`" + state + "`"));
  }
  assert.match(rfc, /CAPABILITY_REFUSAL_MIGRATION_MISSING/u);
  assert.match(rfc, /accepted_rfc/u);
});

test("D1987: strict schemas and the typed sidecar have separate closed authorities", () => {
  assert.match(rfc, /packages\/schema\/src\/ajv\.ts`[^.]{0,80}`createStrictAjv2020/u);
  assert.match(rfc, /F3 registers no custom schema keywords/u);
  assert.match(rfc, /capability key in the schema is therefore\s+an unknown-keyword error/u);
  assert.match(rfc, /sidecar has its own JSON schema and closed parser/u);
});

test("D1988: F3 has a one-way compile-time handoff and imports no draft consumer behavior", () => {
  assert.match(rfc, /Followed by, never imports/u);
  assert.match(rfc, /F3 exports only the generic structured `CapabilityId` algebra/u);
  assert.match(rfc, /makes \*\*zero\*\* changes to the evidence-sidecar schema/u);
  assert.match(rfc, /The claim-binding handoff is compile-time only/u);
  assert.match(rfc, /zero occurrence of\s+`CLAIM_BINDING_VERSION_UNSUPPORTED`/u);
});

test("D1989: every normative constant root is an exact exported symbol with a live-reader check", () => {
  for (const symbol of [
    "GRADE_CONVENTION_CONSTANTS", "PRESSURE_LINE_ROLE_SCALE", "RULES_GUARD_MATERIAL_THRESHOLD",
    "GUARD_DEFAULTS", "BRANCH_CATEGORY_RANK", "DEVIATION_COST_TOLERANCE", "PHASE_BANDS",
    "NEUTRAL_TIEBREAK_INPUTS", "PRACTICAL_RESISTANCE_CANDIDATE_LIMIT", "SEMANTIC_SELECTION_POLICY_CONSTANTS",
  ]) assert.ok(rfc.includes("`" + symbol + "`"));
  assert.match(rfc, /requires one declaration and at least one production\s+reader/u);
  assert.match(rfc, /No property path, numeric prose or\s+inline `\.slice\(\.\.\.\)` expression is a normative site/u);
});

test("D1990: declaration and all semantic invariants use one disposition union", () => {
  assert.match(rfc, /readonly disposition: SemanticDisposition/u);
  assert.doesNotMatch(rfc, /readonly disposition: CapabilityDisposition/u);
  assert.match(rfc, /semantic disposition `active` \*\*iff\*\* the capability is executable/u);
  assert.match(rfc, /each history retains old\s+rows and has exactly one active current declaration/u);
  assert.match(rfc, /chain terminates at the one active current declaration/u);
  assert.match(rfc, /Legacy `refused` is deliberately \*\*not\*\* a semantic mapping rule/u);
});

test("D1991: resolved content closes over every embedded semantic dependency", () => {
  const section = rfc.slice(rfc.indexOf("#### §2.6"), rfc.indexOf("#### §2.7"));
  assert.match(section, /walks every typed\s+semantic expression/u);
  assert.match(section, /closes transitively through referenced entries and evaluator dependencies/u);
  assert.match(section, /`shape\.maroczy-bind` depends on\s+`structuralFeature\.outpost`/u);
});

test("D1992: requirements reject duplicate tuples and non-canonical artifact bytes", () => {
  const section = rfc.slice(rfc.indexOf("#### §4.1"), rfc.indexOf("#### §4.2"));
  assert.match(section, /PACK_CAPABILITY_DUPLICATE/u);
  assert.match(section, /bytewise ascending NFC `id`/u);
  assert.match(section, /integer versions before semver/u);
  assert.match(section, /uniqueItems:true/u);
  assert.match(section, /compare canonical arrays byte-for-byte/u);
});
