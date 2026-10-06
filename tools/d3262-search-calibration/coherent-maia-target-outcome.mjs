// Disposable D3262/D3482 semantic join over actual selected model paths.
// Opportunity is not sampled execution; a partial miss is not prevention.
import { readFileSync, writeFileSync } from "node:fs";
import { observeTargetPath } from "./dist/coherent-bounded-targets.mjs";
import { compileMaiaFourthPly, loadFourthPlyInputs, outputName as modelName, modelArms } from "./coherent-maia-fourth-ply.mjs";
import { directory, sha } from "./third-ply-source-check.mjs";

const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
  "d3262-coherent-bounded-targets.json", modelName];
export const outputName = "d3262-coherent-maia-target-outcome.json";
function check(value, message) { if (!value) throw new Error(message); }
const bytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const candidateKey = (row) => JSON.stringify([row.rootId, row.candidateUci]);
const targetKey = (row) => JSON.stringify([row.rootId, row.targetId, row.candidateUci]);
function index(rows, key, label) {
  const result = new Map(rows.map((row) => [key(row), row]));
  check(result.size === rows.length, `Duplicated ${label}`);
  return result;
}

export function summarizeObservedTargets(paths, arm) {
  const chosen = paths.filter((path) => path.arms.some((value) => value.arm === arm));
  const entries = chosen.map((path) => ({ path, selected: path.arms.find((value) => value.arm === arm) }));
  const leaves = entries.flatMap(({ path, selected }) => selected.leaves.map((leaf) => ({ path, leaf })));
  check(new Set(chosen.map((path) => path.id)).size === chosen.length
    && new Set(leaves.map(({ leaf }) => leaf.leafId)).size === leaves.length, "Duplicated observed semantic path/leaf");
  check(entries.every(({ selected }) => Number.isFinite(selected.pathMass) && selected.pathMass > 0)
    && leaves.every(({ path, leaf }) => Number.isFinite(leaf.jointMass) && leaf.jointMass > 0
      && (!leaf.observation.executedAtFourthPly || path.observation.opportunityAtThirdPly)),
  "Invalid or incoherent observed semantic source mass");
  // Each opportunity is counted once at its three-ply predecessor, not once
  // for every fourth-ply leaf that happens to be selected from that node.
  const opportunities = entries.filter(({ path }) => path.observation.opportunityAtThirdPly);
  const reintroduced = entries.filter(({ path }) => path.observation.reintroducedAtThirdPly);
  const executed = leaves.filter(({ leaf }) => leaf.observation.executedAtFourthPly);
  const executedReintroductions = executed.filter(({ path }) => path.observation.reintroducedAtThirdPly);
  const opportunityMass = opportunities.reduce((sum, value) => sum + value.selected.pathMass, 0);
  const executionMass = executed.reduce((sum, value) => sum + value.leaf.jointMass, 0);
  check(opportunityMass >= 0 && opportunityMass <= 1 + 1e-5
    && executionMass >= 0 && executionMass <= opportunityMass + 1e-5, "Invalid semantic opportunity/execution mass");
  return { arm, selectedPredecessorPaths: chosen.length, selectedFourthPlyLeaves: leaves.length,
    opportunityPaths: opportunities.map(({ path }) => path.id), opportunityMass,
    reintroducedPaths: reintroduced.map(({ path }) => path.id),
    reintroducedOpportunityMass: reintroduced.reduce((sum, value) => sum + value.selected.pathMass, 0),
    executedLeaves: executed.map(({ leaf }) => leaf.leafId), executionMass,
    executedReintroducedLeaves: executedReintroductions.map(({ leaf }) => leaf.leafId),
    reintroducedExecutionMass: executedReintroductions.reduce((sum, value) => sum + value.leaf.jointMass, 0),
    negativeVerdict: "abstain_from_partial_frontier", universalVerdict: "not_evaluated",
    proofCeiling: "observed_configured_model_paths_only" };
}

