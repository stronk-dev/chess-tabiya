import { describe, expect, it } from "vitest";

import { declareRunRecordEvidence, declareStoryDerivedEvidence } from "@chess-tabiya/runtime";
import { storyCardDocument } from "./story-card.js";

describe("grounded story card", () => {
  it("keeps every sentence and derives multi-source provenance", () => {
    const card = storyCardDocument("A & B", {
      fen: "8/8/8/8/8/8/8/8 w - - 0 1",
      sentences: ["First grounded fact.", "Second <grounded> fact."],
      evidence: [
        declareStoryDerivedEvidence("eval_shift", { before: {}, after: {}, delta: 1 }),
        declareRunRecordEvidence("imported_result", { context: "story", result: "0-1" }),
      ],
    });
    expect(card.svg).toContain("A &amp; B");
    expect(card.svg).toContain("First grounded fact.");
    expect(card.svg).toContain("Second &lt;grounded&gt; fact.");
    expect(card.svg).toContain("Sources: Recorded engine analysis · Recorded game · Tabiya");
    expect(card.svg).not.toContain("rendered from recorded engine evidence");
  });

  it("grows instead of clipping a long evidence packet", () => {
    const card = storyCardDocument("Long card", {
      fen: "8/8/8/8/8/8/8/8 w - - 0 1",
      sentences: ["grounded evidence ".repeat(80)],
      evidence: [],
    });
    expect(card.height).toBeGreaterThan(560);
    expect(card.svg).toContain(`height="${card.height}"`);
  });
});
