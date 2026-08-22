import fc from "fast-check";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { SquareName } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  createRun,
  emptyBoardDistance,
  evaluateObjectivePredicate,
  matchesStructuralExpression,
  matchesStructuralFeature,
  mirrorExpression,
  pawnConnectivityReading,
  pawnSafety,
  spaceReading,
  structuralDelta,
  structuralFeatureKinds,
  structuralReading,
  RULES_EVIDENCE_FACTS,
  STRUCTURAL_FEATURE_KINDS,
} from "./index.js";
import type { MirrorAxis, StructuralExpression } from "./structure.js";

const carlsbad = "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10";

function after(fen: string, moves: readonly string[]): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  for (const uci of moves) {
    const move = parseUci(uci);
    if (!move || !position.isLegal(move)) throw new TypeError(`illegal fixture move ${uci}`);
    position.play(move);
  }
  return makeFen(position.toSetup());
}

function mirrorFen(fen: string, axis: MirrorAxis): string {
  const [placement, turn] = fen.split(" ");
  const rows = placement!.split("/").map((row) => [...row].flatMap((char) => /[1-8]/.test(char) ? Array(Number(char)).fill(null) : [char]));
  const mappedRows = axis === "files" ? rows : [...rows].reverse();
  const mapped = mappedRows.map((row) => {
    const cells = axis === "colors" ? row : [...row].reverse();
    return cells.map((cell) => cell === null || axis === "files" ? cell : cell === cell.toUpperCase() ? cell.toLowerCase() : cell.toUpperCase());
  });
  const compressed = mapped.map((row) => { let empty = 0, value = ""; for (const cell of row) { if (cell === null) empty += 1; else { if (empty > 0) value += empty; empty = 0; value += cell; } } return value + (empty || ""); }).join("/");
  return `${compressed} ${axis === "files" ? turn : turn === "w" ? "b" : "w"} - - 0 1`;
}

function legalFen(choices: readonly number[]): string {
  const position = Chess.default();
  for (const choice of choices) {
    const moves = [...position.allDests()].flatMap(([from, destinations]) => [...destinations].map((to) => ({ from, to })));
    if (moves.length === 0) break;
    const move = moves[choice % moves.length]!;
    if (!position.isLegal(move)) throw new TypeError("generated move must be legal");
    position.play(move);
  }
  return makeFen(position.toSetup());
}

