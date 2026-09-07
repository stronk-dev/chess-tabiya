// Disposable RFC-review instrument for the post-cut pack-capability contract.
// It proves the returned seams on the living document; it is not a release gate.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(new URL("../../", import.meta.url).pathname);
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const parent = read("rfc/pack-capability-contract.md");
const register = read("rfc/README.md");
const successor = read("planning/pack-capability-contract/evidence-job-durability.md");
const transition = JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json"));

function section(text, start, end) {
  const from = text.indexOf(start);
  assert.notEqual(from, -1, `missing section ${start}`);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing section terminator ${end}`);
  return text.slice(from, to);
}

function undefinedOperationType(text) {
  const references = (text.match(/\bCapabilityOperationId\b/gu) ?? []).length;
  const definitions = (text.match(/\btype\s+CapabilityOperationId\b/gu) ?? []).length;
  return references > 0 && definitions === 0;
}

test("the cut leaves CapabilityDeploymentBinding referring to a type owned only by the successor", () => {
  assert.equal(undefinedOperationType(parent), true);
  assert.match(parent, /operationIds:\s+readonly CapabilityOperationId\[\]/u);
  assert.match(successor, /type CapabilityOperationId\s*=/u);

  const closedControl = `${parent}\n\ntype CapabilityOperationId = "run.example";\n`;
  assert.equal(undefinedOperationType(closedControl), false);
});

test("the migration has two mutually exclusive landing decisions", () => {
  const transitionSection = section(parent, "#### §4.1a", "#### §4.2");
  const migrationSection = section(parent, "### §6.", "### §7.");
  const compactMigration = migrationSection.replace(/\s+/gu, " ");
  assert.match(transitionSection, /implementing commit applies/u);
  assert.match(transitionSection, /rewrites all 92 documents\s+in the same commit/u);
  assert.match(compactMigration, /first software landing emits all 92 frozen legacy documents as mechanical target rows but does not apply them/u);
  assert.match(compactMigration, /later D560-authorized invocation may apply/u);

  const oneDecisionControl = compactMigration
    .replace(" but does not apply them", " and applies them")
    .replace("The later D560-authorized invocation may apply", "That same implementing invocation applies");
  assert.doesNotMatch(oneDecisionControl, /does not apply them|later D560-authorized invocation may apply/u);
});

test("the parent still claims the storage migration whose normative DDL moved to an unregistered successor", () => {
  const claims = section(parent, "```tabiya-claims", "```");
  assert.match(claims, /migration \| position behind longitudinal-store \| evidence_job_batches/u);
  assert.match(register, /position behind longitudinal-store \| `pack-capability-contract\.md` \| evidence_job_batches/u);
  assert.match(parent, /tables it names moved to the successor draft/u);
  assert.match(successor, /CREATE TABLE evidence_job_batches/u);
  assert.match(successor, /Held in `planning\/`, not `rfc\/`/u);
});

test("the sealed 92-document migration silently includes six browser fixtures", () => {
  const documents = transition.legacy.documents.map((row) => row.path);
  const fixtures = documents.filter((path) => path.endsWith(".browser.json"));
  assert.equal(documents.length, 92);
  assert.equal(fixtures.length, 6);
  assert.doesNotMatch(parent, /\.browser\.json/u);

  const productionPacks = documents.filter((path) => !path.endsWith(".browser.json"));
  assert.equal(productionPacks.length, 86);
});
