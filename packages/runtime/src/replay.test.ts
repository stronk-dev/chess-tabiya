import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  ReplayError,
  commitMove,
  createRun,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";

function playedRun(): DrillRun {
  let run = createRun({
    id: "replay-run",
    packId: "replay-pack",
    packDigest: `sha256:${"d".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: {
        executedAt: "server",
        engineIds: [],
        modelIds: [{ id: "mock-opponent", version: "1" }],
      },
    },
    startFen: INITIAL_FEN,
    seed: 5,
    createdAt: at,
  });
  run = commitMove(run, "e2e4", { actor: "user", at }).run;
  run = commitMove(run, "e7e5", { actor: "opponent", at }).run;
  run = commitMove(run, "g1f3", { actor: "user", at }).run;
  run = commitMove(run, "b8c6", { actor: "opponent", at }).run;
  return run;
}

describe("authoritative read-back replay", () => {
  it("records opponent selection before commit and reads it back without a policy", () => {
    const run = playedRun();
    expect(run.events.map((event) => event.type)).toEqual([
      "run.started",
      "move.committed",
      "opponent.move_selected",
      "move.committed",
      "move.committed",
      "opponent.move_selected",
      "move.committed",
    ]);

    const replayed = readBackReplay(run.events);
    expect(replayed.run).toEqual(run);
    expect(replayed.opponentMoves).toEqual([
      expect.objectContaining({ moveUci: "e7e5", selectionSeq: 3 }),
      expect.objectContaining({ moveUci: "b8c6", selectionSeq: 6 }),
    ]);
  });

  it("reconstructs identically on repeated read-back", () => {
    const events = playedRun().events;
    expect(readBackReplay(events)).toEqual(readBackReplay(events));
  });

  it("rejects disagreement instead of recomputing an opponent move", () => {
    const events: readonly DrillRunEvent[] = playedRun().events.map((event) =>
      event.type === "opponent.move_selected" && event.data.moveUci === "e7e5"
        ? { ...event, data: { ...event.data, moveUci: "c7c5" } }
        : event,
    );

    expect(() => readBackReplay(events)).toThrow(ReplayError);
  });
});