export function compileMaiaTargetOutcome(comparisons, rootsFrame, bounded, model, inputDigests) {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1" && comparisons.comparisons.length === 182
    && comparisons.definitions.length === 64 && comparisons.controls.length === 4
    && rootsFrame.profile === "d3262-coherent-root-v1" && rootsFrame.roots.length === 66
    && bounded.profile === "d3262-coherent-bounded-targets-v1" && bounded.rows.length === 182
    && model.profile === "d3262-coherent-maia-fourth-ply-v1" && model.rows.length === 193
    && model.paths.length === 1401 && model.leaves.length === 4127
    && [rootsFrame, bounded, model].every((item) => item.manifest === comparisons.manifest)
    && comparisons.rootFrameDigest === inputDigests[names[1]]
    && bounded.inputDigests[names[0]] === inputDigests[names[0]]
    && bounded.inputDigests[names[1]] === inputDigests[names[1]]
    && model.inputDigests[names[1]] === inputDigests[names[1]], "Crossed actual semantic path authorities");
  const roots = index(rootsFrame.roots, (row) => row.rootId, "semantic root");
  const definitions = index(comparisons.definitions, (row) => row.id, "named target");
  const exact = index(bounded.rows, targetKey, "exact baseline cell");
  const candidates = index(model.rows, candidateKey, "model candidate");
  const leafIndex = index(model.leaves, (row) => row.id, "model leaf");
  const pathIndex = index(model.paths, (row) => row.id, "model predecessor");
  const grouped = new Map(), cache = new Map();
  for (const path of model.paths) {
    const key = candidateKey({ rootId: path.rootId, candidateUci: path.historyUci[0] });
    const group = grouped.get(key) ?? [];
    group.push(path);
    grouped.set(key, group);
  }
  const observation = (root, target, historyUci) => {
    const key = JSON.stringify([target.id, root.rootId, ...historyUci]);
    if (!cache.has(key)) cache.set(key, observeTargetPath(root.fen, historyUci, target));
    return cache.get(key);
  };
  const rows = comparisons.comparisons.map((pair) => {
    const root = roots.get(pair.rootId), definition = definitions.get(pair.targetId);
    const baseline = exact.get(targetKey(pair)), candidate = candidates.get(candidateKey(pair));
    check(definition?.rootId === root?.rootId && baseline?.kind === "result"
      && baseline.family === definition.family && baseline.sourceObserved === pair.sourceObserved
      && candidate !== undefined, "Missing target/candidate semantic cell");
    const immediate = observation(root, definition, [pair.candidateUci]);
    check(immediate.immediate === baseline.immediate, "Actual path changed the registered immediate question");
    const paths = (grouped.get(candidateKey(pair)) ?? []).map((path) => {
      check(path.rootFen === root.fen && path.historyUci.length === 3 && pathIndex.get(path.id) === path,
        "Crossed actual predecessor root/history");
      const observed = observation(root, definition, path.historyUci);
      check(observed.snapshots.at(-1).fen === path.fen
        && observed.snapshots.at(-1).terminalReason === path.terminalReason
        && (!observed.reintroducedAtThirdPly || baseline.reintroducedWithin3Ply),
      "Actual predecessor exceeded the exact baseline or crossed its terminal");
      const arms = path.arms.map((arm) => {
        check(modelArms.includes(arm.arm), "Unknown model semantic arm");
        const leaves = arm.selected.map((entry) => {
          const leaf = leafIndex.get(entry.leafId);
          check(leaf?.rootId === pair.rootId && leaf.rootFen === root.fen && leaf.selectedBy.includes(arm.arm)
            && JSON.stringify(leaf.historyUci.slice(0, 3)) === JSON.stringify(path.historyUci)
            && leaf.historyUci[3] === entry.moveUci
            && Number.isFinite(entry.jointMass) && entry.jointMass > 0, "Crossed actual semantic leaf/source mass");
          const observedLeaf = observation(root, definition, leaf.historyUci);
          check(observedLeaf.snapshots.at(-1).fen === leaf.fen
            && observedLeaf.snapshots.at(-1).terminalReason === leaf.terminalReason,
          "Crossed observed fourth-ply board/terminal");
          return { leafId: leaf.id, jointMass: entry.jointMass, observation: observedLeaf };
        });
        return { arm: arm.arm, pathMass: arm.pathMass, leaves };
      });
      return { id: path.id, observation: observed, arms };
    });
    const arms = modelArms.map((arm) => ({ ...summarizeObservedTargets(paths, arm),
      coveredPredecessorMass: candidate.arms.find((entry) => entry.arm === arm).twoLayerMass,
      coveredFourthPlyMass: candidate.arms.find((entry) => entry.arm === arm).frontierMass,
      residualMass: candidate.arms.find((entry) => entry.arm === arm).residualMass }));
    return { rootId: pair.rootId, targetId: pair.targetId, candidateUci: pair.candidateUci,
      family: definition.family, phase: candidate.phase, sourceObserved: pair.sourceObserved,
      immediate: immediate.immediate, exactBaseline: { reintroducedWithin3Ply: baseline.reintroducedWithin3Ply,
        preparationSurvivesEveryDefence: baseline.preparationSurvivesEveryDefence }, paths, arms };
  });
  check(index(rows, targetKey, "actual semantic cell").size === 182, "Lost actual semantic population");
  return { version: 1, profile: "d3262-coherent-maia-target-outcome-v1", manifest: model.manifest,
    authority: "observed_named_target_opportunities_and_executions_under_partial_model_paths_not_universal_proof_or_engine_cause",
    inputDigests, modelSource: model.source, modelArms, controls: comparisons.controls, rows };
}

export function loadTargetOutcomeInputs() {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  check(bytes(compileMaiaFourthPly(loadFourthPlyInputs())).equals(inputs[3]), "Changed actual model traversal bytes");
  return [...inputs.map((value) => JSON.parse(value)), Object.fromEntries(names.map((name, i) => [name, sha(inputs[i])]))];
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const artifact = compileMaiaTargetOutcome(...loadTargetOutcomeInputs()), output = bytes(artifact);
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, output, { flag: "wx" });
  else check(readFileSync(`${directory}/${outputName}`).equals(output), "Actual model target outcome differs from frozen sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), cells: artifact.rows.length,
    arms: Object.fromEntries(modelArms.map((arm) => {
      const pairs = artifact.rows.map((row) => ({ row, arm: row.arms.find((value) => value.arm === arm) }));
      return [arm, { opportunityCells: pairs.filter(({ arm: value }) => value.opportunityPaths.length > 0).length,
        reintroducedOpportunityCells: pairs.filter(({ arm: value }) => value.reintroducedPaths.length > 0).length,
        executedCells: pairs.filter(({ arm: value }) => value.executedLeaves.length > 0).length,
        executedReintroducedCells: pairs.filter(({ arm: value }) => value.executedReintroducedLeaves.length > 0).length,
        missedExactReintroductions: pairs.filter(({ row, arm: value }) => row.exactBaseline.reintroducedWithin3Ply
          && value.reintroducedPaths.length === 0).length,
        absenceVerdicts: pairs.filter(({ arm: value }) => value.negativeVerdict !== "abstain_from_partial_frontier").length }];
    })) }, null, 2)}\n`);
}
