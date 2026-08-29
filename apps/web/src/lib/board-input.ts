import type { Color, Piece, SquareName } from "chessops/types";
import { Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan, parseSan } from "chessops/san";
import { makeSquare, makeUci, parseSquare, parseUci } from "chessops/util";

import { exactLegalMoveMap, exactMoveDestination } from "@chess-tabiya/runtime";

import type { PromotionRole } from "./board-model.js";
import { displayedLastMove } from "./board-model.js";

export type Square = SquareName;

export type BoardInputPhase = "idle" | "origin_selected" | "awaiting_promotion";

export interface BoardInputState {
  readonly phase: BoardInputPhase;
  readonly activeSquare: Square;
  readonly origin: Square | null;
  readonly legalDestinations: readonly Square[];
  readonly pendingPromotion: {
    readonly origin: Square;
    readonly destination: Square;
    readonly roles: readonly PromotionRole[];
  } | null;
  readonly lastAnnouncement: string;
}

export interface BoardInputPosition {
  readonly fen: string;
  readonly orientation: "white" | "black";
  readonly sideToMove: "white" | "black";
  readonly legalMoves: ReadonlyMap<Square, readonly string[]>;
  readonly disabled: boolean;
  /** This is the visible board's assistance ceiling, not a semantic-board preference. */
  readonly showDests: boolean;
  readonly lastMove?: string | null;
}

export type BoardInputAction =
  | { readonly type: "navigate"; readonly fileDelta: -1 | 0 | 1; readonly rankDelta: -1 | 0 | 1 }
  | { readonly type: "navigate_edge"; readonly axis: "file" | "rank"; readonly edge: "first" | "last" }
  | { readonly type: "activate" }
  | { readonly type: "cancel" }
  | { readonly type: "pointer_origin"; readonly square: Square }
  | { readonly type: "pointer_destination"; readonly square: Square }
  | { readonly type: "promote"; readonly role: PromotionRole }
  | { readonly type: "text_move"; readonly value: string };

export interface BoardInputResult {
  readonly state: BoardInputState;
  readonly moveUci?: string;
  /** Announced only after the authoritative move mutation succeeds. */
  readonly successAnnouncement?: string;
}

const ROLE_NAME: Readonly<Record<PromotionRole, string>> = Object.freeze({
  queen: "queen",
  rook: "rook",
  bishop: "bishop",
  knight: "knight",
});

const ROLE_FROM_SUFFIX: Readonly<Record<string, PromotionRole>> = Object.freeze({
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
});

