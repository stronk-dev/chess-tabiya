import assert from "node:assert/strict";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { enumerateCandidate, legalMoves } from "./exact-reply-enumeration.mjs";
import { arms, sourceNames } from "./coherent-third-ply-frame.mjs";

// Synthetic legality controls, not provider observations. Different knight
// orders converge to the same full FEN while retaining different model histories.
export function fixture() {
  const rootFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const manifest = "synthetic-not-a-production-source";
  const model = { modelId: "fixture", modelCheckpointSha256: "fixture", uciSourceSha256: "fixture", mode: "human_common",
    band: 1400, temperature: 0.8, topP: 0.92, useUciHistory: true, device: "cpu",
    rawMeaning: "direct_full_legal_softmax_logits", configuredMeaning: "direct_sample_from_logits_support_and_normalized_mass",
    preRootHistory: "unavailable_not_inferred" };
  const engineSource = { engineName: "fixture", executableDigest: "fixture", threads: 1, hashMb: 16,
    multiPv: "top8_legal_moves_at_selected_reply", scorePerspective: "raw_uci_uninterpreted" };
  const sources = Object.fromEntries(sourceNames.map((name, i) => [name, { manifest, source: i < 2 ? engineSource : model, rows: [] }]));
  const digests = Object.fromEntries(sourceNames.map((name) => [name, `synthetic-digest:${name}`]));
  digests["d3262-coherent-first-reply-frontier.json"] = "synthetic-first-digest";
  const frame = { profile: "d3262-coherent-root-v1", manifest,
    roots: [{ rootId: "knights", fen: rootFen, phase: "opening", candidates: ["g1f3", "b1c3"].map((moveUci) => ({ moveUci })) }] };
  const first = { profile: "d3262-coherent-first-reply-v1", manifest, rows: [] };
  const union = { profile: "d3262-coherent-deeper-source-union-v1", manifest, inputDigests: { ...digests }, bindings: [] };
  const childMaia = [{ manifest, source: model, rows: [] }, { manifest, source: model, rows: [] }];
  function policy(fen, preferred, historyUci, candidateUci, replyUci) {
    const legal = legalMoves(Chess.fromSetup(parseFen(fen).unwrap()).unwrap()).map((entry) => entry.uci);
    const next = legal.find((uci) => uci !== preferred);
    return { rootId: "knights", candidateUci, ...(replyUci === undefined ? {} : { replyUci }), rootFen, fen, historyUci,
      rawFullLegal: legal.map((legalUci) => ({ legalUci, mass: 1 / legal.length })),
      configuredSupport: [{ legalUci: preferred, mass: 0.81 }, { legalUci: next, mass: 0.19 }] };
  }
  for (const candidate of frame.roots[0].candidates) {
    const graph = enumerateCandidate(rootFen, candidate.moveUci);
    const ordered = [...graph.replies].sort((a, b) => Number(b.uci === "g8f6") - Number(a.uci === "g8f6") || a.uci.localeCompare(b.uci));
    const selected = ordered.slice(0, 8);
    const parent = policy(graph.afterFen, "g8f6", [candidate.moveUci], candidate.moveUci);
    childMaia[0].rows.push(parent);
    first.rows.push({ rootId: "knights", candidateUci: candidate.moveUci, legalReplyCount: graph.replyCount,
      replies: selected.map((reply, i) => ({ uci: reply.uci, fen: reply.fen,
        selectedBy: arms.filter((arm) => arm.startsWith("engine:") ? i < Number(arm.split(":")[2].slice(3))
          : parent.configuredSupport.slice(0, arm.endsWith("0.80") ? 1 : 2).some((entry) => entry.legalUci === reply.uci)) })) });
    // Ensure the second Maia support is in the shared first-reply union.
    assert.ok(selected.some((reply) => reply.uci === parent.configuredSupport[1].legalUci));
    for (const reply of selected) {
      const legal = legalMoves(Chess.fromSetup(parseFen(reply.fen).unwrap()).unwrap()).map((entry) => entry.uci);
      const preferred = candidate.moveUci === "g1f3" ? "b1c3" : "g1f3";
      const moves = [...legal].sort((a, b) => Number(b === preferred) - Number(a === preferred) || a.localeCompare(b)).slice(0, 8);
      const engine = { fen: reply.fen, probes: ["depth8", "depth12", "movetime100"].map((budget) => ({ budget, legal,
        coherentDepth: 8, entries: moves.map((moveUci, i) => ({ rank: i + 1, moveUci, depth: 8, pv: [moveUci] })),
        missingMoves: legal.filter((uci) => !moves.includes(uci)) })) };
      const human = policy(reply.fen, preferred, [candidate.moveUci, reply.uci], candidate.moveUci, reply.uci);
      union.bindings.push({ rootId: "knights", candidateUci: candidate.moveUci, replyUci: reply.uci, fen: reply.fen,
        stockfish: { source: sourceNames[0], row: sources[sourceNames[0]].rows.length },
        maia: { source: sourceNames[2], row: sources[sourceNames[2]].rows.length } });
      sources[sourceNames[0]].rows.push(engine);
      sources[sourceNames[2]].rows.push(human);
    }
  }
  return [frame, first, union, sources, childMaia, digests];
}
