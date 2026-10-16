// Test-only real recorded boundary and complete point population. No caller-minted source facts.
import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { branchPath } from "../branch-path.js";
import { createRecordedReviewBoundarySourceOwner } from "../recorded-review-boundary.js";
import { collectRecordedLastLevelPopulation, type ReviewImportRecordImage, type ReviewProviderNodeState } from "../review-evidence.js";
import { invokeEvidenceValueRoute } from "../internal/evidence-value-routes.js";
import { evaluationDelivery, importedRun, play, START_FEN } from "./review-evidence-fixture.js";
import type { DrillRun } from "../types.js";

export function recordedLastLevelFixture(side: "white" | "black" = "white", result: ReviewImportRecordImage["result"] = "0-1",
  id = "last-level-reduction", moves = ["e2e4", "e7e5", "g1f3", "b8c6"], fen = START_FEN) {
  let run = play(importedRun(id, side, fen), moves);
  const path = branchPath(run, run.activeCursor.branchId);
  const record = { runId: run.id, result, movetextDigest: `sha256:${createHash("sha256").update(canonicalizeJson({ rootFen: path[0]!.fen, uci: path.slice(1).map(node => node.moveUci) })).digest("hex")}` };
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => record });
  const boundary = (throughNodeId = path.at(-1)!.id) => owner.resolve({ runId: run.id, branchId: run.activeCursor.branchId, throughNodeId });
  const engine = new Map<string, ReviewProviderNodeState>();
  const deliver = (index: number, rawScore = "cp 20") => {
    const delivery = invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(path[index]!.fen, rawScore) });
    engine.set(path[index]!.id, { kind: "delivered", delivery }); return delivery;
  };
  return { path, run, record, owner, boundary, engine, deliver,
    collect: (source = boundary()) => collectRecordedLastLevelPopulation({ boundary: source, context: { engine, shapes: [] } }),
    setRun: (value: DrillRun) => { run = value; } };
}
