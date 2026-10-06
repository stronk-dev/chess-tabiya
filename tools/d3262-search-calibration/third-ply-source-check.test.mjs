import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { chunkPlan } from "./stockfish-horizon4-batch.mjs";
import { mergeThirdPlyCaptures } from "./third-ply-stockfish-merge.mjs";
import { validatePlannedInterval } from "./third-ply-stockfish-batch.mjs";
import { directory, frameName, loadFrozenThirdPlyFrame, sha, validateThirdPlyMaia, validateThirdPlyStockfish } from "./third-ply-source-check.mjs";

const { frame, bytes } = loadFrozenThirdPlyFrame();
const start = frame.engineJobs.findIndex((job) => job.budgets.length === 1);
function engineFixture() {
  const job = frame.engineJobs[start], legal = legalMoves(Chess.fromSetup(parseFen(job.fen).unwrap()).unwrap()).map((entry) => entry.uci);
  const entries = legal.slice(0, 8).map((moveUci, i) => ({ moveUci, rank: i + 1, depth: 8,
    score: { kind: "cp", value: 0, bound: false }, pv: [moveUci] }));
  return { version: 1, manifest: frame.manifest, frontierDigest: sha(bytes), start, positions: 1, partial: true,
    source: { ...frame.finalPlyQueries.stockfish }, rows: [{ jobId: job.id, fen: job.fen, budgets: [...job.budgets],
      probes: job.budgets.map((budget) => ({ budget, legal, entries, missingMoves: legal.slice(8), terminal: false,
        coherentDepth: 8, trailingPartialDepth: null, bestmove: entries[0].moveUci, elapsedMs: 1 })) }] };
}

test("per-position requested budgets are retained without silently executing all three", () => {
  const capture = engineFixture();
  const checked = validateThirdPlyStockfish(frame, bytes, capture);
  assert.equal(checked.positions, 1);
  assert.equal(capture.rows[0].probes.length, 1);
  assert.ok(checked.rankedMoves <= 8);
  const extra = structuredClone(capture);
  extra.rows[0].probes.push({ ...extra.rows[0].probes[0], budget: "undeclared" });
  assert.throws(() => validateThirdPlyStockfish(frame, bytes, extra), /Missing Stockfish budgets/u);
});

test("interval extent, source width, coherent ranks, PV and timing mutations refuse", () => {
  for (const [mutate, pattern] of [
    [(capture) => { capture.partial = false; }, /mislabelled/u],
    [(capture) => { capture.frontierDigest = "changed"; }, /Crossed frontier/u],
    [(capture) => { capture.version = 2; }, /Crossed frontier/u],
    [(capture) => { capture.source.multiPv = "all_legal"; }, /Stockfish source/u],
    [(capture) => { capture.source.executableDigest = "other-binary"; }, /Stockfish binary/u],
    [(capture) => { capture.rows[0].probes[0].entries[0].depth = 9; }, /Mixed Stockfish/u],
    [(capture) => { capture.rows[0].probes[0].entries[0].pv.push("a1a1"); }, /Illegal Stockfish PV/u],
    [(capture) => { capture.rows[0].probes[0].elapsedMs = NaN; }, /query timing/u],
    [(capture) => { capture.rows[0].budgets.push("undeclared"); }, /requested Stockfish budgets/u],
  ]) {
    const capture = engineFixture(); mutate(capture);
    assert.throws(() => validateThirdPlyStockfish(frame, bytes, capture), pattern);
  }
  assert.throws(() => validatePlannedInterval(frame, bytes, { start: start + 1, count: 1, file: "wrong" }, engineFixture()), /Crossed planned interval/u);
});

test("resumable queue is complete and a checked subset cannot merge as a full source", () => {
  const plan = chunkPlan(frame.engineJobs.length);
  assert.equal(plan.length, 673);
  assert.equal(plan.reduce((sum, row) => sum + row.count, 0), 16813);
  assert.equal(plan.at(-1).start + plan.at(-1).count, 16813);
  assert.throws(() => mergeThirdPlyCaptures(frame, bytes, []), /Incomplete third-ply/u);
  assert.throws(() => mergeThirdPlyCaptures(frame, bytes, Array.from({ length: plan.length }, () => ({ file: "wrong" }))), /crossed third-ply interval/u);
});

