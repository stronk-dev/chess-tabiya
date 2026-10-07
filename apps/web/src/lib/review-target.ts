import type { DrillClientApi } from "./api.js";

/** Resolve a cited move against the owner's recorded graph, never against the active cursor. */
export async function reviewTargetBranch(api: Pick<DrillClientApi, "graph">, runId: string, nodeId: string): Promise<string> {
  const graph = await api.graph(runId);
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (graph.id !== runId || node === undefined || !graph.branches.some((branch) => branch.id === node.branchId)) {
    throw new TypeError("The cited move is not in this recorded game.");
  }
  return node.branchId;
}
