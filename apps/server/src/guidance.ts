import {
  classifyPhase,
  assertConsumerEvidenceView,
  endgameClassification,
  evidenceForConsumer,
  matchesStructuralExpression,
  pivotalMarkers,
  positionGuidanceEvidence,
  renderRecordedReading,
  renderPresentedEvidenceView,
  structuralReading,
  voiceCheck,
  type DrillRun,
  type EvidencePacket,
  type DeclaredEvidence,
  type CompiledEvidenceManifest,
  type Node,
  type PositionEvidenceIndex,
  type RenderedEvidenceView,
  type ConsumerEvidenceView,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition, PackPhase } from "@chess-tabiya/schema/drill-pack";

import type { AuthoredFeedbackPage } from "./authored-feedback.js";
import { recordedReadingsAt } from "./position-evidence.js";
import type { ShapeRegistry } from "./shape-registry.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
export type VoiceScope = "marker" | "reading" | "steering" | "story" | "compare" | "hint";
export interface VoiceEvidenceView {
  readonly scope: VoiceScope;
  readonly rendered: RenderedEvidenceView;
}
export interface VoiceProvider { render(view: VoiceEvidenceView, persona: string, deterministicText: string, scope: VoiceScope, signal?: AbortSignal): Promise<string>; }

/** The compiled consumer budget both voice attempts and the deterministic fallback share (§5). */
export const VOICE_OPERATION_BUDGET_MS = 4_000;

export function renderedEvidenceItems(manifest: CompiledEvidenceManifest, consumerId: string, declared: readonly DeclaredEvidence<unknown>[]): RenderedEvidenceView {
  const admitted = evidenceForConsumer(manifest, { id: consumerId, version: 1 }, declared);
  return renderPresentedEvidenceView(admitted);
}

function consumerForScope(scope: VoiceScope): string {
  return scope === "compare" ? "guidance.voice_compare" : scope === "story" ? "guidance.voice_story" : "guidance.voice";
}

export function voiceEvidenceView(packet: EvidencePacket, scope: VoiceScope = "reading", extra: readonly DeclaredEvidence<unknown>[] = [], includePacket = true): VoiceEvidenceView {
  const declared = Object.freeze([...(includePacket ? packet.declared : []), ...extra]);
  return Object.freeze({ scope, rendered: renderedEvidenceItems(EVIDENCE_MANIFEST, consumerForScope(scope), declared) });
}

export function evidencePacket(input: { readonly run: DrillRun; readonly node: Node; readonly pack?: DrillPackDefinition; readonly packEvidence?: PositionEvidenceIndex; readonly authored: AuthoredFeedbackPage; readonly shapes?: ShapeRegistry }): EvidencePacket {
  const reading = structuralReading(input.node.fen);
  const detected = classifyPhase(input.node.fen);
  const phase = input.pack === undefined ? { source: "detector" as const, value: detected.phase } : { source: "author" as const, value: input.pack.phase as PackPhase };
  const markers = pivotalMarkers(input.run, input.node.branchId).filter((marker) => marker.nodeId === input.node.id);
  const endgame = endgameClassification(input.node.fen);
  const shapeRecords = input.shapes === undefined ? [] : input.shapes.list().map((summary) => input.shapes!.get(summary.id)!);
  const plans = shapeRecords.flatMap((record) => matchesStructuralExpression(input.node.fen, record.document.trigger) ? [{ id: record.document.id, name: record.document.name, attribution: `${record.channel}:${record.document.provenance.licence}` }] : []);
  const recorded = recordedReadingsAt(input.packEvidence, input.node, input.run);
  // Every sealed item is minted by its runtime factory from authority inputs, never a payload here.
  const declared = positionGuidanceEvidence({
    run: input.run,
    node: input.node,
    ...(input.pack === undefined ? {} : { pack: input.pack }),
    shapes: shapeRecords.map((record) => ({ id: record.document.id, trigger: record.document.trigger })),
    authored: input.authored.items,
    recorded,
  });
  const authored = declared.filter((item) => item.projection.id === "pack.authored.claim").map((item) => item.payload as { readonly id: string; readonly text: string; readonly attribution: string });
  return Object.freeze({ fen: input.node.fen, phase: Object.freeze(phase), structures: reading.structures, observations: reading.features, markers: Object.freeze(markers), endgame, plans: Object.freeze(plans), authored: Object.freeze(authored), readings: Object.freeze(recorded.map((item) => item.payload)), declared });
}

export function renderRecordedReadingEvidence(view: ConsumerEvidenceView<unknown>): readonly string[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "guidance.recorded_reading" || view.consumer.version !== 1) {
    throw new TypeError("Expected guidance.recorded_reading@1 consumer view");
  }
  // The recorded-reading sentence retains the authoring date. The current magnitude component
  // does not; keep this separately admitted, post-provider path until its component contract
  // can carry the date without silently weakening source attribution.
  return Object.freeze(view.items.flatMap((item) => renderRecordedReading(item.payload as Parameters<typeof renderRecordedReading>[0])));
}

export function appendRecordedReadings(text: string, packet: EvidencePacket): string {
  const view = evidenceForConsumer(EVIDENCE_MANIFEST, { id: "guidance.recorded_reading", version: 1 }, packet.declared);
  const rendered = renderRecordedReadingEvidence(view).join("\n");
  if (rendered === "") return text;
  return text === "" ? rendered : `${text}\n${rendered}`;
}

export async function renderVoice(provider: VoiceProvider, packet: EvidencePacket, persona: string, scope: VoiceScope = "reading", extra: readonly DeclaredEvidence<unknown>[] = [], includePacket = true, budgetMs = VOICE_OPERATION_BUDGET_MS): Promise<{ readonly text: string; readonly source: "provider" | "deterministic" }> {
  const view = voiceEvidenceView(packet, scope, extra, includePacket);
  const deterministic = view.rendered.items.flatMap((item) => item.sentences).join("\n");
  // One total deadline covers both attempts (rfc/provider-health-degradation.md §5): the second
  // attempt inherits what the first left and never starts a fresh timeout.
  const deadline = AbortSignal.timeout(Math.max(1, budgetMs));
  for (let attempt = 0; attempt < 2 && !deadline.aborted; attempt += 1) {
    try {
      const output = await provider.render(view, persona, deterministic, scope, deadline);
      if (voiceCheck(view.rendered, output).valid) return Object.freeze({ text: appendRecordedReadings(output, packet), source: "provider" });
    } catch {
      // A provider failure opens its circuit; the next attempt is refused at once, so the
      // deterministic fallback below is reached inside the same budget.
    }
  }
  return Object.freeze({ text: appendRecordedReadings(deterministic, packet), source: "deterministic" });
}
