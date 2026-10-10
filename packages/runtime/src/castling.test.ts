import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Square } from "chessops/types";
import { makeSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { castlingLegality, castlingRights, castlingRightsLost } from "./castling.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

// FIDE Laws of Chess, Guidelines II.3.2.7(4): BOTH pieces' transit and
// destination squares must be vacant, except for the king and castling rook.
// https://handbook.fide.com/chapter/E012023
const ROOK_PATH_BLOCKERS = [
  { name: "white orthodox queenside", fen: "4k3/8/8/8/8/8/8/RN2K3 w Q - 0 1", color: "white", wing: "queenside", square: "b1" },
  { name: "black orthodox queenside", fen: "rn2k3/8/8/8/8/8/8/4K3 b q - 0 1", color: "black", wing: "queenside", square: "b8" },
  { name: "white stationary queenside king", fen: "4k3/8/8/8/8/8/8/1RKN4 w B - 0 1", color: "white", wing: "queenside", square: "d1" },
  { name: "black stationary queenside king", fen: "1rkn4/8/8/8/8/8/8/4K3 b b - 0 1", color: "black", wing: "queenside", square: "d8" },
  { name: "white stationary kingside king", fen: "4k3/8/8/8/8/8/8/5NKR w K - 0 1", color: "white", wing: "kingside", square: "f1" },
  { name: "black stationary kingside king", fen: "5nkr/8/8/8/8/8/8/4K3 b k - 0 1", color: "black", wing: "kingside", square: "f8" },
  { name: "white rook landing beyond king", fen: "4k3/8/8/8/8/8/8/RK1N4 w A - 0 1", color: "white", wing: "queenside", square: "d1" },
  { name: "black rook landing beyond king", fen: "rk1n4/8/8/8/8/8/8/4K3 b a - 0 1", color: "black", wing: "queenside", square: "d8" },
] as const;

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  position.play(normalizeMove(position, parseUci(uci)!));
  return canonicalFen(position);
}

