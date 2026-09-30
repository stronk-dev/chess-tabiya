/**
 * The §3.2 requirement law as a generated exhibit (rfc/semantic-validation-authority.md §3.2).
 *
 * The literal profiles in `semantic-validation-profiles.json` are the authority; this function
 * derives what the law requires of each live root so a test can prove the literal rows agree with
 * it. The law never fills a cell: a `present` cell exists only where a registered case, executed
 * population receipt or migrated external receipt names the subject. Not barrel-exported.
 */
import type { VersionedEvidenceId } from "./evidence-contract.js";
import { semanticValidationBlockedFamily, semanticValidationPopulationOperation, SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import {
  semanticValidationDigest,
  semanticValidationSubjectKey,
  type SemanticExternalDisagreementReceiptRef,
  type SemanticPopulationReceiptRef,
  type SemanticValidationArm,
  type SemanticValidationCase,
  type SemanticValidationCell,
  type SemanticValidationProfile,
  type SemanticValidationSubject,
} from "./semantic-validation.js";

const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

/** §3.2: counterfactual is required for the thirteen avoidance events and reply breadth only. */
export function semanticCounterfactualRequired(projection: VersionedEvidenceId): boolean {
  return projection.id.startsWith("derived.semantic_avoidance.") || projection.id === "rules.tactic.consequence.reply_breadth";
}

/** D872's eight external-taxonomy families (v1 projections they were measured over). */
export const SEMANTIC_EXTERNAL_TAXONOMY_FAMILIES: readonly string[] = Object.freeze([
  "rules.tactic.event.defender_removed", "derived.tactic.deflection_observed", "derived.tactic.attraction_observed",
  "derived.tactic.line_blocker_clearance_observed", "derived.tactic.square_clearance_observed", "derived.tactic.interference_observed",
  "derived.tactic.check_zwischenzug_observed", "derived.tactic.overload_exploitation_observed",
]);

/** A stable population receipt id per subject (base id; never the generated event label). */
export function semanticPopulationReceiptId(subject: SemanticValidationSubject): string {
  return `r2-2026-07.${semanticValidationDigest("population-receipt-id", semanticValidationSubjectKey(subject)).slice(0, 16)}`;
}

const required = <A extends SemanticValidationArm>(owner: string, discharge: string): SemanticValidationCell<A> => Object.freeze({ disposition: "required", owner, discharge });

/** Derives the law's profile for one live root from the registered case/receipt populations. */
export function semanticValidationLawProfile(subject: SemanticValidationSubject, cases: readonly SemanticValidationCase[], externalIds: ReadonlyMap<string, string>): SemanticValidationProfile {
  const key = semanticValidationSubjectKey(subject);
  const blocked = semanticValidationBlockedFamily(subject.projection);
  const caseCell = <A extends "positive" | "semantic_negative" | "orientation" | "counterfactual">(arm: A, owner: string, discharge: string): SemanticValidationCell<A> => {
    if (blocked !== undefined) return required(blocked.owner, blocked.discharge);
    const refs = cases.filter((value) => value.arm === arm && semanticValidationSubjectKey(value.subject) === key).map((value) => Object.freeze({ kind: "case" as const, id: value.id, version: 1 as const, subject, arm }));
    return refs.length > 0 ? Object.freeze({ disposition: "present", refs: Object.freeze(refs) }) as unknown as SemanticValidationCell<A> : required(owner, discharge);
  };
  const populationOperation = semanticValidationPopulationOperation(subject);
  const importedPopulation: SemanticValidationCell<"imported_population"> = blocked !== undefined
    ? required(blocked.owner, blocked.discharge)
    : populationOperation === undefined
      ? required("recorded-semantic-path D1870", "v1 multi-edge window events have no production operation; only their exact-edge v2 successors are emitted and census-executed")
      : SEMANTIC_VALIDATION_OPERATIONS[populationOperation].reach.kind === "required"
        ? required((SEMANTIC_VALIDATION_OPERATIONS[populationOperation].reach as { readonly owner: string }).owner, "the population census cannot pass while the operation's application reach is required; the D1023 batch census (make bounded-target-census) is the measured execution")
      : Object.freeze({ disposition: "present", refs: Object.freeze([Object.freeze({ kind: "population_receipt", id: semanticPopulationReceiptId(subject), version: 1, subject, inputVersion: 1, resultVersion: 1 }) as SemanticPopulationReceiptRef]) });
  const externalId = externalIds.get(key);
  const externalLabel: SemanticValidationCell<"external_label"> = externalId !== undefined
    ? Object.freeze({ disposition: "present", refs: Object.freeze([Object.freeze({ kind: "external_disagreement_receipt", id: externalId, version: 1, subject, datasetVersion: 1, resultVersion: 1 }) as SemanticExternalDisagreementReceiptRef]) })
    : SEMANTIC_EXTERNAL_TAXONOMY_FAMILIES.includes(subject.projection.id)
      ? required("semantic-validation D4 (slice C)", "re-run the D872 disagreement study over this successor version's production operation; a new version starts with no receipt")
      : Object.freeze({ disposition: "not_applicable", reason: "no_independent_external_taxonomy" });
  const counterfactual: SemanticValidationCell<"counterfactual"> = semanticCounterfactualRequired(subject.projection)
    ? caseCell("counterfactual", "semantic-validation D4 (slice C)", "execute the played edge plus its complete legal-alternative population under an independent authority")
    : Object.freeze({ disposition: "not_applicable", reason: "literal_or_observed_event_makes_no_alternative_claim" });
  return Object.freeze({
    subject,
    positive: caseCell("positive", "semantic-validation D4/D5", "a legal input through the production operation with an independent authority (rules oracle + proposition, cited source or owner receipt)"),
    semanticNegative: caseCell("semantic_negative", "semantic-validation D4/D5", "a nearby legal input reaching the production operation that omits the exact event, with an independent authority"),
    orientation: caseCell("orientation", "semantic-validation D5", "a mirrored case pair with a total operand rule walk and an independent authority; no emitter-level orientation authority exists"),
    counterfactual,
    importedPopulation,
    externalLabel,
  });
}

/** Reach debt attached to a subject's operations (surfaced as a required cell outcome). */
export function semanticValidationReachDebt(operation: keyof typeof SEMANTIC_VALIDATION_OPERATIONS): { readonly owner: string; readonly discharge: string } | undefined {
  const reach = SEMANTIC_VALIDATION_OPERATIONS[operation].reach;
  return reach.kind === "required" ? { owner: reach.owner, discharge: reach.discharge } : undefined;
}

export { refKey as semanticValidationRefKey };
