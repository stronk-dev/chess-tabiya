import type { Color, Role, SquareName } from "chessops/types";
import { makeSquare, opposite, parseSquare } from "chessops/util";

import { positionFromFen } from "./chess.js";
import { RuntimeError, unknownNode } from "./errors.js";
import { appendEvents } from "./events.js";
import { exactMoveIdentity } from "./legal-moves.js";
import { assertObjectiveTransition } from "./objective-state.js";
import type { StructuralExpression } from "./structure.js";
import { AuthoredStructuralSourceError, declareCurrentStructuralPredicateEvidence, preflightCurrentAuthoredOperation, requireCurrentStructuralExpression } from "./structural-evidence.js";
import type { AuthoredStructuralConditionSource } from "./internal/authored-structural-source.js";
import { matchesStructuralExpression } from "./structure.js";
import { assertCurrentTransitionSources, matchesCurrentTransitionExpression, matchesTransitionExpression } from "./transition.js";
import type { TransitionExpression } from "@chess-tabiya/schema/drill-pack";
import {
  tempoMovesFromRun,
  windowStates,
  currentWindowStates,
  assertCurrentWindowSources,
  type TempoVerdict,
} from "./tempo.js";
import type { TimingWindowDefinition } from "@chess-tabiya/schema/drill-pack";
import type {
  DrillRun,
  MutationResult,
  Node,
  ObjectiveState,
  PolicyConfig,
} from "./types.js";

export const MATERIAL_VALUES: Readonly<Record<Role, number>> = Object.freeze({
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
});

export type RulesFactPredicate =
  | {
      readonly type: "rulesFact";
      readonly fact: "checkmate";
      readonly winner?: Color;
    }
  | {
      readonly type: "rulesFact";
      readonly fact: "stalemate" | "draw";
    };

export interface MaterialBalancePredicate {
  readonly type: "materialBalance";
  readonly perspective: Color;
  readonly comparison: "atLeast" | "atMost" | "equal";
  readonly value: number;
}

export type FenPredicate =
  | {
      readonly type: "transposeKey";
      readonly value: string;
    }
  | {
      readonly type: "pieceOnSquare";
      readonly square: SquareName;
      readonly piece: { readonly color: Color; readonly role: Role } | null;
    }
  | {
      readonly type: "pawnStructure";
      readonly mode: "contains" | "exact";
      readonly white: readonly SquareName[];
      readonly black: readonly SquareName[];
    }
  | { readonly type: "structuralFeature"; readonly feature: StructuralExpression; readonly authoredSource?: AuthoredStructuralConditionSource };

export type ObjectivePredicate =
  | RulesFactPredicate
  | MaterialBalancePredicate
  | { readonly type: "fenPredicate"; readonly predicate: FenPredicate }
  | { readonly type: "checkpointReached"; readonly checkpointId: string }
  | { readonly type: "checkpointReachedHere"; readonly checkpointId: string }
  | { readonly type: "outcomeReached"; readonly result: "win" | "loss" | "draw" }
  | {
      readonly type: "deviationPlayed";
      readonly fromTransposeKey: string;
      readonly moveUci: string;
    }
  | { readonly type: "nodePly"; readonly ply: number }
  | {
      readonly type: "outsideAuthoredBoundary";
      readonly plyHorizon?: number;
      readonly spineTransposeKeys: readonly string[];
      readonly fenPredicates: readonly FenPredicate[];
    }
  | {
      readonly type: "timingWindow" | "authoredTimingWindow";
      readonly window: TimingWindowDefinition;
      readonly learner: Color;
      readonly verdict: TempoVerdict;
      readonly openingTrigger?: ObjectivePredicate;
    }
  | { readonly type: "transitionFeature" | "authoredTransitionFeature"; readonly transition: TransitionExpression }
  | {
      readonly type: "all" | "any";
      readonly predicates: readonly [ObjectivePredicate, ...ObjectivePredicate[]];
    }
  | { readonly type: "not"; readonly predicate: ObjectivePredicate };

export interface ObjectiveTransitionRule {
  readonly id: string;
  readonly from: ObjectiveState;
  readonly to: ObjectiveState;
  readonly when: ObjectivePredicate;
  readonly evidenceRefs: readonly [string, ...string[]];
}

export interface ObjectiveEvaluationResult extends MutationResult {
  readonly matchedRuleId: string | null;
}

