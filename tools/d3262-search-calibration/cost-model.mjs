// Disposable D3262 actual configured-policy traversal, never production search.
import { fenOf, replay, terminal } from "./cost-stockfish.mjs";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { jointStop, selectedPrefix } from "./coherent-horizon-policy.mjs";

export function configuredThreshold(id) {
  if (!["maia:prefix0.80", "maia:prefix0.90"].includes(id)) throw new Error("Undeclared configured-model setting");
  return Number(id.slice("maia:prefix".length));
}

export function absorbingModelFrontier(horizon, threshold) {
  const layers = horizon === 2 ? 1 : 3;
  return { nodes: [], edges: [], coverage: { complete: true, observedLayerMasses: Array(layers).fill(1),
    frontierMass: 1, observedFrontierMass: 1, stopRule: jointStop(threshold, 1, false, layers),
    policyMeaning: "absorbing_candidate_no_further_model_decision",
    selectionRule: "per_node_prefix_includes_overshoot_max8_not_joint_threshold_selector" } };
}

/** Policy nodes are shared across targets, but observations remain target-bound.
 * The 8-move conditional prefix is unchanged; it is NOT a joint stop algorithm.
 * Whole ordered history reaches Maia at every decision layer, including learner.
 */
export async function executeModelFrontier({ rootFen, candidateUci, horizon, threshold, dependencies, sourceDigest,
  collect, visit, observe }) {
  const nodes = [], edges = [];
  let complete = true, exhausted = false;
  async function walk(history, parentJointMass) {
    const pos = collect(() => replay(rootFen, history));
    const legalUcis = collect(() => legalMoves(pos).map(x => x.uci));
    if (terminal(pos) !== null) throw new Error("Absorbing model path must not request policy");
    const query = await dependencies.query({ provider: "maia", sourceDigest, rootFen, historyUci: history,
      selfElo: 1400, opponentElo: 1400, temperature: 0.8, topP: 0.92 });
    if (!query.result) {
      complete = false;
      nodes.push({ history, fen: fenOf(pos), parentJointMass, legalUcis, state: query.state,
        selected: null, coveredConditionalMass: null, residualConditionalMass: null,
        omittedWithinSupport: null, legalOutsideSupport: null });
      return;
    }
    const support = query.result.configuredSupport;
    const selected = collect(() => selectedPrefix(support, threshold).map(x => ({ ...x })));
    const covered = selected.reduce((n, x) => n + x.mass, 0), supportUcis = support.map(x => x.legalUci);
    nodes.push({ history, fen: fenOf(pos), parentJointMass, legalUcis, state: query.state,
      selected, coveredConditionalMass: covered, residualConditionalMass: Math.max(0, 1 - covered),
      omittedWithinSupport: supportUcis.filter(x => !selected.some(s => s.legalUci === x)),
      legalOutsideSupport: legalUcis.filter(x => !supportUcis.includes(x)) });
    for (const entry of selected) {
      if (!visit()) { complete = false; exhausted = true; break; }
      const next = [...history, entry.legalUci], nextPos = collect(() => replay(rootFen, next));
      const jointMass = parentJointMass * entry.mass, terminalReason = collect(() => terminal(nextPos));
      edges.push({ history: next, conditionalMass: entry.mass, jointMass, terminalReason });
      observe(next);
      if (next.length < horizon && terminalReason === null) await walk(next, jointMass);
      if (exhausted) break;
    }
  }
  await walk([candidateUci], 1);
  const layers = horizon === 2 ? 1 : 3;
  // Earlier terminal paths carry their mass into subsequent layers, never query.
  const observedLayerMasses = Array.from({ length: layers }, (_, i) => edges.filter(x =>
    x.history.length === i + 2 || x.history.length < i + 2 && x.terminalReason !== null).reduce((n, x) => n + x.jointMass, 0));
  const frontierMass = complete ? observedLayerMasses.at(-1) : null;
  const coverage = { complete, observedLayerMasses, frontierMass,
    observedFrontierMass: observedLayerMasses.at(-1),
    stopRule: complete ? jointStop(threshold, frontierMass, false, layers)
      : { status: "partial_traversal_abstain", requiredJointMass: threshold, coveredJointMass: null, residualMass: null,
        authority: "missing_source_or_budget_not_known_zero_coverage" },
    policyMeaning: "both_sides_configured_model_not_human_frequency_or_arbitrary_learner",
    selectionRule: "per_node_prefix_includes_overshoot_max8_not_joint_threshold_selector" };
  return { nodes, edges, coverage };
}
