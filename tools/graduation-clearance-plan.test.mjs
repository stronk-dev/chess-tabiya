import assert from "node:assert/strict";
import test from "node:test";

import {
  contentDeclarationPayload,
  digestCanonicalSync,
  assertKnownPlan,
  buildGraduationPlan,
  classifyDraftEntry,
  CLEARANCE_RULES,
  EMITTER_TEMPLATE_IDS,
  HAND_ASSIGNMENTS,
  TEMPLATE_CLEARANCE_PLANS,
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
  assert.deepEqual(plan.corpus.drafts, { documents: 56, entries: 293, states: { accepted: 48, blocking: 211, resolved: 34 } });
  assert.deepEqual(plan.corpus.candidates, { documents: 36, entries: 143, states: { blocking: 143 } });
  assert.deepEqual(plan.classifier.preHandRules, { authored: 10, citation: 54, corpus: 46, engine: 37, shape: 16, tablebase: 1, unbuilt: 35 });
  assert.deepEqual(plan.classifier.finalKinds, { assessment_grounded: 1, claim_bound: 55, ledger_record: 84, pointer_authored: 11, shape_firing: 18, unbuilt: 38, unreachable: 4 });
  assert.equal(plan.classifier.draftRuleSuggestions, 199);
  assert.equal(plan.classifier.draftHandTableAssignments, 12);
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
  assert.equal(plan.judgementDebt.draftKindReview, 211);
  assert.equal(plan.judgementDebt.draftSubjectAndPredicateFields, 211);
  assert.equal(plan.judgementDebt.candidateNonTemplateEntries, 2);
  assert.equal(plan.judgementDebt.resolvedClearanceBackfills, 34);
  assert.equal(plan.judgementDebt.acceptedUnreachabilityBackfills, 48);
  assert.equal(plan.judgementDebt.fixtureTransitions, 5);
});

test("migration proposal covers every entry and separates derivation, authoring, and contract blockers", () => {
  const plan = assertKnownPlan(buildGraduationPlan());
  assert.equal(plan.migration.entries, 436);
  assert.deepEqual(plan.migration.statuses, { ready: 436, requires_author: 0, blocked_contract: 0 });
  assert.equal(plan.migration.rows.length, plan.corpus.entries);
  assert.equal(new Set(plan.migration.rows.map((row) => row.key)).size, plan.corpus.entries);
  assert.deepEqual(plan.migration.templateContracts, {
    "mechanical-objective-placeholder": "ready",
    "opponent-policy-authored": "ready",
    "tablebase-opponent-not-selected": "ready",
    "outcome-ungraded": "ready",
    "start-assessment-absent": "ready",
    "target-elo-authored": "ready",
    "authored-teaching-absent": "ready",
    "recorded-play-needs-authoring": "ready",
    "mechanical-objective-needs-grounding": "ready",
  });
});

