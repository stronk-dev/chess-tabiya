import { readFileSync } from "node:fs";

import { objectiveRules } from "../../apps/server/src/pack-orchestrator.js";
import { emitterGraduationBlocker, EMITTER_TEMPLATE_IDS } from "../../apps/server/src/graduation-blocker-templates.mjs";
import {
  contentDeclarationPayload,
  TEMPLATE_CLEARANCE_PLANS,
} from "../graduation-clearance-plan.mjs";
import { describe, expect, test } from "vitest";

import {
  declare,
  digestCanonicalSync,
  evaluateTemplate,
  persistedClearance,
  type EvaluationContext,
  type TemplatePlan,
} from "./model.js";

const candidate = JSON.parse(readFileSync("content/candidates/onramp-00008/pack.json", "utf8"));
const recorded = JSON.parse(readFileSync("content/candidates/a87-dutch-defense-leningrad-variation/pack.json", "utf8"));
const graded = JSON.parse(readFileSync("content/drafts/outcome-resist.browser.json", "utf8"));
const plans = TEMPLATE_CLEARANCE_PLANS as Readonly<Record<string, TemplatePlan>>;
const unverified: EvaluationContext = {
  assessmentGrounding: "unverified",
  objectiveRuleCount: (document) => objectiveRules(document as any).length,
};
const verified: EvaluationContext = { ...unverified, assessmentGrounding: "ledger_verified" };

function documentFor(entryId: string) {
  const source = ["mechanical-objective-placeholder", "recorded-play-needs-authoring"].includes(entryId)
    ? recorded
    : entryId === "outcome-ungraded" ? graded : candidate;
  const document = structuredClone(source);
  document.id = `contract-${entryId}`;
  if (entryId === "outcome-ungraded" || entryId === "start-assessment-absent") {
    document.objective = structuredClone(candidate.objective);
  }
  const values = ["opponent-policy-authored", "tablebase-opponent-not-selected"].includes(entryId)
    ? { opponent: document.opponentPolicy.mode }
    : {};
  const emitted = emitterGraduationBlocker(entryId, values);
  const plan = plans[entryId]!;
  const clearance = persistedClearance(plan);
  const entry = { ...emitted, clearance: { ...clearance } };
  document.provenance = { ...(document.provenance ?? {}), graduationBlockers: [entry] };
  if (plan.captureEmittedPayload === true) {
    entry.clearance.emittedPayloadDigest = digestCanonicalSync(contentDeclarationPayload(document, entryId, plan));
  }
  return { document, entry, plan };
}

function makeTrue(entryId: string) {
  const fixture = documentFor(entryId);
  const { document, entry, plan } = fixture;
  switch (entryId) {
    case "mechanical-objective-placeholder":
      document.objective.summary = "Hold the dark squares after Black challenges the centre.";
      entry.clearance.declaration = declare(document, entryId, plan);
      break;
    case "outcome-ungraded":
      document.objective = structuredClone(graded.objective);
      break;
    case "start-assessment-absent":
      document.objective = structuredClone(graded.objective);
      break;
    case "target-elo-authored":
    case "opponent-policy-authored":
    case "recorded-play-needs-authoring":
    case "mechanical-objective-needs-grounding":
      entry.clearance.declaration = declare(document, entryId, plan);
      break;
    case "authored-teaching-absent":
      document.feedbackClaims = [{ text: "author-supplied fixture", evidenceRefs: [] }];
      entry.clearance.declaration = declare(document, entryId, plan);
      break;
    case "tablebase-opponent-not-selected":
      document.opponentPolicy.mode = "perfect_tablebase";
      break;
    default:
      throw new Error(`missing mutation for ${entryId}`);
  }
  return fixture;
}

function makeFalseAgain(entryId: string, fixture: ReturnType<typeof makeTrue>) {
  const { document, entry } = fixture;
  switch (entryId) {
    case "mechanical-objective-placeholder":
    case "mechanical-objective-needs-grounding":
      document.objective.summary += " changed";
      break;
    case "outcome-ungraded":
      delete document.objective.grading;
      break;
    case "start-assessment-absent":
      delete document.objective.grading.assessedBy;
      break;
    case "target-elo-authored":
      document.opponentPolicy.targetElo += 1;
      break;
    case "authored-teaching-absent":
      document.feedbackClaims.push({ text: "changed", evidenceRefs: [] });
      break;
    case "opponent-policy-authored":
      document.opponentPolicy.mode = "theory_strict";
      break;
    case "tablebase-opponent-not-selected":
      document.opponentPolicy.mode = "strong_engine";
      break;
    case "recorded-play-needs-authoring":
      document.spine[0].moveUci = "a2a3";
      break;
    default:
      throw new Error(`missing stale mutation for ${entryId}`);
  }
  return entryId === "start-assessment-absent" ? unverified : verified;
}