function positionFromFen(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

export function moveSanFromUci(fen: string, uci: string): string | undefined {
  try {
    const position = positionFromFen(fen);
    const move = parseUci(uci);
    if (move === undefined || !position.isLegal(move)) return undefined;
    return makeSan(position, move);
  } catch {
    return undefined;
  }
}

function square(value: string): Square {
  if (!/^[a-h][1-8]$/u.test(value)) throw new TypeError(`Invalid square: ${value}`);
  return value as Square;
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function semanticDestinationOf(fen: string, uci: string): Square {
  return exactMoveDestination(fen, uci);
}

function roleFor(uci: string): PromotionRole | undefined {
  return uci.length === 5 ? ROLE_FROM_SUFFIX[uci[4]!] : undefined;
}

function initialSquare(input: BoardInputPosition, retained: Square | undefined): Square {
  if (retained !== undefined) return retained;
  const chess = positionFromFen(input.fen);
  const king = chess.board.kingOf(input.sideToMove);
  if (king !== undefined) return makeSquare(king);

  const rows = visualRows(input.orientation);
  for (const row of rows) {
    for (const candidate of row) {
      const parsed = parseSquare(candidate);
      if (parsed !== undefined && chess.board.get(parsed) !== undefined) return candidate;
    }
  }
  return "a1";
}

function visualCoordinates(value: Square, orientation: "white" | "black"): { readonly file: number; readonly rank: number } {
  const algebraicFile = value.charCodeAt(0) - 97;
  const algebraicRank = Number(value[1]) - 1;
  return orientation === "white"
    ? { file: algebraicFile, rank: 7 - algebraicRank }
    : { file: 7 - algebraicFile, rank: algebraicRank };
}

function fromVisualCoordinates(file: number, rank: number, orientation: "white" | "black"): Square {
  const algebraicFile = orientation === "white" ? file : 7 - file;
  const algebraicRank = orientation === "white" ? 7 - rank : rank;
  return square(`${String.fromCharCode(97 + algebraicFile)}${algebraicRank + 1}`);
}

/** Rows are top-to-bottom and cells left-to-right as the board is displayed. */
export function visualRows(orientation: "white" | "black"): readonly (readonly Square[])[] {
  return Object.freeze(
    Array.from({ length: 8 }, (_, rank) =>
      Object.freeze(Array.from({ length: 8 }, (_, file) => fromVisualCoordinates(file, rank, orientation))),
    ),
  );
}

function visualMove(
  active: Square,
  orientation: "white" | "black",
  fileDelta: number,
  rankDelta: number,
): Square {
  const current = visualCoordinates(active, orientation);
  return fromVisualCoordinates(
    Math.max(0, Math.min(7, current.file + fileDelta)),
    Math.max(0, Math.min(7, current.rank + rankDelta)),
    orientation,
  );
}

function announcementForSelection(origin: Square, destinations: readonly Square[], showDests: boolean): string {
  if (!showDests || destinations.length === 0) return `Square ${origin} selected.`;
  return `Square ${origin} selected. Legal destinations: ${destinations.join(", ")}.`;
}

function normaliseMoveText(value: string): string {
  return value.normalize("NFKC").trim();
}

function normaliseSan(value: string): string {
  return value.replaceAll(/\s+/gu, "").replaceAll("0", "O").toLocaleLowerCase("en-US");
}

function hasAmbiguousShape(value: string, legal: readonly string[], chess: Chess): boolean {
  const input = normaliseSan(value);
  const candidates = legal.filter((uci) => {
    const move = parseUci(uci);
    return move !== undefined && normaliseSan(makeSan(chess, move)) === input;
  });
  if (candidates.length > 1) return true;

  // `parseSan` intentionally rejects an underspecified move. Compare the entered
  // target/piece against legal SAN strings with their origin disambiguator removed.
  const stripped = input.replace(/^([nbrqk])?[a-h]?[1-8]?(x?)([a-h][1-8])/u, "$1$2$3");
  return legal.filter((uci) => {
    const move = parseUci(uci);
    return move !== undefined && normaliseSan(makeSan(chess, move)).replace(/^([nbrqk])?[a-h]?[1-8]?(x?)([a-h][1-8])/u, "$1$2$3") === stripped;
  }).length > 1;
}

function legalUcis(input: BoardInputPosition): readonly string[] {
  return Object.freeze([...input.legalMoves.values()].flat());
}

/**
 * Produces the exact UCI forms that the graphical board submits. Chessground
 * represents standard castling with both rook and king destinations; the
 * semantic projection intentionally keeps only the king destination.
 */
export function legalMovesForFen(fen: string): ReadonlyMap<Square, readonly string[]> {
  return new Map(exactLegalMoveMap(fen).pieces.flatMap((row) => row.moves.length === 0
    ? []
    : [[row.piece.square, Object.freeze(row.moves.map((move) => move.uci))] as const]));
}

export interface SemanticCell {
  readonly id: string;
  readonly square: Square;
  readonly label: string;
  readonly active: boolean;
}

function occupant(piece: Piece | undefined): string {
  return piece === undefined ? "empty" : `${piece.color} ${piece.role}`;
}

/** A semantic projection only contains chess/input facts — never evidence or advice. */
export function semanticBoardRows(
  input: BoardInputPosition,
  state: BoardInputState,
): readonly (readonly SemanticCell[])[] {
  const chess = positionFromFen(input.fen);
  const destinations = new Set(state.legalDestinations);
  const lastDestination = displayedLastMove(input.fen, input.lastMove)?.[1];
  const checkedKing = chess.isCheck() ? chess.board.kingOf(input.sideToMove) : undefined;
  const checkedSquare = checkedKing === undefined ? undefined : makeSquare(checkedKing);
  return Object.freeze(visualRows(input.orientation).map((row) => Object.freeze(row.map((name) => {
    const parsed = parseSquare(name);
    const statuses: string[] = [];
    if (state.origin === name) statuses.push("selected origin");
    if (input.showDests && destinations.has(name)) statuses.push("legal destination");
    if (lastDestination === name) statuses.push("last move destination");
    if (checkedSquare === name) statuses.push("king in check");
    return Object.freeze({
      id: `board-square-${name}`,
      square: name,
      label: [name, occupant(parsed === undefined ? undefined : chess.board.get(parsed)), ...statuses].join(", "),
      active: state.activeSquare === name,
    });
  }))));
}

export class BoardInputController {
  #input: BoardInputPosition;
  #state: BoardInputState;

  constructor(input: BoardInputPosition, retainedActiveSquare?: Square, retainedAnnouncement?: string) {
    this.#input = input;
    this.#state = this.#idle(initialSquare(input, retainedActiveSquare), retainedAnnouncement ?? "Board ready.");
  }

  get state(): BoardInputState {
    return this.#state;
  }

  replacePosition(input: BoardInputPosition): BoardInputState {
    const activeSquare = initialSquare(input, this.#state.activeSquare);
    this.#input = input;
    // A successful authoritative mutation updates the announcement separately.
    // Preserve that result while the parent run projection replaces the FEN.
    const announcement = this.#state.lastAnnouncement.startsWith("Move committed:")
      ? this.#state.lastAnnouncement
      : "Position changed.";
    this.#state = this.#idle(activeSquare, announcement);
    return this.#state;
  }

  announce(message: string): BoardInputState {
    this.#state = this.#stateWith({ lastAnnouncement: message });
    return this.#state;
  }

  dispatch(action: BoardInputAction): BoardInputResult {
    if (this.#state.phase === "awaiting_promotion" && action.type !== "promote" && action.type !== "cancel") {
      return this.#result(this.#stateWith({ lastAnnouncement: "Choose a promotion piece or cancel." }));
    }

    if (action.type === "navigate") {
      return this.#result(this.#stateWith({
        activeSquare: visualMove(this.#state.activeSquare, this.#input.orientation, action.fileDelta, action.rankDelta),
        lastAnnouncement: `Active square: ${visualMove(this.#state.activeSquare, this.#input.orientation, action.fileDelta, action.rankDelta)}.`,
      }));
    }
    if (action.type === "navigate_edge") {
      const coordinates = visualCoordinates(this.#state.activeSquare, this.#input.orientation);
      const file = action.axis === "file" ? (action.edge === "first" ? 0 : 7) : coordinates.file;
      const rank = action.axis === "rank" ? (action.edge === "first" ? 0 : 7) : coordinates.rank;
      const activeSquare = fromVisualCoordinates(file, rank, this.#input.orientation);
      return this.#result(this.#stateWith({ activeSquare, lastAnnouncement: `Active square: ${activeSquare}.` }));
    }
    if (action.type === "cancel") {
      if (this.#state.phase === "idle") return this.#result(this.#stateWith({ lastAnnouncement: "No move selection to cancel." }));
      return this.#result(this.#idle(this.#state.activeSquare, "Move selection cancelled."));
    }
    if (this.#input.disabled) {
      return this.#result(this.#stateWith({ lastAnnouncement: "This board is not accepting moves." }));
    }
    if (action.type === "promote") return this.#promote(action.role);
    if (action.type === "text_move") return this.#textMove(action.value);
    if (action.type === "activate") return this.#activate(this.#state.activeSquare);
    if (action.type === "pointer_origin") return this.#select(action.square);
    return this.#destination(action.square);
  }

  #result(state: BoardInputState, moveUci?: string, successAnnouncement?: string): BoardInputResult {
    this.#state = state;
    return Object.freeze({
      state,
      ...(moveUci === undefined ? {} : { moveUci }),
      ...(successAnnouncement === undefined ? {} : { successAnnouncement }),
    });
  }

  #idle(activeSquare: Square, lastAnnouncement: string): BoardInputState {
    return Object.freeze({
      phase: "idle",
      activeSquare,
      origin: null,
      legalDestinations: Object.freeze([]),
      pendingPromotion: null,
      lastAnnouncement,
    });
  }

  #stateWith(change: Partial<BoardInputState>): BoardInputState {
    return Object.freeze({ ...this.#state, ...change });
  }

  #select(origin: Square): BoardInputResult {
    const legal = this.#input.legalMoves.get(origin);
    if (legal === undefined || legal.length === 0) {
      return this.#result(this.#stateWith({ activeSquare: origin, lastAnnouncement: `Square ${origin} cannot start a legal move.` }));
    }
    const destinations = unique(legal.map((uci) => semanticDestinationOf(this.#input.fen, uci)));
    return this.#result(Object.freeze({
      phase: "origin_selected",
      activeSquare: origin,
      origin,
      legalDestinations: destinations,
      pendingPromotion: null,
      lastAnnouncement: announcementForSelection(origin, destinations, this.#input.showDests),
    }));
  }

  #activate(target: Square): BoardInputResult {
    if (this.#state.phase === "idle") return this.#select(target);
    if (this.#state.origin === null) return this.#select(target);
    if (this.#input.legalMoves.has(target)) return this.#select(target);
    return this.#destination(target);
  }

  #destination(destination: Square): BoardInputResult {
    const origin = this.#state.origin;
    if (origin === null) return this.#select(destination);
    const candidates = (this.#input.legalMoves.get(origin) ?? []).filter((uci) => semanticDestinationOf(this.#input.fen, uci) === destination);
    if (candidates.length === 0) {
      return this.#result(this.#stateWith({
        activeSquare: destination,
        lastAnnouncement: `From ${origin} to ${destination} is not a legal destination.`,
      }));
    }
    if (candidates.length === 1) return this.#commit(candidates[0]!);
    const roles = unique(candidates.flatMap((uci) => {
      const role = roleFor(uci);
      return role === undefined ? [] : [role];
    }));
    const pendingPromotion = Object.freeze({ origin, destination, roles });
    return this.#result(Object.freeze({
      phase: "awaiting_promotion",
      activeSquare: destination,
      origin,
      legalDestinations: Object.freeze([]),
      pendingPromotion,
      lastAnnouncement: `Promotion from ${origin} to ${destination}. Choose a piece.`,
    }));
  }

  #promote(role: PromotionRole): BoardInputResult {
    const pending = this.#state.pendingPromotion;
    if (pending === null || !pending.roles.includes(role)) {
      return this.#result(this.#stateWith({ lastAnnouncement: "That promotion piece is not available." }));
    }
    const suffix = { queen: "q", rook: "r", bishop: "b", knight: "n" }[role];
    return this.#commit(`${pending.origin}${pending.destination}${suffix}`);
  }

  #textMove(value: string): BoardInputResult {
    const entered = normaliseMoveText(value);
    if (entered.length === 0) return this.#result(this.#stateWith({ lastAnnouncement: "Enter a legal SAN or UCI move." }));
    const legal = legalUcis(this.#input);
    const chess = positionFromFen(this.#input.fen);
    const compact = entered.replaceAll(/\s+/gu, "").toLocaleLowerCase("en-US");
    const uci = parseUci(compact);
    if (uci !== undefined) {
      const identity = makeUci(normalizeMove(chess, uci));
      if (this.#isLegalUci(identity)) return this.#commit(identity);
    }

    const directSan = parseSan(chess, entered);
    if (directSan !== undefined) {
      const identity = makeUci(normalizeMove(chess, directSan));
      if (this.#isLegalUci(identity)) return this.#commit(identity);
    }
    const equivalent = legal.find((candidate) => {
      const move = parseUci(candidate);
      return move !== undefined && normaliseSan(makeSan(chess, move)) === normaliseSan(entered);
    });
    if (equivalent !== undefined) return this.#commit(equivalent);
    if (hasAmbiguousShape(entered, legal, chess)) {
      return this.#result(this.#stateWith({ lastAnnouncement: "That move is ambiguous. Include the origin file or rank." }));
    }
    return this.#result(this.#stateWith({ lastAnnouncement: "That move is not legal in this position." }));
  }

  #isLegalUci(uci: string): boolean {
    return legalUcis(this.#input).includes(uci);
  }

  #commit(moveUci: string): BoardInputResult {
    const chess = positionFromFen(this.#input.fen);
    const move = parseUci(moveUci);
    const notation = move === undefined ? moveUci : makeSan(chess, move);
    const destination = semanticDestinationOf(this.#input.fen, moveUci);
    return this.#result(
      this.#idle(destination, `Move staged: ${notation}. Waiting for the game to accept it.`),
      moveUci,
      `Move committed: ${notation}.`,
    );
  }
}

export function boardInputPosition(
  fen: string,
  orientation: "white" | "black",
  disabled: boolean,
  showDests: boolean,
  lastMove?: string | null,
): BoardInputPosition {
  const chess = positionFromFen(fen);
  return Object.freeze({
    fen,
    orientation,
    sideToMove: chess.turn as Color,
    legalMoves: legalMovesForFen(fen),
    disabled,
    showDests,
    ...(lastMove === undefined ? {} : { lastMove }),
  });
}

export function promotionRoleLabel(role: PromotionRole): string {
  return ROLE_NAME[role];
}
