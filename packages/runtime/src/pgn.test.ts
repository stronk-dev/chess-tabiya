import { INITIAL_FEN } from "chessops/fen";
import { parsePgn, startingPosition, walk } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import {
  PgnExportError,
  appendOpponentPly,
  commitMove,
  createRun,
  exportPgn,
  rewind,
  type DrillRun,
  type OpponentSelection,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";
const opponent = (moveUci: string): OpponentSelection => ({
  moveUci,
  engine: {
    id: "mock-opponent",
    name: "Mock opponent",
    version: "1",
    seedHonored: true,
  },
});

function branchedRun(): DrillRun {
  let run = createRun({
    id: "pgn-run",
    packId: "pgn-pack",
    packDigest: `sha256:${"f".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "browser", engineIds: [], modelIds: [] },
    },
    startFen: INITIAL_FEN,
    seed: 3,
    createdAt: at,
  });
  run = commitMove(run, "e2e4", { at }).run;
  const forkNodeId = run.activeCursor.nodeId;
  run = appendOpponentPly(run, opponent("e7e5"), { at }).run;
  run = commitMove(run, "g1f3", { at }).run;
  run = rewind(run, forkNodeId, at).run;
  return appendOpponentPly(run, opponent("c7c5"), { at }).run;
}

describe("PGN variation export", () => {
  it("exports all selected branches as a legal chessops PGN tree", () => {
    const pgn = exportPgn(branchedRun());
    expect(pgn).toContain("e5");
    expect(pgn).toContain("c5");
    expect(pgn).toContain("Tabiya branch: alt-1");

    const games = parsePgn(pgn);
    expect(games).toHaveLength(1);
    const game = games[0]!;
    const position = startingPosition(game.headers).unwrap();
    let legalMoves = 0;
    walk(game.moves, position, (branchPosition, data) => {
      const move = parseSan(branchPosition, data.san);
      expect(move, `illegal exported SAN: ${data.san}`).toBeDefined();
      branchPosition.play(move!);
      legalMoves += 1;
    });
    expect(legalMoves).toBe(4);
  });

  it("can export only one requested branch", () => {
    const run = branchedRun();
    const pgn = exportPgn(run, [run.branches[1]!.id]);

    expect(pgn).toContain("c5");
    expect(pgn).not.toContain("e5");
  });

  it("rejects a corrupted move path before writing PGN", () => {
    const run = branchedRun();
    const corrupted: DrillRun = {
      ...run,
      nodes: run.nodes.map((node) =>
        node.moveUci === "e7e5" ? { ...node, moveUci: "e7e6" } : node,
      ),
    };

    expect(() => exportPgn(corrupted)).toThrow(PgnExportError);
  });
});
