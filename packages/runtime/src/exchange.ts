import { makeFen } from "chessops/fen";
import type { Chess } from "chessops/chess";
import type { Color, Move, NormalMove, Piece, Role, Square, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseUci } from "chessops/util";

import { positionFromFen } from "./chess.js";

export const LEGAL_EXCHANGE_CONVENTION = "legal-exchange@1" as const;

export const EXCHANGE_PIECE_VALUES: Readonly<Record<Role, number>> = Object.freeze({
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
});

export interface ExchangePieceIdentity {
  readonly color: Color;
  readonly role: Role;
  readonly square: SquareName;
}

export interface LegalExchangeStep {
  readonly moveUci: string;
  readonly mover: ExchangePieceIdentity;
  readonly captured: ExchangePieceIdentity;
  readonly from: SquareName;
  readonly to: SquareName;
  readonly promotion?: Role;
  readonly delta: number;
}

export interface LegalExchangeBranch {
  readonly step: LegalExchangeStep;
  readonly continuation: readonly LegalExchangeBranch[];
  readonly resultUnits: number;
  readonly chosen: boolean;
}

export interface LegalExchangeResult {
  readonly beforeFen: string;
  readonly captureUci: string;
  readonly landingSquare: SquareName;
  readonly capturer: ExchangePieceIdentity;
  readonly captured: ExchangePieceIdentity;
  readonly branches: readonly LegalExchangeBranch[];
  readonly chosenLine: readonly LegalExchangeStep[];
  readonly stopDecisions: readonly { readonly ply: number; readonly color: Color; readonly stopped: boolean }[];
  readonly conventionId: typeof LEGAL_EXCHANGE_CONVENTION;
  readonly resultUnits: number;
}

const PROMOTIONS: readonly Role[] = Object.freeze(["queen", "rook", "bishop", "knight"]);

function pieceIdentity(piece: Piece, square: Square): ExchangePieceIdentity {
  return Object.freeze({ color: piece.color, role: piece.role, square: makeSquare(square) });
}

export function exchangeCaptureAt(position: Chess, move: Move): { readonly piece: Piece; readonly square: Square } | undefined {
  if (!("from" in move)) return undefined;
  const mover = position.board.get(move.from);
  if (mover === undefined) return undefined;
  const direct = position.board.get(move.to);
  if (direct !== undefined && direct.color !== mover.color) return { piece: direct, square: move.to };
  if (mover.role === "pawn" && position.epSquare === move.to && move.from % 8 !== move.to % 8) {
    const square = (move.to + (mover.color === "white" ? -8 : 8)) as Square;
    return { piece: { color: opposite(mover.color), role: "pawn" }, square };
  }
  return undefined;
}

export function legalCaptureMovesTo(position: Chess, target: Square, fromOnly?: Square): readonly NormalMove[] {
  const moves: NormalMove[] = [];
  for (const [from, destinations] of position.allDests()) {
    if ((fromOnly !== undefined && from !== fromOnly) || !destinations.has(target)) continue;
    const roles: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" && (target < 8 || target >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of roles) {
      const move: NormalMove = promotion === undefined ? { from, to: target } : { from, to: target, promotion };
      if (exchangeCaptureAt(position, move) !== undefined && position.isLegal(move)) moves.push(move);
    }
  }
  return Object.freeze(moves.sort((left, right) => makeUci(left).localeCompare(makeUci(right))));
}

function promotionGain(position: Chess, move: Move): number {
  if (!("from" in move) || move.promotion === undefined || position.board.getRole(move.from) !== "pawn") return 0;
  return EXCHANGE_PIECE_VALUES[move.promotion] - EXCHANGE_PIECE_VALUES.pawn;
}

interface ContinuationResult {
  readonly value: number;
  readonly branches: readonly LegalExchangeBranch[];
  readonly chosenLine: readonly LegalExchangeStep[];
  readonly stopDecisions: readonly { readonly ply: number; readonly color: Color; readonly stopped: boolean }[];
}

