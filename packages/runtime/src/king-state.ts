import { Chess, normalizeMove } from "chessops/chess";
import type { Color, Piece, Square, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { squareControlReading, type SquareController } from "./square-control.js";

export const KING_ZONE_CONVENTION = "king-zone@1" as const;
export const KING_SHELTER_CONVENTION = "king-shelter@1" as const;
const COLORS = Object.freeze(["white", "black"] as const);

export interface KingZoneParticipant extends SquareController {
  readonly zoneSquares: readonly SquareName[];
}

export type KingEscapeSet =
  | { readonly kind: "available"; readonly squares: readonly SquareName[] }
  | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone"; readonly squares: readonly [] };

export interface KingZoneState {
  readonly color: Color;
  readonly king: { readonly square: SquareName; readonly piece: Piece };
  readonly zone: readonly SquareName[];
  readonly attackers: readonly KingZoneParticipant[];
  readonly defenders: readonly KingZoneParticipant[];
  readonly shelter: readonly SquareController[];
  readonly escapes: KingEscapeSet;
}

export interface KingZoneReading {
  readonly fen: string;
  readonly zoneConventionId: typeof KING_ZONE_CONVENTION;
  readonly shelterConventionId: typeof KING_SHELTER_CONVENTION;
  readonly kings: readonly KingZoneState[];
}

export interface KingZoneEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly color: Color;
  readonly king: { readonly before: SquareName; readonly after: SquareName; readonly relocated: boolean };
  readonly attackers: { readonly gained: readonly KingZoneParticipant[]; readonly lost: readonly KingZoneParticipant[] };
  readonly defenders: { readonly gained: readonly KingZoneParticipant[]; readonly lost: readonly KingZoneParticipant[] };
  readonly shelter: { readonly gained: readonly SquareController[]; readonly lost: readonly SquareController[] };
  readonly escapes: {
    readonly before: KingEscapeSet;
    readonly after: KingEscapeSet;
    readonly gained: readonly SquareName[];
    readonly lost: readonly SquareName[];
  };
}

function adjacentSquares(square: Square): readonly Square[] {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  const result: Square[] = [];
  for (let df = -1; df <= 1; df += 1) for (let dr = -1; dr <= 1; dr += 1) {
    if (df === 0 && dr === 0) continue;
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (nextFile >= 0 && nextFile < 8 && nextRank >= 0 && nextRank < 8) result.push((nextRank * 8 + nextFile) as Square);
  }
  return Object.freeze(result.sort((left, right) => left - right));
}

function participantKey(value: KingZoneParticipant): string {
  return `${value.square}:${value.piece.color}:${value.piece.role}:${value.zoneSquares.join(",")}`;
}

function controllerKey(value: SquareController): string {
  return `${value.square}:${value.piece.color}:${value.piece.role}`;
}

function participantsFor(
  targets: readonly SquareName[],
  controlled: ReturnType<typeof squareControlReading>,
  controllerColor: Color,
): readonly KingZoneParticipant[] {
  const byIdentity = new Map<string, { source: SquareController; targets: SquareName[] }>();
  const color = controlled.colors.find((entry) => entry.color === controllerColor)!;
  for (const target of targets) {
    const square = color.pseudo.find((entry) => entry.target === target)!;
    for (const controller of square.controllers) {
      if (controller.piece.role === "king") continue;
      const key = controllerKey(controller);
      const prior = byIdentity.get(key) ?? { source: controller, targets: [] };
      prior.targets.push(target);
      byIdentity.set(key, prior);
    }
  }
  return Object.freeze([...byIdentity.values()].map(({ source, targets: values }) => Object.freeze({ ...source, zoneSquares: Object.freeze(values.sort()) })).sort((left, right) => participantKey(left).localeCompare(participantKey(right))));
}

function escapes(fen: string, color: Color, kingSquare: Square): KingEscapeSet {
  const original = positionFromFen(fen);
  const clone = Chess.fromSetup({ ...original.toSetup(), turn: color, epSquare: undefined });
  if (!clone.isOk) return Object.freeze({ kind: "unavailable", reason: "invalid_turn_clone", squares: Object.freeze([] as const) });
  const adjacent = new Set(adjacentSquares(kingSquare));
  const squares = [...(clone.value.allDests().get(kingSquare) ?? [])].filter((square) => adjacent.has(square)).map(makeSquare).sort();
  return Object.freeze({ kind: "available", squares: Object.freeze(squares) });
}

