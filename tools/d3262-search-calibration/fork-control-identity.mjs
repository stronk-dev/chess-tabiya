// Disposable D3262 hard-control predicate. It tracks declared attacker/target
// identities through exact replies; it does not assess exchange value or grade.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { attacks } from "../../packages/runtime/node_modules/chessops/dist/esm/attacks.js";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseSquare } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

const repliesPath = new URL("../../planning/semantic-consequence-search/d3262-exact-replies.json", import.meta.url);
const outputPath = new URL("../../planning/semantic-consequence-search/d3262-fork-control-identity.json", import.meta.url);
const replyBytes = readFileSync(repliesPath);
const graph = JSON.parse(replyBytes.toString("utf8"));
export const controls = [
  { rootId: "tactical:fork-parried", candidateUci: "e6c7", attacker: { square: "c7", role: "knight", color: "white" }, targets: [{ square: "a8", role: "rook", color: "black" }, { square: "e8", role: "rook", color: "black" }] },
  { rootId: "tactical:fork-survives", candidateUci: "e6c7", attacker: { square: "c7", role: "knight", color: "white" }, targets: [{ square: "a8", role: "rook", color: "black" }, { square: "e8", role: "king", color: "black" }] },
];

function check(condition, message) { if (!condition) throw new Error(message); }
function state(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function square(name) { const result = parseSquare(name); check(result !== undefined, `Invalid square ${name}`); return result; }
function samePiece(pos, claim) {
  const piece = pos.board.get(square(claim.square));
  return piece?.role === claim.role && piece.color === claim.color;
}
function attackedBy(pos, attacker, target) {
  if (!samePiece(pos, attacker) || !samePiece(pos, target)) return false;
  return attacks(pos.board.get(square(attacker.square)), square(attacker.square), pos.board.occupied).has(square(target.square));
}

export function evaluateIdentityControl(control, root) {
  const candidate = root.candidates.find((item) => item.candidateUci === control.candidateUci);
  check(candidate !== undefined && candidate.replyCount > 0, `${control.rootId}: control candidate or nonempty reply set missing`);
  const initial = state(candidate.afterFen);
  check(samePiece(initial, control.attacker), `${control.rootId}: declared attacker identity is false at candidate`);
  for (const target of control.targets) check(attackedBy(initial, control.attacker, target), `${control.rootId}: declared target identity/attack is false at candidate`);
  const nonKingTargets = control.targets.filter((target) => target.role !== "king");
  check(nonKingTargets.length > 0, `${control.rootId}: no non-king target to retain`);
  const replies = candidate.replies.map((reply) => {
    const pos = state(reply.fen);
    const retainedTargets = nonKingTargets.filter((target) => attackedBy(pos, control.attacker, target)).map((target) => target.square);
    return { uci: reply.uci, retainedTargets, retainsAny: retainedTargets.length > 0 };
  });
  const firstRefutation = replies.find((reply) => !reply.retainsAny)?.uci ?? null;
  return { rootId: control.rootId, candidateUci: control.candidateUci, attacker: control.attacker, targets: control.targets, replyCount: replies.length, firstRefutation, allReplyRetained: firstRefutation === null, replies };
}

export function compileIdentityControls(replyGraph) {
  check(replyGraph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof", "Identity controls require the complete legal reply graph");
  return { version: 1, exactReplyDigest: `sha256:${createHash("sha256").update(replyBytes).digest("hex")}`, authority: "declared_piece_identity_and_geometric_attack_only", controls: controls.map((control) => {
    const root = replyGraph.roots.find((item) => item.rootId === control.rootId);
    check(root !== undefined, `Missing control root ${control.rootId}`);
    return evaluateIdentityControl(control, root);
  }) };
}

if (process.argv[1]?.endsWith("fork-control-identity.mjs")) {
  const artifact = compileIdentityControls(graph);
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  if (process.argv.includes("--write")) writeFileSync(outputPath, bytes, { flag: "wx" });
  else check(readFileSync(outputPath, "utf8") === bytes, "D3262 fork identity controls differ from the frozen reply graph");
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, controls: artifact.controls.map(({ rootId, replyCount, allReplyRetained, firstRefutation }) => ({ rootId, replyCount, allReplyRetained, firstRefutation })) }, null, 2)}\n`);
}
