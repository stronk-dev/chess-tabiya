// Disposable D3262/D3488 quantifier experiment. NOT production proof authority.
// Exact decision sets close quantifiers; provider scores do not explain moves.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { directory, sha } from "./third-ply-source-check.mjs";
import { enumerateCandidate } from "./exact-reply-enumeration.mjs";
import { boardTerminalReason } from "./maia-horizon4-path-check.mjs";
import { engineArms } from "./coherent-engine-fourth-ply.mjs";
import { arms as semanticArms } from "./coherent-semantic-third-ply.mjs";
import { modelArms } from "./coherent-maia-fourth-ply.mjs";

export const names = ["d3262-coherent-root-frame.json", "d3262-coherent-first-reply-frontier.json",
  "d3262-coherent-third-ply-frame.json", "d3262-coherent-semantic-third-ply.json.gz",
  "d3262-coherent-engine-target-outcome.json.gz", "d3262-coherent-maia-target-outcome.json",
  "d3262-coherent-bounded-targets.json"];
export const outputName = "d3262-coherent-actual-proof.json.gz";
const key = (r) => JSON.stringify([r.rootId, r.candidateUci]);
const cellKey = (r) => JSON.stringify([r.rootId, r.targetId, r.candidateUci]);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function require(value, message) { if (!value) throw new Error(message); }
function index(rows, identity, label) {
  const map = new Map(rows.map((r) => [identity(r), r]));
  require(map.size === rows.length, `Duplicate ${label}`); return map;
}
function distinct(values, label) {
  require(Array.isArray(values) && values.every((v) => typeof v === "string")
    && new Set(values).size === values.length, `Duplicate/untyped ${label}`); return values;
}

export function projectPreparation(legalDefences, terminalReason, observed) {
  distinct(legalDefences, "legal defences");
  distinct(observed.map((r) => r.learnerUci), "observed defences");
  require(terminalReason === null || typeof terminalReason === "string", "Untyped terminal");
  for (const row of observed) require(legalDefences.includes(row.learnerUci)
    && typeof row.opportunity === "boolean" && Array.isArray(row.executedLeaves)
    && (row.opportunity || row.executedLeaves.length === 0), "Illegal/untyped defence witness");
  const unvisitedDefences = legalDefences.filter((uci) => !observed.some((r) => r.learnerUci === uci));
  // An automatic draw may still have physical legal moves. It has no eligible
  // decision subtree and cannot establish a vacuous universal or execution.
  if (terminalReason !== null || legalDefences.length === 0) {
    require(observed.length === 0, "Continuation after absorbing preparation");
    return { availability: "ineligible_terminal", execution: "ineligible_terminal",
      refutationPath: null, unvisitedDefences: [], unexpandedTerminalLegalMoves: legalDefences.length };
  }
  const counterexample = observed.find((r) => !r.opportunity);
  const complete = unvisitedDefences.length === 0;
  const availability = counterexample ? "refuted_by_visited_defence"
    : complete ? "survives_complete_nonempty_defences" : "unknown_partial_defences";
  return { availability, execution: counterexample ? "refuted_by_visited_defence"
    : complete && observed.every((r) => r.executedLeaves.length > 0) ? "executed_against_every_defence"
      : "unknown_unexecuted_or_partial", refutationPath: counterexample?.pathId ?? null,
    unvisitedDefences, unexpandedTerminalLegalMoves: 0 };
}
export function projectRoot(immediate, legalPreparations, selected) {
  distinct(legalPreparations, "legal preparations");
  distinct(selected.map((r) => r.preparationUci), "selected preparations");
  require(["removed", "preserved", "identity_lost"].includes(immediate)
    && selected.every((r) => legalPreparations.includes(r.preparationUci)), "Crossed root scope");
  const omittedPreparations = legalPreparations.filter((uci) => !selected.some((r) => r.preparationUci === uci));
  const witness = selected.find((r) => r.availability === "survives_complete_nonempty_defences");
  const executed = selected.find((r) => r.execution === "executed_against_every_defence");
  // The old bounded baseline short-circuits direct availability. Its false
  // preparation boolean is NOT a theorem about later reintroduction.
  const applicability = immediate === "preserved" ? "not_applicable_immediate_preserved"
    : immediate === "identity_lost" ? "not_applicable_identity_lost" : null;
  const negative = legalPreparations.length > 0 && omittedPreparations.length === 0
    && selected.every((r) => ["refuted_by_visited_defence", "ineligible_terminal"].includes(r.availability));
  return { availability: applicability ?? (witness ? "exists_preparation_surviving_all_defences"
    : negative ? "every_preparation_refuted_at_bound" : legalPreparations.length === 0
      ? "ineligible_terminal" : "unknown_partial_quantifiers"),
  execution: applicability ?? (executed ? "exists_executed_strategy" : negative
    ? "every_preparation_refuted_at_bound" : "unknown_unexecuted_or_partial"),
  witnessPreparationUci: applicability ? null : witness?.preparationUci ?? null,
  executedPreparationUci: applicability ? null : executed?.preparationUci ?? null, omittedPreparations };
}

