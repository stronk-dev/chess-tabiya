import type { Color, Move } from "chessops/types";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { krpkrGeometry } from "../d2495-endgame-technique-applicability/geometry.js";
import { parseMethodUci } from "../d2496-endgame-method-path/method.js";
import type { ReachabilityNode } from "./reachability.js";

export type Technique = "lucena" | "philidor" | "vancura";
export type Wdl = "win" | "draw" | "loss";

function opposite(color: Color): Color { return color === "white" ? "black" : "white"; }
function squareName(square: number): string { return `${String.fromCharCode(97 + (square & 7))}${1 + (square >> 3)}`; }
function makeUci(move: Move): string {
  if (!("from" in move)) throw new TypeError("drop moves are outside the standard-chess control");
  const promotion = move.promotion === undefined ? "" : ({ queen: "q", rook: "r", bishop: "b", knight: "n", pawn: "p", king: "k" } as const)[move.promotion];
  return `${squareName(move.from)}${squareName(move.to)}${promotion}`;
}

export interface TablebaseControl {
  readonly id: string;
  readonly technique: Technique;
  readonly beneficiary: Color;
  readonly fen: string;
  readonly rootCategory: Wdl;
  readonly moves: readonly { readonly uci: string; readonly category: Wdl }[];
}

function legalMoves(fen: string): readonly Move[] {
  const position = positionFromFen(fen);
  const moves: Move[] = [];
  for (const [from, destinations] of position.allDests()) {
    for (const to of destinations) {
      const piece = position.board.get(from);
      if (piece?.role === "pawn" && (to < 8 || to >= 56)) {
        for (const promotion of ["queen", "rook", "bishop", "knight"] as const) moves.push({ from, to, promotion });
      } else {
        moves.push({ from, to });
      }
    }
  }
  return Object.freeze(moves.sort((left, right) => makeUci(left).localeCompare(makeUci(right))));
}

function outcomeFor(category: Wdl, sideToMove: Color, beneficiary: Color): Wdl {
  if (category === "draw" || sideToMove === beneficiary) return category;
  return category === "win" ? "loss" : "win";
}

function isTarget(technique: Technique, fen: string): boolean {
  const geometry = krpkrGeometry(fen);
  if (geometry === null) return false;
  if (technique === "lucena") return geometry.lucenaCanonicalSetup;
  if (technique === "philidor") return geometry.philidorCanonicalSetup;
  return geometry.vancuraCanonicalSetup;
}

export interface BuiltControl {
  readonly root: ReachabilityNode;
  readonly legalMoves: number;
  readonly outcomePreservingMoves: number;
  readonly targetMoves: readonly string[];
  readonly rootOutcome: Wdl;
}

export function buildOnePlyControl(control: TablebaseControl): BuiltControl {
  const position = positionFromFen(control.fen);
  const turn = position.turn;
  const expected = legalMoves(control.fen).map(makeUci);
  const supplied = control.moves.map((move) => move.uci).sort();
  if (JSON.stringify(expected) !== JSON.stringify(supplied)) {
    throw new TypeError(`${control.id}: tablebase move set is not the complete legal move set`);
  }
  if (isTarget(control.technique, control.fen)) throw new TypeError(`${control.id}: root is already the target setup`);
  const rootOutcome = outcomeFor(control.rootCategory, turn, control.beneficiary);
  const targetMoves: string[] = [];
  const children: ReachabilityNode[] = [];
  for (const row of control.moves) {
    const move = parseMethodUci(row.uci);
    if (move === undefined || !position.isLegal(move)) throw new TypeError(`${control.id}: illegal fixture move ${row.uci}`);
    const after = position.clone();
    after.play(move);
    const afterFen = canonicalFen(after);
    const childOutcome = outcomeFor(row.category, opposite(turn), control.beneficiary);
    if (childOutcome !== rootOutcome) continue;
    const target = isTarget(control.technique, afterFen);
    if (target) targetMoves.push(row.uci);
    children.push(Object.freeze({
      target,
      turn: after.turn === control.beneficiary ? "beneficiary" : "opponent",
      // The root snapshot proves the move list and child WDL, not the child's reply frontier.
      // A finite one-ply claim is complete at this boundary; an unbounded claim must abstain.
      expansion: Object.freeze({ kind: "provider_unavailable" }),
    }));
  }
  return Object.freeze({
    root: Object.freeze({
      turn: turn === control.beneficiary ? "beneficiary" : "opponent",
      expansion: Object.freeze({ kind: "complete", children: Object.freeze(children) }),
    }),
    legalMoves: expected.length,
    outcomePreservingMoves: children.length,
    targetMoves: Object.freeze(targetMoves.sort()),
    rootOutcome,
  });
}
