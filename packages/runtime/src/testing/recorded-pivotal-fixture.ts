/** Legal source-scope fixtures; rare collapse reuses the existing four-ply CC0 control. */
import { INITIAL_FEN } from "chessops/fen";
import { createRun, commitMove } from "../runtime.js";
import { canonicalRunStart } from "../session.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../semantic-validation.js";
export const RECORDED_PIVOTAL_AT = "2026-10-16T00:00:00.000Z";
export const PIVOTAL_RULE_KINDS = ["irreversibility", "phase_change", "option_collapse"] as const;
export function recordedPivotalFixture(kind: typeof PIVOTAL_RULE_KINDS[number], black = false) {
  const setup = kind === "irreversibility" ? { fen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", moves: ["e2e7"] }
    : kind === "option_collapse" ? { fen: "8/3r3k/p3qr1p/1p5Q/8/P6R/1PP1p3/1K5R w - - 0 37", moves: ["h1e1", "d7d1", "e1d1", "e2d1q"] }
    : { fen: INITIAL_FEN, moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "b1c3", "f8c5"] };
  const fen = black ? mirrorSemanticFen(setup.fen, "color_and_vertical") : setup.fen;
  let run = createRun({ id: `pivotal-recorded-${kind}-${black}`, session: { kind: "position", start: canonicalRunStart({ fen, side: black ? "black" : "white" }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"d".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: RECORDED_PIVOTAL_AT });
  for (const move of setup.moves) run = commitMove(run, black ? mirrorSemanticUci(move, "color_and_vertical") : move, { at: RECORDED_PIVOTAL_AT }).run;
  return run;
}
