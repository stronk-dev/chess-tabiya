import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { declareEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason);
  return result.value;
}
function edge(fen: string, moveUci: string) {
  const position = positionFromFen(fen), beforeFen = canonicalFen(position), move = normalizeMove(position, parseUci(moveUci)!);
  expect(position.isLegal(move)).toBe(true); position.play(move);
  return { beforeFen, moveUci, afterFen: canonicalFen(position) };
}
const rays = (fen: string, move: string) => invokeEvidenceValueRoute("rules.transition.event.slider_ray@2", edge(fen, move));
function advance(fen: string, moveUci: string) {
  const e = edge(fen, moveUci), position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: e.beforeFen });
  const source = available(invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position }));
  const landing = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: e.afterFen, landingSquare: moveUci.slice(2, 4) as "b4" });
  return { source, moveUci, landing };
}
const consequences = (input: ReturnType<typeof advance>) => available(invokeEvidenceValueRoute("derived.pawn.consequence.backward_pawn_legal_advance@1", input));
function reseal<T>(source: DeclaredEvidence<T>): DeclaredEvidence<T> {
  const receipt = evidenceValueReceipt(source);
  return declareEvidence(source.producer, source.projection, source.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests, ...(receipt.convention === undefined ? {} : { convention: receipt.convention }) });
}

describe("physical slider roots and ordered strict-interior membership", () => {
  it("joins equal-count changed blocker identities as one event, not lost/gained rays", () => {
    const values = rays("3r3k/8/8/8/8/3Q4/8/7K w - - 0 1", "d3d4");
    const row = values.filter(value => value.payload.root.square === "d8" && value.payload.direction.df === 0 && value.payload.direction.dr === -1);
    expect(row).toHaveLength(1);
    expect(row[0]!.payload).toMatchObject({ sign: "membership_changed", before: { slider: { square: "d8" }, endpoint: "d1", blockers: [{ color: "white", role: "queen", square: "d3" }] }, after: { blockers: [{ color: "white", role: "queen", square: "d4" }] } });
    expect(row[0]!.payload.before?.strictInterior).toEqual(["d7", "d6", "d5", "d4", "d3", "d2"]);
  });

  it("retains a moving slider's original root but emits nothing for unchanged blockers", () => {
    const values = rays("7k/8/8/8/P7/8/8/R6K w - - 0 1", "a1a2");
    expect(values.some(value => value.payload.root.square === "a1" && value.payload.direction.df === 0 && value.payload.direction.dr === 1)).toBe(false);
    expect(values.every(value => value.payload.root.square !== "a2")).toBe(true);
  });

  it("maps castling's rook physically while preserving its root identity", () => {
    const values = rays("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1");
    const rook = values.find(value => value.payload.root.square === "h1" && value.payload.direction.df === -1);
    expect(rook?.payload).toMatchObject({ root: { role: "rook", square: "h1" }, before: { slider: { square: "h1" }, blockers: [{ color: "white", role: "king", square: "e1" }] }, after: { slider: { square: "f1" }, blockers: [] }, sign: "membership_changed" });
    expect(values.every(value => value.payload.root.role !== "king")).toBe(true);
    expect(values.every(value => value.payload.moveUci === "e1h1")).toBe(true);
  });

  it("removes a captured original slider even when a same-role mover takes its square", () => {
    const values = rays("r6k/8/8/8/8/8/8/R6K w - - 0 1", "a1a8");
    const captured = values.filter(value => value.payload.root.color === "black" && value.payload.root.square === "a8");
    expect(captured.length).toBeGreaterThan(0);
    expect(captured.every(value => value.payload.sign === "lost" && value.payload.after === null)).toBe(true);
    expect(values.filter(value => value.payload.root.color === "white").every(value => value.payload.root.square === "a1")).toBe(true);
  });

  it("gains promotion rays under the original pawn, without offboard degenerate rays", () => {
    const values = rays("7k/P7/8/8/8/8/8/7K w - - 0 1", "a7a8r");
    const promoted = values.filter(value => value.payload.root.square === "a7");
    expect(promoted).toHaveLength(2);
    expect(promoted.every(value => value.payload.root.role === "pawn" && value.payload.before === null && value.payload.sign === "gained" && value.payload.after?.slider.role === "rook" && value.payload.after.slider.square === "a8")).toBe(true);
    expect(promoted.map(value => value.payload.direction)).toEqual([{ df: 0, dr: -1 }, { df: 1, dr: 0 }]);
  });

  it("removes both en-passant blockers at their actual squares", () => {
    const values = rays("7k/8/8/4Pp1r/8/8/8/K7 w - f6 0 1", "e5f6");
    const row = values.find(value => value.payload.root.square === "h5" && value.payload.direction.df === -1);
    expect(row?.payload.before?.blockers).toEqual([{ color: "black", role: "pawn", square: "f5" }, { color: "white", role: "pawn", square: "e5" }]);
    expect(row?.payload.after?.blockers).toEqual([]);
  });

  it("excludes occupied board-edge endpoints from blocker membership", () => {
    const values = rays("N6k/8/8/8/8/8/8/R6K w - - 0 1", "a8b6");
    expect(values.some(value => value.payload.root.square === "a1" && value.payload.direction.df === 0 && value.payload.direction.dr === 1)).toBe(false);
  });

  it("distinguishes a one-step empty ray from an offboard absent ray", () => {
    const values = rays("7k/8/8/8/8/8/8/1R5K w - - 0 1", "b1a1");
    const row = values.find(value => value.payload.root.square === "b1" && value.payload.direction.df === -1);
    expect(row?.payload).toMatchObject({ sign: "lost", before: { endpoint: "a1", strictInterior: [], blockers: [] }, after: null });
  });

  it("refuses illegal/crossed edges and caller-written roots or blockers", () => {
    const e = edge("7k/8/8/8/8/8/8/1R5K w - - 0 1", "b1a1");
    for (const input of [{ ...e, afterFen: e.beforeFen }, { ...e, moveUci: "b1c2" }, { ...e, roots: [] }, { ...e, blockers: [] }]) expect(() => invokeEvidenceValueRoute("rules.transition.event.slider_ray@2", input as never)).toThrow();
  });
});

