import { describe, expect, it } from "vitest";

import type { DeclaredEvidence } from "@chess-tabiya/runtime";
import { storyCardDocument } from "./story-card.js";

describe("grounded story card", () => {
  it("keeps every sentence and derives multi-source provenance", () => {
    const card = storyCardDocument("A & B", {
      fen: "8/8/8/8/8/8/8/8 w - - 0 1",
      sentences: ["First grounded fact.", "Second <grounded> fact."],
      evidence: [
        // Provenance labels read only the declared projection identity; the card never admits evidence.
        { producer: { id: "derived.story", version: 1 }, projection: { id: "derived.story.eval_shift", version: 1 }, payload: { before: {}, after: {}, delta: 1 } } as unknown as DeclaredEvidence<unknown>,
        { producer: { id: "run.record", version: 1 }, projection: { id: "run.record.imported_result", version: 1 }, payload: { context: "story", result: "0-1" } } as unknown as DeclaredEvidence<unknown>,
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
