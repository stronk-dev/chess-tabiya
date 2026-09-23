// Independent, read-only D3262 Stockfish candidate-child validation.
// Ranked engine responses are source observations, not legal-set completion or proof.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { castlingSide, Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { kingCastlesTo, makeUci, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

function check(value, message) { if (!value) throw new Error(message); }
function position(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function engineUci(pos, move) {
  const side = castlingSide(pos, move);
  return side === undefined || !("from" in move) ? makeUci(move) : makeUci({ from: move.from, to: kingCastlesTo(pos.turn, side) });
}
function legalMoves(fen) {
  const pos = position(fen), result = [];
  for (const [from, destinations] of pos.allDests()) for (const to of destinations) {
    const roles = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? ["queen", "rook", "bishop", "knight"] : [undefined];
    for (const promotion of roles) {
      const move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (pos.isLegal(move)) result.push(engineUci(pos, move));
    }
  }
  check(result.length === new Set(result).size, `Duplicate legal move at ${fen}`);
  return result.sort();
}
function replayPv(fen, pv) {
  const pos = position(fen);
  for (const uci of pv) {
    const parsed = parseUci(uci);
    check(parsed !== undefined, `Invalid child Stockfish PV move ${uci}`);
    const move = normalizeMove(pos, parsed);
    check(pos.isLegal(move), `Illegal child Stockfish PV move ${uci} after ${makeFen(pos.toSetup())}`);
    check(engineUci(pos, move) === uci, `Noncanonical child Stockfish PV move ${uci}`);
    pos.play(move);
  }
}
function percentile(values, fraction) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.ceil(ordered.length * fraction) - 1];
}

export function validateStockfishChildCapture(capture, graph, graphBytes, rootCapture) {
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof", "Wrong exact reply authority");
  check(capture.version === 1 && capture.partial === false && capture.manifest === graph.manifest, "Crossed or incomplete Stockfish child capture");
  check(capture.exactReplyDigest === `sha256:${createHash("sha256").update(graphBytes).digest("hex")}`, "Child capture uses another exact graph");
  const positions = graph.roots.flatMap((root) => root.candidates.map((candidate) => ({ rootId: root.rootId, candidateUci: candidate.candidateUci, fen: candidate.afterFen, replies: candidate.replies.map((reply) => reply.uci) })));
  check(positions.length === 196 && capture.positions === 196 && capture.rows?.length === 196, "Child capture omitted positions");
  const source = capture.source;
  check(source.engineName === "Stockfish 19" && /^sha256:[0-9a-f]{64}$/u.test(source.executableDigest), "Wrong Stockfish child source");
  check(rootCapture.manifest === graph.manifest && rootCapture.source.engineName === source.engineName && rootCapture.source.executableDigest === source.executableDigest, "Stockfish child executable differs from frozen root source");
  check(source.threads === 1 && source.hashMb === 16 && source.multiPv === "all_legal_moves_at_candidate_child" && source.scorePerspective === "raw_uci_uninterpreted", "Stockfish child source semantics changed");
  const budgets = ["depth8", "depth12", "movetime100"];
  const stats = Object.fromEntries(budgets.map((budget) => [budget, { legal: 0, retained: 0, missing: 0, bounded: 0, elapsedMs: [] }]));
  for (let index = 0; index < positions.length; index += 1) {
    const expected = positions[index], row = capture.rows[index];
    check(row.rootId === expected.rootId && row.candidateUci === expected.candidateUci && row.fen === expected.fen, `Crossed child position ${index}`);
    const legal = legalMoves(row.fen);
    check(JSON.stringify(legal) === JSON.stringify([...expected.replies].sort()), `Exact graph and independent legal child set disagree at ${index}`);
    check(row.probes?.length === budgets.length, `Child position ${index} omitted a budget`);
    for (const [budgetIndex, budget] of budgets.entries()) {
      const probe = row.probes[budgetIndex], counter = stats[budget];
      check(probe.budget === budget && probe.terminal === (legal.length === 0), `Bad ${budget} or terminal state at child ${index}`);
      check(JSON.stringify(probe.legal) === JSON.stringify(legal), `Stockfish child legal denominator differs at ${index}/${budget}`);
      const seen = new Set(), ranks = new Set();
      for (const entry of probe.entries) {
        check(legal.includes(entry.moveUci) && !seen.has(entry.moveUci), `Illegal or duplicate child Stockfish entry ${index}/${budget}`);
        seen.add(entry.moveUci);
        check(Number.isSafeInteger(entry.rank) && entry.rank >= 1 && entry.rank <= legal.length && !ranks.has(entry.rank), `Invalid child Stockfish rank ${index}/${budget}`);
        ranks.add(entry.rank);
        check(Number.isSafeInteger(entry.depth) && entry.depth >= 1 && ["cp", "mate"].includes(entry.score?.kind) && Number.isSafeInteger(entry.score.value) && typeof entry.score.bound === "boolean", `Invalid child Stockfish score ${index}/${budget}`);
        check(entry.pv?.[0] === entry.moveUci, `Disconnected child Stockfish PV ${index}/${budget}`);
        replayPv(row.fen, entry.pv);
        counter.bounded += Number(entry.score.bound);
      }
      const missing = probe.missingMoves;
      check(Array.isArray(missing) && missing.length === new Set(missing).size && missing.every((move) => legal.includes(move) && !seen.has(move)), `Invalid missing child move set ${index}/${budget}`);
      check(seen.size + missing.length === legal.length, `Silent child move omission ${index}/${budget}`);
      if (!probe.terminal) check(probe.bestmove === probe.entries.find((entry) => entry.rank === 1)?.moveUci, `Bestmove/rank mismatch ${index}/${budget}`);
      check(Number.isFinite(probe.elapsedMs) && probe.elapsedMs >= 0, `Invalid child Stockfish latency ${index}/${budget}`);
      counter.legal += legal.length;
      counter.retained += seen.size;
      counter.missing += missing.length;
      counter.elapsedMs.push(probe.elapsedMs);
    }
  }
  return { positions: positions.length, budgets: Object.fromEntries(budgets.map((budget) => {
    const { elapsedMs, ...counts } = stats[budget];
    return [budget, { ...counts, p50Ms: percentile(elapsedMs, 0.5), p95Ms: percentile(elapsedMs, 0.95), maxMs: Math.max(...elapsedMs) }];
  })) };
}

if (process.argv[1]?.endsWith("stockfish-child-capture-check.mjs")) {
  const graphBytes = readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json");
  const captureBytes = readFileSync("planning/semantic-consequence-search/d3262-stockfish-child-capture.json");
  const rootCapture = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-stockfish-capture.json", "utf8"));
  const result = validateStockfishChildCapture(JSON.parse(captureBytes.toString()), JSON.parse(graphBytes.toString()), graphBytes, rootCapture);
  process.stdout.write(`${JSON.stringify({ captureDigest: `sha256:${createHash("sha256").update(captureBytes).digest("hex")}`, ...result }, null, 2)}\n`);
}
