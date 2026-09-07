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
  assert.equal(plan.schema, "tabiya.graduation.clearance-plan.v2");
  assert.equal(plan.hold.ruling, "D3033");
  assert.deepEqual(plan.hold.allowed, ["foundation implementation", "schema v0.28 migration", "atomic corpus and sidecar restamp"]);
  assert.deepEqual(plan.hold.forbidden, ["authored chess truth", "claim-binding wave", "official publication", "RFC archival before all criteria pass"]);
});

test("planner names rather than erases judgement debt", () => {
  const plan = buildGraduationPlan();
  assert.equal(plan.judgementDebt.draftKindReview, 220);
  assert.equal(plan.judgementDebt.draftSubjectAndPredicateFields, 220);
  assert.equal(plan.judgementDebt.candidateNonTemplateEntries, 2);
  assert.equal(plan.judgementDebt.resolvedClearanceBackfills, 30);
  assert.equal(plan.judgementDebt.acceptedUnreachabilityBackfills, 43);
});

test("migration proposal covers every entry and separates derivation, authoring, and contract blockers", () => {
  const plan = assertKnownPlan(buildGraduationPlan());
  assert.equal(plan.migration.entries, 436);
  assert.deepEqual(plan.migration.statuses, { ready: 100, requires_author: 232, blocked_contract: 104 });
  assert.equal(plan.migration.rows.length, plan.corpus.entries);
  assert.equal(new Set(plan.migration.rows.map((row) => row.key)).size, plan.corpus.entries);
  assert.deepEqual(plan.migration.templateContracts, {
    "mechanical-objective-placeholder": "ready",
    "opponent-policy-authored": "ready",
    "tablebase-opponent-not-selected": "ready",
    "outcome-ungraded": "blocked_contract",
    "start-assessment-absent": "blocked_contract",
    "target-elo-authored": "blocked_contract",
    "authored-teaching-absent": "blocked_contract",
    "recorded-play-needs-authoring": "blocked_contract",
    "mechanical-objective-needs-grounding": "blocked_contract",
  });
});

test("ready template proposals bind the actual current value while unrepresentable templates stay red", () => {
  const plan = buildGraduationPlan();
  const placeholder = plan.migration.rows.find((row) => row.file === "content/candidates/a87-dutch-defense-leningrad-variation/pack.json");
  assert.equal(placeholder.status, "ready");
  assert.deepEqual(placeholder.fields["clearance.subject"].value, "/objective/summary");
  assert.equal(placeholder.fields["clearance.placeholder"].value, "Play the recorded line to its end: 7 plies from this position.");

  const targetElo = plan.migration.rows.find((row) => row.entryId === "target-elo-authored");
  assert.equal(targetElo.status, "blocked_contract");
  assert.match(targetElo.fields.clearance.source, /numeric targetElo/u);

  const authoredTeaching = plan.migration.rows.find((row) => row.entryId === "authored-teaching-absent");
  assert.equal(authoredTeaching.status, "blocked_contract");
  assert.match(authoredTeaching.fields.clearance.source, /no required clearance subject resolves/u);
});

test("accepted prose is preserved as migration input rather than regenerated as chess truth", () => {
  const plan = buildGraduationPlan();
  const accepted = plan.migration.rows.find((row) => row.currentState === "accepted");
  assert.equal(accepted.status, "ready");
  assert.equal(accepted.fields["accepted.unreachableBecause"].value, "Owner ruling 2026-08-13: only a citable source or mechanical validation that bears on a claim can ground it; no second-party review workflow will exist.");
  assert.match(accepted.fields["accepted.unreachableBecause"].source, /existing accepted\.ruling/u);
});
