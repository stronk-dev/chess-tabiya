import assert from "node:assert/strict";
import { test } from "node:test";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { compileThirdPlyFrame } from "./coherent-third-ply-frame.mjs";
import { fixture } from "./coherent-provider-fixture.mjs";
import { boardTerminalReason } from "./maia-horizon4-path-check.mjs";
import { frameName, sha } from "./third-ply-source-check.mjs";
import { compileMaiaFourthPly, loadFourthPlyInputs, modelArms } from "./coherent-maia-fourth-ply.mjs";

const bytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
function controls(priorInputs = fixture()) {
  const third = compileThirdPlyFrame(...priorInputs), thirdBytes = bytes(third);
  const direct = { source: priorInputs[4][0].source }, directBytes = bytes(direct);
  const child = priorInputs[4][0], childBytes = bytes(child);
  const rows = third.maiaJobs.map((job) => {
    const legalUcis = legalMoves(Chess.fromSetup(parseFen(job.fen).unwrap()).unwrap()).map((entry) => entry.uci);
    const terminalReason = boardTerminalReason(job.fen);
    return { ...job, historyUci: [...job.historyUci], candidateUci: job.historyUci[0], replyUci: job.historyUci[1], learnerUci: job.historyUci[2],
      legalUcis, terminal: terminalReason !== null, terminalReason, elapsedMs: 1,
      rawFullLegal: terminalReason !== null ? [] : legalUcis.map((legalUci) => ({ legalUci, mass: 1 / legalUcis.length })),
      configuredSupport: terminalReason !== null ? [] : [{ legalUci: legalUcis[0], mass: 0.81 }, { legalUci: legalUcis[1], mass: 0.19 }] };
  });
  const final = { version: 1, manifest: third.manifest, source: structuredClone(third.finalPlyQueries.maia), positions: rows.length,
    partial: false, authority: "coherent_third_ply_path_keyed_maia_not_human_frequency_or_proof",
    inputDigests: { [frameName]: sha(thirdBytes), "d3262-maia-direct-logits.json": sha(directBytes),
      "d3262-maia-history-replay.json": sha(childBytes) }, rows };
  return { priorInputs, third, thirdBytes, final, finalBytes: bytes(final), direct, directBytes, child, childBytes };
}

test("three conditional prefixes compose literal path mass instead of per-node coverage", () => {
  const output = compileMaiaFourthPly(controls());
  for (const row of output.rows) {
    const eighty = row.arms.find((entry) => entry.arm === modelArms[0]);
    assert.ok(Math.abs(eighty.frontierMass - 0.81 ** 3) < 1e-12);
    assert.ok(Math.abs(eighty.twoLayerMass - 0.81 ** 2) < 1e-12);
    assert.ok(Math.abs(eighty.omittedThirdLayerMass - 0.81 ** 2 * 0.19) < 1e-12);
    assert.ok(Math.abs(eighty.omittedFirstLayerMass + eighty.omittedSecondLayerMass
      + eighty.omittedThirdLayerMass - eighty.residualMass) < 1e-12);
    assert.equal(eighty.selectedFourthPlyEdges, 1);
    assert.ok(eighty.omittedLegalFourthRepliesWithinSelectedNonterminalPaths > 0);
    assert.ok(Math.abs(row.arms.find((entry) => entry.arm === modelArms[1]).frontierMass - 1) < 1e-12);
    assert.ok(!("proof" in row));
  }
});

test("same-FEN paths retain distinct model sources and four-ply histories", () => {
  const output = compileMaiaFourthPly(controls());
  const pair = output.paths.filter((path) => path.historyUci[1] === "g8f6"
    && path.historyUci.includes("g1f3") && path.historyUci.includes("b1c3"));
  assert.equal(pair.length, 2);
  assert.equal(pair[0].fen, pair[1].fen);
  assert.notEqual(pair[0].source.row, pair[1].source.row);
  assert.notDeepEqual(pair[0].historyUci, pair[1].historyUci);
  for (const path of pair) for (const arm of path.arms) for (const entry of arm.selected) {
    const leaf = output.leaves.find((row) => row.id === entry.leafId);
    assert.deepEqual(leaf.historyUci.slice(0, 3), path.historyUci);
    assert.equal(leaf.historyUci[3], entry.moveUci);
  }
});

