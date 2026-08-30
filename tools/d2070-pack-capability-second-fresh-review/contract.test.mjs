// DISPOSABLE second fresh independent review harness — D2070-D2076. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const schema = read("schemas/drill_pack.schema.json");
const artifact = JSON.parse(read("rfc/contracts/pack-capability-applicability-v1.json"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

test("D2070: required pack stamps cannot land separately from the held corpus rewrite", () => {
  const declaration = section("#### §4.1 What a pack declares", "#### §4.2 What the runtime publishes");
  assert.match(declaration, /new required key/u);
  assert.match(declaration, /pack with no `requires` is invalid/u);
  assert.match(declaration, /all 92 packs churn their digest/u);
  assert.doesNotMatch(schema, /"requires"\s*:/u);

  const draftDocs = readdirSync("content/drafts").filter((name) => name.endsWith(".json")
    && !name.endsWith(".sources.json") && !name.endsWith(".evidence.json") && !name.endsWith(".job.json"));
  const candidatePacks = readdirSync("content/candidates", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      try { return read(`content/candidates/${entry.name}/pack.json`).length > 0; } catch { return false; }
    });
  assert.equal(draftDocs.length + candidatePacks.length, 92);
  for (const name of draftDocs) assert.doesNotMatch(read(`content/drafts/${name}`), /"requires"\s*:/u);
  for (const entry of candidatePacks) assert.doesNotMatch(read(`content/candidates/${entry.name}/pack.json`), /"requires"\s*:/u);
  assert.match(rfc, /Implement the registry, census, checks, handshake and planner without applying the corpus plan/u);
});

test("D2071: the mandatory plan is both expected red and required green in verify", () => {
  const migration = section("### §6. The migration planner", "### §7. The population");
  assert.match(migration, /migration-plan-check[\s\S]*the plan >\/dev\/null, wired into `make verify`/u);
  assert.match(migration, /plan containing any `judgement\[\]` entry\s+\*\*exits non-zero/u);
  const criteria = section("## Acceptance criteria", "## Discharges");
  assert.match(criteria, /three predicate-bearing documents[\s\S]*in `judgement\[\]`/u);
  assert.match(criteria, /`make verify` passes with `migration-plan-check`/u);
});

test("D2072: implementation necessarily invalidates the sealed schema authority", () => {
  assert.equal(artifact.schema.sha256, sha256(schema));
  assert.doesNotMatch(schema, /x-tabiya-capability-members/u);
  assert.doesNotMatch(schema, /"requires"\s*:/u);
  assert.match(rfc, /Every `enum` and every discriminated `oneOf` beneath the pack\s+schema carries member arrays/u);
  assert.match(rfc, /requires \(new, required array/u);
  assert.match(rfc, /implementation-generated image[\s\S]*must expand to the authority's\s+digests/u);
});

test("D2073: the author authority has no 373-member source/dependency closure", () => {
  assert.equal(artifact.closedVocabulary.mappedMembers, 373);
  assert.equal(Object.hasOwn(artifact.closedVocabulary, "mappings"), false);
  assert.equal(Object.hasOwn(artifact.closedVocabulary, "interpreterSites"), false);
  assert.equal(Object.hasOwn(artifact.closedVocabulary, "dependencies"), false);
  assert.match(rfc, /imports\/helpers\/constants participate only through an explicit site or\s+dependency/u);
  assert.match(rfc, /Every exhaustive arm in those roots carries `@tabiya-capability-interpreter/u);
  assert.match(rfc, /sources: readonly CapabilityMeaningSource\[\]/u);
  assert.match(rfc, /dependsOn: readonly CapabilityId\[\]/u);
});

test("D2074: the new requires vocabulary is inside its own unbounded derivation", () => {
  const applicability = section("#### §2.7 Applicability", "### §3. The capability enumeration");
  assert.match(rfc, /`version` is a\s+closed discriminated union matching §2\.1/u);
  assert.match(rfc, /Every `enum` and every discriminated `oneOf` beneath the pack\s+schema carries member arrays/u);
  assert.match(applicability, /evaluate every selector against the parsed pack/u);
  assert.doesNotMatch(applicability, /exclude[^.]{0,80}\/requires|metadata subtree|capabilityRequirement[^.]{0,80}excluded/u);
  assert.equal(artifact.closedVocabulary.enumMembers, 300);
  assert.equal(artifact.closedVocabulary.discriminatedOneOfMembers, 73);
});

test("D2075: one declaration per subject cannot retain old and successor versions", () => {
  assert.match(rfc, /Unit: one declaration per capability subject/u);
  assert.match(rfc, /increment `version` and record the successor relation/u);
  assert.match(rfc, /deprecated[\s\S]*successor: CapabilityId/u);
  assert.match(rfc, /deprecated` successor resolves to an `active` declaration/u);
  assert.doesNotMatch(rfc, /CapabilityHistory|previousVersions|supersededVersions|one declaration per subject version/u);
});

test("D2076: schema-order-derived public ids are not stable semantic identities", () => {
  const publicId = (pointer, member) => {
    const raw = pointer.split("/").filter(Boolean);
    const tokens = [];
    for (let index = 0; index < raw.length; index += 1) {
      const token = raw[index];
      if (["$defs", "properties", "items"].includes(token)) continue;
      if (token === "oneOf" && /^\d+$/u.test(raw[index + 1] ?? "")) {
        tokens.push(`branch${raw[index + 1]}`);
        index += 1;
      } else tokens.push(/^\d+$/u.test(token) ? `item${token}` : token);
    }
    return [...tokens, member].join(".");
  };
  assert.notEqual(publicId("/$defs/example/oneOf/0/properties/kind", "x"), publicId("/$defs/example/oneOf/1/properties/kind", "x"));
  assert.match(rfc, /converts an\s+`oneOf\/N` pair to `branchN`/u);
  assert.match(rfc, /Capability ids are a\s+separate stable public name/u);
  assert.match(rfc, /evaluator semantics versioned independently from JSON fields/u);
});
