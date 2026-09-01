import type { Color, Move, Role, Square } from "chessops/types";

import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { krpkrGeometry } from "../d2495-endgame-technique-applicability/geometry.js";

export type MethodTechnique = "lucena" | "philidor" | "vancura";
export type MethodStage =
  | "lucena_bridge_prepared"
  | "lucena_king_excursion_started"
  | "lucena_bridge_interposed"
  | "philidor_pawn_entered_defender_third"
  | "philidor_rear_rank_switch"
  | "philidor_rear_check_delivered"
  | "vancura_pawn_entered_seventh"
  | "vancura_rook_moved_behind";

export interface MethodStageEvent {
  readonly technique: MethodTechnique;
  readonly stage: MethodStage;
  readonly beneficiary: Color;
  readonly moveUci: string;
  readonly beforeFen: string;
  readonly afterFen: string;
}

export interface MethodPathStep {
  readonly moveUci: string;
  readonly beforeFen: string;
  readonly afterFen: string;
}

function opposite(color: Color): Color { return color === "white" ? "black" : "white"; }
function file(square: Square): number { return square & 7; }
function boardRank(square: Square): number { return (square >> 3) + 1; }
function rankFor(color: Color, square: Square): number { return color === "white" ? boardRank(square) : 9 - boardRank(square); }

function parseSquareName(name: string): Square | undefined {
  if (!/^[a-h][1-8]$/.test(name)) return undefined;
  return ((name.charCodeAt(1) - 49) * 8 + name.charCodeAt(0) - 97) as Square;
}

