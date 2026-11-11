// Production-boundary admission for the five independently proved outcome sources.
import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceDigest, evidenceForConsumer } from "./evidence-contract.js";
import { loadSemanticValidationCases } from "./semantic-validation-case-storage.js";
import { KING_OUTCOME_LITERAL_SOURCES } from "./semantic-validation-king-outcome-sources.js";
import { CONTROL_OUTCOME_LITERAL_SOURCE } from "./semantic-validation-control-outcome-sources.js";
import { LINE_OUTCOME_LITERAL_SOURCE } from "./semantic-validation-line-outcome-sources.js";
import { RISK_OUTCOME_LITERAL_SOURCE } from "./semantic-validation-risk-outcome-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { admitValidatedSemanticInstance, SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { sha256Text } from "./semantic-validation-authorities.js";
import { parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticValidationCaseFor } from "./semantic-validation.js";

const sources = [...KING_OUTCOME_LITERAL_SOURCES, CONTROL_OUTCOME_LITERAL_SOURCE, LINE_OUTCOME_LITERAL_SOURCE, RISK_OUTCOME_LITERAL_SOURCE];
const expected = sources.flatMap(source => source.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: source.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
    span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
}))) as readonly SemanticValidationCaseFor<"runtime.semantic.subject_outcomes">[];
const families = ["king_zone", "king_opposition", "direct_attack_count", "line_blockers", "loose_piece"] as const;
const canonical = loadSemanticValidationCases().cases.map(parseSemanticValidationCase);

describe("qualified original-subject outcomes", () => {
  it.each(families)("%s binds every exact source case into all four canonical profile arms", family => {
    const rows = expected.filter(row => row.input.family === family), ids = new Set(rows.map(row => row.id));
    expect(rows.length).toBeGreaterThan(0);
    expect(canonical.filter(row => ids.has(row.id))).toEqual(rows);
    const profile = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.projection.id === `derived.semantic_avoidance.${family}`
      && row.subject.projection.version === 2)!;
    for (const [cell, arm] of [["positive", "positive"], ["semanticNegative", "semantic_negative"],
      ["orientation", "orientation"], ["counterfactual", "counterfactual"]] as const) {
      const refs = rows.filter(row => row.arm === arm).map(row => ({ kind: "case", id: row.id, version: 1, subject: row.subject, arm }));
      expect(refs.length).toBeGreaterThan(0);
      expect(profile[cell]).toEqual({ disposition: "present", refs });
    }
    expect(semanticValidationVerdict(profile.subject)?.verdict).toBe("passed");
  });

  it.each(families)("%s admits genuine factory values, refuses copies and retains ordinary consumer holds", async family => {
    const value = expected.find(row => row.input.family === family && row.arm === "positive")!;
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.subject_outcomes"].invoke(value.input);
    if (result.kind !== "completed") throw Error("Real complete source required");
    expect(result.observations.length).toBeGreaterThan(0);
    for (const observation of result.observations) {
      if (observation.kind !== "event") throw Error("Real outcome event required");
      expect(admitValidatedSemanticInstance("event", observation.item.evidence).kind).toBe("admitted");
      expect(admitValidatedSemanticInstance("event", structuredClone(observation.item.evidence)))
        .toMatchObject({ kind: "refused", reason: "event_value_unverified" });
      for (const id of ["module.postcommit_nudge", "module.review_map"]) {
        expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id, version: 2 }, [observation.item.evidence]).items).toEqual([]);
      }
    }
  });
});
