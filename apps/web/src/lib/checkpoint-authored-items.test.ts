import { commitMove, createRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import type { AuthoredFeedbackPage } from "./api.js";
import { checkpointAuthoredItems } from "./checkpoint-authored-items.js";

const at = "2026-08-24T12:00:00.000Z";

function castledRun() {
  const initial = createRun({
    id: "checkpoint-castling",
    session: {
      kind: "position",
      start: { fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", side: "white" },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common" },
    },
    sessionDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 1,
    createdAt: at,
  });
  return commitMove(initial, "e1g1", { at }).run;
}

function pageWith(
  nodeId: string,
  ply: number,
  deviationClass: "concept_violation" | "accepted_alternative",
): AuthoredFeedbackPage {
  return {
    items: [
      {
        kind: "deviation",
        id: "deviation#fixture",
        revealedBy: { kind: "checkpoint", checkpointId: "setup", eventSeq: 3 },
        anchor: { spineNodeId: "setup", moveUci: "e1g1" },
        note: "Synthetic alternative note.",
        deviationClass,
      },
      {
        kind: "theory_verdict",
        id: "theory#fixture",
        revealedBy: { kind: "checkpoint", checkpointId: "boundary", eventSeq: 7 },
        anchor: { nodeId, ply, moveUci: "e1h1" },
        verdict: "classified_deviation",
        deviationClass: "concept_violation",
      },
    ],
    hasWithheldAuthoredContent: true,
  };
}

describe("checkpoint authored item selection", () => {
  it("joins an earlier deviation note across the two legal castling encodings", () => {
    const run = castledRun();
    const castlingNode = run.nodes.at(-1)!;
    expect(castlingNode.moveUci).toBe("e1h1");

    expect(
      checkpointAuthoredItems(
        7,
        pageWith(castlingNode.id, castlingNode.ply, "concept_violation"),
        run,
      ).map((item) => item.id),
    ).toEqual(["theory#fixture", "deviation#fixture"]);
  });

  it("does not attach an unrelated deviation with the same move", () => {
    const run = castledRun();
    const castlingNode = run.nodes.at(-1)!;

    expect(
      checkpointAuthoredItems(
        7,
        pageWith(castlingNode.id, castlingNode.ply, "accepted_alternative"),
        run,
      ).map((item) => item.id),
    ).toEqual(["theory#fixture"]);
  });
});
