// DISPOSABLE D1716/D1718/D4167 research. Finite extraction of existing ray/turn-clone algebra.
// Plain model data, not production factories, packet authority, validation or learner activation.
import { describe, expect, it } from "vitest";
import { Chess, normalizeMove } from "chessops/chess";
import type { Square } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/position-cache.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import type { PhysicalSliderRay } from "../../packages/runtime/src/foundation-slider-sources.js";
import { loosePieceEvents } from "../../packages/runtime/src/tactics.js";

const directions = [-1, 0, 1].flatMap(df => [-1, 0, 1].filter(dr => df !== 0 || dr !== 0).map(dr => ({ df, dr })));
const legal = (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
type Position = ReturnType<typeof legal>;

// Research copy of the existing private ray geometry, so extraction can be tested without
// changing production before review. The accepted implementation must FACTOR it, not keep copies.
function totalRays(source: Position) {
  const position = positionFromFen(source.payload.fen);
  return [...position.board.occupied].flatMap(square => {
    const piece = position.board.get(square)!;
    return directions.map(({ df, dr }) => {
      let ray: PhysicalSliderRay | null = null;
      if (["bishop", "rook", "queen"].includes(piece.role)
        && !(piece.role === "bishop" && (df === 0 || dr === 0))
        && !(piece.role === "rook" && df !== 0 && dr !== 0)) {
        const interior: Square[] = [];
        for (let file = square % 8 + df, rank = Math.floor(square / 8) + dr;
          file >= 0 && file < 8 && rank >= 0 && rank < 8; file += df, rank += dr) interior.push((file + 8 * rank) as Square);
        const endpoint = interior.pop();
        if (endpoint !== undefined) ray = {
          slider: { color: piece.color, role: piece.role, square: makeSquare(square) }, endpoint: makeSquare(endpoint), strictInterior: interior.map(makeSquare),
          blockers: interior.flatMap(at => { const blocker = position.board.get(at); return blocker === undefined ? [] : [{ color: blocker.color, role: blocker.role, square: makeSquare(at) }]; }),
        };
      }
      return { piece: { ...piece, square: makeSquare(square) }, direction: { df, dr }, ray };
    });
  });
}

function child(root: Position, uci: string): Position {
  const position = positionFromFen(root.payload.fen), parsed = parseUci(uci);
  if (parsed === undefined) throw Error("No board move");
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) throw Error("Illegal model child");
  position.play(move); return legal(canonicalFen(position));
}

// Same finite turn rule as tactics.ts::loosePieceReadingForColor; actual existing sealed
// loose-piece reading supplies all values. This does not mint a new source or establish its ABI.
function risk(root: Position, at: Position) {
  const position = positionFromFen(at.payload.fen), actor = root.payload.turn;
  let evaluation = position;
  if (opposite(position.turn) !== actor) {
    const clone = Chess.fromSetup({ ...position.toSetup(), turn: opposite(actor), epSquare: undefined });
    if (clone.isErr) return { kind: "unavailable" as const, reason: "invalid_turn_clone" as const };
    evaluation = clone.value;
  }
  const original = invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen: canonicalFen(evaluation) });
  return { kind: "available" as const, actor, rootFen: root.payload.fen, fen: at.payload.fen,
    evaluationFen: canonicalFen(evaluation), original };
}