test("complete synthetic interval merge preserves literal provider rows and chronology", () => {
  const job = frame.engineJobs[start];
  const smallFrame = { ...frame, engineJobs: [job] }, smallBytes = Buffer.from(JSON.stringify(smallFrame));
  const capture = engineFixture();
  capture.start = 0;
  capture.partial = false;
  capture.frontierDigest = sha(smallBytes);
  const plan = chunkPlan(1);
  const input = { file: plan[0].file, bytes: Buffer.from(JSON.stringify(capture)) };
  const merged = mergeThirdPlyCaptures(smallFrame, smallBytes, [input]);
  assert.equal(merged.artifact.partial, false);
  assert.deepEqual(merged.artifact.rows, capture.rows);
  assert.equal(merged.artifact.chunkDigests[0].sha256, sha(input.bytes));
  assert.equal(merged.summary.positions, 1);
});

test("all research model entrypoints use the actual packaged offline checkpoint", () => {
  const runtime = readFileSync("tools/d3262-search-calibration/maia_capture_runtime.py", "utf8");
  const checkpoint = /CHECKPOINT_PATH = "([^"]+)"/u.exec(runtime)?.[1];
  assert.equal(checkpoint, "/opt/maia3-models/maia3-5m.pt");
  assert.ok(readFileSync("workers/maia/Dockerfile", "utf8").includes(`"--checkpoint-path", "${checkpoint}"`));
  assert.ok(runtime.includes('"--local-files-only"'));
  for (const name of ["maia-horizon4-path-capture", "maia-coherent-new-child", "maia-history-replay", "maia-logit-validation"]) {
    const code = readFileSync(`tools/d3262-search-calibration/${name}.py`, "utf8");
    assert.ok(code.includes("cfg = pinned_cfg()"), name);
    assert.ok(code.includes("from maia_capture_runtime import pinned_cfg"), name);
    assert.ok(!code.includes("cfg = parse_args(["), name);
  }
});

const directBytes = readFileSync(`${directory}/d3262-maia-direct-logits.json`);
const childBytes = readFileSync(`${directory}/d3262-maia-history-replay.json`);
const direct = JSON.parse(directBytes), child = JSON.parse(childBytes);
const maiaBytes = readFileSync(`${directory}/d3262-maia-third-ply-capture.json`);
const maia = JSON.parse(maiaBytes);
const verifyMaia = (capture) => validateThirdPlyMaia(frame, bytes, direct, directBytes, child, childBytes, capture);

test("real pinned model capture binds every final-ply history, terminal and legal distribution", () => {
  const checked = verifyMaia(maia);
  assert.equal(checked.positions, 1401);
  assert.equal(checked.uniqueFens, 1384);
  assert.equal(checked.terminal, 1);
  assert.equal(checked.legalMoves, 47052);
  assert.equal(checked.configuredSupport, 5275);
  assert.equal(maia.inputDigests[frameName], sha(bytes));
});

test("real Maia capture rejects source changes, learner-history swaps, illegal mass and false completion", () => {
  for (const [mutate, pattern] of [
    [(capture) => { capture.partial = true; }, /Partial or crossed/u],
    [(capture) => { capture.source.band = 1500; }, /Partial or crossed/u],
    [(capture) => { capture.rows[0].learnerUci = "a1a1"; }, /Crossed learner/u],
    [(capture) => { capture.rows[0].historyUci.reverse(); }, /Crossed Maia path/u],
    [(capture) => { capture.rows[0].configuredSupport[0].mass = 2; }, /Invalid configured Maia/u],
    [(capture) => { capture.inputDigests[frameName] = "changed"; }, /source digest mismatch/u],
  ]) {
    const capture = structuredClone(maia); mutate(capture);
    assert.throws(() => verifyMaia(capture), pattern);
  }
});
