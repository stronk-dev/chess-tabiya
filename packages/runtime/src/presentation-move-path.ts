// D3979 / evidence-presentation §3.6b. Deterministic replay, never search or saved-run navigation.
import { normalizeMove } from "chessops/chess";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./chess.js";

export interface PresentedMovePly { readonly ply: number; readonly san: string; readonly uci: string }

function canonicalPosition(fen: string) {
  const position = positionFromFen(fen);
  if (canonicalFen(position) !== fen) throw new TypeError("Recorded path requires a canonical original FEN");
  return position;
}
function advance(position: ReturnType<typeof positionFromFen>, uci: string): PresentedMovePly {
  const parsed = parseUci(uci);
  if (parsed === undefined) throw new TypeError("Recorded path UCI does not parse");
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) throw new TypeError("Recorded path contains an illegal move");
  const ply = (position.fullmoves - 1) * 2 + (position.turn === "white" ? 1 : 2);
  const san = makeSan(position, move);
  position.play(move);
  // Castling normalization is only for chess rules. Keep the original retained UCI bytes.
  return Object.freeze({ ply, san, uci });
}

/** Registered construction must retain and check EVERY original before-position, not just a root. */
export function recordedMovePathPositions(moves: readonly { readonly fen: string; readonly uci: string }[]): {
  readonly startFen: string; readonly plies: readonly PresentedMovePly[];
} {
  if (moves.length === 0) throw new TypeError("Recorded path has no original moves");
  const startFen = moves[0]!.fen, position = canonicalPosition(startFen);
  const plies = moves.map(move => {
    if (move.fen !== canonicalFen(position)) throw new TypeError("Recorded path crosses its original position sequence");
    return advance(position, move.uci);
  });
  return Object.freeze({ startFen, plies: Object.freeze(plies) });
}

/** Root followed by each complete after-ply position. Wire consistency is not source issuance. */
export function movePathFrames(path: { readonly startFen: string; readonly plies: readonly PresentedMovePly[] }): readonly string[] {
  const position = canonicalPosition(path.startFen), frames = [path.startFen];
  if (path.plies.length === 0) throw new TypeError("Recorded path has no plies");
  for (const original of path.plies) {
    const actual = advance(position, original.uci);
    if (actual.ply !== original.ply || actual.san !== original.san) throw new TypeError("Recorded path SAN or ply crosses its position");
    frames.push(canonicalFen(position));
  }
  return Object.freeze(frames);
}
