import { collectFoundationSnapshotSource, collectFoundationAdvanceSource } from "./foundation-snapshot-source.js";
// Accepted module-registration §4.11a: demand-local rules sources, below consumer/page admission.
// Each supplier names its sole value route; no output payload, renderer or generic route is accepted.
import { collectFoundationEdgeEvents, type FoundationEdgeSourceRef } from "./foundation-edge-source.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertSemanticEvidenceEvent } from "./semantic-evidence.js";
import { assertDeclaredEvidence, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, validEdge } from "./internal/evidence-value-routes.js";

const POSITION = Object.freeze({
  "rules.tactic.reading.loose_piece@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen }),
  "rules.tactic.reading.ray_classification@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.ray_classification@1", { fen }),
  "rules.tactic.reading.rook_on_seventh@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.rook_on_seventh@1", { fen }),
  "rules.tactic.reading.trapped_piece@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.trapped_piece@1", { fen }),
  "rules.tactic.reading.back_rank@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.back_rank@1", { fen }),
  "rules.tactic.reading.discovered_latency@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.discovered_latency@1", { fen }),
  "rules.tactic.consequence.threat@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.consequence.threat@1", { fen }),
  "rules.tactic.consequence.mate_in_one@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.consequence.mate_in_one@1", { fen }),
  "rules.structural.reading.space@1": (fen: string) => invokeEvidenceValueRoute("rules.structural.reading.space@1", { fen }),
  "rules.structural.reading.pawn_connectivity@1": (fen: string) => invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen }),
  "rules.phase.development@1": (fen: string) => invokeEvidenceValueRoute("rules.phase.development@1", { fen }),
  "rules.castling.reading.rights@1": (fen: string) => invokeEvidenceValueRoute("rules.castling.reading.rights@1", { fen }),
  "rules.castling.reading.legality@1": (fen: string) => invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen }),
  "rules.square.reading.control@1": (fen: string) => invokeEvidenceValueRoute("rules.square.reading.control@1", { fen }),
  "rules.mobility.reading.piece_destinations@1": (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.piece_destinations@1", { fen }),
  "rules.mobility.reading.legal_moves@1": (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen }),
  "rules.pawn.reading.contacts@1": (fen: string) => invokeEvidenceValueRoute("rules.pawn.reading.contacts@1", { fen }),
  "rules.pawn.reading.candidate_majority@1": (fen: string) => invokeEvidenceValueRoute("rules.pawn.reading.candidate_majority@1", { fen }),
  "rules.king.reading.zone_state@1": (fen: string) => invokeEvidenceValueRoute("rules.king.reading.zone_state@1", { fen }),
  "rules.phase.reading@2": (fen: string) => invokeEvidenceValueRoute("rules.phase.reading@2", { fen }),
  "rules.tactic.reading.promotion_pressure@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.promotion_pressure@1", { fen }),
  "rules.tactic.reading.defender_duty_set@1": (fen: string) => invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen }),
  "derived.material.reading.role_signature@2": (fen: string) => invokeEvidenceValueRoute("derived.material.reading.role_signature@2", { fen }),
  "rules.structural.reading.king_opposition@3": (fen: string) => collectFoundationSnapshotSource("rules.structural.reading.king_opposition@3", fen),
  "rules.structural.reading.backward_pawn@3": (fen: string) => collectFoundationSnapshotSource("rules.structural.reading.backward_pawn@3", fen),
  "derived.structural.reading.pawn_file_group@1": (fen: string) => collectFoundationSnapshotSource("derived.structural.reading.pawn_file_group@1", fen),
  "derived.activity.reading.file_state@1": (fen: string) => collectFoundationSnapshotSource("derived.activity.reading.file_state@1", fen),
  "derived.square.reading.future_file_challenge@1": (fen: string) => collectFoundationSnapshotSource("derived.square.reading.future_file_challenge@1", fen),
  "derived.square.reading.capture_migration_reach@1": (fen: string) => collectFoundationSnapshotSource("derived.square.reading.capture_migration_reach@1", fen),
  "derived.structural.reading.outpost_candidate@1": (fen: string) => collectFoundationSnapshotSource("derived.structural.reading.outpost_candidate@1", fen),
  "derived.structural.reading.occupied_outpost@1": (fen: string) => collectFoundationSnapshotSource("derived.structural.reading.occupied_outpost@1", fen),
});
type Edge = Readonly<{ beforeFen: string; moveUci: string; afterFen: string }>;
const semantic = (source: FoundationEdgeSourceRef) => Object.freeze({ semantic: source });
const EDGE = Object.freeze({
  "rules.tactic.consequence.reply_breadth@1": (edge: Edge) => invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", edge),
  "rules.square.event.control@1": (edge: Edge) => invokeEvidenceValueRoute("rules.square.event.control@1", edge),
  "rules.mobility.event.piece_destinations@1": (edge: Edge) => invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", edge),
  "rules.tactic.event.defender_removed@1": (edge: Edge) => invokeEvidenceValueRoute("rules.tactic.event.defender_removed@1", edge),
  "rules.tactic.event.defender_duty_relocated@1": (edge: Edge) => invokeEvidenceValueRoute("rules.tactic.event.defender_duty_relocated@1", edge),
  "rules.structural.event.backward_pawn@2": semantic("rules.structural.event.backward_pawn@2"),
  "rules.structural.event.king_opposition@2": semantic("rules.structural.event.king_opposition@2"),
  "rules.structural.event.king_zone@1": (edge: Edge) => invokeEvidenceValueRoute("rules.structural.event.king_zone@1", edge),
  "rules.structural.event.passed_pawn@1": (edge: Edge) => invokeEvidenceValueRoute("rules.structural.event.passed_pawn@1", edge),
  "rules.structural.event.piece_count@1": (edge: Edge) => invokeEvidenceValueRoute("rules.structural.event.piece_count@1", edge),
  "rules.structural.event.direct_attack_count@1": (edge: Edge) => invokeEvidenceValueRoute("rules.structural.event.direct_attack_count@1", edge),
  "rules.structural.event.pawn_islands@2": semantic("rules.structural.event.pawn_islands@2"),
  "derived.structural.event.pawn_file_group@1": semantic("derived.structural.event.pawn_file_group@1"),
  "rules.transition.event.slider_ray@2": semantic("rules.transition.event.slider_ray@2"),
  "derived.activity.event.file_state@1": semantic("derived.activity.event.file_state@1"),
  "derived.activity.event.file_access_revealed@1": semantic("derived.activity.event.file_access_revealed@1"),
  "derived.pawn.consequence.backward_pawn_legal_advance@1": (edge: Edge) => collectFoundationAdvanceSource(edge),
});
export type InspectorLocalProjection = keyof typeof POSITION | keyof typeof EDGE;
// This is the closed supplier inventory, not another consumer/permission/qualification registry.
export const INSPECTOR_LOCAL_PROJECTIONS: readonly InspectorLocalProjection[] = Object.freeze([...Object.keys(POSITION), ...Object.keys(EDGE)] as InspectorLocalProjection[]);
export function inspectorLocalScope(projection: string): "position" | "incoming_edge" {
  if (typeof projection !== "string") throw new TypeError("Local Inspector projection must be an exact string ref");
  if (Object.hasOwn(POSITION, projection)) return "position";
  if (Object.hasOwn(EDGE, projection)) return "incoming_edge";
  throw new TypeError("Unsupported exact local Inspector source");
}
function complete(projection: InspectorLocalProjection, result: DeclaredEvidence<unknown> | readonly DeclaredEvidence<unknown>[]): readonly DeclaredEvidence<unknown>[] {
  const values = Array.isArray(result) ? result : [result as DeclaredEvidence<unknown>];
  for (const value of values) {
    assertDeclaredEvidence(value);
    if (`${value.projection.id}@${value.projection.version}` !== projection) throw new TypeError("Local Inspector source emitted a foreign projection");
  }
  return Object.freeze([...values]);
}
/** Caller grants scope; the sole factory validates the canonical position/legal edge and owns values. */
export function collectInspectorLocalPosition(projection: InspectorLocalProjection, fen: string): readonly DeclaredEvidence<unknown>[] {
  if (inspectorLocalScope(projection) !== "position") throw new TypeError("Local Inspector source requires its incoming edge");
  return complete(projection, POSITION[projection as keyof typeof POSITION](fen));
}
export interface InspectorLocalEdgeResult {
  readonly values: readonly DeclaredEvidence<unknown>[];
  /** null means this semantic operation did not execute; [] is a genuine quiet edge. */
  readonly semanticEvents: readonly import("./semantic-evidence.js").SemanticEvidenceEvent[] | null;
}
export function collectInspectorLocalEdge(projection: InspectorLocalProjection, edge: Edge): InspectorLocalEdgeResult {
  if (inspectorLocalScope(projection) !== "incoming_edge") throw new TypeError("Local Inspector source requires its selected position");
  const supplier = EDGE[projection as keyof typeof EDGE];
  if (typeof supplier === "function") return Object.freeze({ values: complete(projection, supplier(edge)), semanticEvents: null });
  const semanticEvents = collectFoundationEdgeEvents(edge, [supplier.semantic]);
  return Object.freeze({ values: complete(projection, semanticEvents.map(event => event.evidence)), semanticEvents });
}

