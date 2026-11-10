// Accepted provider §1a/F2 §2.3i. Semantic admission only; actual callable readiness is V2's job.
// Keep this bootstrap module free of factory/catalogue/source-owner value imports.
import type { ProjectionDeclaration, VersionedEvidenceId } from "./evidence-contract.js";
import { COMPARISON_STRUCTURAL_ROUTES } from "./internal/comparison-structural-families.js";

const ref = (id: string, version = 1): VersionedEvidenceId => Object.freeze({ id, version });
const exact = (value: VersionedEvidenceId) => `${value.id}@${value.version}`;
export const COMPARISON_REDUCTION_CONTRACT = Object.freeze({
  operation: ref("compare.structure_delta"),
  projection: ref("derived.compare.structure_delta", 2),
  factory: "createDerivedCompareStructureDeltaV2Evidence",
  sourceOwner: "RecordedComparisonStructuralPopulation" as const,
  sourceUse: "captured_only" as const,
  elements: Object.freeze([ref("run.record.position"), ...COMPARISON_STRUCTURAL_ROUTES.map(route => {
    const [id, version] = route.split("@"); return ref(id!, Number(version));
  })]),
});

export const LAST_LEVEL_REDUCTION_CONTRACT = Object.freeze({
  operation: ref("story.last_level"), projection: ref("derived.story.last_level", 2),
  factory: "createDerivedStoryLastLevelV2Evidence",
  sourceOwner: "RecordedLastLevelPopulation" as const, sourceUse: "captured_only" as const,
  elements: Object.freeze([ref("run.record.position"), ref("derived.review.eval_point"), ref("run.record.imported_result")]),
});
export const STORY_RANK_REDUCTION_CONTRACT = Object.freeze({
  operation: ref("story.rank"), projection: ref("derived.story.rank", 3), factory: "createDerivedStoryRankV3Evidence",
  sourceOwner: "RecordedReviewMomentSource" as const, sourceUse: "captured_only" as const,
  elements: Object.freeze([ref("derived.review.eval_delta", 2), ref("derived.review.mate_transition", 2), ref("derived.story.last_level", 2),
    ref("run.record.consequence"), ref("run.record.imported_result"), ref("derived.pivotal.irreversibility"), ref("derived.pivotal.phase_change", 2),
    ref("derived.pivotal.human_divergence", 2), ref("derived.pivotal.option_collapse", 2), ref("rules.endgame.classification"), ref("theory.shapes.firing")]),
});
export const OPENING_HISTORY_REDUCTION_CONTRACT = Object.freeze({
  operation: ref("opening.deepest_reached"), projection: ref("derived.opening.deepest_reached", 2),
  factory: "createDerivedOpeningDeepestReachedV2Evidence",
  sourceOwner: "RecordedOpeningHistorySource" as const, sourceUse: "captured_only" as const,
  elements: Object.freeze([ref("run.record.position"), ref("theory.opening.current_endpoint")]),
});
export const AUTHORED_PREDICATE_REDUCTION_CONTRACT = Object.freeze({
  operation: ref("authoring.structural_predicate"), projection: ref("derived.structural.predicate_result", 2),
  factory: "createDerivedStructuralPredicateResultV2Evidence", sourceOwner: "AuthoredPredicatePopulation" as const, sourceUse: "captured_only" as const,
  elements: Object.freeze([ref("authored.structural_condition.input", 2), ref("rules.mobility.reading.legal_moves"), ...[
    "backward_pawn@1", "backward_pawn@2", "bishop_on_shade@1", "direct_attack_count@1", "doubled_pawn@1", "half_open_file@1", "isolated_pawn@1",
    "king_opposition@1", "king_opposition@2", "king_zone@1", "line_blockers@1", "named_structure@1", "open_file@1", "outpost@1", "outpost@2",
    "passed_pawn@1", "pawn_count@1", "pawn_safe_square@1", "piece_count@1", "piece_distance@1", "piece_reach_count@1",
  ].map(value => { const [kind, version] = value.split("@"); return ref(`rules.structural.predicate.${kind}`, Number(version)); })]),
});

