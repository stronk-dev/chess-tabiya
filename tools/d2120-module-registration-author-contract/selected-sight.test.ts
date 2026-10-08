// DISPOSABLE D3578 exploration instrument, not production implementation or a completion gate.
// Passing proves the recorded gaps exist. Flip these preimage controls when the amended delivery
// lands; do not add this diagnostic to ordinary software CI or interpret it as useful Sight.
import { describe, expect, it } from "vitest";

import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { sightScope } from "../../packages/runtime/src/module-query.js";
import { moduleDeclaration } from "../../packages/runtime/src/module-registry.js";
import { exactLegalMoveMap, type ExactLegalMoveMap } from "../../packages/runtime/src/legal-moves.js";
import type { DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import type { PawnContactsReading } from "../../packages/runtime/src/pawn-dynamics.js";
import type { CastlingRightsState } from "../../packages/runtime/src/castling.js";
import type { SquareControlReading } from "../../packages/runtime/src/square-control.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CONTACT = "7k/8/8/3p4/4P3/8/8/7K w - - 0 1";

describe("D3578: real producer values versus the requested-sight contract", () => {
  it.each([
    { route: "rules.castling.reading.rights@1", fen: INITIAL },
    { route: "rules.square.reading.control@1", fen: INITIAL },
    { route: "rules.pawn.reading.contacts@1", fen: CONTACT },
    { route: "rules.mobility.reading.legal_moves@1", fen: INITIAL },
  ])("CURRENT GAP: $route has no selectable square", ({ route, fen }) => {
    const evidence = invokeEvidenceValueRoute(route as EvidenceValueRoute, { fen }) as DeclaredEvidence<unknown>;
    expect(evidence.projection.id).toBe(route.split("@")[0]);
    if (route === "rules.castling.reading.rights@1") expect((evidence.payload as CastlingRightsState).white.kingside).toBe(true);
    if (route === "rules.square.reading.control@1") expect((evidence.payload as SquareControlReading).colors[0]!.pseudo.some(entry => entry.controllers.length > 0)).toBe(true);
    if (route === "rules.pawn.reading.contacts@1") expect((evidence.payload as PawnContactsReading).contacts.length).toBeGreaterThan(0);
    if (route === "rules.mobility.reading.legal_moves@1") expect((evidence.payload as ExactLegalMoveMap).pieces.find(entry => entry.piece.square === "g1")!.moves).toHaveLength(2);
    // An empty scope excludes this source at every square, not only this fixture's origin.
    expect(sightScope(evidence)).toEqual([]);
  });

  it("CURRENT CONFLICT: complete queen destinations cannot fit the six-mark Sight ceiling", () => {
    const map = exactLegalMoveMap("8/7k/8/8/3Q4/8/K7/8 w - - 0 1");
    const queen = map.pieces.find(entry => entry.piece.square === "d4")!;
    const destinations = new Set(queen.moves.map(move => move.to));
    expect(destinations.size).toBe(27);
    expect(moduleDeclaration("sight_on_request").budgets.maxMarks).toBe(6);
    expect(destinations.size).toBeGreaterThan(moduleDeclaration("sight_on_request").budgets.maxMarks!);
  });

  it("REQUIRED RETENTION: one promotion square still carries four legal move identities", () => {
    const pawn = exactLegalMoveMap("7k/P7/8/8/8/8/8/7K w - - 0 1").pieces.find(entry => entry.piece.square === "a7")!;
    expect([...new Set(pawn.moves.map(move => move.to))]).toEqual(["a8"]);
    expect(pawn.moves.map(move => move.uci)).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
  });
});
