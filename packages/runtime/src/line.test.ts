import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import {
  commitMove,
  createRun,
  evaluateObjectivePredicate,
  insideAuthoredBoundary,
  lineMembership,
  spineNodeIdFor,
  spinePositionIndex,
} from "./index.js";

const at = "2026-08-13T08:00:00.000Z";

function pack(horizon = 2): DrillPackDefinition {
  return {
    id: "line-test",
    version: "1",
    mode: "line",
    start: { fen: INITIAL_FEN, side: "white" },
    objective: { type: "follow_theory", summary: "Recall the line" },
    checkpoints: [{ id: "boundary", trigger: { atAuthoredBoundary: "crossed" } }],
    authoredBoundary: { spineNodeIds: ["e4", "e5", "nf3"], plyHorizon: horizon },
    spine: [{
      id: "e4", moveUci: "e2e4", moveSan: "e4", children: [{
        id: "e5", moveUci: "e7e5", moveSan: "e5", children: [{
          id: "nf3", moveUci: "g1f3", moveSan: "Nf3", children: [],
        }],
      }],
    }],
    deviations: [{
      at: { spineNodeId: "e4" },
      moveUci: "c7c5",
      class: "accepted_alternative",
      mistake: ["timing", "plan"],
    }],
  };
}

function run(moves: readonly string[]) {
  let value = createRun({
    id: `line-${moves.join("-")}`,
    packId: "line-test",
    packDigest: `sha256:${"1".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: INITIAL_FEN,
    seed: 1,
    createdAt: at,
  });
  for (const move of moves) value = commitMove(value, move, { at }).run;
  return value;
}

describe("line membership", () => {
  it("caps authored support without granting it and gives on-line precedence", () => {
    const played = run(["e2e4", "e7e5", "g1f3"]);
    expect(lineMembership(pack(), played, played.activeCursor.nodeId)).toEqual([
      expect.objectContaining({ ply: 1, verdict: "on_line", spineNodeId: "e4", insideBoundary: true }),
      expect.objectContaining({ ply: 2, verdict: "on_line", spineNodeId: "e5", insideBoundary: true }),
      expect.objectContaining({ ply: 3, verdict: "unknown", insideBoundary: false }),
    ]);
    expect(insideAuthoredBoundary(pack(), played, played.nodes.at(-1)!)).toBe(false);
  });

  it("distinguishes an authored deviation from pack silence", () => {
    const classified = run(["e2e4", "c7c5"]);
    expect(lineMembership(pack(), classified, classified.activeCursor.nodeId).at(-1)).toMatchObject({
      verdict: "classified_deviation",
      deviationClass: "accepted_alternative",
      deviationMistakes: ["timing", "plan"],
    });
    const unknown = run(["e2e4", "e7e6"]);
    expect(lineMembership(pack(), unknown, unknown.activeCursor.nodeId).at(-1)).toMatchObject({ verdict: "unknown" });
  });

  it("resolves a transposition back onto the authored spine", () => {
    const transpositionPack: DrillPackDefinition = {
      ...pack(10),
      authoredBoundary: { spineNodeIds: ["nf3", "d5", "g3"], plyHorizon: 10 },
      spine: [{ id: "nf3", moveUci: "g1f3", moveSan: "Nf3", children: [{ id: "d5", moveUci: "d7d5", moveSan: "d5", children: [{ id: "g3", moveUci: "g2g3", moveSan: "g3", children: [] }] }] }],
      deviations: [],
    };
    const transposed = run(["g2g3", "d7d5", "g1f3"]);
    expect(spineNodeIdFor(spinePositionIndex(transpositionPack), transposed.nodes.at(-1)!)).toBe("g3");
  });

  it("matches deviationPlayed only on the anchored edge", () => {
    const played = run(["e2e4", "c7c5"]);
    const parent = played.nodes.at(-2)!;
    expect(evaluateObjectivePredicate(played, {
      type: "deviationPlayed",
      fromTransposeKey: parent.transposeKey,
      moveUci: "c7c5",
    })).toBe(true);
    const later = commitMove(played, "g1f3", { at }).run;
    expect(evaluateObjectivePredicate(later, {
      type: "deviationPlayed",
      fromTransposeKey: parent.transposeKey,
      moveUci: "c7c5",
    })).toBe(false);
  });
});