export interface ObjectiveEvidenceRequest {
  readonly runId: string;
  readonly packId: string;
  readonly packDigest: string;
  readonly nodeId: string;
  readonly fen: string;
  readonly objectiveState: ObjectiveState;
  readonly evidenceRefs: readonly string[];
  readonly policyConfig: PolicyConfig;
}

export interface ObjectiveEvidenceProposal {
  readonly nodeId: string;
  readonly from: ObjectiveState;
  readonly to: ObjectiveState;
  readonly evidenceRefs: readonly [string, ...string[]];
}

export interface ObjectiveEvidenceUpgrader {
  evaluate(
    request: ObjectiveEvidenceRequest,
  ): Promise<ObjectiveEvidenceProposal | null>;
}

function activeNode(run: DrillRun): Node {
  const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId);
  if (!node) throw unknownNode(run.activeCursor.nodeId);
  return node;
}

function materialScore(fen: string, color: Color): number {
  const position = positionFromFen(fen);
  let score = 0;
  for (const [role, value] of Object.entries(MATERIAL_VALUES) as [Role, number][]) {
    score += position.board[role].intersect(position.board[color]).size() * value;
  }
  return score;
}

export function materialBalance(run: DrillRun, perspective: Color): number {
  const node = activeNode(run);
  return materialBalanceAt(node.fen, perspective);
}

export function materialBalanceAt(fen: string, perspective: Color): number {
  const own = materialScore(fen, perspective);
  const other = materialScore(fen, opposite(perspective));
  return own - other;
}

function squareSetMatches(
  actual: ReadonlySet<SquareName>,
  expected: readonly SquareName[],
  mode: "contains" | "exact",
): boolean {
  const required = new Set(expected);
  if (mode === "exact" && actual.size !== required.size) return false;
  return [...required].every((square) => actual.has(square));
}

function matchesFenPredicate(node: Node, predicate: FenPredicate, purpose: "authoring" | "objective" = "objective"): boolean {
  switch (predicate.type) {
    case "transposeKey": return node.transposeKey === predicate.value;
    case "pieceOnSquare": {
      const position = positionFromFen(node.fen);
      const square = parseSquare(predicate.square);
      if (square === undefined) return false;
      const actual = position.board.get(square);
      if (predicate.piece === null) return actual === undefined;
      return actual?.color === predicate.piece.color && actual.role === predicate.piece.role;
    }
    case "pawnStructure": {
      const position = positionFromFen(node.fen);
      const pawns = (color: Color): ReadonlySet<SquareName> => new Set(
        [...position.board.pawn.intersect(position.board[color])].map(makeSquare),
      );
      return squareSetMatches(pawns("white"), predicate.white, predicate.mode) && squareSetMatches(pawns("black"), predicate.black, predicate.mode);
    }
    case "structuralFeature": {
      if (predicate.authoredSource === undefined) return matchesStructuralExpression(node.fen, predicate.feature);
      if (requireCurrentStructuralExpression(predicate.feature) !== predicate.authoredSource) throw new AuthoredStructuralSourceError("Objective expression differs from its original authenticated source identity");
      const declared = declareCurrentStructuralPredicateEvidence(node.fen, predicate.authoredSource, "predicate", purpose);
      if (declared.kind !== "available") throw new AuthoredStructuralSourceError(`Objective structural source unavailable: ${declared.reason}`);
      return declared.value.payload.observation.matched;
    }
    default: {
      const exhaustive: never = predicate;
      throw new TypeError(`Unhandled fen predicate: ${JSON.stringify(exhaustive)}`);
    }
  }
}

function pathToNode(run: DrillRun, node: Node): readonly Node[] {
  const reversed: Node[] = [];
  let cursor: Node | undefined = node;
  while (cursor) {
    reversed.push(cursor);
    cursor =
      cursor.parentId === null
        ? undefined
        : run.nodes.find((candidate) => candidate.id === cursor?.parentId);
  }
  return reversed.reverse();
}

function checkpointWasReached(run: DrillRun, node: Node, checkpointId: string): boolean {
  const pathNodeIds = new Set(pathToNode(run, node).map((pathNode) => pathNode.id));
  return run.events.some(
    (event) =>
      event.type === "checkpoint.reached" &&
      event.data.checkpointId === checkpointId &&
      pathNodeIds.has(event.data.nodeId),
  );
}

