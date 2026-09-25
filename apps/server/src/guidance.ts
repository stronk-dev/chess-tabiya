import {
  classifyPhase,
  assertConsumerEvidenceView,
  endgameClassification,
  evidenceForConsumer,
  matchesStructuralExpression,
  pivotalMarkers,
  positionGuidanceEvidence,
  renderEndgameClassification,
  renderPivotalMarker,
  renderRecordedReading,
  renderShapeFiring,
  presentEvidenceItems,
  presentedSentence,
  renderStructuralObservationChange,
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
export type VoiceScope = "marker" | "reading" | "steering" | "story" | "compare" | "hint";
export interface VoiceEvidenceView {
  readonly scope: VoiceScope;
  readonly rendered: RenderedEvidenceView;
}
export interface VoiceProvider { render(view: VoiceEvidenceView, persona: string, deterministicText: string, scope: VoiceScope, signal?: AbortSignal): Promise<string>; }

/** The compiled consumer budget both voice attempts and the deterministic fallback share (§5). */
export const VOICE_OPERATION_BUDGET_MS = 4_000;

const one = (sentence: string): readonly string[] => Object.freeze([sentence]);

function phaseCopy(value: unknown): string {
  switch (value) {
    case "opening": return "Opening";
    case "middlegame": return "Middlegame";
    case "endgame": return "Endgame";
    case "cross_phase": return "Transition between phases";
    case "unclear": return "Phase not clear";
    default: throw new TypeError("Guidance evidence omitted a known chess phase");
  }
}

function renderGuidancePhase(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const phase = (evidence.payload as { readonly phase?: unknown }).phase;
  return one(`Current position: ${phaseCopy(phase)}.`);
}

function renderGuidanceStructure(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const name = (evidence.payload as { readonly name?: unknown }).name;
  if (typeof name !== "string" || name.trim() === "") throw new TypeError("Named-structure evidence omitted its learner label");
  return one(`Recognized position structure: ${name}.`);
}

function renderGuidanceClaim(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const text = (evidence.payload as { readonly text?: unknown }).text;
  if (typeof text !== "string" || text.trim() === "") throw new TypeError("Authored guidance evidence omitted its text");
  return one(`Authored guidance: ${text}`);
}

function recordedTurnCount(value: unknown): string {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError("Recorded comparison count must be a non-negative integer");
  return `${String(value)} recorded ${(value as number) === 1 ? "turn" : "turns"}`;
}

function consequenceStep(value: unknown): string {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError("Recorded comparison step must be a non-negative integer");
  return (value as number) === 0 ? "the shared position" : `consequence step ${String(value)}`;
}

function objectiveStateCopy(value: unknown): string {
  switch (value) {
    case "active": return "In progress";
    case "preserved": return "Objective held";
    case "degraded": return "Objective weakened";
    case "failed": return "Objective missed";
    case "achieved": return "Objective reached";
    case "transitioned": return "Next phase reached";
    default: throw new TypeError("Recorded comparison omitted a known objective state");
  }
}

function learnerOutcomeCopy(value: unknown): string {
  switch (value) {
    case "win": return "You won this line.";
    case "loss": return "You lost this line.";
    case "draw": return "You drew this line.";
    default: throw new TypeError("Recorded comparison omitted a known learner outcome");
  }
}

function renderRunRecord(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  if (evidence.projection.id === "run.record.fork") return one(`The continuations share ${recordedTurnCount(payload.sharedPly)} before they separate.`);
  if (evidence.projection.id === "run.record.move") {
    const where = consequenceStep(payload.offset);
    if (payload.moveSan === null) return one(`No move was recorded at ${where}.`);
    if (typeof payload.moveSan !== "string" || payload.moveSan.length === 0) throw new TypeError("Recorded comparison move omitted SAN");
    return one(`The recorded move at ${where} is ${payload.moveSan}.`);
  }
  if (evidence.projection.id === "run.record.checkpoint_hit") return one(`An authored checkpoint was reached at ${consequenceStep(payload.plyOffset)}.`);
  if (evidence.projection.id === "run.record.objective_transition") return one(`The recorded objective changed from “${objectiveStateCopy(payload.from)}” to “${objectiveStateCopy(payload.to)}.”`);
  if (evidence.projection.id === "run.record.imported_result") return one(`The PGN records the game result as ${String(payload.result)}; the board is not terminal here.`);
  if (payload.terminal === true) return one(learnerOutcomeCopy(payload.outcome));
  return one(`This continuation stops after ${recordedTurnCount(payload.plies)}. ${objectiveStateCopy(payload.objectiveState)}.`);
}
function renderCompareDerived(evidence: DeclaredEvidence<unknown>): readonly string[] {
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  if (evidence.projection.id === "derived.compare.structure_delta") return one(`${renderStructuralObservationChange(payload.observation as Parameters<typeof renderStructuralObservationChange>[0])} Source: Tabiya structural detector.`);
  if (!Number.isSafeInteger(payload.delta)) throw new TypeError("Recorded comparison evaluation omitted a safe centipawn delta");
  const delta = payload.delta as number;
  const pawns = `${delta >= 0 ? "+" : "−"}${(Math.abs(delta) / 100).toFixed(2)}`;
  return one(`Recorded evaluation change at ${consequenceStep(payload.plyOffset)}: ${pawns} pawns on the stored scale.`);
}
/**
 * Story-derived and typed Review facts render through the registered review.story@1 presentation
 * adapter, so the voice story speaks exactly the sealed component sentence (never a cp scalar).
 */
function renderStoryDerived(evidence: DeclaredEvidence<unknown>): readonly string[] {
  return Object.freeze(presentEvidenceItems(evidenceForConsumer(EVIDENCE_MANIFEST, { id: "review.story", version: 1 }, [evidence])).map(presentedSentence));
}
const renderMarker = (evidence: DeclaredEvidence<unknown>) => renderPivotalMarker(evidence.payload as Parameters<typeof renderPivotalMarker>[0]);
const PIVOTAL_ROUTES = Object.freeze(["derived.pivotal.irreversibility@1", "derived.pivotal.phase_change@1", "derived.pivotal.human_divergence@1", "derived.pivotal.option_collapse@1"] as const);
const RENDERERS = Object.freeze({
  "rules.phase.reading@2": renderGuidancePhase,
  "pack.authored.phase@1": (evidence: DeclaredEvidence<unknown>) => one(`Rehearsal focus: ${phaseCopy((evidence.payload as { readonly phase: string }).phase)}.`),
  "rules.structural.reading.named_structure@2": renderGuidanceStructure,
  ...Object.fromEntries(PIVOTAL_ROUTES.map((route) => [route, renderMarker])),
  "rules.endgame.classification@1": (evidence: DeclaredEvidence<unknown>) => renderEndgameClassification(evidence.payload as Parameters<typeof renderEndgameClassification>[0]),
  "pack.authored.claim@1": renderGuidanceClaim,
  "theory.shapes.firing@1": (evidence: DeclaredEvidence<unknown>) => renderShapeFiring(evidence.payload as Parameters<typeof renderShapeFiring>[0]),
  "run.record.fork@1": renderRunRecord,
  "run.record.move@1": renderRunRecord,
  "run.record.checkpoint_hit@1": renderRunRecord,
  "run.record.objective_transition@1": renderRunRecord,
  "run.record.consequence@1": renderRunRecord,
  "run.record.imported_result@1": renderRunRecord,
  "derived.compare.structure_delta@1": renderCompareDerived,
  "derived.compare.eval_delta@1": renderCompareDerived,
  "derived.review.eval_delta@1": renderStoryDerived,
  "derived.review.mate_transition@1": renderStoryDerived,
  "derived.story.last_level@1": renderStoryDerived,
  "derived.story.title@1": renderStoryDerived,
});

export function renderedEvidenceItems(manifest: CompiledEvidenceManifest, consumerId: string, declared: readonly DeclaredEvidence<unknown>[]): RenderedEvidenceView {
  const admitted = evidenceForConsumer(manifest, { id: consumerId, version: 1 }, declared);
  const renderers = consumerId === "guidance.voice_compare" ? Object.freeze({ ...RENDERERS, ...Object.fromEntries(PIVOTAL_ROUTES.map((route) => [route, (evidence: DeclaredEvidence<unknown>) => Object.freeze([`${renderPivotalMarker(evidence.payload as Parameters<typeof renderPivotalMarker>[0]).join(" ")} Source: Tabiya product convention.`])])) }) : RENDERERS;
  return renderEvidenceItems(admitted, renderers);
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
