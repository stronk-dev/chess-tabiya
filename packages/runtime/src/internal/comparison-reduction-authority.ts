// Package-private atomic authority. Issuance/publication: sole factory; value join: sole core mint.
// No public export, callback, mutable registration, or after-the-fact receipt attachment.
import { evidenceDigest, evidenceValueReceipt, type CompiledEvidenceManifest, type DeclaredEvidence, type VersionedEvidenceId } from "../evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { comparisonStructuralAppearances, comparisonStructuralPopulationImage, readComparisonStructuralPopulation, type RecordedComparisonStructuralPopulation, type ScopedStructuralObservationChange } from "../comparison-structural-population.js";
import { compileProjectionExecutionV2, executionPlanDigest, type CompiledEvidenceExecutionPlan } from "../evidence-execution-v2.js";
import { COMPARISON_REDUCTION_CONTRACT as contract } from "../evidence-reduction-contract.js";
import { directProjectionConventions } from "../evidence-convention-closure.js";
import { conventionReceipt } from "../evidence-conventions.js";
import type { RunEvidenceItem } from "../evidence-factories.js";
import { sealOwnedComparisonReductionProof, evidenceReductionResultProof } from "./evidence-reduction-seal.js";

import type { EvidenceReductionMintImage, EvidenceReductionReceipt, ReductionValueIdentity } from "../evidence-reduction-types.js";
export interface ComparisonReductionProof extends EvidenceReductionMintImage {
  readonly population: RecordedComparisonStructuralPopulation; readonly branchId: string; readonly plan: CompiledEvidenceExecutionPlan;
}
const proofs = new WeakSet<object>();
const key = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;
const route = key(contract.projection);
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
function identity(value: DeclaredEvidence<unknown>): ReductionValueIdentity {
  const receipt = evidenceValueReceipt(value);
  return freeze({ producer: value.producer, projection: value.projection, factory: receipt.factory, inputDigest: receipt.inputDigest,
    payloadDigest: receipt.payloadDigest, sourceDigests: receipt.sourceDigests, conventionDigest: receipt.convention?.digest ?? null,
    reductionDigest: receipt.reduction === undefined ? null : evidenceDigest(receipt.reduction) });
}
function inputs(population: RecordedComparisonStructuralPopulation, branchId: string, plan: CompiledEvidenceExecutionPlan) {
  if (plan.kind !== "reduction" || key(plan.projection) !== route || key(plan.operation) !== key(contract.operation)) throw new TypeError("Comparison requires its genuine exact reduction plan");
  executionPlanDigest(plan);
  const data = readComparisonStructuralPopulation(population), image = comparisonStructuralPopulationImage(population, branchId);
  const occurrences: EvidenceReductionReceipt["occurrences"][number][] = [], values: DeclaredEvidence<unknown>[] = [], refs = [...directProjectionConventions(route)];
  let q = 0;
  for (const [columnIndex, column] of data.columns.entries()) for (const [rowIndex, row] of column.nodes.entries()) {
    const encoded = image.columns[columnIndex]!.nodes[rowIndex]!;
    const add = (value: DeclaredEvidence<unknown>, group: number, item: number, element: number, authorityDigest: string) => {
      const template = plan.elements[element];
      if (template === undefined || key(value.projection) !== key(template.projection) || template.execution.kind !== "fixed"
        || template.execution.execution.paths.length !== 1 || template.execution.execution.paths[0]!.derivationChoices.length !== 0) throw new TypeError("Comparison occurrence has no exact leaf template");
      const availability = template.execution.execution.own.availability;
      if (availability !== (element === 0 ? "recorded" : "local") || template.execution.execution.own.providerOperation !== null) throw new TypeError("Comparison leaf has crossed source availability");
      values.push(value);
      occurrences.push(freeze({ group, item, element, witness: { kind: "leaf", value: identity(value), source: { availability, providerOperation: null, authorityDigest } } }));
    };
    add(row.position, 18 * q, 0, 0, evidenceDigest({ comparison: image.comparison, column: columnIndex, row: rowIndex, position: encoded.position }));
    for (const [familyIndex, family] of row.families.entries()) {
      const invocation = encoded.families[familyIndex]!;
      refs.push(...invocation.invocation.convention.refs); // Includes authentic empty invocations.
      for (const [itemIndex, value] of family.items.entries()) add(value, 18 * q + 1 + familyIndex, itemIndex, familyIndex + 1, evidenceDigest(invocation));
    }
    q++;
  }
  return { image, occurrences: Object.freeze(occurrences), values, refs };
}

