// Disposable D3262/D3494: actual first-reply projection and JOINT coverage audit.
// No production selector, larger cap, renamed distribution or frontier normalization.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { observeTargetPathV2, convention } from "./dist/target-opportunity-v2.mjs";
import { direction } from "./coherent-actual-contrast.mjs";
import { directory, sha } from "./third-ply-source-check.mjs";

export const sources = {
  "d3262-coherent-five-approach-comparison.json.gz": "c6660605e24c13b631f39f2003f1219406baadb02b03614eac9260c6a81c15bf",
  "d3262-coherent-root-frame.json": "dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
  "d3262-coherent-target-comparison-frame.json": "229335224b1c175478537554ec52ee7341b983e7358222fe1c7d67c2af16cc6b",
  "d3262-coherent-actual-proof.json.gz": "103f77ec585cc76fe27990567de2d334a3b98ccd42584087e370d1f317c4fdde",
  "d3262-coherent-first-reply-frontier.json": "1cb357c145d5b8c8ba15cd8b6bd752afb0e70d7b7e3758a0da4ebee022ff7438",
  "d3262-coherent-third-ply-frame.json": "3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07",
  "d3262-coherent-maia-fourth-ply.json": "ddeb2262fcfd98020b84eec65b4e5d8bb915a81ce5b50c6fbe250406a1ec9bfa",
  "d3262-maia-history-replay.json": "81b3d761395be080585af93127245e2116b12b175fac915c9892e1fce361adf4",
  "d3262-maia-coherent-new-child.json": "630bc61693da881024991475b64701e822c8b99a6e76122267b8f34cf30c86bd",
};
export const outputName = "d3262-coherent-horizon-policy.json.gz";
const ck = (v, m) => { if (!v) throw new Error(m); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const close = (a, b, label) => ck(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-10, label);
const candidateKey = (r) => JSON.stringify([r.rootId, r.candidateUci]);
const cellKey = (r) => JSON.stringify([r.rootId, r.targetId, r.candidateUci]);
const index = (rows, key) => { const m = new Map(rows.map((r) => [key(r), r])); ck(m.size === rows.length, "Duplicate horizon identity"); return m; };
export function loadInputs() {
  const values = [], digests = {}, logicalDigests = {};
  for (const [name, pinned] of Object.entries(sources)) {
    const raw = readFileSync(`${directory}/${name}`); ck(sha(raw) === `sha256:${pinned}`, `Changed horizon source ${name}`);
    const value = JSON.parse(name.endsWith(".gz") ? gunzipSync(raw) : raw);
    values.push(value); digests[name] = sha(raw); logicalDigests[name] = sha(JSON.stringify(value));
  }
  return { values, digests, logicalDigests };
}

// The immutable source validator admits normalized float32 support within 1e-5.
// Propagate that existing tolerance over policy layers; do NOT renormalize a
// selected frontier or treat a boundary within this envelope as established.
export const sourceMassTolerance = 1e-5;
export function jointStop(required, covered, sourceOff = false, policyLayers = 1) {
  ck([0.8, 0.9].includes(required) && typeof sourceOff === "boolean" && [1, 2, 3].includes(policyLayers), "Undeclared joint coverage rule");
  const numericalTolerance = (1 + sourceMassTolerance) ** policyLayers - 1;
  if (sourceOff) {
    ck(covered === null, "Unavailable source cannot report zero/known coverage");
    return { status: "source_off_abstain", requiredJointMass: required, coveredJointMass: null, residualMass: null, shortfall: null,
      coveredMassInterval: null, numericalTolerance, authority: "unavailable_not_exact_or_human_frequency" };
  }
  ck(typeof covered === "number" && Number.isFinite(covered) && covered >= 0 && covered <= 1 + numericalTolerance, "Invalid joint mass");
  const lower = Math.max(0, covered - numericalTolerance), upper = Math.min(1, covered + numericalTolerance);
  return { status: lower >= required ? "joint_rule_satisfied" : upper < required ? "frozen_frontier_exhausted_below_joint_threshold" : "numerical_boundary_abstain",
    requiredJointMass: required, coveredJointMass: covered, residualMass: Math.max(0, 1 - covered), shortfall: Math.max(0, required - covered),
    coveredMassInterval: [lower, upper], numericalTolerance,
    authority: "both_sides_configured_model_not_exact_or_human_learner" };
}
export function selectedPrefix(support, required) {
  ck([0.8, 0.9].includes(required) && Array.isArray(support), "Undeclared prefix");
  let mass = 0; const selected = [];
  for (const row of support.slice(0, 8)) {
    if (mass >= required) break;
    ck(typeof row.legalUci === "string" && Number.isFinite(row.mass) && row.mass > 0, "Bad configured support");
    selected.push(row); mass += row.mass;
  }
  return selected;
}
export function composeCoverage(firstMass, paths, absorbingReplyMass = 0, absorbingCandidate = false) {
  ck(Number.isFinite(firstMass) && firstMass >= 0 && firstMass <= 1 + sourceMassTolerance
    && Number.isFinite(absorbingReplyMass) && absorbingReplyMass >= 0 && absorbingReplyMass <= firstMass + sourceMassTolerance
    && typeof absorbingCandidate === "boolean", "Invalid absorption/first mass");
  if (absorbingCandidate) { ck(paths.length === 0, "Absorbing candidate cannot have paths"); return [1, 1, 1]; }
  let three = absorbingReplyMass, four = absorbingReplyMass;
  for (const path of paths) {
    ck(Number.isFinite(path.pathMass) && path.pathMass > 0 && path.pathMass <= 1 + 2 * sourceMassTolerance && Number.isFinite(path.coveredConditionalMass)
      && path.coveredConditionalMass >= 0 && path.coveredConditionalMass <= 1 + sourceMassTolerance
      && (path.terminalReason === null || path.coveredConditionalMass === 1), "Invalid conditional/absorbing path mass");
    three += path.pathMass; four += path.pathMass * path.coveredConditionalMass;
  }
  ck(three <= firstMass + 2 * sourceMassTolerance && four <= three + 3 * sourceMassTolerance, "Overlapping/laundered policy coverage");
  return [firstMass, three, four];
}

export function compile(inputs) {
  const names = Object.keys(sources);
  inputs.values.forEach((v, i) => ck(inputs.digests[names[i]] === `sha256:${sources[names[i]]}`
    && sha(JSON.stringify(v)) === inputs.logicalDigests[names[i]], "Mutated horizon source/value"));
  const [common, rootsFrame, targetFrame, proof, first, third, fourth, oldModel, newModel] = inputs.values;
  ck(common.rows.length === 182 && common.settings.length === 53 && common.contrasts.length === 116
    && common.candidateCoverage.length === 193 && rootsFrame.roots.length === 66 && targetFrame.definitions.length === 64
    && common.convention === convention && proof.candidateGraph.length === 193 && fourth.rows.length === 193
    && third.rows.length === 193 && first.rows.length === 193, "Changed horizon population/convention");
  const roots = index(rootsFrame.roots, (r) => r.rootId), defs = index(targetFrame.definitions, (r) => r.id);
  const graphs = index(proof.candidateGraph, candidateKey), firstIndex = index(first.rows, candidateKey), fourthIndex = index(fourth.rows, candidateKey);
  const modelSources = new Map();
  for (const [name, model] of [[names[7], oldModel], [names[8], newModel]]) for (const row of model.rows) {
    const k = candidateKey(row); ck(!modelSources.has(k), "Duplicate policy path source"); modelSources.set(k, { name, row });
  }
  const nodes = [], nodeMap = new Map();
  const observe = (root, history, definition) => {
    const identity = sha(JSON.stringify([root.rootId, definition.id, ...history]));
    if (!nodeMap.has(identity)) { nodeMap.set(identity, nodes.length); nodes.push({ id: identity, rootId: root.rootId, targetId: definition.id,
      history, observation: observeTargetPathV2(root.fen, history, definition) }); }
    return nodeMap.get(identity);
  };
  const rows = common.rows.map((cell) => {
    const root = roots.get(cell.rootId), definition = defs.get(cell.targetId), graph = graphs.get(candidateKey(cell));
    ck(root && definition?.rootId === root.rootId && graph.rootFen === root.fen, "Crossed horizon target/root");
    const initial = observe(root, [cell.candidateUci], definition), start = nodes[initial].observation;
    ck(start.immediate === cell.immediate, "Changed v2 direct opportunity");
    const available = start.snapshots[0].availableActions.map((a) => a.uci);
    const arms = common.settings.map((setting, ordinal) => {
      const prior = cell.arms[ordinal]; ck(prior.setting === setting.id, "Changed horizon arm order");
      const selected = prior.preparations.map((p) => p.preparationUci);
      ck(new Set(selected).size === selected.length && selected.every((u) => graph.preparations.some((p) => p.preparationUci === u)), "Illegal horizon selection");
      if (["engine_beam", "configured_model"].includes(setting.family)) {
        const frozen = firstIndex.get(candidateKey(cell)).replies.filter((r) => r.selectedBy.includes(setting.id)).map((r) => r.uci);
        ck(equal([...selected].sort(), [...frozen].sort()), "Horizon selector differs from frozen first reply");
      }
      const replies = selected.map((replyUci) => {
        const node = observe(root, [cell.candidateUci, replyUci], definition);
        return { replyUci, node, executesNamedAction: available.includes(replyUci) };
      });
      const omitted = graph.terminalReason === null ? graph.preparations.filter((p) => !selected.includes(p.preparationUci)).map((p) => p.preparationUci) : [];
      const result = { setting: setting.id, family: setting.family, directOpportunity: available.length > 0,
        observedExecution: replies.some((r) => r.executesNamedAction), replies, omittedReplies: omitted,
        unexpandedTerminalLegalMoves: graph.terminalReason === null ? 0 : graph.preparations.length,
        futureReintroduction: "not_observed_beyond_two_ply_horizon",
        universalPreparation: "not_evaluated_beyond_two_ply_horizon", moveReason: "not_an_engine_reason" };
      if (setting.family === "configured_model") {
        const policy = modelSources.get(candidateKey(cell)); ck(policy?.row.rootFen === root.fen, "Crossed horizon model history");
        const threshold = Number(setting.id.split("prefix")[1]), prefix = selectedPrefix(policy.row.configuredSupport, threshold);
        ck(equal(prefix.map((p) => p.legalUci).sort(), [...selected].sort()), "Changed model horizon prefix");
        const covered = prefix.reduce((n, p) => n + p.mass, 0), executed = prefix.filter((p) => available.includes(p.legalUci)).reduce((n, p) => n + p.mass, 0);
        const stop = jointStop(threshold, covered);
        result.policy = { firstSource: policy.name, historyUci: policy.row.historyUci, ...stop,
          literalExecutedMass: executed,
          executedMassLower: available.length ? Math.max(0, executed - stop.numericalTolerance) : 0,
          executedMassUpper: available.length ? Math.min(1, executed + stop.residualMass + stop.numericalTolerance) : 0,
          massPopulation: "literal_configured_policy_conditioned_on_candidate_not_human_frequency" };
      }
      return result;
    });
    return { rootId: cell.rootId, targetId: cell.targetId, candidateUci: cell.candidateUci, sourceObserved: cell.sourceObserved,
      phase: cell.phase, focus: cell.focus, targetActor: cell.targetActor, rootMover: cell.rootMover,
      initial, immediate: cell.immediate, availableActionUcis: available, arms };
  });
  const cells = index(rows, cellKey);
  const contrasts = common.contrasts.map((pair) => {
    const source = cells.get(cellKey({ ...pair, candidateUci: pair.sourceCandidateUci })), alternative = cells.get(cellKey({ ...pair, candidateUci: pair.alternativeCandidateUci }));
    ck(source?.sourceObserved === true && alternative?.sourceObserved === false, "Crossed horizon contrast polarity");
    return { rootId: pair.rootId, targetId: pair.targetId, sourceCandidateUci: pair.sourceCandidateUci, alternativeCandidateUci: pair.alternativeCandidateUci,
      phase: pair.phase, focus: pair.focus,
      directOpponentOptionDifference: direction(source.availableActionUcis.length > 0, alternative.availableActionUcis.length > 0),
      authority: "exact_current_named_action_only_not_later_prevention_or_engine_reason",
      arms: common.settings.map((s, i) => ({ setting: s.id,
        observedExecutionDifference: direction(source.arms[i].observedExecution, alternative.arms[i].observedExecution),
        certifiedExecutionDifference: null, futureDifference: "outside_two_ply_horizon" })) };
  });
  const policyStops = third.rows.map((candidate) => {
    const root = roots.get(candidate.rootId), policy = modelSources.get(candidateKey(candidate)), captured = fourthIndex.get(candidateKey(candidate));
    ck(policy?.row.rootFen === root.fen && equal(policy.row.historyUci, [candidate.candidateUci]) && captured, "Crossed stop history/source");
    const paths = fourth.paths.filter((p) => p.rootId === candidate.rootId && p.historyUci[0] === candidate.candidateUci);
    const arms = fourth.modelArms.map((arm) => {
      const required = Number(arm.split("prefix")[1]), prefix = selectedPrefix(policy.row.configuredSupport, required);
      const firstMass = candidate.terminalAfterCandidate ? 1 : prefix.reduce((n, p) => n + p.mass, 0);
      const full = captured.arms.find((a) => a.arm === arm), previous = candidate.arms.find((a) => a.arm === arm);
      const selectedPaths = paths.filter((p) => p.arms.some((a) => a.arm === arm)).map((p) => {
        const chosen = p.arms.find((a) => a.arm === arm);
        const literal = p.conditionalReplyMass * p.conditionalLearnerMass;
        close(chosen.pathMass, literal, "Changed literal joint product");
        const finalMass = p.terminalReason !== null ? 1 : chosen.selected.reduce((n, e) => n + e.conditionalMass, 0);
        close(chosen.coveredConditionalMass, finalMass, "Changed final conditional product");
        chosen.selected.forEach((e) => close(e.jointMass, literal * e.conditionalMass, "Changed selected leaf joint mass"));
        return { pathId: p.id, pathMass: literal, coveredConditionalMass: finalMass, terminalReason: p.terminalReason };
      });
      const coverage = composeCoverage(firstMass, selectedPaths, full.stoppedAtReplyMass, candidate.terminalAfterCandidate);
      [full.firstCoveredMass, full.twoLayerMass, full.frontierMass].forEach((mass, i) => close(mass, coverage[i], "Crossed literal candidate joint coverage"));
      close(previous.frontierMass, coverage[1], "Crossed earlier horizon joint coverage");
      const layerResiduals = [Math.max(0, 1 - coverage[0]), Math.max(0, coverage[0] - coverage[1]), Math.max(0, coverage[1] - coverage[2])];
      const massBalanceError = layerResiduals.reduce((a, b) => a + b, 0) + coverage[2] - 1;
      ck(Math.abs(massBalanceError) <= 3 * sourceMassTolerance, "Lost layered mass conservation");
      return { arm, prefixCap: 8, firstSource: policy.name, historyUci: policy.row.historyUci,
        firstSelectedReplyUcis: prefix.map((p) => p.legalUci), layerResiduals, massBalanceError,
        absorbingReplyMass: full.stoppedAtReplyMass,
        absorbingThirdPlyMass: selectedPaths.filter((p) => p.terminalReason !== null).reduce((n, p) => n + p.pathMass, 0),
        paths: selectedPaths, horizons: coverage.map((mass, i) => ({ plies: i + 2, ...jointStop(required, mass, false, i + 1) })),
        authority: "audit_frozen_frontier_no_new_selection_or_production_stopping_profile" };
    });
    return { rootId: candidate.rootId, candidateUci: candidate.candidateUci, phase: root.phase, focus: root.focus,
      absorbingCandidate: candidate.terminalAfterCandidate, arms };
  });
  return { version: 1, profile: "d3262-coherent-horizon-policy-v1", convention, manifest: common.manifest, inputDigests: inputs.digests,
    authority: "disposable_two_ply_projection_and_joint_policy_stop_audit_not_production_profile",
    bounds: { targetPlies: 2, policyPlies: [2, 3, 4], fourPlyComparison: Object.keys(sources)[0],
      truncation: "common_first_reply_projection_not_new_forcing_or_PV_selector" },
    sourceMassTolerance, productionProfileSelected: false, endToEndCost: "not_measured_by_this_audit",
    settings: common.settings, controls: common.controls, controlEvidence: common.controlEvidence,
    candidateCoverage: common.candidateCoverage, unpairedTargets: common.unpairedTargets,
    nodes, rows, contrasts, policyStops, modelSource: oldModel.source };
}
export function summarize(output) {
  return { nodes: output.nodes.length, cells: output.rows.length, settings: output.settings.length, pairs: output.contrasts.length,
    directAvailable: output.rows.filter((r) => r.availableActionUcis.length > 0).length,
    directDirectionalPairs: output.contrasts.filter((p) => p.directOpponentOptionDifference !== "same").length,
    executions: output.settings.filter((s) => ["pv:depth12", "forcing:enemy_piece", "engine:depth12:top8", "maia:prefix0.90", "recursive:depth12:top8:top8"].includes(s.id))
      .map((s) => ({ setting: s.id, cells: output.rows.filter((r) => r.arms.find((a) => a.setting === s.id).observedExecution).length })),
    policy: ["maia:prefix0.80", "maia:prefix0.90"].map((arm) => ({ arm, horizons: [2, 3, 4].map((plies) => {
      const stops = output.policyStops.map((r) => r.arms.find((a) => a.arm === arm).horizons.find((h) => h.plies === plies));
      return { plies, candidates: stops.length, satisfied: stops.filter((s) => s.status === "joint_rule_satisfied").length,
        exhausted: stops.filter((s) => s.status === "frozen_frontier_exhausted_below_joint_threshold").length,
        numericalBoundary: stops.filter((s) => s.status === "numerical_boundary_abstain").length,
        minimumCovered: Math.min(...stops.map((s) => s.coveredJointMass)) };
    }) })) };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const output = compile(loadInputs()), raw = Buffer.from(`${JSON.stringify(output)}\n`), zipped = gzipSync(raw, { level: 9 });
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, zipped, { flag: "wx" });
  else ck(readFileSync(`${directory}/${outputName}`).equals(zipped), "Horizon/policy receipt differs from sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(zipped), bytes: zipped.length, ...summarize(output) })}\n`);
}
