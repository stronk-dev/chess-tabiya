/** Legal recorded scope fixtures, not provider evidence or semantic qualification. */
import { INITIAL_FEN } from "chessops/fen";
import { branchPath } from "../branch-path.js";
import { createRecordedComparisonSource } from "../recorded-comparison.js";
import { commitMove, createRun, fork, rewind } from "../runtime.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../semantic-validation.js";
export const RECORDED_COMPARISON_AT = "2026-10-16T00:00:00.000Z";
export function recordedComparisonFixture(black = false, id = "recorded-comparison-fixture") {
  const transform = (move: string) => black ? mirrorSemanticUci(move, "color_and_vertical") : move;
  const fen = black ? mirrorSemanticFen(INITIAL_FEN, "color_and_vertical") : INITIAL_FEN;
  let run = createRun({ id, session: { kind: "position", start: { fen, side: black ? "black" : "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: RECORDED_COMPARISON_AT });
  const main = run.activeCursor.branchId;
  for (const move of ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"]) run = commitMove(run, transform(move), { at: RECORDED_COMPARISON_AT }).run;
  const mainPath = branchPath(run, main), shared = mainPath[2]!;
  run = fork(rewind(run, shared.id, RECORDED_COMPARISON_AT).run, shared.id, { at: RECORDED_COMPARISON_AT }).run;
  const peer = run.activeCursor.branchId;
  for (const move of ["f1c4", "g8f6"]) run = commitMove(run, transform(move), { at: RECORDED_COMPARISON_AT }).run;
  const peerPath = branchPath(run, peer);
  const columns = [{ branchId: main, throughNodeId: mainPath.at(-1)!.id }, { branchId: peer, throughNodeId: peerPath.at(-1)!.id }] as const;
  return { run, main, peer, shared, mainPath, peerPath, columns, comparison: createRecordedComparisonSource({ run, columns }) };
}
