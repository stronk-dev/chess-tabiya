import { attacks } from "chessops/attacks";
import { Chess, normalizeMove } from "chessops/chess";
import type { Color, Piece, Square, SquareName } from "chessops/types";
import { makeSquare, makeUci, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";

export interface SquareController {
  readonly square: SquareName;
  readonly piece: Piece;
}

export interface ControlledSquare {
  readonly target: SquareName;
  readonly controllers: readonly SquareController[];
}

export type LegalControlSet =
  | { readonly kind: "available"; readonly squares: readonly ControlledSquare[] }
  | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone"; readonly squares: readonly [] };

export interface SquareControlReading {
  readonly fen: string;
  readonly colors: readonly {
    readonly color: Color;
    readonly pseudo: readonly ControlledSquare[];
    readonly legal: LegalControlSet;
  }[];
}

export interface SquareControlEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly color: Color;
  readonly mode: "pseudo" | "legal";
  readonly sign: "gained" | "lost";
  readonly target: SquareName;
  readonly controller: SquareController;
}

export interface SquareControlEvents {
  readonly events: readonly SquareControlEvent[];
  readonly legalAvailability: readonly {
    readonly color: Color;
    readonly before: LegalControlSet["kind"];
    readonly after: LegalControlSet["kind"];
  }[];
}

const COLORS = Object.freeze(["white", "black"] as const);
const SQUARES = Object.freeze(Array.from({ length: 64 }, (_, square) => square as Square));

function turnClone(fen: string, color: Color): Chess | undefined {
  const position = positionFromFen(fen);
  const clone = Chess.fromSetup({ ...position.toSetup(), turn: color, epSquare: undefined });
  return clone.isOk ? clone.value : undefined;
}

function grouped(edges: ReadonlyMap<Square, readonly SquareController[]>): readonly ControlledSquare[] {
  return Object.freeze(SQUARES.map((target) => Object.freeze({
    target: makeSquare(target),
    controllers: Object.freeze([...(edges.get(target) ?? [])].sort((left, right) => left.square.localeCompare(right.square))),
  })));
}

function pseudoFor(fen: string, color: Color): readonly ControlledSquare[] {
  const position = positionFromFen(fen);
  const values = new Map<Square, SquareController[]>();
  for (const source of position.board[color]) {
    const piece = position.board.get(source)!;
    for (const target of attacks(piece, source, position.board.occupied)) {
      const list = values.get(target) ?? [];
      list.push(Object.freeze({ square: makeSquare(source), piece }));
      values.set(target, list);
    }
  }
  return grouped(values);
}

function legalFor(fen: string, color: Color): LegalControlSet {
  const position = turnClone(fen, color);
  if (position === undefined) return Object.freeze({ kind: "unavailable", reason: "invalid_turn_clone", squares: Object.freeze([] as const) });
  const values = new Map<Square, SquareController[]>();
  for (const [source, destinations] of position.allDests()) {
    const piece = position.board.get(source);
    if (piece?.color !== color) continue;
    for (const target of destinations) {
      const list = values.get(target) ?? [];
      list.push(Object.freeze({ square: makeSquare(source), piece }));
      values.set(target, list);
    }
  }
  return Object.freeze({ kind: "available", squares: grouped(values) });
}

/** All-square pseudo and actual-move controller identities under the RFC's disclosed clone rule. */
export function squareControlReading(fen: string): SquareControlReading {
  const position = positionFromFen(fen);
  const canonical = canonicalFen(position);
  return Object.freeze({
    fen: canonical,
    colors: Object.freeze(COLORS.map((color) => Object.freeze({ color, pseudo: pseudoFor(canonical, color), legal: legalFor(canonical, color) }))),
  });
}

function edgeKey(target: SquareName, controller: SquareController): string {
  return `${target}:${controller.square}:${controller.piece.color}:${controller.piece.role}:${controller.piece.promoted ? 1 : 0}`;
}

function edges(squares: readonly ControlledSquare[]): Map<string, { readonly target: SquareName; readonly controller: SquareController }> {
  const result = new Map<string, { readonly target: SquareName; readonly controller: SquareController }>();
  for (const square of squares) for (const controller of square.controllers) result.set(edgeKey(square.target, controller), { target: square.target, controller });
  return result;
}

/** Exact controller-edge deltas. Legal deltas abstain per color when either complete set is unavailable. */
export function squareControlEvents(beforeFen: string, moveUci: string, afterFen: string): SquareControlEvents {
  const before = squareControlReading(beforeFen), after = squareControlReading(afterFen);
  const position = positionFromFen(before.fen);
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid move UCI ${moveUci}`);
  const move = normalizeMove(position, parsed);
  if (!("from" in move) || !position.isLegal(move)) throw new TypeError(`Illegal move UCI ${moveUci}`);
  const replay = position.clone();
  replay.play(move);
  if (canonicalFen(replay) !== after.fen) throw new TypeError(`After FEN does not match ${moveUci}`);
  const canonicalMove = makeUci(move);
  const events: SquareControlEvent[] = [];
  const availability: SquareControlEvents["legalAvailability"][number][] = [];
  for (const color of COLORS) {
    const left = before.colors.find((entry) => entry.color === color)!;
    const right = after.colors.find((entry) => entry.color === color)!;
    availability.push(Object.freeze({ color, before: left.legal.kind, after: right.legal.kind }));
    for (const [mode, leftSquares, rightSquares] of [
      ["pseudo", left.pseudo, right.pseudo],
      ...(left.legal.kind === "available" && right.legal.kind === "available" ? [["legal", left.legal.squares, right.legal.squares] as const] : []),
    ] as const) {
      const leftEdges = edges(leftSquares), rightEdges = edges(rightSquares);
      for (const [key, value] of rightEdges) if (!leftEdges.has(key)) events.push(Object.freeze({ beforeFen: before.fen, moveUci: canonicalMove, afterFen: after.fen, color, mode, sign: "gained", ...value }));
      for (const [key, value] of leftEdges) if (!rightEdges.has(key)) events.push(Object.freeze({ beforeFen: before.fen, moveUci: canonicalMove, afterFen: after.fen, color, mode, sign: "lost", ...value }));
    }
  }
  events.sort((left, right) => left.color.localeCompare(right.color) || left.mode.localeCompare(right.mode) || left.target.localeCompare(right.target) || left.controller.square.localeCompare(right.controller.square) || left.sign.localeCompare(right.sign));
  return Object.freeze({ events: Object.freeze(events), legalAvailability: Object.freeze(availability) });
}
