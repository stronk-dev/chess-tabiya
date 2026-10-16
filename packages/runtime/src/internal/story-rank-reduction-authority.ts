// Accepted F2 §2.3g/provider §1a. Fact-only presentation ordering over original recorded groups.
import { evidenceDigest, evidenceValueReceipt, type CompiledEvidenceManifest, type DeclaredEvidence, type VersionedEvidenceId } from "../evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { compileProjectionExecutionV2, executionPlanDigest, type CompiledEvidenceExecutionPlan } from "../evidence-execution-v2.js";
import { literalExecutionMembers, projectionOwnExecution, type CompiledProjectionExecution } from "../evidence-execution.js";
import { STORY_RANK_REDUCTION_CONTRACT as contract } from "../evidence-reduction-contract.js";
import type { ConcreteEvidenceExecutionWitness, EvidenceReductionSingleMintImage, EvidenceReductionReceipt, ReductionValueIdentity } from "../evidence-reduction-types.js";
import { directProjectionConventions } from "../evidence-convention-closure.js";
import { conventionReceipt } from "../evidence-conventions.js";
import { providerProtocolSourceBinding } from "../provider-protocol.js";
import { rankStoryMoments } from "../story.js";
import { readRecordedReviewMoments, readRecordedReviewMomentOperands, recordedReviewMomentSourceImage, type RecordedReviewMomentSource, type RecordedReviewMomentOperand } from "../recorded-review-moments.js";
import { evidenceFactorySymbol, readReviewMemberInputs } from "./evidence-value-routes.js";
import { readLastLevelReductionResult } from "./last-level-reduction-authority.js";
import { evidenceReductionSingleProof, sealOwnedStoryRankReductionProof } from "./evidence-reduction-seal.js";

const key = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;
const route = key(contract.projection);
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
function identity(value: DeclaredEvidence<unknown>): ReductionValueIdentity {
  const receipt = evidenceValueReceipt(value);
  return freeze({ producer: value.producer, projection: value.projection, factory: receipt.factory, inputDigest: receipt.inputDigest, payloadDigest: receipt.payloadDigest,
    sourceDigests: receipt.sourceDigests, conventionDigest: receipt.convention?.digest ?? null, reductionDigest: receipt.reduction === undefined ? null : evidenceDigest(receipt.reduction) });
}

function inputs(source: RecordedReviewMomentSource, plan: CompiledEvidenceExecutionPlan) {
  if (plan.kind !== "reduction" || key(plan.projection) !== route || key(plan.operation) !== key(contract.operation)) throw new TypeError("Story rank requires its exact genuine reduction plan");
  executionPlanDigest(plan);
  const data = readRecordedReviewMoments(source), operands = readRecordedReviewMomentOperands(source), image = recordedReviewMomentSourceImage(source);
  const declarations = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map(value => [key(value), value]));
  const witness = (operand: RecordedReviewMomentOperand, template: CompiledEvidenceExecutionPlan): ConcreteEvidenceExecutionWitness => {
    const value = operand.value, receipt = evidenceValueReceipt(value), ref = template.kind === "fixed" ? template.execution.projection : template.projection;
    if (key(ref) !== key(value.projection) || receipt.factory !== evidenceFactorySymbol(key(ref))) throw new TypeError("Story rank child crosses its exact template/factory");
    if (operand.kind === "reduction") {
      const proof = readLastLevelReductionResult(operand.items, operand.population), item = operand.items[operand.ordinal];
      // Nested finite templates are owned by the outer plan, not separately issued root handles.
      // Obtain the genuine child root and require its entire template image to be identical.
      const childPlan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, value.projection);
      if (template.kind !== "reduction" || key(template.operation) !== "story.last_level@1" || evidenceDigest(template) !== evidenceDigest(childPlan) || proof.reduction.planDigest !== executionPlanDigest(childPlan)
        || item?.evidence !== value || receipt.reduction !== proof.reduction || item.nodeId !== (value.payload as { evaluation: { nodeId: string } }).evaluation.nodeId) throw new TypeError("Story rank nested reduction crosses its genuine array/ordinal/plan");
      return freeze({ kind: "reduction", value: identity(value), operation: template.operation, reductionDigest: evidenceDigest(proof.reduction) });
    }
    if (template.kind !== "fixed") throw new TypeError("Story rank fixed child requires its actual fixed compiler template");
    const choices: CompiledProjectionExecution["paths"][number]["derivationChoices"][number][] = [];
    const requirements: CompiledProjectionExecution["paths"][number]["sourceRequirements"][number][] = [];
    const fixed = (node: Exclude<RecordedReviewMomentOperand, { kind: "reduction" }>, address: readonly number[]): ConcreteEvidenceExecutionWitness => {
      const declaration = declarations.get(key(node.value.projection));
      if (declaration === undefined || evidenceValueReceipt(node.value).factory !== evidenceFactorySymbol(key(node.value.projection))) throw new TypeError("Story rank fixed operand has no exact factory/declaration");
      const own = projectionOwnExecution(PRIMARY_EVIDENCE_MANIFEST, declaration);
      if (node.kind === "leaf") {
        if (declaration.derivation !== undefined || own.availability !== node.availability || own.providerOperation !== node.providerOperation) throw new TypeError("Story rank leaf crosses its actual availability/operation");
        if (own.providerOperation !== null && providerProtocolSourceBinding(key(node.value.projection))?.sourceFactoryId !== evidenceValueReceipt(node.value).factory) throw new TypeError("Story rank provider leaf lost its shared source/parser binding");
        if (own.availability !== "local") requirements.push(freeze({ occurrence: address, projection: node.value.projection, availability: own.availability, providerOperation: own.providerOperation }));
        return freeze({ kind: "leaf", value: identity(node.value), source: { availability: own.availability, providerOperation: own.providerOperation, authorityDigest: evidenceDigest(node.image) } });
      }
      const original = readReviewMemberInputs(node.value);
      if (original.length !== node.inputs.length || original.some((input, index) => input !== node.inputs[index]!.value)) throw new TypeError("Story rank member lost its original literal minted inputs");
      const members = literalExecutionMembers(declaration), actual = node.inputs.map(input => input.value.projection);
      const member = members.findIndex(inputs => inputs.length === actual.length && inputs.every((input, index) => key(input) === key(actual[index]!)));
      if (member < 0) throw new TypeError("Story rank member has no exact ordered declared input tuple");
      choices.push(freeze({ projection: node.value.projection, occurrence: address, member, inputs: actual }));
      return freeze({ kind: "member", value: identity(node.value), member, inputs: node.inputs.map((input, index) => fixed(input, [...address, index])) });
    };
    const result = fixed(operand, []);
    if (!template.execution.paths.some(path => evidenceDigest(path.derivationChoices) === evidenceDigest(choices) && evidenceDigest(path.sourceRequirements) === evidenceDigest(requirements))) throw new TypeError("Story rank concrete operands match no actual fixed compiler path");
    return result;
  };
  const occurrences: EvidenceReductionReceipt["occurrences"][number][] = [], values: DeclaredEvidence<unknown>[] = [];
  const refs = [...directProjectionConventions(route), ...data.lastLevelReduction.convention.refs];
  for (const [groupIndex, group] of data.groups.entries()) for (const [itemIndex, value] of group.evidence.entries()) {
    const element = plan.elements.findIndex(element => key(element.projection) === key(value.projection)), operand = operands[groupIndex]?.[itemIndex];
    if (element < 0 || operand?.value !== value || group.ordinal !== groupIndex) throw new TypeError("Story rank occurrence has no exact original group/item/eligible element");
    values.push(value); refs.push(...(evidenceValueReceipt(value).convention?.refs ?? []));
    occurrences.push(freeze({ group: groupIndex, item: itemIndex, element, witness: witness(operand, plan.elements[element]!.execution) }));
  }
  return { image, data, occurrences: Object.freeze(occurrences), values, refs };
}

