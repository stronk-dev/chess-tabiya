import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const review = readFileSync("rfc/review-evidence-compiler.md", "utf8");
const presentation = readFileSync("rfc/evidence-presentation.md", "utf8");
const provider = readFileSync("rfc/provider-exchange-and-execution.md", "utf8");
const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));

function block(start, end) {
  const from = review.indexOf(start);
  assert.notEqual(from, -1, `missing start marker ${start}`);
  const to = review.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker ${end}`);
  return review.slice(from, to);
}

test("D2635 the named compiler still has no callable input or aggregate assertion", () => {
  const source = execution.sourceContracts.find((row) => row.id === "review_evidence_packet@1");
  assert.ok(source);
  assert.equal(source.operation.callable, "compileReviewEvidence(input)");
  assert.equal(source.input, null);
  assert.equal(source.assertion, null);
  assert.doesNotMatch(review, /(?:interface|type)\s+ReviewEvidenceInput\b/u);
  assert.doesNotMatch(review, /(?:function|const)\s+assertReviewEvidencePacket\b/u);
});

test("D2631 completion and run-family state cannot encode a mixed packet", () => {
  const receipt = block("interface ReviewStoryReceipt {", "\n}\n```");
  assert.match(receipt, /kind: "progressive";[^}]*pending:[^}]*retrying:[^}]*notYetScheduled:/su);
  assert.match(receipt, /kind: "degraded";[^}]*unavailableFamilies:/su);
  const progressive = receipt.match(/\| \{ readonly kind: "progressive";[\s\S]*?\}/u)?.[0] ?? "";
  const degraded = receipt.match(/\| \{ readonly kind: "degraded";[\s\S]*?\}/u)?.[0] ?? "";
  assert.doesNotMatch(progressive, /unavailableFamilies/u);
  assert.doesNotMatch(degraded, /pending|retrying|notYetScheduled/u);
  assert.match(receipt, /families: Readonly<Record<ReviewSourceFamily, ReviewFamilyState>>/u);
  assert.doesNotMatch(review, /(?:fold|aggregate)ReviewFamilyState/u);
});

test("D2632 Review defines a second raw-sentence wire beside sealed presentation", () => {
  const moment = block("interface ReviewStoryMomentReceipt {", "\n}\n\ninterface ReviewStoryReceipt");
  assert.match(moment, /sentences: readonly string\[\]/u);
  assert.match(moment, /sourceLabels: readonly string\[\]/u);
  assert.match(presentation, /`RenderedEvidenceItem` is replaced, not widened with another caller-owned array/u);
  assert.match(presentation, /A module or Svelte call site cannot attach a component, sentence, mark or\s+arrow later/u);
  const dependencyLine = review.split("\n").find((line) => line.startsWith("- **Depends on:**")) ?? "";
  assert.doesNotMatch(dependencyLine, /evidence-presentation/u);
  assert.doesNotMatch(review, /PresentedEvidenceItem|presentation\.receipt@1/u);
});

test("D2633 packet and rendering context share no authorized prefix authority", () => {
  const packet = block("interface ReviewEvidencePacket {", "\n}\n\ntype ReviewScoreReceipt");
  assert.match(packet, /runId: string/u);
  assert.match(packet, /branchId: string/u);
  assert.doesNotMatch(packet, /eventHead|prefixDigest|decision|recordedPath|authorization/u);
  assert.match(review, /renderReviewStoryReceipt\(packet, context\)/u);
  assert.doesNotMatch(review, /(?:interface|type)\s+ReviewStoryContext\b/u);
  const receipt = block("interface ReviewStoryReceipt {", "\n}\n```");
  assert.match(receipt, /side: "white" \| "black"/u);
  assert.match(receipt, /outcome: StoryTitleInput\["outcome"\]/u);
  assert.match(receipt, /title: string/u);
});

test("D2634 exhausted provider failures have no bounded owner across eviction", () => {
  assert.match(provider, /no retention of failures/u);
  assert.match(review, /exhausted work becomes `retry_exhausted` and never\s+loops on repeated reads/su);
  assert.match(review, /evicts least-recently-used \*idle\* branch coordinators above `maxTrackedRuns`/u);
  assert.match(review, /current\s+process's typed terminal outcomes/u);
  assert.doesNotMatch(review, /maxRetained(?:Attempt|Outcome)|maxTerminalOutcomes|ReviewAttemptOutcomeStore/u);
});
