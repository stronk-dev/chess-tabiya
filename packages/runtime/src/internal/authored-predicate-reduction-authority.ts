import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { evidenceDigest, evidenceValueReceipt, type CompiledEvidenceManifest, type DeclaredEvidence } from "../evidence-contract.js";
import { compileProjectionExecutionV2, executionPlanDigest, type CompiledEvidenceExecutionPlan } from "../evidence-execution-v2.js";
import { AUTHORED_PREDICATE_REDUCTION_CONTRACT as contract } from "../evidence-reduction-contract.js";
import type { ConcreteEvidenceExecutionWitness, EvidenceReductionReceipt, EvidenceReductionSingleMintImage, ReductionValueIdentity } from "../evidence-reduction-types.js";
import { directProjectionConventions } from "../evidence-convention-closure.js";
import { conventionReceipt } from "../evidence-conventions.js";
import { readAuthoredPredicatePopulation, type AuthoredPredicatePopulation, type AuthoredPredicateObservation } from "../authored-predicate-population.js";
import { readAuthoredStructuralInput, readLocalReadingInvocation, readStructuralPredicateInvocation } from "./evidence-value-routes.js";
import { evidenceReductionSingleProof, sealOwnedAuthoredPredicateReductionProof } from "./evidence-reduction-seal.js";
import { isImmutableOwnData } from "./immutable-data.js";

const key = (ref: { readonly id: string; readonly version: number }) => `${ref.id}@${ref.version}`;
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

