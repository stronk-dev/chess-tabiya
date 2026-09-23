// Disposable D3262 retained-pressure hard control. The relation is declared
// from the pre-registered line; no engine value or best-move claim is inferred.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { attacks } from "../../packages/runtime/node_modules/chessops/dist/esm/attacks.js";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { makeUci, parseSquare } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

const repliesPath = new URL("../../planning/semantic-consequence-search/d3262-exact-replies.json", import.meta.url);
const outputPath = new URL("../../planning/semantic-consequence-search/d3262-bishop-pressure-control.json", import.meta.url);
const replyBytes = readFileSync(repliesPath);
const graph = JSON.parse(replyBytes.toString("utf8"));
const declaration = Object.freeze({
  rootId: "pressure:bg4-h3-bh5",
  candidateUci: "h2h3",
  replyUci: "g4h5",
  pawn: { square: "h3", role: "pawn", color: "white" },
  harassedBishop: { square: "g4", role: "bishop", color: "black" },
  retreatedBishop: { square: "h5", role: "bishop", color: "black" },
  screen: { square: "f3", role: "knight", color: "white" },
  backingTarget: { square: "d1", role: "queen", color: "white" },
});

function check(condition, message) { if (!condition) throw new Error(message); }
function square(name) { const result = parseSquare(name); check(result !== undefined, `Invalid square ${name}`); return result; }
function position(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function samePiece(pos, claim) {
  const piece = pos.board.get(square(claim.square));
  return piece?.role === claim.role && piece.color === claim.color;
}
function attacksSquare(pos, attacker, targetSquare) {
  if (!samePiece(pos, attacker)) return false;
  return attacks(pos.board.get(square(attacker.square)), square(attacker.square), pos.board.occupied).has(square(targetSquare));
}

export function evaluateBishopPressure(control, root) {
  const candidate = root.candidates.find((item) => item.candidateUci === control.candidateUci);
  check(candidate !== undefined, "Missing declared h3 candidate");
  const afterPawn = position(candidate.afterFen);
  check(samePiece(afterPawn, control.pawn) && samePiece(afterPawn, control.harassedBishop), "Pawn/bishop identities fail after h3");
  check(attacksSquare(afterPawn, control.pawn, control.harassedBishop.square), "The h3 pawn does not attack the declared bishop on g4");
  const reply = candidate.replies.find((item) => item.uci === control.replyUci);
  check(reply !== undefined, "Declared ...Bh5 retreat is not a legal reply");
  const afterRetreat = position(reply.fen);
  check(samePiece(afterRetreat, control.retreatedBishop) && samePiece(afterRetreat, control.screen) && samePiece(afterRetreat, control.backingTarget), "Retreated bishop/screen/queen identities fail");
  check(!attacksSquare(afterRetreat, control.pawn, control.retreatedBishop.square), "The retreated bishop remains attacked by h3");
  check(attacksSquare(afterRetreat, control.retreatedBishop, control.screen.square), "The bishop no longer attacks the f3 screen");
  check(!attacksSquare(afterRetreat, control.retreatedBishop, control.backingTarget.square), "The bishop already directly attacks the queen; no latent exposure exists");
  const screenFrom = square(control.screen.square);
  const legalScreenMoves = [];
  const exposingScreenMoves = [];
  for (const to of afterRetreat.allDests().get(screenFrom)) {
    const move = { from: screenFrom, to };
    if (!afterRetreat.isLegal(move)) continue;
    const uci = makeUci(move);
    legalScreenMoves.push(uci);
    const next = afterRetreat.clone();
    next.play(move);
    if (samePiece(next, control.retreatedBishop) && samePiece(next, control.backingTarget)
      && attacksSquare(next, control.retreatedBishop, control.backingTarget.square)) exposingScreenMoves.push(uci);
  }
  legalScreenMoves.sort(); exposingScreenMoves.sort();
  check(exposingScreenMoves.length > 0, "The declared latent queen exposure has no legal knight-move witness");
  return {
    rootId: control.rootId,
    candidateUci: control.candidateUci,
    selectedReplyUci: control.replyUci,
    opponentReplyCount: candidate.replyCount,
    identities: { pawn: control.pawn, harassedBishop: control.harassedBishop, retreatedBishop: control.retreatedBishop, screen: control.screen, backingTarget: control.backingTarget },
    pawnAttacksBeforeRetreat: true,
    pawnAttacksAfterRetreat: false,
    bishopAttacksScreenAfterRetreat: true,
    bishopDirectlyAttacksQueenAfterRetreat: false,
    legalScreenMoves,
    exposingScreenMoves,
    geometricExposureOnly: true,
  };
}

export function compileBishopPressure(replyGraph) {
  check(replyGraph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof", "Pressure control requires the exact reply graph");
  const root = replyGraph.roots.find((item) => item.rootId === declaration.rootId);
  check(root !== undefined, "Missing pressure root");
  return { version: 1, exactReplyDigest: `sha256:${createHash("sha256").update(replyBytes).digest("hex")}`, authority: "declared_pressure_and_legal_screen_move_exposure_only", result: evaluateBishopPressure(declaration, root) };
}

export { declaration as bishopPressureDeclaration };

if (process.argv[1]?.endsWith("bishop-pressure-control.mjs")) {
  const artifact = compileBishopPressure(graph);
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  if (process.argv.includes("--write")) writeFileSync(outputPath, bytes, { flag: "wx" });
  else check(readFileSync(outputPath, "utf8") === bytes, "D3262 bishop-pressure control differs from the exact reply graph");
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, ...artifact.result }, null, 2)}\n`);
}