describe("graduation-clearance bounded author model", () => {
  test("all nine real emitter shapes execute false -> true -> false", () => {
    expect(EMITTER_TEMPLATE_IDS).toHaveLength(9);
    for (const entryId of EMITTER_TEMPLATE_IDS) {
      const initial = documentFor(entryId);
      expect(evaluateTemplate(plans, initial.document, initial.entry as any, unverified), `${entryId}: emitted`).toBe(false);
      const truth = makeTrue(entryId);
      const context = entryId === "start-assessment-absent" ? verified : unverified;
      expect(evaluateTemplate(plans, truth.document, truth.entry as any, context), `${entryId}: true`).toBe(true);
      const falseContext = makeFalseAgain(entryId, truth);
      expect(evaluateTemplate(plans, truth.document, truth.entry as any, falseContext), `${entryId}: stale`).toBe(false);
    }
  });

  test("the registry is rejoined and every persisted plan field is immutable", () => {
    for (const entryId of EMITTER_TEMPLATE_IDS) {
      const fixture = documentFor(entryId);
      for (const key of Object.keys(persistedClearance(fixture.plan))) {
        const changed = structuredClone(fixture.entry);
        changed.clearance[key] = key === "expected" ? "human_common" : `${String(changed.clearance[key])}-changed`;
        expect(() => evaluateTemplate(plans, fixture.document, changed as any, unverified), `${entryId}:${key}`)
          .toThrow(/clearance:plan-mismatch/u);
      }
      const widened = structuredClone(fixture.entry);
      widened.clearance.payloadPointers = ["/attackerChosenPointer"];
      expect(() => evaluateTemplate(plans, fixture.document, widened as any, unverified)).toThrow(/clearance:plan-extra/u);
    }
  });

  test("dangerous-direction controls cannot launder the three formerly-ready plans", () => {
    const tablebase = documentFor("tablebase-opponent-not-selected");
    tablebase.document.opponentPolicy.mode = "strong_engine";
    expect(evaluateTemplate(plans, tablebase.document, tablebase.entry as any, unverified)).toBe(false);

    const policy = documentFor("opponent-policy-authored");
    policy.document.opponentPolicy.mode = "theory_strict";
    expect(evaluateTemplate(plans, policy.document, policy.entry as any, unverified)).toBe(false);

    const placeholder = documentFor("mechanical-objective-placeholder");
    placeholder.entry.clearance.declaration = declare(placeholder.document, placeholder.entry.id, placeholder.plan);
    expect(evaluateTemplate(plans, placeholder.document, placeholder.entry as any, unverified)).toBe(false);
  });

  test("empty authored collections and empty recorded play fail even with matching declarations", () => {
    const teaching = documentFor("authored-teaching-absent");
    teaching.entry.clearance.declaration = declare(teaching.document, teaching.entry.id, teaching.plan);
    expect(evaluateTemplate(plans, teaching.document, teaching.entry as any, unverified)).toBe(false);

    const recordedPlay = documentFor("recorded-play-needs-authoring");
    recordedPlay.document.spine = [];
    recordedPlay.entry.clearance.declaration = declare(recordedPlay.document, recordedPlay.entry.id, recordedPlay.plan);
    expect(evaluateTemplate(plans, recordedPlay.document, recordedPlay.entry as any, unverified)).toBe(false);
  });

  test("all four closed outcome types require grading and compile production objective rules", () => {
    for (const type of ["win", "hold", "save", "resist"] as const) {
      const fixture = documentFor("outcome-ungraded");
      fixture.document.objective = { ...structuredClone(graded.objective), type };
      expect(evaluateTemplate(plans, fixture.document, fixture.entry as any, unverified), type).toBe(true);
      delete fixture.document.objective.grading;
      expect(evaluateTemplate(plans, fixture.document, fixture.entry as any, unverified), `${type}: no grading`).toBe(false);
    }
  });

  test("declarations bind repository label, time, pack, entry, template, pointers and values", () => {
    const source = makeTrue("target-elo-authored");
    expect(evaluateTemplate(plans, source.document, source.entry as any, unverified)).toBe(true);

    const copiedPack = structuredClone(source);
    copiedPack.document.id = "another-pack";
    expect(evaluateTemplate(plans, copiedPack.document, copiedPack.entry as any, unverified)).toBe(false);

    const copiedEntry = makeTrue("mechanical-objective-needs-grounding");
    copiedEntry.entry.clearance.declaration = source.entry.clearance.declaration;
    expect(evaluateTemplate(plans, copiedEntry.document, copiedEntry.entry as any, unverified)).toBe(false);

    const malformed = structuredClone(source);
    malformed.entry.clearance.declaration.declaredAt = "yesterday";
    expect(() => evaluateTemplate(plans, malformed.document, malformed.entry as any, unverified)).toThrow(/declaredAt/u);

    const relabelled = structuredClone(source);
    relabelled.entry.clearance.declaration.authority = "human_chess_author";
    expect(evaluateTemplate(plans, relabelled.document, relabelled.entry as any, unverified)).toBe(false);
  });

  test("the shared RFC-8785 authority rejects malformed Unicode before hashing", () => {
    expect(() => digestCanonicalSync({ value: "\ud800" })).toThrow(/lone high surrogate/u);
    expect(() => digestCanonicalSync({ "\udc00": "value" })).toThrow(/lone low surrogate/u);
  });
});
