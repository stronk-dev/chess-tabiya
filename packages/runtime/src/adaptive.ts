import type { BranchComparison, ComparisonScore } from "./compare.js";

function cp(score: ComparisonScore): number | undefined { return score.kind === "cp" ? score.value : undefined; }

export function retrospectivePivot(comparison: BranchComparison, branchId: string): { readonly nodeId: string; readonly plyOffset: number; readonly delta: number } | null {
  const entries = comparison.evidence[branchId] ?? [];
  let best: { readonly nodeId: string; readonly plyOffset: number; readonly delta: number } | null = null;
  for (let index = 1; index < entries.length; index += 1) {
    const before = cp(entries[index - 1]!.score), after = cp(entries[index]!.score);
    if (before === undefined || after === undefined) continue;
    const candidate = { nodeId: entries[index]!.nodeId, plyOffset: entries[index]!.plyOffset, delta: after - before };
    if (best === null || Math.abs(candidate.delta) > Math.abs(best.delta)) best = candidate;
  }
  return best === null ? null : Object.freeze(best);
}
