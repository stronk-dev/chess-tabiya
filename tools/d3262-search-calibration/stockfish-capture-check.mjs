// Independent, read-only D3262 capture validation. No engine request.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { castlingSide, Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { kingCastlesTo, makeUci, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

import { manifestIdentity, manifestRows } from "./manifest.mjs";

const path = process.argv.includes("--file")
  ? process.argv[process.argv.indexOf("--file") + 1]
  : new URL("../../planning/semantic-consequence-search/d3262-stockfish-capture.json", import.meta.url);
if (path === undefined) throw new Error("--file requires an explicit artifact path");
const bytes = readFileSync(path);
const capture = JSON.parse(bytes.toString("utf8"));
function check(condition, message) { if (!condition) throw new Error(message); }
function pos(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function engineUci(state, move) {
  const side = castlingSide(state, move);
  return side === undefined || !("from" in move) ? makeUci(move) : makeUci({ from: move.from, to: kingCastlesTo(state.turn, side) });
}
function legalSet(fen) {
  const state = pos(fen), moves = [];
  for (const [from, destinations] of state.allDests()) for (const to of destinations) {
    const roles = state.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? ["queen", "rook", "bishop", "knight"] : [undefined];
    for (const promotion of roles) {
      const move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (state.isLegal(move)) moves.push(engineUci(state, move));
    }
  }
  check(new Set(moves).size === moves.length, `Duplicate legal moves at ${fen}`);
  return new Set(moves);
}
function replay(fen, pv) {
  const state = pos(fen);
  for (const uci of pv) {
    const parsed = parseUci(uci);
    check(parsed !== undefined, `Bad PV UCI ${uci}`);
    const move = normalizeMove(state, parsed);
    check(state.isLegal(move), `Illegal PV UCI ${uci} from ${makeFen(state.toSetup())}`);
    check(engineUci(state, move) === uci, `Noncanonical PV UCI ${uci}`);
    state.play(move);
  }
}
check(capture.version === 1 && capture.partial === false, "The checked artifact is not a full v1 capture");
check(capture.manifest === manifestIdentity.manifestDigest, "Stockfish capture uses a different root manifest");
check(capture.roots === manifestRows.length && capture.rows.length === manifestRows.length, "Stockfish capture omitted roots");
check(typeof capture.source.engineName === "string" && /^sha256:[0-9a-f]{64}$/u.test(capture.source.executableDigest), "Stockfish source identity is incomplete");
check(capture.source.scorePerspective === "raw_uci_uninterpreted", "The capture changed its score authority");

const budgets = ["depth8", "depth12", "movetime100"];
const summary = Object.fromEntries(budgets.map((budget) => [budget, { legal: 0, retained: 0, missing: 0, bounded: 0, elapsedMs: [] }]));
for (let index = 0; index < manifestRows.length; index += 1) {
  const root = manifestRows[index], row = capture.rows[index];
  check(row.rootId === root.id && row.fen === root.fen, `Root ${index} changed identity or order`);
  const legal = legalSet(root.fen);
  for (const source of root.sourceRows ?? []) check(legal.has(source.candidateUci), `${root.id} has an illegal source candidate ${source.candidateUci}`);
  if (root.candidateUci !== undefined) check(legal.has(root.candidateUci), `${root.id} has an illegal control candidate`);
  check(row.probes.length === budgets.length, `Root ${root.id} omitted a budget`);
  for (let probeIndex = 0; probeIndex < budgets.length; probeIndex += 1) {
    const probe = row.probes[probeIndex], budget = budgets[probeIndex], counter = summary[budget];
    check(probe.budget === budget, `${root.id} has an unexpected budget`);
    check(probe.terminal === (legal.size === 0), `${root.id}/${budget} terminal status is false`);
    check(new Set(probe.legal).size === legal.size && probe.legal.every((move) => legal.has(move)), `${root.id}/${budget} legal denominator is incomplete`);
    const seen = new Set(), seenRanks = new Set();
    for (const entry of probe.entries) {
      check(legal.has(entry.moveUci) && !seen.has(entry.moveUci), `${root.id}/${budget} has an invalid or duplicate entry`);
      seen.add(entry.moveUci);
      check(Number.isSafeInteger(entry.rank) && entry.rank > 0 && Number.isSafeInteger(entry.depth) && entry.depth > 0, `${root.id}/${budget} has an invalid rank/depth`);
      check(entry.rank <= legal.size && !seenRanks.has(entry.rank), `${root.id}/${budget} has an invalid or duplicate rank`);
      seenRanks.add(entry.rank);
      check(["cp", "mate"].includes(entry.score.kind) && Number.isSafeInteger(entry.score.value) && typeof entry.score.bound === "boolean", `${root.id}/${budget} has an invalid raw score`);
      check(Array.isArray(entry.pv) && entry.pv[0] === entry.moveUci, `${root.id}/${budget} has a disconnected PV`);
      replay(root.fen, entry.pv);
      counter.bounded += Number(entry.score.bound);
    }
    const missing = new Set(probe.missingMoves);
    check(missing.size === probe.missingMoves.length && [...missing].every((move) => legal.has(move) && !seen.has(move)), `${root.id}/${budget} has an invalid missing set`);
    check(seen.size + missing.size === legal.size, `${root.id}/${budget} dropped a legal move without saying so`);
    if (!probe.terminal) check(probe.bestmove === probe.entries.find((entry) => entry.rank === 1)?.moveUci, `${root.id}/${budget} bestmove and rank 1 disagree`);
    check(Number.isFinite(probe.elapsedMs) && probe.elapsedMs >= 0, `${root.id}/${budget} has invalid latency`);
    counter.legal += legal.size;
    counter.retained += seen.size;
    counter.missing += missing.size;
    counter.elapsedMs.push(probe.elapsedMs);
  }
}
function percentile(values, fraction) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.ceil(ordered.length * fraction) - 1];
}
const result = {
  captureDigest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
  manifestDigest: capture.manifest,
  engineName: capture.source.engineName,
  roots: manifestRows.length,
  budgets: Object.fromEntries(budgets.map((budget) => {
    const { elapsedMs, ...counts } = summary[budget];
    return [budget, { ...counts, p50Ms: percentile(elapsedMs, .5), p95Ms: percentile(elapsedMs, .95), maxMs: Math.max(...elapsedMs) }];
  })),
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
