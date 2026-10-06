import assert from "node:assert/strict";
import { test } from "node:test";
import { compileThirdPlyFrame, loadThirdPlyInputs, sourceNames } from "./coherent-third-ply-frame.mjs";
import { fixture } from "./coherent-provider-fixture.mjs";

// Shared explicitly synthetic source controls; no real provider observations.

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
