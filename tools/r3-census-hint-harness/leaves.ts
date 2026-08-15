// DISPOSABLE research harness — R3, planning/campaign-research-queue.md. Not production code.
//
// The six transition leaves of `rfc/transition-primitives.md` §2.3, implemented with the
// TARGET-KEYED / COLOUR-KEYED semantics the RFC specifies (§2.4), not the (attacker,target)
// pair keying the R1 harness used. Each leaf returns a list of WITNESSES rather than a bare
// boolean, because R3's question is not "did it fire" but "is what it says worth reading".
//
// Every witness carries three mechanical flags, defined in the dossier:
//   remote        — axis T1 (primary): the fact is NOT fully explained by what the moved piece
//                   does from the square it landed on. Side effects (departures, discoveries,
//                   blocks, third-party consequences) pass; foreground effects fail.
//   remoteStrict  — axis T0 (lower bound): additionally requires a piece that did NOT move to
//                   have changed what it does — pure discovered effects only.
//   consequential — axis C: the fact names something contested under the rules alone.

import { attacks, between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { SquareSet } from "chessops/squareSet";
import type { Color, Piece, Role, Square } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";

import { attackMap, geometricDests, irreversibility, zeroing } from "../r1r2-primitives-harness/primitives.js";

export const COLORS: readonly Color[] = ["white", "black"];
const SLIDERS: ReadonlySet<Role> = new Set<Role>(["bishop", "rook", "queen"]);

const DIRS: Record<"bishop" | "rook" | "queen", readonly (readonly [number, number])[]> = {
  bishop: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  queen: [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
};

// ------------------------------------------------------------------- context
export interface Ctx {
  readonly p: Chess;
  readonly map: ReturnType<typeof attackMap>;
  /** attackers[color][target] = squares of `color` pieces attacking `target`. */
  readonly attackers: { readonly white: SquareSet[]; readonly black: SquareSet[] };
}

export function ctxOf(p: Chess): Ctx {
  const map = attackMap(p);
  const white = new Array<SquareSet>(64).fill(SquareSet.empty());
  const black = new Array<SquareSet>(64).fill(SquareSet.empty());
  for (const [sq, piece] of p.board) {
    const bucket = piece.color === "white" ? white : black;
    for (const t of map.bySquare[sq]!) bucket[t] = bucket[t]!.with(sq);
  }
  return { p, map, attackers: { white, black } };
}

export function ctx(fen: string): Ctx {
  return ctxOf(Chess.fromSetup(parseFen(fen).unwrap()).unwrap());
}

export interface Tr {
  readonly before: Ctx;
  readonly after: Ctx;
  readonly uci: string;
  /** Every square whose occupant differs between the two positions. Handles castling and e.p. */
  readonly changed: SquareSet;
  /** Squares a piece newly stands on after the move (normal: {to}; castling: {g1,f1}). */
  readonly arrival: SquareSet;
  /** `arrival` plus everything the pieces standing there now attack — the "foreground" set. */
  readonly arrivalCoverage: SquareSet;
}

function changedSquares(a: Chess, b: Chess): SquareSet {
  let out = SquareSet.empty();
  for (let sq = 0 as Square; sq < 64; sq = (sq + 1) as Square) {
    const x = a.board.get(sq);
    const y = b.board.get(sq);
    if (x === undefined && y === undefined) continue;
    if (x === undefined || y === undefined || x.color !== y.color || x.role !== y.role) out = out.with(sq);
  }
  return out;
}

export function transition(before: Ctx, after: Ctx, uci: string): Tr {
  const changed = changedSquares(before.p, after.p);
  const arrival = changed.intersect(after.p.board.occupied);
  let coverage = arrival;
  for (const sq of arrival) coverage = coverage.union(after.map.bySquare[sq]!);
  return { before, after, uci, changed, arrival, arrivalCoverage: coverage };
}

// ------------------------------------------------------------------ witnesses
export interface Witness {
  readonly leaf: string;
  readonly direction: string;
  readonly color: Color;
  readonly square: Square;
  readonly remote: boolean;
  readonly remoteStrict: boolean;
  readonly consequential: boolean;
  readonly sentence: string;
}

export type LeafName =
  | "attacked_squares_changed"
  | "defended_squares_changed"
  | "slider_lines_changed"
  | "escape_squares_changed"
  | "defended_duties_changed"
  | "move_irreversibility";

export const LEAF_DIRECTIONS: Record<LeafName, readonly string[]> = {
  attacked_squares_changed: ["gained", "lost"],
  defended_squares_changed: ["gained", "lost"],
  slider_lines_changed: ["opened", "closed"],
  escape_squares_changed: ["lost", "gained"],
  defended_duties_changed: ["acquired", "released"],
  move_irreversibility: ["fired"],
};

// L1 — attacked_squares_changed (target-keyed, both-occupied conjunct)
export function attackedSquaresChanged(t: Tr, direction: "gained" | "lost"): Witness[] {
  const out: Witness[] = [];
  for (const color of COLORS) {
    const enemy = opposite(color);
    const both = t.before.p.board[enemy].intersect(t.after.p.board[enemy]);
    for (const s of both) {
      const b = t.before.attackers[color][s]!;
      const a = t.after.attackers[color][s]!;
      const fired = direction === "gained" ? b.isEmpty() && a.nonEmpty() : b.nonEmpty() && a.isEmpty();
      if (!fired) continue;
      // T1: for `gained`, fails when every new attacker stands on a square the move put it on —
      // "my move attacks that". For `lost`, the cause is always a departure, a block or a
      // capture, all of which are side effects (`design/05` §5, "what is the moved piece no
      // longer doing").
      const remote = direction === "lost" || !a.subsetOf(t.arrival);
      // T0: a piece that did NOT move changed its attacking relation to s.
      const remoteStrict = !b.diff(t.changed).equals(a.diff(t.changed));
      // C: the target is loose in the position where the attack exists — the queue's own
      // useless exemplar is "this move attacks a DEFENDED pawn".
      const where = direction === "gained" ? t.after : t.before;
      const consequential = where.attackers[enemy][s]!.isEmpty();
      const role = t.after.p.board.get(s)!.role;
      out.push({
        leaf: "attacked_squares_changed", direction, color, square: s, remote, remoteStrict, consequential,
        sentence: `${color} ${direction === "gained" ? "now attacks" : "no longer attacks"} the ${enemy} ${role} on ${makeSquare(s)}`,
      });
    }
  }
  return out;
}

// L2 — defended_squares_changed
export function defendedSquaresChanged(t: Tr, direction: "gained" | "lost"): Witness[] {
  const out: Witness[] = [];
  for (const color of COLORS) {
    const both = t.before.p.board[color].intersect(t.after.p.board[color]);
    for (const s of both) {
      const b = t.before.attackers[color][s]!;
      const a = t.after.attackers[color][s]!;
      const fired = direction === "gained" ? b.isEmpty() && a.nonEmpty() : b.nonEmpty() && a.isEmpty();
      if (!fired) continue;
      const remote = direction === "lost" || !a.subsetOf(t.arrival);
      const remoteStrict = !b.diff(t.changed).equals(a.diff(t.changed));
      // C: the piece is actually attacked in the resulting position. "You now defend a piece
      // nobody attacks" names nothing.
      const consequential = t.after.attackers[opposite(color)][s]!.nonEmpty();
      const role = t.after.p.board.get(s)!.role;
      out.push({
        leaf: "defended_squares_changed", direction, color, square: s, remote, remoteStrict, consequential,
        sentence: `the ${color} ${role} on ${makeSquare(s)} is ${direction === "gained" ? "now" : "no longer"} defended`,
      });
    }
  }
  return out;
}

// L3 — slider_lines_changed (ray key must survive the move)
export function sliderLinesChanged(t: Tr, direction: "opened" | "closed"): Witness[] {
  const out: Witness[] = [];
  for (const [s, piece] of t.before.p.board) {
    if (!SLIDERS.has(piece.role)) continue;
    const later = t.after.p.board.get(s);
    if (later === undefined || later.color !== piece.color || later.role !== piece.role) continue;
    for (const [df, dr] of DIRS[piece.role as "bishop" | "rook" | "queen"]) {
      let file = s % 8;
      let rank = s >> 3;
      let endpoint = s;
      while (file + df >= 0 && file + df < 8 && rank + dr >= 0 && rank + dr < 8) {
        file += df;
        rank += dr;
        endpoint = file + rank * 8;
      }
      const span = between(s, endpoint as Square);
      if (span.isEmpty()) continue;
      const bBlock = span.intersect(t.before.p.board.occupied);
      const aBlock = span.intersect(t.after.p.board.occupied);
      const fired = direction === "opened" ? aBlock.size() < bBlock.size() : aBlock.size() > bBlock.size();
      if (!fired) continue;
      // T: the slider itself never moved — the ray key requires it to stand still. Recorded
      // as a measurement rather than assumed.
      const remote = !t.changed.has(s);
      // C: the ray crossed the 0-blocker line. "Three blockers became two" names nothing.
      const consequential = direction === "opened" ? aBlock.isEmpty() : bBlock.isEmpty();
      out.push({
        leaf: "slider_lines_changed", direction, color: piece.color, square: s, remote, remoteStrict: remote, consequential,
        sentence: `the ${piece.color} ${piece.role} on ${makeSquare(s)} ${direction} its line toward ${makeSquare(endpoint as Square)} (${bBlock.size()}→${aBlock.size()} blockers)`,
      });
    }
  }
  return out;
}

function safeDestsOf(c: Ctx, s: Square, piece: Piece): SquareSet {
  return geometricDests(c.p, c.map, s, piece).diff(c.map.attackedBy[opposite(piece.color)]);
}

// L4 — escape_squares_changed (same-square identity)
export function escapeSquaresChanged(t: Tr, direction: "lost" | "gained"): Witness[] {
  const out: Witness[] = [];
  for (const [s, piece] of t.before.p.board) {
    const later = t.after.p.board.get(s);
    if (later === undefined || later.color !== piece.color || later.role !== piece.role) continue;
    const bSafe = safeDestsOf(t.before, s, piece);
    const aSafe = safeDestsOf(t.after, s, later);
    const delta = direction === "lost" ? bSafe.diff(aSafe) : aSafe.diff(bSafe);
    if (delta.isEmpty()) continue;
    // T1: for `lost`, fails when every square taken away is one the moved piece now stands on
    // or now hits. `gained` squares are freed by a departure or a capture — a side effect.
    const remote = direction === "gained" || delta.diff(t.arrivalCoverage).nonEmpty();
    // C: the piece is under attack in the resulting position — it has a reason to need squares.
    // Grounded on `design/05-in-run-experience.md` §3b, which names "that knight has no retreat
    // square" as the canonical rung-0 fact.
    const consequential = t.after.attackers[opposite(piece.color)][s]!.nonEmpty();
    out.push({
      leaf: "escape_squares_changed", direction, color: piece.color, square: s, remote, remoteStrict: remote, consequential,
      sentence: `the ${piece.color} ${piece.role} on ${makeSquare(s)} ${direction} ${delta.size()} uncontested destination(s) (${bSafe.size()}→${aSafe.size()})`,
    });
  }
  return out;
}

function dutiesOf(c: Ctx, s: Square, color: Color): SquareSet {
  return c.map.bySquare[s]!.intersect(c.p.board[color]).intersect(c.map.attackedBy[opposite(color)]);
}

// L5 — defended_duties_changed (threshold crossing at 2, same-square identity)
export function defendedDutiesChanged(t: Tr, direction: "acquired" | "released"): Witness[] {
  const out: Witness[] = [];
  for (const [s, piece] of t.before.p.board) {
    const later = t.after.p.board.get(s);
    if (later === undefined || later.color !== piece.color || later.role !== piece.role) continue;
    const bD = dutiesOf(t.before, s, piece.color);
    const aD = dutiesOf(t.after, s, piece.color);
    const fired = direction === "acquired" ? aD.size() >= 2 && bD.size() < 2 : bD.size() >= 2 && aD.size() < 2;
    if (!fired) continue;
    const wardDelta = direction === "acquired" ? aD.diff(bD) : bD.diff(aD);
    // T1: if the only new ward is the piece the learner just moved onto that square, they
    // watched it happen. `released` is always a side effect.
    const remote = direction === "released" || wardDelta.diff(t.arrival).nonEmpty();
    // C: at least one ward is defended by this piece ALONE. A duty others also cover is not one.
    const wards = direction === "acquired" ? aD : bD;
    const where = direction === "acquired" ? t.after : t.before;
    let sole = false;
    for (const w of wards) if (where.attackers[piece.color][w]!.equals(SquareSet.fromSquare(s))) sole = true;
    out.push({
      leaf: "defended_duties_changed", direction, color: piece.color, square: s, remote, remoteStrict: remote, consequential: sole,
      sentence: `the ${piece.color} ${piece.role} on ${makeSquare(s)} ${direction === "acquired" ? "now defends" : "no longer defends"} ${(direction === "acquired" ? aD : bD).size()} attacked ${piece.color} pieces`,
    });
  }
  return out;
}

// L6 — move_irreversibility
export function moveIrreversibility(t: Tr, beforeFen: string, afterFen: string): Witness[] {
  const irr = irreversibility(t.before.p, t.after.p, t.uci);
  const zeroed = zeroing(beforeFen, afterFen);
  const out: Witness[] = [];
  const mover = t.before.p.turn;
  const push = (subkind: string, remote: boolean): void => {
    const move = parseUci(t.uci);
    const sq = move !== undefined && "to" in move ? move.to : (0 as Square);
    out.push({
      leaf: "move_irreversibility", direction: subkind, color: mover, square: sq, remote,
      remoteStrict: remote, consequential: true,
      sentence: `${mover} played an irreversible move (${subkind})`,
    });
  };
  if (irr !== undefined) push(irr.subkind, irr.subkind === "last_of_role");
  if (zeroed && irr === undefined) push("clock_zeroed", false);
  return out;
}

// ------------------------------------------------------------------ dispatch
export function witnesses(t: Tr, leaf: LeafName, direction: string, beforeFen?: string, afterFen?: string): Witness[] {
  switch (leaf) {
    case "attacked_squares_changed": return attackedSquaresChanged(t, direction as "gained" | "lost");
    case "defended_squares_changed": return defendedSquaresChanged(t, direction as "gained" | "lost");
    case "slider_lines_changed": return sliderLinesChanged(t, direction as "opened" | "closed");
    case "escape_squares_changed": return escapeSquaresChanged(t, direction as "lost" | "gained");
    case "defended_duties_changed": return defendedDutiesChanged(t, direction as "acquired" | "released");
    case "move_irreversibility": return moveIrreversibility(t, beforeFen!, afterFen!);
  }
}

export { makeSquare, opposite, parseUci, attacks };
