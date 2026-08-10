import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  ReplayError,
  appendOpponentPly,
  commitMove,
  createRun,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
  type OpponentSelection,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";
const opponent = (moveUci: string): OpponentSelection => ({
  moveUci,
  candidates: [{ moveUci, mass: 0.6, rank: 1 }],
  engine: {
    id: "mock-opponent",
    name: "Mock opponent",
    version: "1",
    seedHonored: true,
  },
});

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
  run = appendOpponentPly(run, opponent("e7e5"), { at }).run;
  run = commitMove(run, "g1f3", { actor: "user", at }).run;
  run = appendOpponentPly(run, opponent("b8c6"), { at }).run;
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
    expect(
      run.events.find((event) => event.type === "opponent.move_selected"),
    ).toMatchObject({
      data: {
        selection: {
          moveUci: "e7e5",
          candidates: [{ moveUci: "e7e5", mass: 0.6, rank: 1 }],
          engine: { id: "mock-opponent", seedHonored: true },
        },
      },
    });
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

  it("rejects disagreement inside the typed v0.4 selection payload", () => {
    const events: readonly DrillRunEvent[] = playedRun().events.map((event) =>
      event.type === "opponent.move_selected" && event.data.moveUci === "e7e5"
        ? {
            ...event,
            data: {
              ...event.data,
              selection: { ...event.data.selection, moveUci: "c7c5" },
            },
          }
        : event,
    );

    expect(() => readBackReplay(events)).toThrowError(
      "selection payload and event move disagree",
    );
  });
});
