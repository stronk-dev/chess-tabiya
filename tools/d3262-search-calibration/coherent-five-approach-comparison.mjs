// Disposable D3262/D3493 common four-ply experiment, NOT a production selector.
// Join immutable, previously audited actual frontiers. Never borrow an unvisited
// exact continuation to strengthen a provider observation.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { makeUci, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { observeTargetPathV2, convention, terminal } from "./dist/target-opportunity-v2.mjs";
import { projectPreparation, projectRoot } from "./coherent-actual-proof.mjs";
import { direction } from "./coherent-actual-contrast.mjs";
import { directory, sha } from "./third-ply-source-check.mjs";

export const sources = {
  "d3262-coherent-root-frame.json": "dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
  "d3262-coherent-target-comparison-frame.json": "229335224b1c175478537554ec52ee7341b983e7358222fe1c7d67c2af16cc6b",
  "d3262-target-opportunity-v2-audit.json.gz": "95295ad43ef1e41ade4eb4405aaf9302490bf5533837b74148ecba5e065bd144",
  "d3262-coherent-exact-trigger-outcome.json": "d037609aaa2d9550ef8ff73b515946be1cb4a58e076f66c6c70325ef84d9a31c",
  "d3262-stockfish-root-coherent-all.json": "790049cff06992eae6c48f7057d0b794c4388e503f2d76a59dfe64ce8dbe7c49",
  "d3262-coherent-actual-proof.json.gz": "103f77ec585cc76fe27990567de2d334a3b98ccd42584087e370d1f317c4fdde",
  "d3262-coherent-engine-target-outcome.json.gz": "b156a18f683eb832a6d2a2dfa61751d82dfba1b4235ef1520c0bfd0d4939c8ef",
  "d3262-coherent-maia-target-outcome.json": "0e414803680b73661ecbe5246c35cd858703490d6e4d05d5d73efb6c892e2646",
  "d3262-coherent-recursive-evaluation.json.gz": "c692b1c16efce9491d560f9d6b7453200b925d1bf63810700c3e77d7f5fcd55a",
  "d3262-coherent-bounded-contrast.json": "1bbb39159e50cf203c7bcbea91a667da69cc27465d0c09be9d57d8ed87968e27",
  "d3262-fork-control-identity.json": "687c6fef6b77aebf55dcaf630945e510abb4020244be96ddb6cb2ee6977e44f9",
  "d3262-bishop-pressure-control.json": "09b6e8ea4e225c01b857f5ddef9ac249d65a9203c66f2dd41a07d7a5016a4a64",
};
export const outputName = "d3262-coherent-five-approach-comparison.json.gz";
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ck = (v, m) => { if (!v) throw new Error(m); };
const key = (r) => JSON.stringify([r.rootId, r.targetId, r.candidateUci]);
const candidateKey = (r) => JSON.stringify([r.rootId, r.candidateUci]);
const index = (rows, identity) => {
  const result = new Map(rows.map((r) => [identity(r), r]));
  ck(result.size === rows.length, "Duplicate common identity"); return result;
};
export function loadInputs() {
  const values = {}, digests = {}, logicalDigests = {};
  for (const [name, pinned] of Object.entries(sources)) {
    const raw = readFileSync(`${directory}/${name}`);
    ck(sha(raw) === `sha256:${pinned}`, `Changed immutable comparison source: ${name}`);
    values[name] = JSON.parse(name.endsWith(".gz") ? gunzipSync(raw) : raw);
    digests[name] = sha(raw); logicalDigests[name] = sha(JSON.stringify(values[name]));
  }
  return { values, digests, logicalDigests };
}

// Withhold a PV universal even if its visited line happens to cover a forced
// decision set. Raw diagnostics and source-licensed authority are separate.
export function licensedAvailability(raw, family) {
  return family === "provider_line" && ["exists_preparation_surviving_all_defences", "every_preparation_refuted_at_bound"].includes(raw)
    ? "withheld_provider_line_ceiling" : raw;
}
export function reachKnowledge(immediate, preparations, omittedPreparations, family) {
  if (immediate === "preserved") return true;
  if (preparations.some((p) => p.observed.some((o) => o.opportunity))) return true;
  if (family === "provider_line") return null;
  // Absence requires every eligible defence in every legal preparation; a
  // single refutation of EACH preparation only refutes a universal strategy.
  const complete = omittedPreparations.length === 0 && preparations.every((p) =>
    p.availability === "ineligible_terminal" || p.unvisitedDefences.length === 0);
  return complete ? false : null;
}
export function compareKnowledge(source, alternative) {
  return source === null || alternative === null ? null : direction(source, alternative);
}
export function legalPv(fen, candidate, pv) {
  ck(Array.isArray(pv) && pv[0] === candidate, "Missing candidate PV root");
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap(), history = [];
  for (const uci of pv.slice(0, 4)) {
    if (terminal(board) !== null) break;
    const parsed = parseUci(uci); ck(parsed !== undefined, "Untyped PV move");
    const move = normalizeMove(board, parsed); ck(board.isLegal(move), "Illegal provider PV move");
    // External history uses king destination for castling; chessops normalizes
    // internally to the rook square. Retain raw source PV separately.
    let external = makeUci(move);
    if ("from" in move && board.board.get(move.from)?.role === "king" && board.board.get(move.to)?.role === "rook"
      && board.board.get(move.to)?.color === board.turn)
      external = makeUci({ from: move.from, to: (move.from & ~7) + (move.to > move.from ? 6 : 2) });
    history.push(external); board.play(move);
  }
  return history;
}

