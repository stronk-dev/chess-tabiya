import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

import { canonicalFen, type RecordedClockMove, type RecordedClockSample, type ClockSampleIssue } from "@chess-tabiya/runtime";

export const IMPORT_PGN_MAX_BYTES = 65_536;

export interface ParsedPgnMainline {
  readonly rootFen: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "*";
  readonly moves: readonly { readonly san: string; readonly uci: string }[];
}

export class PgnImportError extends Error {}

/** One selected game and one legal walk, shared by the plain and clock-bearing projections. */
function validatedGame(
  pgn: string,
  options: { readonly requireMoves?: boolean } = {},
) {
  if (new TextEncoder().encode(pgn).byteLength > IMPORT_PGN_MAX_BYTES) throw new PgnImportError("PGN exceeds the 64 KiB import limit");
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
  const moves: { san: string; uci: string; side: "white" | "black" }[] = [];
  for (const data of mainline) {
    const move = parseSan(position, data.san);
    if (move === undefined || !position.isLegal(move)) {
      throw new PgnImportError(`Illegal PGN move: ${data.san}`);
    }
    moves.push({ san: data.san, uci: makeUci(move), side: position.turn });
    position.play(move);
  }
  const rawResult = game.headers.get("Result") ?? "*";
  const result = rawResult === "1-0" || rawResult === "0-1" || rawResult === "1/2-1/2"
    ? rawResult
    : "*";
  const parsed: ParsedPgnMainline = Object.freeze({
    rootFen,
    headers: Object.freeze(Object.fromEntries(game.headers)),
    result,
    moves: Object.freeze(moves.map(({ san, uci }) => Object.freeze({ san, uci }))),
  });
  return { game, mainline, moves, parsed };
}

export function parsePgnMainline(pgn: string, options: { readonly requireMoves?: boolean } = {}): ParsedPgnMainline {
  return validatedGame(pgn, options).parsed;
}

export interface ParsedRecordedClockGame {
  readonly game: ParsedPgnMainline;
  readonly moves: readonly RecordedClockMove[];
  readonly samples: readonly RecordedClockSample[];
  readonly issues: readonly ClockSampleIssue[];
}

function clockTokens(comments: readonly string[] | undefined): readonly string[] {
  // Count attempts before parsing: duplicate tags never silently choose a first/last value.
  return (comments ?? []).flatMap(comment => {
    const starts = [...comment.matchAll(/\[%clk\b/gu)].map(match => match.index);
    return starts.map((start, index) => {
      const close = comment.indexOf("]", start), next = starts[index + 1] ?? comment.length;
      return comment.slice(start, Math.min(close < 0 ? comment.length : close + 1, next));
    });
  });
}

function clockOperand(token: string): { readonly remainingMs: number } | { readonly reason: ClockSampleIssue["reason"] } {
  const match = /^\[%clk ([0-9]+):([0-5][0-9]):([0-5][0-9])(?:\.([0-9]+))?\]$/u.exec(token);
  if (match === null) return { reason: "invalid_clock" };
  if ((match[4]?.length ?? 0) > 3) return { reason: "unsupported_precision" };
  const milliseconds = ((BigInt(match[1]!) * 60n + BigInt(match[2]!)) * 60n + BigInt(match[3]!)) * 1000n
    + BigInt((match[4] ?? "").padEnd(3, "0"));
  return milliseconds > BigInt(Number.MAX_SAFE_INTEGER) ? { reason: "unsafe_operand" } : { remainingMs: Number(milliseconds) };
}

/** Comments exist only during this legal walk; the result contains numeric facts, never prose. */
export function parseRecordedClockGame(pgn: string, options: { readonly requireMoves?: boolean } = {}): ParsedRecordedClockGame {
  const { game, mainline, moves: legalMoves, parsed } = validatedGame(pgn, options);
  const moves = Object.freeze(legalMoves.map((move, index) => Object.freeze({ sourcePly: index + 1, side: move.side, moveUci: move.uci })));
  const samples: RecordedClockSample[] = [], issues: ClockSampleIssue[] = [];
  if (clockTokens(game.comments).length > 0) issues.push(Object.freeze({ sourcePly: 0, reason: "unassigned_root_clock" }));
  mainline.forEach((data, index) => {
    const tokens = clockTokens(data.comments), move = moves[index]!;
    if (tokens.length === 0) return;
    if (tokens.length > 1) { issues.push(Object.freeze({ sourcePly: move.sourcePly, reason: "duplicate_clock" })); return; }
    const operand = clockOperand(tokens[0]!);
    if ("reason" in operand) issues.push(Object.freeze({ sourcePly: move.sourcePly, reason: operand.reason }));
    else samples.push(Object.freeze({ ...move, remainingMs: operand.remainingMs }));
  });
  return Object.freeze({ game: parsed, moves, samples: Object.freeze(samples), issues: Object.freeze(issues) });
}
