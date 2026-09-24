import {
  assertConsumerEvidenceView,
  candidateCollectorIds,
  candidateFeatureVectorEvidence,
  evidenceForConsumer,
  type CandidateFeatureInput,
  type CandidateFeatureVector,
  type ConsumerEvidenceView,
  type SelectionEngineIdentity,
} from "@chess-tabiya/runtime";

import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";

export type { CandidateCollectorResult, CandidateFeatureInput, CandidateFeatureRow, CandidateFeatureVector } from "@chess-tabiya/runtime";

// The declared tactical/breadth inventory intersected with the packet's code-derived local closure
// (rfc/shared-candidate-evidence-packet.md §8.2): the provider-only `human.maia.candidate_wdl` is
// not a local collector result and can no longer pass this guard.
export const CANDIDATE_COLLECTOR_IDS: ReadonlySet<string> = candidateCollectorIds();

export function consumeCandidateFeatureVector(view: ConsumerEvidenceView<CandidateFeatureVector>): CandidateFeatureVector {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "opponent.selection" || view.consumer.version !== 1 || view.items.length !== 1) {
    throw new TypeError("Expected one derived candidate feature vector admitted to opponent.selection@1");
  }
  return view.items[0]!.payload;
}

/**
 * Re-runs the registered tactical/breadth collectors on hypothetical legal children through the
 * runtime `derived.opponent.candidate_feature_vector@1` factory (rfc/evidence-value-authority.md).
 * The server supplies only authority inputs: the root FEN, the fixed-bound engine identity and the
 * candidate moves with their bounded scores. It adds no chess detector and emits no prose, grade,
 * salience, or trait claim.
 */
export function candidateFeatureVector(input: {
  readonly beforeFen: string;
  readonly engine: SelectionEngineIdentity;
  readonly candidates: readonly CandidateFeatureInput[];
}): CandidateFeatureVector {
  return consumeCandidateFeatureVector(evidenceForConsumer(
    EVIDENCE_MANIFEST,
    { id: "opponent.selection", version: 1 },
    [candidateFeatureVectorEvidence(input)],
  ));
}
