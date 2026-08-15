import { describe, expect, it } from "vitest";

import { renderTransitionObservation, renderTransitionSpec } from "./transition-sentences.js";

describe("transition sentences", () => {
  it("states measured geometry without grading the move", () => {
    const sentence = renderTransitionObservation({
      kind: "defended_duties_changed",
      color: "white",
      direction: "acquired",
      count: 1,
      provenanceNote: "Tabiya's geometric transition census; significance is not evaluated.",
    });
    expect(sentence).toBe("white acquired 1 piece crossing the two-defensive-duties threshold. Tabiya's geometric transition census; significance is not evaluated.");
    expect(sentence).not.toMatch(/best|good|bad|mistake|blunder|should/i);
    expect(renderTransitionSpec({
      kind: "escape_squares_changed",
      color: "black",
      direction: "lost",
      comparison: "atLeast",
      count: 2,
    })).toBe("black lost at least 2 geometric destination squares.");
  });
});
