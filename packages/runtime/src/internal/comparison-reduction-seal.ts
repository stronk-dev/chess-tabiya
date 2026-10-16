// Dependency-free value/result seals. Only the sole factory may initiate/publish; only the core
// mint may join values. Operation-created proof validation is retained, never registered globally.
import type { CompiledEvidenceManifest, DeclaredEvidence, EvidenceValueReceipt } from "../evidence-contract.js";
import type { ComparisonReductionMintImage, ReductionResultItem } from "../evidence-reduction-types.js";
export type { EvidenceReductionReceipt } from "../evidence-reduction-types.js";
declare const brand: unique symbol;
export interface ComparisonReductionAuthority { readonly [brand]: true }
declare const proofBrand: unique symbol;
export interface OwnedComparisonReductionProof { readonly [proofBrand]: true }
interface Data {
  readonly proof: ComparisonReductionMintImage; readonly validate: (manifest?: CompiledEvidenceManifest) => void;
  readonly values: Map<number, Readonly<{ value: DeclaredEvidence<unknown>; receipt: EvidenceValueReceipt }>>;
  result?: readonly ReductionResultItem[];
}
const authorities = new WeakMap<object, Data>(), values = new WeakMap<object, { authority: ComparisonReductionAuthority; ordinal: number }>(), results = new WeakMap<object, ComparisonReductionAuthority>();
const operationProofs = new WeakMap<object, Readonly<{ proof: ComparisonReductionMintImage; validate: (manifest?: CompiledEvidenceManifest) => void }>>();
/** Issued only by the exact owned comparison computation module, not callers or the factory. */
export function sealOwnedComparisonReductionProof(proof: ComparisonReductionMintImage, validate: (manifest?: CompiledEvidenceManifest) => void): OwnedComparisonReductionProof {
  validate();
  const authority = Object.freeze({}) as OwnedComparisonReductionProof;
  operationProofs.set(authority, Object.freeze({ proof, validate })); return authority;
}
function read(authority: ComparisonReductionAuthority) {
  const data = authorities.get(authority);
  if (data === undefined) throw new TypeError("Comparison reduction seal was not issued by the sole mint");
  return data;
}
/** Static authority gate restricts this exact operation's initiation to its sole factory. */
export function initiateComparisonReduction(source: OwnedComparisonReductionProof): ComparisonReductionAuthority {
  const issued = operationProofs.get(source);
  if (issued === undefined) throw new TypeError("Reduction proof is not original privately issued operation authority");
  const { proof, validate } = issued; validate();
  const authority = Object.freeze({}) as ComparisonReductionAuthority;
  authorities.set(authority, { proof, validate, values: new Map() }); return authority;
}
export function comparisonReductionMintReceipt(authority: ComparisonReductionAuthority) {
  const data = read(authority);
  if (data.result !== undefined) throw new TypeError("Published comparison reductions cannot mint more values");
  return data.proof;
}
/** Raw receipt join: no recursive root evidenceValueReceipt during atomic construction. */
export function joinComparisonReductionValue(authority: ComparisonReductionAuthority, ordinal: number, value: DeclaredEvidence<unknown>, receipt: EvidenceValueReceipt): void {
  const data = read(authority), proof = data.proof, expected = proof.outputs[ordinal];
  if (data.result !== undefined || data.values.has(ordinal) || expected === undefined || receipt.reduction !== proof.receipt || receipt.convention !== proof.convention
    || receipt.inputDigest !== proof.inputDigest || receipt.factory !== "createDerivedCompareStructureDeltaV2Evidence"
    || value.projection.id !== expected.projection.id || value.projection.version !== expected.projection.version
    || value.producer.id !== expected.producer.id || value.producer.version !== expected.producer.version
    || receipt.payloadDigest !== expected.payloadDigest || receipt.sourceDigests.length !== 0) throw new TypeError("Reduction value is not its computed output ordinal");
  data.values.set(ordinal, Object.freeze({ value, receipt })); values.set(value, { authority, ordinal });
}
export function publishComparisonReduction(authority: ComparisonReductionAuthority, result: readonly ReductionResultItem[]): void {
  const data = read(authority), proof = data.proof;
  if (data.result !== undefined || !Object.isFrozen(result) || result.length !== proof.outputs.length || data.values.size !== result.length) throw new TypeError("Reduction result is incomplete or already published");
  for (const [ordinal, item] of result.entries()) {
    const expected = proof.outputs[ordinal]!;
    if (!Object.isFrozen(item) || Object.keys(item).sort().join() !== "evidence,nodeId,plyOffset" || item.evidence !== data.values.get(ordinal)?.value || item.nodeId !== expected.nodeId || item.plyOffset !== expected.plyOffset) throw new TypeError("Reduction result crosses output ordinal/location");
  }
  data.validate(); data.result = result; results.set(result, authority);
}
export function assertComparisonReductionValue(value: DeclaredEvidence<unknown>, receipt: EvidenceValueReceipt): void {
  const issued = values.get(value);
  if (issued === undefined) throw new TypeError("Comparison reduction value lacks authentic construction proof");
  const data = read(issued.authority);
  if (data.result === undefined || data.values.get(issued.ordinal)?.receipt !== receipt || receipt.reduction !== data.proof.receipt || data.result[issued.ordinal]?.evidence !== value) throw new TypeError("Comparison reduction value/receipt/result join differs or is unpublished");
  data.validate();
}
/** Consumer admission also validates its actual manifest's plan, not merely matching ref strings. */
export function assertComparisonReductionConsumerManifest(value: DeclaredEvidence<unknown>, manifest: CompiledEvidenceManifest): void {
  const issued = values.get(value);
  if (issued === undefined) throw new TypeError("Comparison reduction consumer lacks original value authority");
  const data = read(issued.authority);
  if (data.result === undefined) throw new TypeError("Comparison reduction is not published");
  data.validate(manifest);
}
/** Validate original array before any iteration. The source owner separately checks logical scope. */
export function comparisonReductionResultProof(result: readonly ReductionResultItem[]): ComparisonReductionMintImage {
  const authority = results.get(result);
  if (authority === undefined) throw new TypeError("Comparison result is not the complete original authenticated array");
  const data = read(authority);
  if (data.result !== result) throw new TypeError("Comparison result membership differs");
  data.validate(); return data.proof;
}
