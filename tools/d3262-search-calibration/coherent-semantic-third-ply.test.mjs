import assert from "node:assert/strict";
import { test } from "node:test";
import { compileSemanticThirdPly, loadSemanticThirdPlyInputs, arms } from "./coherent-semantic-third-ply.mjs";
import { enumerateCandidate, legalMoves } from "./exact-reply-enumeration.mjs";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";

const inputs = loadSemanticThirdPlyInputs();
let artifact;
const output = () => artifact ??= compileSemanticThirdPly(...inputs);

test("the frozen first-reply reserve follows actual same-budget/width learner ranks", () => {
  const value = output();
  assert.equal(value.rows.length, 182);
  assert.equal(value.candidateCoverage.length, 193);
  assert.equal(value.rows.filter((row) => row.sourceObserved).length, 96);
  assert.equal(value.rows.filter((row) => !row.sourceObserved).length, 86);
  assert.ok(value.rows.every((row) => row.arms.length === 18));
  assert.equal(value.controls.length, 4);
  assert.ok(value.candidateCoverage.filter((row) => row.rootId === "quiet-plan:carlsbad-nf8")
    .every((row) => row.status === "no_autonomous_semantic_target" && row.targetIds.length === 0));
  assert.ok(value.candidateCoverage.some((row) => row.status === "declared_control_separate_not_evaluated"));
  for (const row of value.rows) for (const reply of row.replies) for (const arm of reply.arms) {
    const [, budget, top] = arm.arm.split(":"), width = Number(top.slice(3));
    const capture = inputs[5][reply.sourceBinding.source].rows[reply.sourceBinding.row];
    const expected = reply.terminalReason === null ? capture.probes.find((probe) => probe.budget === budget).entries.slice(0, width) : [];
    assert.deepEqual(arm.selected.map((entry) => entry.learnerUci), expected.map((entry) => entry.moveUci));
    assert.equal(arm.unvisitedLegal, reply.legalLearnerCount - expected.length);
  }
  assert.match(value.authority, /not_recursive_semantic_arm_or_proof/u);
  assert.ok(value.rows.every((row) => row.arms.every((arm) => arm.universalVerdict === "not_evaluated")));
});

test("actual subjects retain target, phase, path identity and explicit source omissions", () => {
  const value = output(), paths = new Map(value.paths.map((path) => [path.id, path]));
  assert.equal(paths.size, value.paths.length);
  for (const row of value.rows) for (const arm of row.arms) for (const id of arm.selectedLearnerPaths) {
    const path = paths.get(id);
    assert.equal(path.rootId, row.rootId);
    assert.equal(path.historyUci[0], row.candidateUci);
    assert.ok(path.subjects.some((subject) => subject.targetId === row.targetId && subject.selectedBy.includes(arm.arm)));
  }
  assert.deepEqual(new Set(value.rows.map((row) => row.phase)), new Set(inputs[0].comparisons.map((pair) =>
    inputs[1].roots.find((root) => root.rootId === pair.rootId).phase)));
  assert.ok(value.rows.some((row) => row.arms.some((arm) => arm.unvisitedReplies > 0
    && arm.unvisitedLearnerEdgesWithinSelectedReplies > 0)));
  assert.ok(value.paths.every((path) => path.historyUci.length === 3 && path.subjects.every((subject) =>
    subject.selectedBy.every((arm) => arms.includes(arm)))));
});

test("planned FEN/budget reuse is not a captured source and missing budgets remain jobs", () => {
  const value = output(), prior = new Map(inputs[6].engineJobs.map((job) => [job.fen, job]));
  assert.ok(value.engineJobs.some((job) => job.plannedReuse.length));
  for (const job of value.engineJobs) {
    assert.deepEqual(new Set(job.budgets), new Set([...job.plannedReuse.map((row) => row.budget), ...job.missingBudgets]));
    for (const reuse of job.plannedReuse) {
      assert.equal(reuse.sourceStatus, "awaiting_complete_checked_capture");
      assert.equal(reuse.jobId, prior.get(job.fen).id);
      assert.ok(prior.get(job.fen).budgets.includes(reuse.budget));
    }
    assert.deepEqual(job.missingBudgets, job.budgets.filter((budget) => !prior.get(job.fen)?.budgets.includes(budget)));
  }
  assert.deepEqual(value.supplementJobs.map((job) => job.id), value.engineJobs.filter((job) => job.missingBudgets.length).map((job) => job.id));
});

test("changed cells, reserve variants, source bytes and illegal selected replies refuse", () => {
  for (const [mutate, expected] of [
    [(value) => { value[0].comparisons.pop(); }, /population/u],
    [(value) => { value[2].rows.pop(); }, /population/u],
    [(value) => { value[7]["d3262-stockfish-horizon4-capture.json"] = "changed"; }, /source digest/u],
    [(value) => { value[2].rows[0].selected[0] = "a1a8"; }, /first-reply selection/u],
    [(value) => { value[2].rows[0].selected[1] = value[2].rows[0].selected[0]; }, /first-reply selection/u],
    [(value) => { value[5]["d3262-stockfish-horizon4-capture.json"].source.multiPv = "all_legal"; }, /query identity/u],
  ]) {
    const changed = structuredClone(inputs); mutate(changed);
    assert.throws(() => compileSemanticThirdPly(...changed), expected);
  }
});

