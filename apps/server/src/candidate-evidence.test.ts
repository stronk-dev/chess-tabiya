import { describe, expect, it } from "vitest";
import * as runtime from "@chess-tabiya/runtime";
import { capabilityKey } from "@chess-tabiya/schema";
import {
  CANDIDATE_READINGS_SCOPE, CANDIDATE_WIDE_SCOPE, candidatePlayedRow,
  compileCandidatePopulation, exactLegalMoves, trappedPieceReading,
  type CandidatePacketScope, type SquareControlReading,
} from "@chess-tabiya/runtime";
import { BOT_POLICY_PROFILES } from "./bot-policy-catalog.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
import { runtimeSupportedCapabilities, unmetRequirements } from "./capability/pack-capabilities.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
function packet(beforeFen: string, scope: CandidatePacketScope = CANDIDATE_WIDE_SCOPE) {
  const result = compileCandidatePopulation({ beforeFen, ruleset: "standard", scope });
  if (result.kind !== "ready") throw new Error(`Expected complete candidate packet: ${JSON.stringify(result.error)}`);
  return result.receipt;
}

describe("current candidate evidence (D3853 unused vector retirement)", () => {
  it("retains the complete legal population, child readings and edge events without caller scores", () => {
    const receipt = packet(START);
    expect(receipt.packet.candidates.map(row => row.moveUci).sort()).toEqual(exactLegalMoves(START).map(move => move.uci).sort());
    expect(receipt.packet.candidates).toHaveLength(20);
    const selected = ["g1f3", "e2e4"].map(move => candidatePlayedRow(receipt, move));
    expect(new Set(selected.map(row => row.afterFen))).toHaveLength(2);
    for (const row of selected) {
      expect(row.readings.length).toBeGreaterThan(15);
      expect(row.readings.map(item => item.projection.id)).toEqual(expect.arrayContaining([
        "rules.mobility.reading.piece_destinations", "rules.king.reading.zone_state",
        "rules.tactic.reading.loose_piece",
      ]));
      expect(row.events.some(item => item.projection.id === "rules.tactic.consequence.reply_breadth")).toBe(true);
      // D3642 remains a real current source regression, not an obsolete vector snapshot.
      expect(row.readings.filter(item => item.projection.id === "rules.castling.reading.legality").map(item => item.payload)).toEqual(expect.arrayContaining([
        expect.objectContaining({ color: "white", wing: "queenside", blockedSquares: ["d1", "c1", "b1"] }),
        expect.objectContaining({ color: "black", wing: "queenside", blockedSquares: ["d8", "c8", "b8"] }),
      ]));
      // D3656: every legal controller must be an actual attack, not a quiet destination.
      const control = row.readings.find(item => item.projection.id === "rules.square.reading.control")!.payload as SquareControlReading;
      for (const color of control.colors) {
        if (color.legal.kind !== "available") continue;
        const pseudo = new Set(color.pseudo.flatMap(cell => cell.controllers.map(piece => `${piece.square}:${cell.target}`)));
        for (const cell of color.legal.squares) for (const piece of cell.controllers) {
          expect(pseudo.has(`${piece.square}:${cell.target}`), `${row.moveUci} ${piece.square} → ${cell.target}`).toBe(true);
        }
      }
      const white = control.colors.find(color => color.color === "white")!;
      if (white.legal.kind !== "available") throw new Error("Expected available white control");
      expect(white.legal.squares.find(cell => cell.target === "e4")!.controllers.map(piece => piece.square)).not.toContain("e2");
      expect([...row.readings, ...row.events].some(item => item.projection.id === "human.maia.candidate_wdl")).toBe(false);
    }
    expect(selected[0]!.events.some(item => item.projection.id === "rules.transition.event.developed")).toBe(true);
    expect(JSON.stringify(receipt.packet)).not.toMatch(/scoreCp|scoreFrame|sentence|personality|move_quality|learner/u);
  });

  it("has no vector callable or binding, while preserving its historical meaning and real opponent inputs", () => {
    for (const name of ["candidateFeatureVectorEvidence", "candidateCollectorIds"]) expect(name in runtime).toBe(false);
    const projection = EVIDENCE_MANIFEST.projections.find(item => item.id === "derived.opponent.candidate_feature_vector")!;
    expect(projection.version).toBe(1);
    expect(projection.disposition?.kind).toBe("retired");
    const current = runtime.CAPABILITY_REGISTRY.current(projection.id)!;
    expect(current.id).toEqual({ id: projection.id, version: { kind: "integer", value: 1 } });
    expect(current.disposition).toMatchObject({ kind: "withdrawn", successor: null,
      noSuccessor: { kind: "replacement_refused", authority: { kind: "accepted_rfc", document: "rfc/evidence-value-authority.md" } },
    });
    const support = runtimeSupportedCapabilities();
    expect(support.supported.has(capabilityKey(current.id))).toBe(false);
    expect(unmetRequirements([current.id], support)).toEqual([current.id]);
    expect(EVIDENCE_MANIFEST.bindings.filter(binding => binding.projection.id === projection.id)).toEqual([]);
    expect(EVIDENCE_MANIFEST.consumers.find(item => item.id === "opponent.selection" && item.version === 1)?.accepts).toEqual([
      ...["human.maia.uci_response", "live.stockfish.uci_response", "live.syzygy.probe_result"].map(id => ({ id, version: 1 })),
      { id: "live.syzygy.position_result", version: 2 },
    ]);
  });

  it.each([
    { beforeFen: "r7/7k/8/8/8/8/b1n5/R1K5 b A - 0 1", move: "h7h8", rook: "a1" },
    { beforeFen: "r1k5/B1N5/8/8/8/8/7K/R7 w a - 0 1", move: "h2h1", rook: "a8" },
  ])("D3652 retains a genuine castling escape in the current packet: $move", value => {
    const row = candidatePlayedRow(packet(value.beforeFen, CANDIDATE_READINGS_SCOPE), value.move);
    const readings = row.readings.filter(item => item.projection.id === "rules.tactic.reading.trapped_piece");
    expect(readings).toHaveLength(1);
    expect(readings[0]!.payload).toEqual({ kind: "pieces", conventionId: "trapped@1", fen: row.afterFen, sideToMove: value.move === "h7h8" ? "white" : "black", pieces: [] });
    // Same geometry without the right: this is not an irrelevant-side/no-attacker negative.
    const noCastle = row.afterFen.replace(/ [Qq] /u, " - ");
    expect(trappedPieceReading(noCastle)).toMatchObject({ kind: "pieces", pieces: expect.arrayContaining([
      expect.objectContaining({ piece: expect.objectContaining({ square: value.rook }) }),
    ]) });
  });

  it("retains explicit pass-while-in-check abstention for a checking candidate", () => {
    const row = candidatePlayedRow(packet("4k3/8/8/8/8/8/Q7/4K3 w - - 0 1"), "a2e6");
    expect(row.readings.find(item => item.projection.id === "rules.tactic.consequence.threat")?.payload).toEqual({
      kind: "abstained", reason: "pass_while_in_check", conventionId: "threat@1", threats: [],
    });
  });

  it("refuses an illegal candidate identity rather than inventing a scored row", () => {
    const receipt = packet(START, CANDIDATE_READINGS_SCOPE);
    expect(() => candidatePlayedRow(receipt, "e2e5")).toThrow();
  });

  it("does not claim bot adoption or calibration from source availability", () => {
    expect(BOT_POLICY_PROFILES).toEqual([]);
  });
});
