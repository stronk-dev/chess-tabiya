// Validate a complete or explicit interval capture against the frozen
// next-layer position manifest. Partial top-eight rank is never all-moves proof.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = ["depth8", "depth12", "movetime100"];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function position(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function replay(fen, pv) {
  const state = position(fen);
  for (const uci of pv) {
    const parsed = parseUci(uci);
    check(parsed !== undefined, `Invalid Stockfish PV move ${uci}`);
    const move = normalizeMove(state, parsed);
    check(state.isLegal(move), `Illegal Stockfish PV move ${uci}`);
    state.play(move);
  }
}

export function validateHorizon4Capture(frontier, frontierBytes, capture, reference) {
  check(frontier.authority === "partial_frontier_provider_capture_frame_not_search_result" && frontier.jobs.length === 2185, "Wrong horizon-four frontier");
  check(capture.manifest === frontier.manifest && capture.frontierDigest === sha(frontierBytes), "Crossed frontier capture");
  check(reference.manifest === frontier.manifest && capture.source.engineName === reference.source.engineName && capture.source.executableDigest === reference.source.executableDigest, "Crossed Stockfish binary");
  check(capture.source.multiPv === "top8_legal_moves_at_selected_reply" && capture.source.scorePerspective === "raw_uci_uninterpreted" && capture.source.threads === 1 && capture.source.hashMb === 16, "Wrong bounded Stockfish source");
  check(Number.isSafeInteger(capture.start) && capture.start >= 0 && Number.isSafeInteger(capture.positions) && capture.positions > 0 && capture.start + capture.positions <= frontier.jobs.length && capture.rows.length === capture.positions, "Invalid capture interval");
  check(capture.partial === (capture.start !== 0 || capture.positions !== frontier.jobs.length), "Partial/full capture mislabelled");
  let legalMovesCount = 0, rankedMovesCount = 0, trailingPartial = 0;
  capture.rows.forEach((row, index) => {
    const job = frontier.jobs[capture.start + index];
    check(row.jobId === job.id && row.fen === job.fen, `Crossed captured position ${index}`);
    check(Array.isArray(row.probes) && row.probes.length === 3, `Missing Stockfish budgets ${index}`);
    const legal = legalMoves(position(row.fen)).map((item) => item.uci);
    row.probes.forEach((probe, budgetIndex) => {
      check(probe.budget === budgets[budgetIndex] && probe.terminal === (legal.length === 0), `Crossed budget/terminal ${index}/${budgetIndex}`);
      check(JSON.stringify(probe.legal) === JSON.stringify(legal), `Incomplete legal denominator ${index}/${budgetIndex}`);
      const count = Math.min(8, legal.length);
      check(probe.entries.length === count && probe.missingMoves.length === legal.length - count, `Incomplete top-eight rank table ${index}/${budgetIndex}`);
      check(JSON.stringify(probe.missingMoves) === JSON.stringify(legal.filter((uci) => !probe.entries.some((entry) => entry.moveUci === uci))), `Incorrect unranked tail ${index}/${budgetIndex}`);
      if (count > 0) {
        check(Number.isSafeInteger(probe.coherentDepth) && probe.coherentDepth > 0, `Missing coherent depth ${index}/${budgetIndex}`);
        check(probe.trailingPartialDepth === null || probe.trailingPartialDepth > probe.coherentDepth, `False trailing partial depth ${index}/${budgetIndex}`);
        if (probe.trailingPartialDepth !== null) trailingPartial += 1;
      }
      const seen = new Set();
      probe.entries.forEach((entry, rankIndex) => {
        check(entry.rank === rankIndex + 1 && entry.depth === probe.coherentDepth && legal.includes(entry.moveUci) && !seen.has(entry.moveUci), `Mixed Stockfish rank table ${index}/${budgetIndex}`);
        check(Array.isArray(entry.pv) && entry.pv[0] === entry.moveUci && (entry.score.kind === "cp" || entry.score.kind === "mate") && Number.isSafeInteger(entry.score.value) && typeof entry.score.bound === "boolean", `Malformed Stockfish line ${index}/${budgetIndex}`);
        replay(row.fen, entry.pv);
        seen.add(entry.moveUci);
      });
      legalMovesCount += legal.length;
      rankedMovesCount += count;
    });
  });
  return { positions: capture.positions, legalMoves: legalMovesCount, rankedMoves: rankedMovesCount, trailingPartial };
}

if (process.argv[1]?.endsWith("stockfish-horizon4-check.mjs")) {
  const input = process.argv[2];
  check(input !== undefined, "Pass one explicit capture path");
  const frontierBytes = readFileSync(path("d3262-horizon4-frontier.json"));
  const frontier = JSON.parse(frontierBytes);
  const capture = JSON.parse(readFileSync(input, "utf8"));
  const reference = JSON.parse(readFileSync(path("d3262-stockfish-child-capture.json"), "utf8"));
  process.stdout.write(`${JSON.stringify({ capture: input, ...validateHorizon4Capture(frontier, frontierBytes, capture, reference) }, null, 2)}\n`);
}
