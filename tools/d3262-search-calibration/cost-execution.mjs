// Disposable D3262 live server execution. No production defaults or browser claims.
import { readFileSync } from "node:fs";
import { CostDependencies, fenOf, position, replay, terminal } from "./cost-stockfish.mjs";
import { sha } from "./cost-contract.mjs";
import { enumerateCandidate, legalMoves } from "./exact-reply-enumeration.mjs";
import { replayReply } from "./exact-arm-trigger-core.mjs";
import { observeTargetPathV2, convention } from "./dist/target-opportunity-v2.mjs";
import { projectPreparation, projectRoot } from "./coherent-actual-proof.mjs";
import { firstReplyEvents, recursiveEvents, reserveFirstReply, reserveRecursiveLayer } from "./cost-semantic.mjs";
import { absorbingModelFrontier, configuredThreshold, executeModelFrontier } from "./cost-model.mjs";

export const supportedFamilies = Object.freeze(["provider_line", "engine_beam", "exact_reply_forcing", "bounded_oracle_diagnostic",
  "first_reply_reserve_diagnostic", "recursive_semantic", "configured_model"]);
export const inputPins = Object.freeze({
  "d3262-coherent-root-frame.json": "sha256:dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
  "d3262-coherent-target-comparison-frame.json": "sha256:229335224b1c175478537554ec52ee7341b983e7358222fe1c7d67c2af16cc6b",
});
export function loadExecutionInputs() {
  const parsed = Object.entries(inputPins).map(([name, digest]) => {
    const bytes = readFileSync(`planning/semantic-consequence-search/${name}`);
    if (sha(bytes) !== digest) throw new Error(`Changed execution input: ${name}`);
    return JSON.parse(bytes);
  });
  const [rootFrame, targetFrame] = parsed;
  if (rootFrame.roots.length !== 66 || targetFrame.comparisons.length !== 182 || targetFrame.definitions.length !== 64)
    throw new Error("Changed exact experiment population");
  return { rootFrame, targetFrame };
}
export function executionSubject(inputs, cell) {
  const root = inputs.rootFrame.roots.find(x => x.rootId === cell.rootId);
  if (!root?.candidates.some(x => x.moveUci === cell.candidateUci)) throw new Error("Foreign execution subject");
  const definitions = inputs.targetFrame.comparisons.filter(x => x.rootId === cell.rootId && x.candidateUci === cell.candidateUci)
    .map(x => inputs.targetFrame.definitions.find(d => d.id === x.targetId));
  if (definitions.some(x => !x || x.rootId !== cell.rootId)) throw new Error("Crossed named target");
  return { rootFen: root.fen, definitions };
}

