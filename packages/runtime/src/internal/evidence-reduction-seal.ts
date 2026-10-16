// Dependency-free, closed-operation value/result seals. Only the sole factory may initiate/publish; only the core
// mint may join values. Operation-created proof validation is retained, never registered globally.
import type { CompiledEvidenceManifest, DeclaredEvidence, EvidenceValueReceipt } from "../evidence-contract.js";
import type { EvidenceReductionMintImage, EvidenceReductionItemsMintImage, EvidenceReductionSingleMintImage, ReductionResultItem } from "../evidence-reduction-types.js";
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
  singleResult?: DeclaredEvidence<unknown>;
}
const authorities = new WeakMap<object, Data>(), values = new WeakMap<object, { authority: EvidenceReductionAuthority; ordinal: number }>(), results = new WeakMap<object, EvidenceReductionAuthority>();
type Binding = Readonly<{ operation: "compare.structure_delta" | "story.last_level" | "story.rank";
  projection: "derived.compare.structure_delta" | "derived.story.last_level" | "derived.story.rank";
  version: 2 | 3; resultKind: "items" | "single"; factory: string }>;
const operationProofs = new WeakMap<object, Readonly<{ proof: EvidenceReductionMintImage; validate: (manifest?: CompiledEvidenceManifest) => void; binding: Binding }>>();
function seal(proof: EvidenceReductionMintImage, validate: (manifest?: CompiledEvidenceManifest) => void, binding: Binding): OwnedEvidenceReductionProof {
  if (proof.receipt.operation.id !== binding.operation || proof.receipt.operation.version !== 1
    || proof.receipt.projection.id !== binding.projection || proof.receipt.projection.version !== binding.version || proof.resultKind !== binding.resultKind
    || (proof.resultKind === "items" ? proof.outputs : [proof.output]).some(output => output.projection.id !== binding.projection || output.projection.version !== binding.version)) throw new TypeError("Reduction proof crosses its exact operation binding");
  validate();
  const authority = Object.freeze({}) as OwnedEvidenceReductionProof;
  operationProofs.set(authority, Object.freeze({ proof, validate, binding })); return authority;
}
/** Issued only by the exact owned comparison computation module, not callers or the factory. */
export function sealOwnedComparisonReductionProof(proof: EvidenceReductionItemsMintImage, validate: (manifest?: CompiledEvidenceManifest) => void): OwnedEvidenceReductionProof {
  return seal(proof, validate, Object.freeze({ operation: "compare.structure_delta", projection: "derived.compare.structure_delta", version: 2, resultKind: "items", factory: "createDerivedCompareStructureDeltaV2Evidence" }));
}
/** Issued only by the exact owned last-level computation module. */
export function sealOwnedLastLevelReductionProof(proof: EvidenceReductionItemsMintImage, validate: (manifest?: CompiledEvidenceManifest) => void): OwnedEvidenceReductionProof {
  return seal(proof, validate, Object.freeze({ operation: "story.last_level", projection: "derived.story.last_level", version: 2, resultKind: "items", factory: "createDerivedStoryLastLevelV2Evidence" }));
}
export function sealOwnedStoryRankReductionProof(proof: EvidenceReductionSingleMintImage, validate: (manifest?: CompiledEvidenceManifest) => void): OwnedEvidenceReductionProof {
  return seal(proof, validate, Object.freeze({ operation: "story.rank", projection: "derived.story.rank", version: 3, resultKind: "single", factory: "createDerivedStoryRankV3Evidence" }));
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
  if (data.result !== undefined || data.singleResult !== undefined) throw new TypeError("Published reductions cannot mint more values");
  return data.proof;
}
/** Raw receipt join: no recursive root evidenceValueReceipt during atomic construction. */
export function joinEvidenceReductionValue(authority: EvidenceReductionAuthority, ordinal: number, value: DeclaredEvidence<unknown>, receipt: EvidenceValueReceipt): void {
  const data = read(authority), proof = data.proof, expected = proof.resultKind === "items" ? proof.outputs[ordinal] : ordinal === 0 ? proof.output : undefined;
  if (data.result !== undefined || data.singleResult !== undefined || data.values.has(ordinal) || expected === undefined || receipt.reduction !== proof.receipt || receipt.convention !== proof.convention
    || receipt.inputDigest !== proof.inputDigest || receipt.factory !== data.binding.factory
    || value.projection.id !== expected.projection.id || value.projection.version !== expected.projection.version
    || value.producer.id !== expected.producer.id || value.producer.version !== expected.producer.version
    || receipt.payloadDigest !== expected.payloadDigest || receipt.sourceDigests.length !== 0) throw new TypeError("Reduction value is not its computed output ordinal");
  data.values.set(ordinal, Object.freeze({ value, receipt })); values.set(value, { authority, ordinal });
}
export function publishEvidenceReduction(authority: EvidenceReductionAuthority, result: readonly ReductionResultItem[]): void {
  const data = read(authority), proof = data.proof;
  if (proof.resultKind !== "items" || data.binding.resultKind !== "items" || data.result !== undefined || data.singleResult !== undefined || !Object.isFrozen(result) || result.length !== proof.outputs.length || data.values.size !== result.length) throw new TypeError("Reduction result is incomplete or already published");
  for (const [ordinal, item] of result.entries()) {
    const expected = proof.outputs[ordinal]!;
    if (!Object.isFrozen(item) || Object.keys(item).sort().join() !== "evidence,nodeId,plyOffset" || item.evidence !== data.values.get(ordinal)?.value || item.nodeId !== expected.nodeId || item.plyOffset !== expected.plyOffset) throw new TypeError("Reduction result crosses output ordinal/location");
  }
  data.validate(); data.result = result; results.set(result, authority);
}
/** Exact rank single publication: no fabricated item array or node/ply location. */
export function publishSingleEvidenceReduction(authority: EvidenceReductionAuthority, value: DeclaredEvidence<unknown>): void {
  const data = read(authority);
  if (data.binding.operation !== "story.rank" || data.binding.resultKind !== "single" || data.proof.resultKind !== "single"
    || data.result !== undefined || data.singleResult !== undefined || data.values.size !== 1 || data.values.get(0)?.value !== value) throw new TypeError("Single reduction result is incomplete, crossed or already published");
  data.validate(); data.singleResult = value;
}
export function assertEvidenceReductionValue(value: DeclaredEvidence<unknown>, receipt: EvidenceValueReceipt): void {
  const issued = values.get(value);
  if (issued === undefined) throw new TypeError("Reduction value lacks authentic construction proof");
  const data = read(issued.authority);
  const published = data.proof.resultKind === "items" ? data.result?.[issued.ordinal]?.evidence : issued.ordinal === 0 ? data.singleResult : undefined;
  if (published !== value || data.values.get(issued.ordinal)?.receipt !== receipt || receipt.reduction !== data.proof.receipt) throw new TypeError("Reduction value/receipt/result join differs or is unpublished");
  data.validate();
}
/** Consumer admission also validates its actual manifest's plan, not merely matching ref strings. */
export function assertEvidenceReductionConsumerManifest(value: DeclaredEvidence<unknown>, manifest: CompiledEvidenceManifest): void {
  const issued = values.get(value);
  if (issued === undefined) throw new TypeError("Reduction consumer lacks original value authority");
  const data = read(issued.authority);
  if (data.result === undefined && data.singleResult === undefined) throw new TypeError("Reduction is not published");
  data.validate(manifest);
}
/** Validate original array before any iteration. The source owner separately checks logical scope. */
export function evidenceReductionResultProof(result: readonly ReductionResultItem[]): EvidenceReductionItemsMintImage {
  const authority = results.get(result);
  if (authority === undefined) throw new TypeError("Reduction result is not the complete original authenticated array");
  const data = read(authority);
  if (data.result !== result || data.proof.resultKind !== "items") throw new TypeError("Reduction result membership differs");
  data.validate(); return data.proof;
}
export function evidenceReductionSingleProof(value: DeclaredEvidence<unknown>): EvidenceReductionSingleMintImage {
  const issued = values.get(value);
  if (issued === undefined) throw new TypeError("Single reduction value lacks original mint authority");
  const data = read(issued.authority);
  if (issued.ordinal !== 0 || data.proof.resultKind !== "single" || data.singleResult !== value || data.values.get(0)?.value !== value) throw new TypeError("Single reduction value is crossed or unpublished");
  data.validate(); return data.proof;
}
