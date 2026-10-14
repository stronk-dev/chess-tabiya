// Existing test-only legal populations, shared by disposable source-owner experiments.
import { createRun, canonicalRunStart, commitMove, revealFeedback, type DrillRun } from "../../packages/runtime/src/index.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES, RECORDED_ATTRACTION_FIVE,
  RECORDED_CASTLING_ATTRACTION, RECORDED_CASTLING_CLEARANCE, RECORDED_CASTLING_DEFENDER } from "../../packages/runtime/src/testing/recorded-sequence-fixtures.js";

export const RECORDED_SOURCE_CASES = [
  ...RECORDED_SEQUENCE_POSITIVES.map(fixture => ({ ...fixture, emits: true })),
  ...RECORDED_SEQUENCE_HARD_NEGATIVES.map(fixture => ({ ...fixture, emits: false })),
  ...RECORDED_CASTLING_ATTRACTION.map(fixture => ({ ...fixture, projection: "derived.tactic.attraction_observed" })),
  ...RECORDED_CASTLING_CLEARANCE.map(fixture => ({ ...fixture, projection: "derived.tactic.square_clearance_observed" })),
  ...RECORDED_CASTLING_DEFENDER.map(fixture => ({ ...fixture, projection: "derived.tactic.sequence.defender_consequence" })),
  { ...RECORDED_ATTRACTION_FIVE, projection: "derived.tactic.attraction_observed", emits: true },
] as const;

export function recordedSourceRun(id: string, fen: string, moves: readonly string[]): DrillRun {
  const at = "2026-10-14T00:00:00.000Z";
  let run = createRun({ id, session: { kind: "position", start: canonicalRunStart({ fen,
    side: fen.split(" ")[1] === "b" ? "black" : "white" }), feedbackPolicy: "attempt_end",
    opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return revealFeedback(run, at).run;
}
