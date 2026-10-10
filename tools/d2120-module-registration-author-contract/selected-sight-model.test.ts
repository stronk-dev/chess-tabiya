// DISPOSABLE author-contract checks, not implementation or a semantic-validation verdict.
import { describe, expect, it } from "vitest";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { defaultFacet, proposedLegalSentence, proposedSightBudget, selectCastling, selectControl, selectMoves, selectPawns, SOURCE_BY_FACET, type SourceFacet } from "./selected-sight-model.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const QUEEN = "8/7k/8/8/3Q4/8/K7/8 w - - 0 1";
const CONTACTS = "7k/8/8/3p1p2/4P1P1/8/8/7K w - - 0 1";
const sourceFor = (facet: SourceFacet, fen: string) => invokeEvidenceValueRoute(`${SOURCE_BY_FACET[facet]}@1` as EvidenceValueRoute, { fen }) as DeclaredEvidence<unknown>;

describe("D3578 draft selected-square model over actual sealed readings", () => {
  it.each([
    [INITIAL, "g1", "moves"], [INITIAL, "e2", "pawns"], [INITIAL, "e1", "castling"],
    [INITIAL, "e4", "control"], [INITIAL, "b8", "control"],
  ] as const)("proposed request-local default for %s / %s is %s", (fen, square, facet) => {
    expect(defaultFacet(fen, square)).toBe(facet);
  });

  it("retains every queen destination; no origin marks, move grading or six-square truncation", () => {
    const value = selectMoves(sourceFor("moves", QUEEN), QUEEN, "d4");
    expect(value.kind).toBe("available");
    if (value.kind !== "available") throw new Error("queen missing");
    expect(value.destinations).toHaveLength(27);
    expect(value.destinations).not.toContain("d4");
    expect(new Set(value.moves.map(move => move.to))).toEqual(new Set(value.destinations));
    expect(value.moves.every(move => move.from === "d4")).toBe(true);
    expect(value).not.toHaveProperty("quality");
  });

  it("does not widen the explanatory six-mark/30-word envelope", () => {
    expect(proposedSightBudget("derived.sight.legal_moves@1")).toEqual({ maxFacts: 1, maxWords: 96, maxMarks: 64, maxArrows: 0 });
    for (const projection of ["derived.sight.square_control@1", "derived.sight.pawn_contacts@1", "derived.sight.castling_rights@1", "rules.mobility.reading.legal_moves@1", "derived.sight.legal_moves@2"])
      expect(proposedSightBudget(projection)).toEqual({ maxFacts: 1, maxWords: 30, maxMarks: 6, maxArrows: 1 });
    expect(() => proposedSightBudget("derived.sight.legal_moves@1", "module.full_inspector@1")).toThrow("not a Sight consumer");
  });

  it.each([
    [QUEEN, "d4"], ["7k/P7/8/8/8/8/8/7K w - - 0 1", "a7"],
    ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1"],
    ["1r4kr/8/8/8/8/8/8/1R4KR w HBhb - 0 1", "g1"],
  ] as const)("complete visible/accessible move list fits the proposed envelope: %s / %s", (fen, square) => {
    const source = sourceFor("moves", fen);
    const selected = selectMoves(source, fen, square);
    if (selected.kind !== "available") throw new Error("origin missing");
    const sentence = proposedLegalSentence(source, fen, square);
    const words = sentence.normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
    expect(words).toBeLessThanOrEqual(proposedSightBudget("derived.sight.legal_moves@1").maxWords);
    expect(sentence).not.toMatch(/\b[a-h][1-8][a-h][1-8][qrbn]?\b/u);
    for (const move of selected.moves) {
      expect(sentence).toContain(`${move.to} (`);
      if (move.promotion !== undefined) expect(sentence).toContain(`promote to ${move.promotion}`);
      if (move.uci === "e1h1" || move.uci === "g1h1") expect(sentence).toContain("O-O");
    }
    // The queen is a real counterexample to reusing the old explanation word budget.
    if (fen === QUEEN) expect(words).toBeGreaterThan(30);
  });

  it("preserves four promotion identities for the same destination", () => {
    const fen = "7k/P7/8/8/8/8/8/7K w - - 0 1";
    const value = selectMoves(sourceFor("moves", fen), fen, "a7");
    if (value.kind !== "available") throw new Error("pawn missing");
    expect(value.destinations).toEqual(["a8"]);
    expect(value.moves.map(move => move.uci)).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
    expect(value.moves.map(move => move.promotion).sort()).toEqual(["bishop", "knight", "queen", "rook"]);
  });

  it("preserves king landing, rook-form identity and degenerate Chess960 castling", () => {
    const standard = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const value = selectMoves(sourceFor("moves", standard), standard, "e1");
    if (value.kind !== "available") throw new Error("king missing");
    expect(value.moves).toContainEqual({ from: "e1", to: "g1", role: "king", uci: "e1h1" });
    const fen960 = "1r4kr/8/8/8/8/8/8/1R4KR w HBhb - 0 1";
    const special = selectMoves(sourceFor("moves", fen960), fen960, "g1");
    if (special.kind !== "available") throw new Error("960 king missing");
    expect(special.moves).toContainEqual({ from: "g1", to: "g1", role: "king", uci: "g1h1" });
    const rights = selectCastling(sourceFor("castling", fen960), fen960, "b1");
    expect(rights).toMatchObject({ kind: "available", wings: [{ wing: "queenside", retained: true, rookSquare: "b1" }] });
  });

  it("keeps no legal moves, wrong turn and empty selection distinct", () => {
    const source = sourceFor("moves", INITIAL);
    expect(selectMoves(source, INITIAL, "a1")).toMatchObject({ kind: "available", moves: [], destinations: [] });
    expect(selectMoves(source, INITIAL, "b8")).toEqual({ kind: "unavailable", reason: "not_side_to_move" });
    expect(selectMoves(source, INITIAL, "a4")).toEqual({ kind: "no_witness", reason: "empty_square" });
  });

  it("includes actual en-passant identities, not an en-passant-cleared clone", () => {
    const fen = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1";
    const value = selectMoves(sourceFor("moves", fen), fen, "e5");
    if (value.kind !== "available") throw new Error("pawn missing");
    expect(value.moves).toContainEqual({ from: "e5", to: "d6", role: "pawn", uci: "e5d6" });
  });

  it("control selects the target cell, not every outgoing square of a selected piece", () => {
    const source = sourceFor("control", INITIAL);
    const a3 = selectControl(source, INITIAL, "a3");
    expect(a3.selectedSquare).toBe("a3");
    expect(a3.colors.find(entry => entry.color === "white")!.pseudo.map(entry => entry.square)).toEqual(["b1", "b2"]);
    // A legal pawn advance is not control. The complete legal-moves facet retains it,
    // while this source retains an available empty controller set (not unavailable).
    const selectedE4 = selectControl(source, INITIAL, "e4");
    expect(selectedE4.kind).toBe("no_witness");
    const e4 = selectedE4.colors.find(entry => entry.color === "white")!;
    expect(e4.pseudo).toEqual([]);
    expect(e4.legal).toEqual({ kind: "available", controllers: [] });
    const e2Moves = selectMoves(sourceFor("moves", INITIAL), INITIAL, "e2");
    expect(e2Moves.kind).toBe("available");
    if (e2Moves.kind === "available") expect(e2Moves.moves).toContainEqual({ from: "e2", to: "e4", role: "pawn", uci: "e2e4" });
    const kings = "7k/8/8/8/8/8/8/K7 w - - 0 1";
    expect(selectControl(sourceFor("control", kings), kings, "d4").kind).toBe("no_witness");
  });

  it("never turns a pinned geometric controller into an actual legal move", () => {
    const fen = "4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1";
    const value = selectControl(sourceFor("control", fen), fen, "c8").colors.find(entry => entry.color === "black")!;
    expect(value.pseudo.map(entry => entry.square)).toContain("e7");
    expect(value.legal.kind).toBe("available");
    if (value.legal.kind === "available") expect(value.legal.controllers!.map(entry => entry.square)).not.toContain("e7");
  });

  it("preserves invalid-turn-clone availability separately from geometric control", () => {
    const fen = "4k3/8/8/8/8/8/8/4R1K1 b - - 0 1";
    const value = selectControl(sourceFor("control", fen), fen, "e8").colors.find(entry => entry.color === "white")!;
    expect(value.pseudo.map(entry => entry.square)).toContain("e1");
    expect(value.legal).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
    const absent = selectControl(sourceFor("control", fen), fen, "a5");
    expect(absent.kind).toBe("no_witness");
    expect(absent.colors.find(entry => entry.color === "white")!.legal).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
  });

  it("retains both contact directions involving the selected pawn, excluding unrelated contacts", () => {
    const value = selectPawns(sourceFor("pawns", CONTACTS), CONTACTS, "e4");
    if (value.kind !== "available") throw new Error("pawn missing");
    expect(value.contacts.map(entry => `${entry.attacker.square}:${entry.target.square}`)).toEqual(["d5:e4", "e4:d5", "e4:f5", "f5:e4"]);
    expect(value.contacts.every(entry => entry.attacker.square === "e4" || entry.target.square === "e4")).toBe(true);
    expect(value.state.pawn.square).toBe("e4");
    expect(selectPawns(sourceFor("pawns", CONTACTS), CONTACTS, "e5").kind).toBe("no_witness");
  });

  it("retains pawn state with no contact rather than losing passed/protection facts", () => {
    const fen = "7k/8/8/4P3/3P4/8/8/7K w - - 0 1";
    const value = selectPawns(sourceFor("pawns", fen), fen, "e5");
    if (value.kind !== "available") throw new Error("pawn missing");
    expect(value.contacts).toEqual([]);
    expect(value.state).toMatchObject({ passed: true, protectedBy: [{ square: "d4" }] });
    expect(value.connectedPassedPairs).toHaveLength(1);
    const locked = "7k/8/8/4p3/4P3/8/8/7K w - - 0 1";
    const lock = selectPawns(sourceFor("pawns", locked), locked, "e4");
    if (lock.kind !== "available") throw new Error("locked pawn missing");
    expect(lock.contacts).toEqual([]);
    expect(lock.locks).toMatchObject([{ white: { square: "e4" }, black: { square: "e5" } }]);
  });

  it("reports lost king rights as false but does not assign an arbitrary rook a historic right", () => {
    const fen = "7k/8/8/8/8/8/8/R3K3 w - - 0 1";
    const source = sourceFor("castling", fen);
    expect(selectCastling(source, fen, "e1")).toMatchObject({ kind: "available", color: "white", wings: [{ wing: "kingside", retained: false, rookSquare: null }, { wing: "queenside", retained: false, rookSquare: null }] });
    expect(selectCastling(source, fen, "a1").kind).toBe("no_witness");
  });

  it("fails copied, wrong-family, crossed-clock and invalid-square inputs", () => {
    const source = sourceFor("moves", INITIAL);
    expect(() => selectMoves({ ...source }, INITIAL, "g1")).toThrow();
    expect(() => selectMoves(sourceFor("control", INITIAL), INITIAL, "g1")).toThrow("wrong source projection");
    expect(() => selectMoves(source, INITIAL.replace("0 1", "1 1"), "g1")).toThrow("wrong source position");
    expect(() => selectMoves(source, INITIAL, "z9")).toThrow("invalid selected square");
  });

  it.each(["moves", "control", "pawns", "castling"] as const)("does not mutate %s source bytes or receipt", facet => {
    const source = sourceFor(facet, INITIAL);
    const bytes = JSON.stringify(source);
    const receipt = evidenceValueReceipt(source);
    const selectors = { moves: selectMoves, control: selectControl, pawns: selectPawns, castling: selectCastling };
    selectors[facet](source, INITIAL, facet === "pawns" ? "e2" : facet === "castling" ? "e1" : "g1");
    expect(JSON.stringify(source)).toBe(bytes);
    expect(evidenceValueReceipt(source)).toEqual(receipt);
  });
});
