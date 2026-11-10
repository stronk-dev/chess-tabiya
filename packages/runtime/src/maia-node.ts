/** Internal requested-node values. Complete source ancestry is not a public answer operand. */
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { EvidenceAvailability } from "./evidence-factories.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { MaiaInferenceTaskResult, ProviderEvidenceDelivery } from "./provider-types.js";
import type { RecordedPosition } from "./review-points.js";
import type { ResolvedRunSubject, RunEventHeadDigest } from "./run-subject.js";
import type { SelectionEngineIdentity } from "./types.js";
import { assertResolvedRunSubject } from "./run-subject.js";
import { invokeRunRecordPosition } from "./evidence-operations.js";

export interface MaiaNodeInputs {
  readonly task: DeclaredEvidence<ProviderEvidenceDelivery<MaiaInferenceTaskResult, "maia.inference_task@1">>;
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly resolved: ResolvedRunSubject;
}
interface MaiaNodeMetadata {
  readonly task: MaiaNodeInputs["task"];
  readonly position: MaiaNodeInputs["position"];
  readonly nodeId: string;
  readonly engine: SelectionEngineIdentity;
  readonly requestedBand: number;
  readonly appliedBand: number;
}
export interface MaiaNodeDistribution extends MaiaNodeMetadata {
  readonly branchId: string;
  readonly eventHeadDigest: RunEventHeadDigest;
  readonly coverage: "bounded_reported_window";
  readonly candidates: readonly Readonly<{ moveUci: string; rank: number; mass: number | null }>[];
}
export interface MaiaNodeCandidateWdl extends MaiaNodeMetadata {
  readonly candidates: readonly Readonly<{ moveUci: string; rank: number; wdl: NonNullable<MaiaInferenceTaskResult["candidates"][number]["wdl"]> }>[];
}

export function deriveMaiaNodeDistribution(inputs: MaiaNodeInputs): DeclaredEvidence<MaiaNodeDistribution> {
  return invokeEvidenceValueRoute("derived.maia.node_distribution@1", inputs);
}
/** The resolver owns the selected prefix; callers cannot supply a bare position payload. */
export function maiaNodeInputsFromSubject(task: MaiaNodeInputs["task"], resolved: ResolvedRunSubject): MaiaNodeInputs {
  assertResolvedRunSubject(resolved);
  if (resolved.subject.kind !== "run_node") throw new TypeError("Maia node input requires a resolved node");
  return Object.freeze({ task, position: invokeRunRecordPosition(resolved.run, resolved.subject.nodeId), resolved });
}
export function deriveMaiaNodeCandidateWdl(inputs: MaiaNodeInputs): EvidenceAvailability<DeclaredEvidence<MaiaNodeCandidateWdl>> {
  return invokeEvidenceValueRoute("derived.maia.node_candidate_wdl@1", inputs);
}
