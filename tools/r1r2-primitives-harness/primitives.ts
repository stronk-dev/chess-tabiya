// DISPOSABLE research harness — R1/R2, planning/campaign-research-queue.md. Not production code.
import { attacks, between, kingAttacks, knightAttacks, pawnAttacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { SquareSet } from "chessops/squareSet";
import type { Color, Piece, Role, Square } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";

export function pos(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

// ---------------------------------------------------------------- attack maps
export interface AttackMap {
  readonly bySquare: (SquareSet | undefined)[];
  readonly count: { white: Int8Array; black: Int8Array };
  readonly attackedBy: { white: SquareSet; black: SquareSet };
}

export function attackMap(p: Chess): AttackMap {
  const bySquare: (SquareSet | undefined)[] = new Array(64);
  const count = { white: new Int8Array(64), black: new Int8Array(64) };
  let aw = SquareSet.empty();
  let ab = SquareSet.empty();
  for (const [sq, piece] of p.board) {
    const a = attacks(piece, sq, p.board.occupied);
    bySquare[sq] = a;
    const c = count[piece.color];
    for (const t of a) c[t]! += 1;
    if (piece.color === "white") aw = aw.union(a);
    else ab = ab.union(a);
  }
  return { bySquare, count, attackedBy: { white: aw, black: ab } };
}

const pairKey = (from: Square, to: Square): number => from * 64 + to;

/** Ordered pairs (attacker square, enemy-occupied target square). */
export function attackPairs(p: Chess, map: AttackMap): Set<number> {
  const out = new Set<number>();
  for (const [sq, piece] of p.board) {
    const targets = map.bySquare[sq]!.intersect(p.board[opposite(piece.color)]);
    for (const t of targets) out.add(pairKey(sq, t));
  }
  return out;
}

/** Ordered pairs (defender square, friendly-occupied defended square). */
export function defencePairs(p: Chess, map: AttackMap): Set<number> {
  const out = new Set<number>();
  for (const [sq, piece] of p.board) {
    const targets = map.bySquare[sq]!.intersect(p.board[piece.color]);
    for (const t of targets) out.add(pairKey(sq, t));
  }
  return out;
}

export function setDiff(before: Set<number>, after: Set<number>): { created: number; removed: number } {
  let created = 0;
  let removed = 0;
  for (const k of after) if (!before.has(k)) created += 1;
  for (const k of before) if (!after.has(k)) removed += 1;
  return { created, removed };
}

// ------------------------------------------------------------- control delta
export function controlDelta(a: AttackMap, b: AttackMap): { squaresChanged: number; l1: number } {
  let squaresChanged = 0;
  let l1 = 0;
  for (let sq = 0; sq < 64; sq += 1) {
    const dw = b.count.white[sq]! - a.count.white[sq]!;
    const db = b.count.black[sq]! - a.count.black[sq]!;
    if (dw !== 0 || db !== 0) squaresChanged += 1;
    l1 += Math.abs(dw) + Math.abs(db);
  }
  return { squaresChanged, l1 };
}

// ------------------------------------------------------------ line blockers
const DIRS: Record<"bishop" | "rook" | "queen", readonly (readonly [number, number])[]> = {
  bishop: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  queen: [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
};

/** Map of "sliderSquare:endpointSquare" -> blocker count, exactly the shipped `line_blockers` arithmetic. */
export function lineBlockers(p: Chess): Map<number, number> {
  const out = new Map<number, number>();
  for (const [sq, piece] of p.board) {
    const dirs = DIRS[piece.role as "bishop" | "rook" | "queen"];
    if (dirs === undefined) continue;
    for (const [df, dr] of dirs) {
      let file = sq % 8;
      let rank = sq >> 3;
      let endpoint = sq;
      while (file + df >= 0 && file + df < 8 && rank + dr >= 0 && rank + dr < 8) {
        file += df;
        rank += dr;
        endpoint = file + rank * 8;
      }
      const span = between(sq, endpoint);
      if (!span.isEmpty()) out.set(sq * 64 + endpoint, span.intersect(p.board.occupied).size());
    }
  }
  return out;
}

export function lineDelta(a: Map<number, number>, b: Map<number, number>): { opened: number; closed: number } {
  let opened = 0;
  let closed = 0;
  for (const [k, v] of b) {
    const prior = a.get(k);
    if (prior === undefined) continue;
    if (v < prior) opened += 1;
    else if (v > prior) closed += 1;
  }
  return { opened, closed };
}

// -------------------------------------------------------- escape-square sets
/** Geometric destination squares (no legality search): attacks minus own pieces, plus pawn pushes. */
export function geometricDests(p: Chess, map: AttackMap, sq: Square, piece: Piece): SquareSet {
  let d = map.bySquare[sq]!.diff(p.board[piece.color]);
  if (piece.role === "pawn") {
    d = d.intersect(p.board[opposite(piece.color)]);
    const step = piece.color === "white" ? 8 : -8;
    const one = sq + step;
    if (one >= 0 && one < 64 && !p.board.occupied.has(one as Square)) {
      d = d.with(one as Square);
      const home = piece.color === "white" ? sq >> 3 === 1 : sq >> 3 === 6;
      const two = sq + 2 * step;
      if (home && !p.board.occupied.has(two as Square)) d = d.with(two as Square);
    }
  }
  return d;
}

/** For every piece of `color`: destinations not controlled by the opponent. Board geometry only. */
export function safeDests(p: Chess, map: AttackMap, color: Color): Map<Square, SquareSet> {
  const out = new Map<Square, SquareSet>();
  const hostile = map.attackedBy[opposite(color)];
  for (const sq of p.board[color]) {
    const piece = p.board.get(sq)!;
    out.set(sq, geometricDests(p, map, sq, piece).diff(hostile));
  }
  return out;
}

export function escapeSquaresRemoved(
  before: Map<Square, SquareSet>,
  after: Map<Square, SquareSet>,
): { removed: number; added: number; piecesAffected: number } {
  let removed = 0;
  let added = 0;
  let piecesAffected = 0;
  for (const [sq, a] of before) {
    const b = after.get(sq);
    if (b === undefined) continue;
    const r = a.diff(b).size();
    const g = b.diff(a).size();
    if (r > 0 || g > 0) piecesAffected += 1;
    removed += r;
    added += g;
  }
  return { removed, added, piecesAffected };
}

// ------------------------------------------------------- defended duties
/** For each piece: how many *attacked* friendly pieces it defends. A count, never a verdict. */
export function defendedDuties(p: Chess, map: AttackMap): Map<Square, number> {
  const out = new Map<Square, number>();
  for (const [sq, piece] of p.board) {
    const hostile = map.attackedBy[opposite(piece.color)];
    const duties = map.bySquare[sq]!.intersect(p.board[piece.color]).intersect(hostile);
    if (duties.nonEmpty()) out.set(sq, duties.size());
  }
  return out;
}

export function dutyDelta(a: Map<Square, number>, b: Map<Square, number>): { acquiredSecondDuty: number; maxDuties: number } {
  let acquired = 0;
  let max = 0;
  for (const [sq, v] of b) {
    if (v > max) max = v;
    const prior = a.get(sq) ?? 0;
    if (v >= 2 && prior < 2) acquired += 1;
  }
  return { acquiredSecondDuty: acquired, maxDuties: max };
}

// ------------------------------------------------------------ irreversibility
/** Extracted verbatim in behaviour from packages/runtime/src/pivotal.ts:32-57. */
export function capturedRole(parent: Chess, node: Chess, uci: string): { color: Color; role: Role } | undefined {
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return undefined;
  const mover = parent.board.get(move.from);
  if (mover === undefined) return undefined;
  const direct = parent.board.get(move.to);
  if (direct !== undefined && direct.color !== mover.color) return direct;
  if (mover.role === "pawn" && move.from % 8 !== move.to % 8 && node.board.get(move.to)?.role === "pawn") {
    return { color: mover.color === "white" ? "black" : "white", role: "pawn" };
  }
  return undefined;
}

export type Irrev = { subkind: "castled" | "last_of_role" | "pawn_break" } | undefined;

export function irreversibility(parent: Chess, current: Chess, uci: string): Irrev {
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return undefined;
  const mover = parent.board.get(move.from);
  if (mover === undefined) return undefined;
  if (mover.role === "king" && Math.abs((move.to % 8) - (move.from % 8)) === 2) return { subkind: "castled" };
  const captured = capturedRole(parent, current, uci);
  if (captured !== undefined && current.board.pieces(captured.color, captured.role).isEmpty()) return { subkind: "last_of_role" };
  if (mover.role === "pawn") {
    if (captured !== undefined) return { subkind: "pawn_break" };
    const enemy = current.board.pieces(opposite(mover.color), "pawn");
    const beforeContact = pawnAttacks(mover.color, move.from).intersects(parent.board.pieces(opposite(mover.color), "pawn"));
    const afterContact = pawnAttacks(mover.color, move.to).intersects(enemy);
    if (!beforeContact && afterContact) return { subkind: "pawn_break" };
  }
  return undefined;
}

/** The free half: the FEN's own halfmove clock. */
export function zeroing(parentFen: string, fen: string): boolean {
  return Number(fen.split(" ")[4]) === 0 && Number(parentFen.split(" ")[4]) !== 0;
}

// -------------------------------------------------------------------- tempo
export function legalMoveCount(p: Chess): number {
  let n = 0;
  for (const [, dests] of p.allDests()) n += dests.size();
  return n;
}

// ------------------------------------------------------- graph distance (R2)
function bfsTable(steps: (sq: Square) => SquareSet): Uint8Array {
  const table = new Uint8Array(64 * 64).fill(255);
  for (let start = 0; start < 64; start += 1) {
    table[start * 64 + start] = 0;
    let frontier = SquareSet.fromSquare(start as Square);
    let seen = frontier;
    let d = 0;
    while (frontier.nonEmpty()) {
      d += 1;
      let next = SquareSet.empty();
      for (const sq of frontier) next = next.union(steps(sq));
      next = next.diff(seen);
      for (const sq of next) table[start * 64 + sq] = d;
      seen = seen.union(next);
      frontier = next;
    }
  }
  return table;
}

function slideSteps(role: "bishop" | "rook" | "queen"): (sq: Square) => SquareSet {
  return (sq) => attacks({ role, color: "white" }, sq, SquareSet.empty());
}

export const KNIGHT_DIST = bfsTable((sq) => knightAttacks(sq));
export const KING_DIST = bfsTable((sq) => kingAttacks(sq));
export const BISHOP_DIST = bfsTable(slideSteps("bishop"));
export const ROOK_DIST = bfsTable(slideSteps("rook"));
export const QUEEN_DIST = bfsTable(slideSteps("queen"));

export function distanceTable(role: Role): Uint8Array | undefined {
  if (role === "knight") return KNIGHT_DIST;
  if (role === "king") return KING_DIST;
  if (role === "bishop") return BISHOP_DIST;
  if (role === "rook") return ROOK_DIST;
  if (role === "queen") return QUEEN_DIST;
  return undefined;
}

/** Empty-board graph distance from `sq` to the nearest square of `targets`. 255 = unreachable. */
export function distanceToSet(role: Role, sq: Square, targets: SquareSet): number {
  const table = distanceTable(role);
  if (table === undefined) return 255;
  let best = 255;
  for (const t of targets) {
    const d = table[sq * 64 + t]!;
    if (d < best) best = d;
  }
  return best;
}

export { makeSquare, opposite, parseUci };
