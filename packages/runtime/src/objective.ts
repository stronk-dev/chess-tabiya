import type { Color, Role, SquareName } from "chessops/types";
import { makeSquare, opposite, parseSquare } from "chessops/util";

import { positionFromFen } from "./chess.js";
import { unknownNode } from "./errors.js";
import { appendEvents } from "./events.js";
import { assertObjectiveTransition } from "./objective-state.js";
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
    };

export type ObjectivePredicate =
  | RulesFactPredicate
  | MaterialBalancePredicate
  | { readonly type: "fenPredicate"; readonly predicate: FenPredicate }
  | { readonly type: "checkpointReached"; readonly checkpointId: string }
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

function materialScore(node: Node, color: Color): number {
  const position = positionFromFen(node.fen);
  let score = 0;
  for (const [role, value] of Object.entries(MATERIAL_VALUES) as [Role, number][]) {
    score += position.board[role].intersect(position.board[color]).size() * value;
  }
  return score;
}

export function materialBalance(run: DrillRun, perspective: Color): number {
  const node = activeNode(run);
  const own = materialScore(node, perspective);
  const other = materialScore(node, opposite(perspective));
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

function matchesFenPredicate(node: Node, predicate: FenPredicate): boolean {
  if (predicate.type === "transposeKey") return node.transposeKey === predicate.value;

  const position = positionFromFen(node.fen);
  if (predicate.type === "pieceOnSquare") {
    const square = parseSquare(predicate.square);
    if (square === undefined) return false;
    const actual = position.board.get(square);
    if (predicate.piece === null) return actual === undefined;
    return actual?.color === predicate.piece.color && actual.role === predicate.piece.role;
  }

  const pawns = (color: Color): ReadonlySet<SquareName> =>
    new Set(
      [...position.board.pawn.intersect(position.board[color])].map((square) =>
        makeSquare(square),
      ),
    );
  return (
    squareSetMatches(pawns("white"), predicate.white, predicate.mode) &&
    squareSetMatches(pawns("black"), predicate.black, predicate.mode)
  );
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
): boolean {
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
      return matchesFenPredicate(node, predicate.predicate);
    case "checkpointReached":
      return checkpointWasReached(run, node, predicate.checkpointId);
    case "all":
      return predicate.predicates.every((child) => evaluateObjectivePredicate(run, child));
    case "any":
      return predicate.predicates.some((child) => evaluateObjectivePredicate(run, child));
    case "not":
      return !evaluateObjectivePredicate(run, predicate.predicate);
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
