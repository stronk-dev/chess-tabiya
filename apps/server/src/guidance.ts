import {
  classifyPhase,
  declareEvidence,
  endgameReading,
  evidenceForConsumer,
  matchesStructuralExpression,
  pivotalMarkers,
  renderEndgameReading,
  renderPhaseReading,
  renderPivotalMarker,
  renderRecordedReading,
  renderEvidenceItems,
  structuralReading,
  voiceCheck,
  type DrillRun,
  type EvidencePacket,
  type DeclaredEvidence,
  type CompiledEvidenceManifest,
  type Node,
  type PositionEvidenceIndex,
  type RenderedEvidenceView,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition, PackPhase } from "@chess-tabiya/schema/drill-pack";

import type { AuthoredFeedbackPage } from "./authored-feedback.js";
import { recordedReadingsAt } from "./position-evidence.js";
import type { ShapeRegistry } from "./shape-registry.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
export type VoiceScope = "marker" | "reading" | "steering" | "story" | "compare";
export interface VoiceEvidenceView {
  readonly scope: VoiceScope;
  readonly rendered: RenderedEvidenceView;
}
export interface VoiceProvider { render(view: VoiceEvidenceView, persona: string, deterministicText: string, scope: VoiceScope): Promise<string>; }

const producerRef = (id: string) => ({ id, version: 1 } as const);
const projectionRef = (id: string) => ({ id, version: 1 } as const);

interface SentencePayload { readonly sentence: string }
const sentencePayload = (value: unknown): readonly string[] => Object.freeze([(value as SentencePayload).sentence]);
const RENDERERS = Object.freeze({
  "rules.phase.reading@1": (evidence: DeclaredEvidence<unknown>) => Object.freeze([renderPhaseReading(evidence.payload as ReturnType<typeof classifyPhase>)]),
  "pack.authored.phase@1": (evidence: DeclaredEvidence<unknown>) => Object.freeze([`This pack declares: ${String(evidence.payload)}.`]),
  "rules.structural.reading.named_structure@1": (evidence: DeclaredEvidence<unknown>) => { const item = evidence.payload as { readonly name: string; readonly provenanceNote: string }; return Object.freeze([`Detected structure: ${item.name}. ${item.provenanceNote}`]); },
  "rules.pivotal.marker@1": (evidence: DeclaredEvidence<unknown>) => renderPivotalMarker(evidence.payload as Parameters<typeof renderPivotalMarker>[0]),
  "rules.endgame.reading@1": (evidence: DeclaredEvidence<unknown>) => renderEndgameReading(evidence.payload as Parameters<typeof renderEndgameReading>[0]),
  "pack.authored.claim@1": (evidence: DeclaredEvidence<unknown>) => { const item = evidence.payload as { readonly text: string; readonly attribution: string }; return Object.freeze([`${item.text} (${item.attribution})`]); },
  "theory.shapes.firing@1": (evidence: DeclaredEvidence<unknown>) => { const item = evidence.payload as { readonly id: string }; return Object.freeze([`Shape ${item.id} begins here under its recorded catalogue trigger.`]); },
  "run.record.fork@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "run.record.move@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "run.record.checkpoint_hit@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "run.record.objective_transition@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "run.record.consequence@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "run.record.imported_result@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "derived.compare.structure_delta@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "derived.compare.eval_delta@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "derived.story.eval_shift@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "derived.story.last_level@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
  "derived.story.title@1": (evidence: DeclaredEvidence<unknown>) => sentencePayload(evidence.payload),
});

export function renderedEvidenceItems(manifest: CompiledEvidenceManifest, consumerId: string, declared: readonly DeclaredEvidence<unknown>[]): RenderedEvidenceView {
  const admitted = evidenceForConsumer(manifest, { id: consumerId, version: 1 }, declared);
  const renderers = consumerId === "guidance.voice_compare" ? Object.freeze({ ...RENDERERS, "rules.pivotal.marker@1": (evidence: DeclaredEvidence<unknown>) => Object.freeze([`${renderPivotalMarker(evidence.payload as Parameters<typeof renderPivotalMarker>[0]).join(" ")} Source: Tabiya product convention.`]) }) : RENDERERS;
  return renderEvidenceItems(admitted, renderers);
}

function consumerForScope(scope: VoiceScope): string {
  return scope === "compare" ? "guidance.voice_compare" : scope === "story" ? "guidance.voice_story" : "guidance.voice";
}

export function voiceEvidenceView(packet: EvidencePacket, scope: VoiceScope = "reading", extra: readonly DeclaredEvidence<unknown>[] = [], includePacket = true): VoiceEvidenceView {
  const declared = Object.freeze([...(includePacket ? packet.declared : []), ...extra]);
  return Object.freeze({ scope, rendered: renderedEvidenceItems(EVIDENCE_MANIFEST, consumerForScope(scope), declared) });
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
  const declared = Object.freeze([
    declareEvidence(producerRef("rules.phase"), projectionRef("rules.phase.reading"), detected),
    ...(input.pack === undefined ? [] : [declareEvidence(producerRef("pack.authored"), projectionRef("pack.authored.phase"), input.pack.phase)]),
    ...reading.structures.map((item) => declareEvidence(producerRef("rules.structural"), projectionRef("rules.structural.reading.named_structure"), item)),
    ...reading.features.filter((item) => item.kind !== "pawn_count").map((item) => declareEvidence(producerRef("rules.structural"), projectionRef(`rules.structural.reading.${item.kind}`), item)),
    ...markers.map((item) => declareEvidence(producerRef("rules.pivotal"), projectionRef("rules.pivotal.marker"), item)),
    ...(endgame === null ? [] : [declareEvidence(producerRef("rules.endgame"), projectionRef("rules.endgame.reading"), endgame)]),
    ...plans.map((item) => declareEvidence(producerRef("theory.shapes"), projectionRef("theory.shapes.firing"), item)),
    ...authored.map((item) => declareEvidence(producerRef("pack.authored"), projectionRef("pack.authored.claim"), item)),
    ...readings.map((item) => declareEvidence(producerRef(item.kind === "engine_eval" ? "recorded.engine" : "recorded.tablebase"), projectionRef(item.kind === "engine_eval" ? "recorded.engine.eval" : "recorded.tablebase.result"), item)),
  ]);
  return Object.freeze({ fen: input.node.fen, phase: Object.freeze(phase), structures: reading.structures, observations: reading.features, markers: Object.freeze(markers), endgame, plans: Object.freeze(plans), authored: Object.freeze(authored), readings, declared });
}

export function appendRecordedReadings(text: string, packet: EvidencePacket): string {
  const rendered = packet.readings.flatMap(renderRecordedReading).join("\n");
  if (rendered === "") return text;
  return text === "" ? rendered : `${text}\n${rendered}`;
}

export async function renderVoice(provider: VoiceProvider, packet: EvidencePacket, persona: string, scope: VoiceScope = "reading", extra: readonly DeclaredEvidence<unknown>[] = [], includePacket = true): Promise<{ readonly text: string; readonly source: "provider" | "deterministic" }> {
  const view = voiceEvidenceView(packet, scope, extra, includePacket);
  const deterministic = view.rendered.items.flatMap((item) => item.sentences).join("\n");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = await provider.render(view, persona, deterministic, scope);
      if (voiceCheck(view.rendered, output).valid) return Object.freeze({ text: appendRecordedReadings(output, packet), source: "provider" });
    } catch {
      // Provider failures share the same one-retry then deterministic fallback path.
    }
  }
  return Object.freeze({ text: appendRecordedReadings(deterministic, packet), source: "deterministic" });
}
