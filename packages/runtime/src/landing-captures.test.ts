import type { NormalMove, Role, SquareName } from "chessops/types";
import { makeUci, parseSquare } from "chessops/util";
import { describe, expect, it, vi } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceConventionReceipt, evidenceValueReceipt } from "./evidence-contract.js";
import * as exchange from "./exchange.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "./internal/evidence-value-routes.js";

const ROUTE = "rules.exchange.reading.landing_captures@1";
const read = (fen: string, landingSquare: SquareName) => invokeEvidenceValueRoute(ROUTE, { fen, landingSquare });

// Independent complete-destination enumeration, not the production target prefilter.
function expectedCaptures(fen: string, landingSquare: SquareName) {
  const position = positionFromFen(fen), target = parseSquare(landingSquare)!;
  const moves: NormalMove[] = [];
  for (const [from, destinations] of position.allDests()) {
    if (!destinations.has(target)) continue;
    const roles: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" && (target < 8 || target >= 56)
      ? ["queen", "rook", "bishop", "knight"] : [undefined];
    for (const promotion of roles) {
      const move: NormalMove = promotion === undefined ? { from, to: target } : { from, to: target, promotion };
      if (position.isLegal(move) && exchange.exchangeCaptureAt(position, move) !== undefined) moves.push(move);
    }
  }
  return moves.sort((left, right) => makeUci(left).localeCompare(makeUci(right))).map(move => {
    const result = exchange.legalExchange(fen, makeUci(move));
    expect(result).toBeDefined();
    return result!;
  });
}

describe("complete internal landing-capture authority (F2 §2.3m)", () => {
  it.each([
    ["opening", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
    ["negative", "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1"],
    ["zero", "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1"],
    ["off-line pin", "4k3/4n3/2p5/1B6/8/8/8/4R1K1 w - - 0 1"],
    ["along-ray recapture", "4k3/8/4r3/8/4p3/8/8/4R1K1 w - - 0 1"],
    ["illegal king recapture", "4k3/4q3/8/8/1B6/8/8/4R1K1 w - - 0 1"],
    ["X-ray", "r3k3/8/8/p7/8/8/R7/Q3K3 w - - 0 1"],
    ["White en passant", "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2"],
    ["Black en passant", "4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 2"],
    ["pinned en passant", "4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1"],
    ["White five roots", "r3k3/1P6/1B6/8/8/8/8/R3K3 w - - 0 1"],
    ["Black five roots", "3k3r/8/8/8/8/6b1/6p1/3K3R b - - 0 1"],
    ["checkmate", "7k/6Q1/5K2/8/8/8/8/8 b - - 0 1"],
    ["stalemate", "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"],
  ])("retains all complete results on every square: %s", (_name, fen) => {
    for (let square = 0; square < 64; square++) {
      const target = `${"abcdefgh"[square % 8]}${Math.floor(square / 8) + 1}` as SquareName;
      expect(read(fen, target).payload).toEqual({ fen: canonicalFen(positionFromFen(fen)), landingSquare: target,
        captures: expectedCaptures(fen, target) });
    }
  });

  it("keeps all five roots and four promotion choices in deterministic order", () => {
    expect(read("r3k3/1P6/1B6/8/8/8/8/R3K3 w - - 0 1", "a8").payload.captures.map(value => value.captureUci))
      .toEqual(["a1a8", "b7a8b", "b7a8n", "b7a8q", "b7a8r"]);
    expect(read("3k3r/8/8/8/8/6b1/6p1/3K3R b - - 0 1", "h1").payload.captures.map(value => value.captureUci))
      .toEqual(["g2h1b", "g2h1n", "g2h1q", "g2h1r", "h8h1"]);
  });

  it("does not filter negative or zero exchange outcomes", () => {
    expect(read("r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a7").payload.captures.map(value => value.resultUnits)).toEqual([-4]);
    expect(read("4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", "d5").payload.captures.map(value => value.resultUnits)).toEqual([0]);
  });

  it("retains en passant's landing square separately from its physical victim", () => {
    const white = read("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2", "d6").payload;
    expect(white.landingSquare).toBe("d6");
    expect(white.captures).toHaveLength(1);
    expect(white.captures[0]).toMatchObject({ captureUci: "e5d6", landingSquare: "d6", captured: { square: "d5" } });
    expect(read("4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 2", "d3").payload.captures[0])
      .toMatchObject({ captureUci: "e4d3", landingSquare: "d3", captured: { square: "d4" } });
  });

  it("keeps full FEN, empty-square context, immutable nested values and source input receipts", () => {
    const fen = "4k3/8/8/8/8/8/8/4K3 w - - 7 22";
    const first = read(fen, "a4"), otherSquare = read(fen, "a5"), otherCounter = read(fen.replace("7 22", "8 22"), "a4");
    expect(first.payload).toEqual({ fen, landingSquare: "a4", captures: [] });
    expect(evidenceValueReceipt(first).inputDigest).not.toBe(evidenceValueReceipt(otherSquare).inputDigest);
    expect(evidenceValueReceipt(first).inputDigest).not.toBe(evidenceValueReceipt(otherCounter).inputDigest);
    const tree = read("r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a7");
    expect(Object.isFrozen(tree.payload.captures[0]!.branches)).toBe(true);
    expect(() => (tree.payload.captures as unknown[]).pop()).toThrow();
    expect(evidenceValueReceipt(tree).sourceDigests).toEqual([]);
    const convention = evidenceConventionReceipt(tree);
    expect(convention).toBeDefined();
    expect(convention!.refs).toEqual([{ id: "legal-exchange", version: 1 }]);
  });

  it.each([{}, { fen: "not FEN", landingSquare: "a1" },
    { fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", landingSquare: "a10" },
    { fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", landingSquare: 0 },
    { fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", landingSquare: "a4", captures: [] },
  ])("refuses malformed or caller-authored input before empty shortcuts: %j", input => {
    expect(() => invokeEvidenceValueRoute(ROUTE as EvidenceValueRoute, input as never)).toThrow();
  });

  it("fails rather than filtering an enumerated capture with no exchange result", () => {
    const spy = vi.spyOn(exchange, "legalExchangeForMove").mockReturnValueOnce(undefined);
    try { expect(() => read("r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a7")).toThrow(/legal capture.*exchange result/iu); }
    finally { spy.mockRestore(); }
  });

  it("is an internal conventional prerequisite, not a new learner or provider binding", () => {
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => value.id === "rules.exchange.reading.landing_captures")!;
    expect(declaration).toMatchObject({ plane: "rules", grounding: "declared_convention", exactness: "convention",
      confidence: "not_applicable", forms: ["machine_condition"], answerContent: ["fact"], disposition: { kind: "inspector_only" } });
    expect(declaration.derivation).toBeUndefined();
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(value => value.projection.id === declaration.id)).toEqual([]);
  });
});