describe("backward-pawn advance from a complete genuine landing population", () => {
  const fen = "1r5k/8/8/p1p5/8/1P6/8/7K w - - 0 1";
  it("retains every opposing-pawn reply and full exchanges without including rook captures", () => {
    const input = advance(fen, "b3b4"), values = consequences(input);
    expect(values).toHaveLength(1);
    expect(input.landing.payload.captures.some(reply => reply.capturer.role === "rook")).toBe(true);
    expect(values[0]!.payload.replies.map(reply => reply.captureUci)).toEqual(["a5b4", "c5b4"]);
    expect(values[0]!.payload.replies).toEqual(input.landing.payload.captures.filter(reply => reply.capturer.role === "pawn"));
    expect(values[0]!.payload).toMatchObject({ pawn: { color: "white", pawn: "b3", stop: "b4" }, advancedPawn: { color: "white", role: "pawn", square: "b4" }, landing: input.landing.payload });
    expect(evidenceValueReceipt(values[0]!).sourceDigests).toEqual([evidenceValueReceipt(input.source).payloadDigest, evidenceValueReceipt(input.landing).payloadDigest]);
    expect(invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen, captureUci: "b3b4" })).toEqual([]);
  });

  it("mirrors exact legal replies for a black pawn", () => {
    const input = advance("7k/8/1p6/8/P1P5/8/8/7K b - - 0 1", "b6b5"), values = consequences(input);
    expect(values[0]!.payload.replies.map(reply => reply.captureUci)).toEqual(["a4b5", "c4b5"]);
    expect(values[0]!.payload.advancedPawn).toEqual({ color: "black", role: "pawn", square: "b5" });
  });

  it("preserves the existing canonical landing receipt for equivalent FEN spellings", () => {
    const input = advance(fen, "b3b4");
    const noncanonical = input.landing.payload.fen.replace("/8/", "/44/");
    expect(noncanonical).not.toBe(input.landing.payload.fen);
    const landing = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: noncanonical, landingSquare: "b4" });
    expect(landing.payload).toEqual(input.landing.payload);
    expect(evidenceValueReceipt(landing).inputDigest).toBe(evidenceValueReceipt(input.landing).inputDigest);
    expect(consequences({ ...input, landing })[0]!.payload.replies.map(reply => reply.captureUci)).toEqual(["a5b4", "c5b4"]);
  });

  it("retains a genuine empty reply population when the pseudo-controller is pinned", () => {
    const input = advance("k7/8/8/p7/8/1P6/8/R6K w - - 0 1", "b3b4"), values = consequences(input);
    expect(input.source.payload.pawns.find(row => row.pawn === "b3")?.controllers).toEqual([{ color: "black", square: "a5" }]);
    expect(input.landing.payload.captures).toEqual([]);
    expect(values).toHaveLength(1);
    expect(values[0]!.payload.replies).toEqual([]);
    expect(evidenceValueReceipt(values[0]!).sourceDigests).toHaveLength(2);
  });

  it("returns available absence for a genuine legal nonqualifying move after checking sources", () => {
    const input = advance("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1e2");
    expect(input.source.payload.pawns).toEqual([]);
    expect(consequences(input)).toEqual([]);
    expect(() => consequences({ ...input, landing: reseal(input.landing) })).toThrow(/genuine/);
    const castle = advance("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1");
    expect(castle.landing.payload.landingSquare).toBe("g1");
    expect(consequences(castle)).toEqual([]);
    const rookSquare = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: castle.landing.payload.fen, landingSquare: "h1" });
    expect(() => consequences({ ...castle, landing: rookSquare })).toThrow(/destination/);
  });

  it("refuses re-sealed sources, wrong target/child, swapped inputs and caller reply lists", () => {
    const input = advance(fen, "b3b4");
    const wrongSquare = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: input.landing.payload.fen, landingSquare: "c4" });
    const wrongChild = invokeEvidenceValueRoute("rules.exchange.reading.landing_captures@1", { fen: input.source.payload.fen, landingSquare: "b4" });
    for (const candidate of [{ ...input, source: reseal(input.source) }, { ...input, landing: reseal(input.landing) }, { ...input, landing: { ...input.landing } }, { ...input, landing: wrongSquare }, { ...input, landing: wrongChild }, { source: input.landing, moveUci: input.moveUci, landing: input.source }, { ...input, replies: [] }]) expect(() => invokeEvidenceValueRoute("derived.pawn.consequence.backward_pawn_legal_advance@1", candidate as never)).toThrow();
  });
});
