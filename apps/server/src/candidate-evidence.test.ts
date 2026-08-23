import { describe, expect, it } from "vitest";

import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
} from "@chess-tabiya/runtime";

import { candidateFeatureVector } from "./candidate-evidence.js";
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
});
