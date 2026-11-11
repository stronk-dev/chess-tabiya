// rfc/module-registration.md §4.5 — Post-commit Nudge, the first production caller of the module
// layer at the post_commit timing. Shared source/witness helpers for the canonical module query;
// no separate raw-string packet API or presentation pipeline (D3851/D3862).

import { assertDeclaredEvidence, evidenceDigest, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readFoundationEventInvocation } from "./internal/evidence-value-routes.js";
import { SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS } from "./semantic-validation.js";
import { localSemanticEventClosure, type StructuralSemanticEventOperands } from "./semantic-evidence.js";
import { RECORDED_SEQUENCE_HORIZONS } from "./recorded-sequence-window.js";
import { branchPath } from "./branch-path.js";
import type { DrillRun, Node } from "./types.js";
import type { OppositionChange, BackwardPawnChange } from "./foundation-position-sources.js";
import type { FileAccessRevealed, FileStateChange, PawnFileGroupChange, PawnIslandTopologyChange } from "./foundation-pawn-sources.js";
import type { SliderMembershipChange } from "./foundation-slider-sources.js";
import { positionFromFen } from "./position-cache.js";
import { parseSquare } from "chessops/util";

export function postcommitSubjectBranch(run: DrillRun, node: Node): string {
  return branchPath(run, run.activeCursor.branchId).some(candidate => candidate.id === node.id) ? run.activeCursor.branchId : node.branchId;
}

/** The accepted unchanged-king exclusion for the canonical query's evidence source. */
export function hasKingZoneWitness(evidence: DeclaredEvidence<unknown>): boolean {
  if (evidence.projection.id === "rules.structural.event.king_zone") {
    const event = evidence.payload as StructuralSemanticEventOperands;
    // Compare the observations, not their edge's FEN or move identity: every committed move
    // changes the latter even when both kings remain on exactly the same squares.
    return evidenceDigest(event.before) !== evidenceDigest(event.after);
  }
  if (evidence.projection.id === "rules.king.event.zone_state") {
    const event = evidence.payload as { readonly king: { readonly relocated: boolean }; readonly attackers: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly defenders: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly shelter: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] }; readonly escapes: { readonly gained: readonly unknown[]; readonly lost: readonly unknown[] } };
    return event.king.relocated || [event.attackers, event.defenders, event.shelter, event.escapes].some((change) => change.gained.length + change.lost.length > 0);
  }
  return true;
}

/** D3715 / §4.5a: exact Nudge-only change policy. Never apply this to shared acquisition. */
export const POSTCOMMIT_STRUCTURAL_CHANGE_REFS = Object.freeze([
  "rules.structural.event.king_zone@1", "rules.structural.event.passed_pawn@1",
] as const);
const structuralChangeRefs: ReadonlySet<string> = new Set(POSTCOMMIT_STRUCTURAL_CHANGE_REFS);

// Source operands are immutable JSON values. Compare complete values, not key insertion order,
// enclosing move/FEN, object identity, count-only sign or a new hash. Arrays retain source order.
function sameObservation(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((value, index) => sameObservation(value, right[index]));
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key)
    && sameObservation(Reflect.get(left, key), Reflect.get(right, key)));
}
export function hasPostcommitChangeWitness(evidence: DeclaredEvidence<unknown>): boolean {
  assertDeclaredEvidence(evidence);
  const ref = `${evidence.projection.id}@${evidence.projection.version}`;
  if (SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS.some(value => `${value.id}@${value.version}` === ref)) readFoundationEventInvocation(evidence);
  switch (ref) {
    case "rules.structural.event.king_opposition@2": {
      const value = evidence.payload as OppositionChange;
      const state = (row: OppositionChange["before"]) => row.opposition === null ? null : { kings: row.kings, opposition: row.opposition };
      return !sameObservation(state(value.before), state(value.after));
    }
    case "rules.structural.event.backward_pawn@2": {
      const value = evidence.payload as BackwardPawnChange; return !sameObservation(value.before, value.after);
    }
    case "derived.structural.event.pawn_file_group@1": {
      const value = evidence.payload as PawnFileGroupChange; return !sameObservation(value.before, value.after);
    }
    case "rules.transition.event.slider_ray@2": {
      const value = evidence.payload as SliderMembershipChange; return !sameObservation(value.before, value.after);
    }
    case "derived.activity.event.file_state@1": {
      const value = evidence.payload as FileStateChange; return value.before.state !== value.after.state;
    }
    case "derived.activity.event.file_access_revealed@1": {
      const value = evidence.payload as FileAccessRevealed, square = parseSquare(value.piece.square);
      if (square === undefined || value.piece.square[0] !== value.file || !["rook", "queen"].includes(value.piece.role)) return false;
      const before = positionFromFen(value.beforeFen).board.get(square), after = positionFromFen(value.afterFen).board.get(square);
      const stationary = before?.color === value.piece.color && before.role === value.piece.role && after?.color === value.piece.color && after.role === value.piece.role;
      const ownHalfOpen = `half_open_${value.piece.color}`;
      const revealed = value.afterState === "open" && value.beforeState !== "open"
        || value.afterState === ownHalfOpen && value.beforeState !== "open" && value.beforeState !== ownHalfOpen;
      return stationary && revealed && value.fileChange.before.state === value.beforeState && value.fileChange.after.state === value.afterState;
    }
    case "rules.structural.event.pawn_islands@2": {
      const value = evidence.payload as PawnIslandTopologyChange;
      return !sameObservation(value.before.map(row => row.files), value.after.map(row => row.files));
    }
  }
  if (ref === "rules.structural.event.pawn_islands@1") {
    const event = evidence.payload as { readonly before: number; readonly after: number };
    return event.before !== event.after;
  }
  if (structuralChangeRefs.has(ref)) {
    const event = evidence.payload as StructuralSemanticEventOperands;
    return !sameObservation(event.before, event.after);
  }
  return ref !== "rules.king.event.zone_state@1" || hasKingZoneWitness(evidence);
}

/** The evidence a production operation can seal for one committed edge today. */
export function collectPostcommitEdge(parent: Node, node: Node) {
  const sequenceIds = new Set(["derived.exchange.trade_completed", ...Object.keys(RECORDED_SEQUENCE_HORIZONS).map(key => key.split("@")[0]!)]);
  const closure = localSemanticEventClosure(parent.fen, node.moveUci!, node.fen);
  const events = closure.events.map(event => event.evidence)
    .filter(value => hasKingZoneWitness(value) && !sequenceIds.has(value.projection.id)
      && value.projection.id !== "derived.tactic.fork_survives_reply");
  const forks = events.filter((value): value is DeclaredEvidence<import("./tactics.js").DoubleAttackEvent> => value.projection.id === "rules.tactic.event.double_attack");
  if (forks.length > 0) {
    const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", { beforeFen: parent.fen, moveUci: node.moveUci!, afterFen: node.fen });
    for (const doubleAttack of forks) events.push(invokeEvidenceValueRoute("derived.tactic.nonterminal_fork_survival@1", { doubleAttack, breadth }));
  }
  return Object.freeze({ closure, evidence: Object.freeze(events) });
}

export function postcommitEdgeEvidence(_run: DrillRun, parent: Node, node: Node): readonly DeclaredEvidence<unknown>[] {
  return collectPostcommitEdge(parent, node).evidence;
}
