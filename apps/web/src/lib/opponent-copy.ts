export const HUMAN_MODEL_RUNG_DISCLAIMER =
  "Maia rung numbers are calibrated inside Tabiya. They are not FIDE, Lichess, or Chess.com ratings.";

export function opponentStatus(
  mode: "human_common" | "strong_engine" | string,
  targetElo?: number,
): string {
  if (mode === "strong_engine") return "Engine test · outside the human-like ladder";
  if (mode !== "human_common") return "Specialized resistance";
  return targetElo === undefined
    ? "Human-like opponent · rung not recorded"
    : `Human-like opponent · rung ${targetElo}`;
}

export function humanModelMaterialLimit(
  fen: string,
  mode: string,
): string | undefined {
  if (mode !== "human_common") return undefined;
  const placement = fen.split(" ", 1)[0] ?? "";
  const pieces = [...placement].filter((token) => /[prnbqk]/iu.test(token)).length;
  return pieces <= 10
    ? "With ten pieces or fewer, changing the Maia rung has very little effect; endgame choices converge."
    : undefined;
}
