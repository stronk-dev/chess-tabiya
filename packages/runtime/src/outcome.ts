import type { Chess } from "chessops/chess";

export type RunOutcome = "win" | "loss" | "draw";

export function terminalOutcome(
  position: Chess,
  learnerSide: "white" | "black",
  repetitionCount = 1,
): RunOutcome | undefined {
  if (position.isEnd()) {
    if (!position.isCheckmate()) return "draw";
    return position.turn === learnerSide ? "loss" : "win";
  }
  if (position.halfmoves >= 100 || repetitionCount >= 3) return "draw";
  return undefined;
}
