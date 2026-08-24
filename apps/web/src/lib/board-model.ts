import type { Config } from "@lichess-org/chessground/config";
import type { Color, Key } from "@lichess-org/chessground/types";
import { Chess } from "chessops/chess";
import { chessgroundDests } from "chessops/compat";
import { parseFen } from "chessops/fen";
import { parseSquare, squareRank } from "chessops/util";

export type StartSide = "white" | "black";
export type PromotionRole = "queen" | "rook" | "bishop" | "knight";

export interface PromotionRequest {
  readonly from: Key;
  readonly to: Key;
  readonly baseUci: string;
  readonly roles: readonly PromotionRole[];
}

export interface BoardModel {
  readonly fen: string;
  readonly orientation: Color;
  readonly turnColor: Color;
  readonly check: boolean;
  readonly lastMove?: readonly [Key, Key];
  readonly dests: NonNullable<NonNullable<Config["movable"]>["dests"]>;
}

export const PROMOTION_ROLES: readonly PromotionRole[] = Object.freeze([
  "queen",
  "rook",
  "bishop",
  "knight",
]);

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function key(value: string): Key {
  if (!/^[a-h][1-8]$/.test(value)) throw new TypeError(`Invalid board key: ${value}`);
  return value as Key;
}

export function displayedLastMove(fen: string, uci?: string | null): readonly [Key, Key] | undefined {
  if (uci === undefined || uci === null) return undefined;
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
    throw new TypeError(`Invalid last-move UCI: ${uci}`);
  }
  const chess = position(fen);
  const from = key(uci.slice(0, 2));
  const encodedTo = key(uci.slice(2, 4));
  const encodedSquare = parseSquare(encodedTo);
  if (encodedSquare === undefined || chess.board.get(encodedSquare) !== undefined) {
    return Object.freeze([from, encodedTo]);
  }
  const mover = chess.turn === "white" ? "black" : "white";
  const kingSquare = chess.board.kingOf(mover);
  if (kingSquare === undefined) return Object.freeze([from, encodedTo]);
  const kingTo = key(String.fromCharCode(97 + (kingSquare % 8)) + String(Math.floor(kingSquare / 8) + 1));
  return Object.freeze([from, kingTo[0] === "c" || kingTo[0] === "g" ? kingTo : encodedTo]);
}

export function boardModel(
  fen: string,
  startSide: StartSide,
  lastMove?: string | null,
): BoardModel {
  const chess = position(fen);
  const parsed = displayedLastMove(fen, lastMove);
  return Object.freeze({
    fen,
    orientation: startSide,
    turnColor: chess.turn,
    check: chess.isCheck(),
    ...(parsed === undefined ? {} : { lastMove: parsed }),
    dests: chessgroundDests(chess),
  });
}

export function promotionRequest(
  fen: string,
  from: Key,
  to: Key,
): PromotionRequest | undefined {
  const chess = position(fen);
  const fromSquare = parseSquare(from);
  const toSquare = parseSquare(to);
  if (fromSquare === undefined || toSquare === undefined) return undefined;
  const piece = chess.board.get(fromSquare);
  if (
    piece?.role !== "pawn" ||
    (squareRank(toSquare) !== 0 && squareRank(toSquare) !== 7)
  ) {
    return undefined;
  }
  return Object.freeze({
    from,
    to,
    baseUci: `${from}${to}`,
    roles: PROMOTION_ROLES,
  });
}

export function promotionUci(
  request: PromotionRequest,
  role: PromotionRole,
): string {
  const suffix = { queen: "q", rook: "r", bishop: "b", knight: "n" }[role];
  return `${request.baseUci}${suffix}`;
}
