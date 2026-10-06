import assert from "node:assert/strict";
import { test } from "node:test";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { enumerateCandidate, legalMoves } from "./exact-reply-enumeration.mjs";
import { arms, compileThirdPlyFrame, loadThirdPlyInputs, sourceNames } from "./coherent-third-ply-frame.mjs";

// Synthetic legality controls, not provider observations. Different knight
// orders converge to the same full FEN while retaining different model histories.
function fixture() {
  const rootFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const manifest = "synthetic-not-a-production-source";
  const model = { modelId: "fixture", modelCheckpointSha256: "fixture", uciSourceSha256: "fixture", mode: "human_common",
    band: 1400, temperature: 0.8, topP: 0.92, useUciHistory: true, device: "cpu",
    rawMeaning: "direct_full_legal_softmax_logits", configuredMeaning: "direct_sample_from_logits_support_and_normalized_mass",
    preRootHistory: "unavailable_not_inferred" };
  const engineSource = { engineName: "fixture", executableDigest: "fixture", threads: 1, hashMb: 16,
    multiPv: "top8_legal_moves_at_selected_reply", scorePerspective: "raw_uci_uninterpreted" };
  const sources = Object.fromEntries(sourceNames.map((name, i) => [name, { manifest, source: i < 2 ? engineSource : model, rows: [] }]));
  const digests = Object.fromEntries(sourceNames.map((name) => [name, `synthetic-digest:${name}`]));
  digests["d3262-coherent-first-reply-frontier.json"] = "synthetic-first-digest";
  const frame = { profile: "d3262-coherent-root-v1", manifest,
    roots: [{ rootId: "knights", fen: rootFen, phase: "opening", candidates: ["g1f3", "b1c3"].map((moveUci) => ({ moveUci })) }] };
  const first = { profile: "d3262-coherent-first-reply-v1", manifest, rows: [] };
  const union = { profile: "d3262-coherent-deeper-source-union-v1", manifest, inputDigests: { ...digests }, bindings: [] };
  const childMaia = [{ manifest, source: model, rows: [] }, { manifest, source: model, rows: [] }];
  function policy(fen, preferred, historyUci, candidateUci, replyUci) {
    const legal = legalMoves(Chess.fromSetup(parseFen(fen).unwrap()).unwrap()).map((entry) => entry.uci);
    const next = legal.find((uci) => uci !== preferred);
    return { rootId: "knights", candidateUci, ...(replyUci === undefined ? {} : { replyUci }), rootFen, fen, historyUci,
      rawFullLegal: legal.map((legalUci) => ({ legalUci, mass: 1 / legal.length })),
      configuredSupport: [{ legalUci: preferred, mass: 0.81 }, { legalUci: next, mass: 0.19 }] };
  }
  for (const candidate of frame.roots[0].candidates) {
    const graph = enumerateCandidate(rootFen, candidate.moveUci);
    const ordered = [...graph.replies].sort((a, b) => Number(b.uci === "g8f6") - Number(a.uci === "g8f6") || a.uci.localeCompare(b.uci));
    const selected = ordered.slice(0, 8);
    const parent = policy(graph.afterFen, "g8f6", [candidate.moveUci], candidate.moveUci);
    childMaia[0].rows.push(parent);
    first.rows.push({ rootId: "knights", candidateUci: candidate.moveUci, legalReplyCount: graph.replyCount,
      replies: selected.map((reply, i) => ({ uci: reply.uci, fen: reply.fen,
        selectedBy: arms.filter((arm) => arm.startsWith("engine:") ? i < Number(arm.split(":")[2].slice(3))
          : parent.configuredSupport.slice(0, arm.endsWith("0.80") ? 1 : 2).some((entry) => entry.legalUci === reply.uci)) })) });
    // Ensure the second Maia support is in the shared first-reply union.
    assert.ok(selected.some((reply) => reply.uci === parent.configuredSupport[1].legalUci));
    for (const reply of selected) {
      const legal = legalMoves(Chess.fromSetup(parseFen(reply.fen).unwrap()).unwrap()).map((entry) => entry.uci);
      const preferred = candidate.moveUci === "g1f3" ? "b1c3" : "g1f3";
      const moves = [...legal].sort((a, b) => Number(b === preferred) - Number(a === preferred) || a.localeCompare(b)).slice(0, 8);
      const engine = { fen: reply.fen, probes: ["depth8", "depth12", "movetime100"].map((budget) => ({ budget, legal,
        coherentDepth: 8, entries: moves.map((moveUci, i) => ({ rank: i + 1, moveUci, depth: 8, pv: [moveUci] })),
        missingMoves: legal.filter((uci) => !moves.includes(uci)) })) };
      const human = policy(reply.fen, preferred, [candidate.moveUci, reply.uci], candidate.moveUci, reply.uci);
      union.bindings.push({ rootId: "knights", candidateUci: candidate.moveUci, replyUci: reply.uci, fen: reply.fen,
        stockfish: { source: sourceNames[0], row: sources[sourceNames[0]].rows.length },
        maia: { source: sourceNames[2], row: sources[sourceNames[2]].rows.length } });
      sources[sourceNames[0]].rows.push(engine);
      sources[sourceNames[2]].rows.push(human);
    }
  }
  return [frame, first, union, sources, childMaia, digests];
}

