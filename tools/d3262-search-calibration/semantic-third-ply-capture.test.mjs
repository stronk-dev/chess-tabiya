import assert from "node:assert/strict";
import { test } from "node:test";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { CoherentEngineQuery, parseCoherentQuery } from "./coherent-engine-query.mjs";
import { captureScope, loadSemanticCaptureFrame, mergeSemanticCaptures, validateSemanticCapture } from "./semantic-third-ply-capture.mjs";
import { sha } from "./third-ply-source-check.mjs";

const root = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const moves = legalMoves(Chess.fromSetup(parseFen(root).unwrap()).unwrap()).map((entry) => entry.uci);
const lines = () => [...moves.slice(0, 8).map((move, i) => `info depth 8 multipv ${i + 1} score cp ${i} pv ${move}`), `bestmove ${moves[0]}`];
const { frame, bytes } = loadSemanticCaptureFrame();
function fixture(start = 0) {
  // Source-shape control with invented zero scores, never published as a source.
  const job = frame.engineJobs[start], pos = Chess.fromSetup(parseFen(job.fen).unwrap()).unwrap();
  const legal = legalMoves(pos).map((entry) => entry.uci);
  const entries = legal.slice(0, 8).map((moveUci, i) => ({ moveUci, rank: i + 1, depth: 8,
    score: { kind: "cp", value: 0, bound: false }, pv: [moveUci] }));
  return { version: 1, manifest: frame.manifest, frontierDigest: sha(bytes), captureScope,
    start, positions: 1, partial: true, source: { ...frame.finalPlyQueries.stockfish },
    rows: [{ jobId: job.id, fen: job.fen, budgets: [...job.budgets], probes: job.budgets.map((budget) => ({
      budget, legal, entries, missingMoves: legal.slice(8), terminal: false, coherentDepth: 8,
      trailingPartialDepth: null, bestmove: entries[0].moveUci, elapsedMs: 1 })) }] };
}
test("the new queue retains exactly the frozen missing budgets, not the live capture's population", () => {
  assert.equal(frame.engineJobs.length, 870);
  assert.equal(frame.engineJobs.reduce((sum, row) => sum + row.budgets.length, 0), 2028);
  assert.equal(chunkPlan(870).length, 35);
  assert.ok(frame.engineJobs.some((job) => job.budgets.length < 3));
  assert.equal(validateSemanticCapture(frame, bytes, fixture(), { start: 0, count: 1 }).positions, 1);
});
test("source identity, interval, legal/PV/rank/timing and missing-budget corruptions refuse", () => {
  for (const [mutate, pattern] of [
    [(value) => { value.captureScope = "complete_search"; }, /scope/u],
    [(value) => { value.frontierDigest = "changed"; }, /frontier/u],
    [(value) => { value.partial = false; }, /mislabelled/u],
    [(value) => { value.source.executableDigest = "changed"; }, /binary/u],
    [(value) => { value.source.multiPv = "all_legal"; }, /source/u],
    [(value) => { value.rows[0].probes[0].legal.pop(); }, /denominator/u],
    [(value) => { value.rows[0].probes[0].entries[0].pv.push("a1a1"); }, /Illegal.*PV/u],
    [(value) => { value.rows[0].probes[0].entries[0].depth++; }, /rank/u],
    [(value) => { value.rows[0].probes[0].elapsedMs = -1; }, /timing/u],
    [(value) => { value.rows[0].probes[0].bestmove = "a1a1"; }, /bestmove/u],
    [(value) => { value.source.hiddenOption = "undeclared"; }, /query identity/u],
    [(value) => { value.rows[0].probes.pop(); }, /budgets/u],
  ]) { const value = fixture(); mutate(value); assert.throws(() => validateSemanticCapture(frame, bytes, value), pattern); }
  assert.throws(() => validateSemanticCapture(frame, bytes, fixture(), { start: 1, count: 1 }), /interval/u);
});
test("a prefix cannot merge as complete; a complete synthetic population preserves rows and interval digests", () => {
  assert.throws(() => mergeSemanticCaptures(frame, bytes, []), /Incomplete/u);
  const smallFrame = { ...frame, engineJobs: [frame.engineJobs[0]] }, smallBytes = Buffer.from(JSON.stringify(smallFrame));
  const capture = fixture(); capture.partial = false; capture.frontierDigest = sha(smallBytes);
  const chunk = { file: chunkPlan(1)[0].file, bytes: Buffer.from(JSON.stringify(capture)) };
  const merged = mergeSemanticCaptures(smallFrame, smallBytes, [chunk]);
  assert.equal(merged.artifact.partial, false);
  assert.equal(merged.artifact.captureScope, captureScope);
  assert.deepEqual(merged.artifact.rows, capture.rows);
  assert.equal(merged.artifact.chunkDigests[0].sha256, sha(chunk.bytes));
  assert.throws(() => mergeSemanticCaptures(smallFrame, smallBytes, [{ ...chunk, file: "changed" }]), /crossed.*interval/u);
});
test("coherent UCI parsing keeps one complete depth and raw score bounds, not the latest mixed ranks", () => {
  const value = lines();
  value.splice(-1, 0, `info depth 12 multipv 1 score mate -2 lowerbound pv ${moves[0]}`);
  const parsed = parseCoherentQuery(root, value);
  assert.equal(parsed.coherentDepth, 8); assert.equal(parsed.trailingPartialDepth, 12);
  assert.ok(parsed.entries.every((entry) => entry.depth === 8 && entry.score.kind === "cp"));
  const mate = lines(); mate[0] = `info depth 8 multipv 1 score mate -2 lowerbound pv ${moves[0]}`;
  assert.deepEqual(parseCoherentQuery(root, mate).entries[0].score, { kind: "mate", value: -2, bound: true });
});
test("illegal engine root/PV, missing coherent ranks and illegal bestmove are not accepted", () => {
  for (const [mutate, pattern] of [
    [(value) => { value[0] = "info depth 8 multipv 1 score cp 0 pv a1a8"; }, /root/u],
    [(value) => { value[0] += " a1a1"; }, /PV/u],
    [(value) => { value.splice(0, 1); }, /coherent/u],
    [(value) => { value[value.length - 1] = "bestmove a1a8"; }, /bestmove/u],
  ]) { const value = lines(); mutate(value); assert.throws(() => parseCoherentQuery(root, value), pattern); }
});
test("synthetic UCI transport enforces reset/options/legal searchmoves for every declared budget", async () => {
  const engine = new CoherentEngineQuery(process.execPath, ["tools/d3262-search-calibration/coherent-engine-fixture.mjs"]);
  try {
    await engine.initialize(); assert.equal(engine.identity, "Synthetic transport fixture");
    for (const budget of ["depth8", "depth12", "movetime100"]) {
      const result = await engine.probe(root, budget);
      assert.equal(result.budget, budget); assert.deepEqual(result.legal, moves);
      assert.equal(result.entries.length, 8); assert.ok(Number.isFinite(result.elapsedMs));
    }
    await assert.rejects(engine.probe(root, "unregistered"), /Undeclared/u);
    await assert.rejects(engine.probe("8/8/8/8/8/8/4K3/6k1 w - - 0 1", "depth8"), /terminal/u);
  } finally { await engine.close(); }
  await engine.close();
});
test("early child failure is surfaced and teardown does not hang", async () => {
  const engine = new CoherentEngineQuery(process.execPath, ["tools/d3262-search-calibration/coherent-engine-fixture.mjs", "--fail"]);
  try { await assert.rejects(engine.initialize(), /exited early/u); } finally { await engine.close(); }
});
