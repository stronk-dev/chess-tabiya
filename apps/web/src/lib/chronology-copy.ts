/** Run-relative chronology for learner surfaces; `ply` remains an internal evidence field. */
export function rehearsalStepLabel(ply: number): string {
  return `Rehearsal step ${Math.max(0, ply)}`;
}

/** Exact half-move count in ordinary learner copy, without exposing the internal chess term. */
export function rehearsalTurnCount(count: number): string {
  const turns = Math.max(0, count);
  return `${turns} ${turns === 1 ? "turn" : "turns"}`;
}

export function learnerMoveCount(count: number): string {
  const moves = Math.max(0, count);
  return `${moves} learner ${moves === 1 ? "move" : "moves"}`;
}

export function opponentMoveCount(count: number): string {
  const moves = Math.max(0, count);
  return `${moves} opponent ${moves === 1 ? "move" : "moves"}`;
}

/** Whole-game chronology for Story, matching its existing re-entry convention. */
export function storyMoveLabel(ply: number): string {
  return `Move ${Math.max(1, Math.ceil(ply / 2))}`;
}

type StoryResult = "1-0" | "0-1" | "1/2-1/2" | "*" | "win" | "loss" | "draw";

export function storyReentryCopy(
  side: "white" | "black",
  result: StoryResult | undefined,
  ply: number,
): string {
  const move = storyMoveLabel(ply).slice("Move ".length);
  const learnerLost = result === "loss" || (side === "white" ? result === "0-1" : result === "1-0");
  const learnerWon = result === "win" || (side === "white" ? result === "1-0" : result === "0-1");
  const drawn = result === "draw" || result === "1/2-1/2";
  if (learnerLost) return `You lost this game. Pick it up at move ${move} and play the consequence another way.`;
  if (learnerWon) return `You won this game. Pick it up at move ${move} and test another continuation.`;
  if (drawn) return `This game was drawn. Pick it up at move ${move} and test another continuation.`;
  return `Pick this game up at move ${move} and play the consequence.`;
}
