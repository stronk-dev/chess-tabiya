import type { Color } from "chessops/types";

import { permittedAssistance, type AssistanceContext } from "./assistance.js";
import { branchPath } from "./branch-path.js";
import { positionFromFen } from "./chess.js";
import { exactLegalMoves } from "./legal-moves.js";
import { classifyPhase, type DetectedPhase } from "./phase.js";
import type { DrillRun, Node, OpponentSelection } from "./types.js";
import { irreversibility, type IrreversibilityDetail } from "./transition.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

export type PivotalKind = "irreversibility" | "phase_change" | "human_divergence" | "option_collapse";
export type { IrreversibilityDetail } from "./transition.js";
export interface PhaseChangeDetail { readonly from: Exclude<DetectedPhase, "unclear">; readonly to: Exclude<DetectedPhase, "unclear">; }
export interface DivergenceDetail { readonly engine: OpponentSelection["engine"]; readonly targetElo?: number; readonly masses: readonly number[]; }
export interface CollapseDetail { readonly color: Color; readonly priorCount: number; readonly count: number; readonly nextCount: number; }
export interface PivotalMarker { readonly nodeId: string; readonly kind: PivotalKind; readonly detail: IrreversibilityDetail | PhaseChangeDetail | DivergenceDetail | CollapseDetail; readonly provenanceNote: string; }

const PROVENANCE = "Tabiya's pivotal-marker convention";
const DEFINITE = new Set<DetectedPhase>(["opening", "middlegame", "endgame"]);
// Producer-owned input retention: two histories may select at the same recorded node.
// Marker fields alone cannot locate which complete distribution produced that marker.
type RecordedMarkerSelection = Readonly<{
  occurrence: Readonly<{ runId: string; eventSeq: number; branchId: string; nodeId: string; moveUci: string }>;
  engine: OpponentSelection["engine"];
  candidates: NonNullable<OpponentSelection["candidates"]>;
}>;
const RECORDED_SELECTIONS = new WeakMap<PivotalMarker, RecordedMarkerSelection>();
/** Internal source operand, not evidence or permission; copied/rendered markers have none. */
export function pivotalMarkerRecordedSelection(marker: PivotalMarker): RecordedMarkerSelection | undefined {
  return RECORDED_SELECTIONS.get(marker);
}

function legalCount(fen: string): number {
  return exactLegalMoves(fen).length;
}


function divergence(run: DrillRun, pathIds: ReadonlySet<string>): readonly PivotalMarker[] {
  return run.events.flatMap((event) => {
    if (event.type !== "opponent.move_selected" || !pathIds.has(event.data.nodeId) || event.data.selection.policyModeApplied !== "human_common") return [];
    const selection = event.data.selection;
    const recordedCandidates = selection.candidates;
    const source = recordedCandidates === undefined ? undefined : Object.freeze({
      occurrence: Object.freeze({ runId: run.id, eventSeq: event.seq, branchId: event.data.branchId,
        nodeId: event.data.nodeId, moveUci: event.data.moveUci }),
      engine: Object.freeze({ ...selection.engine }),
      candidates: Object.freeze(recordedCandidates.map(candidate => Object.freeze({ ...candidate }))),
    });
    const candidates = source?.candidates.filter((item) => item.offWindow !== true);
    if (candidates === undefined || candidates.length === 0 || candidates.some((item) => item.mass === undefined)) return [];
    const total = candidates.reduce((sum, item) => sum + item.mass!, 0); if (!(total > 0)) return [];
    const masses = candidates.map((item) => item.mass! / total).sort((a, b) => b - a);
    if (Math.max(...masses) > 0.5 || masses.filter((mass) => mass >= 0.15).length < 3) return [];
    const marker = Object.freeze({ nodeId: event.data.nodeId, kind: "human_divergence" as const, detail: Object.freeze({ engine: source!.engine, ...(run.opponentPolicy.targetElo === undefined ? {} : { targetElo: run.opponentPolicy.targetElo }), masses: Object.freeze(masses) }), provenanceNote: "Recorded human-model distribution under Tabiya's split convention." });
    RECORDED_SELECTIONS.set(marker, source!);
    return [marker];
  });
}

