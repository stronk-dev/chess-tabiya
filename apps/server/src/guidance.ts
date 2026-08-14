import {
  classifyPhase,
  endgameReading,
  matchesStructuralExpression,
  pivotalMarkers,
  renderEndgameReading,
  renderPhaseReading,
  renderPivotalMarker,
  structuralReading,
  voiceCheck,
  type DrillRun,
  type EvidencePacket,
  type Node,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition, PackPhase } from "@chess-tabiya/schema/drill-pack";

import type { AuthoredFeedbackPage } from "./authored-feedback.js";
import type { ShapeRegistry } from "./shape-registry.js";

export interface VoiceProvider { render(packet: EvidencePacket, persona: string, deterministicText: string): Promise<string>; }

function authoredText(item: AuthoredFeedbackPage["items"][number]): string | undefined {
  if (item.kind === "annotation") return item.text;
  if (item.kind === "deviation") return item.note;
  if (item.kind === "plan_class") return item.description ?? item.label;
  return undefined;
}

export function evidencePacket(input: { readonly run: DrillRun; readonly node: Node; readonly pack?: DrillPackDefinition; readonly authored: AuthoredFeedbackPage; readonly shapes?: ShapeRegistry }): EvidencePacket {
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
  const sentences = [input.pack === undefined ? renderPhaseReading(detected) : `This pack declares: ${input.pack.phase}.`, ...reading.structures.map((item) => `Detected structure: ${item.name}. ${item.provenanceNote}`), ...markers.flatMap(renderPivotalMarker), ...renderEndgameReading(endgame), ...authored.map((item) => `${item.text} (${item.attribution})`)];
  return Object.freeze({ fen: input.node.fen, phase: Object.freeze(phase), structures: reading.structures, observations: reading.features, markers: Object.freeze(markers), endgame, plans: Object.freeze(plans), authored: Object.freeze(authored), sentences: Object.freeze(sentences) });
}

export async function renderVoice(provider: VoiceProvider, packet: EvidencePacket, persona: string): Promise<{ readonly text: string; readonly source: "provider" | "deterministic" }> {
  const deterministic = packet.sentences.join("\n");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const output = await provider.render(packet, persona, deterministic);
    if (voiceCheck(packet, output).valid) return Object.freeze({ text: output, source: "provider" });
  }
  return Object.freeze({ text: deterministic, source: "deterministic" });
}
