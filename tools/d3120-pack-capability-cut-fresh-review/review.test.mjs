// Retained post-cut review falsifiers plus the bounded living-contract repair gate.
// This is draft-RFC evidence, not a release gate.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(new URL("../../", import.meta.url).pathname);
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const parent = read("rfc/pack-capability-contract.md");
const register = read("rfc/README.md");
const successor = read("rfc/evidence-job-durability.md");
const transition = JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json"));

const RETURNED = Object.freeze({
  binding: "readonly operationIds: readonly CapabilityOperationId[];",
  migration: "The first software landing emits all 92 frozen legacy documents as mechanical target rows but does not apply them. The later D560-authorized invocation may apply",
  claim: "migration | position behind longitudinal-store | evidence_job_batches",
  register: "position behind longitudinal-store | `pack-capability-contract.md` | evidence_job_batches",
});

function section(text, start, end) {
  const from = text.indexOf(start);
  assert.notEqual(from, -1, `missing section ${start}`);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing section terminator ${end}`);
  return text.slice(from, to);
}

test("D3120 retains the orphan falsifier and removes operation identity/effects from the parent", () => {
  assert.match(RETURNED.binding, /CapabilityOperationId/u);
  assert.doesNotMatch(parent, /\bCapabilityOperationId\b|operationIds:|compiled consumer registry/u);
  assert.match(successor, /type CapabilityOperationId\s*=/u);
  assert.match(successor, /ProviderOffBehavior/u);
});

test("D3121 retains the contradictory sequence and specifies one same-commit initial migration", () => {
  assert.match(RETURNED.migration, /does not apply them.*later D560-authorized invocation may apply/u);
  const transitionSection = section(parent, "#### §4.1a", "#### §4.2");
  const migrationSection = section(parent, "### §6.", "### §7.").replace(/\s+/gu, " ");
  assert.match(transitionSection, /rewrites all 92 documents\s+in the same commit/u);
  assert.match(migrationSection, /applies them in that same commit/u);
  assert.doesNotMatch(migrationSection, /does not apply them|later D560-authorized invocation may apply/u);
  assert.match(migrationSection, /Later semantic capability-version migrations remain read-only/u);
});

test("D3122 retains the wrong-owner image and transfers the live claim with the registered successor", () => {
  assert.match(RETURNED.claim, /evidence_job_batches/u);
  assert.match(RETURNED.register, /pack-capability-contract/u);
  const parentClaims = section(parent, "```tabiya-claims", "```");
  const successorClaims = section(successor, "```tabiya-claims", "```");
  assert.doesNotMatch(parentClaims, /migration|evidence_job/u);
  assert.match(successorClaims, /migration \| position behind longitudinal-store \| evidence_job_batches/u);
  assert.match(register, /position behind longitudinal-store \| `evidence-job-durability\.md` \| evidence_job_batches/u);
  assert.match(register, /position behind evidence-job-durability \| `concept-registry\.md`/u);
});

test("D3123 makes the 86 production plus 6 browser-fixture population explicit", () => {
  const documents = transition.legacy.documents.map((row) => row.path);
  const fixtures = documents.filter((path) => path.endsWith(".browser.json"));
  assert.equal(documents.length, 92);
  assert.equal(fixtures.length, 6);
  assert.equal(documents.length - fixtures.length, 86);
  assert.match(parent, /86 production packs? plus 6 browser fixtures|86-production\/6-browser-fixture|86 production-pack \+ 6 browser-fixture/u);
  assert.match(parent, /6 `\*\.browser\.json` schema fixtures/u);
});