/** Shared source implementation; each exact factory prepares only its own declared family. */
function pivotalPayloads(run: DrillRun, branchId: string, kind: PivotalKind | undefined): readonly PivotalMarker[] {
  const path = branchPath(run, branchId), markers: PivotalMarker[] = [];
  let lastDefinite: Exclude<DetectedPhase, "unclear"> | undefined;
  for (let index = 0; index < path.length; index += 1) {
    const node = path[index]!;
    // Every route retains original path/FEN validation even when its own family has no witness.
    positionFromFen(node.fen);
    if (kind === undefined || kind === "phase_change") {
      const phase = classifyPhase(node.fen).phase;
      if (DEFINITE.has(phase)) {
        const definite = phase as Exclude<DetectedPhase, "unclear">;
        if (lastDefinite !== undefined && definite !== lastDefinite) markers.push(Object.freeze({ nodeId: node.id, kind: "phase_change", detail: Object.freeze({ from: lastDefinite, to: definite }), provenanceNote: PROVENANCE }));
        lastDefinite = definite;
      }
    }
    const parent = index === 0 ? undefined : path[index - 1];
    if ((kind === undefined || kind === "irreversibility") && parent !== undefined && node.moveUci !== null) { const detail = irreversibility(parent.fen, node.moveUci, node.fen); if (detail !== undefined) markers.push(Object.freeze({ nodeId: node.id, kind: "irreversibility", detail: Object.freeze(detail), provenanceNote: PROVENANCE })); }
  }
  if (kind === undefined || kind === "option_collapse") {
    const decisions = path.map((node) => ({ node, color: positionFromFen(node.fen).turn, count: legalCount(node.fen) }));
    for (const color of ["white", "black"] as const) {
      const same = decisions.filter((item) => item.color === color);
      for (let index = 1; index + 1 < same.length; index += 1) {
        const prior = same[index - 1]!, first = same[index]!, second = same[index + 1]!;
        if (prior.count >= 8 && first.count <= 3 && second.count <= 3) markers.push(Object.freeze({ nodeId: first.node.id, kind: "option_collapse", detail: Object.freeze({ color, priorCount: prior.count, count: first.count, nextCount: second.count }), provenanceNote: "Tabiya's sustained legal-continuation convention." }));
      }
    }
  }
  if (kind === undefined || kind === "human_divergence") markers.push(...divergence(run, new Set(path.map((node) => node.id))));
  const order = new Map(path.map((node, index) => [node.id, index]));
  return Object.freeze(markers.sort((a, b) => (order.get(a.nodeId)! - order.get(b.nodeId)!) || a.kind.localeCompare(b.kind)));
}

/** Unchanged whole-tip population for rendering and existing complete-source callers. */
export function pivotalMarkerPayloads(run: DrillRun, branchId: string): readonly PivotalMarker[] {
  return pivotalPayloads(run, branchId, undefined);
}

/** Factory-internal selection, not a scoped path, public package export or permission. */
export function pivotalMarkerPayloadsForKind(run: DrillRun, branchId: string, kind: PivotalKind): readonly PivotalMarker[] {
  if (!Object.hasOwn(PIVOTAL_MARKER_ROUTES, kind)) throw new TypeError("Unknown pivotal source family");
  return pivotalPayloads(run, branchId, kind);
}

/** Rendering-model population (not evidence). Evidence consumers use `pivotalMarkerEvidenceItems`. */
export function pivotalMarkers(run: DrillRun, branchId: string): readonly PivotalMarker[] {
  return pivotalMarkerPayloads(run, branchId);
}

export const PIVOTAL_MARKER_ROUTES = Object.freeze({
  irreversibility: "derived.pivotal.irreversibility@1",
  phase_change: "derived.pivotal.phase_change@1",
  human_divergence: "derived.pivotal.human_divergence@1",
  option_collapse: "derived.pivotal.option_collapse@1",
} as const satisfies Readonly<Record<PivotalKind, string>>);