test("actual consumed source bindings and incoherent engine ranks cannot be substituted", () => {
  const first = output().rows[0].replies[0].sourceBinding;
  for (const [mutate, expected] of [
    [(value) => { value[5][first.source].rows[first.row].fen = "crossed"; }, /provider source/u],
    [(value) => { value[5][first.source].rows[first.row].probes[0].entries[0].depth = -1; }, /coherent engine ranks/u],
    [(value) => { value[5][first.source].rows[first.row].probes[0].entries[0].pv.push("a1a8"); }, /Illegal path/u],
  ]) {
    const changed = structuredClone(inputs); mutate(changed);
    assert.throws(() => compileSemanticThirdPly(...changed), expected);
  }
});

test("an actual opponent mate absorbs its branch without a fictitious learner reply or universal target proof", () => {
  // Explicit synthetic legality/source-shape fixture, not a provider capture.
  const manifest = "synthetic-terminal-not-provider-data";
  const fen = "rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2";
  const graph = enumerateCandidate(fen, "g2g4");
  const selected = ["d8h4", ...graph.replies.map((row) => row.uci).filter((uci) => uci !== "d8h4")].slice(0, 8);
  const comparison = { profile: "d3262-coherent-target-comparison-v1", manifest, rootFrameDigest: "synthetic-root",
    controls: [], definitions: [{ id: "target", rootId: "root", family: "material" }],
    comparisons: [{ rootId: "root", candidateUci: "g2g4", targetId: "target", sourceObserved: false }] };
  const frame = { profile: "d3262-coherent-root-v1", manifest,
    roots: [{ rootId: "root", fen, phase: "opening", candidates: [{ moveUci: "g2g4" }] }] };
  const identity = { engineName: "synthetic", executableDigest: "synthetic", threads: 1, hashMb: 16,
    scorePerspective: "raw_uci_uninterpreted", multiPv: "top8_legal_moves_at_selected_reply" };
  const sourceNames = ["d3262-stockfish-horizon4-capture.json", "d3262-stockfish-coherent-deeper-supplement.json", "d3262-stockfish-coherent-semantic-supplement.json"];
  const sources = Object.fromEntries(sourceNames.map((name) => [name, { manifest, source: identity, rows: [] }]));
  const provider = { profile: "d3262-coherent-deeper-source-union-v1", manifest, inputDigests: {}, bindings: [] };
  const semantic = { profile: "d3262-coherent-semantic-source-union-v1", manifest, inputDigests: {}, bindings: [] };
  const digests = { "d3262-coherent-root-frame.json": "synthetic-root" };
  sourceNames.forEach((name, index) => { digests[name] = "synthetic-" + index;
    (index === 2 ? semantic : provider).inputDigests[name] = digests[name]; });
  for (const [index, uci] of selected.entries()) {
    const reply = graph.replies.find((row) => row.uci === uci);
    const legal = legalMoves(Chess.fromSetup(parseFen(reply.fen).unwrap()).unwrap()).map((row) => row.uci);
    sources[sourceNames[0]].rows.push({ fen: reply.fen, probes: ["depth8", "depth12", "movetime100"].map((budget) => ({
      budget, legal, coherentDepth: 8, entries: legal.slice(0, 8).map((moveUci, rank) => ({ moveUci, rank: rank + 1, depth: 8, pv: [moveUci] })), missingMoves: legal.slice(8),
    })) });
    provider.bindings.push({ rootId: "root", candidateUci: "g2g4", replyUci: uci, fen: reply.fen,
      stockfish: { source: sourceNames[0], row: index } });
  }
  const reserve = { profile: "d3262-coherent-semantic-reserve-v1", manifest,
    rows: arms.map((arm) => { const [, budget, top, eventSourceWidth] = arm.split(":"), width = Number(top.slice(3));
      return { ...comparison.comparisons[0], family: "material", budget, width, eventSourceWidth, selected: selected.slice(0, width) }; }) };
  const prior = { profile: "d3262-coherent-third-ply-v1", manifest, engineJobs: [], finalPlyQueries: { stockfish: identity } };
  const value = compileSemanticThirdPly(comparison, frame, reserve, provider, semantic, sources, prior, digests,
    { cells: 1, targets: 1, roots: 1, candidates: 1 });
  assert.ok(value.rows[0].arms.every((arm) => arm.absorbingReplyUcis.includes("d8h4") && arm.universalVerdict === "not_evaluated"));
  assert.ok(value.paths.every((path) => path.historyUci[1] !== "d8h4"));
  assert.equal(value.rows[0].replies.find((reply) => reply.replyUci === "d8h4").terminalReason, "CHECKMATE");
});
