// Synthetic historical observations, not Maia execution or calibrated chess/player evidence.
import { INITIAL_FEN } from "chessops/fen";
import { appendEvents } from "../events.js";
import { createRun } from "../runtime.js";
import { mirrorSemanticFen } from "../semantic-validation.js";
import type { DrillRun, OpponentSelection } from "../types.js";
export const HUMAN_AT = "2026-10-16T00:00:00.000Z";
export function humanObservationRun(black = false, targetElo?: number, id = `recorded-human-${black}`) {
  return createRun({ id, session: { kind: "position", start: { fen: black ? mirrorSemanticFen(INITIAL_FEN, "color_and_vertical") : INITIAL_FEN, side: black ? "black" : "white" },
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", ...(targetElo === undefined ? {} : { targetElo }) } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: HUMAN_AT });
}
export function splitCandidates(black = false): NonNullable<OpponentSelection["candidates"]> {
  return (black ? ["e7e5", "d7d5", "g8f6"] : ["e2e4", "d2d4", "g1f3"]).map((moveUci, index) => ({ moveUci, rank: index + 1, mass: index === 0 ? 0.4 : 0.3 }));
}
export function recordHumanObservation(run: DrillRun, candidates: OpponentSelection["candidates"], nodeId = run.activeCursor.nodeId,
  branchId = run.activeCursor.branchId, mode: OpponentSelection["policyModeApplied"] = "human_common") {
  const moveUci = run.nodes.find(node => node.id === nodeId)!.fen.split(" ")[1] === "w" ? "e2e4" : "e7e5";
  return appendEvents(run, [{ type: "opponent.move_selected", at: HUMAN_AT, data: { nodeId, branchId, moveUci,
    selection: { moveUci, policyModeApplied: mode, ...(candidates === undefined ? {} : { candidates }),
      engine: { id: "synthetic-maia", name: "Synthetic recorded model", version: "fixture", seedHonored: false } } } }]);
}
