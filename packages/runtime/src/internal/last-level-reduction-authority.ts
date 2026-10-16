// Accepted F2 §2.3h/provider §1a. Complete captured source first; selection never acquires evidence.
import { evidenceDigest, evidenceValueReceipt, type CompiledEvidenceManifest, type DeclaredEvidence, type VersionedEvidenceId } from "../evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { compileProjectionExecutionV2, executionPlanDigest, type CompiledEvidenceExecutionPlan } from "../evidence-execution-v2.js";
import { LAST_LEVEL_REDUCTION_CONTRACT as contract } from "../evidence-reduction-contract.js";
import type { ConcreteEvidenceExecutionWitness, EvidenceReductionMintImage, EvidenceReductionReceipt, ReductionResultItem, ReductionValueIdentity } from "../evidence-reduction-types.js";
import { directProjectionConventions } from "../evidence-convention-closure.js";
import { conventionReceipt } from "../evidence-conventions.js";
import { assertProviderDelivery, serializeProviderDelivery } from "../provider-exchange.js";
import { providerProtocolSourceBinding } from "../provider-protocol.js";
import { learnerCentipawns, reviewPointCentipawns, type ReviewEnginePoint, type StockfishPositionEvaluation } from "../review-points.js";
import { readRecordedLastLevelPopulation, type RecordedLastLevelPopulation } from "../review-evidence.js";
import { readReviewPointInvocation } from "./evidence-value-routes.js";
import { evidenceReductionResultProof, sealOwnedLastLevelReductionProof } from "./evidence-reduction-seal.js";

const key = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;
const route = key(contract.projection), providerOperation = "stockfish.position_evaluation@1" as const;
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
const encode = (value: DeclaredEvidence<unknown>) => freeze({ producer: value.producer, projection: value.projection, payload: value.payload, receipt: evidenceValueReceipt(value) });
function encodeProvider(value: DeclaredEvidence<StockfishPositionEvaluation>) {
  assertProviderDelivery(providerOperation, value.payload);
  const binding = providerProtocolSourceBinding(key(value.projection));
  if (binding?.operation !== providerOperation || binding.sourceFactoryId !== evidenceValueReceipt(value).factory) throw new TypeError("Last-level provider has no exact protocol factory authority");
  return freeze({ value: encode(value), delivery: serializeProviderDelivery(providerOperation, value.payload) });
}
/** Explicit complete value/receipt encoder; no opaque handle, selected-only list or payload shortcut. */
export function lastLevelPopulationImage(population: RecordedLastLevelPopulation) {
  const data = readRecordedLastLevelPopulation(population);
  return freeze({ boundary: data.boundary, learnerSide: data.learnerSide, outcome: data.outcome,
    result: { slot: data.result.slot, state: data.result.state, items: data.result.items.map(encode) },
    rows: data.rows.map(row => ({ pathIndex: row.pathIndex, position: encode(row.position), slot: row.slot,
      provider: row.provider?.kind === "delivered" ? { kind: row.provider.kind, delivery: encodeProvider(row.provider.delivery) } : row.provider,
      state: row.state, points: row.points.map(point => {
        const inputs = readReviewPointInvocation(point);
        if (inputs.position !== row.position) throw new TypeError("Last-level point crosses its original recorded row");
        return { value: encode(point), inputs: [encodeProvider(inputs.evaluation), encode(inputs.position)] };
      }) })) });
}
export interface RecordedLastLevelValue {
  readonly recordedResult: "1-0" | "0-1" | "1/2-1/2";
  readonly evaluation: Readonly<{ nodeId: string; whiteCentipawns: number; learnerCentipawns: number; side: "white" | "black" }>;
}
/** Pure selection over an authenticated complete population; root remains eligible here. */
export function lastRecordedAvailableLevel(population: RecordedLastLevelPopulation) {
  const data = readRecordedLastLevelPopulation(population), outcome = data.outcome, side = data.learnerSide;
  if (outcome.kind !== "recorded_result" || !((side === "white" && outcome.result === "0-1") || (side === "black" && outcome.result === "1-0"))) return Object.freeze([]);
  const recorded = data.result.items[0]?.payload as { readonly context: string; readonly result: RecordedLastLevelValue["recordedResult"] } | undefined;
  if (recorded === undefined || recorded.context !== "story" || recorded.result !== outcome.result) throw new TypeError("Last-level loss has no original eligible imported-result fact");
  let selected: Readonly<{ nodeId: string; plyOffset: number; payload: RecordedLastLevelValue }> | undefined;
  for (const row of data.rows) for (const point of row.points) {
    const whiteCp = reviewPointCentipawns(point.payload);
    if (whiteCp === null) continue;
    const learnerCp = learnerCentipawns(whiteCp, side), position = row.position.payload;
    if (learnerCp >= -100) selected = freeze({ nodeId: position.nodeId, plyOffset: position.ply,
      payload: { recordedResult: recorded.result, evaluation: { nodeId: position.nodeId, whiteCentipawns: whiteCp, learnerCentipawns: learnerCp, side } } });
  }
  return Object.freeze(selected === undefined ? [] : [selected]);
}

