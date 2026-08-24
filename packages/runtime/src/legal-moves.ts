import { castlingSide, Chess, normalizeMove } from "chessops/chess";
import type { Color, Move, Role, SquareName } from "chessops/types";
import { kingCastlesTo, makeSquare, makeUci, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";

export const PROMOTION_ROLES = Object.freeze(["queen", "rook", "bishop", "knight"] as const);
export type PromotionRole = (typeof PROMOTION_ROLES)[number];
export const MOVE_IDENTITY_CONVENTION = "chessops-king-takes-rook@1" as const;
export const MOVE_DESTINATION_CONVENTION = "king-landing-square@1" as const;
export const INBOUND_MOVE_DIALECT = Object.freeze({
  engine_bestmove: "standard-uci-king-destination@1",
  pack_move_uci: "standard-uci-king-destination@1",
  lichess_explorer: MOVE_IDENTITY_CONVENTION,
} as const);
export type InboundMoveSource = keyof typeof INBOUND_MOVE_DIALECT;

export interface InboundMoveConversion {
  readonly source: InboundMoveSource;
  readonly sourceDialect: (typeof INBOUND_MOVE_DIALECT)[InboundMoveSource];
  readonly targetDialect: typeof MOVE_IDENTITY_CONVENTION;
  readonly inputUci: string;
  readonly moveUci: string;
  readonly converted: boolean;
}

export interface ExactLegalMove {
  readonly uci: string;
  readonly from: SquareName;
  readonly to: SquareName;
  readonly role: Role;
  readonly promotion?: PromotionRole;
}

export interface ExactLegalMoveMap {
  readonly fen: string;
  readonly turn: Color;
  readonly pieces: readonly {
    readonly piece: { readonly square: SquareName; readonly role: Role; readonly color: Color };
    readonly moves: readonly ExactLegalMove[];
  }[];
}

function semanticDestination(position: Chess, move: Move): Move {
  const side = castlingSide(position, move);
  if (side === undefined || !("from" in move)) return move;
  return { from: move.from, to: kingCastlesTo(position.turn, side) };
}

function movesFor(position: Chess): readonly ExactLegalMove[] {
  const moves: ExactLegalMove[] = [];
  const identities = new Set<string>();
  for (const [from, destinations] of position.allDests()) {
    const piece = position.board.get(from);
    if (piece === undefined || piece.color !== position.turn) continue;
    for (const to of destinations) {
      const promotions: readonly (PromotionRole | undefined)[] = piece.role === "pawn" && (to < 8 || to >= 56)
        ? PROMOTION_ROLES
        : [undefined];
      for (const promotion of promotions) {
        const internal: Move = promotion === undefined ? { from, to } : { from, to, promotion };
        if (!position.isLegal(internal)) continue;
        const destination = semanticDestination(position, internal);
        const uci = makeUci(internal);
        if (identities.has(uci)) throw new TypeError(`Duplicate legal move UCI: ${uci}`);
        identities.add(uci);
        moves.push(Object.freeze({
          uci,
          from: makeSquare(from),
          to: makeSquare(destination.to),
          role: piece.role,
          ...(promotion === undefined ? {} : { promotion }),
        }));
      }
    }
  }
  return Object.freeze(moves.sort((left, right) => left.uci.localeCompare(right.uci)));
}

export function exactLegalMoves(fen: string): readonly ExactLegalMove[] {
  return movesFor(positionFromFen(fen));
}

/**
 * Convert either common standard-UCI castling spelling or the runtime's
 * Chess960-safe identity to the one identity used inside the application.
 * Legality is checked after normalization because chessops deliberately
 * accepts both castling spellings.
 */
export function exactMoveIdentity(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid move UCI: ${uci}`);
  const normalized = normalizeMove(position, parsed);
  if (!position.isLegal(normalized)) throw new TypeError(`Illegal move UCI: ${uci}`);
  return makeUci(normalized);
}

export function normalizeInboundMove(fen: string, uci: string, source: InboundMoveSource): InboundMoveConversion {
  const inputUci = uci.toLowerCase();
  const moveUci = exactMoveIdentity(fen, inputUci);
  const sourceDialect = INBOUND_MOVE_DIALECT[source];
  if (sourceDialect === MOVE_IDENTITY_CONVENTION && moveUci !== inputUci) {
    throw new TypeError(`${source} move ${uci} does not conform to ${sourceDialect}`);
  }
  return Object.freeze({
    source,
    sourceDialect,
    targetDialect: MOVE_IDENTITY_CONVENTION,
    inputUci,
    moveUci,
    converted: inputUci !== moveUci,
  });
}

/** Resolve a move identity to the square occupied by the moving piece. */
export function exactMoveDestination(fen: string, uci: string): SquareName {
  const identity = exactMoveIdentity(fen, uci);
  const move = exactLegalMoves(fen).find((candidate) => candidate.uci === identity);
  if (move === undefined) throw new TypeError(`Legal move identity is absent from ${MOVE_IDENTITY_CONVENTION}: ${identity}`);
  return move.to;
}

export function exactLegalMoveMap(fen: string): ExactLegalMoveMap {
  const position = positionFromFen(fen);
  const canonical = canonicalFen(position);
  const moves = movesFor(position);
  const pieces: Array<ExactLegalMoveMap["pieces"][number]> = [];
  for (const square of position.board[position.turn]) {
    const origin = makeSquare(square);
    const occupant = position.board.get(square);
    if (occupant === undefined || occupant.color !== position.turn) throw new TypeError(`Missing side-to-move piece on ${origin}`);
    pieces.push(Object.freeze({
      piece: Object.freeze({ square: origin, role: occupant.role, color: occupant.color }),
      moves: Object.freeze(moves.filter((move) => move.from === origin)),
    }));
  }
  pieces.sort((left, right) => left.piece.square.localeCompare(right.piece.square));
  return Object.freeze({ fen: canonical, turn: position.turn, pieces: Object.freeze(pieces) });
}