describe("castling evidence", () => {
  it.each(ROOK_PATH_BLOCKERS)("D3642 names the rook-only blocker for $name", fixture => {
    const position = positionFromFen(fixture.fen);
    const before = canonicalFen(position);
    expect(castlingLegality(before)).toEqual([expect.objectContaining({
      color: fixture.color, wing: fixture.wing, legalNow: false, inCheck: false,
      blockedSquares: [fixture.square], attackedSquares: [],
    })]);
    // A completed nearby negative: the same right and geometry, with only the
    // cited knight removed, must permit castling rather than invent a blocker.
    const issue = castlingLegality(before)[0]!;
    const sealed = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: before });
    expect(sealed).toHaveLength(1);
    expect(sealed[0]!.payload).toEqual(issue);
    expect(evidenceValueReceipt(sealed[0]!).factory).toBe("createRulesCastlingReadingLegalityV1Evidence");
    position.board.take([...position.board.knight][0]!);
    const clearFen = canonicalFen(position);
    expect(castlingLegality(clearFen)).toEqual([expect.objectContaining({
      color: fixture.color, wing: fixture.wing, kingSquare: issue.kingSquare,
      rookSquare: issue.rookSquare, legalNow: true, inCheck: false,
      blockedSquares: [], attackedSquares: [],
    })]);
    expect(invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: clearFen })[0]!.payload).toEqual(castlingLegality(clearFen)[0]);
    expect(castlingLegality(before)[0]!.blockedSquares).toEqual([fixture.square]);
  });

  it.each(["white", "black"] as const)("D3642 covers both required routes across every $color king/rook geometry", color => {
    const base = color === "white" ? 0 : 56;
    const square = (file: number): Square => (base + file) as Square;
    const walk = (from: number, to: number): number[] => Array.from({ length: Math.abs(to - from) + 1 }, (_, index) => from + index * Math.sign(to - from));
    for (let king = 0; king < 8; king++) for (let rook = 0; rook < 8; rook++) {
      if (king === rook) continue;
      const wing = rook < king ? "queenside" : "kingside";
      const template = Chess.fromSetup(parseFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1").unwrap()).unwrap().toSetup();
      template.turn = color;
      template.board.take(template.board.kingOf(color)!);
      template.board.set(square(king), { color, role: "king" });
      template.board.set(square(rook), { color, role: "rook" });
      // A same-file pawn keeps the opposite king out of rook check. It never
      // intersects the back-rank paths or attacks the opposite king.
      template.board.set((square(rook) + (color === "white" ? 8 : -8)) as Square, { color, role: "pawn" });
      template.castlingRights = template.castlingRights.with(square(rook));
      const required = new Set([...walk(king, wing === "queenside" ? 2 : 6), ...walk(rook, wing === "queenside" ? 3 : 5)].filter(file => file !== king && file !== rook));
      const read = () => castlingLegality(makeFen(template));
      expect(read(), `${color} ${king}/${rook}`).toEqual([expect.objectContaining({ legalNow: true, blockedSquares: [], attackedSquares: [] })]);
      for (let blocker = 0; blocker < 8; blocker++) {
        if (blocker === king || blocker === rook) continue;
        template.board.set(square(blocker), { color, role: "knight" });
        expect(read(), `${color} ${king}/${rook} blocked at ${blocker}`).toEqual([expect.objectContaining({
          legalNow: !required.has(blocker), inCheck: false, attackedSquares: [],
          blockedSquares: required.has(blocker) ? [makeSquare(square(blocker))] : [],
        })]);
        template.board.take(square(blocker));
      }
    }
  });

  it.each([
    { fen: "4k3/8/8/8/8/8/8/RNBNK3 w Q - 0 1", blocked: ["d1", "c1", "b1"] },
    { fen: "rnbnk3/8/8/8/8/8/8/4K3 b q - 0 1", blocked: ["d8", "c8", "b8"] },
  ])("D3642 preserves the existing king-path order and names shared blockers only once for $fen", fixture => {
    expect(castlingLegality(fixture.fen)[0]!.blockedSquares).toEqual(fixture.blocked);
  });

  it("D3642 carries both queenside rook-path blockers into the derived bot candidate vector", () => {
    const beforeFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const input = { beforeFen, engine: { id: "fixture", name: "fixture", version: "1", seedHonored: true, searchBound: { kind: "nodes" as const, value: 1 } }, candidates: [{ moveUci: "g1f3", scoreCp: 31 }] };
    const evidence = invokeEvidenceValueRoute("derived.opponent.candidate_feature_vector@1", input);
    expect(evidenceValueReceipt(evidence).factory).toBe("createDerivedOpponentCandidateFeatureVectorV1Evidence");
    expect(evidence.payload.candidates).toHaveLength(1);
    const candidate = evidence.payload.candidates[0]!;
    expect(candidate.moveUci).toBe("g1f3");
    expect(candidate.scoreCp).toBe(31);
    const readings = candidate.results.filter(item => item.source.id === "rules.castling.reading.legality").map(item => item.payload);
    expect(readings).toHaveLength(4);
    expect(readings).toEqual(expect.arrayContaining([
      expect.objectContaining({ color: "white", wing: "queenside", blockedSquares: ["d1", "c1", "b1"] }),
      expect.objectContaining({ color: "black", wing: "queenside", blockedSquares: ["d8", "c8", "b8"] }),
      expect.objectContaining({ color: "white", wing: "kingside", blockedSquares: ["f1"] }),
      expect.objectContaining({ color: "black", wing: "kingside", blockedSquares: ["f8", "g8"] }),
    ]));
  });

  it("reads both rights and names transient blocked/attacked reasons", () => {
    const blocked = castlingLegality("r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1");
    expect(blocked.find((value) => value.color === "white" && value.wing === "kingside")).toMatchObject({ legalNow: false, blockedSquares: ["f1"] });
    const rights = castlingRights("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(rights.white).toEqual({ kingside: true, queenside: true });
    expect(rights.black).toEqual({ kingside: true, queenside: true });
  });

  it("retains exact permanent loss causes without intent language", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    expect(castlingRightsLost(fen, "h1h2", after(fen, "h1h2"))).toContainEqual(expect.objectContaining({ color: "white", wing: "kingside", cause: "rook_moved" }));
    expect(castlingRightsLost(fen, "e1h1", after(fen, "e1h1"))).toEqual(expect.arrayContaining([
      expect.objectContaining({ color: "white", wing: "kingside", cause: "castled" }),
      expect.objectContaining({ color: "white", wing: "queenside", cause: "castled" }),
    ]));
  });
});