interface LastLevelProof extends EvidenceReductionMintImage { readonly population: RecordedLastLevelPopulation; readonly plan: CompiledEvidenceExecutionPlan }
const proofs = new WeakSet<object>();
function inputs(population: RecordedLastLevelPopulation, plan: CompiledEvidenceExecutionPlan) {
  if (plan.kind !== "reduction" || key(plan.projection) !== route || key(plan.operation) !== key(contract.operation)) throw new TypeError("Last-level requires its exact genuine reduction plan");
  executionPlanDigest(plan);
  const data = readRecordedLastLevelPopulation(population), image = lastLevelPopulationImage(population);
  const occurrences: EvidenceReductionReceipt["occurrences"][number][] = [], values: DeclaredEvidence<unknown>[] = [], refs = [...directProjectionConventions(route)];
  const leaf = (value: DeclaredEvidence<unknown>, template: CompiledEvidenceExecutionPlan, availability: "recorded" | "provider", authorityDigest: string): ConcreteEvidenceExecutionWitness => {
    const operation = availability === "provider" ? providerOperation : null;
    if (template.kind !== "fixed" || key(template.execution.projection) !== key(value.projection)
      || template.execution.own.availability !== availability || template.execution.own.providerOperation !== operation
      || template.execution.paths.length !== 1 || template.execution.paths[0]!.derivationChoices.length !== 0
      || evidenceDigest(template.execution.paths[0]!.sourceRequirements) !== evidenceDigest([{ occurrence: [], projection: value.projection, availability, providerOperation: operation }])) throw new TypeError("Last-level leaf crosses its exact source template");
    return freeze({ kind: "leaf", value: identity(value), source: { availability, providerOperation: operation, authorityDigest } });
  };
  const pointWitness = (point: DeclaredEvidence<ReviewEnginePoint>, rowIndex: number): ConcreteEvidenceExecutionWitness => {
    const template = plan.elements[1]!.execution, pointInputs = readReviewPointInvocation(point), row = data.rows[rowIndex]!;
    if (pointInputs.position !== row.position || template.kind !== "fixed" || key(template.execution.projection) !== key(point.projection)
      || template.execution.own.availability !== "local" || template.execution.own.providerOperation !== null || template.execution.paths.length !== 1) throw new TypeError("Last-level point crosses its original row or member template");
    const path = template.execution.paths[0]!;
    const actualInputs = [pointInputs.evaluation, pointInputs.position];
    if (evidenceDigest(path.derivationChoices) !== evidenceDigest([{ projection: point.projection, occurrence: [], member: 0, inputs: actualInputs.map(value => value.projection) }])
      || evidenceDigest(path.sourceRequirements) !== evidenceDigest(actualInputs.map((value, index) => ({ occurrence: [index], projection: value.projection, availability: index === 0 ? "provider" : "recorded", providerOperation: index === 0 ? providerOperation : null })))) throw new TypeError("Last-level point concrete member/input addresses differ from its compiled path");
    return freeze({ kind: "member", value: identity(point), member: 0, inputs: [
      leaf(pointInputs.evaluation, compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, pointInputs.evaluation.projection), "provider", evidenceDigest(encodeProvider(pointInputs.evaluation))),
      leaf(pointInputs.position, plan.elements[0]!.execution, "recorded", evidenceDigest({ boundary: image.boundary, row: rowIndex, position: image.rows[rowIndex]!.position })),
    ] });
  };
  const add = (value: DeclaredEvidence<unknown>, group: number, item: number, element: number, witness: ConcreteEvidenceExecutionWitness) => {
    if (key(value.projection) !== key(plan.elements[element]!.projection)) throw new TypeError("Last-level occurrence crosses its eligible element");
    values.push(value); refs.push(...(evidenceValueReceipt(value).convention?.refs ?? [])); occurrences.push(freeze({ group, item, element, witness }));
  };
  for (const [item, value] of data.result.items.entries()) add(value, 0, item, 2, leaf(value, plan.elements[2]!.execution, "recorded", evidenceDigest({ boundary: image.boundary, result: image.result })));
  for (const [index, row] of data.rows.entries()) {
    add(row.position, index + 1, 0, 0, leaf(row.position, plan.elements[0]!.execution, "recorded", evidenceDigest({ boundary: image.boundary, row: index, position: image.rows[index]!.position })));
    for (const point of row.points) add(point, index + 1, 1, 1, pointWitness(point, index));
  }
  return { image, occurrences: Object.freeze(occurrences), values, refs };
}