describe("structural predicates", () => {
  if (false) {
    // @ts-expect-error D26 sentinel: a future expression node must update structuralFeatureKinds.
    structuralFeatureKinds({ kind: "future_expression" });
    // @ts-expect-error D26 sentinel: a future leaf must update mirrorExpression.
    mirrorExpression({ kind: "feature", feature: { kind: "future_feature" } }, "files");
    // @ts-expect-error D26 sentinel: a future expression node must update mirrorExpression.
    mirrorExpression({ kind: "future_expression" }, "files");
  }
  it("keeps the structural predicate and evidence vocabularies closed together", () => {
    expect(RULES_EVIDENCE_FACTS.filter((fact) => fact.startsWith("structure-")).map((fact) => fact.slice("structure-".length).replaceAll("-", "_"))).toEqual([...STRUCTURAL_FEATURE_KINDS]);
  });
  it("grades the Carlsbad minority signature only after the structural consequence", () => {
    const signature = { kind: "all", of: [
      { kind: "feature", feature: { kind: "backward_pawn", color: "black", file: "c" } },
      { kind: "feature", feature: { kind: "half_open_file", color: "white", file: "c" } },
    ] } as const;
    expect(matchesStructuralExpression(carlsbad, signature)).toBe(false);
    expect(matchesStructuralFeature(carlsbad, signature.of[0].feature)).toBe(false);
    expect(matchesStructuralFeature(carlsbad, signature.of[1].feature)).toBe(true);
    const goal = after(carlsbad, ["d7f8", "a2a3", "f6e4", "a1b1", "e4c3", "b2b4", "c8g4", "b4b5", "h7h6", "b5c6", "b7c6"]);
    expect(matchesStructuralFeature(goal, signature.of[0].feature)).toBe(true);
    expect(matchesStructuralExpression(goal, signature)).toBe(true);
  });

  it("makes the FEN predicate dispatch exhaustive instead of falling through to pawnStructure", () => {
    const run = createRun({ id: "structural-false", packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: carlsbad, seed: 1, createdAt: "2026-08-14T00:00:00.000Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    expect(evaluateObjectivePredicate(run, { type: "fenPredicate", predicate: { type: "structuralFeature", feature: { kind: "feature", feature: { kind: "backward_pawn", color: "black", file: "c" } } } })).toBe(false);
  });

  it("reports maximal pawn-reach scope and direct counts without balance claims", () => {
    const safety = pawnSafety("4k3/8/8/1N6/8/8/P7/4K3 w - - 0 1", "black", "b5");
    expect(safety.basis).toBe("maximal_pawn_reach@1");
    expect(safety.pushAttackers).toEqual([{ square: "a2", pushes: 2 }]);
    const reading = structuralReading(carlsbad);
    expect(reading.features.some((item) => item.kind === "half_open_file" && item.color === "white" && item.file === "c")).toBe(true);
    expect(JSON.stringify(reading)).not.toMatch(/score|severity|favours|balance/);
  });

  it("refuses a safety claim when a pawn can migrate onto an attacking file", () => {
    const captureMigration = pawnSafety("4k3/8/8/1n6/8/8/3P4/4K3 w - - 0 1", "black", "b5");
    expect(captureMigration.pushAttackers).toEqual([]);
    expect(captureMigration.captureAttackers).toEqual([{ square: "d2", captures: 1 }]);
    expect(captureMigration.safe).toBe(false);

    const unreachable = pawnSafety("4k3/8/8/1n6/8/8/7P/4K3 w - - 0 1", "black", "b5");
    expect(unreachable.pushAttackers).toEqual([]);
    expect(unreachable.captureAttackers).toEqual([]);
    expect(unreachable.safe).toBe(true);
  });

  it("treats blocked pawn routes as potential reach rather than a legal prediction", () => {
    const blocked = pawnSafety("4k3/8/8/1n6/P7/P7/P7/4K3 w - - 0 1", "black", "b5");
    expect(blocked.pushAttackers).toEqual([{ square: "a4", pushes: 0 }, { square: "a3", pushes: 1 }, { square: "a2", pushes: 2 }]);
    expect(blocked.safe).toBe(false);
  });

  it("separates connected pawn pairs, directed support, chains, and occupied-file islands", () => {
    const branched = pawnConnectivityReading("4k3/8/8/8/8/3P4/2P1P3/4K3 w - - 0 1").colors.find((value) => value.color === "white")!;
    expect(branched.supportEdges).toEqual([
      { supporter: "c2", supported: "d3" },
      { supporter: "e2", supported: "d3" },
    ]);
    expect(branched.chains).toEqual([{ members: ["c2", "d3", "e2"], bases: ["c2", "e2"] }]);

    const duo = pawnConnectivityReading("4k3/8/8/8/2PP4/8/8/4K3 w - - 0 1").colors.find((value) => value.color === "white")!;
    expect(duo.connectedPawnPairs).toEqual([["c4", "d4"]]);
    expect(duo.supportEdges).toEqual([]);
    expect(duo.chains).toEqual([]);

    const doubled = pawnConnectivityReading("4k3/8/8/8/8/P7/P1P5/4K3 w - - 0 1").colors.find((value) => value.color === "white")!;
    expect(doubled.islandCount).toBe(2);
    expect(doubled.islands).toEqual([
      { files: ["a"], squares: ["a2", "a3"] },
      { files: ["c"], squares: ["c2"] },
    ]);

    const blackMirror = pawnConnectivityReading("4k3/2p1p3/3p4/8/8/8/8/4K3 b - - 0 1").colors.find((value) => value.color === "black")!;
    expect(blackMirror.supportEdges).toEqual([
      { supporter: "c7", supported: "d6" },
      { supporter: "e7", supported: "d6" },
    ]);
    expect(blackMirror.chains).toEqual([{ members: ["c7", "d6", "e7"], bases: ["c7", "e7"] }]);
  });

  it("measures space as pawn-controlled enemy-half squares in three fixed zones", () => {
    const fen = "4k3/8/8/3P3P/5P2/8/8/4K3 w - - 0 1";
    const before = spaceReading(fen);
    const white = before.colors.find((value) => value.color === "white")!;
    expect(white.zones).toEqual([
      { zone: "queenside", squares: ["c6"], count: 1 },
      { zone: "central", squares: ["e5", "e6"], count: 2 },
      { zone: "kingside", squares: ["g5", "g6"], count: 2 },
    ]);
    const afterWhite = spaceReading(after(fen, ["f4f5"])).colors.find((value) => value.color === "white")!;
    expect(afterWhite.zones.find((value) => value.zone === "central")?.count).toBe(1);
    expect(afterWhite.zones.find((value) => value.zone === "kingside")?.count).toBe(1);
    expect(before.conventionId).toBe("space@1");

    const mirror = "4K3/8/8/5p2/3p3p/8/8/4k3 b - - 0 1";
    const black = spaceReading(mirror).colors.find((value) => value.color === "black")!;
    expect(black.zones).toEqual([
      { zone: "queenside", squares: ["c3"], count: 1 },
      { zone: "central", squares: ["e3", "e4"], count: 2 },
      { zone: "kingside", squares: ["g3", "g4"], count: 2 },
    ]);
    const afterBlack = spaceReading(after(mirror, ["f5f4"])).colors.find((value) => value.color === "black")!;
    expect(afterBlack.zones.find((value) => value.zone === "central")?.count).toBe(1);
    expect(afterBlack.zones.find((value) => value.zone === "kingside")?.count).toBe(1);
  });

  it("records eviction distance changes without inventing permanence", () => {
    const a2 = "4k3/1p6/8/1n6/8/8/P7/4K3 w - - 0 1";
    const a3 = after(a2, ["a2a3"]);
    const delta = structuralDelta(a2, a3);
    const change = delta.evictionChanges.find((item) => item.square === "b5" && item.color === "black");
    expect(change).toMatchObject({ pushesBefore: 2, pushesAfter: 1 });
    expect(delta.gained).toEqual([]);
    expect(delta.lost).toEqual([]);
  });

  it("keeps pawn safety internally consistent over arbitrary squares", () => {
    const squares = Array.from({ length: 64 }, (_, index) => `${"abcdefgh"[index % 8]}${Math.floor(index / 8) + 1}` as SquareName);
    fc.assert(fc.property(fc.constantFrom(...squares), fc.constantFrom("white", "black"), (square, color) => {
      const result = pawnSafety(carlsbad, color, square);
      expect(result.safe).toBe(result.pushAttackers.length === 0 && result.captureAttackers.length === 0);
      expect(result.pushAttackers.every((item) => item.pushes >= 0)).toBe(true);
      expect(result.captureAttackers.every((item) => item.captures >= 1)).toBe(true);
    }));
  });

  it("records the structural reading envelope without a brittle microbenchmark", () => {
    const next = after(carlsbad, ["d7f8"]);
    const durations: number[] = [];
    for (let index = 0; index < 200; index += 1) {
      const started = performance.now();
      structuralReading(carlsbad);
      structuralDelta(carlsbad, next);
      durations.push(performance.now() - started);
    }
    durations.sort((a, b) => a - b);
    const medianMs = durations[Math.floor(durations.length / 2)]!;
    const maxMs = durations.at(-1)!;
    console.log(`STRUCTURAL_LATENCY ${JSON.stringify({ samples: durations.length, medianMs: Number(medianMs.toFixed(3)), maxMs: Number(maxMs.toFixed(3)) })}`);
    expect(durations).toHaveLength(200);
    expect(Number.isFinite(maxMs)).toBe(true);
  }, 30_000); // Observational envelope: the unit gate records load, it does not turn host contention into a product failure.

  it("evaluates bishop shade, pawn census, and tempo-qualified opposition", () => {
    const bishops = "4k3/8/8/8/8/8/8/Bb2K3 w - - 0 1";
    expect(matchesStructuralFeature(bishops, { kind: "bishop_on_shade", color: "white", shade: "dark" })).toBe(true);
    expect(matchesStructuralFeature(bishops, { kind: "bishop_on_shade", color: "black", shade: "light" })).toBe(true);
    const pawns = "4k3/8/8/8/8/8/P6P/4K3 w - - 0 1";
    expect(matchesStructuralFeature(pawns, { kind: "pawn_count", color: "white", basis: "count", comparison: "equal", count: 2 })).toBe(true);
    expect(matchesStructuralFeature(pawns, { kind: "pawn_count", color: "black", basis: "difference", comparison: "equal", count: -2 })).toBe(true);
    const direct = "8/8/8/4K3/8/4k3/8/8 b - - 0 1";
    const distant = "8/4K3/8/8/8/4k3/8/8 b - - 0 1";
    expect(matchesStructuralFeature(direct, { kind: "king_opposition", color: "white", form: "direct" })).toBe(true);
    expect(matchesStructuralFeature(direct.replace(" b ", " w "), { kind: "king_opposition", color: "white", form: "direct" })).toBe(false);
    expect(matchesStructuralFeature(distant, { kind: "king_opposition", color: "white", form: "distant" })).toBe(true);
  });

  it("pins opposition gaps, alignment, occupancy, mover, colour, and mirrors", () => {
    const direct = "8/8/8/4K3/8/4k3/8/8 b - - 0 1";
    const directOccupied = "8/8/8/4K3/4p3/4k3/8/8 b - - 0 1";
    const distantThree = "8/4K3/8/8/8/4k3/8/8 b - - 0 1";
    const distantFive = "4K3/8/8/8/8/8/4k3/8 b - - 0 1";
    const evenGap = "8/8/4K3/8/8/4k3/8/8 b - - 0 1";
    const misaligned = "8/8/8/4K3/8/3k4/8/8 b - - 0 1";
    for (const fen of [direct, directOccupied]) expect(matchesStructuralFeature(fen, { kind: "king_opposition", color: "white", form: "direct" })).toBe(true);
    for (const fen of [distantThree, distantFive]) expect(matchesStructuralFeature(fen, { kind: "king_opposition", color: "white", form: "distant" })).toBe(true);
    for (const fen of [evenGap, misaligned, direct.replace(" b ", " w ")]) expect(matchesStructuralFeature(fen, { kind: "king_opposition", color: "white", form: "direct" })).toBe(false);
    expect(matchesStructuralFeature(direct.replace(" b ", " w "), { kind: "king_opposition", color: "black", form: "direct" })).toBe(true);
    expect(matchesStructuralExpression(direct, { kind: "mirrored", axis: "files", of: { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct" } } })).toBe(true);
    expect(matchesStructuralExpression(direct, { kind: "mirrored", axis: "colors", of: { kind: "feature", feature: { kind: "king_opposition", color: "black", form: "direct" } } })).toBe(true);
    expect(matchesStructuralExpression(direct, { kind: "mirrored", axis: "both", of: { kind: "feature", feature: { kind: "king_opposition", color: "black", form: "direct" } } })).toBe(true);
  });

  it("flips bishop shade under one-axis mirrors and preserves it under both", () => {
    const expression = { kind: "feature", feature: { kind: "bishop_on_shade", color: "white", shade: "dark" } } as const;
    expect(mirrorExpression(expression, "files")).toMatchObject({ feature: { shade: "light", color: "white" } });
    expect(mirrorExpression(expression, "colors")).toMatchObject({ feature: { shade: "light", color: "black" } });
    expect(mirrorExpression(expression, "both")).toMatchObject({ feature: { shade: "dark", color: "black" } });
  });

  it("quantifies exact file and square domains", () => {
    const fen = "4k3/8/8/3P4/8/8/8/4K3 w - - 0 1";
    expect(matchesStructuralExpression(fen, { kind: "quantified", quantifier: "some", over: { squares: { files: { from: "c", to: "e" }, ranks: { from: 4, to: 6 } } }, feature: { kind: "passed_pawn", color: "white" } })).toBe(true);
    expect(matchesStructuralExpression(fen, { kind: "quantified", quantifier: "every", over: { squares: { files: { from: "a", to: "b" }, ranks: { from: 1, to: 2 } } }, feature: { kind: "piece", piece: null } })).toBe(true);
    expect(matchesStructuralExpression(fen, { kind: "quantified", quantifier: "some", over: { squares: { files: { from: "d", to: "f" }, ranks: { from: 1, to: 2 } } }, feature: { kind: "piece", piece: { color: "white", role: "king" } } })).toBe(true);
    expect(matchesStructuralExpression("4k3/8/8/8/8/3P4/8/4K3 w - - 0 1", { kind: "quantified", quantifier: "some", over: { squares: { files: { from: "e", to: "e" }, ranks: { from: 2, to: 4 } } }, feature: { kind: "outpost", color: "white" } })).toBe(true);
    expect(structuralFeatureKinds({ kind: "quantified", quantifier: "some", over: { squares: { files: { from: "a", to: "h" }, ranks: { from: 2, to: 7 } } }, feature: { kind: "passed_pawn", color: "white" } })).toEqual(["passed_pawn"]);
  });

  it("mirrors every supported structural expression against an independent FEN oracle", () => {
    const positions = [carlsbad, "8/8/8/4K3/8/4k3/8/8 b - - 0 1", "4k3/1bp5/8/8/8/8/6P1/4K3 w - - 0 1"];
    const expressions: StructuralExpression[] = [
      { kind: "feature", feature: { kind: "bishop_on_shade", color: "black", shade: "light" } },
      { kind: "feature", feature: { kind: "pawn_count", color: "white", basis: "difference", comparison: "atLeast", count: 0 } },
      { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct" } },
      { kind: "quantified", quantifier: "some", over: { files: { from: "a", to: "d" } }, feature: { kind: "isolated_pawn", color: "white" } },
      { kind: "pieceOnSquare", square: "b7", piece: { color: "black", role: "bishop" } },
    ];
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 200 }), { maxLength: 12 }), fc.constantFrom(...positions), fc.constantFrom(...expressions), fc.constantFrom("colors", "files", "both" as const), (choices, fallback, expression, axis) => {
      const fen = choices.length === 0 ? fallback : legalFen(choices);
      expect(matchesStructuralExpression(fen, { kind: "mirrored", axis, of: expression })).toBe(matchesStructuralExpression(mirrorFen(fen, axis), expression));
      expect(matchesStructuralExpression(fen, mirrorExpression(mirrorExpression(expression, axis), axis))).toBe(matchesStructuralExpression(fen, expression));
    }));
  });

  it("adds finite score-free census observations", () => {
    const reading = structuralReading("8/8/8/4K3/8/4k3/P7/B7 b - - 0 1");
    expect(reading.features.filter((item) => item.kind === "piece_count")).toHaveLength(12);
    expect(reading.features.filter((item) => item.kind === "pawn_count")).toHaveLength(0);
    expect(reading.features).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "bishop_on_shade", color: "white", shade: "dark", squares: ["a1"] }),
      expect.objectContaining({ kind: "king_opposition", color: "white", form: "direct" }),
      expect.objectContaining({ kind: "piece_count", color: "white", role: "pawn", count: 1 }),
    ]));
    expect(JSON.stringify(reading)).not.toMatch(/score|rank|severity|favours/);
  });

  it("evaluates census, zones, and static piece distance without vacuous truth", () => {
    const fen = "4k3/8/8/8/8/8/8/B3K2R w - - 0 1";
    expect(matchesStructuralFeature(fen, { kind: "piece_count", color: "white", role: "rook", basis: "difference", comparison: "equal", count: 1 })).toBe(true);
    expect(matchesStructuralFeature(fen, { kind: "king_zone", color: "black", zone: "edge" })).toBe(true);
    expect(matchesStructuralFeature(fen, { kind: "king_zone", color: "black", zone: "corner" })).toBe(false);
    expect(matchesStructuralFeature(fen, { kind: "piece_distance", color: "white", role: "bishop", target: { kind: "piece", color: "black", role: "king" }, comparison: "atLeast", count: 0 })).toBe(false);
    expect(matchesStructuralFeature(fen, { kind: "piece_distance", color: "white", role: "rook", target: { kind: "piece", color: "black", role: "king" }, comparison: "equal", count: 2 })).toBe(true);
    expect(emptyBoardDistance("knight", 0, 63)).toBe(6);
    const maxima = { king: 0, knight: 0, bishop: 0, rook: 0, queen: 0 };
    for (const role of Object.keys(maxima) as (keyof typeof maxima)[]) for (let from = 0; from < 64; from += 1) for (let to = 0; to < 64; to += 1) maxima[role] = Math.max(maxima[role], emptyBoardDistance(role, from, to) ?? 0);
    expect(maxima).toEqual({ king: 7, knight: 6, bishop: 2, rook: 2, queen: 2 });
  });
});
