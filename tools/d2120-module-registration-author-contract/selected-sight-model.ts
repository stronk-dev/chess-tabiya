// DISPOSABLE D3578 author model. Not imported by production and not a new mint authority.
// It checks whether a selected projection can be computed from genuine unchanged source values.
import type { Color, SquareName } from "chessops/types";
import { makeSquare, parseSquare, parseUci } from "chessops/util";
import { makeSan } from "chessops/san";

import { assertDeclaredEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/position-cache.js";
import type { ExactLegalMoveMap } from "../../packages/runtime/src/legal-moves.js";
import type { SquareControlReading } from "../../packages/runtime/src/square-control.js";
import type { PawnContactsReading } from "../../packages/runtime/src/pawn-dynamics.js";
import type { CastlingRightsState } from "../../packages/runtime/src/castling.js";

export const SOURCE_BY_FACET = {
  moves: "rules.mobility.reading.legal_moves",
  control: "rules.square.reading.control",
  pawns: "rules.pawn.reading.contacts",
  castling: "rules.castling.reading.rights",
} as const;
export type SourceFacet = keyof typeof SOURCE_BY_FACET;

function selection(fen: string, square: string) {
  const position = positionFromFen(fen);
  const index = parseSquare(square);
  if (index === undefined) throw new TypeError("invalid selected square");
  return { position, index, fen: canonicalFen(position), square: square as SquareName };
}

/** Proposed request-local default, not a judgement about which chess fact is important. */
export function defaultFacet(fen: string, square: string): SourceFacet {
  const { position, index } = selection(fen, square);
  const piece = position.board.get(index);
  if (piece?.role === "pawn") return "pawns";
  if (piece?.role === "king") return "castling";
  return piece?.color === position.turn ? "moves" : "control";
}

function admitted<T>(source: DeclaredEvidence<unknown>, facet: SourceFacet, fen: string): T {
  assertDeclaredEvidence(source);
  if (source.projection.id !== SOURCE_BY_FACET[facet] || source.projection.version !== 1) throw new TypeError("wrong source projection");
  if ((source.payload as { fen?: unknown }).fen !== fen) throw new TypeError("wrong source position");
  return source.payload as T;
}

const noWitness = (reason: "empty_square" | "not_a_pawn" | "not_castling_piece") => ({ kind: "no_witness" as const, reason });

export function selectMoves(source: DeclaredEvidence<unknown>, fen: string, square: string) {
  const frame = selection(fen, square);
  const reading = admitted<ExactLegalMoveMap>(source, "moves", frame.fen);
  const piece = frame.position.board.get(frame.index);
  if (piece === undefined) return noWitness("empty_square");
  if (piece.color !== reading.turn) return { kind: "unavailable" as const, reason: "not_side_to_move" as const };
  const row = reading.pieces.find(entry => entry.piece.square === frame.square);
  if (row === undefined) throw new TypeError("complete source omitted the selected actual-turn piece");
  return Object.freeze({
    kind: "available" as const, selectedSquare: frame.square, turn: reading.turn, piece: row.piece,
    moves: row.moves, destinations: Object.freeze([...new Set(row.moves.map(move => move.to))].sort()),
  });
}

/** Control ALWAYS answers inbound controllers of the target, even when it is occupied. */
export function selectControl(source: DeclaredEvidence<unknown>, fen: string, square: string) {
  const frame = selection(fen, square);
  const reading = admitted<SquareControlReading>(source, "control", frame.fen);
  const colors = Object.freeze(reading.colors.map(entry => {
    const pseudo = entry.pseudo.find(cell => cell.target === frame.square);
    if (pseudo === undefined) throw new TypeError("complete source omitted selected control cell");
    const legal = entry.legal.kind === "unavailable" ? { kind: "unavailable" as const, reason: entry.legal.reason } : {
      kind: "available" as const,
      controllers: entry.legal.squares.find(cell => cell.target === frame.square)?.controllers,
    };
    if (legal.kind === "available" && legal.controllers === undefined) throw new TypeError("complete source omitted selected legal-control cell");
    return Object.freeze({ color: entry.color, pseudo: pseudo.controllers, legal: Object.freeze(legal) });
  }));
  const hasWitness = colors.some(entry => entry.pseudo.length > 0 || entry.legal.kind === "available" && entry.legal.controllers!.length > 0);
  // An unavailable clone is not an empty set. Even a no-witness result retains these states.
  return hasWitness
    ? Object.freeze({ kind: "available" as const, selectedSquare: frame.square, colors })
    : Object.freeze({ kind: "no_witness" as const, reason: "no_available_controller" as const, selectedSquare: frame.square, colors });
}

export function selectPawns(source: DeclaredEvidence<unknown>, fen: string, square: string) {
  const frame = selection(fen, square);
  const reading = admitted<PawnContactsReading>(source, "pawns", frame.fen);
  if (frame.position.board.get(frame.index)?.role !== "pawn") return noWitness("not_a_pawn");
  const state = reading.passed.find(entry => entry.pawn.square === frame.square);
  if (state === undefined) throw new TypeError("complete source omitted selected pawn state");
  return Object.freeze({
    kind: "available" as const, selectedSquare: frame.square, state,
    contacts: Object.freeze(reading.contacts.filter(entry => entry.attacker.square === frame.square || entry.target.square === frame.square)),
    locks: Object.freeze(reading.locks.filter(entry => entry.white.square === frame.square || entry.black.square === frame.square)),
    connectedPassedPairs: Object.freeze(reading.connectedPassedPairs.filter(entry => entry.first.square === frame.square || entry.second.square === frame.square)),
  });
}

export function selectCastling(source: DeclaredEvidence<unknown>, fen: string, square: string) {
  const frame = selection(fen, square);
  const reading = admitted<CastlingRightsState>(source, "castling", frame.fen);
  const piece = frame.position.board.get(frame.index);
  if (piece === undefined || piece.role !== "king" && piece.role !== "rook") return noWitness("not_castling_piece");
  const color: Color = piece.color;
  const rooks = frame.position.castles.rook[color];
  const wings = ([{ wing: "kingside", rook: rooks.h }, { wing: "queenside", rook: rooks.a }] as const)
    .filter(entry => piece.role === "king" || entry.rook === frame.index)
    .map(entry => Object.freeze({ wing: entry.wing, retained: reading[color][entry.wing], rookSquare: entry.rook === undefined ? null : makeSquare(entry.rook) }));
  if (wings.length === 0) return noWitness("not_castling_piece");
  return Object.freeze({ kind: "available" as const, selectedSquare: frame.square, color, wings: Object.freeze(wings) });
}

/** Only the exact selected legal-move projection may use this proposed complete-set envelope. */
export function proposedSightBudget(projection: string, consumer = "module.sight_on_request@1") {
  if (consumer !== "module.sight_on_request@1") throw new TypeError("not a Sight consumer");
  return projection === "derived.sight.legal_moves@1"
    ? { maxFacts: 1, maxWords: 96, maxMarks: 64, maxArrows: 0 }
    : { maxFacts: 1, maxWords: 30, maxMarks: 6, maxArrows: 1 };
}

/** Complete non-square alternative: SAN/promotion labels, never raw UCI as learner prose. */
export function proposedLegalSentence(source: DeclaredEvidence<unknown>, fen: string, square: string): string {
  const selected = selectMoves(source, fen, square);
  if (selected.kind !== "available") throw new TypeError("a legal list needs an available origin");
  const position = positionFromFen(fen);
  const subject = `${selected.piece.color} ${selected.piece.role} on ${square}`;
  if (selected.moves.length === 0) return `${subject} has no legal moves.`;
  return `${subject}. Legal choices: ${selected.moves.map(move => {
    const parsed = parseUci(move.uci);
    if (parsed === undefined) throw new TypeError("invalid source move");
    return `${move.to} (${makeSan(position, parsed)}${move.promotion === undefined ? "" : `, promote to ${move.promotion}`})`;
  }).join(", ")}.`;
}
