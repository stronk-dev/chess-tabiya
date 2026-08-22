import { normalizeMove } from "chessops/chess";
import { attacks, between } from "chessops/attacks";
import { makeFen } from "chessops/fen";
import type { Move, NormalMove, Piece, Role, Square, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { legalCaptureMovesTo, legalExchangeForMove, type LegalExchangeResult } from "./exchange.js";

const PROMOTIONS: readonly Role[] = Object.freeze(["queen", "rook", "bishop", "knight"]);
export const THREAT_CONVENTION = "threat@1" as const;
export const REPLY_HORIZON = "1 reply" as const;

function legalMoves(position: ReturnType<typeof positionFromFen>): readonly NormalMove[] {
  const result: NormalMove[] = [];
  for (const [from, destinations] of position.allDests()) {
    for (const to of destinations) {
      const roles: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
        ? PROMOTIONS
        : [undefined];
      for (const promotion of roles) {
        const move: NormalMove = promotion === undefined ? { from, to } : { from, to, promotion };
        if (position.isLegal(move)) result.push(move);
      }
    }
  }
  return Object.freeze(result.sort((left, right) => makeUci(left).localeCompare(makeUci(right))));
}

function played(position: ReturnType<typeof positionFromFen>, moveUci: string): NormalMove {
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid move UCI ${moveUci}`);
  const move = normalizeMove(position, parsed);
  if (!("from" in move) || !position.isLegal(move)) throw new TypeError(`Illegal move UCI ${moveUci}`);
  return move;
}

export interface ReplyBreadth {
  readonly triggeringMove: string;
  readonly afterFen: string;
  readonly terminal: boolean;
  readonly check: boolean;
  readonly replies: readonly string[];
  readonly count: number;
  readonly horizon: typeof REPLY_HORIZON;
}

export function replyBreadth(beforeFen: string, triggeringMove: string): ReplyBreadth {
  const position = positionFromFen(beforeFen);
  const move = played(position, triggeringMove);
  position.play(move);
  const replies = Object.freeze(legalMoves(position).map(makeUci));
  return Object.freeze({
    triggeringMove: makeUci(move),
    afterFen: canonicalFen(position),
    terminal: replies.length === 0,
    check: position.isCheck(),
    replies,
    count: replies.length,
    horizon: REPLY_HORIZON,
  });
}

export interface CheckEvent {
  readonly triggeringMove: string;
  readonly checkingPieces: readonly { readonly piece: Piece; readonly square: SquareName }[];
  readonly checkedKing: { readonly piece: Piece; readonly square: SquareName };
  readonly attackSquares: readonly SquareName[];
  readonly rays: readonly { readonly from: SquareName; readonly through: readonly SquareName[]; readonly to: SquareName }[];
}

export function checkEvent(beforeFen: string, triggeringMove: string): CheckEvent | undefined {
  const position = positionFromFen(beforeFen);
  const move = played(position, triggeringMove);
  position.play(move);
  if (!position.isCheck()) return undefined;
  const kingSquare = position.board.kingOf(position.turn);
  if (kingSquare === undefined) return undefined;
  const checkerColor = opposite(position.turn);
  const checkingPieces: { piece: Piece; square: SquareName }[] = [];
  const attackSquares = new Set<SquareName>([makeSquare(kingSquare)]);
  const rays: { from: SquareName; through: readonly SquareName[]; to: SquareName }[] = [];
  for (const [square, piece] of position.board) {
    if (piece.color !== checkerColor || !attacks(piece, square, position.board.occupied).has(kingSquare)) continue;
    checkingPieces.push({ piece, square: makeSquare(square) });
    const span = [...between(square, kingSquare)].map(makeSquare);
    for (const value of span) attackSquares.add(value);
    if (span.length > 0) rays.push({ from: makeSquare(square), through: Object.freeze(span), to: makeSquare(kingSquare) });
  }
  return Object.freeze({
    triggeringMove: makeUci(move),
    checkingPieces: Object.freeze(checkingPieces.sort((a, b) => a.square.localeCompare(b.square))),
    checkedKing: Object.freeze({ piece: position.board.get(kingSquare)!, square: makeSquare(kingSquare) }),
    attackSquares: Object.freeze([...attackSquares].sort()),
    rays: Object.freeze(rays.sort((a, b) => a.from.localeCompare(b.from))),
  });
}

export interface DoubleAttackTarget {
  readonly square: SquareName;
  readonly occupant: Piece;
  readonly king: boolean;
  readonly captureUci?: string;
  readonly exchange?: LegalExchangeResult;
}

export interface DoubleAttackEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly mover: { readonly piece: Piece; readonly before: SquareName; readonly after: SquareName };
  readonly targets: readonly DoubleAttackTarget[];
}

export function doubleAttackEvent(beforeFen: string, moveUci: string): DoubleAttackEvent | undefined {
  const before = positionFromFen(beforeFen);
  const move = played(before, moveUci);
  const mover = before.board.get(move.from)!;
  before.play(move);
  const after = before;
  const movedPiece = after.board.get(move.to);
  if (movedPiece === undefined || movedPiece.color !== mover.color) return undefined;
  const capturePosition = after.clone();
  capturePosition.turn = mover.color;
  capturePosition.epSquare = undefined;
  const targets: DoubleAttackTarget[] = [];
  for (const target of attacks(movedPiece, move.to, after.board.occupied).intersect(after.board[opposite(movedPiece.color)])) {
    const occupant = after.board.get(target)!;
    if (occupant.role === "king") {
      targets.push({ square: makeSquare(target), occupant, king: true });
      continue;
    }
    const capture = legalCaptureMovesTo(capturePosition, target, move.to)[0];
    if (capture === undefined) continue;
    const exchange = legalExchangeForMove(capturePosition, capture);
    if (exchange !== undefined && exchange.resultUnits > 0) targets.push({ square: makeSquare(target), occupant, king: false, captureUci: makeUci(capture), exchange });
  }
  if (targets.length < 2) return undefined;
  return Object.freeze({
    beforeFen: makeFen(positionFromFen(beforeFen).toSetup()),
    moveUci: makeUci(move),
    afterFen: canonicalFen(after),
    mover: Object.freeze({ piece: mover, before: makeSquare(move.from), after: makeSquare(move.to) }),
    targets: Object.freeze(targets.sort((left, right) => left.square.localeCompare(right.square))),
  });
}

export interface ForkSurvivalResult {
  readonly matched: boolean;
  readonly doubleAttack: DoubleAttackEvent;
  readonly replyBreadth: ReplyBreadth;
  readonly refutingReplies: readonly string[];
}

export function forkSurvivesReply(event: DoubleAttackEvent, breadth: ReplyBreadth): ForkSurvivalResult {
  if (event.afterFen !== breadth.afterFen || event.moveUci !== breadth.triggeringMove) throw new TypeError("Fork and reply-breadth anchors differ");
  const targetKeys = new Set(event.targets.map((target) => `${target.square}:${target.occupant.color}:${target.occupant.role}`));
  const refutingReplies: string[] = [];
  for (const replyUci of breadth.replies) {
    const position = positionFromFen(event.afterFen);
    const reply = played(position, replyUci);
    position.play(reply);
    const movedSquare = parseUci(event.moveUci)! as NormalMove;
    const forker = position.board.get(movedSquare.to);
    const survives = forker?.color === event.mover.piece.color && forker.role === event.mover.piece.role;
    const retainsCapture = survives && event.targets.some((target) => {
      const occupant = position.board.get(("abcdefgh".indexOf(target.square[0]!) + (Number(target.square[1]) - 1) * 8) as Square);
      if (occupant === undefined || !targetKeys.has(`${target.square}:${occupant.color}:${occupant.role}`) || occupant.role === "king") return false;
      const targetSquare = ("abcdefgh".indexOf(target.square[0]!) + (Number(target.square[1]) - 1) * 8) as Square;
      return legalCaptureMovesTo(position, targetSquare, movedSquare.to).some((capture) => (legalExchangeForMove(position, capture)?.resultUnits ?? 0) > 0);
    });
    if (!retainsCapture) refutingReplies.push(replyUci);
  }
  return Object.freeze({ matched: refutingReplies.length === 0, doubleAttack: event, replyBreadth: breadth, refutingReplies: Object.freeze(refutingReplies) });
}

export type ThreatResult =
  | { readonly kind: "abstained"; readonly reason: "pass_while_in_check"; readonly conventionId: typeof THREAT_CONVENTION }
  | { readonly kind: "threats"; readonly conventionId: typeof THREAT_CONVENTION; readonly threats: readonly Threat[] };

export interface Threat {
  readonly threateningPiece: { readonly piece: Piece; readonly square: SquareName };
  readonly target?: { readonly piece: Piece; readonly square: SquareName };
  readonly threatenedMove: string;
  readonly exchange?: LegalExchangeResult;
  readonly mate: boolean;
}

export function threats(fen: string): ThreatResult {
  const position = positionFromFen(fen);
  if (position.isCheck()) return Object.freeze({ kind: "abstained", reason: "pass_while_in_check", conventionId: THREAT_CONVENTION });
  position.turn = opposite(position.turn);
  position.epSquare = undefined;
  const values: Threat[] = [];
  for (const move of legalMoves(position)) {
    const mover = position.board.get(move.from)!;
    const exchange = legalExchangeForMove(position, move);
    const next = position.clone();
    next.play(move);
    const mate = next.isCheckmate();
    if (!mate && (exchange?.resultUnits ?? 0) <= 0) continue;
    const captured = exchange?.captured;
    values.push(Object.freeze({
      threateningPiece: Object.freeze({ piece: mover, square: makeSquare(move.from) }),
      ...(captured === undefined ? {} : { target: Object.freeze({ piece: { color: captured.color, role: captured.role }, square: captured.square }) }),
      threatenedMove: makeUci(move),
      ...(exchange === undefined ? {} : { exchange }),
      mate,
    }));
  }
  return Object.freeze({ kind: "threats", conventionId: THREAT_CONVENTION, threats: Object.freeze(values) });
}
