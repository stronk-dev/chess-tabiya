import fc from "fast-check";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { parsePgn, startingPosition, walk } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Move, Role } from "chessops/types";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  appendOpponentPly,
  commitMove,
  compareBranches,
  createRun,
  deriveSegments,
  exportPgn,
  historyFrom,
  projectRun,
  readBackReplay,
  reachCheckpoint,
  rewind,
  type DrillRun,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";

function newRun(): DrillRun {
  return createRun({
    id: "property-run",
    packId: "property-pack",
    packDigest: `sha256:${"b".repeat(64)}`,
    policyConfig: {
      seedMode: "per_branch",
      locus: { executedAt: "browser", engineIds: [], modelIds: [] },
    },
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    seed: 7,
    createdAt: at,
  });
}

function legalUcis(fen: string): string[] {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const moves: string[] = [];
  const promotions: readonly Role[] = ["queen", "rook", "bishop", "knight"];

  for (const [from, destinations] of position.allDests()) {
    for (const to of destinations) {
      const reachesBackRank =
        position.board.getRole(from) === "pawn" && (to < 8 || to >= 56);
      if (reachesBackRank) {
        for (const promotion of promotions) {
          const move: Move = { from, to, promotion };
          if (position.isLegal(move)) moves.push(makeUci(move));
        }
      } else {
        const move: Move = { from, to };
        if (position.isLegal(move)) moves.push(makeUci(move));
      }
    }
  }
  return moves.sort();
}

function assertTreeInvariants(run: DrillRun): void {
  expect(run.events.map((event) => event.seq)).toEqual(
    run.events.map((_event, index) => index + 1),
  );
  expect(new Set(run.nodes.map((node) => node.id)).size).toBe(run.nodes.length);
  expect(projectRun(run.events)).toEqual(run);

  for (const node of run.nodes) {
    const history = historyFrom(run, node.id);
    expect(history[0]!.parentId).toBeNull();
    expect(history.at(-1)!.id).toBe(node.id);
    for (let index = 1; index < history.length; index += 1) {
      expect(history[index]!.parentId).toBe(history[index - 1]!.id);
      expect(history[index]!.ply).toBe(history[index - 1]!.ply + 1);
    }
  }

  for (const branch of run.branches) {
    expect(branch).not.toHaveProperty("nodes");
    expect(run.nodes.some((node) => node.id === branch.forkNodeId)).toBe(true);
  }
}

function assertLegalPgn(run: DrillRun): void {
  const [game] = parsePgn(exportPgn(run));
  expect(game).toBeDefined();
  const position = startingPosition(game!.headers).unwrap();
  walk(game!.moves, position, (branchPosition, data) => {
    const move = parseSan(branchPosition, data.san);
    expect(move).toBeDefined();
    branchPosition.play(move!);
  });
}

