import { describe, expect, it } from "vitest";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { assertDeclaredEvidence, evidenceValueReceipt } from "./evidence-contract.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import type { ExactLegalMoveMap } from "./legal-moves.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { parseUci } from "chessops/util";
import { readBackwardPawns, readUnobstructedOpposition } from "./foundation-position-sources.js";

const position = (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });

describe("foundation unobstructed opposition operands", () => {
  it.each([
    ["8/8/8/8/8/4k3/8/4K3 b - - 0 1", "white", "direct", ["e2"]],
    ["8/8/8/4k3/8/8/8/4K3 w - - 0 1", "black", "distant_three", ["e2", "e3", "e4"]],
    ["8/4k3/8/8/8/8/8/4K3 b - - 0 1", "white", "distant_five", ["e2", "e3", "e4", "e5", "e6"]],
    ["8/8/8/8/8/8/8/K3k3 w - - 0 1", "black", "distant_three", ["b1", "c1", "d1"]],
    ["8/8/8/8/8/8/8/k3K3 b - - 0 1", "white", "distant_three", ["d1", "c1", "b1"]],
  ] as const)("retains exact holder, gap and white-to-black interior: %s", (fen, color, form, betweenSquares) => {
    const source = position(fen);
    const reading = readUnobstructedOpposition(source);
    expect(reading.fen).toBe(source.payload.fen);
    expect(reading.opposition).toEqual({ color, sideToMove: source.payload.turn, form, betweenSquares, betweenSquaresEmpty: true });
  });

  it.each([
    "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1", // Blocked interior.
    "8/8/8/8/8/3k4/8/4K3 b - - 0 1", // Diagonal geometry.
    "8/8/8/8/4k3/8/8/4K3 b - - 0 1", // Wrong gap.
  ])("returns an available explicit absence with both kings: %s", fen => {
    const reading = readUnobstructedOpposition(position(fen));
    expect(reading.opposition).toBeNull();
    expect(Object.keys(reading.kings).sort()).toEqual(["black", "white"]);
  });

  it("retains the same king pair while a legal quiet move flips holder", () => {
    const source = position("r7/8/8/8/8/4k3/8/4K3 b - - 0 1");
    expect(source.payload.pieces.flatMap(piece => piece.moves).some(move => move.uci === "a8a7")).toBe(true);
    const child = positionFromFen(source.payload.fen), move = parseUci("a8a7")!;
    expect(child.isLegal(move)).toBe(true); child.play(move);
    expect(canonicalFen(child)).toBe("8/r7/8/8/8/4k3/8/4K3 w - - 1 2");
    const before = readUnobstructedOpposition(source);
    const after = readUnobstructedOpposition(position(canonicalFen(child)));
    expect(after.kings).toEqual(before.kings);
    expect(before.opposition?.color).toBe("white"); expect(after.opposition?.color).toBe("black");
    expect(after.opposition?.betweenSquares).toEqual(before.opposition?.betweenSquares);
  });
});

