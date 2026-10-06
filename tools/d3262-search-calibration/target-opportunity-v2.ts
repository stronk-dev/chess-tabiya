// Disposable D3492 research. Versioned successor; historical observer stays frozen.
// Legal local exchange is a bounded convention, not strategic truth or engine causality.
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { makeSquare, makeUci, parseSquare } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { Move, Role, Square } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { exchangeCaptureAt, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";
import { legalMoves, observeTargetPath, trackTargetPath } from "./coherent-bounded-targets.js";

export const convention = "d3262-target-opportunity@2";
const promotions: readonly Role[] = ["queen", "rook", "bishop", "knight"];
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sq(name: string): Square { const value = parseSquare(name); check(value !== undefined, "Invalid named square"); return value; }
function board(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function samePiece(pos: Chess, piece: any): boolean {
  const found = pos.board.get(sq(piece.square));
  return found?.color === piece.color && found.role === piece.role;
}
export function terminal(pos: Chess): string | null {
  if (legalMoves(pos).length === 0) return pos.isCheck() ? "CHECKMATE" : "STALEMATE";
  if (pos.isInsufficientMaterial()) return "INSUFFICIENT_MATERIAL";
  if (pos.halfmoves >= 150) return "SEVENTYFIVE_MOVES";
  return null;
}
export type AvailableAction = {
  readonly uci: string; readonly landingSquare: string;
  readonly capturedSquare: string | null; readonly promotion: Role | null;
  readonly resultUnits: number | null;
};
export function availableTargetActions(snapshot: { fen: string; tracked: any; terminalReason: string | null }): readonly AvailableAction[] {
  const pos = board(snapshot.fen), target = snapshot.tracked;
  check(terminal(pos) === snapshot.terminalReason, "Crossed target terminal");
  if (target === null || snapshot.terminalReason !== null) return [];
  check(target.kind === "material" || target.kind === "destination", "Unknown target family");
  const actor = target.kind === "material" ? target.attacker : target.minor;
  check(samePiece(pos, actor), "Absent named actor");
  if (target.kind === "material") check(samePiece(pos, target.target), "Absent named captured target");
  if (pos.turn !== actor.color) return [];
  if (target.kind === "destination") {
    const to = sq(target.square), move: Move = { from: sq(actor.square), to };
    if (pos.board.get(to) !== undefined || !pos.isLegal(move) || exchangeCaptureAt(pos, move) !== undefined) return [];
    const after = pos.clone(); after.play(move);
    if (legalMoves(after).some((capture) => "from" in capture && capture.to === to
      && exchangeCaptureAt(after, capture) !== undefined && (legalExchangeForMove(after, capture)?.resultUnits ?? 0) > 0)) return [];
    return [{ uci: makeUci(move), landingSquare: target.square, capturedSquare: null, promotion: null, resultUnits: null }];
  }
  const from = sq(actor.square), capturedSquare = sq(target.target.square), result: AvailableAction[] = [];
  for (const to of pos.dests(from)) {
    const roles: readonly (Role | undefined)[] = actor.role === "pawn" && (to < 8 || to >= 56) ? promotions : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (!pos.isLegal(move) || exchangeCaptureAt(pos, move)?.square !== capturedSquare) continue;
      const value = legalExchangeForMove(pos, move)?.resultUnits;
      if (value === undefined || value <= 0) continue;
      result.push({ uci: makeUci(move), landingSquare: makeSquare(to), capturedSquare: target.target.square,
        promotion: promotion ?? null, resultUnits: value });
    }
  }
  return result.sort((a, b) => a.uci.localeCompare(b.uci));
}
export function observeTargetPathV2(rootFen: string, history: readonly string[], definition: any): any {
  check(history.length >= 1 && history.length <= 4, "Target v2 requires one to four actual plies");
  const snapshots = history.map((_, index) => {
    const tracked = trackTargetPath(rootFen, history.slice(0, index + 1), definition);
    return { ply: index + 1, ...tracked, availableActions: availableTargetActions(tracked) };
  });
  const first = snapshots[0];
  const immediate = first.tracked === null ? observeTargetPath(rootFen, [history[0]], definition).immediate
    : first.availableActions.length > 0 ? "preserved" : "removed";
  const opportunityAtThirdPly = (snapshots[2]?.availableActions.length ?? 0) > 0;
  const executedAtFourthPly = history.length === 4 && snapshots[2].availableActions.some((a) => a.uci === history[3]);
  return { convention, immediate, opportunityAtThirdPly,
    reintroducedAtThirdPly: immediate === "removed" && opportunityAtThirdPly,
    executedAtFourthPly, executionWitness: executedAtFourthPly ? [...history] : null, snapshots };
}
