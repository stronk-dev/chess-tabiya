// Accepted subject-safe-semantic-selection §3.1. Complete own-piece risk, never a move grade.
import { normalizeMove } from "chessops/chess";
import { makeSquare, parseSquare, parseUci } from "chessops/util";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { positionFromSource } from "./foundation-position-sources.js";
import type { SliderIdentity } from "./foundation-slider-sources.js";
import type { ExactLegalMoveMap } from "./legal-moves.js";
import { canonicalFen } from "./position-cache.js";
import { loosePieceReadingForColor, pieceRelocations, type LoosePieceState } from "./tactics.js";

type PositionSource = DeclaredEvidence<ExactLegalMoveMap>;
export interface MoverPieceRiskInput {
  readonly root: PositionSource;
  readonly position: PositionSource;
  readonly moveUci: string | null;
}
export interface MoverPieceRiskSnapshot {
  readonly rootFen: string;
  readonly fen: string;
  readonly moveUci: string | null;
  readonly actor: "white" | "black";
  readonly evaluationFen: string;
  readonly pieces: readonly {
    readonly root: SliderIdentity;
    readonly current: SliderIdentity;
    readonly state: LoosePieceState;
  }[];
}
export type MoverPieceRiskRead =
  | { readonly kind: "available"; readonly value: MoverPieceRiskSnapshot }
  | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone" };

/** The sole factory additionally authenticates original invocations, including empty results. */
export function readMoverPieceRisk(input: MoverPieceRiskInput): MoverPieceRiskRead {
  const root = positionFromSource(input.root), current = positionFromSource(input.position);
  const rootFen = input.root.payload.fen, fen = input.position.payload.fen, actor = root.turn;
  let relocations: ReturnType<typeof pieceRelocations> = [];
  if (input.moveUci === null) {
    if (input.position !== input.root) throw new TypeError("Root risk requires the original position object");
  } else {
    const member = input.root.payload.pieces.flatMap(piece => piece.moves).find(move => move.uci === input.moveUci);
    if (member === undefined) throw new TypeError("Risk child move is not an exact original legal member");
    const parsed = parseUci(member.uci);
    if (parsed === undefined || !("from" in parsed)) throw new TypeError("Risk child has no board move");
    const move = normalizeMove(root, parsed);
    if (!("from" in move)) throw new TypeError("Risk child requires a normalized board move");
    if (!root.isLegal(move)) throw new TypeError("Risk child move is not legal at the original root");
    relocations = pieceRelocations(root, move);
    const played = root.clone(); played.play(move);
    if (input.position === input.root || canonicalFen(played) !== fen) throw new TypeError("Risk child differs from the complete original legal edge");
  }
  // This must run even with no own non-king pieces; invalid clone is not available[].
  const reading = loosePieceReadingForColor(fen, actor);
  if (reading === undefined) return Object.freeze({ kind: "unavailable", reason: "invalid_turn_clone" });
  const bySquare = new Map(reading.pieces.map(state => [state.piece.square, state]));
  const pieces = [...root.board[actor]].flatMap(square => {
    const prior = root.board.get(square)!;
    if (prior.role === "king") return [];
    const at = relocations.find(move => move.from === square)?.to ?? square;
    const occupant = current.board.get(at), state = bySquare.get(makeSquare(at));
    if (occupant === undefined || occupant.color !== actor || state === undefined
      || parseSquare(state.piece.square) !== at || state.piece.occupant.color !== occupant.color
      || state.piece.occupant.role !== occupant.role) throw new TypeError("Risk source lost an original own non-king piece");
    return [Object.freeze({
      root: Object.freeze({ color: prior.color, role: prior.role, square: makeSquare(square) }),
      current: Object.freeze({ color: occupant.color, role: occupant.role, square: makeSquare(at) }), state,
    })];
  });
  if (pieces.length !== reading.pieces.length) throw new TypeError("Risk reading has an extra or missing original piece");
  return Object.freeze({ kind: "available", value: Object.freeze({ rootFen, fen, moveUci: input.moveUci,
    actor, evaluationFen: reading.fen, pieces: Object.freeze(pieces) }) });
}