test("all nine template proposals carry the exact amended predicate without authoring chess truth", () => {
  const plan = buildGraduationPlan();
  const placeholder = plan.migration.rows.find((row) => row.file === "content/candidates/a87-dutch-defense-leningrad-variation/pack.json");
  assert.equal(placeholder.status, "ready");
  assert.equal(placeholder.fields["clearance.kind"].value, "content_declared");
  assert.equal(placeholder.fields["clearance.templateId"].value, "mechanical-objective-placeholder");
  assert.match(placeholder.fields["clearance.emittedPayloadDigest"].value, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(placeholder.fields["clearance.declaration"], undefined);

  const targetElo = plan.migration.rows.find((row) => row.entryId === "target-elo-authored");
  assert.equal(targetElo.status, "ready");
  assert.equal(targetElo.fields["clearance.kind"].value, "content_declared");
  assert.equal(targetElo.fields["clearance.templateId"].value, "target-elo-authored");
  assert.equal(targetElo.fields["clearance.subject"], undefined);

  const authoredTeaching = plan.migration.rows.find((row) => row.entryId === "authored-teaching-absent");
  assert.equal(authoredTeaching.status, "ready");
  assert.equal(authoredTeaching.fields["clearance.templateId"].value, "authored-teaching-absent");

  const outcome = plan.migration.rows.find((row) => row.entryId === "outcome-ungraded");
  assert.equal(outcome.fields["clearance.kind"].value, "objective_graded");
  assert.equal(outcome.fields["clearance.subject"].value, "/objective");

  const assessment = plan.migration.rows.find((row) => row.entryId === "start-assessment-absent");
  assert.equal(assessment.fields["clearance.kind"].value, "assessment_grounded");
  assert.equal(assessment.fields["clearance.subject"].value, "/objective/grading/assessedBy");
});

test("the closed registry owns six declaration payloads and exact mechanical predicates", () => {
  assert.deepEqual(Object.keys(TEMPLATE_CLEARANCE_PLANS).sort(), [...EMITTER_TEMPLATE_IDS].sort());
  assert.equal(Object.values(TEMPLATE_CLEARANCE_PLANS).filter((plan) => plan.kind === "content_declared").length, 6);
  assert.deepEqual(TEMPLATE_CLEARANCE_PLANS["tablebase-opponent-not-selected"], {
    kind: "pointer_equals",
    subject: "/opponentPolicy/mode",
    expected: "perfect_tablebase",
    instrument: "make pack-check",
  });
  assert.deepEqual(TEMPLATE_CLEARANCE_PLANS["outcome-ungraded"], {
    kind: "objective_graded",
    subject: "/objective",
    instrument: "objectiveRules",
  });
  assert.equal(TEMPLATE_CLEARANCE_PLANS["start-assessment-absent"].deferredSubject, true);
  assert.equal(TEMPLATE_CLEARANCE_PLANS["authored-teaching-absent"].requireNonEmptyCollection, true);
  assert.equal(TEMPLATE_CLEARANCE_PLANS["recorded-play-needs-authoring"].requireNonEmptyCollection, true);
  assert.throws(() => TEMPLATE_CLEARANCE_PLANS["authored-teaching-absent"].payloadPointers.push("/shapes"), TypeError);
});

test("content-declaration payload binds pack, entry, template, pointers, values, and absent sentinels", () => {
  const document = {
    id: "pack-one",
    opponentPolicy: { mode: "human_common", targetElo: 1500 },
  };
  const target = contentDeclarationPayload(document, "target-elo-authored", TEMPLATE_CLEARANCE_PLANS["target-elo-authored"]);
  assert.deepEqual(target, {
    schema: "tabiya.graduation.content-declaration-payload.v1",
    packId: "pack-one",
    entryId: "target-elo-authored",
    templateId: "target-elo-authored",
    payload: [{ pointer: "/opponentPolicy/targetElo", value: 1500 }],
  });
  const teaching = contentDeclarationPayload(document, "authored-teaching-absent", TEMPLATE_CLEARANCE_PLANS["authored-teaching-absent"]);
  assert.deepEqual(teaching.payload, [
    { pointer: "/planClasses", value: null },
    { pointer: "/deviations", value: null },
    { pointer: "/feedbackClaims", value: null },
  ]);
  assert.throws(() => contentDeclarationPayload(document, "outcome-ungraded", TEMPLATE_CLEARANCE_PLANS["outcome-ungraded"]), /not a content-declared template/u);
});

test("planner uses the shared RFC-8785 refusal domain", () => {
  const document = { id: "pack-\ud800", opponentPolicy: { targetElo: 1500 } };
  assert.throws(
    () => digestCanonicalSync(contentDeclarationPayload(document, "target-elo-authored", TEMPLATE_CLEARANCE_PLANS["target-elo-authored"])),
    /lone high surrogate/u,
  );
});

test("accepted prose is preserved as migration input rather than regenerated as chess truth", () => {
  const plan = buildGraduationPlan();
  const accepted = plan.migration.rows.find((row) => row.currentState === "accepted");
  assert.equal(accepted.status, "ready");
  assert.equal(accepted.fields["accepted.unreachableBecause"].value, "Owner ruling 2026-08-13: only a citable source or mechanical validation that bears on a claim can ground it; no second-party review workflow will exist.");
  assert.match(accepted.fields["accepted.unreachableBecause"].source, /existing accepted\.ruling/u);
});
