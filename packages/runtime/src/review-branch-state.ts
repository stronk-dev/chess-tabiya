// Pure recorded branch geometry shared by Review and its source factories. This module must
// not load presentation/module registration merely to determine whether a retry is unfinished.
import { branchPath } from "./branch-path.js";
import type { DrillRun, Node } from "./types.js";

export interface ReviewBranchDivergence {
  readonly branchId: string;
  readonly entryNodeId: string;
  readonly ownNodeIds: readonly string[];
}
export function reviewBranchDivergences(run: DrillRun, reviewed: readonly Node[], reviewedBranchId: string): readonly ReviewBranchDivergence[] {
  const out: ReviewBranchDivergence[] = [];
  for (const branch of run.branches) {
    if (branch.id === reviewedBranchId) continue;
    let path: readonly Node[];
    try { path = branchPath(run, branch.id); } catch { continue; }
    let common = -1;
    while (common + 1 < path.length && common + 1 < reviewed.length && path[common + 1]!.id === reviewed[common + 1]!.id) common += 1;
    if (common < 0) continue;
    out.push(Object.freeze({ branchId: branch.id, entryNodeId: reviewed[common]!.id, ownNodeIds: Object.freeze(path.slice(common + 1).map(node => node.id)) }));
  }
  return out;
}
/** The actual active unfinished line's divergence from the reviewed line, or null. */
export function openRetryEntry(run: DrillRun, reviewedBranchId: string): string | null {
  const cursor = run.activeCursor.branchId;
  if (cursor === reviewedBranchId) return null;
  const line = reviewBranchDivergences(run, branchPath(run, reviewedBranchId), reviewedBranchId).find(candidate => candidate.branchId === cursor);
  if (line === undefined) return null;
  const own = new Set(line.ownNodeIds);
  const finished = run.events.some(event => event.type === "outcome.reached" && own.has(event.data.nodeId));
  return finished ? null : line.entryNodeId;
}
