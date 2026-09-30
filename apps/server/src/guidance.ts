import {
  assertConsumerEvidenceView,
  invokeRunRecordPosition,
  evidenceForConsumer,
  matchesStructuralExpression,
  pivotalMarkers,
  positionGuidanceEvidence,
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
import { compilePhaseSourcePoint, compileRecordedEvidenceSnapshot, type PhaseSourceDependencies } from "./phase-source-composition.js";
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

/** The unconfigured default: no opening catalogue artifact and no pack evidence snapshot. */
const DEFAULT_PHASE_SOURCES: PhaseSourceDependencies = Object.freeze({ opening: Object.freeze({ kind: "unavailable" as const, reason: "artifact_missing" as const }), recorded: compileRecordedEvidenceSnapshot({ kind: "no_pack_source" }) });

/**
 * Support module assembly (rfc/phase-source-composition.md §5): the current position's phase,
 * opening, endgame and tablebase sources come from one compiled `PhaseSourcePoint`; this operation
 * performs no ad-hoc phase/endgame join of its own.
 */
export function evidencePacket(input: { readonly run: DrillRun; readonly node: Node; readonly pack?: DrillPackDefinition; readonly packEvidence?: PositionEvidenceIndex; readonly authored: AuthoredFeedbackPage; readonly shapes?: ShapeRegistry; readonly phaseSources?: PhaseSourceDependencies }): EvidencePacket {
  const point = compilePhaseSourcePoint(invokeRunRecordPosition(input.run, input.node.id), input.phaseSources ?? DEFAULT_PHASE_SOURCES);
  const reading = structuralReading(input.node.fen);
  const detected = point.rulesPhase.payload;
  const phase = input.pack === undefined ? { source: "detector" as const, value: detected.phase } : { source: "author" as const, value: input.pack.phase as PackPhase };
  const markers = pivotalMarkers(input.run, input.node.branchId).filter((marker) => marker.nodeId === input.node.id);
  const endgame = point.rulesEndgame.kind === "classified" ? point.rulesEndgame.item.payload : null;
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
    phaseSources: { phase: point.rulesPhase, endgame: point.rulesEndgame.kind === "classified" ? [point.rulesEndgame.item] : [] },
  });
  const authored = declared.filter((item) => item.projection.id === "pack.authored.claim").map((item) => item.payload as { readonly id: string; readonly text: string; readonly attribution: string });
  return Object.freeze({ fen: input.node.fen, phase: Object.freeze(phase), structures: reading.structures, observations: reading.features, markers: Object.freeze(markers), endgame, plans: Object.freeze(plans), authored: Object.freeze(authored), readings: Object.freeze(recorded.map((item) => item.payload)), declared });
}

export function renderRecordedReadingEvidence(view: ConsumerEvidenceView<unknown>): readonly string[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "guidance.recorded_reading" || view.consumer.version !== 1) {
    throw new TypeError("Expected guidance.recorded_reading@1 consumer view");
  }
  // Readings stay post-provider: the external voice never receives a bare engine score. Their
  // suffix now uses the same source-bound component equivalent as the learner presentation.
  return Object.freeze(renderPresentedEvidenceView(view).items.flatMap((item) => item.sentences));
}

function recordedReadingSentences(packet: EvidencePacket): readonly string[] {
  const view = evidenceForConsumer(EVIDENCE_MANIFEST, { id: "guidance.recorded_reading", version: 1 }, packet.declared);
  return renderRecordedReadingEvidence(view);
}

function appendReadingSentences(text: string, sentences: readonly string[]): string {
  const rendered = sentences.join("\n");
  if (rendered === "") return text;
  return text === "" ? rendered : `${text}\n${rendered}`;
}

export function appendRecordedReadings(text: string, packet: EvidencePacket): string {
  return appendReadingSentences(text, recordedReadingSentences(packet));
}

export async function renderVoice(provider: VoiceProvider, packet: EvidencePacket, persona: string, scope: VoiceScope = "reading", extra: readonly DeclaredEvidence<unknown>[] = [], includePacket = true, budgetMs = VOICE_OPERATION_BUDGET_MS): Promise<{ readonly text: string; readonly source: "provider" | "deterministic"; readonly recordedReadingsPresent: boolean }> {
  const view = voiceEvidenceView(packet, scope, extra, includePacket);
  const deterministic = view.rendered.items.flatMap((item) => item.sentences).join("\n");
  const readingSentences = recordedReadingSentences(packet);
  const recordedReadingsPresent = readingSentences.length > 0;
  // One total deadline covers both attempts (rfc/provider-health-degradation.md §5): the second
  // attempt inherits what the first left and never starts a fresh timeout.
  const deadline = AbortSignal.timeout(Math.max(1, budgetMs));
  for (let attempt = 0; attempt < 2 && !deadline.aborted; attempt += 1) {
    try {
      const output = await provider.render(view, persona, deterministic, scope, deadline);
      if (voiceCheck(view.rendered, output).valid) return Object.freeze({ text: appendReadingSentences(output, readingSentences), source: "provider", recordedReadingsPresent });
    } catch {
      // A provider failure opens its circuit; the next attempt is refused at once, so the
      // deterministic fallback below is reached inside the same budget.
    }
  }
  return Object.freeze({ text: appendReadingSentences(deterministic, readingSentences), source: "deterministic", recordedReadingsPresent });
}
