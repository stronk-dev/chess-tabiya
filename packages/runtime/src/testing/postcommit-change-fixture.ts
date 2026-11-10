// Legal actor-labelled original runs, not manufactured evidence or a production source.
import { commitMove, createRun, revealFeedback } from "../runtime.js";
import { canonicalRunStart } from "../session.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../semantic-validation.js";
const at = "2026-11-04T00:00:00.000Z";
export const POSTCOMMIT_CHANGE_SETUPS = Object.freeze({
  locked: { fen: "7k/pppppppp/PPPPPPPP/8/8/8/3N4/K7 w - - 0 1", moves: ["d2f3", "h8g8", "f3d2"] },
  quiet_passer: { fen: "7k/8/8/8/8/8/P2N4/7K w - - 0 1", moves: ["d2f3", "h8g8", "f3d2"] },
  capture: { fen: "7k/p7/8/2p5/3PP3/8/8/K7 w - - 0 1", moves: ["d4c5", "h8g8", "a1b1"] },
  pawn_free: { fen: "7k/7n/8/8/3N4/8/8/K7 w - - 0 1", moves: ["d4f3", "h8g8", "f3d4"] },
} as const);
export function postcommitChangeFixture(kind: keyof typeof POSTCOMMIT_CHANGE_SETUPS, black = false, plies = 3) {
  const setup = POSTCOMMIT_CHANGE_SETUPS[kind], fen = black ? mirrorSemanticFen(setup.fen, "color_and_vertical") : setup.fen;
  const side = black ? "black" : "white";
  const root = createRun({ id: `change-delivery-${kind}-${black}-${plies}`, session: { kind: "position", start: canonicalRunStart({ fen, side }),
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  let run = root;
  for (const [index, move] of setup.moves.slice(0, plies).entries()) run = commitMove(run, black ? mirrorSemanticUci(move, "color_and_vertical") : move,
    { at, actor: index % 2 === 0 ? "user" : "system" }).run;
  return { root, run: revealFeedback(run, at).run };
}
