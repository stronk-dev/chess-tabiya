import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { squareControlEvents, squareControlReading } from "./square-control.js";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { exactLegalMoves } from "./legal-moves.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { SquareControlEvent, SquareControlReading } from "./square-control.js";
import type { DeclaredEvidence } from "./evidence-contract.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci)!;
  const move = normalizeMove(position, parsed);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

function controllers(fen: string, color: "white" | "black", mode: "pseudo" | "legal", target: string): readonly string[] | "unavailable" {
  const reading = squareControlReading(fen).colors.find((entry) => entry.color === color)!;
  if (mode === "legal" && reading.legal.kind === "unavailable") return "unavailable";
  const squares = mode === "pseudo" ? reading.pseudo : reading.legal.kind === "available" ? reading.legal.squares : [];
  return squares.find((entry) => entry.target === target)?.controllers.map((entry) => entry.square) ?? [];
}

describe("all-square control", () => {
  it.each([
    { fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", color: "white" as const, from: "e2", forward: ["e3", "e4"] },
    { fen: "4k3/4p3/8/8/8/8/8/4K3 b - - 0 1", color: "black" as const, from: "e7", forward: ["e6", "e5"] },
    { fen: "1r6/P7/7k/8/8/8/8/7K w - - 0 1", color: "white" as const, from: "a7", forward: ["a8"] },
    { fen: "7k/8/8/8/8/7K/p7/1R6 b - - 0 1", color: "black" as const, from: "a2", forward: ["a1"] },
  ])("D3656: $color pawn advances remain legal moves, never controller edges", ({ fen, color, from, forward }) => {
    for (const target of forward) {
      expect(exactLegalMoves(fen).some(move => move.from === from && move.to === target)).toBe(true);
      expect(controllers(fen, color, "pseudo", target)).not.toContain(from);
      expect(controllers(fen, color, "legal", target)).not.toContain(from);
    }
  });

  it.each([
    { fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", color: "white" as const, king: "e1", rook: "h1" },
    { fen: "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1", color: "white" as const, king: "e1", rook: "a1" },
    { fen: "4k2r/8/8/8/8/8/8/4K3 b k - 0 1", color: "black" as const, king: "e8", rook: "h8" },
    { fen: "r3k3/8/8/8/8/8/8/4K3 b q - 0 1", color: "black" as const, king: "e8", rook: "a8" },
    // Adjacent rook origins are already pseudo-defended. Intersection alone must
    // not admit the friendly target merely because castling uses its address.
    { fen: "4k3/8/8/8/8/8/8/5KR1 w G - 0 1", color: "white" as const, king: "f1", rook: "g1" },
    { fen: "4k3/8/8/8/8/8/8/2RK4 w C - 0 1", color: "white" as const, king: "d1", rook: "c1" },
    { fen: "5kr1/8/8/8/8/8/8/4K3 b g - 0 1", color: "black" as const, king: "f8", rook: "g8" },
    { fen: "2rk4/8/8/8/8/8/8/4K3 b c - 0 1", color: "black" as const, king: "d8", rook: "c8" },
  ])("D3656: $color $king/$rook castling does not attack a friendly rook", ({ fen, color, king, rook }) => {
    expect(exactLegalMoves(fen).some(move => move.uci === `${king}${rook}`)).toBe(true);
    expect(controllers(fen, color, "legal", rook)).not.toContain(king);
    if (king[0] === "f" || king[0] === "d") expect(controllers(fen, color, "pseudo", rook)).toContain(king);
  });

  it("D3656: all 112 king/rook home-rank geometries preserve the friendly-target boundary", () => {
    const files = "abcdefgh";
    for (const color of ["white", "black"] as const) {
      const rank = color === "white" ? "1" : "8";
      for (let kingFile = 0; kingFile < 8; kingFile += 1) for (let rookFile = 0; rookFile < 8; rookFile += 1) {
        if (kingFile === rookFile) continue;
        const cells = Array<string>(8).fill("1");
        cells[kingFile] = color === "white" ? "K" : "k";
        cells[rookFile] = color === "white" ? "R" : "r";
        const home = cells.join("").replace(/1+/gu, empty => String(empty.length));
        // Keep the opposing king off the rook's file so both turn clones are valid.
        const other = rookFile === 7 ? `${color === "white" ? "k" : "K"}7` : `7${color === "white" ? "k" : "K"}`;
        const right = color === "white" ? files[rookFile]!.toUpperCase() : files[rookFile]!;
        const fen = color === "white" ? `${other}/8/8/8/8/8/8/${home} w ${right} - 0 1` : `${home}/8/8/8/8/8/8/${other} b ${right} - 0 1`;
        const king = `${files[kingFile]}${rank}`, rook = `${files[rookFile]}${rank}`;
        expect(exactLegalMoves(fen).some(move => move.uci === `${king}${rook}`), fen).toBe(true);
        expect(controllers(fen, color, "legal", rook), fen).not.toContain(king);
        if (Math.abs(kingFile - rookFile) === 1) expect(controllers(fen, color, "pseudo", rook), fen).toContain(king);
      }
    }
  });

  it.each([
    { fen: "1r6/P7/7k/8/8/8/8/7K w - - 0 1", color: "white" as const, from: "a7", target: "b8" },
    { fen: "7k/8/8/8/8/7K/p7/1R6 b - - 0 1", color: "black" as const, from: "a2", target: "b1" },
  ])("D3656: $color promotion captures retain their single exact control edge", ({ fen, color, from, target }) => {
    expect(exactLegalMoves(fen).filter(move => move.from === from && move.to === target)).toHaveLength(4);
    expect(controllers(fen, color, "pseudo", target)).toContain(from);
    expect(controllers(fen, color, "legal", target)).toEqual([from]);
  });

  it("D3656: the sealed reading and event retain the same attack-only boundary", () => {
    const fen = "7k/8/8/8/8/8/P7/K7 w - - 0 1";
    const evidence = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen });
    const reading = evidence.payload as SquareControlReading;
    const white = reading.colors.find(entry => entry.color === "white")!;
    expect(white.legal.kind).toBe("available");
    if (white.legal.kind !== "available") throw new Error("Expected exact legal control");
    expect(white.legal.squares.flatMap(square => square.controllers.map(piece => `${piece.square}:${square.target}`))).toEqual(["a1:b1", "a1:b2"]);
    const events = invokeEvidenceValueRoute("rules.square.event.control@1", { beforeFen: fen, moveUci: "a2a4", afterFen: after(fen, "a2a4") }) as readonly DeclaredEvidence<SquareControlEvent>[];
    expect(events.filter(event => event.payload.mode === "legal" && event.payload.controller.piece.role === "pawn")).toEqual([]);
    expect(events).toContainEqual(expect.objectContaining({ payload: expect.objectContaining({ mode: "pseudo", sign: "gained", target: "b5", controller: expect.objectContaining({ square: "a4" }) }) }));
  });

  it("D3656: every complete candidate retains legal controllers from its own pseudo set", () => {
    const beforeFen = "7k/8/8/8/8/8/P7/K7 w - - 0 1";
    const population = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    expect(population.kind).toBe("ready");
    if (population.kind !== "ready") throw new Error("Expected complete candidate population");
    expect(population.receipt.packet.candidates).toHaveLength(exactLegalMoves(beforeFen).length);
    for (const row of population.receipt.packet.candidates) {
      const reading = row.readings.find(item => item.projection.id === "rules.square.reading.control")!.payload as SquareControlReading;
      for (const color of reading.colors) {
        if (color.legal.kind !== "available") continue;
        const pseudo = new Set(color.pseudo.flatMap(square => square.controllers.map(piece => `${piece.square}:${square.target}`)));
        for (const square of color.legal.squares) for (const piece of square.controllers) expect(pseudo.has(`${piece.square}:${square.target}`), `${row.moveUci} ${piece.square} → ${square.target}`).toBe(true);
      }
    }
  });

  it.each([
    { fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", move: "e2e4", color: "white" as const, target: "d5", pawn: "e4" },
    { fen: "4k3/4p3/8/8/8/8/8/4K3 b - - 0 1", move: "e7e5", color: "black" as const, target: "d4", pawn: "e5" },
  ])("D3656: $color quiet-pawn events preserve diagonal control, not forward movement", ({ fen, move, color, target, pawn }) => {
    const events = squareControlEvents(fen, move, after(fen, move)).events;
    expect(events.filter(event => event.mode === "legal" && event.controller.piece.role === "pawn")).toEqual([]);
    expect(events).toContainEqual(expect.objectContaining({ color, mode: "pseudo", sign: "gained", target, controller: expect.objectContaining({ square: pawn }) }));
  });

  it("separates pseudo control from actual legal destinations", () => {
    const pinned = "4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1";
    expect(controllers(pinned, "black", "pseudo", "c8")).toContain("e7");
    expect(controllers(pinned, "black", "legal", "c8")).not.toContain("e7");

    const emptyDiagonal = "4k3/8/8/8/4P3/8/8/4K3 w - - 0 1";
    expect(controllers(emptyDiagonal, "white", "pseudo", "d5")).toContain("e4");
    expect(controllers(emptyDiagonal, "white", "legal", "d5")).not.toContain("e4");

    const friendlyOccupied = "4k3/8/8/3N4/4P3/8/8/4K3 w - - 0 1";
    expect(controllers(friendlyOccupied, "white", "pseudo", "d5")).toContain("e4");
    expect(controllers(friendlyOccupied, "white", "legal", "d5")).not.toContain("e4");

    const enemyOccupied = "4k3/8/8/3n4/4P3/8/8/4K3 w - - 0 1";
    expect(controllers(enemyOccupied, "white", "pseudo", "d5")).toContain("e4");
    expect(controllers(enemyOccupied, "white", "legal", "d5")).toContain("e4");
  });

  it("retains pseudo check while the checking color's legal clone abstains", () => {
    const check = "4k3/8/8/8/8/8/8/4R1K1 b - - 0 1";
    expect(controllers(check, "white", "pseudo", "e8")).toContain("e1");
    expect(controllers(check, "white", "legal", "e8")).toBe("unavailable");
    expect(controllers(check, "white", "pseudo", "e7")).toContain("e1");
  });

  it("emits exact gained and lost controller edges with color mirrors", () => {
    const white = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1";
    const whiteEvents = squareControlEvents(white, "e2e4", after(white, "e2e4")).events;
    expect(whiteEvents).toContainEqual(expect.objectContaining({ color: "white", mode: "pseudo", sign: "lost", target: "d3", controller: expect.objectContaining({ square: "e2" }) }));
    expect(whiteEvents).toContainEqual(expect.objectContaining({ color: "white", mode: "pseudo", sign: "gained", target: "d5", controller: expect.objectContaining({ square: "e4" }) }));

    const black = "4k3/4p3/8/8/8/8/8/4K3 b - - 0 1";
    const blackEvents = squareControlEvents(black, "e7e5", after(black, "e7e5")).events;
    expect(blackEvents).toContainEqual(expect.objectContaining({ color: "black", mode: "pseudo", sign: "lost", target: "d6", controller: expect.objectContaining({ square: "e7" }) }));
    expect(blackEvents).toContainEqual(expect.objectContaining({ color: "black", mode: "pseudo", sign: "gained", target: "d4", controller: expect.objectContaining({ square: "e5" }) }));
  });
});