describe("foundation complete backward-pawn operands", () => {
  it("keeps a complete domain and exact controller/support/occupancy/perspective", () => {
    const reading = readBackwardPawns(position("4k3/8/2p5/1p6/1P6/8/8/4K3 w - - 0 1"));
    expect(reading.pawnDomain).toEqual([
      { color: "white", square: "b4" }, { color: "black", square: "b5" }, { color: "black", square: "c6" },
    ]);
    expect(reading.pawns.find(row => row.color === "black" && row.pawn === "c6")).toEqual({
      color: "black", pawn: "c6", stop: "c5", controllers: [{ color: "white", square: "b4" }],
      supportPawns: [], aheadAdjacentPawns: [{ color: "black", square: "b5" }], stopOccupancy: { kind: "empty" },
      immediatePseudoCapture: [], halfOpenForColor: { color: "white", value: true },
    });
  });

  it("does not merge two qualifying pawns on one file or erase an own-occupied stop", () => {
    const reading = readBackwardPawns(position("4k3/2p5/2p5/1P6/3P4/8/8/4K3 w - - 0 1"));
    const black = reading.pawns.filter(row => row.color === "black");
    expect(black.map(row => [row.pawn, row.stop, row.stopOccupancy])).toEqual([
      ["c6", "c5", { kind: "empty" }], ["c7", "c6", { kind: "own", piece: { color: "black", role: "pawn" } }],
    ]);
  });

  it("keeps an enemy-occupied stop separate from a legal-advance claim", () => {
    const reading = readBackwardPawns(position("4k3/8/2p5/2N5/1P6/8/8/4K3 w - - 0 1"));
    expect(reading.pawns.find(row => row.pawn === "c6")?.stopOccupancy).toEqual({ kind: "enemy", piece: { color: "white", role: "knight" } });
  });

  it("retains pseudo-capturable pawn targets, without claiming that captures are legal", () => {
    const reading = readBackwardPawns(position("7k/8/4p3/2p5/3P4/8/8/7K w - - 0 1"));
    expect(reading.pawns.find(row => row.pawn === "d4")).toMatchObject({
      controllers: [{ color: "black", square: "e6" }], immediatePseudoCapture: [{ color: "black", square: "c5" }],
      halfOpenForColor: { color: "black", value: true },
    });
    const pinned = readBackwardPawns(position("2k5/8/2p5/8/3P4/8/8/2R1K3 w - - 0 1"));
    expect(pinned.pawns.find(row => row.pawn === "d4")?.controllers).toEqual([{ color: "black", square: "c6" }]);
  });

  it.each([
    "4k3/1p6/2p5/8/1P6/8/8/4K3 w - - 0 1", // Same/not-ahead support refuses c6.
    "4k3/8/2p5/8/8/8/4B3/4K3 w - - 0 1", // A bishop is not a pawn controller.
  ])("does not classify the c6 pawn without the narrow convention: %s", fen => {
    const reading = readBackwardPawns(position(fen));
    expect(reading.pawnDomain).toContainEqual({ color: "black", square: "c6" });
    expect(reading.pawns.some(row => row.pawn === "c6")).toBe(false);
  });

  it("represents zero pawns as a complete immutable available snapshot", () => {
    const source = position("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    const reading = readBackwardPawns(source);
    expect(reading).toEqual({ fen: source.payload.fen, pawnDomain: [], pawns: [] });
    expect(Object.isFrozen(reading)).toBe(true); expect(Object.isFrozen(reading.pawns)).toBe(true);
  });
});

describe("foundation source admission", () => {
  it("rejects copied, crossed or caller-edited root authorities", () => {
    const source = position("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    const wrong = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: source.payload.fen });
    for (const forged of [{ ...source }, { ...source, payload: { ...source.payload, fen: "8/8/8/8/8/4k3/8/4K3 b - - 0 1" } }, wrong]) {
      expect(() => readBackwardPawns(forged as unknown as DeclaredEvidence<ExactLegalMoveMap>)).toThrow();
      expect(() => readUnobstructedOpposition(forged as unknown as DeclaredEvidence<ExactLegalMoveMap>)).toThrow();
    }
  });

  it("freezes owned nested operands without altering the borrowed source", () => {
    const source = position("4k3/8/2p5/1p6/1P6/8/8/4K3 w - - 0 1"), bytes = JSON.stringify(source);
    const reading = readBackwardPawns(source);
    const pawn = reading.pawns.find(row => row.pawn === "c6")!;
    expect(Object.isFrozen(pawn.controllers)).toBe(true); expect(Object.isFrozen(pawn.controllers[0])).toBe(true);
    expect(Object.isFrozen(pawn.halfOpenForColor)).toBe(true);
    expect(JSON.stringify(source)).toBe(bytes);
  });
});

describe("registered complete foundation reading factories", () => {
  it.each([
    ["rules.structural.reading.king_opposition@3", "king-opposition-unobstructed", "king-opposition-blocker-blind"],
    ["rules.structural.reading.backward_pawn@3", "backward-pawn", "backward-pawn-legacy"],
  ] as const)("%s mints from its genuine source with exact direct and actual input conventions", (route, convention, previous) => {
    const source = position("8/8/8/8/8/4k3/8/4K3 b - - 0 1");
    const result = invokeEvidenceValueRoute(route, { position: source });
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw Error("Expected complete source snapshot");
    assertDeclaredEvidence(result.value);
    expect(result.value.projection.version).toBe(3);
    expect(result.value.payload.fen).toBe(source.payload.fen);
    const receipt = evidenceValueReceipt(result.value), input = evidenceValueReceipt(source);
    expect(receipt.sourceDigests).toEqual([input.payloadDigest]);
    expect(directProjectionConventions(route)).toEqual([{ id: convention, version: 1 }]);
    const expected = [...new Map([{ id: convention, version: 1 }, ...(input.convention?.refs ?? [])].map(ref => [`${ref.id}@${ref.version}`, ref])).values()].sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version);
    expect(receipt.convention?.refs).toEqual(expected);
    expect(receipt.convention?.refs).not.toContainEqual({ id: previous, version: 1 });
    expect(() => invokeEvidenceValueRoute(route, { position: { ...source } })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { position: source, fen: "caller override" } as never)).toThrow();
  });

  it("mints genuine available empty snapshots, not missing/empty populations", () => {
    const source = position("8/8/8/8/8/4k3/4P3/4K3 b - - 0 1");
    const opposition = invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: source });
    const pawns = invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: source });
    expect(opposition).toMatchObject({ kind: "available", value: { payload: { opposition: null } } });
    expect(pawns).toMatchObject({ kind: "available", value: { payload: { pawnDomain: [{ color: "white", square: "e2" }], pawns: [] } } });
    const prior = invokeEvidenceValueRoute("rules.structural.reading.king_opposition@2", { fen: source.payload.fen });
    expect(prior).toHaveLength(1);
    expect(prior[0]!.payload).toEqual({ kind: "king_opposition", color: "white", form: "direct", squares: ["e1", "e3"] });
  });
});
