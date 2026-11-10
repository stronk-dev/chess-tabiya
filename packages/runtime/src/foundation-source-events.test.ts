import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { assertDeclaredEvidence, declareEvidence, evidenceValueReceipt } from "./evidence-contract.js";
import { evidenceFactorySymbol } from "./evidence-factories.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import { foundationMembershipChange } from "./foundation-position-sources.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

type Family = "king_opposition" | "backward_pawn";
function edge(family: Family, fen: string, moveUci: string) {
  const source = (at: string) => {
    const result = invokeEvidenceValueRoute(`rules.structural.reading.${family}@3`, { position: invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: at }) });
    if (result.kind !== "available") throw Error("Expected complete source snapshot");
    return result.value;
  };
  const position = positionFromFen(fen), move = normalizeMove(position, parseUci(moveUci)!);
  expect(position.isLegal(move)).toBe(true);
  const before = source(canonicalFen(position));
  position.play(move);
  return { before, moveUci, after: source(canonicalFen(position)) };
}

function changes(family: Family, fen: string, moveUci: string) {
  const input = edge(family, fen, moveUci);
  const result = family === "king_opposition"
    ? invokeEvidenceValueRoute("rules.structural.event.king_opposition@2", input as Parameters<typeof invokeEvidenceValueRoute<"rules.structural.event.king_opposition@2">>[1])
    : invokeEvidenceValueRoute("rules.structural.event.backward_pawn@2", input as Parameters<typeof invokeEvidenceValueRoute<"rules.structural.event.backward_pawn@2">>[1]);
  expect(result.kind).toBe("available");
  if (result.kind !== "available") throw Error("Expected available event population");
  return { input, values: result.value };
}

describe("foundation membership algebra", () => {
  it("covers all five cases without a fabricated legal opposition equality", () => {
    expect(foundationMembershipChange(null, null)).toBeUndefined();
    expect(foundationMembershipChange(null, { color: "white" })).toBe("gained");
    expect(foundationMembershipChange({ color: "white" }, null)).toBe("lost");
    expect(foundationMembershipChange({ color: "white", squares: ["e1", "e3"] }, { squares: ["e1", "e3"], color: "white" })).toBeUndefined();
    expect(foundationMembershipChange({ color: "white" }, { color: "black" })).toBe("membership_changed");
  });
});

describe("genuine unobstructed opposition edges", () => {
  it.each([
    ["8/8/8/8/8/4k3/8/3K4 w - - 0 1", "d1e1", "gained"],
    ["8/8/8/8/8/4k3/8/4K3 w - - 0 1", "e1d1", "lost"],
    ["r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7", "membership_changed"],
  ] as const)("retains the sole color-identified pair: %s %s", (fen, move, sign) => {
    const { input, values } = changes("king_opposition", fen, move);
    expect(values).toHaveLength(1);
    const value = values[0]!;
    assertDeclaredEvidence(value);
    expect(value.payload).toMatchObject({ sign, subject: { white: "king", black: "king" }, beforeFen: input.before.payload.fen, afterFen: input.after.payload.fen, moveUci: move });
    if (sign === "membership_changed") {
      expect(value.payload.before).toMatchObject({ opposition: { color: "white" } });
      expect(value.payload.after).toMatchObject({ opposition: { color: "black" } });
    }
  });

  it("retains available empty absence across a real quiet edge", () => {
    expect(changes("king_opposition", "r7/8/8/8/8/4k3/8/3K4 b - - 0 1", "a8a7").values).toEqual([]);
  });

  it("keeps the mirrored holder change on that same pair", () => {
    const values = changes("king_opposition", "4k3/8/4K3/8/8/8/8/R7 w - - 0 1", "a1a2").values;
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ sign: "membership_changed", before: { opposition: { color: "black" } }, after: { opposition: { color: "white" } } });
  });
});

