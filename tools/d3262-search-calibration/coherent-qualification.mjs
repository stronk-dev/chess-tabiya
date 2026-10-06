// Disposable D3495/D3262 qualification audit. Not a production selector,
// significance ranking, move grade, chess lesson, or end-to-end cost result.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { manifestRows, manifestIdentity } from "./manifest.mjs";
import { evaluateIdentityControl, controls as forkDeclarations } from "./fork-control-identity.mjs";
import { evaluateBishopPressure, bishopPressureDeclaration } from "./bishop-pressure-control.mjs";
import { directory, sha } from "./third-ply-source-check.mjs";

export const sources = {
  "d3262-coherent-root-frame.json": "dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
  "d3262-coherent-five-approach-comparison.json.gz": "c6660605e24c13b631f39f2003f1219406baadb02b03614eac9260c6a81c15bf",
  "d3262-coherent-horizon-policy.json.gz": "172bfccf3a8c84e12a985d27529bec4131a2e3e56b366bb410097f80e442ec8a",
  "d3262-coherent-first-reply-frontier.json": "1cb357c145d5b8c8ba15cd8b6bd752afb0e70d7b7e3758a0da4ebee022ff7438",
  "d3262-stockfish-root-coherent-all.json": "790049cff06992eae6c48f7057d0b794c4388e503f2d76a59dfe64ce8dbe7c49",
  "d3262-coherent-exact-replies.json": "3fcd3ef596886aee1e1427bc2502aaeef1baa39827c2e8d35b398e1fb478bb68",
  "d3262-fork-control-identity.json": "687c6fef6b77aebf55dcaf630945e510abb4020244be96ddb6cb2ee6977e44f9",
  "d3262-bishop-pressure-control.json": "09b6e8ea4e225c01b857f5ddef9ac249d65a9203c66f2dd41a07d7a5016a4a64",
};
export const outputName = "d3262-coherent-qualification.json";
const ck = (v, m) => { if (!v) throw new Error(m); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const id = (r) => JSON.stringify([r.rootId, r.candidateUci]);
const counts = (rows, field) => Object.fromEntries([...new Set(rows.map((r) => r[field] ?? "unknown"))].sort()
  .map((value) => [value, rows.filter((r) => (r[field] ?? "unknown") === value).length]));
const sign = (a, b) => a === b ? "tie" : a < b ? "source_precedes" : "alternative_precedes";
export function loadInputs() {
  const values = [], inputDigests = {}, logicalDigests = {}, retainedBytes = [];
  for (const [name, pinned] of Object.entries(sources)) {
    const raw = readFileSync(`${directory}/${name}`);
    ck(sha(raw) === `sha256:${pinned}`, `Changed qualification source ${name}`);
    const decoded = name.endsWith(".gz") ? gunzipSync(raw) : raw, value = JSON.parse(decoded);
    values.push(value); inputDigests[name] = sha(raw); logicalDigests[name] = sha(JSON.stringify(value));
    retainedBytes.push({ name, physical: raw.length, decoded: decoded.length,
      scope: "retained_research_input_not_production_request_or_peak_memory" });
  }
  return { values, inputDigests, logicalDigests, retainedBytes };
}

// Ordinal provider order and equal CP scores are different evidence. Never
// convert mate to a magic CP value, compare bounded scores, or blend budgets.
export function rankComparison(source, alternative) {
  ck(source?.status === "retained" && alternative?.status === "retained"
    && source.budget === alternative.budget && Number.isInteger(source.rank) && source.rank > 0
    && Number.isInteger(alternative.rank) && alternative.rank > 0, "Missing/crossed rank authority");
  const a = source.score, b = alternative.score;
  ck(a && b && [a, b].every((s) => ["cp", "mate"].includes(s.kind)
    && Number.isInteger(s.value) && typeof s.bound === "boolean")
    && [source, alternative].every((s) => Number.isInteger(s.depth) && s.depth >= 0), "Untyped provider score");
  return { budget: source.budget, sourceRank: source.rank, alternativeRank: alternative.rank,
    sourceScore: a, alternativeScore: b, sourceDepth: source.depth, alternativeDepth: alternative.depth,
    rankOrder: sign(source.rank, alternative.rank),
    cpOrder: a.kind === "cp" && b.kind === "cp" && a.bound === false && b.bound === false
      ? sign(-a.value, -b.value) : "not_comparable_as_cp",
    authority: "one_captured_provider_budget_not_merged_value_or_move_reason" };
}
export function selectedControlVerdict(replies, selected, providerLine = false) {
  const legal = new Map(replies.map((r) => [r.uci, r]));
  ck(legal.size === replies.length && replies.length > 0 && new Set(selected).size === selected.length
    && selected.every((uci) => legal.has(uci)), "Vacuous/illegal control frontier");
  const omitted = replies.filter((r) => !selected.includes(r.uci)).map((r) => r.uci);
  const refutations = selected.filter((uci) => !legal.get(uci).retainsAny);
  return { selected, omitted, refutations,
    verdict: refutations.length ? "named_geometric_relation_refuted_by_visited_reply"
      : !providerLine && omitted.length === 0 ? "named_geometric_relation_retained_all_exact_replies"
        : "unknown_unvisited_or_provider_line_ceiling",
    scope: "declared_piece_identity_and_geometry_not_winning_fork" };
}
function controlSelections(setting, root, candidate, graph, first, engine) {
  if (setting.family === "provider_line") {
    const e = engine.rows.find((r) => r.rootId === root.rootId).probes.find((p) => p.budget === setting.budget)
      .entries.find((e) => e.moveUci === candidate);
    ck(e && e.pv[0] === candidate, "Lost control PV candidate");
    return e.pv.length >= 2 ? [e.pv[1]] : [];
  }
  if (["exact_reply_forcing", "bounded_oracle_diagnostic"].includes(setting.family)) return graph.replies.map((r) => r.uci);
  if (["engine_beam", "configured_model"].includes(setting.family)) {
    const row = first.rows.find((r) => r.rootId === root.rootId && r.candidateUci === candidate);
    ck(row && row.legalReplyCount === graph.replyCount, "Lost control first-reply source");
    return row.replies.filter((r) => r.selectedBy.includes(setting.id)).map((r) => r.uci);
  }
  // The named-relation selector has no registered target at these controls.
  // Do not invent a fallback or borrow the plain engine's selected replies.
  return null;
}
export function compile(inputs) {
  const names = Object.keys(sources);
  inputs.values.forEach((v, i) => ck(inputs.inputDigests[names[i]] === `sha256:${sources[names[i]]}`
    && sha(JSON.stringify(v)) === inputs.logicalDigests[names[i]], "Mutated qualification input"));
  const [frame, common, horizon, first, engine, graph, fork, bishop] = inputs.values;
  ck(frame.manifest === manifestIdentity.manifestDigest && common.manifest === frame.manifest
    && horizon.manifest === frame.manifest && graph.manifest === frame.manifest
    && frame.roots.length === 66 && common.rows.length === 182 && common.settings.length === 53
    && common.candidateCoverage.length === 193 && horizon.rows.length === 182
    && horizon.contrasts.length === 116 && first.rows.length === 193, "Changed qualification population");
  const roots = new Map(frame.roots.map((r) => [r.rootId, r])), cells = new Map();
  for (const r of common.rows) {
    const root = roots.get(r.rootId);
    ck(root && r.phase === root.phase && r.focus === root.focus
      && r.targetActor !== r.rootMover && r.arms.length === 53, "Crossed phase/focus/perspective");
    cells.set(id(r), (cells.get(id(r)) ?? 0) + 1);
    for (const a of r.arms) ck(a.moveReason === "not_an_engine_reason" && a.productionProfileSelected === false
      && !(a.family === "provider_line" && ["exists_preparation_surviving_all_defences", "every_preparation_refuted_at_bound"].includes(a.licensedAvailability)),
    "Promoted provider/causal authority");
  }
  const population = frame.roots.flatMap((r) => r.candidates.map((c) => ({ rootId: r.rootId, candidateUci: c.moveUci,
    phase: r.phase, focus: r.focus, namedCells: cells.get(id({ rootId: r.rootId, candidateUci: c.moveUci })) ?? 0 })));
  ck(population.length === 193 && equal(population.map(id).sort(), common.candidateCoverage.map(id).sort()), "Lost candidates");
  const rootAgreement = frame.roots.map((root) => {
    const row = engine.rows.find((r) => r.rootId === root.rootId);
    for (const candidate of root.candidates) for (const reading of candidate.stockfish) {
      const entry = row.probes.find((p) => p.budget === reading.budget)?.entries.find((e) => e.moveUci === candidate.moveUci);
      ck(entry && reading.status === "retained" && entry.rank === reading.rank
        && entry.depth === reading.depth && equal(entry.score, reading.score), "Crossed copied root score/rank");
    }
    const bests = row.probes.map((p) => ({ budget: p.budget, uci: p.entries.find((e) => e.rank === 1).moveUci }));
    return { rootId: root.rootId, phase: root.phase, focus: root.focus, bests,
      sameBestAllBudgets: new Set(bests.map((b) => b.uci)).size === 1 };
  });
  const pairAgreement = common.contrasts.map((pair) => {
    const root = roots.get(pair.rootId);
    const a = root.candidates.find((c) => c.moveUci === pair.sourceCandidateUci);
    const b = root.candidates.find((c) => c.moveUci === pair.alternativeCandidateUci);
    ck(a && b, "Lost contrasted candidate");
    const readings = a.stockfish.map((s, i) => rankComparison(s, b.stockfish[i]));
    return { rootId: pair.rootId, targetId: pair.targetId, sourceCandidateUci: a.moveUci, alternativeCandidateUci: b.moveUci,
      phase: root.phase, focus: root.focus, readings,
      sameRankOrderAllBudgets: new Set(readings.map((r) => r.rankOrder)).size === 1,
      cpAgreement: readings.some((r) => r.cpOrder === "not_comparable_as_cp") ? "not_comparable_as_cp"
        : new Set(readings.map((r) => r.cpOrder)).size === 1 ? "same" : "different",
      moveReason: "not_an_engine_reason" };
  });
  const controlRows = common.controls.map((control) => {
    const root = roots.get(control.rootId), declaration = manifestRows.find((r) => r.id === control.rootId);
    const exactRoot = graph.roots.find((r) => r.rootId === root.rootId);
    const candidate = exactRoot.candidates.find((c) => c.candidateUci === declaration.candidateUci);
    ck(equal(control.selectedCandidates, root.candidates.map((c) => c.moveUci)) && root.focus === declaration.focus,
      "Control population/focus drift");
    const forkD = forkDeclarations.find((d) => d.rootId === root.rootId);
    const reference = forkD ? evaluateIdentityControl(forkD, exactRoot)
      : root.rootId.startsWith("pressure:") ? evaluateBishopPressure(bishopPressureDeclaration, exactRoot) : null;
    if (forkD) ck(equal(reference, fork.controls.find((c) => c.rootId === root.rootId)), "Changed fork reference");
    if (root.rootId.startsWith("pressure:")) ck(equal(reference, bishop.result), "Changed bishop reference");
    return { rootId: root.rootId, candidateUci: declaration.candidateUci, phase: root.phase, focus: root.focus,
      candidatesOffered: root.candidates.length, reference, authoredRouteSource: root.rootId.startsWith("quiet-plan:") ? declaration.source : null,
      arms: common.settings.map((setting) => {
        const selected = controlSelections(setting, root, declaration.candidateUci, candidate, first, engine);
        if (reference === null) return { setting: setting.id, selectedReplies: selected,
          verdict: "no_autonomous_quiet_plan_claim", authoredRouteIsNotDetectedPlan: true };
        if (selected === null) return { setting: setting.id, selectedReplies: null,
          verdict: "no_registered_target_for_this_named_relation_selector" };
        ck(selected.every((uci) => candidate.replies.some((r) => r.uci === uci)), "Illegal control PV/reply");
        return forkD ? { setting: setting.id, ...selectedControlVerdict(reference.replies, selected, setting.family === "provider_line") }
          : { setting: setting.id, selectedReplies: selected,
            retainedPressureWitnessVisited: selected.includes(reference.selectedReplyUci),
            omittedReplies: candidate.replies.filter((r) => !selected.includes(r.uci)).map((r) => r.uci),
            verdict: selected.includes(reference.selectedReplyUci) ? "named_retreat_retains_geometric_pressure" : "declared_retreat_not_visited",
            retreatForced: false, directlyAttacksQueen: false, rootBenefit: "not_established" };
      }) };
  });
  const phaseMix = [...new Set(frame.roots.map((r) => r.phase))].sort().map((phase) => {
    const selected = common.rows.filter((r) => r.phase === phase), direct = horizon.rows.filter((r) => r.phase === phase);
    return { phase, roots: frame.roots.filter((r) => r.phase === phase).length,
      candidates: population.filter((r) => r.phase === phase).length, cells: selected.length,
      focus: counts(selected, "focus"), families: counts(selected, "family"),
      arms: common.settings.map((s, i) => ({ setting: s.id, diagnostic: s.diagnostic,
        availableNow: direct.filter((r) => r.arms[i].directOpportunity).length,
        selectedTwoPlyExecution: direct.filter((r) => r.arms[i].observedExecution).length,
        removedReintroductionsObserved: selected.filter((r) => r.immediate === "removed" && r.arms[i].observedReach).length,
        licensedAvailability: counts(selected.map((r) => r.arms[i]), "licensedAvailability"),
        reachKnowledge: counts(selected.map((r) => ({ reach: String(r.arms[i].reachKnowledge) })), "reach") })) };
  });
  return { version: 1, profile: "d3262-coherent-qualification-v1", manifest: frame.manifest,
    inputDigests: inputs.inputDigests, authority: "scope_and_source_agreement_not_consumer_usefulness_or_engine_causality",
    productionProfileSelected: false, original196: "preserved_separately_not_pooled", population,
    focus: { roots: counts(frame.roots, "focus"), candidates: counts(population, "focus"), namedCells: counts(common.rows, "focus"),
      inference: "missing_focus_is_unknown_not_material_equals_tactics_or_destination_equals_plan" },
    phaseMix, controls: controlRows, rootAgreement, pairAgreement, retainedBytes: inputs.retainedBytes,
    qualification: { scopedOperandEvidence: "checked_at_declared_bounds", signedRootBenefit: "not_established",
      engineCausality: "not_established", tacticalQuietGeneralization: "controls_only_no_labelled_main_population",
      consumerComprehensionAndUsefulness: "not_measured", coldWarmProviderOfflineEndToEndCost: "not_measured",
      completeProductionCandidate: false },
    nextAction: "measure_actual_end_to_end_cost_and_complete_declared_consumer_scope_before_profile_selection" };
}
if (process.argv[1]?.endsWith("coherent-qualification.mjs")) {
  const output = compile(loadInputs()), bytes = `${JSON.stringify(output, null, 2)}\n`;
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, bytes, { flag: "wx" });
  else ck(readFileSync(`${directory}/${outputName}`, "utf8") === bytes, "Qualification artifact drift");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), bytes: Buffer.byteLength(bytes), focus: output.focus,
    rootsSameBest: output.rootAgreement.filter((r) => r.sameBestAllBudgets).length,
    pairsSameRankOrder: output.pairAgreement.filter((r) => r.sameRankOrderAllBudgets).length,
    pairsCpAgreement: counts(output.pairAgreement, "cpAgreement"), qualification: output.qualification })}\n`);
}
