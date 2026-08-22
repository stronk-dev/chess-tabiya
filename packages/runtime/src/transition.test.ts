import { readFileSync } from "node:fs";

import { Chess, normalizeMove } from "chessops/chess";
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  matchesTransitionExpression,
  matchesTransitionFeature,
  irreversibility,
  transitionSemanticFacts,
  transitionReading,
} from "./transition.js";

function after(fen: string, moveUci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  position.play(normalizeMove(position, parseUci(moveUci)!));
  return makeFen(position.toSetup());
}

describe("transition primitives", () => {
  it("matches a played move and delegates position facts without a verdict", () => {
    const fen = after(INITIAL_FEN, "e2e4");
    expect(matchesTransitionFeature(INITIAL_FEN, "e2e4", fen, {
      kind: "move_irreversibility",
      subkind: "clock_zeroed",
    })).toBe(true);
    expect(matchesTransitionExpression(INITIAL_FEN, "e2e4", fen, {
      kind: "all",
      of: [
        { kind: "feature", feature: { kind: "move_irreversibility", subkind: "clock_zeroed" } },
        { kind: "position", at: "after", expression: { kind: "pieceOnSquare", square: "e4", piece: { color: "white", role: "pawn" } } },
      ],
    })).toBe(true);
  });

  it("returns a canonical rung-0 reading only for a legal committed edge", () => {
    const fen = after(INITIAL_FEN, "e2e4");
    const reading = transitionReading(INITIAL_FEN, "e2e4", fen);
    expect(reading?.observations).toContainEqual(expect.objectContaining({
      kind: "move_irreversibility",
      subkind: "clock_zeroed",
    }));
    expect(reading).not.toHaveProperty("score");
    expect(transitionReading(INITIAL_FEN, "e2e5", fen)).toBeNull();
    expect(matchesTransitionExpression(INITIAL_FEN, "e2e5", fen, {
      kind: "position",
      at: "after",
      expression: { kind: "pieceOnSquare", square: "e4", piece: { color: "white", role: "pawn" } },
    })).toBe(false);
    const wrongAfter = after(INITIAL_FEN, "d2d4");
    expect(transitionReading(INITIAL_FEN, "e2e4", wrongAfter)).toBeNull();
  });

  it("keeps expensive structural projections outside the transition implementation", () => {
    const source = readFileSync(new URL("./transition.ts", import.meta.url), "utf8");
    const structureImport = source.match(/import\s*\{([\s\S]*?)\}\s*from\s*"\.\/structure\.js"/u)?.[1] ?? "";
    expect(structureImport).toContain("matchesStructuralExpression");
    expect(structureImport).toContain("structuralFeatureKinds");
    expect(structureImport).not.toMatch(/structuralReading|structuralDelta|pawnSafety/u);
    expect(source).not.toMatch(/\b(?:structuralReading|structuralDelta|pawnSafety)\s*\(/u);
  });

  it("retains generic and en-passant capture identities", () => {
    const ordinary = transitionSemanticFacts(INITIAL_FEN, "e2e4", after(INITIAL_FEN, "e2e4"));
    expect(ordinary.some((fact) => fact.family === "capture")).toBe(false);

    const epFen = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1";
    const ep = transitionSemanticFacts(epFen, "e5d6", after(epFen, "e5d6"));
    expect(ep).toContainEqual(expect.objectContaining({ family: "capture", captured: { color: "black", role: "pawn" }, enPassant: true, from: "e5", to: "d6" }));
  });

  it("recognizes both castling UCI forms on the reading plane", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const result = after(fen, "e1h1");
    expect(irreversibility(fen, "e1h1", result)).toEqual({ subkind: "castled", color: "white" });
    expect(irreversibility(fen, "e1g1", result)).toEqual({ subkind: "castled", color: "white" });
  });

  it("emits role-matched minor development and return without treating a redeployed knight as undeveloped", () => {
    const developedAfter = after(INITIAL_FEN, "g1f3");
    expect(transitionSemanticFacts(INITIAL_FEN, "g1f3", developedAfter)).toContainEqual(expect.objectContaining({ family: "developed", sign: "gained", mover: { color: "white", role: "knight" }, from: "g1", to: "f3" }));

    const returnFen = developedAfter.replace(" b ", " w ");
    expect(transitionSemanticFacts(returnFen, "f3g1", after(returnFen, "f3g1"))).toContainEqual(expect.objectContaining({ family: "developed", sign: "lost", from: "f3", to: "g1" }));

    const roleMismatch = "4k3/8/8/8/8/8/8/4KN2 w - - 0 1";
    expect(transitionSemanticFacts(roleMismatch, "f1g3", after(roleMismatch, "f1g3")).some((fact) => fact.family === "developed")).toBe(false);

    const capturedAtHome = "4k1r1/8/8/8/8/8/8/4K1N1 b - - 0 1";
    expect(transitionSemanticFacts(capturedAtHome, "g8g1", after(capturedAtHome, "g8g1")).some((fact) => fact.family === "developed")).toBe(false);
  });
});
