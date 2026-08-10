import { INITIAL_FEN } from "chessops/fen";
import { parsePgn, startingPosition, walk } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import {
  RuntimeError,
  appendOpponentPly,
  commitMove,
  compare,
  createRun,
  exportPgn,
  readBackReplay,
  reachCheckpoint,
  rewind,
  type DrillRun,
  type MutationResult,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";

class DeterministicMockOpponent {
  private index = 0;

  constructor(private readonly moves: readonly string[]) {}

  play(run: DrillRun): MutationResult {
    const move = this.moves[this.index];
    if (move === undefined) throw new Error("Mock opponent script exhausted");
    this.index += 1;
    const result = appendOpponentPly(
      run,
      {
        moveUci: move,
        engine: {
          id: "deterministic-mock",
          name: "Deterministic mock",
          version: "1",
          seedHonored: true,
        },
      },
      { at },
    );
    expect(result.emitted.map((event) => event.type)).toEqual([
      "opponent.move_selected",
      "move.committed",
    ]);
    return result;
  }
}

function newRun(): DrillRun {
  return createRun({
    id: "vertical-run",
    packId: "vertical-pack",
    packDigest: `sha256:${"1".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: {
        executedAt: "server",
        engineIds: [],
        modelIds: [{ id: "deterministic-mock", version: "1" }],
      },
    },
    startFen: INITIAL_FEN,
    seed: 17,
    createdAt: at,
  });
}

describe("branch-runtime vertical acceptance scenario", () => {
  it("plays, checkpoints, rewinds, branches, compares, exports, and reads back", () => {
    const opponent = new DeterministicMockOpponent(["e7e5", "b8c6", "a7a6", "g8f6"]);
    let run = newRun();

    run = commitMove(run, "e2e4", { at }).run;
    run = opponent.play(run).run;
    const forkNodeId = run.activeCursor.nodeId;
    run = commitMove(run, "g1f3", { at }).run;
    run = opponent.play(run).run;
    run = commitMove(run, "f1b5", { at }).run;
    run = opponent.play(run).run;
    expect(run.nodes.at(-1)!.ply).toBe(6);
    run = reachCheckpoint(run, "six-ply-consequence", at).run;

    run = rewind(run, forkNodeId, at).run;
    const alternative = commitMove(run, "f1c4", { at });
    expect(alternative.emitted.map((event) => event.type)).toEqual([
      "branch.forked",
      "move.committed",
    ]);
    run = alternative.run;
    expect(run.branches.at(-1)).toMatchObject({ label: "alt-1", forkNodeId });
    run = opponent.play(run).run;
    run = commitMove(run, "d2d3", { at }).run;

    const comparison = compare(run, run.branches[0]!.id, run.branches[1]!.id);
    expect(comparison.forkNodeId).toBe(forkNodeId);
    expect(comparison.pairs.map((pair) => [pair.a?.moveUci, pair.b?.moveUci])).toEqual([
      ["g1f3", "f1c4"],
      ["b8c6", "g8f6"],
      ["f1b5", "d2d3"],
      ["a7a6", undefined],
    ]);
    expect(comparison.pairs[3]).not.toHaveProperty("b");
    expect(comparison.checkpointHits.a).toEqual([
      expect.objectContaining({ checkpointId: "six-ply-consequence", plyOffset: 4 }),
    ]);
    expect(comparison.checkpointHits.b).toEqual([]);

    const pgn = exportPgn(run);
    expect(pgn).toContain("Bb5");
    expect(pgn).toContain("Bc4");
    const [game] = parsePgn(pgn);
    expect(game).toBeDefined();
    const position = startingPosition(game!.headers).unwrap();
    walk(game!.moves, position, (branchPosition, data) => {
      const move = parseSan(branchPosition, data.san);
      expect(move).toBeDefined();
      branchPosition.play(move!);
    });

    const firstReplay = readBackReplay(run.events);
    const secondReplay = readBackReplay(run.events);
    expect(firstReplay).toEqual(secondReplay);
    expect(firstReplay.run).toEqual(run);
    expect(firstReplay.opponentMoves.map((move) => move.moveUci)).toEqual([
      "e7e5",
      "b8c6",
      "a7a6",
      "g8f6",
    ]);
  });

  it("keeps the integrated error surface explicit", () => {
    const run = newRun();
    for (const [uci, reason] of [
      ["not-uci", "malformed-UCI"],
      ["e7e5", "wrong-side"],
      ["e2e5", "not-a-legal-move"],
    ] as const) {
      try {
        commitMove(run, uci, { at });
        throw new Error("Expected illegal move to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(RuntimeError);
        expect(error).toMatchObject({ code: "ILLEGAL_MOVE", reason });
      }
    }
  });
});
