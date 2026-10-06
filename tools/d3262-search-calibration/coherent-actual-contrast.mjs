// Disposable D3262/D3487 actual-path contrast, not a production reason compiler.
// A visited opportunity is not execution; a partial miss is not prevention.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { directory, sha } from "./third-ply-source-check.mjs";
import { engineArms } from "./coherent-engine-fourth-ply.mjs";
import { arms as semanticArms } from "./coherent-semantic-third-ply.mjs";
import { modelArms } from "./coherent-maia-fourth-ply.mjs";
import { summarizeUnweightedTargetPaths } from "./coherent-engine-target-outcome.mjs";
import { summarizeObservedTargets } from "./coherent-maia-target-outcome.mjs";

export const names = ["d3262-coherent-bounded-contrast.json", "d3262-coherent-engine-target-outcome.json.gz",
  "d3262-coherent-maia-target-outcome.json"];
export const outputName = "d3262-coherent-actual-contrast.json";
function check(value, message) { if (!value) throw new Error(message); }
const cellKey = (row) => JSON.stringify([row.rootId, row.targetId, row.candidateUci]);
const pairKey = (row) => JSON.stringify([row.rootId, row.targetId, row.sourceCandidateUci, row.alternativeCandidateUci]);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function index(rows, key, label) {
  const result = new Map(rows.map((row) => [key(row), row]));
  check(result.size === rows.length, `Duplicated ${label}`);
  return result;
}
export function direction(source, alternative) {
  check(typeof source === "boolean" && typeof alternative === "boolean", "Untyped contrast direction");
  return source === alternative ? "same" : source ? "source_only_opponent_option" : "alternative_only_opponent_option";
}
export function projectObservedArm(cell, arm, kind) {
  check(["engine", "semantic_first_reply_reserve", "model"].includes(kind)
    && ["preserved", "removed", "identity_lost"].includes(cell.immediate)
    && arm.negativeVerdict === "abstain_from_partial_frontier" && arm.universalVerdict === "not_evaluated"
    && arm.proofCeiling === (kind === "model" ? "observed_configured_model_paths_only" : "observed_provider_selected_lines_only")
    && ["opportunityPaths", "reintroducedPaths", "executedLeaves", "executedReintroducedLeaves"].every((field) =>
      Array.isArray(arm[field]) && new Set(arm[field]).size === arm[field].length)
    && (!arm.reintroducedPaths.length || cell.exactBaseline.reintroducedWithin3Ply), "Changed actual target proof authority");
  const opportunity = cell.immediate === "preserved" || arm.reintroducedPaths.length > 0;
  const status = cell.immediate === "preserved" ? "direct_witness"
    : arm.reintroducedPaths.length ? "visited_reintroduction_witness" : "unknown_partial_frontier";
  const result = { status, opportunity, execution: arm.executedLeaves.length > 0,
    selectedPredecessorPaths: arm.selectedPredecessorPaths, selectedFourthPlyLeaves: arm.selectedFourthPlyLeaves,
    opportunityPaths: arm.opportunityPaths, reintroducedPaths: arm.reintroducedPaths,
    executedLeaves: arm.executedLeaves, executedReintroducedLeaves: arm.executedReintroducedLeaves,
    negativeVerdict: arm.negativeVerdict, universalVerdict: arm.universalVerdict, proofCeiling: arm.proofCeiling };
  if (kind === "model") {
    const fields = ["opportunityMass", "reintroducedOpportunityMass", "executionMass", "reintroducedExecutionMass",
      "coveredPredecessorMass", "coveredFourthPlyMass", "residualMass"];
    check(fields.every((field) => typeof arm[field] === "number" && Number.isFinite(arm[field])
      && arm[field] >= 0 && arm[field] <= 1 + 1e-5)
      && Math.abs(arm.coveredFourthPlyMass + arm.residualMass - 1) <= 1e-5,
    "Changed literal model mass/residual");
    result.modelMass = Object.fromEntries(fields.map((field) => [field, arm[field]]));
    result.weightAuthority = "literal_configured_model_mass_not_human_frequency";
  } else {
    check(arm.weightAuthority === "unweighted_selected_paths_not_policy_mass_or_human_frequency"
      && !Object.keys(arm).some((field) => /mass|probability/iu.test(field)), "Invented engine policy mass");
    check(Object.values(arm.omissions).every((value) => Number.isSafeInteger(value) && value >= 0)
      && Array.isArray(arm.absorbingThirdPlyPaths)
      && new Set(arm.absorbingThirdPlyPaths).size === arm.absorbingThirdPlyPaths.length, "Changed actual omissions");
    result.omissions = arm.omissions; result.absorbingThirdPlyPaths = arm.absorbingThirdPlyPaths;
    result.weightAuthority = arm.weightAuthority;
  }
  return result;
}
export function compareObservedArms(source, alternative, exact) {
  check(["same", "source_only_opponent_option", "alternative_only_opponent_option"].includes(exact), "Unknown exact contrast direction");
  const observedOpportunity = direction(source.opportunity, alternative.opportunity);
  // Positive existence is known from a direct/visited witness. No partial
  // negative can be borrowed from the complete baseline to certify direction.
  const certifiedOpportunity = source.opportunity && alternative.opportunity ? "same" : null;
  check(certifiedOpportunity === null || certifiedOpportunity === exact, "Witness contrast exceeds exact baseline");
  return { source, alternative, observedOpportunity,
    observedExecution: direction(source.execution, alternative.execution),
    certifiedOpportunity, abstains: certifiedOpportunity === null,
    certifiedExecution: null, executionAbsenceVerdict: "abstain_from_partial_frontier",
    apparentOnExactSame: exact === "same" && observedOpportunity !== "same",
    reasonDisposition: "not_an_engine_reason" };
}