/** Only the exact factory may initiate this operation; output selection is computed here. */
export function computeComparisonReduction(population: RecordedComparisonStructuralPopulation, branchId: string) {
  const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, contract.projection), source = inputs(population, branchId, plan);
  const appearances = comparisonStructuralAppearances(population, branchId), projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === route)!;
  const outputs = freeze(appearances.map(value => ({ nodeId: value.nodeId, plyOffset: value.plyOffset, producer: projection.producer, projection: contract.projection, payloadDigest: evidenceDigest(value.payload) })));
  const receipt = freeze({ operation: contract.operation, projection: contract.projection, planDigest: executionPlanDigest(plan), sourceImageDigest: evidenceDigest(source.image), occurrences: source.occurrences, outputDigest: evidenceDigest(outputs) });
  const convention = conventionReceipt(source.refs, { kind: "reduction", operation: contract.operation, reductionDigest: `sha256:${evidenceDigest(receipt)}`,
    inputs: source.values.map(value => ({ projection: key(value.projection), valueDigest: `sha256:${evidenceDigest(identity(value))}` })) });
  const inputDigest = evidenceDigest({ operation: receipt.operation, planDigest: receipt.planDigest, sourceImageDigest: receipt.sourceImageDigest, occurrences: receipt.occurrences });
  const proof: ComparisonReductionProof = Object.freeze({ population, branchId, plan, receipt, convention, inputDigest, outputs });
  proofs.add(proof);
  return Object.freeze({ proof, authority: sealOwnedComparisonReductionProof(proof, manifest => assertComparisonReductionProof(proof, manifest)), appearances });
}

export function assertComparisonReductionProof(data: ComparisonReductionProof, manifest?: CompiledEvidenceManifest): void {
  if (!proofs.has(data)) throw new TypeError("Comparison computation proof was not issued by its exact source operation");
  const proof = inputs(data.population, data.branchId, data.plan);
  if (executionPlanDigest(data.plan) !== data.receipt.planDigest || evidenceDigest(proof.image) !== data.receipt.sourceImageDigest || evidenceDigest(proof.occurrences) !== evidenceDigest(data.receipt.occurrences)) throw new TypeError("Reduction source or concrete execution authority changed");
  if (evidenceDigest(data.outputs) !== data.receipt.outputDigest) throw new TypeError("Reduction output image changed");
  if (manifest !== undefined && executionPlanDigest(compileProjectionExecutionV2(manifest, contract.projection)) !== data.receipt.planDigest) throw new TypeError("Reduction receipt differs from the consumer manifest's genuine V2 plan");
}

export function readComparisonReductionResult(result: readonly RunEvidenceItem<ScopedStructuralObservationChange>[], population: RecordedComparisonStructuralPopulation, branchId: string) {
  const proof = evidenceReductionResultProof(result);
  if (!proofs.has(proof) || (proof as ComparisonReductionProof).population !== population) throw new TypeError("Comparison result crosses its original population/operation");
  if (key(proof.receipt.operation) !== key(contract.operation) || key(proof.receipt.projection) !== route
    || evidenceDigest(comparisonStructuralPopulationImage(population, branchId)) !== proof.receipt.sourceImageDigest) throw new TypeError("Comparison result crosses its operation, requested branch or complete source");
  return Object.freeze({ reduction: proof.receipt, convention: proof.convention });
}
