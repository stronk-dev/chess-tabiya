/** Run-relative chronology for learner surfaces; `ply` remains an internal evidence field. */
export function rehearsalStepLabel(ply: number): string {
  return `Rehearsal step ${Math.max(0, ply)}`;
}

/** Exact half-move count in ordinary learner copy, without exposing the internal chess term. */
export function rehearsalTurnCount(count: number): string {
  const turns = Math.max(0, count);
  return `${turns} ${turns === 1 ? "turn" : "turns"}`;
}

export function comparisonStepLabel(step: number, availableSteps: number): string {
  const current = Math.max(0, step);
  const available = Math.max(0, availableSteps);
  if (current === 0) return `Shared fork · ${available} consequence ${available === 1 ? "step" : "steps"} available`;
  return `Consequence step ${current} / ${available}`;
}

export function comparisonStepAnnouncement(step: number, availableSteps: number): string {
  const current = Math.max(0, step);
  const available = Math.max(0, availableSteps);
  if (current === 0) return `Comparison at the shared fork; ${available} consequence ${available === 1 ? "step is" : "steps are"} available`;
  return `Comparison consequence step ${current} of ${available}`;
}

export function learnerMoveCount(count: number): string {
  const moves = Math.max(0, count);
  return `${moves} learner ${moves === 1 ? "move" : "moves"}`;
}

export function opponentMoveCount(count: number): string {
  const moves = Math.max(0, count);
  return `${moves} opponent ${moves === 1 ? "move" : "moves"}`;
}
