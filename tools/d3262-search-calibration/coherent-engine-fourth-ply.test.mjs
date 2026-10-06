import assert from "node:assert/strict";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { frameName, sha } from "./third-ply-source-check.mjs";
import { arms as semanticArms } from "./coherent-semantic-third-ply.mjs";
import { captureScope } from "./semantic-third-ply-capture.mjs";
import { compileEngineFourthPly, engineArms } from "./coherent-engine-fourth-ply.mjs";

// Explicit synthetic source-shape/legality controls; none are engine observations.
const raw = (value) => Buffer.from(JSON.stringify(value));
function synthetic(withTerminal = false) {
  const source = { engineName: "synthetic", executableDigest: "synthetic", threads: 1, hashMb: 16,
    multiPv: "top8_legal_moves_at_selected_third_ply", scorePerspective: "raw_uci_uninterpreted" };
  const makePath = (rootId, rootFen, historyUci) => {
    const board = Chess.fromSetup(parseFen(rootFen).unwrap()).unwrap();
    historyUci.forEach((uci) => board.play(normalizeMove(board, parseUci(uci))));
    return { id: sha(JSON.stringify([rootId, ...historyUci])), rootId, rootFen, historyUci,
      fen: makeFen(board.toSetup()), legalReplyCount: legalMoves(board).length,
      selectedBy: engineArms.filter((arm) => !arm.includes("movetime100")) };
  };
  const path = makePath("knights", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", ["g1f3", "g8f6", "b1c3"]);
  const paths = [path];
  if (withTerminal) paths.push(makePath("material", "7k/8/8/8/8/1n6/8/2B4K w - - 0 1", ["c1b2", "b3d4", "b2d4"]));
  const third = { version: 1, manifest: "synthetic-not-provider-evidence", profile: "d3262-coherent-third-ply-v1", authority: "synthetic",
    finalPlyQueries: { stockfish: source }, paths,
    rows: paths.map((item) => ({ rootId: item.rootId, candidateUci: item.historyUci[0], phase: "synthetic", arms: engineArms.map((arm) => ({ arm })) })),
    engineJobs: paths.map((item) => ({ id: sha(item.fen), fen: item.fen, paths: [item.id], budgets: ["depth12", "depth8"] })) };
  const thirdBytes = raw(third);
  const job = { id: sha(path.fen), fen: path.fen, paths: [path.id], budgets: ["depth12", "depth8", "movetime100"],
    plannedReuse: ["depth12", "depth8"].map((budget) => ({ frame: frameName, jobId: sha(path.fen), budget, sourceStatus: "awaiting_complete_checked_capture" })),
    missingBudgets: ["movetime100"] };
  const semanticPath = { ...path, terminalReason: null, subjects: [{ targetId: "named", selectedBy: semanticArms }] };
  delete semanticPath.selectedBy;
  const semantic = { version: 1, manifest: third.manifest, profile: "d3262-coherent-semantic-third-ply-v1", authority: "synthetic",
    finalPlyQueries: { stockfish: source }, inputDigests: { [frameName]: sha(thirdBytes) }, arms: semanticArms,
    paths: [semanticPath], rows: [{ rootId: path.rootId, candidateUci: path.historyUci[0], targetId: "named",
      arms: semanticArms.map((arm) => ({ arm, selectedLearnerPaths: [path.id] })) }],
    engineJobs: [job], supplementJobs: [{ ...job, budgets: job.missingBudgets }],
    candidateCoverage: [{ status: "synthetic_named_target" }], controls: [{ status: "synthetic_control" }] };
  const semanticBytes = gzipSync(raw(semantic));
  const capture = (jobs, bytes, scope) => ({ version: 1, manifest: third.manifest, source: { ...source }, frontierDigest: sha(bytes), start: 0,
    positions: jobs.length, partial: false, ...(scope ? { captureScope: scope } : {}),
    rows: jobs.map((item) => {
      const legal = legalMoves(Chess.fromSetup(parseFen(item.fen).unwrap()).unwrap()).map((entry) => entry.uci);
      return { jobId: item.id, fen: item.fen, budgets: item.budgets, probes: item.budgets.map((budget) => ({ budget, legal, terminal: false,
        entries: legal.slice(0, 8).map((moveUci, i) => ({ moveUci, rank: i + 1, depth: 8, pv: [moveUci], score: { kind: "cp", value: 0, bound: false } })),
        missingMoves: legal.slice(8), coherentDepth: 8, trailingPartialDepth: null, bestmove: legal[0], elapsedMs: 1 })) };
    }) });
  const final = capture(third.engineJobs, thirdBytes), supplement = capture(semantic.supplementJobs, semanticBytes, captureScope);
  return { third, thirdBytes, final, finalBytes: gzipSync(raw(final)), semantic, semanticBytes, supplement, supplementBytes: gzipSync(raw(supplement)) };
}
function refresh(input) {
  input.thirdBytes = raw(input.third);
  input.semantic.inputDigests[frameName] = sha(input.thirdBytes);
  input.final.frontierDigest = sha(input.thirdBytes);
  input.semanticBytes = gzipSync(raw(input.semantic));
  input.supplement.frontierDigest = sha(input.semanticBytes);
  input.finalBytes = gzipSync(raw(input.final)); input.supplementBytes = gzipSync(raw(input.supplement));
}

test("actual full FEN/budget joins resolve planned reuse and the separate supplement", () => {
  const input = synthetic(), output = compileEngineFourthPly(input);
  assert.equal(output.resolvedReuseQueries, 2); assert.equal(output.resolvedSupplementQueries, 1);
  assert.equal(output.unusedQueries.length, 0);
  assert.equal(output.profiles[0].rows.length, 1); assert.equal(output.profiles[1].rows.length, 1);
  for (const profile of output.profiles) for (const path of profile.paths) for (const arm of path.arms) {
    const width = Number(arm.arm.split(":")[2].slice(3));
    assert.equal(arm.selected.length, width);
    assert.equal(arm.omittedLegal, path.legalReplyCount - width);
    assert.equal(arm.source.budget, arm.arm.split(":")[1]);
    for (const selected of arm.selected) {
      const leaf = output.leaves.find((item) => item.id === selected.leafId);
      assert.deepEqual(leaf.historyUci, [...path.historyUci, selected.moveUci]);
    }
  }
  assert.match(output.profiles[1].traversalRule, /no_recursive_semantic_selector/u);
  assert.ok(output.profiles.every((profile) => profile.rows.every((row) => row.arms.every((arm) =>
    arm.universalVerdict === "not_evaluated" && arm.negativeVerdict === "abstain_partial" && !Object.hasOwn(arm, "mass")))));
});

test("legal moves on an automatic material terminal are captured but never expanded", () => {
  const output = compileEngineFourthPly(synthetic(true)), terminal = output.profiles[0].paths.find((path) => path.rootId === "material");
  assert.equal(terminal.terminalReason, "INSUFFICIENT_MATERIAL");
  assert.ok(terminal.legalReplyCount > 0);
  assert.ok(terminal.arms.every((arm) => arm.selected.length === 0 && arm.source === null && arm.omittedLegal === 0
    && arm.unexpandedTerminalLegalMoves === terminal.legalReplyCount));
  assert.equal(output.unusedQueries.length, 2);
  assert.ok(output.unusedQueries.every((query) => query.reason === "absorbed_game_terminal"));
});

test("a checked interval, crossed source bytes, ranks, budget or planned job cannot pass as complete traversal", () => {
  for (const [mutate, pattern, rewrite = true] of [
    [(input) => { input.final.partial = true; }, /Incomplete actual/u],
    [(input) => { input.final.rows.pop(); }, /capture interval/u],
    [(input) => { input.final.source.executableDigest = "changed"; }, /Stockfish binary/u],
    [(input) => { input.final.rows[0].probes[0].entries[0].depth = 9; }, /Mixed Stockfish/u],
    [(input) => { input.final.rows[0].probes[0].entries[0].pv.push("a1a8"); }, /Illegal Stockfish/u],
    [(input) => { input.semantic.engineJobs[0].plannedReuse[0].jobId = "changed"; }, /Planned semantic reuse/u],
    [(input) => { input.supplement.rows[0].probes[0].budget = "depth8"; }, /budget\/terminal/u],
    [(input) => { input.final.rows[0].probes[0].elapsedMs = 2; }, /literal continuation/u, false],
    [(input) => { input.semantic.rows[0].arms[0].selectedLearnerPaths = []; }, /subject\/path/u],
  ]) {
    const input = synthetic(); mutate(input); if (rewrite) refresh(input);
    assert.throws(() => compileEngineFourthPly(input), pattern);
  }
});

test("legal but outcome-terminal ancestor histories refuse instead of inventing continuation", () => {
  const input = synthetic(true), path = input.third.paths[1];
  path.rootFen = path.fen; path.historyUci = ["h8g8", "d4e5", "g8h8"];
  path.id = sha(JSON.stringify([path.rootId, ...path.historyUci])); refresh(input);
  assert.throws(() => compileEngineFourthPly(input), /ancestor game terminal/u);
});
