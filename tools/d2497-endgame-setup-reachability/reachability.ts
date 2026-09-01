export type ProofStatus = "proved_true" | "proved_false" | "unknown_horizon" | "unknown_provider";

export interface ProofReading {
  readonly possible: ProofStatus;
  readonly forceable: ProofStatus;
  readonly inevitable: ProofStatus;
  readonly visitedNodes: number;
}

export interface ReachabilityNode {
  readonly target?: boolean;
  readonly turn: "beneficiary" | "opponent";
  readonly expansion:
    | { readonly kind: "complete"; readonly children: readonly ReachabilityNode[] }
    | { readonly kind: "provider_unavailable" };
}

export interface ReachabilityQuery {
  /** A finite value makes “within N plies” part of the claim. Null asks an unbounded question. */
  readonly claimHorizon: number | null;
  /** Operational search ceiling. Exhausting this does not prove an unbounded claim false. */
  readonly searchPlyBudget: number;
}

function any(statuses: readonly ProofStatus[]): ProofStatus {
  if (statuses.includes("proved_true")) return "proved_true";
  if (statuses.includes("unknown_provider")) return "unknown_provider";
  if (statuses.includes("unknown_horizon")) return "unknown_horizon";
  return "proved_false";
}

function every(statuses: readonly ProofStatus[]): ProofStatus {
  if (statuses.includes("proved_false")) return "proved_false";
  if (statuses.includes("unknown_provider")) return "unknown_provider";
  if (statuses.includes("unknown_horizon")) return "unknown_horizon";
  return "proved_true";
}

interface InternalReading {
  readonly possible: ProofStatus;
  readonly forceable: ProofStatus;
  readonly inevitable: ProofStatus;
  readonly visitedNodes: number;
}

function evaluate(
  node: ReachabilityNode,
  claimRemaining: number | null,
  searchRemaining: number,
): InternalReading {
  if (node.target === true) {
    return { possible: "proved_true", forceable: "proved_true", inevitable: "proved_true", visitedNodes: 1 };
  }
  if (claimRemaining === 0) {
    return { possible: "proved_false", forceable: "proved_false", inevitable: "proved_false", visitedNodes: 1 };
  }
  if (node.expansion.kind === "provider_unavailable") {
    return { possible: "unknown_provider", forceable: "unknown_provider", inevitable: "unknown_provider", visitedNodes: 1 };
  }
  if (node.expansion.children.length === 0) {
    return { possible: "proved_false", forceable: "proved_false", inevitable: "proved_false", visitedNodes: 1 };
  }
  if (searchRemaining === 0) {
    return { possible: "unknown_horizon", forceable: "unknown_horizon", inevitable: "unknown_horizon", visitedNodes: 1 };
  }

  const children = node.expansion.children.map((child) => evaluate(
    child,
    claimRemaining === null ? null : claimRemaining - 1,
    searchRemaining - 1,
  ));
  const possible = any(children.map((child) => child.possible));
  const forceable = node.turn === "beneficiary"
    ? any(children.map((child) => child.forceable))
    : every(children.map((child) => child.forceable));
  const inevitable = every(children.map((child) => child.inevitable));
  return {
    possible,
    forceable,
    inevitable,
    visitedNodes: 1 + children.reduce((total, child) => total + child.visitedNodes, 0),
  };
}

export function quantifiedReachability(root: ReachabilityNode, query: ReachabilityQuery): ProofReading {
  if (!Number.isInteger(query.searchPlyBudget) || query.searchPlyBudget < 0) throw new TypeError("searchPlyBudget must be a non-negative integer");
  if (query.claimHorizon !== null && (!Number.isInteger(query.claimHorizon) || query.claimHorizon < 0)) throw new TypeError("claimHorizon must be null or a non-negative integer");
  return Object.freeze(evaluate(root, query.claimHorizon, query.searchPlyBudget));
}
