import { describe, expect, it } from "vitest";
import type { Color, SquareName } from "chessops/types";
import { parseSquare } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { declareEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason);
  return result.value;
}
const legal = (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
const role = (position: ReturnType<typeof legal>, moveUci: string) => available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci }));
const centre = (source: ReturnType<typeof role>) => available(invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source }));
const setup = (fen: string) => invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen });
const screen = (source: ReturnType<typeof setup>) => available(invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source }));
function reseal<T>(source: DeclaredEvidence<T>): DeclaredEvidence<T> {
  const r = evidenceValueReceipt(source);
  return declareEvidence(source.producer, source.projection, source.payload, { factory: r.factory, inputDigest: r.inputDigest, sourceDigests: r.sourceDigests, ...(r.convention === undefined ? {} : { convention: r.convention }) });
}

const CONFIGS = [
  { color: "white", wing: "queenside", bishop: "b2", pawn: "b3", knight: "c3" },
  { color: "white", wing: "kingside", bishop: "g2", pawn: "g3", knight: "f3" },
  { color: "black", wing: "queenside", bishop: "b7", pawn: "b6", knight: "c6" },
  { color: "black", wing: "kingside", bishop: "g7", pawn: "g6", knight: "f6" },
] as const;
function fixture(config: typeof CONFIGS[number], change?: (position: ReturnType<typeof positionFromFen>) => void): string {
  const fen = config.color === "white"
    ? config.wing === "queenside" ? "8/7k/8/8/8/8/8/7K w - - 0 1" : "8/k7/8/8/8/8/8/K7 w - - 0 1"
    : config.wing === "queenside" ? "7k/8/8/8/8/8/7K/8 w - - 0 1" : "k7/8/8/8/8/8/K7/8 w - - 0 1";
  const position = positionFromFen(fen);
  for (const [kind, square] of [["bishop", config.bishop], ["pawn", config.pawn], ["knight", config.knight]] as const) position.board.set(parseSquare(square)!, { color: config.color, role: kind });
  change?.(position);
  return canonicalFen(position);
}

describe("complete literal fianchetto configuration sources", () => {
  it.each(CONFIGS)("retains $color $wing exact setup and inward knight", config => {
    const s = setup(fixture(config)), value = screen(s);
    expect(s.payload.setups).toEqual([{ color: config.color, wing: config.wing,
      bishop: { color: config.color, role: "bishop", square: config.bishop }, pawn: { color: config.color, role: "pawn", square: config.pawn } }]);
    expect(value.payload).toEqual({ fen: s.payload.fen, screens: [{ setup: s.payload.setups[0], knight: { color: config.color, role: "knight", square: config.knight } }] });
    expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(s).payloadDigest]);
    expect(Object.isFrozen(value.payload.screens[0]!.knight)).toBe(true);
  });

  it.each(CONFIGS)("rejects wrong-square/color/role neighbors for $color $wing", config => {
    const wrongColor = config.color === "white" ? "black" : "white";
    for (const change of [
      (p: ReturnType<typeof positionFromFen>) => p.board.take(parseSquare(config.bishop)!),
      (p: ReturnType<typeof positionFromFen>) => p.board.take(parseSquare(config.pawn)!),
      (p: ReturnType<typeof positionFromFen>) => p.board.set(parseSquare(config.bishop)!, { color: config.color, role: "knight" as const }),
      (p: ReturnType<typeof positionFromFen>) => p.board.set(parseSquare(config.bishop)!, { color: wrongColor as Color, role: "bishop" as const }),
      (p: ReturnType<typeof positionFromFen>) => p.board.set(parseSquare(config.pawn)!, { color: wrongColor as Color, role: "pawn" as const }),
      (p: ReturnType<typeof positionFromFen>) => p.board.set(parseSquare(config.pawn)!, { color: config.color, role: "rook" as const }),
    ]) expect(setup(fixture(config, change)).payload.setups).toEqual([]);
    for (const change of [
      (p: ReturnType<typeof positionFromFen>) => p.board.take(parseSquare(config.knight)!),
      (p: ReturnType<typeof positionFromFen>) => p.board.set(parseSquare(config.knight)!, { color: config.color, role: "rook" as const }),
      (p: ReturnType<typeof positionFromFen>) => p.board.set(parseSquare(config.knight)!, { color: wrongColor as Color, role: "knight" as const }),
    ]) {
      const s = setup(fixture(config, change));
      expect(s.payload.setups).toHaveLength(1);
      expect(screen(s).payload.screens).toEqual([]);
    }
  });

  it("keeps all four simultaneous configurations rather than one per side", () => {
    const s = setup("7k/1b4b1/1pn2np1/8/8/1PN2NP1/1B4B1/7K w - - 0 1");
    expect(s.payload.setups.map(row => [row.color, row.wing])).toEqual(CONFIGS.map(row => [row.color, row.wing]));
    expect(screen(s).payload.screens).toHaveLength(4);
  });

  it("owns complete empty snapshots and refuses counterfeit original inputs even before empties", () => {
    const s = setup("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(s.payload.setups).toEqual([]);
    expect(screen(s).payload).toEqual({ fen: s.payload.fen, screens: [] });
    for (const source of [reseal(s), { ...s }]) expect(() => invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source })).toThrow();
    for (const extra of [{ fen: s.payload.fen }, { setups: [] }, { knights: [] }]) expect(() => invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: s, ...extra } as never)).toThrow();
  });

  it("does not broaden an advanced pawn or missing bishop into the exact configuration", () => {
    const config = CONFIGS[0], fen = fixture(config, p => { p.board.take(parseSquare("b3")!); p.board.set(parseSquare("b4")!, { color: "white", role: "pawn" }); });
    expect(setup(fen).payload.setups).toEqual([]);
    expect(() => setup("invalid fen")).toThrow();
    expect(() => invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen, setups: [] } as never)).toThrow();
  });
});