/**
 * The four exact derived pivotal projections for one recorded branch, in path order. Each item is
 * minted by its own factory from its own authority: a rule marker cannot be relabelled human-model
 * evidence and a Maia split cannot be relabelled a position-rule marker.
 */
export function pivotalMarkerEvidenceItems(run: DrillRun, branchId: string): readonly DeclaredEvidence<PivotalMarker>[] {
  const order = new Map(branchPath(run, branchId).map((node, index) => [node.id, index]));
  const items = (Object.keys(PIVOTAL_MARKER_ROUTES) as PivotalKind[]).flatMap((kind) => invokeEvidenceValueRoute(PIVOTAL_MARKER_ROUTES[kind], { run, branchId }).map((item) => item.evidence as DeclaredEvidence<PivotalMarker>));
  return Object.freeze(items.sort((a, b) => (order.get(a.payload.nodeId)! - order.get(b.payload.nodeId)!) || a.payload.kind.localeCompare(b.payload.kind)));
}

export function liveAdmitted(
  marker: PivotalMarker,
  _permission: ReturnType<typeof permittedAssistance>,
): boolean {
  switch (marker.kind) {
    case "irreversibility":
      return (marker.detail as IrreversibilityDetail).subkind === "last_of_role";
    case "human_divergence":
    case "option_collapse":
      // D3048: measured evidence remains available to explicit requests and retrospective
      // consumers, but these two signals never appear as unsolicited live markers.
      return false;
    case "phase_change":
      return true;
    default: {
      const exhaustive: never = marker.kind;
      return exhaustive;
    }
  }
}

export function liveMarkers(
  run: DrillRun,
  branchId: string,
  context: AssistanceContext,
): readonly PivotalMarker[] {
  const permission = permittedAssistance(context);
  return Object.freeze(pivotalMarkers(run, branchId).filter((marker) => liveAdmitted(marker, permission)));
}

export function consumePivotalMarkers(
  view: ConsumerEvidenceView<PivotalMarker>,
): readonly PivotalMarker[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "board.pivotal_marker" || view.consumer.version !== 1) {
    throw new TypeError("Expected board.pivotal_marker@1 consumer view");
  }
  return Object.freeze(view.items.map((item) => item.payload));
}

/** Live board markers: factory-minted, filtered by the live admission rule, then admitted. */
export function pivotalMarkerEvidence(run: DrillRun, branchId: string, context: AssistanceContext): readonly PivotalMarker[] {
  const permission = permittedAssistance(context);
  const declared = pivotalMarkerEvidenceItems(run, branchId).filter((item) => liveAdmitted(item.payload, permission));
  return consumePivotalMarkers(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "board.pivotal_marker", version: 1 },
    declared,
  ));
}

export function renderPivotalMarker(marker: PivotalMarker): readonly string[] {
  switch (marker.kind) {
    case "phase_change": {
      const detail = marker.detail as PhaseChangeDetail;
      return Object.freeze([`${detail.from} → ${detail.to}, detected by Tabiya's phase bands.`]);
    }
    case "human_divergence": {
      const detail = marker.detail as DivergenceDetail;
      return Object.freeze([`${detail.engine.name}'s recorded policy split: ${detail.masses.slice(0, 3).map((mass) => `${Math.round(mass * 100)}%`).join(" / ")} of recorded mass.`]);
    }
    case "option_collapse": {
      const detail = marker.detail as CollapseDetail;
      return Object.freeze([detail.count === 1 ? "One legal move is available: forced under Tabiya's count convention." : `${detail.count} legal moves are available under Tabiya's count convention.`]);
    }
    case "irreversibility": {
      const detail = marker.detail as IrreversibilityDetail;
      if (detail.subkind === "castled") return Object.freeze([`${detail.color} castled.`]);
      if (detail.subkind === "last_of_role") return Object.freeze([detail.queensOff ? "The queens have left the board." : `${detail.color} has no ${detail.role}s remaining.`]);
      return Object.freeze([`${detail.color} created or resolved pawn contact.`]);
    }
    default: {
      const exhaustive: never = marker.kind;
      return exhaustive;
    }
  }
}