function inputs(source: AuthoredPredicatePopulation, plan: CompiledEvidenceExecutionPlan) {
  if (plan.kind !== "reduction" || key(plan.projection) !== route || key(plan.operation) !== key(contract.operation)) throw new TypeError("Authored predicate requires its genuine exact reduction plan");
  executionPlanDigest(plan);
  const data = readAuthoredPredicatePopulation(source);
  const occurrences: EvidenceReductionReceipt["occurrences"][number][] = [], values: DeclaredEvidence<unknown>[] = [];
  const images: unknown[] = [], refs = [...directProjectionConventions(route)];
  const add = (value: DeclaredEvidence<unknown>, path: string, authority: unknown) => {
    const element = plan.elements.findIndex(row => key(row.projection) === key(value.projection)), template = plan.elements[element]?.execution;
    if (template?.kind !== "fixed" || template.execution.own.providerOperation !== null
      || template.execution.paths.length !== 1 || template.execution.paths[0]!.derivationChoices.length !== 0) throw new TypeError("Authored predicate occurrence crosses its closed leaf/template binding");
    const availability = template.execution.own.availability;
    if (availability !== "local" && !(element === 0 && availability === "recorded")) throw new TypeError("Authored predicate has an undeclared external source");
    const requirements = availability === "local" ? [] : [{ occurrence: [], projection: value.projection, availability, providerOperation: null }];
    if (evidenceDigest(template.execution.paths[0]!.sourceRequirements) !== evidenceDigest(requirements)) throw new TypeError("Authored predicate source requirements differ from its exact template");
    const witness: ConcreteEvidenceExecutionWitness = freeze({ kind: "leaf", value: identity(value), source: { availability, providerOperation: null, authorityDigest: evidenceDigest(authority) } });
    occurrences.push(freeze({ group: 0, item: occurrences.length, element, witness }));
    images.push(freeze({ path, value: encode(value), authority })); values.push(value);
    refs.push(...(evidenceValueReceipt(value).convention?.refs ?? []));
  };
  readAuthoredStructuralInput(data.condition);
  add(data.condition, "authored", data.condition.payload);
  add(data.position, "root", readLocalReadingInvocation(data.position));
  const paths = new Set<string>();
  for (const occurrence of data.leaves) {
    if (paths.has(occurrence.path)) throw new TypeError("Authored predicate duplicates an evaluated path");
    paths.add(occurrence.path);
    const invocation = readStructuralPredicateInvocation(occurrence.value);
    add(occurrence.value, occurrence.path, freeze({ fen: invocation.fen, feature: invocation.feature, sources: invocation.sources.map(encode) }));
  }
  const image = freeze({ observation: data.observation, inputs: images });
  return { data, image, values, refs, occurrences: Object.freeze(occurrences) };
}
interface AuthoredProof extends EvidenceReductionSingleMintImage {
  readonly source: AuthoredPredicatePopulation; readonly plan: CompiledEvidenceExecutionPlan;
  readonly payload: Readonly<{ observation: AuthoredPredicateObservation }>;
}
const PROOFS = new WeakSet<object>();
const VERIFIED_IMMUTABLE_INPUTS = new WeakMap<object, ReturnType<typeof readAuthoredPredicatePopulation>>();
export function computeAuthoredPredicateReduction(source: AuthoredPredicatePopulation) {
  const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, contract.projection), input = inputs(source, plan);
  const payload = Object.freeze({ observation: input.data.observation });
  const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === route)!;
  const output = freeze({ producer: projection.producer, projection: contract.projection, payloadDigest: evidenceDigest(payload) });
  const receipt = freeze({ operation: contract.operation, projection: contract.projection, planDigest: executionPlanDigest(plan), sourceImageDigest: evidenceDigest(input.image), occurrences: input.occurrences, outputDigest: output.payloadDigest });
  const convention = conventionReceipt(input.refs, { kind: "reduction", operation: contract.operation, reductionDigest: `sha256:${evidenceDigest(receipt)}`,
    inputs: input.values.map(value => ({ projection: key(value.projection), valueDigest: `sha256:${evidenceDigest(identity(value))}` })) });
  const inputDigest = evidenceDigest({ operation: receipt.operation, planDigest: receipt.planDigest, sourceImageDigest: receipt.sourceImageDigest, occurrences: receipt.occurrences });
  const proof: AuthoredProof = Object.freeze({ resultKind: "single", source, plan, payload, output, receipt, convention, inputDigest }); PROOFS.add(proof);
  return Object.freeze({ proof, payload, authority: sealOwnedAuthoredPredicateReductionProof(proof, manifest => assertAuthoredPredicateReductionProof(proof, manifest)) });
}
function assertAuthoredPredicateReductionProof(proof: AuthoredProof, manifest?: CompiledEvidenceManifest): void {
  if (!PROOFS.has(proof)) throw new TypeError("Authored reduction lacks its original operation proof");
  // Original source/leaf membership and registered-record currentness are live checks, even
  // after the immutable byte image has been fully verified. Neither source nor access is cached.
  const data = readAuthoredPredicatePopulation(proof.source), verified = VERIFIED_IMMUTABLE_INPUTS.get(proof);
  if (executionPlanDigest(proof.plan) !== proof.receipt.planDigest
    || proof.output.payloadDigest !== proof.receipt.outputDigest) throw new TypeError("Authored predicate source/AST/occurrence/output proof changed");
  if (verified !== undefined) {
    if (data !== verified) throw new TypeError("Authored predicate population changed after immutable verification");
  } else {
    const input = inputs(proof.source, proof.plan);
    if (input.data !== data || evidenceDigest(input.image) !== proof.receipt.sourceImageDigest
      || evidenceDigest(input.occurrences) !== evidenceDigest(proof.receipt.occurrences) || evidenceDigest(proof.payload) !== proof.receipt.outputDigest) throw new TypeError("Authored predicate source/AST/occurrence/output proof changed");
    if (isImmutableOwnData(proof) && isImmutableOwnData(data) && isImmutableOwnData(input.image)) VERIFIED_IMMUTABLE_INPUTS.set(proof, data);
  }
  if (manifest !== undefined && executionPlanDigest(compileProjectionExecutionV2(manifest, contract.projection)) !== proof.receipt.planDigest) throw new TypeError("Authored predicate differs from the consumer's genuine plan");
}
export function readAuthoredPredicateReductionValue(value: DeclaredEvidence<unknown>, source: AuthoredPredicatePopulation) {
  const proof = evidenceReductionSingleProof(value);
  if (!PROOFS.has(proof) || (proof as AuthoredProof).source !== source) throw new TypeError("Authored predicate result crosses its original evaluated source");
  return Object.freeze({ reduction: proof.receipt, convention: proof.convention });
}
