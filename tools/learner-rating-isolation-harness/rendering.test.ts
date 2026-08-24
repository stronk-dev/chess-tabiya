import { describe, expect, it } from "vitest";

import {
  appendOpponentPly,
  classifyPhase,
  commitMove,
  createRun,
  declarePhaseReadingEvidence,
  type EvidencePacket,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import {
  RATED_OPPONENT_CALIBRATION,
  publishRating,
  type LearnerRatingState,
} from "@chess-tabiya/runtime/rating";
import { objectiveGradeSentence } from "../../apps/web/src/lib/outcome-presentation.js";
import { applyRulesGuard } from "../../apps/server/src/guard.js";
import { publicEvents } from "../../apps/server/src/feedback-policy.js";
import { voiceEvidenceView } from "../../apps/server/src/guidance.js";

const AT = "2026-08-24T12:00:00.000Z";
const FEN = "3rk3/8/8/8/8/8/7P/3Q2K1 w - - 0 1";
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const selection: OpponentSelection = Object.freeze({
  moveUci: "d8d1",
  policyModeApplied: "human_common",
  engine: Object.freeze({ id: "fixture", name: "Fixture", version: "1", seedHonored: true }),
});

function renderingSnapshot(): string {
  let run = createRun({
    id: "rating-isolation",
    session: { kind: "pack", packId: "rating-isolation-pack", packDigest: `sha256:${"b".repeat(64)}`, start: { fen: FEN, side: "white" }, feedbackPolicy: "immediate_guard", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`,
    policyConfig,
    seed: 1,
    createdAt: AT,
  });
  run = commitMove(run, "h2h3", { at: AT }).run;
  run = appendOpponentPly(run, selection, { at: AT }).run;
  const guarded = applyRulesGuard({ guard: {}, feedbackPolicy: "immediate_guard" } as never, run, run.activeCursor.nodeId, AT).run;
  const detected = classifyPhase(run.nodes.at(-1)!.fen);
  const packet: EvidencePacket = Object.freeze({
    fen: run.nodes.at(-1)!.fen,
    phase: Object.freeze({ source: "detector" as const, value: detected.phase }),
    structures: Object.freeze([]), observations: Object.freeze([]), markers: Object.freeze([]),
    endgame: null, plans: Object.freeze([]), authored: Object.freeze([]), readings: Object.freeze([]),
    declared: Object.freeze([declarePhaseReadingEvidence(detected)]),
  });
  return JSON.stringify({
    guard: guarded.events.filter((event) => event.type === "feedback.generated"),
    feedback: publicEvents(guarded, 0),
    outcome: objectiveGradeSentence("hold", "preserved"),
    voice: voiceEvidenceView(packet).rendered,
  });
}

describe("learner-rating AC-11 rendered-byte isolation", () => {
  it("keeps guard, feedback, outcome and voice bytes invariant across distinct ratings", () => {
    const ratings = [1200, 1500, 1750, 2100].map((rating): LearnerRatingState => ({
      rating,
      rd: 50,
      volatility: 0.06,
      calibrationId: RATED_OPPONENT_CALIBRATION.id,
      ratedGames: 40,
      voidedGames: 0,
      abandonedGames: 0,
    }));
    expect(new Set(ratings.map((rating) => JSON.stringify(publishRating(rating))).values()).size).toBeGreaterThan(1);
    expect(new Set(ratings.map(() => renderingSnapshot())).size).toBe(1);
  });
});