describe("runtime invariant properties", () => {
  it("keeps all authoritative event pairs adjacent in emitted runs", () => {
    const selection = (moveUci: string) => ({
      moveUci,
      policyModeApplied: "human_common" as const,
      candidates: [{ moveUci, mass: 1, rank: 1 }],
      engine: {
        id: "fixture-maia",
        name: "Fixture Maia",
        version: "1",
        seedHonored: false,
      },
    });

    let run = commitMove(newRun(), "f2f3", { at }).run;
    run = reachCheckpoint(run, "first", at).run;
    run = appendOpponentPly(run, selection("e7e5"), { at }).run;
    run = commitMove(run, "g2g4", { at }).run;
    run = reachCheckpoint(run, "second", at).run;
    run = appendOpponentPly(run, selection("d8h4"), { at }).run;

    for (const [index, event] of run.events.entries()) {
      if (event.type === "opponent.move_selected") {
        expect(run.events[index + 1]?.type).toBe("move.committed");
      } else if (event.type === "segment.completed") {
        expect(run.events[index - 1]?.type).toBe("checkpoint.reached");
      } else if (event.type === "outcome.reached") {
        expect(run.events[index - 1]?.type).toBe("move.committed");
      }
    }

    expect(run.events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "opponent.move_selected",
        "segment.completed",
        "outcome.reached",
      ]),
    );
  });

  it("keeps derived segments in one-to-one correspondence with authoritative events", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ choice: fc.nat(), checkpoint: fc.boolean() }), { minLength: 2, maxLength: 16 }),
        (steps) => {
          let run = newRun();
          for (const [index, step] of steps.entries()) {
            const cursor = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
            const legal = legalUcis(cursor.fen);
            if (legal.length === 0) break;
            run = commitMove(run, legal[step.choice % legal.length]!, { at }).run;
            if (step.checkpoint) run = reachCheckpoint(run, `checkpoint-${index}`, at).run;
          }
          const events = run.events.filter((event) => event.type === "segment.completed");
          const segments = deriveSegments(run);
          expect(segments).toHaveLength(events.length);
          for (const [index, event] of events.entries()) {
            const start = run.events[event.data.startCheckpointEventSeq - 1]!;
            const end = run.events[event.data.endCheckpointEventSeq - 1]!;
            expect(start.type).toBe("checkpoint.reached");
            expect(end.type).toBe("checkpoint.reached");
            expect(segments[index]).toMatchObject({
              branchId: event.data.branchId,
              startSeq: event.data.startCheckpointEventSeq,
              endSeq: event.data.endCheckpointEventSeq,
              startNodeId: event.data.startNodeId,
              endNodeId: event.data.endNodeId,
            });
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("preserves recoverable paths and a replayable event projection under legal play", () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 20 }), (choices) => {
        let run = newRun();
        for (const choice of choices) {
          const legal = legalUcis(run.nodes.find(
            (node) => node.id === run.activeCursor.nodeId,
          )!.fen);
          if (legal.length === 0) break;
          const before = run;
          const beforeNodes = JSON.stringify(before.nodes);
          run = commitMove(run, legal[choice % legal.length]!, { at }).run;

          expect(JSON.stringify(before.nodes)).toBe(beforeNodes);
          assertTreeInvariants(run);
        }
        assertLegalPgn(run);
      }),
      { numRuns: 100 },
    );
  });

  it("never mutates old nodes and always forks before a post-rewind commit", () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(), { minLength: 2, maxLength: 10 }),
        fc.nat(),
        fc.nat(),
        (lineChoices, rewindChoice, moveChoice) => {
          let run = newRun();
          for (const choice of lineChoices) {
            const cursor = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
            const legal = legalUcis(cursor.fen);
            if (legal.length === 0) break;
            run = commitMove(run, legal[choice % legal.length]!, { at }).run;
          }
          if (run.nodes.length < 2) return;

          const target = run.nodes[rewindChoice % (run.nodes.length - 1)]!;
          const oldNodes = run.nodes;
          const oldSnapshot = JSON.stringify(oldNodes);
          const rewound = rewind(run, target.id, at).run;
          const legal = legalUcis(target.fen);
          const result = commitMove(rewound, legal[moveChoice % legal.length]!, { at });

          expect(JSON.stringify(oldNodes)).toBe(oldSnapshot);
          expect(result.emitted.map((event) => event.type)).toEqual([
            "branch.forked",
            "move.committed",
          ]);
          expect(result.run.nodes.slice(0, oldNodes.length)).toEqual(oldNodes);
          expect(result.run.nodes.at(-1)!.parentId).toBe(target.id);
          const comparison = compareBranches(result.run, [
            result.run.branches[0]!.id,
            result.run.branches.at(-1)!.id,
          ]);
          expect(comparison.forkNodeId).toBe(target.id);
          expect(comparison.rows.map((row) => row.plyOffset)).toEqual(
            comparison.rows.map((_row, index) => index + 1),
          );
          expect(Object.keys(comparison.rows[0]!.nodes)).toHaveLength(2);
          for (const row of comparison.rows) {
            expect(row.groups.flat()).toEqual(Object.keys(row.nodes));
          }
          assertTreeInvariants(result.run);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("replays identical opponent choices for identical policy locus, seed, and play", () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 12 }), (choices) => {
        const play = (): DrillRun => {
          let run = newRun();
          for (const choice of choices) {
            const cursor = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
            const legal = legalUcis(cursor.fen);
            if (legal.length === 0) break;
            const move = legal[choice % legal.length]!;
            run =
              cursor.ply % 2 === 0
                ? commitMove(run, move, { at }).run
                : appendOpponentPly(
                    run,
                    {
                      moveUci: move,
                      policyModeApplied: "human_common",
                      engine: {
                        id: "property-mock",
                        name: "Property mock",
                        version: "1",
                        seedHonored: true,
                      },
                    },
                    { at },
                  ).run;
          }
          return run;
        };

        const first = play();
        const second = play();
        expect(first).toEqual(second);
        expect(readBackReplay(first.events)).toEqual(readBackReplay(second.events));
      }),
      { numRuns: 100 },
    );
  });
});
