import { describe, expect, it } from "vitest";

import { storyCardDocument } from "./story-card.js";

const moment = (nodeId: string, sentences: readonly string[], sourceLabels: readonly string[]) => ({
  nodeId, fen: "8/8/8/8/8/8/8/K6k w - - 0 1", heading: "Evaluation shift", moveLabel: "Move 4 · Nf3", sentences, sourceLabels,
});

describe("review card", () => {
  it("keeps every sentence of every selected moment and computes its footer from the admitted sources", () => {
    const card = storyCardDocument("A & B", [
      moment("m1", ["First grounded fact.", "Second <grounded> fact."], ["Recorded engine analysis"]),
      moment("m2", ["Third fact."], ["Recorded game", "Recorded engine analysis"]),
    ]);
    expect(card.svg).toContain("A &amp; B");
    expect(card.svg).toContain("First grounded fact.");
    expect(card.svg).toContain("Second &lt;grounded&gt; fact.");
    expect(card.svg).toContain("Third fact.");
    expect(card.svg).toContain("Sources: Recorded engine analysis · Recorded game · Tabiya");
    expect(card.momentIds).toEqual(["m1", "m2"]);
    expect([...card.svg.matchAll(/data-moment-id="([^"]+)"/gu)].map((match) => match[1])).toEqual(["m1", "m2"]);
  });

  it("[criterion 10] names no fixed provenance: a rules-only moment is not stamped as engine evidence", () => {
    const card = storyCardDocument("Rules", [moment("m1", ["Board-terminal result for the learner: win."], ["Board rules"])]);
    expect(card.svg).toContain("Sources: Board rules · Tabiya");
    expect(card.svg).not.toMatch(/engine/iu);
    expect(storyCardDocument("None", []).svg).toContain("No moment was selected for this game.");
  });

  it("grows instead of clipping a long evidence packet", () => {
    const card = storyCardDocument("Long card", [moment("m1", ["grounded evidence ".repeat(80)], [])]);
    expect(card.height).toBeGreaterThan(560);
    expect(card.svg).toContain(`height="${card.height}"`);
  });
});
