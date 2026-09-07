import assert from "node:assert/strict";
import test from "node:test";

import {
  authorAttestationMaterial,
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
  assert.deepEqual(plan.migration.statuses, { ready: 204, requires_author: 232, blocked_contract: 0 });
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
  assert.equal(placeholder.fields["clearance.kind"].value, "author_attested");
  assert.equal(placeholder.fields["clearance.templateId"].value, "mechanical-objective-placeholder");
  assert.match(placeholder.fields["clearance.emittedPayloadDigest"].value, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(placeholder.fields["clearance.attestation"], undefined);

  const targetElo = plan.migration.rows.find((row) => row.entryId === "target-elo-authored");
  assert.equal(targetElo.status, "ready");
  assert.equal(targetElo.fields["clearance.kind"].value, "author_attested");
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

test("the closed registry owns six attestation payloads and exact mechanical predicates", () => {
  assert.deepEqual(Object.keys(TEMPLATE_CLEARANCE_PLANS).sort(), [...EMITTER_TEMPLATE_IDS].sort());
  assert.equal(Object.values(TEMPLATE_CLEARANCE_PLANS).filter((plan) => plan.kind === "author_attested").length, 6);
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

test("attestation material binds pack, entry, template, pointers, values, and absent sentinels", () => {
  const document = {
    id: "pack-one",
    opponentPolicy: { mode: "human_common", targetElo: 1500 },
  };
  const target = authorAttestationMaterial(document, "target-elo-authored", TEMPLATE_CLEARANCE_PLANS["target-elo-authored"]);
  assert.deepEqual(target, {
    schema: "tabiya.graduation.author-attestation.v1",
    packId: "pack-one",
    entryId: "target-elo-authored",
    templateId: "target-elo-authored",
    payload: [{ pointer: "/opponentPolicy/targetElo", value: 1500 }],
  });
  const teaching = authorAttestationMaterial(document, "authored-teaching-absent", TEMPLATE_CLEARANCE_PLANS["authored-teaching-absent"]);
  assert.deepEqual(teaching.payload, [
    { pointer: "/planClasses", value: null },
    { pointer: "/deviations", value: null },
    { pointer: "/feedbackClaims", value: null },
  ]);
  assert.throws(() => authorAttestationMaterial(document, "outcome-ungraded", TEMPLATE_CLEARANCE_PLANS["outcome-ungraded"]), /not an author-attested template/u);
});

test("accepted prose is preserved as migration input rather than regenerated as chess truth", () => {
  const plan = buildGraduationPlan();
  const accepted = plan.migration.rows.find((row) => row.currentState === "accepted");
  assert.equal(accepted.status, "ready");
  assert.equal(accepted.fields["accepted.unreachableBecause"].value, "Owner ruling 2026-08-13: only a citable source or mechanical validation that bears on a claim can ground it; no second-party review workflow will exist.");
  assert.match(accepted.fields["accepted.unreachableBecause"].source, /existing accepted\.ruling/u);
});