function receipt(immediate, graph, selected, family, observations, extra = {}) {
  const raw = projectRoot(immediate, graph.terminalReason === null ? graph.preparations.map((p) => p.preparationUci) : [], selected);
  const known = reachKnowledge(immediate, selected, raw.omittedPreparations, family);
  return { family, ...extra, rawQuantifier: raw, licensedAvailability: licensedAvailability(raw.availability, family),
    reachKnowledge: known, observedReach: immediate === "preserved" || observations.some((o) => o.opportunity),
    observedExecution: observations.some((o) => o.executedLeaves.length > 0),
    preparations: selected, authority: family === "provider_line" ? "provider_line_only"
      : family === "bounded_oracle_diagnostic" ? "complete_four_ply_local_convention_only"
        : "actual_visited_paths_and_exact_decision_sets_only",
    moveReason: "not_an_engine_reason", productionProfileSelected: false };
}

export function compileComparison(inputs) {
  for (const [name, pinned] of Object.entries(sources)) ck(inputs.digests[name] === `sha256:${pinned}`
    && sha(JSON.stringify(inputs.values[name])) === inputs.logicalDigests[name], "Mutated common source/value");
  const v = inputs.values, root = v[Object.keys(sources)[0]], frame = v[Object.keys(sources)[1]], audit = v[Object.keys(sources)[2]];
  const forcing = v[Object.keys(sources)[3]], provider = v[Object.keys(sources)[4]], proof = v[Object.keys(sources)[5]];
  const engine = v[Object.keys(sources)[6]], model = v[Object.keys(sources)[7]], recursive = v[Object.keys(sources)[8]], pairs = v[Object.keys(sources)[9]];
  ck(root.roots.length === 66 && frame.comparisons.length === 182 && frame.definitions.length === 64
    && audit.convention === convention && audit.baseline.length === 182 && proof.candidateGraph.length === 193
    && pairs.rows.length === 116 && pairs.unpairedTargets.length === 17 && frame.controls.length === 4
    && Object.values(audit.scopes).every((s) => s.changedAvailability === 0 && s.changedOutcomes === 0), "Changed common population/convention");
  const roots = index(root.roots, (r) => r.rootId), defs = index(frame.definitions, (r) => r.id);
  const graphs = index(proof.candidateGraph, candidateKey), baseline = index(audit.baseline, key), triggers = index(forcing.rows, key);
  const providerRoots = index(provider.rows, (r) => r.rootId);
  const proofProfiles = [...proof.profiles, { kind: "recursive", arms: recursive.target.arms, rows: recursive.proof.rows }];
  const targetProfiles = [...engine.profiles, { kind: "model", arms: model.modelArms, rows: model.rows },
    { kind: "recursive", arms: recursive.target.arms, rows: recursive.target.rows }];
  const proofIndexes = new Map(proofProfiles.map((p) => [p.kind, index(p.rows, key)]));
  const targetIndexes = new Map(targetProfiles.map((p) => [p.kind, index(p.rows, key)]));
  const settings = [
    ...["depth8", "depth12", "movetime100"].map((budget) => ({ id: `pv:${budget}`, family: "provider_line", budget, diagnostic: false })),
    ...["square_control", "enemy_piece"].map((trigger) => ({ id: `forcing:${trigger}`, family: "exact_reply_forcing", trigger, diagnostic: false })),
    ...proofProfiles.flatMap((p) => p.arms.map((id) => ({ id, family: p.kind === "engine" ? "engine_beam"
      : p.kind === "model" ? "configured_model" : p.kind === "recursive" ? "recursive_semantic" : "first_reply_reserve_diagnostic",
    kind: p.kind, diagnostic: p.kind === "semantic_first_reply_reserve" }))),
    { id: "complete:four-ply", family: "bounded_oracle_diagnostic", diagnostic: true },
  ];
  ck(settings.length === 53 && new Set(settings.map((s) => s.id)).size === 53, "Changed five approach settings");
  const rows = frame.comparisons.map((cell) => {
    const r = roots.get(cell.rootId), d = defs.get(cell.targetId), exact = baseline.get(key(cell)), g = graphs.get(candidateKey(cell));
    ck(r && d?.rootId === r.rootId && exact && g?.rootFen === r.fen, "Crossed common target/root");
    const actor = d.family === "material" ? d.target.attacker.color : d.target.minor.color;
    const rootMover = parseFen(r.fen).unwrap().turn;
    ck(actor !== rootMover, "Target actor must be opponent of root mover");
    const immediate = exact.next.immediate;
    const arms = settings.map((setting) => {
      const observations = []; let selected = [], extra = {};
      if (setting.family === "provider_line") {
        const entry = providerRoots.get(r.rootId)?.probes.find((p) => p.budget === setting.budget)?.entries.find((e) => e.moveUci === cell.candidateUci);
        ck(entry, "Missing frozen provider root candidate");
        const history = legalPv(r.fen, cell.candidateUci, entry.pv), observation = observeTargetPathV2(r.fen, history, d);
        ck(observation.immediate === immediate, "Crossed PV immediate target");
        if (history.length >= 2) {
          const prep = g.preparations.find((p) => p.preparationUci === history[1]); ck(prep, "PV preparation outside legal graph");
          if (history.length >= 3) observations.push({ pathId: sha(JSON.stringify([r.rootId, ...history.slice(0, 3)])),
            preparationUci: history[1], learnerUci: history[2], opportunity: observation.opportunityAtThirdPly,
            executedLeaves: observation.executedAtFourthPly ? [sha(JSON.stringify([r.rootId, ...history]))] : [] });
          selected = [{ preparationUci: history[1], observed: observations,
            ...projectPreparation(prep.legalDefences, prep.terminalReason, observations) }];
        }
        extra = { history, rawProviderPv: entry.pv, rawScore: entry.score, depth: entry.depth, rank: entry.rank,
          observation, weightAuthority: "unweighted_provider_line_not_policy_mass_or_human_frequency" };
      } else if (["exact_reply_forcing", "bounded_oracle_diagnostic"].includes(setting.family)) {
        const triggerSet = setting.trigger ? triggers.get(key(cell)).variants[setting.trigger].triggerUcis : null;
        selected = exact.preparations.map((prep) => {
          const legal = g.preparations.find((p) => p.preparationUci === prep.preparationUci); ck(legal, "Crossed forcing preparation");
          const expanded = triggerSet === null || triggerSet.includes(prep.preparationUci);
          const visited = expanded ? prep.defences.map((defence) => ({ pathId: sha(JSON.stringify([r.rootId, cell.candidateUci, prep.preparationUci, defence.learnerUci])),
            preparationUci: prep.preparationUci, learnerUci: defence.learnerUci,
            opportunity: audit.nodes[defence.node].availableActions.length > 0, executedLeaves: [] })) : [];
          observations.push(...visited);
          return { preparationUci: prep.preparationUci, observed: visited,
            ...projectPreparation(legal.legalDefences, legal.terminalReason, visited) };
        });
        extra = { triggerInterpretation: setting.trigger ?? null, executionAuthority: "availability_witnesses_not_played_fourth_moves",
          weightAuthority: "unweighted_legal_enumeration_not_policy_mass_or_human_frequency" };
      } else {
        const raw = proofIndexes.get(setting.kind).get(key(cell)).arms.find((a) => a.arm === setting.id);
        const target = targetIndexes.get(setting.kind).get(key(cell)).arms.find((a) => a.arm === setting.id);
        ck(raw && target && equal(raw.omittedPreparations, g.preparations.filter((p) =>
          !raw.preparations.some((s) => s.preparationUci === p.preparationUci)).map((p) => p.preparationUci)), "Crossed actual arm omissions");
        selected = raw.preparations;
        observations.push(...selected.flatMap((p) => p.observed));
        extra = { priorSourceProofCeiling: raw.sourceProofCeiling, weightAuthority: target.weightAuthority ?? "literal_configured_model_mass_not_human_frequency",
          selectedPredecessorPaths: target.selectedPredecessorPaths, selectedFourthPlyLeaves: target.selectedFourthPlyLeaves };
        if (setting.kind === "model") extra.modelMass = Object.fromEntries(["opportunityMass", "reintroducedOpportunityMass", "executionMass",
          "reintroducedExecutionMass", "coveredPredecessorMass", "coveredFourthPlyMass", "residualMass"].map((f) => [f, target[f]]));
        else extra.frontierOmissions = target.omissions;
      }
      const result = receipt(immediate, g, selected, setting.family, observations, extra);
      ck(!result.observedReach || immediate === "preserved" || exact.next.reintroducedWithin3Ply, "Visited reach contradicts v2 baseline");
      ck(result.rawQuantifier.availability !== "exists_preparation_surviving_all_defences" || exact.next.preparationSurvivesEveryDefence, "Visited universal exceeds v2 baseline");
      return { setting: setting.id, ...result };
    });
    return { ...cell, family: d.family, phase: r.phase, focus: r.focus, targetActor: actor, rootMover,
      immediate, exactBaseline: exact.next, arms };
  });
  const cells = index(rows, key);
  const contrasts = pairs.rows.map((pair) => {
    const source = cells.get(key({ ...pair, candidateUci: pair.sourceCandidateUci }));
    const alternative = cells.get(key({ ...pair, candidateUci: pair.alternativeCandidateUci }));
    ck(source?.sourceObserved === true && alternative?.sourceObserved === false, "Crossed contrast polarity");
    return { rootId: pair.rootId, targetId: pair.targetId, sourceCandidateUci: pair.sourceCandidateUci,
      alternativeCandidateUci: pair.alternativeCandidateUci, family: pair.family, phase: source.phase,
      focus: source.focus, rootRanks: pair.rootRanks, exactReach: pair.reachWithinBound,
      arms: settings.map((s, i) => ({ setting: s.id,
        observedReach: direction(source.arms[i].observedReach, alternative.arms[i].observedReach),
        observedExecution: direction(source.arms[i].observedExecution, alternative.arms[i].observedExecution),
        certifiedReach: compareKnowledge(source.arms[i].reachKnowledge, alternative.arms[i].reachKnowledge),
        certifiedExecution: null, absenceOfExecution: "not_certified", moveReason: "not_an_engine_reason" })) };
  });
  const candidateCoverage = root.roots.flatMap((r) => r.candidates.map((c) => ({ rootId: r.rootId, candidateUci: c.moveUci,
    phase: r.phase, focus: r.focus, origins: c.origins,
    namedCells: rows.filter((row) => row.rootId === r.rootId && row.candidateUci === c.moveUci).length,
    evaluationScope: "named_target_cells_not_all_chess_consequences", settings: settings.map((s) => s.id) })));
  ck(candidateCoverage.length === 193, "Lost no-target candidate population");
  return { version: 1, profile: "d3262-coherent-five-approach-comparison-v1", convention, manifest: root.manifest,
    inputDigests: inputs.digests, authority: "disposable_common_four_ply_join_not_production_profile_or_engine_causality",
    historicalOriginalPopulation: "original_196_preserved_separately_never_pooled", bounds: { plies: 4, horizon2: "not_yet_common_compared" },
    productionProfileSelected: false, endToEndCost: "not_measured_by_this_compiler",
    settings, controls: frame.controls,
    controlEvidence: { fork: v[Object.keys(sources)[10]], bishop: v[Object.keys(sources)[11]],
      scope: "declared_identity_geometry_only_not_forced_reply_or_autonomous_quiet_plan" },
    candidateCoverage, rows, contrasts, unpairedTargets: pairs.unpairedTargets };
}

