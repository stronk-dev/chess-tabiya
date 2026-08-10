import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";

export function positionFromFen(fen: string): Chess {
  try {
    return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  } catch (cause) {
    throw new TypeError(`Invalid chess FEN: ${fen}`, { cause });
  }
}

export function canonicalFen(position: Chess): string {
  return makeFen(position.toSetup());
}

export function transposeKey(fen: string): string {
  const canonical = canonicalFen(positionFromFen(fen));
  return canonical.split(" ", 4).join(" ");
}
