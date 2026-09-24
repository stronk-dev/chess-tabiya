import type { Branch, DrillRun, Node } from "./types.js";

/** Whole-graph refusal reasons of the total branch-path authority (rfc/recorded-semantic-path §2). */
export type BranchPathRefusalReason =
  | "unknown_branch"
  | "duplicate_branch"
  | "duplicate_node_id"
  | "missing_root"
  | "missing_fork"
  | "missing_parent"
  | "parent_cycle"
  | "multiple_branch_tips"
  | "off_chain_branch_node";

export type BranchPathResolution =
  | Readonly<{ kind: "resolved"; branch: Branch; nodes: readonly Node[] }>
  | Readonly<{ kind: "refused"; reason: BranchPathRefusalReason; atNodeId?: string; detail: string }>;

export class BranchQueryError extends Error {
  readonly code: "UNKNOWN_BRANCH" | "NO_COMMON_FORK" | "INVALID_BRANCH_GRAPH";
  readonly reason?: BranchPathRefusalReason;

  constructor(code: "UNKNOWN_BRANCH" | "NO_COMMON_FORK" | "INVALID_BRANCH_GRAPH", message: string, reason?: BranchPathRefusalReason) {
    super(message);
    this.name = "BranchQueryError";
    this.code = code;
    if (reason !== undefined) this.reason = reason;
  }
}

export function requireBranch(run: DrillRun, branchId: string): Branch {
  const branch = run.branches.find((candidate) => candidate.id === branchId);
  if (!branch) {
    throw new BranchQueryError("UNKNOWN_BRANCH", `Unknown branch: ${branchId}`);
  }
  return branch;
}

interface RunGraphIndex {
  readonly run: DrillRun;
  readonly byId: ReadonlyMap<string, Node>;
  readonly global?: Extract<BranchPathResolution, { kind: "refused" }>;
}

function refused(reason: BranchPathRefusalReason, detail: string, atNodeId?: string): Extract<BranchPathResolution, { kind: "refused" }> {
  return Object.freeze({ kind: "refused", reason, ...(atNodeId === undefined ? {} : { atNodeId }), detail });
}

/** Validates the run-wide authorities once so every branch resolution shares one node index. */
function indexRun(run: DrillRun): RunGraphIndex {
  const byId = new Map<string, Node>();
  let global: Extract<BranchPathResolution, { kind: "refused" }> | undefined;
  for (const node of run.nodes) {
    if (node.id.length === 0 || byId.has(node.id)) {
      global ??= refused("duplicate_node_id", `Node id ${JSON.stringify(node.id)} is empty or duplicated`, node.id);
      continue;
    }
    byId.set(node.id, node);
  }
  const branchIds = new Set<string>();
  for (const branch of run.branches) {
    if (branch.id.length === 0 || branchIds.has(branch.id)) global ??= refused("duplicate_branch", `Branch id ${JSON.stringify(branch.id)} is empty or duplicated`);
    branchIds.add(branch.id);
  }
  if (global === undefined) {
    const roots = run.nodes.filter((node) => node.parentId === null);
    const started = run.events.filter((event) => event.type === "run.started");
    const declaredRoot = started.length === 1 && started[0]!.type === "run.started" ? started[0]!.data.rootNode.id : undefined;
    if (roots.length !== 1 || declaredRoot === undefined || roots[0]!.id !== declaredRoot) {
      global = refused("missing_root", `Run ${run.id} must have exactly one parentless node declared by exactly one run.started event`);
    }
  }
  return global === undefined ? { run, byId } : { run, byId, global };
}

