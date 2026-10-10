import { describe, expect, it } from "vitest";

import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  CANDIDATE_READINGS_SCOPE,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  candidatePlayedRow,
  compileCandidatePopulation,
  trappedPieceReading,
} from "@chess-tabiya/runtime";

import { BOT_POLICY_PROFILES } from "./bot-policy-catalog.js";
import { CANDIDATE_COLLECTOR_IDS, candidateFeatureVector } from "./candidate-evidence.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ENGINE = Object.freeze({
  id: "stockfish-play",
  name: "Stockfish",
  version: "17",
  seedHonored: true,
  searchBound: Object.freeze({ kind: "nodes" as const, value: 25_000 }),
});

describe("candidate evidence adapter", () => {
  it("features every legal candidate with registered child readings and edge events", () => {
    const vector = candidateFeatureVector({
      beforeFen: START,
      engine: ENGINE,
      candidates: [
        { moveUci: "g1f3", scoreCp: 31 },
        { moveUci: "e2e4", scoreCp: 27 },
      ],
    });

    expect(vector.scoreFrame).toBe("root_side");
    expect(vector.engine.searchBound).toEqual({ kind: "nodes", value: 25_000 });
    expect(vector.candidates.map((row) => [row.moveUci, row.scoreCp])).toEqual([["g1f3", 31], ["e2e4", 27]]);
    expect(new Set(vector.candidates.map((row) => row.afterFen))).toHaveLength(2);

    const allowed = new Set<string>([...TACTICAL_COLLECTOR_PROJECTION_IDS, ...BREADTH_COLLECTOR_PROJECTION_IDS]);
    for (const row of vector.candidates) {
      expect(row.results.length).toBeGreaterThan(15);
      expect(row.results.every((result) => result.source.version === 1 && allowed.has(result.source.id))).toBe(true);
      expect(row.results.map((result) => result.source.id)).toEqual(expect.arrayContaining([
        "rules.mobility.reading.piece_destinations",
        "rules.king.reading.zone_state",
        "rules.tactic.reading.loose_piece",
        "rules.tactic.consequence.reply_breadth",
      ]));
      // D3642: the real opponent consumer receives both pieces' clearance
      // blockers, not merely a new Inspector caption or a refreshed snapshot.
      expect(row.results.filter(result => result.source.id === "rules.castling.reading.legality").map(result => result.payload)).toEqual(expect.arrayContaining([
        expect.objectContaining({ color: "white", wing: "queenside", blockedSquares: ["d1", "c1", "b1"] }),
        expect.objectContaining({ color: "black", wing: "queenside", blockedSquares: ["d8", "c8", "b8"] }),
      ]));
    }
    expect(vector.candidates[0]!.results.some((result) => result.source.id === "rules.transition.event.developed")).toBe(true);
    expect(JSON.stringify(vector)).not.toMatch(/sentence|personality|move_quality|learner/u);
  });

  it("is admitted only to the opponent selector and retains its literal dependencies", () => {
    const projection = EVIDENCE_MANIFEST.projections.find((item) => item.id === "derived.opponent.candidate_feature_vector")!;
    expect(projection.dependsOn).toEqual(expect.arrayContaining([
      { id: "live.stockfish.eval", version: 1 },
      { id: "rules.tactic.event.double_attack", version: 1 },
      { id: "rules.mobility.reading.piece_destinations", version: 1 },
    ]));
    expect(EVIDENCE_MANIFEST.bindings.filter((binding) => binding.projection.id === projection.id).map((binding) => binding.consumer.id)).toEqual(["opponent.selection"]);
  });

  it.each([
    { beforeFen: "r7/7k/8/8/8/8/b1n5/R1K5 b A - 0 1", move: "h7h8", rook: "a1" },
    { beforeFen: "r1k5/B1N5/8/8/8/8/7K/R7 w a - 0 1", move: "h2h1", rook: "a8" },
  ])("D3652 retains a castling escape in both the complete candidate packet and actual opponent consumer: $move", value => {
    const packet = compileCandidatePopulation({ beforeFen: value.beforeFen, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE });
    if (packet.kind !== "ready") throw new Error("expected a complete legal packet");
    const played = candidatePlayedRow(packet.receipt, value.move);
    const reading = played.readings.find(item => item.projection.id === "rules.tactic.reading.trapped_piece");
    expect(reading).toBeDefined();
    const population = reading!.payload as { readonly kind: string; readonly pieces: readonly unknown[] };
    expect(population.kind).toBe("pieces");
    expect(population.pieces.length).toBe(0);
    const vector = candidateFeatureVector({ beforeFen: value.beforeFen, engine: ENGINE, candidates: [{ moveUci: value.move, scoreCp: 31 }] });
    const candidate = vector.candidates[0]!;
    const retained = candidate.results.filter(item => item.source.id === "rules.tactic.reading.trapped_piece");
    expect(candidate.moveUci).toBe(value.move);
    expect(candidate.scoreCp).toBe(31);
    expect(candidate.afterFen).toBe(played.afterFen);
    expect(retained).toHaveLength(1);
    expect(retained[0]!.payload).toEqual(reading!.payload);
    // Removing the right is the same legal position with the escape removed,
    // not a no-attacker or irrelevant-side negative.
    const noCastle = candidate.afterFen.replace(/ [Qq] /u, " - ");
    const original = trappedPieceReading(noCastle);
    expect(original).toMatchObject({ kind: "pieces", pieces: expect.arrayContaining([expect.objectContaining({ piece: expect.objectContaining({ square: value.rook }) })]) });
  });

  it("retains the declared empty threat collection when a candidate gives check", () => {
    const vector = candidateFeatureVector({
      beforeFen: "4k3/8/8/8/8/8/Q7/4K3 w - - 0 1",
      engine: ENGINE,
      candidates: [{ moveUci: "a2e6", scoreCp: 100 }],
    });
    const threat = vector.candidates[0]!.results.find((result) => result.source.id === "rules.tactic.consequence.threat");
    expect(threat?.payload).toEqual({
      kind: "abstained",
      reason: "pass_while_in_check",
      conventionId: "threat@1",
      threats: [],
    });
  });

  it("refuses illegal, duplicate, unbounded, empty, and unevaluated candidates", () => {
    const { searchBound: _searchBound, ...unboundedEngine } = ENGINE;
    expect(() => candidateFeatureVector({ beforeFen: START, engine: ENGINE, candidates: [] })).toThrow(/at least one/u);
    expect(() => candidateFeatureVector({ beforeFen: START, engine: ENGINE, candidates: [{ moveUci: "e2e5", scoreCp: 0 }] })).toThrow(/illegal/u);
    expect(() => candidateFeatureVector({ beforeFen: START, engine: ENGINE, candidates: [{ moveUci: "e2e4", scoreCp: 0 }, { moveUci: "e2e4", scoreCp: 1 }] })).toThrow(/duplicated/u);
    expect(() => candidateFeatureVector({ beforeFen: START, engine: unboundedEngine, candidates: [{ moveUci: "e2e4", scoreCp: 0 }] })).toThrow(/fixed engine search bound/u);
    expect(() => candidateFeatureVector({ beforeFen: START, engine: ENGINE, candidates: [{ moveUci: "e2e4", scoreCp: Number.NaN }] })).toThrow(/not finite/u);
  });

  it("closes the Maia leak and reads child readings from the one runtime authority (shared-candidate-evidence-packet §8.2, criterion 9/20)", () => {
    expect(CANDIDATE_COLLECTOR_IDS.has("human.maia.candidate_wdl")).toBe(false);
    expect(TACTICAL_COLLECTOR_PROJECTION_IDS).toContain("human.maia.candidate_wdl");
    const vector = candidateFeatureVector({ beforeFen: START, engine: ENGINE, candidates: [{ moveUci: "g1f3", scoreCp: 31 }] });
    const packet = compileCandidatePopulation({ beforeFen: START, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE });
    if (packet.kind !== "ready") throw new Error("expected packet");
    const row = candidatePlayedRow(packet.receipt, "g1f3");
    const readingIds = new Set(row.readings.map((value) => value.projection.id));
    const vectorReadings = vector.candidates[0]!.results.filter((result) => readingIds.has(result.source.id)).map((result) => `${result.source.id}:${JSON.stringify(result.payload)}`).sort();
    expect(vectorReadings).toEqual(row.readings.map((value) => `${value.projection.id}:${JSON.stringify(value.payload)}`).sort());
  });

  it("the packet foundation claims no bot consumer: the production bot profile roster stays empty (criterion 23)", () => {
    expect(BOT_POLICY_PROFILES).toEqual([]);
  });
});
