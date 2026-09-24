// D3103: one production Explorer abstention-reason tuple, a complete-arm parser and the catalogue join.
import { describe, expect, it } from "vitest";

import {
  CORPUS_RESULT_ABSTENTION_REASONS,
  PRIMARY_EVIDENCE_MANIFEST,
  parseCorpusResultAbstention,
  type CorpusResult,
} from "./index.js";

const population = Object.freeze({ source: "lichess-explorer", ratings: [1600, 1800], speeds: ["blitz", "rapid"], since: "2023-10", until: "2026-09" });
const complete = Object.freeze({ kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100", population });

describe("D3103 Explorer abstention reason authority", () => {
  it("exports one frozen reason tuple", () => {
    expect(CORPUS_RESULT_ABSTENTION_REASONS).toEqual(["no_data_at_band", "source_unavailable"]);
    expect(Object.isFrozen(CORPUS_RESULT_ABSTENTION_REASONS)).toBe(true);
  });

  it("refuses the fragment {kind, reason} that the author model accepted", () => {
    expect(() => parseCorpusResultAbstention({ kind: "abstention", reason: "no_data_at_band" })).toThrow(TypeError);
    expect(() => parseCorpusResultAbstention({ kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100" })).toThrow(TypeError);
    expect(() => parseCorpusResultAbstention({ kind: "abstention", reason: "no_data_at_band", population })).toThrow(TypeError);
  });

  it("parses the complete abstention arm for every exported reason", () => {
    for (const reason of CORPUS_RESULT_ABSTENTION_REASONS) {
      const parsed: CorpusResult = parseCorpusResultAbstention({ ...complete, reason });
      expect(parsed).toEqual({ ...complete, reason });
      expect(Object.isFrozen(parsed)).toBe(true);
    }
  });

  it("refuses unknown reasons, extra keys, empty detail and incomplete populations", () => {
    expect(() => parseCorpusResultAbstention({ ...complete, reason: "empty_population" })).toThrow(/reason/u);
    expect(() => parseCorpusResultAbstention({ ...complete, kind: "stats" })).toThrow(TypeError);
    expect(() => parseCorpusResultAbstention({ ...complete, extra: true })).toThrow(/exactly the keys/u);
    expect(() => parseCorpusResultAbstention({ ...complete, detail: " " })).toThrow(/detail/u);
    expect(() => parseCorpusResultAbstention({ ...complete, population: { ...population, until: undefined } })).toThrow(TypeError);
    const { since: _since, ...withoutSince } = population;
    expect(() => parseCorpusResultAbstention({ ...complete, population: withoutSince })).toThrow(/exactly the keys/u);
    expect(() => parseCorpusResultAbstention({ ...complete, population: { ...population, ratings: [] } })).toThrow(/ratings/u);
    expect(() => parseCorpusResultAbstention({ ...complete, population: { ...population, since: "2027-01" } })).toThrow(/reversed/u);
    expect(() => parseCorpusResultAbstention({ ...complete, population: { ...population, source: "chess.com" } })).toThrow(/source/u);
  });

  it("joins the catalogue: both Explorer projections abstain with exactly the exported tuple", () => {
    for (const id of ["human.explorer.population", "human.explorer.position_stats"]) {
      const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find((entry) => entry.id === id && entry.version === 1);
      expect(projection, id).toBeDefined();
      expect(projection!.abstention.possible).toBe(true);
      expect([...projection!.abstention.reasons].sort()).toEqual([...CORPUS_RESULT_ABSTENTION_REASONS].sort());
      expect(projection!.abstention.reasons).not.toContain("empty_population");
    }
  });
});