function shelter(position: ReturnType<typeof positionFromFen>, color: Color, kingSquare: Square): readonly SquareController[] {
  const file = kingSquare % 8;
  const kingRank = Math.floor(kingSquare / 8);
  const direction = color === "white" ? 1 : -1;
  const squares: SquareController[] = [];
  for (const pawnSquare of position.board.pieces(color, "pawn")) {
    const pawnFile = pawnSquare % 8;
    const pawnRank = Math.floor(pawnSquare / 8);
    if (Math.abs(pawnFile - file) <= 1 && (pawnRank === kingRank + direction || pawnRank === kingRank + 2 * direction)) {
      squares.push(Object.freeze({ square: makeSquare(pawnSquare), piece: position.board.get(pawnSquare)! }));
    }
  }
  return Object.freeze(squares.sort((left, right) => left.square.localeCompare(right.square)));
}

/** King-zone operands consume the all-square pseudo-controller topology. */
export function kingZoneReading(fen: string): KingZoneReading {
  const position = positionFromFen(fen);
  const canonical = canonicalFen(position);
  const control = squareControlReading(canonical);
  const kings = COLORS.map((color): KingZoneState => {
    const kingSquare = position.board.kingOf(color);
    if (kingSquare === undefined) throw new TypeError(`Position has no ${color} king`);
    const zone = adjacentSquares(kingSquare).map(makeSquare);
    return Object.freeze({
      color,
      king: Object.freeze({ square: makeSquare(kingSquare), piece: position.board.get(kingSquare)! }),
      zone: Object.freeze(zone),
      attackers: participantsFor(zone, control, opposite(color)),
      defenders: participantsFor(zone, control, color),
      shelter: shelter(position, color, kingSquare),
      escapes: escapes(canonical, color, kingSquare),
    });
  });
  return Object.freeze({ fen: canonical, zoneConventionId: KING_ZONE_CONVENTION, shelterConventionId: KING_SHELTER_CONVENTION, kings: Object.freeze(kings) });
}

function setDifference<T>(left: readonly T[], right: readonly T[], key: (value: T) => string): readonly T[] {
  const excluded = new Set(right.map(key));
  return Object.freeze(left.filter((value) => !excluded.has(key(value))));
}

/** Exact king-zone set changes. Unavailable escape sets produce no invented square deltas. */
export function kingZoneEvents(beforeFen: string, moveUci: string, afterFen: string): readonly KingZoneEvent[] {
  const before = kingZoneReading(beforeFen);
  const position = positionFromFen(before.fen);
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid move UCI ${moveUci}`);
  const move = normalizeMove(position, parsed);
  if (!("from" in move) || !position.isLegal(move)) throw new TypeError(`Illegal move UCI ${moveUci}`);
  position.play(move);
  const after = kingZoneReading(afterFen);
  if (canonicalFen(position) !== after.fen) throw new TypeError(`After FEN does not match ${moveUci}`);
  return Object.freeze(COLORS.map((color) => {
    const left = before.kings.find((entry) => entry.color === color)!;
    const right = after.kings.find((entry) => entry.color === color)!;
    const available = left.escapes.kind === "available" && right.escapes.kind === "available";
    return Object.freeze({
      beforeFen: before.fen,
      moveUci: makeUci(move),
      afterFen: after.fen,
      color,
      king: Object.freeze({ before: left.king.square, after: right.king.square, relocated: left.king.square !== right.king.square }),
      attackers: Object.freeze({ gained: setDifference(right.attackers, left.attackers, participantKey), lost: setDifference(left.attackers, right.attackers, participantKey) }),
      defenders: Object.freeze({ gained: setDifference(right.defenders, left.defenders, participantKey), lost: setDifference(left.defenders, right.defenders, participantKey) }),
      shelter: Object.freeze({ gained: setDifference(right.shelter, left.shelter, controllerKey), lost: setDifference(left.shelter, right.shelter, controllerKey) }),
      escapes: Object.freeze({ before: left.escapes, after: right.escapes, gained: available ? setDifference(right.escapes.squares, left.escapes.squares, String) : Object.freeze([]), lost: available ? setDifference(left.escapes.squares, right.escapes.squares, String) : Object.freeze([]) }),
    });
  }));
}
