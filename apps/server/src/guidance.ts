import {
  classifyPhase,
  assertConsumerEvidenceView,
  declareAuthoredClaimEvidence,
  declareEndgameReadingEvidence,
  declareNamedStructureEvidence,
  declarePackPhaseEvidence,
  declarePhaseReadingEvidence,
  declarePivotalMarkerEvidence,
  declareRecordedEngineEvidence,
  declareRecordedTablebaseEvidence,
  declareShapeFiringSourceEvidence,
  declareStructuralReadingSourceEvidence,
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
  type ConsumerEvidenceView,
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

const one = (sentence: string): readonly string[] => Object.freeze([sentence]);
function renderRunRecord(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  if (evidence.projection.id === "run.record.fork") return one(`The recorded branches share ${String(payload.sharedPly)} plies through the fork.`);
  if (evidence.projection.id === "run.record.move") return one(payload.moveSan === null ? `Branch at offset ${String(payload.offset)} has no recorded move past the fork.` : `Branch at offset ${String(payload.offset)} begins with recorded move ${String(payload.moveSan)}.`);
  if (evidence.projection.id === "run.record.checkpoint_hit") return one(`Checkpoint ${String(payload.checkpointId)} was reached. Source: recorded checkpoint event.`);
  if (evidence.projection.id === "run.record.objective_transition") return one(`The recorded objective changed from ${String(payload.from)} to ${String(payload.to)}. Source: recorded objective event.`);
  if (evidence.projection.id === "run.record.imported_result") return one(`The PGN records the game result as ${String(payload.result)}; the board is not terminal here.`);
  if (payload.context === "story") return one(`Board-terminal result for the learner: ${String(payload.outcome)}.`);
  return one(payload.terminal === true ? `The recorded branch ends at a board-terminal position with learner result ${String(payload.outcome)}.` : `The recorded branch reaches ${String(payload.plies)} plies with objective state ${String(payload.objectiveState)}.`);
}
function renderCompareDerived(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  if (evidence.projection.id === "derived.compare.structure_delta") return one(`A recorded structural observation changed: ${String((payload.observation as { readonly kind?: unknown }).kind)}. Source: Tabiya structural detector.`);
  const delta = Number(payload.delta);
  return one(`Recorded engine evidence changed by ${delta >= 0 ? "+" : ""}${delta} cp at offset ${String(payload.plyOffset)}.`);
}
function renderStoryDerived(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  if (evidence.projection.id === "derived.story.last_level") return one("The last recorded moment within a pawn of level — Tabiya's recorded-evaluation convention.");
  if (evidence.projection.id === "derived.story.title") return one(String(payload.title));
  const after = payload.after as { readonly engineId?: unknown; readonly requestedMovetimeMs?: unknown };
  const delta = Number(payload.delta);
  return one(`The recorded evaluation moved ${delta >= 0 ? "+" : ""}${delta} cp across this move (${String(after.engineId)}${after.requestedMovetimeMs === undefined ? "" : `, ${String(after.requestedMovetimeMs)} ms`}).`);
}
const RENDERERS = Object.freeze({
  "rules.phase.reading@1": (evidence: DeclaredEvidence<unknown>) => Object.freeze([renderPhaseReading(evidence.payload as ReturnType<typeof classifyPhase>)]),
  "pack.authored.phase@1": (evidence: DeclaredEvidence<unknown>) => Object.freeze([`This pack declares: ${String(evidence.payload)}.`]),
  "rules.structural.reading.named_structure@1": (evidence: DeclaredEvidence<unknown>) => { const item = evidence.payload as { readonly name: string; readonly provenanceNote: string }; return Object.freeze([`Detected structure: ${item.name}. ${item.provenanceNote}`]); },
  "rules.pivotal.marker@1": (evidence: DeclaredEvidence<unknown>) => renderPivotalMarker(evidence.payload as Parameters<typeof renderPivotalMarker>[0]),
  "rules.endgame.reading@1": (evidence: DeclaredEvidence<unknown>) => renderEndgameReading(evidence.payload as Parameters<typeof renderEndgameReading>[0]),
  "pack.authored.claim@1": (evidence: DeclaredEvidence<unknown>) => { const item = evidence.payload as { readonly text: string; readonly attribution: string }; return Object.freeze([`${item.text} (${item.attribution})`]); },
  "theory.shapes.firing@1": (evidence: DeclaredEvidence<unknown>) => { const item = evidence.payload as { readonly entryId: string }; return Object.freeze([`Shape ${item.entryId} begins here under its recorded catalogue trigger.`]); },
  "run.record.fork@1": renderRunRecord,
  "run.record.move@1": renderRunRecord,
  "run.record.checkpoint_hit@1": renderRunRecord,
  "run.record.objective_transition@1": renderRunRecord,
  "run.record.consequence@1": renderRunRecord,
  "run.record.imported_result@1": renderRunRecord,
  "derived.compare.structure_delta@1": renderCompareDerived,
  "derived.compare.eval_delta@1": renderCompareDerived,
  "derived.story.eval_shift@1": renderStoryDerived,
  "derived.story.last_level@1": renderStoryDerived,
  "derived.story.title@1": renderStoryDerived,
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
    declarePhaseReadingEvidence(detected),
    ...(input.pack === undefined ? [] : [declarePackPhaseEvidence(input.pack.phase as PackPhase)]),
    ...reading.structures.map(declareNamedStructureEvidence),
    ...reading.features.filter((item) => item.kind !== "pawn_count").map(declareStructuralReadingSourceEvidence),
    ...markers.map(declarePivotalMarkerEvidence),
    ...(endgame === null ? [] : [declareEndgameReadingEvidence(endgame)]),
    ...plans.map((plan) => declareShapeFiringSourceEvidence(Object.freeze({ entryId: plan.id, firstNodeId: input.node.id, lastNodeId: input.node.id, openEnded: true }))),
    ...authored.map(declareAuthoredClaimEvidence),
    ...readings.map((item) => item.kind === "engine_eval" ? declareRecordedEngineEvidence(item) : declareRecordedTablebaseEvidence(item)),
  ]);
  return Object.freeze({ fen: input.node.fen, phase: Object.freeze(phase), structures: reading.structures, observations: reading.features, markers: Object.freeze(markers), endgame, plans: Object.freeze(plans), authored: Object.freeze(authored), readings, declared });
}

export function renderRecordedReadingEvidence(view: ConsumerEvidenceView<unknown>): readonly string[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "guidance.recorded_reading" || view.consumer.version !== 1) {
    throw new TypeError("Expected guidance.recorded_reading@1 consumer view");
  }
  return Object.freeze(view.items.flatMap((item) => renderRecordedReading(item.payload as Parameters<typeof renderRecordedReading>[0])));
}

export function appendRecordedReadings(text: string, packet: EvidencePacket): string {
  const view = evidenceForConsumer(EVIDENCE_MANIFEST, { id: "guidance.recorded_reading", version: 1 }, packet.declared);
  const rendered = renderRecordedReadingEvidence(view).join("\n");
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
