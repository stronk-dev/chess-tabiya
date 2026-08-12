import type { Chess } from "chessops/chess";

export type RunOutcome = "win" | "loss" | "draw";

export function terminalOutcome(
  position: Chess,
  learnerSide: "white" | "black",
): RunOutcome | undefined {
  if (!position.isEnd()) return undefined;
  if (!position.isCheckmate()) return "draw";
  return position.turn === learnerSide ? "loss" : "win";
}