describe("complete exact legal candidate source", () => {
  it("retains pawn/king/minor/heavy source roles from actual original legal members", () => {
    for (const [fen, moveUci, expected] of [
      ["7k/8/8/8/8/8/P7/K7 w - - 0 1", "a2a3", "pawn"],
      ["7k/8/8/8/8/8/8/K7 w - - 0 1", "a1b1", "king"],
      ["7k/8/8/8/8/8/2N5/K7 w - - 0 1", "c2d4", "knight"],
      ["7k/8/8/8/8/8/2B5/K7 w - - 0 1", "c2d3", "bishop"],
      ["7k/8/8/8/8/8/2R5/K7 w - - 0 1", "c2d2", "rook"],
      ["7k/8/8/8/8/8/2Q5/K7 w - - 0 1", "c2d3", "queen"],
    ] as const) {
      const position = legal(fen), value = role(position, moveUci);
      expect(value.payload).toMatchObject({ fen: position.payload.fen, turn: "white", moveUci, sourcePiece: { color: "white", role: expected, square: moveUci.slice(0, 2) }, candidate: { uci: moveUci, role: expected } });
      expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(position).payloadDigest]);
    }
  });

  it.each(["white", "black"] as const)("keeps all four %s promotion identities and the original pawn role", color => {
    const position = legal(color === "white" ? "7k/2P5/8/8/8/8/8/K7 w - - 0 1" : "7k/8/8/8/8/8/2p5/K7 b - - 0 1");
    const stem = color === "white" ? "c7c8" : "c2c1";
    for (const [suffix, promotion] of [["q", "queen"], ["r", "rook"], ["b", "bishop"], ["n", "knight"]] as const) {
      const value = role(position, stem + suffix);
      expect(value.payload.sourcePiece.role).toBe("pawn");
      expect(value.payload.candidate).toMatchObject({ role: "pawn", promotion, uci: stem + suffix });
      expect(centre(value)).toEqual([]);
    }
  });

  it.each([
    ["white", "e1h1", "g1"], ["white", "e1a1", "c1"],
    ["black", "e8h8", "g8"], ["black", "e8a8", "c8"],
  ] as const)("keeps %s castle %s separate from its actual %s landing", (color, uci, landing) => {
    const position = legal(`r3k2r/8/8/8/8/8/8/R3K2R ${color === "white" ? "w" : "b"} KQkq - 0 1`);
    const value = role(position, uci);
    expect(value.payload.candidate.to).toBe(landing);
    expect(value.payload.sourcePiece).toEqual({ color, role: "king", square: uci.slice(0, 2) });
    expect(() => role(position, uci.slice(0, 2) + landing)).toThrow(/canonical/);
  });

  it("refuses unknown moves, aliases, wrong roots, copied sources and caller-written piece data", () => {
    const position = legal("7k/8/8/8/8/8/2P5/K7 w - - 0 1");
    for (const moveUci of ["c2c5", "C2C3", "h8g8", "c2c3q", ""]) expect(() => role(position, moveUci)).toThrow();
    for (const p of [reseal(position), { ...position }]) expect(() => role(p, "c2c3")).toThrow();
    for (const extra of [{ role: "queen" }, { candidate: {} }, { fen: position.payload.fen }, { promotion: "queen" }, { destination: "e4" }]) expect(() => invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci: "c2c3", ...extra } as never)).toThrow();
  });

  it("retains an ordinary black king candidate and refuses a genuine source of another kind", () => {
    const position = legal("7k/8/8/8/8/8/8/K7 b - - 0 1"), value = role(position, "h8g8");
    expect(value.payload).toMatchObject({ turn: "black", moveUci: "h8g8", sourcePiece: { color: "black", role: "king", square: "h8" }, candidate: { from: "h8", to: "g8", role: "king" } });
    const other = setup(position.payload.fen);
    expect(() => invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position: other, moveUci: "h8g8" } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: position } as never)).toThrow();
  });
});