export async function executeCostCase({ cell, setting, subject, planDigest, adapter, initialCache = new Map(), nodeCap = 25_000 }) {
  if (!supportedFamilies.includes(setting.family)) throw new Error(`Unimplemented traversal family: ${setting.family}`);
  if (setting.id !== cell.setting || ![2, 4].includes(cell.horizon) || !Number.isSafeInteger(nodeCap) || nodeCap < 1)
    throw new Error("Crossed setting/horizon/node budget");
  const model = setting.family === "configured_model";
  const threshold = model ? configuredThreshold(setting.id) : null;
  if (model && typeof adapter.admitReceipt !== "function") throw new Error("Model traversal needs declared Maia receipt admission");
  const dependencies = new CostDependencies(adapter, cell.regime, initialCache);
  const started = performance.now();
  let rss = process.memoryUsage().rss, visited = 0, exhausted = false, collectionMs = 0, compileMs = 0;
  const sample = () => { rss = Math.max(rss, process.memoryUsage().rss); };
  const visit = () => { sample(); if (++visited > nodeCap) { exhausted = true; return false; } return true; };
  const collect = fn => { const t = performance.now(); const v = fn(); collectionMs += performance.now() - t; sample(); return v; };
  const candidate = collect(() => enumerateCandidate(subject.rootFen, cell.candidateUci));
  const reason = collect(() => terminal(position(candidate.afterFen)));
  const budget = setting.budget ?? cell.setting.split(":")[1];
  const width = Number(/:top(2|4|8)(?::|$)/u.exec(cell.setting)?.[1]);
  const semantic = ["first_reply_reserve_diagnostic", "recursive_semantic"].includes(setting.family);
  const engineTraversal = setting.family === "engine_beam" || semantic;
  const eventSourceWidth = cell.setting.split(":")[3];
  const query = async (fen, multiPv) => {
    const value = await dependencies.query({ provider: "stockfish", sourceDigest: adapter.sourceDigest, fen, budget, multiPv });
    sample(); return value.result;
  };
  const observations = [];
  const selections = [];
  let providerPv = null;
  let modelFrontier = model ? subject.definitions.length && reason !== null ? absorbingModelFrontier(cell.horizon, threshold)
    : { nodes: [], edges: [], coverage: { status: "not_requested_no_target" } } : null;
  // A no-target row still enumerates this candidate's legal boundary. No fabricated hypothesis.
  if (subject.definitions.length && reason === null && model) {
    modelFrontier = await executeModelFrontier({ rootFen: subject.rootFen, candidateUci: cell.candidateUci,
      horizon: cell.horizon, threshold, dependencies, sourceDigest: adapter.sourceDigest, collect, visit,
      observe(history) { for (const definition of subject.definitions) observations.push(collect(() => ({ targetId: definition.id, history,
        observation: observeTargetPathV2(subject.rootFen, history, definition) }))); } });
  } else if (subject.definitions.length && reason === null && setting.family === "provider_line") {
    const legal = collect(() => legalMoves(position(subject.rootFen)).length);
    const probe = await query(subject.rootFen, legal);
    if (probe) {
      const entry = probe.entries.find(x => x.moveUci === cell.candidateUci);
      if (!entry) throw new Error("Full-root source lost candidate");
      providerPv = entry;
      const path = entry.pv.slice(0, cell.horizon);
      collect(() => replay(subject.rootFen, path));
      for (const definition of subject.definitions) {
        observations.push(collect(() => ({ targetId: definition.id, history: path,
          observation: observeTargetPathV2(subject.rootFen, path, definition) })));
      }
    }
  } else if (subject.definitions.length && reason === null) {
    let rankedPreparations = null;
    if (engineTraversal) {
      const source = await query(candidate.afterFen, 8);
      rankedPreparations = source?.entries.slice(0, width).map(x => x.moveUci) ?? [];
    }
    for (const definition of subject.definitions) {
      let selectedPreparations = rankedPreparations;
      if (semantic && rankedPreparations.length) {
        const events = collect(() => firstReplyEvents(subject.rootFen, candidate, definition));
        const top = await query(candidate.afterFen, 8);
        const eventSource = eventSourceWidth === "all_legal" ? await query(candidate.afterFen, candidate.replyCount) : top;
        if (eventSource) {
          const selection = collect(() => reserveFirstReply(candidate.replies.map(x => x.uci), top.entries.map(x => x.moveUci),
            eventSource.entries.map(x => x.moveUci), events.eventReplies.map(x => x.uci), width));
          selections.push({ targetId: definition.id, history: [cell.candidateUci], events, ...selection });
          selectedPreparations = selection.selected;
        } else selectedPreparations = [];
      }
      for (const preparation of candidate.replies) {
        if (selectedPreparations !== null && !selectedPreparations.includes(preparation.uci)) continue;
        if (!visit()) break;
        const history = [cell.candidateUci, preparation.uci];
        observations.push(collect(() => ({ targetId: definition.id, history,
          observation: observeTargetPathV2(subject.rootFen, history, definition) })));
        if (cell.horizon === 2) continue;
        const expanded = setting.family !== "exact_reply_forcing" || collect(() => {
          const attack = replayReply(candidate, preparation, definition).newAttack;
          return preparation.givesCheck || preparation.captures || attack && (setting.trigger === "square_control" || definition.family === "material");
        });
        const pos = collect(() => replay(subject.rootFen, history));
        if (!expanded || collect(() => terminal(pos)) !== null) continue;
        const defences = collect(() => legalMoves(pos));
        let selected = defences.map(x => x.uci);
        if (engineTraversal) {
          const source = await query(fenOf(pos), 8);
          selected = source?.entries.slice(0, width).map(x => x.moveUci) ?? [];
          if (source && setting.family === "recursive_semantic") {
            const events = collect(() => recursiveEvents(subject.rootFen, history, definition));
            const selection = collect(() => reserveRecursiveLayer(events.legal, source.entries.map(x => x.moveUci), events.events.map(x => x.uci), width));
            selections.push({ targetId: definition.id, history, events, ...selection }); selected = selection.selected;
          }
        }
        for (const defence of selected) {
          if (!visit()) break;
          const third = [...history, defence];
          observations.push(collect(() => ({ targetId: definition.id, history: third,
            observation: observeTargetPathV2(subject.rootFen, third, definition) })));
          // Exact arms evaluate availability, not invented fourth-ply execution.
          if (!engineTraversal) continue;
          const next = collect(() => replay(subject.rootFen, third));
          if (collect(() => terminal(next)) !== null) continue;
          const source = await query(fenOf(next), 8);
          let selectedLeaves = source?.entries.slice(0, width).map(x => x.moveUci) ?? [];
          if (source && setting.family === "recursive_semantic") {
            const events = collect(() => recursiveEvents(subject.rootFen, third, definition));
            const selection = collect(() => reserveRecursiveLayer(events.legal, source.entries.map(x => x.moveUci), events.events.map(x => x.uci), width));
            selections.push({ targetId: definition.id, history: third, events, ...selection }); selectedLeaves = selection.selected;
          }
          for (const leaf of selectedLeaves) {
            if (!visit()) break;
            const fourth = [...third, leaf];
            observations.push(collect(() => ({ targetId: definition.id, history: fourth,
              observation: observeTargetPathV2(subject.rootFen, fourth, definition) })));
          }
          if (exhausted) break;
        }
        if (exhausted) break;
      }
      if (exhausted) break;
    }
  }
  const compilationStarted = performance.now();
  const projections = subject.definitions.map(definition => {
    const rows = observations.filter(x => x.targetId === definition.id);
    const immediate = collect(() => observeTargetPathV2(subject.rootFen, [cell.candidateUci], definition).immediate);
    const preparations = candidate.replies.filter(p => rows.some(x => x.history[1] === p.uci)).map(preparation => {
      const pos = collect(() => replay(subject.rootFen, [cell.candidateUci, preparation.uci]));
      const legal = collect(() => legalMoves(pos).map(x => x.uci));
      const observed = rows.filter(x => setting.family !== "provider_line" && x.history.length === 3 && x.history[1] === preparation.uci).map(row => ({
        learnerUci: row.history[2], pathId: sha(JSON.stringify([cell.rootId, ...row.history])),
        opportunity: row.observation.opportunityAtThirdPly,
        executedLeaves: rows.filter(x => x.history.length === 4 && x.history.slice(0, 3).join(" ") === row.history.join(" ")
          && x.observation.executedAtFourthPly).map(x => sha(JSON.stringify([cell.rootId, ...x.history]))),
      }));
      // PV has one leaf, so recover its actual third-ply observation, never fill omitted alternatives.
      if (setting.family === "provider_line") for (const row of rows.filter(x => x.history.length >= 3 && x.history[1] === preparation.uci)) {
        observed.push({ learnerUci: row.history[2], pathId: sha(JSON.stringify([cell.rootId, ...row.history.slice(0, 3)])),
          opportunity: row.observation.opportunityAtThirdPly,
          executedLeaves: row.observation.executedAtFourthPly ? [sha(JSON.stringify([cell.rootId, ...row.history]))] : [] });
      }
      return { preparationUci: preparation.uci, observed, ...projectPreparation(legal, terminal(pos), observed) };
    });
    const quantifier = projectRoot(immediate, reason === null ? candidate.replies.map(x => x.uci) : [], preparations);
    return { targetId: definition.id, convention, immediate, preparations, rawQuantifier: quantifier,
      licensedAvailability: setting.family === "provider_line" && ["exists_preparation_surviving_all_defences", "every_preparation_refuted_at_bound"].includes(quantifier.availability)
        ? "withheld_provider_line_ceiling" : quantifier.availability,
      opportunityObserved: rows.some(x => x.observation.opportunityAtThirdPly),
      executionObserved: rows.some(x => x.observation.executedAtFourthPly),
      authority: "local_target_convention_not_engine_reason", completeness: exhausted ? "budget_exhausted" : "declared_traversal_only" };
  });
  compileMs = performance.now() - compilationStarted;
  const failure = dependencies.ledger.find(x => !["executed", "cached"].includes(x.state));
  const kind = subject.definitions.length === 0 ? "no_target" : reason !== null ? "absorbing_terminal"
    : failure ? { unavailable: "source_unavailable", invalid: "invalid_source", timed_out: "budget_exhausted" }[failure.state]
      : exhausted ? "budget_exhausted" : "available";
  const result = { kind, rootFen: subject.rootFen, horizon: cell.horizon, terminalReason: reason,
    legalPreparationUcis: reason === null ? candidate.replies.map(x => x.uci) : [], projections, observations, providerPv,
    ...(semantic ? { selections, schedulingAuthority: "source_blind_named_geometry_not_profit_or_proof" } : {}),
    ...(model ? { modelFrontier } : {}),
    visited, nodeCap, productionProfileSelected: false, moveReason: "not_an_engine_reason" };
  const raw = { cell, result, dependencies: dependencies.raw, clock: { started, ended: performance.now() } };
  const elapsedMs = raw.clock.ended - started;
  sample();
  const row = { ...cell, planDigest, kind, timing: { elapsedMs, sourceMs: dependencies.sourceMs, collectionMs, compileMs },
    memory: { peakRssBytes: rss, observation: "sampled_rss_lower_bound" }, providerQueries: dependencies.ledger,
    initialCacheEntries: dependencies.initialCacheEntries, cacheHits: dependencies.ledger.filter(x => x.state === "cached").length,
    retainedBytes: Buffer.byteLength(JSON.stringify(raw)), rawCaptureDigest: sha(JSON.stringify(raw)),
    measurementBoundary: "server_execution_only_not_browser_rendering" };
  // Literal hash inputs avoid pretending Python and JS format every float identically.
  // These archive bytes are not extra elapsed time or a cached final answer.
  return { row, raw, cache: dependencies.cache, ...(model ? { rawLiteral: JSON.stringify(raw),
    receiptLiterals: raw.dependencies.map(x => x.receipt ? JSON.stringify(x.receipt) : null) } : {}) };
}
