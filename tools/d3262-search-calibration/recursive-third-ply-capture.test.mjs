import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { captureScope, loadRecursiveCaptureFrame, mergeRecursiveCaptures, validateRecursiveCapture } from "./recursive-third-ply-capture.mjs";
import { sha } from "./third-ply-source-check.mjs";

const { frame, bytes } = loadRecursiveCaptureFrame();
test("normal Make preflight executes the source tests with the pinned interpreter", () => {
  const make = readFileSync("Makefile", "utf8");
  assert.match(make, /semantic-search-recursive-source-test: semantic-search-recursive-build\n\t\$\(CI_NODE\) --test tools\/d3262-search-calibration\/recursive-third-ply-capture\.test\.mjs/u);
  assert.match(make, /semantic-search-recursive-source-preflight: semantic-search-recursive-source-test/u);
});
function fixture(start = 0) {
  // Invented scores only exercise the source boundary; never save as evidence.
  const job = frame.engineJobs[start];
  const legal = legalMoves(Chess.fromSetup(parseFen(job.fen).unwrap()).unwrap()).map((entry) => entry.uci);
  const entries = legal.slice(0, 8).map((moveUci, i) => ({ moveUci, rank: i + 1, depth: 8,
    score: { kind: "cp", value: 0, bound: false }, pv: [moveUci] }));
  return { version: 1, manifest: frame.manifest, frontierDigest: sha(bytes), captureScope,
    start, positions: 1, partial: true, source: { ...frame.finalPlyQueries.stockfish },
    rows: [{ jobId: job.id, fen: job.fen, budgets: [...job.budgets], probes: job.budgets.map((budget) => ({
      budget, legal, entries, missingMoves: legal.slice(8), terminal: false, coherentDepth: 8,
      trailingPartialDepth: null, bestmove: entries[0].moveUci, elapsedMs: 1 })) }] };
}
test("recursive capture takes the independently replayed frozen missing-query population only", () => {
  assert.equal(frame.engineJobs.length, 418);
  assert.equal(frame.engineJobs.reduce((sum, job) => sum + job.budgets.length, 0), 958);
  assert.equal(chunkPlan(frame.engineJobs.length).length, 17);
  assert.ok(frame.engineJobs.some((job) => job.budgets.length < 3));
  assert.equal(validateRecursiveCapture(frame, bytes, fixture(), { start: 0, count: 1 }).positions, 1);
});
test("recursive scope, identity, ranks, legal/PV, timing, interval and budget corruptions refuse", () => {
  for (const [mutate, pattern] of [
    [(value) => { value.captureScope = "semantic_third_ply_missing_budgets_only"; }, /scope/u],
    [(value) => { value.frontierDigest = "changed"; }, /frontier/u],
    [(value) => { value.partial = false; }, /mislabelled/u],
    [(value) => { value.source.executableDigest = "changed"; }, /binary/u],
    [(value) => { value.source.hiddenOption = true; }, /query identity/u],
    [(value) => { value.rows[0].probes[0].legal.pop(); }, /denominator/u],
    [(value) => { value.rows[0].probes[0].entries[0].pv.push("a1a1"); }, /Illegal.*PV/u],
    [(value) => { value.rows[0].probes[0].entries[0].rank = 0; }, /rank/u],
    [(value) => { value.rows[0].probes[0].elapsedMs = -1; }, /timing/u],
    [(value) => { value.rows[0].probes[0].bestmove = "a1a1"; }, /bestmove/u],
    [(value) => { value.rows[0].probes.pop(); }, /budgets/u],
  ]) { const value = fixture(); mutate(value); assert.throws(() => validateRecursiveCapture(frame, bytes, value), pattern); }
  assert.throws(() => validateRecursiveCapture(frame, bytes, fixture(), { start: 1, count: 1 }), /interval/u);
});
test("recursive intervals cannot present a prefix as complete or cross interval names", () => {
  assert.throws(() => mergeRecursiveCaptures(frame, bytes, []), /Incomplete/u);
  const smallFrame = { ...frame, engineJobs: [frame.engineJobs[0]] }, smallBytes = Buffer.from(JSON.stringify(smallFrame));
  const capture = fixture(); capture.partial = false; capture.frontierDigest = sha(smallBytes);
  const chunk = { file: chunkPlan(1)[0].file, bytes: Buffer.from(JSON.stringify(capture)) };
  const merged = mergeRecursiveCaptures(smallFrame, smallBytes, [chunk]);
  assert.equal(merged.artifact.partial, false);
  assert.equal(merged.artifact.captureScope, captureScope);
  assert.deepEqual(merged.artifact.rows, capture.rows);
  assert.equal(merged.artifact.chunkDigests[0].sha256, sha(chunk.bytes));
  assert.throws(() => mergeRecursiveCaptures(smallFrame, smallBytes, [{ ...chunk, file: "changed" }]), /crossed.*interval/u);
});
