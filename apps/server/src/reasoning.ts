import type { DrillPackDefinition, ReasoningKeyPoint } from "@chess-tabiya/schema/drill-pack";
import { deriveSegments, normalizeReasoningText, type DrillRun, type ReasoningDetection, type ReasoningRecordedEvent, type ReasoningTranscript } from "@chess-tabiya/runtime";

import type { PackRecord } from "./pack-registry.js";
import type { ShapeRegistry } from "./shape-registry.js";

export const REASONING_HONESTY = `Matching is literal: "not detected" means these exact words were not found in what you wrote — not that the idea was absent, and never that it was wrong.`;
export const NO_PREVIOUS_REASONING = "No earlier attempt has stated reasoning at this checkpoint.";
export const SKIPPED_REASONING = "You chose to see the author's points without stating your reasoning first.";

export interface ReasoningKeyPointView {
  readonly id: string;
  readonly label: string;
  readonly ground: ReasoningKeyPoint["ground"];
  readonly attribution: string;
}
export interface ReasoningOccurrenceView {
  readonly eventSeq: number;
  readonly checkpointEventSeq: number;
  readonly branchId: string;
  readonly skipped: boolean;
  readonly transcript: ReasoningTranscript | null;
  readonly detections?: readonly ReasoningDetection[];
  readonly keyPoints?: readonly ReasoningKeyPointView[];
}
export interface ReasoningPreviousView {
  readonly runId: string;
  readonly eventSeq: number;
  readonly skipped: boolean;
  readonly transcript: ReasoningTranscript | null;
  readonly detections: readonly ReasoningDetection[];
}
export interface ReasoningPage {
  readonly checkpointId: string;
  readonly occurrences: readonly ReasoningOccurrenceView[];
  readonly previous: ReasoningPreviousView | null;
  readonly absenceSentence: typeof NO_PREVIOUS_REASONING;
  readonly honestySentence: typeof REASONING_HONESTY;
}

function spineNode(pack: DrillPackDefinition, id: string): import("@chess-tabiya/schema/drill-pack").SpineNode | undefined {
  const visit = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[]): import("@chess-tabiya/schema/drill-pack").SpineNode | undefined => {
    for (const node of nodes) { if (node.id === id) return node; const found = visit(node.children); if (found !== undefined) return found; }
    return undefined;
  };
  return visit(pack.spine ?? []);
}

export function keyPointViews(pack: PackRecord, checkpointId: string, shapes?: ShapeRegistry): readonly ReasoningKeyPointView[] {
  const checkpoint = pack.document.checkpoints.find((candidate) => candidate.id === checkpointId);
  if (checkpoint?.interaction?.type !== "stated_reasoning") return Object.freeze([]);
  return Object.freeze(checkpoint.interaction.keyPoints.map((point) => {
    const ground = point.ground;
    let attribution: string;
    if (ground.kind === "structural") attribution = "Tabiya current-position structural detector; the expression is recomputed at this checkpoint.";
    else if (ground.kind === "shape_plan") {
      const entry = shapes?.get(ground.shape);
      const plan = entry?.document.plans.find((candidate) => candidate.id === ground.plan);
      attribution = entry === undefined || plan === undefined
        ? `Unresolved shape plan ${ground.shape}/${ground.plan}.`
        : `${entry.document.name}: ${plan.label}. ${entry.channel}:${entry.document.provenance.licence}.`;
    } else if (ground.kind === "spine_move") attribution = `The author's line plays ${spineNode(pack.document, ground.spineNodeId)?.moveSan ?? ground.spineNodeId}.`;
    else {
      const claim = pack.document.feedbackClaims?.find((candidate) => candidate.id === ground.claimId);
      attribution = claim === undefined ? `Unresolved authored claim ${ground.claimId}.` : `Author-declared claim (${claim.evidenceTypes.join(", ")}): ${claim.text}`;
    }
    return Object.freeze({ id: point.id, label: point.label, ground, attribution });
  }));
}

export function reasoningDeliveryOpen(run: DrillRun, checkpointEventSeq: number): boolean {
  if (run.feedbackPolicy === "delayed_checkpoint" || run.feedbackPolicy === "immediate_guard") return true;
  if (run.feedbackPolicy === "attempt_end") return run.events.some((event) => event.type === "feedback.revealed" || event.type === "outcome.reached");
  return deriveSegments(run).some((segment) => segment.startSeq <= checkpointEventSeq && segment.endSeq >= checkpointEventSeq);
}

export function reasoningEvents(run: DrillRun, checkpointId: string): readonly ReasoningRecordedEvent[] {
  return Object.freeze(run.events.filter((event): event is ReasoningRecordedEvent => event.type === "reasoning.recorded" && event.data.checkpointId === checkpointId));
}

export function occurrenceView(run: DrillRun, pack: PackRecord, event: ReasoningRecordedEvent, shapes?: ShapeRegistry): ReasoningOccurrenceView {
  const node = run.nodes.find((candidate) => candidate.id === event.data.nodeId);
  const open = reasoningDeliveryOpen(run, event.data.checkpointEventSeq);
  return Object.freeze({
    eventSeq: event.seq,
    checkpointEventSeq: event.data.checkpointEventSeq,
    branchId: node?.branchId ?? "unknown",
    skipped: event.data.skipped,
    transcript: event.data.transcript,
    ...(open ? { detections: event.data.detections, keyPoints: keyPointViews(pack, event.data.checkpointId, shapes) } : {}),
  });
}

export function matchedText(transcript: ReasoningTranscript, detection: ReasoningDetection): string | undefined {
  if (detection.match === undefined) return undefined;
  const source = detection.match.field === "candidates" ? transcript.candidates[detection.match.index ?? -1] : transcript[detection.match.field];
  if (source === undefined) return undefined;
  return normalizeReasoningText(source).slice(detection.match.start, detection.match.end);
}

export interface ReasoningProposal { readonly keyPointId: string; readonly quotation: string }
export function reasoningMatchCheck(
  proposals: readonly ReasoningProposal[],
  transcript: ReasoningTranscript,
  keyPoints: readonly ReasoningKeyPoint[],
  detections: readonly ReasoningDetection[],
): readonly ReasoningProposal[] | undefined {
  const fields = [...transcript.candidates, transcript.plan, transcript.fears];
  const points = new Map(keyPoints.map((point) => [point.id, point]));
  const statuses = new Map(detections.map((detection) => [detection.keyPointId, detection.status]));
  const seen = new Set<string>();
  const accepted: ReasoningProposal[] = [];
  for (const proposal of proposals) {
    if (seen.has(proposal.keyPointId) || proposal.quotation.length > 240 || proposal.quotation.length === 0) return undefined;
    seen.add(proposal.keyPointId);
    const point = points.get(proposal.keyPointId);
    if (point === undefined || statuses.get(proposal.keyPointId) !== "not_detected") return undefined;
    if (!fields.some((field) => field.includes(proposal.quotation))) return undefined;
    accepted.push(Object.freeze({ ...proposal }));
  }
  return Object.freeze(accepted);
}