export function summarize(output) {
  return output.settings.map((s, i) => {
    const rows = output.rows.map((r) => r.arms[i]), removed = output.rows.filter((r) => r.immediate === "removed");
    const counts = (field) => Object.fromEntries([...new Set(rows.map((r) => r[field]))].sort().map((x) => [String(x), rows.filter((r) => r[field] === x).length]));
    return { setting: s.id, family: s.family, diagnostic: s.diagnostic, cells: rows.length,
      removedReintroductionsObserved: removed.filter((r) => r.arms[i].observedReach).length,
      removedExecutionsObserved: removed.filter((r) => r.arms[i].observedExecution).length,
      licensedAvailability: counts("licensedAvailability"), reachKnowledge: counts("reachKnowledge"),
      directionalCertifiedPairs: output.contrasts.filter((p) => p.arms[i].certifiedReach !== null && p.arms[i].certifiedReach !== "same").length,
      omittedPreparations: rows.reduce((n, r) => n + r.rawQuantifier.omittedPreparations.length, 0),
      visitedDefences: rows.reduce((n, r) => n + r.preparations.reduce((m, p) => m + p.observed.length, 0), 0) };
  });
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const result = compileComparison(loadInputs()), plain = Buffer.from(`${JSON.stringify(result)}\n`), zipped = gzipSync(plain, { level: 9 });
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, zipped, { flag: "wx" });
  else ck(readFileSync(`${directory}/${outputName}`).equals(zipped), "Common comparison differs from sources");
  const representative = new Set(["pv:depth12", "forcing:square_control", "forcing:enemy_piece", "engine:depth12:top8",
    "maia:prefix0.90", "recursive:depth12:top8:top8", "complete:four-ply"]);
  process.stdout.write(`${JSON.stringify({ digest: sha(zipped), bytes: zipped.length,
    cells: result.rows.length, settings: result.settings.length, pairs: result.contrasts.length,
    representativeSummary: summarize(result).filter((s) => representative.has(s.setting)) })}\n`);
}
