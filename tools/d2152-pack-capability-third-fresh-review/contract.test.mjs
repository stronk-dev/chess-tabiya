// DISPOSABLE independent buildability review for D2152-D2156. This reproduces the return; it is
// not a production capability implementation and intentionally remains outside make verify.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const register = read("rfc/README.md");
const transition = JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json"));
const applicability = JSON.parse(read("rfc/contracts/pack-capability-applicability-v1.json"));

function pointerTokens(pointer) {
  return pointer.split("/").slice(1).map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function applyPatch(source, operations) {
  const target = structuredClone(source);
  for (const operation of operations) {
    const tokens = pointerTokens(operation.path);
    const final = tokens.pop();
    assert.ok(final !== undefined);
    const parent = tokens.reduce((value, token) => value[token], target);
    if (operation.op === "replace") parent[final] = operation.value;
    else if (operation.op === "add" && final === "-") parent.push(operation.value);
    else if (operation.op === "add") parent[final] = operation.value;
    else throw new TypeError(`unsupported patch operation ${operation.op}`);
  }
  return target;
}

test("D2152: the sealed 0.30 post-image omits the legally prior 0.28 and 0.29 schema claims", () => {
  assert.match(register, /graduation-clearance\.md[\s\S]*?pack schema 0\.28/u);
  assert.match(register, /pack-population-provenance\.md[\s\S]*?pack schema 0\.29/u);
  const target = applyPatch(JSON.parse(read("schemas/drill_pack.schema.json")), transition.patch);
  assert.equal(target.$id, "urn:chess-tabiya:schema:drill-pack:0.30");
  assert.equal(target.$defs.graduationEntry.properties.clearance, undefined);
  assert.equal(target.$defs.provenance.properties.corpusEvidence, undefined);
  assert.doesNotMatch(JSON.stringify(target.$defs.feedbackClaim), /provenance_note/u);
  assert.deepEqual(transition.patch.map((operation) => operation.path), [
    "/$id", "/description", "/required/-", "/properties/requires",
    "/$defs/capabilityVersion", "/$defs/capabilityRequirement",
  ]);
});

test("D2153: the claimed 373-row applicability authority contains counts and opaque digests, not mappings", () => {
  assert.equal(applicability.closedVocabulary.mappedMembers, 373);
  assert.equal(applicability.closedVocabulary.excludedMembers, 0);
  assert.equal(applicability.closedVocabulary.mappings, undefined);
  assert.equal(applicability.closedVocabulary.members, undefined);
  assert.equal(applicability.closedVocabulary.sourceInventory, undefined);
  assert.match(rfc, /make capability-applicability` regenerates bytes/u);
  assert.equal(read("tools/d2070-pack-capability-second-fresh-review/contract.test.mjs").includes("expandedMappingSha256"), false);
});

test("D2154: unconditional meaning authority is not expressed as exact module plus symbol sites", () => {
  assert.equal(applicability.always.length, 14);
  assert.ok(applicability.always.flatMap((row) => row.sites).every((site) => !site.includes("#")));
  assert.ok(applicability.meaningAuthority.interpreterRoots.flatMap((row) => row.sites).every((site) => site.includes("#")));
  assert.doesNotMatch(JSON.stringify(applicability), /GRADE_CONVENTION_CONSTANTS|MATERIAL_VALUES|EXCHANGE_PIECE_VALUES|PHASE_BANDS/u);
  assert.match(rfc, /readonly kind: "symbol"; readonly module: string; readonly symbol: string/u);
});

test("D2155: external chess semantics have no source kind in the digest authority", () => {
  assert.match(read("packages/runtime/src/structure.ts"), /from "chessops\//u);
  const sourceUnion = rfc.match(/export type CapabilityMeaningSource =([\s\S]*?);\n\nexport type CapabilitySite/u)?.[1] ?? "";
  assert.doesNotMatch(sourceUnion, /package|dependency|lockfile|external/u);
  const externalSources = applicability.meaningAuthority.externalSources
    ?? applicability.meaningAuthority.packageDependencies
    ?? applicability.meaningAuthority.lockfiles;
  assert.equal(externalSources, undefined);
  assert.doesNotMatch(JSON.stringify(applicability.meaningAuthority), /chessops|pnpm-lock\.yaml/u);
});

test("D2156: withdrawn declarations cannot retain the successor the lifecycle promises", () => {
  const withdrawnArm = rfc.match(/\| \{ readonly kind: "withdrawn";([^\n]+)\}/u)?.[1] ?? "";
  assert.doesNotMatch(withdrawnArm, /successor/u);
  assert.match(rfc, /withdrawn capability carries a successor or an explicit refusal/u);
  assert.match(rfc, /A withdrawn row may omit a\s+successor only when/u);
  assert.match(rfc, /Supervisor `EngineRequest\.afterCommands` \| `withdrawn` \| request-scoped state is the shipped successor/u);
});