describe("exact pawn extended-centre destinations", () => {
  function pawnCandidate(color: Color, destination: SquareName) {
    const position = positionFromFen(`7k/8/8/8/8/8/8/K7 ${color === "white" ? "w" : "b"} - - 0 1`);
    const from = `${destination[0]}${Number(destination[1]) + (color === "white" ? -1 : 1)}` as SquareName;
    position.board.set(parseSquare(from)!, { color, role: "pawn" });
    return role(legal(canonicalFen(position)), from + destination);
  }
  it.each(["white", "black"] as const)("retains every one of eight %s pawn destinations", color => {
    for (const destination of ["c4", "d4", "e4", "f4", "c5", "d5", "e5", "f5"] as const) {
      const source = pawnCandidate(color, destination), values = centre(source);
      expect(values).toHaveLength(1);
      expect(values[0]!.payload).toEqual(source.payload);
      expect(evidenceValueReceipt(values[0]!).sourceDigests).toEqual([evidenceValueReceipt(source).payloadDigest]);
    }
  });
  it("excludes outside neighbors and non-pawn arrivals without inventing absence from invalid sources", () => {
    for (const destination of ["b4", "g4", "d3", "e6"] as const) expect(centre(pawnCandidate("white", destination))).toEqual([]);
    const knight = role(legal("7k/8/8/8/8/8/2N5/K7 w - - 0 1"), "c2d4");
    expect(centre(knight)).toEqual([]);
    for (const source of [reseal(knight), { ...knight }]) expect(() => invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source })).toThrow();
    expect(() => invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source: knight, destination: "e4" } as never)).toThrow();
  });
  it("records only the declared conventions over actual literal input receipts", () => {
    const candidate = pawnCandidate("white", "e4"), value = centre(candidate)[0]!;
    expect(directProjectionConventions("rules.mobility.reading.pawn_extended_center_destination@1")).toEqual([{ id: "extended-center-destination", version: 1 }]);
    expect(evidenceValueReceipt(value).convention?.refs).toContainEqual({ id: "extended-center-destination", version: 1 });
    const s = setup(fixture(CONFIGS[0]));
    expect(evidenceValueReceipt(screen(s)).convention?.refs).toContainEqual({ id: "fianchetto-configuration", version: 1 });
    for (const [output, source] of [[value, candidate], [screen(s), s]] as const) {
      const direct = directProjectionConventions(`${output.projection.id}@${output.projection.version}`);
      const expected = [...new Map([...direct, ...(evidenceValueReceipt(source).convention?.refs ?? [])].map(ref => [`${ref.id}@${ref.version}`, ref])).values()].sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version);
      expect(evidenceValueReceipt(output).convention?.refs).toEqual(expected);
      expect(evidenceValueReceipt(output).sourceDigests).toEqual([evidenceValueReceipt(source).payloadDigest]);
    }
  });
});
