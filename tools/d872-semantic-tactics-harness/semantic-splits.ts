// DISPOSABLE research predicates — D872/Wave C. Not production detector code.
import { attacks, between } from "chessops/attacks";
import type { Role } from "chessops/types";
import { parseUci } from "chessops/util";

import { captureAt, legalExchangeForMove, researchPosition } from "../research-chess/legal-exchange.js";
import type { ResearchRow, ResearchTriple } from "../research-chess/populations.js";

function parsed(row: ResearchRow) {
  const pos = researchPosition(row.parentFen);
  const move = parseUci(row.uci);
  if (move === undefined || !("from" in move) || !pos.isLegal(move)) return undefined;
  return { pos, move };
}

export function attractedPieceSequence(rows: readonly ResearchRow[]): boolean {
  const first = rows[0] === undefined ? undefined : parsed(rows[0]);
  const reply = rows[1] === undefined ? undefined : parsed(rows[1]);
  const follow = rows[2] === undefined ? undefined : parsed(rows[2]);
  if (first === undefined || reply === undefined || follow === undefined) return false;
  if (reply.move.to !== first.move.to) return false;
  const bait = captureAt(reply.pos, reply.move);
  if (bait === undefined || bait.color !== first.pos.turn) return false;
  const attracted = reply.pos.board.get(reply.move.from);
  if (attracted === undefined || attracted.color === first.pos.turn) return false;
  if (!["king", "queen", "rook"].includes(attracted.role)) return false;
  const onSquare = follow.pos.board.get(reply.move.to);
  if (onSquare?.color !== attracted.color || onSquare.role !== attracted.role) return false;
  const after = researchPosition(rows[2]!.fen);
  const moved = after.board.get(follow.move.to);
  if (moved?.color !== first.pos.turn) return false;
  const attacksAttracted = attacks(moved, follow.move.to, after.board.occupied).has(reply.move.to);
  if (!attacksAttracted) return false;
  if (attracted.role === "king") return after.isCheck();
  if (rows[4] === undefined) return false;
  const finish = parsed(rows[4]);
  if (finish === undefined || finish.move.to !== reply.move.to) return false;
  const captured = captureAt(finish.pos, finish.move);
  return captured?.color === attracted.color && captured.role === attracted.role;
}

export function defenderDutyDisplacedSequence(triple: ResearchTriple): boolean {
  const first = parsed(triple[0]);
  const reply = parsed(triple[1]);
  const exploit = parsed(triple[2]);
  if (first === undefined || reply === undefined || exploit === undefined) return false;
  const defender = first.pos.board.get(reply.move.from);
  const target = first.pos.board.get(exploit.move.to);
  if (defender === undefined || target === undefined || defender.color !== target.color || target.role === "king") return false;
  if (!attacks(defender, reply.move.from, first.pos.board.occupied).has(exploit.move.to)) return false;
  const inducedByBait = reply.move.to === first.move.to && captureAt(reply.pos, reply.move)?.color === first.pos.turn;
  const inducedByCheck = researchPosition(triple[0].fen).isCheck();
  if (!inducedByBait && !inducedByCheck) return false;
  const afterReply = researchPosition(triple[1].fen);
  const relocated = afterReply.board.get(reply.move.to);
  if (relocated?.color !== defender.color || relocated.role !== defender.role) return false;
  if (attacks(relocated, reply.move.to, afterReply.board.occupied).has(exploit.move.to)) return false;
  const captured = captureAt(exploit.pos, exploit.move);
  return captured?.color === target.color && captured.role === target.role &&
    (legalExchangeForMove(exploit.pos, exploit.move) ?? 0) > 0;
}

const SLIDERS: readonly Role[] = ["bishop", "rook", "queen"];

export function squareVacatedForSliderSequence(triple: ResearchTriple): boolean {
  const first = parsed(triple[0]);
  const follow = parsed(triple[2]);
  if (first === undefined || follow === undefined || first.move.from === follow.move.from) return false;
  if (captureAt(follow.pos, follow.move) !== undefined) return false;
  const slider = follow.pos.board.get(follow.move.from);
  if (slider?.color !== first.pos.turn || !SLIDERS.includes(slider.role)) return false;
  return follow.move.to === first.move.from || between(follow.move.from, follow.move.to).has(first.move.from);
}
