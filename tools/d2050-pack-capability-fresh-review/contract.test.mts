import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");

test("D2050: public id/version grammar rejects shipped positives and contradicts criterion 1", () => {
  const patternText = rfc.match(/`CAPABILITY_ID_PATTERN` is\s+`([^`]+)`/u)?.[1];
  assert.ok(patternText);
  const pattern = new RegExp(patternText, "u");
  for (const shipped of ["mate-proof", "pressure-line", "candidate-majority"]) {
    assert.equal(pattern.test(shipped), false);
  }
  assert.equal(pattern.test("x"), false);
  assert.match(rfc, /version: CapabilityVersion/u);
  assert.match(rfc, /parseCapability\("x@1"\).*\{id: "x", version: 1\}/u);
  assert.match(rfc, /parseLegacyCapability/u);
});

test("D2051: complete applicability source is neither published nor independently present", () => {
  const schema = read("schemas/drill_pack.schema.json");
  assert.equal(schema.includes("x-tabiya-capability"), false);
  assert.equal(existsSync("packages/schema/src/capability/applicability.generated.ts"), false);
  assert.match(rfc, /complete authority is the checked generated file/u);
});

test("D2052: one object-valued keyword cannot carry per-member mappings for current enums", () => {
  const schema = JSON.parse(read("schemas/drill_pack.schema.json")) as unknown;
  let multiMemberEnums = 0;
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) { for (const item of value) walk(item); return; }
    if (value === null || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    if (Array.isArray(object.enum) && object.enum.length > 1) multiMemberEnums += 1;
    for (const item of Object.values(object)) walk(item);
  };
  walk(schema);
  assert.ok(multiMemberEnums > 0);
  assert.match(rfc, /The former is the closed object\s+`\{sourceIdentity, selector, capability\}`/u);
  assert.match(rfc, /Schema `sourceIdentity` is canonical JCS over `\{schemaPointer, member\}`/u);
});

test("D2053: named evaluator inventory still contains prose rather than exact symbols", () => {
  assert.match(rfc, /`objective\.transition_legality` \| `assertObjectiveTransition` and its transition table/u);
  assert.match(rfc, /`opponent\.selection` \| the opponent-selection dispatch and ordering basis/u);
  assert.match(rfc, /every §3\.1 named root is exported as the literal\s+symbol listed there/u);
});

test("D2054: refusal migration misfiles AGENTS.md as protected intent", () => {
  const agents = read("AGENTS.md");
  assert.match(agents, /Design tier is intent tier/u);
  assert.match(rfc, /protected intent `AGENTS\.md` §Rejected/u);
  assert.match(read("design/06-campaign.md"), /weakened Stockfish is rejected doctrine/u);
});