export function parseMethodUci(uci: string): Move | undefined {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return undefined;
  const from = parseSquareName(uci.slice(0, 2));
  const to = parseSquareName(uci.slice(2, 4));
  if (from === undefined || to === undefined) return undefined;
  const promotion = uci[4] === undefined
    ? undefined
    : ({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[uci[4] as "q" | "r" | "b" | "n"];
  return promotion === undefined ? { from, to } : { from, to, promotion };
}

function squareOf(fen: string, color: Color, role: Role): Square | undefined {
  const squares = [...positionFromFen(fen).board.pieces(color, role)];
  return squares.length === 1 ? squares[0] : undefined;
}

function movedRole(step: MethodPathStep, color: Color, role: Role): boolean {
  const move = parseMethodUci(step.moveUci);
  if (move === undefined || !("from" in move)) return false;
  const piece = positionFromFen(step.beforeFen).board.get(move.from);
  return piece?.color === color && piece.role === role;
}

function rookInterposesCheck(step: MethodPathStep, attacker: Color): boolean {
  const defender = opposite(attacker);
  const before = positionFromFen(step.beforeFen);
  const after = positionFromFen(step.afterFen);
  if (!before.isCheck() || after.isCheck() || !movedRole(step, attacker, "rook")) return false;
  const attackerKing = squareOf(step.afterFen, attacker, "king");
  const attackerRook = squareOf(step.afterFen, attacker, "rook");
  const defenderRook = squareOf(step.afterFen, defender, "rook");
  if (attackerKing === undefined || attackerRook === undefined || defenderRook === undefined) return false;
  if (file(attackerKing) !== file(attackerRook) || file(attackerRook) !== file(defenderRook)) return false;
  const rookRank = boardRank(attackerRook);
  return rookRank > Math.min(boardRank(attackerKing), boardRank(defenderRook)) &&
    rookRank < Math.max(boardRank(attackerKing), boardRank(defenderRook));
}

export function observedMethodStages(steps: readonly MethodPathStep[]): readonly MethodStageEvent[] {
  const events: MethodStageEvent[] = [];
  let lucenaSeen = false;
  let lucenaBridgePrepared = false;
  let lucenaExcursion = false;
  let lucenaInterposed = false;
  let philidorSeen = false;
  let philidorPawnEntered = false;
  let philidorRearRank = false;
  let vancuraSeen = false;
  let vancuraPawnEntered = false;

  const emit = (technique: MethodTechnique, stage: MethodStage, beneficiary: Color, step: MethodPathStep): void => {
    events.push(Object.freeze({ technique, stage, beneficiary, ...step }));
  };

  for (const step of steps) {
    const before = krpkrGeometry(step.beforeFen);
    const after = krpkrGeometry(step.afterFen);
    if (before === null || after === null || before.attacker !== after.attacker) continue;
    const attacker = before.attacker;
    const defender = opposite(attacker);
    lucenaSeen ||= before.lucenaCanonicalSetup;
    philidorSeen ||= before.philidorCanonicalSetup;
    vancuraSeen ||= before.vancuraCanonicalSetup;

    const afterAttackerRook = squareOf(step.afterFen, attacker, "rook");
    if (lucenaSeen && !lucenaBridgePrepared && movedRole(step, attacker, "rook") &&
        afterAttackerRook !== undefined && rankFor(attacker, afterAttackerRook) === 4 &&
        after.pawnRank === 7 && after.attackerKingOnPromotionSquare) {
      lucenaBridgePrepared = true;
      emit("lucena", "lucena_bridge_prepared", attacker, step);
    }
    if (lucenaBridgePrepared && !lucenaExcursion && movedRole(step, attacker, "king") &&
        before.attackerKingOnPromotionSquare && !after.attackerKingOnPromotionSquare) {
      lucenaExcursion = true;
      emit("lucena", "lucena_king_excursion_started", attacker, step);
    }
    if (lucenaExcursion && !lucenaInterposed && rookInterposesCheck(step, attacker)) {
      lucenaInterposed = true;
      emit("lucena", "lucena_bridge_interposed", attacker, step);
    }

    if (philidorSeen && !philidorPawnEntered && movedRole(step, attacker, "pawn") &&
        before.pawnRank < 6 && after.pawnRank === 6) {
      philidorPawnEntered = true;
      emit("philidor", "philidor_pawn_entered_defender_third", defender, step);
    }
    const beforeDefenderRook = squareOf(step.beforeFen, defender, "rook");
    const afterDefenderRook = squareOf(step.afterFen, defender, "rook");
    if (philidorPawnEntered && !philidorRearRank && movedRole(step, defender, "rook") &&
        beforeDefenderRook !== undefined && afterDefenderRook !== undefined &&
        rankFor(defender, beforeDefenderRook) === 3 && rankFor(attacker, afterDefenderRook) === 1) {
      philidorRearRank = true;
      emit("philidor", "philidor_rear_rank_switch", defender, step);
    }
    if (philidorRearRank && movedRole(step, defender, "rook") && positionFromFen(step.afterFen).isCheck()) {
      emit("philidor", "philidor_rear_check_delivered", defender, step);
      philidorRearRank = false;
    }

    if (vancuraSeen && !vancuraPawnEntered && movedRole(step, attacker, "pawn") &&
        before.pawnRank <= 6 && after.pawnRank === 7) {
      vancuraPawnEntered = true;
      emit("vancura", "vancura_pawn_entered_seventh", defender, step);
    }
    if (vancuraPawnEntered && movedRole(step, defender, "rook") && afterDefenderRook !== undefined &&
        file(afterDefenderRook) === after.pawnFile && rankFor(attacker, afterDefenderRook) < after.pawnRank) {
      emit("vancura", "vancura_rook_moved_behind", defender, step);
      vancuraPawnEntered = false;
    }
  }
  return Object.freeze(events);
}

export interface ReachabilityNode {
  readonly target?: boolean;
  readonly turn: "beneficiary" | "opponent";
  readonly children?: readonly ReachabilityNode[];
}

export interface ReachabilityReading {
  readonly possible: boolean;
  readonly forceable: boolean;
  readonly inevitable: boolean;
}

export function boundedReachability(root: ReachabilityNode, remainingPlies: number): ReachabilityReading {
  if (root.target === true) return Object.freeze({ possible: true, forceable: true, inevitable: true });
  if (remainingPlies <= 0 || (root.children?.length ?? 0) === 0) return Object.freeze({ possible: false, forceable: false, inevitable: false });
  const children = root.children!.map((child) => boundedReachability(child, remainingPlies - 1));
  return Object.freeze({
    possible: children.some((child) => child.possible),
    forceable: root.turn === "beneficiary"
      ? children.some((child) => child.forceable)
      : children.every((child) => child.forceable),
    inevitable: children.every((child) => child.inevitable),
  });
}
