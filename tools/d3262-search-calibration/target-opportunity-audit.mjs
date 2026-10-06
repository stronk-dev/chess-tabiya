// Disposable D3492 all-stage audit and separately versioned bounded baseline.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { observeTargetPath } from "./dist/coherent-bounded-targets.mjs";
import { availableTargetActions, convention } from "./dist/target-opportunity-v2.mjs";
import { directory, sha } from "./third-ply-source-check.mjs";
import { legalMoves as legalEntries } from "./exact-reply-enumeration.mjs";

export const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
  "d3262-coherent-bounded-targets.json", "d3262-coherent-actual-proof.json.gz",
  "d3262-coherent-maia-target-outcome.json", "d3262-coherent-engine-target-outcome.json.gz",
  "d3262-coherent-recursive-evaluation.json.gz"];
export const outputName = "d3262-target-opportunity-v2-audit.json.gz";
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const key = (r) => JSON.stringify([r.rootId, r.targetId, r.candidateUci]);
const candidateKey = (r) => JSON.stringify([r.rootId, r.candidateUci]);
const ck = (v, m) => { if (!v) throw new Error(m); };
const stateKey = (s) => JSON.stringify([s.fen, s.tracked, s.terminalReason]);
export function actionSetChanged(prior, actions) {
  ck(prior === null || typeof prior === "string", "Untyped historical witness");
  return !equal(actions.map((a) => a.uci), prior === null ? [] : [prior]);
}
export function loadInputs() {
  const raw = names.map((n) => readFileSync(`${directory}/${n}`));
  return { values: raw.map((b, i) => JSON.parse(names[i].endsWith(".gz") ? gunzipSync(b) : b)),
    digests: Object.fromEntries(names.map((n, i) => [n, sha(raw[i])])),
    sourceDigests: Object.fromEntries(["coherent-bounded-targets.ts", "target-opportunity-v2.ts"].map((n) =>
      [n, sha(readFileSync(`tools/d3262-search-calibration/${n}`))])) };
}
export function validateInputs({ values, digests, sourceDigests }) {
  const [comparison, frame, oldBaseline, proof, model, engine, recursive] = values;
  ck(comparison.comparisons.length === 182 && comparison.definitions.length === 64 && comparison.controls.length === 4
    && frame.roots.length === 66 && proof.candidateGraph.length === 193 && oldBaseline.rows.length === 182
    && model.rows.length === 182 && engine.observations.length === 166835 && recursive.observations.length === 166137
    && values.every((v) => v.manifest === comparison.manifest), "Changed audit population");
  ck(oldBaseline.profile === "d3262-coherent-bounded-targets-v1"
    && proof.profile === "d3262-coherent-actual-proof-v1"
    && model.profile === "d3262-coherent-maia-target-outcome-v1"
    && engine.profile === "d3262-coherent-engine-target-outcome-v1"
    && recursive.profile === "d3262-coherent-recursive-evaluation-v1", "Crossed audit profiles");
  ck(comparison.rootFrameDigest === digests[names[1]]
    && oldBaseline.inputDigests[names[0]] === digests[names[0]]
    && oldBaseline.inputDigests[names[1]] === digests[names[1]]
    && [model, engine].every((s) => s.inputDigests[names[2]] === digests[names[2]])
    && recursive.inputDigests[names[3]] === digests[names[3]]
    && recursive.oracleSourceDigest === sourceDigests["coherent-bounded-targets.ts"], "Crossed audit source digests");
  const roots = new Map(frame.roots.map((r) => [r.rootId, r]));
  const defs = new Map(comparison.definitions.map((r) => [r.id, r]));
  const exact = new Map(oldBaseline.rows.map((r) => [key(r), r]));
  const graphs = new Map(proof.candidateGraph.map((r) => [candidateKey(r), r]));
  ck(exact.size === 182 && defs.size === 64 && graphs.size === 193, "Duplicate audit identities");
  ck(comparison.comparisons.every((c) => exact.has(key(c)) && defs.get(c.targetId)?.rootId === c.rootId)
    && model.rows.every((c) => exact.has(key(c))) && recursive.target.rows.every((c) => exact.has(key(c)))
    && model.controls.length === 4 && engine.controls.length === 4 && recursive.controls.length === 4,
  "Crossed audit cells/controls");
  const offered = frame.roots.flatMap((r) => r.candidates.map((c) => candidateKey({ rootId: r.rootId, candidateUci: c.moveUci })));
  ck(offered.length === 193 && offered.every((k) => graphs.has(k)), "Lost offered audit candidates");
  for (const g of proof.candidateGraph) {
    const root = roots.get(g.rootId); ck(root?.fen === g.rootFen, "Crossed graph root");
    const before = Chess.fromSetup(parseFen(g.rootFen).unwrap()).unwrap(), move = parseUci(g.candidateUci);
    ck(move !== undefined && before.isLegal(normalizeMove(before, move)), "Illegal graph candidate");
    before.play(normalizeMove(before, move));
    ck(makeFen(before.toSetup()) === g.afterFen
      && equal(legalEntries(before).map((e) => e.uci), g.preparations.map((p) => p.preparationUci)), "Incomplete graph preparations");
    for (const p of g.preparations) {
      const next = before.clone(), m = parseUci(p.preparationUci); ck(m !== undefined, "Bad graph preparation");
      next.play(normalizeMove(next, m));
      ck(makeFen(next.toSetup()) === p.fen && equal(legalEntries(next).map((e) => e.uci), p.legalDefences), "Incomplete graph defences");
    }
  }
  return { roots, defs, exact, graphs };
}
export function compileAudit(inputs, progress = () => {}) {
  const { values, digests, sourceDigests } = inputs;
  const [comparison, frame, oldBaseline, proof, model, engine, recursive] = values;
  const { roots, defs, exact, graphs } = validateInputs(inputs);
  const nodes = [], cache = new Map(), scopes = new Map(), affected = [];
  const collect = (s, scope, identity) => {
    ck(s && typeof s.fen === "string" && (s.terminalReason === null || typeof s.terminalReason === "string")
      && (s.tracked === null || ["material", "destination"].includes(s.tracked.kind)), "Untyped audit snapshot");
    const k = stateKey(s); let ordinal = cache.get(k);
    if (ordinal === undefined) {
      ordinal = nodes.length; cache.set(k, ordinal);
      nodes.push({ id: sha(k), fen: s.fen, tracked: s.tracked, terminalReason: s.terminalReason,
        availableActions: availableTargetActions(s) });
      if (nodes.length % 20000 === 0) progress({ nodes: nodes.length, scope });
    }
    const stats = scopes.get(scope) ?? { snapshotOccurrences: 0, stages: [0, 0, 0, 0], changedAvailability: 0, changedOutcomes: 0 };
    stats.snapshotOccurrences += 1; stats.stages[s.ply - 1] += 1; scopes.set(scope, stats);
    const actions = nodes[ordinal].availableActions;
    if (actionSetChanged(s.availableMoveUci, actions)) {
      stats.changedAvailability += 1;
      affected.push({ scope, identity, ply: s.ply, node: ordinal, prior: s.availableMoveUci, next: actions });
    }
    return ordinal;
  };
  const baseline = comparison.comparisons.map((cell) => {
    const root = roots.get(cell.rootId), definition = defs.get(cell.targetId), graph = graphs.get(candidateKey(cell));
    const old = exact.get(key(cell));
    ck(root && definition?.rootId === root.rootId && graph?.rootFen === root.fen && old?.kind === "result", "Crossed baseline cell");
    const snap = (history) => {
      const s = observeTargetPath(root.fen, history, definition).snapshots.at(-1);
      return collect(s, "complete_legal_baseline", [cell.targetId, cell.rootId, ...history]); };
    const first = snap([cell.candidateUci]), firstNode = nodes[first];
    ck(firstNode.fen === graph.afterFen && firstNode.terminalReason === graph.terminalReason, "Crossed exact candidate board");
    const immediate = firstNode.tracked === null ? observeTargetPath(root.fen, [cell.candidateUci], definition).immediate
      : firstNode.availableActions.length ? "preserved" : "removed";
    let any = false, universal = false;
    const preparations = [];
    if (graph.terminalReason === null) for (const prep of graph.preparations) {
      const prefix = [cell.candidateUci, prep.preparationUci], p = snap(prefix), node = nodes[p];
      ck(node.fen === prep.fen && node.terminalReason === prep.terminalReason, "Crossed exact preparation board");
      const defences = [];
      if (node.terminalReason === null) for (const defence of prep.legalDefences) {
        const id = snap([...prefix, defence]), positive = nodes[id].availableActions.length > 0;
        defences.push({ learnerUci: defence, node: id }); any ||= positive;
      }
      const survives = defences.length > 0 && defences.every((d) => nodes[d.node].availableActions.length > 0);
      universal ||= survives;
      preparations.push({ preparationUci: prep.preparationUci, node: p, defences, survives,
        unexpandedTerminalLegalMoves: node.terminalReason === null ? 0 : prep.legalDefences.length });
    }
    const next = { immediate, reintroducedWithin3Ply: immediate === "removed" && any,
      preparationSurvivesEveryDefence: immediate === "removed" && universal };
    const prior = Object.fromEntries(Object.keys(next).map((k) => [k, old[k]]));
    if (Object.keys(next).some((k) => next[k] !== prior[k])) scopes.get("complete_legal_baseline").changedOutcomes += 1;
    return { ...cell, family: definition.family, phase: root.phase, firstNode: first, prior, next,
      changedFields: Object.keys(next).filter((k) => next[k] !== prior[k]), preparations };
  });
  const observationCounts = {};
  const auditObservation = (observation, scope, identity) => {
    ck(observation.snapshots.length >= 1 && observation.snapshots.length <= 4
      && ["preserved", "removed", "identity_lost"].includes(observation.immediate), "Bad audit observation");
    const references = observation.snapshots.map((s, i) => { ck(s.ply === i + 1, "Changed snapshot stage");
      const id = collect(s, scope, identity);
      return id; });
    const first = nodes[references[0]], third = references.length >= 3 ? nodes[references[2]] : null;
    const immediate = first.tracked === null ? observation.immediate : first.availableActions.length ? "preserved" : "removed";
    const opportunityAtThirdPly = third !== null && third.availableActions.length > 0;
    let executedAtFourthPly = false;
    if (references.length === 4 && third !== null) {
      const before = Chess.fromSetup(parseFen(third.fen).unwrap()).unwrap();
      executedAtFourthPly = third.availableActions.some((a) => {
        const move = parseUci(a.uci), pos = before.clone();
        ck(move !== undefined, "Bad corrected witness"); pos.play(normalizeMove(pos, move));
        return makeFen(pos.toSetup()) === nodes[references[3]].fen;
      });
    }
    const next = { immediate, opportunityAtThirdPly, reintroducedAtThirdPly: immediate === "removed" && opportunityAtThirdPly,
      executedAtFourthPly };
    if (Object.entries(next).some(([k, v]) => observation[k] !== v)) scopes.get(scope).changedOutcomes += 1;
    observationCounts[scope] = (observationCounts[scope] ?? 0) + 1;
  };
  for (const cell of model.rows) for (const path of cell.paths) {
    auditObservation(path.observation, "actual_model", [cell.targetId, path.id]);
    for (const arm of path.arms) for (const leaf of arm.leaves) auditObservation(leaf.observation, "actual_model", [cell.targetId, leaf.leafId, arm.arm]);
  }
  for (const [scope, input] of [["actual_engine_and_first_reply_reserve", engine], ["actual_recursive", recursive]]) {
    for (const o of input.observations) auditObservation(o.observation, scope, [o.targetId, o.pathId]);
  }
  return { version: 1, profile: "d3262-target-opportunity-v2-audit-v1", convention,
    authority: "disposable_all_stage_local_exchange_audit_not_production_or_independent_strategic_truth",
    manifest: comparison.manifest, inputDigests: digests, sourceDigests,
    population: { offeredCandidates: 193, roots: 66, cells: 182, definitions: 64, controls: comparison.controls,
      historicalOriginalPopulation: "original_196_preserved_not_rebased_or_part_of_current_corrected_population" },
    quantifier: "exists_opponent_preparation_forall_legal_learner_defences_exists_named_target_available_at_ply4",
    referenceEncoding: "zero_based_node_pool_ordinal", nodes, baseline, scopes: Object.fromEntries(scopes), observationCounts, affected };
}
export function summarize(value) {
  return { nodes: value.nodes.length, baselineCells: value.baseline.length,
    baselineChanges: value.baseline.filter((r) => r.changedFields.length > 0).length,
    reintroduced: value.baseline.filter((r) => r.next.reintroducedWithin3Ply).length,
    surviving: value.baseline.filter((r) => r.next.preparationSurvivesEveryDefence).length,
    scopes: value.scopes, observationCounts: value.observationCounts, affected: value.affected.length };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const output = compileAudit(loadInputs(), (v) => process.stdout.write(`${JSON.stringify(v)}\n`));
  const logical = Buffer.from(`${JSON.stringify(output)}\n`), zipped = gzipSync(logical, { level: 9 });
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, zipped, { flag: "wx" });
  else ck(readFileSync(`${directory}/${outputName}`).equals(zipped), "Changed v2 all-stage audit bytes");
  process.stdout.write(`${JSON.stringify({ ...summarize(output), bytes: zipped.length, digest: sha(zipped) })}\n`);
}
