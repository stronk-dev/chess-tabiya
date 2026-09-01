import { describe, expect, it } from "vitest";

import { collapses, legalCount, measure, type PathPosition } from "./measure.js";

describe("option-collapse measurement semantics", () => {
  it("uses the shipped inclusive 8 to 3 to 3 convention", () => {
    const span = {
      prior: { id: "prior", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
      first: { id: "first", fen: "7k/8/8/8/8/5q2/7P/7K w - - 0 1" },
      second: { id: "second", fen: "7k/8/8/8/8/5q2/7P/7K w - - 0 1" },
    } satisfies { prior: PathPosition; first: PathPosition; second: PathPosition };
    expect(legalCount(span.prior.fen, 4)).toBeGreaterThanOrEqual(8);
    expect(legalCount(span.first.fen, 4)).toBeLessThanOrEqual(3);
    expect(collapses(span)).toBe(true);
  });

  it("distinguishes four promotion roles from one move destination", () => {
    const fen = "8/P7/8/8/8/8/7K/k7 w - - 0 1";
    expect(legalCount(fen, 4) - legalCount(fen, 1)).toBe(3);
  });

  it("measures both fixed populations and writes the committed result", () => {
    const output = new URL("../../planning/live-marker-quality/d53-option-collapse-results.json", import.meta.url).pathname;
    const result = measure(output);
    expect(result.schema).toBe("tabiya.research.option-collapse.v1");
  }, 3_600_000);
});
