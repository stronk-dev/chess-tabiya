import { Chess, normalizeMove } from "chessops/chess";
import type { Color, Move, Piece, Role, Square, SquareName } from "chessops/types";
import { makeSquare, makeUci, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { legalCaptureMovesTo, legalExchangeForMove } from "./exchange.js";

export const LOCAL_NON_LOSING_CONVENTION = "local-non-losing@1" as const;
const COLORS = Object.freeze(["white", "black"] as const);
const ROLES = new Set<Role>(["bishop", "knight", "rook", "queen"]);

export interface PieceDestinations {
  readonly piece: { readonly square: SquareName; readonly occupant: Piece };
  readonly legal: readonly SquareName[];
  readonly localNonLosing: readonly SquareName[];
}

export type ColorPieceDestinations =
  | { readonly kind: "available"; readonly color: Color; readonly pieces: readonly PieceDestinations[] }
  | { readonly kind: "unavailable"; readonly color: Color; readonly reason: "invalid_turn_clone"; readonly pieces: readonly [] };

export interface PieceDestinationsReading {
  readonly fen: string;
  readonly conventionId: typeof LOCAL_NON_LOSING_CONVENTION;
  readonly colors: readonly ColorPieceDestinations[];
}

export interface PieceDestinationsEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly color: Color;
  readonly piece: {
    readonly before: { readonly square: SquareName; readonly role: Role };
    readonly after: { readonly square: SquareName; readonly role: Role };
  };
  readonly legalBefore: readonly SquareName[];
  readonly legalAfter: readonly SquareName[];
  readonly legalGained: readonly SquareName[];
  readonly legalLost: readonly SquareName[];
  readonly safeBefore: readonly SquareName[];
  readonly safeAfter: readonly SquareName[];
  readonly safeGained: readonly SquareName[];
  readonly safeLost: readonly SquareName[];
  readonly moved: boolean;
  readonly zeroSafe: boolean;
}

export interface PieceDestinationsEventResult {
  readonly events: readonly PieceDestinationsEvent[];
  readonly unavailable: readonly {
    readonly color: Color;
    readonly reason: "invalid_turn_clone";
    readonly before: ColorPieceDestinations["kind"];
    readonly after: ColorPieceDestinations["kind"];
  }[];
}

function turnClone(fen: string, color: Color): Chess | undefined {
  const position = positionFromFen(fen);
  const clone = Chess.fromSetup({ ...position.toSetup(), turn: color, epSquare: undefined });
  return clone.isOk ? clone.value : undefined;
}

function locallyNonLosing(position: Chess, move: Move): boolean {
  const exchange = legalExchangeForMove(position, move);
  if (exchange !== undefined) return exchange.resultUnits >= 0;
  if (!("from" in move)) return false;
  const next = position.clone();
  next.play(move);
  return !legalCaptureMovesTo(next, move.to).some((capture) => (legalExchangeForMove(next, capture)?.resultUnits ?? 0) > 0);
}

function colorReading(fen: string, color: Color): ColorPieceDestinations {
  const position = turnClone(fen, color);
  if (position === undefined) return Object.freeze({ kind: "unavailable", color, reason: "invalid_turn_clone", pieces: Object.freeze([] as const) });
  const pieces: PieceDestinations[] = [];
  for (const square of position.board[color]) {
    const occupant = position.board.get(square)!;
    if (!ROLES.has(occupant.role)) continue;
    const legalMoves: Move[] = [];
    const destinations = position.allDests().get(square);
    if (destinations !== undefined) for (const to of destinations) {
      const move: Move = { from: square, to };
      if (position.isLegal(move)) legalMoves.push(move);
    }
    const legal = legalMoves.map((move) => makeSquare((move as { readonly to: Square }).to)).sort();
    const localNonLosing = legalMoves.filter((move) => locallyNonLosing(position, move)).map((move) => makeSquare((move as { readonly to: Square }).to)).sort();
    pieces.push(Object.freeze({ piece: Object.freeze({ square: makeSquare(square), occupant }), legal: Object.freeze(legal), localNonLosing: Object.freeze(localNonLosing) }));
  }
  pieces.sort((left, right) => left.piece.square.localeCompare(right.piece.square));
  return Object.freeze({ kind: "available", color, pieces: Object.freeze(pieces) });
}

export function pieceDestinationsReading(fen: string): PieceDestinationsReading {
  const canonical = canonicalFen(positionFromFen(fen));
  return Object.freeze({ fen: canonical, conventionId: LOCAL_NON_LOSING_CONVENTION, colors: Object.freeze(COLORS.map((color) => colorReading(canonical, color))) });
}

function difference(left: readonly SquareName[], right: readonly SquareName[]): readonly SquareName[] {
  const excluded = new Set(right);
  return Object.freeze(left.filter((square) => !excluded.has(square)).sort());
}

export function pieceDestinationEvents(beforeFen: string, moveUci: string, afterFen: string): PieceDestinationsEventResult {
  const before = pieceDestinationsReading(beforeFen), after = pieceDestinationsReading(afterFen);
  const position = positionFromFen(beforeFen);
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid move UCI ${moveUci}`);
  const normalized = normalizeMove(position, parsed);
  if (!("from" in normalized) || !position.isLegal(normalized)) throw new TypeError(`Illegal move UCI ${moveUci}`);
  const replay = position.clone();
  replay.play(normalized);
  if (canonicalFen(replay) !== after.fen) throw new TypeError(`After FEN does not match ${moveUci}`);
  const events: PieceDestinationsEvent[] = [];
  const unavailable: PieceDestinationsEventResult["unavailable"][number][] = [];
  for (const color of COLORS) {
    const left = before.colors.find((entry) => entry.color === color)!;
    const right = after.colors.find((entry) => entry.color === color)!;
    if (left.kind !== "available" || right.kind !== "available") {
      unavailable.push(Object.freeze({ color, reason: "invalid_turn_clone", before: left.kind, after: right.kind }));
      continue;
    }
    const rightBySquare = new Map(right.pieces.map((piece) => [piece.piece.square, piece]));
    for (const prior of left.pieces) {
      const moved = prior.piece.square === makeSquare(normalized.from);
      const nextSquare = moved ? makeSquare(normalized.to) : prior.piece.square;
      const current = rightBySquare.get(nextSquare);
      if (current === undefined || current.piece.occupant.color !== color || current.piece.occupant.role !== prior.piece.occupant.role) continue;
      const legalGained = difference(current.legal, prior.legal), legalLost = difference(prior.legal, current.legal);
      const safeGained = difference(current.localNonLosing, prior.localNonLosing), safeLost = difference(prior.localNonLosing, current.localNonLosing);
      if (legalGained.length === 0 && legalLost.length === 0 && safeGained.length === 0 && safeLost.length === 0) continue;
      events.push(Object.freeze({
        beforeFen: before.fen, moveUci: makeUci(normalized), afterFen: after.fen, color,
        piece: Object.freeze({ before: Object.freeze({ square: prior.piece.square, role: prior.piece.occupant.role }), after: Object.freeze({ square: current.piece.square, role: current.piece.occupant.role }) }),
        legalBefore: prior.legal, legalAfter: current.legal, legalGained, legalLost,
        safeBefore: prior.localNonLosing, safeAfter: current.localNonLosing, safeGained, safeLost,
        moved, zeroSafe: prior.localNonLosing.length > 0 && current.localNonLosing.length === 0,
      }));
    }
  }
  return Object.freeze({ events: Object.freeze(events), unavailable: Object.freeze(unavailable) });
}