test("crossed bytes, histories, configuration, mass and population fail before publication", () => {
  for (const [mutate, pattern, updateFinalBytes = true] of [
    [(input) => { input.priorInputs[4][0].rows[0].configuredSupport[0].mass = 0.9; }, /support or normalized mass/u],
    [(input) => { input.third.rows.pop(); }, /earlier provider frame/u],
    [(input) => { input.final.rows[0].historyUci.reverse(); }, /Crossed Maia path/u],
    [(input) => { input.final.source.band = 1500; }, /Partial or crossed/u],
    [(input) => { input.final.rows.pop(); }, /learner path/u],
    [(input) => { input.final.rows[0].configuredSupport[0].mass = 2; }, /Invalid configured/u],
    [(input) => { input.final.rows[0].terminal = true; input.final.rows[0].terminalReason = "CHECKMATE";
      input.final.rows[0].rawFullLegal = []; input.final.rows[0].configuredSupport = []; }, /terminal contradicts/u],
    [(input) => { input.final.rows[0].elapsedMs = -1; }, /query timing/u],
    [(input) => { input.final.rows[0].elapsedMs = 2; }, /literal final source bytes/u, false],
  ]) {
    const input = controls(); mutate(input);
    if (updateFinalBytes) input.finalBytes = bytes(input.final);
    assert.throws(() => compileMaiaFourthPly(input), pattern);
  }
});

test("a terminal root absorbs policy mass without inventing a universal proof or a future move", () => {
  const prior = fixture();
  prior[0].roots = [{ rootId: "mate", fen: "7k/5Q2/5K2/8/8/8/8/8 w - - 0 1", phase: "endgame",
    candidates: [{ moveUci: "f7g7" }] }];
  prior[1].rows = [{ rootId: "mate", candidateUci: "f7g7", legalReplyCount: 0, replies: [] }];
  prior[2].bindings = [];
  for (const source of prior[4]) source.rows = [];
  const output = compileMaiaFourthPly(controls(prior));
  assert.equal(output.paths.length, 0);
  assert.equal(output.leaves.length, 0);
  assert.ok(output.rows[0].arms.every((arm) => arm.frontierMass === 1 && arm.stoppedAtReplyMass === 1
    && arm.residualMass === 0 && arm.selectedFourthPlyEdges === 0));
  assert.ok(!("proof" in output));
});

test("all real final model histories join with board-terminal absorption and complete phase population", () => {
  const input = loadFourthPlyInputs(), output = compileMaiaFourthPly(input);
  assert.equal(output.rows.length, 193);
  assert.equal(output.paths.length, 1401);
  assert.deepEqual(new Set(output.paths.map((row) => row.id)), new Set(input.final.rows.map((row) => row.id)));
  assert.deepEqual(new Set(output.rows.map((row) => row.phase)), new Set(input.third.rows.map((row) => row.phase)));
  const terminals = output.paths.filter((path) => path.terminalReason !== null);
  assert.equal(terminals.length, 1);
  assert.equal(terminals[0].terminalReason, "INSUFFICIENT_MATERIAL");
  assert.equal(terminals[0].legalReplyCount, 7);
  assert.ok(terminals[0].arms.every((arm) => arm.coveredConditionalMass === 1 && arm.selected.length === 0
    && arm.omittedPathMass === 0 && arm.unexpandedTerminalLegalMoves === 7));
  for (const row of output.rows) for (const arm of row.arms) {
    assert.ok(arm.frontierMass <= arm.twoLayerMass + 1e-5);
    assert.ok(Math.abs(arm.omittedFirstLayerMass + arm.omittedSecondLayerMass
      + arm.omittedThirdLayerMass - arm.residualMass) < 1e-5);
  }
});
