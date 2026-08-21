import {
  classifyPhase,
  declareEvidence,
  endgameReading,
  matchesStructuralExpression,
  pivotalMarkers,
  renderEndgameReading,
  renderPhaseReading,
  renderPivotalMarker,
  renderRecordedReading,
  structuralReading,
  voiceCheck,
  type DrillRun,
  type EvidencePacket,
  type DeclaredEvidence,
  type Node,
  type PositionEvidenceIndex,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition, PackPhase } from "@chess-tabiya/schema/drill-pack";

import type { AuthoredFeedbackPage } from "./authored-feedback.js";
import { recordedReadingsAt } from "./position-evidence.js";
import type { ShapeRegistry } from "./shape-registry.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
import { evidenceForConsumer } from "@chess-tabiya/runtime";

export type VoiceScope = "marker" | "reading" | "steering" | "story" | "compare" | "reasoning";
export interface VoiceEvidenceView {
  readonly consumer: { readonly id: "guidance.voice"; readonly version: 1 };
  readonly evidence: readonly DeclaredEvidence<unknown>[];
  readonly sentences: readonly string[];
}
export interface VoiceProvider { render(view: VoiceEvidenceView, persona: string, deterministicText: string, scope: VoiceScope): Promise<string>; }

const producerRef = (id: string) => ({ id, version: 1 } as const);
const projectionRef = (id: string) => ({ id, version: 1 } as const);

export function voiceEvidenceView(packet: EvidencePacket): VoiceEvidenceView {
  const declared = packet.declared ?? [declareEvidence(producerRef("rules.phase"), projectionRef("rules.phase.reading"), packet.phase)];
  return Object.freeze({
    consumer: Object.freeze({ id: "guidance.voice", version: 1 as const }),
    evidence: evidenceForConsumer(EVIDENCE_MANIFEST, { id: "guidance.voice", version: 1 }, declared),
    sentences: packet.sentences,
  });
}

function authoredText(item: AuthoredFeedbackPage["items"][number]): string | undefined {
  if (item.kind === "annotation") return item.text;
  if (item.kind === "deviation") return item.note;
  if (item.kind === "plan_class") return item.description ?? item.label;
  return undefined;
}

export function evidencePacket(input: { readonly run: DrillRun; readonly node: Node; readonly pack?: DrillPackDefinition; readonly packEvidence?: PositionEvidenceIndex; readonly authored: AuthoredFeedbackPage; readonly shapes?: ShapeRegistry }): EvidencePacket {
  const reading = structuralReading(input.node.fen);
  const detected = classifyPhase(input.node.fen);
  const phase = input.pack === undefined ? { source: "detector" as const, value: detected.phase } : { source: "author" as const, value: input.pack.phase as PackPhase };
  const markers = pivotalMarkers(input.run, input.node.branchId).filter((marker) => marker.nodeId === input.node.id);
  const endgame = endgameReading(input.node.fen);
  const plans = input.shapes === undefined ? [] : input.shapes.list().flatMap((summary) => {
    const record = input.shapes!.get(summary.id)!;
    return matchesStructuralExpression(input.node.fen, record.document.trigger) ? [{ id: record.document.id, name: record.document.name, attribution: `${record.channel}:${record.document.provenance.licence}` }] : [];
  });
  const authored = input.authored.items.flatMap((item) => {
    const text = authoredText(item);
    return text === undefined ? [] : [{ id: item.id, text, attribution: `authored:${item.revealedBy.kind}:${item.revealedBy.eventSeq}` }];
  });
  const readings = recordedReadingsAt(input.packEvidence, input.node, input.run);
  const sentences = [input.pack === undefined ? renderPhaseReading(detected) : `This pack declares: ${input.pack.phase}.`, ...reading.structures.map((item) => `Detected structure: ${item.name}. ${item.provenanceNote}`), ...markers.flatMap(renderPivotalMarker), ...renderEndgameReading(endgame), ...authored.map((item) => `${item.text} (${item.attribution})`)];
  const declared = Object.freeze([
    declareEvidence(producerRef("rules.phase"), projectionRef("rules.phase.reading"), phase),
    ...reading.structures.map((item) => declareEvidence(producerRef("rules.structural"), projectionRef("rules.structural.reading.named_structure"), item)),
    ...reading.features.filter((item) => item.kind !== "pawn_count").map((item) => declareEvidence(producerRef("rules.structural"), projectionRef(`rules.structural.reading.${item.kind}`), item)),
    ...markers.map((item) => declareEvidence(producerRef("rules.pivotal"), projectionRef("rules.pivotal.marker"), item)),
    ...(endgame === null ? [] : [declareEvidence(producerRef("rules.endgame"), projectionRef("rules.endgame.reading"), endgame)]),
    ...plans.map((item) => declareEvidence(producerRef("theory.shapes"), projectionRef("theory.shapes.firing"), item)),
    ...authored.map((item) => declareEvidence(producerRef("pack.authored"), projectionRef("pack.authored.claim"), item)),
    ...readings.map((item) => declareEvidence(producerRef(item.kind === "engine_eval" ? "recorded.engine" : "recorded.tablebase"), projectionRef(item.kind === "engine_eval" ? "recorded.engine.eval" : "recorded.tablebase.result"), item)),
  ]);
  return Object.freeze({ fen: input.node.fen, phase: Object.freeze(phase), structures: reading.structures, observations: reading.features, markers: Object.freeze(markers), endgame, plans: Object.freeze(plans), authored: Object.freeze(authored), readings, sentences: Object.freeze(sentences), declared });
}

export function appendRecordedReadings(text: string, packet: EvidencePacket): string {
  const rendered = packet.readings.flatMap(renderRecordedReading).join("\n");
  if (rendered === "") return text;
  return text === "" ? rendered : `${text}\n${rendered}`;
}

export async function renderVoice(provider: VoiceProvider, packet: EvidencePacket, persona: string, scope: VoiceScope = "reading"): Promise<{ readonly text: string; readonly source: "provider" | "deterministic" }> {
  const deterministic = packet.sentences.join("\n");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = await provider.render(voiceEvidenceView(packet), persona, deterministic, scope);
      if (voiceCheck(packet, output).valid) return Object.freeze({ text: appendRecordedReadings(output, packet), source: "provider" });
    } catch {
      // Provider failures share the same one-retry then deterministic fallback path.
    }
  }
  return Object.freeze({ text: appendRecordedReadings(deterministic, packet), source: "deterministic" });
}
