import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKnownPlan,
  buildGraduationPlan,
  classifyDraftEntry,
  CLEARANCE_RULES,
  EMITTER_TEMPLATE_IDS,
  HAND_ASSIGNMENTS,
} from "./graduation-clearance-plan.mjs";

test("classifier preserves safe first-match ordering", () => {
  const result = classifyDraftEntry("fixture", { id: "mixed", statement: "No machine-readable evidence slot; an engine pass could later help." });
  assert.equal(result.kind, "unbuilt");
  assert.equal(result.rule, "unbuilt");
  assert.equal(CLEARANCE_RULES.at(-1).rule, "authored");
});

test("published hand table is complete and never becomes a silent default", () => {
  assert.equal(Object.keys(HAND_ASSIGNMENTS).length, 17);
  assert.equal(classifyDraftEntry("rook-4v3-same-side", { id: "the-w-ra8-w-ra7-line-asserts-that-1-rd2-concedes-a-pawn-", statement: "No keyword applies." }).kind, "ledger_record");
  assert.deepEqual(classifyDraftEntry("unknown", { id: "unknown", statement: "No keyword applies." }), { kind: null, source: "unclassified" });
});

test("planner re-derives the accepted RFC population without mutating it", () => {
  const plan = assertKnownPlan(buildGraduationPlan());
  assert.deepEqual(plan.corpus.drafts, { documents: 56, entries: 293, states: { accepted: 43, blocking: 220, resolved: 30 } });
  assert.deepEqual(plan.corpus.candidates, { documents: 36, entries: 143, states: { blocking: 143 } });
  assert.deepEqual(plan.classifier.preHandRules, { authored: 10, citation: 54, corpus: 46, engine: 37, shape: 16, tablebase: 5, unbuilt: 35 });
  assert.deepEqual(plan.classifier.finalKinds, { assessment_grounded: 5, claim_bound: 55, ledger_record: 84, pointer_authored: 11, shape_firing: 18, unbuilt: 38, unreachable: 9 });
  assert.equal(plan.classifier.draftRuleSuggestions, 203);
  assert.equal(plan.classifier.draftHandTableAssignments, 17);
  assert.equal(plan.classifier.candidateTemplateMatched, 141);
  assert.equal(plan.classifier.candidateUnrecognised.length, 2);
  assert.equal(EMITTER_TEMPLATE_IDS.length, 9);
  assert.equal(plan.mode, "read_only");
  assert.deepEqual(plan.hold.forbidden, ["schema v0.28 apply", "corpus mutation", "sidecar restamp", "RFC archival"]);
});

test("planner names rather than erases judgement debt", () => {
  const plan = buildGraduationPlan();
  assert.equal(plan.judgementDebt.draftKindReview, 220);
  assert.equal(plan.judgementDebt.draftSubjectAndPredicateFields, 220);
  assert.equal(plan.judgementDebt.candidateNonTemplateEntries, 2);
  assert.equal(plan.judgementDebt.resolvedClearanceBackfills, 30);
  assert.equal(plan.judgementDebt.acceptedUnreachabilityBackfills, 43);
});
