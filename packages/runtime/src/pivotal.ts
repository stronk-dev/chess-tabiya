import type { Color } from "chessops/types";

import { branchPath } from "./branch-path.js";
import { positionFromFen } from "./chess.js";
import { classifyPhase, type DetectedPhase } from "./phase.js";
import type { DrillRun, Node, OpponentSelection } from "./types.js";
import { irreversibility, type IrreversibilityDetail } from "./transition.js";

export type PivotalKind = "irreversibility" | "phase_change" | "human_divergence" | "option_collapse";
export type { IrreversibilityDetail } from "./transition.js";
export interface PhaseChangeDetail { readonly from: Exclude<DetectedPhase, "unclear">; readonly to: Exclude<DetectedPhase, "unclear">; }
export interface DivergenceDetail { readonly engine: OpponentSelection["engine"]; readonly targetElo?: number; readonly masses: readonly number[]; }
export interface CollapseDetail { readonly color: Color; readonly priorCount: number; readonly count: number; readonly nextCount: number; }
export interface PivotalMarker { readonly nodeId: string; readonly kind: PivotalKind; readonly detail: IrreversibilityDetail | PhaseChangeDetail | DivergenceDetail | CollapseDetail; readonly provenanceNote: string; }

const PROVENANCE = "Tabiya's pivotal-marker convention";
const DEFINITE = new Set<DetectedPhase>(["opening", "middlegame", "endgame"]);

function legalCount(fen: string): number {
  const position = positionFromFen(fen);
  let count = 0;
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    if (position.isLegal({ from, to })) count += position.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? 4 : 1;
  }
  return count;
}


function divergence(run: DrillRun, pathIds: ReadonlySet<string>): readonly PivotalMarker[] {
  return run.events.flatMap((event) => {
    if (event.type !== "opponent.move_selected" || !pathIds.has(event.data.nodeId) || event.data.selection.policyModeApplied !== "human_common") return [];
    const candidates = event.data.selection.candidates?.filter((item) => item.offWindow !== true);
    if (candidates === undefined || candidates.length === 0 || candidates.some((item) => item.mass === undefined)) return [];
    const total = candidates.reduce((sum, item) => sum + item.mass!, 0); if (!(total > 0)) return [];
    const masses = candidates.map((item) => item.mass! / total).sort((a, b) => b - a);
    if (Math.max(...masses) > 0.5 || masses.filter((mass) => mass >= 0.15).length < 3) return [];
    return [Object.freeze({ nodeId: event.data.nodeId, kind: "human_divergence" as const, detail: Object.freeze({ engine: event.data.selection.engine, ...(run.opponentPolicy.targetElo === undefined ? {} : { targetElo: run.opponentPolicy.targetElo }), masses: Object.freeze(masses) }), provenanceNote: "Recorded human-model distribution under Tabiya's split convention." })];
  });
}

export function pivotalMarkers(run: DrillRun, branchId: string): readonly PivotalMarker[] {
  const path = branchPath(run, branchId), markers: PivotalMarker[] = [];
  let lastDefinite: Exclude<DetectedPhase, "unclear"> | undefined;
  for (let index = 0; index < path.length; index += 1) {
    const node = path[index]!;
    const phase = classifyPhase(node.fen).phase;
    if (DEFINITE.has(phase)) {
      const definite = phase as Exclude<DetectedPhase, "unclear">;
      if (lastDefinite !== undefined && definite !== lastDefinite) markers.push(Object.freeze({ nodeId: node.id, kind: "phase_change", detail: Object.freeze({ from: lastDefinite, to: definite }), provenanceNote: PROVENANCE }));
      lastDefinite = definite;
    }
    const parent = index === 0 ? undefined : path[index - 1];
    if (parent !== undefined && node.moveUci !== null) { const detail = irreversibility(parent.fen, node.moveUci, node.fen); if (detail !== undefined) markers.push(Object.freeze({ nodeId: node.id, kind: "irreversibility", detail: Object.freeze(detail), provenanceNote: PROVENANCE })); }
  }
  const decisions = path.map((node) => ({ node, color: positionFromFen(node.fen).turn, count: legalCount(node.fen) }));
  for (const color of ["white", "black"] as const) {
    const same = decisions.filter((item) => item.color === color);
    for (let index = 1; index + 1 < same.length; index += 1) {
      const prior = same[index - 1]!, first = same[index]!, second = same[index + 1]!;
      if (prior.count >= 8 && first.count <= 3 && second.count <= 3) markers.push(Object.freeze({ nodeId: first.node.id, kind: "option_collapse", detail: Object.freeze({ color, priorCount: prior.count, count: first.count, nextCount: second.count }), provenanceNote: "Tabiya's sustained legal-continuation convention." }));
    }
  }
  markers.push(...divergence(run, new Set(path.map((node) => node.id))));
  const order = new Map(path.map((node, index) => [node.id, index]));
  return Object.freeze(markers.sort((a, b) => (order.get(a.nodeId)! - order.get(b.nodeId)!) || a.kind.localeCompare(b.kind)));
}

export function renderPivotalMarker(marker: PivotalMarker): readonly string[] {
  if (marker.kind === "phase_change") { const detail = marker.detail as PhaseChangeDetail; return Object.freeze([`${detail.from} → ${detail.to}, detected by Tabiya's phase bands.`]); }
  if (marker.kind === "human_divergence") { const detail = marker.detail as DivergenceDetail; return Object.freeze([`${detail.engine.name}'s recorded policy split: ${detail.masses.slice(0, 3).map((mass) => `${Math.round(mass * 100)}%`).join(" / ")} of recorded mass.`]); }
  if (marker.kind === "option_collapse") { const detail = marker.detail as CollapseDetail; return Object.freeze([detail.count === 1 ? "One legal move is available: forced under Tabiya's count convention." : `${detail.count} legal moves are available under Tabiya's count convention.`]); }
  const detail = marker.detail as IrreversibilityDetail;
  if (detail.subkind === "castled") return Object.freeze([`${detail.color} castled.`]);
  if (detail.subkind === "last_of_role") return Object.freeze([`${detail.color} has no ${detail.role}s remaining.`]);
  return Object.freeze([`${detail.color} created or resolved pawn contact.`]);
}