/** Nonminting validation of the source owner's retained result. The server never imports a value
 * route/dispatcher. No caller-provided result can acquire a source or become an owned token. */
export function assertInspectorLocalSourceEvents(image: InspectorLocalEdgeResult & Readonly<{
  projection: InspectorLocalProjection; input: Edge | Readonly<{ fen: string }> | null;
}>): void {
  const supplier = Object.hasOwn(EDGE, image.projection) ? EDGE[image.projection as keyof typeof EDGE] : undefined;
  const expected = image.input !== null && !("fen" in image.input) && supplier !== undefined && typeof supplier !== "function";
  if (!expected) {
    if (image.semanticEvents !== null) throw new TypeError("Unexpected Inspector semantic events");
    return;
  }
  if (image.semanticEvents === null || image.semanticEvents.length !== image.values.length
    || image.input === null || "fen" in image.input) throw new TypeError("Incomplete Inspector semantic source");
  const edge = validEdge(image.input);
  for (const [index, event] of image.semanticEvents.entries()) {
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
    if (event.evidence !== image.values[index] || `${event.projection.id}@${event.projection.version}` !== image.projection
      || event.anchor.beforeFen !== edge.beforeFen || event.anchor.moveUci !== edge.moveUci || event.anchor.afterFen !== edge.afterFen
      || (event.evidence.payload as { readonly sign: unknown }).sign !== event.sign) throw new TypeError("Foreign Inspector semantic source");
  }
}