describe("disposable complete foundation-state extraction", () => {
  it("retains all physical piece/direction rows, including border null and adjacent empty", () => {
    const root = legal("1k6/8/6p1/8/6P1/8/8/4K1R1 w - - 0 1"), rows = totalRays(root);
    expect(rows).toHaveLength(40);
    const rook = rows.filter(row => row.piece.square === "g1");
    expect(rook).toHaveLength(8);
    expect(rook.map(row => row.direction)).toEqual(directions);
    expect(rook.map(row => row.ray)).toEqual([
      null,
      { slider: { color: "white", role: "rook", square: "g1" }, endpoint: "a1", strictInterior: ["f1", "e1", "d1", "c1", "b1"], blockers: [{ color: "white", role: "king", square: "e1" }] },
      null, null,
      { slider: { color: "white", role: "rook", square: "g1" }, endpoint: "g8", strictInterior: ["g2", "g3", "g4", "g5", "g6", "g7"], blockers: [{ color: "white", role: "pawn", square: "g4" }, { color: "black", role: "pawn", square: "g6" }] },
      null,
      { slider: { color: "white", role: "rook", square: "g1" }, endpoint: "h1", strictInterior: [], blockers: [] },
      null,
    ]);
    expect(rows.filter(row => row.piece.role !== "rook").every(row => row.ray === null)).toBe(true);
  });
  it("retains unchanged full rays even when the actual event source emits no ray change", () => {
    const root = legal("1k6/8/6p1/8/6P1/8/8/4K1R1 w - - 0 1"), at = child(root, "e1d1");
    // King moves on the west ray: the north ray stays unchanged and has no event occurrence.
    const unchanged = totalRays(root).find(row => row.piece.square === "g1" && row.direction.df === 0 && row.direction.dr === 1)!;
    expect(unchanged).toEqual(totalRays(at).find(row => row.piece.square === "g1" && row.direction.df === 0 && row.direction.dr === 1));
    const events = invokeEvidenceValueRoute("rules.transition.event.slider_ray@2", { beforeFen: root.payload.fen, moveUci: "e1d1", afterFen: at.payload.fen });
    expect(events.length).toBeGreaterThan(0);
    expect(events.some(event => event.payload.direction.df === 0 && event.payload.direction.dr === 1)).toBe(false);
  });
  it.each(["q", "r", "b", "n"])("%s promotion has a complete current role domain; root pawn rays stay null", role => {
    const root = legal("k7/7P/8/8/8/8/8/7K w - - 0 1"), at = child(root, `h7h8${role}`);
    expect(totalRays(root).filter(row => row.piece.square === "h7").map(row => row.ray)).toEqual(Array(8).fill(null));
    const current = totalRays(at).filter(row => row.piece.square === "h8");
    expect(current).toHaveLength(8);
    expect(current.every(row => row.piece.role === ({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[role as "q" | "r" | "b" | "n"])).toBe(true);
    expect(current.filter(row => row.ray !== null)).toHaveLength(role === "q" ? 3 : role === "n" ? 0 : role === "b" ? 1 : 2);
  });
  it("both-false loose events omit real non-king risk states rather than proving an empty domain", () => {
    const root = legal("1k6/8/6p1/8/6P1/8/8/4K1R1 w - - 0 1"), at = child(root, "g1h1");
    const before = risk(root, root), after = risk(root, at);
    if (before.kind !== "available" || after.kind !== "available") throw Error("Literal valid actor clone required");
    expect(before.actor).toBe("white"); expect(after.actor).toBe("white");
    expect(before.original.payload.pieces.map(row => ({ square: row.piece.square, enPrise: row.enPrise }))).toEqual([
      { square: "g1", enPrise: false }, { square: "g4", enPrise: false },
    ]);
    expect(after.original.payload.pieces.map(row => ({ square: row.piece.square, enPrise: row.enPrise }))).toEqual([
      { square: "g4", enPrise: false }, { square: "h1", enPrise: false },
    ]);
    expect(loosePieceEvents(root.payload.fen, "g1h1")).toMatchObject({ kind: "available", events: [] });
  });
  it("a real positive root risk becomes false in the played child", () => {
    const root = legal("k7/8/8/2p5/3R4/8/8/7K w - - 0 1"), at = child(root, "d4d1");
    const before = risk(root, root), after = risk(root, at);
    if (before.kind !== "available" || after.kind !== "available") throw Error("Literal valid actor clone required");
    expect(before.original.payload.pieces[0]).toMatchObject({ piece: { square: "d4" }, enPrise: true });
    expect(after.original.payload.pieces[0]).toMatchObject({ piece: { square: "d1" }, enPrise: false });
    expect(loosePieceEvents(root.payload.fen, "d4d1")).toMatchObject({ kind: "available", events: [{ sign: "lost" }] });
  });
  it("an invalid root turn clone refuses even an otherwise empty own non-king domain", () => {
    const root = legal("7k/8/8/8/8/8/8/r6K w - - 0 1"), at = child(root, "h1h2");
    expect(risk(root, root)).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
    expect(risk(root, at).kind).toBe("available");
    expect(loosePieceEvents(root.payload.fen, "h1h2")).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
  });
  it("keeps the child's real en-passant victim separate from the landing square", () => {
    const root = legal("7k/8/8/8/3p4/8/4P3/7K w - - 0 1"), at = child(root, "e2e4"), result = risk(root, at);
    if (result.kind !== "available") throw Error("Literal EP child required");
    expect(result.fen).toBe("7k/8/8/8/3pP3/8/8/7K b - e3 0 1");
    expect(result.evaluationFen).toBe(result.fen);
    expect(result.original.payload.pieces).toHaveLength(1);
    expect(result.original.payload.pieces[0]).toMatchObject({ piece: { square: "e4", occupant: { color: "white", role: "pawn" } }, enPrise: true,
      legalCapturers: [{ captureUci: "d4e3", square: "d4" }] });
  });
  it.each(["q", "r", "b", "n"])("%s promotion remains complete actor risk data with the actual new role", role => {
    const root = legal("k7/7P/8/8/8/8/8/7K w - - 0 1"), at = child(root, `h7h8${role}`);
    const before = risk(root, root), after = risk(root, at);
    if (before.kind !== "available" || after.kind !== "available") throw Error("Literal promotion source required");
    expect(before.original.payload.pieces).toHaveLength(1); expect(after.original.payload.pieces).toHaveLength(1);
    expect(before.original.payload.pieces[0]).toMatchObject({ piece: { square: "h7", occupant: { color: "white", role: "pawn" } } });
    expect(after.original.payload.pieces[0]).toMatchObject({ piece: { square: "h8", occupant: { color: "white", role: ({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[role as "q" | "r" | "b" | "n"] } } });
  });
  it.each([
    ["1k6/8/8/8/8/8/8/4K2R w K - 0 1", "e1h1", "h1", "f1", "white"],
    ["1k6/8/8/8/8/8/8/R3K3 w Q - 0 1", "e1a1", "a1", "d1", "white"],
    ["4k2r/8/8/8/8/8/8/1K6 b k - 0 1", "e8h8", "h8", "f8", "black"],
  ] as const)("risk keeps the original actor across actual castling: %s", (fen, move, from, to, actor) => {
    const root = legal(fen), at = child(root, move), before = risk(root, root), after = risk(root, at);
    if (before.kind !== "available" || after.kind !== "available") throw Error("Literal castle source required");
    expect(before.actor).toBe(actor); expect(after.actor).toBe(actor);
    expect(before.original.payload.pieces).toHaveLength(1); expect(after.original.payload.pieces).toHaveLength(1);
    expect(before.original.payload.pieces[0]).toMatchObject({ piece: { square: from, occupant: { color: actor, role: "rook" } } });
    expect(after.original.payload.pieces[0]).toMatchObject({ piece: { square: to, occupant: { color: actor, role: "rook" } } });
  });
});
