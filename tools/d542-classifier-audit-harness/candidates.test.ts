// DISPOSABLE research harness — candidate detectors the classifier does NOT have.
// Measures firing rate and axis-D lift for eight annotations a chess.com-class review
// makes and Tabiya does not, each implemented as pure position/move arithmetic over
// chessops (no engine, no corpus), so the cost of adding them is legible.
import { writeFileSync } from "node:fs";

import { attacks, between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Square } from "chessops/types";
import { makeUci, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { transitions, type Transition } from "../r1r2-primitives-harness/corpus.js";

const OUT = new URL("./candidates-output.md", import.meta.url).pathname;
const VALUE: Readonly<Record<string, number>> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };

function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function rankOf(square: number): number { return Math.floor(square / 8); }
function shadeOf(square: number): "light" | "dark" { return ((square % 8) + rankOf(square)) % 2 === 1 ? "light" : "dark"; }

function attackCount(pos: Chess, color: Color, target: Square): number {
  let n = 0;
  for (const [square, piece] of pos.board) if (piece.color === color && attacks(piece, square, pos.board.occupied).has(target)) n += 1;
  return n;
}

/** 1. Hanging piece: a non-pawn attacked by the side to move and defended zero times. */
function hangingPiece(fen: string): boolean {
  const pos = position(fen);
  const mover = pos.turn, enemy = opposite(mover);
  for (const square of pos.board[enemy]) {
    const piece = pos.board.get(square as Square)!;
    if (piece.role === "pawn" || piece.role === "king") continue;
    if (attackCount(pos, mover, square as Square) > 0 && attackCount(pos, enemy, square as Square) === 0) return true;
  }
  return false;
}

/** 2. Fork: the piece that just moved attacks >=2 enemy pieces each worth >= a knight. */
function fork(beforeFen: string, uci: string, afterFen: string): boolean {
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const pos = position(afterFen);
  const landed = pos.board.get(move.to);
  if (landed === undefined) return false;
  const enemy = opposite(landed.color);
  let n = 0;
  for (const target of attacks(landed, move.to, pos.board.occupied)) {
    const victim = pos.board.get(target);
    if (victim?.color === enemy && VALUE[victim.role]! >= 3) n += 1;
  }
  return n >= 2;
}

/** 3. Absolute pin: an enemy piece on a slider ray to its own king with nothing between. */
function absolutePin(fen: string): boolean {
  const pos = position(fen);
  for (const color of ["white", "black"] as const) {
    const king = pos.board.kingOf(opposite(color));
    if (king === undefined) continue;
    for (const [square, piece] of pos.board) {
      if (piece.color !== color || !["bishop", "rook", "queen"].includes(piece.role)) continue;
      const span = between(square as Square, king);
      if (span.isEmpty()) continue;
      const blockers = [...span.intersect(pos.board.occupied)];
      if (blockers.length !== 1 || pos.board.getColor(blockers[0]!) !== opposite(color)) continue;
      // The slider must actually bear on the king once the single blocker is lifted.
      if (attacks(piece, square as Square, pos.board.occupied.without(blockers[0]!)).has(king)) return true;
    }
  }
  return false;
}

/** 4. Pawn islands, per colour (contiguous occupied pawn files). */
function pawnIslands(fen: string, color: Color): number {
  const pos = position(fen);
  const files = new Set([...pos.board.pieces(color, "pawn")].map((square) => square % 8));
  let islands = 0;
  for (let file = 0; file < 8; file += 1) if (files.has(file) && !files.has(file - 1)) islands += 1;
  return islands;
}

/** 5. Castling right lost this move without castling (the "king move prevents castling" case). */
function castlingRightLost(beforeFen: string, afterFen: string): boolean {
  const before = beforeFen.trim().split(/\s+/u)[2] ?? "-";
  const after = afterFen.trim().split(/\s+/u)[2] ?? "-";
  return before !== after;
}

/** 6. Rook on the seventh (relative) rank. */
function rookOnSeventh(fen: string): boolean {
  const pos = position(fen);
  for (const color of ["white", "black"] as const) {
    for (const square of pos.board.pieces(color, "rook")) {
      const relative = color === "white" ? rankOf(square) + 1 : 8 - rankOf(square);
      if (relative === 7) return true;
    }
  }
  return false;
}

/** 7. Bad bishop: >=4 own pawns standing on the bishop's own square shade. */
function badBishop(fen: string): boolean {
  const pos = position(fen);
  for (const color of ["white", "black"] as const) {
    for (const square of pos.board.pieces(color, "bishop")) {
      const shade = shadeOf(square);
      let n = 0;
      for (const pawn of pos.board.pieces(color, "pawn")) if (shadeOf(pawn) === shade) n += 1;
      if (n >= 4) return true;
    }
  }
  return false;
}

