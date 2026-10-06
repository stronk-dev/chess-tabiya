// Disposable D3262/D3486 same-target join. Observed opportunity/execution is
// not probability, a negative proof, a universal strategy or engine causality.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { observeTargetPath } from "./dist/coherent-bounded-targets.mjs";
import { directory, sha } from "./third-ply-source-check.mjs";
import { outputName as frontierName, engineArms } from "./coherent-engine-fourth-ply.mjs";
import { arms as semanticArms } from "./coherent-semantic-third-ply.mjs";

export const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json", "d3262-coherent-bounded-targets.json", frontierName];
export const outputName = "d3262-coherent-engine-target-outcome.json.gz";
function check(value, message) { if (!value) throw new Error(message); }
const candidateKey = (row) => JSON.stringify([row.rootId, row.candidateUci]);
const cellKey = (row) => JSON.stringify([row.rootId, row.targetId, row.candidateUci]);
function index(rows, key, label) {
  const result = new Map(rows.map((row) => [key(row), row]));
  check(result.size === rows.length, `Duplicated ${label}`);
  return result;
}

export function summarizeUnweightedTargetPaths(paths, observationIndex) {
  check(new Set(paths.map((path) => path.pathId)).size === paths.length, "Duplicated target predecessor");
  const predecessors = paths.map((path) => ({ path, observation: observationIndex.get(path.observationId)?.observation }));
  const leaves = predecessors.flatMap(({ path, observation }) => {
    check(observation !== undefined, "Missing predecessor target observation");
    check(new Set(path.leaves.map((leaf) => leaf.leafId)).size === path.leaves.length, "Duplicated target leaf");
    return path.leaves.map((leaf) => {
      const observed = observationIndex.get(leaf.observationId)?.observation;
      check(observed && (!observed.executedAtFourthPly || observation.opportunityAtThirdPly), "Execution has no actual predecessor opportunity");
      return { leaf, observation: observed, predecessor: observation };
    });
  });
  check(new Set(leaves.map(({ leaf }) => leaf.leafId)).size === leaves.length, "Crossed target leaf identity");
  return { selectedPredecessorPaths: paths.length, selectedFourthPlyLeaves: leaves.length,
    opportunityPaths: predecessors.filter(({ observation }) => observation.opportunityAtThirdPly).map(({ path }) => path.pathId),
    reintroducedPaths: predecessors.filter(({ observation }) => observation.reintroducedAtThirdPly).map(({ path }) => path.pathId),
    executedLeaves: leaves.filter(({ observation }) => observation.executedAtFourthPly).map(({ leaf }) => leaf.leafId),
    executedReintroducedLeaves: leaves.filter(({ observation, predecessor }) => observation.executedAtFourthPly && predecessor.reintroducedAtThirdPly).map(({ leaf }) => leaf.leafId),
    weightAuthority: "unweighted_selected_paths_not_policy_mass_or_human_frequency",
    negativeVerdict: "abstain_from_partial_frontier", universalVerdict: "not_evaluated", proofCeiling: "observed_provider_selected_lines_only" };
}

export function compactObservationReferences(profiles, observations) {
  const indices = index(observations.map((item, i) => ({ ...item, index: i })), (item) => item.id, "compact observation identity");
  const reference = (id, pathId) => {
    const item = indices.get(id);
    check(item?.pathId === pathId && Number.isSafeInteger(item.index), "Crossed compact target observation reference");
    return item.index;
  };
  return profiles.map((profile) => ({ ...profile, rows: profile.rows.map((row) => ({ ...row, arms: row.arms.map((arm) => ({ ...arm,
    paths: arm.paths.map((path) => ({ predecessorObservation: reference(path.observationId, path.pathId),
      leafObservations: path.leaves.map((leaf) => reference(leaf.observationId, leaf.leafId)) })) })) })) }));
}