function resolveIndexed(index: RunGraphIndex, branchId: string): BranchPathResolution {
  const matches = index.run.branches.filter((candidate) => candidate.id === branchId);
  if (matches.length === 0) return refused("unknown_branch", `Unknown branch: ${branchId}`);
  if (index.global !== undefined) return index.global;
  const branch = matches[0]!;
  const fork = index.byId.get(branch.forkNodeId);
  if (fork === undefined) return refused("missing_fork", `Branch ${branchId} names absent fork ${branch.forkNodeId}`, branch.forkNodeId);

  const own = index.run.nodes.filter((node) => node.branchId === branchId && node.id !== fork.id);
  // §2.3: every same-branch node reaches the fork through present parents without a cycle.
  const reaches = new Set<string>([fork.id]);
  for (const start of own) {
    const trail: string[] = [];
    const onTrail = new Set<string>();
    let cursor: Node = start;
    while (!reaches.has(cursor.id)) {
      if (onTrail.has(cursor.id)) return refused("parent_cycle", `Branch ${branchId} revisits node ${cursor.id}`, cursor.id);
      onTrail.add(cursor.id);
      trail.push(cursor.id);
      if (cursor.parentId === null) return refused("off_chain_branch_node", `Node ${start.id} carries branch ${branchId} but does not descend from fork ${fork.id}`, start.id);
      const parent = index.byId.get(cursor.parentId);
      if (parent === undefined) return refused("missing_parent", `Node ${cursor.id} names absent parent ${cursor.parentId}`, cursor.id);
      cursor = parent;
    }
    for (const id of trail) reaches.add(id);
  }
  const ownParents = new Set(own.map((node) => node.parentId));
  const tips = own.filter((node) => !ownParents.has(node.id));
  if (tips.length > 1) return refused("multiple_branch_tips", `Branch ${branchId} has ${tips.length} graph tips`, tips[0]!.id);
  if (own.length > 0 && tips.length === 0) return refused("parent_cycle", `Branch ${branchId} nodes form a parent cycle`, own[0]!.id);
  const tip = tips[0] ?? fork;

  const reversed: Node[] = [];
  const seen = new Set<string>();
  let cursor: Node = tip;
  for (;;) {
    if (seen.has(cursor.id)) return refused("parent_cycle", `Branch ${branchId} revisits node ${cursor.id}`, cursor.id);
    seen.add(cursor.id);
    reversed.push(cursor);
    if (cursor.parentId === null) break;
    const parent = index.byId.get(cursor.parentId);
    if (parent === undefined) return refused("missing_parent", `Node ${cursor.id} names absent parent ${cursor.parentId}`, cursor.id);
    cursor = parent;
  }
  const nodes = reversed.reverse();
  const forkIndex = nodes.findIndex((node) => node.id === fork.id);
  if (forkIndex < 0) return refused("off_chain_branch_node", `Branch ${branchId} tip does not descend from fork ${fork.id}`, tip.id);
  const position = new Map(nodes.map((node, offset) => [node.id, offset]));
  const outside = own.find((node) => (position.get(node.id) ?? -1) <= forkIndex);
  if (outside !== undefined) return refused("off_chain_branch_node", `Node ${outside.id} carries branch ${branchId} but is not on its fork-to-tip chain`, outside.id);
  return Object.freeze({ kind: "resolved", branch, nodes: Object.freeze(nodes) });
}

/** Total graph-derived branch authority: never trusts node-array order, never truncates, never repairs. */
export function resolveBranchPath(run: DrillRun, branchId: string): BranchPathResolution {
  return resolveIndexed(indexRun(run), branchId);
}

function orThrow(resolution: BranchPathResolution, branchId: string): readonly Node[] {
  if (resolution.kind === "resolved") return resolution.nodes;
  if (resolution.reason === "unknown_branch") throw new BranchQueryError("UNKNOWN_BRANCH", `Unknown branch: ${branchId}`, "unknown_branch");
  throw new BranchQueryError("INVALID_BRANCH_GRAPH", `Branch ${branchId} does not resolve to one run path: ${resolution.detail}`, resolution.reason);
}

export function branchPath(run: DrillRun, branchId: string): readonly Node[] {
  return orThrow(resolveBranchPath(run, branchId), branchId);
}

export function branchPaths(run: DrillRun): ReadonlyMap<string, readonly Node[]> {
  const index = indexRun(run);
  return new Map(run.branches.map((branch) => [branch.id, orThrow(resolveIndexed(index, branch.id), branch.id)] as const));
}
