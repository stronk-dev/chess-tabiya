import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { collectFoundationAdvanceSource, collectFoundationSnapshotSource, type FoundationSnapshotSourceRef } from "./foundation-snapshot-source.js";
import { FOUNDATION_SNAPSHOT_FACT_RENDERERS, FOUNDATION_SNAPSHOT_STATEMENTS, assertFoundationSnapshotPayloadRef } from "./foundation-snapshot-presentation.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import * as routes from "./internal/evidence-value-routes.js";
const refs = Object.keys(FOUNDATION_SNAPSHOT_STATEMENTS).filter(r => r !== "derived.pawn.consequence.backward_pawn_legal_advance@1") as FoundationSnapshotSourceRef[];
afterEach(() => vi.restoreAllMocks());
const edge = (fen: string, moveUci: string) => {
  const before = positionFromFen(fen), beforeFen = canonicalFen(before), move = normalizeMove(before, parseUci(moveUci)!);
  expect(before.isLegal(move)).toBe(true); before.play(move);
  return { beforeFen, moveUci, afterFen: canonicalFen(before) };
};
describe("complete selected foundation snapshots", () => {
  it.each(refs)("%s retains one original complete source, including genuine empties", ref => {
    const fen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1", calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const values = collectFoundationSnapshotSource(ref, fen);
    expect(values).toHaveLength(1);
    const i = calls.mock.calls.findIndex(c => c[0] === ref);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(values[0]).toBe(calls.mock.results[i]!.value.value);
    expect(values[0]!.payload).toMatchObject({ fen });
    const [id] = FOUNDATION_SNAPSHOT_STATEMENTS[ref], renderer = FOUNDATION_SNAPSHOT_FACT_RENDERERS[id];
    const parsed = renderer.parse(values[0]!.payload, "actual empty snapshot");
    expect(parsed).toEqual(values[0]!.payload);
    const digest = `sha256:${evidenceValueReceipt(values[0]!).payloadDigest}`;
    expect(() => assertFoundationSnapshotPayloadRef(parsed, digest)).not.toThrow();
    expect(() => assertFoundationSnapshotPayloadRef({ ...parsed, fen: fen.replace("0 1", "1 1") }, digest)).toThrow();
    expect(() => renderer.parse({ ...parsed, foreign: true }, "foreign")).toThrow();
    expect(renderer.render(parsed as never)).not.toMatch(/@\d|future_file|\{"/);
    if (ref === "derived.activity.reading.file_state@1") expect(values[0]!.payload).toMatchObject({ files: [..."abcdefgh"].map(file => ({ file, whitePawns: [], blackPawns: [], state: "open" })) });
  });

  it.each(["7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1", "7k/8/8/3p4/4n3/8/2P5/7K b - - 0 1"])("shares the original demanded outpost chain at %s", fen => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const value = collectFoundationSnapshotSource("derived.structural.reading.occupied_outpost@1", fen)[0]!;
    expect(calls.mock.calls.map(c => c[0])).toEqual(["rules.mobility.reading.legal_moves@1", "rules.square.reading.control@1", "derived.square.reading.future_file_challenge@1", "derived.structural.reading.outpost_candidate@1", "derived.structural.reading.occupied_outpost@1"]);
    expect(calls.mock.calls[2]![1]).toEqual({ position: calls.mock.results[0]!.value });
    expect((calls.mock.calls[2]![1] as { position: unknown }).position).toBe(calls.mock.results[0]!.value);
    const candidateInput = calls.mock.calls[3]![1] as { control: unknown; future: unknown };
    expect(candidateInput.control).toBe(calls.mock.results[1]!.value);
    expect(candidateInput.future).toBe(calls.mock.results[2]!.value.value);
    expect((calls.mock.calls[4]![1] as { source: unknown }).source).toBe(calls.mock.results[3]!.value.value);
    expect(value).toBe(calls.mock.results[4]!.value.value);
  });

  it.each(refs)("%s remains available geometric evidence while the selected king is in check", ref => {
    const fen = "6k1/8/8/8/8/8/8/4K2r w - - 0 1";
    expect(positionFromFen(fen).isCheck()).toBe(true);
    expect(collectFoundationSnapshotSource(ref, fen)).toHaveLength(1);
  });

  it("retains a dense complete pawn domain and every hypothetical row", () => {
    const fen = "7k/pppppppp/pppppppp/pppppppp/PPPPPPPP/PPPPPPPP/PPPPPPPP/K7 w - - 0 1";
    for (const ref of ["derived.square.reading.future_file_challenge@1", "derived.square.reading.capture_migration_reach@1"] as const) {
      const [value] = collectFoundationSnapshotSource(ref, fen);
      const [id] = FOUNDATION_SNAPSHOT_STATEMENTS[ref];
      const parsed = FOUNDATION_SNAPSHOT_FACT_RENDERERS[id].parse(value!.payload, "dense original") as { pawnDomain: readonly unknown[]; challenges?: readonly unknown[]; reaches?: readonly unknown[] };
      expect(parsed.pawnDomain).toHaveLength(48);
      expect((parsed.challenges ?? parsed.reaches)!.length).toBeGreaterThan(100);
      expect(parsed).toEqual(value!.payload);
    }
  });

  it("refuses a source failure instead of synthesizing an empty snapshot", () => {
    const original = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: never) => ref === "rules.structural.reading.backward_pawn@3" ? { kind: "unavailable", reason: "test-original-source-failure" } : original(ref as never, input)) as typeof original);
    expect(() => collectFoundationSnapshotSource("rules.structural.reading.backward_pawn@3", "4k3/8/8/8/8/8/8/4K3 w - - 0 1")).toThrow(/source unavailable/);
  });
});

