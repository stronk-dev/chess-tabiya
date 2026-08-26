import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  commitMove,
  compareBranches,
  createRun,
  fork,
  reachCheckpoint,
  rewind,
  transitionObjective,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  activeNode,
  branchCards,
  comparisonNode,
  difficultyBand,
  latestCheckpoint,
  packObjective,
  packStartSide,
  timelineBranchCards,
  timelineEntries,
  whyBanner,
} from "./screen-model.js";

const pack = JSON.parse(
  readFileSync(
    new URL("../../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;
const at = "2026-08-11T20:00:00.000Z";

function run() {
  return createRun({
    id: "screen-run",
    packId: pack.id,
    packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: pack.start.fen,
    seed: 5,
    createdAt: at,
  });
}

describe("screen view models", () => {
  it("derives pack labels, active timeline, and checkpoint notices", () => {
    const moved = commitMove(run(), "c1e3", { at });
    const checkpoint = reachCheckpoint(moved.run, "plan-commitment", at);

    expect(packStartSide(pack)).toBe("white");
    expect(packObjective(pack)).toContain("execute its first plan");
    expect(difficultyBand(pack.difficulty)).toBe("advanced club");
    expect(activeNode(checkpoint.run).moveSan).toBe("Be3");
    expect(timelineEntries(checkpoint.run)).toEqual([
      expect.objectContaining({
        moveSan: "Be3",
        checkpointIds: ["plan-commitment"],
      }),
    ]);
    expect(latestCheckpoint(pack, checkpoint.run)).toMatchObject({
      id: "plan-commitment",
      label: "Choose the setup",
    });
  });

  it("models immutable branches and aligned compare positions", () => {
    const first = commitMove(run(), "c1e3", { at });
    const second = commitMove(first.run, "e7e6", { at });
    const rewound = rewind(second.run, first.run.activeCursor.nodeId, at);
    const forked = fork(rewound.run, rewound.run.activeCursor.nodeId, {
      label: "quiet setup",
      intent: "Compare development",
      at,
    });
    const alternative = commitMove(forked.run, "b7b5", { at });
    const cards = branchCards(alternative.run);
    const comparison = compareBranches(alternative.run, alternative.run.branches.map((branch) => branch.id));

    expect(cards).toEqual([
      expect.objectContaining({ label: "main", firstMove: "Be3" }),
      expect.objectContaining({
        label: "quiet setup",
        intent: "Compare development",
        firstMove: "b5",
      }),
    ]);
    expect(timelineBranchCards(alternative.run)).toEqual([
      expect.objectContaining({ id: cards[0]!.id, forkNodeId: first.run.activeCursor.nodeId }),
      expect.objectContaining({ id: cards[1]!.id, forkNodeId: first.run.activeCursor.nodeId }),
    ]);
    expect(comparisonNode(alternative.run, comparison, 0, alternative.run.branches[0]!.id)?.moveSan).toBe(
      "Be3",
    );

    const automatic = fork(rewound.run, rewound.run.activeCursor.nodeId, { intent: "Test the queenside break", at });
    const automaticMove = commitMove(automatic.run, "b7b5", { at });
    expect(branchCards(automaticMove.run)[1]).toMatchObject({ label: "b5 — Test the queenside break", firstMove: "b5" });
    expect(comparisonNode(alternative.run, comparison, 1, alternative.run.branches[0]!.id)?.moveSan).toBe(
      "e6",
    );
    expect(comparisonNode(alternative.run, comparison, 1, alternative.run.branches[1]!.id)?.moveSan).toBe("b5");
  });

  it("never produces a bare objective why-banner", () => {
    const moved = commitMove(run(), "c1e3", { at });
    const transitioned = transitionObjective(
      moved.run,
      "preserved",
      ["pack:plan-commitment"],
      at,
    );
    expect(whyBanner(pack, transitioned.run)).toEqual({
      state: "preserved",
      eventSeq: 3,
      sentences: [
        {
          reference: "pack:plan-commitment",
          text: "Checkpoint reached: Choose the setup.",
          sourceLabel: "Pack",
        },
      ],
    });
    const broken = structuredClone(transitioned.run);
    const event = broken.events.at(-1)!;
    if (event.type !== "objective.state_changed") throw new Error("test setup");
    (event.data.evidenceRefs as string[]) = [];
    expect(() => whyBanner(pack, broken)).toThrow("no renderable evidence refs");
  });
});