interface StoryRankProof extends EvidenceReductionSingleMintImage {
  readonly source: RecordedReviewMomentSource; readonly plan: CompiledEvidenceExecutionPlan; readonly payload: Readonly<{ rank: readonly string[] }>;
}
const proofs = new WeakSet<object>();
export function computeStoryRankReduction(source: RecordedReviewMomentSource) {
  const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, contract.projection), input = inputs(source, plan);
  const payload = Object.freeze({ rank: rankStoryMoments(input.data.groups) }), projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === route)!;
  const output = freeze({ producer: projection.producer, projection: contract.projection, payloadDigest: evidenceDigest(payload) });
  const receipt = freeze({ operation: contract.operation, projection: contract.projection, planDigest: executionPlanDigest(plan), sourceImageDigest: evidenceDigest(input.image), occurrences: input.occurrences, outputDigest: evidenceDigest(payload) });
  const convention = conventionReceipt(input.refs, { kind: "reduction", operation: contract.operation, reductionDigest: `sha256:${evidenceDigest(receipt)}`,
    inputs: input.values.map(value => ({ projection: key(value.projection), valueDigest: `sha256:${evidenceDigest(identity(value))}` })) });
  const inputDigest = evidenceDigest({ operation: receipt.operation, planDigest: receipt.planDigest, sourceImageDigest: receipt.sourceImageDigest, occurrences: receipt.occurrences });
  const proof: StoryRankProof = Object.freeze({ resultKind: "single", source, plan, payload, output, receipt, convention, inputDigest }); proofs.add(proof);
  return Object.freeze({ proof, authority: sealOwnedStoryRankReductionProof(proof, manifest => assertStoryRankReductionProof(proof, manifest)), payload });
}
export function assertStoryRankReductionProof(proof: StoryRankProof, manifest?: CompiledEvidenceManifest): void {
  if (!proofs.has(proof)) throw new TypeError("Story rank proof was not issued by its exact source operation");
  const input = inputs(proof.source, proof.plan);
  if (executionPlanDigest(proof.plan) !== proof.receipt.planDigest || evidenceDigest(input.image) !== proof.receipt.sourceImageDigest || evidenceDigest(input.occurrences) !== evidenceDigest(proof.receipt.occurrences)
    || evidenceDigest(proof.payload) !== proof.receipt.outputDigest || proof.output.payloadDigest !== proof.receipt.outputDigest) throw new TypeError("Story rank source/occurrence/output proof changed");
  if (manifest !== undefined && executionPlanDigest(compileProjectionExecutionV2(manifest, contract.projection)) !== proof.receipt.planDigest) throw new TypeError("Story rank differs from the consumer manifest's genuine plan");
}
export function readStoryRankReductionValue(value: DeclaredEvidence<unknown>, source: RecordedReviewMomentSource) {
  const proof = evidenceReductionSingleProof(value);
  if (!proofs.has(proof) || (proof as StoryRankProof).source !== source) throw new TypeError("Story rank value crosses its original source/operation");
  return Object.freeze({ reduction: proof.receipt, convention: proof.convention });
}
