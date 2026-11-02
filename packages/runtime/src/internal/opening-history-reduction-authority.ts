// Accepted installed-opening §3a / F2 §2.3k / provider §1a: the exact fourth owned reduction.
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { evidenceDigest, evidenceValueReceipt, type CompiledEvidenceManifest, type DeclaredEvidence, type VersionedEvidenceId } from "../evidence-contract.js";
import { compileProjectionExecutionV2, executionPlanDigest, type CompiledEvidenceExecutionPlan } from "../evidence-execution-v2.js";
import { OPENING_HISTORY_REDUCTION_CONTRACT as contract } from "../evidence-reduction-contract.js";
import type { ConcreteEvidenceExecutionWitness, EvidenceReductionItemsMintImage, EvidenceReductionReceipt, ReductionResultItem, ReductionValueIdentity } from "../evidence-reduction-types.js";
import { directProjectionConventions } from "../evidence-convention-closure.js";
import { conventionReceipt } from "../evidence-conventions.js";
import { deriveDeepestOpeningVisits, type DeepestOpeningReached } from "../opening-catalogue.js";
import { readRecordedOpeningHistory, type RecordedOpeningHistorySource } from "../recorded-opening-history.js";
import { readRecordedOpeningPointResult } from "./evidence-value-routes.js";
import { readRecordedOpeningLookup } from "./recorded-opening-lookup.js";
import { evidenceReductionResultProof, sealOwnedOpeningHistoryReductionProof } from "./evidence-reduction-seal.js";

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
const encode = (value: DeclaredEvidence<unknown>) => freeze({ producer: value.producer, projection: value.projection, payload: value.payload, receipt: evidenceValueReceipt(value) });

/** All rows, including negative invocations; never serializes an opaque handle as {}. */
export function recordedOpeningHistoryImage(history: RecordedOpeningHistorySource) {
  const data = readRecordedOpeningHistory(history);
  return freeze({ run: data.run, authority: data.authority, rows: data.rows.map(row => {
    const invocation = readRecordedOpeningLookup(row.invocation, data.source, row.position);
    const input = { source: data.source, position: row.position };
    const endpoint = readRecordedOpeningPointResult(row.endpoints, input, "theory.opening.current_endpoint@1");
    const membership = readRecordedOpeningPointResult(row.memberships, input, "theory.opening.catalogue_membership@1");
    return { pathIndex: row.pathIndex, node: row.node, edge: row.edge, position: encode(row.position),
      invocation: { position: invocation.positionInvocation, catalogue: invocation.lookup.catalogue.ref,
        endpointRow: invocation.lookup.endpointRow, membershipRow: invocation.lookup.membershipRow, result: invocation.lookup.result },
      endpoints: { authority: endpoint.authority, values: row.endpoints.map(encode) },
      memberships: { authority: membership.authority, values: row.memberships.map(encode) } };
  }) });
}
export type RecordedDeepestOpeningReached = Omit<Extract<DeepestOpeningReached, { kind: "matched" }>, "projectionId"> & {
  readonly projectionId: "derived.opening.deepest_reached@2";
};
function select(data: ReturnType<typeof readRecordedOpeningHistory>) {
  const visits = data.rows.flatMap(row => row.endpoints.flatMap(value => value.payload.kind === "matched"
    ? [{ nodeId: row.node.id, ply: row.node.ply, endpoint: value.payload }] : []));
  const previous = deriveDeepestOpeningVisits(visits, data.source.ref);
  if (previous.kind !== "matched") return Object.freeze([]);
  const deepest = previous.visits.find(visit => visit.endpoint === previous.deepest)!;
  const payload: RecordedDeepestOpeningReached = freeze({ ...previous, projectionId: "derived.opening.deepest_reached@2" });
  return Object.freeze([freeze({ nodeId: deepest.nodeId, plyOffset: deepest.ply, payload })]);
}
/** Same predecessor selection semantics, over the complete genuine source only. */
export function deepestRecordedOpeningVisits(history: RecordedOpeningHistorySource) {
  return select(readRecordedOpeningHistory(history));
}