function drawIsAvailable(run: DrillRun, node: Node): boolean {
  const position = positionFromFen(node.fen);
  if (position.isStalemate() || position.isInsufficientMaterial()) return true;
  if (position.halfmoves >= 100) return true;
  return pathToNode(run, node).filter(
    (pathNode) => pathNode.transposeKey === node.transposeKey,
  ).length >= 3;
}

export function evaluateObjectivePredicate(
  run: DrillRun,
  predicate: ObjectivePredicate,
  purpose: "authoring" | "objective" = "objective",
): boolean {
  if (purpose !== "authoring" && purpose !== "objective") throw new TypeError("Unknown objective operation");
  const node = activeNode(run);

  switch (predicate.type) {
    case "rulesFact": {
      const position = positionFromFen(node.fen);
      if (predicate.fact === "checkmate") {
        return (
          position.isCheckmate() &&
          (predicate.winner === undefined || predicate.winner === opposite(position.turn))
        );
      }
      if (predicate.fact === "stalemate") return position.isStalemate();
      return drawIsAvailable(run, node);
    }
    case "materialBalance": {
      const balance = materialBalance(run, predicate.perspective);
      if (predicate.comparison === "atLeast") return balance >= predicate.value;
      if (predicate.comparison === "atMost") return balance <= predicate.value;
      return balance === predicate.value;
    }
    case "fenPredicate":
      return matchesFenPredicate(node, predicate.predicate, purpose);
    case "checkpointReached":
      return checkpointWasReached(run, node, predicate.checkpointId);
    case "checkpointReachedHere":
      return run.events.some(
        (event) =>
          event.type === "checkpoint.reached" &&
          event.data.checkpointId === predicate.checkpointId &&
          event.data.nodeId === node.id,
      );
    case "outcomeReached": {
      const pathNodeIds = new Set(pathToNode(run, node).map((pathNode) => pathNode.id));
      return run.events.some(
        (event) =>
          event.type === "outcome.reached" &&
          event.data.outcome === predicate.result &&
          pathNodeIds.has(event.data.nodeId),
      );
    }
    case "deviationPlayed": {
      if (node.parentId === null || node.moveUci === null) return false;
      const parent = run.nodes.find((candidate) => candidate.id === node.parentId);
      return parent?.transposeKey === predicate.fromTransposeKey &&
        node.moveUci === exactMoveIdentity(parent.fen, predicate.moveUci);
    }
    case "nodePly":
      return node.ply === predicate.ply;
    case "outsideAuthoredBoundary": {
      if (node.parentId === null) return false;
      if (predicate.plyHorizon !== undefined && node.ply > predicate.plyHorizon) return true;
      if (predicate.spineTransposeKeys.includes(node.transposeKey)) return false;
      return !predicate.fenPredicates.some((fenPredicate) =>
        matchesFenPredicate(node, fenPredicate, purpose),
      );
    }
    case "timingWindow":
    case "authoredTimingWindow": {
      if (predicate.type === "authoredTimingWindow") {
        preflightCurrentAuthoredOperation(purpose);
        assertCurrentWindowSources([predicate.window]);
        if (predicate.openingTrigger !== undefined) assertCurrentObjectiveSources(predicate.openingTrigger);
      }
      const path = tempoMovesFromRun(run, node.id);
      const state = (predicate.type === "authoredTimingWindow" ? currentWindowStates : windowStates)(
        [predicate.window],
        path,
        predicate.learner,
        predicate.openingTrigger === undefined
          ? undefined
          : (_trigger, index) => {
              const pathNodeId = path[index]?.nodeId;
              if (pathNodeId === undefined) return false;
              return evaluateObjectivePredicate(
                { ...run, activeCursor: { ...run.activeCursor, nodeId: pathNodeId } },
                predicate.openingTrigger!,
                purpose,
              );
            },
        purpose,
      )[0];
      return state?.verdict === predicate.verdict;
    }
    case "transitionFeature":
    case "authoredTransitionFeature": {
      if (predicate.type === "authoredTransitionFeature") { preflightCurrentAuthoredOperation(purpose); assertCurrentTransitionSources(predicate.transition); }
      if (node.parentId === null || node.moveUci === null) return false;
      const parent = run.nodes.find((candidate) => candidate.id === node.parentId);
      return parent === undefined
        ? false
        : (predicate.type === "authoredTransitionFeature" ? matchesCurrentTransitionExpression : matchesTransitionExpression)(parent.fen, node.moveUci, node.fen, predicate.transition, purpose);
    }
    case "all":
      return predicate.predicates.every((child) => evaluateObjectivePredicate(run, child, purpose));
    case "any":
      return predicate.predicates.some((child) => evaluateObjectivePredicate(run, child, purpose));
    case "not":
      return !evaluateObjectivePredicate(run, predicate.predicate, purpose);
    default: {
      const exhaustive: never = predicate;
      throw new TypeError(`Unhandled objective predicate: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** Source-only preflight of a compiled trigger, including boundary arms an early exit can skip. */
export function assertCurrentObjectiveSources(predicate: ObjectivePredicate): void {
  const check = (value: FenPredicate) => {
    if (value.type === "structuralFeature" && requireCurrentStructuralExpression(value.feature) !== value.authoredSource)
      throw new AuthoredStructuralSourceError("Compiled trigger lost its original authored source identity");
  };
  if (predicate.type === "fenPredicate") check(predicate.predicate);
  else if (predicate.type === "outsideAuthoredBoundary") predicate.fenPredicates.forEach(check);
  else if (predicate.type === "all" || predicate.type === "any") predicate.predicates.forEach(assertCurrentObjectiveSources);
  else if (predicate.type === "not") assertCurrentObjectiveSources(predicate.predicate);
  else if (predicate.type === "authoredTransitionFeature") assertCurrentTransitionSources(predicate.transition);
  else if (predicate.type === "authoredTimingWindow") {
    assertCurrentWindowSources([predicate.window]);
    if (predicate.openingTrigger !== undefined) assertCurrentObjectiveSources(predicate.openingTrigger);
  }
}

export function transitionObjective(
  run: DrillRun,
  to: ObjectiveState,
  evidenceRefs: readonly string[],
  at = new Date().toISOString(),
): MutationResult {
  const node = activeNode(run);
  assertObjectiveTransition(node.objectiveState, to, evidenceRefs);
  const next = appendEvents(run, [
    {
      type: "objective.state_changed",
      at,
      data: {
        nodeId: node.id,
        from: node.objectiveState,
        to,
        evidenceRefs,
      },
    },
  ]);
  return { run: next, emitted: next.events.slice(run.events.length) };
}

export function applyObjectiveEvidenceProposal(
  run: DrillRun,
  proposal: ObjectiveEvidenceProposal,
  at = new Date().toISOString(),
): MutationResult {
  const node = run.nodes.find((candidate) => candidate.id === proposal.nodeId);
  if (!node) throw unknownNode(proposal.nodeId);
  if (node.objectiveState !== proposal.from) {
    throw new TypeError(
      `Objective proposal expected ${proposal.from}, node has ${node.objectiveState}`,
    );
  }
  assertObjectiveTransition(proposal.from, proposal.to, proposal.evidenceRefs);
  const next = appendEvents(run, [
    {
      type: "objective.state_changed",
      at,
      data: {
        nodeId: proposal.nodeId,
        from: proposal.from,
        to: proposal.to,
        evidenceRefs: proposal.evidenceRefs,
      },
    },
  ]);
  return { run: next, emitted: next.events.slice(run.events.length) };
}

export function evaluateObjective(
  run: DrillRun,
  rules: readonly ObjectiveTransitionRule[],
  at?: string,
): ObjectiveEvaluationResult {
  const node = activeNode(run);
  const rule = rules.find(
    (candidate) =>
      candidate.from === node.objectiveState &&
      evaluateObjectivePredicate(run, candidate.when),
  );
  if (!rule) return { run, emitted: [], matchedRuleId: null };

  const result = transitionObjective(run, rule.to, rule.evidenceRefs, at);
  return { ...result, matchedRuleId: rule.id };
}

export function requestObjectiveEvidence(
  run: DrillRun,
  upgrader: ObjectiveEvidenceUpgrader,
): Promise<ObjectiveEvidenceProposal | null> {
  if (run.packId === null || run.packDigest === null) {
    throw new RuntimeError(
      "INVALID_RUN_SESSION",
      "Objective evidence requires a pack session",
    );
  }
  const node = activeNode(run);
  const request: ObjectiveEvidenceRequest = Object.freeze({
    runId: run.id,
    packId: run.packId,
    packDigest: run.packDigest,
    nodeId: node.id,
    fen: node.fen,
    objectiveState: node.objectiveState,
    evidenceRefs: node.evidenceRefs,
    policyConfig: run.policyConfig,
  });
  return upgrader.evaluate(request);
}
