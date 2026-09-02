// DISPOSABLE independent review instrument for D2505-D2508. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const moduleRfc = read("rfc/module-registration.md");
const candidateRfc = read("rfc/shared-candidate-evidence-packet.md");
const recordedRfc = read("rfc/recorded-semantic-path.md");
const reviewRfc = read("rfc/review-evidence-compiler.md");
const providerRfc = read("rfc/provider-exchange-and-execution.md");
const compare = read("packages/runtime/src/compare-strips.ts");
const semantic = read("packages/runtime/src/semantic-evidence.ts");
const catalogue = read("packages/runtime/src/evidence-catalog.ts");

const source = (id) => execution.sourceContracts.find((row) => row.id === id);
const projection = (id) => execution.rows.find((row) => row.projection.id === id);

test("D2505 four claimed source ABIs remain absent and the provider adapter loses its operation", () => {
  const recorded = source("recorded_semantic_path@1");
  assert.equal(recorded.input, "RecordedSemanticPathRequest");
  assert.equal(recorded.parse, "assertRecordedSemanticPathResult");
  assert.doesNotMatch(recordedRfc, /(?:type|interface)\s+RecordedSemanticPathRequest\b/u);
  assert.doesNotMatch(recordedRfc, /(?:function|const)\s+assertRecordedSemanticPathResult\b/u);

  const review = source("review_evidence_packet@1");
  assert.equal(review.input, "ReviewEvidenceInput");
  assert.equal(review.parse, "assertReviewEvidencePacket");
  assert.doesNotMatch(reviewRfc, /(?:type|interface)\s+ReviewEvidenceInput\b/u);
  assert.doesNotMatch(reviewRfc, /(?:function|const)\s+assertReviewEvidencePacket\b/u);

  const catalogueSource = source("catalogue_evidence_packet@1");
  for (const name of [catalogueSource.input, catalogueSource.parse, catalogueSource.seal]) {
    assert.doesNotMatch(moduleRfc, new RegExp(`(?:type|interface|function|const)\\s+${name}\\b`, "u"));
  }

  const provider = source("provider_evidence_packet@1");
  assert.equal(provider.parse, "assertProviderDelivery");
  assert.match(providerRfc, /function assertProviderDelivery<[\s\S]*?\(\s*operation:\s*K,\s*value:\s*unknown/u);
  assert.match(providerRfc, /interface ProviderSourceFactory<[\s\S]*?make\(delivery:/u);
  assert.doesNotMatch(provider.operation.callable, /SourceFactor|\.make/u);
});

test("D2506 eval delta is specified cross-branch while production derives consecutive same-branch points", () => {
  const occurrence = projection("derived.compare.eval_delta").derivation.occurrenceContract;
  assert.deepEqual(occurrence.alternatives[0].operands[0].endpointRoles, ["branch_a", "branch_b"]);
  assert.ok(occurrence.equality.includes("declared_branch_pair_order"));
  assert.match(compare, /for \(let index = 1; index < trail\.length; index \+= 1\)[^{]*\{ const delta = scoreCp\(trail\[index\]!\.score\) - scoreCp\(trail\[index - 1\]!\.score\)/u);
  assert.match(catalogue, /"derived\.compare\.eval_delta"[\s\S]*?operands:\s*\["delta",\s*"plyOffset"\]/u);
});

test("D2507 deflection requirement makes bait capture mandatory although the detector accepts check", () => {
  const occurrence = projection("derived.tactic.deflection_observed").derivation.occurrenceContract;
  const captures = occurrence.alternatives[0].operands.find((operand) => operand.projection === "rules.transition.event.capture");
  assert.deepEqual(captures.edgeOffsets, [2, 3]);
  assert.match(semantic, /const inducedByBait =[\s\S]*?const inducedByCheck =[\s\S]*?if \(!inducedByBait && !inducedByCheck\) return Object\.freeze\(\[\]\)/u);
  assert.equal(occurrence.alternatives.length, 1);
});

test("D2508 every pair has null exact operations and no discharge owns their resolution", () => {
  assert.equal(bindings.rows.length, 205);
  assert.equal(bindings.rows.filter((row) => row.occurrenceRequirement.exactProjectionOperation === null).length, 205);
  assert.equal(bindings.rows.filter((row) => row.timingRequirement.exactProjectionOperation === null).length, 205);
  assert.ok(bindings.rows.every((row) => row.status === "blocked_dependencies"));
  const discharges = moduleRfc.slice(moduleRfc.indexOf("## Discharges"), moduleRfc.indexOf("## Open questions"));
  assert.doesNotMatch(discharges, /exactProjectionOperation|205 pair|117 projection operation/u);
  for (const view of ["root_legal_population", "candidate_child_position_by_uci", "candidate_edge_by_uci", "complete_candidate_population"]) {
    assert.doesNotMatch(candidateRfc, new RegExp(`\\b${view}\\b`, "u"));
  }
});