/** 8. Central pawn space: own pawns controlling squares on relative ranks 5-7 in files c-f. */
function centralSpace(fen: string, color: Color): number {
  const pos = position(fen);
  let n = 0;
  for (const pawn of pos.board.pieces(color, "pawn")) {
    const file = pawn % 8, rank = rankOf(pawn);
    const forward = color === "white" ? 1 : -1;
    for (const df of [-1, 1]) {
      const nf = file + df, nr = rank + forward;
      if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
      const relative = color === "white" ? nr + 1 : 8 - nr;
      if (relative >= 5 && relative <= 7 && nf >= 2 && nf <= 5) n += 1;
    }
  }
  return n;
}

interface Alt { readonly uci: string; readonly fen: string }
function alternatives(fen: string): Alt[] {
  const pos = position(fen);
  const out: Alt[] = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const promotion = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? ("queen" as const) : undefined;
    const move = promotion === undefined ? { from, to } : { from, to, promotion };
    if (!pos.isLegal(move)) continue;
    const next = pos.clone();
    next.play(move);
    out.push({ uci: makeUci(move), fen: makeFen(next.toSetup()) });
  }
  return out;
}

type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean;

const PROBES: Readonly<Record<string, Probe>> = {
  // "gained" semantics throughout: false before the move, true after it.
  hanging_piece_created: (b, _u, a) => !hangingPiece(b) && hangingPiece(a),
  fork_created: (b, u, a) => fork(b, u, a),
  absolute_pin_created: (b, _u, a) => !absolutePin(b) && absolutePin(a),
  pawn_island_gained: (b, _u, a) => pawnIslands(a, "white") > pawnIslands(b, "white") || pawnIslands(a, "black") > pawnIslands(b, "black"),
  castling_right_lost: (b, _u, a) => castlingRightLost(b, a),
  rook_reached_seventh: (b, _u, a) => !rookOnSeventh(b) && rookOnSeventh(a),
  bad_bishop_created: (b, _u, a) => !badBishop(b) && badBishop(a),
  central_space_gained: (b, _u, a) => centralSpace(a, "white") > centralSpace(b, "white") || centralSpace(a, "black") > centralSpace(b, "black"),
};

describe("candidate detectors the classifier does not have", () => {
  it("measures firing rate and axis-D lift for each", () => {
    const rows: Transition[] = transitions();
    const lines: string[] = [];
    const say = (s = "") => { lines.push(s); console.log(s); };

    say(`# Candidate-detector output`);
    say();
    say(`Corpus: ${new Set(rows.map((r) => r.pack)).size} packs, ${rows.length} spine transitions.`);
    say();

    const played = new Map<string, number>();
    const alt = new Map<string, number>();
    let playedN = 0;
    let altN = 0;
    for (const row of rows) {
      const alts = alternatives(row.parentFen).filter((a) => a.uci !== row.uci);
      if (alts.length === 0) continue;
      playedN += 1;
      for (const [name, probe] of Object.entries(PROBES)) if (probe(row.parentFen, row.uci, row.fen)) played.set(name, (played.get(name) ?? 0) + 1);
      for (const a of alts) {
        altN += 1;
        for (const [name, probe] of Object.entries(PROBES)) if (probe(row.parentFen, a.uci, a.fen)) alt.set(name, (alt.get(name) ?? 0) + 1);
      }
    }

    say(`Denominators: ${playedN} played moves, ${altN} legal alternatives.`);
    say();
    say(`| candidate detector | played rate | alt rate | LIFT |`);
    say(`|---|---|---|---|`);
    const out = Object.keys(PROBES).map((name) => {
      const pr = (played.get(name) ?? 0) / playedN;
      const ar = (alt.get(name) ?? 0) / altN;
      return { name, pr, ar, lift: ar === 0 ? Number.POSITIVE_INFINITY : pr / ar };
    }).sort((x, y) => y.lift - x.lift);
    for (const r of out) say(`| \`${r.name}\` | ${(100 * r.pr).toFixed(2)}% | ${(100 * r.ar).toFixed(3)}% | ${Number.isFinite(r.lift) ? `${r.lift.toFixed(2)}x` : "inf"} |`);
    say();

    // static prevalence, for the "how often would it have anything to say" question
    const fens = [...new Set(rows.flatMap((r) => [r.parentFen, r.fen]))];
    say(`Static prevalence over ${fens.length} distinct positions:`);
    const statics: Readonly<Record<string, (fen: string) => boolean>> = {
      hanging_piece: (f) => hangingPiece(f),
      absolute_pin: (f) => absolutePin(f),
      rook_on_seventh: (f) => rookOnSeventh(f),
      bad_bishop: (f) => badBishop(f),
      more_than_two_pawn_islands: (f) => pawnIslands(f, "white") > 2 || pawnIslands(f, "black") > 2,
    };
    for (const [name, probe] of Object.entries(statics)) {
      const n = fens.filter(probe).length;
      say(`- \`${name}\`: ${n}/${fens.length} = ${((100 * n) / fens.length).toFixed(2)}%`);
    }
    say();

    writeFileSync(OUT, `${lines.join("\n")}\n`, "utf8");
    expect(rows.length).toBeGreaterThan(500);
  });
});
