// Disposable D3262 exact one-reply source capture. It enumerates legal edges;
// it does not call a tactic proved, forced, likely, or good.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import { castlingSide, Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { kingCastlesTo, makeUci, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

const framePath = new URL("../../planning/semantic-consequence-search/d3262-root-frame.json", import.meta.url);
const outputPath = new URL("../../planning/semantic-consequence-search/d3262-exact-replies.json", import.meta.url);
const frameBytes = readFileSync(framePath);
const frame = JSON.parse(frameBytes.toString("utf8"));

function check(condition, message) { if (!condition) throw new Error(message); }
function position(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function externalUci(state, move) {
  const side = castlingSide(state, move);
  return side === undefined || !("from" in move) ? makeUci(move) : makeUci({ from: move.from, to: kingCastlesTo(state.turn, side) });
}
export function legalMoves(state) {
  const result = [];
  for (const [from, destinations] of state.allDests()) for (const to of destinations) {
    const roles = state.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? ["queen", "rook", "bishop", "knight"] : [undefined];
    for (const promotion of roles) {
      const move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (state.isLegal(move)) result.push({ move, uci: externalUci(state, move) });
    }
  }
  result.sort((left, right) => left.uci.localeCompare(right.uci));
  check(new Set(result.map((item) => item.uci)).size === result.length, "Duplicate legal UCI during exact enumeration");
  return result;
}
function pieceCount(state) { return [...state.board].length; }

export function enumerateCandidate(fen, uci) {
  const before = position(fen);
  const parsed = parseUci(uci);
  check(parsed !== undefined, `Invalid candidate UCI ${uci}`);
  const candidate = normalizeMove(before, parsed);
  check(before.isLegal(candidate) && externalUci(before, candidate) === uci, `Illegal or noncanonical root candidate ${uci}`);
  before.play(candidate);
  const afterFen = makeFen(before.toSetup());
  const replies = legalMoves(before).map(({ move, uci: replyUci }) => {
    const replyState = before.clone();
    const count = pieceCount(replyState);
    replyState.play(move);
    return {
      uci: replyUci,
      fen: makeFen(replyState.toSetup()),
      givesCheck: replyState.isCheck(),
      captures: pieceCount(replyState) < count,
    };
  });
  return { candidateUci: uci, afterFen, opponentInCheck: before.isCheck(), terminal: replies.length === 0, replyCount: replies.length, replies };
}

export function buildExactReplyEnumeration(rootFrame) {
  check(rootFrame.authority === "shared_candidate_population_not_move_grade", "Exact replies require the shared ungraded root frame");
  return {
    version: 1,
    rootFrameDigest: `sha256:${createHash("sha256").update(frameBytes).digest("hex")}`,
    manifest: rootFrame.manifest,
    authority: "complete_legal_opponent_reply_edges_not_a_semantic_proof",
    roots: rootFrame.roots.map((root) => ({
      rootId: root.rootId,
      fen: root.fen,
      candidates: root.candidates.map((candidate) => enumerateCandidate(root.fen, candidate.moveUci)),
    })),
  };
}

export function validateExactReplyArtifact(artifact, rootFrame) {
  check(JSON.stringify(artifact) === JSON.stringify(buildExactReplyEnumeration(rootFrame)), "Exact-reply artifact differs from complete legal replay");
}

if (process.argv[1]?.endsWith("exact-reply-enumeration.mjs")) {
  const started = performance.now();
  const artifact = buildExactReplyEnumeration(frame);
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  if (process.argv.includes("--write")) writeFileSync(outputPath, bytes, { flag: "wx" });
  else check(readFileSync(outputPath, "utf8") === bytes, "D3262 exact-reply artifact differs from the frozen root frame");
  const candidates = artifact.roots.flatMap((root) => root.candidates);
  const replies = candidates.flatMap((candidate) => candidate.replies);
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, roots: artifact.roots.length, candidates: candidates.length, replies: replies.length, terminalCandidates: candidates.filter((candidate) => candidate.terminal).length, checkingReplies: replies.filter((reply) => reply.givesCheck).length, capturingReplies: replies.filter((reply) => reply.captures).length, elapsedMs: Number((performance.now() - started).toFixed(2)) }, null, 2)}\n`);
}
