import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

import { canonicalFen } from "@chess-tabiya/runtime";

export interface ParsedPgnMainline {
  readonly rootFen: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "*";
  readonly moves: readonly { readonly san: string; readonly uci: string }[];
}

export class PgnImportError extends Error {}

export function parsePgnMainline(
  pgn: string,
  options: { readonly requireMoves?: boolean } = {},
): ParsedPgnMainline {
  let games;
  try {
    games = parsePgn(pgn);
  } catch (error) {
    throw new PgnImportError("PGN could not be parsed", { cause: error });
  }
  if (games.length !== 1) throw new PgnImportError("PGN must contain exactly one game");
  const game = games[0]!;
  if (game.moves.children.length > 1) throw new PgnImportError("PGN variations are not accepted");
  for (const node of game.moves.mainlineNodes()) {
    if (node.children.length > 1) throw new PgnImportError("PGN variations are not accepted");
  }
  const variant = game.headers.get("Variant");
  if (variant !== undefined && variant !== "Standard" && variant !== "From Position") {
    throw new PgnImportError(`Unsupported PGN variant: ${variant}`);
  }
  const mainline = [...game.moves.mainline()];
  if (mainline.length > 300) throw new PgnImportError("PGN exceeds 300 plies");
  if (options.requireMoves === true && mainline.length === 0) {
    throw new PgnImportError("PGN must contain at least one move");
  }
  let position;
  try {
    position = startingPosition(game.headers).unwrap();
  } catch (error) {
    throw new PgnImportError("PGN has an invalid starting position", { cause: error });
  }
  const rootFen = canonicalFen(position);
  const moves: { san: string; uci: string }[] = [];
  for (const data of mainline) {
    const move = parseSan(position, data.san);
    if (move === undefined || !position.isLegal(move)) {
      throw new PgnImportError(`Illegal PGN move: ${data.san}`);
    }
    moves.push({ san: data.san, uci: makeUci(move) });
    position.play(move);
  }
  const rawResult = game.headers.get("Result") ?? "*";
  const result = rawResult === "1-0" || rawResult === "0-1" || rawResult === "1/2-1/2"
    ? rawResult
    : "*";
  return Object.freeze({
    rootFen,
    headers: Object.freeze(Object.fromEntries(game.headers)),
    result,
    moves: Object.freeze(moves.map((move) => Object.freeze(move))),
  });
}
