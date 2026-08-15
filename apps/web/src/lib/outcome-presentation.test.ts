import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  appendOpponentPly,
  commitMove,
  createRun,
  type OpponentSelection,
} from "@chess-tabiya/runtime";

import {
  assessmentSentence,
  checkpointResolutionSentence,
  objectiveGradeSentence,
  resistanceSentences,
  type ProjectedGrading,
} from "./outcome-presentation.js";

const at = "2026-08-12T12:00:00.000Z";

function run() {
  return createRun({
    id: "presentation-run",
    session: {
      kind: "pack",
      packId: "outcome-pack",
      packDigest: `sha256:${"b".repeat(64)}`,
      start: { fen: INITIAL_FEN, side: "white" },
      feedbackPolicy: "delayed_checkpoint",
      opponentPolicy: { mode: "theory_strict", targetElo: 1900 },
    },
    sessionDigest: `sha256:${"b".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: at,
  });
}

describe("outcome presentation honesty", () => {
  it("labels authored and ledger-verified root assessments differently", () => {
    const authored: ProjectedGrading = {
      assessedBy: { kind: "authored", note: "Author's stated root." },
      resolveAt: { kind: "terminal" },
      grounding: "unverified",
    };
    expect(assessmentSentence(authored)).toBe(
      "Root assessment (authored, unproved): Author's stated root.",
    );
    const exact: ProjectedGrading = {
      assessedBy: {
        kind: "syzygy",
        category: "draw",
        pieceCount: 6,
        sourceId: "syzygy",
        retrievedAt: "2026-08-12T12:00:00.000Z",
      },
      resolveAt: { kind: "terminal" },
      grounding: "ledger_verified",
    };
    expect(assessmentSentence(exact)).toContain("Syzygy tablebase, 6 pieces");
    expect(assessmentSentence(exact)).toContain("Exact.");
    expect(assessmentSentence({ ...exact, grounding: "unverified" })).not.toMatch(/Syzygy|exact/);

    const measured: ProjectedGrading = {
      assessedBy: { kind: "engine", score: { kind: "cp", centipawns: 54 }, perspective: "white", depth: 22, engineId: "stockfish-authoring", engineVersion: "18", sourceId: "stockfish-authoring", retrievedAt: at },
      resolveAt: { kind: "terminal" },
      grounding: "ledger_verified",
    };
    expect(assessmentSentence(measured)).toBe("Root assessment: +0.54 for White — stockfish-authoring 18 at depth 22, retrieved 2026-08-12T12:00:00.000Z. An engine evaluation at a fixed depth, not a proof.");
    expect(assessmentSentence({ ...measured, grounding: "unverified" })).toBe("Root assessment (declared, unproved): an engine evaluation is declared but no matching evidence record backs it, so it is shown as a claim.");
  });

  it("states the request before play and the recorded engine after play without claiming policy", () => {
    const before = run();
    expect(resistanceSentences(before, before.activeCursor.nodeId)).toEqual([
      "Requested resistance: theory_strict, target Elo 1900 — the pack's request.",
      "No opponent move has been played yet.",
      "`theory_strict` has authored replies only inside this pack's spine. `plyHorizon` caps authored support; the spine index governs authored replies; the two can end at different plies.",
      "Not perfect play.",
    ]);
    let after = commitMove(before, "e2e4", { actor: "user", at }).run;
    const selection: OpponentSelection = {
      moveUci: "e7e5",
      policyModeApplied: "theory_strict",
      engine: {
        id: "mock-opponent",
        name: "Deterministic mock opponent",
        version: "1",
        seedHonored: true,
      },
    };
    after = appendOpponentPly(after, selection, { at }).run;
    const text = resistanceSentences(after, after.activeCursor.nodeId).join(" ");
    expect(text).toContain("Deterministic mock opponent (mock-opponent v1)");
    expect(text).toContain("Applied policy: theory_strict");
    expect(text).not.toContain("not which policy it applied");
    expect(text).not.toContain("actually played");
    expect(text).not.toContain("Maia");
  });

  it("keeps the archived policy disclaimer only for migrated unknown plies", () => {
    let migrated = commitMove(run(), "e2e4", { actor: "user", at }).run;
    migrated = appendOpponentPly(migrated, {
      moveUci: "e7e5",
      policyModeApplied: "unknown",
      engine: { id: "legacy", name: "Legacy engine", version: "unknown", seedHonored: false },
    }, { at }).run;
    const text = resistanceSentences(migrated, migrated.activeCursor.nodeId).join(" ");
    expect(text).toContain("1 of these plies predate policy recording.");
    expect(text).toContain("The run records which engine played, not which policy it applied");
    expect(text).not.toContain("Applied policy:");
  });

  it("distinguishes a requested Elo band from one the recorded engine applied", () => {
    let honored = commitMove(run(), "e2e4", { actor: "user", at }).run;
    honored = appendOpponentPly(honored, {
      moveUci: "e7e5",
      policyModeApplied: "human_common",
      engine: {
        id: "maia",
        name: "Maia",
        version: "1",
        seedHonored: false,
        eloHonored: true,
        eloApplied: 1900,
      },
    }, { at }).run;
    expect(resistanceSentences(honored, honored.activeCursor.nodeId)).toContain(
      "The engine advertised its rating-band option and recorded target Elo 1900 as applied.",
    );

    let unhonored = commitMove(run(), "e2e4", { actor: "user", at }).run;
    unhonored = appendOpponentPly(unhonored, {
      moveUci: "e7e5",
      policyModeApplied: "human_common",
      engine: {
        id: "fixture",
        name: "Fixture",
        version: "1",
        seedHonored: false,
        eloHonored: false,
      },
    }, { at }).run;
    expect(resistanceSentences(unhonored, unhonored.activeCursor.nodeId)).toContain(
      "Target Elo 1900 was requested but is not recorded as applied.",
    );
  });

  it("never turns non-terminal grades into chess results", () => {
    for (const state of ["preserved", "degraded"] as const) {
      const sentence = checkpointResolutionSentence("Authored horizon", state);
      expect(sentence.toLowerCase()).not.toMatch(/draw|held|you drew|you won/);
    }
    expect(objectiveGradeSentence("hold", "active")).toContain("unresolved");
  });
});
