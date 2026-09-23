// A MultiPV frame is one depth-complete rank table, not the newest info line
// observed independently for each move.
export function selectCoherentTopEntries(parsed, count) {
  if (!Number.isSafeInteger(count) || count < 1) throw new Error("Invalid coherent rank count");
  const reportedDepths = [...new Set(parsed.map((entry) => entry.depth))].sort((left, right) => right - left);
  for (const depth of reportedDepths) {
    const byRank = new Map(parsed.filter((entry) => entry.depth === depth && entry.rank <= count).map((entry) => [entry.rank, entry]));
    const entries = Array.from({ length: count }, (_, index) => byRank.get(index + 1));
    if (entries.some((entry) => entry === undefined) || new Set(entries.map((entry) => entry.moveUci)).size !== count) continue;
    return { entries, coherentDepth: depth, trailingPartialDepth: reportedDepths[0] > depth ? reportedDepths[0] : null };
  }
  throw new Error(`Stockfish returned no complete coherent ${count}-rank depth table`);
}