/** Only the sole factory calls this exact operation. Source failures precede all eligibility. */
export function computeLastLevelReduction(population: RecordedLastLevelPopulation) {
  const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, contract.projection), source = inputs(population, plan);
  const selected = lastRecordedAvailableLevel(population), projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === route)!;
  const outputs = freeze(selected.map(value => ({ nodeId: value.nodeId, plyOffset: value.plyOffset, producer: projection.producer, projection: contract.projection, payloadDigest: evidenceDigest(value.payload) })));
  const receipt = freeze({ operation: contract.operation, projection: contract.projection, planDigest: executionPlanDigest(plan), sourceImageDigest: evidenceDigest(source.image), occurrences: source.occurrences, outputDigest: evidenceDigest(outputs) });
  const convention = conventionReceipt(source.refs, { kind: "reduction", operation: contract.operation, reductionDigest: `sha256:${evidenceDigest(receipt)}`,
    inputs: source.values.map(value => ({ projection: key(value.projection), valueDigest: `sha256:${evidenceDigest(identity(value))}` })) });
  const inputDigest = evidenceDigest({ operation: receipt.operation, planDigest: receipt.planDigest, sourceImageDigest: receipt.sourceImageDigest, occurrences: receipt.occurrences });
  const proof: LastLevelProof = Object.freeze({ population, plan, receipt, convention, inputDigest, outputs }); proofs.add(proof);
  return Object.freeze({ proof, authority: sealOwnedLastLevelReductionProof(proof, manifest => assertLastLevelReductionProof(proof, manifest)), selected });
}
export function assertLastLevelReductionProof(data: LastLevelProof, manifest?: CompiledEvidenceManifest): void {
  if (!proofs.has(data)) throw new TypeError("Last-level computation proof was not issued by its exact source operation");
  const source = inputs(data.population, data.plan);
  if (executionPlanDigest(data.plan) !== data.receipt.planDigest || evidenceDigest(source.image) !== data.receipt.sourceImageDigest || evidenceDigest(source.occurrences) !== evidenceDigest(data.receipt.occurrences)
    || evidenceDigest(data.outputs) !== data.receipt.outputDigest) throw new TypeError("Last-level source/concrete execution/output authority changed");
  if (manifest !== undefined && executionPlanDigest(compileProjectionExecutionV2(manifest, contract.projection)) !== data.receipt.planDigest) throw new TypeError("Last-level receipt differs from the consumer manifest's genuine V2 plan");
}
/** Original complete result first, then requested complete source; copies never gain authority. */
export function readLastLevelReductionResult(result: readonly ReductionResultItem[], population: RecordedLastLevelPopulation) {
  const proof = evidenceReductionResultProof(result);
  if (!proofs.has(proof) || (proof as LastLevelProof).population !== population) throw new TypeError("Last-level result crosses its original population/operation");
  if (key(proof.receipt.operation) !== key(contract.operation) || key(proof.receipt.projection) !== route
    || evidenceDigest(lastLevelPopulationImage(population)) !== proof.receipt.sourceImageDigest) throw new TypeError("Last-level result crosses its operation or complete recorded source");
  return Object.freeze({ reduction: proof.receipt, convention: proof.convention });
}
