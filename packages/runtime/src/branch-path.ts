import type { Branch, DrillRun, Node } from "./types.js";

export class BranchQueryError extends Error {
  readonly code: "UNKNOWN_BRANCH" | "NO_COMMON_FORK";

  constructor(code: "UNKNOWN_BRANCH" | "NO_COMMON_FORK", message: string) {
    super(message);
    this.name = "BranchQueryError";
    this.code = code;
  }
}

export function requireBranch(run: DrillRun, branchId: string): Branch {
  const branch = run.branches.find((candidate) => candidate.id === branchId);
  if (!branch) {
    throw new BranchQueryError("UNKNOWN_BRANCH", `Unknown branch: ${branchId}`);
  }
  return branch;
}

export function branchPath(run: DrillRun, branchId: string): readonly Node[] {
  const branch = requireBranch(run, branchId);
  const ownNodes = run.nodes.filter(
    (node) => node.branchId === branch.id && node.id !== branch.forkNodeId,
  );
  const headId = ownNodes.at(-1)?.id ?? branch.forkNodeId;
  const byId = new Map(run.nodes.map((node) => [node.id, node]));
  const reversed: Node[] = [];
  let node = byId.get(headId);
  while (node) {
    reversed.push(node);
    node = node.parentId === null ? undefined : byId.get(node.parentId);
  }
  if (reversed.length === 0) {
    throw new BranchQueryError(
      "NO_COMMON_FORK",
      `Branch ${branchId} does not resolve to a run path`,
    );
  }
  return reversed.reverse();
}
