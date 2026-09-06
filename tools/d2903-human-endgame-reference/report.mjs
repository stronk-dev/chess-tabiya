// DISPOSABLE research harness — D2903. Not production code.
function scoreRow(value) {
  return value === null
    ? "unavailable (infinite observed-class loss) | unavailable"
    : `${value.mean.toFixed(6)} | [${value.ci95.join(", ")}]`;
}

export function renderD2903Result(result) {
  const score = result.scores;
  return `# D2903 paired human endgame reference — results\n\n` +
    `Verdict: **${result.verdict.overall}**. The frozen sample retained ${String(result.population.safetyCompatible)} safety-compatible games from ${String(result.population.selected)} selected games.\n\n` +
    `Human king-move rate was **${(100 * result.summary.pooled.humanKingRate).toFixed(2)}%**; guarded Maia king mass was **${(100 * result.summary.pooled.guardedKingMass).toFixed(2)}%**, and the refused ×4 transform moved it to **${(100 * result.summary.pooled.transformedKingMass).toFixed(2)}%**.\n\n` +
    `| paired transformed − guarded score | mean | 95% game-bootstrap interval |\n|---|---:|---:|\n` +
    `| class log loss | ${scoreRow(score.classLogLoss)} |\n` +
    `| class Brier | ${scoreRow(score.classBrier)} |\n` +
    `| exact-move NLL | ${scoreRow(score.exactMoveNll)} |\n\n` +
    `${String(result.population.infiniteClassLosses)} safety-compatible games have literal infinite observed-class log loss; no epsilon was substituted. ${String(result.population.exactMoveAbsent)} human moves were absent from the retained Maia page.\n\n` +
    `D2902's global-transform refusal remains unchanged. This screen establishes no strategic technique, personality, rating or general human-likeness claim.\n`;
}