interface OpeningProof extends EvidenceReductionItemsMintImage { readonly history: RecordedOpeningHistorySource; readonly plan: CompiledEvidenceExecutionPlan }
const proofs = new WeakSet<object>();
function inputs(history: RecordedOpeningHistorySource, plan: CompiledEvidenceExecutionPlan) {
  if (plan.kind !== "reduction" || key(plan.projection) !== route || key(plan.operation) !== key(contract.operation)) throw new TypeError("Opening history requires its exact genuine reduction plan");
  executionPlanDigest(plan);
  const data = readRecordedOpeningHistory(history), image = recordedOpeningHistoryImage(history);
  const occurrences: EvidenceReductionReceipt["occurrences"][number][] = [], values: DeclaredEvidence<unknown>[] = [], refs = [...directProjectionConventions(route)];
  const add = (value: DeclaredEvidence<unknown>, group: number, item: number, element: number, availability: "recorded" | "local", authority: unknown) => {
    const template = plan.elements[element]!.execution;
    if (template.kind !== "fixed" || key(template.execution.projection) !== key(value.projection)
      || template.execution.own.availability !== availability || template.execution.own.providerOperation !== null
      || template.execution.paths.length !== 1 || template.execution.paths[0]!.derivationChoices.length !== 0
      || evidenceDigest(template.execution.paths[0]!.sourceRequirements) !== evidenceDigest(availability === "local" ? [] : [{ occurrence: [], projection: value.projection, availability, providerOperation: null }])) throw new TypeError("Opening history occurrence crosses its exact leaf/template source");
    const witness: ConcreteEvidenceExecutionWitness = freeze({ kind: "leaf", value: identity(value), source: { availability, providerOperation: null, authorityDigest: evidenceDigest(authority) } });
    values.push(value); refs.push(...(evidenceValueReceipt(value).convention?.refs ?? []));
    occurrences.push(freeze({ group, item, element, witness }));
  };
  for (const [index, row] of data.rows.entries()) {
    add(row.position, index, 0, 0, "recorded", { authority: image.authority, row: image.rows[index] });
    for (const endpoint of row.endpoints) add(endpoint, index, 1, 1, "local", image.rows[index]!.endpoints.authority);
    // Both actual point lookups ran even if neither emitted a value. Eligible unexecuted refs add nothing.
    refs.push(...directProjectionConventions("theory.opening.current_endpoint@1"), ...directProjectionConventions("theory.opening.catalogue_membership@1"));
    for (const membership of row.memberships) refs.push(...(evidenceValueReceipt(membership).convention?.refs ?? []));
  }
  return { data, image, occurrences: Object.freeze(occurrences), values, refs };
}
const outputIdentity = (outputs: EvidenceReductionItemsMintImage["outputs"]) => outputs.map(({ producer, projection, payloadDigest }) => ({ producer, projection, payloadDigest }));

/** Sole factory computation; no caller operation, visits, selection or validator callback. */
export function computeOpeningHistoryReduction(history: RecordedOpeningHistorySource) {
  const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, contract.projection), source = inputs(history, plan);
  const selected = select(source.data), projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === route)!;
  const outputs = freeze(selected.map(value => ({ nodeId: value.nodeId, plyOffset: value.plyOffset, producer: projection.producer, projection: contract.projection, payloadDigest: evidenceDigest(value.payload) })));
  const receipt = freeze({ operation: contract.operation, projection: contract.projection, planDigest: executionPlanDigest(plan), sourceImageDigest: evidenceDigest(source.image), occurrences: source.occurrences, outputDigest: evidenceDigest(outputIdentity(outputs)) });
  const convention = conventionReceipt(source.refs, { kind: "reduction", operation: contract.operation, reductionDigest: `sha256:${evidenceDigest(receipt)}`,
    inputs: source.values.map(value => ({ projection: key(value.projection), valueDigest: `sha256:${evidenceDigest(identity(value))}` })) });
  const inputDigest = evidenceDigest({ operation: receipt.operation, planDigest: receipt.planDigest, sourceImageDigest: receipt.sourceImageDigest, occurrences: receipt.occurrences });
  const proof: OpeningProof = Object.freeze({ resultKind: "items", history, plan, receipt, convention, inputDigest, outputs }); proofs.add(proof);
  return Object.freeze({ proof, authority: sealOwnedOpeningHistoryReductionProof(proof, manifest => assertOpeningHistoryReductionProof(proof, manifest)), selected });
}
export function assertOpeningHistoryReductionProof(proof: OpeningProof, manifest?: CompiledEvidenceManifest): void {
  if (!proofs.has(proof)) throw new TypeError("Opening computation proof was not issued by its exact source operation");
  const source = inputs(proof.history, proof.plan);
  if (executionPlanDigest(proof.plan) !== proof.receipt.planDigest || evidenceDigest(source.image) !== proof.receipt.sourceImageDigest
    || evidenceDigest(source.occurrences) !== evidenceDigest(proof.receipt.occurrences) || evidenceDigest(outputIdentity(proof.outputs)) !== proof.receipt.outputDigest) throw new TypeError("Opening history source/concrete execution/output authority changed");
  if (manifest !== undefined && executionPlanDigest(compileProjectionExecutionV2(manifest, contract.projection)) !== proof.receipt.planDigest) throw new TypeError("Opening receipt differs from consumer manifest's genuine V2 plan");
}
/** Original complete array before iteration, then the exact requested source identity. */
export function readOpeningHistoryReductionResult(result: readonly ReductionResultItem[], history: RecordedOpeningHistorySource) {
  const proof = evidenceReductionResultProof(result);
  if (!proofs.has(proof) || (proof as OpeningProof).history !== history) throw new TypeError("Opening result crosses its original history/operation");
  if (key(proof.receipt.operation) !== key(contract.operation) || key(proof.receipt.projection) !== route
    || evidenceDigest(recordedOpeningHistoryImage(history)) !== proof.receipt.sourceImageDigest) throw new TypeError("Opening result crosses its complete recorded source");
  return Object.freeze({ reduction: proof.receipt, convention: proof.convention });
}