export function compileEngineTargetOutcome(comparisons, rootsFrame, bounded, frontier, inputDigests) {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1" && comparisons.comparisons.length === 182
    && comparisons.definitions.length === 64 && comparisons.controls.length === 4
    && rootsFrame.profile === "d3262-coherent-root-v1" && rootsFrame.roots.length === 66
    && bounded.profile === "d3262-coherent-bounded-targets-v1" && bounded.rows.length === 182
    && frontier.profile === "d3262-coherent-engine-fourth-ply-v1" && frontier.profiles.length === 2
    && [rootsFrame, bounded, frontier].every((item) => item.manifest === comparisons.manifest)
    && comparisons.rootFrameDigest === inputDigests[names[1]]
    && bounded.inputDigests[names[0]] === inputDigests[names[0]]
    && bounded.inputDigests[names[1]] === inputDigests[names[1]], "Crossed actual engine target authorities");
  const roots = index(rootsFrame.roots, (row) => row.rootId, "target root"), definitions = index(comparisons.definitions, (row) => row.id, "target definition");
  const exact = index(bounded.rows, cellKey, "exact target baseline"), leaves = index(frontier.leaves, (row) => row.id, "actual fourth-ply leaf");
  const observations = new Map();
  const observe = (root, target, path) => {
    check(path.rootId === root.rootId && path.rootFen === root.fen, "Crossed target path/root identity");
    const id = sha(JSON.stringify([target.id, root.rootId, ...path.historyUci]));
    if (!observations.has(id)) {
      const observation = observeTargetPath(root.fen, path.historyUci, target), last = observation.snapshots.at(-1);
      check(last.fen === path.fen && last.terminalReason === path.terminalReason, "Crossed target path board/terminal");
      observations.set(id, { id, pathId: path.id, rootId: root.rootId, targetId: target.id, observation });
    }
    return id;
  };
  const profiles = frontier.profiles.map((profile) => {
    const arms = profile.kind === "engine" ? engineArms : semanticArms;
    check(["engine", "semantic_first_reply_reserve"].includes(profile.kind) && JSON.stringify(profile.arms) === JSON.stringify(arms)
      && profile.rows.length === (profile.kind === "engine" ? 193 : 182), "Crossed target frontier profile/arms");
    const candidates = index(profile.rows, profile.kind === "engine" ? candidateKey : cellKey, "target candidate/cell");
    const paths = index(profile.paths, (row) => row.id, "actual third-ply path");
    const rows = comparisons.comparisons.map((pair) => {
      const root = roots.get(pair.rootId), target = definitions.get(pair.targetId), baseline = exact.get(cellKey(pair));
      const candidate = candidates.get(profile.kind === "engine" ? candidateKey(pair) : cellKey(pair));
      check(target?.rootId === root?.rootId && baseline?.kind === "result" && baseline.family === target.family
        && baseline.sourceObserved === pair.sourceObserved && candidate, "Missing actual target cell");
      const immediate = observeTargetPath(root.fen, [pair.candidateUci], target);
      check(immediate.immediate === baseline.immediate, "Changed exact immediate target question");
      const armRows = arms.map((arm) => {
        const selected = candidate.arms.find((item) => item.arm === arm);
        check(selected?.universalVerdict === "not_evaluated" && selected.negativeVerdict === "abstain_partial", "Invented target source proof");
        const chosen = selected.selectedPaths.map((id) => {
          const path = paths.get(id), pathArm = path?.arms.find((item) => item.arm === arm);
          check(path?.historyUci.length === 3 && path.historyUci[0] === pair.candidateUci && pathArm, "Crossed target predecessor/arm");
          const observationId = observe(root, target, path), observed = observations.get(observationId).observation;
          check(observed.immediate === baseline.immediate && (!observed.reintroducedAtThirdPly || baseline.reintroducedWithin3Ply),
            "Actual target path exceeds exact baseline");
          const selectedLeaves = pathArm.selected.map((entry) => {
            const leaf = leaves.get(entry.leafId);
            check(leaf && JSON.stringify(leaf.historyUci.slice(0, 3)) === JSON.stringify(path.historyUci)
              && leaf.historyUci[3] === entry.moveUci, "Crossed actual target execution leaf");
            return { leafId: leaf.id, observationId: observe(root, target, leaf) };
          });
          return { pathId: path.id, observationId, leaves: selectedLeaves };
        });
        return { arm, ...summarizeUnweightedTargetPaths(chosen, observations), paths: chosen,
          omissions: { firstReplies: selected.inputSelection.unvisitedReplies,
            learnerEdgesWithinSelectedReplies: selected.inputSelection.unvisitedLearnerEdgesWithinSelectedReplies,
            fourthRepliesWithinSelectedNonterminalPaths: selected.omittedLegalFourthRepliesWithinSelectedNonterminalPaths },
          absorbingThirdPlyPaths: selected.absorbingThirdPlyPaths };
      });
      return { ...pair, family: target.family, phase: candidate.phase, immediate: immediate.immediate,
        exactBaseline: { reintroducedWithin3Ply: baseline.reintroducedWithin3Ply, preparationSurvivesEveryDefence: baseline.preparationSurvivesEveryDefence }, arms: armRows };
    });
    check(index(rows, cellKey, "actual engine target cell").size === 182, "Lost actual target population");
    return { kind: profile.kind, traversalRule: profile.traversalRule, arms, rows, candidateCoverage: profile.candidateCoverage, controls: profile.controls };
  });
  check(new Set(profiles.map((profile) => profile.kind)).size === 2, "Duplicated target profile");
  const observationRows = [...observations.values()];
  return { version: 1, profile: "d3262-coherent-engine-target-outcome-v1", manifest: frontier.manifest,
    authority: "observed_named_target_opportunities_and_executions_under_partial_engine_paths_not_universal_proof_or_engine_cause",
    referenceEncoding: "zero_based_global_observation_indices_with_literal_named_path_identity",
    inputDigests, source: frontier.source, controls: comparisons.controls,
    profiles: compactObservationReferences(profiles, observationRows), observations: observationRows };
}
export function loadEngineTargetInputs() {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  return [...inputs.map((value, i) => JSON.parse(names[i].endsWith(".gz") ? gunzipSync(value) : value)),
    Object.fromEntries(names.map((name, i) => [name, sha(inputs[i])]))];
}
export function summary(output) {
  return { observations: output.observations.length, profiles: output.profiles.map((profile) => ({ kind: profile.kind, cells: profile.rows.length,
    arms: Object.fromEntries(profile.arms.map((arm) => {
      const pairs = profile.rows.map((row) => ({ row, chosen: row.arms.find((item) => item.arm === arm) }));
      return [arm, { opportunityCells: pairs.filter(({ chosen }) => chosen.opportunityPaths.length).length,
        reintroducedOpportunityCells: pairs.filter(({ chosen }) => chosen.reintroducedPaths.length).length,
        executedCells: pairs.filter(({ chosen }) => chosen.executedLeaves.length).length,
        executedReintroducedCells: pairs.filter(({ chosen }) => chosen.executedReintroducedLeaves.length).length,
        missedExactReintroductions: pairs.filter(({ row, chosen }) => row.exactBaseline.reintroducedWithin3Ply && !chosen.reintroducedPaths.length).length,
        absenceVerdicts: pairs.filter(({ chosen }) => chosen.negativeVerdict !== "abstain_from_partial_frontier").length }];
    })) })) };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const output = compileEngineTargetOutcome(...loadEngineTargetInputs()), raw = Buffer.from(`${JSON.stringify(output)}\n`), compressed = gzipSync(raw);
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, compressed, { flag: "wx" });
  else check(readFileSync(`${directory}/${outputName}`).equals(compressed), "Actual engine target outcome differs from frozen sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(compressed), logicalDigest: sha(raw), compressedBytes: compressed.length, ...summary(output) }, null, 2)}\n`);
}
