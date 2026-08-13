import { appendOpponentPly, commitMove, createRun, projectRun, trajectoryVerdict } from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { orchestratePackMove } from "./pack-orchestrator.js";
import { validatePackDocument } from "./pack-validation.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const at = "2026-08-13T13:00:00.000Z";

const pack = {
  id: "trajectory-fixture",
  version: "0.1.0",
  title: "Mechanical trajectory fixture",
  mode: "trajectory",
  phase: "cross_phase",
  start: { fen: FEN, side: "white" },
  objective: { type: "run_trajectory", summary: "Play one continuous path." },
  legs: [
    {
      id: "opening",
      objective: {
        type: "execute_break",
        summary: "Reach the first boundary.",
        successConditions: [{ kind: "reach_checkpoint", checkpointId: "middle", to: "preserved" }],
      },
    },
    {
      id: "middle",
      entryCheckpointId: "middle",
      objective: {
        type: "execute_break",
        summary: "Reach the second boundary.",
        successConditions: [{ kind: "reach_checkpoint", checkpointId: "ending", to: "preserved" }],
      },
    },
    {
      id: "ending",
      entryCheckpointId: "ending",
      objective: { type: "play_until_checkpoint", summary: "Continue from the resulting position." },
    },
  ],
  checkpoints: [
    { id: "middle", label: "Middle boundary", trigger: { atPly: 1 }, actions: [] },
    { id: "ending", label: "Ending boundary", trigger: { atPly: 2 }, actions: [] },
  ],
  opponentPolicy: { mode: "human_common", targetElo: 1600 },
  feedbackPolicy: "delayed_checkpoint",
  provenance: { reviewStatus: "draft", sources: [], reviewers: [] },
} as unknown as DrillPackDefinition;

function rootRun() {
  return createRun({
    id: "trajectory-run",
    packId: pack.id,
    packDigest: `sha256:${"7".repeat(64)}`,
    startFen: FEN,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 3,
    createdAt: at,
  });
}

describe("Trajectory Drill", () => {
  it("seals and resets each outgoing leg while preserving a replayable causal path", () => {
    let run = rootRun();
    const first = commitMove(run, "e2e4", { at });
    run = orchestratePackMove(pack, run, first).run;
    const second = appendOpponentPly(run, {
      moveUci: "e7e5",
      policyModeApplied: "human_common",
      engine: { id: "fixture", name: "Fixture", version: "1", seedHonored: true },
    }, { at });
    run = orchestratePackMove(pack, run, second).run;

    const transitions = run.events.filter((event) => event.type === "objective.state_changed");
    expect(transitions.map((event) => event.type === "objective.state_changed" && [event.data.from, event.data.to])).toEqual([
      ["active", "preserved"], ["preserved", "active"],
      ["active", "preserved"], ["preserved", "active"],
    ]);
    const verdict = trajectoryVerdict(pack, run, run.activeCursor.nodeId);
    expect(verdict.legs.map((leg) => [leg.legId, leg.status, leg.state])).toEqual([
      ["opening", "entered", "preserved"],
      ["middle", "entered", "preserved"],
      ["ending", "entered", "active"],
    ]);
    expect(verdict.transitions.map((transition) => transition.producedBy)).toEqual([["e2e4"], ["e7e5"]]);
    expect(projectRun(run.events)).toEqual(run);
  });

  it("rejects structural trajectory contradictions instead of blessing inert content", () => {
    const invalid = structuredClone(pack) as any;
    invalid.legs[0].entryCheckpointId = "middle";
    invalid.legs[1].entryCheckpointId = "missing";
    invalid.legs[1].objective.successConditions = [{ kind: "reach_checkpoint", checkpointId: "middle" }];
    const result = validatePackDocument(invalid);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "TRAJECTORY_FIRST_LEG_HAS_ENTRY",
      "TRAJECTORY_LEG_ENTRY_UNKNOWN",
      "TRAJECTORY_NONFINAL_LEG_ABSORBING",
      "TRAJECTORY_LEG_CONDITION_PRECEDES_ENTRY",
    ]));
  });
});
