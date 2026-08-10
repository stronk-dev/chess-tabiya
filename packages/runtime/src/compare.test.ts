import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  BranchQueryError,
  commitMove,
  compare,
  createRun,
  reachCheckpoint,
  rewind,
  transitionObjective,
  type DrillRun,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";

function branchedRun(): DrillRun {
  let run = createRun({
    id: "compare-run",
    packId: "compare-pack",
    packDigest: `sha256:${"e".repeat(64)}`,
    policyConfig: {
      seedMode: "per_branch",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: INITIAL_FEN,
    seed: 20,
    createdAt: at,
  });
  run = commitMove(run, "e2e4", { at }).run;
  const forkNodeId = run.activeCursor.nodeId;
  run = commitMove(run, "e7e5", { actor: "opponent", at }).run;
  run = commitMove(run, "g1f3", { at }).run;
  run = commitMove(run, "b8c6", { actor: "opponent", at }).run;
  run = reachCheckpoint(run, "main-result", at).run;
  run = transitionObjective(run, "preserved", ["evidence:main"], at).run;
  run = rewind(run, forkNodeId, at).run;
  run = commitMove(run, "c7c5", { actor: "opponent", at }).run;
  run = commitMove(run, "g1f3", { at }).run;
  run = reachCheckpoint(run, "alternative-result", at).run;
  return transitionObjective(run, "degraded", ["evidence:alternative"], at).run;
}

describe("branch comparison", () => {
  it("aligns consequences from the last common fork and marks an absent side", () => {
    const run = branchedRun();
    const [main, alternative] = run.branches;
    const result = compare(run, main!.id, alternative!.id);

    expect(result.forkNodeId).toBe(run.nodes[1]!.id);
    expect(result.pairs.map((pair) => [pair.a?.moveUci, pair.b?.moveUci])).toEqual([
      ["e7e5", "c7c5"],
      ["g1f3", "g1f3"],
      ["b8c6", undefined],
    ]);
    expect(result.pairs[2]).not.toHaveProperty("b");
    expect(result.pairs.map((pair) => pair.plyOffset)).toEqual([1, 2, 3]);
  });

  it("returns objective timelines and checkpoint hits for each branch path", () => {
    const run = branchedRun();
    const result = compare(run, run.branches[0]!.id, run.branches[1]!.id);

    expect(result.objectiveTimelines.a).toEqual([
      expect.objectContaining({
        plyOffset: 3,
        from: "active",
        to: "preserved",
        evidenceRefs: ["evidence:main"],
      }),
    ]);
    expect(result.objectiveTimelines.b).toEqual([
      expect.objectContaining({
        plyOffset: 2,
        from: "active",
        to: "degraded",
        evidenceRefs: ["evidence:alternative"],
      }),
    ]);
    expect(result.checkpointHits.a).toEqual([
      expect.objectContaining({ checkpointId: "main-result", plyOffset: 3 }),
    ]);
    expect(result.checkpointHits.b).toEqual([
      expect.objectContaining({ checkpointId: "alternative-result", plyOffset: 2 }),
    ]);
  });

  it("rejects unknown branches instead of comparing unrelated data", () => {
    const run = branchedRun();
    expect(() => compare(run, run.branches[0]!.id, "missing")).toThrow(
      BranchQueryError,
    );
  });
});
