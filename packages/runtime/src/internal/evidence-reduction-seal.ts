// Dependency-free, closed-operation value/result seals. Only the sole factory may initiate/publish; only the core
// mint may join values. Operation-created proof validation is retained, never registered globally.
import type { CompiledEvidenceManifest, DeclaredEvidence, EvidenceValueReceipt } from "../evidence-contract.js";
import type { EvidenceReductionMintImage, ReductionResultItem } from "../evidence-reduction-types.js";
export type { EvidenceReductionReceipt } from "../evidence-reduction-types.js";
declare const brand: unique symbol;
export interface EvidenceReductionAuthority { readonly [brand]: true }
declare const proofBrand: unique symbol;
export interface OwnedEvidenceReductionProof { readonly [proofBrand]: true }
interface Data {
  readonly proof: EvidenceReductionMintImage; readonly validate: (manifest?: CompiledEvidenceManifest) => void;
  readonly binding: Binding;
  readonly values: Map<number, Readonly<{ value: DeclaredEvidence<unknown>; receipt: EvidenceValueReceipt }>>;
  result?: readonly ReductionResultItem[];
}
const authorities = new WeakMap<object, Data>(), values = new WeakMap<object, { authority: EvidenceReductionAuthority; ordinal: number }>(), results = new WeakMap<object, EvidenceReductionAuthority>();
type Binding = Readonly<{ operation: "compare.structure_delta" | "story.last_level"; projection: "derived.compare.structure_delta" | "derived.story.last_level"; factory: string }>;
const operationProofs = new WeakMap<object, Readonly<{ proof: EvidenceReductionMintImage; validate: (manifest?: CompiledEvidenceManifest) => void; binding: Binding }>>();
function seal(proof: EvidenceReductionMintImage, validate: (manifest?: CompiledEvidenceManifest) => void, binding: Binding): OwnedEvidenceReductionProof {
  if (proof.receipt.operation.id !== binding.operation || proof.receipt.operation.version !== 1
    || proof.receipt.projection.id !== binding.projection || proof.receipt.projection.version !== 2
    || proof.outputs.some(output => output.projection.id !== binding.projection || output.projection.version !== 2)) throw new TypeError("Reduction proof crosses its exact operation binding");
  validate();
  const authority = Object.freeze({}) as OwnedEvidenceReductionProof;
  operationProofs.set(authority, Object.freeze({ proof, validate, binding })); return authority;
}
/** Issued only by the exact owned comparison computation module, not callers or the factory. */
export function sealOwnedComparisonReductionProof(proof: EvidenceReductionMintImage, validate: (manifest?: CompiledEvidenceManifest) => void): OwnedEvidenceReductionProof {
  return seal(proof, validate, Object.freeze({ operation: "compare.structure_delta", projection: "derived.compare.structure_delta", factory: "createDerivedCompareStructureDeltaV2Evidence" }));
}
/** Issued only by the exact owned last-level computation module. */
export function sealOwnedLastLevelReductionProof(proof: EvidenceReductionMintImage, validate: (manifest?: CompiledEvidenceManifest) => void): OwnedEvidenceReductionProof {
  return seal(proof, validate, Object.freeze({ operation: "story.last_level", projection: "derived.story.last_level", factory: "createDerivedStoryLastLevelV2Evidence" }));
}
function read(authority: EvidenceReductionAuthority) {
  const data = authorities.get(authority);
  if (data === undefined) throw new TypeError("Reduction seal was not issued by the sole mint");
  return data;
}
/** Static authority gate restricts this exact operation's initiation to its sole factory. */
export function initiateEvidenceReduction(source: OwnedEvidenceReductionProof): EvidenceReductionAuthority {
  const issued = operationProofs.get(source);
  if (issued === undefined) throw new TypeError("Reduction proof is not original privately issued operation authority");
  const { proof, validate, binding } = issued; validate();
  const authority = Object.freeze({}) as EvidenceReductionAuthority;
  authorities.set(authority, { proof, validate, binding, values: new Map() }); return authority;
}
export function evidenceReductionMintReceipt(authority: EvidenceReductionAuthority) {
  const data = read(authority);
  if (data.result !== undefined) throw new TypeError("Published reductions cannot mint more values");
  return data.proof;
}
/** Raw receipt join: no recursive root evidenceValueReceipt during atomic construction. */
export function joinEvidenceReductionValue(authority: EvidenceReductionAuthority, ordinal: number, value: DeclaredEvidence<unknown>, receipt: EvidenceValueReceipt): void {
  const data = read(authority), proof = data.proof, expected = proof.outputs[ordinal];
  if (data.result !== undefined || data.values.has(ordinal) || expected === undefined || receipt.reduction !== proof.receipt || receipt.convention !== proof.convention
    || receipt.inputDigest !== proof.inputDigest || receipt.factory !== data.binding.factory
    || value.projection.id !== expected.projection.id || value.projection.version !== expected.projection.version
    || value.producer.id !== expected.producer.id || value.producer.version !== expected.producer.version
    || receipt.payloadDigest !== expected.payloadDigest || receipt.sourceDigests.length !== 0) throw new TypeError("Reduction value is not its computed output ordinal");
  data.values.set(ordinal, Object.freeze({ value, receipt })); values.set(value, { authority, ordinal });
}
export function publishEvidenceReduction(authority: EvidenceReductionAuthority, result: readonly ReductionResultItem[]): void {
  const data = read(authority), proof = data.proof;
  if (data.result !== undefined || !Object.isFrozen(result) || result.length !== proof.outputs.length || data.values.size !== result.length) throw new TypeError("Reduction result is incomplete or already published");
  for (const [ordinal, item] of result.entries()) {
    const expected = proof.outputs[ordinal]!;
    if (!Object.isFrozen(item) || Object.keys(item).sort().join() !== "evidence,nodeId,plyOffset" || item.evidence !== data.values.get(ordinal)?.value || item.nodeId !== expected.nodeId || item.plyOffset !== expected.plyOffset) throw new TypeError("Reduction result crosses output ordinal/location");
  }
  data.validate(); data.result = result; results.set(result, authority);
}
export function assertEvidenceReductionValue(value: DeclaredEvidence<unknown>, receipt: EvidenceValueReceipt): void {
  const issued = values.get(value);
  if (issued === undefined) throw new TypeError("Reduction value lacks authentic construction proof");
  const data = read(issued.authority);
  if (data.result === undefined || data.values.get(issued.ordinal)?.receipt !== receipt || receipt.reduction !== data.proof.receipt || data.result[issued.ordinal]?.evidence !== value) throw new TypeError("Reduction value/receipt/result join differs or is unpublished");
  data.validate();
}
/** Consumer admission also validates its actual manifest's plan, not merely matching ref strings. */
export function assertEvidenceReductionConsumerManifest(value: DeclaredEvidence<unknown>, manifest: CompiledEvidenceManifest): void {
  const issued = values.get(value);
  if (issued === undefined) throw new TypeError("Reduction consumer lacks original value authority");
  const data = read(issued.authority);
  if (data.result === undefined) throw new TypeError("Reduction is not published");
  data.validate(manifest);
}
/** Validate original array before any iteration. The source owner separately checks logical scope. */
export function evidenceReductionResultProof(result: readonly ReductionResultItem[]): EvidenceReductionMintImage {
  const authority = results.get(result);
  if (authority === undefined) throw new TypeError("Reduction result is not the complete original authenticated array");
  const data = read(authority);
  if (data.result !== result) throw new TypeError("Reduction result membership differs");
  data.validate(); return data.proof;
}
