/** Disposable D1716 legal-exchange@1 reference, not a collector or chess judgement.
 * External Chessops supplies legal moves/positions only. Expected risk uses a separate
 * whole-board material minimax over same-landing-square recaptures, with the disclosed
 * optional stop at each node. No production tactics/exchange/lineage output is an oracle.
 */
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import type { Color, NormalMove, Role, Square } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import type { SubjectOutcomePopulation } from "../../packages/runtime/src/semantic-subject-types.js";
import type { ControlLiteralPopulation } from "./direct-control-reference.js";
import { referenceRetainedPieces, retainedReferenceInput } from "./retained-piece-reference.js";

// These are the explicitly declared product convention's units, not engine evaluations.
const units: Readonly<Record<Role, number>> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
const opposite = (color: Color): Color => color === "white" ? "black" : "white";
const square = (at: number) => `${String.fromCharCode(97 + at % 8)}${1 + Math.floor(at / 8)}`;

function legalMoves(position: Chess): readonly NormalMove[] {
  const moves: NormalMove[] = [];
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    const promotions = position.board.get(from)?.role === "pawn" && (to < 8 || to >= 56)
      ? ["bishop", "knight", "queen", "rook"] as const : [undefined];
    for (const promotion of promotions) moves.push({ from, to, ...(promotion === undefined ? {} : { promotion }) });
  }
  return moves;
}

function capturedSquare(position: Chess, move: NormalMove): Square | undefined {
  const mover = position.board.get(move.from), target = position.board.get(move.to);
  if (mover === undefined) throw Error("Legal reference move has no mover");
  if (target !== undefined && target.color !== mover.color) return move.to;
  if (mover.role === "pawn" && move.from % 8 !== move.to % 8 && target === undefined && position.epSquare === move.to) {
    const at = (Math.floor(move.from / 8) * 8 + move.to % 8) as Square, victim = position.board.get(at);
    if (victim?.role !== "pawn" || victim.color === mover.color) throw Error("Missing legal EP victim");
    return at;
  }
  return undefined;
}

function materialBalance(position: Chess, perspective: Color) {
  let balance = 0;
  for (const at of position.board.occupied) {
    const piece = position.board.get(at)!;
    balance += (piece.color === perspective ? 1 : -1) * units[piece.role];
  }
  return balance;
}

// Complete finite tree: each edge captures one piece. Unlike the production incremental
// capture-delta recurrence, this oracle recomputes whole-board balances at every node.
function bestBalance(position: Chess, landing: Square, perspective: Color): number {
  let best = materialBalance(position, perspective); // Optional stop, even in check, by convention.
  for (const move of legalMoves(position)) {
    if (move.to !== landing || capturedSquare(position, move) === undefined) continue;
    const child = position.clone(); child.play(move);
    const value = bestBalance(child, landing, perspective);
    best = position.turn === perspective ? Math.max(best, value) : Math.min(best, value);
  }
  return best;
}

function captureUnits(position: Chess, move: NormalMove): number {
  const perspective = position.turn, baseline = materialBalance(position, perspective);
  const child = position.clone(); child.play(move);
  return bestBalance(child, move.to, perspective) - baseline;
}

export function referenceExchangeUnits(fen: string, moveUci: string): number | undefined {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap(), move = parseUci(moveUci);
  if (move === undefined || !("from" in move) || !position.isLegal(move) || capturedSquare(position, move) === undefined) return undefined;
  return captureUnits(position, move);
}

/** Turn cloning is attempted before the domain can be empty. Root EP is cleared when
 * changing the turn; genuine child EP stays, and its victim is not its landing square.
 */
export function referenceRiskCaptures(fen: string, victimColor: Color) {
  const original = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  let clone = original;
  if (original.turn !== opposite(victimColor)) {
    const turned = Chess.fromSetup({ ...original.toSetup(), turn: opposite(victimColor), epSquare: undefined });
    if (!turned.isOk) return undefined;
    clone = turned.value;
  }
  return legalMoves(clone).flatMap(move => {
    const victim = capturedSquare(clone, move);
    return victim === undefined ? [] : [{ moveUci: makeUci(move), victimSquare: square(victim), landingSquare: square(move.to), resultUnits: captureUnits(clone, move) }];
  });
}

export function referenceRiskStates(rootFen: string, afterFen = rootFen, move: string | null = null) {
  const actor: Color = rootFen.split(" ")[1] === "w" ? "white" : "black";
  const captures = referenceRiskCaptures(afterFen, actor);
  if (captures === undefined) return undefined;
  return referenceRetainedPieces(rootFen, afterFen, move).flatMap(({ root, current }) => {
    if (root.color !== actor || root.role === "king") return [];
    if (current === null) throw Error("An own non-king piece cannot disappear in its own legal move");
    return [{ subject: { kind: "loose_piece" as const, root }, parameters: {},
      state: { kind: "present" as const, value: captures.some(capture => capture.victimSquare === current.square && capture.resultUnits > 0), current } }];
  });
}
const relation = (before: boolean, after: boolean) => before ? after ? "true_to_true" : "true_to_false" : after ? "false_to_true" : "false_to_false";

export function referenceRiskPopulation(row: ControlLiteralPopulation, move: string): SubjectOutcomePopulation<"loose_piece"> | undefined {
  const { population } = retainedReferenceInput("loose_piece", row, move), root = referenceRiskStates(row.root);
  const played = referenceRiskStates(row.root, population.played.afterFen, move);
  const alternatives = population.alternatives.filter(edge => edge.moveUci !== move)
    .map(edge => ({ moveUci: edge.moveUci, states: referenceRiskStates(row.root, edge.afterFen, edge.moveUci) }));
  if (root === undefined || played === undefined || alternatives.some(edge => edge.states === undefined)) return undefined;
  return { family: "loose_piece", beforeFen: row.root, moveUci: move, afterFen: population.played.afterFen,
    actor: row.root.split(" ")[1] === "w" ? "white" : "black", subjects: root.map((origin, at) => ({
      subject: origin.subject, parameters: origin.parameters, root: origin.state, played: played[at]!.state,
      playedRelation: relation(origin.state.value, played[at]!.state.value), alternatives: alternatives.map(edge => ({
        moveUci: edge.moveUci, state: edge.states![at]!.state, relation: relation(origin.state.value, edge.states![at]!.state.value),
      })),
    })) };
}

export function referenceRiskEvents(row: ControlLiteralPopulation, move: string) {
  const population = referenceRiskPopulation(row, move);
  if (population === undefined) return undefined;
  const { subjects, ...context } = population;
  return subjects.flatMap(({ playedRelation, ...subject }) => (["false_to_true", "true_to_false", "true_to_true", "false_to_false"] as const).flatMap(alternativeRelation => {
    if (alternativeRelation === playedRelation) return [];
    const supportingMoves = subject.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
    return supportingMoves.length === 0 ? [] : [{ sign: "avoided" as const, operands: { ...context, ...subject, alternativeRelation,
      supportingMoves, legalAlternatives: subject.alternatives.length, alternativesWithOutcome: supportingMoves.length } }];
  }));
}
