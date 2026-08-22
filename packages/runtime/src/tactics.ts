import { normalizeMove } from "chessops/chess";
import { attacks, between } from "chessops/attacks";
import { makeFen } from "chessops/fen";
import type { Color, Move, NormalMove, Piece, Role, Square, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { EXCHANGE_PIECE_VALUES, legalCaptureMovesTo, legalExchangeForMove, type LegalExchangeResult } from "./exchange.js";

const PROMOTIONS: readonly Role[] = Object.freeze(["queen", "rook", "bishop", "knight"]);
export const THREAT_CONVENTION = "threat@1" as const;
export const REPLY_HORIZON = "1 reply" as const;

export interface LoosePieceReading {
  readonly fen: string;
  readonly sideToMove: Color;
  readonly pieces: readonly LoosePieceState[];
}

export interface LoosePieceState {
  readonly piece: { readonly square: SquareName; readonly occupant: Piece };
  readonly legalCapturers: readonly {
    readonly square: SquareName;
    readonly piece: Piece;
    readonly captureUci: string;
    readonly exchange: LegalExchangeResult;
  }[];
  readonly defenders: readonly { readonly square: SquareName; readonly piece: Piece }[];
  readonly enPrise: boolean;
  readonly loose: boolean;
  readonly underDefended: boolean;
}

export function loosePieceReading(fen: string): LoosePieceReading {
  const position = positionFromFen(fen);
  const victimColor = opposite(position.turn);
  const pieces: LoosePieceState[] = [];
  for (const target of position.board[victimColor]) {
    const occupant = position.board.get(target)!;
    if (occupant.role === "king") continue;
    const legalCapturers = legalCaptureMovesTo(position, target).flatMap((move) => {
      const exchange = legalExchangeForMove(position, move);
      const piece = position.board.get(move.from);
      return exchange === undefined || piece === undefined ? [] : [{
        square: makeSquare(move.from),
        piece,
        captureUci: makeUci(move),
        exchange,
      }];
    });
    const defenders = [...position.board[victimColor]].flatMap((square) => {
      if (square === target) return [];
      const piece = position.board.get(square)!;
      return attacks(piece, square, position.board.occupied).has(target)
        ? [{ square: makeSquare(square), piece }]
        : [];
    });
    const enPrise = legalCapturers.some((capture) => capture.exchange.resultUnits > 0);
    pieces.push(Object.freeze({
      piece: Object.freeze({ square: makeSquare(target), occupant }),
      legalCapturers: Object.freeze(legalCapturers.sort((a, b) => a.captureUci.localeCompare(b.captureUci))),
      defenders: Object.freeze(defenders.sort((a, b) => a.square.localeCompare(b.square))),
      enPrise,
      loose: defenders.length === 0,
      underDefended: defenders.length > 0 && enPrise,
    }));
  }
  return Object.freeze({
    fen: canonicalFen(position),
    sideToMove: position.turn,
    pieces: Object.freeze(pieces.sort((a, b) => a.piece.square.localeCompare(b.piece.square))),
  });
}

export type RayClassificationKind = "absolute_pin" | "relative_pin" | "skewer" | "xray_attack" | "xray_defense";

export interface RayClassification {
  readonly slider: { readonly square: SquareName; readonly piece: Piece };
  readonly blocker: { readonly square: SquareName; readonly occupant: Piece };
  readonly target: { readonly square: SquareName; readonly occupant: Piece };
  readonly raySquares: readonly SquareName[];
  readonly kind: RayClassificationKind;
  readonly comparison?: {
    readonly frontRole: Role;
    readonly backRole: Role;
    readonly frontValue: number;
    readonly backValue: number;
  };
}

export interface RayClassificationReading {
  readonly fen: string;
  readonly rays: readonly RayClassification[];
}

const SLIDER_DIRECTIONS = Object.freeze({
  bishop: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  queen: [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
} as const);

function rayKind(slider: Piece, front: Piece, back: Piece): Pick<RayClassification, "kind" | "comparison"> {
  if (front.color !== slider.color && back.color !== slider.color && back.role === "king") return { kind: "absolute_pin" };
  if (front.color !== slider.color && back.color !== slider.color && front.role === "king") return { kind: "skewer" };
  if (front.role !== "king" && back.role !== "king") {
    const comparison = Object.freeze({
      frontRole: front.role,
      backRole: back.role,
      frontValue: EXCHANGE_PIECE_VALUES[front.role],
      backValue: EXCHANGE_PIECE_VALUES[back.role],
    });
    if (front.color !== slider.color && back.color !== slider.color && comparison.frontValue > comparison.backValue) return { kind: "skewer", comparison };
    if (front.color !== slider.color && back.color !== slider.color && comparison.backValue > comparison.frontValue) return { kind: "relative_pin", comparison };
    return { kind: back.color === slider.color ? "xray_defense" : "xray_attack", comparison };
  }
  return { kind: back.color === slider.color ? "xray_defense" : "xray_attack" };
}

export function rayClassificationReading(fen: string): RayClassificationReading {
  const position = positionFromFen(fen);
  const rays: RayClassification[] = [];
  for (const [square, slider] of position.board) {
    if (!(slider.role in SLIDER_DIRECTIONS)) continue;
    for (const [df, dr] of SLIDER_DIRECTIONS[slider.role as "bishop" | "rook" | "queen"]) {
      let file = square % 8;
      let rank = Math.floor(square / 8);
      const occupied: Square[] = [];
      const span: SquareName[] = [];
      while (file + df >= 0 && file + df < 8 && rank + dr >= 0 && rank + dr < 8) {
        file += df;
        rank += dr;
        const next = (file + rank * 8) as Square;
        span.push(makeSquare(next));
        if (position.board.occupied.has(next)) occupied.push(next);
        if (occupied.length === 2) break;
      }
      if (occupied.length !== 2) continue;
      const [frontSquare, backSquare] = occupied as [Square, Square];
      const front = position.board.get(frontSquare)!;
      const back = position.board.get(backSquare)!;
      rays.push(Object.freeze({
        slider: Object.freeze({ square: makeSquare(square), piece: slider }),
        blocker: Object.freeze({ square: makeSquare(frontSquare), occupant: front }),
        target: Object.freeze({ square: makeSquare(backSquare), occupant: back }),
        raySquares: Object.freeze(span),
        ...rayKind(slider, front, back),
      }));
    }
  }
  return Object.freeze({
    fen: canonicalFen(position),
    rays: Object.freeze(rays.sort((a, b) => a.slider.square.localeCompare(b.slider.square) || a.target.square.localeCompare(b.target.square))),
  });
}

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

export interface MateInOneReading {
  readonly fen: string;
  readonly mates: readonly {
    readonly moveUci: string;
    readonly mover: { readonly piece: Piece; readonly from: SquareName; readonly to: SquareName };
    readonly matedKing: { readonly piece: Piece; readonly square: SquareName };
  }[];
}

export function mateInOne(fen: string): MateInOneReading {
  const position = positionFromFen(fen);
  const mates: MateInOneReading["mates"][number][] = [];
  for (const move of legalMoves(position)) {
    const mover = position.board.get(move.from)!;
    const next = position.clone();
    next.play(move);
    if (!next.isCheckmate()) continue;
    const kingSquare = next.board.kingOf(next.turn);
    if (kingSquare === undefined) continue;
    mates.push(Object.freeze({
      moveUci: makeUci(move),
      mover: Object.freeze({ piece: mover, from: makeSquare(move.from), to: makeSquare(move.to) }),
      matedKing: Object.freeze({ piece: next.board.get(kingSquare)!, square: makeSquare(kingSquare) }),
    }));
  }
  return Object.freeze({ fen: canonicalFen(position), mates: Object.freeze(mates.sort((a, b) => a.moveUci.localeCompare(b.moveUci))) });
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
