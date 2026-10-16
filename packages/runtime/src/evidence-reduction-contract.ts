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

/** Closed installed operations, not a registration API or placeholders for rank/opening. */
export function evidenceReductionContract(operation: VersionedEvidenceId) {
  if (operation === null || typeof operation !== "object" || Object.keys(operation).length !== 2
    || operation.version !== 1) {
    throw new TypeError("Evidence reduction operation has no installed exact binding");
  }
  if (operation.id === COMPARISON_REDUCTION_CONTRACT.operation.id) return COMPARISON_REDUCTION_CONTRACT;
  if (operation.id === LAST_LEVEL_REDUCTION_CONTRACT.operation.id) return LAST_LEVEL_REDUCTION_CONTRACT;
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
  const lastLevel = binding === LAST_LEVEL_REDUCTION_CONTRACT;
  if (projection.plane !== "derived" || projection.role !== "reading" || projection.grounding !== "declared_convention"
    || projection.exactness !== (lastLevel ? "measured" : "convention") || projection.confidence !== (lastLevel ? "reported" : "not_applicable")
    || !same(projection.answerContent, lastLevel ? ["fact", "evaluation"] : ["fact"]) || !same(projection.operands, lastLevel ? ["recordedResult", "evaluation"] : ["observation", "namedStructure"])
    || !same(projection.forms, lastLevel ? ["sentence", "panel"] : ["sentence", "list", "panel"]) || !same(projection.signs, ["state"])
    || !projection.abstention.possible || !projection.abstention.reasons.includes("input_abstained")) {
    throw new TypeError("Evidence reduction exceeds its exact installed answer/grounding contract");
  }
}