test("conditional policy mass composes without renormalizing omitted branches", () => {
  const output = compileThirdPlyFrame(...fixture());
  for (const row of output.rows) {
    const eighty = row.arms.find((arm) => arm.arm === "maia:prefix0.80");
    assert.ok(Math.abs(eighty.frontierMass - 0.81 * 0.81) < 1e-12);
    assert.ok(Math.abs(eighty.residualMass - (1 - 0.81 * 0.81)) < 1e-12);
    assert.equal(eighty.selectedLearnerEdges, 1);
    assert.equal(row.arms.find((arm) => arm.arm === "maia:prefix0.90").frontierMass, 1);
    assert.ok(eighty.unvisitedReplies > 0 && eighty.unvisitedLearnerEdgesWithinSelectedReplies > 0);
    assert.ok(Math.abs(eighty.omittedFirstLayerMass - 0.19) < 1e-12);
    assert.ok(Math.abs(eighty.omittedSecondLayerMass - 0.81 * 0.19) < 1e-12);
    assert.ok(Math.abs(eighty.omittedFirstLayerMass + eighty.omittedSecondLayerMass - eighty.residualMass) < 1e-12);
  }
});

test("engine FEN sharing cannot collapse different ordered Maia histories", () => {
  const output = compileThirdPlyFrame(...fixture());
  const converged = output.paths.filter((path) => path.historyUci[1] === "g8f6"
    && path.historyUci.includes("g1f3") && path.historyUci.includes("b1c3"));
  assert.equal(converged.length, 2);
  assert.equal(converged[0].fen, converged[1].fen);
  assert.notEqual(converged[0].id, converged[1].id);
  const engine = output.engineJobs.filter((job) => job.fen === converged[0].fen);
  assert.equal(engine.length, 1);
  assert.deepEqual(engine[0].budgets, ["depth12", "depth8", "movetime100"]);
  assert.deepEqual(new Set(engine[0].paths), new Set(converged.map((path) => path.id)));
  assert.equal(output.maiaJobs.filter((job) => job.fen === converged[0].fen).length, 2);
});

test("crossed digests, model identities, path history and row bindings refuse", () => {
  for (const [mutate, pattern] of [
    [(input) => { input[5][sourceNames[0]] = "changed"; }, /source digest/u],
    [(input) => { input[3][sourceNames[3]].source = { ...input[3][sourceNames[3]].source, band: 1500 }; }, /model or sampling/u],
    [(input) => { input[3][sourceNames[2]].rows[0].historyUci.reverse(); }, /path history/u],
    [(input) => { input[2].bindings[0].maia.row = 1; }, /row reference/u],
    [(input) => { input[2].bindings.pop(); }, /deeper binding/u],
    [(input) => { input[1].rows[0].replies[0].selectedBy.push("unknown-arm"); }, /first-reply selection/u],
  ]) {
    const input = fixture(); mutate(input);
    assert.throws(() => compileThirdPlyFrame(...input), pattern);
  }
});

test("mixed ranks, illegal PVs, malformed mass and changed first-layer prefix refuse", () => {
  for (const [mutate, pattern] of [
    [(input) => { input[3][sourceNames[0]].rows[0].probes[0].entries[0].depth = 9; }, /coherent engine ranks/u],
    [(input) => { input[3][sourceNames[0]].rows[0].probes[0].entries[0].pv.push("a1a8"); }, /Illegal path/u],
    [(input) => { input[3][sourceNames[2]].rows[0].configuredSupport[0].mass = NaN; }, /normalized mass/u],
    [(input) => { input[1].rows[0].replies[0].selectedBy = input[1].rows[0].replies[0].selectedBy.filter((arm) => arm !== "maia:prefix0.80"); }, /first-layer prefix/u],
  ]) {
    const input = fixture(); mutate(input);
    assert.throws(() => compileThirdPlyFrame(...input), pattern);
  }
});

test("a no-legal-reply terminal consumes no provider job and is not an empty universal proof", () => {
  const input = fixture();
  input[0].roots = [{ rootId: "mate", fen: "7k/5Q2/5K2/8/8/8/8/8 w - - 0 1", phase: "endgame",
    candidates: [{ moveUci: "f7g7" }] }];
  input[1].rows = [{ rootId: "mate", candidateUci: "f7g7", legalReplyCount: 0, replies: [] }];
  input[2].bindings = [];
  for (const source of input[4]) source.rows = [];
  const output = compileThirdPlyFrame(...input);
  assert.equal(output.paths.length, 0);
  assert.equal(output.engineJobs.length, 0);
  assert.equal(output.maiaJobs.length, 0);
  assert.equal(output.rows[0].terminalAfterCandidate, true);
  assert.ok(output.rows[0].arms.every((arm) => arm.selectedReplies === 0
    && (arm.frontierMass === null || arm.frontierMass === 1)));
  assert.ok(!("proof" in output.rows[0]));
});

test("corrected retained source population replays every candidate and selected reply", () => {
  const output = compileThirdPlyFrame(...loadThirdPlyInputs());
  assert.equal(output.rows.length, 193);
  assert.equal(output.rows.reduce((sum, row) => sum + row.replies.length, 0), 1966);
  assert.equal(output.arms.length, 11);
  assert.equal(output.finalPlyQueries.maia.historyUci, "root_candidate_reply_learner_path_per_row");
  assert.ok(output.engineJobs.length > 0 && output.maiaJobs.length > 0);
  assert.ok(output.rows.every((row) => row.arms.every((arm) => arm.unvisitedReplies >= 0 && arm.unvisitedLearnerEdgesWithinSelectedReplies >= 0)));
  assert.match(output.authority, /not_four_ply_proof_or_human_frequency/u);
});
