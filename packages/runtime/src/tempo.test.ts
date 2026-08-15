import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { commitMove, createRun, tempoMovesFromRun, unauthoredTempoTransition, windowStates } from "./index.js";
import type { DrillRun } from "./types.js";
import type { TimingWindowDefinition } from "@chess-tabiya/schema/drill-pack";

const digest = `sha256:${"7".repeat(64)}`;

function line(moves: readonly string[]): DrillRun {
  let run = createRun({
    id: "tempo-run",
    packId: "tempo-pack",
    packDigest: digest,
    startFen: INITIAL_FEN,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: "2026-08-15T12:00:00.000Z",
  });
  for (const move of moves) run = commitMove(run, move).run;
  return run;
}

function window(overrides: Partial<TimingWindowDefinition>): TimingWindowDefinition {
  return {
    id: "race",
    opens: { fromStart: true },
    closes: [{ kind: "deadline", afterLearnerMoves: 8 }],
    readiness: { mode: "all", of: [{ moveUci: "h2h3" }] },
    luxuryMoveBudget: 0,
    ...overrides,
  };
}

describe("timing-window projection", () => {
  it("derives every verdict from the current root-to-node path", () => {
    const path = tempoMovesFromRun(line(["e2e4", "e7e5", "g1f3", "b8c6"]));
    const windows: readonly TimingWindowDefinition[] = [
      window({ id: "unopened", opens: { onMove: [{ moveUci: "h2h4" }] } }),
      window({ id: "open", closes: [{ kind: "deadline", afterLearnerMoves: 8 }] }),
      window({ id: "in-time", closes: [{ kind: "arrival", move: { moveUci: "e7e5" } }], readiness: { mode: "all", of: [{ moveUci: "e2e4" }] } }),
      window({ id: "over", closes: [{ kind: "arrival", move: { moveUci: "b8c6" } }], readiness: { mode: "all", of: [{ moveUci: "g1f3" }] } }),
      window({ id: "slow", closes: [{ kind: "deadline", afterLearnerMoves: 2 }] }),
      window({ id: "outpaced", closes: [{ kind: "arrival", move: { moveUci: "e7e5" } }], readiness: { mode: "all", of: [{ moveUci: "e2e4" }, { moveUci: "g1f3" }] } }),
      window({ id: "premature", closes: [{ kind: "release", move: { moveUci: "e2e4" } }], readiness: { mode: "all", of: [{ moveUci: "g1f3" }] } }),
    ];

    expect(windowStates(windows, path, "white").map((state) => state.verdict)).toEqual([
      "unopened", "open", "in_time", "over_budget", "too_slow", "outpaced", "premature",
    ]);
  });

  it("counts at most one readiness item per move and stops spend after readiness", () => {
    const path = tempoMovesFromRun(line(["e2e4", "e7e5", "g1f3", "b8c6"]));
    const state = windowStates([window({
      readiness: { mode: "all", of: [{ moveUci: "g1f3" }, { piece: { color: "white", role: "knight" }, to: "f3" }] },
      closes: [{ kind: "deadline", afterLearnerMoves: 2 }],
      luxuryMoveBudget: 2,
    })], path, "white")[0]!;
    expect(state).toMatchObject({ verdict: "too_slow", satisfied: 1, learnerMoves: 2, spend: 1 });
  });

  it("publishes the unauthored outpaced default without inventing a detector", () => {
    expect(unauthoredTempoTransition("outpaced")).toBe("failed");
    expect(unauthoredTempoTransition("too_slow")).toBeNull();
  });
});
