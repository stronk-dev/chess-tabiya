import type { ReasoningDetection, ReasoningTranscript } from "@chess-tabiya/runtime";

import type { ReasoningKeyPointView } from "./api.js";

export interface VerifiedReasoningProposal {
  readonly keyPointId: string;
  readonly quotation: string;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined;
}

export function verifiedReasoningProposals(
  value: unknown,
  transcript: ReasoningTranscript,
  keyPoints: readonly ReasoningKeyPointView[],
  detections: readonly ReasoningDetection[],
): readonly VerifiedReasoningProposal[] {
  const page = record(value);
  if (page?.provider !== "external" || !Array.isArray(page.proposals)) throw new TypeError("Invalid reasoning review response");
  const points = new Set(keyPoints.map((point) => point.id));
  const statuses = new Map(detections.map((detection) => [detection.keyPointId, detection.status]));
  const fields = [...transcript.candidates, transcript.plan, transcript.fears];
  const seen = new Set<string>();
  const verified: VerifiedReasoningProposal[] = [];
  for (const valueProposal of page.proposals) {
    const proposal = record(valueProposal);
    const keyPointId = proposal?.keyPointId;
    const quotation = proposal?.quotation;
    if (proposal === undefined
      || typeof keyPointId !== "string"
      || !points.has(keyPointId)
      || statuses.get(keyPointId) !== "not_detected"
      || seen.has(keyPointId)
      || typeof quotation !== "string"
      || quotation.length === 0
      || quotation.length > 240
      || !fields.some((field) => field.includes(quotation))) throw new TypeError("Invalid reasoning review response");
    seen.add(keyPointId);
    verified.push(Object.freeze({ keyPointId, quotation }));
  }
  return Object.freeze(verified);
}

export function reasoningProposalSentence(proposal: VerifiedReasoningProposal, pointLabel: string): string {
  return `Possible mention, proposed by the configured language model and not a detection: you wrote “${proposal.quotation}” — the author's point “${pointLabel}”.`;
}
