import { describe, expect, it } from "vitest";

import {
  comparisonStepAnnouncement,
  comparisonStepLabel,
  learnerMoveCount,
  opponentMoveCount,
  rehearsalStepLabel,
  rehearsalTurnCount,
  storyMoveLabel,
  storyReentryCopy,
} from "./chronology-copy.js";
import {
  attemptVerdictLabel,
  chessSideLabel,
  corpusPopulationLabel,
  publishedBandInterval,
  publishedBandLabel,
  ratedGameResultLabel,
  ratingPublicationStateLabel,
  recordedEvaluationTrajectory,
  repertoireGapStateLabel,
  storyMomentLabel,
  storyOutcomeLabel,
} from "./learner-copy.js";

describe("learner-facing domain copy", () => {
  it("never exposes story and attempt enum identifiers", () => {
    expect(storyMomentLabel("eval_pivot")).toBe("Evaluation shift");
    expect(storyMomentLabel("option_collapse")).toBe("Options narrowed");
    expect(attemptVerdictLabel("stable")).toBe("Objective held");
    expect(attemptVerdictLabel("unstable")).toBe("Objective not held");
    expect(attemptVerdictLabel("open")).toBe("Objective unresolved");
  });

  it("renders recorded evaluations in pawn units and names their perspective", () => {
    expect(recordedEvaluationTrajectory(267, -34)).toBe(
      "Recorded evaluation from White's side: +2.67 → −0.34 pawns",
    );
  });

  it("frames story re-entry from recorded outcome and ply without exposing an evaluation", () => {
    expect(rehearsalStepLabel(8)).toBe("Rehearsal step 8");
    expect(storyMoveLabel(17)).toBe("Move 9");
    expect(storyReentryCopy("white", "0-1", 17)).toBe(
      "You lost this game. Pick it up at move 9 and play the consequence another way.",
    );
    expect(storyReentryCopy("black", "0-1", 8)).toBe(
      "You won this game. Pick it up at move 4 and test another continuation.",
    );
    expect(storyReentryCopy("white", "1/2-1/2", 0)).toBe(
      "This game was drawn. Pick it up at move 1 and test another continuation.",
    );
    expect(storyReentryCopy("white", undefined, 3)).toBe(
      "Pick this game up at move 2 and play the consequence.",
    );
  });

  it("names the comparison fork separately from consequence rows", () => {
    expect(comparisonStepLabel(0, 2)).toBe("Shared fork · 2 consequence steps available");
    expect(comparisonStepAnnouncement(0, 1)).toBe("Comparison at the shared fork; 1 consequence step is available");
    expect(comparisonStepLabel(2, 2)).toBe("Consequence step 2 / 2");
    expect(comparisonStepAnnouncement(2, 2)).toBe("Comparison consequence step 2 of 2");
  });

  it("translates exact internal half-move counts by their learner-facing role", () => {
    expect(rehearsalTurnCount(0)).toBe("0 turns");
    expect(rehearsalTurnCount(1)).toBe("1 turn");
    expect(rehearsalTurnCount(8)).toBe("8 turns");
    expect(learnerMoveCount(1)).toBe("1 learner move");
    expect(learnerMoveCount(3)).toBe("3 learner moves");
    expect(opponentMoveCount(1)).toBe("1 opponent move");
    expect(opponentMoveCount(3)).toBe("3 opponent moves");
  });

  it("renders story outcomes from the learner's side without PGN or runtime tokens", () => {
    expect(storyOutcomeLabel("white", { kind: "recorded_result", result: "1-0" })).toBe("You won · recorded PGN result");
    expect(storyOutcomeLabel("black", { kind: "recorded_result", result: "1-0" })).toBe("You lost · recorded PGN result");
    expect(storyOutcomeLabel("black", { kind: "recorded_result", result: "1/2-1/2" })).toBe("Game drawn · recorded PGN result");
    expect(storyOutcomeLabel("white", { kind: "board_terminal", result: "loss" })).toBe("You lost · board-terminal result");
    expect(storyOutcomeLabel("white", { kind: "unfinished", result: "*" })).toBe("Game unfinished · no final result recorded");
  });

  it("turns the explorer population into a readable disclosure", () => {
    expect(corpusPopulationLabel({
      source: "lichess-explorer",
      ratings: [1600, 1800],
      speeds: ["blitz", "rapid"],
      since: "2020-01",
      until: "2026-08",
    })).toBe("Lichess games · rating groups 1600, 1800 · blitz, rapid · 2020-01 to 2026-08");
  });

  it("uses one band vocabulary for point and interval values", () => {
    expect(publishedBandLabel({ kind: "below", band: 1000 })).toBe("below band 1000");
    expect(publishedBandInterval({
      state: "bounded",
      interval: [{ kind: "band", value: 1389 }, { kind: "above", band: 2200 }],
      ratedGames: 8,
      abandonedGames: 0,
    })).toBe("band 1389 to above band 2200");
  });

  it("translates repertoire and rating storage states into learner actions", () => {
    expect(repertoireGapStateLabel("open")).toBe("No rehearsal yet");
    expect(repertoireGapStateLabel("addressed")).toBe("Rehearsal played — choose your answer");
    expect(repertoireGapStateLabel("answered")).toBe("Repertoire answer chosen");
    expect(ratingPublicationStateLabel("provisional")).toBe("Still gathering games");
    expect(ratingPublicationStateLabel("published")).toBe("Measured within the ladder");
    expect(ratingPublicationStateLabel("bounded")).toBe("Outside the measured ladder");
  });

  it("renders rated-game history without lifecycle or wire identifiers", () => {
    expect(chessSideLabel("white")).toBe("White");
    expect(chessSideLabel("black")).toBe("Black");
    expect(ratedGameResultLabel({ state: "sealed", voidReason: null, result: "win" })).toBe("Won");
    expect(ratedGameResultLabel({ state: "sealed", voidReason: null, result: null })).toBe("Result pending");
    expect(ratedGameResultLabel({ state: "voided", voidReason: "engine_changed", result: null })).toBe("Not rated — opponent changed");
    expect(ratedGameResultLabel({ state: "voided", voidReason: null, result: null })).toBe("Not rated");
  });
});
