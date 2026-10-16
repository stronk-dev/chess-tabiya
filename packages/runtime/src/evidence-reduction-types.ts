// Neutral data only: the core/oracle static closure must not import source owners or factories.
import type { AvailabilityMode, DeclaredEvidence, VersionedEvidenceId } from "./evidence-contract.js";
import type { ProviderOperationId } from "./provider-types.js";
import type { ConventionReceipt } from "./evidence-conventions.js";
export interface ReductionValueIdentity {
  readonly producer: VersionedEvidenceId; readonly projection: VersionedEvidenceId; readonly factory: string;
  readonly inputDigest: string; readonly payloadDigest: string; readonly sourceDigests: readonly string[];
  readonly conventionDigest: string | null; readonly reductionDigest: string | null;
}
export type ConcreteEvidenceExecutionWitness =
  | Readonly<{ kind: "leaf"; value: ReductionValueIdentity;
      source: Readonly<{ availability: AvailabilityMode; providerOperation: ProviderOperationId | null; authorityDigest: string }> }>
  | Readonly<{ kind: "member"; value: ReductionValueIdentity; member: number; inputs: readonly ConcreteEvidenceExecutionWitness[] }>
  | Readonly<{ kind: "reduction"; value: ReductionValueIdentity; operation: VersionedEvidenceId; reductionDigest: string }>;
export interface EvidenceReductionReceipt {
  readonly operation: VersionedEvidenceId; readonly projection: VersionedEvidenceId; readonly planDigest: string; readonly sourceImageDigest: string;
  readonly occurrences: readonly Readonly<{ group: number; item: number; element: number; witness: ConcreteEvidenceExecutionWitness }>[];
  readonly outputDigest: string;
}
export interface EvidenceReductionMintImage {
  readonly receipt: EvidenceReductionReceipt; readonly convention: ConventionReceipt; readonly inputDigest: string;
  readonly outputs: readonly Readonly<{ nodeId: string; plyOffset: number; producer: VersionedEvidenceId; projection: VersionedEvidenceId; payloadDigest: string }>[];
}
export interface ReductionResultItem { readonly evidence: DeclaredEvidence<unknown>; readonly nodeId: string; readonly plyOffset: number }