function continuation(position: Chess, target: Square, perspective: Color, ply: number): ContinuationResult {
  const candidates = legalCaptureMovesTo(position, target);
  let chosenValue = 0;
  let chosenIndex = -1;
  const unfinished = candidates.map((move) => {
    const mover = position.board.get(move.from)!;
    const captured = exchangeCaptureAt(position, move)!;
    const sign = position.turn === perspective ? 1 : -1;
    const delta = sign * (EXCHANGE_PIECE_VALUES[captured.piece.role] + promotionGain(position, move));
    const next = position.clone();
    next.play(move);
    const tail = continuation(next, target, perspective, ply + 1);
    const resultUnits = delta + tail.value;
    return { move, mover, captured, delta, tail, resultUnits };
  });
  for (const [index, branch] of unfinished.entries()) {
    const improves = position.turn === perspective ? branch.resultUnits > chosenValue : branch.resultUnits < chosenValue;
    if (improves) {
      chosenValue = branch.resultUnits;
      chosenIndex = index;
    }
  }
  const branches = unfinished.map((branch, index): LegalExchangeBranch => {
    const step: LegalExchangeStep = Object.freeze({
      moveUci: makeUci(branch.move),
      mover: pieceIdentity(branch.mover, branch.move.from),
      captured: pieceIdentity(branch.captured.piece, branch.captured.square),
      from: makeSquare(branch.move.from),
      to: makeSquare(branch.move.to),
      ...(branch.move.promotion === undefined ? {} : { promotion: branch.move.promotion }),
      delta: branch.delta,
    });
    return Object.freeze({ step, continuation: branch.tail.branches, resultUnits: branch.resultUnits, chosen: index === chosenIndex });
  });
  const chosen = chosenIndex < 0 ? undefined : unfinished[chosenIndex];
  const chosenStep = branches[chosenIndex]?.step;
  return Object.freeze({
    value: chosenValue,
    branches: Object.freeze(branches),
    chosenLine: Object.freeze(chosen === undefined || chosenStep === undefined ? [] : [chosenStep, ...chosen.tail.chosenLine]),
    stopDecisions: Object.freeze([
      { ply, color: position.turn, stopped: chosenIndex < 0 },
      ...(chosen?.tail.stopDecisions ?? []),
    ]),
  });
}

export function legalExchangeForMove(position: Chess, move: Move): LegalExchangeResult | undefined {
  if (!("from" in move) || !position.isLegal(move)) return undefined;
  const mover = position.board.get(move.from);
  const captured = exchangeCaptureAt(position, move);
  if (mover === undefined || captured === undefined) return undefined;
  const perspective = position.turn;
  const initial = EXCHANGE_PIECE_VALUES[captured.piece.role] + promotionGain(position, move);
  const next = position.clone();
  next.play(move);
  const tail = continuation(next, move.to, perspective, 1);
  const first: LegalExchangeStep = Object.freeze({
    moveUci: makeUci(move),
    mover: pieceIdentity(mover, move.from),
    captured: pieceIdentity(captured.piece, captured.square),
    from: makeSquare(move.from),
    to: makeSquare(move.to),
    ...(move.promotion === undefined ? {} : { promotion: move.promotion }),
    delta: initial,
  });
  return Object.freeze({
    beforeFen: makeFen(position.toSetup()),
    captureUci: makeUci(move),
    landingSquare: makeSquare(move.to),
    capturer: first.mover,
    captured: first.captured,
    branches: tail.branches,
    chosenLine: Object.freeze([first, ...tail.chosenLine]),
    stopDecisions: tail.stopDecisions,
    conventionId: LEGAL_EXCHANGE_CONVENTION,
    resultUnits: initial + tail.value,
  });
}

export function legalExchange(fen: string, captureUci: string): LegalExchangeResult | undefined {
  const position = positionFromFen(fen);
  const move = parseUci(captureUci.toLowerCase());
  return move === undefined ? undefined : legalExchangeForMove(position, move);
}

export type CaptureExchangeClass = "positive" | "negative" | "equal";

export function captureExchangeClass(result: LegalExchangeResult): CaptureExchangeClass {
  return result.resultUnits > 0 ? "positive" : result.resultUnits < 0 ? "negative" : "equal";
}
