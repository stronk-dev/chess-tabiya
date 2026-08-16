import { readFileSync } from "node:fs";
import {
  digestDrillPack,
  type DrillPackDefinition,
  type SpineNode,
} from "@chess-tabiya/schema/drill-pack";
import { makePgn, parsePgn, startingPosition, walk } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import { appendOpponentPly, commitMove, createRun, rewind } from "./runtime.js";
import type { OpponentSelection, RunMark } from "./types.js";
import { exportPackRunPgn } from "./pack-pgn.js";

const fixtureUrl = new URL(
  "../../../schemas/drill_pack.example.json",
  import.meta.url,
);
const opponent = (moveUci: string): OpponentSelection => ({
  moveUci,
  policyModeApplied: "human_common",
  engine: {
    id: "mock-opponent",
    name: "Mock opponent",
    version: "1",
    seedHonored: true,
  },
});

function loadPack(): DrillPackDefinition {
  return JSON.parse(readFileSync(fixtureUrl, "utf8")) as DrillPackDefinition;
}

function findSpineNode(pack: DrillPackDefinition, id: string): SpineNode {
  const pending = [...(pack.spine ?? [])];
  while (pending.length > 0) {
    const node = pending.shift();
    if (node === undefined) break;
    if (node.id === id) return node;
    pending.push(...node.children);
  }
  throw new Error(`Missing spine node: ${id}`);
}

function assertLegal(pgn: string): number {
  const games = parsePgn(pgn);
  expect(games).toHaveLength(1);
  const game = games[0]!;
  const position = startingPosition(game.headers).unwrap();
  let count = 0;
  walk(game.moves, position, (branchPosition, data) => {
    const move = parseSan(branchPosition, data.san);
    expect(move, `illegal SAN: ${data.san}`).toBeDefined();
    branchPosition.play(move!);
    count += 1;
  });
  return count;
}

describe("pack + run PGN export", () => {
  it("round-trips the amended Najdorf spine and a run deviation as legal variations", async () => {
    const pack = loadPack();
    const digest = await digestDrillPack(pack);
    let run = createRun({
      id: "najdorf-round-trip",
      packId: pack.id,
      packDigest: digest,
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "browser", engineIds: [], modelIds: [] },
      },
      startFen: pack.start.fen,
      seed: 42,
      createdAt: "2026-08-10T12:00:00.000Z",
    });

    const be3 = findSpineNode(pack, "najdorf-be3");
    const e6 = findSpineNode(pack, "najdorf-e6");
    const f3 = findSpineNode(pack, "najdorf-f3");
    const b5 = findSpineNode(pack, "najdorf-b5");

    run = commitMove(run, be3.moveUci).run;
    run = appendOpponentPly(run, opponent(e6.moveUci)).run;
    const checkpointNodeId = run.activeCursor.nodeId;
    run = commitMove(run, f3.moveUci).run;
    run = appendOpponentPly(run, opponent(b5.moveUci)).run;
    const authoredBranchId = run.activeCursor.branchId;

    run = rewind(run, checkpointNodeId).run;
    expect(findSpineNode(pack, "najdorf-e6").children.map((node) => node.moveUci))
      .not.toContain("g2g3");
    run = commitMove(run, "g2g3").run;
    run = appendOpponentPly(run, opponent("b7b5")).run;
    expect(run.branches.at(-1)?.label).toBe("alt-1");
    const alternateLeaf = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
    const marks: readonly RunMark[] = [
      { scope: "position", scopeKey: run.nodes[0]!.transposeKey, brush: "green", orig: "e2", at: "2026-08-16T12:00:00.000Z" },
      { scope: "branch", scopeKey: `${alternateLeaf.branchId}:${alternateLeaf.id}`, brush: "red", orig: "g3", dest: "g4", at: "2026-08-16T12:00:01.000Z" },
    ];

    const pgn = await exportPackRunPgn(pack, run, undefined, marks);
    expect(pgn).toContain("Be2");
    expect(pgn).toContain("f3");
    expect(pgn).toContain("b5");
    expect(pgn).toContain("g3");
    expect(pgn).toContain("authored:najdorf-be2");
    expect(pgn).toContain("run:alt-1");
    expect(pgn).toContain("%csl Ge2");
    expect(pgn).toContain("%cal Rg3g4");
    expect(assertLegal(pgn)).toBe(7);

    const authoredOnly = await exportPackRunPgn(pack, run, [authoredBranchId], marks);
    expect(authoredOnly).toContain("%csl Ge2");
    expect(authoredOnly).not.toContain("%cal Rg3g4");

    const serializedAgain = makePgn(parsePgn(pgn)[0]!);
    expect(assertLegal(serializedAgain)).toBe(7);
  });
});
