// D3979: original legal replay/wire consistency, not tactical or source qualification.
import { describe, expect, it } from "vitest";
import { canonicalFen, positionFromFen } from "./chess.js";
import { recordedMovePathPositions, movePathFrames } from "./presentation-move-path.js";
import { parseComponentValue } from "./presentation-contract.js";
import { recordedSequenceWindowFixture } from "./testing/recorded-sequence-window-fixture.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_ATTRACTION_FIVE } from "./testing/recorded-sequence-fixtures.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const component = (path: ReturnType<typeof recordedMovePathPositions>) => ({ id: "move_path", operand: { ...path, origin: "learner_played", answerDistance: "fact" } });

describe("D3979 full original-position replay", () => {
  for (const black of [false, true]) it.each([...RECORDED_SEQUENCE_POSITIVES, { projection: "attraction-five", ...RECORDED_ATTRACTION_FIVE }])(`retains every original recorded position for $projection, mirrored=${black}`, fixture => {
    const run = recordedSequenceWindowFixture(fixture, black), snapshot = JSON.stringify(run);
    const source = run.nodes.slice(1).map(node => ({ fen: run.nodes.find(parent => parent.id === node.parentId)!.fen, uci: node.moveUci! }));
    const path = recordedMovePathPositions(source);
    expect(path.startFen).toBe(run.nodes[0]!.fen);
    expect(path.plies.map(ply => ply.uci)).toEqual(source.map(move => move.uci));
    expect(movePathFrames(path)).toEqual(run.nodes.map(node => node.fen));
    expect(parseComponentValue(component(path))).toEqual(component(path));
    expect(JSON.stringify(run)).toBe(snapshot);
  });
  it.each([
    ["4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1", "O-O"],
    ["4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1h1", "O-O"],
    ["4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1a1", "O-O-O"],
    ["4k3/8/8/8/8/8/8/6KR w K - 0 1", "g1h1", "O-O"],
    ["4k3/8/8/8/8/8/8/4KR2 w K - 0 1", "e1f1", "O-O"],
    ["4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2", "e5d6", "exd6"],
    ["7k/P7/8/8/8/8/8/6K1 w - - 0 1", "a7a8n", "a8=N"],
  ])("replays %s / %s without rewriting original UCI", (fen, uci, san) => {
    const path = recordedMovePathPositions([{ fen, uci }]);
    expect(path.plies[0]).toMatchObject({ uci, san });
    expect(parseComponentValue(component(path))).toEqual(component(path));
    expect(movePathFrames(path)).toHaveLength(2);
  });
  it("refuses a changed intermediate original counter/FEN instead of returning a prefix", () => {
    const run = recordedSequenceWindowFixture({ fen: INITIAL, moves: ["e2e4", "e7e5", "g1f3"] });
    const source = run.nodes.slice(1).map(node => ({ fen: run.nodes.find(parent => parent.id === node.parentId)!.fen, uci: node.moveUci! }));
    const crossed = source.map((value, index) => index === 1 ? { ...value, fen: value.fen.replace(" 0 1", " 1 1") } : value);
    expect(crossed[1]!.fen).not.toBe(source[1]!.fen);
    expect(() => recordedMovePathPositions(crossed)).toThrow(/original position sequence/u);
    expect(() => recordedMovePathPositions([])).toThrow();
  });
  const valid = recordedMovePathPositions([{ fen: INITIAL, uci: "e2e4" }]);
  it.each(["missing_start", "noncanonical", "invalid_fen", "wrong_turn", "illegal_uci", "wrong_san", "wrong_ply", "extra_ply_field", "illegal_later", "empty"])("refuses a complete received %s path, never a valid prefix", change => {
    const wire = JSON.parse(JSON.stringify(component(valid)));
    if (change === "missing_start") delete wire.operand.startFen;
    if (change === "noncanonical") wire.operand.startFen += " ";
    if (change === "invalid_fen") wire.operand.startFen = "not a chess position";
    if (change === "wrong_turn") wire.operand.startFen = INITIAL.replace(" w ", " b ");
    if (change === "illegal_uci") wire.operand.plies[0].uci = "e2e5";
    if (change === "wrong_san") wire.operand.plies[0].san = "e5";
    if (change === "wrong_ply") wire.operand.plies[0].ply = 2;
    if (change === "extra_ply_field") wire.operand.plies[0].fen = INITIAL;
    if (change === "illegal_later") wire.operand.plies.push({ ply: 2, san: "e5", uci: "a8a1" });
    if (change === "empty") wire.operand.plies = [];
    expect(() => parseComponentValue(wire)).toThrow();
  });
  it("keeps repeated board positions as separate original steps", () => {
    const run = recordedSequenceWindowFixture({ fen: INITIAL, moves: ["g1f3", "g8f6", "f3g1", "f6g8"] });
    const path = recordedMovePathPositions(run.nodes.slice(1).map(node => ({ fen: run.nodes.find(parent => parent.id === node.parentId)!.fen, uci: node.moveUci! })));
    const frames = movePathFrames(path);
    expect(frames).toHaveLength(5);
    expect(frames[0]!.split(" ").slice(0, 4)).toEqual(frames[4]!.split(" ").slice(0, 4));
    expect(frames[4]).toBe(canonicalFen(positionFromFen(run.nodes[4]!.fen)));
    expect(frames[0]).not.toBe(frames[4]); // Counters/turn are never replaced by a position-key lookup.
  });
});
