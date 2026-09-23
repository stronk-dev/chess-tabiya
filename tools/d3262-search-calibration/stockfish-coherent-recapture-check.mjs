// Disposable D3262/D3285 read-only check: coherent root and first-child ranks.
// A top-eight table is partial engine evidence, never all-legal proof.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { manifestIdentity, manifestRows } from "./manifest.mjs";

const directory = "planning/semantic-consequence-search";
const budgets = ["depth8", "depth12", "movetime100"];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function legal(fen) { return legalMoves(Chess.fromSetup(parseFen(fen).unwrap()).unwrap()).map((row) => row.uci); }
function replay(fen, pv) {
  const state = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  for (const uci of pv) {
    const parsed = parseUci(uci);
    check(parsed !== undefined, `Invalid PV move ${uci}`);
    const move = normalizeMove(state, parsed);
    check(state.isLegal(move), `Illegal PV move ${uci}`);
    state.play(move);
  }
}

export function validateCoherentRecapture(capture, expected, original, mode, graphDigest = null) {
  check(["root", "child", "root-all", "child-all"].includes(mode), "Unknown recapture mode");
  const child = mode.startsWith("child"), all = mode.endsWith("-all");
  check(capture.version === 1 && capture.partial === false && capture.start === 0
    && capture.positions === expected.length && capture.rows?.length === expected.length
    && capture.manifest === manifestIdentity.manifestDigest, "Crossed or incomplete coherent recapture");
  check(!child || capture.exactReplyDigest === graphDigest, "Child recapture graph changed");
  const source = capture.source;
  check(source.engineName === original.source.engineName && source.executableDigest === original.source.executableDigest
    && source.threads === 1 && source.hashMb === 16 && source.scorePerspective === "raw_uci_uninterpreted"
    && source.multiPv === (child
      ? all ? "coherent_all_legal_moves_at_candidate_child" : "top8_legal_moves_at_candidate_child"
      : all ? "coherent_all_legal_root_moves" : "top8_legal_root_moves"), "Coherent recapture source changed");
  let legalInstances = 0, rankedEntries = 0, trailingPartials = 0;
  for (let index = 0; index < expected.length; index += 1) {
    const job = expected[index], row = capture.rows[index];
    check(row.rootId === job.rootId && row.candidateUci === job.candidateUci && row.fen === job.fen,
      `Crossed coherent ${mode} position ${index}`);
    check(Array.isArray(row.probes) && row.probes.length === budgets.length, `Missing coherent budgets ${index}`);
    const moves = legal(row.fen);
    if (child) check(JSON.stringify(moves) === JSON.stringify(job.replies), `Child legal graph disagrees ${index}`);
    row.probes.forEach((probe, budgetIndex) => {
      const count = all ? moves.length : Math.min(8, moves.length);
      check(probe.budget === budgets[budgetIndex] && probe.terminal === (moves.length === 0)
        && JSON.stringify(probe.legal) === JSON.stringify(moves), `Coherent legal denominator or budget changed ${index}/${budgetIndex}`);
      check(probe.entries?.length === count && JSON.stringify(probe.missingMoves) === JSON.stringify(moves.filter((uci) => !probe.entries.some((entry) => entry.moveUci === uci))),
        `Incomplete coherent rank table ${index}/${budgetIndex}`);
      if (count > 0) {
        check(Number.isSafeInteger(probe.coherentDepth) && probe.coherentDepth > 0
          && (probe.trailingPartialDepth === null || probe.trailingPartialDepth > probe.coherentDepth),
        `Noncoherent depth ${index}/${budgetIndex}`);
        trailingPartials += Number(probe.trailingPartialDepth !== null);
      }
      check(Number.isFinite(probe.elapsedMs) && probe.elapsedMs >= 0, `Invalid provider latency ${index}/${budgetIndex}`);
      const seen = new Set();
      probe.entries.forEach((entry, rank) => {
        check(entry.rank === rank + 1 && entry.depth === probe.coherentDepth && moves.includes(entry.moveUci)
          && !seen.has(entry.moveUci) && entry.pv?.[0] === entry.moveUci
          && ["cp", "mate"].includes(entry.score?.kind) && Number.isSafeInteger(entry.score.value)
          && typeof entry.score.bound === "boolean", `Mixed or invalid coherent rank ${index}/${budgetIndex}`);
        replay(row.fen, entry.pv);
        seen.add(entry.moveUci);
      });
      legalInstances += moves.length;
      rankedEntries += probe.entries.length;
    });
  }
  return { positions: expected.length, legalInstances, rankedEntries, trailingPartials };
}

if (process.argv[1]?.endsWith("stockfish-coherent-recapture-check.mjs")) {
  const rootBytes = readFileSync(`${directory}/d3262-stockfish-root-coherent.json`);
  const childBytes = readFileSync(`${directory}/d3262-stockfish-child-coherent.json`);
  const rootAllBytes = readFileSync(`${directory}/d3262-stockfish-root-coherent-all.json`);
  const childAllBytes = readFileSync(`${directory}/d3262-stockfish-child-coherent-all.json`);
  const graphBytes = readFileSync(`${directory}/d3262-exact-replies.json`);
  const graph = JSON.parse(graphBytes);
  check(graph.manifest === manifestIdentity.manifestDigest && graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof", "Crossed exact graph");
  const roots = manifestRows.map((root) => ({ rootId: root.id, fen: root.fen }));
  const children = graph.roots.flatMap((root) => root.candidates.map((candidate) => ({ rootId: root.rootId, candidateUci: candidate.candidateUci, fen: candidate.afterFen, replies: candidate.replies.map((reply) => reply.uci) })));
  check(roots.length === 66 && children.length === 196, "Coherent recapture population changed");
  const originalRoot = JSON.parse(readFileSync(`${directory}/d3262-stockfish-capture.json`));
  const originalChild = JSON.parse(readFileSync(`${directory}/d3262-stockfish-child-capture.json`));
  const root = validateCoherentRecapture(JSON.parse(rootBytes), roots, originalRoot, "root");
  const child = validateCoherentRecapture(JSON.parse(childBytes), children, originalChild, "child", sha(graphBytes));
  const rootAll = validateCoherentRecapture(JSON.parse(rootAllBytes), roots, originalRoot, "root-all");
  const childAll = validateCoherentRecapture(JSON.parse(childAllBytes), children, originalChild, "child-all", sha(graphBytes));
  process.stdout.write(`${JSON.stringify({ root: { digest: sha(rootBytes), ...root }, child: { digest: sha(childBytes), ...child }, rootAll: { digest: sha(rootAllBytes), ...rootAll }, childAll: { digest: sha(childAllBytes), ...childAll } }, null, 2)}\n`);
}
