// Disposable D3491: actual recursive target/contrast/quantifier joins.
// The historical local evaluator is shared, not independent strategic truth.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { observeTargetPath } from "./dist/coherent-bounded-targets.mjs";
import { directory, sha } from "./third-ply-source-check.mjs";
import { summarizeUnweightedTargetPaths, compactObservationReferences } from "./coherent-engine-target-outcome.mjs";
import { projectPreparation, projectRoot } from "./coherent-actual-proof.mjs";
import { projectObservedArm, compareObservedArms, direction } from "./coherent-actual-contrast.mjs";
import { arms } from "./coherent-recursive-semantic.mjs";

export const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
  "d3262-coherent-bounded-targets.json", "d3262-coherent-recursive-semantic-frame.json.gz",
  "d3262-coherent-recursive-fourth-ply.json.gz", "d3262-coherent-bounded-contrast.json",
  "d3262-coherent-actual-proof.json.gz"];
export const outputName = "d3262-coherent-recursive-evaluation.json.gz";
export const oracleLimitations = ["shared_local_see_not_independent_strategic_truth",
  "legacy_material_predicate_does_not_resolve_en_passant_or_promotion_captures_D3492"];
const ck = (r) => JSON.stringify([r.rootId, r.targetId, r.candidateUci]);
const pk = (r) => JSON.stringify([r.rootId, r.candidateUci]);
const nk = (pathId, targetId, arm) => JSON.stringify([pathId, targetId, arm]);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function require(v, m) { if (!v) throw new Error(m); }
function index(rows, key, label) {
  const value = new Map(rows.map((r) => [key(r), r]));
  require(value.size === rows.length, `Duplicate ${label}`); return value;
}
export function loadEvaluationInputs() {
  const raw = names.map((name) => readFileSync(`${directory}/${name}`));
  return { values: raw.map((bytes, i) => JSON.parse(names[i].endsWith(".gz") ? gunzipSync(bytes) : bytes)),
    digests: Object.fromEntries(names.map((name, i) => [name, sha(raw[i])])),
    oracleSourceDigest: sha(readFileSync("tools/d3262-search-calibration/coherent-bounded-targets.ts")) };
}
export function compileRecursiveEvaluation({ values, digests, oracleSourceDigest }) {
  const [comparison, rootsFrame, bounded, frozen, frontier, contrast, previousProof] = values;
  require(values.every((v) => v.manifest === comparison.manifest) && comparison.comparisons.length === 182
    && comparison.definitions.length === 64 && rootsFrame.roots.length === 66 && bounded.rows.length === 182
    && frozen.rows.length === 182 && frontier.rows.length === 182 && frontier.candidateCoverage.length === 193
    && equal(frozen.arms, arms) && equal(frontier.arms, arms) && contrast.rows.length === 116
    && contrast.unpairedTargets.length === 17 && comparison.controls.length === 4
    && previousProof.profile === "d3262-coherent-actual-proof-v1" && previousProof.candidateGraph.length === 193,
    "Crossed recursive evaluation population");
  require(previousProof.quantifier === "exists_opponent_preparation_forall_legal_learner_defences_exists_named_target_available_at_ply4"
    && equal(previousProof.bounds, { preparationPly: 2, defencePly: 3, targetActionPly: 4 }), "Changed recursive quantifier scope");
  require(frontier.profile === "d3262-coherent-recursive-fourth-ply-v1" && frontier.providerOff === false
    && frontier.authority === "disposable_actual_recursive_geometry_selected_paths_not_profit_proof_or_complete_arm5"
    && frontier.frozenFrameDigest === digests[names[3]] && frontier.inputDigests[names[3]] === digests[names[3]]
    && frontier.finalPlyNodes.every((n) => n.status !== "source_off")
    && frontier.supplementJobs.length === 0 && equal(frontier.rows, frozen.rows) && equal(frontier.paths, frozen.paths),
    "Changed actual recursive source ceiling/selection");
  require(comparison.rootFrameDigest === digests[names[1]] && bounded.inputDigests[names[0]] === digests[names[0]]
    && bounded.inputDigests[names[1]] === digests[names[1]] && previousProof.inputDigests[names[1]] === digests[names[1]]
    && previousProof.inputDigests[names[2]] === digests[names[2]]
    && [names[0], names[1]].every((name) => frozen.inputDigests[name] === digests[name])
    && [names[0], names[1], names[2]].every((name) => contrast.inputDigests[name] === digests[name])
    && /^sha256:[0-9a-f]{64}$/u.test(oracleSourceDigest), "Crossed recursive baseline/input digest");
  const roots = index(rootsFrame.roots, (r) => r.rootId, "root"), definitions = index(comparison.definitions, (r) => r.id, "target");
  const baseline = index(bounded.rows, ck, "baseline"), sourceCells = index(frontier.rows, ck, "recursive cell");
  const paths = index(frontier.paths, (p) => p.id, "recursive predecessor");
  const finalNodes = index(frontier.finalPlyNodes, (n) => nk(n.pathId, n.targetId, n.arm), "recursive final node");
  const graph = previousProof.candidateGraph, graphs = index(graph, pk, "exact candidate graph"), observations = new Map();
  const observe = (root, definition, pathId, history, fen, reason) => {
    require(pathId === sha(JSON.stringify([root.rootId, ...history])), "Crossed actual ordered history");
    const id = sha(JSON.stringify([definition.id, root.rootId, ...history]));
    if (!observations.has(id)) {
      const observation = observeTargetPath(root.fen, history, definition), last = observation.snapshots.at(-1);
      require(last.fen === fen && last.terminalReason === reason, "Crossed actual target board/terminal");
      observations.set(id, { id, pathId, rootId: root.rootId, targetId: definition.id, observation });
    }
    return id;
  };
  const proofs = [];
  const rows = comparison.comparisons.map((pair) => {
    const root = roots.get(pair.rootId), definition = definitions.get(pair.targetId), exact = baseline.get(ck(pair));
    const source = sourceCells.get(ck(pair)), g = graphs.get(pk(pair));
    require(root && definition?.rootId === root.rootId && source && g?.rootFen === root.fen
      && exact?.kind === "result" && exact.family === definition.family && exact.sourceObserved === pair.sourceObserved
      && source.phase === root.phase && source.sourceObserved === pair.sourceObserved
      && equal(source.arms.map((a) => a.arm), arms), "Crossed recursive target/candidate context");
    const immediate = observeTargetPath(root.fen, [pair.candidateUci], definition).immediate;
    require(immediate === exact.immediate, "Changed historical immediate predicate");
    const context = { ...pair, family: definition.family, phase: root.phase, immediate,
      exactBaseline: { reintroducedWithin3Ply: exact.reintroducedWithin3Ply,
        preparationSurvivesEveryDefence: exact.preparationSurvivesEveryDefence } };
    const proofArms = [];
    const armRows = source.arms.map((selected) => {
      require(selected.proofCeiling === "recursive_geometric_scheduling_actual_partial_provider_paths_not_profit_or_proof",
        "Changed recursive arm proof ceiling");
      const chosen = selected.replies.flatMap((reply) => reply.selected.map((entry) => {
        const path = paths.get(entry.pathId), node = finalNodes.get(nk(entry.pathId, definition.id, selected.arm));
        require(path && node && path.rootId === root.rootId && path.rootFen === root.fen
          && equal(path.historyUci, [pair.candidateUci, reply.replyUci, entry.learnerUci]), "Crossed selected predecessor identity");
        const observationId = observe(root, definition, path.id, path.historyUci, path.fen, path.terminalReason);
        const o = observations.get(observationId).observation;
        require(o.immediate === immediate && (!o.reintroducedAtThirdPly || exact.reintroducedWithin3Ply), "Observed reach exceeds exact bound");
        const leaves = node.selected.map((leaf) => ({ leafId: leaf.leafId, observationId: observe(root, definition,
          leaf.leafId, [...path.historyUci, leaf.moveUci], leaf.fen, leaf.terminalReason) }));
        return { pathId: path.id, observationId, leaves };
      }));
      const summary = summarizeUnweightedTargetPaths(chosen, observations);
      const visited = chosen.map((p) => {
        const path = paths.get(p.pathId), o = observations.get(p.observationId).observation;
        return { pathId: p.pathId, preparationUci: path.historyUci[1], learnerUci: path.historyUci[2],
          opportunity: o.opportunityAtThirdPly, executedLeaves: p.leaves.filter((l) => observations.get(l.observationId).observation.executedAtFourthPly).map((l) => l.leafId) };
      });
      require(equal(selected.replies.map((r) => r.replyUci), selected.selectedReplyUcis), "Changed selected preparation set");
      const preparations = selected.selectedReplyUcis.map((uci) => {
        const prep = g.preparations.find((p) => p.preparationUci === uci); require(prep, "Illegal selected preparation");
        const observed = visited.filter((p) => p.preparationUci === uci);
        return { preparationUci: uci, observed, ...projectPreparation(prep.legalDefences, prep.terminalReason, observed) };
      });
      const proof = projectRoot(immediate, g.terminalReason === null ? g.preparations.map((p) => p.preparationUci) : [], preparations);
      if (proof.availability === "exists_preparation_surviving_all_defences") require(exact.preparationSurvivesEveryDefence, "Universal exceeds exact baseline");
      if (proof.availability === "every_preparation_refuted_at_bound") require(!exact.preparationSurvivesEveryDefence, "Refutation contradicts exact baseline");
      proofArms.push({ arm: selected.arm, sourceProofCeiling: summary.proofCeiling,
        productionDisposition: "research_quantifier_receipt_not_production_authority", ...proof, preparations });
      const selectedNodes = chosen.map((p) => finalNodes.get(nk(p.pathId, definition.id, selected.arm)));
      return { arm: selected.arm, ...summary, paths: chosen, omissions: {
        firstReplies: selected.omittedFirstReplies,
        learnerEdgesWithinSelectedReplies: selected.replies.reduce((n, r) => n + r.omittedLegal, 0),
        fourthRepliesWithinSelectedNonterminalPaths: selectedNodes.reduce((n, node) => n + node.omittedLegal, 0) },
      absorbingThirdPlyPaths: selectedNodes.filter((node) => node.status === "absorbing_terminal").map((node) => node.pathId) };
    });
    proofs.push({ ...context, arms: proofArms });
    return { ...context, arms: armRows };
  });
  const byCell = index(rows, ck, "observed target cell"), observedArms = new Map(rows.map((r) => [ck(r), new Map(r.arms.map((a) =>
    // This helper's engine case is the shared unweighted provider ceiling;
    // the emitted profile stays explicitly recursive_relation_reserve.
    [a.arm, projectObservedArm(r, a, "engine")]))]));
  const contrasts = contrast.rows.map((pair) => {
    const sourceKey = ck({ ...pair, candidateUci: pair.sourceCandidateUci }), alternativeKey = ck({ ...pair, candidateUci: pair.alternativeCandidateUci });
    const source = byCell.get(sourceKey), alternative = byCell.get(alternativeKey);
    require(source?.sourceObserved === true && alternative?.sourceObserved === false && source.phase === alternative.phase
      && [source, alternative].every((cell) => cell.family === pair.family)
      && ["source", "alternative"].every((side) => {
        const cell = side === "source" ? source : alternative;
        return cell.immediate === pair[side].immediate && equal(cell.exactBaseline, {
          reintroducedWithin3Ply: pair[side].reintroducedWithin3Ply,
          preparationSurvivesEveryDefence: pair[side].preparationSurvivesEveryDefence });
      }), "Crossed recursive same-target pair");
    const exact = direction(pair.source.immediate === "preserved" || pair.source.reintroducedWithin3Ply,
      pair.alternative.immediate === "preserved" || pair.alternative.reintroducedWithin3Ply);
    require(exact === pair.reachWithinBound, "Changed frozen contrast direction");
    return { rootId: pair.rootId, targetId: pair.targetId, family: pair.family, phase: source.phase,
      sourceCandidateUci: pair.sourceCandidateUci, alternativeCandidateUci: pair.alternativeCandidateUci,
      boundedScope: pair.boundedScope, exact, rootRanks: pair.rootRanks,
      arms: arms.map((arm) => ({ arm, ...compareObservedArms(observedArms.get(sourceKey).get(arm), observedArms.get(alternativeKey).get(arm), exact) })) };
  });
  const observationRows = [...observations.values()];
  const profile = compactObservationReferences([{ kind: "recursive_relation_reserve", arms, rows,
    candidateCoverage: frontier.candidateCoverage, controls: comparison.controls }], observationRows)[0];
  return { version: 1, profile: "d3262-coherent-recursive-evaluation-v1", manifest: comparison.manifest,
    authority: "disposable_actual_recursive_paths_shared_local_predicate_exact_decision_sets_not_engine_cause_or_production_proof",
    oracleSourceDigest, oracleLimitations, inputDigests: digests, controls: comparison.controls,
    referenceEncoding: "zero_based_global_observation_indices_with_literal_named_path_identity",
    target: profile, observations: observationRows, candidateGraph: graph,
    proof: { quantifier: previousProof.quantifier, bounds: previousProof.bounds, arms, rows: proofs },
    contrast: { arms, rows: contrasts, unpairedTargets: contrast.unpairedTargets } };
}
export function summarizeEvaluation(out) {
  return { observations: out.observations.length, candidates: out.target.candidateCoverage.length,
    arms: Object.fromEntries(arms.map((arm) => {
      const targets = out.target.rows.map((r) => r.arms.find((a) => a.arm === arm));
      const proofs = out.proof.rows.filter((r) => r.immediate === "removed").map((r) => r.arms.find((a) => a.arm === arm));
      const contrasts = out.contrast.rows.map((r) => ({ exact: r.exact, observed: r.arms.find((a) => a.arm === arm) }));
      return [arm, { cells: targets.length, reintroduced: targets.filter((a) => a.reintroducedPaths.length).length,
        executedReintroduced: targets.filter((a) => a.executedReintroducedLeaves.length).length,
        refutedRoots: proofs.filter((a) => a.availability === "every_preparation_refuted_at_bound").length,
        survivingRoots: proofs.filter((a) => a.availability === "exists_preparation_surviving_all_defences").length,
        unknownRoots: proofs.filter((a) => a.availability === "unknown_partial_quantifiers").length,
        apparentDirections: contrasts.filter((r) => r.observed.observedOpportunity !== "same").length,
        apparentOnExactSame: contrasts.filter((r) => r.observed.apparentOnExactSame).length,
        certifiedDirections: contrasts.filter((r) => r.observed.certifiedOpportunity !== null && r.observed.certifiedOpportunity !== "same").length }];
    })) };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const out = compileRecursiveEvaluation(loadEvaluationInputs()), plain = Buffer.from(`${JSON.stringify(out)}\n`), compressed = gzipSync(plain, { level: 9 });
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, compressed, { flag: "wx" });
  else require(readFileSync(`${directory}/${outputName}`).equals(compressed), "Recursive evaluation differs from sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(compressed), logicalDigest: sha(plain), bytes: compressed.length,
    summary: summarizeEvaluation(out) }, null, 2)}\n`);
}
