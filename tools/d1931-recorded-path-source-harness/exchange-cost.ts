// DISPOSABLE D3787 research: fresh-process, complete-result comparison of the actual compiler.
// No raw run/event dumps are written; no source/qualification or timing-budget changes.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { commitMove, createRun } from "../../packages/runtime/src/runtime.js";
import { recordedSemanticPathExecution } from "../../packages/runtime/src/recorded-semantic-path.js";
import { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES,
  RECORDED_ATTRACTION_FIVE, RECORDED_DEFLECTION_CHECK, RECORDED_CASTLING_ATTRACTION,
  RECORDED_CASTLING_CLEARANCE, RECORDED_CASTLING_DEFENDER } from "../../packages/runtime/src/testing/recorded-sequence-fixtures.js";

assert.match(process.version, /^v24\./u, "use the normal Make toolchain");
const baseline = "tools/dist/recorded-exchange-before.mjs";
if (process.argv[2] === "compare") {
  assert(!readFileSync(baseline).equals(readFileSync(process.argv[1]!)), "refuse comparing the same compiler bundle to itself");
  const pairs = [];
  for (const order of [[baseline, process.argv[1]!], [process.argv[1]!, baseline],
    [baseline, process.argv[1]!], [process.argv[1]!, baseline]]) {
    const measured = order.map(entry => ({ entry, result: JSON.parse(execFileSync(process.execPath, [entry, "measure"], { encoding: "utf8", timeout: 60_000 })) }));
    const before = measured.find(row => row.entry === baseline)!.result;
    const after = measured.find(row => row.entry !== baseline)!.result;
    for (const key of ["outputDigest", "paths", "edges", "events", "windows", "inputDigest"] as const) {
      assert.equal(after[key], before[key], `complete ${key} must match, not just event counts`);
    }
    pairs.push({ before, after, ratio: after.compilerMs / before.compilerMs });
    console.log(JSON.stringify({ pair: pairs.length, beforeMs: before.compilerMs, afterMs: after.compilerMs,
      ratio: pairs.at(-1)!.ratio, paths: after.paths, edges: after.edges, completeResultsAndReceiptsEqual: true }));
  }
  mkdirSync(".cache", { recursive: true });
  writeFileSync(".cache/d3787-recorded-exchange.json", `${JSON.stringify({ purpose: "D3787 local cold comparison, not qualification or release proof", measuredAt: new Date().toISOString(), pairs }, null, 2)}\n`);
} else {
  assert.equal(process.argv[2], "measure");
  const games = parsePgn(readFileSync("tools/r2-selection-harness/imported-sample.pgn", "utf8")).map(game => {
    const position = startingPosition(game.headers).unwrap();
    const fen = makeFen(position.toSetup());
    const moves = [];
    for (const node of game.moves.mainline()) {
      const move = parseSan(position, node.san);
      assert(move !== undefined, "retain the complete legal sample, never silently drop a failed game");
      moves.push(makeUci(move)); position.play(move);
    }
    return { fen, moves };
  });
  const selected = [20, 40, 80].flatMap(plies => {
    const arm = games.filter(game => game.moves.length >= plies).slice(0, 12);
    assert.equal(arm.length, 12);
    return arm.map(game => ({ fen: game.fen, moves: game.moves.slice(0, plies) }));
  });
  const cases = [...selected, ...RECORDED_SEQUENCE_POSITIVES, ...RECORDED_SEQUENCE_HARD_NEGATIVES,
    RECORDED_ATTRACTION_FIVE, RECORDED_DEFLECTION_CHECK, ...RECORDED_CASTLING_ATTRACTION,
    ...RECORDED_CASTLING_CLEARANCE, ...RECORDED_CASTLING_DEFENDER];
  const output = createHash("sha256"), inputs = createHash("sha256");
  let compilerMs = 0, edges = 0, events = 0, windows = 0;
  for (const [index, fixture] of cases.entries()) {
    let run = createRun({ id: `d3787:${index}`, packId: "fixture", packDigest: `sha256:${"c".repeat(64)}`,
      startFen: fixture.fen, seed: 3, createdAt: "2026-09-24T00:00:00.000Z",
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    for (const move of fixture.moves) run = commitMove(run, move, { at: "2026-09-24T00:00:00.000Z" }).run;
    inputs.update(JSON.stringify(run));
    const started = performance.now();
    const compiled = recordedSemanticPathExecution(run, run.activeCursor.branchId);
    compilerMs += performance.now() - started;
    const result = compiled.result;
    assert.equal(result.kind, "available");
    if (result.kind !== "available") throw new Error("unreachable refused sample");
    edges += compiled.work.preparedEdges; events += result.events.length; windows += result.windows.length;
    // Includes every payload/operand, window, event id, source and convention receipt, and digest.
    // Explicit value receipts include non-enumerable mint authority, not just displayed values.
    output.update(JSON.stringify({ result, receipts: result.events.map(event => ({
      receipt: evidenceValueReceipt(event.evidence), inputs: event.derivationInputs.map(input => evidenceValueReceipt(input)),
    })) }));
  }
  console.log(JSON.stringify({ paths: cases.length, edges, events, windows, compilerMs,
    outputDigest: output.digest("hex"), inputDigest: inputs.digest("hex") }));
}
