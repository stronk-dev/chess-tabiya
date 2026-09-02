// DISPOSABLE positive author contract — D2070-D2076. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const rfc = read("rfc/pack-capability-contract.md");
const legacySchemaBytes = read("schemas/drill_pack.schema.json");
const applicability = JSON.parse(read("rfc/contracts/pack-capability-applicability-v1.json"));
const transition = JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json"));

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
    if (operation.op === "replace") {
      assert.ok(Object.hasOwn(parent, final));
      parent[final] = operation.value;
    } else if (operation.op === "remove") {
      assert.ok(Object.hasOwn(parent, final));
      delete parent[final];
    } else if (operation.op === "add" && final === "-") {
      assert.ok(Array.isArray(parent));
      parent.push(operation.value);
    } else if (operation.op === "add") {
      assert.equal(Object.hasOwn(parent, final), false);
      parent[final] = operation.value;
    } else throw new TypeError(`unsupported author patch operation: ${operation.op}`);
  }
  return target;
}

function legacyPopulation() {
  const rows = [];
  for (const name of readdirSync("content/drafts")) {
    if (!name.endsWith(".json") || name.endsWith(".sources.json") || name.endsWith(".evidence.json") || name.endsWith(".job.json")) continue;
    const path = `content/drafts/${name}`;
    rows.push({ path, sha256: sha256(readFileSync(path)) });
  }
  for (const directory of readdirSync("content/candidates")) {
    const path = `content/candidates/${directory}/pack.json`;
    if (existsSync(path)) rows.push({ path, sha256: sha256(readFileSync(path)) });
  }
  return rows.sort((left, right) => left.path.localeCompare(right.path));
}

test("D2070: the two-schema transition admits only the sealed legacy catalogue", () => {
  const rows = legacyPopulation();
  assert.equal(rows.length, transition.legacy.catalogueDocuments);
  assert.equal(sha256(JSON.stringify(rows)), transition.legacy.populationSha256);
  assert.equal(transition.legacy.admission, "repository_catalogue_allowlist_only");
  assert.match(rfc, /newly authored, uploaded, Studio-written or API-submitted packs/u);
  assert.match(rfc, /PACK_CAPABILITY_STAMP_REQUIRED/u);
  assert.match(rfc, /adding a 93rd legacy digest is forbidden/u);
  assert.match(rfc, /deletes the 0\.27 reader and allowlist/u);
});

test("D2071: plan validity stays green while readiness alone refuses judgement", () => {
  assert.match(rfc, /judgement-bearing plans when the plan is complete, canonical and internally valid/u);
  assert.match(rfc, /migration-apply-ready` is the stop gate/u);
  assert.match(rfc, /only the last fails\s+`migration-apply-ready`/u);
  assert.match(rfc, /ordinary `make verify` stays green while honest judgement debt exists/u);
});

test("D2072: the cumulative author stages produce every predecessor and the exact 0.30 post-image", () => {
  assert.equal(sha256(legacySchemaBytes), transition.legacy.schemaSha256);
  let target = JSON.parse(legacySchemaBytes);
  let priorSha = transition.legacy.schemaSha256;
  for (const stage of transition.stages) {
    assert.equal(stage.source.schemaSha256, priorSha);
    target = applyPatch(target, stage.patch);
    const stageBytes = `${JSON.stringify(target, null, 2)}\n`;
    assert.equal(Buffer.byteLength(stageBytes), stage.target.canonicalBytes);
    assert.equal(sha256(stageBytes), stage.target.schemaSha256);
    priorSha = stage.target.schemaSha256;
  }
  const bytes = `${JSON.stringify(target, null, 2)}\n`;
  assert.equal(Buffer.byteLength(bytes), transition.target.canonicalBytes);
  assert.equal(sha256(bytes), transition.target.schemaSha256);
  assert.equal(target.$id, transition.target.schemaId);
  assert.ok(target.$defs.graduationEntry.properties.clearance);
  assert.ok(target.$defs.provenance.properties.corpusEvidence);
  assert.ok(target.$defs.feedbackClaim.properties.evidenceTypes.items.enum.includes("provenance_note"));
  assert.ok(target.required.includes("requires"));
  assert.equal(target.properties.requires.items.$ref, "#/$defs/capabilityRequirement");
});

test("D2073: every member has schema authority and all interpreter roots close transitively", () => {
  assert.equal(applicability.meaningAuthority.baseSource, "exact-schema-member-image-v1");
  assert.equal(applicability.meaningAuthority.dependencyAlgorithm, "typescript-symbol-reference-closure-v1");
  assert.deepEqual(applicability.meaningAuthority.interpreterRoots.map((row) => row.subject), [
    "SuccessCondition", "SimpleTrigger", "StructuralExpression", "StructuralFeature",
    "TransitionExpression", "ObjectivePredicate", "EngineCondition",
  ]);
  for (const row of applicability.meaningAuthority.interpreterRoots) {
    assert.ok(row.sites.length > 0);
    for (const site of row.sites) assert.match(site, /^(apps|packages)\/.+#.+$/u);
  }
  assert.match(rfc, /new switch,\s+missing second site, unresolved symbol or reachable helper omitted from closure fails/u);
  assert.match(rfc, /unused\s+same-name symbol is unreachable and contributes nothing/u);
});

test("D2074: capability metadata is exactly excluded from its own applicability", () => {
  assert.deepEqual(applicability.metadataExclusions, [
    "/properties/requires", "/$defs/capabilityRequirement", "/$defs/capabilityVersion",
  ]);
  assert.deepEqual(transition.applicabilityExclusions.map((row) => row.schemaPointer), applicability.metadataExclusions);
  assert.match(rfc, /instance walker skips `\/requires` before selector evaluation/u);
  assert.match(rfc, /No\s+member of a requirement tuple can emit a capability/u);
});

test("D2075: histories retain old versions and resolve one acyclic current chain", () => {
  assert.match(rfc, /interface CapabilityHistory/u);
  assert.match(rfc, /identity is `\(subjectId, id\.version\)`/u);
  assert.match(rfc, /there is no parallel top-level `version`\s+field/u);
  assert.match(rfc, /Exactly one declaration equals `current`; it must be `active`/u);
  assert.match(rfc, /1→2, 1→2→3, withdrawal with successor, lawful withdrawal without/u);
  assert.match(rfc, /duplicate current, cross-subject successor and cycle fixtures/u);
});

test("D2076: public identity excludes ordinals and filesystem placement", () => {
  assert.equal(applicability.stableIdentity.algorithm, "stable-schema-member-v2");
  assert.deepEqual(applicability.stableIdentity.forbiddenInputs, [
    "oneOf array ordinal", "$defs container depth", "source file location",
  ]);
  assert.match(rfc, /numeric array\s+index contributes nothing/u);
  assert.match(rfc, /`over\.files` versus `over\.squares`/u);
  assert.match(rfc, /Moving an owner deeper under `\$defs`,\s+reordering branches or moving the schema file preserves identity/u);
  assert.doesNotMatch(rfc, /converts an\s+`oneOf\/N` pair to `branchN`/u);
});