describe("backward pawn physical joins", () => {
  it.each([
    ["7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5", "white", "d4", "d5"],
    ["7k/8/8/3p4/8/4P3/4P3/7K b - - 0 1", "d5d4", "black", "d5", "d4"],
  ] as const)("joins the physical %s pawn without manufacturing lost/gained subjects", (fen, move, color, beforePawn, afterPawn) => {
    const { values } = changes("backward_pawn", fen, move);
    const own = values.filter(value => "color" in value.payload.subject && value.payload.subject.color === color);
    expect(own).toHaveLength(1);
    expect(own[0]!.payload).toMatchObject({ sign: "membership_changed", subject: { color, beforePawn, afterPawn }, before: { pawn: beforePawn }, after: { pawn: afterPawn } });
  });

  it.each([
    ["4k3/8/2p5/1p6/8/1P6/8/4K3 w - - 0 1", "b3b4", "gained"],
    ["4k3/8/2p5/pp6/1P6/8/8/4K3 w - - 0 1", "b4a5", "lost"],
    ["4k3/8/2p5/1p6/1P2B3/8/8/4K3 w - - 0 1", "e4c6", "lost"],
  ] as const)("keeps exact c6 subjects across creation, lost control and capture: %s", (fen, move, sign) => {
    const values = changes("backward_pawn", fen, move).values;
    const subjects = values.filter(value => "color" in value.payload.subject && value.payload.subject.color === "black"
      && ("beforePawn" in value.payload.subject && value.payload.subject.beforePawn === "c6" || "afterPawn" in value.payload.subject && value.payload.subject.afterPawn === "c6"));
    expect(subjects).toHaveLength(1);
    expect(subjects[0]!.payload.sign).toBe(sign);
  });

  it("retains an en-passant-removed pawn at its actual square", () => {
    const values = changes("backward_pawn", "7k/8/8/3pP3/8/4P3/8/7K w - d6 0 1", "e5d6").values;
    expect(values.map(value => value.payload)).toContainEqual(expect.objectContaining({ sign: "lost", subject: { color: "black", beforePawn: "d5", afterPawn: null }, before: expect.objectContaining({ pawn: "d5" }), after: null }));
  });

  it("does not merge two qualifying pawns on the same file when the front pawn moves", () => {
    const values = changes("backward_pawn", "4k3/2p5/2p5/1P6/3P4/1P6/8/4K3 b - - 0 1", "c6c5").values;
    const black = values.filter(value => "color" in value.payload.subject && value.payload.subject.color === "black");
    expect(black.map(value => value.payload)).toEqual(expect.arrayContaining([
      expect.objectContaining({ sign: "membership_changed", subject: { color: "black", beforePawn: "c6", afterPawn: "c5" } }),
      expect.objectContaining({ sign: "membership_changed", subject: { color: "black", beforePawn: "c7", afterPawn: "c7" } }),
    ]));
    expect(black).toHaveLength(2);
  });

  it("omits genuinely equal rows after a quiet move, ignoring the envelope FEN/turn", () => {
    expect(changes("backward_pawn", "4k2r/8/2p5/1p6/1P6/8/8/4K3 b - - 0 1", "h8h7").values).toEqual([]);
  });
});

describe("source/event authority and exact closure", () => {
  it.each(["king_opposition", "backward_pawn"] as const)("%s requires genuine ordered source invocations before testing an empty population", family => {
    const fen = "r7/8/8/8/8/4k3/8/3K4 b - - 0 1", input = edge(family, fen, "a8a7");
    const route = `rules.structural.event.${family}@2` as const;
    // A fully sealed wrapper with the right symbol and cloned receipt is still not an invocation.
    const original = input.before, receipt = evidenceValueReceipt(original);
    const counterfeit = declareEvidence(original.producer, original.projection, original.payload, {
      factory: evidenceFactorySymbol(`rules.structural.reading.${family}@3`), inputDigest: receipt.inputDigest,
      sourceDigests: receipt.sourceDigests, ...(receipt.convention === undefined ? {} : { convention: receipt.convention }),
    });
    const invoke = (data: unknown) => invokeEvidenceValueRoute(route, data as never);
    for (const invalid of [
      { ...input, before: counterfeit }, { ...input, after: counterfeit }, { ...input, before: { ...original } },
      { ...input, before: input.after, after: input.before }, { ...input, after: input.before },
      { before: input.before, moveUci: input.moveUci }, { ...input, extra: original }, { ...input, moveUci: "a8a6" },
    ]) expect(() => invoke(invalid)).toThrow();
    const oldFen = family === "king_opposition" ? "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1" : "6k1/8/8/4pp2/2P1P3/P2P4/P7/6K1 w - - 0 1";
    const old = invokeEvidenceValueRoute(`rules.structural.reading.${family}@2`, { fen: oldFen });
    expect(old.length).toBeGreaterThan(0);
    assertDeclaredEvidence(old[0]);
    expect(() => invoke({ ...input, before: old[0] })).toThrow(/not .*@3/u);
    const real = invoke(input);
    expect(real.kind).toBe("available");
    if (real.kind !== "available") throw Error("Expected checked empty population");
    expect(real.value).toEqual([]);
  });

  it.each([
    ["king_opposition", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7", "king-opposition-unobstructed", "king-opposition-blocker-blind"],
    ["backward_pawn", "4k3/8/2p5/1p6/8/1P6/8/4K3 w - - 0 1", "b3b4", "backward-pawn", "backward-pawn-legacy"],
  ] as const)("%s retains only its replacement plus the actual source closure", (family, fen, move, convention, prior) => {
    const { input, values } = changes(family, fen, move);
    expect(values.length).toBeGreaterThan(0);
    expect(directProjectionConventions(`rules.structural.event.${family}@2`)).toEqual([{ id: convention, version: 1 }]);
    for (const value of values) {
      const receipt = evidenceValueReceipt(value);
      expect(receipt.sourceDigests).toEqual([input.before, input.after].map(source => evidenceValueReceipt(source).payloadDigest));
      const refs = receipt.convention!.refs;
      expect(refs).toContainEqual({ id: convention, version: 1 });
      expect(refs).not.toContainEqual({ id: prior, version: 1 });
      const expected = [...new Map([...(evidenceValueReceipt(input.before).convention?.refs ?? []), ...(evidenceValueReceipt(input.after).convention?.refs ?? []), { id: convention, version: 1 }].map(ref => [`${ref.id}@${ref.version}`, ref])).values()].sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version);
      expect(refs).toEqual(expected);
      expect(Object.isFrozen(value.payload)).toBe(true);
    }
  });
});