/** Closed installed operations, not a registration API. */
export function evidenceReductionContract(operation: VersionedEvidenceId) {
  if (operation === null || typeof operation !== "object" || Object.keys(operation).length !== 2
    || operation.version !== 1) {
    throw new TypeError("Evidence reduction operation has no installed exact binding");
  }
  if (operation.id === COMPARISON_REDUCTION_CONTRACT.operation.id) return COMPARISON_REDUCTION_CONTRACT;
  if (operation.id === LAST_LEVEL_REDUCTION_CONTRACT.operation.id) return LAST_LEVEL_REDUCTION_CONTRACT;
  if (operation.id === STORY_RANK_REDUCTION_CONTRACT.operation.id) return STORY_RANK_REDUCTION_CONTRACT;
  if (operation.id === OPENING_HISTORY_REDUCTION_CONTRACT.operation.id) return OPENING_HISTORY_REDUCTION_CONTRACT;
  if (operation.id === AUTHORED_PREDICATE_REDUCTION_CONTRACT.operation.id) return AUTHORED_PREDICATE_REDUCTION_CONTRACT;
  throw new TypeError("Evidence reduction operation has no installed exact binding");
}

export function assertEvidenceReductionDeclaration(projection: ProjectionDeclaration): void {
  const reduction = projection.derivation?.reduction;
  if (reduction === undefined || Object.keys(projection.derivation!).length !== 1 || Object.keys(reduction).length !== 2 || !Object.hasOwn(reduction, "operation") || !Object.hasOwn(reduction, "elements")) throw new TypeError("Evidence reduction requires exactly operation/elements");
  const binding = evidenceReductionContract(reduction.operation);
  if (exact(projection) !== exact(binding.projection) || !Array.isArray(reduction.elements)
    || reduction.elements.length !== binding.elements.length
    || reduction.elements.some((element, index) => Object.keys(element).length !== 2 || exact(element) !== exact(binding.elements[index]!))) {
    throw new TypeError("Evidence reduction projection/ordered element contract differs from its installed binding");
  }
  const same = (left: readonly string[], right: readonly string[]) => left.length === right.length && left.every((value, index) => value === right[index]);
  if (binding === AUTHORED_PREDICATE_REDUCTION_CONTRACT) {
    if (projection.plane !== "derived" || projection.role !== "reading" || projection.grounding !== "declared_convention"
      || projection.exactness !== "convention" || projection.confidence !== "not_applicable" || !same(projection.answerContent, ["fact"])
      || !same(projection.operands, ["observation"]) || !same(projection.forms, ["machine_condition", "panel"]) || !same(projection.signs, ["state"])
      || !projection.abstention.possible || !same(projection.abstention.reasons, ["source_dependency_unavailable", "input_abstained"])) throw new TypeError("Authored predicate reduction exceeds its exact installed answer/grounding contract");
    return;
  }
  const lastLevel = binding === LAST_LEVEL_REDUCTION_CONTRACT;
  const rank = binding === STORY_RANK_REDUCTION_CONTRACT;
  const opening = binding === OPENING_HISTORY_REDUCTION_CONTRACT;
  if (projection.plane !== "derived" || projection.role !== "reading" || projection.grounding !== "declared_convention"
    || projection.exactness !== (opening ? "exact" : lastLevel ? "measured" : "convention") || projection.confidence !== (opening ? "exact" : lastLevel || rank ? "reported" : "not_applicable")
    || !same(projection.answerContent, opening ? ["fact", "theory"] : lastLevel ? ["fact", "evaluation"] : ["fact"]) || !same(projection.operands, opening ? ["deepest", "visits", "catalogue"] : lastLevel ? ["recordedResult", "evaluation"] : rank ? ["rank"] : ["observation", "namedStructure"])
    || !same(projection.forms, lastLevel ? ["sentence", "panel"] : rank ? ["list", "panel", "machine_condition"] : ["sentence", "list", "panel"]) || !same(projection.signs, ["state"])
    || !projection.abstention.possible || (opening ? !same(projection.abstention.reasons, ["artifact_missing", "artifact_invalid", "digest_mismatch"]) : !projection.abstention.reasons.includes("input_abstained"))) {
    throw new TypeError("Evidence reduction exceeds its exact installed answer/grounding contract");
  }
}