describe("selected actual backward advance", () => {
  it.each([
    ["1r5k/8/8/p1p5/8/1P6/8/7K w - - 0 1", "b3b4", "white", "b4"],
    ["7k/8/1p6/8/P1P5/8/8/1R5K b - - 0 1", "b6b5", "black", "b5"],
  ])("retains original full landing and calculated pawn subset at %s", (fen, uci, color, square) => {
    const e = edge(fen!, uci!), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const values = collectFoundationAdvanceSource(e);
    expect(values).toHaveLength(1);
    expect(calls.mock.calls.map(c => c[0])).toEqual(["rules.mobility.reading.legal_moves@1", "rules.structural.reading.backward_pawn@3", "rules.exchange.reading.landing_captures@1", "derived.pawn.consequence.backward_pawn_legal_advance@1"]);
    expect(calls.mock.calls[2]![1]).toEqual({ fen: e.afterFen, landingSquare: square });
    const input = calls.mock.calls[3]![1] as { source: unknown; landing: unknown };
    expect(input.source).toBe(calls.mock.results[1]!.value.value);
    expect(input.landing).toBe(calls.mock.results[2]!.value);
    expect(values[0]).toBe(calls.mock.results[3]!.value.value[0]);
    const parsed = FOUNDATION_SNAPSHOT_FACT_RENDERERS["inspector.snapshot.backward_pawn_advance@1"].parse(values[0]!.payload, "actual selected advance");
    expect(parsed.advancedPawn).toEqual({ color, role: "pawn", square });
    expect(parsed.landing.captures.some(r => r.capturer.role === "rook")).toBe(true);
    expect(parsed.replies).toHaveLength(2);
    expect(parsed.replies).toEqual(parsed.landing.captures.filter(r => r.capturer.role === "pawn"));
    expect(parsed).toEqual(values[0]!.payload);
  });
  it("keeps a qualifying zero-reply result distinct from a nonqualifying selected move", () => {
    const [value] = collectFoundationAdvanceSource(edge("k7/8/8/p7/8/1P6/8/R6K w - - 0 1", "b3b4"));
    expect(value!.payload).toMatchObject({ replies: [], landing: { captures: [] } });
    expect(collectFoundationAdvanceSource(edge("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1e2"))).toEqual([]);
  });
  it.each(["e1g1", "e1h1", "e1c1", "e1a1"])("retains the physical castle destination for %s", move => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute"), fen = "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1";
    expect(collectFoundationAdvanceSource(edge(fen, move))).toEqual([]);
    expect(calls.mock.calls[2]![1]).toMatchObject({ landingSquare: move.endsWith("g1") || move.endsWith("h1") ? "g1" : "c1" });
  });
  it("refuses a foreign after-position even when a selected move would not qualify", () => {
    const e = edge("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1e2");
    expect(() => collectFoundationAdvanceSource({ ...e, afterFen: e.beforeFen })).toThrow();
  });
});