export function loadProofInputs() {
  const raw = names.map((name) => readFileSync(`${directory}/${name}`));
  return { values: raw.map((b, i) => JSON.parse(names[i].endsWith(".gz") ? gunzipSync(b) : b)),
    digests: Object.fromEntries(names.map((name, i) => [name, sha(raw[i])])) };
}
export function compileActualProof({ values, digests }) {
  const [root, first, third, semantic, engine, model, bounded] = values;
  require(root.roots.length === 66 && first.rows.length === 193 && third.rows.length === 193
    && semantic.rows.length === 182 && model.rows.length === 182 && bounded.rows.length === 182
    && engine.profiles.length === 2 && equal(semantic.arms, semanticArms)
    && values.every((v) => v.manifest === root.manifest), "Changed proof population");
  for (const [value, name] of [[third, names[1]], [semantic, names[2]], [engine, names[0]],
    [model, names[0]], [engine, names[6]], [model, names[6]]])
    require(value.inputDigests[name] === digests[name], "Crossed proof input digest");
  const rootIndex = index(root.roots, (r) => r.rootId, "root"), firstIndex = index(first.rows, key, "first reply");
  const thirdIndex = index(third.rows, key, "third ply"), semanticIndex = index(semantic.rows, cellKey, "semantic cell");
  const exactIndex = index(bounded.rows, cellKey, "exact cell");
  const paths = new Map();
  for (const path of [...third.paths, ...semantic.paths]) {
    require(path.historyUci.length === 3 && path.id === sha(JSON.stringify([path.rootId, ...path.historyUci]))
      && path.rootFen === rootIndex.get(path.rootId)?.fen, "Crossed ordered path identity");
    const previous = paths.get(path.id);
    require(!previous || equal([previous.rootId, previous.historyUci, previous.fen], [path.rootId, path.historyUci, path.fen]),
      "Crossed shared path identity"); paths.set(path.id, path);
  }
  const graph = root.roots.flatMap((r) => r.candidates.map((candidate) => {
    const legal = enumerateCandidate(r.fen, candidate.moveUci);
    return { rootId: r.rootId, rootFen: r.fen, candidateUci: candidate.moveUci,
      afterFen: legal.afterFen, terminalReason: boardTerminalReason(legal.afterFen),
      preparations: legal.replies.map((reply) => {
        const next = enumerateCandidate(legal.afterFen, reply.uci);
        return { preparationUci: reply.uci, fen: reply.fen, terminalReason: boardTerminalReason(reply.fen),
          legalDefences: next.replies.map((move) => move.uci) };
      }) };
  }));
  require(graph.length === 193, "Lost offered candidate graph");
  const graphIndex = index(graph, key, "candidate graph");
  const inputProfiles = [...engine.profiles, { kind: "model", arms: model.modelArms, rows: model.rows }];
  const expectedArms = new Map([["engine", engineArms], ["semantic_first_reply_reserve", semanticArms], ["model", modelArms]]);
  require(equal(inputProfiles.map((p) => p.kind), [...expectedArms.keys()]), "Changed proof profile kinds");
  const profiles = inputProfiles.map((profile) => {
    require(equal(profile.arms, expectedArms.get(profile.kind)) && profile.rows.length === 182
      && equal([...index(profile.rows, cellKey, "profile cell").keys()].sort(), [...exactIndex.keys()].sort()), "Changed proof cells/arms");
    return { kind: profile.kind, arms: profile.arms, rows: profile.rows.map((cell) => {
      const exact = exactIndex.get(cellKey(cell)), g = graphIndex.get(key(cell));
      require(exact.kind === "result" && cell.immediate === exact.immediate
        && cell.sourceObserved === exact.sourceObserved && cell.family === exact.family
        && cell.phase === rootIndex.get(cell.rootId)?.phase
        && equal(cell.exactBaseline, { reintroducedWithin3Ply: exact.reintroducedWithin3Ply,
          preparationSurvivesEveryDefence: exact.preparationSurvivesEveryDefence })
        && equal(cell.arms.map((a) => a.arm), profile.arms), "Crossed baseline/arm scope");
      return { rootId: cell.rootId, targetId: cell.targetId, candidateUci: cell.candidateUci,
        sourceObserved: cell.sourceObserved, phase: cell.phase, family: cell.family, immediate: cell.immediate,
        exactBaseline: cell.exactBaseline, arms: cell.arms.map((arm) => {
          require(arm.universalVerdict === "not_evaluated" && arm.negativeVerdict === "abstain_from_partial_frontier"
            && arm.proofCeiling === (profile.kind === "model" ? "observed_configured_model_paths_only" : "observed_provider_selected_lines_only"),
            "Changed provider authority ceiling");
          const sem = semanticIndex.get(cellKey(cell))?.arms.find((a) => a.arm === arm.arm);
          const selectedUcis = profile.kind === "semantic_first_reply_reserve" ? sem.selectedReplyUcis
            : firstIndex.get(key(cell)).replies.filter((r) => r.selectedBy.includes(arm.arm)).map((r) => r.uci);
          distinct(selectedUcis, "selected initial replies");
          const sourcePaths = profile.kind === "model" ? cell.paths.flatMap((p) => p.arms.filter((a) => a.arm === arm.arm)
            .map((a) => ({ pathId: p.id, observation: p.observation, leaves: a.leaves.map((l) => ({ id: l.leafId, observation: l.observation })) })))
            : arm.paths.map((p) => {
              const resolve = (ordinal) => {
                require(Number.isSafeInteger(ordinal) && ordinal >= 0 && ordinal < engine.observations.length, "Invalid proof observation ordinal");
                const o = engine.observations[ordinal];
                require(o.rootId === cell.rootId && o.targetId === cell.targetId, "Crossed proof target identity"); return o;
              };
              const pre = resolve(p.predecessorObservation);
              return { pathId: pre.pathId, observation: pre.observation,
                leaves: p.leafObservations.map((i) => { const l = resolve(i); return { id: l.pathId, observation: l.observation }; }) };
            });
          distinct(sourcePaths.map((p) => p.pathId), "actual predecessor paths");
          const expectedPaths = profile.kind === "semantic_first_reply_reserve" ? sem.selectedLearnerPaths
            : thirdIndex.get(key(cell)).replies.flatMap((r) => r.arms.filter((a) => a.arm === arm.arm)
              .flatMap((a) => a.selected.map((uci) => sha(JSON.stringify([cell.rootId, cell.candidateUci, r.replyUci, uci])))));
          require(equal(sourcePaths.map((p) => p.pathId).sort(), [...expectedPaths].sort()), "Changed actual selected predecessor set");
          const observations = sourcePaths.map((p) => {
            const path = paths.get(p.pathId), o = p.observation, snapshot = o.snapshots.at(-1);
            require(path && path.historyUci[0] === cell.candidateUci && selectedUcis.includes(path.historyUci[1])
              && o.snapshots.length === 3 && snapshot.ply === 3 && snapshot.fen === path.fen && o.immediate === cell.immediate
              && typeof o.opportunityAtThirdPly === "boolean" && !o.executedAtFourthPly,
              "Crossed actual observation/path scope");
            require(o.opportunityAtThirdPly === (snapshot.availableMoveUci !== null)
              && (snapshot.terminalReason === null || !o.opportunityAtThirdPly), "Crossed opportunity/terminal witness");
            const executedLeaves = p.leaves.filter((l) => l.observation.executedAtFourthPly).map((l) => {
              const witness = l.observation.executionWitness;
              require(o.opportunityAtThirdPly && witness?.length === 4
                && equal(witness.slice(0, 3), path.historyUci) && l.id === sha(JSON.stringify([cell.rootId, ...witness]))
                && equal(l.observation.snapshots.slice(0, 3), o.snapshots), "Execution not on selected predecessor");
              return l.id;
            });
            distinct(executedLeaves, "executed leaves");
            return { pathId: p.pathId, preparationUci: path.historyUci[1], learnerUci: path.historyUci[2],
              opportunity: o.opportunityAtThirdPly, executedLeaves };
          });
          const preparations = selectedUcis.map((uci) => {
            const prep = g.preparations.find((p) => p.preparationUci === uci);
            require(prep, "Selected preparation is not legal");
            const observed = observations.filter((o) => o.preparationUci === uci);
            return { preparationUci: uci, observed,
              ...projectPreparation(prep.legalDefences, prep.terminalReason, observed) };
          });
          const result = projectRoot(cell.immediate, g.terminalReason === null ? g.preparations.map((p) => p.preparationUci) : [], preparations);
          if (result.availability === "exists_preparation_surviving_all_defences")
            require(exact.preparationSurvivesEveryDefence, "Observed universal contradicts exact baseline");
          if (result.availability === "every_preparation_refuted_at_bound")
            require(!exact.preparationSurvivesEveryDefence, "Observed refutation contradicts exact baseline");
          return { arm: arm.arm, sourceProofCeiling: arm.proofCeiling,
            productionDisposition: "research_quantifier_receipt_not_production_authority", ...result, preparations };
        }) };
    }) };
  });
  require(equal(engine.controls, model.controls) && model.controls.length === 4, "Crossed controls");
  return { version: 1, profile: "d3262-coherent-actual-proof-v1", manifest: root.manifest, inputDigests: digests,
    quantifier: "exists_opponent_preparation_forall_legal_learner_defences_exists_named_target_available_at_ply4",
    bounds: { preparationPly: 2, defencePly: 3, targetActionPly: 4 },
    authority: "disposable_actual_selected_paths_exact_legal_decision_sets_shared_local_target_predicate",
    controls: model.controls, candidateGraph: graph, profiles };
}
export function summarizeProof(output) {
  return Object.fromEntries(output.profiles.flatMap((p) => p.arms.map((arm) => {
    const rows = p.rows.map((r) => r.arms.find((a) => a.arm === arm)), preps = rows.flatMap((r) => r.preparations);
    const count = (items, field) => Object.fromEntries([...new Set(items.map((r) => r[field]))].sort()
      .map((v) => [v, items.filter((r) => r[field] === v).length]));
    return [arm, { cells: rows.length, roots: count(rows, "availability"), executions: count(rows, "execution"),
      preparations: count(preps, "availability"), selectedPreparations: preps.length,
      visitedDefences: preps.reduce((n, r) => n + r.observed.length, 0) }];
  })));
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const output = compileActualProof(loadProofInputs()), plain = Buffer.from(`${JSON.stringify(output)}\n`), bytes = gzipSync(plain, { level: 9 });
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${outputName}`, bytes, { flag: "wx" });
  else require(readFileSync(`${directory}/${outputName}`).equals(bytes), "Actual proof differs from sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), logicalDigest: sha(plain), bytes: bytes.length, summary: summarizeProof(output) }, null, 2)}\n`);
}