function validateEngineCell(cell, arm, observations, observationIndex) {
  const paths = arm.paths.map((path) => {
    const resolve = (i) => {
      check(Number.isSafeInteger(i) && i >= 0 && i < observations.length, "Invalid actual compact reference");
      const item = observations[i];
      check(item.rootId === cell.rootId && item.targetId === cell.targetId && item.observation.immediate === cell.immediate,
        "Crossed actual contrast witness identity");
      return item;
    };
    check(equal(Object.keys(path).sort(), ["leafObservations", "predecessorObservation"]), "Changed actual compact path shape");
    const predecessor = resolve(path.predecessorObservation);
    return { pathId: predecessor.pathId, observationId: predecessor.id,
      leaves: path.leafObservations.map((i) => { const leaf = resolve(i); return { leafId: leaf.pathId, observationId: leaf.id }; }) };
  });
  const summary = summarizeUnweightedTargetPaths(paths, observationIndex);
  check(Object.entries(summary).every(([field, value]) => equal(arm[field], value)), "Changed actual engine witness summary");
}

export function compileActualContrast(contrast, engine, model, inputDigests) {
  check(contrast.profile === "d3262-coherent-bounded-contrast-v1" && contrast.rows.length === 116
    && contrast.unpairedTargets.length === 17 && engine.profile === "d3262-coherent-engine-target-outcome-v1"
    && model.profile === "d3262-coherent-maia-target-outcome-v1" && engine.profiles.length === 2
    && model.rows.length === 182 && engine.observations.length === 166835
    && [engine, model].every((value) => value.manifest === contrast.manifest), "Changed actual contrast population");
  for (const name of ["d3262-coherent-root-frame.json", "d3262-coherent-target-comparison-frame.json", "d3262-coherent-bounded-targets.json"])
    check(contrast.inputDigests[name] && [engine, model].every((value) => value.inputDigests[name] === contrast.inputDigests[name]),
      "Crossed actual contrast source digest");
  check(equal(engine.controls, model.controls) && engine.controls.length === 4, "Crossed actual contrast controls");
  index(contrast.rows, pairKey, "contrast pair");
  const observationIndex = index(engine.observations, (row) => row.id, "contrast observation");
  const inputs = [...engine.profiles, { kind: "model", arms: model.modelArms, rows: model.rows }];
  const expected = new Map([["engine", engineArms], ["semantic_first_reply_reserve", semanticArms], ["model", modelArms]]);
  const keys = index(model.rows, cellKey, "model cell");
  const profiles = inputs.map((profile) => {
    check(equal(profile.arms, expected.get(profile.kind)) && profile.rows.length === 182, "Changed actual contrast arms");
    if (profile.kind === "semantic_first_reply_reserve") check(profile.candidateCoverage?.length === 193
      && index(profile.candidateCoverage, (row) => JSON.stringify([row.rootId, row.candidateUci]), "coverage candidate").size === 193
      && profile.controls?.length === 4, "Lost actual offered-candidate coverage");
    const cells = index(profile.rows, cellKey, "actual target cell"), observed = new Map();
    check(equal([...cells.keys()].sort(), [...keys.keys()].sort()), "Crossed actual contrast cell identities");
    for (const cell of profile.rows) {
      const same = keys.get(cellKey(cell));
      check(equal(cell.arms.map((arm) => arm.arm), profile.arms) && equal(cell.exactBaseline, same.exactBaseline)
        && cell.immediate === same.immediate && cell.phase === same.phase && cell.family === same.family
        && typeof cell.sourceObserved === "boolean" && cell.sourceObserved === same.sourceObserved, "Changed actual contrast cell context");
      observed.set(cellKey(cell), new Map(cell.arms.map((arm) => {
        if (profile.kind === "model") {
          const summary = summarizeObservedTargets(cell.paths, arm.arm);
          check(Object.entries(summary).every(([field, value]) => equal(arm[field], value)), "Changed actual model witness summary");
        } else validateEngineCell(cell, arm, engine.observations, observationIndex);
        return [arm.arm, projectObservedArm(cell, arm, profile.kind)];
      })));
    }
    const rows = contrast.rows.map((pair) => {
      const sourceKey = cellKey({ ...pair, candidateUci: pair.sourceCandidateUci });
      const alternativeKey = cellKey({ ...pair, candidateUci: pair.alternativeCandidateUci });
      const source = cells.get(sourceKey), alternative = cells.get(alternativeKey);
      check(source?.sourceObserved === true && alternative?.sourceObserved === false
        && source.phase === alternative.phase
        && [source, alternative].every((cell) => cell.family === pair.family)
        && ["source", "alternative"].every((side) => { const cell = side === "source" ? source : alternative;
          return cell.immediate === pair[side].immediate && equal(cell.exactBaseline, {
            reintroducedWithin3Ply: pair[side].reintroducedWithin3Ply,
            preparationSurvivesEveryDefence: pair[side].preparationSurvivesEveryDefence }); }), "Crossed actual same-target pair");
      const exact = direction(pair.source.immediate === "preserved" || pair.source.reintroducedWithin3Ply,
        pair.alternative.immediate === "preserved" || pair.alternative.reintroducedWithin3Ply);
      check(pair.reachWithinBound === exact, "Changed exact contrast direction");
      return { rootId: pair.rootId, targetId: pair.targetId, family: pair.family, phase: source.phase,
        sourceCandidateUci: pair.sourceCandidateUci, alternativeCandidateUci: pair.alternativeCandidateUci,
        boundedScope: pair.boundedScope, exact, rootRanks: pair.rootRanks,
        arms: profile.arms.map((arm) => ({ arm, ...compareObservedArms(observed.get(sourceKey).get(arm), observed.get(alternativeKey).get(arm), exact) })) };
    });
    return { kind: profile.kind, arms: profile.arms, rows,
      candidateCoverage: profile.candidateCoverage ?? null, controls: profile.controls ?? null };
  });
  check(new Set(profiles.map((profile) => profile.kind)).size === 3, "Duplicated actual contrast profile");
  return { version: 1, profile: "d3262-coherent-actual-contrast-v1", manifest: contrast.manifest, inputDigests,
    authority: "same_named_target_actual_partial_paths_with_abstention_not_prevention_or_engine_causality",
    unpairedTargets: contrast.unpairedTargets, controls: engine.controls, profiles };
}
export function loadActualInputs() {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  return [...inputs.map((value, i) => JSON.parse(names[i].endsWith(".gz") ? gunzipSync(value) : value)),
    Object.fromEntries(names.map((name, i) => [name, sha(inputs[i])]))];
}
export function summarizeActualContrast(output) {
  return Object.fromEntries(output.profiles.flatMap((profile) => profile.arms.map((arm) => {
    const rows = profile.rows.map((row) => ({ exact: row.exact, chosen: row.arms.find((item) => item.arm === arm) }));
    return [arm, { pairs: rows.length, exactDirectional: rows.filter(({ exact }) => exact !== "same").length,
      observedDirectional: rows.filter(({ chosen }) => chosen.observedOpportunity !== "same").length,
      observedCorrectDirectional: rows.filter(({ exact, chosen }) => exact !== "same" && exact === chosen.observedOpportunity).length,
      apparentOnExactSame: rows.filter(({ chosen }) => chosen.apparentOnExactSame).length,
      certifiedDirectional: rows.filter(({ chosen }) => chosen.certifiedOpportunity !== null && chosen.certifiedOpportunity !== "same").length,
      abstentions: rows.filter(({ chosen }) => chosen.abstains).length,
      observedExecutionDirectional: rows.filter(({ chosen }) => chosen.observedExecution !== "same").length,
      certifiedExecution: rows.filter(({ chosen }) => chosen.certifiedExecution !== null).length }];
  })));
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const output = compileActualContrast(...loadActualInputs()), bytes = Buffer.from(`${JSON.stringify(output, null, 2)}\n`);
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, bytes, { flag: "wx" });
  else check(readFileSync(`${directory}/${outputName}`).equals(bytes), "Actual contrast differs from frozen sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), bytes: bytes.length, summary: summarizeActualContrast(output) }, null, 2)}\n`);
}
